package test

import (
	"context"
	"errors"
	"fmt"
	"jelajah-trip-backend/internal/config"
	"jelajah-trip-backend/internal/domain"
	"jelajah-trip-backend/internal/repository"
	"jelajah-trip-backend/internal/usecase"
	"jelajah-trip-backend/pkg/database"
	"os"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

func setupTestDB(t *testing.T) *gorm.DB {
	// Set default test env vars if not present
	if os.Getenv("DB_HOST") == "" {
		os.Setenv("DB_HOST", "localhost")
	}
	if os.Getenv("DB_PORT") == "" {
		os.Setenv("DB_PORT", "5432")
	}
	if os.Getenv("DB_USER") == "" {
		os.Setenv("DB_USER", "postgres")
	}
	if os.Getenv("DB_NAME") == "" {
		os.Setenv("DB_NAME", "jelajah_trip")
	}
	if os.Getenv("DB_SSLMODE") == "" {
		os.Setenv("DB_SSLMODE", "disable")
	}

	db, err := database.ConnectPostgres()
	if err != nil {
		t.Fatalf("Gagal terhubung ke database test PostgreSQL: %v", err)
	}
	return db
}

// =========================================================================
// TEST A: Kuota Atomik (50 request booking paralel pada kuota 10)
// Kriteria Selesai Fase 1 (a)
// =========================================================================
func TestAtomicBookingConcurrency(t *testing.T) {
	db := setupTestDB(t)
	ctx := context.Background()

	tripRepo := repository.NewTripRepository(db)
	bookingRepo := repository.NewBookingRepository(db)
	bookingUsecase := usecase.NewBookingUsecase(bookingRepo, tripRepo)

	// 1. Buat trip uji coba dengan kuota tepat 10
	testTrip := domain.Trip{
		ID:          uuid.New(),
		Title:       "Trip Uji Race Condition Concurrency",
		Destination: "Labuan Bajo Concurrency Test",
		Description: "Paket khusus verifikasi race condition kuota atomik",
		Price:       1500000,
		Duration:    "3D2N",
		Facilities:  []string{"Speedboat", "Hotel", "Makan"},
		Quota:       10, // Kuota awal tepat 10 pax
		ImageURL:    "https://images.unsplash.com/photo-test",
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := tripRepo.Create(ctx, &testTrip); err != nil {
		t.Fatalf("Gagal membuat data trip untuk test concurrency: %v", err)
	}

	// Defer cleanup data trip dan booking terkait setelah test selesai
	defer func() {
		db.Exec("DELETE FROM bookings WHERE trip_id = ?", testTrip.ID)
		db.Exec("DELETE FROM trips WHERE id = ?", testTrip.ID)
	}()

	// 2. Eksekusi 50 request booking paralel secara bersamaan
	const totalConcurrentRequests = 50
	var successCount int64
	var quotaExceededCount int64
	var otherErrorCount int64

	var wg sync.WaitGroup
	startBarrier := make(chan struct{}) // Barrier agar seluruh goroutine mulai tepat bersamaan

	var successfulBookings []*domain.Booking
	var mu sync.Mutex

	for i := 1; i <= totalConcurrentRequests; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()

			// Tunggu sinyal start barrier
			<-startBarrier

			req := domain.CreateBookingRequest{
				TripID:        testTrip.ID.String(),
				CustomerName:  fmt.Sprintf("Peserta Uji %d", idx),
				CustomerEmail: fmt.Sprintf("peserta%d@testrace.com", idx),
				CustomerPhone: fmt.Sprintf("08129999%04d", idx),
				TravelDate:    "2026-12-15",
				Pax:           1, // Masing-masing pesan 1 pax
			}

			b, err := bookingUsecase.Create(ctx, nil, req)
			if err != nil {
				if strings.Contains(err.Error(), "kuota tidak mencukupi") {
					atomic.AddInt64(&quotaExceededCount, 1)
				} else {
					atomic.AddInt64(&otherErrorCount, 1)
					t.Logf("Request %d gagal dengan error tak terduga: %v", idx, err)
				}
			} else {
				atomic.AddInt64(&successCount, 1)
				mu.Lock()
				successfulBookings = append(successfulBookings, b)
				mu.Unlock()
			}
		}(i)
	}

	// Buka barrier untuk memulai 50 goroutine secara serentak
	close(startBarrier)
	wg.Wait()

	t.Logf("=== Hasil 50 Request Paralel pada Kuota 10 ===")
	t.Logf("Booking Sukses: %d", successCount)
	t.Logf("Ditolak Kuota Penuh: %d", quotaExceededCount)
	t.Logf("Error Lain: %d", otherErrorCount)

	// 3. Verifikasi kriteria (a): Tepat 10 berhasil, 40 ditolak, kuota akhir tepat 0
	if successCount != 10 {
		t.Fatalf("Ekspektasi tepat 10 booking sukses, tetapi didapatkan: %d", successCount)
	}

	if quotaExceededCount != 40 {
		t.Fatalf("Ekspektasi tepat 40 request ditolak kuota penuh, tetapi didapatkan: %d", quotaExceededCount)
	}

	if otherErrorCount != 0 {
		t.Fatalf("Ada error lain di luar kuota habis: %d", otherErrorCount)
	}

	// 4. Periksa sisa kuota trip di database tidak negatif (wajib 0)
	tripAfter, err := tripRepo.GetByID(ctx, testTrip.ID)
	if err != nil {
		t.Fatalf("Gagal membaca status trip setelah uji concurrency: %v", err)
	}

	t.Logf("Sisa Kuota di Database: %d", tripAfter.Quota)
	if tripAfter.Quota != 0 {
		t.Fatalf("Sisa kuota trip seharusnya tepat 0 dan tidak boleh negatif, didapatkan: %d", tripAfter.Quota)
	}

	// 5. Uji Pengembalian Kuota saat Status Cancelled (Aturan 1.5)
	if len(successfulBookings) > 0 {
		sampleBooking := successfulBookings[0]
		updatedBooking, err := bookingUsecase.UpdateStatus(ctx, sampleBooking.ID, domain.StatusCancelled)
		if err != nil {
			t.Fatalf("Gagal membatalkan booking: %v", err)
		}
		if updatedBooking.Status != domain.StatusCancelled {
			t.Fatalf("Status booking gagal diubah menjadi cancelled")
		}

		// Periksa kuota bertambah kembali dari 0 menjadi 1
		tripRestored, _ := tripRepo.GetByID(ctx, testTrip.ID)
		t.Logf("Sisa Kuota setelah 1 booking dibatalkan: %d", tripRestored.Quota)
		if tripRestored.Quota != 1 {
			t.Fatalf("Kuota seharusnya dipulihkan menjadi 1 setelah pembatalan, didapatkan: %d", tripRestored.Quota)
		}

		// Uji idempoten/sekali kembalikan kuota: batalkan lagi booking yang sudah cancelled
		_, _ = bookingUsecase.UpdateStatus(ctx, sampleBooking.ID, domain.StatusCancelled)
		tripRestored2, _ := tripRepo.GetByID(ctx, testTrip.ID)
		if tripRestored2.Quota != 1 {
			t.Fatalf("Kuota tidak boleh bertambah dua kali jika dibatalkan ulang, didapatkan: %d", tripRestored2.Quota)
		}
	}
}

