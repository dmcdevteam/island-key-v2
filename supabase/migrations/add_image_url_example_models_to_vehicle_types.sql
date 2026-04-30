-- Add image_url and example_models columns to vehicle_types
-- image_url: custom vehicle photo (overrides frontend VEHICLE_IMAGES fallback)
-- example_models: editable "Toyota Prius, Skoda Octavia or similar" text

ALTER TABLE public.vehicle_types
  ADD COLUMN IF NOT EXISTS image_url      TEXT,
  ADD COLUMN IF NOT EXISTS example_models TEXT;
