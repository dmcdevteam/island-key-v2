-- ═══════════════════════════════════════════════════════════════
-- ISLAND KEY — Supabase Database Schema
-- Version: 2.0 | March 2026
-- Paste this entire file into Supabase SQL Editor and run.
-- ═══════════════════════════════════════════════════════════════

-- ─── EXTENSIONS ───
create extension if not exists "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════
-- 1. PROPERTIES (Accommodation partners)
-- ═══════════════════════════════════════════════════════════════
create table public.properties (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,              -- URL-safe ID used in QR codes: "dimitris-city-break"
  name text not null,                     -- Display name: "Dimitris City Break Apts"
  region text not null check (region in ('chania','rethymno','heraklion','lasithi')),
  tier text not null check (tier in ('B','M','P')),  -- Budget / Medium / Premium
  host_name text,
  host_phone text,
  host_email text,
  commission_rate numeric(4,2) default 20.00,  -- % of Island Key commission shared with host
  address text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  notes text,                             -- Internal notes
  is_active boolean default true,
  created_at timestamptz default now()
);

create index idx_properties_region on public.properties(region);
create index idx_properties_slug on public.properties(slug);

-- ═══════════════════════════════════════════════════════════════
-- 2. PROVIDERS (Activity operators, transfer companies, rental firms)
-- ═══════════════════════════════════════════════════════════════
create table public.providers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text not null check (type in ('activity','transfer','rental','multi')),
  category text,                          -- Primary category for filtering
  region text not null check (region in ('chania','rethymno','heraklion','lasithi','island-wide')),
  contact_name text,
  contact_phone text,
  whatsapp text,
  email text,
  website text,
  commission_rate numeric(4,2) default 25.00,  -- % Island Key takes from booking
  notes text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════════
-- 3. GUESTS (Created on QR scan + onboarding)
-- ═══════════════════════════════════════════════════════════════
create table public.guests (
  id uuid primary key default uuid_generate_v4(),
  first_name text,
  property_id uuid references public.properties(id),
  tier text check (tier in ('B','M','P')),
  region text check (region in ('chania','rethymno','heraklion','lasithi')),
  check_in date,
  check_out date,
  group_type text check (group_type in ('couple','family','friends','solo')),
  whatsapp_number text,
  whatsapp_opted_in boolean default false,
  user_agent text,                        -- For device analytics
  created_at timestamptz default now()
);

create index idx_guests_property on public.guests(property_id);
create index idx_guests_region on public.guests(region);
create index idx_guests_created on public.guests(created_at);

