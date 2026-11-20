package http

import (
	"database/sql"
	"fmt"
	"jelajah-trip-backend/internal/config"
	"jelajah-trip-backend/internal/domain"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type Handler struct {
	userUsecase     domain.UserUsecase
	tripUsecase     domain.TripUsecase
	bookingUsecase  domain.BookingUsecase
	reviewUsecase   domain.ReviewUsecase
	faqUsecase      domain.FAQUsecase
	cfg             *config.Config
	trackingLimiter *TrackingFailureLimiter
	sqlDB           *sql.DB
}

func NewHandler(
	userUsecase domain.UserUsecase,
	tripUsecase domain.TripUsecase,
	bookingUsecase domain.BookingUsecase,
	reviewUsecase domain.ReviewUsecase,
	faqUsecase domain.FAQUsecase,
	cfg *config.Config,
) *Handler {
	return &Handler{
		userUsecase:     userUsecase,
		tripUsecase:     tripUsecase,
		bookingUsecase:  bookingUsecase,
		reviewUsecase:   reviewUsecase,
		faqUsecase:      faqUsecase,
		cfg:             cfg,
		trackingLimiter: NewTrackingFailureLimiter(5, 15*time.Minute), // 5 kegagalan per 15 menit per booking code
	}
}

func (h *Handler) SetDB(sqlDB *sql.DB) {
	h.sqlDB = sqlDB
}

// setAuthCookies menyimpan access token dan refresh token di httpOnly cookie
func (h *Handler) setAuthCookies(c *fiber.Ctx, accessToken, refreshToken string) {
	isProd := false
	if h.cfg != nil {
		isProd = strings.ToLower(h.cfg.AppEnv) == "production"
	}

	accessExp := 15 * time.Minute
	if h.cfg != nil && h.cfg.JWTExpiresIn > 0 {
		accessExp = h.cfg.JWTExpiresIn
	}

	c.Cookie(&fiber.Cookie{
		Name:     "access_token",
		Value:    accessToken,
		Expires:  time.Now().Add(accessExp),
		HTTPOnly: true,
		Secure:   isProd,
		SameSite: "Lax",
		Path:     "/",
	})

	if refreshToken != "" {
		refreshExp := 7 * 24 * time.Hour
		if h.cfg != nil && h.cfg.JWTRefreshExpiresIn > 0 {
			refreshExp = h.cfg.JWTRefreshExpiresIn
		}

		c.Cookie(&fiber.Cookie{
			Name:     "refresh_token",
			Value:    refreshToken,
			Expires:  time.Now().Add(refreshExp),
			HTTPOnly: true,
			Secure:   isProd,
			SameSite: "Lax",
			Path:     "/api/v1/auth", // Dibatasi ketat hanya untuk auth
		})
	}
}

// clearAuthCookies menghapus sesi cookie pada saat logout
func (h *Handler) clearAuthCookies(c *fiber.Ctx) {
	isProd := false
	if h.cfg != nil {
		isProd = strings.ToLower(h.cfg.AppEnv) == "production"
	}

	c.Cookie(&fiber.Cookie{
		Name:     "access_token",
		Value:    "",
		Expires:  time.Now().Add(-24 * time.Hour),
		HTTPOnly: true,
		Secure:   isProd,
		SameSite: "Lax",
		Path:     "/",
	})
	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    "",
		Expires:  time.Now().Add(-24 * time.Hour),
		HTTPOnly: true,
		Secure:   isProd,
		SameSite: "Lax",
		Path:     "/api/v1/auth",
	})
}

// ================= AUTH HANDLERS =================

func (h *Handler) Register(c *fiber.Ctx) error {
	var req domain.RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return GlobalErrorHandler(c, domain.NewValidationError("Format data pendaftaran tidak valid", nil))
	}

	if err := ValidateStruct(&req); err != nil {
		return GlobalErrorHandler(c, err)
	}

	res, accessToken, refreshToken, err := h.userUsecase.Register(c.Context(), req)
	if err != nil {
		return GlobalErrorHandler(c, err)
	}

	h.setAuthCookies(c, accessToken, refreshToken)

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"message": "Registrasi berhasil, selamat datang di Jelajah Trip!",
		"data":    res,
	})
}

