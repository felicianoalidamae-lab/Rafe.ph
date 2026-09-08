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
  PayType,
  PayrollRun,
} from "./types";
import * as actions from "./actions";

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
  dataLoading: boolean;
  dataError: string | null;
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
  refresh: () => Promise<void>;
  restockRawMaterial: (rawMaterialId: string, quantity: number, cost: number, createAsExpense: boolean) => Promise<void>;
  produceFinishedGoods: (productId: string, quantity: number) => Promise<{ ok: boolean; warning?: string }>;
  adjustStock: (
    itemType: "raw_material" | "finished_good",
    itemId: string,
    direction: "in" | "out",
    quantity: number,
    reason: string
  ) => Promise<void>;
  addOrder: (order: Omit<Order, "id" | "createdBy">) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  updateOrderPayment: (orderId: string, paymentStatus: PaymentStatus, amountPaid: number, paymentMethod: PaymentMethod) => Promise<void>;
  addExpense: (expense: Omit<Expense, "id">) => Promise<void>;
  addStaff: (s: { name: string; position: string; payType: PayType; rate: number; active: boolean }) => Promise<void>;
  markPayrollPaid: (payrollRunId: string, paidOn: string) => Promise<void>;
  addPayrollRun: (run: { staffId: string; periodStart: string; periodEnd: string; baseAmount: number; bonus: number; deduction: number }) => Promise<void>;
}

type Store = StoreState & StoreActions;

const StoreContext = createContext<Store | null>(null);

const SESSION_KEY = "rafe-ph-demo-session";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [finishedGoods, setFinishedGoods] = useState<FinishedGood[]>([]);
  const [recipes, setRecipes] = useState<Record<string, RecipeItem[]>>({});
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setDataLoading(true);
    setDataError(null);
    try {
      const all = await actions.getAllData();
      setProducts(all.products);
      setRawMaterials(all.rawMaterials);
      setFinishedGoods(all.finishedGoods);
      setRecipes(all.recipes);
      setMovements(all.movements);
      setOrders(all.orders);
      setExpenses(all.expenses);
      setStaff(all.staff);
      setPayrollRuns(all.payrollRuns);
    } catch (err) {
      setDataError(err instanceof Error ? err.message : "Failed to load data from Supabase.");
    } finally {
      setDataLoading(false);
    }
  }, []);

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

  useEffect(() => {
    if (!hydrated || !user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch Supabase data once a session exists
    void refresh();
  }, [hydrated, user, refresh]);

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
    async (rawMaterialId: string, quantity: number, cost: number, createAsExpense: boolean) => {
      const { movement, expense } = await actions.restockRawMaterial(rawMaterialId, quantity, cost, createAsExpense, actorName);
      setRawMaterials((prev) =>
        prev.map((rm) => (rm.id === rawMaterialId ? { ...rm, quantityOnHand: rm.quantityOnHand + quantity } : rm))
      );
      setMovements((prev) => [movement, ...prev]);
      if (expense) setExpenses((prev) => [expense, ...prev]);
    },
    [actorName]
  );

  const produceFinishedGoods = useCallback(
    async (productId: string, quantity: number) => {
      const result = await actions.produceFinishedGoods(productId, quantity, actorName);
      setRawMaterials((prev) =>
        prev.map((rm) => result.rawMaterials.find((u) => u.id === rm.id) ?? rm)
      );
      setFinishedGoods((prev) => prev.map((fg) => (fg.productId === productId ? result.finishedGood : fg)));
      setMovements((prev) => [...result.movements, ...prev]);
      return { ok: true, warning: result.warning };
    },
    [actorName]
  );

  const adjustStock = useCallback(
    async (
      itemType: "raw_material" | "finished_good",
      itemId: string,
      direction: "in" | "out",
      quantity: number,
      reason: string
    ) => {
      const result = await actions.adjustStock(itemType, itemId, direction, quantity, reason, actorName);
      if (result.rawMaterial) {
        const updated = result.rawMaterial;
        setRawMaterials((prev) => prev.map((rm) => (rm.id === itemId ? updated : rm)));
      }
      if (result.finishedGood) {
        const updated = result.finishedGood;
        setFinishedGoods((prev) => prev.map((fg) => (fg.productId === itemId ? updated : fg)));
      }
      setMovements((prev) => [result.movement, ...prev]);
    },
    [actorName]
  );

  const addOrder = useCallback(
    async (order: Omit<Order, "id" | "createdBy">) => {
      const created = await actions.addOrder(order, actorName);
      setOrders((prev) => [created, ...prev]);
    },
    [actorName]
  );

  const updateOrderStatus = useCallback(
    async (orderId: string, status: OrderStatus) => {
      const result = await actions.updateOrderStatus(orderId, status, actorName);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? result.order : o)));
      if (result.finishedGoods.length > 0) {
        setFinishedGoods((prev) =>
          prev.map((fg) => result.finishedGoods.find((u) => u.productId === fg.productId) ?? fg)
        );
      }
      if (result.movements.length > 0) {
        setMovements((prev) => [...result.movements, ...prev]);
      }
    },
    [actorName]
  );

  const updateOrderPayment = useCallback(
    async (orderId: string, paymentStatus: PaymentStatus, amountPaid: number, paymentMethod: PaymentMethod) => {
      const updated = await actions.updateOrderPayment(orderId, paymentStatus, amountPaid, paymentMethod);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    },
    []
  );

  const addExpense = useCallback(async (expense: Omit<Expense, "id">) => {
    const created = await actions.addExpense(expense);
    setExpenses((prev) => [created, ...prev]);
  }, []);

  const addStaffMember = useCallback(
    async (s: { name: string; position: string; payType: PayType; rate: number; active: boolean }) => {
      const created = await actions.addStaff(s);
      setStaff((prev) => [...prev, created]);
    },
    []
  );

  const markPayrollPaid = useCallback(async (payrollRunId: string, paidOn: string) => {
    const { run, expense } = await actions.markPayrollPaid(payrollRunId, paidOn);
    setPayrollRuns((prev) => prev.map((pr) => (pr.id === payrollRunId ? run : pr)));
    setExpenses((prev) => [expense, ...prev]);
  }, []);

  const addPayrollRun = useCallback(
    async (run: { staffId: string; periodStart: string; periodEnd: string; baseAmount: number; bonus: number; deduction: number }) => {
      const created = await actions.addPayrollRun(run);
      setPayrollRuns((prev) => [...prev, created]);
    },
    []
  );

  const value = useMemo<Store>(
    () => ({
      user,
      hydrated,
      dataLoading,
      dataError,
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
      refresh,
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
      dataLoading,
      dataError,
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
      refresh,
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
