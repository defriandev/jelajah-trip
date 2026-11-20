-- =========================================================================
-- MIGRATION: 000002_constraints_and_indices.up.sql
-- Keterangan: Database-level CHECK constraints & Performance Indexes (Defense in Depth)
-- =========================================================================

-- 1. CHECK CONSTRAINTS

-- trips: quota >= 0
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_trips_quota_non_negative'
    ) THEN
        ALTER TABLE trips ADD CONSTRAINT chk_trips_quota_non_negative CHECK (quota >= 0);
    END IF;
END $$;

-- trips: price >= 0
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_trips_price_non_negative'
    ) THEN
        ALTER TABLE trips ADD CONSTRAINT chk_trips_price_non_negative CHECK (price >= 0);
    END IF;
END $$;

-- bookings: pax BETWEEN 1 AND 50
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_bookings_pax_range'
    ) THEN
        ALTER TABLE bookings ADD CONSTRAINT chk_bookings_pax_range CHECK (pax BETWEEN 1 AND 50);
    END IF;
END $$;

-- bookings: total_price >= 0
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_bookings_total_price_non_negative'
    ) THEN
        ALTER TABLE bookings ADD CONSTRAINT chk_bookings_total_price_non_negative CHECK (total_price >= 0);
    END IF;
END $$;

-- bookings: status validasi enum
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_bookings_status_valid'
    ) THEN
        ALTER TABLE bookings ADD CONSTRAINT chk_bookings_status_valid CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed'));
    END IF;
END $$;

-- reviews: rating BETWEEN 1 AND 5
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_reviews_rating_range'
    ) THEN
        ALTER TABLE reviews ADD CONSTRAINT chk_reviews_rating_range CHECK (rating BETWEEN 1 AND 5);
    END IF;
END $$;

-- users: role validasi enum
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_users_role_valid'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT chk_users_role_valid CHECK (role IN ('customer', 'admin'));
    END IF;
END $$;


-- 2. UNIQUE CONSTRAINTS / INDEXES

-- Unique index reviews(booking_id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE tablename = 'reviews' AND indexname = 'idx_reviews_booking_id_unique'
    ) THEN
        CREATE UNIQUE INDEX idx_reviews_booking_id_unique ON reviews (booking_id) WHERE booking_id IS NOT NULL;
    END IF;
END $$;

-- Unique index bookings(booking_code)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE tablename = 'bookings' AND indexname = 'idx_bookings_booking_code_unique'
    ) THEN
        CREATE UNIQUE INDEX idx_bookings_booking_code_unique ON bookings (booking_code);
    END IF;
END $$;


-- 3. PERFORMANCE INDEXES

-- bookings(user_id)
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings (user_id);

-- bookings(trip_id, status)
CREATE INDEX IF NOT EXISTS idx_bookings_trip_id_status ON bookings (trip_id, status);

-- bookings(created_at DESC)
CREATE INDEX IF NOT EXISTS idx_bookings_created_at_desc ON bookings (created_at DESC);

-- trips(destination)
CREATE INDEX IF NOT EXISTS idx_trips_destination ON trips (destination);

-- trips(deleted_at)
CREATE INDEX IF NOT EXISTS idx_trips_deleted_at ON trips (deleted_at);

-- reviews(trip_id)
CREATE INDEX IF NOT EXISTS idx_reviews_trip_id ON reviews (trip_id);

-- refresh_tokens(token_hash)
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens (token_hash);

-- refresh_tokens(user_id)
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens (user_id);
