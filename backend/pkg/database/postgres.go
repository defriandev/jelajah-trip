package database

import (
	"fmt"
	"log"
	"os"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func ConnectPostgres() (*gorm.DB, error) {
	dbURL := os.Getenv("DATABASE_URL")
	var dsn string
	if dbURL != "" {
		dsn = dbURL
		log.Println("[Database] Menghubungkan ke PostgreSQL menggunakan DATABASE_URL")
	} else {
		host := os.Getenv("DB_HOST")
		if host == "" {
			host = "localhost"
		}
		port := os.Getenv("DB_PORT")
		if port == "" {
			port = "5432"
		}
		user := os.Getenv("DB_USER")
		if user == "" {
			user = "postgres"
		}
		password := os.Getenv("DB_PASSWORD")
		dbname := os.Getenv("DB_NAME")
		if dbname == "" {
			dbname = "jelajah_trip"
		}
		sslmode := os.Getenv("DB_SSLMODE")
		if sslmode == "" {
			sslmode = "disable"
		}

		if password != "" {
			dsn = fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s&timezone=Asia/Jakarta",
				user, password, host, port, dbname, sslmode)
		} else {
			dsn = fmt.Sprintf("postgres://%s@%s:%s/%s?sslmode=%s&timezone=Asia/Jakarta",
				user, host, port, dbname, sslmode)
		}
		log.Printf("[Database] Menghubungkan ke PostgreSQL: host=%s port=%s user=%s dbname=%s\n", host, port, user, dbname)
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return nil, fmt.Errorf("gagal terhubung ke database postgres: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}

	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	log.Println("[Database] Berhasil terhubung ke database PostgreSQL")
	return db, nil
}
