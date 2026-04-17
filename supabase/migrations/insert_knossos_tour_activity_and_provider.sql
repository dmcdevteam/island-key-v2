-- ─────────────────────────────────────────────────────────────────
-- Provider: Cretan Vioma
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
  'Cretan Vioma',
  'activity',
  'culture',
  'chania',
  25.00,
  'Cultural day tours combining Knossos Palace, winery and olive oil tasting with traditional lunch. Hotel pickup from Chania region. Max 8 guests. Top rated GYG (4.9, 51 reviews, likely to sell out). English-speaking guides. Year-round. Vegetarian supported on request. Not wheelchair accessible.',
  true
);

-- ─────────────────────────────────────────────────────────────────
-- Activity: Knossos, Wine & Olive Oil — Crete's Story in One Day
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
  'Knossos, Wine & Olive Oil — Crete''s Story in One Day',
  'knossos-winery-olive-oil-tour',
  'Three things that define Crete, back to back. Start at the Palace of Knossos — the cradle of Minoan civilisation, where the Minotaur myth was born and the Labyrinth is not entirely a story. Your guide brings it alive. Then into the countryside to a family winery: Vilana and Kotsifali grapes, aged in oak, poured for you with the Cretan hills as backdrop. An olive oil tasting follows — the real thing, cold-pressed and prized. The day ends at a traditional taverna with dolmades, slow-cooked meats and local seasonings, washed down with wine or raki. Hotel pickup from Chania included. This is the one to do if you want to understand what Crete actually is.',
  'culture',
  'chania',
  '{B,M,P}',
  105.00,
  'EUR',
  '6 hours',
  'Year-round',
  'Daily · check times on enquiry',
  8,
  '{en}',
  'Hotel pickup across Chania region — confirm exact location on enquiry.',
  array[
    'Hotel pickup and drop-off from Chania (air-conditioned vehicle)',
    'Guided visit to the Palace of Knossos (1.5 hours)',
    'Wine tasting at a local winery (Vilana and Kotsifali varieties)',
    'Premium extra virgin olive oil tasting',
    'Platter with tastings',
    'Traditional Cretan lunch with wine',
    'Bottled water throughout'
  ],
  'Hotel pickup available from across the Chania region. Entry ticket to Knossos Palace is not included — general admission is €20, free for EU citizens under 25 and non-EU under 18, €10 for EU seniors over 65. Bring comfortable shoes (lots of walking on uneven ground), sunglasses, a hat, sunscreen, water and your camera. Passport or ID required for all guests including children. Vegetarian options available — mention on enquiry. Contact at least 48 hours before for dietary or allergy requirements. Not suitable for wheelchair users. No pets or smoking.',
  'Free cancellation up to 24 hours before',
  (select id from public.providers where name = 'Cretan Vioma' limit 1),
  0,
  true,
  true
);
