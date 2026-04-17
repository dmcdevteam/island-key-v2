-- ─────────────────────────────────────────────────────────────────
-- Provider: Ride Around Chania
-- NOTE: Commission rate TBC with Spyros. No phone/email on website —
--       Spyros to obtain directly. Provider name INTERNAL ONLY.
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
  'Ride Around Chania',
  'activity',
  'culture',
  'chania',
  25.00,  -- placeholder — confirm with Spyros
  'City bike tour operator based in Chania old town (10 St. Meletiou Metaxaki). No phone/email on website — Spyros to obtain directly. Also offers an Alternative Chania Bike Tour — to be added as a second activity. Confirm cancellation policy when making contact.',
  true
);

-- ─────────────────────────────────────────────────────────────────
-- Activity: Five Civilisations in 2.5 Hours — Bike Tour of Chania Old Town
-- NOTE: Cancellation policy TBC — Spyros to confirm with provider.
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
  'Five Civilisations in 2.5 Hours — Bike Tour of Chania Old Town',
  'chania-old-city-bike-tour',
  'Chania''s old town has been built and rebuilt by five different civilisations — Minoan, Byzantine, Venetian, Ottoman, and Cretan — and almost none of it is immediately legible if you''re just walking. The bike changes that. In 2.5 hours, a local guide takes you through traffic-free streets and narrow alleys that tour buses can''t follow: past the Venetian harbour and its lighthouse, through the Splantzia neighbourhood where Ottoman architecture sits directly on top of Venetian, along the Byzantine walls that most visitors walk straight past. Nine to ten kilometres. Easy pace, anyone can do it. Pick up your bike and helmet at the store, there''s a bio energy bar for the road and iced tea or lemonade when you''re done.',
  'culture',
  'chania',
  '{B,M,P}',
  40.00,
  'EUR',
  '2.5 hours',
  'Year-round',
  'Tours depart at 09:00 daily — reservation required.',
  9,
  '{en}',
  'Chania old town — exact address and directions confirmed on booking. Tours start at 09:00; no hotel pickup on this activity.',
  array[
    'City bike',
    'Helmet',
    'Expert local guide',
    'Bottle of water',
    'Bio energy bar',
    'Traditional iced tea or lemonade'
  ],
  'Tours depart at 09:00 — reservation required in advance. Meet at the store in Chania old town (no hotel pickup). Maximum 9 people. Difficulty 1/4 — easy, suitable for all ages, fitness levels, and first-time cyclists. A great first-morning activity: covers more of the old city in 2.5 hours than most guests discover in a week.',
  'TBC — contact provider for cancellation policy.',
  (select id from public.providers where name = 'Ride Around Chania' limit 1),
  0,
  false,
  true,
  'activity'
);
