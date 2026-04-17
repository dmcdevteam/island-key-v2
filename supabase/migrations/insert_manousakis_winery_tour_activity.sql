-- ─────────────────────────────────────────────────────────────────
-- Activity: Wine Tasting & Winery Tour — A Half Day in the Cretan Countryside
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
  'Wine Tasting & Winery Tour — A Half Day in the Cretan Countryside',
  'manousakis-winery-shuttle-tour',
  'Manousakis Winery is one of the most awarded wineries in Greece — and getting there is half the experience. Your English-speaking driver picks you up from Chania, takes the scenic route through orange and avocado valleys to Vatolakkos, and gives you a running commentary on Cretan history along the way. Two hours at the winery: a guided tour of the facilities, the cellars, and the tasting terrace where five wines are poured alongside traditional rusks and their own olive oil. Back in Chania by early afternoon with most of the day still ahead. The most accessible introduction to Manousakis — and at this price, a very easy decision.',
  'table',
  'chania',
  '{B,M,P}',
  55.00,
  'EUR',
  '3 hours',
  'Year-round (closed Sundays)',
  'Daily except Sundays · tailored departure times',
  12,
  '{en}',
  'Hotel pickup within 5km of Chania city centre and along coastline to Kolymvari — confirmed on booking',
  array[
    'Free pickup and drop-off within 5km of Chania city centre and along the coastline to Kolymvari',
    'Premium vehicle (5, 7 or 9-seater) with English-speaking escort-driver',
    'Guided winery tour of Manousakis facilities',
    'Tasting of five wines with traditional Cretan rusks and olive oil',
    'Liability insurance and local taxes'
  ],
  'Adults (18+) €59pp · Ages 7–17 €55pp · Children under 7 not permitted. Minimum 2 passengers to run. Maximum 12 guests. Not included: extra wine beyond the tasting, meals or snacks, gratuities — the winery restaurant is on-site and available at extra cost. Free pickup within 5km of Chania city centre and along the coast to Kolymvari. Not wheelchair accessible. Not suitable for pregnant guests, guests with car sickness, back or mobility problems. Guests taller than 195cm or heavier than 130kg may find the vehicle challenging. Winery closed on Sundays.',
  'Contact provider — advance booking required',
  (select id from public.providers where name = 'Uncharted Escapes' limit 1),
  0,
  false,
  true,
  'activity'
);
