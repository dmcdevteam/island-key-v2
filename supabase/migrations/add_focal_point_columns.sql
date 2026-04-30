-- Add focal point columns (percentage 0–100) for hero/cover image crop control.
-- focal_x: horizontal position, focal_y: vertical position.
-- Applies to the first/cover image on each content type.

ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS focal_x NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS focal_y NUMERIC(5,2);

ALTER TABLE public.vehicle_types
  ADD COLUMN IF NOT EXISTS focal_x NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS focal_y NUMERIC(5,2);

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS focal_x NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS focal_y NUMERIC(5,2);

ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS focal_x NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS focal_y NUMERIC(5,2);

ALTER TABLE public.rentals
  ADD COLUMN IF NOT EXISTS focal_x NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS focal_y NUMERIC(5,2);
