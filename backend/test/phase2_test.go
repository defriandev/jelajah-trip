package test

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"jelajah-trip-backend/internal/domain"
	"jelajah-trip-backend/internal/repository"
	"jelajah-trip-backend/internal/usecase"
	"jelajah-trip-backend/pkg/database"
	"net/http/httptest"
	"net/url"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	_ "github.com/lib/pq"
	"github.com/golang-jwt/jwt/v5"
	"github.com/xuri/excelize/v2"
)

// =========================================================================
// 1. TEST: Database CHECK Constraints & Data Integrity (Defense in Depth)
// =========================================================================
func TestDatabaseCheckConstraints(t *testing.T) {
	db := setupTestDB(t)

	// A. Quota negatif pada trips harus ditolak DB
	tripID := uuid.New()
	errQuota := db.Exec(`INSERT INTO trips (id, title, destination, description, price, duration, quota, image_url, created_at, updated_at)
		VALUES (?, 'Trip Check Quota', 'Bali', 'Test Quota', 500000, '2D1N', -5, 'http://test', NOW(), NOW())`, tripID).Error
	if errQuota == nil {
		t.Fatalf("Ekspektasi database menolak quota negatif (-5), namun berhasil disimpan")
	}
	t.Logf("Sukses: Quota negatif ditolak oleh CHECK constraint DB: %v", errQuota)

	// B. Pax di luar rentang 1..50 pada bookings harus ditolak DB
	validTrip := domain.Trip{
		ID:          uuid.New(),
		Title:       "Trip Valid Pax",
		Destination: "Lombok",
		Description: "Uji batasan pax",
		Price:       1000000,
		Duration:    "3D2N",
		Quota:       10,
		ImageURL:    "http://test.jpg",
	}
	_ = db.Create(&validTrip).Error
	defer db.Exec("DELETE FROM trips WHERE id = ?", validTrip.ID)

	errPaxZero := db.Exec(`INSERT INTO bookings (id, booking_code, trip_id, customer_name, customer_email, customer_phone, travel_date, pax, total_price, status, created_at, updated_at)
		VALUES (?, 'TRIP-CHK-PAX0', ?, 'Budi', 'budi@test.com', '08123456789', '2026-12-25', 0, 0, 'pending', NOW(), NOW())`,
		uuid.New(), validTrip.ID).Error
	if errPaxZero == nil {
		t.Fatalf("Ekspektasi database menolak pax = 0, namun berhasil disimpan")
	}
	t.Logf("Sukses: Pax = 0 ditolak oleh CHECK constraint DB: %v", errPaxZero)

	errPax51 := db.Exec(`INSERT INTO bookings (id, booking_code, trip_id, customer_name, customer_email, customer_phone, travel_date, pax, total_price, status, created_at, updated_at)
		VALUES (?, 'TRIP-CHK-PAX51', ?, 'Budi', 'budi@test.com', '08123456789', '2026-12-25', 51, 51000000, 'pending', NOW(), NOW())`,
		uuid.New(), validTrip.ID).Error
	if errPax51 == nil {
		t.Fatalf("Ekspektasi database menolak pax = 51 (> 50), namun berhasil disimpan")
	}
	t.Logf("Sukses: Pax = 51 ditolak oleh CHECK constraint DB: %v", errPax51)

	// C. Total price negatif pada bookings harus ditolak DB
	errTotalPrice := db.Exec(`INSERT INTO bookings (id, booking_code, trip_id, customer_name, customer_email, customer_phone, travel_date, pax, total_price, status, created_at, updated_at)
		VALUES (?, 'TRIP-CHK-NEGPR', ?, 'Budi', 'budi@test.com', '08123456789', '2026-12-25', 2, -100000, 'pending', NOW(), NOW())`,
		uuid.New(), validTrip.ID).Error
	if errTotalPrice == nil {
		t.Fatalf("Ekspektasi database menolak total_price negatif, namun berhasil disimpan")
	}
	t.Logf("Sukses: Total price negatif ditolak oleh CHECK constraint DB: %v", errTotalPrice)

	// D. Status booking invalid harus ditolak DB
	errInvalidStatus := db.Exec(`INSERT INTO bookings (id, booking_code, trip_id, customer_name, customer_email, customer_phone, travel_date, pax, total_price, status, created_at, updated_at)
		VALUES (?, 'TRIP-CHK-INVST', ?, 'Budi', 'budi@test.com', '08123456789', '2026-12-25', 1, 1000000, 'invalid_status_xyz', NOW(), NOW())`,
		uuid.New(), validTrip.ID).Error
	if errInvalidStatus == nil {
		t.Fatalf("Ekspektasi database menolak status tidak valid, namun berhasil disimpan")
	}
	t.Logf("Sukses: Status tidak valid ditolak oleh CHECK constraint DB: %v", errInvalidStatus)

	// E. Rating review di luar rentang 1..5 harus ditolak DB
	errRating := db.Exec(`INSERT INTO reviews (id, trip_id, rating, comment, created_at)
		VALUES (?, ?, 6, 'Rating melebihi 5', NOW())`, uuid.New(), validTrip.ID).Error
	if errRating == nil {
		t.Fatalf("Ekspektasi database menolak rating review = 6, namun berhasil disimpan")
	}
	t.Logf("Sukses: Rating 6 ditolak oleh CHECK constraint DB: %v", errRating)

	// F. Role user invalid harus ditolak DB
	errRole := db.Exec(`INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at)
		VALUES (?, 'Hacker', 'hacker@test.com', 'hash', 'superadmin_unauthorized', NOW(), NOW())`, uuid.New()).Error
	if errRole == nil {
		t.Fatalf("Ekspektasi database menolak role tidak valid, namun berhasil disimpan")
	}
	t.Logf("Sukses: Role tidak valid ditolak oleh CHECK constraint DB: %v", errRole)
}

