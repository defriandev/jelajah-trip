package usecase

import (
	"context"
	"crypto/rand"
	"errors"
	"fmt"
	"jelajah-trip-backend/internal/domain"
	"strings"
	"time"

	"github.com/google/uuid"
)

type bookingUsecase struct {
	bookingRepo domain.BookingRepository
	tripRepo    domain.TripRepository
}

func NewBookingUsecase(bookingRepo domain.BookingRepository, tripRepo domain.TripRepository) domain.BookingUsecase {
	return &bookingUsecase{
		bookingRepo: bookingRepo,
		tripRepo:    tripRepo,
	}
}

func (u *bookingUsecase) Create(ctx context.Context, userID *uuid.UUID, req domain.CreateBookingRequest) (*domain.Booking, error) {
	req.CustomerName = strings.TrimSpace(req.CustomerName)
	req.CustomerEmail = strings.TrimSpace(strings.ToLower(req.CustomerEmail))
	req.CustomerPhone = strings.TrimSpace(req.CustomerPhone)
	req.TravelDate = strings.TrimSpace(req.TravelDate)

	if req.CustomerName == "" || req.CustomerEmail == "" || req.CustomerPhone == "" || req.TravelDate == "" {
		return nil, errors.New("nama lengkap, email, nomor telepon/whatsapp, dan tanggal keberangkatan wajib diisi")
	}

	if req.Pax <= 0 {
		return nil, errors.New("jumlah peserta (pax) minimal 1 orang")
	}

	tripID, err := uuid.Parse(req.TripID)
	if err != nil {
		return nil, errors.New("ID paket trip tidak valid")
	}

	trip, err := u.tripRepo.GetByID(ctx, tripID)
	if err != nil {
		return nil, errors.New("paket trip yang dipilih tidak ditemukan")
	}

	// Aturan 1.5: total_price dihitung di server dari harga trip x pax (abaikan harga dari client)
	totalPrice := trip.Price * float64(req.Pax)

	// Aturan 1.4: Kode booking minimal 8 karakter acak alfanumerik dari crypto/rand dengan retry jika terjadi tabrakan
	bookingCode, err := u.generateUniqueBookingCode(ctx)
	if err != nil {
		return nil, errors.New("gagal menghasilkan kode booking unik")
	}

	booking := domain.Booking{
		ID:            uuid.New(),
		BookingCode:   bookingCode,
		UserID:        userID,
		TripID:        tripID,
		CustomerName:  req.CustomerName,
		CustomerEmail: req.CustomerEmail,
		CustomerPhone: req.CustomerPhone,
		TravelDate:    req.TravelDate,
		Pax:           req.Pax,
		TotalPrice:    totalPrice,
		Status:        domain.StatusPending,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
		Trip:          trip,
	}

	// Aturan 1.5: Pembuatan booking harus dalam satu transaksi DB secara atomik
	if err := u.bookingRepo.CreateAtomic(ctx, &booking); err != nil {
		if errors.Is(err, domain.ErrQuotaInsufficient) {
			return nil, fmt.Errorf("kuota tidak mencukupi untuk pemesanan %d pax", req.Pax)
		}
		return nil, errors.New("gagal menyimpan pesanan")
	}

	return &booking, nil
}

// Track memvalidasi pelacakan tiket berdasarkan booking_code + (customer_email ATAU 4 digit terakhir nomor telepon).
// Respons error selalu generik tanpa membedakan kesalahan kode vs email/telepon.
func (u *bookingUsecase) Track(ctx context.Context, code string, verification string) (*domain.Booking, error) {
	code = strings.TrimSpace(code)
	verification = strings.TrimSpace(verification)
	if code == "" || verification == "" {
		return nil, domain.ErrGenericVerification
	}

	return u.bookingRepo.GetByCodeAndVerification(ctx, code, verification)
}

func (u *bookingUsecase) GetByCode(ctx context.Context, code string) (*domain.Booking, error) {
	code = strings.TrimSpace(code)
	if code == "" {
		return nil, errors.New("kode booking wajib diisi")
	}
	return u.bookingRepo.GetByCode(ctx, code)
}

func (u *bookingUsecase) GetByUserID(ctx context.Context, userID uuid.UUID, pagination domain.PaginationParams) ([]domain.Booking, *domain.Meta, error) {
	if pagination.Page < 1 {
		pagination.Page = 1
	}
	if pagination.Limit < 1 {
		pagination.Limit = 10
	} else if pagination.Limit > 100 {
		pagination.Limit = 100
	}

	bookings, total, err := u.bookingRepo.GetByUserID(ctx, userID, pagination)
	if err != nil {
		return nil, nil, err
	}

	meta := domain.CalculateMeta(total, pagination.Page, pagination.Limit)
	return bookings, meta, nil
}

func (u *bookingUsecase) GetAll(ctx context.Context, filter domain.BookingFilter) ([]domain.Booking, *domain.Meta, error) {
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.Limit < 1 {
		filter.Limit = 10
	} else if filter.Limit > 100 {
		filter.Limit = 100
	}

	bookings, total, err := u.bookingRepo.GetAll(ctx, filter)
	if err != nil {
		return nil, nil, err
	}

	meta := domain.CalculateMeta(total, filter.Page, filter.Limit)
	return bookings, meta, nil
}

func (u *bookingUsecase) UpdateStatus(ctx context.Context, id uuid.UUID, status domain.BookingStatus) (*domain.Booking, error) {
	validStatuses := map[domain.BookingStatus]bool{
		domain.StatusPending:   true,
		domain.StatusConfirmed: true,
		domain.StatusCancelled: true,
		domain.StatusCompleted: true,
	}

	if !validStatuses[status] {
		return nil, errors.New("status pesanan tidak valid")
	}

	// Aturan 1.5: Saat booking berstatus cancelled, kuota dikembalikan (di transaksi yang sama, dan hanya sekali)
	booking, err := u.bookingRepo.UpdateStatusAtomic(ctx, id, status)
	if err != nil {
		return nil, err
	}

	return booking, nil
}

func (u *bookingUsecase) GetStats(ctx context.Context) (*domain.DashboardStats, error) {
	totalBookings, totalRevenue, pendingBookings, err := u.bookingRepo.GetStats(ctx)
	if err != nil {
		return nil, err
	}

	totalTrips, err := u.tripRepo.Count(ctx)
	if err != nil {
		return nil, err
	}

	return &domain.DashboardStats{
		TotalBookings:   totalBookings,
		TotalRevenue:    totalRevenue,
		TotalTrips:      totalTrips,
		PendingBookings: pendingBookings,
	}, nil
}

// generateUniqueBookingCode membuat kode booking acak aman dengan 8 karakter alfanumerik dari crypto/rand.
func (u *bookingUsecase) generateUniqueBookingCode(ctx context.Context) (string, error) {
	const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	dateStr := time.Now().Format("20060102")

	for i := 0; i < 10; i++ {
		bytes := make([]byte, 8)
		if _, err := rand.Read(bytes); err != nil {
			return "", err
		}

		suffix := make([]byte, 8)
		for j, b := range bytes {
			suffix[j] = charset[int(b)%len(charset)]
		}

		code := fmt.Sprintf("TRIP-%s-%s", dateStr, string(suffix))

		// Cek apakah kode sudah terpakai
		existing, _ := u.bookingRepo.GetByCode(ctx, code)
		if existing == nil {
			return code, nil
		}
	}

	return "", errors.New("gagal menghasilkan kode booking unik setelah beberapa percobaan")
}
