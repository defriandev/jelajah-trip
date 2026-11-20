package test

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"jelajah-trip-backend/internal/config"
	deliveryHttp "jelajah-trip-backend/internal/delivery/http"
	"jelajah-trip-backend/internal/domain"
	"jelajah-trip-backend/internal/repository"
	"jelajah-trip-backend/internal/usecase"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func setupTestApp(t *testing.T, db *gorm.DB) (*fiber.App, *config.Config, domain.BookingRepository, domain.TripRepository) {
	cfg := &config.Config{
		AppEnv:              "test",
		Port:                "8080",
		JWTSecret:           "test_jwt_secret_key_minimum_32_characters_long",
		JWTExpiresIn:        15 * time.Minute,
		JWTRefreshSecret:    "test_jwt_refresh_secret_minimum_32_characters_long",
		JWTRefreshExpiresIn: 7 * 24 * time.Hour,
		CORSAllowedOrigins:  []string{"http://localhost:5173"},
		ProxyHeader:         "X-Forwarded-For",
		TrustedProxies:      []string{"127.0.0.1"},
	}

	userRepo := repository.NewUserRepository(db)
	tripRepo := repository.NewTripRepository(db)
	bookingRepo := repository.NewBookingRepository(db)
	reviewRepo := repository.NewReviewRepository(db)
	faqRepo := repository.NewFAQRepository(db)
	refreshTokenRepo := repository.NewRefreshTokenRepository(db)

	userUsecase := usecase.NewUserUsecase(userRepo, refreshTokenRepo, cfg.JWTSecret, cfg.JWTExpiresIn, cfg.JWTRefreshSecret, cfg.JWTRefreshExpiresIn)
	tripUsecase := usecase.NewTripUsecase(tripRepo)
	bookingUsecase := usecase.NewBookingUsecase(bookingRepo, tripRepo)
	reviewUsecase := usecase.NewReviewUsecase(reviewRepo, tripRepo, bookingRepo)
	faqUsecase := usecase.NewFAQUsecase(faqRepo)

	handler := deliveryHttp.NewHandler(userUsecase, tripUsecase, bookingUsecase, reviewUsecase, faqUsecase, cfg)
	sqlDB, _ := db.DB()
	handler.SetDB(sqlDB)

	app := fiber.New(fiber.Config{
		AppName:      "Jelajah Trip Test App",
		ProxyHeader:  cfg.ProxyHeader,
		ErrorHandler: deliveryHttp.GlobalErrorHandler,
	})

	deliveryHttp.SetupRoutes(app, handler, cfg.JWTSecret)

	return app, cfg, bookingRepo, tripRepo
}

// =========================================================================
// 1. TEST HTTP: 429 Rate Limit (Percobaan Gagal per booking_code)
// =========================================================================
func TestHTTPRateLimit429BookingCode(t *testing.T) {
	db := setupTestDB(t)
	app, _, _, _ := setupTestApp(t, db)

	targetCode := fmt.Sprintf("TRIP-20261119-RLTEST%s", strings.ToUpper(uuid.New().String()[:4]))

	// Lakukan 5 percobaan verifikasi salah berturut-turut untuk targetCode
	for i := 1; i <= 5; i++ {
		req := httptest.NewRequest("GET", fmt.Sprintf("/api/v1/bookings/track?code=%s&verification=wrong%d@email.com", targetCode, i), nil)
		resp, err := app.Test(req, -1)
		if err != nil {
			t.Fatalf("Request %d gagal: %v", i, err)
		}
		if resp.StatusCode != http.StatusNotFound {
			t.Fatalf("Percobaan %d seharusnya 404, didapatkan: %d", i, resp.StatusCode)
		}
	}

	// Percobaan ke-6 wajib diblokir dengan HTTP 429 Too Many Requests
	req6 := httptest.NewRequest("GET", fmt.Sprintf("/api/v1/bookings/track?code=%s&verification=wrong6@email.com", targetCode), nil)
	resp6, err := app.Test(req6, -1)
	if err != nil {
		t.Fatalf("Request ke-6 gagal: %v", err)
	}

	if resp6.StatusCode != http.StatusTooManyRequests {
		t.Fatalf("Percobaan ke-6 seharusnya diblokir HTTP 429, namun didapatkan: %d", resp6.StatusCode)
	}

	bodyBytes, _ := io.ReadAll(resp6.Body)
	bodyStr := string(bodyBytes)
	t.Logf("Response 429 Rate Limit per booking code: %s", bodyStr)

	if !strings.Contains(bodyStr, "Terlalu banyak percobaan gagal untuk kode booking ini") {
		t.Fatalf("Pesan 429 tidak sesuai: %s", bodyStr)
	}
}

