# Island Key — Project Tracker

---

## SECTION 1 — LEGEND

| Code | Meaning |
|------|---------|
| CC | Code change required |
| DB | Database migration required |
| AI | Admin interface change |
| UX | Guest-facing UX change |

---

## SECTION 2 — PHASE 1 FEATURES

| ID | Title | Notes | Type |
|----|-------|-------|------|
| P1-013 | Rentals enquiry state — sessionStorage vs URL params | Enquiry state is passed via sessionStorage['rental_enquiry'] between /driver and /confirm pages. If this causes issues in testing (state lost on refresh, back navigation), swap to URL query string. Two-file change, ~10 min. Review after first real user test. | CC |
| P1-014 | Subcategory admin management — car classes, activity categories and other subcategories are hardcoded in the UI. Architectural upgrade needed to make them DB-driven and fully admin-manageable without code changes. Review after pilot. | CC |

---

## CHANGE LOG

| Date | Entry | Author |
|------|-------|--------|
| 6 May 2026 | Added P1-013 (sessionStorage review) and P1-014 (subcategory admin management). | AI Strategy Partner |
