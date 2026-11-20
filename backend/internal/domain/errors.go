package domain

import (
	"errors"
	"fmt"
	"net/http"
)

// Sentinel domain errors
var (
	ErrQuotaInsufficient   = errors.New("kuota trip tidak mencukupi")
	ErrGenericVerification = errors.New("pesanan tidak ditemukan atau data verifikasi tidak cocok")
	ErrReviewNotEligible   = errors.New("hanya pengguna dengan pesanan yang telah selesai (status completed) pada trip ini yang dapat memberikan ulasan")
	ErrReviewAlreadyExists = errors.New("ulasan untuk pesanan ini sudah pernah dikirimkan")
	ErrNotFound            = errors.New("data tidak ditemukan")
	ErrUnauthorized        = errors.New("autentikasi gagal atau sesi telah berakhir")
	ErrForbidden           = errors.New("akses ditolak: Anda tidak memiliki izin untuk tindakan ini")
	ErrValidation          = errors.New("validasi data masukan gagal")
	ErrConflict            = errors.New("terjadi konflik data")
	ErrQuotaExceeded       = ErrQuotaInsufficient
	ErrInvalidTransition   = errors.New("transisi status pesanan tidak valid")
	ErrTripHasBookings     = errors.New("paket wisata memiliki pesanan dan tidak dapat dihapus permanen")
	ErrTrackingNotFound    = ErrGenericVerification
	ErrTooManyRequests     = errors.New("terlalu banyak permintaan, silakan coba beberapa saat lagi")
	ErrInternal            = errors.New("terjadi kesalahan internal pada sistem")
)

// ErrorDetail memuat detail validasi spesifik per field
type ErrorDetail struct {
	Field   string `json:"field,omitempty"`
	Message string `json:"message"`
}

// ErrorBody merepresentasikan objek error terstandar
type ErrorBody struct {
	Code    string        `json:"code"`
	Message string        `json:"message"`
	Details []ErrorDetail `json:"details,omitempty"`
}

// AppError adalah error bertipe untuk membungkus kode error, status HTTP, dan detail
type AppError struct {
	Status  int           `json:"-"`
	Code    string        `json:"code"`
	Message string        `json:"message"`
	Details []ErrorDetail `json:"details,omitempty"`
	Err     error         `json:"-"`
}

func (e *AppError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("%s: %v", e.Message, e.Err)
	}
	return e.Message
}

func (e *AppError) Unwrap() error {
	return e.Err
}

// Helper constructors untuk AppError
func NewValidationError(message string, details []ErrorDetail) *AppError {
	return &AppError{
		Status:  http.StatusBadRequest,
		Code:    "VALIDATION_ERROR",
		Message: message,
		Details: details,
		Err:     ErrValidation,
	}
}

func NewNotFoundError(message string) *AppError {
	if message == "" {
		message = "Data yang dicari tidak ditemukan"
	}
	return &AppError{
		Status:  http.StatusNotFound,
		Code:    "NOT_FOUND",
		Message: message,
		Err:     ErrNotFound,
	}
}

func NewConflictError(code, message string) *AppError {
	return &AppError{
		Status:  http.StatusConflict,
		Code:    code,
		Message: message,
		Err:     ErrConflict,
	}
}

func NewForbiddenError(message string) *AppError {
	return &AppError{
		Status:  http.StatusForbidden,
		Code:    "FORBIDDEN",
		Message: message,
		Err:     ErrForbidden,
	}
}

func NewUnauthorizedError(message string) *AppError {
	return &AppError{
		Status:  http.StatusUnauthorized,
		Code:    "UNAUTHORIZED",
		Message: message,
		Err:     ErrUnauthorized,
	}
}

func NewTrackingNotFoundError() *AppError {
	return &AppError{
		Status:  http.StatusNotFound,
		Code:    "TRACKING_NOT_FOUND",
		Message: "Pesanan tidak ditemukan atau data verifikasi tidak cocok",
		Err:     ErrTrackingNotFound,
	}
}

func NewRateLimitError(message string) *AppError {
	if message == "" {
		message = "Terlalu banyak permintaan, silakan coba kembali dalam 15 menit"
	}
	return &AppError{
		Status:  http.StatusTooManyRequests,
		Code:    "RATE_LIMIT_EXCEEDED",
		Message: message,
		Err:     ErrTooManyRequests,
	}
}
