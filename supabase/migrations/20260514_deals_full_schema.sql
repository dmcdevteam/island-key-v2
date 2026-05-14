-- ============================================================
-- Deals table: complete Phase 2 schema
-- The deals table was created before the Phase 2 migration and
-- CREATE TABLE IF NOT EXISTS left it with only ~11 columns.
-- This migration renames expires_at -> valid_until and adds all
-- missing Phase 2 columns.
-- Run in Supabase SQL editor.
-- ============================================================

-- Step 1: Rename the old expires_at column to valid_until and make nullable
ALTER TABLE public.deals RENAME COLUMN expires_at TO valid_until;
ALTER TABLE public.deals ALTER COLUMN valid_until DROP NOT NULL;

-- Step 2: Add all Phase 2 columns that were missing
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS slug               text;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS short_description  text;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS property_id        uuid REFERENCES public.properties(id);
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS discount_type      text CHECK (discount_type IN ('percentage','fixed','freebie','upgrade','custom'));
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS discount_value     numeric;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS discount_label     text;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS currency           text NOT NULL DEFAULT 'EUR';
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS code               text;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS terms              text;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS valid_from         timestamptz DEFAULT NOW();
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS max_redemptions    integer;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS total_redemptions  integer NOT NULL DEFAULT 0;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS images             text[];
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS is_featured        boolean NOT NULL DEFAULT false;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS sort_order         integer NOT NULL DEFAULT 0;

-- Step 3: Back-fill slug for any existing rows (table should be empty but just in case)
UPDATE public.deals SET slug = 'deal-' || SUBSTRING(id::text, 1, 8) WHERE slug IS NULL;

-- Step 4: Add partial unique index on slug (null-safe)
CREATE UNIQUE INDEX IF NOT EXISTS deals_slug_key ON public.deals(slug) WHERE slug IS NOT NULL;
