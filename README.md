# Island Key — Guest Experience Platform

## Quick Start

### 1. Prerequisites
- Node.js 18+ installed
- A Supabase account (free tier: supabase.com)
- A Stripe account in test mode (stripe.com)

### 2. Setup Supabase
1. Create a new Supabase project
2. Go to SQL Editor
3. Paste the entire contents of `supabase/schema.sql` and run
4. Copy your project URL and anon key from Settings > API

### 3. Setup Project
```bash
cd island-key
cp .env.example .env.local
# Edit .env.local with your Supabase URL, keys, and Stripe test keys
npm install
npm run dev
```

### 4. Open in browser
Visit `http://localhost:3000?tier=M&prop=dimitris-city-break&region=chania`

The URL parameters simulate a QR code scan:
- `tier` = B (Budget) | M (Medium) | P (Premium)
- `prop` = property slug from the properties table
- `region` = chania | rethymno | heraklion | lasithi

### 5. Deploy to Vercel
```bash
npm i -g vercel
vercel
```

## Project Structure
```
island-key/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout + fonts
│   ├── page.tsx            # Entry point (QR param parser)
│   ├── globals.css         # Tailwind + base styles
│   ├── splash/             # Splash screen
│   ├── onboard/            # Onboarding form
│   ├── home/               # Home dashboard
│   ├── activities/         # Activity list + [slug] detail
│   ├── deals/              # Last-minute deals
│   ├── rentals/            # Vehicle & boat rentals
│   ├── transfers/          # Airport/inter-city transfers
│   ├── events/             # Events calendar
│   ├── insights/           # Editorial blog
│   ├── info/               # Useful information
│   └── booking/            # Booking confirmation
├── components/ui/          # Reusable components
│   ├── bottom-nav.tsx      # 6-tab navigation
│   └── components.tsx      # All UI components
├── lib/                    # Utilities
│   ├── supabase.ts         # Supabase client
│   ├── types.ts            # TypeScript types
│   └── utils.ts            # Session, helpers, constants
├── supabase/
│   └── schema.sql          # Complete database schema (paste into Supabase SQL Editor)
├── public/
│   └── manifest.json       # PWA manifest
├── tailwind.config.ts      # Design tokens
├── package.json
└── .env.example
```

## Design Tokens
- **Navy:** #1B2D4F (primary dark)
- **Teal:** #1A8A7D (primary action)
- **Terra:** #D4854A (deals/urgency)
- **Cream:** #FDFCFA (background)
- **Display font:** Fraunces (serif)
- **Body font:** Plus Jakarta Sans (sans-serif)

## Database
12 tables covering: properties, providers, guests, activities, deals, transfers, rentals, events, articles, bookings, info_pages, analytics_events.

Auto-commission calculation on booking insert. Auto-generated confirmation codes (IK-YYYY-NNNN).

See `supabase/schema.sql` for complete schema with seed data.
