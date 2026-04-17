-- ─────────────────────────────────────────────────────────────────
-- Provider: Explore Paragliding
-- NOTE: Phone, email and commission rate TBC with Spyros.
--       Provider name INTERNAL ONLY — never displayed to guests.
--       Highest-rated activity in DB: 4.9★ / 138 reviews on GYG.
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
  'Explore Paragliding',
  'activity',
  'adventure',
  'chania',
  25.00,  -- placeholder — confirm with Spyros
  'Tandem paragliding. Certified by Hellenic Air Sports Federation. Meeting/return point: Go Kart Chania, Varipetro 731 00. 4.9★ / 138 reviews on GYG — highest-rated activity in the Island Key database. GoPro video available as paid add-on. Direct pricing TBC — GYG rate is €150pp. Phone and email TBC — Spyros to obtain direct contact.',
  true
);

-- ─────────────────────────────────────────────────────────────────
-- Activity: Run Off a Hillside — Tandem Paragliding Above the Cretan Coast
-- NOTE: is_active = TRUE — Spyros confirmed to keep active.
--       GYG rate €150pp is a placeholder; actual direct rate may differ.
--       Consider is_featured = true once direct pricing confirmed.
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
  'Run Off a Hillside — Tandem Paragliding Above the Cretan Coast',
  'tandem-paragliding-chania',
  'A jeep takes you up into the hills above Chania. Your pilot clips you in, gives you a briefing, and then you run — together — off the edge. Twenty minutes later you''re back on the ground with views of the Cretan coastline you won''t get from anywhere else. This is tandem paragliding: you''re attached to a certified pilot the whole time, no experience required, no decisions to make mid-air. The take-off is the only moment that tests you. Everything after it is silence and coastline. Certified by the Hellenic Air Sports Federation. GoPro video available as an add-on.',
  'adventure',
  'chania',
  '{M,P}',
  150.00,
  'EUR',
  '20 minutes flight (1.5 hours total including transfer and briefing)',
  'Weather-dependent, April–October',
  '{en}',
  'Go Kart Chania, Varipetro — Jeep transfer to the take-off location and back is included.',
  array[
    'Jeep transfer to and from take-off location',
    'Preflight briefing',
    '20-minute tandem paragliding flight with certified pilot'
  ],
  'No experience required — you''re attached to your pilot for the entire flight. Total session time is approximately 1.5 hours including transfer, briefing, flight, and return. GoPro video of your flight available as an optional add-on — ask at booking. Wear comfortable closed shoes; no sandals, flip flops, or open-toed shoes. No cameras permitted. Not suitable for: children under 13, people with mobility impairments. Certified by the Hellenic Air Sports Federation.',
  'Free cancellation up to 24 hours before. Weather cancellations fully refunded.',
  (select id from public.providers where name = 'Explore Paragliding' limit 1),
  0,
  false,
  true,
  'activity'
);
