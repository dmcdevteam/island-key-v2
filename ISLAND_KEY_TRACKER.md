# ISLAND KEY — PROJECT TRACKER
## Living document · Updated 6 May 2026
### Maintained by: AI Strategy Partner (Locus / Manos + Spyros)

---

## HOW TO USE THIS DOCUMENT

This tracker has four sections:
1. **Tech Debt** — known code quality issues, deferred refactors, things that work but need cleaning up
2. **Phase 1 Features** — features deliberately deferred from Phase 0, confirmed for Phase 1
3. **Phase 2+ Features** — longer-horizon items, not yet scoped
4. **Open Questions** — decisions not yet made that are blocking or will block progress

Items are added here when they come up in conversation and removed when resolved.
Each item has a short ID (TD-001, P1-001 etc.) for easy reference.

---

## SECTION 1 — TECH DEBT

Items that work correctly today but should be cleaned up before the codebase grows further.

| ID | Item | Where | Priority | Added |
|----|------|--------|----------|-------|
| TD-001 | ~~AdminShell login-only shell should be extracted to a separate component.~~ — ✅ RESOLVED 1 May 2026. Login shell extracted, React error #300 fixed. | `app/admin/layout.tsx` | ✅ Resolved | 1 May 2026 |
| TD-002 | All images use `<img>` tags throughout the codebase, not Next.js `<Image>` component. FocalImage is built on `<img>`. This means no automatic Next.js image optimisation (resizing, format negotiation beyond Sharp). Not urgent while Sharp handles processing, but worth migrating eventually. | All image components | Low | 1 May 2026 |
| TD-003 | `time_window` column added to activities table and all 40 activities tagged, but no guest-facing UI filter built yet. Data is ready, filter deferred. Revisit after seeing real guest behaviour with mood tags. | `app/activities/page.tsx` | Medium — before Season 2 | 1 May 2026 |
| TD-004 | Transfer formula prices for P2P use hardcoded fallback in `calculateP2PPrice()` if DB read fails. Should always read from `transfer_formula` table — verify fallback is never silently used in production. | `lib/transfers.ts` | Low | 1 May 2026 |
| TD-005 | Existing activity images (pre-Sharp migration) have no variant URLs (`hero_wide_url`, `hero_square_url`). Fallback chain handles this gracefully but admin shows "Upload a new image to enable smart cropping" warning on all 40 activities. Needs a one-time re-upload or bulk Sharp processing pass. | Admin activities form | Medium — before pilot properties upload photos | 1 May 2026 |
| TD-006 | `image_url` on articles table is not used by the admin form (which uses `cover_image`) but CANNOT be dropped — `published_articles` view depends on it. Leave in place. Consider updating `published_articles` view to use `cover_image` instead in a future sprint, then drop `image_url`. | `articles` table, `published_articles` view | Low — future sprint only | 1 May 2026 |
| TD-007 | ~~Articles table read_time dedup~~ — RESOLVED. `read_time_minutes` dropped via SQL. Form uses `read_time_min` consistently. | `articles` table | ✅ Resolved 1 May 2026 | 1 May 2026 |
| TD-008 | Rentals schema.sql is stale — live DB has different columns than schema file. vehicle_types and rental_extras tables have no CREATE TABLE record in migrations (created manually). schema.sql does not reflect reality. Should be reconciled before bringing in any external developer. | `schema.sql`, migration files | Medium — before external dev onboarding | 6 May 2026 |

---

## SECTION 2 — PHASE 1 FEATURES

Deliberately deferred from Phase 0. Confirmed for Phase 1 (post-pilot, when real booking data exists).

