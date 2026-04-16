-- ─────────────────────────────────────────────────────────────────
-- Provider: Georgioupolis Safari
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
  'Georgioupolis Safari',
  'activity',
  'sea',
  'chania',
  25.00,
  'Self-drive boat safari around Georgioupolis and Obrogialos Bay. No licence needed. 3 daily slots (9:00, 13:00, 17:00). Max 5 per boat. Top rated GYG (5 stars, 76 reviews, likely to sell out). 100% perfect score from English speakers. Private group only. English/Greek guides. Apr–Oct.',
  true
);

-- ─────────────────────────────────────────────────────────────────
-- Activity: Be the Captain — Boat Safari Around Georgioupolis
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
  'Be the Captain — Boat Safari Around Georgioupolis',
  'georgioupolis-boat-safari',
  'No licence. No experience. Just you, a 5-metre boat with a 30hp Yamaha engine, and the crystal-clear waters around Georgioupolis and Obrogialos Bay. Your safety guide leads the way on the first boat — you follow, at your own pace, exploring hidden sea caves, drifting past palm-lined shores, and finding your own swimming spot. Three sessions daily: morning, afternoon and the golden-hour slot at 17:00. Groups and families welcome — boats accommodate up to 5 people. Fruit and water on board. 100% of English-speaking guests gave this a perfect score.',
  'sea',
  'chania',
  '{B,M,P}',
  150.00,
  'EUR',
  '3 hours',
  'Apr–Oct',
  'Daily · 9:00 · 13:00 · 17:00',
  5,
  '{en}',
  'Georgioupolis — exact meeting point confirmed on booking.',
  array[
    'Transfer to/from meeting point',
    'Safety guide (leads on first boat)',
    '5-metre boat with 30hp Yamaha engine',
    'Petrol',
    'Snorkelling equipment',
    'Fruit and water'
  ],
  'No licence or boating experience needed — the safety guide gives full instructions before departure and stays with the group throughout. Bring your passport or ID card, swimwear and sunscreen. Boats hold 1–5 people. Three departure slots daily: 9:00–12:00, 13:00–16:00, 17:00–20:00. Private group only — you won''t be mixed with other parties. Likely to sell out — book early.',
  'Free cancellation up to 24 hours before',
  (select id from public.providers where name = 'Georgioupolis Safari' limit 1),
  0,
  false,
  true
);
