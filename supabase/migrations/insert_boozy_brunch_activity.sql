-- ─────────────────────────────────────────────────────────────────
-- Activity: Boozy Brunch at an Olive Mill — Wine Pairing in a Gorge View Garden
-- Provider: Chania Wine Tours (already in providers table)
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
  is_active,
  item_type
)
values (
  'Boozy Brunch at an Olive Mill — Wine Pairing in a Gorge View Garden',
  'boozy-brunch-biolea-olive-mill',
  'Biolea is one of the only olive mills in the Mediterranean still using stone mills and a traditional press. It''s also, it turns out, an extraordinary place to have brunch. Your guide picks you up at 9:00am and drives far west to the tiny village of Astrikas — tour the mill, learn more about olive oil than you ever expected to want to know, then settle onto the patio with a view across the gorge and the ancient villages beyond. What follows is a four-course brunch built entirely from estate and seasonal ingredients: fresh farm eggs, seasonal fruit and vegetables, homemade breads and pitas, locally sourced meats and dairy. Each course paired with the best Cretan wines. Then a detour to the oldest olive tree in the world, with your new olive oil knowledge making it actually make sense. Exclusively offered by Chania Wine Tours — you won''t find this anywhere else.',
  'table',
  'chania',
  '{B,M,P}',
  105.00,
  'EUR',
  '4–5 hours',
  'Year-round',
  'Tuesday to Friday · starts 9:00am',
  6,
  '{en}',
  'Hotel or villa pickup across Chania — 9:00am',
  array[
    'Private hotel pickup and drop-off (Chania and surrounding areas)',
    'Full guided tour of Biolea stone-mill olive oil estate',
    'Olive oil tasting',
    '4-course brunch with seasonal estate ingredients',
    'Wine pairing with each course (best Cretan wines)',
    'Visit to the oldest olive tree in the world',
    'All tasting fees, VAT and insurance'
  ],
  'Minimum 4 people, maximum 6. Available Tuesday to Friday only — contact by email to arrange. Menu and wines change seasonally depending on what''s growing at the estate. Exclusively offered by Chania Wine Tours. Guests staying outside Chania town may be able to arrange pickup for an additional fee — ask on enquiry.',
  'Contact provider — advance booking required by email',
  (select id from public.providers where name = 'Chania Wine Tours' limit 1),
  0,
  true,
  true,
  'activity'
);
