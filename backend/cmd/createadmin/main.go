package main

import (
	"bufio"
	"context"
	"flag"
	"fmt"
	"jelajah-trip-backend/internal/config"
	"jelajah-trip-backend/internal/domain"
	"jelajah-trip-backend/internal/repository"
	"jelajah-trip-backend/pkg/database"
	"log"
	"net/mail"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/term"
)

func main() {
	fmt.Println("==================================================")
	fmt.Println("  JELAJAH TRIP - BOOTSTRAP ADMINISTRATOR PRODUCTION")
	fmt.Println("==================================================")

	nameFlag := flag.String("name", "", "Nama lengkap administrator")
	emailFlag := flag.String("email", "", "Email administrator")
	flag.Parse()

	reader := bufio.NewReader(os.Stdin)

	// 1. Ambil Nama
	name := strings.TrimSpace(*nameFlag)
	if name == "" {
		name = strings.TrimSpace(os.Getenv("ADMIN_NAME"))
	}
	if name == "" {
		fmt.Print("Masukkan Nama Lengkap Admin: ")
		input, _ := reader.ReadString('\n')
		name = strings.TrimSpace(input)
	}
	if name == "" {
		name = "Super Administrator"
	}

	// 2. Ambil Email
	email := strings.TrimSpace(*emailFlag)
	if email == "" {
		email = strings.TrimSpace(os.Getenv("ADMIN_EMAIL"))
	}
	if email == "" {
		fmt.Print("Masukkan Email Admin: ")
		input, _ := reader.ReadString('\n')
		email = strings.TrimSpace(input)
	}

	email = strings.ToLower(email)
	if _, err := mail.ParseAddress(email); err != nil || email == "" {
		log.Fatalf("[Error] Format email '%s' tidak valid\n", email)
	}

	// 3. Ambil Kata Sandi (tidak pernah hardcoded)
	// Hanya dari environment variable ADMIN_INITIAL_PASSWORD atau prompt tersembunyi
	password := strings.TrimSpace(os.Getenv("ADMIN_INITIAL_PASSWORD"))
	if password == "" {
		fmt.Print("Masukkan Kata Sandi Admin (minimal 8 karakter, input tersembunyi): ")
		if term.IsTerminal(int(os.Stdin.Fd())) {
			bytePassword, err := term.ReadPassword(int(os.Stdin.Fd()))
			fmt.Println()
			if err != nil {
				log.Fatalf("[Error] Gagal membaca password dari terminal: %v\n", err)
			}
			password = strings.TrimSpace(string(bytePassword))
		} else {
			// Fallback jika proses di-pipe/non-tty
			input, _ := reader.ReadString('\n')
			password = strings.TrimSpace(input)
		}
	}

	if len(password) < 8 {
		log.Fatalln("[Error] Kata sandi administrator wajib memiliki panjang minimal 8 karakter")
	}

	// 4. Inisialisasi Database
	_, err := config.Load()
	if err != nil {
		log.Fatalf("[Error] Konfigurasi environment gagal: %v\n", err)
	}

	db, err := database.ConnectPostgres()
	if err != nil {
		log.Fatalf("[Fatal] Koneksi ke database gagal: %v\n", err)
	}

	userRepo := repository.NewUserRepository(db)
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// 5. Enkripsi Password dengan Bcrypt Cost 12 (Standar Industri)
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil {
		log.Fatalf("[Error] Gagal melakukan hashing password: %v\n", err)
	}

	// 6. Cek apakah akun dengan email ini sudah ada
	existingUser, _ := userRepo.GetByEmail(ctx, email)
	if existingUser != nil {
		// Perbarui akun yang ada menjadi admin dan update password
		existingUser.Name = name
		existingUser.Role = domain.RoleAdmin
		existingUser.PasswordHash = string(hashedPassword)
		existingUser.UpdatedAt = time.Now()

		if err := db.Save(existingUser).Error; err != nil {
			log.Fatalf("[Error] Gagal memperbarui akun admin yang ada: %v\n", err)
		}

		fmt.Printf("\n[Sukses] Akun yang ada berhasil ditingkatkan menjadi Administrator!\n")
		fmt.Printf("ID Pengguna: %s\n", existingUser.ID)
		fmt.Printf("Email      : %s\n", existingUser.Email)
		fmt.Printf("Nama       : %s\n", existingUser.Name)
		fmt.Printf("Role       : %s\n", existingUser.Role)
	} else {
		// Buat akun admin baru
		newAdmin := domain.User{
			ID:           uuid.New(),
			Name:         name,
			Email:        email,
			PasswordHash: string(hashedPassword),
			Role:         domain.RoleAdmin,
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		}

		if err := userRepo.Create(ctx, &newAdmin); err != nil {
			log.Fatalf("[Error] Gagal membuat akun administrator baru: %v\n", err)
		}

		fmt.Printf("\n[Sukses] Akun Administrator baru berhasil dibuat!\n")
		fmt.Printf("ID Pengguna: %s\n", newAdmin.ID)
		fmt.Printf("Email      : %s\n", newAdmin.Email)
		fmt.Printf("Nama       : %s\n", newAdmin.Name)
		fmt.Printf("Role       : %s\n", newAdmin.Role)
	}

	fmt.Println("==================================================")
	fmt.Println("  BOOTSTRAP SELESAI SECARA AMAN")
	fmt.Println("==================================================")
}
