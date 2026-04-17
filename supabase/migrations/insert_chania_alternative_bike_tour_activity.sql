-- ─────────────────────────────────────────────────────────────────
-- Activity: Halepa, Tabakaria & a Cretan Sunset — The Other Side of Chania by Bike
-- Provider: Ride Around Chania (already in providers table — internal only, never guest-facing)
-- NOTE: Cancellation policy TBC — Spyros to confirm with provider.
-- EDITORIAL: Natural pair with chania-old-city-bike-tour (€40pp each, €80 combined).
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
  is_active,
  item_type
)
values (
  'Halepa, Tabakaria & a Cretan Sunset — The Other Side of Chania by Bike',
  'chania-alternative-bike-tour-sunset',
  'Most visitors spend their entire stay inside the old town walls and never see what''s beyond them. This tour goes the other way. Starting in the afternoon — timed to finish at sunset — you cycle through Halepa, the aristocratic neighbourhood where the houses get grander and the history gets more recent: this is where Venizelos grew up, where foreign diplomats lived when Chania was capital of Crete. You pass through local squares and parks that don''t appear in any guidebook, past the Italian barracks and the city''s court building, and arrive at Tabakaria — the old tanneries on the waterfront — just as the sun drops into the sea. Kaltsounia (Cretan pastries) and a glass of local wine or raki when you get there. The start time shifts with the season to keep the landing right.',
  'culture',
  'chania',
  '{B,M,P}',
  40.00,
  'EUR',
  '3 hours',
  'Year-round',
  'Afternoon departure — start time approx. 2 hours before sunset, confirmed on reservation.',
  9,
  '{en}',
  'Chania old town — exact address and start time confirmed on booking. Tour departs approximately 2 hours before sunset; time varies by season.',
  array[
    'City bike',
    'Helmet',
    'Expert local guide',
    'Bottle of water',
    'Kaltsounia (traditional Cretan pastries)',
    'Local wine, raki, beer or soft drink at Tabakaria'
  ],
  'Afternoon tour — start time set approximately 2 hours before sunset and confirmed at reservation (varies by season). Slightly more challenging than the Old City morning tour: Difficulty 2/4 with a mild uphill and some city cycling. Maximum 9 people. No hotel pickup — meet at the store in Chania old town. Pairs well with the morning Old City tour if you want to see both sides of Chania in one day or on consecutive days.',
  'TBC — contact provider for cancellation policy.',
  (select id from public.providers where name = 'Ride Around Chania' limit 1),
  0,
  false,
  true,
  'activity'
);
