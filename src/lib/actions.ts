"use server";

import { randomUUID } from "crypto";
import { supabaseAdmin } from "./supabaseAdmin";
import type {
  Product,
  RawMaterial,
  FinishedGood,
  RecipeItem,
  InventoryMovement,
  Order,
  OrderItem,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  Expense,
  ExpenseCategory,
  Staff,
  PayType,
  PayrollRun,
} from "./types";

function shortId(prefix: string) {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}

function must<R extends { data: unknown; error: { message: string } | null }>(
  result: R
): NonNullable<R["data"]> {
  if (result.error) throw new Error(result.error.message);
  if (result.data === null || result.data === undefined) throw new Error("Supabase returned no data");
  return result.data as NonNullable<R["data"]>;
}

export interface AllData {
  products: Product[];
  rawMaterials: RawMaterial[];
  finishedGoods: FinishedGood[];
  recipes: Record<string, RecipeItem[]>;
  movements: InventoryMovement[];
  orders: Order[];
  expenses: Expense[];
  staff: Staff[];
  payrollRuns: PayrollRun[];
}

export async function getAllData(): Promise<AllData> {
  const [
    productsRes,
    rawMaterialsRes,
    recipeItemsRes,
    finishedGoodsRes,
    ordersRes,
    orderItemsRes,
    movementsRes,
    expensesRes,
    staffRes,
    payrollRunsRes,
  ] = await Promise.all([
    supabaseAdmin.from("products").select("*").order("name"),
    supabaseAdmin.from("raw_materials").select("*").order("name"),
    supabaseAdmin.from("recipe_items").select("*"),
    supabaseAdmin.from("finished_goods").select("*"),
    supabaseAdmin.from("orders").select("*").order("order_date", { ascending: false }),
    supabaseAdmin.from("order_items").select("*"),
    supabaseAdmin.from("inventory_movements").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("expenses").select("*").order("date", { ascending: false }),
    supabaseAdmin.from("staff").select("*").order("name"),
    supabaseAdmin.from("payroll_runs").select("*").order("period_start", { ascending: false }),
  ]);

  for (const res of [
    productsRes,
    rawMaterialsRes,
    recipeItemsRes,
    finishedGoodsRes,
    ordersRes,
    orderItemsRes,
    movementsRes,
    expensesRes,
    staffRes,
    payrollRunsRes,
  ]) {
    if (res.error) throw new Error(res.error.message);
  }

  const products: Product[] = productsRes.data!.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    sku: p.sku,
    basePrice: Number(p.base_price),
    isActive: p.is_active,
    notes: p.notes ?? undefined,
  }));

  const rawMaterials: RawMaterial[] = rawMaterialsRes.data!.map((rm) => ({
    id: rm.id,
    name: rm.name,
    unit: rm.unit,
    quantityOnHand: Number(rm.quantity_on_hand),
    reorderThreshold: Number(rm.reorder_threshold),
    costPerUnit: Number(rm.cost_per_unit),
    supplier: rm.supplier ?? undefined,
  }));

  const recipes: Record<string, RecipeItem[]> = {};
  for (const item of recipeItemsRes.data!) {
    const list = recipes[item.product_id] ?? (recipes[item.product_id] = []);
    list.push({ rawMaterialId: item.raw_material_id, quantityPerUnit: Number(item.quantity_per_unit) });
  }

  const finishedGoods: FinishedGood[] = finishedGoodsRes.data!.map((fg) => ({
    productId: fg.product_id,
    quantityOnHand: Number(fg.quantity_on_hand),
    reorderThreshold: Number(fg.reorder_threshold),
  }));

  const itemsByOrder: Record<string, OrderItem[]> = {};
  for (const item of orderItemsRes.data!) {
    const list = itemsByOrder[item.order_id] ?? (itemsByOrder[item.order_id] = []);
    list.push({
      id: item.id,
      productId: item.product_id,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unit_price),
      customizationNotes: item.customization_notes ?? undefined,
    });
  }

  const orders: Order[] = ordersRes.data!.map((o) => ({
    id: o.id,
    customerName: o.customer_name,
    contact: o.contact ?? undefined,
    source: o.source,
    orderDate: o.order_date,
    dueDate: o.due_date,
    status: o.status,
    paymentStatus: o.payment_status,
    amountPaid: Number(o.amount_paid),
    paymentMethod: o.payment_method,
    items: itemsByOrder[o.id] ?? [],
    createdBy: o.created_by,
  }));

  const movements: InventoryMovement[] = movementsRes.data!.map((m) => ({
    id: m.id,
    itemType: m.item_type,
    itemId: m.item_id,
    direction: m.direction,
    quantity: Number(m.quantity),
    reason: m.reason,
    relatedOrderId: m.related_order_id ?? undefined,
    createdBy: m.created_by,
    createdAt: m.created_at,
  }));

  const expenses: Expense[] = expensesRes.data!.map((e) => ({
    id: e.id,
    date: e.date,
    category: e.category,
    amount: Number(e.amount),
    description: e.description,
    supplier: e.supplier ?? undefined,
    linkedRestockId: e.linked_restock_id ?? undefined,
  }));

  const staff: Staff[] = staffRes.data!.map((s) => ({
    id: s.id,
    name: s.name,
    position: s.position,
    payType: s.pay_type,
    rate: Number(s.rate),
    active: s.active,
  }));

  const payrollRuns: PayrollRun[] = payrollRunsRes.data!.map((r) => ({
    id: r.id,
    staffId: r.staff_id,
    periodStart: r.period_start,
    periodEnd: r.period_end,
    baseAmount: Number(r.base_amount),
    bonus: Number(r.bonus),
    deduction: Number(r.deduction),
    total: Number(r.total),
    paidOn: r.paid_on ?? undefined,
  }));

  return { products, rawMaterials, finishedGoods, recipes, movements, orders, expenses, staff, payrollRuns };
}

