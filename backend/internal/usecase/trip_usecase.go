package usecase

import (
	"context"
	"errors"
	"jelajah-trip-backend/internal/domain"
	"strings"
	"time"

	"github.com/google/uuid"
)

type tripUsecase struct {
	tripRepo domain.TripRepository
}

func NewTripUsecase(tripRepo domain.TripRepository) domain.TripUsecase {
	return &tripUsecase{tripRepo: tripRepo}
}

func (u *tripUsecase) GetAll(ctx context.Context, filter domain.TripFilter) ([]domain.Trip, *domain.Meta, error) {
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.Limit < 1 {
		filter.Limit = 12
	} else if filter.Limit > 100 {
		filter.Limit = 100
	}

	trips, total, err := u.tripRepo.GetAll(ctx, filter)
	if err != nil {
		return nil, nil, err
	}

	meta := domain.CalculateMeta(total, filter.Page, filter.Limit)
	return trips, meta, nil
}

func (u *tripUsecase) GetByID(ctx context.Context, id uuid.UUID) (*domain.Trip, error) {
	return u.tripRepo.GetByID(ctx, id)
}

func (u *tripUsecase) GetDestinations(ctx context.Context) ([]string, error) {
	return u.tripRepo.GetDestinations(ctx)
}

func (u *tripUsecase) Create(ctx context.Context, req domain.CreateTripRequest) (*domain.Trip, error) {
	req.Title = strings.TrimSpace(req.Title)
	req.Destination = strings.TrimSpace(req.Destination)
	if req.Title == "" || req.Destination == "" || req.Description == "" {
		return nil, errors.New("judul, destinasi, dan deskripsi wajib diisi")
	}

	if req.Price <= 0 {
		return nil, errors.New("harga harus lebih besar dari 0")
	}

	if req.Quota < 0 {
		return nil, errors.New("kuota tidak boleh negatif")
	}

	if req.ImageURL == "" {
		req.ImageURL = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"
	}

	trip := domain.Trip{
		ID:          uuid.New(),
		Title:       req.Title,
		Destination: req.Destination,
		Description: req.Description,
		Price:       req.Price,
		Duration:    req.Duration,
		Facilities:  req.Facilities,
		Quota:       req.Quota,
		ImageURL:    req.ImageURL,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := u.tripRepo.Create(ctx, &trip); err != nil {
		return nil, errors.New("gagal menyimpan paket trip baru")
	}

	return &trip, nil
}

func (u *tripUsecase) Update(ctx context.Context, id uuid.UUID, req domain.UpdateTripRequest) (*domain.Trip, error) {
	trip, err := u.tripRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if strings.TrimSpace(req.Title) != "" {
		trip.Title = strings.TrimSpace(req.Title)
	}
	if strings.TrimSpace(req.Destination) != "" {
		trip.Destination = strings.TrimSpace(req.Destination)
	}
	if strings.TrimSpace(req.Description) != "" {
		trip.Description = strings.TrimSpace(req.Description)
	}
	if req.Price > 0 {
		trip.Price = req.Price
	}
	if strings.TrimSpace(req.Duration) != "" {
		trip.Duration = strings.TrimSpace(req.Duration)
	}
	if req.Facilities != nil {
		trip.Facilities = req.Facilities
	}
	if req.Quota >= 0 {
		trip.Quota = req.Quota
	}
	if strings.TrimSpace(req.ImageURL) != "" {
		trip.ImageURL = strings.TrimSpace(req.ImageURL)
	}
	trip.UpdatedAt = time.Now()

	if err := u.tripRepo.Update(ctx, trip); err != nil {
		return nil, errors.New("gagal memperbarui paket trip")
	}

	return trip, nil
}

func (u *tripUsecase) Delete(ctx context.Context, id uuid.UUID) error {
	return u.tripRepo.Delete(ctx, id)
}
