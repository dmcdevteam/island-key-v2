-- ─────────────────────────────────────────────────────────────────
-- Activity: Full-Day 4x4 Safari — White Mountains, Hidden Beach & a Family Taverna
-- Provider: Georgioupolis Safari (already in providers table)
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
  'Full-Day 4x4 Safari — White Mountains, Hidden Beach & a Family Taverna',
  'georgioupolis-land-rover-safari',
  'Eight hours in a Land Rover with one of the best-reviewed guides in Crete, going places the tour buses can''t reach. The day starts at Lake Kournas — Crete''s only freshwater lake — then climbs into the White Mountains to 1,200 metres, where vultures circle and the views stretch across the island. A Byzantine church, the exterior of Frangokastello castle, a quiet beach on the South Cretan Sea for a swim, herbs and raki and honey tasted at a local café, and a long lunch at a family-owned taverna right above the water. An olive oil factory to round it off. Pickup from Chania, Georgioupolis, Rethymno, Kalyves or Almyrida. 866 reviews, 4.8 stars — the most reviewed land activity in the region.',
  'adventure',
  'chania',
  '{B,M,P}',
  78.00,
  'EUR',
  '8 hours',
  'Year-round',
  'Daily · check times on enquiry',
  '{en,de,el,fr}',
  'Hotel pickup from Chania, Georgioupolis, Rethymno, Kalyves or Almyrida — exact point confirmed by email',
  array[
    'Hotel pickup and drop-off (Chania, Georgioupolis, Rethymno, Kalyves, Almyrida)',
    'Full day in an off-road 4x4 vehicle',
    'English/German/Greek/French-speaking guide',
    'Lake Kournas stop',
    'White Mountains off-road drive (1,200m altitude)',
    'Byzantine church and Frangokastello castle visit',
    'Secluded South Cretan Sea beach swim',
    'Traditional wine, raki, honey and herb tasting',
    'Lunch with drink at a family taverna',
    'Olive oil factory visit and tasting'
  ],
  'Bring comfortable shoes, a sun hat, swimwear, a towel and sunscreen. Pickup begins up to 1 hour before scheduled departure — you''ll receive exact pickup point and time by email. Pickup available from coastline areas between Chania and Almyrida. Guides speak English, German, Greek and French. Top rated on GYG — 4.8 stars from 866 reviews.',
  'Free cancellation up to 24 hours before',
  (select id from public.providers where name = 'Georgioupolis Safari' limit 1),
  0,
  true,
  true,
  'activity'
);