// =========================================================================
// 2. TEST: Soft Delete Trips & Unscoped Preload Pada Bookings
// =========================================================================
func TestSoftDeleteTripWithBookings(t *testing.T) {
	db := setupTestDB(t)
	app, _, bookingRepo, tripRepo := setupTestApp(t, db)
	ctx := context.Background()

	// 1. Buat trip baru
	trip := domain.Trip{
		ID:          uuid.New(),
		Title:       "Trip Soft Delete Test",
		Destination: "Wakatobi",
		Description: "Paket uji soft delete",
		Price:       3500000,
		Duration:    "4D3N",
		Quota:       10,
		ImageURL:    "http://test-softdelete.jpg",
	}
	_ = tripRepo.Create(ctx, &trip)

	// 2. Buat booking yang mengikat trip ini
	booking := domain.Booking{
		ID:            uuid.New(),
		BookingCode:   fmt.Sprintf("TRIP-SD-%06d", time.Now().UnixNano()%1000000),
		TripID:        trip.ID,
		CustomerName:  "Pelancong Setia",
		CustomerEmail: "setia@pelancong.com",
		CustomerPhone: "081234567890",
		TravelDate:    "2026-12-30",
		Pax:           2,
		TotalPrice:    7000000,
		Status:        domain.StatusConfirmed,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}
	_ = db.Create(&booking).Error
	defer func() {
		db.Exec("DELETE FROM bookings WHERE trip_id = ?", trip.ID)
		db.Unscoped().Exec("DELETE FROM trips WHERE id = ?", trip.ID)
	}()

	// 3. Verifikasi: Trip yang memiliki pesanan tidak boleh di-hard delete permanen
	hasBookings, _ := tripRepo.HasBookings(ctx, trip.ID)
	if !hasBookings {
		t.Fatalf("Ekspektasi trip terdeteksi memiliki pemesanan")
	}

	// 4. Lakukan Soft Delete
	now := time.Now()
	errSoftDel := db.Model(&domain.Trip{}).Where("id = ?", trip.ID).Update("deleted_at", now).Error
	if errSoftDel != nil {
		t.Fatalf("Gagal melakukan soft delete trip: %v", errSoftDel)
	}

	// 5. Verifikasi: Trip tidak muncul pada query katalog standar (deleted_at IS NULL)
	var activeTrips []domain.Trip
	db.Where("id = ?", trip.ID).Find(&activeTrips)
	if len(activeTrips) > 0 {
		t.Fatalf("Trip yang telah di-soft delete seharusnya tidak muncul pada query standar")
	}
	t.Logf("Sukses: Trip berhasil disembunyikan dari katalog setelah soft delete")

	// 6. Verifikasi: Booking lama tetap bisa menampilkan data trip-nya melalui Unscoped Preload
	fetchedBooking, err := bookingRepo.GetByID(ctx, booking.ID)
	if err != nil {
		t.Fatalf("Gagal mengambil booking: %v", err)
	}
	if fetchedBooking.Trip == nil || fetchedBooking.Trip.Title != trip.Title {
		t.Fatalf("Ekspektasi booking lama tetap memuat data trip via Unscoped Preload, didapatkan: %+v", fetchedBooking.Trip)
	}
	t.Logf("Sukses: Booking lama tetap dapat menampilkan detail trip yang telah diarsipkan (Trip: %s)", fetchedBooking.Trip.Title)

	// 7. Verifikasi via HTTP API Track Booking
	trackURL := fmt.Sprintf("/api/v1/bookings/track?code=%s&verification=%s", booking.BookingCode, booking.CustomerEmail)
	req := httptest.NewRequest("GET", trackURL, nil)
	resp, _ := app.Test(req, -1)
	if resp.StatusCode != 200 {
		t.Fatalf("Ekspektasi tracking booking dengan trip terarsip berhasil (200), didapatkan: %d", resp.StatusCode)
	}

	var trackBody struct {
		Success bool `json:"success"`
		Data    struct {
			Trip *domain.Trip `json:"trip"`
		} `json:"data"`
	}
	body, _ := io.ReadAll(resp.Body)
	_ = json.Unmarshal(body, &trackBody)
	if trackBody.Data.Trip == nil || trackBody.Data.Trip.Title != trip.Title {
		t.Fatalf("Data trip pada response tracking kosong atau tidak cocok: %s", string(body))
	}
	t.Logf("Sukses: Endpoint tracking mengembalikan data trip arsip secara transparan")
}

