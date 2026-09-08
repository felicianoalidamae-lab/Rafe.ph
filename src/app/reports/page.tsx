"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader, Card, Button, Field, inputClass } from "@/components/ui";
import { peso, formatDate, downloadCsv } from "@/lib/format";
import {
  salesInRange,
  expensesInRange,
  expensesByCategory,
  salesByProduct,
  salesBySource,
  inventoryValue,
  lowStockRawMaterials,
  lowStockFinishedGoods,
} from "@/lib/metrics";

type ReportTab = "pnl" | "sales" | "inventory" | "payroll";

const TABS: { key: ReportTab; label: string }[] = [
  { key: "pnl", label: "Profit & Loss" },
  { key: "sales", label: "Sales" },
  { key: "inventory", label: "Inventory" },
  { key: "payroll", label: "Payroll" },
];

function defaultRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 29);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export default function ReportsPage() {
  const [tab, setTab] = useState<ReportTab>("pnl");
  const [{ start, end }, setDateRange] = useState(defaultRange());

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Filter by date range and export any report to CSV."
        action={
          <div className="flex items-end gap-3">
            <Field label="From">
              <input
                type="date"
                className={inputClass}
                value={start}
                onChange={(e) => setDateRange((r) => ({ ...r, start: e.target.value }))}
              />
            </Field>
            <Field label="To">
              <input
                type="date"
                className={inputClass}
                value={end}
                onChange={(e) => setDateRange((r) => ({ ...r, end: e.target.value }))}
              />
            </Field>
          </div>
        }
      />

      <div className="flex gap-1 mb-6 border-b border-black/10">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key ? "border-black text-black" : "border-transparent text-black/40 hover:text-black/70"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "pnl" && <PnlReport start={start} end={end} />}
      {tab === "sales" && <SalesReport start={start} end={end} />}
      {tab === "inventory" && <InventoryReport />}
      {tab === "payroll" && <PayrollReport start={start} end={end} />}
    </div>
  );
}

