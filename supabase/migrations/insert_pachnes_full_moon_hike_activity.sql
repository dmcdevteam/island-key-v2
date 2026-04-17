-- ─────────────────────────────────────────────────────────────────
-- Activity: Sunset, Moonrise, Dinner — Pachnes Summit at Full Moon
-- Provider: Cretan Wild (already in providers table)
-- Full moon dates 2026 (May–Oct): May 12, Jun 11, Jul 10, Aug 9, Sep 7, Oct 6
-- Confirm specific date with Cretan Wild before responding to guest enquiries.
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
  'Sunset, Moonrise, Dinner — Pachnes Summit at Full Moon',
  'pachnes-full-moon-hike',
  'Pachnes is the second highest peak in Crete at 2,452m, deep in the White Mountains above Sfakia. This tour runs once a month — on the full moon, which is not a coincidence. You meet in Anopoli village and ride up into the high plateau by 4x4 open truck, which is already a view. Then you hike or run to the summit — choose your pace, both groups reach the top together. What you get up there: 360° views across the island, sunset fading behind the ridgeline, and the full moon rising over white limestone that starts to glow without any help from you. The descent happens under it, torchless. Dinner in a village taverna in Anopoli when you''re back down. One night a month — check availability for the date.',
  'adventure',
  'chania',
  '{B,M,P}',
  100.00,
  'EUR',
  '8 hours',
  'Full moon dates, May–October',
  'Full moon dates only — runs once per month. Enquire for this month''s date.',
  '{en}',
  'Anopoli village, Sfakia — 4x4 transport up to the trail start is included from here',
  array[
    'Guided hike or run to summit (your choice of pace)',
    '4x4 transport from Anopoli to trail start',
    'Summit picnic at sunset',
    'Traditional dinner at a local taverna in Anopoli'
  ],
  'Full moon dates only — runs once per month, check availability for the date during your stay. Choose hiking or trail running pace at the start — both groups reach the summit together for sunset and moonrise. Bring warm layers even in summer: at 2,452m it gets cold. Trail shoes or hiking boots required. Alcohol, insurance, and accommodation not included. Weather checked the day before — summit attempt may be cancelled in strong winds, with full refund or reschedule. Private tour available on request.',
  'Weather cancellations: full refund or reschedule to next full moon date. Guest cancellations: free up to 48 hours before.',
  (select id from public.providers where name = 'Cretan Wild' limit 1),
  0,
  true,
  true,
  'activity'
);
