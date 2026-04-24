-- ============================================================
-- Island Key Phase 2: Deals, Events, Articles, Info Pages
-- Run this in Supabase SQL editor
-- ============================================================

-- Deals
CREATE TABLE IF NOT EXISTS public.deals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  short_description text,
  provider_id uuid REFERENCES public.providers(id),
  property_id uuid REFERENCES public.properties(id),
  category text CHECK (category IN ('dining', 'activity', 'retail', 'wellness', 'transport', 'accommodation', 'other')),
  discount_type text CHECK (discount_type IN ('percentage', 'fixed', 'freebie', 'upgrade', 'custom')),
  discount_value numeric,
  discount_label text,
  original_price numeric,
  deal_price numeric,
  currency text DEFAULT 'EUR',
  code text,
  terms text,
  valid_from timestamptz DEFAULT NOW(),
  valid_until timestamptz,
  max_redemptions integer,
  total_redemptions integer DEFAULT 0,
  region text DEFAULT 'chania',
  tier_visibility text[] DEFAULT '{B,M,P}',
  images text[],
  is_featured boolean DEFAULT false,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT NOW()
);

-- Events
CREATE TABLE IF NOT EXISTS public.events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  short_description text,
  category text CHECK (category IN ('festival', 'music', 'food', 'sport', 'cultural', 'market', 'nightlife', 'family', 'other')),
  start_date timestamptz NOT NULL,
  end_date timestamptz,
  all_day boolean DEFAULT false,
  recurring boolean DEFAULT false,
  recurring_pattern text CHECK (recurring_pattern IN ('weekly', 'monthly', 'annual')),
  location_name text,
  location_address text,
  location_lat numeric,
  location_lng numeric,
  price_from numeric,
  price_label text,
  is_free boolean DEFAULT false,
  booking_url text,
  organiser text,
  region text DEFAULT 'chania',
  tier_visibility text[] DEFAULT '{B,M,P}',
  images text[],
  is_featured boolean DEFAULT false,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT NOW()
);

-- Articles
CREATE TABLE IF NOT EXISTS public.articles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  subtitle text,
  body text,
  excerpt text,
  category text CHECK (category IN ('local_guide', 'food_drink', 'culture', 'adventure', 'beaches', 'tips', 'seasonal', 'other')),
  author text DEFAULT 'Island Key',
  author_bio text,
  read_time_minutes integer,
  cover_image text,
  images text[],
  tags text[],
  meta_title text,
  meta_description text,
  og_image text,
  region text DEFAULT 'chania',
  is_featured boolean DEFAULT false,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  published_at timestamptz DEFAULT NOW(),
  created_at timestamptz DEFAULT NOW()
);

-- Useful Info Pages
CREATE TABLE IF NOT EXISTS public.info_pages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  category text CHECK (category IN ('emergency', 'transport', 'health', 'money', 'connectivity', 'language', 'culture', 'practical', 'other')),
  icon text,
  content text,
  sections jsonb,
  region text DEFAULT 'chania',
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT NOW()
);

-- Add deal_id to bookings (optional)
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS deal_id uuid REFERENCES public.deals(id);

-- ── Row Level Security ──────────────────────────────────────────────────────

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.info_pages ENABLE ROW LEVEL SECURITY;

-- Service role full access
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='deals' AND policyname='Service role full access deals') THEN
    CREATE POLICY "Service role full access deals" ON public.deals USING (true) WITH CHECK (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='events' AND policyname='Service role full access events') THEN
    CREATE POLICY "Service role full access events" ON public.events USING (true) WITH CHECK (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='articles' AND policyname='Service role full access articles') THEN
    CREATE POLICY "Service role full access articles" ON public.articles USING (true) WITH CHECK (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='info_pages' AND policyname='Service role full access info_pages') THEN
    CREATE POLICY "Service role full access info_pages" ON public.info_pages USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Public read (active only)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='deals' AND policyname='Public read deals') THEN
    CREATE POLICY "Public read deals" ON public.deals FOR SELECT USING (is_active = true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='events' AND policyname='Public read events') THEN
    CREATE POLICY "Public read events" ON public.events FOR SELECT USING (is_active = true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='articles' AND policyname='Public read articles') THEN
    CREATE POLICY "Public read articles" ON public.articles FOR SELECT USING (is_active = true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='info_pages' AND policyname='Public read info_pages') THEN
    CREATE POLICY "Public read info_pages" ON public.info_pages FOR SELECT USING (is_active = true);
  END IF;
END $$;

-- ── Storage Buckets ─────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public) VALUES
  ('deal-images', 'deal-images', true),
  ('event-images', 'event-images', true),
  ('article-images', 'article-images', true)
ON CONFLICT DO NOTHING;

-- Storage policies: public read
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND policyname='Public read deal-images') THEN
    CREATE POLICY "Public read deal-images" ON storage.objects FOR SELECT USING (bucket_id = 'deal-images');
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND policyname='Public read event-images') THEN
    CREATE POLICY "Public read event-images" ON storage.objects FOR SELECT USING (bucket_id = 'event-images');
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND policyname='Public read article-images') THEN
    CREATE POLICY "Public read article-images" ON storage.objects FOR SELECT USING (bucket_id = 'article-images');
  END IF;
END $$;

-- Storage policies: service role write
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND policyname='Service write deal-images') THEN
    CREATE POLICY "Service write deal-images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'deal-images');
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND policyname='Service write event-images') THEN
    CREATE POLICY "Service write event-images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'event-images');
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND policyname='Service write article-images') THEN
    CREATE POLICY "Service write article-images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'article-images');
  END IF;
END $$;

-- ── Seed: Starter Info Pages ─────────────────────────────────────────────────

INSERT INTO public.info_pages (title, slug, category, icon, sort_order) VALUES
  ('Emergency Numbers', 'emergency-numbers', 'emergency', '🚨', 1),
  ('Getting Around Crete', 'getting-around', 'transport', '🚗', 2),
  ('Pharmacies & Health', 'pharmacies-health', 'health', '💊', 3),
  ('Money & ATMs', 'money-atms', 'money', '💳', 4),
  ('WiFi & SIM Cards', 'wifi-sim-cards', 'connectivity', '📱', 5),
  ('Useful Greek Phrases', 'greek-phrases', 'language', '🇬🇷', 6),
  ('Cretan Food Guide', 'cretan-food-guide', 'culture', '🫒', 7),
  ('Beach Guide — Chania', 'beach-guide-chania', 'practical', '🏖️', 8)
ON CONFLICT DO NOTHING;
