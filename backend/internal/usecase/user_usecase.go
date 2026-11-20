package usecase

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"jelajah-trip-backend/internal/domain"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type userUsecase struct {
	userRepo            domain.UserRepository
	refreshTokenRepo    domain.RefreshTokenRepository
	bookingRepo         domain.BookingRepository
	jwtSecret           string
	jwtExpiresIn        time.Duration
	jwtRefreshSecret    string
	jwtRefreshExpiresIn time.Duration
}

func (u *userUsecase) SetBookingRepo(repo domain.BookingRepository) {
	u.bookingRepo = repo
}

func NewUserUsecase(
	userRepo domain.UserRepository,
	refreshTokenRepo domain.RefreshTokenRepository,
	jwtSecret string,
	jwtExpiresIn time.Duration,
	jwtRefreshSecret string,
	jwtRefreshExpiresIn time.Duration,
) domain.UserUsecase {
	if jwtExpiresIn == 0 {
		jwtExpiresIn = 15 * time.Minute
	}
	if jwtRefreshExpiresIn == 0 {
		jwtRefreshExpiresIn = 7 * 24 * time.Hour
	}
	return &userUsecase{
		userRepo:            userRepo,
		refreshTokenRepo:    refreshTokenRepo,
		jwtSecret:           jwtSecret,
		jwtExpiresIn:        jwtExpiresIn,
		jwtRefreshSecret:    jwtRefreshSecret,
		jwtRefreshExpiresIn: jwtRefreshExpiresIn,
	}
}

func HashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

func (u *userUsecase) Register(ctx context.Context, req domain.RegisterRequest) (*domain.AuthResponse, string, string, error) {
	req.Name = strings.TrimSpace(req.Name)
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))

	if req.Name == "" || req.Email == "" || req.Password == "" {
		return nil, "", "", errors.New("nama, email, dan kata sandi wajib diisi")
	}

	if len(req.Password) < 8 {
		return nil, "", "", errors.New("kata sandi minimal 8 karakter")
	}

	existing, _ := u.userRepo.GetByEmail(ctx, req.Email)
	if existing != nil {
		return nil, "", "", errors.New("email sudah terdaftar, silakan gunakan email lain atau login")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), 12)
	if err != nil {
		return nil, "", "", errors.New("gagal memproses kata sandi")
	}

	user := domain.User{
		ID:           uuid.New(),
		Name:         req.Name,
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
		Role:         domain.RoleCustomer,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	if err := u.userRepo.Create(ctx, &user); err != nil {
		return nil, "", "", errors.New("gagal mendaftarkan akun baru")
	}

	accessToken, err := u.generateAccessToken(&user)
	if err != nil {
		return nil, "", "", errors.New("gagal menghasilkan access token")
	}

	refreshToken, err := u.generateRefreshToken(&user)
	if err != nil {
		return nil, "", "", errors.New("gagal menghasilkan refresh token")
	}

	// Simpan hash refresh token di database
	if err := u.saveRefreshToken(ctx, user.ID, refreshToken); err != nil {
		return nil, "", "", errors.New("gagal mencatat sesi refresh token")
	}

	// Hybrid Checkout: Tautkan otomatis pesanan tamu sebelumnya yang menggunakan email ini
	if u.bookingRepo != nil {
		_ = u.bookingRepo.LinkGuestBookings(ctx, user.ID, user.Email)
	}

	return &domain.AuthResponse{
		User: user,
	}, accessToken, refreshToken, nil
}

func (u *userUsecase) Login(ctx context.Context, req domain.LoginRequest) (*domain.AuthResponse, string, string, error) {
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))

	if req.Email == "" || req.Password == "" {
		return nil, "", "", errors.New("email dan kata sandi wajib diisi")
	}

	user, err := u.userRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		return nil, "", "", errors.New("email atau kata sandi tidak sesuai")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, "", "", errors.New("email atau kata sandi tidak sesuai")
	}

	accessToken, err := u.generateAccessToken(user)
	if err != nil {
		return nil, "", "", errors.New("gagal menghasilkan access token")
	}

	refreshToken, err := u.generateRefreshToken(user)
	if err != nil {
		return nil, "", "", errors.New("gagal menghasilkan refresh token")
	}

	// Simpan hash refresh token di database
	if err := u.saveRefreshToken(ctx, user.ID, refreshToken); err != nil {
		return nil, "", "", errors.New("gagal mencatat sesi refresh token")
	}

	// Hybrid Checkout: Tautkan otomatis pesanan tamu sebelumnya yang belum terhubung
	if u.bookingRepo != nil {
		_ = u.bookingRepo.LinkGuestBookings(ctx, user.ID, user.Email)
	}

	return &domain.AuthResponse{
		User: *user,
	}, accessToken, refreshToken, nil
}

