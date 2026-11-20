package http

import (
	"fmt"
	"jelajah-trip-backend/internal/domain"
	"log/slog"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

var validate *validator.Validate
var indonesianPhoneRegex = domain.IndonesianPhoneRegex

func init() {
	validate = validator.New()

	// Custom validator: nomor telepon Indonesia aktif
	_ = validate.RegisterValidation("id_phone", func(fl validator.FieldLevel) bool {
		phone := strings.TrimSpace(fl.Field().String())
		phone = strings.ReplaceAll(phone, "-", "")
		phone = strings.ReplaceAll(phone, " ", "")
		return indonesianPhoneRegex.MatchString(phone)
	})

	// Custom validator: tanggal keberangkatan tidak boleh di masa lalu (berdasarkan zona waktu Asia/Jakarta / WIB)
	_ = validate.RegisterValidation("date_not_past", func(fl validator.FieldLevel) bool {
		val := strings.TrimSpace(fl.Field().String())
		if val == "" {
			return false
		}

		loc, err := time.LoadLocation("Asia/Jakarta")
		if err != nil {
			loc = time.FixedZone("WIB", 7*3600)
		}

		formats := []string{
			"2006-01-02",
			"02-01-2006",
			"2006/01/02",
			"02/01/2006",
			"2 Jan 2006",
			"02 Jan 2006",
			"2 January 2006",
		}

		var parsedTime time.Time
		var parseErr error
		for _, f := range formats {
			parsedTime, parseErr = time.ParseInLocation(f, val, loc)
			if parseErr == nil {
				break
			}
		}

		if parseErr != nil {
			yearRegex := regexp.MustCompile(`\b(20\d\d)\b`)
			if m := yearRegex.FindString(val); m != "" {
				nowJakarta := time.Now().In(loc)
				if y, _ := time.Parse("2006", m); y.Year() >= nowJakarta.Year() {
					return true
				}
			}
			return false
		}

		nowJakarta := time.Now().In(loc)
		todayMidnightJakarta := time.Date(nowJakarta.Year(), nowJakarta.Month(), nowJakarta.Day(), 0, 0, 0, 0, loc)
		return !parsedTime.Before(todayMidnightJakarta)
	})
}

// ValidateStruct memvalidasi struct dan mengembalikan AppError terstandar
func ValidateStruct(s interface{}) error {
	if err := validate.Struct(s); err != nil {
		if validationErrors, ok := err.(validator.ValidationErrors); ok {
			details := make([]domain.ErrorDetail, 0, len(validationErrors))
			for _, e := range validationErrors {
				var msg string
				switch e.Tag() {
				case "required":
					msg = fmt.Sprintf("field '%s' wajib diisi", e.Field())
				case "email":
					msg = fmt.Sprintf("format email '%s' tidak valid", e.Value())
				case "min":
					msg = fmt.Sprintf("field '%s' minimal %s karakter/nilai", e.Field(), e.Param())
				case "max":
					msg = fmt.Sprintf("field '%s' maksimal %s karakter/nilai", e.Field(), e.Param())
				case "id_phone":
					msg = "nomor telepon tidak valid (harus nomor Indonesia aktif, misal 08123456789 atau +628123456789)"
				case "date_not_past":
					msg = fmt.Sprintf("tanggal perjalanan '%s' tidak boleh di masa lalu (zona waktu Asia/Jakarta)", e.Value())
				case "uuid":
					msg = fmt.Sprintf("format ID '%s' tidak valid (bukan UUID)", e.Field())
				default:
					msg = fmt.Sprintf("field '%s' gagal validasi '%s'", e.Field(), e.Tag())
				}
				details = append(details, domain.ErrorDetail{
					Field:   e.Field(),
					Message: msg,
				})
			}
			return domain.NewValidationError("Validasi data masukan gagal", details)
		}
		return domain.NewValidationError(err.Error(), nil)
	}
	return nil
}

// RequestIDMiddleware menyematkan atau meneruskan X-Request-ID
func RequestIDMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		reqID := c.Get("X-Request-ID")
		if reqID == "" {
			reqID = uuid.New().String()
		}
		c.Set("X-Request-ID", reqID)
		c.Locals("requestid", reqID)
		return c.Next()
	}
}

// SlogLoggerMiddleware mencatat akses HTTP secara terstruktur via log/slog
func SlogLoggerMiddleware(logger *slog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()
		err := c.Next()
		latency := time.Since(start)

		status := c.Response().StatusCode()
		method := c.Method()
		path := c.Path()
		reqID, _ := c.Locals("requestid").(string)

		var userIDStr string
		if uID := c.Locals("userID"); uID != nil {
			userIDStr = fmt.Sprintf("%v", uID)
		}

		attrs := []slog.Attr{
			slog.String("method", method),
			slog.String("path", path),
			slog.Int("status", status),
			slog.Duration("latency", latency),
			slog.String("request_id", reqID),
		}
		if userIDStr != "" {
			attrs = append(attrs, slog.String("user_id", userIDStr))
		}

		// Keamanan: Jangan pernah mencatat token, cookie, atau password
		if status >= 500 {
			logger.LogAttrs(c.Context(), slog.LevelError, "HTTP Request Error", attrs...)
		} else if status >= 400 {
			logger.LogAttrs(c.Context(), slog.LevelWarn, "HTTP Client Warning", attrs...)
		} else {
			logger.LogAttrs(c.Context(), slog.LevelInfo, "HTTP Request Handled", attrs...)
		}

		return err
	}
}

