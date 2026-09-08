-- Rafe.ph business manager - schema + seed data
-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New query -> paste -> Run).
-- Safe to re-run: it drops and recreates the app's tables only.

drop table if exists payroll_runs cascade;
drop table if exists staff cascade;
drop table if exists expenses cascade;
drop table if exists inventory_movements cascade;
drop table if exists order_items cascade;
drop table if exists orders cascade;
drop table if exists finished_goods cascade;
drop table if exists recipe_items cascade;
drop table if exists raw_materials cascade;
drop table if exists products cascade;

create table products (
  id text primary key,
  name text not null,
  category text not null check (category in ('Candle', 'Plaster Vessel', 'Plaster Figure')),
  sku text not null,
  base_price numeric(10, 2) not null check (base_price >= 0),
  is_active boolean not null default true,
  notes text
);

create table raw_materials (
  id text primary key,
  name text not null,
  unit text not null,
  quantity_on_hand numeric(12, 2) not null default 0,
  reorder_threshold numeric(12, 2) not null default 0,
  cost_per_unit numeric(10, 2) not null default 0,
  supplier text
);

create table recipe_items (
  product_id text not null references products (id) on delete cascade,
  raw_material_id text not null references raw_materials (id) on delete cascade,
  quantity_per_unit numeric(12, 2) not null check (quantity_per_unit > 0),
  primary key (product_id, raw_material_id)
);

create table finished_goods (
  product_id text primary key references products (id) on delete cascade,
  quantity_on_hand numeric(12, 2) not null default 0,
  reorder_threshold numeric(12, 2) not null default 0
);

create table orders (
  id text primary key,
  customer_name text not null,
  contact text,
  source text not null,
  order_date date not null,
  due_date date not null,
  status text not null check (
    status in ('Pending', 'In Production', 'Ready', 'Completed', 'Delivered', 'Cancelled')
  ),
  payment_status text not null check (payment_status in ('Unpaid', 'Partially Paid', 'Paid')),
  amount_paid numeric(10, 2) not null default 0,
  payment_method text not null check (payment_method in ('Cash', 'GCash', 'Bank Transfer', 'Other')),
  created_by text not null,
  created_at timestamptz not null default now()
);

create table order_items (
  id text primary key,
  order_id text not null references orders (id) on delete cascade,
  product_id text not null references products (id),
  quantity numeric(10, 2) not null check (quantity > 0),
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  customization_notes text
);

create table inventory_movements (
  id text primary key,
  item_type text not null check (item_type in ('raw_material', 'finished_good')),
  item_id text not null,
  direction text not null check (direction in ('in', 'out')),
  quantity numeric(12, 2) not null,
  reason text not null,
  related_order_id text references orders (id) on delete set null,
  created_by text not null,
  created_at timestamptz not null default now()
);

create table expenses (
  id text primary key,
  date date not null,
  category text not null check (
    category in (
      'Materials', 'Packaging', 'Shipping', 'Rent', 'Utilities',
      'Marketing', 'Tools/Equipment', 'Payroll', 'Other'
    )
  ),
  amount numeric(10, 2) not null check (amount >= 0),
  description text not null,
  supplier text,
  linked_restock_id text references inventory_movements (id) on delete set null
);

create table staff (
  id text primary key,
  name text not null,
  position text not null,
  pay_type text not null check (pay_type in ('Fixed Salary', 'Hourly', 'Per-piece')),
  rate numeric(10, 2) not null check (rate >= 0),
  active boolean not null default true
);

create table payroll_runs (
  id text primary key,
  staff_id text not null references staff (id) on delete cascade,
  period_start date not null,
  period_end date not null,
  base_amount numeric(10, 2) not null default 0,
  bonus numeric(10, 2) not null default 0,
  deduction numeric(10, 2) not null default 0,
  total numeric(10, 2) not null default 0,
  paid_on date
);

-- Row Level Security: enabled with no policies on every table.
-- This app never talks to Supabase from the browser - all reads/writes go through
-- Next.js Server Actions using the service_role key, which bypasses RLS by design.
-- With RLS on and no policies, the anon/publishable key (if it ever leaked) gets
-- zero access to this data via the REST API.
alter table products enable row level security;
alter table raw_materials enable row level security;
alter table recipe_items enable row level security;
alter table finished_goods enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table inventory_movements enable row level security;
alter table expenses enable row level security;
alter table staff enable row level security;
alter table payroll_runs enable row level security;

