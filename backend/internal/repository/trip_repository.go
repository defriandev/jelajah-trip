package repository

import (
	"context"
	"errors"
	"jelajah-trip-backend/internal/domain"
	"strings"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type tripRepository struct {
	db *gorm.DB
}

func NewTripRepository(db *gorm.DB) domain.TripRepository {
	return &tripRepository{db: db}
}

func (r *tripRepository) Create(ctx context.Context, trip *domain.Trip) error {
	return r.db.WithContext(ctx).Create(trip).Error
}

func (r *tripRepository) Update(ctx context.Context, trip *domain.Trip) error {
	return r.db.WithContext(ctx).Save(trip).Error
}

func (r *tripRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&domain.Trip{}, "id = ?", id).Error
}

func (r *tripRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.Trip, error) {
	var trip domain.Trip
	err := r.db.WithContext(ctx).
		Preload("Reviews.User").
		First(&trip, "id = ?", id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("paket wisata tidak ditemukan")
		}
		return nil, err
	}
	return &trip, nil
}

func (r *tripRepository) GetAll(ctx context.Context, filter domain.TripFilter) ([]domain.Trip, int64, error) {
	var trips []domain.Trip
	var total int64

	query := r.db.WithContext(ctx).Model(&domain.Trip{})

	if filter.Search != "" {
		searchTerm := "%" + strings.ToLower(filter.Search) + "%"
		query = query.Where("LOWER(title) LIKE ? OR LOWER(destination) LIKE ? OR LOWER(description) LIKE ?", searchTerm, searchTerm, searchTerm)
	}

	if filter.Destination != "" && filter.Destination != "Semua" && filter.Destination != "all" {
		query = query.Where("LOWER(destination) LIKE ?", "%"+strings.ToLower(filter.Destination)+"%")
	}

	if filter.MinPrice > 0 {
		query = query.Where("price >= ?", filter.MinPrice)
	}

	if filter.MaxPrice > 0 {
		query = query.Where("price <= ?", filter.MaxPrice)
	}

	if filter.Duration != "" && filter.Duration != "Semua" && filter.Duration != "all" {
		query = query.Where("duration = ?", filter.Duration)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Whitelist sorting & pagination
	page, limit, orderClause, err := domain.SanitizePagination(&filter.PaginationParams, 12, domain.GetAllowedTripSortColumns(), "created_at", "desc")
	if err != nil {
		switch filter.SortBy {
		case "price_asc":
			orderClause = "price ASC"
		case "price_desc":
			orderClause = "price DESC"
		case "newest":
			orderClause = "created_at DESC"
		default:
			return nil, 0, err
		}
		page = 1
		limit = 12
		if filter.Limit > 0 {
			limit = filter.Limit
		}
		if filter.Page > 0 {
			page = filter.Page
		}
	}

	offset := (page - 1) * limit
	if err := query.Preload("Reviews.User").Order(orderClause).Limit(limit).Offset(offset).Find(&trips).Error; err != nil {
		return nil, 0, err
	}

	return trips, total, nil
}

func (r *tripRepository) HasBookings(ctx context.Context, tripID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&domain.Booking{}).Where("trip_id = ?", tripID).Count(&count).Error
	return count > 0, err
}

func (r *tripRepository) GetDestinations(ctx context.Context) ([]string, error) {
	var destinations []string
	err := r.db.WithContext(ctx).
		Model(&domain.Trip{}).
		Distinct("destination").
		Pluck("destination", &destinations).Error
	return destinations, err
}

func (r *tripRepository) Count(ctx context.Context) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&domain.Trip{}).Count(&count).Error
	return count, err
}

func (r *tripRepository) UpdateQuota(ctx context.Context, tripID uuid.UUID, paxDelta int) error {
	return r.db.WithContext(ctx).Model(&domain.Trip{}).
		Where("id = ?", tripID).
		UpdateColumn("quota", gorm.Expr("quota + ?", paxDelta)).Error
}

func (r *tripRepository) GetAllForExport(ctx context.Context) ([]domain.Trip, error) {
	var trips []domain.Trip
	err := r.db.WithContext(ctx).
		Unscoped().
		Order("created_at DESC").
		Find(&trips).Error
	return trips, err
}
