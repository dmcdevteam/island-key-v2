-- ─────────────────────────────────────────────────────────────────
-- Provider: Darin Yachts
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
  'Darin Yachts',
  'activity',
  'sea',
  'chania',
  25.00,
  'Luxury catamaran day cruises to Balos & Gramvousa from Kissamos. Hotel pickup across Chania and Georgoupoli. Top rated GYG (4.9, 518 reviews, likely to sell out). Private group option available. Dietary options supported. Apr–Oct. English-speaking crew.',
  true
);

-- ─────────────────────────────────────────────────────────────────
-- Activity: Balos & Gramvousa by Catamaran — The Slow, Beautiful Way
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
  is_active
)
values (
  'Balos & Gramvousa by Catamaran — The Slow, Beautiful Way',
  'balos-gramvousa-catamaran',
  'If the speedboat is the rush, this is the reward. A full day on a luxury catamaran, sailing to Balos Lagoon and Gramvousa Island at the pace the Aegean deserves. Sunbeds, shaded lounges, a nutritionist-designed lunch, unlimited drinks, paddleboards, snorkelling gear, and a crew that treats the whole thing like a private charter. You''ll arrive at Balos before the day-trippers, swim in water so clear it looks edited, float on an inflatable flamingo if you want to — and sail back watching the sun drop behind the Gramvousa peninsula. Hotel pickup included from across the Chania region. This is the one for a special day.',
  'sea',
  'chania',
  '{M,P}',
  166.00,
  'EUR',
  '7–8.5 hours',
  'Apr–Oct',
  'Daily · likely to sell out · book early',
  '{en}',
  'Hotel pickup included across Chania and Georgoupoli regions. Kissamos port for self-arrival. Confirm on enquiry.',
  array[
    'Return hotel transfer from across Chania region',
    'Modern catamaran with sunbeds and shaded lounges',
    'Professional English-speaking crew',
    'Welcome drinks (espresso, detox teas, protein cocktails)',
    'Light healthy brunch designed by a nutritionist',
    'Nutritionist-designed healthy lunch (vegetarian and children''s options available)',
    'Protein cocktail bar and light snacks',
    'Unlimited drinks (water, soft drinks, local beer, white wine)',
    'High-quality snorkelling gear (masks and fins)',
    'Stand-up paddleboards (SUP)',
    'Swimming jackets',
    'Inflatable noodles and flamingos',
    'Fishing gear (gentle fishing experience)',
    'Box of toys for kids (on request)',
    'Music and free Wi-Fi on board',
    'Life jackets · Onboard WC and outdoor shower',
    'Liability insurance'
  ],
  'Bring a sun hat, swimwear, towel and sunscreen. All passengers must provide full name, date of birth, passport or ID number and nationality at least 24 hours before departure — port authority requirement. Provide your email address for the booking voucher. Dietary requirements (vegetarian, vegan, gluten-free) supported — mention on enquiry. Not suitable for pregnant guests or guests with serious pre-existing medical conditions. Guests over 95 not eligible. No pets, no sharp objects, no red wine, no smoking indoors. Meet the transfer bus at least 10 minutes before scheduled pickup — look for the DarinYachts logo on the front window.',
  'Free cancellation up to 24 hours before',
  (select id from public.providers where name = 'Darin Yachts' limit 1),
  0,
  true,
  true
);
