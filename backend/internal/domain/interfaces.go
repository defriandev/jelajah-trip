package domain

import (
	"context"

	"github.com/google/uuid"
)

type UserRepository interface {
	Create(ctx context.Context, user *User) error
	GetByID(ctx context.Context, id uuid.UUID) (*User, error)
	GetByEmail(ctx context.Context, email string) (*User, error)
}

type TripRepository interface {
	Create(ctx context.Context, trip *Trip) error
	Update(ctx context.Context, trip *Trip) error
	Delete(ctx context.Context, id uuid.UUID) error
	GetByID(ctx context.Context, id uuid.UUID) (*Trip, error)
	GetAll(ctx context.Context, filter TripFilter) ([]Trip, int64, error)
	GetDestinations(ctx context.Context) ([]string, error)
	Count(ctx context.Context) (int64, error)
	UpdateQuota(ctx context.Context, tripID uuid.UUID, paxDelta int) error
	HasBookings(ctx context.Context, tripID uuid.UUID) (bool, error)
	GetAllForExport(ctx context.Context) ([]Trip, error)
}

type BookingRepository interface {
	Create(ctx context.Context, booking *Booking) error
	CreateAtomic(ctx context.Context, booking *Booking) error
	GetByID(ctx context.Context, id uuid.UUID) (*Booking, error)
	GetByCode(ctx context.Context, code string) (*Booking, error)
	GetByCodeAndVerification(ctx context.Context, code string, verification string) (*Booking, error)
	GetByUserID(ctx context.Context, userID uuid.UUID, pagination PaginationParams) ([]Booking, int64, error)
	GetAll(ctx context.Context, filter BookingFilter) ([]Booking, int64, error)
	GetAllForExport(ctx context.Context, filter BookingFilter) ([]Booking, error)
	UpdateStatus(ctx context.Context, id uuid.UUID, status BookingStatus) error
	UpdateStatusAtomic(ctx context.Context, id uuid.UUID, status BookingStatus) (*Booking, error)
	GetStats(ctx context.Context) (totalBookings int64, totalRevenue float64, pendingBookings int64, err error)
	FindEligibleCompletedBooking(ctx context.Context, userID, tripID uuid.UUID) (*Booking, error)
	CountByTripID(ctx context.Context, tripID uuid.UUID) (int64, error)
	LinkGuestBookings(ctx context.Context, userID uuid.UUID, email string) error
}

type ReviewRepository interface {
	Create(ctx context.Context, review *Review) error
	GetByTripID(ctx context.Context, tripID uuid.UUID, pagination PaginationParams) ([]Review, int64, error)
	GetAll(ctx context.Context) ([]Review, error)
	Delete(ctx context.Context, id uuid.UUID) error
	GetByBookingID(ctx context.Context, bookingID uuid.UUID) (*Review, error)
}

type FAQRepository interface {
	Create(ctx context.Context, faq *FAQ) error
	GetAll(ctx context.Context) ([]FAQ, error)
	Delete(ctx context.Context, id uint) error
}

type RefreshTokenRepository interface {
	Create(ctx context.Context, token *RefreshToken) error
	GetByTokenHash(ctx context.Context, tokenHash string) (*RefreshToken, error)
	Revoke(ctx context.Context, id uuid.UUID) error
	RevokeByUserID(ctx context.Context, userID uuid.UUID) error
}

type UserUsecase interface {
	Register(ctx context.Context, req RegisterRequest) (res *AuthResponse, accessToken, refreshToken string, err error)
	Login(ctx context.Context, req LoginRequest) (res *AuthResponse, accessToken, refreshToken string, err error)
	RefreshToken(ctx context.Context, refreshTokenStr string) (res *AuthResponse, newAccessToken, newRefreshToken string, err error)
	Logout(ctx context.Context, refreshTokenStr string) error
	GetProfile(ctx context.Context, userID uuid.UUID) (*User, error)
	SetBookingRepo(repo BookingRepository)
}

type TripUsecase interface {
	GetAll(ctx context.Context, filter TripFilter) ([]Trip, *Meta, error)
	GetByID(ctx context.Context, id uuid.UUID) (*Trip, error)
	GetDestinations(ctx context.Context) ([]string, error)
	Create(ctx context.Context, req CreateTripRequest) (*Trip, error)
	Update(ctx context.Context, id uuid.UUID, req UpdateTripRequest) (*Trip, error)
	Delete(ctx context.Context, id uuid.UUID) error
	ExportExcel(ctx context.Context) ([]byte, string, error)
}

type BookingUsecase interface {
	Create(ctx context.Context, userID *uuid.UUID, req CreateBookingRequest) (*Booking, error)
	Track(ctx context.Context, code string, verification string) (*Booking, error)
	GetByCode(ctx context.Context, code string) (*Booking, error)
	GetByUserID(ctx context.Context, userID uuid.UUID, pagination PaginationParams) ([]Booking, *Meta, error)
	GetAll(ctx context.Context, filter BookingFilter) ([]Booking, *Meta, error)
	GetAllForExport(ctx context.Context, filter BookingFilter) ([]Booking, error)
	UpdateStatus(ctx context.Context, id uuid.UUID, status BookingStatus) (*Booking, error)
	GetStats(ctx context.Context) (*DashboardStats, error)
	ExportExcel(ctx context.Context, filter BookingFilter) ([]byte, string, error)
}

type ReviewUsecase interface {
	Create(ctx context.Context, userID uuid.UUID, req CreateReviewRequest) (*Review, error)
	GetByTripID(ctx context.Context, tripID uuid.UUID, pagination PaginationParams) ([]Review, *Meta, error)
	GetAll(ctx context.Context) ([]Review, error)
	Delete(ctx context.Context, id uuid.UUID) error
}

type FAQUsecase interface {
	GetAll(ctx context.Context) ([]FAQ, error)
	Create(ctx context.Context, req CreateFAQRequest) (*FAQ, error)
	Delete(ctx context.Context, id uint) error
}
