# ISLAND KEY — PROJECT TRACKER
## Living document · Updated 21 May 2026
### Maintained by: AI Strategy Partner (Locus / Manos + Spyros)

---

## SECTION 1 — TECH DEBT

| ID | Item | Where | Priority | Added |
|----|------|--------|----------|-------|
| TD-001 | ~~Admin login shell + React #300~~ ✅ Resolved | `app/admin/layout.tsx` | ✅ | 1 May |
| TD-002 | All images use `<img>` not Next.js `<Image>`. No automatic optimisation beyond Sharp. | All image components | Low | 1 May |
| TD-003 | `time_window` on activities populated but no guest UI filter. Deferred. | `app/activities/page.tsx` | Medium | 1 May |
| TD-004 | Transfer P2P formula uses hardcoded fallback if DB read fails. Verify never silently used. | `lib/transfers.ts` | Low | 1 May |
| TD-005 | Pre-Sharp activity images have no `image_wide`/`image_square`. Admin shows warning on all 40. Needs one-time re-upload. | Admin activities | Medium | 1 May |
| TD-006 | `image_url` on articles cannot be dropped — `published_articles` view depends on it. Future: update view to use `cover_image` then drop. | `articles` table | Low | 1 May |
| TD-007 | ~~Articles read_time dedup~~ ✅ Resolved | `articles` table | ✅ | 1 May |
| TD-008 | `schema.sql` stale — live DB differs. `vehicle_types` and `rental_extras` have no CREATE TABLE record. Reconcile before external dev onboarding. | `schema.sql` | Medium | 6 May |
| TD-009 | T&Cs across rental categories. Bikes: ✅. Cars/ATVs/Boats: not yet. Needed before public launch. | Rentals guest UI | High | 18 May |
| TD-010 | Events Sharp pipeline not connected. Events use raw upload — `image_wide` always null until re-uploaded. Fix partially applied (display uses image_wide first). | `app/admin/events/` | Medium | 21 May |
| TD-011 | Boat daily experiences: `is_boat_activity` flag + admin toggle built. Guest filter on `/activities?boat=true` not yet implemented. | `app/activities/page.tsx` | Medium | 21 May |
| TD-012 | Rental category mapping: 3 rows had wrong type ('car'). API bug fixed. Data corrected. Monitor. | `public.rentals` | Low | 21 May |

---

## SECTION 2 — PHASE 1 FEATURES

| ID | Feature | Status | Owner |
|----|---------|--------|-------|
| P1-001 | **P2P transfers — pricing validation** | Live. Validate after pilot. | Spyros + Manos |
| P1-002 | **Activity ratings display** (GYG, TripAdvisor) | Not built. Deferred. | CC |
| P1-003 | **Stripe direct payment** | Enquiry-only. Pending IKE registration. | Spyros |
| P1-004 | **Return trip pricing — validation** | Live. Validate after pilot. | Spyros |
| P1-005 | **Full/day driver transfers** | In schema, not in UI. Build after P2P validated. | CC |
| P1-006 | **Post-trip activity rating prompt** | Not built. Needs notification mechanism. | CC |
| P1-007 | **"How much time do you have?" filter** | Data ready. UI deferred. | CC |
| P1-008 | ~~**Rentals full rebuild**~~ ✅ | — | — |
| P1-009 | **Transfers screen UI review** | Phase 0 complete. Template review after pilot. | Manos + CC |
| P1-010 | **WhatsApp Business API automation** | Requires IKE registration. | Spyros |
| P1-011 | **User profile screen** | Exists. Favourites + full history still planned. | CC |
| P1-012 | **Floating UI template review** | Unified pill built. Full template review planned. | Manos |
| P1-013 | **Rentals enquiry — sessionStorage review** | Review after first real user test. | CC |
| P1-014 | **Subcategory admin management** | Hardcoded in UI. DB-driven upgrade post-pilot. | CC |
| P1-015 | ~~**Rentals — ATV, Bike, Boat flows**~~ ✅ All built | — | — |
| P1-016 | ~~**Vacation Essentials enquiry flow**~~ ✅ | — | — |
| P1-017 | **Weather-aware activity indicators** | NOT BUILT. Green/amber/red dot on activity cards. Open-Meteo already wired. Pre-pilot priority. | CC |
| P1-018 | ~~**E-Bikes & Bicycles full flow**~~ ✅ | — | — |
| P1-019 | ~~**Boat rentals full flow**~~ ✅ | — | — |
| P1-020 | **Driver age per vehicle category** | Deferred from search. Needs definition per category. | Spyros |
| P1-021 | **T&Cs across all rental categories** | Bikes ✅. Cars/ATVs/Boats pending. Before launch. | Spyros + CC |
| P1-022 | **Boat daily experiences filter on Activities** | Flag built. Guest filter not implemented yet. | CC |