func JWTMiddleware(jwtSecret string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		var tokenString string

		if authHeader != "" {
			parts := strings.Split(authHeader, " ")
			if len(parts) == 2 && strings.ToLower(parts[0]) == "bearer" {
				tokenString = parts[1]
			}
		}

		// Fallback ke cookie jika ada
		if tokenString == "" {
			tokenString = c.Cookies("access_token")
		}

		if tokenString == "" {
			return sendErrorResponse(c, fiber.StatusUnauthorized, "UNAUTHORIZED", "Header Authorization atau sesi login diperlukan", nil)
		}

		token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fiber.ErrUnauthorized
			}
			return []byte(jwtSecret), nil
		})

		if err != nil || !token.Valid {
			return sendErrorResponse(c, fiber.StatusUnauthorized, "UNAUTHORIZED", "Sesi login Anda tidak valid atau telah kedaluwarsa", nil)
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			return sendErrorResponse(c, fiber.StatusUnauthorized, "UNAUTHORIZED", "Data sesi tidak dapat diproses", nil)
		}

		subStr, _ := claims["sub"].(string)
		userID, err := uuid.Parse(subStr)
		if err != nil {
			return sendErrorResponse(c, fiber.StatusUnauthorized, "UNAUTHORIZED", "ID pengguna dalam token tidak valid", nil)
		}

		roleStr, _ := claims["role"].(string)

		c.Locals("userID", userID)
		c.Locals("userRole", domain.Role(roleStr))
		return c.Next()
	}
}

func OptionalJWTMiddleware(jwtSecret string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		var tokenString string

		if authHeader != "" {
			parts := strings.Split(authHeader, " ")
			if len(parts) == 2 && strings.ToLower(parts[0]) == "bearer" {
				tokenString = parts[1]
			}
		}

		if tokenString == "" {
			tokenString = c.Cookies("access_token")
		}

		if tokenString != "" {
			token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
				if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, fiber.ErrUnauthorized
				}
				return []byte(jwtSecret), nil
			})

			if err == nil && token.Valid {
				if claims, ok := token.Claims.(jwt.MapClaims); ok {
					if subStr, ok := claims["sub"].(string); ok {
						if userID, err := uuid.Parse(subStr); err == nil {
							c.Locals("userID", userID)
						}
					}
					if roleStr, ok := claims["role"].(string); ok {
						c.Locals("userRole", domain.Role(roleStr))
					}
				}
			}
		}

		return c.Next()
	}
}

func AdminOnly(c *fiber.Ctx) error {
	role, ok := c.Locals("userRole").(domain.Role)
	if !ok || role != domain.RoleAdmin {
		return sendErrorResponse(c, fiber.StatusForbidden, "FORBIDDEN", "Akses ditolak: Fitur ini hanya dapat diakses oleh Administrator", nil)
	}
	return c.Next()
}

// StrictRateLimiter untuk endpoint sensitif seperti login, register, dan tracking tiket
func StrictRateLimiter() fiber.Handler {
	return limiter.New(limiter.Config{
		Max:        15,
		Expiration: 1 * time.Minute,
		KeyGenerator: func(c *fiber.Ctx) string {
			return c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return sendErrorResponse(c, fiber.StatusTooManyRequests, "RATE_LIMIT_EXCEEDED", "Terlalu banyak permintaan. Silakan tunggu 1 menit sebelum mencoba kembali.", nil)
		},
	})
}

// GeneralRateLimiter untuk endpoint publik lainnya
func GeneralRateLimiter() fiber.Handler {
	return limiter.New(limiter.Config{
		Max:        120,
		Expiration: 1 * time.Minute,
		KeyGenerator: func(c *fiber.Ctx) string {
			return c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return sendErrorResponse(c, fiber.StatusTooManyRequests, "RATE_LIMIT_EXCEEDED", "Terlalu banyak permintaan ke API. Silakan tunggu sejenak.", nil)
		},
	})
}

// TrackingFailureLimiter membatasi percobaan gagal per kode booking (mis. 5 gagal per 15 menit)
type TrackingFailureLimiter struct {
	mu       sync.Mutex
	failures map[string][]time.Time
	maxFails int
	window   time.Duration
}

func NewTrackingFailureLimiter(maxFails int, window time.Duration) *TrackingFailureLimiter {
	return &TrackingFailureLimiter{
		failures: make(map[string][]time.Time),
		maxFails: maxFails,
		window:   window,
	}
}

func (l *TrackingFailureLimiter) IsBlocked(code string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()

	code = strings.ToUpper(strings.TrimSpace(code))
	times, exists := l.failures[code]
	if !exists {
		return false
	}

	cutoff := time.Now().Add(-l.window)
	var active []time.Time
	for _, t := range times {
		if t.After(cutoff) {
			active = append(active, t)
		}
	}
	l.failures[code] = active

	return len(active) >= l.maxFails
}

func (l *TrackingFailureLimiter) RecordFailure(code string) {
	l.mu.Lock()
	defer l.mu.Unlock()

	code = strings.ToUpper(strings.TrimSpace(code))
	cutoff := time.Now().Add(-l.window)
	var active []time.Time
	for _, t := range l.failures[code] {
		if t.After(cutoff) {
			active = append(active, t)
		}
	}
	active = append(active, time.Now())
	l.failures[code] = active
}

func (l *TrackingFailureLimiter) Reset(code string) {
	l.mu.Lock()
	defer l.mu.Unlock()

	code = strings.ToUpper(strings.TrimSpace(code))
	delete(l.failures, code)
}
