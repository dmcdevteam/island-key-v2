-- ─────────────────────────────────────────────────────────────────
-- Provider: Paragliding Crete Power Fly
-- NOTE: Phone, email and commission rate TBC with Spyros.
--       Provider name INTERNAL ONLY — never displayed to guests.
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
  'Paragliding Crete Power Fly',
  'activity',
  'adventure',
  'chania',
  25.00,  -- placeholder — confirm with Spyros
  'Paratriking specialist. Wheelchair accessible operation. Location near Lake Kourna / hotel Euphoria area. 4.8★ / 57 reviews on GYG. Direct pricing TBC — GYG rate is €150pp. Phone and email TBC — Spyros to obtain direct contact.',
  true
);

-- ─────────────────────────────────────────────────────────────────
-- Activity: Lake Kourna from the Air — Paratriking Above the West Coast of Crete
-- NOTE: is_active = FALSE — set true only once Spyros confirms direct pricing.
--       GYG rate €150pp is a placeholder; actual direct rate may differ.
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
  'Lake Kourna from the Air — Paratriking Above the West Coast of Crete',
  'paratriking-chania-lake-kourna',
  'A paratrike is not a paraglider — it''s a three-wheel motorised vehicle with two seats and a parachute overhead. You sit in it, the engine fires, and within a minute you''re airborne. No running off a cliff required. From up there: Lake Kourna directly below, the White Mountains and Psiloritis lined up behind, the coastline of western Crete stretching out in both directions. If the timing is right, Caretta Caretta turtles visible on the beach below. Fifteen minutes in the air. The pilot is wired to your helmet and talking to you the whole time. Suitable for almost everyone — including wheelchair users.',
  'adventure',
  'chania',
  '{M,P}',
  150.00,
  'EUR',
  '15 minutes (flight)',
  'Weather-dependent, April–October',
  '{en}',
  'Confirmed directly with your guide a few days before — location near the Lake Kourna area. Google Maps pin sent on confirmation.',
  array[
    'Flight preparation and briefing',
    'Professional pilot and instructor',
    'Helmet',
    '15-minute flight in 2-seater paratrike',
    'Commemorative activity certificate'
  ],
  'No experience required — the pilot handles everything. You''ll be contacted a few days before with confirmed time and location based on weather. Wear warm, windproof layers; thermal clothing recommended — it''s cold at altitude even in summer. No hats (helmet provided). Not suitable for: children under 6, pregnant women, people with heart conditions, vertigo, epilepsy, or fear of heights. Video not included — available as an optional add-on directly with the provider. Wheelchair users welcome.',
  'Free cancellation up to 24 hours before. Weather cancellations fully refunded.',
  (select id from public.providers where name = 'Paragliding Crete Power Fly' limit 1),
  0,
  false,
  false,  -- inactive until direct pricing confirmed with Spyros
  'activity'
);