-- Seed data (mirrors the original in-memory demo data, anchored to 2026-09-08)

insert into products (id, name, category, sku, base_price, is_active, notes) values
  ('p1', 'Candle - Medium Jar', 'Candle', 'CND-MED-001', 350, true, 'Scent & color customizable'),
  ('p2', 'Candle - Small Tin', 'Candle', 'CND-TIN-002', 180, true, null),
  ('p3', 'Plaster Vessel - Round Bowl', 'Plaster Vessel', 'PVS-BWL-001', 420, true, null),
  ('p4', 'Plaster Figure - Cat', 'Plaster Figure', 'PFG-CAT-001', 250, true, 'Engraving/name available'),
  ('p5', 'Plaster Figure - Angel', 'Plaster Figure', 'PFG-ANG-001', 300, false, 'Seasonal item');

insert into raw_materials (id, name, unit, quantity_on_hand, reorder_threshold, cost_per_unit, supplier) values
  ('rm1', 'Soy Wax', 'g', 8000, 2000, 0.35, 'WaxCo PH'),
  ('rm2', 'Cotton Wick', 'pc', 120, 40, 6, 'WaxCo PH'),
  ('rm3', 'Fragrance Oil', 'ml', 900, 300, 2.5, 'Scent Supply Co'),
  ('rm4', 'Glass Jar (Medium)', 'pc', 60, 20, 25, 'PackRight'),
  ('rm5', 'Tin Container', 'pc', 15, 25, 15, 'PackRight'),
  ('rm6', 'Plaster of Paris', 'g', 15000, 4000, 0.08, 'CraftMix Supplies'),
  ('rm7', 'Mold - Round Bowl', 'use', 500, 50, 0.5, 'CraftMix Supplies'),
  ('rm8', 'Mold - Cat Figure', 'use', 500, 50, 0.3, 'CraftMix Supplies'),
  ('rm9', 'Acrylic Paint (assorted)', 'ml', 400, 200, 1.2, 'ArtHub'),
  ('rm10', 'Packaging Box (small)', 'pc', 8, 30, 12, 'PackRight');

insert into recipe_items (product_id, raw_material_id, quantity_per_unit) values
  ('p1', 'rm1', 200), ('p1', 'rm2', 1), ('p1', 'rm3', 10), ('p1', 'rm4', 1),
  ('p2', 'rm1', 90), ('p2', 'rm2', 1), ('p2', 'rm3', 4), ('p2', 'rm5', 1),
  ('p3', 'rm6', 600), ('p3', 'rm7', 1), ('p3', 'rm9', 5),
  ('p4', 'rm6', 250), ('p4', 'rm8', 1), ('p4', 'rm9', 8);
  -- p5 intentionally has no recipe (seasonal/deferred item)

insert into finished_goods (product_id, quantity_on_hand, reorder_threshold) values
  ('p1', 18, 10), ('p2', 32, 15), ('p3', 6, 8), ('p4', 14, 10), ('p5', 0, 5);

insert into orders (id, customer_name, contact, source, order_date, due_date, status, payment_status, amount_paid, payment_method, created_by) values
  ('o1001', 'Mika Reyes', '0917 123 4567', 'Instagram', '2026-09-02', '2026-09-07', 'Delivered', 'Paid', 700, 'GCash', 'Staff - Ana'),
  ('o1002', 'Carlo Santos', '0918 555 2211', 'Facebook', '2026-09-03', '2026-09-08', 'Ready', 'Partially Paid', 200, 'Cash', 'Staff - Jun'),
  ('o1003', 'Bea Lopez', 'bea.lopez@email.com', 'Shopee', '2026-09-05', '2026-09-10', 'In Production', 'Paid', 360, 'Bank Transfer', 'Staff - Ana'),
  ('o1004', 'Walk-in Customer', null, 'Walk-in', '2026-09-07', '2026-09-08', 'Pending', 'Unpaid', 0, 'Cash', 'Staff - Jun'),
  ('o1005', 'Trisha Uy', '0920 888 4433', 'Instagram', '2026-08-29', '2026-09-04', 'Completed', 'Paid', 1050, 'GCash', 'Owner'),
  ('o1006', 'Noel Garcia', null, 'Shopee', '2026-08-24', '2026-08-30', 'Cancelled', 'Unpaid', 0, 'Other', 'Staff - Ana'),
  ('o1007', 'Grace Fernandez', '0917 222 9090', 'Facebook', '2026-08-19', '2026-08-25', 'Delivered', 'Paid', 600, 'Cash', 'Staff - Jun');

