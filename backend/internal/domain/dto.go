package domain

type RegisterRequest struct {
	Name     string `json:"name" validate:"required,min=3,max=100"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

type AuthResponse struct {
	User User `json:"user"`
}

type Meta struct {
	Total      int64 `json:"total"`
	Page       int   `json:"page"`
	Limit      int   `json:"limit"`
	TotalPages int   `json:"total_pages"`
}

func CalculateMeta(total int64, page, limit int) *Meta {
	if limit <= 0 {
		limit = 12
	}
	if page <= 0 {
		page = 1
	}
	totalPages := int((total + int64(limit) - 1) / int64(limit))
	if totalPages <= 0 {
		totalPages = 1
	}
	return &Meta{
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}
}

type PaginationParams struct {
	Page  int    `json:"page" query:"page"`
	Limit int    `json:"limit" query:"limit"`
	Sort  string `json:"sort" query:"sort"`
	Order string `json:"order" query:"order"`
}

type TripFilter struct {
	PaginationParams
	Search      string  `json:"search" query:"search"`
	Destination string  `json:"destination" query:"destination"`
	MinPrice    float64 `json:"min_price" query:"min_price"`
	MaxPrice    float64 `json:"max_price" query:"max_price"`
	Duration    string  `json:"duration" query:"duration"`
	SortBy      string  `json:"sort_by" query:"sort_by"`
}

type BookingFilter struct {
	PaginationParams
	Status string `json:"status" query:"status"`
	Search string `json:"search" query:"search"`
}

type ReviewFilter struct {
	PaginationParams
	TripID string `json:"trip_id" query:"trip_id"`
}

type CreateTripRequest struct {
	Title       string   `json:"title" validate:"required,min=3,max=255"`
	Destination string   `json:"destination" validate:"required,min=2,max=255"`
	Description string   `json:"description" validate:"required,min=10"`
	Price       float64  `json:"price" validate:"required,gt=0"`
	Duration    string   `json:"duration" validate:"required"`
	Facilities  []string `json:"facilities"`
	Quota       int      `json:"quota" validate:"required,gt=0"`
	ImageURL    string   `json:"image_url" validate:"required,url"`
}

type UpdateTripRequest struct {
	Title       string   `json:"title" validate:"required,min=3,max=255"`
	Destination string   `json:"destination" validate:"required,min=2,max=255"`
	Description string   `json:"description" validate:"required,min=10"`
	Price       float64  `json:"price" validate:"required,gt=0"`
	Duration    string   `json:"duration" validate:"required"`
	Facilities  []string `json:"facilities"`
	Quota       int      `json:"quota" validate:"required,gte=0"`
	ImageURL    string   `json:"image_url" validate:"required,url"`
}

type CreateBookingRequest struct {
	TripID        string `json:"trip_id" validate:"required,uuid"`
	CustomerName  string `json:"customer_name" validate:"required,min=3,max=100"`
	CustomerEmail string `json:"customer_email" validate:"required,email"`
	CustomerPhone string `json:"customer_phone" validate:"required,id_phone"`
	TravelDate    string `json:"travel_date" validate:"required,date_not_past"`
	Pax           int    `json:"pax" validate:"required,min=1,max=50"`
}

type TrackBookingRequest struct {
	BookingCode  string `json:"booking_code" validate:"required"`
	Verification string `json:"verification" validate:"required"` // Email or last 4 digits of phone
}

type UpdateBookingStatusRequest struct {
	Status BookingStatus `json:"status" validate:"required,oneof=pending confirmed cancelled completed"`
}

type CreateReviewRequest struct {
	TripID    string `json:"trip_id" validate:"required,uuid"`
	BookingID string `json:"booking_id,omitempty"`
	Rating    int    `json:"rating" validate:"required,min=1,max=5"`
	Comment   string `json:"comment" validate:"required,min=5,max=1000"`
}

type CreateFAQRequest struct {
	Question string `json:"question" validate:"required,min=5"`
	Answer   string `json:"answer" validate:"required,min=5"`
}

type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Meta    *Meta       `json:"meta,omitempty"`
	Error   interface{} `json:"error,omitempty"`
}

type DashboardStats struct {
	TotalBookings   int64   `json:"total_bookings"`
	TotalRevenue    float64 `json:"total_revenue"`
	TotalTrips      int64   `json:"total_trips"`
	PendingBookings int64   `json:"pending_bookings"`
}
