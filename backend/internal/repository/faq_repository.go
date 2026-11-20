package repository

import (
	"context"
	"jelajah-trip-backend/internal/domain"

	"gorm.io/gorm"
)

type faqRepository struct {
	db *gorm.DB
}

func NewFAQRepository(db *gorm.DB) domain.FAQRepository {
	return &faqRepository{db: db}
}

func (r *faqRepository) Create(ctx context.Context, faq *domain.FAQ) error {
	return r.db.WithContext(ctx).Create(faq).Error
}

func (r *faqRepository) GetAll(ctx context.Context) ([]domain.FAQ, error) {
	var faqs []domain.FAQ
	err := r.db.WithContext(ctx).Order("id ASC").Find(&faqs).Error
	return faqs, err
}

func (r *faqRepository) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&domain.FAQ{}, "id = ?", id).Error
}
