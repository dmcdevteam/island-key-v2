-- ─────────────────────────────────────────────────────────────────
-- Provider: RockNRoll Chania Buggy Safari
-- ─────────────────────────────────────────────────────────────────
insert into public.providers (
  name,
  type,
  category,
  region,
  contact_name,
  website,
  commission_rate,
  notes,
  is_active
)
values (
  'RockNRoll Chania Buggy Safari',
  'activity',
  'adventure',
  'chania',
  'Mike (owner)',
  'https://chaniabuggysafari.gr',
  25.00,
  'Self-drive buggy safaris from Maleme base. Brand-new fleet. 3 routes: Maleme–Menies (4h, €185/pair), Safari Through Nature (3h, €175/pair), Maleme–Falassarna (6h, price TBC). Class B licence required, drivers 23–67. Children 7+ welcome with adult. Meeting point has lockers, WC, WiFi, charging. Excellent reviews on TripAdvisor and Google. Apr–Oct.',
  true
);

-- ─────────────────────────────────────────────────────────────────
-- Activity: Buggy Safari to Menies — Caves, Cliffs & a Secret Beach
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
  'Buggy Safari to Menies — Caves, Cliffs & a Secret Beach',
  'chania-buggy-safari-menies',
  'You drive. That''s what makes this different. A brand-new buggy, a 75-kilometre route through western Crete''s interior, and Mike — the owner — leading the way with a wireless transceiver so you can hear commentary the whole time. The route from Maleme heads inland past the cave of Agios Ioannis in Marathokefala, out to the dramatic cape at Spatha, and down to Menies beach — one of those spots that takes effort to reach and rewards it immediately. Stops for swimming, snorkelling (bring your own gear), and homemade snacks that Mike''s team prepare fresh. Cool water throughout. One of the most-loved activities in the area — the reviews speak for themselves.',
  'adventure',
  'chania',
  '{B,M,P}',
  185.00,
  'EUR',
  '4 hours',
  'Apr–Oct',
  'Daily · check times on enquiry',
  '{en}',
  'Maleme, Chania — exact location via Google Maps confirmed on booking. Lockers and facilities on arrival.',
  array[
    'Brand-new buggy for up to 2 people',
    'Rider equipment: bandana, mask and wireless transceivers',
    'Safety instructions and test drive before departure',
    'Fuel, taxes and all fees',
    'Guide-led route with audio commentary',
    'Snacks, fresh fruit and cold water throughout',
    'Lockers, WC, free WiFi and charging at meeting point'
  ],
  'A Class B driving licence and ID card are required — both drivers must present these at the meeting point. Drivers must be aged 23–67. Children over 7 can share a buggy with an adult driver. Not suitable for pregnant guests or those with severe mobility impairments. Bring comfortable closed shoes, a hat, sunscreen, swimwear, sunglasses and a towel. Snorkel gear worth bringing — the water at Menies is clear. Full safety briefing and test drive before departure.',
  'Free cancellation up to 24 hours before',
  (select id from public.providers where name = 'RockNRoll Chania Buggy Safari' limit 1),
  0,
  true,
  true,
  'activity'
);
