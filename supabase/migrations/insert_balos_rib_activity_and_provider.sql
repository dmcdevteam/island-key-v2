-- ─────────────────────────────────────────────────────────────────
-- Provider: Cretan Sailing Cruises
-- NOTE: Check live providers table for existing 'Cretan Sailing' row
-- before running — may need to consolidate if it's the same business.
-- ─────────────────────────────────────────────────────────────────
insert into public.providers (
  name,
  type,
  category,
  region,
  commission_rate,
  notes,
  is_active
)
values (
  'Cretan Sailing Cruises',
  'activity',
  'sea',
  'chania',
  25.00,
  'Premium RIB boat tours from Kissamos port. Balos & Gramvousa specialist. Hotel pickup across Chania region. Small group, English/Greek guides. Top rated on GYG (4.9, 274 reviews). Private group option available. Apr–Oct season.',
  true
);

-- ─────────────────────────────────────────────────────────────────
-- Activity: Balos & Gramvousa by RIB — The Full Western Crete Run
-- ─────────────────────────────────────────────────────────────────
insert into public.activities (
  title,
  slug,
  description,
  category,
  region,
  tier_visibility,
  price_from,
  currency,
  duration,
  season,
  availability_text,
  max_group_size,
  languages,
  meeting_point,
  includes,
  good_to_know,
  cancellation_policy,
  provider_id,
  sort_order,
  is_featured,
  is_active
)
values (
  'Balos & Gramvousa by RIB — The Full Western Crete Run',
  'balos-gramvousa-rib-kissamos',
  'The two most iconic spots in western Crete — in one five-hour run on a premium RIB boat. You''ll leave from Kissamos port (hotel pickup available) and head straight for Gramvousa Island, where a Venetian fortress rises from a turquoise bay that doesn''t look real. An hour to explore, swim, snorkel. Then on to Balos Lagoon — shallow, impossibly blue, away from the ferry crowds that arrive later in the day. You get there first. Unlimited drinks on board, snorkelling gear included, a crew that knows every reef worth stopping at. This is what western Crete looks like from the water.',
  'sea',
  'chania',
  '{B,M,P}',
  117.00,
  'EUR',
  '5 hours',
  'Apr–Oct',
  'Daily · check times on enquiry',
  12,
  '{en}',
  'Kissamos port — or hotel pickup available across Chania region. Confirm option on enquiry.',
  array[
    'Speedboat cruise on a premium RIB',
    'Experienced English/Greek-speaking crew',
    'Snacks',
    'Unlimited drinks (beer, soft drinks, juice, iced tea, water)',
    'Snorkelling equipment',
    'Music',
    'Hotel pickup and drop-off (if selected)',
    'Towels'
  ],
  'Bring your passport or ID card — all passengers must provide full names, passport or ID numbers, dates of birth, nationality and gender at least 24 hours before departure. This is a mandatory requirement from the port authorities. Sunscreen essential. No pets, no alcohol or drugs. Not suitable for pregnant guests, wheelchair users or guests with serious mobility impairments. Hotel pickup available from Kissamos, Kaliviani, Topolia, Maleme, Gerani, Platanias, Agia Marina, Stalos, Dalakas, Daratso, Agii Apostoloi, Chania town, Neo Chora and Souda.',
  'Free cancellation up to 24 hours before',
  (select id from public.providers where name = 'Cretan Sailing Cruises' limit 1),
  0,
  true,
  true
);
