-- ─────────────────────────────────────────────────────────────────
-- Provider: Painting Around
-- ─────────────────────────────────────────────────────────────────
insert into public.providers (
  name,
  type,
  category,
  region,
  contact_name,
  contact_phone,
  whatsapp,
  website,
  commission_rate,
  notes,
  is_active
)
values (
  'Painting Around',
  'activity',
  'culture',
  'chania',
  'Hannah',
  '+30 697 199 5889',
  '+30 697 199 5889',
  'https://www.paintingaround.com',
  25.00,
  'Paint & Sip events at various Chania venues — restaurants, wineries, beachside. Public events (fixed schedule) and private events (bespoke, comes to you). Kids events available. 4 public event types: Thursday Paint & Sip (€25), Paint & Mimosa Morning (€35), Paint & Wine at Winery (€70), Kids Paint & Juice (€20). Private villa events available as a Service.',
  true
);

-- ─────────────────────────────────────────────────────────────────
-- Activity: Kids Paint & Juice — Creative Morning at the Beach
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
  'Kids Paint & Juice — Creative Morning at the Beach',
  'chania-kids-paint-juice',
  'A proper activity for younger guests — a guided painting session at Sandbar in Koum Kapi, right on the Chania waterfront. Kids work through a Cretan-themed painting step-by-step with juice and snacks alongside. Parents can sit back. Everyone goes home with a canvas and a child who''s been genuinely entertained for a couple of hours. One of the very few child-specific creative activities available in Chania.',
  'culture',
  'chania',
  '{B,M,P}',
  20.00,
  'EUR',
  '2 hours',
  'Year-round',
  'Check schedule on enquiry',
  '{en}',
  'Sandbar, Koum Kapi beach, Chania',
  array[
    'All painting materials',
    'Guided instruction',
    'Juice'
  ],
  'For children. Held at Sandbar, Koum Kapi beach, Chania. Check schedule on enquiry.',
  'Contact provider',
  (select id from public.providers where name = 'Painting Around' limit 1),
  0,
  false,
  true,
  'activity'
);
