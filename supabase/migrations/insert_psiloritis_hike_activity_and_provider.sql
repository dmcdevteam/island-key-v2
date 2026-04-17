-- ─────────────────────────────────────────────────────────────────
-- Provider: Cretan Wild
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
  'Cretan Wild',
  'activity',
  'adventure',
  'chania',
  '+30 694 8616 126',
  'info@cretanwild.gr',
  'cretanwild.gr',
  20.00,
  'Run by Helen. Guided hiking and trail running tours across Crete. First aid certified. Member of Spathes Rural Tourism Cluster.',
  true
);

-- ─────────────────────────────────────────────────────────────────
-- Activity: Stand on Top of Crete — Summit Psiloritis from the North
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
  'Stand on Top of Crete — Summit Psiloritis from the North',
  'psiloritis-summit-hike-north',
  'At 2,456 metres, Psiloritis is the highest point on the island — and from the summit, on a clear day, you can see both coasts. The north route begins at Mygero Refuge and climbs 900 metres across 10 kilometres: stone steps first, then open ridge, then the kind of rocky terrain that makes you pay attention. The views get outrageous the higher you go. Your guide has covered this mountain in every season and knows exactly when to push and when to let you breathe.',
  'adventure',
  'chania',
  '{B,M,P}',
  59.00,
  'EUR',
  '5 hours',
  'May–October',
  '{en}',
  'Mygero Refuge (Lakkos Mygerou) — coordinates shared on booking confirmation',
  array[
    'Expert guided ascent and descent',
    'Route briefing and safety overview',
    'Local knowledge on flora, geology, and mountain history'
  ],
  'Minimum 4 persons. Private tours available on request. The summit reaches 2,456m — bring a windbreaker even in summer, it gets cold and windy at the top. Hiking boots required. The trail is well-marked but rocky near the summit. Not recommended for guests with significant mobility limitations or heart conditions.',
  'Free cancellation up to 48 hours before. Weather cancellations fully refunded or rescheduled.',
  (select id from public.providers where name = 'Cretan Wild' limit 1),
  0,
  false,
  true,
  'activity'
);
