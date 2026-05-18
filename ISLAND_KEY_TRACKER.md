# ISLAND KEY — PROJECT TRACKER
## Living document · Updated 18 May 2026
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

| ID | Item | Where | Priority | Added |
|----|------|--------|----------|-------|
| TD-001 | ~~Admin login shell extracted, React error #300 fixed.~~ ✅ RESOLVED 1 May 2026 | `app/admin/layout.tsx` | ✅ Resolved | 1 May 2026 |
| TD-002 | All images use `<img>` tags, not Next.js `<Image>`. FocalImage built on `<img>`. No automatic Next.js image optimisation beyond Sharp. Worth migrating eventually. | All image components | Low | 1 May 2026 |
| TD-003 | `time_window` column added to activities, all 40 activities tagged, but no guest-facing UI filter built. Data ready, filter deferred. | `app/activities/page.tsx` | Medium — before Season 2 | 1 May 2026 |
| TD-004 | Transfer formula prices for P2P use hardcoded fallback in `calculateP2PPrice()` if DB read fails. Verify fallback never silently used in production. | `lib/transfers.ts` | Low | 1 May 2026 |
| TD-005 | Existing activity images (pre-Sharp) have no variant URLs. Admin shows "Upload a new image to enable smart cropping" on all 40 activities. Needs one-time re-upload. | Admin activities form | Medium — before pilot | 1 May 2026 |
| TD-006 | `image_url` on articles table cannot be dropped — `published_articles` view depends on it. Future: update view to use `cover_image` then drop. | `articles` table | Low | 1 May 2026 |
| TD-007 | ~~Articles read_time dedup resolved.~~ ✅ RESOLVED 1 May 2026 | `articles` table | ✅ Resolved | 1 May 2026 |
| TD-008 | Rentals schema.sql is stale — live DB has different columns. vehicle_types and rental_extras have no CREATE TABLE record. Should be reconciled before external dev onboarding. | `schema.sql`, migrations | Medium | 6 May 2026 |
| TD-009 | T&Cs missing across all rental categories. User confirmed T&Cs will be added as a future step. Needed before public launch. | Rentals guest UI | High — before public launch | 18 May 2026 |

---

## SECTION 2 — PHASE 1 FEATURES

| ID | Feature | Context / Status | Owner |
|----|---------|-----------------|-------|
| P1-001 | **Point-to-point transfers — pricing validation** | P2P formula live but calibrated from competitor data. Validate after pilot. | Spyros + Manos |
| P1-002 | **Activity ratings display** (GYG, TripAdvisor) | No API integration yet. Deferred. | CC |
| P1-003 | **Stripe direct payment** | Enquiry-only. Stripe test mode pending IKE registration. | Spyros |
| P1-004 | **Return trip pricing — validation** | Live. Validate discount rate after pilot data. | Spyros |
| P1-005 | **Full/day driver transfers** | `full_day_driver` type in schema, not in UI. Build after P2P validated. | CC |
| P1-006 | **Post-trip activity rating prompt** | Needs notification mechanism. Not built. | CC |
| P1-007 | **"How much time do you have?" filter on activities** | `time_window` populated. UI deferred until guest behaviour observed. | CC |
| P1-008 | ~~**Rentals screen full rebuild**~~ ✅ COMPLETED 6 May 2026. Full cars flow, admin tabs, enquiry system. | CC |
| P1-009 | **Transfers screen full UI review** | Phase 0 complete. Fuller template review planned after pilot feedback. | Manos + CC |
| P1-010 | **WhatsApp Business API automation** | Manual WA from Spyros currently. Requires IKE registration + API approval. | Spyros |
| P1-011 | **User profile screen** | Exists with My Bookings. Favourites + full history planned. | CC |
| P1-012 | **Floating active-booking card — UI template review** | Unified confirmed pill + pending cart card now built. Full UI template review still planned. | Manos |
| P1-013 | **Rentals enquiry state — sessionStorage vs URL params** | SessionStorage used between /driver and /confirm. Review after first real user test. | CC |
| P1-014 | **Subcategory admin management** | Car classes, activity categories hardcoded in UI. DB-driven upgrade needed. Review after pilot. | CC |
| P1-015 | **Rentals — ATV, Bike, Boat full flows** | Cars complete. Boat port selector + coming-soon built. ATV UI adopted from cars. Bike delivery-only search working. Full booking flows for all three still to build. | CC |
| P1-016 | ~~**Vacation Essentials — enquiry flow**~~ ✅ COMPLETED 13 May 2026. Product pages, pricing tiers, cart, IKE- enquiry flow. | CC |
| P1-017 | **Weather-aware activity indicators (pre-pilot)** | Simple suitability dot on activity cards. Green/amber/red. Uses Open-Meteo already wired. Build before pilot. | CC |
| P1-018 | **E-Bikes & Bicycles — full flow build** | Awaiting screenshots from Spyros. Formula pricing (day rate + day 4+ custom discounts). 4-step how-it-works. T&Cs. | CC |
| P1-019 | **Boat rentals — full flow build** | Awaiting screenshots. City dropdown → interactive map with port pins. Skipper toggle per boat. Boat-specific activity filter. | CC |
| P1-020 | **Driver age per vehicle category** | Deferred from search page. Collect on driver details page. Min age varies by vehicle. Define per category before ATV/Boat flows built. | Spyros |
| P1-021 | **Terms & Conditions across all rental categories** | Referenced in E-Bike build spec. Needed before public launch across cars, ATVs, bikes, boats. Admin editable, accordion display in guest UI. | Spyros + CC |