func (h *Handler) Login(c *fiber.Ctx) error {
	var req domain.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return GlobalErrorHandler(c, domain.NewValidationError("Format data login tidak valid", nil))
	}

	if err := ValidateStruct(&req); err != nil {
		return GlobalErrorHandler(c, err)
	}

	res, accessToken, refreshToken, err := h.userUsecase.Login(c.Context(), req)
	if err != nil {
		return GlobalErrorHandler(c, err)
	}

	h.setAuthCookies(c, accessToken, refreshToken)

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Login berhasil",
		"data":    res,
	})
}

func (h *Handler) RefreshToken(c *fiber.Ctx) error {
	tokenStr := c.Cookies("refresh_token")
	if tokenStr == "" {
		var req domain.RefreshTokenRequest
		_ = c.BodyParser(&req)
		tokenStr = req.RefreshToken
	}

	if tokenStr == "" {
		return GlobalErrorHandler(c, domain.NewUnauthorizedError("Refresh token wajib disertakan melalui cookie httpOnly"))
	}

	res, newAccessToken, newRefreshToken, err := h.userUsecase.RefreshToken(c.Context(), tokenStr)
	if err != nil {
		return GlobalErrorHandler(c, err)
	}

	h.setAuthCookies(c, newAccessToken, newRefreshToken)

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Access token berhasil diperbarui",
		"data":    res,
	})
}

func (h *Handler) Logout(c *fiber.Ctx) error {
	tokenStr := c.Cookies("refresh_token")
	if tokenStr == "" {
		var req domain.RefreshTokenRequest
		_ = c.BodyParser(&req)
		tokenStr = req.RefreshToken
	}

	_ = h.userUsecase.Logout(c.Context(), tokenStr)
	h.clearAuthCookies(c)

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Berhasil keluar dari sesi (logout)",
	})
}

func (h *Handler) GetProfile(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(uuid.UUID)
	if !ok {
		return GlobalErrorHandler(c, domain.NewUnauthorizedError("Sesi login tidak valid"))
	}

	user, err := h.userUsecase.GetProfile(c.Context(), userID)
	if err != nil {
		return GlobalErrorHandler(c, err)
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    user,
	})
}

// ================= TRIP HANDLERS =================

func (h *Handler) GetTrips(c *fiber.Ctx) error {
	minPrice, _ := strconv.ParseFloat(c.Query("min_price"), 64)
	maxPrice, _ := strconv.ParseFloat(c.Query("max_price"), 64)
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "12"))

	filter := domain.TripFilter{
		PaginationParams: domain.PaginationParams{
			Page:  page,
			Limit: limit,
			Sort:  c.Query("sort", "created_at"),
			Order: c.Query("order", "desc"),
		},
		Search:      c.Query("search"),
		Destination: c.Query("destination"),
		MinPrice:    minPrice,
		MaxPrice:    maxPrice,
		Duration:    c.Query("duration"),
		SortBy:      c.Query("sort_by"),
	}

	trips, meta, err := h.tripUsecase.GetAll(c.Context(), filter)
	if err != nil {
		return GlobalErrorHandler(c, err)
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    trips,
		"meta":    meta,
	})
}

func (h *Handler) GetTripDestinations(c *fiber.Ctx) error {
	destinations, err := h.tripUsecase.GetDestinations(c.Context())
	if err != nil {
		return GlobalErrorHandler(c, err)
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    destinations,
	})
}

func (h *Handler) GetTripByID(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return GlobalErrorHandler(c, domain.NewValidationError("ID trip tidak valid", []domain.ErrorDetail{
			{Field: "id", Message: "Format UUID tidak valid"},
		}))
	}

	trip, err := h.tripUsecase.GetByID(c.Context(), id)
	if err != nil {
		return GlobalErrorHandler(c, err)
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    trip,
	})
}

func (h *Handler) CreateTrip(c *fiber.Ctx) error {
	var req domain.CreateTripRequest
	if err := c.BodyParser(&req); err != nil {
		return GlobalErrorHandler(c, domain.NewValidationError("Format data paket wisata tidak valid", nil))
	}

	if err := ValidateStruct(&req); err != nil {
		return GlobalErrorHandler(c, err)
	}

	trip, err := h.tripUsecase.Create(c.Context(), req)
	if err != nil {
		return GlobalErrorHandler(c, err)
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"message": "Paket trip berhasil ditambahkan",
		"data":    trip,
	})
}

