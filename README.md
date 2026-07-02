# Outreach Engine — Brandley.ai Take-Home

A minimal influencer outreach MVP: connect a brand's Gmail account, load a
creator list, send a personalized templated email to each creator, and see
what was sent, to whom, and when.

Built with **Next.js 16 (App Router) + TypeScript + Tailwind v4**, the
**Gmail API** for sending, and a small JSON-file data store standing in for
a database (see [WRITEUP.md](./WRITEUP.md) for why, and what changes at scale).

## Quick start (Demo Mode — no Google credentials needed)

```bash
npm install
npm run seed   # loads public/sample-influencers.csv into the creator list
npm run dev
```

Open http://localhost:3000, click **Use Demo Mode** on the dashboard, then
go to **Compose** and send. Demo Mode simulates the Gmail send (including an
occasional simulated bounce — the seeded "Test Bounce" row on purpose, any
`to` address containing "bounce" fails) so the whole flow works end-to-end
with zero setup. This is the documented mocked/sandboxed provider tradeoff
the assignment explicitly allows — see WRITEUP.md.

## Running it with a real Gmail account

1. In the [Google Cloud Console](https://console.cloud.google.com/), create
   a project and enable the **Gmail API** (APIs & Services → Library).
2. APIs & Services → OAuth consent screen: choose **External**, and add your
   own Google account under **Test users** (this lets you use the app
   immediately without Google's review process).
3. APIs & Services → Credentials → **Create credentials → OAuth client ID**
   → Application type **Web application**. Add this Authorized redirect URI:
   ```
   http://localhost:3000/api/auth/google/callback
   ```
4. Copy `.env.example` to `.env.local` and fill in `GOOGLE_CLIENT_ID` and
   `GOOGLE_CLIENT_SECRET` from the credential you just created.
5. `npm run dev`, open the dashboard, and click **Connect Gmail**. You'll be
   sent through Google's consent screen and land back on the dashboard
   connected as your own address.

Sends now go out through the real Gmail API, `From:` the account you
connected. Scope used is `gmail.send` only (least privilege — this app
cannot read your inbox).

## What's in the app

| Page | What it does |
|---|---|
| **Dashboard** (`/`) | Connect/disconnect the sender account (real Gmail OAuth or Demo Mode), quick stats. |
| **Creator list** (`/influencers`) | Upload a CSV (`name, email, niche, followers`) or add creators one at a time. Duplicate emails are skipped. |
| **Compose** (`/compose`) | Write one subject + body template with `{{name}}`, `{{brand}}`, `{{niche}}`, `{{followers}}`, pick recipients, see a live preview, send. |
| **Send log** (`/sends`) | Every send attempt with status (sent/failed), timestamp, and the error message for failures. |

## Project structure

```
src/
  app/
    page.tsx                 dashboard
    influencers/page.tsx      creator list
    compose/page.tsx          compose + send
    sends/page.tsx            tracking log
    api/
      auth/                   OAuth connect/callback/status, demo-mode connect
      influencers/            list/add/upload/delete
      outreach/                send + logs
  components/                 client-side UI (forms, tables, nav)
  lib/
    store.ts                  JSON-file data store (repository interface)
    google.ts                 OAuth2 client factory
    gmail.ts                  MIME building + Gmail API send + mock send
    template.ts                {{variable}} substitution
scripts/seed.ts                loads the sample CSV via `npm run seed`
public/sample-influencers.csv  sample CSV for the upload feature
```

## Deploying (bonus)

The app builds and runs cleanly on Vercel (`vercel deploy`), with one
caveat: Vercel's filesystem is read-only outside `/tmp`, so the JSON data
store falls back to `/tmp/data` automatically when `VERCEL=1` is set (see
`src/lib/store.ts`). That means data is **not durable** between deployments
or cold starts on Vercel — fine for clicking through the UI, not fine as a
permanent home for send history. Set `GOOGLE_CLIENT_ID` /
`GOOGLE_CLIENT_SECRET` / `APP_BASE_URL` (your Vercel URL) as environment
variables and add `<your-domain>/api/auth/google/callback` as an
Authorized redirect URI in the Google Cloud credential to use real Gmail
sending on the deployed instance. See WRITEUP.md for the real fix
(swap the store for Postgres).

## Scripts

```bash
npm run dev      # local dev server
npm run build    # production build
npm run start    # run the production build
npm run lint     # eslint
npm run seed     # load public/sample-influencers.csv into the creator list
```# Outreach-Engine