function PnlReport({ start, end }: { start: string; end: string }) {
  const { orders, expenses } = useStore();
  const sales = salesInRange(orders, start, end);
  const totalExpenses = expensesInRange(expenses, start, end);
  const byCategory = useMemo(() => expensesByCategory(expenses, start, end), [expenses, start, end]);
  const netProfit = sales - totalExpenses;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <div className="text-xs text-black/50">Total Sales</div>
          <div className="text-xl font-semibold mt-1">{peso(sales)}</div>
        </Card>
        <Card>
          <div className="text-xs text-black/50">Total Expenses</div>
          <div className="text-xl font-semibold mt-1">{peso(totalExpenses)}</div>
        </Card>
        <Card>
          <div className="text-xs text-black/50">Net Profit</div>
          <div className={`text-xl font-semibold mt-1 ${netProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {peso(netProfit)}
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium">Expenses by category</div>
          <Button
            variant="secondary"
            onClick={() =>
              downloadCsv(
                `pnl-${start}-to-${end}.csv`,
                byCategory.map((c) => ({ category: c.category, amount: c.amount.toFixed(2) }))
              )
            }
          >
            Export CSV
          </Button>
        </div>
        <table className="w-full text-sm">
          <tbody>
            {byCategory
              .sort((a, b) => b.amount - a.amount)
              .map((c) => (
                <tr key={c.category} className="border-t border-black/5">
                  <td className="py-1.5">{c.category}</td>
                  <td className="py-1.5 text-right font-medium">{peso(c.amount)}</td>
                </tr>
              ))}
            {byCategory.length === 0 && (
              <tr>
                <td className="py-4 text-center text-black/40" colSpan={2}>
                  No expenses in this range.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function SalesReport({ start, end }: { start: string; end: string }) {
  const { orders, products } = useStore();
  const byProduct = useMemo(() => salesByProduct(orders, products, start, end), [orders, products, start, end]);
  const bySource = useMemo(() => salesBySource(orders, start, end), [orders, start, end]);
  const total = byProduct.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-4">
      <Card>
        <div className="text-xs text-black/50">Total sales (all non-cancelled orders in range)</div>
        <div className="text-xl font-semibold mt-1">{peso(total)}</div>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium">By product</div>
            <Button
              variant="secondary"
              onClick={() =>
                downloadCsv(
                  `sales-by-product-${start}-to-${end}.csv`,
                  byProduct.map((p) => ({ product: p.productName, amount: p.amount.toFixed(2) }))
                )
              }
            >
              Export CSV
            </Button>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {byProduct.map((p) => (
                <tr key={p.productId} className="border-t border-black/5">
                  <td className="py-1.5">{p.productName}</td>
                  <td className="py-1.5 text-right font-medium">{peso(p.amount)}</td>
                </tr>
              ))}
              {byProduct.length === 0 && (
                <tr>
                  <td className="py-4 text-center text-black/40" colSpan={2}>
                    No sales in this range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium">By order source</div>
            <Button
              variant="secondary"
              onClick={() =>
                downloadCsv(
                  `sales-by-source-${start}-to-${end}.csv`,
                  bySource.map((s) => ({ source: s.source, amount: s.amount.toFixed(2) }))
                )
              }
            >
              Export CSV
            </Button>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {bySource.map((s) => (
                <tr key={s.source} className="border-t border-black/5">
                  <td className="py-1.5">{s.source}</td>
                  <td className="py-1.5 text-right font-medium">{peso(s.amount)}</td>
                </tr>
              ))}
              {bySource.length === 0 && (
                <tr>
                  <td className="py-4 text-center text-black/40" colSpan={2}>
                    No sales in this range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

function InventoryReport() {
  const { rawMaterials, finishedGoods, products } = useStore();
  const value = inventoryValue(rawMaterials, finishedGoods, products);
  const lowRaw = lowStockRawMaterials(rawMaterials);
  const lowFinished = lowStockFinishedGoods(finishedGoods);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <div className="text-xs text-black/50">Raw material value</div>
          <div className="text-xl font-semibold mt-1">{peso(value.rawValue)}</div>
        </Card>
        <Card>
          <div className="text-xs text-black/50">Finished goods value</div>
          <div className="text-xl font-semibold mt-1">{peso(value.finishedValue)}</div>
        </Card>
        <Card>
          <div className="text-xs text-black/50">Total inventory value</div>
          <div className="text-xl font-semibold mt-1">{peso(value.total)}</div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium">Current stock levels</div>
          <Button
            variant="secondary"
            onClick={() =>
              downloadCsv("inventory-report.csv", [
                ...rawMaterials.map((rm) => ({
                  item: rm.name,
                  type: "Raw material",
                  quantity: rm.quantityOnHand,
                  unit: rm.unit,
                  value: (rm.quantityOnHand * rm.costPerUnit).toFixed(2),
                })),
                ...finishedGoods.map((fg) => ({
                  item: products.find((p) => p.id === fg.productId)?.name ?? fg.productId,
                  type: "Finished good",
                  quantity: fg.quantityOnHand,
                  unit: "pcs",
                  value: (fg.quantityOnHand * (products.find((p) => p.id === fg.productId)?.basePrice ?? 0)).toFixed(2),
                })),
              ])
            }
          >
            Export CSV
          </Button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-black/40">
              <th className="pb-2 font-normal">Item</th>
              <th className="pb-2 font-normal">Type</th>
              <th className="pb-2 font-normal text-right">Qty</th>
              <th className="pb-2 font-normal text-right">Value</th>
            </tr>
          </thead>
          <tbody>
            {rawMaterials.map((rm) => (
              <tr key={rm.id} className="border-t border-black/5">
                <td className="py-1.5">{rm.name}</td>
                <td className="py-1.5 text-black/50">Raw material</td>
                <td className="py-1.5 text-right">
                  {rm.quantityOnHand}
                  {rm.unit}
                </td>
                <td className="py-1.5 text-right">{peso(rm.quantityOnHand * rm.costPerUnit)}</td>
              </tr>
            ))}
            {finishedGoods.map((fg) => {
              const product = products.find((p) => p.id === fg.productId);
              return (
                <tr key={fg.productId} className="border-t border-black/5">
                  <td className="py-1.5">{product?.name ?? fg.productId}</td>
                  <td className="py-1.5 text-black/50">Finished good</td>
                  <td className="py-1.5 text-right">{fg.quantityOnHand} pcs</td>
                  <td className="py-1.5 text-right">{peso(fg.quantityOnHand * (product?.basePrice ?? 0))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <Card>
        <div className="text-sm font-medium mb-3">Low stock ({lowRaw.length + lowFinished.length})</div>
        {lowRaw.length === 0 && lowFinished.length === 0 ? (
          <p className="text-sm text-black/40">Nothing below reorder threshold.</p>
        ) : (
          <ul className="text-sm space-y-1">
            {lowRaw.map((rm) => (
              <li key={rm.id} className="text-red-600">
                {rm.name}: {rm.quantityOnHand}
                {rm.unit} (reorder at {rm.reorderThreshold}
                {rm.unit})
              </li>
            ))}
            {lowFinished.map((fg) => (
              <li key={fg.productId} className="text-red-600">
                {products.find((p) => p.id === fg.productId)?.name}: {fg.quantityOnHand} pcs (reorder at{" "}
                {fg.reorderThreshold} pcs)
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function PayrollReport({ start, end }: { start: string; end: string }) {
  const { staff, payrollRuns } = useStore();
  const inRange = payrollRuns.filter((r) => r.periodStart >= start && r.periodStart <= end);
  const total = inRange.reduce((s, r) => s + r.total, 0);

  return (
    <div className="space-y-4">
      <Card>
        <div className="text-xs text-black/50">Total payroll (runs starting in range)</div>
        <div className="text-xl font-semibold mt-1">{peso(total)}</div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium">Payroll by staff member</div>
          <Button
            variant="secondary"
            onClick={() =>
              downloadCsv(
                `payroll-${start}-to-${end}.csv`,
                inRange.map((r) => ({
                  staff: staff.find((s) => s.id === r.staffId)?.name ?? r.staffId,
                  period: `${r.periodStart} to ${r.periodEnd}`,
                  base: r.baseAmount,
                  bonus: r.bonus,
                  deduction: r.deduction,
                  total: r.total,
                  status: r.paidOn ? `Paid ${r.paidOn}` : "Unpaid",
                }))
              )
            }
          >
            Export CSV
          </Button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-black/40">
              <th className="pb-2 font-normal">Staff</th>
              <th className="pb-2 font-normal">Period</th>
              <th className="pb-2 pr-6 font-normal text-right">Total</th>
              <th className="pb-2 font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {inRange.map((r) => (
              <tr key={r.id} className="border-t border-black/5">
                <td className="py-1.5">{staff.find((s) => s.id === r.staffId)?.name ?? r.staffId}</td>
                <td className="py-1.5 text-black/50">
                  {formatDate(r.periodStart)} – {formatDate(r.periodEnd)}
                </td>
                <td className="py-1.5 pr-6 text-right font-medium">{peso(r.total)}</td>
                <td className="py-1.5">{r.paidOn ? `Paid ${formatDate(r.paidOn)}` : "Unpaid"}</td>
              </tr>
            ))}
            {inRange.length === 0 && (
              <tr>
                <td className="py-4 text-center text-black/40" colSpan={4}>
                  No payroll runs in this range.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
