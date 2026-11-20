package config

import (
	"errors"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

// Config menampung seluruh konfigurasi aplikasi dari environment variable
type Config struct {
	AppEnv              string
	Port                string
	DatabaseURL         string
	JWTSecret           string
	JWTExpiresIn        time.Duration
	JWTRefreshSecret    string
	JWTRefreshExpiresIn time.Duration
	CORSAllowedOrigins  []string
	ProxyHeader         string
	TrustedProxies      []string
}

// Load membaca environment variable dan memvalidasi aturan keamanan
func Load() (*Config, error) {
	_ = godotenv.Load()

	appEnv := strings.TrimSpace(os.Getenv("APP_ENV"))
	if appEnv == "" {
		appEnv = "development"
	}

	port := strings.TrimSpace(os.Getenv("PORT"))
	if port == "" {
		port = "8080"
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	jwtRefreshSecret := os.Getenv("JWT_REFRESH_SECRET")

	// Aturan 1.1: Aplikasi harus gagal start jika JWT_SECRET kosong atau < 32 karakter saat APP_ENV=production
	if strings.ToLower(appEnv) == "production" {
		if jwtSecret == "" {
			return nil, errors.New("konfigurasi fatal: JWT_SECRET tidak boleh kosong saat APP_ENV=production")
		}
		if len(jwtSecret) < 32 {
			return nil, fmt.Errorf("konfigurasi fatal: JWT_SECRET terlalu pendek untuk environment production (panjang %d, minimal 32 karakter)", len(jwtSecret))
		}
	} else {
		// Nilai fallback yang aman untuk environment development/testing
		if jwtSecret == "" {
			jwtSecret = "jelajahtrip_super_secret_jwt_key_2026_portfolio_min32chars"
		}
	}

	if jwtRefreshSecret == "" {
		jwtRefreshSecret = jwtSecret + "_refresh_secret_token_key"
	}

	// Parsing durasi masa aktif JWT
	jwtExpStr := os.Getenv("JWT_EXPIRES_IN")
	jwtExp, err := time.ParseDuration(jwtExpStr)
	if err != nil || jwtExp == 0 {
		jwtExp = 15 * time.Minute // Default access token: 15 menit
	}

	jwtRefreshExpStr := os.Getenv("JWT_REFRESH_EXPIRES_IN")
	jwtRefreshExp, err := time.ParseDuration(jwtRefreshExpStr)
	if err != nil || jwtRefreshExp == 0 {
		jwtRefreshExp = 7 * 24 * time.Hour // Default refresh token: 7 hari
	}

	// CORS Origins
	corsOriginsStr := os.Getenv("CORS_ALLOWED_ORIGINS")
	var corsOrigins []string
	if corsOriginsStr != "" {
		for _, o := range strings.Split(corsOriginsStr, ",") {
			trimmed := strings.TrimSpace(o)
			if trimmed != "" {
				corsOrigins = append(corsOrigins, trimmed)
			}
		}
	}
	if len(corsOrigins) == 0 {
		corsOrigins = []string{"http://localhost:5173", "http://127.0.0.1:5173"}
	}

	// Database URL
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbHost := os.Getenv("DB_HOST")
		if dbHost == "" {
			dbHost = "localhost"
		}
		dbPort := os.Getenv("DB_PORT")
		if dbPort == "" {
			dbPort = "5432"
		}
		dbUser := os.Getenv("DB_USER")
		if dbUser == "" {
			dbUser = "postgres"
		}
		dbPassword := os.Getenv("DB_PASSWORD")
		dbName := os.Getenv("DB_NAME")
		if dbName == "" {
			dbName = "jelajah_trip"
		}
		dbSSLMode := os.Getenv("DB_SSLMODE")
		if dbSSLMode == "" {
			dbSSLMode = "disable"
		}

		if dbPassword != "" {
			dbURL = fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s", dbUser, dbPassword, dbHost, dbPort, dbName, dbSSLMode)
		} else {
			dbURL = fmt.Sprintf("postgres://%s@%s:%s/%s?sslmode=%s", dbUser, dbHost, dbPort, dbName, dbSSLMode)
		}
	}

	// Proxy Header & Trusted Proxies (Fase 1.5)
	proxyHeader := strings.TrimSpace(os.Getenv("PROXY_HEADER"))
	trustedProxiesStr := os.Getenv("TRUSTED_PROXIES")
	var trustedProxies []string
	if trustedProxiesStr != "" {
		for _, p := range strings.Split(trustedProxiesStr, ",") {
			trimmed := strings.TrimSpace(p)
			if trimmed != "" {
				trustedProxies = append(trustedProxies, trimmed)
			}
		}
	}

	return &Config{
		AppEnv:              appEnv,
		Port:                port,
		DatabaseURL:         dbURL,
		JWTSecret:           jwtSecret,
		JWTExpiresIn:        jwtExp,
		JWTRefreshSecret:    jwtRefreshSecret,
		JWTRefreshExpiresIn: jwtRefreshExp,
		CORSAllowedOrigins:  corsOrigins,
		ProxyHeader:         proxyHeader,
		TrustedProxies:      trustedProxies,
	}, nil
}
