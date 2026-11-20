package http

import (
	"errors"
	"jelajah-trip-backend/internal/domain"
	"log/slog"
	"net/http"
	"strings"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// GlobalErrorHandler adalah error handler terpusat Fiber yang memetakan error ke format JSON seragam
func GlobalErrorHandler(c *fiber.Ctx, err error) error {
	if err == nil {
		return nil
	}

	status := http.StatusInternalServerError
	code := "INTERNAL_SERVER_ERROR"
	message := "Terjadi kesalahan internal pada server"
	var details []domain.ErrorDetail

	// 1. Tangani domain.AppError
	var appErr *domain.AppError
	if errors.As(err, &appErr) {
		status = appErr.Status
		code = appErr.Code
		message = appErr.Message
		details = appErr.Details
		return sendErrorResponse(c, status, code, message, details)
	}

	// 2. Tangani fiber.Error (mis. 404 route not found, 405 method not allowed)
	var fiberErr *fiber.Error
	if errors.As(err, &fiberErr) {
		status = fiberErr.Code
		message = fiberErr.Message
		switch status {
		case http.StatusNotFound:
			code = "ROUTE_NOT_FOUND"
		case http.StatusMethodNotAllowed:
			code = "METHOD_NOT_ALLOWED"
		case http.StatusTooManyRequests:
			code = "RATE_LIMIT_EXCEEDED"
		case http.StatusBadRequest:
			code = "BAD_REQUEST"
		case http.StatusUnauthorized:
			code = "UNAUTHORIZED"
		case http.StatusForbidden:
			code = "FORBIDDEN"
		default:
			code = "HTTP_ERROR"
		}
		return sendErrorResponse(c, status, code, message, details)
	}

	// 3. Tangani Sentinel Errors Domain
	switch {
	case errors.Is(err, domain.ErrGenericVerification) || errors.Is(err, domain.ErrTrackingNotFound):
		// PENTING: Respons error tracking tetap generik & identik
		return sendErrorResponse(c, http.StatusNotFound, "TRACKING_NOT_FOUND", "Pesanan tidak ditemukan atau data verifikasi tidak cocok", nil)

	case errors.Is(err, domain.ErrNotFound):
		status = http.StatusNotFound
		code = "NOT_FOUND"
		message = err.Error()

	case errors.Is(err, domain.ErrQuotaInsufficient):
		status = http.StatusBadRequest
		code = "QUOTA_INSUFFICIENT"
		message = err.Error()

	case errors.Is(err, domain.ErrReviewAlreadyExists):
		status = http.StatusConflict
		code = "REVIEW_ALREADY_EXISTS"
		message = err.Error()

	case errors.Is(err, domain.ErrReviewNotEligible):
		status = http.StatusForbidden
		code = "REVIEW_NOT_ELIGIBLE"
		message = err.Error()

	case errors.Is(err, domain.ErrTripHasBookings):
		status = http.StatusBadRequest
		code = "TRIP_HAS_BOOKINGS"
		message = err.Error()

	case errors.Is(err, domain.ErrInvalidTransition):
		status = http.StatusBadRequest
		code = "INVALID_STATUS_TRANSITION"
		message = err.Error()

	case errors.Is(err, domain.ErrUnauthorized):
		status = http.StatusUnauthorized
		code = "UNAUTHORIZED"
		message = err.Error()

	case errors.Is(err, domain.ErrForbidden):
		status = http.StatusForbidden
		code = "FORBIDDEN"
		message = err.Error()

	case errors.Is(err, domain.ErrTooManyRequests):
		status = http.StatusTooManyRequests
		code = "RATE_LIMIT_EXCEEDED"
		message = err.Error()

	case errors.Is(err, domain.ErrValidation):
		status = http.StatusBadRequest
		code = "VALIDATION_ERROR"
		message = err.Error()

	case errors.Is(err, gorm.ErrRecordNotFound):
		status = http.StatusNotFound
		code = "NOT_FOUND"
		message = "Data yang dicari tidak ditemukan"

	default:
		// Periksa potensi domain / database error (tanpa membocorkan detail raw DB ke client)
		errStr := strings.ToLower(err.Error())
		if strings.Contains(errStr, "email atau kata sandi") ||
			strings.Contains(errStr, "refresh token") ||
			strings.Contains(errStr, "penggunaan ulang") ||
			strings.Contains(errStr, "sesi telah berakhir") ||
			strings.Contains(errStr, "unauthorized") {
			status = http.StatusUnauthorized
			code = "UNAUTHORIZED"
			message = err.Error()
		} else if strings.Contains(errStr, "chk_") || strings.Contains(errStr, "check constraint") {
			status = http.StatusBadRequest
			code = "CHECK_CONSTRAINT_VIOLATION"
			message = "Data masukan melanggar batasan integritas basis data"
		} else if strings.Contains(errStr, "duplicate key") || strings.Contains(errStr, "unique constraint") || strings.Contains(errStr, "23505") {
			status = http.StatusConflict
			code = "DUPLICATE_DATA"
			message = "Data yang dimasukkan sudah terdaftar pada sistem"
		} else if strings.Contains(errStr, "transisi status tidak valid") {
			status = http.StatusBadRequest
			code = "INVALID_STATUS_TRANSITION"
			message = err.Error()
		} else if strings.Contains(errStr, "kuota") {
			status = http.StatusBadRequest
			code = "QUOTA_INSUFFICIENT"
			message = err.Error()
		} else {
			// Log error asli ke server logger (slog)
			slog.Error("Unhandled Internal Server Error", "error", err.Error(), "path", c.Path())
			status = http.StatusInternalServerError
			code = "INTERNAL_SERVER_ERROR"
			message = "Terjadi kesalahan internal pada sistem"
		}
	}

	return sendErrorResponse(c, status, code, message, details)
}

func sendErrorResponse(c *fiber.Ctx, status int, code, message string, details []domain.ErrorDetail) error {
	resp := fiber.Map{
		"success": false,
		"error": fiber.Map{
			"code":    code,
			"message": message,
		},
	}
	if len(details) > 0 {
		resp["error"].(fiber.Map)["details"] = details
	}
	return c.Status(status).JSON(resp)
}
