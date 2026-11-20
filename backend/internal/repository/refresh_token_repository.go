package repository

import (
	"context"
	"errors"
	"jelajah-trip-backend/internal/domain"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type refreshTokenRepository struct {
	db *gorm.DB
}

func NewRefreshTokenRepository(db *gorm.DB) domain.RefreshTokenRepository {
	return &refreshTokenRepository{db: db}
}

func (r *refreshTokenRepository) Create(ctx context.Context, token *domain.RefreshToken) error {
	return r.db.WithContext(ctx).Create(token).Error
}

func (r *refreshTokenRepository) GetByTokenHash(ctx context.Context, tokenHash string) (*domain.RefreshToken, error) {
	var token domain.RefreshToken
	err := r.db.WithContext(ctx).
		Preload("User").
		First(&token, "token_hash = ?", tokenHash).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("refresh token tidak ditemukan")
		}
		return nil, err
	}
	return &token, nil
}

func (r *refreshTokenRepository) Revoke(ctx context.Context, id uuid.UUID) error {
	now := time.Now()
	return r.db.WithContext(ctx).
		Model(&domain.RefreshToken{}).
		Where("id = ? AND revoked_at IS NULL", id).
		Update("revoked_at", &now).Error
}

func (r *refreshTokenRepository) RevokeByUserID(ctx context.Context, userID uuid.UUID) error {
	now := time.Now()
	return r.db.WithContext(ctx).
		Model(&domain.RefreshToken{}).
		Where("user_id = ? AND revoked_at IS NULL", userID).
		Update("revoked_at", &now).Error
}