// =========================================================================
// 3. TEST: Server-Side Pagination & Column Whitelist Sorting
// =========================================================================
func TestServerSidePaginationAndSorting(t *testing.T) {
	db := setupTestDB(t)
	app, _, _, _ := setupTestApp(t, db)

	// A. Uji Pagination Limit Normal (12 item per halaman)
	req1 := httptest.NewRequest("GET", "/api/v1/trips?page=1&limit=5", nil)
	resp1, _ := app.Test(req1, -1)
	if resp1.StatusCode != 200 {
		t.Fatalf("Ekspektasi status 200 untuk get trips paginated, didapat: %d", resp1.StatusCode)
	}

	var parsedResp struct {
		Success bool          `json:"success"`
		Data    []domain.Trip `json:"data"`
		Meta    domain.Meta   `json:"meta"`
	}
	body1, _ := io.ReadAll(resp1.Body)
	_ = json.Unmarshal(body1, &parsedResp)

	if !parsedResp.Success {
		t.Fatalf("Ekspektasi success = true pada respon")
	}
	if parsedResp.Meta.Limit != 5 || parsedResp.Meta.Page != 1 {
		t.Fatalf("Meta pagination tidak sesuai: %+v", parsedResp.Meta)
	}
	if parsedResp.Meta.Total < 1 {
		t.Fatalf("Ekspektasi total data > 0")
	}
	t.Logf("Sukses Pagination: Total=%d, TotalPages=%d, Page=%d, Limit=%d, DataCount=%d",
		parsedResp.Meta.Total, parsedResp.Meta.TotalPages, parsedResp.Meta.Page, parsedResp.Meta.Limit, len(parsedResp.Data))

	// B. Uji Pagination Batas Maksimum Limit (Maksimum 100)
	reqLimit := httptest.NewRequest("GET", "/api/v1/trips?page=1&limit=500", nil)
	respLimit, _ := app.Test(reqLimit, -1)
	var parsedLimit struct {
		Meta domain.Meta `json:"meta"`
	}
	bodyLimit, _ := io.ReadAll(respLimit.Body)
	_ = json.Unmarshal(bodyLimit, &parsedLimit)
	if parsedLimit.Meta.Limit > 100 {
		t.Fatalf("Ekspektasi limit dibatasi maksimal 100, didapatkan: %d", parsedLimit.Meta.Limit)
	}
	t.Logf("Sukses: Request limit=500 dibatasi aman ke %d", parsedLimit.Meta.Limit)

	// C. Uji SQL Injection pada Parameter Sort (Whitelist Protection)
	sqlInjectionSort := url.QueryEscape("price; DROP TABLE users;--")
	reqInjection := httptest.NewRequest("GET", fmt.Sprintf("/api/v1/trips?sort=%s", sqlInjectionSort), nil)
	respInjection, _ := app.Test(reqInjection, -1)

	bodyInj, _ := io.ReadAll(respInjection.Body)
	if respInjection.StatusCode != 400 {
		t.Fatalf("Ekspektasi error 400 VALIDATION_ERROR untuk sort column ilegal, didapatkan HTTP %d: %s",
			respInjection.StatusCode, string(bodyInj))
	}

	var errorResp struct {
		Success bool `json:"success"`
		Error   struct {
			Code    string `json:"code"`
			Message string `json:"message"`
		} `json:"error"`
	}
	_ = json.Unmarshal(bodyInj, &errorResp)
	if errorResp.Error.Code != "VALIDATION_ERROR" {
		t.Fatalf("Ekspektasi error code VALIDATION_ERROR, didapatkan: %s", errorResp.Error.Code)
	}
	t.Logf("Sukses: Upaya SQL Injection pada sort column berhasil dicegat dengan aman: %+v", errorResp.Error)
}