| ID | Feature | Context / Why Deferred | Owner |
|----|---------|------------------------|-------|
| P1-001 | **Point-to-point transfers — full pricing validation** | P2P formula is live but calibrated from competitor data only. After pilot, validate against real bookings and adjust formula per zone. | Spyros + Manos |
| P1-002 | **Activity ratings display** (GYG, TripAdvisor) | External rating display planned on activity cards. Deferred — no API integration built yet. | CC |
| P1-003 | **Stripe direct payment** | Currently enquiry-only. Stripe is in test mode pending IKE registration. Activate when company registration complete. | Spyros |
| P1-004 | **Return trip pricing — validation** | Return trip is live. Admin discount controls now built (transfer_settings table, return pricing section in Transfer Pricing admin). Discount percentage can be set whenever ready. Validate actual discount rate after pilot data. | Spyros |
| P1-005 | **Full/day driver transfers** | Transfer type `full_day_driver` is in the schema but not exposed in UI. Build after Point-to-point is validated. | CC |
| P1-006 | **Post-trip activity rating prompt** | Guest receives rating request after booking status = 'completed'. Not built — needs notification mechanism (WhatsApp or email). | CC |
| P1-007 | **"How much time do you have?" filter on activities** | `time_window` column populated for all 40 activities. UI filter deferred until guest behaviour with mood tags is observed. | CC |
| P1-008 | ~~**Rentals screen full rebuild**~~ — ✅ COMPLETED 6 May 2026. Full cars flow built: category landing, search, results with filters, driver details, confirm + enquiry. Admin tabs: Car Listings, Car Extras, Car Enquiries, Category Images. | CC |
| P1-009 | **Transfers screen full rebuild** | Flagged in handoff. Phase 0 is complete but a fuller UI template review is planned once pilot feedback arrives. | Manos + CC |
| P1-010 | **WhatsApp Business API automation** | Currently manual WhatsApp from Spyros. Phase 1 adds automated message triggers (booking confirmation, driver assignment, pickup reminder). Requires IKE registration + WhatsApp Business API approval. | Spyros |
| P1-011 | **User profile screen** | Profile screen exists with My Bookings. Favourites + full booking history planned. Currently in active development — not fully complete. | CC |
| P1-012 | **Floating active-booking card — UI template review** | Floating bookings pill works but both Manos and Spyros noted a full UI template review is planned across the whole app. Pill may be redesigned as part of that. | Manos |
| P1-013 | **Rentals enquiry state — sessionStorage vs URL params** | Enquiry state (driver details, selected extras, pricing) is passed from /rentals/cars/[id]/driver to /confirm via sessionStorage['rental_enquiry']. If this causes issues in testing (state lost on refresh, back navigation), swap to URL query string encoding. Two-file change, ~10 min. Review after first real user test. | CC |
| P1-014 | **Subcategory admin management** | Car classes, activity categories, and other subcategories are currently hardcoded in the UI. To add a new subcategory requires CC code change — admin cannot do it alone. Architectural upgrade needed to make these DB-driven and fully admin-manageable. 1–2 day CC job. Review after pilot. | CC |
| P1-015 | **Rentals — ATV & Motorbike, Bike & E-Bike, Boat flows** | Only the Cars flow is fully built. The other three vehicle categories (ATV & Motorbike, Bike & E-Bike, Boat) have landing cards but no search → results → booking flow yet. Build after Cars flow is validated in pilot. | CC |
| P1-016 | **Vacation Essentials — item enquiry flow** | Current /rentals/essentials shows items with a global WhatsApp CTA. No per-item selection or quantity picker yet. Build a proper enquiry flow (select items + quantities → send itemised WhatsApp + email) after pilot feedback. | CC |
| P1-017 | **Weather-aware activity indicators (pre-pilot)** | Simple suitability indicator on each activity card and detail page — a small coloured dot/icon. Green = good conditions, Amber = check conditions, Red = may be affected. Rules engine based on activity category: sea/water activities flag when wind >25km/h or waves >1m; outdoor/adventure flags when temp >38°C or rain probability >60%; other categories use a general threshold. Uses Open-Meteo API already wired to home screen — no new API key. Data refreshed on page load, cached for 30 min. Zero guest interaction needed — purely informational. Agreed as pre-pilot feature. | CC |

---

## SECTION 3 — PHASE 2+ FEATURES

Longer horizon. Not yet scoped in detail. Listed to avoid forgetting.

| ID | Feature | Phase | Notes |
|----|---------|-------|-------|
| P2-001 | **FlightAware integration** | 2 | Monitor flight delays, auto-adjust transfer pickup time. Requires IKE + WhatsApp Business API first. |
| P2-002 | **WhatsApp Business API — full automation** | 2 | Automated booking confirmations, driver assignment, pickup reminders, post-trip prompts. |
| P2-003 | **Surge pricing on transfers** | 2 | Dynamic pricing based on demand/time. Needs real booking volume to calibrate. |
| P2-004 | **Group transfers (7+ pax, minivan/minibus dedicated)** | 3 | Transfer type `group_transfer` in schema. UI not built. |
| P2-005 | **Transfer provider app / driver-facing interface** | 3 | Currently manual WhatsApp to drivers. Phase 3 adds driver-facing view. |
| P2-006 | **B2B API for travel agents** | 3 | Agent portal for booking transfers. Out of scope until volume justifies. |
| P2-007 | **Automated invoicing (bi-weekly to providers)** | 3 | From completed job log. Out of scope until Stripe is live. |
| P2-008 | **Charge-to-Room (PMS integration)** | 3+ | Requires PMS partner. No current integration. |
| P2-009 | **OdysseyX integration** | 2+ | OdysseyX as a supplier within Island Key. Currently parked. |
| P2-010 | **Marketing landing page (www.islandkey.gr)** | 1/2 | In active development separately from the guest app. |
| P2-011 | **Transfer provider assignment automation** | 3 | Transfer Providers admin page is built and ready (Phase 3 badge). Wire to booking assignment when provider network is confirmed. |
| P2-012 | **Weather-aware WhatsApp briefings (post-pilot)** | 2 | Automated morning weather briefing via WhatsApp to opted-in guests — personalised based on stay dates and activities enquired about. Two message types: (1) Opportunity nudge — "It's going to be 38°C and no wind on Thursday — perfect for the catamaran. Book now." (2) Alert — "Tomorrow's forecast shows strong winds (30km/h+) in western Crete. Your Balos speedboat trip may be affected — Spyros will be in touch." Requires WhatsApp Business API (already on roadmap as P1-010/P2-002). Spyros follows up personally as additional human layer. This is the genuinely differentiated feature — no generic platform does personalised weather-activity nudges via WhatsApp. |

