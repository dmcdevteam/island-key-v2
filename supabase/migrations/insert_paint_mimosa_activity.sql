-- ─────────────────────────────────────────────────────────────────
-- Activity: Paint & Mimosa Morning — Breakfast with a Paintbrush
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
  'Paint & Mimosa Morning — Breakfast with a Paintbrush',
  'chania-paint-mimosa-morning',
  'A morning session that gets the day started properly — mimosas, a paintbrush, and a Cretan-themed canvas to work on while the old town wakes up around you. Held at The Five Restaurant in Nea Chora, right on the waterfront. Guided step-by-step so no experience is needed. Relaxed, social, and a good excuse to start drinking before noon entirely guilt-free.',
  'culture',
  'chania',
  '{B,M,P}',
  35.00,
  'EUR',
  '2–3 hours',
  'Year-round',
  'Check schedule on enquiry',
  '{en}',
  'The Five Restaurant, Nea Chora, Chania',
  array[
    'All painting materials',
    'Guided instruction',
    'Mimosas'
  ],
  'Held at The Five Restaurant, Nea Chora waterfront. No experience needed. Check schedule on enquiry.',
  'Contact provider',
  (select id from public.providers where name = 'Painting Around' limit 1),
  0,
  false,
  true,
  'activity'
);
