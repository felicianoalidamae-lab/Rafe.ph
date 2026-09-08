"use client";

import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from "react";
import type {
  AuthUser,
  Role,
  Product,
  RawMaterial,
  FinishedGood,
  RecipeItem,
  InventoryMovement,
  Order,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  Expense,
  Staff,
  PayrollRun,
} from "./types";
import {
  products as initialProducts,
  rawMaterials as initialRawMaterials,
  finishedGoods as initialFinishedGoods,
  recipes as initialRecipes,
  inventoryMovements as initialMovements,
  orders as initialOrders,
  expenses as initialExpenses,
  staff as initialStaff,
  payrollRuns as initialPayrollRuns,
} from "./mockData";

const DEMO_USERS: Record<string, AuthUser & { password: string }> = {
  "owner@rafe.ph": {
    id: "u-owner",
    name: "Rafe (Owner)",
    email: "owner@rafe.ph",
    role: "owner",
    password: "demo123",
  },
  "staff@rafe.ph": {
    id: "u-staff",
    name: "Ana Dizon",
    email: "staff@rafe.ph",
    role: "staff",
    password: "demo123",
  },
};

interface StoreState {
  user: AuthUser | null;
  hydrated: boolean;
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

interface StoreActions {
  login: (email: string, password: string) => { ok: boolean; error?: string };
  loginAs: (role: Role) => void;
  logout: () => void;
  restockRawMaterial: (rawMaterialId: string, quantity: number, cost: number, createAsExpense: boolean) => void;
  produceFinishedGoods: (productId: string, quantity: number) => { ok: boolean; warning?: string };
  adjustStock: (
    itemType: "raw_material" | "finished_good",
    itemId: string,
    direction: "in" | "out",
    quantity: number,
    reason: string
  ) => void;
  addOrder: (order: Omit<Order, "id" | "createdBy">) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updateOrderPayment: (orderId: string, paymentStatus: PaymentStatus, amountPaid: number, paymentMethod: PaymentMethod) => void;
  addExpense: (expense: Omit<Expense, "id">) => void;
  addStaff: (s: Omit<Staff, "id">) => void;
  markPayrollPaid: (payrollRunId: string, paidOn: string) => void;
  addPayrollRun: (run: Omit<PayrollRun, "id" | "total">) => void;
}

type Store = StoreState & StoreActions;

const StoreContext = createContext<Store | null>(null);

let idCounter = 2000;
function nextId(prefix: string) {
  idCounter += 1;
  return `${prefix}${idCounter}`;
}

const SESSION_KEY = "rafe-ph-demo-session";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore of a demo session from browser storage on mount
      if (saved) setUser(JSON.parse(saved));
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      else localStorage.removeItem(SESSION_KEY);
    } catch {
      // ignore
    }
  }, [user, hydrated]);

  const [products] = useState<Product[]>(initialProducts);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>(initialRawMaterials);
  const [finishedGoods, setFinishedGoods] = useState<FinishedGood[]>(initialFinishedGoods);
  const [recipes] = useState<Record<string, RecipeItem[]>>(initialRecipes);
  const [movements, setMovements] = useState<InventoryMovement[]>(initialMovements);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [staff, setStaff] = useState<Staff[]>(initialStaff);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>(initialPayrollRuns);

  const login = useCallback((email: string, password: string) => {
    const record = DEMO_USERS[email.trim().toLowerCase()];
    if (!record || record.password !== password) {
      return { ok: false, error: "Invalid email or password." };
    }
    setUser({ id: record.id, name: record.name, email: record.email, role: record.role });
    return { ok: true };
  }, []);

  const loginAs = useCallback((role: Role) => {
    const record = role === "owner" ? DEMO_USERS["owner@rafe.ph"] : DEMO_USERS["staff@rafe.ph"];
    setUser({ id: record.id, name: record.name, email: record.email, role: record.role });
  }, []);

  const logout = useCallback(() => setUser(null), []);

  const actorName = user?.name ?? "Unknown";

  const restockRawMaterial = useCallback(
    (rawMaterialId: string, quantity: number, cost: number, createAsExpense: boolean) => {
      setRawMaterials((prev) =>
        prev.map((rm) => (rm.id === rawMaterialId ? { ...rm, quantityOnHand: rm.quantityOnHand + quantity } : rm))
      );
      const movementId = nextId("im");
      setMovements((prev) => [
        {
          id: movementId,
          itemType: "raw_material",
          itemId: rawMaterialId,
          direction: "in",
          quantity,
          reason: "Restock",
          createdBy: actorName,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      if (createAsExpense) {
        const rm = rawMaterials.find((r) => r.id === rawMaterialId);
        setExpenses((prev) => [
          {
            id: nextId("e"),
            date: new Date().toISOString().slice(0, 10),
            category: "Materials",
            amount: cost,
            description: `Restock: ${rm?.name ?? rawMaterialId} (${quantity} ${rm?.unit ?? ""})`,
            supplier: rm?.supplier,
            linkedRestockId: movementId,
          },
          ...prev,
        ]);
      }
    },
    [actorName, rawMaterials]
  );

  const produceFinishedGoods = useCallback(
    (productId: string, quantity: number) => {
      const recipe = recipes[productId];
      let warning: string | undefined;
      if (recipe && recipe.length > 0) {
        for (const item of recipe) {
          const rm = rawMaterials.find((r) => r.id === item.rawMaterialId);
          const needed = item.quantityPerUnit * quantity;
          if (rm && rm.quantityOnHand < needed) {
            warning = `Not enough ${rm.name} on hand (need ${needed}${rm.unit}, have ${rm.quantityOnHand}${rm.unit}). Proceeding anyway.`;
          }
        }
        setRawMaterials((prev) =>
          prev.map((rm) => {
            const item = recipe.find((r) => r.rawMaterialId === rm.id);
            if (!item) return rm;
            return { ...rm, quantityOnHand: rm.quantityOnHand - item.quantityPerUnit * quantity };
          })
        );
        setMovements((prev) => [
          ...recipe.map((item) => ({
            id: nextId("im"),
            itemType: "raw_material" as const,
            itemId: item.rawMaterialId,
            direction: "out" as const,
            quantity: item.quantityPerUnit * quantity,
            reason: `Production use - ${productId}`,
            createdBy: actorName,
            createdAt: new Date().toISOString(),
          })),
          ...prev,
        ]);
      }
      setFinishedGoods((prev) =>
        prev.map((fg) => (fg.productId === productId ? { ...fg, quantityOnHand: fg.quantityOnHand + quantity } : fg))
      );
      setMovements((prev) => [
        {
          id: nextId("im"),
          itemType: "finished_good",
          itemId: productId,
          direction: "in",
          quantity,
          reason: "Production run",
          createdBy: actorName,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      return { ok: true, warning };
    },
    [recipes, rawMaterials, actorName]
  );

  const adjustStock = useCallback(
    (
      itemType: "raw_material" | "finished_good",
      itemId: string,
      direction: "in" | "out",
      quantity: number,
      reason: string
    ) => {
      const delta = direction === "in" ? quantity : -quantity;
      if (itemType === "raw_material") {
        setRawMaterials((prev) =>
          prev.map((rm) => (rm.id === itemId ? { ...rm, quantityOnHand: rm.quantityOnHand + delta } : rm))
        );
      } else {
        setFinishedGoods((prev) =>
          prev.map((fg) => (fg.productId === itemId ? { ...fg, quantityOnHand: fg.quantityOnHand + delta } : fg))
        );
      }
      setMovements((prev) => [
        {
          id: nextId("im"),
          itemType,
          itemId,
          direction,
          quantity,
          reason,
          createdBy: actorName,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    },
    [actorName]
  );

  const addOrder = useCallback(
    (order: Omit<Order, "id" | "createdBy">) => {
      setOrders((prev) => [{ ...order, id: nextId("o"), createdBy: actorName }, ...prev]);
    },
    [actorName]
  );

  const updateOrderStatus = useCallback(
    (orderId: string, status: OrderStatus) => {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
      if (status === "Completed" || status === "Delivered") {
        const order = orders.find((o) => o.id === orderId);
        if (order) {
          setFinishedGoods((prev) =>
            prev.map((fg) => {
              const item = order.items.find((i) => i.productId === fg.productId);
              if (!item) return fg;
              return { ...fg, quantityOnHand: Math.max(0, fg.quantityOnHand - item.quantity) };
            })
          );
          setMovements((prev) => [
            ...order.items.map((item) => ({
              id: nextId("im"),
              itemType: "finished_good" as const,
              itemId: item.productId,
              direction: "out" as const,
              quantity: item.quantity,
              reason: `Order ${orderId} fulfilled`,
              relatedOrderId: orderId,
              createdBy: actorName,
              createdAt: new Date().toISOString(),
            })),
            ...prev,
          ]);
        }
      }
    },
    [orders, actorName]
  );

  const updateOrderPayment = useCallback(
    (orderId: string, paymentStatus: PaymentStatus, amountPaid: number, paymentMethod: PaymentMethod) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, paymentStatus, amountPaid, paymentMethod } : o))
      );
    },
    []
  );

  const addExpense = useCallback((expense: Omit<Expense, "id">) => {
    setExpenses((prev) => [{ ...expense, id: nextId("e") }, ...prev]);
  }, []);

  const addStaffMember = useCallback((s: Omit<Staff, "id">) => {
    setStaff((prev) => [...prev, { ...s, id: nextId("s") }]);
  }, []);

  const markPayrollPaid = useCallback((payrollRunId: string, paidOn: string) => {
    setPayrollRuns((prev) => prev.map((pr) => (pr.id === payrollRunId ? { ...pr, paidOn } : pr)));
    const run = payrollRuns.find((p) => p.id === payrollRunId);
    const member = staff.find((s) => s.id === run?.staffId);
    if (run) {
      setExpenses((prev) => [
        {
          id: nextId("e"),
          date: paidOn,
          category: "Payroll",
          amount: run.total,
          description: `Payroll: ${member?.name ?? run.staffId} (${run.periodStart} to ${run.periodEnd})`,
        },
        ...prev,
      ]);
    }
  }, [payrollRuns, staff]);

  const addPayrollRun = useCallback((run: Omit<PayrollRun, "id" | "total">) => {
    const total = run.baseAmount + run.bonus - run.deduction;
    setPayrollRuns((prev) => [...prev, { ...run, id: nextId("pr"), total }]);
  }, []);

  const value = useMemo<Store>(
    () => ({
      user,
      hydrated,
      products,
      rawMaterials,
      finishedGoods,
      recipes,
      movements,
      orders,
      expenses,
      staff,
      payrollRuns,
      login,
      loginAs,
      logout,
      restockRawMaterial,
      produceFinishedGoods,
      adjustStock,
      addOrder,
      updateOrderStatus,
      updateOrderPayment,
      addExpense,
      addStaff: addStaffMember,
      markPayrollPaid,
      addPayrollRun,
    }),
    [
      user,
      hydrated,
      products,
      rawMaterials,
      finishedGoods,
      recipes,
      movements,
      orders,
      expenses,
      staff,
      payrollRuns,
      login,
      loginAs,
      logout,
      restockRawMaterial,
      produceFinishedGoods,
      adjustStock,
      addOrder,
      updateOrderStatus,
      updateOrderPayment,
      addExpense,
      addStaffMember,
      markPayrollPaid,
      addPayrollRun,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