---

## SECTION 3 — PHASE 2+ FEATURES

| ID | Feature | Phase | Notes |
|----|---------|-------|-------|
| P2-001 | **FlightAware integration** | 2 | Auto-adjust transfer pickup on delays. |
| P2-002 | **WhatsApp Business API — full automation** | 2 | Requires IKE registration. |
| P2-003 | **Surge pricing on transfers** | 2 | Needs real booking volume. |
| P2-004 | **Group transfers (7+ pax)** | 3 | In schema, UI not built. |
| P2-005 | **Transfer provider / driver-facing app** | 3 | Manual WA currently. |
| P2-006 | **B2B API for travel agents** | 3 | Out of scope until volume justifies. |
| P2-007 | **Automated invoicing** | 3 | Out of scope until Stripe live. |
| P2-008 | **Charge-to-Room (PMS)** | 3+ | Requires PMS partner. |
| P2-009 | **OdysseyX integration** | 2+ | Parked. |
| P2-010 | **Marketing landing page (www.islandkey.gr)** | 1/2 | In development separately. |
| P2-011 | **Transfer provider assignment automation** | 3 | Admin built. Wire when provider network confirmed. |
| P2-012 | **Weather-aware WhatsApp briefings** | 2 | Personalised morning WA. Requires WA Business API. |

---

## SECTION 4 — OPEN QUESTIONS

| ID | Question | Blocking? | Owner |
|----|----------|-----------|-------|
| OQ-001 | **IKE registration timeline** — blocks Stripe + WA Business API. | Yes | Spyros |
| OQ-002 | **Transfer net rates** — 15 rates not provided. Prices show NULL. | Yes | Spyros |
| OQ-003 | **Transfer provider names** — 3–4 providers not confirmed. | Partial | Spyros |
| OQ-004 | **Welcome pack contents and supplier** | Partial | Spyros |
| OQ-005 | **UI template review** — Full review planned. Timing not confirmed. | No | Manos |
| OQ-006 | **Pilot property list (final)** — Only Dimitris City Break Apts confirmed. | Partial | Spyros |
| OQ-007 | **Driver age per vehicle category** — Define before ATV/Boat flows finalized. | Partial | Spyros |

---

## CHANGE LOG

| Date | Change | By |
|------|--------|----|
| 1 May 2026 | Document created. | AI Strategy Partner |
| 6 May 2026 | P1-013–017 added. OQ-007 added. P1-008 resolved. | AI Strategy Partner |
| 13 May 2026 | Services built. Activities cleanup. Deals FAB. Vacation Essentials. Rentals pickup/ports. Unified floating UI. | AI Strategy Partner |
| 18 May 2026 | Vehicle category filter, date picker, pickup locations, ATV rename, carousel dynamic. Deals fixed. P1-018–021 added. TD-009 added. | AI Strategy Partner |
| 21 May 2026 | Boat rentals ✅. Admin restructure: sidebar grouped, section images, enquiry badges, All Enquiries, Guests section. Events: date/time fix, auto-expiration, multi-category, Sharp pipeline (TD-010). Providers: bug fixed, Rentals providers added. Rental category mapping fixed (TD-012). Calendar: past dates disabled, localization, nights→days. Accommodation QR-only fix. How It Works redesign. Transfers button + bike submission fixed. P1-015/016/018/019 complete. P1-022 + TD-010/011/012 added. | AI Strategy Partner |

---
*Review at the start of every session. Update when items resolve or new ones arise.*
