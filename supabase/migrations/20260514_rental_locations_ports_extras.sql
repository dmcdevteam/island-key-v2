-- ─── A1. Rental pickup locations ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.rental_pickup_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  lat NUMERIC(10,7),
  lng NUMERIC(10,7),
  google_maps_url TEXT,
  vehicle_categories TEXT[] DEFAULT ARRAY['car','atv_motorbike'],
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.rental_pickup_locations
  (name, address, vehicle_categories, sort_order) VALUES
  ('Chania Airport',
   'Chania International Airport, Souda, 73200',
   ARRAY['car','atv_motorbike'], 1),
  ('Souda Bay',
   'Souda Port, Souda, Chania',
   ARRAY['car','atv_motorbike'], 2),
  ('Chania City Centre',
   'Chania City Centre, 73100',
   ARRAY['car','atv_motorbike'], 3),
  ('Ag. Marina',
   'Agia Marina, Chania',
   ARRAY['car','atv_motorbike'], 4),
  ('Platanias',
   'Platanias, Chania',
   ARRAY['car','atv_motorbike'], 5);

CREATE TABLE IF NOT EXISTS public.rental_vehicle_pickup_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rental_id UUID REFERENCES public.rentals(id) ON DELETE CASCADE,
  pickup_location_id UUID REFERENCES
    public.rental_pickup_locations(id) ON DELETE CASCADE,
  instructions TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(rental_id, pickup_location_id)
);

SELECT COUNT(*) AS pickup_locations FROM public.rental_pickup_locations;

-- ─── A2. Boat ports ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.rental_ports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  area TEXT DEFAULT 'Chania',
  address TEXT,
  lat NUMERIC(10,7),
  lng NUMERIC(10,7),
  google_maps_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.rental_ports (name, area, sort_order) VALUES
  ('Marathi', 'Chania', 1),
  ('Old Port / Venetian Harbour', 'Chania', 2),
  ('Kasteli', 'Chania', 3),
  ('Kolymbari', 'Chania', 4),
  ('Stavros', 'Chania', 5);

SELECT COUNT(*) AS ports FROM public.rental_ports;

-- ─── A3. Vacation Essentials product extensions ────────────────────────────────

ALTER TABLE public.rental_extras
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS full_description TEXT,
  ADD COLUMN IF NOT EXISTS images TEXT[],
  ADD COLUMN IF NOT EXISTS image_wide TEXT,
  ADD COLUMN IF NOT EXISTS image_square TEXT,
  ADD COLUMN IF NOT EXISTS focal_x NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS focal_y NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS external_links JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS usage_instructions TEXT,
  ADD COLUMN IF NOT EXISTS price_3day NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS price_week NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS custom_pricing_note TEXT
    DEFAULT 'Contact us for longer durations';

UPDATE public.rental_extras
  SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'))
  WHERE slug IS NULL;

SELECT COUNT(*) AS extras_with_slugs
  FROM public.rental_extras WHERE slug IS NOT NULL;
