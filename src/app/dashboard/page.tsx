"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { PageHeader, KpiCard, Card, Badge } from "@/components/ui";
import { peso, formatDate } from "@/lib/format";
import {
  salesInRange,
  expensesInRange,
  lowStockRawMaterials,
  lowStockFinishedGoods,
  ordersDueSoon,
  salesTrend,
} from "@/lib/metrics";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type RangeKey = "today" | "week" | "month";

function rangeToDates(range: RangeKey, today = new Date()) {
  const end = today.toISOString().slice(0, 10);
  const start = new Date(today);
  if (range === "today") {
    // start === end
  } else if (range === "week") {
    start.setDate(start.getDate() - 6);
  } else {
    start.setDate(start.getDate() - 29);
  }
  return { start: start.toISOString().slice(0, 10), end };
}

export default function DashboardPage() {
  const { user, orders, expenses, rawMaterials, finishedGoods, products } = useStore();
  const [range, setRange] = useState<RangeKey>("week");
  const { start, end } = rangeToDates(range);

  const sales = useMemo(() => salesInRange(orders, start, end), [orders, start, end]);
  const totalExpenses = useMemo(() => expensesInRange(expenses, start, end), [expenses, start, end]);
  const netProfit = sales - totalExpenses;
  const ordersInRange = useMemo(
    () => orders.filter((o) => o.orderDate >= start && o.orderDate <= end),
    [orders, start, end]
  );
  const pendingOrders = useMemo(() => orders.filter((o) => o.status === "Pending"), [orders]);
  const dueSoon = useMemo(() => ordersDueSoon(orders), [orders]);
  const lowRaw = useMemo(() => lowStockRawMaterials(rawMaterials), [rawMaterials]);
  const lowFinished = useMemo(() => lowStockFinishedGoods(finishedGoods), [finishedGoods]);
  const trend = useMemo(() => salesTrend(orders, 14), [orders]);

  const isOwner = user?.role === "owner";

  return (
    <div>
      <PageHeader
        title={`Welcome back${isOwner ? "" : ","} ${user?.name.split(" ")[0] ?? ""}`}
        description={isOwner ? "Here's how the business is doing." : "Here's what needs your attention today."}
        action={
          isOwner && (
            <div className="flex rounded-md border border-black/15 overflow-hidden text-sm">
              {(["today", "week", "month"] as RangeKey[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-3 py-1.5 capitalize ${
                    range === r ? "bg-black text-white" : "bg-white hover:bg-black/5"
                  }`}
                >
                  {r === "week" ? "This week" : r === "month" ? "This month" : "Today"}
                </button>
              ))}
            </div>
          )
        }
      />

      {isOwner ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label="Total Sales" value={peso(sales)} hint={`${ordersInRange.length} orders in range`} />
            <KpiCard label="Total Expenses" value={peso(totalExpenses)} />
            <KpiCard
              label="Net Profit"
              value={peso(netProfit)}
              hint={netProfit >= 0 ? "Profitable" : "Operating at a loss"}
            />
            <KpiCard label="Pending Orders" value={String(pendingOrders.length)} />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <Card className="md:col-span-2">
              <div className="text-sm font-medium mb-3">Sales trend (last 14 days)</div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#171717" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#171717" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#00000010" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d: string) => d.slice(5)}
                      tick={{ fontSize: 11, fill: "#00000066" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis tick={{ fontSize: 11, fill: "#00000066" }} axisLine={false} tickLine={false} width={50} />
                    <Tooltip
                      formatter={(v) => peso(Number(v))}
                      labelFormatter={(d) => formatDate(String(d))}
                      contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    />
                    <Area type="monotone" dataKey="sales" stroke="#171717" fill="url(#salesFill)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <div className="text-sm font-medium mb-3">Low stock alerts</div>
              <LowStockList lowRaw={lowRaw} lowFinished={lowFinished} products={products} />
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <PendingOrdersCard orders={pendingOrders} />
            <DueSoonCard orders={dueSoon} />
          </div>
        </>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          <PendingOrdersCard orders={pendingOrders} />
          <DueSoonCard orders={dueSoon} />
          <Card>
            <div className="text-sm font-medium mb-3">Low stock alerts</div>
            <LowStockList lowRaw={lowRaw} lowFinished={lowFinished} products={products} />
          </Card>
        </div>
      )}
    </div>
  );
}

function PendingOrdersCard({ orders }: { orders: import("@/lib/types").Order[] }) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-medium">Pending orders ({orders.length})</div>
        <Link href="/orders" className="text-xs text-black/50 hover:text-black">
          View all →
        </Link>
      </div>
      {orders.length === 0 ? (
        <p className="text-sm text-black/40">No pending orders. 🎉</p>
      ) : (
        <ul className="space-y-2">
          {orders.slice(0, 5).map((o) => (
            <li key={o.id} className="flex items-center justify-between text-sm">
              <span>{o.customerName}</span>
              <span className="text-black/40 text-xs">{formatDate(o.dueDate)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function DueSoonCard({ orders }: { orders: import("@/lib/types").Order[] }) {
  return (
    <Card>
      <div className="text-sm font-medium mb-3">Due within 3 days ({orders.length})</div>
      {orders.length === 0 ? (
        <p className="text-sm text-black/40">Nothing due soon.</p>
      ) : (
        <ul className="space-y-2">
          {orders.map((o) => (
            <li key={o.id} className="flex items-center justify-between text-sm">
              <span>
                {o.customerName} <Badge text={o.status} />
              </span>
              <span className="text-black/40 text-xs">{formatDate(o.dueDate)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function LowStockList({
  lowRaw,
  lowFinished,
  products,
}: {
  lowRaw: import("@/lib/types").RawMaterial[];
  lowFinished: import("@/lib/types").FinishedGood[];
  products: import("@/lib/types").Product[];
}) {
  if (lowRaw.length === 0 && lowFinished.length === 0) {
    return <p className="text-sm text-black/40">All stock levels healthy.</p>;
  }
  return (
    <ul className="space-y-2 text-sm">
      {lowRaw.map((rm) => (
        <li key={rm.id} className="flex items-center justify-between">
          <span>{rm.name}</span>
          <span className="text-red-600 font-medium text-xs">
            {rm.quantityOnHand}
            {rm.unit} left
          </span>
        </li>
      ))}
      {lowFinished.map((fg) => (
        <li key={fg.productId} className="flex items-center justify-between">
          <span>{products.find((p) => p.id === fg.productId)?.name ?? fg.productId}</span>
          <span className="text-red-600 font-medium text-xs">{fg.quantityOnHand} pcs left</span>
        </li>
      ))}
    </ul>
  );
}