func (h *Handler) UpdateTrip(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return GlobalErrorHandler(c, domain.NewValidationError("ID trip tidak valid", []domain.ErrorDetail{
			{Field: "id", Message: "Format UUID tidak valid"},
		}))
	}

	var req domain.UpdateTripRequest
	if err := c.BodyParser(&req); err != nil {
		return GlobalErrorHandler(c, domain.NewValidationError("Format pembaruan paket wisata tidak valid", nil))
	}

	if err := ValidateStruct(&req); err != nil {
		return GlobalErrorHandler(c, err)
	}

	trip, err := h.tripUsecase.Update(c.Context(), id, req)
	if err != nil {
		return GlobalErrorHandler(c, err)
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Paket trip berhasil diperbarui",
		"data":    trip,
	})
}

func (h *Handler) DeleteTrip(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return GlobalErrorHandler(c, domain.NewValidationError("ID trip tidak valid", []domain.ErrorDetail{
			{Field: "id", Message: "Format UUID tidak valid"},
		}))
	}

	if err := h.tripUsecase.Delete(c.Context(), id); err != nil {
		return GlobalErrorHandler(c, err)
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Paket trip berhasil dihapus (diarsipkan)",
	})
}

func (h *Handler) ExportTripsExcel(c *fiber.Ctx) error {
	fileBytes, filename, err := h.tripUsecase.ExportExcel(c.Context())
	if err != nil {
		return GlobalErrorHandler(c, err)
	}

	c.Set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
	c.Set("Cache-Control", "no-cache, no-store, must-revalidate")
	return c.Send(fileBytes)
}

// ================= BOOKING HANDLERS =================

func (h *Handler) CreateBooking(c *fiber.Ctx) error {
	var req domain.CreateBookingRequest
	if err := c.BodyParser(&req); err != nil {
		return GlobalErrorHandler(c, domain.NewValidationError("Format pemesanan tidak valid", nil))
	}

	if err := ValidateStruct(&req); err != nil {
		return GlobalErrorHandler(c, err)
	}

	var userID *uuid.UUID
	if val := c.Locals("userID"); val != nil {
		if uid, ok := val.(uuid.UUID); ok {
			userID = &uid
		}
	}

	booking, err := h.bookingUsecase.Create(c.Context(), userID, req)
	if err != nil {
		return GlobalErrorHandler(c, err)
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"message": "Pemesanan berhasil dibuat",
		"data":    booking,
	})
}

// TrackBooking memvalidasi booking code dan verifikasi email/telepon.
// Respons error selalu identik byte-for-byte dan generic.
func (h *Handler) TrackBooking(c *fiber.Ctx) error {
	code := c.Query("code")
	if code == "" {
		code = c.Params("code")
	}

	verification := c.Query("verification")
	if verification == "" {
		var body struct {
			BookingCode  string `json:"booking_code"`
			Verification string `json:"verification"`
		}
		_ = c.BodyParser(&body)
		if body.BookingCode != "" {
			code = body.BookingCode
		}
		if body.Verification != "" {
			verification = body.Verification
		}
	}

	normCode := strings.ToUpper(strings.TrimSpace(code))
	normVerif := strings.TrimSpace(verification)

	if normCode == "" || normVerif == "" {
		return sendErrorResponse(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Kode booking dan data verifikasi (email atau 4 digit terakhir nomor telepon) wajib diisi", nil)
	}

	// Cek batasan percobaan gagal per booking_code (5 gagal / 15 menit)
	if h.trackingLimiter.IsBlocked(normCode) {
		return sendErrorResponse(c, fiber.StatusTooManyRequests, "RATE_LIMIT_EXCEEDED", "Terlalu banyak percobaan gagal untuk kode booking ini. Silakan tunggu 15 menit sebelum mencoba kembali.", nil)
	}

	booking, err := h.bookingUsecase.Track(c.Context(), normCode, normVerif)
	if err != nil {
		h.trackingLimiter.RecordFailure(normCode)
		// Respons error tracking selalu identik secara byte
		return sendErrorResponse(c, fiber.StatusNotFound, "TRACKING_NOT_FOUND", "Pesanan tidak ditemukan atau data verifikasi tidak cocok", nil)
	}

	h.trackingLimiter.Reset(normCode)

	return c.JSON(fiber.Map{
		"success": true,
		"data":    booking,
	})
}

func (h *Handler) GetBookingByCode(c *fiber.Ctx) error {
	code := c.Params("code")
	booking, err := h.bookingUsecase.GetByCode(c.Context(), code)
	if err != nil {
		return GlobalErrorHandler(c, err)
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    booking,
	})
}

