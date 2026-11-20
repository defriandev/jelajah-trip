package database

import (
	"database/sql"
	"errors"
	"fmt"
	"log"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

// RunMigrations menjalankan migrasi database Up dari folder migrations
func RunMigrations(sqlDB *sql.DB, migrationsDir string) error {
	driver, err := postgres.WithInstance(sqlDB, &postgres.Config{})
	if err != nil {
		return fmt.Errorf("gagal menginisialisasi driver migrasi postgres: %w", err)
	}

	sourceURL := fmt.Sprintf("file://%s", migrationsDir)
	m, err := migrate.NewWithDatabaseInstance(sourceURL, "postgres", driver)
	if err != nil {
		return fmt.Errorf("gagal membuat instance migrator: %w", err)
	}

	err = m.Up()
	if err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return fmt.Errorf("gagal mengeksekusi migrasi up: %w", err)
	}

	if errors.Is(err, migrate.ErrNoChange) {
		log.Println("[Migrator] Skema database sudah versi paling mutakhir (no change).")
	} else {
		log.Println("[Migrator] Seluruh migrasi berhasil diterapkan.")
	}

	return nil
}

// RollbackMigrations memutar balik seluruh migrasi (Down)
func RollbackMigrations(sqlDB *sql.DB, migrationsDir string) error {
	driver, err := postgres.WithInstance(sqlDB, &postgres.Config{})
	if err != nil {
		return fmt.Errorf("gagal menginisialisasi driver migrasi postgres: %w", err)
	}

	sourceURL := fmt.Sprintf("file://%s", migrationsDir)
	m, err := migrate.NewWithDatabaseInstance(sourceURL, "postgres", driver)
	if err != nil {
		return fmt.Errorf("gagal membuat instance migrator: %w", err)
	}

	err = m.Down()
	if err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return fmt.Errorf("gagal mengeksekusi migrasi down: %w", err)
	}

	log.Println("[Migrator] Seluruh migrasi berhasil di-rollback (down).")
	return nil
}

// ForceVersion memaksa nomor versi tertentu jika terjadi dirty state atau adopsi DB lama
func ForceVersion(sqlDB *sql.DB, migrationsDir string, version int) error {
	driver, err := postgres.WithInstance(sqlDB, &postgres.Config{})
	if err != nil {
		return fmt.Errorf("gagal menginisialisasi driver migrasi postgres: %w", err)
	}

	sourceURL := fmt.Sprintf("file://%s", migrationsDir)
	m, err := migrate.NewWithDatabaseInstance(sourceURL, "postgres", driver)
	if err != nil {
		return fmt.Errorf("gagal membuat instance migrator: %w", err)
	}

	return m.Force(version)
}

// GetMigrationVersion mengembalikan versi aktif skema dan status dirty
func GetMigrationVersion(sqlDB *sql.DB, migrationsDir string) (uint, bool, error) {
	driver, err := postgres.WithInstance(sqlDB, &postgres.Config{})
	if err != nil {
		return 0, false, fmt.Errorf("gagal menginisialisasi driver migrasi postgres: %w", err)
	}

	sourceURL := fmt.Sprintf("file://%s", migrationsDir)
	m, err := migrate.NewWithDatabaseInstance(sourceURL, "postgres", driver)
	if err != nil {
		return 0, false, fmt.Errorf("gagal membuat instance migrator: %w", err)
	}

	return m.Version()
}
