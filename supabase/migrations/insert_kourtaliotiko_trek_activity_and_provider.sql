-- ─────────────────────────────────────────────────────────────────
-- Provider: Pezaporistas
-- NOTE: Contact details and commission rate TBC with Spyros.
--       Price is GYG rate (€86, discounted from €95) — confirm
--       direct rate before publishing to guests.
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
  'Pezaporistas',
  'activity',
  'adventure',
  'rethymno',
  25.00,  -- placeholder — confirm direct rate with Spyros
  'River trekking specialist. Kourtaliotiko Gorge near Preveli / Rethymno. Certified guides. Languages: Greek, English, Italian, Spanish. 4.9★ on GYG with 106 reviews. 96% of English speakers gave perfect score. Direct contact and pricing TBC with Spyros.',
  true
);

-- ─────────────────────────────────────────────────────────────────
-- Activity: The Gorge That Gets You Wet — Kourtaliotiko River Trek with Lunch
-- NOTE: price_from = 86 is GYG rate. Update once direct rate confirmed.
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
  'The Gorge That Gets You Wet — Kourtaliotiko River Trek with Lunch',
  'kourtaliotiko-gorge-river-trek',
  'Kourtaliotiko is one of the wildest gorges on the island, and this is not a walk-alongside-it situation — you go through it. The route follows the river bed, through pools and past a hidden waterfall tucked deep inside the rock. You''ll swim into it. All the gear is provided: neoprene suits, helmets, waterproof packs, hiking poles. Midway through, the gorge opens into a landscape of massive plane trees and crystal pools. At the end, there''s a farmhouse lunch at a local olive grove. Your pickup is arranged from your accommodation — just be ready at the door.',
  'adventure',
  'chania',
  '{B,M,P}',
  86.00,
  'EUR',
  '4.5 hours',
  'May–October',
  '{en,el,it,es}',
  'Hotel pickup included — your guide collects you from your accommodation. Return to same point after lunch.',
  array[
    'Certified guide',
    'Neoprene summer suit',
    'Waterproof backpack',
    'Rock helmet',
    'Hiking poles',
    'Transfer from gorge exit back to start',
    'Light lunch at a local farm after the trek',
    'Hotel pickup and drop-off'
  ],
  'Drinks not included — bring water and snacks. Wear or bring: sports shoes, quick-dry clothing, swimwear, sunglasses, towel. Small groups only. Dietary requirements (vegetarian, gluten-free, lactose-free) accommodated — flag at booking. Not suitable for: pregnant women, people with back or heart conditions, those over 110kg, people with recent surgeries, or guests over 70 years of age.',
  'Free cancellation up to 24 hours before.',
  (select id from public.providers where name = 'Pezaporistas' limit 1),
  0,
  false,
  true,
  'activity'
);
