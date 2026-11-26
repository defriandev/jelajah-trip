package main

import (
	"fmt"
	"jelajah-trip-backend/internal/config"
	"jelajah-trip-backend/internal/domain"
	"jelajah-trip-backend/pkg/database"
	"log"
	"strings"
	"time"

	"github.com/google/uuid"
)

type CuratedPackage struct {
	Title       string
	Destination string
	Description string
	Price       float64
	Duration    string
	Facilities  []string
	Quota       int
	ImageURL    string
}

func main() {
	_, err := config.Load()
	if err != nil {
		log.Fatalf("Gagal memuat konfigurasi: %v", err)
	}

	db, err := database.ConnectPostgres()
	if err != nil {
		log.Fatalf("Gagal terhubung ke database: %v", err)
	}

	log.Println("[EnrichCatalog] Memulai kurasi menyeluruh katalog paket wisata...")

	// 1. Data paket wisata kurasi premium nusantara dengan foto resolusi tinggi & deskripsi komprehensif
	curated := []CuratedPackage{
		{
			Title:       "Eksotisme Raja Ampat & Wayag Private Liveaboard",
			Destination: "Raja Ampat, Papua Barat Daya",
			Description: "Jelajahi keajaiban gugusan karst Wayag dan laguna toska Pianemo yang mendunia. Berenang bersama pari manta di Manta Sandy, snorkeling di terumbu karang laut dalam yang masih perawan, serta menikmati kemewahan eco-resort tepi laut dengan hidangan laut segar setiap hari.",
			Price:       8750000,
			Duration:    "4D3N",
			Facilities: []string{
				"Speedboat Private & Yacht Charter",
				"Water Villa Resort 3 Malam (AC & Hot Water)",
				"Makan 3x Sehari Sajian Chef Lokal Segar",
				"Alat Snorkeling Lengkap & Life Vest",
				"Dokumentasi Underwater GoPro & Drone 4K",
				"Tiket Masuk Kawasan Konservasi & PIN Resmi",
				"Pemandu Lokal Berlisensi HPI",
			},
			Quota:    12,
			ImageURL: "https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?auto=format&fit=crop&w=1200&q=80",
		},
		{
			Title:       "Komodo Dragon & Padar Island Luxury Sailing",
			Destination: "Labuan Bajo, Nusa Tenggara Timur",
			Description: "Berlayar mengarungi kepulauan purba Komodo menggunakan Kapal Phinisi semi-luxury ber-AC. Menyaksikan matahari terbit magis dari puncak Pulau Padar, bersantai di pasir merah muda Pink Beach, dan berjumpa langsung dengan satwa langka purba Komodo.",
			Price:       5450000,
			Duration:    "3D2N",
			Facilities: []string{
				"Kapal Phinisi Semi-Luxury (Kabin AC Privat)",
				"Fullboard Meals Onboard (Chef Khusus)",
				"Ranger Taman Nasional & Guide Berlisensi",
				"Set Snorkeling Lengkap & Pelampung",
				"Dokumentasi Foto Drone & Kamera Mirrorless",
				"Antar-Jemput Bandara Komodo PP",
				"Free Flow Kopi Flores & Buah Segar",
			},
			Quota:    14,
			ImageURL: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80",
		},
		{
			Title:       "Golden Sunrise Bromo, Lautan Pasir & Madakaripura",
			Destination: "Bromo & Probolinggo, Jawa Timur",
			Description: "Saksikan salah satu panorama fajar paling spektakuler di Asia Tenggara dari Penanjakan 1. Menjelajahi kaldera aktif Bromo menggunakan Jeep 4x4 off-road, mendaki bibir kawah bergemuruh, berfoto di Bukit Teletubbies, dan kesegaran abadi tirai air Madakaripura.",
			Price:       1450000,
			Duration:    "2D1N",
			Facilities: []string{
				"Jeep Hardtop 4x4 Khusus Bromo Sunrise",
				"Hotel Resort Kawasan Tengger 1 Malam",
				"Makan 2x & Coffee Break Sunrise Panas",
				"Tiket Masuk TN Bromo Tengger Semeru",
				"Pemandu & Driver Lokal Berpengalaman",
				"Dokumentasi Foto Liburan Mirrorless",
				"Antar-Jemput Surabaya / Malang PP",
			},
			Quota:    18,
			ImageURL: "https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&w=1200&q=80",
		},
		{
			Title:       "Pesona Tebing Karst Nusa Penida & Diamond Beach",
			Destination: "Nusa Penida, Bali",
			Description: "Petualangan melintasi tebing dramatis samudra Hindia di Kelingking Beach (T-Rex Cliff) dan Broken Beach. Menuruni tangga tebing ikonik Diamond Beach, snorkeling bersama manta di Manta Point, dan bersantai menikmati senja keemasan di Crystal Bay.",
			Price:       1350000,
			Duration:    "2D1N",
			Facilities: []string{
				"Tiket Fastboat PP Sanur - Nusa Penida",
				"Mobil AC Privat & Driver Guide Lokal",
				"Villa Resort Tepi Tebing Penida 1 Malam",
				"Makan Siang & Sarapan Pagi",
				"Tiket Masuk Seluruh Spot Wisata",
				"Snorkeling Boat & Equipment Lengkap",
				"Bantuan Foto di Setiap Spot Ikonik",
			},
			Quota:    20,
			ImageURL: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80",
		},
		{
			Title:       "Keajaiban Kaldera Danau Toba & Samosir Cultural Retreat",
			Destination: "Danau Toba, Sumatera Utara",
			Description: "Resapi ketenangan danau vulkanik terbesar di dunia dengan panorama perbukitan pinus yang memukau. Menyeberang ke Pulau Samosir, menyaksikan tarian mistis Sigale-gale di Desa Tomok, menikmati sepoi angin Bukit Holbung, dan gemuruh Air Terjun Sipiso-piso.",
			Price:       2650000,
			Duration:    "3D2N",
			Facilities: []string{
				"Transportasi HiAce Wisata Nyaman Medan - Toba PP",
				"Ferry Penyeberangan Wisata Samosir",
				"Resort Tepi Danau Bintang 4 (2 Malam)",
				"Makan Tradisional Batak Halal 3x Sehari",
				"Tiket Wisata Budaya & Pertunjukan Sigale-gale",
				"Tour Leader Budaya Berpengalaman",
				"Asuransi Perjalanan",
			},
			Quota:    16,
			ImageURL: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
		},
		{
			Title:       "Heritage Borobudur Sunrise, Prambanan & Lava Tour Merapi",
			Destination: "DI Yogyakarta & Magelang",
			Description: "Menyaksikan kemegahan siluet Candi Borobudur bermandikan kabut fajar perbukitan Menoreh. Merasakan keseruan off-road Jeep Lava Tour di lereng Gunung Merapi, mengagumi relief Candi Prambanan, eksplorasi Gua Pindul, dan santap malam kuliner gudeg legendaris.",
			Price:       1950000,
			Duration:    "3D2N",
			Facilities: []string{
				"Transportasi Mobil/HiAce Full AC Privat",
				"Hotel Butik Heritage Bintang 4 Dekat Malioboro (2 Malam)",
				"Jeep Offroad 4x4 Lava Tour Merapi",
				"Tiket Masuk Sunrise Borobudur & Prambanan",
				"Wisata Cave Tubing Gua Pindul",
				"Makan Tradisional Khas & Kuliner Legendaris",
				"Antar-Jemput Stasiun Tugu / Bandara YIA",
			},
			Quota:    22,
			ImageURL: "https://images.unsplash.com/photo-1596402184320-417e7178b2cd?auto=format&fit=crop&w=1200&q=80",
		},
		{
			Title:       "Eksplorasi Derawan, Maratua Blue Lagoon & Ubur-ubur Kakaban",
			Destination: "Derawan, Kalimantan Timur",
			Description: "Berenang tanpa sengatan bersama ribuan ubur-ubur langka di danau prasejarah Pulau Kakaban. Menyelam bersama hiu paus (whale shark) raksasa di Talisayan, menginap di cottage terapung atas air Maratua, dan menyaksikan penyu hijau bertelur di Sangalaki.",
			Price:       4850000,
			Duration:    "4D3N",
			Facilities: []string{
				"Speedboat Private Selama Trip Derawan-Maratua",
				"Water Cottage Terapung 3 Malam (AC)",
				"Makan Penuh Selama Tour (Seafood & Nusantara)",
				"Peralatan Snorkeling & Pelampung",
				"Tiket Masuk Konservasi Penyu & Danau Kakaban",
				"Dokumentasi Foto Underwater & Drone",
				"Antar-Jemput Bandara Berau PP",
			},
			Quota:    14,
			ImageURL: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80",
		},
		{
			Title:       "Tana Toraja Cultural Expedition & Batutumonga Misty Hills",
			Destination: "Tana Toraja, Sulawesi Selatan",
			Description: "Menyelami filosofi spiritual tertua di Nusantara di perbukitan kabut Tana Toraja. Mengunjungi situs pemakaman tebing batu Lemo, kuburan goa Londa, rumah adat Tongkonan megah di Kete Kesu, dan trekking panorama terasering padi Batutumonga.",
			Price:       3250000,
			Duration:    "4D3N",
			Facilities: []string{
				"Mobil Nyaman Full AC Makassar - Toraja PP",
				"Hotel Etnik Heritage Bintang 3 di Rantepao (3 Malam)",
				"Tiket Masuk Seluruh Obyek Wisata Budaya",
				"Makan Tradisional Toraja & Kopi Toraja Asli",
				"Pemandu Wisata Adat Berlisensi HPI",
				"Kunjungan Upacara Rambu Solo (Jika Ada)",
				"Asuransi Perjalanan",
			},
			Quota:    16,
			ImageURL: "https://images.unsplash.com/photo-1605647540924-852290f6b0d5?auto=format&fit=crop&w=1200&q=80",
		},
		{
			Title:       "Pulau Belitung, Geopark Granit & Mercusuar Lengkuas",
			Destination: "Belitung, Kep. Bangka Belitung",
			Description: "Mengagumi formasi batu granit raksasa purba berusia jutaan tahun di Pantai Tanjung Tinggi. Island hopping perahu tradisional ke Pulau Lengkuas untuk menaiki mercusuar abad ke-19, snorkeling di terumbu karang tenang, serta mencicipi kopi tarik legendaris Manggar.",
			Price:       2150000,
			Duration:    "3D2N",
			Facilities: []string{
				"Transportasi Mobil Pariwisata AC Nyaman",
				"Hotel Bintang 4 Tepi Pantai Tanjung Pandan (2 Malam)",
				"Perahu Tradisional Island Hopping Lengkuas",
				"Makan 3x Sehari Termasuk Mie Atep Belitung Khas",
				"Alat Snorkeling Lengkap & Pelampung",
				"Tiket Masuk Wisata Pantai Granit & Museum Kata",
				"Antar-Jemput Bandara H.A.S. Hanandjoeddin PP",
			},
			Quota:    18,
			ImageURL: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
		},
		{
			Title:       "Eksotisme Sumba: Savana Purba, Weekuri Lagoon & Desa Ratenggaro",
			Destination: "Sumba Barat Daya & Timur, NTT",
			Description: "Petualangan dramatis melintasi savana Bukit Warinding bernuansa Afrika. Berenang di laguna air asin sebening kristal Danau Weekuri, mengagumi atap menjulang rumah adat Kampung Ratenggaro, dan pesona matahari terbenam magis di pantai pohon menari Walakiri.",
			Price:       4750000,
			Duration:    "4D3N",
			Facilities: []string{
				"Mobil 4x4 Nyaman Ekspedisi Sumba",
				"Resort Eco-Luxury Rekomendasi (3 Malam)",
				"Makan Penuh Cita Rasa Lokal Segar",
				"Tiket Masuk Kawasan Adat & Donasi Desa",
				"Pemandu Lokal Berlisensi HPI Sumba",
				"Dokumentasi Foto Profesional",
				"Antar-Jemput Bandara Tambolaka / Waingapu PP",
			},
			Quota:    12,
			ImageURL: "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1200&q=80",
		},
		{
			Title:       "Midnight Blue Fire Kawah Ijen & Safari Savana Baluran",
			Destination: "Banyuwangi, Jawa Timur",
			Description: "Trekking tengah malam menuju fenomena api biru abadi (blue fire) yang hanya ada dua di dunia di kawah belerang Ijen. Dilanjutkan safari satwa liar banteng dan rusa di savana 'Africa van Java' Taman Nasional Baluran dan pantai Bama.",
			Price:       1550000,
			Duration:    "2D1N",
			Facilities: []string{
				"Transportasi AC Privat Antar-Jemput Banyuwangi",
				"Masker Gas Respirator Khusus Kawah Ijen",
				"Pemandu Lokal Ijen Berlisensi",
				"Tiket Masuk TN Ijen & TN Baluran",
				"Hotel Bintang 3 di Kota Banyuwangi (1 Malam)",
				"Makan Sesuai Jadwal & Sarapan",
				"Dokumentasi Foto Kawah & Safari",
			},
			Quota:    20,
			ImageURL: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80",
		},
		{
			Title:       "Wakatobi Undersea Paradise & Hoga Island Coral Sanctuary",
			Destination: "Wakatobi, Sulawesi Tenggara",
			Description: "Surga bawah laut terumbu karang terbaik dunia di pusat segitiga terumbu karang Pasifik. Menjelajahi gugusan pulau Wangi-Wangi, Kaledupa, Tomia, dan Binongko, berjumpa lumba-lumba bebas di laut lepas, dan menginap di resort pesisir eksklusif.",
			Price:       6950000,
			Duration:    "4D3N",
			Facilities: []string{
				"Speedboat Charter Privat Jelajah 4 Pulau Wakatobi",
				"Resort Pesisir Tepi Pantai (3 Malam AC)",
				"Makan 3x Sehari Sajian Ikan Segar Karang",
				"Set Snorkeling Lengkap & Guide Bawah Laut",
				"Tiket Masuk Kawasan Konservasi Laut Nasional",
				"Dokumentasi Underwater & Video Perjalanan",
				"Antar-Jemput Bandara Matahora Wangi-Wangi PP",
			},
			Quota:    12,
			ImageURL: "https://images.unsplash.com/photo-1682687220063-4742bd7fd538?auto=format&fit=crop&w=1200&q=80",
		},
		{
			Title:       "Banda Neira: Kejayaan Rempah Dunia, Benteng Belgica & Hatta Island",
			Destination: "Kepulauan Banda, Maluku Tengah",
			Description: "Napak tilas tanah bersejarah perebutan rempah pala dunia di Banda Neira. Menjelajah Benteng Belgica peninggalan VOC, rumah pengasingan Bung Hatta, mendaki Gunung Api Banda, dan menyelam di dinding karang spektakuler Pulau Hatta dengan visibilitas 40 meter.",
			Price:       7250000,
			Duration:    "5D4N",
			Facilities: []string{
				"Tiket Fast Ferry PP Ambon - Banda Neira",
				"Penginapan Heritage Kolonial di Banda Neira (4 Malam)",
				"Perahu Private Island Hopping Hatta & Rhun",
				"Makan Lengkap Sajian Masakan Rempah Banda Asli",
				"Tiket Masuk Istana Mini, Benteng & Rumah Sejarah",
				"Pemandu Sejarah Lokal Banda Neira",
				"Alat Snorkeling Lengkap",
			},
			Quota:    12,
			ImageURL: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80",
		},
		{
			Title:       "Pesona Sejuk Priangan: Kawah Putih, Glamping Patenggang & Kebun Teh",
			Destination: "Bandung & Ciwidey, Jawa Barat",
			Description: "Menghirup segarnya udara pegunungan bumi Parahyangan di danau kawah belerang toska Kawah Putih. Berlayar perahu di Danau Situ Patenggang, melintasi jembatan gantung Rengganis terpanjang di Asia Tenggara, dan memetik stroberi segar di kebun teh Rancabali.",
			Price:       1650000,
			Duration:    "3D2N",
			Facilities: []string{
				"Mobil AC Pariwisata Nyaman PP Bandung",
				"Glamping / Resort Mewah Tepi Danau (2 Malam)",
				"Tiket Masuk Terusan Kawah Putih & Patenggang",
				"Tiket Jembatan Gantung Rengganis Suspension Bridge",
				"Makan Tradisional Sunda Nasi Liwet Lengkap",
				"Pemandu Wisata Ramah",
				"Wisata Belanja Oleh-Oleh Khas Bandung",
			},
			Quota:    20,
			ImageURL: "https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&w=1200&q=80",
		},
		{
			Title:       "Eksplorasi Morotai: Pulau Dodola, Jejak Perang Dunia II & Pasir Putih",
			Destination: "Pulau Morotai, Maluku Utara",
			Description: "Menyusuri pulau terluar bersejarah markas Jenderal Douglas MacArthur di Perang Dunia II. Berjalan di atas gumuk pasir putih timbul yang menghubungkan Pulau Dodola Besar dan Kecil, diving bangkai pesawat tempur, dan panorama samudra tebing Tanjung Gorango.",
			Price:       5650000,
			Duration:    "4D3N",
			Facilities: []string{
				"Speedboat Charter Keliling Pulau Dodola & Kolorai",
				"Hotel Resort Terbaik di Morotai (3 Malam)",
				"Makan 3x Sehari Ikan Bakar & Kuliner Maluku",
				"Tiket Masuk Museum Perang Dunia II & Gua MacArthur",
				"Pemandu Lokal Berlisensi",
				"Alat Snorkeling & Pelampung",
				"Antar-Jemput Bandara Pitu Morotai PP",
			},
			Quota:    14,
			ImageURL: "https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?auto=format&fit=crop&w=1200&q=80",
		},
		{
			Title:       "Taman Nasional Bunaken & Tangkoko Wildlife Safari",
			Destination: "Manado, Sulawesi Utara",
			Description: "Penyelaman legendaris di dinding karang curam Taman Nasional Bunaken dengan ribuan spesies ikan tropis dan penyu sisik raksasa. Dilanjutkan petualangan rimba Tangkoko untuk melihat satwa primata terkecil di dunia Tarsius spectrum dan burung Rangkong endemik.",
			Price:       3850000,
			Duration:    "3D2N",
			Facilities: []string{
				"Boat Charter Khusus Snorkeling & Diving Bunaken",
				"Hotel Bintang 4 di Manado (2 Malam)",
				"Makan Cita Rasa Khas Minahasa & Seafood",
				"Tiket Masuk TN Bunaken & Cagar Alam Tangkoko",
				"Ranger Hutan & Guide Snorkeling",
				"Dokumentasi Foto Underwater",
				"Antar-Jemput Bandara Sam Ratulangi PP",
			},
			Quota:    18,
			ImageURL: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80",
		},
	}

	// 2. Perbaiki trip 'Wisata Jawa barat' (337624e5-f068-4ab0-a41b-ae23351c5ea6) jika ada
	var badTrip domain.Trip
	if err := db.Where("id = ?", "337624e5-f068-4ab0-a41b-ae23351c5ea6").First(&badTrip).Error; err == nil {
		log.Println("[EnrichCatalog] Memperbarui trip dummy Wisata Jawa barat (bahahskasjahs)...")
		ciwidey := curated[13]
		badTrip.Title = ciwidey.Title
		badTrip.Destination = ciwidey.Destination
		badTrip.Description = ciwidey.Description
		badTrip.Price = ciwidey.Price
		badTrip.Duration = ciwidey.Duration
		badTrip.Facilities = ciwidey.Facilities
		badTrip.Quota = ciwidey.Quota
		badTrip.ImageURL = ciwidey.ImageURL
		badTrip.UpdatedAt = time.Now()
		db.Save(&badTrip)
		log.Println("[EnrichCatalog] Sukses memperbarui trip Jawa Barat.")
	}

	// 3. Masukkan atau perbarui 16 paket unggulan ini dengan timestamp terbaru agar muncul di halaman 1
	now := time.Now()
	for i, p := range curated {
		var existing domain.Trip
		// Cek apakah paket dengan judul ini sudah ada
		res := db.Where("title = ? OR destination = ?", p.Title, p.Destination).First(&existing)
		if res.Error == nil {
			// Update existing
			existing.Title = p.Title
			existing.Destination = p.Destination
			existing.Description = p.Description
			existing.Price = p.Price
			existing.Duration = p.Duration
			existing.Facilities = p.Facilities
			existing.Quota = p.Quota
			existing.ImageURL = p.ImageURL
			// Offset beberapa detik agar urutan rapi sesuai kurasi
			existing.CreatedAt = now.Add(-time.Duration(i*10) * time.Minute)
			existing.UpdatedAt = now
			db.Save(&existing)
		} else {
			// Create baru
			newTrip := domain.Trip{
				ID:          uuid.New(),
				Title:       p.Title,
				Destination: p.Destination,
				Description: p.Description,
				Price:       p.Price,
				Duration:    p.Duration,
				Facilities:  p.Facilities,
				Quota:       p.Quota,
				ImageURL:    p.ImageURL,
				CreatedAt:   now.Add(-time.Duration(i*10) * time.Minute),
				UpdatedAt:   now,
			}
			db.Create(&newTrip)
		}
	}
	log.Printf("[EnrichCatalog] Sukses menyemai %d paket wisata kurasi premium nusantara.\n", len(curated))

	// 4. Perbarui juga paket dummy 'Eksplorasi Nusantara #...' agar jika diakses tetap memiliki deskripsi & gambar profesional
	destinationImages := map[string]string{
		"Bali":       "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80",
		"Labuan":     "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80",
		"Raja":       "https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?auto=format&fit=crop&w=1200&q=80",
		"Bromo":      "https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&w=1200&q=80",
		"Yogyakarta": "https://images.unsplash.com/photo-1596402184320-417e7178b2cd?auto=format&fit=crop&w=1200&q=80",
		"Derawan":    "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80",
		"Wakatobi":   "https://images.unsplash.com/photo-1682687220063-4742bd7fd538?auto=format&fit=crop&w=1200&q=80",
		"Toraja":     "https://images.unsplash.com/photo-1605647540924-852290f6b0d5?auto=format&fit=crop&w=1200&q=80",
		"Belitung":   "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
		"Lombok":     "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80",
	}

	var dummyTrips []domain.Trip
	db.Where("title LIKE ?", "Eksplorasi Nusantara #%").Find(&dummyTrips)
	if len(dummyTrips) > 0 {
		log.Printf("[EnrichCatalog] Memperbarui deskripsi dan gambar untuk %d paket mock...\n", len(dummyTrips))
		for _, dt := range dummyTrips {
			// Pilih gambar yang cocok dengan destinasi
			imgURL := "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"
			for key, val := range destinationImages {
				if strings.Contains(dt.Destination, key) {
					imgURL = val
					break
				}
			}

			dt.ImageURL = imgURL
			dt.Description = fmt.Sprintf("Nikmati keindahan pesona %s bersama kurator profesional Jelajah Trip. Paket mencakup akomodasi terpilih, transportasi privat ber-AC, hidangan lokal otentik, dan pendampingan pemandu berlisensi resmi.", dt.Destination)
			if len(dt.Facilities) == 0 {
				dt.Facilities = []string{
					"Transportasi AC Selama Perjalanan",
					"Penginapan Resort/Hotel Rekomendasi",
					"Makan Sesuai Program Perjalanan",
					"Tiket Masuk Objek Wisata",
					"Pemandu Wisata Berlisensi Resmi",
					"Dokumentasi Foto Perjalanan",
				}
			}
			db.Save(&dt)
		}
		log.Println("[EnrichCatalog] Sukses memperkaya seluruh paket mock.")
	}

	log.Println("[EnrichCatalog] Selesai! Katalog kini 100% lengkap dan profesional.")
}
