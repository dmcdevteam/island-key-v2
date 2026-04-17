-- ─────────────────────────────────────────────────────────────────
-- Provider: Fit in Crete
-- NOTE: Commission rate TBC with Spyros — placeholder 25% used.
-- ─────────────────────────────────────────────────────────────────
insert into public.providers (
  name,
  type,
  category,
  region,
  contact_phone,
  email,
  website,
  commission_rate,
  notes,
  is_active
)
values (
  'Fit in Crete',
  'activity',
  'sea',
  'chania',
  '+30 6944413919',
  'info@fitincrete.com',
  'fitincrete.com',
  25.00,  -- placeholder — confirm with Spyros
  'Outdoor multi-activity operator based in Kissamos. Offers sea kayak, e-bike, hiking, wild swimming, snorkelling, multi-day tours. Additional kayak tours available (Falassarna peninsula, SW Crete) — worth reviewing for future activities.',
  true
);

-- ─────────────────────────────────────────────────────────────────
-- Activity: Into the Juniper Shore — Sea Kayak Around Kedrodassos & Elafonissi
-- price_from = 55 (child), price_to = 95 (adult long version)
-- Full breakdown in good_to_know
-- ─────────────────────────────────────────────────────────────────
insert into public.activities (
  title,
  slug,
  description,
  category,
  region,
  tier_visibility,
  price_from,
  price_to,
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
  'Into the Juniper Shore — Sea Kayak Around Kedrodassos & Elafonissi',
  'kayak-kedrodassos-elafonissi',
  'The famous beach at Elafonissi gets crowded. The sea around it doesn''t. You launch from the shore and paddle across turquoise water that genuinely faces Africa — the colour at this end of the island is unlike anything further east. The route follows the coast past juniper trees growing straight out of the pink sand dunes, rounds a rocky headland, and finds a hidden bay with the ruins of an ancient sanctuary lying in the shallow water just beneath the surface. Snorkel over them. Sit-on-top kayaks mean no experience is needed — if you can sit, you can do this. Snorkelling gear and a guide included. Pink sand landing at the end, snack in the shade of the junipers.',
  'sea',
  'chania',
  '{B,M,P}',
  55.00,
  95.00,
  'EUR',
  '4–6 hours',
  'April–October',
  '{en}',
  'Kissamos — approx. 1-hour scenic coastal drive to Elafonissi included. Transport departs from Kissamos.',
  array[
    'Sit-on-top sea kayak',
    'Certified guide',
    'Snorkelling equipment',
    'PFD (life vest)',
    'Kayaker''s snack',
    'Transport Kissamos–Elafonissi–Kissamos'
  ],
  'Two versions available — mention your preference when enquiring. Standard (€78 adult / €55 child): ~4–6 hours total, 5km of paddling, suits everyone. Long version (€95 adult): up to 13km, 3–4 hours paddling, includes the hidden bay with ancient underwater ruins — for guests comfortable in the water for longer. Sit-on-top kayaks require no prior experience. Children ages 2–12 welcome on the standard version. Transport from Kissamos to Elafonissi and back is included.',
  'Free cancellation up to 24 hours before. Weather cancellations fully refunded.',
  (select id from public.providers where name = 'Fit in Crete' limit 1),
  0,
  false,
  true,
  'activity'
);