insert into order_items (id, order_id, product_id, quantity, unit_price, customization_notes) values
  ('oi1', 'o1001', 'p1', 2, 350, 'Lavender scent'),
  ('oi2', 'o1002', 'p3', 1, 420, null),
  ('oi3', 'o1002', 'p4', 1, 250, 'Engrave ''Milo'''),
  ('oi4', 'o1003', 'p2', 2, 180, null),
  ('oi5', 'o1004', 'p4', 3, 250, null),
  ('oi6', 'o1005', 'p1', 3, 350, null),
  ('oi7', 'o1006', 'p3', 1, 420, null),
  ('oi8', 'o1007', 'p2', 2, 180, null),
  ('oi9', 'o1007', 'p4', 1, 250, null);

insert into inventory_movements (id, item_type, item_id, direction, quantity, reason, related_order_id, created_by, created_at) values
  ('im1', 'raw_material', 'rm1', 'in', 5000, 'Restock from WaxCo PH', null, 'Owner', '2026-08-20T09:00:00Z'),
  ('im2', 'finished_good', 'p1', 'in', 20, 'Production run', null, 'Staff - Ana', '2026-08-22T14:00:00Z'),
  ('im3', 'finished_good', 'p1', 'out', 2, 'Breakage during packing', null, 'Staff - Ana', '2026-08-25T11:30:00Z'),
  ('im4', 'raw_material', 'rm5', 'out', 10, 'Production use - Candle Small Tin', null, 'Staff - Jun', '2026-09-01T10:15:00Z');

insert into expenses (id, date, category, amount, description, supplier, linked_restock_id) values
  ('e1', '2026-08-20', 'Materials', 1750, 'Soy wax + wicks restock', 'WaxCo PH', 'im1'),
  ('e2', '2026-08-22', 'Packaging', 960, 'Packaging boxes (80 pcs)', 'PackRight', null),
  ('e3', '2026-08-25', 'Rent', 8000, 'Shop space rent - September', null, null),
  ('e4', '2026-08-27', 'Utilities', 1450, 'Electricity bill', null, null),
  ('e5', '2026-08-30', 'Marketing', 500, 'Instagram ad boost', null, null),
  ('e6', '2026-09-02', 'Shipping', 320, 'Courier fees for Shopee orders', null, null),
  ('e7', '2026-09-05', 'Tools/Equipment', 2200, 'New silicone molds', null, null);

insert into staff (id, name, position, pay_type, rate, active) values
  ('s1', 'Ana Dizon', 'Production Helper', 'Fixed Salary', 9000, true),
  ('s2', 'Jun Villareal', 'Packing & Orders', 'Hourly', 65, true),
  ('s3', 'Mel Torres', 'Freelance Painter', 'Per-piece', 15, true);

insert into payroll_runs (id, staff_id, period_start, period_end, base_amount, bonus, deduction, total, paid_on) values
  ('pr1', 's1', '2026-08-16', '2026-08-30', 4500, 0, 0, 4500, '2026-08-31'),
  ('pr2', 's2', '2026-08-16', '2026-08-30', 5200, 300, 0, 5500, '2026-08-31'),
  ('pr3', 's3', '2026-08-16', '2026-08-30', 1800, 0, 100, 1700, '2026-08-31'),
  ('pr4', 's1', '2026-08-31', '2026-09-14', 4500, 0, 0, 4500, null),
  ('pr5', 's2', '2026-08-31', '2026-09-14', 4800, 0, 0, 4800, null);
