-- =========================================================================
-- MIGRATION: 000001_baseline_schema.up.sql
-- Keterangan: Pembuatan skema dasar tabel dengan IF NOT EXISTS (Idempotent)
-- =========================================================================

-- 1. Tabel Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'customer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Trips
CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    duration VARCHAR(100) NOT NULL,
    facilities JSONB DEFAULT '[]'::jsonb,
    quota INT NOT NULL DEFAULT 0,
    image_url VARCHAR(1024) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

-- Pastikan kolom deleted_at ada jika tabel trips sudah ada sebelumnya
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trips' AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE trips ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;
END $$;

-- 3. Tabel Bookings
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY,
    booking_code VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    travel_date VARCHAR(20) NOT NULL,
    pax INT NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabel Reviews
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY,
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    booking_id UUID UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    rating INT NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabel FAQs
CREATE TABLE IF NOT EXISTS faqs (
    id BIGSERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL
);

-- 6. Tabel Refresh Tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
