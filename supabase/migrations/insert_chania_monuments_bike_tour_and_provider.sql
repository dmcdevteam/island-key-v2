-- ─────────────────────────────────────────────────────────────────
-- Provider: Chania Bike Tours
-- NOTE: Commission rate TBC with Spyros. Provider name INTERNAL ONLY.
--       EOT licence: 1042E60000070700. Contact: Despina Koutrouli.
--       Also operates Chania Segway Tours. Second tour (Chania Exploration) TBD.
-- ─────────────────────────────────────────────────────────────────
insert into public.providers (
  name,
  type,
  category,
  region,
  contact_phone,
  whatsapp,
  email,
  website,
  commission_rate,
  notes,
  is_active
)
values (
  'Chania Bike Tours',
  'activity',
  'culture',
  'chania',
  '+30 2821008695',
  '+30 6944597159',
  'info@chaniabiketours.com',
  'chaniabiketours.com',
  25.00,  -- placeholder — confirm with Spyros
  'EOT licensed operator (licence: 1042E60000070700). Contact: Despina Koutrouli (Reservation Manager). Also operates Chania Segway Tours (chaniasegwaytours.com). Has a second tour called Chania Exploration — worth reviewing for future addition. Provider name internal only.',
  true
);

-- ─────────────────────────────────────────────────────────────────
-- Activity: Twenty Monuments, Two Hours — Chania Old Town by Bike with Audio Guide
-- AVAILABILITY WARNING: Monday and Tuesday only — Spyros must verify guest
-- stay dates include a Mon or Tue before confirming any enquiry.
-- price_from = 30 (child co-pilot 5–9); adult €45, age 10–16 €38, baby seat free
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
  'Twenty Monuments, Two Hours — Chania Old Town by Bike with Audio Guide',
  'chania-monuments-bike-tour',
  'Twenty monuments in two hours, with an audio guide in your own language running through the whole route. The tour covers more of Chania''s old city than most visitors see in a week: the Venetian harbour and its fortress, the Egyptian Lighthouse, the Grand Arsenal, the Jewish Synagogue, the Byzantine walls, the Minoan settlement at Kasteli, the neighbourhood of Splantzia, Nea Chora beach. Your tour leader keeps the group moving; the audio fills in the layers of history as you go — available in eight languages. Cube touring bikes, helmet, and water included. Runs on Mondays and Tuesdays only — check your dates.',
  'culture',
  'chania',
  '{B,M,P}',
  30.00,
  'EUR',
  '2 hours',
  'Year-round',
  'Monday and Tuesday only — departures at 09:00. Enquire to confirm availability during your stay.',
  9,
  '{en,de,fr,es,it,no,ru,el}',
  '25 Episkopou Chrisanthou Str., Chania Old City — arrive 15 minutes early for bike fitting and safety briefing. No hotel pickup.',
  array[
    'Cube touring bike',
    'Helmet',
    'Tour leader',
    'Audio guide (8 languages: EN, DE, FR, ES, IT, NO, RU, GR)',
    'Bottle of water'
  ],
  'Runs on Mondays and Tuesdays only — confirm dates at enquiry. Minimum 3 participants required for the tour to depart. Book at least 10 hours in advance. Arrive 15 minutes early for bike fitting and safety briefing. Audio guide available in English, German, French, Spanish, Italian, Norwegian, Russian, and Greek — select your language at the start. Children welcome at all ages: co-pilot attachment for ages 5–9 (€30), own bike for ages 10–16 (€38), baby seat free for under 20kg.',
  'Free cancellation up to 24 hours before.',
  (select id from public.providers where name = 'Chania Bike Tours' limit 1),
  0,
  false,
  true,
  'activity'
);
