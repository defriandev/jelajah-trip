package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Role string

const (
	RoleCustomer Role = "customer"
	RoleAdmin    Role = "admin"
)

type BookingStatus string

const (
	StatusPending   BookingStatus = "pending"
	StatusConfirmed BookingStatus = "confirmed"
	StatusCancelled BookingStatus = "cancelled"
	StatusCompleted BookingStatus = "completed"
)

type User struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Name         string    `gorm:"size:255;not null" json:"name"`
	Email        string    `gorm:"size:255;unique;not null" json:"email"`
	PasswordHash string    `gorm:"size:255;not null" json:"-"`
	Role         Role      `gorm:"type:varchar(20);default:'customer';not null" json:"role"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type Trip struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Title       string    `gorm:"size:255;not null" json:"title"`
	Destination string    `gorm:"size:255;not null" json:"destination"`
	Description string    `gorm:"type:text;not null" json:"description"`
	Price       float64   `gorm:"type:decimal(12,2);not null" json:"price"`
	Duration    string    `gorm:"size:100;not null" json:"duration"`
	Facilities  []string  `gorm:"serializer:json" json:"facilities"`
	Quota       int       `gorm:"not null" json:"quota"`
	ImageURL    string    `gorm:"size:1024;not null" json:"image_url"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
	Reviews     []Review       `gorm:"foreignKey:TripID;constraint:OnDelete:CASCADE" json:"reviews,omitempty"`
}

type Booking struct {
	ID            uuid.UUID     `gorm:"type:uuid;primaryKey" json:"id"`
	BookingCode   string        `gorm:"size:50;unique;not null" json:"booking_code"`
	UserID        *uuid.UUID    `gorm:"type:uuid;index" json:"user_id,omitempty"`
	TripID        uuid.UUID     `gorm:"type:uuid;not null;index" json:"trip_id"`
	CustomerName  string        `gorm:"size:255;not null" json:"customer_name"`
	CustomerEmail string        `gorm:"size:255;not null" json:"customer_email"`
	CustomerPhone string        `gorm:"size:50;not null" json:"customer_phone"`
	TravelDate    string        `gorm:"type:varchar(20);not null" json:"travel_date"`
	Pax           int           `gorm:"not null" json:"pax"`
	TotalPrice    float64       `gorm:"type:decimal(12,2);not null" json:"total_price"`
	Status        BookingStatus `gorm:"type:varchar(20);default:'pending';not null" json:"status"`
	CreatedAt     time.Time     `json:"created_at"`
	UpdatedAt     time.Time     `json:"updated_at"`

	Trip *Trip `gorm:"foreignKey:TripID" json:"trip,omitempty"`
	User *User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

type Review struct {
	ID        uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	TripID    uuid.UUID  `gorm:"type:uuid;not null;index" json:"trip_id"`
	UserID    uuid.UUID  `gorm:"type:uuid;not null;index" json:"user_id"`
	BookingID *uuid.UUID `gorm:"type:uuid;uniqueIndex" json:"booking_id,omitempty"`
	Rating    int        `gorm:"not null" json:"rating"`
	Comment   string     `gorm:"type:text;not null" json:"comment"`
	CreatedAt time.Time  `json:"created_at"`

	User    *User    `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Booking *Booking `gorm:"foreignKey:BookingID" json:"booking,omitempty"`
}

type FAQ struct {
	ID       uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	Question string `gorm:"type:text;not null" json:"question"`
	Answer   string `gorm:"type:text;not null" json:"answer"`
}

type RefreshToken struct {
	ID        uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	UserID    uuid.UUID  `gorm:"type:uuid;not null;index" json:"user_id"`
	TokenHash string     `gorm:"size:255;uniqueIndex;not null" json:"token_hash"`
	ExpiresAt time.Time  `gorm:"not null;index" json:"expires_at"`
	RevokedAt *time.Time `gorm:"index" json:"revoked_at,omitempty"`
	CreatedAt time.Time  `json:"created_at"`

	User *User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}
