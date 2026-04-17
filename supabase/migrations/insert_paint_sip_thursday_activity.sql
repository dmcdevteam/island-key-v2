-- ─────────────────────────────────────────────────────────────────
-- Activity: Thursday Paint & Sip Night in Chania Old Town
-- Provider: Painting Around (already in providers table)
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
  is_active,
  item_type
)
values (
  'Thursday Paint & Sip Night in Chania Old Town',
  'chania-paint-sip-thursday',
  'Thursday evenings in Chania city centre just got better. Join a relaxed paint and sip session in the heart of the old town — wine in hand, guided step-by-step through a Cretan-themed painting. No experience needed, no artistic talent required. You''ll leave with an actual painting and a very good evening behind you. One of those things that sounds touristy and turns out to be genuinely fun.',
  'culture',
  'chania',
  '{B,M,P}',
  25.00,
  'EUR',
  '2–3 hours',
  'Year-round',
  'Thursdays · evening',
  '{en}',
  'Chania city centre — confirmed on booking',
  array[
    'All painting materials and supplies',
    'Step-by-step guided instruction',
    'Wine'
  ],
  'No experience needed. Thursdays only. Venue in Chania city centre — exact location confirmed on booking.',
  'Contact provider',
  (select id from public.providers where name = 'Painting Around' limit 1),
  0,
  false,
  true,
  'activity'
);
