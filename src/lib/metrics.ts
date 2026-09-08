import type { Order, Expense, RawMaterial, FinishedGood, Product } from "./types";

export function orderTotal(order: Order): number {
  return order.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}

export function inRange(dateStr: string, start?: string, end?: string): boolean {
  if (start && dateStr < start) return false;
  if (end && dateStr > end) return false;
  return true;
}

export function salesInRange(orders: Order[], start?: string, end?: string): number {
  return orders
    .filter((o) => o.paymentStatus === "Paid" && inRange(o.orderDate, start, end))
    .reduce((sum, o) => sum + orderTotal(o), 0);
}

export function expensesInRange(expenses: Expense[], start?: string, end?: string): number {
  return expenses.filter((e) => inRange(e.date, start, end)).reduce((sum, e) => sum + e.amount, 0);
}

export function expensesByCategory(expenses: Expense[], start?: string, end?: string) {
  const filtered = expenses.filter((e) => inRange(e.date, start, end));
  const map = new Map<string, number>();
  for (const e of filtered) {
    map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
  }
  return Array.from(map.entries()).map(([category, amount]) => ({ category, amount }));
}

export function lowStockRawMaterials(rawMaterials: RawMaterial[]) {
  return rawMaterials.filter((rm) => rm.quantityOnHand <= rm.reorderThreshold);
}

export function lowStockFinishedGoods(finishedGoods: FinishedGood[]) {
  return finishedGoods.filter((fg) => fg.quantityOnHand <= fg.reorderThreshold);
}

export function ordersDueSoon(orders: Order[], withinDays = 3, today = new Date()): Order[] {
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() + withinDays);
  const todayStr = today.toISOString().slice(0, 10);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return orders.filter(
    (o) =>
      !["Completed", "Delivered", "Cancelled"].includes(o.status) &&
      o.dueDate >= todayStr &&
      o.dueDate <= cutoffStr
  );
}

export function salesTrend(orders: Order[], days = 7, today = new Date()) {
  const buckets: { date: string; sales: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const sales = orders
      .filter((o) => o.paymentStatus === "Paid" && o.orderDate === dateStr)
      .reduce((sum, o) => sum + orderTotal(o), 0);
    buckets.push({ date: dateStr, sales });
  }
  return buckets;
}

export function salesByProduct(orders: Order[], products: Product[], start?: string, end?: string) {
  const map = new Map<string, number>();
  for (const o of orders) {
    if (!inRange(o.orderDate, start, end)) continue;
    if (o.status === "Cancelled") continue;
    for (const item of o.items) {
      map.set(item.productId, (map.get(item.productId) ?? 0) + item.quantity * item.unitPrice);
    }
  }
  return Array.from(map.entries())
    .map(([productId, amount]) => ({
      productId,
      productName: products.find((p) => p.id === productId)?.name ?? productId,
      amount,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function salesBySource(orders: Order[], start?: string, end?: string) {
  const map = new Map<string, number>();
  for (const o of orders) {
    if (!inRange(o.orderDate, start, end)) continue;
    if (o.status === "Cancelled") continue;
    map.set(o.source, (map.get(o.source) ?? 0) + orderTotal(o));
  }
  return Array.from(map.entries()).map(([source, amount]) => ({ source, amount }));
}

export function inventoryValue(rawMaterials: RawMaterial[], finishedGoods: FinishedGood[], products: Product[]) {
  const rawValue = rawMaterials.reduce((sum, rm) => sum + rm.quantityOnHand * rm.costPerUnit, 0);
  const finishedValue = finishedGoods.reduce((sum, fg) => {
    const product = products.find((p) => p.id === fg.productId);
    return sum + fg.quantityOnHand * (product?.basePrice ?? 0);
  }, 0);
  return { rawValue, finishedValue, total: rawValue + finishedValue };
}
