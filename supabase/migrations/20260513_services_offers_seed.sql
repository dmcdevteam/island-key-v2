-- ─── 1a. Remove hardcoded constraints + add offer fields ──────────────────────

ALTER TABLE public.services
  DROP CONSTRAINT IF EXISTS services_subcategory_check;

ALTER TABLE public.service_subcategories
  DROP CONSTRAINT IF EXISTS service_subcategories_subcategory_check;

-- Add offer fields to services
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS offer_label TEXT,
  ADD COLUMN IF NOT EXISTS offer_price NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS is_on_offer BOOLEAN NOT NULL DEFAULT false;

-- Update subcategories with stock Unsplash images
UPDATE public.service_subcategories SET image_wide =
  'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800'
  WHERE subcategory = 'wellness_health';
UPDATE public.service_subcategories SET image_wide =
  'https://images.unsplash.com/photo-1536640712-4d4c36ff0e4e?w=800'
  WHERE subcategory = 'family_care';
UPDATE public.service_subcategories SET image_wide =
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800'
  WHERE subcategory = 'food_dining';
UPDATE public.service_subcategories SET image_wide =
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800'
  WHERE subcategory = 'villa_lifestyle';
UPDATE public.service_subcategories SET image_wide =
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800'
  WHERE subcategory = 'private_experiences';
UPDATE public.service_subcategories SET image_wide =
  'https://images.unsplash.com/photo-1533777419517-eca1c5323af5?w=800'
  WHERE subcategory = 'beach_dining_nightlife';
UPDATE public.service_subcategories SET image_wide =
  'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800'
  WHERE subcategory = 'lifestyle_shopping';
UPDATE public.service_subcategories SET image_wide =
  'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800'
  WHERE subcategory = 'events_access';

-- ─── 1b. Seed all services ─────────────────────────────────────────────────────

INSERT INTO public.services (
  title, slug, short_description, description, category, subcategory,
  service_type, price_from, price_label, duration, mood_tags,
  image_wide, is_active, is_featured, sort_order, region
) VALUES

-- WELLNESS & HEALTH
('Physiotherapy',
 'physiotherapy',
 'Professional physiotherapy at your villa — injury recovery, mobility and pain relief.',
 'Our physiotherapists come fully equipped to your villa. Whether you are recovering from an injury, managing chronic pain, or seeking sports rehabilitation, treatment is tailored to your needs in complete privacy.',
 'in_house', 'wellness_health', 'Physiotherapy',
 80, 'from €80 / session', '60–90 minutes',
 ARRAY['relax_restore','active_fit'],
 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800',
 true, false, 1, 'chania'),

('Massage',
 'massage',
 'Deep Tissue, Thai or Relaxation massage — delivered to your villa by certified therapists.',
 'Choose from Deep Tissue for muscle recovery, Traditional Thai for full-body stretch and energy flow, or a classic Relaxation massage. All sessions take place at your villa — complete privacy, no rushing.',
 'in_house', 'wellness_health', 'Massage',
 70, 'from €70 / session', '60–120 minutes',
 ARRAY['relax_restore','indulge'],
 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800',
 true, true, 2, 'chania'),

('Osteopathy & Chiropractic',
 'osteopathy-chiropractic',
 'Structural alignment and pain management from qualified practitioners.',
 'Osteopathic and chiropractic treatment for back pain, joint issues, postural problems and sports injuries. Sessions carried out at your villa by qualified practitioners.',
 'in_house', 'wellness_health', 'Osteopathy / Chiropractic',
 90, 'from €90 / session', '60 minutes',
 ARRAY['relax_restore','active_fit'],
 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=800',
 true, false, 3, 'chania'),

('Personal Trainer',
 'personal-trainer',
 'One-to-one training at your villa, pool or on the beach.',
 'Certified personal trainers design sessions around your goals — strength, endurance, weight loss or general fitness. Training takes place at your villa, poolside, or on a nearby beach.',
 'in_house', 'wellness_health', 'Personal Trainer',
 60, 'from €60 / hour', '60 minutes',
 ARRAY['active_fit'],
 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
 true, false, 4, 'chania'),

('Yoga & Pilates',
 'yoga-pilates',
 'Private yoga or Pilates sessions with certified instructors — sunrise to sunset.',
 'Start your morning with a private yoga session overlooking the Mediterranean, or wind down with an evening Pilates class. Suitable for all levels. Mats and equipment provided.',
 'in_house', 'wellness_health', 'Yoga / Pilates',
 55, 'from €55 / hour', '60–90 minutes',
 ARRAY['relax_restore','active_fit'],
 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800',
 true, true, 5, 'chania'),

