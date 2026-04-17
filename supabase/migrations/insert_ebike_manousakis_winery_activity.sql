-- ─────────────────────────────────────────────────────────────────
-- Activity: Pedal to the Winery — E-bike Through Agia Lake & the Countryside to Manousakis
-- Provider: Tour Point (already in providers table — internal only, never guest-facing)
-- Category: 'table' — wine tasting + food is the primary experience; e-bike is the journey
-- OVERLAP NOTE: Manousakis now in 3 activities (wine-dinner-under-stars-manousakis €125,
--   manousakis-winery-shuttle-tour €55, this entry €120) — Spyros to confirm all are
--   compatible with concierge model before publishing simultaneously.
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
  'Pedal to the Winery — E-bike Through Agia Lake & the Countryside to Manousakis',
  'ebike-manousakis-winery-wine-tasting',
  'Five hours, Level 1 difficulty, and you end up at a winery tasting terrace surrounded by olive trees and orange groves with a glass of Nostos wine in your hand. The route west of Chania takes you through the village of Platanias and past Agia Lake — a Natura 2000 protected wetland with over 200 bird species that most people drive straight past on the coast road. From there it''s quiet countryside all the way to Manousakis, one of the most respected winemakers in western Crete. You get the full winery tour, the story of how it started, and then the tasting terrace with local dishes paired to the wines. Hotel pickup included. Electric bikes mean the hills take care of themselves.',
  'table',
  'chania',
  '{B,M,P}',
  120.00,
  'EUR',
  '5 hours',
  'Year-round',
  8,
  '{en}',
  'Hotel pickup included — collected from your accommodation door in Chania.',
  array[
    'E-bike rental',
    'Expert guide',
    'Hotel pickup and drop-off',
    'Winery tour and wine tasting at Manousakis',
    'Local food pairings from the winery kitchen',
    'Refreshment drinks and traditional treats en route',
    'Child seat if needed (rear-mounted, no extra charge)'
  ],
  'No cycling fitness required — Level 1 difficulty, the electric assist handles all the hills. Route passes Agia Lake, a Natura 2000 protected wetland worth stopping at for birdwatching en route. Private tour available at €145pp — mention at enquiry. Children under 16 receive a 10% discount; rear-mounted child seats at no charge. Free cancellation. Book now, pay later.',
  'Free cancellation. Book now, pay later.',
  (select id from public.providers where name = 'Tour Point' limit 1),
  0,
  false,
  true,
  'activity'
);