// =========================================================================
// 2. TEST HTTP: Error Tracking Generik (Kode Salah vs Email Salah Identik)
// =========================================================================
func TestHTTPGenericTrackingErrorIdenticalBody(t *testing.T) {
	db := setupTestDB(t)
	app, _, _, tripRepo := setupTestApp(t, db)
	ctx := context.Background()

	// Buat trip & booking valid
	testTrip := domain.Trip{
		ID:          uuid.New(),
		Title:       "Trip Uji Error Identik",
		Destination: "Labuan Bajo",
		Description: "Paket uji respons error generik",
		Price:       1000000,
		Duration:    "3D2N",
		Quota:       10,
		ImageURL:    "https://images.unsplash.com/photo-error-test",
	}
	_ = tripRepo.Create(ctx, &testTrip)
	defer func() {
		db.Exec("DELETE FROM bookings WHERE trip_id = ?", testTrip.ID)
		db.Exec("DELETE FROM trips WHERE id = ?", testTrip.ID)
	}()

	validCode := fmt.Sprintf("TRIP-20261119-IDN%s", strings.ToUpper(uuid.New().String()[:5]))
	realBooking := domain.Booking{
		ID:            uuid.New(),
		BookingCode:   validCode,
		TripID:        testTrip.ID,
		CustomerName:  "Indra Kusuma",
		CustomerEmail: "indra.kusuma@jelajah.com",
		CustomerPhone: "081234567890",
		TravelDate:    "2026-12-25",
		Pax:           1,
		TotalPrice:    1000000,
		Status:        domain.StatusPending,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}
	db.Create(&realBooking)

	// Kasus A: Kode booking SALAH, email apa saja
	reqA := httptest.NewRequest("GET", "/api/v1/bookings/track?code=TRIP-FAKE-99999999&verification=indra.kusuma@jelajah.com", nil)
	respA, _ := app.Test(reqA, -1)
	bodyBytesA, _ := io.ReadAll(respA.Body)

	// Kasus B: Kode booking BENAR, email SALAH
	reqB := httptest.NewRequest("GET", fmt.Sprintf("/api/v1/bookings/track?code=%s&verification=wrong.email@jelajah.com", validCode), nil)
	respB, _ := app.Test(reqB, -1)
	bodyBytesB, _ := io.ReadAll(respB.Body)

	// Kasus C: Kode booking BENAR, 4 digit nomor HP SALAH
	reqC := httptest.NewRequest("GET", fmt.Sprintf("/api/v1/bookings/track?code=%s&verification=0000", validCode), nil)
	respC, _ := app.Test(reqC, -1)
	bodyBytesC, _ := io.ReadAll(respC.Body)

	t.Logf("Response Body A (Kode Salah): %s", string(bodyBytesA))
	t.Logf("Response Body B (Email Salah): %s", string(bodyBytesB))
	t.Logf("Response Body C (Telepon Salah): %s", string(bodyBytesC))

	// Verifikasi: Seluruh status HTTP adalah 404
	if respA.StatusCode != 404 || respB.StatusCode != 404 || respC.StatusCode != 404 {
		t.Fatalf("Ekspektasi HTTP 404 untuk semua kasus error tracking, didapatkan: A=%d, B=%d, C=%d",
			respA.StatusCode, respB.StatusCode, respC.StatusCode)
	}

	// Verifikasi: Seluruh body JSON identik byte-for-byte
	if !bytes.Equal(bodyBytesA, bodyBytesB) {
		t.Fatalf("Body respons A (kode salah) dan B (email salah) TIDAK identik:\nA: %s\nB: %s", bodyBytesA, bodyBytesB)
	}
	if !bytes.Equal(bodyBytesB, bodyBytesC) {
		t.Fatalf("Body respons B (email salah) dan C (telepon salah) TIDAK identik:\nB: %s\nC: %s", bodyBytesB, bodyBytesC)
	}

	var parsedResp struct {
		Success bool `json:"success"`
		Error   struct {
			Code    string `json:"code"`
			Message string `json:"message"`
		} `json:"error"`
	}
	_ = json.Unmarshal(bodyBytesA, &parsedResp)
	if parsedResp.Error.Code != "TRACKING_NOT_FOUND" || parsedResp.Error.Message != "Pesanan tidak ditemukan atau data verifikasi tidak cocok" {
		t.Fatalf("Pesan generic error tidak sesuai: %+v", parsedResp.Error)
	}
}