func (h *Handler) GetUserBookings(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(uuid.UUID)
	if !ok {
		return GlobalErrorHandler(c, domain.NewUnauthorizedError("Sesi login tidak valid"))
	}

	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	pagination := domain.PaginationParams{
		Page:  page,
		Limit: limit,
		Sort:  c.Query("sort", "created_at"),
		Order: c.Query("order", "desc"),
	}

	bookings, meta, err := h.bookingUsecase.GetByUserID(c.Context(), userID, pagination)
	if err != nil {
		return GlobalErrorHandler(c, err)
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    bookings,
		"meta":    meta,
	})
}

func (h *Handler) GetAllBookings(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	filter := domain.BookingFilter{
		PaginationParams: domain.PaginationParams{
			Page:  page,
			Limit: limit,
			Sort:  c.Query("sort", "created_at"),
			Order: c.Query("order", "desc"),
		},
		Status: c.Query("status"),
		Search: c.Query("search"),
	}

	bookings, meta, err := h.bookingUsecase.GetAll(c.Context(), filter)
	if err != nil {
		return GlobalErrorHandler(c, err)
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    bookings,
		"meta":    meta,
	})
}

func (h *Handler) ExportBookingsExcel(c *fiber.Ctx) error {
	filter := domain.BookingFilter{
		Status: c.Query("status"),
		Search: c.Query("search"),
	}

	fileBytes, filename, err := h.bookingUsecase.ExportExcel(c.Context(), filter)
	if err != nil {
		return GlobalErrorHandler(c, err)
	}

	c.Set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
	c.Set("Cache-Control", "no-cache, no-store, must-revalidate")
	return c.Send(fileBytes)
}

func (h *Handler) UpdateBookingStatus(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return GlobalErrorHandler(c, domain.NewValidationError("ID pesanan tidak valid", []domain.ErrorDetail{
			{Field: "id", Message: "Format UUID tidak valid"},
		}))
	}

	var req domain.UpdateBookingStatusRequest
	if err := c.BodyParser(&req); err != nil {
		return GlobalErrorHandler(c, domain.NewValidationError("Format data status tidak valid", nil))
	}

	if err := ValidateStruct(&req); err != nil {
		return GlobalErrorHandler(c, err)
	}

	booking, err := h.bookingUsecase.UpdateStatus(c.Context(), id, req.Status)
	if err != nil {
		return GlobalErrorHandler(c, err)
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Status pesanan berhasil diperbarui",
		"data":    booking,
	})
}

func (h *Handler) GetDashboardStats(c *fiber.Ctx) error {
	stats, err := h.bookingUsecase.GetStats(c.Context())
	if err != nil {
		return GlobalErrorHandler(c, err)
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    stats,
	})
}

// ================= REVIEW HANDLERS =================

func (h *Handler) CreateReview(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(uuid.UUID)
	if !ok {
		return GlobalErrorHandler(c, domain.NewUnauthorizedError("Silakan login terlebih dahulu untuk memberikan ulasan"))
	}

	var req domain.CreateReviewRequest
	if err := c.BodyParser(&req); err != nil {
		return GlobalErrorHandler(c, domain.NewValidationError("Format ulasan tidak valid", nil))
	}

	if err := ValidateStruct(&req); err != nil {
		return GlobalErrorHandler(c, err)
	}

	review, err := h.reviewUsecase.Create(c.Context(), userID, req)
	if err != nil {
		return GlobalErrorHandler(c, err)
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"message": "Terima kasih atas ulasan Anda!",
		"data":    review,
	})
}

