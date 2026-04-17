-- ─────────────────────────────────────────────────────────────────
-- Activity: Dinner Under the Stars at a Winery — Manousakis in the Evening
-- Provider: Chania Wine Tours (already in providers table)
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
  'Dinner Under the Stars at a Winery — Manousakis in the Evening',
  'wine-dinner-under-stars-manousakis',
  'The best evening in Chania that most visitors never find. At 6:30pm your guide picks you up and drives out to Vatolakkos village, where Manousakis Winery sits in the countryside producing some of the most awarded wines in Greece. Private tour of the fermentation floor and barrel room as the sun goes down. Five wines tasted on the terrace as the sky turns dark. Then dinner — almost everything on the plate grown a few metres from where you''re sitting: two appetisers, Cretan salad, a main course, dessert. Pair each course with whatever wine you liked best in the tasting. Back in Chania by 10:30pm with a very good evening behind you. This is the one for a special night — anniversaries, birthdays, or simply because the trip deserves it.',
  'table',
  'chania',
  '{B,M,P}',
  125.00,
  'EUR',
  '4 hours',
  'Apr–Oct',
  'By arrangement · starts 6:30pm',
  8,
  '{en}',
  'Hotel or villa pickup across Chania — 6:30pm sharp',
  array[
    'Return transportation from Chania accommodation',
    'Private tour of Manousakis Winery (fermentation floor + barrel room)',
    'Guided tasting of 5 Manousakis wines (some of the most awarded in Greece)',
    'Full farm-to-table dinner: 2 appetisers, Cretan salad, main course, dessert',
    'Wine pairing with dinner',
    'Private seating',
    'All tasting fees and VAT'
  ],
  'Semi-private tour — up to 8 guests, private seating. Pickup at 6:30pm sharp from your accommodation in Chania and surrounding areas. Most food is grown on the winery estate — true farm-to-table. Excellent for special occasions — mention on enquiry if celebrating something. Contact for groups over 8.',
  'Contact provider — advance booking required',
  (select id from public.providers where name = 'Chania Wine Tours' limit 1),
  0,
  true,
  true,
  'activity'
);
