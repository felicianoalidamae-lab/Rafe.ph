"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader, Card, Button, Badge, Modal, Field, inputClass } from "@/components/ui";
import { peso, formatDate } from "@/lib/format";
import { reportError } from "@/lib/errors";
import type { PayType } from "@/lib/types";

export default function PayrollPage() {
  const { staff, payrollRuns, markPayrollPaid, addPayrollRun, addStaff } = useStore();
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [showNewRun, setShowNewRun] = useState(false);

  const runsSorted = useMemo(
    () => [...payrollRuns].sort((a, b) => (a.periodStart < b.periodStart ? 1 : -1)),
    [payrollRuns]
  );

  const unpaidTotal = payrollRuns.filter((r) => !r.paidOn).reduce((sum, r) => sum + r.total, 0);

  return (
    <div>
      <PageHeader
        title="Payroll"
        description={`${peso(unpaidTotal)} pending across unpaid runs`}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowAddStaff(true)}>
              + Add staff
            </Button>
            <Button onClick={() => setShowNewRun(true)}>+ New payroll run</Button>
          </div>
        }
      />

      <div className="mb-8">
        <h2 className="text-sm font-semibold mb-3 text-black/70">Staff / Helpers</h2>
        <Card className="p-0 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="text-left text-xs text-black/40 bg-black/[0.02]">
                <th className="px-4 py-2.5 font-normal">Name</th>
                <th className="px-4 py-2.5 font-normal">Position</th>
                <th className="px-4 py-2.5 font-normal">Pay type</th>
                <th className="px-4 py-2.5 font-normal text-right">Rate</th>
                <th className="px-4 py-2.5 font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id} className="border-t border-black/5">
                  <td className="px-4 py-2.5 font-medium">{s.name}</td>
                  <td className="px-4 py-2.5 text-black/60">{s.position}</td>
                  <td className="px-4 py-2.5 text-black/60">{s.payType}</td>
                  <td className="px-4 py-2.5 text-right">
                    {peso(s.rate)}
                    {s.payType === "Hourly" ? "/hr" : s.payType === "Per-piece" ? "/pc" : "/period"}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      className="text-xs text-black/60 hover:text-black underline underline-offset-2"
                      onClick={() => setSelectedStaffId(s.id)}
                    >
                      View history
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-3 text-black/70">Payroll runs</h2>
        <Card className="p-0 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="text-left text-xs text-black/40 bg-black/[0.02]">
                <th className="px-4 py-2.5 font-normal">Staff</th>
                <th className="px-4 py-2.5 font-normal">Period</th>
                <th className="px-4 py-2.5 font-normal text-right">Base</th>
                <th className="px-4 py-2.5 font-normal text-right">Bonus</th>
                <th className="px-4 py-2.5 font-normal text-right">Deduction</th>
                <th className="px-4 py-2.5 font-normal text-right">Total</th>
                <th className="px-4 py-2.5 font-normal">Status</th>
                <th className="px-4 py-2.5 font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {runsSorted.map((r) => {
                const member = staff.find((s) => s.id === r.staffId);
                return (
                  <tr key={r.id} className="border-t border-black/5">
                    <td className="px-4 py-2.5 font-medium">{member?.name ?? r.staffId}</td>
                    <td className="px-4 py-2.5 text-black/60">
                      {formatDate(r.periodStart)} – {formatDate(r.periodEnd)}
                    </td>
                    <td className="px-4 py-2.5 text-right">{peso(r.baseAmount)}</td>
                    <td className="px-4 py-2.5 text-right text-emerald-600">{r.bonus ? `+${peso(r.bonus)}` : "—"}</td>
                    <td className="px-4 py-2.5 text-right text-red-600">{r.deduction ? `-${peso(r.deduction)}` : "—"}</td>
                    <td className="px-4 py-2.5 text-right font-medium">{peso(r.total)}</td>
                    <td className="px-4 py-2.5">
                      {r.paidOn ? <Badge text="Paid" /> : <Badge text="Unpaid" />}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {!r.paidOn && (
                        <button
                          className="text-xs text-black/60 hover:text-black underline underline-offset-2"
                          onClick={() =>
                            markPayrollPaid(r.id, new Date().toISOString().slice(0, 10)).catch(reportError)
                          }
                        >
                          Mark as paid
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>

      <AddStaffModal open={showAddStaff} onClose={() => setShowAddStaff(false)} onSubmit={addStaff} />
      <NewRunModal open={showNewRun} onClose={() => setShowNewRun(false)} onSubmit={addPayrollRun} />
      {selectedStaffId && (
        <StaffHistoryModal staffId={selectedStaffId} onClose={() => setSelectedStaffId(null)} />
      )}
    </div>
  );
}

function AddStaffModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (s: { name: string; position: string; payType: PayType; rate: number; active: boolean }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [payType, setPayType] = useState<PayType>("Fixed Salary");
  const [rate, setRate] = useState(0);

  return (
    <Modal open={open} onClose={onClose} title="Add staff / helper">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim() || !position.trim()) return;
          onSubmit({ name: name.trim(), position: position.trim(), payType, rate, active: true }).catch(reportError);
          setName("");
          setPosition("");
          setPayType("Fixed Salary");
          setRate(0);
          onClose();
        }}
      >
        <Field label="Name">
          <input required className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Position">
          <input required className={inputClass} value={position} onChange={(e) => setPosition(e.target.value)} />
        </Field>
        <Field label="Pay type">
          <select className={inputClass} value={payType} onChange={(e) => setPayType(e.target.value as PayType)}>
            <option>Fixed Salary</option>
            <option>Hourly</option>
            <option>Per-piece</option>
          </select>
        </Field>
        <Field label="Rate (₱)">
          <input
            type="number"
            min={0}
            className={inputClass}
            value={rate || ""}
            onChange={(e) => setRate(Number(e.target.value))}
          />
        </Field>
        <Button type="submit" className="w-full">
          Add staff
        </Button>
      </form>
    </Modal>
  );
}

function NewRunModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (run: {
    staffId: string;
    periodStart: string;
    periodEnd: string;
    baseAmount: number;
    bonus: number;
    deduction: number;
  }) => Promise<void>;
}) {
  const { staff } = useStore();
  const [staffId, setStaffId] = useState(staff[0]?.id ?? "");
  const [periodStart, setPeriodStart] = useState(() => new Date().toISOString().slice(0, 10));
  const [periodEnd, setPeriodEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [baseAmount, setBaseAmount] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [deduction, setDeduction] = useState(0);

  return (
    <Modal open={open} onClose={onClose} title="New payroll run">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!staffId) return;
          onSubmit({ staffId, periodStart, periodEnd, baseAmount, bonus, deduction }).catch(reportError);
          setBaseAmount(0);
          setBonus(0);
          setDeduction(0);
          onClose();
        }}
      >
        <Field label="Staff member">
          <select className={inputClass} value={staffId} onChange={(e) => setStaffId(e.target.value)}>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Period start">
            <input
              type="date"
              className={inputClass}
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
            />
          </Field>
          <Field label="Period end">
            <input type="date" className={inputClass} value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
          </Field>
        </div>
        <Field label="Base amount (₱)">
          <input
            type="number"
            min={0}
            className={inputClass}
            value={baseAmount || ""}
            onChange={(e) => setBaseAmount(Number(e.target.value))}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Bonus (₱)">
            <input
              type="number"
              min={0}
              className={inputClass}
              value={bonus || ""}
              onChange={(e) => setBonus(Number(e.target.value))}
            />
          </Field>
          <Field label="Deduction (₱)">
            <input
              type="number"
              min={0}
              className={inputClass}
              value={deduction || ""}
              onChange={(e) => setDeduction(Number(e.target.value))}
            />
          </Field>
        </div>
        <div className="text-right text-sm font-medium">Total: {peso(baseAmount + bonus - deduction)}</div>
        <Button type="submit" className="w-full">
          Create run
        </Button>
      </form>
    </Modal>
  );
}

function StaffHistoryModal({ staffId, onClose }: { staffId: string; onClose: () => void }) {
  const { staff, payrollRuns } = useStore();
  const member = staff.find((s) => s.id === staffId);
  const runs = payrollRuns
    .filter((r) => r.staffId === staffId)
    .sort((a, b) => (a.periodStart < b.periodStart ? 1 : -1));

  return (
    <Modal open onClose={onClose} title={`Payroll history: ${member?.name ?? ""}`}>
      <div className="space-y-3">
        {runs.length === 0 && <p className="text-sm text-black/40">No payroll runs yet.</p>}
        {runs.map((r) => (
          <div key={r.id} className="flex items-center justify-between text-sm border-b border-black/5 pb-2">
            <div>
              <div>
                {formatDate(r.periodStart)} – {formatDate(r.periodEnd)}
              </div>
              <div className="text-xs text-black/40">{r.paidOn ? `Paid ${formatDate(r.paidOn)}` : "Unpaid"}</div>
            </div>
            <div className="font-medium">{peso(r.total)}</div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
