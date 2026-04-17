-- ─────────────────────────────────────────────────────────────────
-- Provider: Tour Point
-- NOTE: Commission rate TBC with Spyros — placeholder 25% used.
--       Provider name is INTERNAL ONLY — never displayed to guests.
-- ─────────────────────────────────────────────────────────────────
insert into public.providers (
  name,
  type,
  category,
  region,
  contact_phone,
  whatsapp,
  commission_rate,
  notes,
  is_active
)
values (
  'Tour Point',
  'activity',
  'adventure',
  'chania',
  '+30 6985078105',
  '+30 6985078105',
  25.00,  -- placeholder — confirm with Spyros
  'E-bike tour operator based in Chania city. 5-star / 141 Google reviews. Small groups max 8. Free hotel pickup included on all tours. Additional tours available: Tour 1 (Platanias–Agia Lake–Vatolakkos, €80, 3hrs, Level 1), Tour 2 (Malaxa & Ancient Aptera, €95, 3hrs, Level 3), Wine Tasting e-bike at Manousakis Winery (€120, 5hrs, Level 1) — all to be added as separate activities.',
  true
);

-- ─────────────────────────────────────────────────────────────────
-- Activity: The Gorge & the Revolution — E-bike to Theriso with Honey & a Village Taverna
-- NOTE: Categorised as 'adventure' for now. Re-categorise to 'land'
--       when that category is added to the schema.
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
  'The Gorge & the Revolution — E-bike to Theriso with Honey & a Village Taverna',
  'ebike-theriso-gorge',
  'Theriso is 15 kilometres from Chania and feels like a different world. The road to get there runs along the bottom of a gorge for 6 kilometres — steep cliffs either side, chestnut and oak trees overhead, the odd herd of goats wandering across the road. You''re on an e-bike, so the climb takes care of itself. The village at the top is where Crete''s 1905 Revolution was launched: the house used as headquarters is still there, still open to visit. There''s a local beekeeper up here whose honey is worth stopping for. There''s a village taverna with coffee and the kind of views you don''t get on the coast. And then the guide leads you back down the gorge — the downhill section is the part everyone remembers. Collected from your accommodation door, delivered back the same way.',
  'adventure',
  'chania',
  '{B,M,P}',
  90.00,
  'EUR',
  '3 hours',
  'Year-round',
  8,
  '{en}',
  'Hotel pickup included — collected from your accommodation door in Chania.',
  array[
    'E-bike rental',
    'Expert guide',
    'Hotel pickup and drop-off',
    'Refreshment drinks and treats',
    'Honey tasting at a local beekeeper',
    'Coffee or snack stop at a village taverna',
    'Child seat if needed (rear-mounted, no extra charge)'
  ],
  'No cycling fitness required — the electric assist handles the uphill. Small groups of up to 8 people. Private tour available at €115pp (mention at enquiry). Children under 16 receive a 10% discount; rear-mounted child seats provided at no charge. Free cancellation. Book now, pay later.',
  'Free cancellation. Book now, pay later.',
  (select id from public.providers where name = 'Tour Point' limit 1),
  0,
  false,
  true,
  'activity'
);