// =========================================================================
// 3. TEST HTTP: Validator Nomor Telepon & Tanggal (Asia/Jakarta)
// =========================================================================
func TestHTTPPhoneAndDateValidation(t *testing.T) {
	db := setupTestDB(t)
	app, _, _, tripRepo := setupTestApp(t, db)
	ctx := context.Background()

	testTrip := domain.Trip{
		ID:          uuid.New(),
		Title:       "Trip Uji Validator",
		Destination: "Bromo",
		Description: "Paket uji validasi",
		Price:       500000,
		Duration:    "2D1N",
		Quota:       20,
		ImageURL:    "https://images.unsplash.com/photo-val",
	}
	_ = tripRepo.Create(ctx, &testTrip)
	defer func() {
		db.Exec("DELETE FROM bookings WHERE trip_id = ?", testTrip.ID)
		db.Exec("DELETE FROM trips WHERE id = ?", testTrip.ID)
	}()

	loc, _ := time.LoadLocation("Asia/Jakarta")
	nowJakarta := time.Now().In(loc)
	yesterdayJakarta := nowJakarta.AddDate(0, 0, -1).Format("2006-01-02")
	tomorrowJakarta := nowJakarta.AddDate(0, 0, 1).Format("2006-01-02")

	// 1. Uji Tanggal Masa Lalu di Asia/Jakarta -> Wajib Ditolak 400
	reqPastDate := domain.CreateBookingRequest{
		TripID:        testTrip.ID.String(),
		CustomerName:  "Budi Tester",
		CustomerEmail: "budi.tester@jelajah.com",
		CustomerPhone: "081234567890",
		TravelDate:    yesterdayJakarta,
		Pax:           1,
	}
	pastJSON, _ := json.Marshal(reqPastDate)
	r1 := httptest.NewRequest("POST", "/api/v1/bookings", bytes.NewReader(pastJSON))
	r1.Header.Set("Content-Type", "application/json")
	resp1, _ := app.Test(r1, -1)
	if resp1.StatusCode != http.StatusBadRequest {
		t.Fatalf("Booking dengan tanggal kemarin (%s di Asia/Jakarta) seharusnya ditolak 400, didapatkan: %d", yesterdayJakarta, resp1.StatusCode)
	}
	b1, _ := io.ReadAll(resp1.Body)
	t.Logf("Validasi tanggal masa lalu (Asia/Jakarta) berhasil ditolak: %s", string(b1))

	// 2. Uji Nomor Telepon Tidak Valid -> Wajib Ditolak 400
	invalidPhones := []string{"0211234567", "12345", "+1800123456", "081"}
	for _, ip := range invalidPhones {
		reqInvPhone := domain.CreateBookingRequest{
			TripID:        testTrip.ID.String(),
			CustomerName:  "Budi Tester",
			CustomerEmail: "budi.tester@jelajah.com",
			CustomerPhone: ip,
			TravelDate:    tomorrowJakarta,
			Pax:           1,
		}
		invJSON, _ := json.Marshal(reqInvPhone)
		r := httptest.NewRequest("POST", "/api/v1/bookings", bytes.NewReader(invJSON))
		r.Header.Set("Content-Type", "application/json")
		resp, _ := app.Test(r, -1)
		if resp.StatusCode != http.StatusBadRequest {
			t.Fatalf("Nomor telepon tidak valid '%s' seharusnya ditolak 400, didapatkan: %d", ip, resp.StatusCode)
		}
	}
	t.Logf("Validasi nomor telepon non-Indonesia berhasil ditolak.")

	// 3. Uji Nomor Telepon & Tanggal Valid di Asia/Jakarta -> Sukses 201 Created
	reqValid := domain.CreateBookingRequest{
		TripID:        testTrip.ID.String(),
		CustomerName:  "Budi Santoso",
		CustomerEmail: "budi.santoso@jelajah.com",
		CustomerPhone: "+6281234567890",
		TravelDate:    tomorrowJakarta,
		Pax:           1,
	}
	validJSON, _ := json.Marshal(reqValid)
	rValid := httptest.NewRequest("POST", "/api/v1/bookings", bytes.NewReader(validJSON))
	rValid.Header.Set("Content-Type", "application/json")
	respValid, _ := app.Test(rValid, -1)
	if respValid.StatusCode != http.StatusCreated {
		b, _ := io.ReadAll(respValid.Body)
		t.Fatalf("Pemesanan valid seharusnya 201, didapatkan %d: %s", respValid.StatusCode, string(b))
	}
	t.Logf("Pemesanan dengan nomor Indonesia & tanggal valid Asia/Jakarta berhasil dibuat.")
}

