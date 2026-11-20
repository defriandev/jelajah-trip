package main

import (
	"context"
	"fmt"
	"jelajah-trip-backend/internal/config"
	deliveryHttp "jelajah-trip-backend/internal/delivery/http"
	"jelajah-trip-backend/internal/repository"
	"jelajah-trip-backend/internal/usecase"
	"jelajah-trip-backend/pkg/database"
	"log/slog"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/helmet"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

func main() {
	// Aturan 1.1: Load konfigurasi & validasi keamanan environment
	cfg, err := config.Load()
	if err != nil {
		fmt.Fprintf(os.Stderr, "[Fatal] Konfigurasi tidak valid: %v\n", err)
		os.Exit(1)
	}

	// Aturan 2.6: Setup structured logger slog (JSON di production, text di development)
	var logger *slog.Logger
	if cfg.AppEnv == "production" {
		logger = slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
			Level: slog.LevelInfo,
		}))
	} else {
		logger = slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
			Level: slog.LevelDebug,
		}))
	}
	slog.SetDefault(logger)

	logger.Info("Inisialisasi konfigurasi berhasil",
		slog.String("app_env", cfg.AppEnv),
		slog.String("port", cfg.Port),
	)

	// Inisialisasi Database
	db, err := database.ConnectPostgres()
	if err != nil {
		logger.Error("Inisialisasi database gagal", slog.String("error", err.Error()))
		os.Exit(1)
	}

	sqlDB, err := db.DB()
	if err != nil {
		logger.Error("Gagal mengambil instance sql.DB", slog.String("error", err.Error()))
		os.Exit(1)
	}

	// Aturan 2.1: Migrasi otomatis hanya dijalankan jika APP_ENV=development
	if cfg.AppEnv == "development" {
		logger.Info("Menjalankan migrasi database otomatis untuk lingkungan development...")
		if migErr := database.RunMigrations(sqlDB, "migrations"); migErr != nil {
			logger.Warn("Catatan migrasi otomatis", slog.String("info", migErr.Error()))
		}
	}

	// Aturan 1.2: Seeder berjalan hanya jika APP_ENV != production
	database.SeedDatabase(db, cfg.AppEnv)

	// Inisialisasi Repository
	userRepo := repository.NewUserRepository(db)
	tripRepo := repository.NewTripRepository(db)
	bookingRepo := repository.NewBookingRepository(db)
	reviewRepo := repository.NewReviewRepository(db)
	faqRepo := repository.NewFAQRepository(db)
	refreshTokenRepo := repository.NewRefreshTokenRepository(db)

	// Inisialisasi Usecase
	userUsecase := usecase.NewUserUsecase(userRepo, refreshTokenRepo, cfg.JWTSecret, cfg.JWTExpiresIn, cfg.JWTRefreshSecret, cfg.JWTRefreshExpiresIn)
	userUsecase.SetBookingRepo(bookingRepo)
	tripUsecase := usecase.NewTripUsecase(tripRepo)
	bookingUsecase := usecase.NewBookingUsecase(bookingRepo, tripRepo)
	reviewUsecase := usecase.NewReviewUsecase(reviewRepo, tripRepo, bookingRepo)
	faqUsecase := usecase.NewFAQUsecase(faqRepo)

	// Inisialisasi Delivery / HTTP Handler
	handler := deliveryHttp.NewHandler(userUsecase, tripUsecase, bookingUsecase, reviewUsecase, faqUsecase, cfg)
	handler.SetDB(sqlDB)

	// Inisialisasi Fiber App dengan Server Timeouts, BodyLimit, ErrorHandler terpusat (Fase 2.5 & 2.6)
	fiberConfig := fiber.Config{
		AppName:      "Jelajah Trip Backend v2.0",
		ServerHeader: "Fiber",
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  120 * time.Second,
		BodyLimit:    4 * 1024 * 1024, // 4MB
		ErrorHandler: deliveryHttp.GlobalErrorHandler,
	}
	if cfg.ProxyHeader != "" {
		fiberConfig.ProxyHeader = cfg.ProxyHeader
	}
	if len(cfg.TrustedProxies) > 0 {
		fiberConfig.EnableTrustedProxyCheck = true
		fiberConfig.TrustedProxies = cfg.TrustedProxies
	}
	app := fiber.New(fiberConfig)

	// Global Middlewares
	app.Use(recover.New())
	app.Use(deliveryHttp.RequestIDMiddleware())
	app.Use(deliveryHttp.SlogLoggerMiddleware(logger))

	// Security Headers (Helmet)
	app.Use(helmet.New())

	// CORS spesifik dengan dukungan otomatis untuk localhost, Vercel, dan Cloudflare
	app.Use(cors.New(cors.Config{
		AllowOriginsFunc: func(origin string) bool {
			// Izinkan localhost
			if strings.HasPrefix(origin, "http://localhost:") || strings.HasPrefix(origin, "http://127.0.0.1:") {
				return true
			}
			// Izinkan semua domain deployment Vercel
			if strings.HasSuffix(origin, ".vercel.app") {
				return true
			}
			// Izinkan domain Cloudflare Tunnel
			if strings.HasSuffix(origin, ".trycloudflare.com") {
				return true
			}
			// Cek daftar origin eksplisit dari konfigurasi
			for _, allowed := range cfg.CORSAllowedOrigins {
				if origin == allowed {
					return true
				}
			}
			return false
		},
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization, X-Request-ID",
		AllowMethods:     "GET, POST, HEAD, PUT, DELETE, PATCH, OPTIONS",
		AllowCredentials: true,
	}))

	// Root Welcome Route
	app.Get("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":   "success",
			"message":  "Jelajah Trip Backend API Server is running",
			"version":  "v2.0",
			"app_env":  cfg.AppEnv,
			"health":   "/health",
			"ready":    "/ready",
			"docs":     "/docs",
		})
	})

	// Register Routes
	deliveryHttp.SetupRoutes(app, handler, cfg.JWTSecret)

	// Aturan 2.6: Graceful Shutdown
	stopChan := make(chan os.Signal, 1)
	signal.Notify(stopChan, os.Interrupt, syscall.SIGTERM, syscall.SIGINT)

	go func() {
		<-stopChan
		logger.Info("Menerima sinyal terminasi, memulai graceful shutdown...")
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		if err := app.ShutdownWithContext(ctx); err != nil {
			logger.Error("Error saat graceful shutdown fiber", slog.String("error", err.Error()))
		}
	}()

	logger.Info(fmt.Sprintf("Jelajah Trip API Server berjalan di http://localhost:%s", cfg.Port))
	if err := app.Listen(fmt.Sprintf(":%s", cfg.Port)); err != nil {
		logger.Info("Server dihentikan", slog.String("reason", err.Error()))
	}

	// Tutup koneksi basis data dengan aman
	if err := sqlDB.Close(); err != nil {
		logger.Error("Gagal menutup pool koneksi basis data", slog.String("error", err.Error()))
	} else {
		logger.Info("Pool koneksi database PostgreSQL berhasil ditutup dengan bersih.")
	}
}