// =========================================================================
// 4. TEST: Health (Liveness) & Ready (Readiness DB Ping)
// =========================================================================
func TestHealthAndReadyEndpoints(t *testing.T) {
	db := setupTestDB(t)
	sqlDB, _ := db.DB()
	app, _, _, _ := setupTestApp(t, db)

	// A. Health check (Liveness)
	reqHealth := httptest.NewRequest("GET", "/health", nil)
	respHealth, _ := app.Test(reqHealth, -1)
	if respHealth.StatusCode != 200 {
		t.Fatalf("Ekspektasi status 200 untuk /health, didapatkan: %d", respHealth.StatusCode)
	}
	bodyHealth, _ := io.ReadAll(respHealth.Body)
	if !strings.Contains(string(bodyHealth), `"status":"ok"`) {
		t.Fatalf("Respon /health tidak memuat status ok: %s", string(bodyHealth))
	}
	t.Logf("Sukses: /health mengembalikan status 200 OK: %s", string(bodyHealth))

	// B. Ready check (Readiness dengan DB aktif)
	reqReady := httptest.NewRequest("GET", "/ready", nil)
	respReady, _ := app.Test(reqReady, -1)
	if respReady.StatusCode != 200 {
		t.Fatalf("Ekspektasi status 200 untuk /ready saat DB terhubung, didapatkan: %d", respReady.StatusCode)
	}
	bodyReady, _ := io.ReadAll(respReady.Body)
	if !strings.Contains(string(bodyReady), `"status":"ready"`) {
		t.Fatalf("Respon /ready tidak memuat status ready: %s", string(bodyReady))
	}
	t.Logf("Sukses: /ready mengembalikan status 200 Ready: %s", string(bodyReady))

	_ = sqlDB
}

