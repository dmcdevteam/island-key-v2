-- ─────────────────────────────────────────────────────────────────
-- Activity: Paint & Wine at a Winery — Canvas and Cretan Wine in the Countryside
-- Provider: Painting Around (already in providers table)
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
  'Paint & Wine at a Winery — Canvas and Cretan Wine in the Countryside',
  'chania-paint-wine-winery',
  'An evening at Manousakis Winery — one of the most awarded wineries in Greece — with a paintbrush instead of a tour guide. Settle in with a glass of Cretan wine and work through a guided painting session as the countryside goes dark around you. The combination of setting, wine and a creative task makes for an unexpectedly memorable evening. No artistic experience needed — the whole point is to enjoy the process rather than the result. Though the results are usually better than expected.',
  'culture',
  'chania',
  '{B,M,P}',
  70.00,
  'EUR',
  '2–3 hours',
  'Apr–Oct',
  'Check schedule on enquiry',
  '{en}',
  'Manousakis Winery, Vatolakkos village, Chania — directions confirmed on booking',
  array[
    'All painting materials and canvas',
    'Step-by-step guided instruction',
    'Cretan wine'
  ],
  'Held at Manousakis Winery, Chania countryside. No experience needed. Check schedule on enquiry — events are periodic not weekly.',
  'Contact provider',
  (select id from public.providers where name = 'Painting Around' limit 1),
  0,
  true,
  true,
  'activity'
);
