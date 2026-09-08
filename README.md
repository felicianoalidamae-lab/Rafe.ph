# Rafe.ph — Business Manager

A working build of the Rafe.ph business management MVP: order intake, inventory
(raw materials + finished goods with recipes/BOM), expenses, payroll, a role-aware
dashboard, and reports (P&L, Sales, Inventory, Payroll) with CSV export.

Data is persisted in **Supabase (Postgres)**. The browser never talks to Supabase
directly — every read/write goes through Next.js Server Actions (`src/lib/actions.ts`)
using the Supabase **service_role** key, which is only ever read server-side. Row Level
Security is enabled on every table with no policies, so even if the anon/publishable
key ever leaked, it would have zero access via Supabase's REST API.

Login is still a simple app-level demo login (not Supabase Auth) — see "Known
limitations" below.

## One-time Supabase setup

1. Open your Supabase project → **SQL Editor** → New query.
2. Paste the contents of [`supabase/schema.sql`](./supabase/schema.sql) and run it.
   This creates all tables, enables RLS, and seeds realistic demo data. Safe to
   re-run — it drops and recreates the app's tables each time.

## Running locally

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase project's URL + service_role key
npm run dev
```

Open http://localhost:3000 — you'll land on the login screen.

**Quick demo login:** click "Owner view" or "Staff view" to sign in instantly, or use
the credentials directly:

| Role  | Email            | Password |
|-------|------------------|----------|
| Owner | owner@rafe.ph    | demo123  |
| Staff | staff@rafe.ph    | demo123  |

## Deploying to Vercel

1. Import this GitHub repo into Vercel (no build config needed — it's a stock
   Next.js app).
2. In the Vercel project's **Settings → Environment Variables**, add:
   - `SUPABASE_URL` — your project's URL (e.g. `https://xxxxx.supabase.co`)
   - `SUPABASE_SERVICE_ROLE_KEY` — your project's service_role key (Settings → API)
3. Deploy. Make sure you've already run `supabase/schema.sql` (see above) — the app
   will show a clear error banner on any page if the tables aren't there yet.

## What to show

- **Dashboard** — role-aware. Owner sees sales/expenses/profit KPIs, a 14-day sales
  trend chart, and low-stock/pending-order alerts, with a Today/Week/Month toggle.
  Staff sees only pending orders, due-soon orders, and low-stock alerts — no money.
- **Products & Recipes** — product catalog with each item's bill of materials (BOM).
- **Inventory** — raw materials and finished goods, low-stock indicators, Restock /
  Produce (auto-deducts BOM materials) / Adjust actions, and a full movement log.
- **Orders** — filterable/searchable list, new-order form with multiple line items,
  status flow (Pending → In Production → Ready → Completed/Delivered/Cancelled) and
  payment tracking. Completing/delivering an order deducts finished-goods stock.
- **Expenses** (owner only) — categorized expense log with filters; restocking can
  auto-log a linked Materials expense.
- **Payroll** (owner only) — staff records, payroll runs, mark-as-paid (which feeds
  an automatic Payroll expense entry), and per-staff history.
- **Reports** (owner only) — P&L, Sales (by product/source), Inventory value, and
  Payroll, each filterable by date range and exportable to CSV.

## Known limitations / next steps

- **Auth is still app-level, not Supabase Auth.** The two demo accounts are
  hardcoded in `src/lib/store.tsx`. Moving to real per-user login (Supabase Auth +
  a `profiles` table with a `role` column, enforced via RLS `auth.uid()` checks)
  is the natural next step before this handles real customer/financial data.
- **Multi-step actions aren't atomic.** e.g. producing goods deducts several raw
  materials and inserts several movement rows as separate sequential calls, not a
  single database transaction. Fine for a single-user demo; worth wrapping in a
  Postgres function (`rpc`) before real concurrent use.
- `src/lib/types.ts` is the source of truth for the data shape — it mirrors
  `supabase/schema.sql` column-for-column (camelCase in the app, snake_case in the DB).