// =========================================================================
// 5. TEST: OpenAPI 3 Documentation Endpoint
// =========================================================================
func TestOpenAPIDocumentationEndpoint(t *testing.T) {
	db := setupTestDB(t)
	app, _, _, _ := setupTestApp(t, db)

	// GET /docs harus menyajikan Swagger UI HTML
	reqDocs := httptest.NewRequest("GET", "/docs", nil)
	respDocs, _ := app.Test(reqDocs, -1)
	if respDocs.StatusCode != 200 {
		t.Fatalf("Ekspektasi status 200 untuk /docs di environment non-production, didapatkan: %d", respDocs.StatusCode)
	}
	bodyDocs, _ := io.ReadAll(respDocs.Body)
	if !strings.Contains(string(bodyDocs), "swagger-ui") {
		t.Fatalf("Halaman /docs tidak memuat Swagger UI bundle: %s", string(bodyDocs))
	}
	t.Logf("Sukses: /docs menyajikan Swagger UI interface.")

	// GET /docs/openapi.yaml harus menyajikan file spesifikasi yaml
	reqYaml := httptest.NewRequest("GET", "/docs/openapi.yaml", nil)
	respYaml, _ := app.Test(reqYaml, -1)
	if respYaml.StatusCode != 200 {
		t.Fatalf("Ekspektasi status 200 untuk /docs/openapi.yaml, didapatkan: %d", respYaml.StatusCode)
	}
	bodyYaml, _ := io.ReadAll(respYaml.Body)
	if !strings.Contains(string(bodyYaml), "openapi: 3.0.3") {
		t.Fatalf("Spesifikasi openapi.yaml tidak valid: %s", string(bodyYaml))
	}
	t.Logf("Sukses: /docs/openapi.yaml menyajikan spesifikasi OpenAPI 3.0.3 secara utuh.")
}

// =========================================================================
// 6. TEST: Database Migration Versioned (Up -> Down -> Up pada DB Bersih)
// =========================================================================
func TestMigrateUpDownUpCleanDatabase(t *testing.T) {
	// Koneksi ke postgres maintenance db
	adminConnStr := "host=localhost port=5432 user=postgres dbname=postgres sslmode=disable"
	adminDB, err := sql.Open("postgres", adminConnStr)
	if err != nil {
		t.Skipf("Lewati test migrate up/down: postgres admin connection gagal: %v", err)
		return
	}
	defer adminDB.Close()

	testDBName := fmt.Sprintf("jelajah_test_mig_%d", time.Now().UnixNano()%100000)

	// Buat database uji sementara
	_, _ = adminDB.Exec(fmt.Sprintf("DROP DATABASE IF EXISTS %s;", testDBName))
	if _, err := adminDB.Exec(fmt.Sprintf("CREATE DATABASE %s;", testDBName)); err != nil {
		t.Skipf("Lewati test migrate up/down: tidak dapat membuat test db: %v", err)
		return
	}
	defer func() {
		_, _ = adminDB.Exec(fmt.Sprintf("DROP DATABASE IF EXISTS %s WITH (FORCE);", testDBName))
	}()

	testConnStr := fmt.Sprintf("host=localhost port=5432 user=postgres dbname=%s sslmode=disable", testDBName)
	testDB, err := sql.Open("postgres", testConnStr)
	if err != nil {
		t.Fatalf("Gagal terhubung ke test database %s: %v", testDBName, err)
	}

	migrationsDir, _ := filepath.Abs("../migrations")
	migrationsDir = filepath.ToSlash(migrationsDir)

	// 1. Eksekusi Migrate UP pada database kosong
	errUp1 := database.RunMigrations(testDB, migrationsDir)
	if errUp1 != nil {
		t.Fatalf("Migrate Up pertama gagal: %v", errUp1)
	}
	ver1, dirty1, err := database.GetMigrationVersion(testDB, migrationsDir)
	if err != nil || dirty1 || ver1 != 2 {
		t.Fatalf("Ekspektasi versi 2 non-dirty setelah Up 1, didapatkan: ver=%d dirty=%v err=%v", ver1, dirty1, err)
	}
	t.Logf("Sukses: Migrate Up pertama pada database kosong berhasil (Versi %d, Dirty: %v)", ver1, dirty1)

	// 2. Eksekusi Migrate DOWN (Rollback seluruh skema)
	errDown := database.RollbackMigrations(testDB, migrationsDir)
	if errDown != nil {
		t.Fatalf("Migrate Down gagal: %v", errDown)
	}
	t.Logf("Sukses: Migrate Down (Rollback) berhasil diterapkan tanpa error.")

	// 3. Eksekusi Migrate UP kembali
	errUp2 := database.RunMigrations(testDB, migrationsDir)
	if errUp2 != nil {
		t.Fatalf("Migrate Up kedua gagal: %v", errUp2)
	}
	ver2, dirty2, err := database.GetMigrationVersion(testDB, migrationsDir)
	if err != nil || dirty2 || ver2 != 2 {
		t.Fatalf("Ekspektasi versi 2 non-dirty setelah Up 2, didapatkan: ver=%d dirty=%v err=%v", ver2, dirty2, err)
	}
	t.Logf("Sukses: Siklus Migrate Up -> Down -> Up pada database bersih lulus 100%% (Versi %d, Dirty: %v)", ver2, dirty2)

	_ = testDB.Close()
}

