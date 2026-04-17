-- ─────────────────────────────────────────────────────────────────
-- Activity: Three Wineries, Unlimited Wine & the Oldest Olive Tree on Earth
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
  'Three Wineries, Unlimited Wine & the Oldest Olive Tree on Earth',
  'chania-wine-lovers-tour',
  'Three wineries, a detour past the oldest olive tree on the planet, and a certified sommelier in the seat next to you for eight hours. The day starts at Karavitakis — native Cretan varieties, six wines, and a crash course in how to actually taste what''s in the glass. Then to Patriotis, a fourth-generation grape-growing family who only recently started bottling, with vineyard views straight out to the Mediterranean. The finale is Dourakis, up in the mountains: barrel room, cave cellar, five wines on the terrace, then a full sit-down lunch with unlimited wine. Not a gimmick — they mean it. Private vehicle, your group only, home safely at the end.',
  'table',
  'chania',
  '{M,P}',
  200.00,
  'EUR',
  '7–8 hours',
  'Year-round',
  'By arrangement · starts 9:30am',
  '{en}',
  'Hotel or villa pickup across Chania — 9:30am sharp',
  array[
    'Private hotel pickup and drop-off (air-conditioned vehicle)',
    'Certified Sommelier or local winemaker guide (private, undivided attention)',
    'Guided tasting at Karavitakis Winery (6 wines + snacks)',
    'Visit to the oldest olive tree in the world',
    'Vineyard tour and tasting at Patriotis Winery',
    'Private guided tour of Dourakis Winery (barrel room + cave cellar)',
    'Tasting of 5 Dourakis wines',
    'Full lunch with appetisers, salad, main dish and dessert',
    'Unlimited wine with lunch',
    'All entrance and tasting fees · All taxes and insurance'
  ],
  'Private tour — your group only, never shared. Pricing decreases with group size: 2 guests €300pp · 3 guests €250pp · 4 guests €225pp · 5+ guests €200pp. Contact for groups of 6+ and corporate events. Starts at 9:30am sharp. A long, indulgent day — pace yourself at each winery, the best is saved for last.',
  'Contact provider — advance booking required',
  (select id from public.providers where name = 'Chania Wine Tours' limit 1),
  0,
  false,
  true,
  'activity'
);
