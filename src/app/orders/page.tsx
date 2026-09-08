"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader, Card, Button, Badge, Modal, Field, inputClass } from "@/components/ui";
import { peso, formatDate } from "@/lib/format";
import { orderTotal } from "@/lib/metrics";
import { reportError } from "@/lib/errors";
import type { Order, OrderStatus, PaymentStatus, PaymentMethod, OrderItem } from "@/lib/types";

const STATUSES: OrderStatus[] = ["Pending", "In Production", "Ready", "Completed", "Delivered", "Cancelled"];
const PAYMENT_STATUSES: PaymentStatus[] = ["Unpaid", "Partially Paid", "Paid"];
const PAYMENT_METHODS: PaymentMethod[] = ["Cash", "GCash", "Bank Transfer", "Other"];

export default function OrdersPage() {
  const { orders } = useStore();
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [paymentFilter, setPaymentFilter] = useState<string>("All");
  const [sourceFilter, setSourceFilter] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const sources = useMemo(() => Array.from(new Set(orders.map((o) => o.source))), [orders]);

  const filtered = useMemo(() => {
    return orders
      .filter((o) => statusFilter === "All" || o.status === statusFilter)
      .filter((o) => paymentFilter === "All" || o.paymentStatus === paymentFilter)
      .filter((o) => sourceFilter === "All" || o.source === sourceFilter)
      .filter((o) => o.customerName.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => (a.orderDate < b.orderDate ? 1 : -1));
  }, [orders, statusFilter, paymentFilter, sourceFilter, search]);

  return (
    <div>
      <PageHeader
        title="Orders"
        description={`${orders.length} total orders`}
        action={<Button onClick={() => setShowCreate(true)}>+ New order</Button>}
      />

      <Card className="mb-4 flex flex-wrap gap-3 items-end">
        <Field label="Search customer">
          <input
            className={inputClass}
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Field>
        <Field label="Status">
          <select className={inputClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option>All</option>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Payment">
          <select className={inputClass} value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
            <option>All</option>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Source">
          <select className={inputClass} value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
            <option>All</option>
            {sources.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
      </Card>

      <Card className="p-0 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead>
            <tr className="text-left text-xs text-black/40 bg-black/[0.02]">
              <th className="px-4 py-2.5 font-normal">Customer</th>
              <th className="px-4 py-2.5 font-normal">Source</th>
              <th className="px-4 py-2.5 font-normal">Due</th>
              <th className="px-4 py-2.5 font-normal">Status</th>
              <th className="px-4 py-2.5 font-normal">Payment</th>
              <th className="px-4 py-2.5 font-normal text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr
                key={o.id}
                className="border-t border-black/5 cursor-pointer hover:bg-black/[0.02]"
                onClick={() => setSelectedOrder(o)}
              >
                <td className="px-4 py-2.5">
                  <div className="font-medium">{o.customerName}</div>
                  <div className="text-xs text-black/40">{o.id}</div>
                </td>
                <td className="px-4 py-2.5 text-black/60">{o.source}</td>
                <td className="px-4 py-2.5 text-black/60">{formatDate(o.dueDate)}</td>
                <td className="px-4 py-2.5">
                  <Badge text={o.status} />
                </td>
                <td className="px-4 py-2.5">
                  <Badge text={o.paymentStatus} />
                </td>
                <td className="px-4 py-2.5 text-right font-medium">{peso(orderTotal(o))}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-black/40">
                  No orders match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <CreateOrderModal open={showCreate} onClose={() => setShowCreate(false)} />
      {selectedOrder && (
        <OrderDetailModal
          order={orders.find((o) => o.id === selectedOrder.id) ?? selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}

function CreateOrderModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { products, addOrder } = useStore();
  const [customerName, setCustomerName] = useState("");
  const [contact, setContact] = useState("");
  const [source, setSource] = useState("Instagram");
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState<Omit<OrderItem, "id">[]>([
    { productId: products[0]?.id ?? "", quantity: 1, unitPrice: products[0]?.basePrice ?? 0, customizationNotes: "" },
  ]);

  function updateItem(idx: number, patch: Partial<Omit<OrderItem, "id">>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      { productId: products[0]?.id ?? "", quantity: 1, unitPrice: products[0]?.basePrice ?? 0, customizationNotes: "" },
    ]);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function reset() {
    setCustomerName("");
    setContact("");
    setSource("Instagram");
    setDueDate(new Date().toISOString().slice(0, 10));
    setItems([{ productId: products[0]?.id ?? "", quantity: 1, unitPrice: products[0]?.basePrice ?? 0, customizationNotes: "" }]);
  }

  return (
    <Modal open={open} onClose={onClose} title="New order">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!customerName.trim() || items.length === 0) return;
          addOrder({
            customerName: customerName.trim(),
            contact: contact.trim() || undefined,
            source,
            orderDate: new Date().toISOString().slice(0, 10),
            dueDate,
            status: "Pending",
            paymentStatus: "Unpaid",
            amountPaid: 0,
            paymentMethod: "Cash",
            items: items.map((it, i) => ({ ...it, id: `oi-new-${i}` })),
          }).catch(reportError);
          reset();
          onClose();
        }}
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Customer name">
            <input
              required
              className={inputClass}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </Field>
          <Field label="Contact (optional)">
            <input className={inputClass} value={contact} onChange={(e) => setContact(e.target.value)} />
          </Field>
          <Field label="Source">
            <input
              className={inputClass}
              placeholder="Instagram, Facebook, Shopee, Walk-in..."
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
          </Field>
          <Field label="Due date">
            <input
              type="date"
              className={inputClass}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </Field>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-black/60">Order items</span>
            <button type="button" onClick={addItem} className="text-xs underline underline-offset-2 text-black/60 hover:text-black">
              + Add item
            </button>
          </div>
          <div className="space-y-3">
            {items.map((item, idx) => {
              const product = products.find((p) => p.id === item.productId);
              return (
                <div key={idx} className="border border-black/10 rounded-md p-3 space-y-2">
                  <div className="flex gap-2">
                    <select
                      className={inputClass}
                      value={item.productId}
                      onChange={(e) => {
                        const p = products.find((pr) => pr.id === e.target.value);
                        updateItem(idx, { productId: e.target.value, unitPrice: p?.basePrice ?? 0 });
                      }}
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(idx)} className="text-red-500 text-xs px-2">
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min={1}
                      className={inputClass}
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })}
                    />
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      className={inputClass}
                      placeholder="Unit price"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(idx, { unitPrice: Number(e.target.value) })}
                    />
                  </div>
                  <input
                    className={inputClass}
                    placeholder="Customization notes (scent, color, engraving...)"
                    value={item.customizationNotes ?? ""}
                    onChange={(e) => updateItem(idx, { customizationNotes: e.target.value })}
                  />
                  <div className="text-xs text-black/40 text-right">
                    Subtotal: {peso(item.quantity * item.unitPrice)} {product ? `(${product.name})` : ""}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-right font-medium">
          Total: {peso(items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0))}
        </div>

        <Button type="submit" className="w-full">
          Create order
        </Button>
      </form>
    </Modal>
  );
}

