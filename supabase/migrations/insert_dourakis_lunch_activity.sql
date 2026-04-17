-- ─────────────────────────────────────────────────────────────────
-- Activity: Lunch in the Mountains — Dourakis Winery Farm-to-Table
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
  'Lunch in the Mountains — Dourakis Winery Farm-to-Table',
  'dourakis-winery-farm-to-table-lunch',
  'Dourakis Winery sits in the mountains above Chania, solar-powered, growing organic grapes, and looking like a film set. Your certified sommelier picks you up at 10:30, drives you up into the hills and privately guides you through the grounds — herb garden, farm, fermentation areas, and the labyrinth wine cellars carved into the mountain. Five indigenous Cretan wines tasted properly, with technique. Then lunch on the winery terrace: Cretan salad, appetisers, a main course, something sweet, and whichever wine from the tasting you want to keep drinking. Four hours. Back in Chania by mid-afternoon. The most relaxed way to spend a morning that accidentally becomes a full afternoon.',
  'table',
  'chania',
  '{B,M,P}',
  150.00,
  'EUR',
  '4 hours',
  'Year-round',
  'By arrangement · starts 10:30am',
  '{en}',
  'Hotel or villa pickup across Chania — 10:30am',
  array[
    'Private hotel pickup and drop-off (Chania town and surrounding areas)',
    'Certified Sommelier guide (private)',
    'Full guided tour of Dourakis Winery grounds, farm and herb garden',
    'Tour of wine-making areas and mountain cave wine cellars',
    'Guided tasting of 5 indigenous Cretan wines',
    'Traditional Cretan lunch (salad, appetisers, main course, dessert)',
    'Wine of your choice with lunch',
    'All tasting fees, VAT and insurance'
  ],
  'Private tour — your group only. Pricing by group size: 2 guests €200pp · 3 guests €175pp · 4–6 guests €150pp. Contact for groups of 6+. Starts at 10:30am from your accommodation. Organic, solar-powered winery — sustainability is built into everything including the lunch ingredients. Bring a camera — the winery and mountain views are exceptional.',
  'Contact provider — advance booking required',
  (select id from public.providers where name = 'Chania Wine Tours' limit 1),
  0,
  true,
  true,
  'activity'
);
