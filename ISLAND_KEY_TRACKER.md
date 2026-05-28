# ISLAND KEY — PROJECT TRACKER
## Living document · Updated 23 May 2026
### Maintained by: AI Strategy Partner (Locus / Manos + Spyros)

---

## SECTION 1 — TECH DEBT

| ID | Item | Where | Priority | Added |
|----|------|--------|----------|-------|
| TD-001 | ~~Admin login shell + React #300~~ ✅ | — | ✅ | 1 May |
| TD-002 | All images use `<img>` not Next.js `<Image>`. No automatic optimisation beyond Sharp. | All image components | Low | 1 May |
| TD-003 | `time_window` on activities populated but no guest UI filter. Deferred. | `app/activities/page.tsx` | Medium | 1 May |
| TD-004 | Transfer P2P formula uses hardcoded fallback if DB read fails. Verify never silently used. | `lib/transfers.ts` | Low | 1 May |
| TD-005 | Pre-Sharp activity images have no `image_wide`/`image_square`. Needs one-time re-upload. | Admin activities | Medium | 1 May |
| TD-006 | `image_url` on articles cannot be dropped — `published_articles` view depends on it. | `articles` table | Low | 1 May |
| TD-007 | ~~Articles read_time dedup~~ ✅ | — | ✅ | 1 May |
| TD-008 | `schema.sql` stale — live DB differs. Reconcile before external dev onboarding. | `schema.sql` | Medium | 6 May |
| TD-009 | T&Cs across rental categories. Bikes ✅. Cars/ATVs/Boats pending. Before launch. | Rentals guest UI | High | 18 May |
| TD-010 | ~~Events Sharp pipeline~~ ✅ Fixed — upload generates wide/square, re-crops on focal point save | — | ✅ | 21 May |
| TD-011 | ~~Boat daily experiences filter~~ ✅ Fixed — navigates to /activities?category=boat_trips | — | ✅ | 21 May |
| TD-012 | ~~Rental category mapping~~ ✅ Fixed — 3 DB rows corrected, API hardcode removed | — | ✅ | 21 May |

---

## SECTION 2 — PHASE 1 FEATURES

