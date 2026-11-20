package repository

import (
	"context"
	"errors"
	"fmt"
	"jelajah-trip-backend/internal/domain"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type bookingRepository struct {
	db *gorm.DB
}

func NewBookingRepository(db *gorm.DB) domain.BookingRepository {
	return &bookingRepository{db: db}
}

func (r *bookingRepository) Create(ctx context.Context, booking *domain.Booking) error {
	return r.db.WithContext(ctx).Create(booking).Error
}

// CreateAtomic melakukan pembuatan pesanan dan pengurangan kuota dalam satu transaksi atomik.
// Jika kuota tidak mencukupi (RowsAffected == 0), transaksi di-rollback dan mengembalikan domain.ErrQuotaInsufficient.
func (r *bookingRepository) CreateAtomic(ctx context.Context, booking *domain.Booking) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 1. Kurangi kuota trip secara atomik
		res := tx.Exec("UPDATE trips SET quota = quota - ? WHERE id = ? AND quota >= ?", booking.Pax, booking.TripID, booking.Pax)
		if res.Error != nil {
			return res.Error
		}
		if res.RowsAffected == 0 {
			return domain.ErrQuotaInsufficient
		}

		// 2. Simpan record booking
		if err := tx.Create(booking).Error; err != nil {
			return err
		}

		return nil
	})
}

func (r *bookingRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.Booking, error) {
	var booking domain.Booking
	err := r.db.WithContext(ctx).
		Preload("Trip", func(db *gorm.DB) *gorm.DB { return db.Unscoped() }).
		Preload("User").
		First(&booking, "id = ?", id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("pesanan tidak ditemukan")
		}
		return nil, err
	}
	return &booking, nil
}

func (r *bookingRepository) GetByCode(ctx context.Context, code string) (*domain.Booking, error) {
	var booking domain.Booking
	err := r.db.WithContext(ctx).
		Preload("Trip", func(db *gorm.DB) *gorm.DB { return db.Unscoped() }).
		Preload("User").
		First(&booking, "UPPER(booking_code) = UPPER(?)", code).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domain.ErrGenericVerification
		}
		return nil, err
	}
	return &booking, nil
}

// GetByCodeAndVerification memvalidasi booking code dan (email ATAU 4 digit terakhir nomor telepon).
// Mengembalikan generic error yang sama jika tidak ditemukan atau jika verifikasi gagal.
func (r *bookingRepository) GetByCodeAndVerification(ctx context.Context, code string, verification string) (*domain.Booking, error) {
	code = strings.TrimSpace(code)
	verification = strings.TrimSpace(verification)
	if code == "" || verification == "" {
		return nil, domain.ErrGenericVerification
	}

	var booking domain.Booking
	err := r.db.WithContext(ctx).
		Preload("Trip", func(db *gorm.DB) *gorm.DB { return db.Unscoped() }).
		Preload("User").
		First(&booking, "UPPER(booking_code) = UPPER(?)", code).Error
	if err != nil {
		return nil, domain.ErrGenericVerification
	}

	// 1. Cek kecocokan Email (case-insensitive)
	if strings.EqualFold(strings.TrimSpace(booking.CustomerEmail), verification) {
		return &booking, nil
	}

	// 2. Cek kecocokan 4 digit terakhir nomor telepon
	digitRegex := regexp.MustCompile(`\D`)
	phoneDigits := digitRegex.ReplaceAllString(booking.CustomerPhone, "")
	verifDigits := digitRegex.ReplaceAllString(verification, "")

	if len(verifDigits) == 4 && len(phoneDigits) >= 4 {
		if strings.HasSuffix(phoneDigits, verifDigits) {
			return &booking, nil
		}
	}

	// Jika verifikasi input nomor telepon lengkap yang cocok
	if verifDigits != "" && phoneDigits != "" && (verifDigits == phoneDigits || strings.HasSuffix(phoneDigits, verifDigits)) {
		return &booking, nil
	}

	return nil, domain.ErrGenericVerification
}

