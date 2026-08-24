# WabyLoan — Mobile App (Expo)

A simple, easy-to-use mobile companion to the WabyLoan website: check your loan eligibility across
Sri Lanka's leading banks in a few taps. Built with Expo + React Native (plain JavaScript, no
TypeScript, no Zustand/Tailwind — matching the backend's plain-JS style with minimal dependencies).

It talks directly to the same `backend` REST API used by the web app (bearer-token auth, same
endpoints) — no changes to `backend` were needed.

## What it does

- **Check eligibility** — a 5-step wizard (loan type → profile → income → loan details → results)
  mirroring the website's flow, simplified for mobile: big tappable cards instead of dropdowns,
  +/- steppers instead of sliders, and plain manual income entry (no OCR).
- **Guest mode** — anyone can run a check without an account and see the single best offer.
- **Sign up / log in** — unlocks the full ranked list of bank offers and saves applications.
- **My applications** — signed-in users can review past eligibility checks.
- **Request a callback / consultation** — sends a lead to the same `/leads` endpoints the website uses.

## Project layout

```
mobile/
  App.js                     # app entry: providers + navigator
  src/
    api/client.js            # fetch wrapper (bearer token, base URL from env)
    context/AuthContext.js   # login/register/logout, persisted session
    context/WizardContext.js # wizard form state + payload builder matching backend schema
    navigation/RootNavigator.js
    screens/                 # one file per screen (Welcome, Login, Register, Step1-4, Results, MyApplications)
    components/              # small reusable UI pieces (buttons, fields, steppers, picker, cards)
    lib/                     # currency formatting, AsyncStorage session helpers
    theme/colors.js           # shared color palette (matches the website's teal branding)
```

## Setup

```bash
cd mobile
npm install
cp .env.example .env   # then edit EXPO_PUBLIC_API_URL to point at your backend
npm start
```

Then press `a` (Android emulator), `i` (iOS simulator), or scan the QR code with **Expo Go** on
your phone.

### Pointing at the backend

The backend (`../backend`) must be running (`npm run dev` there, default port `4000`). Set
`EXPO_PUBLIC_API_URL` in `mobile/.env` depending on how you're running the app:

| Target                     | EXPO_PUBLIC_API_URL          |
| --------------------------- | ----------------------------- |
| Android emulator             | `http://10.0.2.2:4000`        |
| iOS simulator                | `http://localhost:4000`       |
| Physical phone (Expo Go)     | `http://<your-computer-LAN-IP>:4000` |

Native apps don't send a browser `Origin` header, so the backend's `CORS_ORIGINS` setting doesn't
need to change for this app to work.

## Notes

- No `@wabyloan/engine` dependency — all eligibility math happens server-side; this app only
  builds the request payload and renders the response, exactly like the website does.
- State is kept in two small React Context providers (`AuthContext`, `WizardContext`) instead of a
  library, to keep the dependency list minimal.
