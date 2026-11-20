package usecase

import (
	"context"
	"errors"
	"jelajah-trip-backend/internal/domain"
	"strings"
	"time"

	"github.com/google/uuid"
)

type reviewUsecase struct {
	reviewRepo  domain.ReviewRepository
	tripRepo    domain.TripRepository
	bookingRepo domain.BookingRepository
}

func NewReviewUsecase(reviewRepo domain.ReviewRepository, tripRepo domain.TripRepository, bookingRepo domain.BookingRepository) domain.ReviewUsecase {
	return &reviewUsecase{
		reviewRepo:  reviewRepo,
		tripRepo:    tripRepo,
		bookingRepo: bookingRepo,
	}
}

func (u *reviewUsecase) Create(ctx context.Context, userID uuid.UUID, req domain.CreateReviewRequest) (*domain.Review, error) {
	req.Comment = strings.TrimSpace(req.Comment)
	if req.Rating < 1 || req.Rating > 5 {
		return nil, errors.New("rating harus berada di antara rentang 1 hingga 5 bintang")
	}

	if req.Comment == "" {
		return nil, errors.New("ulasan atau komentar tidak boleh kosong")
	}

	tripID, err := uuid.Parse(req.TripID)
	if err != nil {
		return nil, errors.New("ID trip tidak valid")
	}

	if _, err := u.tripRepo.GetByID(ctx, tripID); err != nil {
		return nil, errors.New("paket trip tidak ditemukan")
	}

	// Aturan 1.7: Hanya user dengan booking completed pada trip tersebut yang boleh mengulas, maksimal satu ulasan per booking
	var eligibleBooking *domain.Booking
	if req.BookingID != "" {
		bID, err := uuid.Parse(req.BookingID)
		if err != nil {
			return nil, errors.New("ID booking tidak valid")
		}
		b, err := u.bookingRepo.GetByID(ctx, bID)
		if err != nil || b.UserID == nil || *b.UserID != userID || b.TripID != tripID || b.Status != domain.StatusCompleted {
			return nil, domain.ErrReviewNotEligible
		}

		existingReview, _ := u.reviewRepo.GetByBookingID(ctx, bID)
		if existingReview != nil {
			return nil, domain.ErrReviewAlreadyExists
		}
		eligibleBooking = b
	} else {
		// Cari booking completed milik user untuk trip ini yang belum pernah diulas
		b, err := u.bookingRepo.FindEligibleCompletedBooking(ctx, userID, tripID)
		if err != nil {
			return nil, domain.ErrReviewNotEligible
		}
		eligibleBooking = b
	}

	review := domain.Review{
		ID:        uuid.New(),
		TripID:    tripID,
		UserID:    userID,
		BookingID: &eligibleBooking.ID,
		Rating:    req.Rating,
		Comment:   req.Comment,
		CreatedAt: time.Now(),
	}

	if err := u.reviewRepo.Create(ctx, &review); err != nil {
		// Jika melanggar unique constraint
		if strings.Contains(strings.ToLower(err.Error()), "unique") || strings.Contains(strings.ToLower(err.Error()), "duplicate") {
			return nil, domain.ErrReviewAlreadyExists
		}
		return nil, errors.New("gagal menyimpan ulasan")
	}

	return &review, nil
}

func (u *reviewUsecase) GetByTripID(ctx context.Context, tripID uuid.UUID, pagination domain.PaginationParams) ([]domain.Review, *domain.Meta, error) {
	reviews, total, err := u.reviewRepo.GetByTripID(ctx, tripID, pagination)
	if err != nil {
		return nil, nil, err
	}
	page := pagination.Page
	if page < 1 {
		page = 1
	}
	limit := pagination.Limit
	if limit < 1 {
		limit = 10
	}
	meta := domain.CalculateMeta(total, page, limit)
	return reviews, meta, nil
}

func (u *reviewUsecase) GetAll(ctx context.Context) ([]domain.Review, error) {
	return u.reviewRepo.GetAll(ctx)
}

func (u *reviewUsecase) Delete(ctx context.Context, id uuid.UUID) error {
	return u.reviewRepo.Delete(ctx, id)
}
