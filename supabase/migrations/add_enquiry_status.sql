-- Add 'enquiry' status to bookings table
-- Run this against your Supabase project via the SQL editor or CLI

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('enquiry','pending','confirmed','cancelled','completed','refunded'));