export async function restockRawMaterial(
  rawMaterialId: string,
  quantity: number,
  cost: number,
  createAsExpense: boolean,
  actorName: string
): Promise<{ movement: InventoryMovement; expense?: Expense }> {
  const rm = must(await supabaseAdmin.from("raw_materials").select("*").eq("id", rawMaterialId).single());
  must(
    await supabaseAdmin
      .from("raw_materials")
      .update({ quantity_on_hand: Number(rm.quantity_on_hand) + quantity })
      .eq("id", rawMaterialId)
      .select()
      .single()
  );

  const movementRow = must(
    await supabaseAdmin
      .from("inventory_movements")
      .insert({
        id: shortId("im"),
        item_type: "raw_material",
        item_id: rawMaterialId,
        direction: "in",
        quantity,
        reason: "Restock",
        created_by: actorName,
      })
      .select()
      .single()
  );

  const movement: InventoryMovement = {
    id: movementRow.id,
    itemType: "raw_material",
    itemId: rawMaterialId,
    direction: "in",
    quantity,
    reason: "Restock",
    createdBy: actorName,
    createdAt: movementRow.created_at,
  };

  if (!createAsExpense) return { movement };

  const expenseRow = must(
    await supabaseAdmin
      .from("expenses")
      .insert({
        id: shortId("e"),
        date: new Date().toISOString().slice(0, 10),
        category: "Materials",
        amount: cost,
        description: `Restock: ${rm.name} (${quantity} ${rm.unit})`,
        supplier: rm.supplier,
        linked_restock_id: movementRow.id,
      })
      .select()
      .single()
  );

  const expense: Expense = {
    id: expenseRow.id,
    date: expenseRow.date,
    category: "Materials",
    amount: cost,
    description: expenseRow.description,
    supplier: expenseRow.supplier ?? undefined,
    linkedRestockId: movementRow.id,
  };

  return { movement, expense };
}

