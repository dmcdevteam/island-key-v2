-- ─────────────────────────────────────────────────────────────────
-- Provider: Omega Divers
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
  'Omega Divers',
  'activity',
  'sea',
  'chania',
  25.00,
  'PADI dive centre at Almyrida Beach, Chania. Beginner scuba diving specialist. Hotel pickup across Chania region. Max 8 guests, 1 instructor per 2 adults. Top rated GYG (4.7, 196 reviews). English, French, Greek, German guides. Morning and afternoon sessions. Apr–Oct.',
  true
);

-- ─────────────────────────────────────────────────────────────────
-- Activity: Your First Dive — Breathe Underwater in the Mediterranean
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
  'Your First Dive — Breathe Underwater in the Mediterranean',
  'chania-scuba-diving-beginners',
  'You don''t need to know how to dive to do this. Your PADI instructor picks you up from your hotel, takes you to the dive centre at Almyrida beach for a 25-minute theory session, then walks you into the water. Once you feel confident, you dive to 8 metres — the point where the Mediterranean stops being a backdrop and becomes a world of its own. Small groups only, one instructor per two adults, one per child. Photos and video of your dive sent to you free afterwards. Morning or afternoon sessions available.',
  'sea',
  'chania',
  '{B,M,P}',
  119.00,
  'EUR',
  '3 hours',
  'Apr–Oct',
  'Morning & afternoon sessions',
  8,
  '{en}',
  'Hotel pickup across Chania region (Georgioupolis, Kalyves, Almyrida, Souda). Dive centre at Almyrida Beach, 27km east of Chania city. Exact pickup confirmed by email after booking.',
  array[
    'Hotel pickup and drop-off (Chania region)',
    'All diving equipment',
    'PADI instructor throughout',
    '25-minute theory class',
    'One dive to 8 metres depth',
    'Full insurance',
    'Free photos and short video of your dive'
  ],
  'Bring swimwear, sunscreen and a towel. All participants complete a health questionnaire before diving — pre-existing conditions (asthma, heart conditions) may prevent participation; consult your doctor if unsure. Do not dive within 48 hours of flying. Children must be at least 8 years old and accompanied by an adult. Not suitable for pregnant guests or guests with heart or respiratory problems. Pickup is from specific meeting points near your hotel — you''ll receive an email with exact details. If weather causes cancellation, you''ll be offered an alternative date or full refund.',
  'Free cancellation up to 24 hours before',
  (select id from public.providers where name = 'Omega Divers' limit 1),
  0,
  false,
  true
);
