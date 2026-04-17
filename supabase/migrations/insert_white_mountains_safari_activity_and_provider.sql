-- ─────────────────────────────────────────────────────────────────
-- Provider: Uncharted Escapes
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
  'Uncharted Escapes',
  'activity',
  'adventure',
  'chania',
  'https://www.unchartedescapes.com',
  25.00,
  'Established 2013 (formerly Safari Adventures). Premium Land Rover Defender safaris and speedboat tours. Specially equipped 4WD fleet plus Revenger 29 RIB speedboat (10 pax). Professional certified guide-drivers. Year-round. Multiple safari routes available. Also on GYG. Worth checking full tour list for additional activities.',
  true
);

-- ─────────────────────────────────────────────────────────────────
-- Activity: Into the White Mountains — Land Rover Safari to 1,350 Metres
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
  'Into the White Mountains — Land Rover Safari to 1,350 Metres',
  'white-mountains-land-rover-safari',
  'Most visitors to Crete never leave the coast. This one goes the other direction entirely. A specially equipped Land Rover Defender picks you up at 8:00am and heads into the White Mountains — through orange and avocado valleys, coffee in the mountain village of Deres, a photo stop at Meskla, then off-road up to a viewpoint and on to a shepherd''s hut at 1,350 metres. Wild eagles, mountain goats, the authentic Mitato where Cretan Graviera cheese has been made for generations. The return route passes through Therisso village for lunch at a local taverna with panoramic views across Chania. A full day in a part of Crete almost nobody sees.',
  'adventure',
  'chania',
  '{B,M,P}',
  75.00,
  'EUR',
  '~7 hours',
  'Year-round',
  'Daily · pickup from 8:00am',
  8,
  '{en}',
  'Hotel pickup across Chania — exact point confirmed by email if vehicle cannot reach your location',
  array[
    'Hotel pickup and drop-off',
    'Specially equipped Land Rover Defender (semi-private, up to 6–8 per vehicle)',
    'Professional certified local guide-driver',
    'Coffee stop at Deres village',
    'Off-road mountain drive to 1,350m',
    'Shepherd''s hut (Mitato) visit',
    'Lunch at Therissos village taverna',
    'Liability insurance and local taxes'
  ],
  'Adults €95pp · Children aged 7–12 €75pp · Children under 7 not permitted. Minimum 4 passengers required to run the tour. Priced for group participation — contact to check if joining a shared departure. Additional charge applies for pickups from remote areas. Not included: beers, refreshments or coffee at the taverna, and gratuities. Vehicles are 7 or 9-seater 4x4s driven by multilingual escort-drivers. Bring comfortable trekking shoes or sandals, a camera, sun protection and — in spring or autumn — a jacket. Reservations at least 24 hours before departure. Not suitable for guests with car sickness, mobility or back problems, pregnant guests, or children under 7.',
  'Contact provider — full refund if cancelled due to insufficient participants or adverse weather.',
  (select id from public.providers where name = 'Uncharted Escapes' limit 1),
  0,
  true,
  true,
  'activity'
);
