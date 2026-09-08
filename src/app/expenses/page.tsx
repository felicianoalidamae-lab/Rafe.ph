"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader, Card, Button, Modal, Field, inputClass } from "@/components/ui";
import { peso, formatDate } from "@/lib/format";
import { reportError } from "@/lib/errors";
import type { ExpenseCategory } from "@/lib/types";

const CATEGORIES: ExpenseCategory[] = [
  "Materials",
  "Packaging",
  "Shipping",
  "Rent",
  "Utilities",
  "Marketing",
  "Tools/Equipment",
  "Payroll",
  "Other",
];

export default function ExpensesPage() {
  const { expenses, addExpense } = useStore();
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const filtered = useMemo(() => {
    return expenses
      .filter((e) => categoryFilter === "All" || e.category === categoryFilter)
      .filter((e) => !start || e.date >= start)
      .filter((e) => !end || e.date <= end)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [expenses, categoryFilter, start, end]);

  const total = filtered.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div>
      <PageHeader
        title="Expenses"
        description={`${peso(total)} across ${filtered.length} entries`}
        action={<Button onClick={() => setShowAdd(true)}>+ Add expense</Button>}
      />

      <Card className="mb-4 flex flex-wrap gap-3 items-end">
        <Field label="Category">
          <select className={inputClass} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option>All</option>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="From">
          <input type="date" className={inputClass} value={start} onChange={(e) => setStart(e.target.value)} />
        </Field>
        <Field label="To">
          <input type="date" className={inputClass} value={end} onChange={(e) => setEnd(e.target.value)} />
        </Field>
      </Card>

      <Card className="p-0 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="text-left text-xs text-black/40 bg-black/[0.02]">
              <th className="px-4 py-2.5 font-normal">Date</th>
              <th className="px-4 py-2.5 font-normal">Category</th>
              <th className="px-4 py-2.5 font-normal">Description</th>
              <th className="px-4 py-2.5 font-normal">Supplier</th>
              <th className="px-4 py-2.5 font-normal text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.id} className="border-t border-black/5">
                <td className="px-4 py-2.5 text-black/60">{formatDate(e.date)}</td>
                <td className="px-4 py-2.5">
                  <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs">{e.category}</span>
                </td>
                <td className="px-4 py-2.5">{e.description}</td>
                <td className="px-4 py-2.5 text-black/50">{e.supplier ?? "—"}</td>
                <td className="px-4 py-2.5 text-right font-medium">{peso(e.amount)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-black/40">
                  No expenses match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <AddExpenseModal open={showAdd} onClose={() => setShowAdd(false)} onSubmit={addExpense} />
    </div>
  );
}

function AddExpenseModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (e: {
    date: string;
    category: ExpenseCategory;
    amount: number;
    description: string;
    supplier?: string;
  }) => Promise<void>;
}) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState<ExpenseCategory>("Materials");
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState("");
  const [supplier, setSupplier] = useState("");

  return (
    <Modal open={open} onClose={onClose} title="Add expense">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!description.trim() || amount <= 0) return;
          onSubmit({ date, category, amount, description: description.trim(), supplier: supplier.trim() || undefined }).catch(
            reportError
          );
          setDate(new Date().toISOString().slice(0, 10));
          setCategory("Materials");
          setAmount(0);
          setDescription("");
          setSupplier("");
          onClose();
        }}
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Date">
            <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Category">
            <select
              className={inputClass}
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            >
              {CATEGORIES.filter((c) => c !== "Payroll").map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Amount (₱)">
          <input
            type="number"
            min={0}
            step="0.01"
            required
            className={inputClass}
            value={amount || ""}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        </Field>
        <Field label="Description">
          <input required className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <Field label="Supplier (optional)">
          <input className={inputClass} value={supplier} onChange={(e) => setSupplier(e.target.value)} />
        </Field>
        <Button type="submit" className="w-full">
          Save expense
        </Button>
      </form>
    </Modal>
  );
}