| ID | Feature | Status | Owner |
|----|---------|--------|-------|
| P1-001 | **P2P transfers — pricing validation** | Live. Validate after pilot. | Spyros + Manos |
| P1-002 | **Activity ratings display** (GYG, TripAdvisor) | Not built. Deferred. | CC |
| P1-003 | **Stripe direct payment** | Enquiry-only. Pending IKE registration. | Spyros |
| P1-004 | **Return trip pricing** | ✅ Fixed — correct (base×2)×(1-pct/100) formula | — |
| P1-005 | **Full/day driver transfers** | In schema, not in UI. Build after P2P validated. | CC |
| P1-006 | **Post-trip activity rating prompt** | Not built. Needs notification mechanism. | CC |
| P1-007 | **"How much time do you have?" filter** | Data ready. UI deferred. | CC |
| P1-008 | ~~**Rentals full rebuild**~~ ✅ | — | — |
| P1-009 | **Transfers screen UI review** | Phase 0 complete. Template review after pilot. | Manos + CC |
| P1-010 | **WhatsApp Business API automation** | Requires IKE registration. | Spyros |
| P1-011 | **User profile screen** | ✅ Live with bookings, favourites, Change My Stay (Places API) | — |
| P1-012 | **Floating UI template review** | Unified pill built. Full template review planned. | Manos |
| P1-013 | **Rentals enquiry — sessionStorage review** | Review after first real user test. | CC |
| P1-014 | **Subcategory admin management** | Hardcoded in UI. DB-driven upgrade post-pilot. | CC |
| P1-015 | ~~**Rentals — ATV, Bike, Boat flows**~~ ✅ | — | — |
| P1-016 | ~~**Vacation Essentials enquiry flow**~~ ✅ | — | — |
| P1-017 | ~~**Weather-aware activity indicators**~~ ✅ Green/amber/red dot on cards + detail warning bar | — | — |
| P1-018 | ~~**E-Bikes & Bicycles full flow**~~ ✅ | — | — |
| P1-019 | ~~**Boat rentals full flow**~~ ✅ | — | — |
| P1-020 | **Driver age per vehicle category** | Deferred. Needs definition per category. | Spyros |
| P1-021 | **T&Cs across all rental categories** | Bikes ✅. Cars/ATVs/Boats pending. Before launch. | Spyros + CC |
| P1-022 | ~~**Boat daily experiences → Boat Trips filter**~~ ✅ | — | — |
| P1-023 | ~~**Weather admin alert cron**~~ ✅ Daily 09:00 Chania time, email to Spyros with affected bookings | — | — |
| P1-024 | ~~**Global search**~~ ✅ Full-screen overlay, grouped results, popular chips | — | — |
| P1-025 | ~~**Mood assignment in admin**~~ ✅ Chip grid on activity form, saves to mood_tags[] | — | — |
| P1-026 | ~~**Notifications foundation**~~ ✅ Tables, guest centre, bell icon, admin CRUD, batch mark-as-read | — | — |
| P1-027 | ~~**Notify guests toggle**~~ ✅ On all 8 content types (activities, services, deals, events, 4 rental types) | — | — |
| P1-028 | ~~**Weather-driven toggle**~~ ✅ Activities marked as indoor are exempt from weather alerts | — | — |
| P1-029 | ~~**Home screen redesign**~~ ✅ Deals hero banner + countdown, search bar, section reorder, nav restructure | — | — |
| P1-030 | ~~**Localize services category**~~ ✅ 4 subcategories, landing card, admin support | — | — |
| P1-031 | ~~**ATV extras system**~~ ✅ atv_rental_extras table, admin tab, wired into booking flow | — | — |
| P1-032 | ~~**Profile Places API (Change My Stay)**~~ ✅ AccommodationInput with autocomplete, saves 5 fields to DB + session | — | — |
| P1-033 | ~~**Marketing landing page**~~ ✅ 31 files, 1809 lines. Gated pass request model. Partner enquiry form. | — | — |

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
| P2-010 | ~~**Marketing landing page**~~ ✅ Built. Awaiting domain, real content, Vercel deploy. | 1 | — |
| P2-011 | **Transfer provider assignment automation** | 3 | Admin built. Wire when provider network confirmed. |
| P2-012 | **Weather-aware WhatsApp briefings** | 2 | Personalised morning WA. Requires WA Business API. |
| P2-013 | **Location-based "Near Me" recommendations** | 2 | Foundation built (lat/lng/place_id on guests table). Build when pilot data available. |

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
| OQ-008 | **Marketing site launch** — Content (testimonials, photos, stats), domain DNS, Vercel project. | Partial | Spyros |

---

## CHANGE LOG

| Date | Change | By |
|------|--------|----|
| 1 May 2026 | Document created. | AI Strategy Partner |
| 6 May 2026 | P1-013–017 added. OQ-007 added. P1-008 resolved. | AI Strategy Partner |
| 13 May 2026 | Services built. Activities cleanup. Deals FAB. Vacation Essentials. | AI Strategy Partner |
| 18 May 2026 | Vehicle category filter, date picker, ATV rename, carousel dynamic. P1-018–021 added. | AI Strategy Partner |
| 21 May 2026 | Boat rentals ✅. Admin restructure. Events fixes. Providers fixes. Rental category mapping fixed. Calendar fixes. Accommodation QR-only fix. How It Works redesign. | AI Strategy Partner |
| 23 May 2026 | Weather cron ✅. Global search ✅. Mood assignment ✅. Notifications foundation ✅. Notify guests toggle ✅. Weather-driven toggle ✅. Home redesign ✅. Localize category ✅. ATV extras ✅. Profile Places API ✅. Marketing landing page ✅ (brief v2 + build). Boat Trips category ✅. Return trip pricing fix ✅. ATV booking flow fix ✅. Services cleanup (filter removal, Localize, rename, hero banner). P1-023–033 added. P2-013 added. OQ-008 added. TD-010/011/012 resolved. | AI Strategy Partner |

---
*Review at the start of every session. Update when items resolve or new ones arise.*