func (r *bookingRepository) GetByUserID(ctx context.Context, userID uuid.UUID, pagination domain.PaginationParams) ([]domain.Booking, int64, error) {
	var bookings []domain.Booking
	var total int64

	query := r.db.WithContext(ctx).Model(&domain.Booking{}).Where("user_id = ?", userID)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	page, limit, orderClause, err := domain.SanitizePagination(&pagination, 10, domain.GetAllowedBookingSortColumns(), "created_at", "desc")
	if err != nil {
		page = 1
		limit = 10
		orderClause = "created_at DESC"
	}

	offset := (page - 1) * limit
	err = query.
		Preload("Trip", func(db *gorm.DB) *gorm.DB { return db.Unscoped() }).
		Order(orderClause).
		Limit(limit).
		Offset(offset).
		Find(&bookings).Error

	return bookings, total, err
}

func (r *bookingRepository) GetAll(ctx context.Context, filter domain.BookingFilter) ([]domain.Booking, int64, error) {
	var bookings []domain.Booking
	var total int64

	query := r.db.WithContext(ctx).Model(&domain.Booking{})

	if filter.Status != "" && filter.Status != "all" && filter.Status != "Semua" {
		query = query.Where("status = ?", filter.Status)
	}

	if filter.Search != "" {
		searchTerm := "%" + strings.ToLower(filter.Search) + "%"
		query = query.Where(
			"LOWER(booking_code) LIKE ? OR LOWER(customer_name) LIKE ? OR LOWER(customer_email) LIKE ? OR customer_phone LIKE ?",
			searchTerm, searchTerm, searchTerm, "%"+filter.Search+"%",
		)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	page, limit, orderClause, err := domain.SanitizePagination(&filter.PaginationParams, 10, domain.GetAllowedBookingSortColumns(), "created_at", "desc")
	if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	err = query.
		Preload("Trip", func(db *gorm.DB) *gorm.DB { return db.Unscoped() }).
		Preload("User").
		Order(orderClause).
		Limit(limit).
		Offset(offset).
		Find(&bookings).Error

	return bookings, total, err
}

func (r *bookingRepository) CountByTripID(ctx context.Context, tripID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&domain.Booking{}).Where("trip_id = ?", tripID).Count(&count).Error
	return count, err
}

func (r *bookingRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status domain.BookingStatus) error {
	_, err := r.UpdateStatusAtomic(ctx, id, status)
	return err
}

// State Machine Transisi Status Booking
var validTransitions = map[domain.BookingStatus][]domain.BookingStatus{
	domain.StatusPending:   {domain.StatusConfirmed, domain.StatusCancelled},
	domain.StatusConfirmed: {domain.StatusCompleted, domain.StatusCancelled},
	domain.StatusCancelled: {domain.StatusPending, domain.StatusConfirmed}, // Reaktivasi
	domain.StatusCompleted: {},                                             // Terminal State (tidak boleh berubah lagi)
}

func isValidTransition(from, to domain.BookingStatus) bool {
	allowed, exists := validTransitions[from]
	if !exists {
		return false
	}
	for _, s := range allowed {
		if s == to {
			return true
		}
	}
	return false
}

// UpdateStatusAtomic mengupdate status pesanan secara atomik dalam transaksi DB dengan state machine yang ketat.
// Reaktivasi dari 'cancelled' wajib mengurangi kuota secara atomik atau ditolak jika kuota habis.
func (r *bookingRepository) UpdateStatusAtomic(ctx context.Context, id uuid.UUID, status domain.BookingStatus) (*domain.Booking, error) {
	var booking domain.Booking
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 1. Kunci baris pemesanan
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Preload("Trip").First(&booking, "id = ?", id).Error; err != nil {
			return err
		}

		currentStatus := booking.Status

		// 2. Cek apakah status sama persis
		if currentStatus == status {
			return fmt.Errorf("status pesanan sudah '%s'", currentStatus)
		}

		// 3. Validasi State Machine
		if !isValidTransition(currentStatus, status) {
			return fmt.Errorf("transisi status tidak valid dari '%s' ke '%s'", currentStatus, status)
		}

		// 4. Perubahan Kuota Atomik:
		// Kasus A: Pembatalan (pending/confirmed -> cancelled) -> Kembalikan kuota
		if status == domain.StatusCancelled && currentStatus != domain.StatusCancelled {
			res := tx.Exec("UPDATE trips SET quota = quota + ? WHERE id = ?", booking.Pax, booking.TripID)
			if res.Error != nil {
				return res.Error
			}
		}

		// Kasus B: Reaktivasi (cancelled -> pending/confirmed) -> Kurangi kuota secara atomik
		if currentStatus == domain.StatusCancelled && (status == domain.StatusPending || status == domain.StatusConfirmed) {
			res := tx.Exec("UPDATE trips SET quota = quota - ? WHERE id = ? AND quota >= ?", booking.Pax, booking.TripID, booking.Pax)
			if res.Error != nil {
				return res.Error
			}
			if res.RowsAffected == 0 {
				return fmt.Errorf("kuota tidak mencukupi untuk mengaktifkan kembali pesanan (%d pax)", booking.Pax)
			}
		}

		booking.Status = status
		booking.UpdatedAt = time.Now()
		return tx.Save(&booking).Error
	})
	if err != nil {
		return nil, err
	}
	return &booking, nil
}