// =========================================================================
// 4. TEST HTTP: Refresh Token Rotasi & Revokasi (httpOnly & Path=/api/v1/auth)
// =========================================================================
func TestHTTPRefreshTokenRotationAndRevocation(t *testing.T) {
	db := setupTestDB(t)
	app, _, _, _ := setupTestApp(t, db)

	email := fmt.Sprintf("jwt_%s@jelajah.com", uuid.New().String()[:8])
	password := "Password123!"

	// 1. Registrasi Akun Baru
	regBody, _ := json.Marshal(domain.RegisterRequest{
		Name:     "JWT Tester",
		Email:    email,
		Password: password,
	})
	rReg := httptest.NewRequest("POST", "/api/v1/auth/register", bytes.NewReader(regBody))
	rReg.Header.Set("Content-Type", "application/json")
	respReg, err := app.Test(rReg, -1)
	if err != nil || respReg.StatusCode != http.StatusCreated {
		t.Fatalf("Registrasi gagal: %v, status: %d", err, respReg.StatusCode)
	}

	// Verifikasi: Token TIDAK ADA di JSON body (Aturan Fase 1.5)
	bReg, _ := io.ReadAll(respReg.Body)
	var regJSON map[string]interface{}
	_ = json.Unmarshal(bReg, &regJSON)
	dataMap, _ := regJSON["data"].(map[string]interface{})
	if _, hasToken := dataMap["token"]; hasToken {
		t.Fatalf("Token access TIDAK boleh ada di JSON body!")
	}
	if _, hasRefresh := dataMap["refresh_token"]; hasRefresh {
		t.Fatalf("Token refresh TIDAK boleh ada di JSON body!")
	}

	// Ekstrak cookies dari header Set-Cookie
	cookies := respReg.Header.Values("Set-Cookie")
	var accessCookie, refreshCookie string
	for _, c := range cookies {
		if strings.HasPrefix(c, "access_token=") {
			accessCookie = c
		}
		if strings.HasPrefix(c, "refresh_token=") {
			refreshCookie = c
		}
	}

	if accessCookie == "" || refreshCookie == "" {
		t.Fatalf("Access cookie atau refresh cookie tidak disetel di Set-Cookie!")
	}

	// Verifikasi Path Cookie RefreshToken harus /api/v1/auth
	if !strings.Contains(strings.ToLower(refreshCookie), "path=/api/v1/auth") {
		t.Fatalf("Path cookie refresh_token harus dibatasi ke '/api/v1/auth', didapatkan: %s", refreshCookie)
	}
	t.Logf("Set-Cookie refresh_token valid dengan Path=/api/v1/auth: %s", refreshCookie)

	// Ekstrak nilai murni token untuk request berikutnya
	extractCookieVal := func(header string) string {
		parts := strings.Split(header, ";")
		kv := strings.Split(parts[0], "=")
		return kv[1]
	}

	refreshVal1 := extractCookieVal(refreshCookie)

	// 2. Eksekusi Rotasi Token di /api/v1/auth/refresh
	rRefresh := httptest.NewRequest("POST", "/api/v1/auth/refresh", nil)
	rRefresh.AddCookie(&http.Cookie{Name: "refresh_token", Value: refreshVal1})
	respRefresh, err := app.Test(rRefresh, -1)
	if err != nil || respRefresh.StatusCode != http.StatusOK {
		t.Fatalf("Refresh token rotasi gagal, status: %d", respRefresh.StatusCode)
	}

	// Ambil refresh token yang baru hasil rotasi
	newCookies := respRefresh.Header.Values("Set-Cookie")
	var newRefreshCookie string
	for _, c := range newCookies {
		if strings.HasPrefix(c, "refresh_token=") {
			newRefreshCookie = c
		}
	}
	refreshVal2 := extractCookieVal(newRefreshCookie)

	if refreshVal1 == refreshVal2 {
		t.Fatalf("Token refresh seharusnya dirotasi menghasilkan token baru, tetapi nilainya sama persis")
	}
	t.Logf("Rotasi refresh token berhasil menghasilkan token baru.")

	// 3. Uji Replay Token Lama (Token yang sudah dipakai wajib DITOLAK 401)
	rReplay := httptest.NewRequest("POST", "/api/v1/auth/refresh", nil)
	rReplay.AddCookie(&http.Cookie{Name: "refresh_token", Value: refreshVal1})
	respReplay, _ := app.Test(rReplay, -1)
	if respReplay.StatusCode != http.StatusUnauthorized {
		t.Fatalf("Replay token lama yang sudah dirotasi seharusnya ditolak 401, didapatkan: %d", respReplay.StatusCode)
	}
	t.Logf("Percobaan menggunakan kembali refresh token lama berhasil ditolak 401.")

	// 4. Uji Logout & Revokasi
	rLogout := httptest.NewRequest("POST", "/api/v1/auth/logout", nil)
	rLogout.AddCookie(&http.Cookie{Name: "refresh_token", Value: refreshVal2})
	respLogout, _ := app.Test(rLogout, -1)
	if respLogout.StatusCode != http.StatusOK {
		t.Fatalf("Logout gagal, didapatkan: %d", respLogout.StatusCode)
	}

	// 5. Coba gunakan token yang sudah di-revoke saat logout -> Wajib Ditolak 401
	rRevoked := httptest.NewRequest("POST", "/api/v1/auth/refresh", nil)
	rRevoked.AddCookie(&http.Cookie{Name: "refresh_token", Value: refreshVal2})
	respRevoked, _ := app.Test(rRevoked, -1)
	if respRevoked.StatusCode != http.StatusUnauthorized {
		t.Fatalf("Refresh token yang telah di-revoke lewat logout seharusnya ditolak 401, didapatkan: %d", respRevoked.StatusCode)
	}
	t.Logf("Refresh token yang telah di-revoke berhasil ditolak 401.")
}

