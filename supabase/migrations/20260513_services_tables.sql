-- ============================================================
-- Island Key: Services + Service Subcategories tables
-- Run in Supabase SQL Editor
-- ============================================================

-- Main services table
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  short_description TEXT,
  description TEXT,
  category TEXT NOT NULL
    CHECK (category IN ('in_house', 'reservations')),
  subcategory TEXT NOT NULL
    CHECK (subcategory IN (
      'wellness_health', 'family_care', 'food_dining',
      'villa_lifestyle', 'private_experiences',
      'beach_dining_nightlife', 'lifestyle_shopping', 'events_access'
    )),
  service_type TEXT,
  price_from NUMERIC(8,2),
  price_label TEXT,
  duration TEXT,
  includes TEXT[],
  good_to_know TEXT,
  mood_tags TEXT[],
  images TEXT[],
  image_wide TEXT,
  image_square TEXT,
  focal_x NUMERIC(5,2),
  focal_y NUMERIC(5,2),
  focal_sq_x FLOAT,
  focal_sq_y FLOAT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  region TEXT NOT NULL DEFAULT 'chania',
  provider_id UUID REFERENCES public.providers(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

SELECT COUNT(*) AS services_rows FROM public.services;

-- Subcategory hero images + metadata
CREATE TABLE IF NOT EXISTS public.service_subcategories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subcategory TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  tagline TEXT,
  category TEXT NOT NULL CHECK (category IN ('in_house', 'reservations')),
  image_url TEXT,
  image_wide TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

SELECT COUNT(*) AS service_subcategories_rows FROM public.service_subcategories;

-- Seed subcategories
INSERT INTO public.service_subcategories
  (subcategory, label, tagline, category, sort_order) VALUES
  ('wellness_health',       'Wellness & Health',          'Expert therapists and practitioners at your villa',         'in_house',     1),
  ('family_care',           'Family & Care',              'Professional care so you can fully relax',                  'in_house',     2),
  ('food_dining',           'Food & Dining',              'Private chefs and culinary experiences',                    'in_house',     3),
  ('villa_lifestyle',       'Villa & Lifestyle',          'Everything your villa needs, taken care of',                'in_house',     4),
  ('private_experiences',   'Private Experiences',        'Moments money can buy — curated for you',                   'in_house',     5),
  ('beach_dining_nightlife','Beach, Dining & Nightlife',  'The best tables, clubs and sun beds in Crete',             'reservations', 1),
  ('lifestyle_shopping',    'Lifestyle & Shopping',       'Personal shopping and luxury access',                       'reservations', 2),
  ('events_access',         'Events & Access',            'Concerts, festivals, private parties',                      'reservations', 3)
ON CONFLICT DO NOTHING;

SELECT COUNT(*) AS service_subcategories_after_seed FROM public.service_subcategories;