func (r *bookingRepository) GetStats(ctx context.Context) (totalBookings int64, totalRevenue float64, pendingBookings int64, err error) {
	err = r.db.WithContext(ctx).Model(&domain.Booking{}).Count(&totalBookings).Error
	if err != nil {
		return
	}

	row := r.db.WithContext(ctx).Model(&domain.Booking{}).
		Where("status IN ?", []domain.BookingStatus{domain.StatusConfirmed, domain.StatusCompleted}).
		Select("COALESCE(SUM(total_price), 0)").Row()
	err = row.Scan(&totalRevenue)
	if err != nil {
		return
	}

	err = r.db.WithContext(ctx).Model(&domain.Booking{}).
		Where("status = ?", domain.StatusPending).
		Count(&pendingBookings).Error
	return
}

// FindEligibleCompletedBooking mencari pesanan user untuk trip tertentu yang sudah berstatus 'completed'
// dan belum pernah memiliki ulasan.
func (r *bookingRepository) FindEligibleCompletedBooking(ctx context.Context, userID, tripID uuid.UUID) (*domain.Booking, error) {
	var booking domain.Booking
	err := r.db.WithContext(ctx).
		Table("bookings").
		Select("bookings.*").
		Joins("LEFT JOIN reviews ON reviews.booking_id = bookings.id").
		Where("bookings.user_id = ? AND bookings.trip_id = ? AND bookings.status = ? AND reviews.id IS NULL",
			userID, tripID, domain.StatusCompleted).
		Order("bookings.created_at ASC").
		First(&booking).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domain.ErrReviewNotEligible
		}
		return nil, err
	}
	return &booking, nil
}

// LinkGuestBookings menautkan booking guest terdahulu dengan email yang sama ke akun pengguna yang baru mendaftar/login
func (r *bookingRepository) LinkGuestBookings(ctx context.Context, userID uuid.UUID, email string) error {
	email = strings.TrimSpace(strings.ToLower(email))
	if email == "" {
		return nil
	}
	return r.db.WithContext(ctx).Model(&domain.Booking{}).
		Where("LOWER(customer_email) = ? AND user_id IS NULL", email).
		Update("user_id", userID).Error
}

// GetAllForExport mengambil data booking untuk keperluan ekspor tanpa dibatasi limit halaman (maksimal 10.000 baris)
func (r *bookingRepository) GetAllForExport(ctx context.Context, filter domain.BookingFilter) ([]domain.Booking, error) {
	var bookings []domain.Booking
	query := r.db.WithContext(ctx).Model(&domain.Booking{})

	if filter.Status != "" && filter.Status != "all" && filter.Status != "Semua" {
		query = query.Where("status = ?", filter.Status)
	}

	if filter.Search != "" {
		searchTerm := "%" + strings.ToLower(filter.Search) + "%"
		query = query.Where(
			"LOWER(booking_code) LIKE ? OR LOWER(customer_name) LIKE ? OR LOWER(customer_email) LIKE ? OR customer_phone LIKE ?",
			searchTerm, searchTerm, searchTerm, "%"+filter.Search+"%",
		)
	}

	err := query.
		Preload("Trip", func(db *gorm.DB) *gorm.DB { return db.Unscoped() }).
		Preload("User").
		Order("created_at DESC").
		Limit(10000).
		Find(&bookings).Error

	return bookings, err
}