export async function produceFinishedGoods(
  productId: string,
  quantity: number,
  actorName: string
): Promise<{
  warning?: string;
  finishedGood: FinishedGood;
  rawMaterials: RawMaterial[];
  movements: InventoryMovement[];
}> {
  const recipeRows = must(
    await supabaseAdmin.from("recipe_items").select("*").eq("product_id", productId)
  );

  let warning: string | undefined;
  const updatedRawMaterials: RawMaterial[] = [];
  const newMovements: InventoryMovement[] = [];

  for (const item of recipeRows) {
    const rm = must(
      await supabaseAdmin.from("raw_materials").select("*").eq("id", item.raw_material_id).single()
    );
    const needed = Number(item.quantity_per_unit) * quantity;
    if (Number(rm.quantity_on_hand) < needed) {
      warning = `Not enough ${rm.name} on hand (need ${needed}${rm.unit}, have ${rm.quantity_on_hand}${rm.unit}). Proceeding anyway.`;
    }
    const newQty = Number(rm.quantity_on_hand) - needed;
    const updated = must(
      await supabaseAdmin
        .from("raw_materials")
        .update({ quantity_on_hand: newQty })
        .eq("id", rm.id)
        .select()
        .single()
    );
    updatedRawMaterials.push({
      id: updated.id,
      name: updated.name,
      unit: updated.unit,
      quantityOnHand: Number(updated.quantity_on_hand),
      reorderThreshold: Number(updated.reorder_threshold),
      costPerUnit: Number(updated.cost_per_unit),
      supplier: updated.supplier ?? undefined,
    });

    const movementRow = must(
      await supabaseAdmin
        .from("inventory_movements")
        .insert({
          id: shortId("im"),
          item_type: "raw_material",
          item_id: rm.id,
          direction: "out",
          quantity: needed,
          reason: `Production use - ${productId}`,
          created_by: actorName,
        })
        .select()
        .single()
    );
    newMovements.push({
      id: movementRow.id,
      itemType: "raw_material",
      itemId: rm.id,
      direction: "out",
      quantity: needed,
      reason: movementRow.reason,
      createdBy: actorName,
      createdAt: movementRow.created_at,
    });
  }

  const fg = must(
    await supabaseAdmin.from("finished_goods").select("*").eq("product_id", productId).single()
  );
  const updatedFg = must(
    await supabaseAdmin
      .from("finished_goods")
      .update({ quantity_on_hand: Number(fg.quantity_on_hand) + quantity })
      .eq("product_id", productId)
      .select()
      .single()
  );

  const fgMovementRow = must(
    await supabaseAdmin
      .from("inventory_movements")
      .insert({
        id: shortId("im"),
        item_type: "finished_good",
        item_id: productId,
        direction: "in",
        quantity,
        reason: "Production run",
        created_by: actorName,
      })
      .select()
      .single()
  );
  newMovements.push({
    id: fgMovementRow.id,
    itemType: "finished_good",
    itemId: productId,
    direction: "in",
    quantity,
    reason: "Production run",
    createdBy: actorName,
    createdAt: fgMovementRow.created_at,
  });

  return {
    warning,
    finishedGood: {
      productId: updatedFg.product_id,
      quantityOnHand: Number(updatedFg.quantity_on_hand),
      reorderThreshold: Number(updatedFg.reorder_threshold),
    },
    rawMaterials: updatedRawMaterials,
    movements: newMovements,
  };
}

export async function adjustStock(
  itemType: "raw_material" | "finished_good",
  itemId: string,
  direction: "in" | "out",
  quantity: number,
  reason: string,
  actorName: string
): Promise<{ movement: InventoryMovement; rawMaterial?: RawMaterial; finishedGood?: FinishedGood }> {
  const delta = direction === "in" ? quantity : -quantity;
  let rawMaterial: RawMaterial | undefined;
  let finishedGood: FinishedGood | undefined;

  if (itemType === "raw_material") {
    const rm = must(await supabaseAdmin.from("raw_materials").select("*").eq("id", itemId).single());
    const updated = must(
      await supabaseAdmin
        .from("raw_materials")
        .update({ quantity_on_hand: Number(rm.quantity_on_hand) + delta })
        .eq("id", itemId)
        .select()
        .single()
    );
    rawMaterial = {
      id: updated.id,
      name: updated.name,
      unit: updated.unit,
      quantityOnHand: Number(updated.quantity_on_hand),
      reorderThreshold: Number(updated.reorder_threshold),
      costPerUnit: Number(updated.cost_per_unit),
      supplier: updated.supplier ?? undefined,
    };
  } else {
    const fg = must(
      await supabaseAdmin.from("finished_goods").select("*").eq("product_id", itemId).single()
    );
    const updated = must(
      await supabaseAdmin
        .from("finished_goods")
        .update({ quantity_on_hand: Number(fg.quantity_on_hand) + delta })
        .eq("product_id", itemId)
        .select()
        .single()
    );
    finishedGood = {
      productId: updated.product_id,
      quantityOnHand: Number(updated.quantity_on_hand),
      reorderThreshold: Number(updated.reorder_threshold),
    };
  }

  const movementRow = must(
    await supabaseAdmin
      .from("inventory_movements")
      .insert({
        id: shortId("im"),
        item_type: itemType,
        item_id: itemId,
        direction,
        quantity,
        reason,
        created_by: actorName,
      })
      .select()
      .single()
  );

  return {
    movement: {
      id: movementRow.id,
      itemType,
      itemId,
      direction,
      quantity,
      reason,
      createdBy: actorName,
      createdAt: movementRow.created_at,
    },
    rawMaterial,
    finishedGood,
  };
}