('Meditation Coach',
 'meditation-coach',
 'Guided meditation and mindfulness sessions in the privacy of your villa.',
 'Whether you are new to meditation or deepening an existing practice, our coaches guide you through breathwork, mindfulness and visualisation techniques tailored to your needs.',
 'in_house', 'wellness_health', 'Meditation Coach',
 50, 'from €50 / hour', '45–60 minutes',
 ARRAY['relax_restore'],
 'https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?w=800',
 true, false, 6, 'chania'),

('Nutritionist & Diet Coach',
 'nutritionist',
 'Personalised nutrition planning for your stay and beyond.',
 'Consult with a qualified nutritionist to design a meal plan that works with your lifestyle, fitness goals or health conditions. Includes a detailed report and follow-up session.',
 'in_house', 'wellness_health', 'Nutritionist / Diet Coach',
 70, 'from €70 / session', '60 minutes',
 ARRAY['active_fit','indulge'],
 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800',
 true, false, 7, 'chania'),

('IV Therapy & Vitamin Drips',
 'iv-therapy',
 'High-performance IV drips administered at your villa by registered medical professionals.',
 'From hydration and energy boosts to immunity and anti-ageing formulas. All IV treatments are administered by registered nurses or doctors in the comfort of your villa. Popular options: Hydration, Myers Cocktail, Glutathione, Vitamin C mega-dose.',
 'in_house', 'wellness_health', 'IV Therapy / Vitamin Drips',
 150, 'from €150 / session', '45–60 minutes',
 ARRAY['indulge','relax_restore'],
 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800',
 true, true, 8, 'chania'),

('Beauty Therapist',
 'beauty-therapist',
 'Facials, skincare treatments and beauty rituals at your villa.',
 'Professional facials, body treatments and skincare rituals using premium products. Our therapists bring everything needed for a full spa experience without leaving your villa.',
 'in_house', 'wellness_health', 'Beauty Therapist',
 80, 'from €80 / session', '60–90 minutes',
 ARRAY['indulge','relax_restore'],
 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=800',
 true, false, 9, 'chania'),

('Hairdresser & Barber',
 'hairdresser-barber',
 'Professional hair styling and grooming at your villa — ready for any occasion.',
 'From blow-dries and colour to precision cuts and traditional wet shaves. Our stylists come to you — ideal before a special dinner, event or simply because you deserve it.',
 'in_house', 'wellness_health', 'Hairdresser / Barber',
 40, 'from €40 / session', '30–90 minutes',
 ARRAY['indulge'],
 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800',
 true, false, 10, 'chania'),

-- FAMILY & CARE
('Babysitter & Nanny',
 'babysitter-nanny',
 'Vetted, experienced childcare professionals so you can fully relax.',
 'All our babysitters and nannies are DBS-checked and experienced with children of all ages. Available for daytime, evening and overnight stays. We match you with someone suited to your children''s ages and needs.',
 'in_house', 'family_care', 'Babysitter / Nanny',
 15, 'from €15 / hour', 'Minimum 3 hours',
 ARRAY['family_time'],
 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800',
 true, true, 1, 'chania'),

('Private Tutor',
 'private-tutor',
 'Keep learning on track during the holidays with one-to-one tutoring.',
 'Qualified tutors for primary and secondary school subjects. Perfect for keeping children engaged during longer stays or catching up on schoolwork. Available in English, German and Greek.',
 'in_house', 'family_care', 'Private Tutor',
 40, 'from €40 / hour', '60–90 minutes',
 ARRAY['family_time'],
 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800',
 true, false, 2, 'chania'),

('Kids Entertainment',
 'kids-entertainment',
 'Clowns, animators and activity leaders who bring the fun to your villa.',
 'From magic shows and face painting to organised games and themed parties. Our entertainers are experienced with all age groups and bring everything needed for an unforgettable afternoon.',
 'in_house', 'family_care', 'Kids Entertainment',
 80, 'from €80 / session', '2 hours',
 ARRAY['family_time','celebrate'],
 'https://images.unsplash.com/photo-1560439514-4e9645039924?w=800',
 true, false, 3, 'chania'),

('Pet Sitting & Dog Walking',
 'pet-sitting',
 'Professional pet care while you explore — walks, feeding and companionship.',
 'Experienced pet sitters and dog walkers cover feeding, exercise and companionship while you are out exploring. Daily or multi-day care available.',
 'in_house', 'family_care', 'Pet Sitting / Dog Walker',
 25, 'from €25 / session', '1–2 hours',
 ARRAY['family_time'],
 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800',
 true, false, 4, 'chania'),

