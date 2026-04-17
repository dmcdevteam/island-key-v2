-- ─────────────────────────────────────────────────────────────────
-- Activity: Gorge, Coast & a Byzantine Church — The Paleochora Loop
-- Provider: Cretan Wild (already in providers table)
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
  'Gorge, Coast & a Byzantine Church — The Paleochora Loop',
  'paleochora-anidri-gorge-loop',
  'Paleochora sits on a narrow peninsula on the southwest coast — and this three-hour loop is the best way to understand why people come here and never leave. You start in the village, follow a mix of coastal road and dirt track until the gorge opens up in front of you, then push through it to the hilltop Profitis Ilias church. The views from up there stretch out over the Libyan Sea. On the way back, you choose: single track trail down through the scrub, or the easier road if your legs are having second thoughts. Either way, you''re back in time for lunch.',
  'adventure',
  'chania',
  '{B,M,P}',
  59.00,
  'EUR',
  '3 hours',
  'March–November',
  '{en}',
  'Paleochora village — exact meeting point confirmed on booking',
  array[
    'Expert guided loop hike',
    'Route briefing and trail options explained',
    'Local knowledge on gorge ecology, village history, and Byzantine church'
  ],
  'Two descent options: single track trail (more technical) or road (easier) — your guide will explain both at the top. Hiking shoes recommended; trail sections can be rocky. Gorge is dry in summer but can be slippery after rain. A trekking pole helps on the descent. 900ft / 274m elevation gain, mostly in the first half.',
  'Free cancellation up to 48 hours before. Weather cancellations fully refunded or rescheduled.',
  (select id from public.providers where name = 'Cretan Wild' limit 1),
  0,
  false,
  true,
  'activity'
);
