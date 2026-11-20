package usecase

import (
	"context"
	"errors"
	"jelajah-trip-backend/internal/domain"
	"strings"
)

type faqUsecase struct {
	faqRepo domain.FAQRepository
}

func NewFAQUsecase(faqRepo domain.FAQRepository) domain.FAQUsecase {
	return &faqUsecase{faqRepo: faqRepo}
}

func (u *faqUsecase) GetAll(ctx context.Context) ([]domain.FAQ, error) {
	return u.faqRepo.GetAll(ctx)
}

func (u *faqUsecase) Create(ctx context.Context, req domain.CreateFAQRequest) (*domain.FAQ, error) {
	req.Question = strings.TrimSpace(req.Question)
	req.Answer = strings.TrimSpace(req.Answer)

	if req.Question == "" || req.Answer == "" {
		return nil, errors.New("pertanyaan dan jawaban wajib diisi")
	}

	faq := domain.FAQ{
		Question: req.Question,
		Answer:   req.Answer,
	}

	if err := u.faqRepo.Create(ctx, &faq); err != nil {
		return nil, errors.New("gagal menambahkan FAQ")
	}

	return &faq, nil
}

func (u *faqUsecase) Delete(ctx context.Context, id uint) error {
	return u.faqRepo.Delete(ctx, id)
}
