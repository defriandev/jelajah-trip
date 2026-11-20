package database

import (
	"crypto/rand"
	"fmt"
	"jelajah-trip-backend/internal/domain"
	"log"
	"strings"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// SeedDatabase mengisi database dengan data awal untuk development & testing
// Sesuai aturan 1.2: Seeder DITOLAK dijalankan saat APP_ENV=production
func SeedDatabase(db *gorm.DB, appEnv string) {
	if strings.ToLower(appEnv) == "production" {
		log.Println("[Seeder] Environment production terdeteksi: Melewati proses seeding data demo.")
		return
	}

	// 1. Seed Users (Admin & Customer)
	var userCount int64
	db.Model(&domain.User{}).Count(&userCount)
	if userCount == 0 {
		log.Println("[Seeder] Menyemai data akun pengguna awal...")

		// Menggunakan bcrypt cost 12 (memenuhi syarat >= 10)
		adminPass, _ := bcrypt.GenerateFromPassword([]byte("admin123"), 12)
		custPass, _ := bcrypt.GenerateFromPassword([]byte("password123"), 12)

		adminUser := domain.User{
			ID:           uuid.New(),
			Name:         "Super Admin Jelajah Trip",
			Email:        "admin@jelajahtrip.com",
			PasswordHash: string(adminPass),
			Role:         domain.RoleAdmin,
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		}

		demoUser := domain.User{
			ID:           uuid.New(),
			Name:         "Budi Santoso",
			Email:        "budi@example.com",
			PasswordHash: string(custPass),
			Role:         domain.RoleCustomer,
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		}

		db.Create(&adminUser)
		db.Create(&demoUser)
		log.Println("[Seeder] Akun admin (admin@jelajahtrip.com / admin123) dan customer (budi@example.com / password123) berhasil dibuat.")
	}

	// 2. Seed Trips (Minimal 6 Destinasi Unggulan Indonesia)
	var tripCount int64
	db.Model(&domain.Trip{}).Count(&tripCount)
	if tripCount == 0 {
		log.Println("[Seeder] Menyemai data paket wisata Indonesia...")

		trips := []domain.Trip{
			{
				ID:          uuid.New(),
				Title:       "Eksotisme Raja Ampat & Wayag Islands",
				Destination: "Raja Ampat, Papua Barat Daya",
				Description: "Jelajahi keajaiban gugusan pulau karang tercantik di dunia. Mengunjungi gugusan karst Wayag, berenang bersama pari manta di Manta Sandy, snorkeling di biota laut Pianemo, dan menginap di eco-resort tepi pantai yang memukau.",
				Price:       7850000,
				Duration:    "4D3N",
				Facilities: []string{
					"Speedboat Private Selama Trip",
					"Resort Tepi Pantai 3 Malam (AC & Hot Water)",
					"Makan 3x Sehari (Seafood & Masakan Lokal)",
					"Alat Snorkeling Lengkap & Life Jacket",
					"Tiket Masuk Kawasan Konservasi & PIN Raja Ampat",
					"Dokumentasi Underwater (GoPro) & Drone 4K",
					"Tour Leader Berpengalaman & Certified Local Guide",
				},
				Quota:     12,
				ImageURL:  "https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?auto=format&fit=crop&w=1200&q=80",
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			},
			{
				ID:          uuid.New(),
				Title:       "Golden Sunrise Bromo & Madakaripura",
				Destination: "Probolinggo, Jawa Timur",
				Description: "Saksikan salah satu pemandangan matahari terbit paling magis di Asia Tenggara. Berkeliling kaldera Gunung Bromo dengan Jeep 4x4, menaiki kawah aktif, berfoto di Bukit Teletubbies & Pasir Berbisik, dan kesegaran air terjun Madakaripura.",
				Price:       1350000,
				Duration:    "2D1N",
				Facilities: []string{
					"Transportasi AC Antar-Jemput Malang/Surabaya",
					"Jeep 4x4 Khusus Bromo Sunrise Tour",
					"Hotel Bintang 3 Kawasan Bromo 1 Malam",
					"Makan 2x & Coffee Break Sunrise",
					"Tiket Masuk TN Bromo Tengger Semeru & Madakaripura",
					"Masker & Jas Hujan Madakaripura",
					"Dokumentasi Foto Mirrorless",
				},
				Quota:     18,
				ImageURL:  "https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&w=1200&q=80",
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			},
			{
				ID:          uuid.New(),
				Title:       "Komodo Dragon & Padar Island Sailing Liveaboard",
				Destination: "Labuan Bajo, Nusa Tenggara Timur",
				Description: "Petualangan premium berlayar (sailing) di Taman Nasional Komodo menggunakan Kapal Phinisi ber-AC. Trekking puncak Pulau Padar saat fajar, berjumpa langsung dengan satwa purba Komodo, santai di Pink Beach, dan berenang bersama Pari Manta.",
				Price:       4950000,
				Duration:    "3D2N",
				Facilities: []string{
					"Kapal Phinisi Semi-Luxury (Kamar Cabin AC & En-suite Bathroom)",
					"Semua Makanan & Minuman di Kapal (Chef Onboard)",
					"Ranger TN Komodo & Tour Guide Berlisensi",
					"Set Snorkeling & Pelampung",
					"Dokumentasi Profesional (Drone, Mirrorless & GoPro)",
					"Antar-Jemput Bandara Komodo Labuan Bajo",
					"Snack, Buah Segar & Kopi/Teh Tanpa Batas",
				},
				Quota:     14,
				ImageURL:  "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80",
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			},
			{
				ID:          uuid.New(),
				Title:       "Pesona Surga Tersembunyi Nusa Penida",
				Destination: "Nusa Penida, Bali",
				Description: "Jelajahi eksotisme tebing kapur dan pantai tersembunyi pulau Nusa Penida. Mengunjungi Kelingking Beach (T-Rex Cliff), Broken Beach, Angel's Billabong, snorkeling di Crystal Bay, dan menikmati sunset romantis di Diamond Beach.",
				Price:       1200000,
				Duration:    "2D1N",
				Facilities: []string{
					"Tiket Fast Boat Sanur - Nusa Penida (PP)",
					"Mobil AC Privat & Driver Lokal Berpengalaman",
					"Hotel Villa Rekomendasi di Penida 1 Malam",
					"Makan Siang & Sarapan Pagi",
					"Tiket Masuk Seluruh Objek Wisata",
					"Air Mineral Sepanjang Perjalanan",
					"Bantuan Foto di Setiap Spot Instagramable",
				},
				Quota:     20,
				ImageURL:  "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80",
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			},
			{
				ID:          uuid.New(),
				Title:       "Keajaiban Danau Toba & Samosir Heritage",
				Destination: "Danau Toba, Sumatera Utara",
				Description: "Jelajahi danau vulkanik terbesar di dunia dengan kebudayaan Batak yang kaya. Menyeberang ke Pulau Samosir, menyaksikan tarian Sigale-gale di Desa Tomok, mengagumi panorama Bukit Holbung, dan riam Air Terjun Sipiso-piso.",
				Price:       2450000,
				Duration:    "3D2N",
				Facilities: []string{
					"Transportasi Bus Pariwisata AC Medan - Danau Toba (PP)",
					"Kapal Wisata Ferry Penyeberangan Samosir",
					"Resort Danau Bintang 4 di Tepi Danau Toba 2 Malam",
					"Makan Sesuai Program (Halal Certified)",
					"Tiket Wisata Budaya Desa Tradisional Batak",
					"Pemandu Wisata Budaya Lokal",
					"Asuransi Perjalanan Wisata",
				},
				Quota:     16,
				ImageURL:  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			},
			{
				ID:          uuid.New(),
				Title:       "Heritage & Adventure Yogyakarta Istimewa",
				Destination: "DI Yogyakarta & Magelang",
				Description: "Paduan sempurna keagungan sejarah Candi Borobudur saat pagi hari, serunya Lava Tour Merapi dengan Jeep terbuka, keindahan Candi Prambanan, eksplorasi Gua Pindul, serta wisata kuliner malam legendaris di Malioboro.",
				Price:       1850000,
				Duration:    "3D2N",
				Facilities: []string{
					"Transportasi Mobil/HiAce Nyaman Full AC",
					"Hotel Bintang 3 Dekat Malioboro 2 Malam",
					"Jeep Merapi Lava Tour (Off-road Adventure)",
					"Tiket Masuk Borobudur, Pramban & Cave Tubing Pindul",
					"Makan Tradisional Khas Yogya & Gudeg Legendaris",
					"Driver Merangkap Tour Guide Ramah",
					"Antar-Jemput Stasiun Tugu / Bandara YIA",
				},
				Quota:     22,
				ImageURL:  "https://images.unsplash.com/photo-1596402184320-417e7178b2cd?auto=format&fit=crop&w=1200&q=80",
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			},
		}

		for _, t := range trips {
			db.Create(&t)
		}
		log.Println("[Seeder] 6 Paket wisata nusantara berhasil ditambahkan.")

		// 3. Seed Reviews & Sample Completed Booking
		var demoUser domain.User
		db.Where("email = ?", "budi@example.com").First(&demoUser)
		if demoUser.ID != uuid.Nil {
			// Seed a sample COMPLETED booking so user can review per 1.7
			dateStr := time.Now().Format("20060102")
			sampleBooking := domain.Booking{
				ID:            uuid.New(),
				BookingCode:   fmt.Sprintf("TRIP-%s-DEMO0001", dateStr),
				UserID:        &demoUser.ID,
				TripID:        trips[0].ID,
				CustomerName:  "Budi Santoso",
				CustomerEmail: "budi@example.com",
				CustomerPhone: "081234567890",
				TravelDate:    time.Now().Add(-14 * 24 * time.Hour).Format("2006-01-02"),
				Pax:           2,
				TotalPrice:    trips[0].Price * 2,
				Status:        domain.StatusCompleted,
				CreatedAt:     time.Now().Add(-20 * 24 * time.Hour),
				UpdatedAt:     time.Now().Add(-13 * 24 * time.Hour),
			}
			db.Create(&sampleBooking)

			reviews := []domain.Review{
				{
					ID:        uuid.New(),
					TripID:    trips[0].ID,
					UserID:    demoUser.ID,
					BookingID: &sampleBooking.ID,
					Rating:    5,
					Comment:   "Pengalaman paling luar biasa seumur hidup! Gugusan pulau Wayag sangat memukau, terumbu karang masih sangat alami, dan tim Jelajah Trip luar biasa sigap mendokumentasikan foto underwater.",
					CreatedAt: time.Now().Add(-72 * time.Hour),
				},
			}
			for _, r := range reviews {
				db.Create(&r)
			}
			log.Println("[Seeder] Review pelanggan awal dan booking terhubung berhasil ditambahkan.")
		}
	}

	// 5. Seed FAQs
	var faqCount int64
	db.Model(&domain.FAQ{}).Count(&faqCount)
	if faqCount == 0 {
		log.Println("[Seeder] Menyemai data FAQ...")
		faqs := []domain.FAQ{
			{
				Question: "Bagaimana cara memesan paket trip di Jelajah Trip?",
				Answer:   "Pilih destinasi impian Anda di menu Katalog Trip, tentukan tanggal keberangkatan dan jumlah peserta (pax), lalu lengkapi data diri pada formulir pemesanan. Setelah itu, Anda akan mendapatkan kode booking unik dan detail konfirmasi.",
			},
			{
				Question: "Apakah saya bisa memesan tanpa membuat akun terlebih dahulu?",
				Answer:   "Tentu saja! Jelajah Trip mendukung fitur 'Guest Booking'. Anda dapat memesan langsung dan melacak status pesanan kapan saja melalui menu 'Cek Pesanan' menggunakan kode booking unik yang Anda dapatkan.",
			},
			{
				Question: "Bagaimana sistem pembayaran paket wisata?",
				Answer:   "Setelah formulir pemesanan berhasil disubmit, Anda akan menerima petunjuk pembayaran via Transfer Bank, Virtual Account, atau e-Wallet. Tim admin kami akan memverifikasi pembayaran Anda dan mengubah status pesanan menjadi Confirmed dalam 1x24 jam.",
			},
			{
				Question: "Apakah saya bisa mengajukan reschedule atau pembatalan?",
				Answer:   "Pengajuan perubahan jadwal (reschedule) dapat dilakukan maksimal H-7 sebelum tanggal keberangkatan tanpa biaya tambahan (bergantung ketersediaan kuota). Untuk pembatalan dan pengembalian dana, silakan hubungi customer service kami melalui WhatsApp.",
			},
			{
				Question: "Apakah paket wisata sudah mencakup asuransi perjalanan?",
				Answer:   "Semua paket perjalanan unggulan Jelajah Trip telah mencakup asuransi perjalanan dasar, pemandu wisata bersertifikat, serta peralatan keselamatan standar (life jacket & first aid kit).",
			},
		}
		for _, f := range faqs {
			db.Create(&f)
		}
		log.Println("[Seeder] Data FAQ berhasil disemai.")
	}
}

// GenerateCryptoCode menghasilkan kode booking dengan 8 karakter acak alfanumerik dari crypto/rand
// Format: TRIP-YYYYMMDD-XXXXXXXX
func GenerateCryptoCode() string {
	const charset = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
	dateStr := time.Now().Format("20060102")
	b := make([]byte, 8)
	_, _ = rand.Read(b)
	suffix := make([]byte, 8)
	for i, val := range b {
		suffix[i] = charset[int(val)%len(charset)]
	}
	return fmt.Sprintf("TRIP-%s-%s", dateStr, string(suffix))
}