-- ═══════════════════════════════════════════════════════════════
-- 4. ACTIVITIES (Curated experiences)
-- ═══════════════════════════════════════════════════════════════
create table public.activities (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  slug text unique not null,
  description text not null,              -- Narrative description (markdown OK)
  category text not null check (category in ('sea','land','table','culture','adventure','wellness')),
  region text not null check (region in ('chania','rethymno','heraklion','lasithi','island-wide')),
  tier_visibility text[] default '{B,M,P}',  -- Which tiers can see this
  price_from numeric(8,2),
  price_to numeric(8,2),
  currency text default 'EUR',
  duration text,                          -- "5 hours", "Full day", "2.5 hours"
  season text,                            -- "Apr–Nov", "Year-round"
  availability_text text,                 -- "Daily · check times", "Mon–Sat"
  max_group_size integer,
  languages text[] default '{en}',
  meeting_point text,
  meeting_coords text,                    -- "lat,lng" for map
  includes text[],                        -- Array of included items
  good_to_know text,                      -- Practical info paragraph
  cancellation_policy text default 'Free cancellation up to 24 hours before',
  provider_id uuid references public.providers(id),
  images text[],                          -- Array of Supabase Storage URLs
  sort_order integer default 0,
  is_featured boolean default false,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_activities_category on public.activities(category);
create index idx_activities_region on public.activities(region);
create index idx_activities_active on public.activities(is_active) where is_active = true;

-- ═══════════════════════════════════════════════════════════════
-- 5. DEALS (Last-minute offers)
-- ═══════════════════════════════════════════════════════════════
create table public.deals (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  activity_id uuid references public.activities(id),  -- Nullable: deal may not be tied to a listed activity
  description text,
  original_price numeric(8,2) not null,
  deal_price numeric(8,2) not null,
  savings_pct integer generated always as (
    case when original_price > 0 
      then round(((original_price - deal_price) / original_price * 100))::integer
      else 0 
    end
  ) stored,
  available_seats integer,
  expires_at timestamptz not null,
  region text not null check (region in ('chania','rethymno','heraklion','lasithi')),
  tier_visibility text[] default '{B,M,P}',
  provider_id uuid references public.providers(id),
  provider_name text,                     -- Denormalized for fast display
  category text,
  is_active boolean default true,
  created_at timestamptz default now()
);

create index idx_deals_expires on public.deals(expires_at) where is_active = true;
create index idx_deals_region on public.deals(region);

-- ═══════════════════════════════════════════════════════════════
-- 6. TRANSFERS
-- ═══════════════════════════════════════════════════════════════
create table public.transfers (
  id uuid primary key default uuid_generate_v4(),
  route_from text not null,               -- "Chania Airport (CHQ)"
  route_to text not null,                 -- "Your accommodation"
  route_code text,                        -- "CHQ-HOTEL" for quick lookup
  vehicle_type text not null check (vehicle_type in ('sedan','minivan','premium_suv','minibus')),
  vehicle_description text,               -- "Up to 3 pax + luggage"
  capacity integer,
  price numeric(8,2) not null,
  currency text default 'EUR',
  tier_visibility text[] default '{B,M,P}',
  provider_id uuid references public.providers(id),
  region text not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

create index idx_transfers_region on public.transfers(region);

-- ═══════════════════════════════════════════════════════════════
-- 7. RENTALS (Vehicles + boats)
-- ═══════════════════════════════════════════════════════════════
create table public.rentals (
  id uuid primary key default uuid_generate_v4(),
  type text not null check (type in ('car','motorcycle','bike','buggy','boat')),
  name text not null,                     -- "Economy Sedan", "Buggy / UTV"
  description text,                       -- "Hyundai i10 or similar · A/C · 5 seats"
  specs jsonb,                            -- { "engine": "1.0L", "seats": 5, "ac": true, ... }
  price_per_day numeric(8,2) not null,
  currency text default 'EUR',
  min_days integer default 1,
  insurance_included boolean default true,
  delivery_available boolean default true, -- Delivered to accommodation
  tier_visibility text[] default '{B,M,P}',
  provider_id uuid references public.providers(id),
  region text not null,
  images text[],
  is_active boolean default true,
  created_at timestamptz default now()
);

create index idx_rentals_type on public.rentals(type);
create index idx_rentals_region on public.rentals(region);

-- ═══════════════════════════════════════════════════════════════
-- 8. EVENTS (Calendar-driven happenings)
-- ═══════════════════════════════════════════════════════════════
create table public.events (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  date date not null,
  time_start time,                        -- NULL = all day event
  time_end time,
  is_all_day boolean default false,
  location text,
  location_coords text,                   -- "lat,lng"
  region text not null check (region in ('chania','rethymno','heraklion','lasithi','island-wide')),
  category text not null check (category in ('market','food','music','art','cinema','wine','wellness','festival','sport','other')),
  image_url text,
  external_link text,                     -- Link to event page / tickets
  is_recurring boolean default false,
  recurrence_rule text,                   -- iCal RRULE format if recurring
  is_free boolean default true,
  price_info text,                        -- "€15 entry" or "Donation-based"
  is_active boolean default true,
  created_at timestamptz default now()
);

create index idx_events_date on public.events(date);
create index idx_events_region on public.events(region);
create index idx_events_active_date on public.events(date, is_active) where is_active = true;

-- ═══════════════════════════════════════════════════════════════
-- 9. ARTICLES (Editorial / blog content)
-- ═══════════════════════════════════════════════════════════════
create table public.articles (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  slug text unique not null,
  body text not null,                     -- Markdown content
  excerpt text,                           -- Short preview (2-3 sentences)
  category text not null check (category in ('guide','food','culture','nature','events','tips')),
  region text check (region in ('chania','rethymno','heraklion','lasithi','island-wide')),
  image_url text,
  author text default 'Island Key',
  read_time_min integer default 5,
  is_published boolean default false,
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_articles_published on public.articles(published_at) where is_published = true;
create index idx_articles_category on public.articles(category);
create index idx_articles_slug on public.articles(slug);

-- ═══════════════════════════════════════════════════════════════
-- 10. BOOKINGS (Source of truth for all revenue)
-- ═══════════════════════════════════════════════════════════════
create table public.bookings (
  id uuid primary key default uuid_generate_v4(),
  confirmation_code text unique not null,  -- "IK-2026-0042"
  guest_id uuid references public.guests(id),
  property_id uuid references public.properties(id),  -- For commission attribution
  item_type text not null check (item_type in ('activity','deal','transfer','rental')),
  item_id uuid not null,                  -- FK to the relevant table
  item_title text not null,               -- Denormalized for fast display
  booking_date date not null,             -- Date of the experience
  booking_time time,
  pax integer default 1,
  days integer default 1,                 -- For rentals: number of rental days
  unit_price numeric(8,2) not null,
  total_price numeric(8,2) not null,
  currency text default 'EUR',
  commission_rate numeric(4,2),           -- Island Key's commission %
  commission_amount numeric(8,2),         -- Calculated: total_price * commission_rate / 100
  host_commission_rate numeric(4,2),      -- Host's share of commission %
  host_commission_amount numeric(8,2),    -- Calculated: commission_amount * host_rate / 100
  provider_payout numeric(8,2),           -- total_price - commission_amount
  payment_method text check (payment_method in ('stripe','whatsapp','cash','pending')),
  stripe_payment_id text,
  stripe_session_id text,
  status text default 'pending' check (status in ('enquiry','pending','confirmed','cancelled','completed','refunded')),
  guest_notes text,
  provider_id uuid references public.providers(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_bookings_guest on public.bookings(guest_id);
create index idx_bookings_property on public.bookings(property_id);
create index idx_bookings_status on public.bookings(status);
create index idx_bookings_date on public.bookings(booking_date);
create index idx_bookings_created on public.bookings(created_at);

-- ═══════════════════════════════════════════════════════════════
-- 11. INFO_PAGES (Useful information - static content)
-- ═══════════════════════════════════════════════════════════════
create table public.info_pages (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  slug text unique not null,
  icon text,                              -- Emoji icon for grid display
  content text not null,                  -- Markdown body
  category text,
  region text check (region in ('chania','rethymno','heraklion','lasithi','island-wide')),
  sort_order integer default 0,
  is_active boolean default true,
  updated_at timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════════
-- 12. ANALYTICS_EVENTS (Product analytics)
-- ═══════════════════════════════════════════════════════════════
create table public.analytics_events (
  id uuid primary key default uuid_generate_v4(),
  guest_id uuid references public.guests(id),
  event_type text not null,               -- 'scan','page_view','search','book','deal_view','wa_click'
  screen text,                            -- 'home','activities','deals','detail', etc.
  metadata jsonb,                         -- Flexible: { "activity_id": "...", "category": "sea" }
  created_at timestamptz default now()
);

create index idx_analytics_type on public.analytics_events(event_type);
create index idx_analytics_created on public.analytics_events(created_at);
-- Partition by month in production for performance

-- ═══════════════════════════════════════════════════════════════
-- FUNCTIONS
-- ═══════════════════════════════════════════════════════════════

-- Auto-generate confirmation codes: IK-YYYY-NNNN
create or replace function generate_confirmation_code()
returns trigger as $$
declare
  next_num integer;
begin
  select coalesce(max(
    substring(confirmation_code from 'IK-\d{4}-(\d+)')::integer
  ), 0) + 1 into next_num from public.bookings;
  
  new.confirmation_code := 'IK-' || extract(year from now())::text || '-' || lpad(next_num::text, 4, '0');
  return new;
end;
$$ language plpgsql;

create trigger trg_booking_code
  before insert on public.bookings
  for each row
  when (new.confirmation_code is null)
  execute function generate_confirmation_code();

-- Auto-calculate commission on booking insert
create or replace function calculate_commission()
returns trigger as $$
declare
  provider_rate numeric;
  host_rate numeric;
begin
  -- Get provider commission rate
  select commission_rate into provider_rate from public.providers where id = new.provider_id;
  if provider_rate is null then provider_rate := 25.00; end if;
  
  -- Get host commission rate
  select commission_rate into host_rate from public.properties where id = new.property_id;
  if host_rate is null then host_rate := 20.00; end if;
  
  new.commission_rate := provider_rate;
  new.commission_amount := round(new.total_price * provider_rate / 100, 2);
  new.host_commission_rate := host_rate;
  new.host_commission_amount := round(new.commission_amount * host_rate / 100, 2);
  new.provider_payout := new.total_price - new.commission_amount;
  
  return new;
end;
$$ language plpgsql;

create trigger trg_booking_commission
  before insert on public.bookings
  for each row
  execute function calculate_commission();

-- Auto-update updated_at timestamps
create or replace function update_timestamp()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger trg_activities_updated before update on public.activities for each row execute function update_timestamp();
create trigger trg_articles_updated before update on public.articles for each row execute function update_timestamp();
create trigger trg_bookings_updated before update on public.bookings for each row execute function update_timestamp();

-- ═══════════════════════════════════════════════════════════════
-- VIEWS (for common queries)
-- ═══════════════════════════════════════════════════════════════

-- Active deals that haven't expired
create or replace view public.active_deals as
select d.*, p.name as provider_display_name
from public.deals d
left join public.providers p on d.provider_id = p.id
where d.is_active = true
  and d.expires_at > now()
order by d.expires_at asc;

-- Upcoming events (next 30 days)
create or replace view public.upcoming_events as
select *
from public.events
where is_active = true
  and date >= current_date
  and date <= current_date + interval '30 days'
order by date asc, time_start asc nulls last;

-- Published articles
create or replace view public.published_articles as
select *
from public.articles
where is_published = true
order by published_at desc;

-- Booking revenue summary by property (for host reports)
create or replace view public.property_revenue as
select 
  p.id as property_id,
  p.name as property_name,
  p.region,
  count(b.id) as total_bookings,
  coalesce(sum(b.total_price), 0) as total_revenue,
  coalesce(sum(b.commission_amount), 0) as total_commission,
  coalesce(sum(b.host_commission_amount), 0) as host_earnings,
  count(distinct b.guest_id) as unique_guests
from public.properties p
left join public.bookings b on p.id = b.property_id and b.status in ('confirmed','completed')
group by p.id, p.name, p.region;

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (basic — expand for production)
-- ═══════════════════════════════════════════════════════════════

-- Enable RLS on all tables
alter table public.properties enable row level security;
alter table public.providers enable row level security;
alter table public.guests enable row level security;
alter table public.activities enable row level security;
alter table public.deals enable row level security;
alter table public.transfers enable row level security;
alter table public.rentals enable row level security;
alter table public.events enable row level security;
alter table public.articles enable row level security;
alter table public.bookings enable row level security;
alter table public.info_pages enable row level security;
alter table public.analytics_events enable row level security;

-- Public read access for guest-facing content (no auth required for POC)
create policy "Public read activities" on public.activities for select using (is_active = true);
create policy "Public read deals" on public.deals for select using (is_active = true and expires_at > now());
create policy "Public read transfers" on public.transfers for select using (is_active = true);
create policy "Public read rentals" on public.rentals for select using (is_active = true);
create policy "Public read events" on public.events for select using (is_active = true);
create policy "Public read articles" on public.articles for select using (is_published = true);
create policy "Public read info_pages" on public.info_pages for select using (is_active = true);
create policy "Public read properties" on public.properties for select using (is_active = true);

-- Guests can insert their own profile and analytics
create policy "Guests can insert" on public.guests for insert with check (true);
create policy "Analytics insert" on public.analytics_events for insert with check (true);

-- Bookings: guests can insert, read their own
create policy "Bookings insert" on public.bookings for insert with check (true);
create policy "Bookings read own" on public.bookings for select using (true);  -- Simplified for POC

-- Service role (Supabase admin) has full access via service_role key — no policy needed

-- ═══════════════════════════════════════════════════════════════
-- SEED DATA (Pilot content for POC)
-- ═══════════════════════════════════════════════════════════════

-- Pilot properties
insert into public.properties (slug, name, region, tier, host_name, commission_rate) values
  ('dimitris-city-break', 'Dimitris City Break Apts', 'chania', 'M', 'Dimitris', 20.00),
  ('villa-eleni', 'Villa Eleni', 'chania', 'P', 'Eleni', 25.00),
  ('sunset-studios', 'Sunset Studios Kissamos', 'chania', 'B', 'Nikos', 15.00),
  ('blue-horizon', 'Blue Horizon Rethymno', 'rethymno', 'M', 'Maria', 20.00),
  ('palace-suites', 'Palace Suites Elounda', 'lasithi', 'P', 'Andreas', 25.00);

-- Providers
insert into public.providers (name, type, category, region, commission_rate) values
  ('Veerna''s Kitchen', 'activity', 'table', 'chania', 25.00),
  ('Cretan Sailing', 'activity', 'sea', 'chania', 25.00),
  ('Cretan Adventures', 'activity', 'adventure', 'island-wide', 20.00),
  ('Sea Kayak Chania', 'activity', 'sea', 'chania', 25.00),
  ('Manousakis Vineyard', 'activity', 'table', 'chania', 20.00),
  ('Chania Transfers', 'transfer', null, 'chania', 20.00),
  ('Crete Rent A Car', 'rental', null, 'island-wide', 15.00),
  ('Surf Club Almyrida', 'activity', 'sea', 'chania', 25.00),
  ('Snami Travel', 'activity', 'culture', 'island-wide', 20.00);

-- Sample info pages
insert into public.info_pages (title, slug, icon, content, category, region, sort_order) values
  ('Emergency Numbers', 'emergency', '🚨', '## Emergency Contacts\n\n- **General Emergency:** 112\n- **Police:** 100\n- **Ambulance:** 166\n- **Fire:** 199\n- **Coast Guard:** 108\n- **Tourist Police:** 171\n\n### Hospitals\n- Chania General Hospital: +30 28210 22000\n- Venizeleio Hospital Heraklion: +30 2810 368000', 'safety', 'island-wide', 1),
  ('Beaches', 'beaches', '🏖️', '## Best Beaches by Region\n\n### Chania\n- **Balos Lagoon** — Iconic turquoise waters. Boat or 20-min hike.\n- **Elafonisi** — Pink sand, shallow waters, family-friendly.\n- **Falassarna** — Wide sandy beach, stunning sunsets.\n- **Marathi** — Calm bay, great for kayaking.\n- **Stavros** — Sheltered cove, Zorba the Greek location.\n\n### Getting there\nMost beaches require a car. Balos is also accessible by boat from Kissamos port.', 'places', 'island-wide', 2),
  ('Transport', 'transport', '🚌', '## Getting Around Crete\n\n### Buses\n- KTEL buses connect major towns. Schedules at e-ktel.com\n- Chania bus station: Kelaidi street\n\n### Taxis\n- Chania taxi rank: Plateia 1866\n- Airport taxi: ~€25–35 to Chania centre\n\n### Driving\n- International license recommended but not always required for EU citizens\n- Speed limits: 50km/h town, 90km/h rural, 130km/h motorway\n- Petrol stations close at night outside major towns', 'practical', 'island-wide', 3),
  ('Greek Phrases', 'greek-phrases', '🇬🇷', '## Essential Greek Phrases\n\n- **Hello:** Yassas (formal) / Yassou (casual)\n- **Thank you:** Efcharistó\n- **Please:** Parakaló\n- **Yes:** Nai\n- **No:** Óchi\n- **Cheers!:** Yamas!\n- **How much?:** Póso káni?\n- **The bill please:** Ton logariasmo parakaló\n- **Good morning:** Kaliméra\n- **Good evening:** Kalispéra\n- **Goodbye:** Antío\n- **Delicious!:** Nostimo!', 'practical', 'island-wide', 7),
  ('Local Tips', 'local-tips', '💡', '## Local Tips\n\n- **Tipping:** Not mandatory but 5–10% is appreciated at restaurants\n- **Siesta:** Many shops close 2–5pm. Don''t plan errands then.\n- **Water:** Tap water is drinkable in most areas\n- **Power:** EU standard 230V, Type C/F plugs\n- **Sunscreen:** UV is intense May–Sep. Reapply frequently.\n- **Cash:** Carry some cash for small tavernas and markets. Cards accepted most places.\n- **Driving:** Cretan drivers are fast but not aggressive. Mountain roads are narrow — honk on blind curves.', 'practical', 'island-wide', 8);


-- ═══════════════════════════════════════════════════════════════
-- DONE. Schema ready.
-- ═══════════════════════════════════════════════════════════════
