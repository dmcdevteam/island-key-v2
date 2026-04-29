-- ═══════════════════════════════════════════════════════════════
-- Transfer columns for bookings table
-- Run this in the Supabase SQL editor
-- ═══════════════════════════════════════════════════════════════

-- 1. Make item_id nullable — transfers have no activity/deal item
ALTER TABLE public.bookings ALTER COLUMN item_id DROP NOT NULL;

-- 2. Add all transfer-specific columns
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS pickup_at        timestamptz,
  ADD COLUMN IF NOT EXISTS pickup_location  text,
  ADD COLUMN IF NOT EXISTS dropoff_location text,
  ADD COLUMN IF NOT EXISTS flight_number    text,
  ADD COLUMN IF NOT EXISTS pax_count        integer,
  ADD COLUMN IF NOT EXISTS luggage_count    integer,
  ADD COLUMN IF NOT EXISTS vehicle_class    text,
  ADD COLUMN IF NOT EXISTS driver_name      text,
  ADD COLUMN IF NOT EXISTS driver_phone     text,
  ADD COLUMN IF NOT EXISTS transfer_type    text,
  ADD COLUMN IF NOT EXISTS distance_km      numeric(8,2),
  ADD COLUMN IF NOT EXISTS duration_min     integer,
  ADD COLUMN IF NOT EXISTS extras           text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS notes            text;