func (u *userUsecase) RefreshToken(ctx context.Context, refreshTokenStr string) (*domain.AuthResponse, string, string, error) {
	refreshTokenStr = strings.TrimSpace(refreshTokenStr)
	if refreshTokenStr == "" {
		return nil, "", "", errors.New("refresh token wajib disertakan")
	}

	// 1. Validasi signature & struktur JWT refresh token
	token, err := jwt.Parse(refreshTokenStr, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("metode enkripsi token tidak valid")
		}
		return []byte(u.jwtRefreshSecret), nil
	})

	if err != nil || !token.Valid {
		return nil, "", "", errors.New("refresh token tidak valid atau telah kedaluwarsa")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, "", "", errors.New("klaim token tidak valid")
	}

	tokenType, _ := claims["type"].(string)
	if tokenType != "refresh" {
		return nil, "", "", errors.New("tipe token tidak sesuai")
	}

	subStr, _ := claims["sub"].(string)
	userID, err := uuid.Parse(subStr)
	if err != nil {
		return nil, "", "", errors.New("ID pengguna dalam token tidak valid")
	}

	// 2. Periksa hash di database (Aturan Fase 1.5: Tolak token yang sudah dipakai/revoked)
	tokenHash := HashToken(refreshTokenStr)
	dbToken, err := u.refreshTokenRepo.GetByTokenHash(ctx, tokenHash)
	if err != nil {
		return nil, "", "", errors.New("refresh token tidak dikenali atau tidak valid")
	}

	if dbToken.RevokedAt != nil {
		// Reuse Detection (RFC 6749 Threat Model):
		// Jika token yang sudah dicabut digunakan kembali, terindikasi token theft/replay attack.
		// Cabut SEMUA sesi refresh token milik pengguna ini demi keamanan.
		_ = u.refreshTokenRepo.RevokeByUserID(ctx, dbToken.UserID)
		return nil, "", "", errors.New("terdeteksi penggunaan ulang refresh token yang telah dicabut; seluruh sesi pengguna telah dibatalkan")
	}

	if dbToken.ExpiresAt.Before(time.Now()) {
		return nil, "", "", errors.New("refresh token telah kedaluwarsa")
	}

	// 3. Rotasi Token: Revoke token saat ini
	if err := u.refreshTokenRepo.Revoke(ctx, dbToken.ID); err != nil {
		return nil, "", "", errors.New("gagal memproses rotasi token")
	}

	user, err := u.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, "", "", errors.New("pengguna tidak ditemukan")
	}

	// 4. Terbitkan access token baru & refresh token baru (rotasi)
	newAccessToken, err := u.generateAccessToken(user)
	if err != nil {
		return nil, "", "", errors.New("gagal memperbarui access token")
	}

	newRefreshToken, err := u.generateRefreshToken(user)
	if err != nil {
		return nil, "", "", errors.New("gagal menghasilkan refresh token baru")
	}

	// Simpan hash refresh token yang baru ke database
	if err := u.saveRefreshToken(ctx, user.ID, newRefreshToken); err != nil {
		return nil, "", "", errors.New("gagal mencatat sesi refresh token baru")
	}

	return &domain.AuthResponse{
		User: *user,
	}, newAccessToken, newRefreshToken, nil
}

func (u *userUsecase) Logout(ctx context.Context, refreshTokenStr string) error {
	refreshTokenStr = strings.TrimSpace(refreshTokenStr)
	if refreshTokenStr != "" {
		tokenHash := HashToken(refreshTokenStr)
		dbToken, err := u.refreshTokenRepo.GetByTokenHash(ctx, tokenHash)
		if err == nil && dbToken != nil && dbToken.RevokedAt == nil {
			_ = u.refreshTokenRepo.Revoke(ctx, dbToken.ID)
		}
	}
	return nil
}

func (u *userUsecase) GetProfile(ctx context.Context, userID uuid.UUID) (*domain.User, error) {
	return u.userRepo.GetByID(ctx, userID)
}

func (u *userUsecase) saveRefreshToken(ctx context.Context, userID uuid.UUID, tokenStr string) error {
	tokenHash := HashToken(tokenStr)
	rt := domain.RefreshToken{
		ID:        uuid.New(),
		UserID:    userID,
		TokenHash: tokenHash,
		ExpiresAt: time.Now().Add(u.jwtRefreshExpiresIn),
		CreatedAt: time.Now(),
	}
	return u.refreshTokenRepo.Create(ctx, &rt)
}

func (u *userUsecase) generateAccessToken(user *domain.User) (string, error) {
	claims := jwt.MapClaims{
		"sub":   user.ID.String(),
		"name":  user.Name,
		"email": user.Email,
		"role":  string(user.Role),
		"type":  "access",
		"exp":   time.Now().Add(u.jwtExpiresIn).Unix(),
		"iat":   time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(u.jwtSecret))
}

func (u *userUsecase) generateRefreshToken(user *domain.User) (string, error) {
	// Menambahkan token ID unik di claim refresh agar setiap generasi token memiliki entropy berbeda
	claims := jwt.MapClaims{
		"sub":   user.ID.String(),
		"jti":   uuid.New().String(),
		"email": user.Email,
		"type":  "refresh",
		"exp":   time.Now().Add(u.jwtRefreshExpiresIn).Unix(),
		"iat":   time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(u.jwtRefreshSecret))
}
