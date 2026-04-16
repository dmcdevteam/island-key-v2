-- ─────────────────────────────────────────────────────────────────
-- Provider: Salty Descents
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
  'Salty Descents',
  'activity',
  'sea',
  'chania',
  25.00,
  'Dive centre based in Kalyves. Guided snorkelling boat trips across Chania coastline. Hotel pickup from Kalyves, Platanias, Georgioupoli, Souda, Chania. Max 10 guests. Top rated GYG (5 stars, 245 reviews, likely to sell out). English/Greek guides. Apr–Oct. No experience needed.',
  true
);

-- ─────────────────────────────────────────────────────────────────
-- Activity: Guided Snorkelling Boat Trip — Two Spots, One Morning
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
  'Guided Snorkelling Boat Trip — Two Spots, One Morning',
  'chania-guided-snorkelling-boat',
  'Most people never see what''s underneath the surface of the Cretan sea. This four-hour boat trip fixes that. Your guide picks you up from your accommodation, takes you to two hand-picked snorkelling spots along the Chania coastline, and gets you in the water with top-quality gear and proper instruction. No experience needed — the guide briefs everyone on board before you enter the water and stays with you throughout. You''ll see fish, marine life and underwater terrain most tourists never encounter. Back on the boat between spots: water, snacks, stunning coastal views. Hotel pickup and drop-off included.',
  'sea',
  'chania',
  '{B,M,P}',
  75.00,
  'EUR',
  '4 hours',
  'Apr–Oct',
  'Daily · likely to sell out · book early',
  10,
  '{en}',
  'Hotel pickup across Chania region (Kalyves, Platanias, Georgioupoli, Souda, Chania). Driver arrives no later than 10 minutes after scheduled time — look for the Salty Descents t-shirt. Or meet at the dive centre in Kalyves.',
  array[
    'Hotel pickup and drop-off (Chania region)',
    'Boat trip to two snorkelling locations',
    'Top-quality snorkelling equipment',
    'Professional guided snorkel tour',
    'Full gear instruction and safety demonstration',
    'Floatation aids',
    'Bottled water and light snack / fruit'
  ],
  'No prior snorkelling experience needed — the guide teaches you everything on board. Bring a sun hat, swimwear, towel, sunscreen and beachwear. Alcohol is not permitted during the tour. Only light refreshments are provided — eat before you go. Weather-dependent: if the trip is cancelled due to bad weather you can reschedule or receive a full refund. Not suitable for children under 5, pregnant guests, non-swimmers, guests with mobility impairments or serious pre-existing medical conditions, or guests over 70.',
  'Free cancellation up to 24 hours before',
  (select id from public.providers where name = 'Salty Descents' limit 1),
  0,
  false,
  true
);
