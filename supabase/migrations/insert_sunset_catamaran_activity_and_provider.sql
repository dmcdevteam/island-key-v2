-- ─────────────────────────────────────────────────────────────────
-- Provider: DarinEri Yachts
-- NOTE: Possibly related to Darin Yachts (Chania) — Spyros to confirm.
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
  'DarinEri Yachts',
  'activity',
  'sea',
  'rethymno',
  25.00,
  'Luxury catamaran sunset cruises from Rethymno Marina. Possibly related to Darin Yachts (Chania) — Spyros to confirm. Vessel: sailing catamaran Karina. Top rated GYG (4.8, 450 reviews, likely to sell out). Wheelchair accessible. Dietary options. Private group available. Apr–Oct.',
  true
);

-- ─────────────────────────────────────────────────────────────────
-- Activity: Sunset Catamaran — Sushi, Open Bar & the Rethymno Coast
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
  'Sunset Catamaran — Sushi, Open Bar & the Rethymno Coast',
  'rethymno-sunset-catamaran',
  'Rethymno''s most civilised way to end a day. Sail out from the marina on a luxury catamaran as the afternoon light turns gold — Prosecco and finger food to start, then sushi rolls and an open bar as the coast drifts past. An hour of sailing brings you to Geropotamos beach for the sunset: beer, wine, local snacks, and the kind of view that makes everything else feel very far away. Paddleboards, snorkelling gear and inflatable flamingos if you want them. Back to the marina in the dark, with a branded gift and a day well spent. Wheelchair accessible. Dietary options available on request.',
  'sea',
  'rethymno',
  '{B,M,P}',
  85.00,
  'EUR',
  '3.5 hours',
  'Apr–Oct',
  'Daily · likely to sell out · book early',
  '{en}',
  'Rethymno Marina — arrive 15 minutes before departure. Look for the crew in DarinEri t-shirts at sailing catamaran Karina. Optional pickup from Bali Village.',
  array[
    'Modern luxury catamaran with sunbeds and shaded lounges',
    'Professional English/Greek-speaking crew',
    'Welcome glass of Prosecco and finger food',
    'Espresso, detox water, teas and protein cocktail',
    'Fresh seasonal fruit plate',
    'Variety of sushi rolls on board',
    'Unlimited drinks (water, soft drinks, local beer and white wine)',
    'Snorkelling gear (high-quality masks and fins)',
    'Stand-up paddleboards (SUP)',
    'Swimming jackets · Inflatable noodles and flamingo',
    'Fishing gear · Toys for kids (on request)',
    'Music and free Wi-Fi on board',
    'Life jackets · Onboard WC and outdoor shower',
    'Liability insurance · Branded gift'
  ],
  'Bring your passport or ID card, sunglasses, sun hat and a towel — all passengers must provide full name, date of birth, passport/ID number and nationality before departure (port authority requirement). Dietary options available (vegetarian, vegan, gluten-free) — mention on enquiry. Wheelchair accessible. Hotel transfers not included but can be arranged on request. Optional pickup from Bali Village. Meet at Rethymno Marina 15 minutes before departure — look for the crew in DarinEri t-shirts at the sailing catamaran Karina. Municipal parking available at the marina. Not suitable for pregnant guests, guests with serious pre-existing medical conditions, or guests over 95. No pets, no sharp objects, no red wine, no smoking indoors.',
  'Free cancellation up to 24 hours before',
  (select id from public.providers where name = 'DarinEri Yachts' limit 1),
  0,
  true,
  true
);
