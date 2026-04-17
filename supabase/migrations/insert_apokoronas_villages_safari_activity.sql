-- ─────────────────────────────────────────────────────────────────
-- Activity: Private Tour — Hidden Villages, a Mountain Shrine & a Shepherd's Hut at 1,300m
-- Provider: Uncharted Escapes (already in providers table)
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
  'Private Tour — Hidden Villages, a Mountain Shrine & a Shepherd''s Hut at 1,300m',
  'chq04-apokoronas-villages-safari',
  'The Apokoronas region sits between the White Mountains and the Bay of Souda — one of those parts of Crete that visitors drive past on the way to somewhere else. This private full-day tour goes straight into it. Your Land Rover Defender heads out from Chania through Vrysses village beside its ancient plane trees, on through Nipos, Tzitzifes and Fres, stopping for coffee at a local kafeneion before reaching the Temple of the Virgin Mary of Two Rocks — a mountain shrine where legend and the landscape are equally extraordinary. Then off-road, up to the shepherd''s hut at Prophet Ilias at 1,300 metres, where Cretan Graviera cheese has been made the same way for centuries. Lunch in Armenoi village to close the day. Entirely private — your group, your vehicle, your pace.',
  'adventure',
  'chania',
  '{M,P}',
  400.00,
  'EUR',
  '8 hours',
  'Year-round',
  8,
  '{en}',
  'Hotel pickup across Chania — exact point confirmed by email if vehicle cannot reach your location directly',
  array[
    'Private hotel pickup and drop-off',
    'Private Land Rover Defender (up to 6–8 passengers)',
    'Professional certified guide-driver',
    'Coffee, tea or juice at the coffee stop',
    'Off-road ascent to Prophet Ilias shepherd''s hut (1,300m)',
    'All village stops: Vrysses, Nipos, Tzitzifes, Fres, Pemonia, Melidoni, Armenoi',
    'Temple of the Virgin Mary of Two Rocks visit',
    'Liability insurance and local taxes'
  ],
  'Priced per vehicle: €400 for 1–4 passengers, plus €60 per additional passenger for the 5th and 6th guests. Maximum 6 passengers per vehicle. Not included: lunch in Armenoi village, coffee/tea/juice at the coffee stop, and gratuities — budget separately for these. Booster and baby seats available on request. Entirely private — your group only. Bring comfortable trekking shoes, a camera, sun protection and a jacket in cooler months. Reservations at least 24 hours in advance. Not suitable for guests with severe motion sickness, mobility or back problems, pregnant guests, or children under 7.',
  'Full refund if cancelled due to insufficient participants or adverse weather. See provider terms for other cancellations.',
  (select id from public.providers where name = 'Uncharted Escapes' limit 1),
  0,
  false,
  true,
  'activity'
);
