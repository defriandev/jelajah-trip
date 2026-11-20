package main

import (
	"flag"
	"fmt"
	"jelajah-trip-backend/internal/config"
	"jelajah-trip-backend/pkg/database"
	"log"
	"os"
	"path/filepath"
	"strconv"
)

func main() {
	fmt.Println("==================================================")
	fmt.Println("  JELAJAH TRIP - DATABASE MIGRATION CLI")
	fmt.Println("==================================================")

	pathFlag := flag.String("path", "", "Jalur folder migrasi (default: backend/migrations atau migrations)")
	flag.Parse()

	args := flag.Args()
	if len(args) < 1 {
		fmt.Println("Penggunaan: go run ./cmd/migrate [flags] <command> [args]")
		fmt.Println("Perintah yang tersedia:")
		fmt.Println("  up              Jalankan seluruh migrasi ke versi terbaru")
		fmt.Println("  down            Rollback seluruh migrasi (Down)")
		fmt.Println("  version         Tampilkan versi migrasi aktif saat ini")
		fmt.Println("  force <version> Paksa nomor versi migrasi (recovery/adopsi DB lama)")
		os.Exit(1)
	}

	command := args[0]

	// Tentukan jalur folder migrations
	migrationsDir := *pathFlag
	if migrationsDir == "" {
		if _, err := os.Stat("migrations"); err == nil {
			migrationsDir = "migrations"
		} else if _, err := os.Stat("backend/migrations"); err == nil {
			migrationsDir = "backend/migrations"
		} else {
			migrationsDir = "migrations"
		}
	}

	absDir, err := filepath.Abs(migrationsDir)
	if err != nil {
		log.Fatalf("[Error] Gagal membaca path migrations: %v\n", err)
	}
	// Normalisasi path Windows untuk URL file:// (slash maju)
	absDir = filepath.ToSlash(absDir)

	// Inisialisasi konfigurasi & koneksi DB
	if _, err := config.Load(); err != nil {
		log.Fatalf("[Error] Gagal memuat konfigurasi environment: %v\n", err)
	}

	db, err := database.ConnectPostgres()
	if err != nil {
		log.Fatalf("[Fatal] Koneksi ke database gagal: %v\n", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("[Fatal] Gagal mendapatkan koneksi sql.DB: %v\n", err)
	}
	defer sqlDB.Close()

	switch command {
	case "up":
		fmt.Printf("Mengeksekusi migrasi UP dari: %s\n", absDir)
		if err := database.RunMigrations(sqlDB, absDir); err != nil {
			log.Fatalf("[Gagal] Migrasi UP gagal: %v\n", err)
		}
		fmt.Println("[Sukses] Migrasi UP berhasil diterapkan.")

	case "down":
		fmt.Printf("Mengeksekusi migrasi DOWN dari: %s\n", absDir)
		if err := database.RollbackMigrations(sqlDB, absDir); err != nil {
			log.Fatalf("[Gagal] Migrasi DOWN gagal: %v\n", err)
		}
		fmt.Println("[Sukses] Seluruh migrasi DOWN berhasil diterapkan.")

	case "version":
		v, dirty, err := database.GetMigrationVersion(sqlDB, absDir)
		if err != nil {
			log.Fatalf("[Error] Gagal memeriksa versi migrasi: %v\n", err)
		}
		fmt.Printf("Versi aktif: %d (Dirty state: %v)\n", v, dirty)

	case "force":
		if len(args) < 2 {
			log.Fatalln("[Error] Perintah 'force' membutuhkan parameter nomor versi, contoh: force 1")
		}
		targetV, err := strconv.Atoi(args[1])
		if err != nil {
			log.Fatalf("[Error] Nomor versi '%s' tidak valid: %v\n", args[1], err)
		}
		if err := database.ForceVersion(sqlDB, absDir, targetV); err != nil {
			log.Fatalf("[Gagal] Force version gagal: %v\n", err)
		}
		fmt.Printf("[Sukses] Versi migrasi dipaksa ke versi: %d\n", targetV)

	default:
		log.Fatalf("[Error] Perintah '%s' tidak dikenali. Gunakan up, down, version, atau force.\n", command)
	}
}
