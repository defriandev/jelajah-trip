package http

import (
	"os"

	"github.com/gofiber/fiber/v2"
)

const swaggerUIHTML = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Jelajah Trip API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <style>
    body { margin: 0; padding: 0; background-color: #fafafa; font-family: sans-serif; }
    .topbar { display: none !important; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js" crossorigin></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/docs/openapi.yaml',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>`

func SetupRoutes(app *fiber.App, handler *Handler, jwtSecret string) {
	// Liveness & Readiness endpoints (Bebas dari rate limiter ketat)
	app.Get("/health", handler.HealthHandler)
	app.Get("/ready", handler.ReadyHandler)

	// Dokumentasi OpenAPI 3 (Hanya aktif jika APP_ENV != production)
	if handler.cfg != nil && handler.cfg.AppEnv != "production" {
		app.Get("/docs/openapi.yaml", func(c *fiber.Ctx) error {
			c.Set("Content-Type", "application/yaml")
			if _, err := os.Stat("./docs/openapi.yaml"); err == nil {
				return c.SendFile("./docs/openapi.yaml")
			}
			return c.SendFile("../docs/openapi.yaml")
		})
		app.Get("/docs", func(c *fiber.Ctx) error {
			c.Set("Content-Type", "text/html; charset=utf-8")
			return c.SendString(swaggerUIHTML)
		})
	}

	api := app.Group("/api/v1")

	// Global rate limiter untuk API (120 req/menit)
	api.Use(GeneralRateLimiter())

	// Health check di dalam grup api juga disediakan
	api.Get("/health", handler.HealthHandler)
	api.Get("/ready", handler.ReadyHandler)

	// Auth routes (Strict rate limiting: 15 req/menit)
	auth := api.Group("/auth")
	auth.Post("/register", StrictRateLimiter(), handler.Register)
	auth.Post("/login", StrictRateLimiter(), handler.Login)
	auth.Post("/refresh", handler.RefreshToken)
	auth.Post("/logout", handler.Logout)
	auth.Get("/profile", JWTMiddleware(jwtSecret), handler.GetProfile)

	// Trip public routes
	trips := api.Group("/trips")
	trips.Get("/", handler.GetTrips)
	trips.Get("/destinations", handler.GetTripDestinations)
	trips.Get("/:id", handler.GetTripByID)

	// Trip admin routes
	tripsAdmin := trips.Group("", JWTMiddleware(jwtSecret), AdminOnly)
	tripsAdmin.Get("/export/excel", handler.ExportTripsExcel)
	tripsAdmin.Post("/", handler.CreateTrip)
	tripsAdmin.Put("/:id", handler.UpdateTrip)
	tripsAdmin.Delete("/:id", handler.DeleteTrip)

	// Booking routes
	bookings := api.Group("/bookings")
	bookings.Post("/", OptionalJWTMiddleware(jwtSecret), handler.CreateBooking)

	// Aturan 1.3, 1.4, & 1.5: Strict rate limiting untuk tracking tiket
	bookings.Get("/track", StrictRateLimiter(), handler.TrackBooking)
	bookings.Post("/track", StrictRateLimiter(), handler.TrackBooking)
	bookings.Get("/track/:code", StrictRateLimiter(), handler.TrackBooking)

	bookings.Get("/my-bookings", JWTMiddleware(jwtSecret), handler.GetUserBookings)

	// Booking admin routes
	bookingsAdmin := bookings.Group("", JWTMiddleware(jwtSecret), AdminOnly)
	bookingsAdmin.Get("/export/excel", handler.ExportBookingsExcel)
	bookingsAdmin.Get("/", handler.GetAllBookings)
	bookingsAdmin.Get("/admin/stats", handler.GetDashboardStats)
	bookingsAdmin.Patch("/:id/status", handler.UpdateBookingStatus)

	// Review routes
	reviews := api.Group("/reviews")
	reviews.Get("/trip/:trip_id", handler.GetReviewsByTrip)
	reviews.Post("/", JWTMiddleware(jwtSecret), handler.CreateReview)
	reviews.Get("/", JWTMiddleware(jwtSecret), AdminOnly, handler.GetAllReviews)
	reviews.Delete("/:id", JWTMiddleware(jwtSecret), AdminOnly, handler.DeleteReview)

	// FAQ routes
	faqs := api.Group("/faqs")
	faqs.Get("/", handler.GetFAQs)
	faqs.Post("/", JWTMiddleware(jwtSecret), AdminOnly, handler.CreateFAQ)
	faqs.Delete("/:id", JWTMiddleware(jwtSecret), AdminOnly, handler.DeleteFAQ)
}
