package main

import (
	"fmt"
	"jelajah-trip-backend/internal/config"
	"jelajah-trip-backend/internal/domain"
	"jelajah-trip-backend/pkg/database"
	"log"
	"math/rand"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

func main() {
	_, err := config.Load()
	if err != nil {
		log.Fatalf("Gagal memuat config: %v", err)
	}

	db, err := database.ConnectPostgres()
	if err != nil {
		log.Fatalf("Gagal terhubung ke database: %v", err)
	}

	log.Println("[SeedLoad] Menyiapkan data uji beban (>= 1.000 trips & bookings)...")

	// 1. Cek jumlah data saat ini
	var tripCount int64
	db.Model(&domain.Trip{}).Count(&tripCount)

	destinations := []string{
		"Labuan Bajo, NTT", "Raja Ampat, Papua", "Bali, Indonesia",
		"Bromo, Jawa Timur", "Derawan, Kalimantan Timur", "Wakatobi, Sulawesi Tenggara",
		"Yogyakarta, DIY", "Lombok, NTB", "Toraja, Sulawesi Selatan", "Belitung, Kep. Babel",
	}

	tripsToInsert := 1050
	if tripCount < int64(tripsToInsert) {
		log.Printf("[SeedLoad] Memasukkan %d trips...\n", tripsToInsert)
		var trips []domain.Trip
		for i := 1; i <= tripsToInsert; i++ {
			dest := destinations[rand.Intn(len(destinations))]
			trips = append(trips, domain.Trip{
				ID:          uuid.New(),
				Title:       fmt.Sprintf("Eksplorasi Nusantara #%d - %s", i, dest),
				Destination: dest,
				Description: fmt.Sprintf("Deskripsi paket perjalanan eksklusif #%d menikmati keindahan nusantara.", i),
				Price:       float64((rand.Intn(20) + 5) * 500000), // 2.5jt - 12.5jt
				Duration:    fmt.Sprintf("%dD%dN", rand.Intn(5)+2, rand.Intn(5)+1),
				Quota:       rand.Intn(20) + 5,
				ImageURL:    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
				CreatedAt:   time.Now().Add(-time.Duration(rand.Intn(10000)) * time.Minute),
			})

			if len(trips) >= 200 {
				if err := db.Session(&gorm.Session{CreateBatchSize: 200}).Create(&trips).Error; err != nil {
					log.Fatalf("Gagal batch insert trips: %v", err)
				}
				trips = nil
			}
		}
		if len(trips) > 0 {
			_ = db.Session(&gorm.Session{CreateBatchSize: 200}).Create(&trips).Error
		}
		log.Println("[SeedLoad] Berhasil memasukkan trips.")
	}

	var allTrips []domain.Trip
	db.Limit(100).Find(&allTrips)

	var bookingCount int64
	db.Model(&domain.Booking{}).Count(&bookingCount)

	bookingsToInsert := 1200
	statuses := []domain.BookingStatus{
		domain.StatusPending,
		domain.StatusConfirmed,
		domain.StatusCompleted,
		domain.StatusCancelled,
	}

	if bookingCount < int64(bookingsToInsert) && len(allTrips) > 0 {
		log.Printf("[SeedLoad] Memasukkan %d bookings...\n", bookingsToInsert)
		var bookings []domain.Booking
		for i := 1; i <= bookingsToInsert; i++ {
			t := allTrips[rand.Intn(len(allTrips))]
			pax := rand.Intn(4) + 1
			status := statuses[rand.Intn(len(statuses))]
			bookings = append(bookings, domain.Booking{
				ID:            uuid.New(),
				BookingCode:   fmt.Sprintf("TRIP-LOAD-%06d-%04X", i, rand.Intn(65535)),
				TripID:        t.ID,
				CustomerName:  fmt.Sprintf("Wisatawan #%d", i),
				CustomerEmail: fmt.Sprintf("wisatawan%d@loadtest.id", i),
				CustomerPhone: fmt.Sprintf("0812%08d", rand.Intn(100000000)),
				TravelDate:    time.Now().AddDate(0, rand.Intn(3)+1, rand.Intn(28)+1).Format("2006-01-02"),
				Pax:           pax,
				TotalPrice:    float64(pax) * t.Price,
				Status:        status,
				CreatedAt:     time.Now().Add(-time.Duration(rand.Intn(20000)) * time.Minute),
			})

			if len(bookings) >= 200 {
				if err := db.Session(&gorm.Session{CreateBatchSize: 200}).Create(&bookings).Error; err != nil {
					log.Fatalf("Gagal batch insert bookings: %v", err)
				}
				bookings = nil
			}
		}
		if len(bookings) > 0 {
			_ = db.Session(&gorm.Session{CreateBatchSize: 200}).Create(&bookings).Error
		}
		log.Println("[SeedLoad] Berhasil memasukkan bookings.")
	}

	// Perbarui statistik planner PostgreSQL
	db.Exec("ANALYZE trips;")
	db.Exec("ANALYZE bookings;")
	db.Exec("ANALYZE refresh_tokens;")

	// 2. Jalankan EXPLAIN ANALYZE untuk Query 1: Katalog dengan filter destinasi & sort
	log.Println("\n=======================================================")
	log.Println("--- HASIL EXPLAIN ANALYZE QUERY 1: KATALOG TRIP BERFILTER ---")
	log.Println("=======================================================")
	query1 := `EXPLAIN ANALYZE 
		SELECT id, title, destination, price, created_at 
		FROM trips 
		WHERE deleted_at IS NULL AND destination = 'Bali, Indonesia'
		ORDER BY created_at DESC 
		LIMIT 12 OFFSET 0;`

	rows1, err := db.Raw(query1).Rows()
	if err != nil {
		log.Fatalf("Gagal EXPLAIN query 1: %v", err)
	}
	defer rows1.Close()
	for rows1.Next() {
		var line string
		_ = rows1.Scan(&line)
		fmt.Println(line)
	}

	// 3. Jalankan EXPLAIN ANALYZE untuk Query 2: Daftar Booking Admin berstatus
	log.Println("\n=======================================================")
	log.Println("--- HASIL EXPLAIN ANALYZE QUERY 2: DAFTAR BOOKING ADMIN ---")
	log.Println("=======================================================")
	query2 := `EXPLAIN ANALYZE 
		SELECT id, booking_code, trip_id, status, total_price, created_at 
		FROM bookings 
		WHERE trip_id = (SELECT id FROM trips LIMIT 1) AND status = 'confirmed'
		ORDER BY created_at DESC 
		LIMIT 10 OFFSET 0;`

	rows2, err := db.Raw(query2).Rows()
	if err != nil {
		log.Fatalf("Gagal EXPLAIN query 2: %v", err)
	}
	defer rows2.Close()
	for rows2.Next() {
		var line string
		_ = rows2.Scan(&line)
		fmt.Println(line)
	}
	log.Println("\n[SeedLoad] Verifikasi EXPLAIN selesai.")
}
