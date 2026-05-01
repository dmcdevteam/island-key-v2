-- Add Sharp-processed image variant URLs and square focal point columns
-- Applies to: activities, events, articles, rentals

-- Activities
ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS image_wide   TEXT,
  ADD COLUMN IF NOT EXISTS image_square TEXT,
  ADD COLUMN IF NOT EXISTS focal_sq_x   FLOAT,
  ADD COLUMN IF NOT EXISTS focal_sq_y   FLOAT;

-- Events
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS image_wide   TEXT,
  ADD COLUMN IF NOT EXISTS image_square TEXT,
  ADD COLUMN IF NOT EXISTS focal_sq_x   FLOAT,
  ADD COLUMN IF NOT EXISTS focal_sq_y   FLOAT;

-- Articles
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS image_wide   TEXT,
  ADD COLUMN IF NOT EXISTS image_square TEXT,
  ADD COLUMN IF NOT EXISTS focal_sq_x   FLOAT,
  ADD COLUMN IF NOT EXISTS focal_sq_y   FLOAT;

-- Rentals
ALTER TABLE rentals
  ADD COLUMN IF NOT EXISTS image_wide   TEXT,
  ADD COLUMN IF NOT EXISTS image_square TEXT,
  ADD COLUMN IF NOT EXISTS focal_sq_x   FLOAT,
  ADD COLUMN IF NOT EXISTS focal_sq_y   FLOAT;
