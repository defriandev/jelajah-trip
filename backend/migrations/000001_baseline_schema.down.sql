-- =========================================================================
-- MIGRATION: 000001_baseline_schema.down.sql
-- Keterangan: Pembongkaran tabel sesuai urutan relasi foreign key
-- =========================================================================

DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS faqs CASCADE;
DROP TABLE IF EXISTS trips CASCADE;
DROP TABLE IF EXISTS users CASCADE;
