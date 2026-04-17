-- ─────────────────────────────────────────────────────────────────
-- Activity: Ancient Port, Sunken Ship & Pink Sand — First Paddle at Falasarna
-- Provider: Fit in Crete (already in providers table — internal only, never guest-facing)
-- price_from = 45 (child), price_to = 68 (adult)
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
  'Ancient Port, Sunken Ship & Pink Sand — First Paddle at Falasarna',
  'kayak-falasarna-beginners',
  'Falasarna is one of the most beautiful beaches in western Crete, and from the water it looks completely different. You launch from the pink sand and paddle out across a calm, clear bay — 4 to 5 kilometres in total, easy pace, sit-on-top kayaks that need zero experience. What you''re paddling past is genuinely interesting: the ancient port of Phalasarna, now stranded 100 metres inland after a powerful earthquake in historical times, visible from the water as you go by. Just offshore, an Allied transport ship from the Second World War sits in shallow enough water to snorkel over. Seagrass meadows below your hull on the way back. Tamarisk shade, a snack, and the option of a drink at the café above the bay when you land.',
  'sea',
  'chania',
  '{B,M,P}',
  45.00,
  68.00,
  'EUR',
  '2–3 hours total',
  'April–October',
  '{en}',
  'Falasarna beach — transport from Kissamos included (20 min), or meet directly at Falasarna if staying nearby.',
  array[
    'Sit-on-top sea kayak',
    'Certified guide',
    'Snorkelling equipment',
    'PFD (life vest)',
    'Kayaker''s snack',
    'Transport from Kissamos to Falasarna and back (if needed)'
  ],
  'No kayaking experience needed — sit-on-top kayaks are stable and easy. 1–2 hours of paddling (4–5km), total outing 2–3 hours. Suitable for all ages; children 2–12 welcome (€45 child / €68 adult). Snorkel over the shallow reef, the WWII wreck, and the seagrass meadows — gear provided. If you''re staying at Falasarna, you can meet the guide directly at the beach rather than travelling from Kissamos first.',
  'Free cancellation up to 24 hours before. Weather cancellations fully refunded.',
  (select id from public.providers where name = 'Fit in Crete' limit 1),
  0,
  false,
  true,
  'activity'
);
