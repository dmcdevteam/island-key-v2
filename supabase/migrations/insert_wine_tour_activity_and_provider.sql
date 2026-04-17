-- ─────────────────────────────────────────────────────────────────
-- Provider: Chania Wine Tours
-- ─────────────────────────────────────────────────────────────────
insert into public.providers (
  name,
  type,
  category,
  region,
  website,
  commission_rate,
  notes,
  is_active
)
values (
  'Chania Wine Tours',
  'activity',
  'table',
  'chania',
  'https://www.chaniawinetours.com',
  25.00,
  'Certified Sommelier-led wine tours across Chania. 8 different experiences available — wine adventure, wine lovers, farm-to-table lunch, boozy brunch, wine dinner under stars, walking tour, wine discovery, olive oil & honey tour. All private. Hotel pickup included. Year-round.',
  true
);

-- ─────────────────────────────────────────────────────────────────
-- Activity: Wine, Oil & Ancient Olives — A Full Day in the Cretan Countryside
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
  'Wine, Oil & Ancient Olives — A Full Day in the Cretan Countryside',
  'chania-wine-adventure-tour',
  'A certified sommelier picks you up from your hotel at 8:45am and doesn''t bring you back until you''ve seen some of the most extraordinary things western Crete has to offer. A Byzantine cave with holy water. The oldest olive tree in the world. An award-winning organic olive oil mill with views across the countryside. Then the serious part: a professional wine tasting at Karavitakis Winery — six wines, aged graviera, olives and rusks — followed by a privately guided tour of Manousakis Winery''s fermentation floor and barrel room, and a full sit-down lunch with the most awarded wines of Chania. Private vehicle, private guide, your group only. This is what a proper Cretan wine day looks like.',
  'table',
  'chania',
  '{M,P}',
  200.00,
  'EUR',
  '7–8 hours',
  'Year-round',
  'By arrangement · starts 8:45am',
  '{en}',
  'Hotel or villa pickup across Chania — 8:45am sharp',
  array[
    'Private hotel pickup and drop-off (air-conditioned vehicle)',
    'Certified Sommelier guide throughout (private, undivided attention)',
    'Visit to the Cave of Saint John the Hermit',
    'Tour and tasting at Biolea organic olive oil mill',
    'Visit to the oldest olive tree in the world',
    'Professional wine tasting at Karavitakis Winery (6 wines + cheese, olives, rusks)',
    'Privately guided tour of Manousakis Winery (fermentation floor + barrel room)',
    'Full lunch with appetisers, salad, main and dessert at Manousakis',
    'Wine served with lunch',
    'All entrance and tasting fees',
    'All taxes and insurance'
  ],
  'Private tour — your group only, never shared. Pricing is per person and decreases with group size: 2 guests €300pp · 3 guests €250pp · 4 guests €225pp · 5+ guests €200pp. Contact for groups of 6+ and corporate events. Starts at 8:45am sharp from your accommodation. A long day — arrive hungry and pace yourself.',
  'Contact provider — advance booking required',
  (select id from public.providers where name = 'Chania Wine Tours' limit 1),
  0,
  true,
  true,
  'activity'
);
