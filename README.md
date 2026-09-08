# Rafe.ph — Business Manager (Demo)

A click-through demo of the Rafe.ph business management MVP: order intake, inventory
(raw materials + finished goods with recipes/BOM), expenses, payroll, a role-aware
dashboard, and reports (P&L, Sales, Inventory, Payroll) with CSV export.

This build is intentionally **database-free** for fast demoing: all data lives in
React state, seeded from realistic sample data in `src/lib/mockData.ts`. Every action
(restocking, producing goods, creating orders, adding expenses, running payroll)
updates that in-memory state immediately, so the UI is fully interactive. Data resets
on a full page reload; only the logged-in session persists (in `localStorage`) so a
refresh mid-demo doesn't log you out.

## Running the demo

```bash
npm install
npm run dev
```

Open http://localhost:3000 — you'll land on the login screen.

**Quick demo login:** click "Owner view" or "Staff view" to sign in instantly, or use
the credentials directly:

| Role  | Email            | Password |
|-------|------------------|----------|
| Owner | owner@rafe.ph    | demo123  |
| Staff | staff@rafe.ph    | demo123  |

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

## Next steps toward a production build

Swap the in-memory store (`src/lib/store.tsx`) for real persistence — Prisma +
SQLite/Postgres per the original spec — and replace the demo login with real
credential-based auth. The data model in `src/lib/types.ts` already mirrors the
target schema, so this is a backing-store swap rather than a UI rewrite.
