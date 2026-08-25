# Waby Loan | WABYBIX AI

AI-assisted loan eligibility and bank comparison platform for the Sri Lankan lending market. Built from the SRS and validated prototype in `d:\ChormeDownloads\`.

## Structure

```
packages/engine/   @wabyloan/engine — shared TypeScript calculation engine (EMI, ranking, dual-scheme logic)
backend/            Express + PostgreSQL (Prisma) API — the one shared backend for web AND the future mobile app
frontend/            Next.js web app — public 5-step wizard + the web-only Admin Console
mobile/              Not yet built (planned follow-up phase, reuses the same engine + API)
```

`frontend` has no direct database access — every request goes through `backend`'s REST API, exactly like the future mobile app will. The Admin Console (`/admin`, web-only) manages data that both web and mobile consume through that same API.

## Prerequisites

- Node.js 20+
- A local PostgreSQL server with a database named `WabyLoan`

## First-time setup

```bash
npm install

# Backend: point at your local Postgres, then migrate + seed
cp backend/.env.example backend/.env   # edit DATABASE_URL if your user/password differ
npm run db:migrate        # creates tables in the WabyLoan database
npm run db:seed           # loads the prototype's default banks/occupations/settings + a seeded admin user

# Frontend: point at the backend
cp frontend/.env.local.example frontend/.env.local
```

Seeding prints a default admin login (`admin@wabyloan.local` / a generated password shown in the console) — change that password after first login. Override it up front with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` env vars before seeding.

## Running locally

```bash
npm run dev:backend    # http://localhost:4000
npm run dev:frontend    # http://localhost:3000
```

Visit `http://localhost:3000` for the public wizard, `http://localhost:3000/admin` for the Admin Console (requires an admin-role account).

## Deploying the frontend to Vercel

`frontend` depends on the shared `@wabyloan/engine` workspace package, whose compiled `dist/` is git-ignored (built via `npm run build:engine`, not committed). A plain `next build` in an isolated `frontend` checkout won't find it, so `frontend/vercel.json` builds the engine first:

```json
{
  "installCommand": "cd .. && npm install",
  "buildCommand": "cd .. && npm run build:engine && cd frontend && npm run build"
}
```

In the Vercel project settings:

1. **Root Directory**: `frontend`
2. **Framework Preset**: Next.js (install/build commands above override the defaults automatically via `vercel.json`)
3. **Environment Variables**: set `API_BASE_URL` and `NEXT_PUBLIC_API_BASE_URL` to your deployed backend's URL (see `frontend/.env.local.example`) — `backend` itself is an Express + PostgreSQL API and needs to be hosted separately (e.g. Render, Railway, Fly.io), not on Vercel.

## Testing

```bash
npm run test:engine    # vitest — ranking order, rounding edge case, dual-scheme gating asymmetry, hard gates
```

## What's stubbed / deferred

- **Mobile app (Expo)** — not built yet; `backend` and `@wabyloan/engine` are designed to support it without changes.
- **Google/Facebook OAuth** — code paths exist in `backend/src/auth`, but need real client credentials in `backend/.env` (`GOOGLE_CLIENT_ID` etc.) to actually authenticate. Email/password auth works out of the box.
- **OCR** — `backend/src/services/ocrService.js` ships a mock provider (simulated payslip extraction, matching the prototype). Swap in a real provider (AWS Textract / Google Document AI) behind the same interface; the zero-retention rule (image never written to disk) is already enforced in the upload route.
- **Sinhala/Tamil translations** (`frontend/src/lib/i18n/{si,ta}.json`) — ported from the prototype baseline; flagged in the SRS for native-speaker review before production.

## Notes

- The single most important business rule — rank by **Total Cost of Credit** (Total Interest + Document Charges), not principal or headline rate — lives in `packages/engine/src/eligibility.ts` and is covered by regression tests in `packages/engine/src/__tests__/eligibility.test.ts`.
- Guest-mode restriction (SRS §6.2) is enforced **server-side**: `POST /eligibility/evaluate` only returns the single top-ranked result to an unauthenticated caller — the full result set never reaches the browser for a guest.
- Every Admin Console mutation is written to the `audit_log` table (`backend/src/services/auditService.js`).