func (h *Handler) GetReviewsByTrip(c *fiber.Ctx) error {
	tripID, err := uuid.Parse(c.Params("trip_id"))
	if err != nil {
		return GlobalErrorHandler(c, domain.NewValidationError("ID trip tidak valid", []domain.ErrorDetail{
			{Field: "trip_id", Message: "Format UUID tidak valid"},
		}))
	}

	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	pagination := domain.PaginationParams{
		Page:  page,
		Limit: limit,
		Sort:  c.Query("sort", "created_at"),
		Order: c.Query("order", "desc"),
	}

	reviews, meta, err := h.reviewUsecase.GetByTripID(c.Context(), tripID, pagination)
	if err != nil {
		return GlobalErrorHandler(c, err)
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    reviews,
		"meta":    meta,
	})
}

func (h *Handler) GetAllReviews(c *fiber.Ctx) error {
	reviews, err := h.reviewUsecase.GetAll(c.Context())
	if err != nil {
		return GlobalErrorHandler(c, err)
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    reviews,
	})
}

func (h *Handler) DeleteReview(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return GlobalErrorHandler(c, domain.NewValidationError("ID ulasan tidak valid", []domain.ErrorDetail{
			{Field: "id", Message: "Format UUID tidak valid"},
		}))
	}

	if err := h.reviewUsecase.Delete(c.Context(), id); err != nil {
		return GlobalErrorHandler(c, err)
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Ulasan berhasil dihapus",
	})
}

// ================= FAQ HANDLERS =================

func (h *Handler) GetFAQs(c *fiber.Ctx) error {
	faqs, err := h.faqUsecase.GetAll(c.Context())
	if err != nil {
		return GlobalErrorHandler(c, err)
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    faqs,
	})
}

func (h *Handler) CreateFAQ(c *fiber.Ctx) error {
	var req domain.CreateFAQRequest
	if err := c.BodyParser(&req); err != nil {
		return GlobalErrorHandler(c, domain.NewValidationError("Format FAQ tidak valid", nil))
	}

	if err := ValidateStruct(&req); err != nil {
		return GlobalErrorHandler(c, err)
	}

	faq, err := h.faqUsecase.Create(c.Context(), req)
	if err != nil {
		return GlobalErrorHandler(c, err)
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"message": "FAQ berhasil ditambahkan",
		"data":    faq,
	})
}

func (h *Handler) DeleteFAQ(c *fiber.Ctx) error {
	idInt, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return GlobalErrorHandler(c, domain.NewValidationError("ID FAQ tidak valid", []domain.ErrorDetail{
			{Field: "id", Message: "Format ID harus berupa angka"},
		}))
	}

	if err := h.faqUsecase.Delete(c.Context(), uint(idInt)); err != nil {
		return GlobalErrorHandler(c, err)
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "FAQ berhasil dihapus",
	})
}

// ================= HEALTH & READINESS =================

// HealthHandler memeriksa status liveness server tanpa koneksi DB
func (h *Handler) HealthHandler(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"status":  "ok",
		"app":     "Jelajah Trip API",
		"version": "1.0.0",
	})
}

// ReadyHandler memeriksa status kesiapan server (ping DB dengan timeout 2 detik)
func (h *Handler) ReadyHandler(c *fiber.Ctx) error {
	if h.sqlDB == nil {
		return sendErrorResponse(c, fiber.StatusServiceUnavailable, "SERVICE_UNAVAILABLE", "Database connection pool tidak terkonfigurasi", nil)
	}

	pingDone := make(chan error, 1)
	go func() {
		pingDone <- h.sqlDB.Ping()
	}()

	select {
	case pingErr := <-pingDone:
		if pingErr != nil {
			return sendErrorResponse(c, fiber.StatusServiceUnavailable, "SERVICE_UNAVAILABLE", "Basis data tidak dapat dihubungi", nil)
		}
		return c.JSON(fiber.Map{
			"status":   "ready",
			"database": "connected",
		})
	case <-time.After(2 * time.Second):
		return sendErrorResponse(c, fiber.StatusServiceUnavailable, "SERVICE_UNAVAILABLE", "Koneksi basis data timeout setelah 2 detik", nil)
	}
}