export async function addOrder(order: Omit<Order, "id" | "createdBy">, actorName: string): Promise<Order> {
  const orderRow = must(
    await supabaseAdmin
      .from("orders")
      .insert({
        id: shortId("o"),
        customer_name: order.customerName,
        contact: order.contact ?? null,
        source: order.source,
        order_date: order.orderDate,
        due_date: order.dueDate,
        status: order.status,
        payment_status: order.paymentStatus,
        amount_paid: order.amountPaid,
        payment_method: order.paymentMethod,
        created_by: actorName,
      })
      .select()
      .single()
  );

  const itemRows = must(
    await supabaseAdmin
      .from("order_items")
      .insert(
        order.items.map((item) => ({
          id: shortId("oi"),
          order_id: orderRow.id,
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          customization_notes: item.customizationNotes ?? null,
        }))
      )
      .select()
  );

  return {
    id: orderRow.id,
    customerName: orderRow.customer_name,
    contact: orderRow.contact ?? undefined,
    source: orderRow.source,
    orderDate: orderRow.order_date,
    dueDate: orderRow.due_date,
    status: orderRow.status,
    paymentStatus: orderRow.payment_status,
    amountPaid: Number(orderRow.amount_paid),
    paymentMethod: orderRow.payment_method,
    createdBy: actorName,
    items: itemRows.map((i) => ({
      id: i.id,
      productId: i.product_id,
      quantity: Number(i.quantity),
      unitPrice: Number(i.unit_price),
      customizationNotes: i.customization_notes ?? undefined,
    })),
  };
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  actorName: string
): Promise<{ order: Order; finishedGoods: FinishedGood[]; movements: InventoryMovement[] }> {
  const orderRow = must(
    await supabaseAdmin.from("orders").update({ status }).eq("id", orderId).select().single()
  );
  const itemRows = must(await supabaseAdmin.from("order_items").select("*").eq("order_id", orderId));

  const items: OrderItem[] = itemRows.map((i) => ({
    id: i.id,
    productId: i.product_id,
    quantity: Number(i.quantity),
    unitPrice: Number(i.unit_price),
    customizationNotes: i.customization_notes ?? undefined,
  }));

  const order: Order = {
    id: orderRow.id,
    customerName: orderRow.customer_name,
    contact: orderRow.contact ?? undefined,
    source: orderRow.source,
    orderDate: orderRow.order_date,
    dueDate: orderRow.due_date,
    status: orderRow.status,
    paymentStatus: orderRow.payment_status,
    amountPaid: Number(orderRow.amount_paid),
    paymentMethod: orderRow.payment_method,
    createdBy: orderRow.created_by,
    items,
  };

  const finishedGoods: FinishedGood[] = [];
  const movements: InventoryMovement[] = [];

  if (status === "Completed" || status === "Delivered") {
    for (const item of items) {
      const fg = must(
        await supabaseAdmin.from("finished_goods").select("*").eq("product_id", item.productId).single()
      );
      const newQty = Math.max(0, Number(fg.quantity_on_hand) - item.quantity);
      const updated = must(
        await supabaseAdmin
          .from("finished_goods")
          .update({ quantity_on_hand: newQty })
          .eq("product_id", item.productId)
          .select()
          .single()
      );
      finishedGoods.push({
        productId: updated.product_id,
        quantityOnHand: Number(updated.quantity_on_hand),
        reorderThreshold: Number(updated.reorder_threshold),
      });

      const movementRow = must(
        await supabaseAdmin
          .from("inventory_movements")
          .insert({
            id: shortId("im"),
            item_type: "finished_good",
            item_id: item.productId,
            direction: "out",
            quantity: item.quantity,
            reason: `Order ${orderId} fulfilled`,
            related_order_id: orderId,
            created_by: actorName,
          })
          .select()
          .single()
      );
      movements.push({
        id: movementRow.id,
        itemType: "finished_good",
        itemId: item.productId,
        direction: "out",
        quantity: item.quantity,
        reason: movementRow.reason,
        relatedOrderId: orderId,
        createdBy: actorName,
        createdAt: movementRow.created_at,
      });
    }
  }

  return { order, finishedGoods, movements };
}

