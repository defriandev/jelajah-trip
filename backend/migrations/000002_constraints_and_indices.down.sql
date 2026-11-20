-- =========================================================================
-- MIGRATION: 000002_constraints_and_indices.down.sql
-- Keterangan: Penghapusan CHECK constraints & Index
-- =========================================================================

-- Drop Indexes
DROP INDEX IF EXISTS idx_refresh_tokens_user_id;
DROP INDEX IF EXISTS idx_refresh_tokens_token_hash;
DROP INDEX IF EXISTS idx_reviews_trip_id;
DROP INDEX IF EXISTS idx_trips_deleted_at;
DROP INDEX IF EXISTS idx_trips_destination;
DROP INDEX IF EXISTS idx_bookings_created_at_desc;
DROP INDEX IF EXISTS idx_bookings_trip_id_status;
DROP INDEX IF EXISTS idx_bookings_user_id;
DROP INDEX IF EXISTS idx_bookings_booking_code_unique;
DROP INDEX IF EXISTS idx_reviews_booking_id_unique;

-- Drop Constraints
ALTER TABLE IF EXISTS users DROP CONSTRAINT IF EXISTS chk_users_role_valid;
ALTER TABLE IF EXISTS reviews DROP CONSTRAINT IF EXISTS chk_reviews_rating_range;
ALTER TABLE IF EXISTS bookings DROP CONSTRAINT IF EXISTS chk_bookings_status_valid;
ALTER TABLE IF EXISTS bookings DROP CONSTRAINT IF EXISTS chk_bookings_total_price_non_negative;
ALTER TABLE IF EXISTS bookings DROP CONSTRAINT IF EXISTS chk_bookings_pax_range;
ALTER TABLE IF EXISTS trips DROP CONSTRAINT IF EXISTS chk_trips_price_non_negative;
ALTER TABLE IF EXISTS trips DROP CONSTRAINT IF EXISTS chk_trips_quota_non_negative;
