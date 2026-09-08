export type Role = "owner" | "staff";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export type ProductCategory = "Candle" | "Plaster Vessel" | "Plaster Figure";

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  sku: string;
  basePrice: number;
  isActive: boolean;
  notes?: string;
}

export interface RecipeItem {
  rawMaterialId: string;
  quantityPerUnit: number;
}

export interface RawMaterial {
  id: string;
  name: string;
  unit: string;
  quantityOnHand: number;
  reorderThreshold: number;
  costPerUnit: number;
  supplier?: string;
}

export interface FinishedGood {
  productId: string;
  quantityOnHand: number;
  reorderThreshold: number;
}

export type MovementItemType = "raw_material" | "finished_good";
export type MovementDirection = "in" | "out";

export interface InventoryMovement {
  id: string;
  itemType: MovementItemType;
  itemId: string;
  direction: MovementDirection;
  quantity: number;
  reason: string;
  relatedOrderId?: string;
  createdBy: string;
  createdAt: string;
}

export type OrderStatus =
  | "Pending"
  | "In Production"
  | "Ready"
  | "Completed"
  | "Delivered"
  | "Cancelled";

export type PaymentStatus = "Unpaid" | "Partially Paid" | "Paid";
export type PaymentMethod = "Cash" | "GCash" | "Bank Transfer" | "Other";

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  customizationNotes?: string;
}

export interface Order {
  id: string;
  customerName: string;
  contact?: string;
  source: string;
  orderDate: string;
  dueDate: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  items: OrderItem[];
  createdBy: string;
}

export type ExpenseCategory =
  | "Materials"
  | "Packaging"
  | "Shipping"
  | "Rent"
  | "Utilities"
  | "Marketing"
  | "Tools/Equipment"
  | "Payroll"
  | "Other";

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  supplier?: string;
  linkedRestockId?: string;
}

export type PayType = "Fixed Salary" | "Hourly" | "Per-piece";

export interface Staff {
  id: string;
  name: string;
  position: string;
  payType: PayType;
  rate: number;
  active: boolean;
}

export interface PayrollRun {
  id: string;
  staffId: string;
  periodStart: string;
  periodEnd: string;
  baseAmount: number;
  bonus: number;
  deduction: number;
  total: number;
  paidOn?: string;
}
