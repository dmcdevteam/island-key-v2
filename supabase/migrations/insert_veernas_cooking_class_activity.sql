-- ─────────────────────────────────────────────────────────────────
-- Activity: Cook Like a Cretan — The Authentic Kitchen Class
-- Provider: Veerna's Kitchen (already in providers table)
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
  'Cook Like a Cretan — The Authentic Kitchen Class',
  'veernas-cooking-class-authentic',
  'Veerna and Kosti''s kitchen is one of Chania''s most loved experiences — and it shows the moment you arrive. Under the shade of avocado and olive trees, in a secluded garden built by the family, you''ll cook five dishes from scratch: slow-roasted lamb in the wood-fired stone oven, dolmades rolled with herbs from the garden, kalitsounia filled with cheese and wild greens, tzatziki and dakos. Then you sit down and eat all of it, with local wine and raki. Infants join free. Solo travellers welcome. One of those afternoons that ends up being the best meal of the trip.',
  'table',
  'chania',
  '{B,M,P}',
  105.00,
  'EUR',
  '4.5 hours',
  'Year-round',
  'Daily · 10:00am or 4:00pm',
  25,
  '{en}',
  'Secluded garden location in Chania — exact address shared on confirmation',
  array[
    'Welcome homemade refreshment or Greek coffee',
    'Cooking all 5 dishes: lamb kleftiko, dolmades, kalitsounia, tzatziki, dakos',
    'All ingredients (garden-fresh and locally sourced)',
    'Sit-down meal with everything you cooked',
    'Local wine',
    'Dessert'
  ],
  'Minimum 2 participants. Solo travellers message to book. Large groups contact for availability and discounts. Infants join free. Children aged 5–12 pay €50. Book at least 12 hours in advance. Payment by cash or card at the end of the class.',
  'Contact provider — book at least 12 hours in advance',
  (select id from public.providers where name = 'Veerna''s Kitchen' limit 1),
  0,
  true,
  true
);