func TestHybridGuestBookingLinkage(t *testing.T) {
	db := setupTestDB(t)

	tripRepo := repository.NewTripRepository(db)
	bookingRepo := repository.NewBookingRepository(db)
	userRepo := repository.NewUserRepository(db)
	refreshTokenRepo := repository.NewRefreshTokenRepository(db)
	userUsecase := usecase.NewUserUsecase(userRepo, refreshTokenRepo, "test-secret-key-32-chars-long!", 15*time.Minute, "test-refresh-secret-32-chars-long!", 7*24*time.Hour)
	userUsecase.SetBookingRepo(bookingRepo)

	ctx := context.Background()

	// 1. Buat trip pengujian
	testTrip := domain.Trip{
		ID:          uuid.New(),
		Title:       "Trip Hybrid Test",
		Destination: "Lombok",
		Description: "Paket uji penautan otomatis akun guest",
		Price:       1500000,
		Duration:    "3D2N",
		Quota:       10,
		ImageURL:    "https://images.unsplash.com/photo-test-hybrid",
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	if err := tripRepo.Create(ctx, &testTrip); err != nil {
		t.Fatalf("Gagal membuat trip uji: %v", err)
	}
	guestEmail := "hybrid.traveler@example.com"
	otherEmail := "other.traveler@example.com"

	defer func() {
		_ = db.Exec("DELETE FROM bookings WHERE trip_id = ?", testTrip.ID).Error
		_ = db.Exec("DELETE FROM trips WHERE id = ?", testTrip.ID).Error
		_ = db.Exec("DELETE FROM refresh_tokens WHERE user_id IN (SELECT id FROM users WHERE email = ?)", guestEmail).Error
		_ = db.Exec("DELETE FROM users WHERE email = ?", guestEmail).Error
	}()

	// 2. Buat 2 pesanan guest dengan email yang sama (user_id = nil)
	booking1 := domain.Booking{
		ID:            uuid.New(),
		BookingCode:   "TRIP-HYBRID-001",
		TripID:        testTrip.ID,
		UserID:        nil,
		CustomerName:  "Hybrid Traveler",
		CustomerEmail: guestEmail,
		CustomerPhone: "081234567899",
		TravelDate:    "2026-12-10",
		Pax:           2,
		TotalPrice:    3000000,
		Status:        domain.StatusPending,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}
	booking2 := domain.Booking{
		ID:            uuid.New(),
		BookingCode:   "TRIP-HYBRID-002",
		TripID:        testTrip.ID,
		UserID:        nil,
		CustomerName:  "Hybrid Traveler",
		CustomerEmail: guestEmail,
		CustomerPhone: "081234567899",
		TravelDate:    "2026-12-15",
		Pax:           1,
		TotalPrice:    1500000,
		Status:        domain.StatusConfirmed,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}
	// Pesanan milik guest lain
	bookingOther := domain.Booking{
		ID:            uuid.New(),
		BookingCode:   "TRIP-HYBRID-003",
		TripID:        testTrip.ID,
		UserID:        nil,
		CustomerName:  "Other Traveler",
		CustomerEmail: otherEmail,
		CustomerPhone: "081298765432",
		TravelDate:    "2026-12-20",
		Pax:           1,
		TotalPrice:    1500000,
		Status:        domain.StatusPending,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	_ = db.Create(&booking1).Error
	_ = db.Create(&booking2).Error
	_ = db.Create(&bookingOther).Error

	// 3. User melakukan registrasi dengan guestEmail
	regRes, _, _, err := userUsecase.Register(ctx, domain.RegisterRequest{
		Name:     "Hybrid Traveler",
		Email:    guestEmail,
		Password: "Password123!",
	})
	if err != nil {
		t.Fatalf("Registrasi gagal: %v", err)
	}

	// 4. Verifikasi bahwa booking1 dan booking2 sekarang tertaut ke regRes.User.ID
	var updated1, updated2, updatedOther domain.Booking
	_ = db.First(&updated1, "id = ?", booking1.ID).Error
	_ = db.First(&updated2, "id = ?", booking2.ID).Error
	_ = db.First(&updatedOther, "id = ?", bookingOther.ID).Error

	if updated1.UserID == nil || *updated1.UserID != regRes.User.ID {
		t.Errorf("Booking 1 tidak tertaut ke user ID. Diharapkan %s, didapat %v", regRes.User.ID, updated1.UserID)
	}
	if updated2.UserID == nil || *updated2.UserID != regRes.User.ID {
		t.Errorf("Booking 2 tidak tertaut ke user ID. Diharapkan %s, didapat %v", regRes.User.ID, updated2.UserID)
	}
	if updatedOther.UserID != nil {
		t.Errorf("Booking Other seharusnya tetap nil, tapi tertaut ke %v", updatedOther.UserID)
	}

	t.Logf("Sukses: Penautan otomatis (Hybrid Checkout) berhasil mengaitkan %d booking tamu ke akun user %s", 2, regRes.User.Email)
}

func TestExportBookingsAndTripsExcel(t *testing.T) {
	db := setupTestDB(t)
	app, cfg, _, _ := setupTestApp(t, db)

	// Helper generate token
	genToken := func(role string) string {
		claims := jwt.MapClaims{
			"sub":   uuid.New().String(),
			"email": fmt.Sprintf("%s@jelajah.com", role),
			"role":  role,
			"exp":   time.Now().Add(time.Hour).Unix(),
		}
		tok := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
		str, _ := tok.SignedString([]byte(cfg.JWTSecret))
		return str
	}

	customerToken := genToken("customer")
	adminToken := genToken("admin")

	// 1. Uji Tanpa Token -> 401 UNAUTHORIZED
	reqNoAuth := httptest.NewRequest("GET", "/api/v1/bookings/export/excel", nil)
	respNoAuth, _ := app.Test(reqNoAuth, -1)
	if respNoAuth.StatusCode != 401 {
		t.Fatalf("Ekspektasi 401 Unauthorized tanpa token, didapat %d", respNoAuth.StatusCode)
	}
	t.Logf("Sukses: Request ekspor tanpa login ditolak dengan 401 Unauthorized")

	// 2. Uji Token Customer -> 403 FORBIDDEN
	reqCust := httptest.NewRequest("GET", "/api/v1/bookings/export/excel", nil)
	reqCust.Header.Set("Authorization", "Bearer "+customerToken)
	respCust, _ := app.Test(reqCust, -1)
	if respCust.StatusCode != 403 {
		t.Fatalf("Ekspektasi 403 Forbidden untuk role customer, didapat %d", respCust.StatusCode)
	}
	t.Logf("Sukses: Request ekspor oleh user customer dicegat dengan 403 Forbidden")

	// 3. Uji Token Admin -> 200 OK & File Excel Valid
	reqAdmin := httptest.NewRequest("GET", "/api/v1/bookings/export/excel?status=pending", nil)
	reqAdmin.Header.Set("Authorization", "Bearer "+adminToken)
	respAdmin, _ := app.Test(reqAdmin, -1)
	if respAdmin.StatusCode != 200 {
		t.Fatalf("Ekspektasi 200 OK untuk role admin, didapat %d", respAdmin.StatusCode)
	}

	contentType := respAdmin.Header.Get("Content-Type")
	expectedType := "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
	if !strings.Contains(contentType, expectedType) {
		t.Errorf("Ekspektasi Content-Type %s, didapat %s", expectedType, contentType)
	}

	contentDisp := respAdmin.Header.Get("Content-Disposition")
	if !strings.Contains(contentDisp, "attachment; filename=\"rekap-pemesanan-jelajah-trip-") {
		t.Errorf("Ekspektasi Content-Disposition memuat nama file rekap, didapat %s", contentDisp)
	}

	excelBytes, err := io.ReadAll(respAdmin.Body)
	if err != nil {
		t.Fatalf("Gagal membaca body response excel: %v", err)
	}

	// Verifikasi ZIP/XLSX Magic Bytes (PK\x03\x04)
	if len(excelBytes) < 4 || excelBytes[0] != 0x50 || excelBytes[1] != 0x4B || excelBytes[2] != 0x03 || excelBytes[3] != 0x04 {
		t.Fatalf("Data yang dikembalikan bukan format ZIP/XLSX valid (magic bytes mismatch)")
	}

	// Buka kembali file dengan excelize untuk memverifikasi integritas dokumen
	f, err := excelize.OpenReader(bytes.NewReader(excelBytes))
	if err != nil {
		t.Fatalf("File yang dihasilkan tidak dapat dibuka oleh parser excelize: %v", err)
	}
	defer f.Close()

	sheetName := "Rekap Pemesanan"
	rows, err := f.GetRows(sheetName)
	if err != nil {
		t.Fatalf("Gagal membaca sheet '%s': %v", sheetName, err)
	}

	if len(rows) < 4 {
		t.Fatalf("Sheet harus memiliki minimal 4 baris header, didapatkan %d", len(rows))
	}

	titleCell, _ := f.GetCellValue(sheetName, "A1")
	if !strings.Contains(titleCell, "LAPORAN DATA PEMESANAN") {
		t.Errorf("Judul A1 tidak sesuai. Didapatkan: %s", titleCell)
	}

	colHeaderB4, _ := f.GetCellValue(sheetName, "B4")
	if colHeaderB4 != "Kode Booking" {
		t.Errorf("Header kolom B4 diharapkan 'Kode Booking', didapatkan: %s", colHeaderB4)
	}

	t.Logf("Sukses: Ekspor Excel Booking menghasilkan workbook valid (.xlsx) dengan %d baris terstruktur", len(rows))

	// 4. Uji Ekspor Katalog Paket Wisata ke Excel
	reqTripExcel := httptest.NewRequest("GET", "/api/v1/trips/export/excel", nil)
	reqTripExcel.Header.Set("Authorization", "Bearer "+adminToken)
	respTripExcel, _ := app.Test(reqTripExcel, -1)
	if respTripExcel.StatusCode != 200 {
		t.Fatalf("Ekspektasi 200 OK untuk ekspor trip excel, didapat %d", respTripExcel.StatusCode)
	}

	tripBytes, _ := io.ReadAll(respTripExcel.Body)
	fTrip, err := excelize.OpenReader(bytes.NewReader(tripBytes))
	if err != nil {
		t.Fatalf("Gagal membuka file excel katalog trip: %v", err)
	}
	defer fTrip.Close()

	tripSheet := "Daftar Paket Wisata"
	tripRows, err := fTrip.GetRows(tripSheet)
	if err != nil {
		t.Fatalf("Gagal membaca sheet katalog trip: %v", err)
	}
	t.Logf("Sukses: Ekspor Excel Katalog Trip menghasilkan workbook valid (.xlsx) dengan %d baris", len(tripRows))
}