// =========================================================================
// 4b. TEST HTTP: Refresh Token Reuse Detection (Revoke Semua Sesi User)
// =========================================================================
func TestHTTPRefreshTokenReuseDetectionRevokesAllTokens(t *testing.T) {
	db := setupTestDB(t)
	app, _, _, _ := setupTestApp(t, db)

	email := fmt.Sprintf("reuse_%s@jelajah.com", uuid.New().String()[:8])
	password := "Password123!"

	// 1. Registrasi Akun Baru -> Dapatkan Token A
	regBody, _ := json.Marshal(domain.RegisterRequest{
		Name:     "Reuse Tester",
		Email:    email,
		Password: password,
	})
	rReg := httptest.NewRequest("POST", "/api/v1/auth/register", bytes.NewReader(regBody))
	rReg.Header.Set("Content-Type", "application/json")
	respReg, err := app.Test(rReg, -1)
	if err != nil || respReg.StatusCode != http.StatusCreated {
		t.Fatalf("Registrasi gagal: %v, status: %d", err, respReg.StatusCode)
	}

	extractCookieVal := func(header string) string {
		parts := strings.Split(header, ";")
		kv := strings.Split(parts[0], "=")
		return kv[1]
	}

	var tokenA string
	for _, c := range respReg.Header.Values("Set-Cookie") {
		if strings.HasPrefix(c, "refresh_token=") {
			tokenA = extractCookieVal(c)
		}
	}
	if tokenA == "" {
		t.Fatalf("Gagal mendapatkan refresh token A dari register")
	}

	// 2. Rotasi Pertama: Token A ditukar -> menghasilkan Token B (Token A sah dicabut)
	rRotate := httptest.NewRequest("POST", "/api/v1/auth/refresh", nil)
	rRotate.AddCookie(&http.Cookie{Name: "refresh_token", Value: tokenA})
	respRotate, err := app.Test(rRotate, -1)
	if err != nil || respRotate.StatusCode != http.StatusOK {
		t.Fatalf("Rotasi token A gagal: %v, status: %d", err, respRotate.StatusCode)
	}

	var tokenB string
	for _, c := range respRotate.Header.Values("Set-Cookie") {
		if strings.HasPrefix(c, "refresh_token=") {
			tokenB = extractCookieVal(c)
		}
	}
	if tokenB == "" || tokenB == tokenA {
		t.Fatalf("Token B tidak valid atau sama dengan Token A")
	}
	t.Logf("Token A berhasil dirotasi ke Token B.")

	// 3. REUSE ATTACK: Penyerang menggunakan Token A yang sudah dicabut!
	rReuse := httptest.NewRequest("POST", "/api/v1/auth/refresh", nil)
	rReuse.AddCookie(&http.Cookie{Name: "refresh_token", Value: tokenA})
	respReuse, _ := app.Test(rReuse, -1)
	if respReuse.StatusCode != http.StatusUnauthorized {
		t.Fatalf("Reuse token A yang sudah dicabut seharusnya ditolak 401, didapatkan: %d", respReuse.StatusCode)
	}
	t.Logf("Reuse attack dengan Token A terdeteksi dan ditolak 401.")

	// 4. Verifikasi Akibat Reuse Detection:
	// Token B (yang tadinya aktif milik user sah) SEHARUSNYA IKUT DICABUT/INVALID sekarang!
	rVictim := httptest.NewRequest("POST", "/api/v1/auth/refresh", nil)
	rVictim.AddCookie(&http.Cookie{Name: "refresh_token", Value: tokenB})
	respVictim, _ := app.Test(rVictim, -1)
	if respVictim.StatusCode != http.StatusUnauthorized {
		t.Fatalf("Token B seharusnya ikut dicabut akibat reuse detection, tetapi masih diterima dengan status: %d", respVictim.StatusCode)
	}
	t.Logf("Sukses: Token B milik user sah otomatis ikut dicabut (HTTP 401) setelah terdeteksi reuse Token A!")

	// 5. Verifikasi di DB: Semua token user ini harus berstatus revoked_at IS NOT NULL
	var user domain.User
	db.Where("email = ?", email).First(&user)
	var activeTokenCount int64
	db.Model(&domain.RefreshToken{}).Where("user_id = ? AND revoked_at IS NULL", user.ID).Count(&activeTokenCount)
	if activeTokenCount != 0 {
		t.Fatalf("Harusnya 0 token aktif tersisa di database, ditemukan: %d", activeTokenCount)
	}
	t.Logf("Terverifikasi di database: seluruh (0) token aktif tersisa, semua sesi user telah dicabut.")
}

