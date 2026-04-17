-- ─────────────────────────────────────────────────────────────────
-- Activity: Sourdough & Olive Oil — Bake Your Own Loaf in a Wood-Fired Oven
-- Provider: Veerna's Kitchen (already in providers table)
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
  'Sourdough & Olive Oil — Bake Your Own Loaf in a Wood-Fired Oven',
  'veernas-sourdough-olive-oil',
  'You mix the dough, shape your loaf, add whatever you like inside — olives, sun-dried tomatoes, seeds — and into the wood-fired oven it goes. While it bakes, you walk the olive grove and learn how they harvest and press the oil, then come back and mix your own herb-infused version to take home. The loaf comes out of the oven smelling extraordinary. You eat it with fresh-picked Cretan salad, oven-roasted feta, Greek fava beans, smoked pork and local wine. Something sweet at the end. A slower, quieter experience than the full cooking class — and just as memorable.',
  'table',
  'chania',
  '{B,M,P}',
  85.00,
  'EUR',
  '4 hours',
  'Year-round',
  'Daily · 10:00am or 4:00pm',
  20,
  '{en}',
  'Chania — exact address shared on confirmation',
  array[
    'Welcome homemade refreshment or Greek coffee',
    'Sourdough bread making — mix, shape and bake your own loaf',
    'Olive grove visit and olive oil harvesting explanation',
    'Herb-infused olive oil tasting and mixing',
    'Cretan salad, oven-roasted feta, fava beans, smoked pork, roasted potatoes',
    'Local wine',
    'Dessert'
  ],
  'Minimum 2 participants. Solo travellers message to book. Large groups contact for availability and discounts. Book at least 12 hours in advance. Payment by cash or card at the end.',
  'Contact provider — book at least 12 hours in advance',
  (select id from public.providers where name = 'Veerna''s Kitchen' limit 1),
  0,
  false,
  true
);
