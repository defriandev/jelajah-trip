package repository

import (
	"context"
	"errors"
	"jelajah-trip-backend/internal/domain"
	"strings"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type reviewRepository struct {
	db *gorm.DB
}

func NewReviewRepository(db *gorm.DB) domain.ReviewRepository {
	return &reviewRepository{db: db}
}

func (r *reviewRepository) Create(ctx context.Context, review *domain.Review) error {
	err := r.db.WithContext(ctx).Create(review).Error
	if err != nil {
		errStr := err.Error()
		if errors.Is(err, gorm.ErrDuplicatedKey) ||
			strings.Contains(errStr, "idx_reviews_booking_id") ||
			strings.Contains(errStr, "duplicate key") ||
			strings.Contains(errStr, "23505") {
			return domain.ErrReviewAlreadyExists
		}
		return err
	}
	return nil
}

func (r *reviewRepository) GetByTripID(ctx context.Context, tripID uuid.UUID, pagination domain.PaginationParams) ([]domain.Review, int64, error) {
	var reviews []domain.Review
	var total int64

	query := r.db.WithContext(ctx).Model(&domain.Review{}).Where("trip_id = ?", tripID)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	page, limit, orderClause, err := domain.SanitizePagination(&pagination, 10, domain.GetAllowedReviewSortColumns(), "created_at", "desc")
	if err != nil {
		page = 1
		limit = 10
		orderClause = "created_at DESC"
	}

	offset := (page - 1) * limit
	err = query.
		Preload("User").
		Order(orderClause).
		Limit(limit).
		Offset(offset).
		Find(&reviews).Error

	return reviews, total, err
}

func (r *reviewRepository) GetAll(ctx context.Context) ([]domain.Review, error) {
	var reviews []domain.Review
	err := r.db.WithContext(ctx).
		Preload("User").
		Order("created_at DESC").
		Find(&reviews).Error
	return reviews, err
}

func (r *reviewRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&domain.Review{}, "id = ?", id).Error
}

func (r *reviewRepository) GetByBookingID(ctx context.Context, bookingID uuid.UUID) (*domain.Review, error) {
	var review domain.Review
	err := r.db.WithContext(ctx).
		First(&review, "booking_id = ?", bookingID).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &review, nil
}