// =========================================================================
// 5. TEST: State Machine Status Booking & Reaktivasi Kuota
// =========================================================================
func TestBookingStateMachineTransitions(t *testing.T) {
	db := setupTestDB(t)
	ctx := context.Background()
	bookingRepo := repository.NewBookingRepository(db)
	tripRepo := repository.NewTripRepository(db)

	testTrip := domain.Trip{
		ID:          uuid.New(),
		Title:       "Trip State Machine Test",
		Destination: "Raja Ampat",
		Description: "Paket uji state machine",
		Price:       2500000,
		Duration:    "4D3N",
		Quota:       5,
		ImageURL:    "https://images.unsplash.com/photo-sm",
	}
	_ = tripRepo.Create(ctx, &testTrip)
	defer func() {
		db.Exec("DELETE FROM bookings WHERE trip_id = ?", testTrip.ID)
		db.Exec("DELETE FROM trips WHERE id = ?", testTrip.ID)
	}()

	bID := uuid.New()
	booking := domain.Booking{
		ID:            bID,
		BookingCode:   fmt.Sprintf("TRIP-20261119-SM%s", strings.ToUpper(uuid.New().String()[:5])),
		TripID:        testTrip.ID,
		CustomerName:  "State Machine Tester",
		CustomerEmail: "sm@test.com",
		CustomerPhone: "081234567890",
		TravelDate:    "2026-12-30",
		Pax:           2,
		TotalPrice:    5000000,
		Status:        domain.StatusPending,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}
	_ = bookingRepo.Create(ctx, &booking)

	// Transisi Tidak Valid 1: pending -> completed (DITOLAK)
	_, err := bookingRepo.UpdateStatusAtomic(ctx, bID, domain.StatusCompleted)
	if err == nil {
		t.Fatalf("Transisi tidak valid pending -> completed seharusnya ditolak")
	}
	t.Logf("Transisi tidak valid pending -> completed ditolak: %v", err)

	// Transisi Valid 1: pending -> confirmed
	b1, err := bookingRepo.UpdateStatusAtomic(ctx, bID, domain.StatusConfirmed)
	if err != nil || b1.Status != domain.StatusConfirmed {
		t.Fatalf("Transisi valid pending -> confirmed gagal: %v", err)
	}

	// Transisi Valid 2: confirmed -> cancelled (Kuota bertambah dari 5 menjadi 7)
	b2, err := bookingRepo.UpdateStatusAtomic(ctx, bID, domain.StatusCancelled)
	if err != nil || b2.Status != domain.StatusCancelled {
		t.Fatalf("Transisi valid confirmed -> cancelled gagal: %v", err)
	}
	tripAfterCancel, _ := tripRepo.GetByID(ctx, testTrip.ID)
	if tripAfterCancel.Quota != 7 {
		t.Fatalf("Kuota seharusnya bertambah menjadi 7 setelah pembatalan 2 pax, didapatkan: %d", tripAfterCancel.Quota)
	}

	// Transisi Tidak Valid 2: cancelled -> completed (DITOLAK)
	_, err = bookingRepo.UpdateStatusAtomic(ctx, bID, domain.StatusCompleted)
	if err == nil {
		t.Fatalf("Transisi tidak valid cancelled -> completed seharusnya ditolak")
	}
	t.Logf("Transisi tidak valid cancelled -> completed ditolak: %v", err)

	// Transisi Valid 3: Reaktivasi cancelled -> pending (Kuota berkurang secara atomik dari 7 menjadi 5)
	b3, err := bookingRepo.UpdateStatusAtomic(ctx, bID, domain.StatusPending)
	if err != nil || b3.Status != domain.StatusPending {
		t.Fatalf("Reaktivasi cancelled -> pending gagal: %v", err)
	}
	tripAfterReactivate, _ := tripRepo.GetByID(ctx, testTrip.ID)
	if tripAfterReactivate.Quota != 5 {
		t.Fatalf("Kuota seharusnya berkurang kembali menjadi 5 setelah reaktivasi, didapatkan: %d", tripAfterReactivate.Quota)
	}

	// Transisi Valid 4: pending -> confirmed
	_, _ = bookingRepo.UpdateStatusAtomic(ctx, bID, domain.StatusConfirmed)

	// Transisi Valid 5: confirmed -> completed (Terminal State)
	bDone, err := bookingRepo.UpdateStatusAtomic(ctx, bID, domain.StatusCompleted)
	if err != nil || bDone.Status != domain.StatusCompleted {
		t.Fatalf("Transisi confirmed -> completed gagal: %v", err)
	}

	// Transisi Tidak Valid 3: completed -> cancelled (DITOLAK: Terminal State)
	_, err = bookingRepo.UpdateStatusAtomic(ctx, bID, domain.StatusCancelled)
	if err == nil {
		t.Fatalf("Transisi dari completed -> cancelled seharusnya ditolak karena terminal state")
	}
	t.Logf("Transisi dari completed (terminal state) berhasil ditolak: %v", err)

	// Transisi Tidak Valid 4: completed -> pending (DITOLAK)
	_, err = bookingRepo.UpdateStatusAtomic(ctx, bID, domain.StatusPending)
	if err == nil {
		t.Fatalf("Transisi dari completed -> pending seharusnya ditolak")
	}
	t.Logf("Transisi dari completed -> pending berhasil ditolak: %v", err)

	// Uji Reaktivasi GAGAL jika Kuota Trip 0 (Habis)
	// Buat booking lain dan batalkan
	bID2 := uuid.New()
	b2nd := domain.Booking{
		ID:            bID2,
		BookingCode:   fmt.Sprintf("TRIP-20261119-SM2%s", strings.ToUpper(uuid.New().String()[:4])),
		TripID:        testTrip.ID,
		CustomerName:  "Quota Test",
		CustomerEmail: "quota@test.com",
		CustomerPhone: "081234567890",
		TravelDate:    "2026-12-30",
		Pax:           5, // 5 pax
		TotalPrice:    12500000,
		Status:        domain.StatusCancelled,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}
	_ = bookingRepo.Create(ctx, &b2nd)

	// Set kuota trip ke 0 secara manual
	db.Exec("UPDATE trips SET quota = 0 WHERE id = ?", testTrip.ID)

	// Coba reaktivasi booking dengan pax 5 padahal kuota 0 -> Wajib Ditolak
	_, err = bookingRepo.UpdateStatusAtomic(ctx, bID2, domain.StatusConfirmed)
	if err == nil {
		t.Fatalf("Reaktivasi seharusnya ditolak karena kuota tidak mencukupi (kuota 0, butuh 5)")
	}
	t.Logf("Reaktivasi dari cancelled ditolak secara atomik saat kuota habis: %v", err)
}

