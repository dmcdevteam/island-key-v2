-- Add item_type column to distinguish activities from services
ALTER TABLE public.activities
ADD COLUMN IF NOT EXISTS item_type text
CHECK (item_type IN ('activity', 'service'))
DEFAULT 'activity';

-- Backfill existing rows
UPDATE public.activities SET item_type = 'activity' WHERE item_type IS NULL;