// =========================================================================
// TEST B: Hardened Tracking Tiket (Verifikasi Email / 4 Digit Telepon)
// Kriteria Selesai Fase 1 (b)
// =========================================================================
func TestHardenedTracking(t *testing.T) {
	db := setupTestDB(t)
	ctx := context.Background()

	tripRepo := repository.NewTripRepository(db)
	bookingRepo := repository.NewBookingRepository(db)
	bookingUsecase := usecase.NewBookingUsecase(bookingRepo, tripRepo)

	// Buat trip & booking untuk uji tracking
	testTrip := domain.Trip{
		ID:          uuid.New(),
		Title:       "Trip Uji Tracking",
		Destination: "Raja Ampat Tracking Test",
		Description: "Paket uji tracking verifikasi",
		Price:       2000000,
		Duration:    "4D3N",
		Facilities:  []string{"Resort", "Snorkeling"},
		Quota:       5,
		ImageURL:    "https://images.unsplash.com/photo-test-track",
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	_ = tripRepo.Create(ctx, &testTrip)

	defer func() {
		db.Exec("DELETE FROM bookings WHERE trip_id = ?", testTrip.ID)
		db.Exec("DELETE FROM trips WHERE id = ?", testTrip.ID)
	}()

	req := domain.CreateBookingRequest{
		TripID:        testTrip.ID.String(),
		CustomerName:  "Dewi Kartika",
		CustomerEmail: "dewi.kartika@example.com",
		CustomerPhone: "081398765432",
		TravelDate:    "2026-12-20",
		Pax:           2,
	}

	booking, err := bookingUsecase.Create(ctx, nil, req)
	if err != nil {
		t.Fatalf("Gagal membuat booking untuk uji tracking: %v", err)
	}

	t.Logf("Kode booking yang dibuat: %s (Panjang: %d)", booking.BookingCode, len(booking.BookingCode))

	// Verifikasi panjang dan format kode booking (minimal 8 karakter alfanumerik random suffix)
	parts := strings.Split(booking.BookingCode, "-")
	if len(parts) != 3 || len(parts[2]) < 8 {
		t.Fatalf("Format booking code tidak memenuhi standar 8 karakter random suffix: %s", booking.BookingCode)
	}

	// 1. Kasus: Tracking tanpa verifikasi (kosong) -> Wajib Ditolak
	_, err = bookingUsecase.Track(ctx, booking.BookingCode, "")
	if err == nil {
		t.Fatalf("Ekspektasi tracking ditolak jika verifikasi kosong, namun berhasil")
	}
	if !errors.Is(err, domain.ErrGenericVerification) {
		t.Fatalf("Ekspektasi generic error '%v', didapatkan: '%v'", domain.ErrGenericVerification, err)
	}

	// 2. Kasus: Tracking dengan email yang salah -> Wajib Ditolak dengan Generic Error
	_, err = bookingUsecase.Track(ctx, booking.BookingCode, "wrong.email@domain.com")
	if err == nil {
		t.Fatalf("Ekspektasi tracking ditolak jika email salah, namun berhasil")
	}
	if !errors.Is(err, domain.ErrGenericVerification) {
		t.Fatalf("Ekspektasi generic error '%v', didapatkan: '%v'", domain.ErrGenericVerification, err)
	}

	// 3. Kasus: Tracking dengan 4 digit nomor telepon yang salah -> Wajib Ditolak
	_, err = bookingUsecase.Track(ctx, booking.BookingCode, "9999")
	if err == nil {
		t.Fatalf("Ekspektasi tracking ditolak jika 4 digit telepon salah, namun berhasil")
	}
	if !errors.Is(err, domain.ErrGenericVerification) {
		t.Fatalf("Ekspektasi generic error '%v', didapatkan: '%v'", domain.ErrGenericVerification, err)
	}

	// 4. Kasus: Tracking dengan kode yang tidak ada sama sekali -> Generic Error yang sama persis
	_, err = bookingUsecase.Track(ctx, "TRIP-20261118-NONEXIST", "dewi.kartika@example.com")
	if err == nil {
		t.Fatalf("Ekspektasi tracking ditolak jika kode tidak ada, namun berhasil")
	}
	if !errors.Is(err, domain.ErrGenericVerification) {
		t.Fatalf("Ekspektasi generic error '%v', didapatkan: '%v'", domain.ErrGenericVerification, err)
	}

	// 5. Kasus SUKSES A: Tracking dengan email yang cocok (case-insensitive)
	trackedByEmail, err := bookingUsecase.Track(ctx, booking.BookingCode, "DEWI.KARTIKA@EXAMPLE.COM")
	if err != nil {
		t.Fatalf("Tracking dengan email valid gagal: %v", err)
	}
	if trackedByEmail.ID != booking.ID {
		t.Fatalf("Data booking yang ditemukan tidak cocok")
	}
	t.Logf("Tracking berhasil via email: %s", trackedByEmail.CustomerName)

	// 6. Kasus SUKSES B: Tracking dengan 4 digit terakhir nomor telepon (5432 dari 081398765432)
	trackedByPhone4, err := bookingUsecase.Track(ctx, booking.BookingCode, "5432")
	if err != nil {
		t.Fatalf("Tracking dengan 4 digit terakhir telepon (5432) gagal: %v", err)
	}
	if trackedByPhone4.ID != booking.ID {
		t.Fatalf("Data booking yang ditemukan tidak cocok")
	}
	t.Logf("Tracking berhasil via 4 digit no HP (5432): %s", trackedByPhone4.CustomerName)
}

// =========================================================================
// TEST C: Keamanan Konfigurasi Production & Demo Guard
// Kriteria Selesai Fase 1 (c)
// =========================================================================
func TestProductionConfigAndDemoGuard(t *testing.T) {
	// Simpan env asli
	origEnv := os.Getenv("APP_ENV")
	origSecret := os.Getenv("JWT_SECRET")
	defer func() {
		os.Setenv("APP_ENV", origEnv)
		os.Setenv("JWT_SECRET", origSecret)
	}()

	// 1. Uji Validasi Config: Gagal start jika APP_ENV=production dan JWT_SECRET kosong
	os.Setenv("APP_ENV", "production")
	os.Setenv("JWT_SECRET", "")
	_, err := config.Load()
	if err == nil {
		t.Fatalf("Ekspektasi gagal start jika JWT_SECRET kosong saat production")
	}
	t.Logf("Validasi JWT_SECRET kosong di production: %v", err)

	// 2. Uji Validasi Config: Gagal start jika APP_ENV=production dan JWT_SECRET terlalu pendek (< 32 karakter)
	os.Setenv("APP_ENV", "production")
	os.Setenv("JWT_SECRET", "short_secret_key_123")
	_, err = config.Load()
	if err == nil {
		t.Fatalf("Ekspektasi gagal start jika JWT_SECRET < 32 karakter saat production")
	}
	t.Logf("Validasi JWT_SECRET < 32 karakter di production: %v", err)

	// 3. Uji Validasi Config: Berhasil start jika APP_ENV=production dan JWT_SECRET >= 32 karakter
	os.Setenv("APP_ENV", "production")
	os.Setenv("JWT_SECRET", "super_secure_production_jwt_secret_with_32_plus_chars")
	cfg, err := config.Load()
	if err != nil {
		t.Fatalf("Ekspektasi berhasil start dengan secret valid di production, error: %v", err)
	}
	if cfg.AppEnv != "production" {
		t.Fatalf("AppEnv seharusnya 'production', didapatkan: %s", cfg.AppEnv)
	}
	t.Logf("Config berhasil diload untuk production dengan panjang secret %d karakter", len(cfg.JWTSecret))

	// 4. Uji Seeder Guard: database.SeedDatabase tidak melakukan apa-apa saat APP_ENV=production
	db := setupTestDB(t)
	// Catat total trip sebelum seeder dipanggil dengan production
	var tripCountBefore int64
	db.Model(&domain.Trip{}).Count(&tripCountBefore)

	// Panggil seeder dengan "production"
	database.SeedDatabase(db, "production")

	var tripCountAfter int64
	db.Model(&domain.Trip{}).Count(&tripCountAfter)

	if tripCountBefore != tripCountAfter {
		t.Fatalf("Seeder tidak boleh menambah data saat APP_ENV=production! Before: %d, After: %d", tripCountBefore, tripCountAfter)
	}
	t.Logf("Seeder berhasil dilewati dengan aman saat APP_ENV=production")
}

// =========================================================================
// TEST D: Integritas Ulasan (Hanya User dengan Booking Completed)
// Aturan 1.7
// =========================================================================
func TestReviewCompletedBookingRequirement(t *testing.T) {
	db := setupTestDB(t)
	ctx := context.Background()

	tripRepo := repository.NewTripRepository(db)
	bookingRepo := repository.NewBookingRepository(db)
	reviewRepo := repository.NewReviewRepository(db)
	userRepo := repository.NewUserRepository(db)
	reviewUsecase := usecase.NewReviewUsecase(reviewRepo, tripRepo, bookingRepo)

	// Buat user dummy
	testUser := domain.User{
		ID:           uuid.New(),
		Name:         "User Review Tester",
		Email:        fmt.Sprintf("tester_%s@test.com", uuid.New().String()[:8]),
		PasswordHash: "dummyhash",
		Role:         domain.RoleCustomer,
	}
	_ = userRepo.Create(ctx, &testUser)

	// Buat trip dummy
	testTrip := domain.Trip{
		ID:          uuid.New(),
		Title:       "Trip Uji Review",
		Destination: "Bromo Review Test",
		Description: "Paket uji review",
		Price:       750000,
		Duration:    "2D1N",
		Quota:       10,
		ImageURL:    "https://images.unsplash.com/photo-review",
	}
	_ = tripRepo.Create(ctx, &testTrip)

	defer func() {
		db.Exec("DELETE FROM reviews WHERE trip_id = ?", testTrip.ID)
		db.Exec("DELETE FROM bookings WHERE trip_id = ?", testTrip.ID)
		db.Exec("DELETE FROM trips WHERE id = ?", testTrip.ID)
		db.Exec("DELETE FROM users WHERE id = ?", testUser.ID)
	}()

	// 1. User mencoba review padahal belum pernah booking sama sekali -> Wajib Ditolak
	_, err := reviewUsecase.Create(ctx, testUser.ID, domain.CreateReviewRequest{
		TripID:  testTrip.ID.String(),
		Rating:  5,
		Comment: "Pemandangan luar biasa indah!",
	})
	if err == nil {
		t.Fatalf("User tanpa booking completed tidak boleh memberikan ulasan")
	}
	t.Logf("Review tanpa booking ditolak: %v", err)

	// 2. User memiliki booking tetapi statusnya masih 'pending' -> Wajib Ditolak
	bookingID := uuid.New()
	pendingBooking := domain.Booking{
		ID:            bookingID,
		BookingCode:   fmt.Sprintf("TRIP-20261118-%s", uuid.New().String()[:8]),
		UserID:        &testUser.ID,
		TripID:        testTrip.ID,
		CustomerName:  testUser.Name,
		CustomerEmail: testUser.Email,
		CustomerPhone: "081234567890",
		TravelDate:    "2026-12-25",
		Pax:           1,
		TotalPrice:    750000,
		Status:        domain.StatusPending,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}
	_ = bookingRepo.Create(ctx, &pendingBooking)

	_, err = reviewUsecase.Create(ctx, testUser.ID, domain.CreateReviewRequest{
		TripID:  testTrip.ID.String(),
		Rating:  5,
		Comment: "Pemandangan luar biasa!",
	})
	if err == nil {
		t.Fatalf("User dengan booking pending tidak boleh memberikan ulasan")
	}
	t.Logf("Review dengan status booking pending ditolak: %v", err)

	// 3. Ubah status booking: pending -> confirmed -> completed
	_, _ = bookingRepo.UpdateStatusAtomic(ctx, pendingBooking.ID, domain.StatusConfirmed)
	_, _ = bookingRepo.UpdateStatusAtomic(ctx, pendingBooking.ID, domain.StatusCompleted)

	review1, err := reviewUsecase.Create(ctx, testUser.ID, domain.CreateReviewRequest{
		TripID:  testTrip.ID.String(),
		Rating:  5,
		Comment: "Perjalanan sangat menyenangkan dan terorganisir rapi!",
	})
	if err != nil {
		t.Fatalf("Review gagal setelah status booking completed: %v", err)
	}
	t.Logf("Review pertama berhasil dibuat (ID: %s, BookingID: %v)", review1.ID, review1.BookingID)

	// 4. Coba berikan review kedua untuk booking yang sama -> Wajib Ditolak (Maksimal 1 ulasan per booking)
	_, err = reviewUsecase.Create(ctx, testUser.ID, domain.CreateReviewRequest{
		TripID:  testTrip.ID.String(),
		Rating:  4,
		Comment: "Ulasan duplikat yang seharusnya gagal.",
	})
	if err == nil {
		t.Fatalf("Ulasan kedua untuk booking yang sama seharusnya ditolak (maksimal 1 ulasan per booking)")
	}
	t.Logf("Review duplikat untuk booking yang sama berhasil ditolak: %v", err)
}