---

## SECTION 3 — PHASE 2+ FEATURES

| ID | Feature | Phase | Notes |
|----|---------|-------|-------|
| P2-001 | **FlightAware integration** | 2 | Monitor flight delays, auto-adjust transfer pickup. Requires IKE + WhatsApp Business API. |
| P2-002 | **WhatsApp Business API — full automation** | 2 | Booking confirmations, driver assignment, pickup reminders, post-trip prompts. |
| P2-003 | **Surge pricing on transfers** | 2 | Dynamic pricing based on demand/time. Needs real booking volume. |
| P2-004 | **Group transfers (7+ pax)** | 3 | `group_transfer` type in schema. UI not built. |
| P2-005 | **Transfer provider / driver-facing app** | 3 | Currently manual WA to drivers. |
| P2-006 | **B2B API for travel agents** | 3 | Out of scope until volume justifies. |
| P2-007 | **Automated invoicing (bi-weekly to providers)** | 3 | Out of scope until Stripe live. |
| P2-008 | **Charge-to-Room (PMS integration)** | 3+ | Requires PMS partner. |
| P2-009 | **OdysseyX integration** | 2+ | Currently parked. |
| P2-010 | **Marketing landing page (www.islandkey.gr)** | 1/2 | In active development separately. |
| P2-011 | **Transfer provider assignment automation** | 3 | Admin page built, wire to booking assignment when provider network confirmed. |
| P2-012 | **Weather-aware WhatsApp briefings (post-pilot)** | 2 | Personalised morning WA to opted-in guests based on stay dates + activity interests. Requires WA Business API. Spyros follows up personally as permanent human layer. |

---

## SECTION 4 — OPEN QUESTIONS

| ID | Question | Blocking? | Owner | Added |
|----|----------|-----------|-------|-------|
| OQ-001 | **IKE registration timeline** — Stripe + WhatsApp Business API both require it. | Yes — blocks Stripe | Spyros | — |
| OQ-002 | **Transfer net rates** — 15 net rates (5 routes × 3 vehicle classes) not provided. Prices show NULL. | Yes — blocks transfer pricing | Spyros | — |
| OQ-003 | **Transfer provider names** — 3–4 providers not yet confirmed for providers table. | Partial | Spyros | — |
| OQ-004 | **Welcome pack contents and supplier** | Partial | Spyros | — |
| OQ-005 | **UI template review** — Full UI template review planned. Timing not confirmed. | No — current UI works | Manos | 1 May 2026 |
| OQ-006 | **Pilot property list (final)** — Only Dimitris City Break Apts confirmed. Others are samples. | Partial | Spyros | — |
| OQ-007 | **Driver age per vehicle category** — Min age varies. Define before ATV/Boat flows built. | Partial | Spyros | 6 May 2026 |
| OQ-008 | **Boat "Daily experiences" filter** — Need a flag/tag on activities to identify boat-specific ones. "On Water" filter currently too broad. Admin-side flag needed. | Yes — blocks boat flow | Spyros + CC | 18 May 2026 |
| OQ-009 | **E-Bike T&Cs document** — Spyros to share example T&Cs document before E-Bike build. | Yes — blocks E-Bike build | Spyros | 18 May 2026 |

---

## CHANGE LOG

| Date | Change | Added by |
|------|--------|----------|
| 1 May 2026 | Document created. All known tech debt, phase deferrals, open questions from build conversations. | AI Strategy Partner |
| 1 May 2026 | TD-006, TD-007 added. P1-004 updated. TD-007 resolved. TD-001 resolved. | AI Strategy Partner |
| 6 May 2026 | TD-008 added. P1-013, P1-014, P1-015, P1-016, P1-017 added. OQ-007 added. P1-008 marked resolved. P1-015/P1-016 status updated. | AI Strategy Partner |
| 13 May 2026 | Services section built (41 listings, full admin, subcategory management, offer fields). Activities cleanup (tabs removed, Deals to home FAB). Vacation Essentials product pages + cart. Rentals pickup locations, ports, DB-driven subcategories. Unified confirmed/pending floating UI. P1-016 marked resolved. | AI Strategy Partner |
| 18 May 2026 | Steps 1–5 completed: vehicle category filter fixed, unified date range picker, pickup locations address-only + city grouping (Chania/Rethymnon/Heraklion) + new locations seeded, ATV renamed, results carousel dynamic per vehicle type, CTA text type-aware. Activities "What's not included" added. Deals admin fixed. P1-018, P1-019, P1-020, P1-021 added. TD-009 added. OQ-008, OQ-009 added. | AI Strategy Partner |

---

*Review at the start of every session. Update when items resolve or new ones arise.*
