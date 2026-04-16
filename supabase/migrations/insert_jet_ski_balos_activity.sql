-- Insert: Jet Ski to Balos — Just You and the Aegean
-- Provider: Falassarna Activities (already in providers table)
-- Tier visibility: M, P only
-- Category: sea · Region: chania

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
  'Jet Ski to Balos — Just You and the Aegean',
  'jet-ski-balos-safari',
  'Balos Lagoon is one of those places everyone wants to see — this is the most exhilarating way to get there. From Falassarna port, you''ll ride a powerful jet ski along the western coast of Crete with the open Aegean on one side and the rugged cliffs on the other. The 30-minute ride to Balos is the point — wind in your face, turquoise water beneath you, nobody ahead but the horizon. Arrive at the lagoon, swim, take it all in, then ride back. Your guide is with you the whole way.',
  'sea',
  'chania',
  '{M,P}',
  244.00,
  'EUR',
  '2 hours',
  'Apr–Oct',
  'Daily · check times on enquiry',
  8,
  '{en}',
  'Falassarna Activities kiosk, next to the pier — Falassarna port. Look for the sign. Arrive 15 mins early.',
  array[
    'Jet ski for up to 2 people',
    'Experienced guide throughout',
    'Full safety briefing and instruction',
    '30–40 minute ride each way to Balos Lagoon',
    'Free swim time at Balos'
  ],
  'This is an adventure activity — your guide will brief you fully before departure and stay with the group throughout. First-timers are welcome: the instructor takes over the controls if needed and gives a refresher lesson at Balos before the return ride. Arrive at the Falassarna kiosk (next to the pier) at least 15 minutes before departure. Not suitable for non-swimmers, pregnant guests, children under 8, or guests with heart conditions, epilepsy or mobility impairments. Drivers must be 18+. Weather-dependent — the team will advise if conditions aren''t safe.',
  'Free cancellation up to 24 hours before',
  (select id from public.providers where name = 'Falassarna Activities' limit 1),
  0,
  false,
  true
);