-- FOOD & DINING
('Private Chef',
 'private-chef',
 'A professional chef in your villa kitchen — from intimate dinners to celebration feasts.',
 'Our private chefs design bespoke menus around your preferences, dietary needs and occasion. From a romantic dinner for two to a lavish celebration feast for twenty. All shopping, preparation and clearing included.',
 'in_house', 'food_dining', 'Private Chef',
 150, 'from €150 / meal', '3–5 hours including prep',
 ARRAY['indulge','celebrate','host_entertain'],
 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800',
 true, true, 1, 'chania'),

('Breakfast Service',
 'breakfast-service',
 'Fresh Cretan breakfast delivered and set up at your villa every morning.',
 'Start every morning right — freshly baked bread, local cheeses, cold cuts, seasonal fruit, eggs your way and good coffee. Set up and cleared by our team so you wake up to a ready table.',
 'in_house', 'food_dining', 'Breakfast Service',
 25, 'from €25 / person', 'Daily delivery',
 ARRAY['indulge','relax_restore'],
 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800',
 true, false, 2, 'chania'),

('BBQ Chef',
 'bbq-chef',
 'A professional BBQ chef takes over your grill for the evening.',
 'The full Greek BBQ experience — marinated meats, fresh seafood, mezze and everything in between. Your chef handles the shopping, cooking and presentation while you enjoy time with your guests.',
 'in_house', 'food_dining', 'BBQ Chef',
 120, 'from €120 / event', '3–4 hours',
 ARRAY['celebrate','host_entertain'],
 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
 true, false, 3, 'chania'),

('Bartender & Mixologist',
 'bartender-mixologist',
 'A professional bartender crafts cocktails and runs your villa bar for the evening.',
 'From welcome cocktails to a full evening bar service. Our mixologists bring their own kit, create a custom menu for your event and ensure your guests are always looked after.',
 'in_house', 'food_dining', 'Bartender / Mixologist',
 80, 'from €80 / hour', 'Minimum 3 hours',
 ARRAY['celebrate','host_entertain'],
 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800',
 true, false, 4, 'chania'),

-- VILLA & LIFESTYLE
('Housekeeping',
 'housekeeping',
 'Daily villa cleaning and maintenance so you never lift a finger.',
 'Professional housekeeping service — daily cleaning, bed changes, bathroom refresh and general tidying. Scheduled around your preferred time so it never disrupts your day.',
 'in_house', 'villa_lifestyle', 'Housekeeping',
 60, 'from €60 / session', '2–3 hours',
 ARRAY['relax_restore'],
 'https://images.unsplash.com/photo-1584820927498-cad0e21c4e69?w=800',
 true, false, 1, 'chania'),

('Laundry & Dry Cleaning',
 'laundry',
 'Collect, clean and return — full laundry and dry cleaning service.',
 'We collect from your villa, launder or dry clean, and return everything pressed and folded. Turnaround is typically 24–48 hours.',
 'in_house', 'villa_lifestyle', 'Laundry / Dry Cleaning',
 null, 'Price on request', '24–48 hours',
 ARRAY['relax_restore'],
 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=800',
 true, false, 2, 'chania'),

('Butler Service',
 'butler',
 'A personal butler on call for your entire stay.',
 'Your dedicated butler manages everything — from morning coffee to evening arrangements, restaurant bookings, activity planning and whatever else the day brings. Discretion and attention to detail guaranteed.',
 'in_house', 'villa_lifestyle', 'Butler Service',
 200, 'from €200 / day', 'Full day or half day',
 ARRAY['indulge','relax_restore'],
 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
 true, true, 3, 'chania'),

('Grocery Shopping & Pre-stocking',
 'grocery-shopping',
 'Your villa stocked before you arrive or restocked during your stay.',
 'Send us your list and we shop, unpack and stock your villa before you arrive. Or call on us mid-stay to restock essentials, wine, local produce or anything else you need.',
 'in_house', 'villa_lifestyle', 'Grocery Shopping / Pre-stocking',
 30, 'from €30 / shop + product cost', '2–4 hours lead time',
 ARRAY['relax_restore','family_time'],
 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800',
 true, false, 4, 'chania'),

('Flower Decoration',
 'flower-decoration',
 'Fresh floral arrangements and decoration for your villa or event.',
 'From a simple vase of Mediterranean blooms to a fully dressed dinner table or event space. Our florists source locally and design to your brief.',
 'in_house', 'villa_lifestyle', 'Flower Decoration',
 80, 'from €80 / arrangement', 'Same-day available',
 ARRAY['celebrate','indulge'],
 'https://images.unsplash.com/photo-1487530811015-780e01a01218?w=800',
 true, false, 5, 'chania'),