---

## SECTION 4 — OPEN QUESTIONS

Decisions not yet made that will affect build or operations.

| ID | Question | Blocking? | Owner | Added |
|----|----------|-----------|-------|-------|
| OQ-001 | **IKE registration timeline** — Stripe direct payment and WhatsApp Business API both require company registration. When is this expected to complete? | Yes — blocks Stripe activation | Spyros | — |
| OQ-002 | **Transfer net rates** — 15 net rates (5 routes × 3 vehicle classes) not yet provided. Preset route prices show NULL. Build is scaffolded and waiting. | Yes — blocks transfer preset pricing going live | Spyros | — |
| OQ-003 | **Transfer provider names** — 3–4 transfer providers for Phase 0 not yet confirmed for the providers table. Currently driver assignment is free-text only. | Partial — admin works, just no dropdown | Spyros | — |
| OQ-004 | **Welcome pack contents and supplier** — Welcome pack is an extra that guests can select on transfers. Who supplies it and what does it contain? Needed before pilot. | Partial | Spyros | — |
| OQ-005 | **UI template review** — Both partners noted intent to explore a different UI template across all Island Key app screens. Timing and scope not confirmed. Some features (floating pill, WhatsApp side tab) may be redesigned as part of this. | No — current UI works | Manos | 1 May 2026 |
| OQ-006 | **Pilot property list (final)** — Only Dimitris City Break Apts is confirmed as a real pilot property. The other 4 properties in the transfer routes table are samples. Final property list needed to seed real routes and QR codes. | Partial | Spyros | — |
| OQ-007 | **Driver age requirements per vehicle category** — minimum age varies by vehicle type (noted during rentals build, deferred from search page). Needs to be defined per category before ATV/Motorbike and Boat flows are built. | Partial — Cars flow works without it | Spyros | 6 May 2026 |

---

## CHANGE LOG

| Date | Change | Added by |
|------|--------|----------|
| 1 May 2026 | Document created. Populated with all known tech debt, phase deferrals, and open questions from build conversations to date. | AI Strategy Partner |
| 1 May 2026 | Added TD-006 (articles image_url orphan check), TD-007 (read_time dedup — high priority). Updated P1-004 (return trip discount admin controls now built). | AI Strategy Partner |
| 1 May 2026 | TD-007 resolved — read_time_minutes dropped. TD-006 updated — image_url cannot be dropped (published_articles view dependency). Future work: update view to use cover_image then drop. | AI Strategy Partner |
| 1 May 2026 | TD-001 resolved — admin login React #300 fixed, login shell extracted as separate component. Articles bugs resolved (is_active→is_published, slug auto-gen, preview routing). No open bugs at handoff. | AI Strategy Partner |
| 6 May 2026 | Added TD-008 (stale schema.sql). Added P1-013 (sessionStorage review), P1-014 (subcategory admin management), P1-015 (ATV/Bike/Boat flows), P1-016 (Vacation Essentials enquiry flow). Added OQ-007 (driver age per vehicle category). Marked P1-008 as resolved. | AI Strategy Partner |
| 6 May 2026 | Added P1-017 (weather-aware activities Layer 1 — passive forecast on activity pages) and P2-012 (weather alerting Layer 2 — active post-booking monitoring + Spyros WA notification). | AI Strategy Partner |
| 6 May 2026 | Revised P1-017 and P2-012 to match exact agreed spec from prior session: P1-017 = simple coloured suitability dot on activity cards pre-pilot; P2-012 = personalised WhatsApp weather briefings post-pilot using Business API. | AI Strategy Partner |

---

*This document should be reviewed at the start of every working session and updated when items are resolved or new ones arise. Add it to the project knowledge base so it persists across conversations.*