function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const { products, updateOrderStatus, updateOrderPayment } = useStore();
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(order.paymentStatus);
  const [amountPaid, setAmountPaid] = useState(order.amountPaid);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(order.paymentMethod);

  const total = orderTotal(order);

  return (
    <Modal open onClose={onClose} title={`Order ${order.id}`}>
      <div className="space-y-5">
        <div className="text-sm">
          <div className="font-medium">{order.customerName}</div>
          <div className="text-black/50">{order.contact ?? "No contact info"}</div>
          <div className="text-black/40 text-xs mt-1">
            {order.source} · Ordered {formatDate(order.orderDate)} · Due {formatDate(order.dueDate)}
          </div>
        </div>

        <div>
          <div className="text-xs font-medium text-black/60 mb-2">Items</div>
          <table className="w-full text-sm">
            <tbody>
              {order.items.map((item) => {
                const product = products.find((p) => p.id === item.productId);
                return (
                  <tr key={item.id} className="border-t border-black/5">
                    <td className="py-1.5">
                      <div>{product?.name ?? item.productId}</div>
                      {item.customizationNotes && (
                        <div className="text-xs text-black/40">{item.customizationNotes}</div>
                      )}
                    </td>
                    <td className="py-1.5 text-right text-black/50">
                      {item.quantity} × {peso(item.unitPrice)}
                    </td>
                    <td className="py-1.5 text-right font-medium w-24">{peso(item.quantity * item.unitPrice)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="text-right font-medium mt-2 text-sm">Total: {peso(total)}</div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Order status">
            <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)}>
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Payment status">
            <select
              className={inputClass}
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
            >
              {PAYMENT_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Amount paid (₱)">
            <input
              type="number"
              min={0}
              className={inputClass}
              value={amountPaid}
              onChange={(e) => setAmountPaid(Number(e.target.value))}
            />
          </Field>
          <Field label="Payment method">
            <select
              className={inputClass}
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </Field>
        </div>

        {(status === "Completed" || status === "Delivered") && status !== order.status && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2">
            Marking as {status} will deduct finished goods stock for this order.
          </p>
        )}

        <Button
          className="w-full"
          onClick={() => {
            if (status !== order.status) updateOrderStatus(order.id, status).catch(reportError);
            if (
              paymentStatus !== order.paymentStatus ||
              amountPaid !== order.amountPaid ||
              paymentMethod !== order.paymentMethod
            ) {
              updateOrderPayment(order.id, paymentStatus, amountPaid, paymentMethod).catch(reportError);
            }
            onClose();
          }}
        >
          Save changes
        </Button>
      </div>
    </Modal>
  );
}