('Pool Maintenance',
 'pool-maintenance',
 'Keep your pool in perfect condition throughout your stay.',
 'Chemical balance checks, cleaning and maintenance carried out by certified pool technicians. Available as a one-off or recurring service throughout your stay.',
 'in_house', 'villa_lifestyle', 'Pool Maintenance',
 null, 'Price on request', 'By arrangement',
 ARRAY['relax_restore'],
 'https://images.unsplash.com/photo-1576610616656-d3aa5d1f4534?w=800',
 true, false, 6, 'chania'),

-- PRIVATE EXPERIENCES
('Private DJ',
 'private-dj',
 'A professional DJ sets the perfect soundtrack for your villa event.',
 'From sunset aperitivo sessions to late-night pool parties. Our DJs read the room and build the atmosphere you want. Full equipment setup included.',
 'in_house', 'private_experiences', 'Private DJ',
 200, 'from €200 / event', 'Minimum 3 hours',
 ARRAY['celebrate','host_entertain'],
 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800',
 true, true, 1, 'chania'),

('Live Music & Band',
 'live-music',
 'Live musicians for any occasion — intimate or spectacular.',
 'Solo performers, duos or full bands. Jazz trio for dinner, Greek band for a traditional evening, acoustic set for a sunset gathering. All curated to your event.',
 'in_house', 'private_experiences', 'Live Music / Band',
 300, 'from €300 / event', 'Minimum 2 hours',
 ARRAY['celebrate','host_entertain'],
 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
 true, false, 2, 'chania'),

('Photographer & Videographer',
 'photographer',
 'Professional photography and video to capture your Cretan memories.',
 'Family portraits, couple sessions, event coverage or villa lifestyle shoots. All images delivered edited within 48 hours. Drone footage available on request.',
 'in_house', 'private_experiences', 'Photographer / Videographer',
 150, 'from €150 / hour', '1–4 hours',
 ARRAY['celebrate','indulge'],
 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800',
 true, false, 3, 'chania'),

('Private Cinema Setup',
 'private-cinema',
 'A movie night under the stars — outdoor cinema set up at your villa.',
 'Projector, screen, surround sound and comfortable seating set up in your garden or terrace. You choose the film. We bring the popcorn.',
 'in_house', 'private_experiences', 'Private Cinema Setup',
 200, 'from €200 / evening', '3–4 hours',
 ARRAY['indulge','family_time'],
 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800',
 true, false, 4, 'chania'),

('Themed Dinner Night',
 'themed-dinner',
 'A fully curated themed dining experience at your villa.',
 'Meze evening, Greek feast, Mediterranean seafood night or a custom theme — our team handles menu, decoration, lighting and service. A dinner your guests will talk about for years.',
 'in_house', 'private_experiences', 'Themed Dinner Night',
 100, 'from €100 / person', '4–5 hours',
 ARRAY['celebrate','indulge','host_entertain'],
 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
 true, true, 5, 'chania'),

('Security & Bodyguard',
 'security',
 'Discreet professional security for high-profile guests and events.',
 'Licensed security professionals for personal protection, event security or villa monitoring. Available for single days or full-stay assignments. Discretion guaranteed.',
 'in_house', 'private_experiences', 'Security / Bodyguard',
 null, 'Price on request', 'By arrangement',
 ARRAY['indulge'],
 'https://images.unsplash.com/photo-1521791055366-0d553872952f?w=800',
 true, false, 6, 'chania'),

('Personal Shopping',
 'personal-shopping-inhouse',
 'A personal shopper sources exactly what you want — you enjoy Crete.',
 'Tell us what you are looking for and our personal shoppers source it — clothing, gifts, local products, luxury items. Delivered to your villa.',
 'in_house', 'private_experiences', 'Personal Shopping',
 100, 'from €100 / session', 'By arrangement',
 ARRAY['indulge'],
 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800',
 true, false, 7, 'chania'),

-- BEACH, DINING & NIGHTLIFE
('Restaurant Reservations',
 'restaurant-reservations',
 'The best tables in Chania — secured without the wait.',
 'We hold relationships with the finest restaurants across Chania and western Crete. Tell us your preferred cuisine, occasion and party size and we arrange everything — including any special requests.',
 'reservations', 'beach_dining_nightlife', 'Restaurant Reservations',
 null, 'Free service', 'Same or next day',
 ARRAY['celebrate','indulge'],
 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
 true, true, 1, 'chania'),

