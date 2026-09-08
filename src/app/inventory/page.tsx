"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader, Card, Button, Modal, Field, inputClass } from "@/components/ui";
import { peso, formatDate } from "@/lib/format";
import { reportError } from "@/lib/errors";

type ActionKind = "restock" | "produce" | "adjust-raw" | "adjust-finished" | null;

export default function InventoryPage() {
  const { rawMaterials, finishedGoods, products, restockRawMaterial, produceFinishedGoods, adjustStock } =
    useStore();

  const [action, setAction] = useState<ActionKind>(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [showLog, setShowLog] = useState(false);

  function openAction(kind: ActionKind, id: string) {
    setTargetId(id);
    setAction(kind);
  }

  function closeModal() {
    setAction(null);
    setTargetId(null);
  }

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Raw materials and finished goods on hand."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowLog(true)}>
              Movement log
            </Button>
            <Button onClick={() => openAction("produce", products[0]?.id ?? "")}>+ Produce goods</Button>
          </div>
        }
      />

      <div className="mb-8">
        <h2 className="text-sm font-semibold mb-3 text-black/70">Raw materials</h2>
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-black/40 bg-black/[0.02]">
                <th className="px-4 py-2.5 font-normal">Material</th>
                <th className="px-4 py-2.5 font-normal text-right">On hand</th>
                <th className="px-4 py-2.5 font-normal text-right">Reorder at</th>
                <th className="px-4 py-2.5 font-normal text-right">Cost/unit</th>
                <th className="px-4 py-2.5 font-normal">Supplier</th>
                <th className="px-4 py-2.5 font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {rawMaterials.map((rm) => {
                const low = rm.quantityOnHand <= rm.reorderThreshold;
                return (
                  <tr key={rm.id} className="border-t border-black/5">
                    <td className="px-4 py-2.5">{rm.name}</td>
                    <td className={`px-4 py-2.5 text-right ${low ? "text-red-600 font-medium" : ""}`}>
                      {rm.quantityOnHand}
                      {rm.unit}
                      {low && <span className="ml-1.5 text-[10px] uppercase align-middle text-red-600">low</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right text-black/50">
                      {rm.reorderThreshold}
                      {rm.unit}
                    </td>
                    <td className="px-4 py-2.5 text-right text-black/50">{peso(rm.costPerUnit)}</td>
                    <td className="px-4 py-2.5 text-black/50">{rm.supplier ?? "—"}</td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <button
                        className="text-xs text-black/60 hover:text-black underline underline-offset-2 mr-3"
                        onClick={() => openAction("restock", rm.id)}
                      >
                        Restock
                      </button>
                      <button
                        className="text-xs text-black/60 hover:text-black underline underline-offset-2"
                        onClick={() => openAction("adjust-raw", rm.id)}
                      >
                        Adjust
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-3 text-black/70">Finished goods</h2>
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-black/40 bg-black/[0.02]">
                <th className="px-4 py-2.5 font-normal">Product</th>
                <th className="px-4 py-2.5 font-normal text-right">On hand</th>
                <th className="px-4 py-2.5 font-normal text-right">Reorder at</th>
                <th className="px-4 py-2.5 font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {finishedGoods.map((fg) => {
                const product = products.find((p) => p.id === fg.productId);
                const low = fg.quantityOnHand <= fg.reorderThreshold;
                return (
                  <tr key={fg.productId} className="border-t border-black/5">
                    <td className="px-4 py-2.5">{product?.name ?? fg.productId}</td>
                    <td className={`px-4 py-2.5 text-right ${low ? "text-red-600 font-medium" : ""}`}>
                      {fg.quantityOnHand} pcs
                      {low && <span className="ml-1.5 text-[10px] uppercase align-middle text-red-600">low</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right text-black/50">{fg.reorderThreshold} pcs</td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <button
                        className="text-xs text-black/60 hover:text-black underline underline-offset-2 mr-3"
                        onClick={() => openAction("produce", fg.productId)}
                      >
                        Produce
                      </button>
                      <button
                        className="text-xs text-black/60 hover:text-black underline underline-offset-2"
                        onClick={() => openAction("adjust-finished", fg.productId)}
                      >
                        Adjust
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>

      <RestockModal
        open={action === "restock"}
        onClose={closeModal}
        rawMaterialId={targetId}
        onSubmit={restockRawMaterial}
      />
      <ProduceModal
        open={action === "produce"}
        onClose={closeModal}
        productId={targetId}
        onSubmit={produceFinishedGoods}
      />
      <AdjustModal
        open={action === "adjust-raw" || action === "adjust-finished"}
        onClose={closeModal}
        itemType={action === "adjust-raw" ? "raw_material" : "finished_good"}
        itemId={targetId}
        onSubmit={adjustStock}
      />
      <MovementLogModal open={showLog} onClose={() => setShowLog(false)} />
    </div>
  );
}

function RestockModal({
  open,
  onClose,
  rawMaterialId,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  rawMaterialId: string | null;
  onSubmit: (id: string, quantity: number, cost: number, asExpense: boolean) => Promise<void>;
}) {
  const { rawMaterials } = useStore();
  const rm = rawMaterials.find((r) => r.id === rawMaterialId);
  const [quantity, setQuantity] = useState(0);
  const [cost, setCost] = useState(0);
  const [asExpense, setAsExpense] = useState(true);

  if (!rm) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Restock: ${rm.name}`}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(rm.id, quantity, cost, asExpense).catch(reportError);
          onClose();
          setQuantity(0);
          setCost(0);
        }}
      >
        <Field label={`Quantity to add (${rm.unit})`}>
          <input
            type="number"
            min={0}
            required
            className={inputClass}
            value={quantity || ""}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </Field>
        <Field label="Total cost (₱)">
          <input
            type="number"
            min={0}
            step="0.01"
            required
            className={inputClass}
            value={cost || ""}
            onChange={(e) => setCost(Number(e.target.value))}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm text-black/70">
          <input type="checkbox" checked={asExpense} onChange={(e) => setAsExpense(e.target.checked)} />
          Also log this as a Materials expense
        </label>
        <Button type="submit" className="w-full">
          Confirm restock
        </Button>
      </form>
    </Modal>
  );
}

function ProduceModal({
  open,
  onClose,
  productId,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  productId: string | null;
  onSubmit: (id: string, quantity: number) => Promise<{ ok: boolean; warning?: string }>;
}) {
  const { products, recipes, rawMaterials } = useStore();
  const [selected, setSelected] = useState(productId ?? "");
  const [quantity, setQuantity] = useState(1);
  const [warning, setWarning] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const activeId = selected || productId || products[0]?.id;
  const recipe = useMemo(() => recipes[activeId] ?? [], [recipes, activeId]);

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Produce finished goods">
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setSubmitting(true);
          try {
            const result = await onSubmit(activeId, quantity);
            if (result.warning) {
              setWarning(result.warning);
            } else {
              onClose();
              setQuantity(1);
              setWarning(null);
            }
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <Field label="Product">
          <select
            className={inputClass}
            value={activeId}
            onChange={(e) => {
              setSelected(e.target.value);
              setWarning(null);
            }}
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Quantity to produce">
          <input
            type="number"
            min={1}
            required
            className={inputClass}
            value={quantity}
            onChange={(e) => {
              setQuantity(Number(e.target.value));
              setWarning(null);
            }}
          />
        </Field>

        {recipe.length > 0 ? (
          <div className="text-xs text-black/50 bg-black/[0.03] rounded-md p-3">
            <div className="font-medium mb-1 text-black/70">Will consume:</div>
            <ul className="space-y-0.5">
              {recipe.map((item) => {
                const rm = rawMaterials.find((r) => r.id === item.rawMaterialId);
                return (
                  <li key={item.rawMaterialId}>
                    {rm?.name}: {item.quantityPerUnit * quantity}
                    {rm?.unit} (have {rm?.quantityOnHand}
                    {rm?.unit})
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <p className="text-xs text-black/40">No recipe defined for this product — no materials will be deducted.</p>
        )}

        {warning && (
          <div className="text-xs bg-amber-50 text-amber-800 border border-amber-200 rounded-md p-3">
            ⚠ {warning} Submit again to proceed anyway.
          </div>
        )}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Saving..." : warning ? "Proceed anyway" : "Confirm production"}
        </Button>
      </form>
    </Modal>
  );
}

function AdjustModal({
  open,
  onClose,
  itemType,
  itemId,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  itemType: "raw_material" | "finished_good";
  itemId: string | null;
  onSubmit: (
    itemType: "raw_material" | "finished_good",
    itemId: string,
    direction: "in" | "out",
    quantity: number,
    reason: string
  ) => Promise<void>;
}) {
  const { rawMaterials, products } = useStore();
  const [direction, setDirection] = useState<"in" | "out">("out");
  const [quantity, setQuantity] = useState(0);
  const [reason, setReason] = useState("");

  if (!itemId) return null;
  const label =
    itemType === "raw_material"
      ? rawMaterials.find((r) => r.id === itemId)?.name
      : products.find((p) => p.id === itemId)?.name;
  const unit = itemType === "raw_material" ? rawMaterials.find((r) => r.id === itemId)?.unit ?? "" : "pcs";

  return (
    <Modal open={open} onClose={onClose} title={`Adjust stock: ${label}`}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!reason.trim()) return;
          onSubmit(itemType, itemId, direction, quantity, reason.trim()).catch(reportError);
          onClose();
          setQuantity(0);
          setReason("");
        }}
      >
        <Field label="Direction">
          <div className="flex rounded-md border border-black/15 overflow-hidden text-sm w-fit">
            <button
              type="button"
              className={`px-3 py-1.5 ${direction === "in" ? "bg-black text-white" : "hover:bg-black/5"}`}
              onClick={() => setDirection("in")}
            >
              Stock in (+)
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 ${direction === "out" ? "bg-black text-white" : "hover:bg-black/5"}`}
              onClick={() => setDirection("out")}
            >
              Stock out (-)
            </button>
          </div>
        </Field>
        <Field label={`Quantity (${unit})`}>
          <input
            type="number"
            min={0}
            required
            className={inputClass}
            value={quantity || ""}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </Field>
        <Field label="Reason (required)">
          <input
            type="text"
            required
            placeholder="e.g. Breakage, sample given out, stock count correction"
            className={inputClass}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </Field>
        <Button type="submit" className="w-full">
          Save adjustment
        </Button>
      </form>
    </Modal>
  );
}

function MovementLogModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { movements, rawMaterials, products } = useStore();

  function itemName(itemType: "raw_material" | "finished_good", itemId: string) {
    if (itemType === "raw_material") return rawMaterials.find((r) => r.id === itemId)?.name ?? itemId;
    return products.find((p) => p.id === itemId)?.name ?? itemId;
  }

  return (
    <Modal open={open} onClose={onClose} title="Inventory movement log">
      <div className="space-y-3 max-h-[60vh] overflow-y-auto">
        {movements.map((m) => (
          <div key={m.id} className="text-sm border-b border-black/5 pb-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">{itemName(m.itemType, m.itemId)}</span>
              <span className={m.direction === "in" ? "text-emerald-600" : "text-red-600"}>
                {m.direction === "in" ? "+" : "-"}
                {m.quantity}
              </span>
            </div>
            <div className="text-xs text-black/40 mt-0.5">
              {m.reason} · {m.createdBy} · {formatDate(m.createdAt)}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
