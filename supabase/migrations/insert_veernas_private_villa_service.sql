-- ─────────────────────────────────────────────────────────────────
-- Service: Private Cretan Cooking Class at Your Villa
-- Provider: Veerna's Kitchen (already in providers table)
-- item_type = 'service' — provider comes to the guest
-- ─────────────────────────────────────────────────────────────────
INSERT INTO public.activities (
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
  meeting_point,
  includes,
  good_to_know,
  cancellation_policy,
  provider_id,
  is_featured,
  is_active,
  item_type,
  sort_order
) VALUES (
  'Private Cretan Cooking Class at Your Villa',
  'veernas-private-villa-cooking',
  'Veerna comes to you. Your villa becomes a Cretan kitchen for the afternoon — she arrives with everything needed and teaches you and your group to cook authentic Cretan dishes in your own space. No transfers, no schedules, no sharing the experience with strangers. Just your group, your kitchen, and one of the best cooks in Chania. Perfect for villa groups, special occasions, families with young children, or anyone who wants the full experience without leaving home.',
  'table',
  'chania',
  '{M,P}',
  null,
  'EUR',
  '3–4 hours',
  'Year-round',
  'By arrangement · contact to book',
  'Your villa or accommodation — Chania area',
  ARRAY[
    'Private chef (Veerna) comes to your villa',
    'All ingredients sourced and brought by the chef',
    'Hands-on cooking session',
    'Full sit-down meal with everything cooked',
    'Local wine',
    'Personalised menu on request'
  ],
  'Minimum group size applies — contact for pricing based on group size. Available across the Chania region. Menu can be tailored to dietary requirements. Book well in advance for peak season.',
  'Contact provider for cancellation policy',
  (SELECT id FROM public.providers WHERE name = 'Veerna''s Kitchen' LIMIT 1),
  false,
  true,
  'service',
  1
);