export async function updateOrderPayment(
  orderId: string,
  paymentStatus: PaymentStatus,
  amountPaid: number,
  paymentMethod: PaymentMethod
): Promise<Order> {
  const orderRow = must(
    await supabaseAdmin
      .from("orders")
      .update({ payment_status: paymentStatus, amount_paid: amountPaid, payment_method: paymentMethod })
      .eq("id", orderId)
      .select()
      .single()
  );
  const itemRows = must(await supabaseAdmin.from("order_items").select("*").eq("order_id", orderId));

  return {
    id: orderRow.id,
    customerName: orderRow.customer_name,
    contact: orderRow.contact ?? undefined,
    source: orderRow.source,
    orderDate: orderRow.order_date,
    dueDate: orderRow.due_date,
    status: orderRow.status,
    paymentStatus: orderRow.payment_status,
    amountPaid: Number(orderRow.amount_paid),
    paymentMethod: orderRow.payment_method,
    createdBy: orderRow.created_by,
    items: itemRows.map((i) => ({
      id: i.id,
      productId: i.product_id,
      quantity: Number(i.quantity),
      unitPrice: Number(i.unit_price),
      customizationNotes: i.customization_notes ?? undefined,
    })),
  };
}

export async function addExpense(expense: Omit<Expense, "id">): Promise<Expense> {
  const row = must(
    await supabaseAdmin
      .from("expenses")
      .insert({
        id: shortId("e"),
        date: expense.date,
        category: expense.category,
        amount: expense.amount,
        description: expense.description,
        supplier: expense.supplier ?? null,
        linked_restock_id: expense.linkedRestockId ?? null,
      })
      .select()
      .single()
  );
  return {
    id: row.id,
    date: row.date,
    category: row.category as ExpenseCategory,
    amount: Number(row.amount),
    description: row.description,
    supplier: row.supplier ?? undefined,
    linkedRestockId: row.linked_restock_id ?? undefined,
  };
}

export async function addStaff(s: {
  name: string;
  position: string;
  payType: PayType;
  rate: number;
  active: boolean;
}): Promise<Staff> {
  const row = must(
    await supabaseAdmin
      .from("staff")
      .insert({
        id: shortId("s"),
        name: s.name,
        position: s.position,
        pay_type: s.payType,
        rate: s.rate,
        active: s.active,
      })
      .select()
      .single()
  );
  return {
    id: row.id,
    name: row.name,
    position: row.position,
    payType: row.pay_type,
    rate: Number(row.rate),
    active: row.active,
  };
}

export async function markPayrollPaid(payrollRunId: string, paidOn: string): Promise<{ run: PayrollRun; expense: Expense }> {
  const row = must(
    await supabaseAdmin.from("payroll_runs").update({ paid_on: paidOn }).eq("id", payrollRunId).select().single()
  );
  const member = must(await supabaseAdmin.from("staff").select("*").eq("id", row.staff_id).single());

  const expenseRow = must(
    await supabaseAdmin
      .from("expenses")
      .insert({
        id: shortId("e"),
        date: paidOn,
        category: "Payroll",
        amount: row.total,
        description: `Payroll: ${member.name} (${row.period_start} to ${row.period_end})`,
      })
      .select()
      .single()
  );

  return {
    run: {
      id: row.id,
      staffId: row.staff_id,
      periodStart: row.period_start,
      periodEnd: row.period_end,
      baseAmount: Number(row.base_amount),
      bonus: Number(row.bonus),
      deduction: Number(row.deduction),
      total: Number(row.total),
      paidOn: row.paid_on,
    },
    expense: {
      id: expenseRow.id,
      date: expenseRow.date,
      category: "Payroll",
      amount: Number(expenseRow.amount),
      description: expenseRow.description,
    },
  };
}

export async function addPayrollRun(run: {
  staffId: string;
  periodStart: string;
  periodEnd: string;
  baseAmount: number;
  bonus: number;
  deduction: number;
}): Promise<PayrollRun> {
  const total = run.baseAmount + run.bonus - run.deduction;
  const row = must(
    await supabaseAdmin
      .from("payroll_runs")
      .insert({
        id: shortId("pr"),
        staff_id: run.staffId,
        period_start: run.periodStart,
        period_end: run.periodEnd,
        base_amount: run.baseAmount,
        bonus: run.bonus,
        deduction: run.deduction,
        total,
      })
      .select()
      .single()
  );
  return {
    id: row.id,
    staffId: row.staff_id,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    baseAmount: Number(row.base_amount),
    bonus: Number(row.bonus),
    deduction: Number(row.deduction),
    total: Number(row.total),
    paidOn: row.paid_on ?? undefined,
  };
}
