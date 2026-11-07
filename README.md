# Stayro Owner Portal (Phase 1)

Owner-facing portal for [Stayro](https://stayro.com/) — list units, upload photos, manage payouts (IBAN), and admin approval. Built with **Next.js 15**, **MongoDB / Mongoose**, **Auth.js**, and **next-intl** (Arabic RTL default + English).

## Features

- Owner registration / login (email + password), email verification & password reset
- Multi-step Airbnb-style unit wizard (type, map location, details, amenities, photos, pricing, rules)
- Photos stored in **MongoDB GridFS** (resized with `sharp`)
- Availability calendar (block / unblock dates)
- Payouts: Saudi IBAN methods, earnings ledger, payout requests via **mock gateway** (`PAYOUT_PROVIDER`)
- Owner profile & ID verification
- Admin panel: approve/reject units & owners, add earnings, process payouts
- Stayro brand identity (Tajawal, orange primary, license footer)

## Prerequisites

- Node.js 20+
- MongoDB running locally (or a connection string)

```bash
# macOS with Homebrew
brew services start mongodb-community
```

## Setup

```bash
cp .env.example .env.local
npm install
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/ar`.

### Seed accounts

| Role  | Email              | Password       |
|-------|--------------------|----------------|
| Admin | admin@stayro.com   | Password123!   |
| Owner | owner@stayro.com   | Password123!   |
| Owner | host@stayro.com    | Password123!   |

`npm run seed` creates **8 sample units** across statuses (`published`, `pending_review`, `draft`, `rejected`, `unlisted`) with GridFS cover photos, payout methods, and earnings.

## Scripts

| Command        | Description                |
|----------------|----------------------------|
| `npm run dev`  | Development server         |
| `npm run build`| Production build           |
| `npm run start`| Start production server    |
| `npm run seed` | Reset DB and seed sample data |
| `npm run lint` | ESLint                     |

## Project structure

```
src/
  app/[locale]/          # Public, dashboard, admin pages
  app/api/               # Auth, photo stream, photo upload
  components/            # UI, layout, wizard, payouts, admin
  lib/                   # db, auth, gridfs, payouts, actions
  models/                # Mongoose models
  messages/              # ar.json / en.json
```

## Payments

Payouts use a provider interface (`src/lib/payouts`). Phase 1 ships with `mock`. Set `PAYOUT_PROVIDER=mock` and swap in Moyasar/Tap/HyperPay later without changing UI code.

## License note

Footer displays Ministry of Tourism license **73104535** to match stayro.com.
# stayroWeb