('VIP Tables & Club Access',
 'vip-tables',
 'Skip the queue — VIP tables and bottle service at the best venues.',
 'Guaranteed entry, reserved tables and bottle service at Chania''s best clubs and rooftop bars. We manage everything in advance so your evening runs seamlessly.',
 'reservations', 'beach_dining_nightlife', 'VIP Tables / Clubs',
 null, 'Price on request', 'Advance booking required',
 ARRAY['celebrate','indulge','host_entertain'],
 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800',
 true, false, 2, 'chania'),

('Beach Club Booking',
 'beach-club',
 'Premium sun beds and service at the best beach clubs in Crete.',
 'Reserved sun beds, parasols and waiter service at hand-picked beach clubs. We book ahead so you arrive to everything ready — all you need is sunscreen.',
 'reservations', 'beach_dining_nightlife', 'Beach Club Booking',
 null, 'Price on request', 'Advance booking required',
 ARRAY['relax_restore','celebrate','indulge'],
 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
 true, true, 3, 'chania'),

-- LIFESTYLE & SHOPPING
('Personal Shopping',
 'personal-shopping',
 'A personal shopper curates your Cretan wardrobe and gift list.',
 'Our personal shoppers know every boutique, market and hidden gem in Chania. Brief us on what you need and we do the legwork — or join us for a guided shopping tour.',
 'reservations', 'lifestyle_shopping', 'Personal Shopping',
 100, 'from €100 / session', 'Half or full day',
 ARRAY['indulge'],
 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800',
 true, false, 1, 'chania'),

('Luxury Boutique Access',
 'luxury-boutique',
 'Private access and appointments at Crete''s best independent boutiques.',
 'Skip the tourist trail. We arrange private appointments at carefully selected independent boutiques — jewellers, fashion designers, ceramicists and artisans — for an exclusive shopping experience.',
 'reservations', 'lifestyle_shopping', 'Luxury Boutique Access',
 null, 'Price on request', 'By appointment',
 ARRAY['indulge'],
 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800',
 true, false, 2, 'chania'),

('Delivery Services',
 'delivery-services',
 'Anything delivered to your villa — groceries, pharmacy, gifts, supplies.',
 'Need something at your villa? Tell us what and when. We source and deliver — whether it is a forgotten charger, a bottle of wine, pharmacy items or a last-minute birthday cake.',
 'reservations', 'lifestyle_shopping', 'Delivery Services',
 null, 'Price on request', 'Same day where possible',
 ARRAY['relax_restore','family_time'],
 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800',
 true, false, 3, 'chania'),

-- EVENTS & ACCESS
('Concert & Show Tickets',
 'concert-tickets',
 'Tickets to concerts, theatre and cultural events across Crete.',
 'We source tickets to sold-out concerts, open-air theatre, cultural festivals and live performances. Tell us what you want to see and we handle the rest.',
 'reservations', 'events_access', 'Concert Tickets',
 null, 'Price on request', 'Subject to availability',
 ARRAY['celebrate','host_entertain'],
 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800',
 true, false, 1, 'chania'),

('VIP Events',
 'vip-events',
 'Exclusive access to private and VIP events across Crete.',
 'Art openings, private dinners, charity galas and invitation-only gatherings. Our network gets you through the door when there is no public ticket.',
 'reservations', 'events_access', 'VIP Events',
 null, 'Price on request', 'Subject to availability',
 ARRAY['celebrate','indulge'],
 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
 true, false, 2, 'chania'),

('Festivals',
 'festivals',
 'The best of Crete''s festival season — curated and arranged for you.',
 'Wine festivals, food markets, music festivals and cultural celebrations. We arrange transport, tickets and where relevant, VIP areas — so you experience the best of Crete''s vibrant event scene.',
 'reservations', 'events_access', 'Festivals',
 null, 'Price on request', 'Seasonal',
 ARRAY['celebrate'],
 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800',
 true, false, 3, 'chania'),

('Private Parties',
 'private-parties',
 'Full planning and execution of private parties at your villa or venue.',
 'From intimate gatherings to large celebrations — we handle concept, catering, entertainment, decoration, staffing and logistics. You enjoy the party.',
 'reservations', 'events_access', 'Private Parties',
 null, 'Price on request', 'By arrangement',
 ARRAY['celebrate','host_entertain'],
 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800',
 true, true, 4, 'chania');

-- Verify counts
SELECT
  (SELECT COUNT(*) FROM public.services) AS total_services,
  (SELECT COUNT(*) FROM public.services WHERE category = 'in_house') AS in_house,
  (SELECT COUNT(*) FROM public.services WHERE category = 'reservations') AS reservations;
