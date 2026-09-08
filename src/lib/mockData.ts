import type {
  Product,
  RawMaterial,
  FinishedGood,
  RecipeItem,
  InventoryMovement,
  Order,
  Expense,
  Staff,
  PayrollRun,
} from "./types";

export const products: Product[] = [
  {
    id: "p1",
    name: "Candle - Medium Jar",
    category: "Candle",
    sku: "CND-MED-001",
    basePrice: 350,
    isActive: true,
    notes: "Scent & color customizable",
  },
  {
    id: "p2",
    name: "Candle - Small Tin",
    category: "Candle",
    sku: "CND-TIN-002",
    basePrice: 180,
    isActive: true,
  },
  {
    id: "p3",
    name: "Plaster Vessel - Round Bowl",
    category: "Plaster Vessel",
    sku: "PVS-BWL-001",
    basePrice: 420,
    isActive: true,
  },
  {
    id: "p4",
    name: "Plaster Figure - Cat",
    category: "Plaster Figure",
    sku: "PFG-CAT-001",
    basePrice: 250,
    isActive: true,
    notes: "Engraving/name available",
  },
  {
    id: "p5",
    name: "Plaster Figure - Angel",
    category: "Plaster Figure",
    sku: "PFG-ANG-001",
    basePrice: 300,
    isActive: false,
    notes: "Seasonal item",
  },
];

export const rawMaterials: RawMaterial[] = [
  { id: "rm1", name: "Soy Wax", unit: "g", quantityOnHand: 8000, reorderThreshold: 2000, costPerUnit: 0.35, supplier: "WaxCo PH" },
  { id: "rm2", name: "Cotton Wick", unit: "pc", quantityOnHand: 120, reorderThreshold: 40, costPerUnit: 6, supplier: "WaxCo PH" },
  { id: "rm3", name: "Fragrance Oil", unit: "ml", quantityOnHand: 900, reorderThreshold: 300, costPerUnit: 2.5, supplier: "Scent Supply Co" },
  { id: "rm4", name: "Glass Jar (Medium)", unit: "pc", quantityOnHand: 60, reorderThreshold: 20, costPerUnit: 25, supplier: "PackRight" },
  { id: "rm5", name: "Tin Container", unit: "pc", quantityOnHand: 15, reorderThreshold: 25, costPerUnit: 15, supplier: "PackRight" },
  { id: "rm6", name: "Plaster of Paris", unit: "g", quantityOnHand: 15000, reorderThreshold: 4000, costPerUnit: 0.08, supplier: "CraftMix Supplies" },
  { id: "rm7", name: "Mold - Round Bowl", unit: "use", quantityOnHand: 500, reorderThreshold: 50, costPerUnit: 0.5, supplier: "CraftMix Supplies" },
  { id: "rm8", name: "Mold - Cat Figure", unit: "use", quantityOnHand: 500, reorderThreshold: 50, costPerUnit: 0.3, supplier: "CraftMix Supplies" },
  { id: "rm9", name: "Acrylic Paint (assorted)", unit: "ml", quantityOnHand: 400, reorderThreshold: 200, costPerUnit: 1.2, supplier: "ArtHub" },
  { id: "rm10", name: "Packaging Box (small)", unit: "pc", quantityOnHand: 8, reorderThreshold: 30, costPerUnit: 12, supplier: "PackRight" },
];

export const recipes: Record<string, RecipeItem[]> = {
  p1: [
    { rawMaterialId: "rm1", quantityPerUnit: 200 },
    { rawMaterialId: "rm2", quantityPerUnit: 1 },
    { rawMaterialId: "rm3", quantityPerUnit: 10 },
    { rawMaterialId: "rm4", quantityPerUnit: 1 },
  ],
  p2: [
    { rawMaterialId: "rm1", quantityPerUnit: 90 },
    { rawMaterialId: "rm2", quantityPerUnit: 1 },
    { rawMaterialId: "rm3", quantityPerUnit: 4 },
    { rawMaterialId: "rm5", quantityPerUnit: 1 },
  ],
  p3: [
    { rawMaterialId: "rm6", quantityPerUnit: 600 },
    { rawMaterialId: "rm7", quantityPerUnit: 1 },
    { rawMaterialId: "rm9", quantityPerUnit: 5 },
  ],
  p4: [
    { rawMaterialId: "rm6", quantityPerUnit: 250 },
    { rawMaterialId: "rm8", quantityPerUnit: 1 },
    { rawMaterialId: "rm9", quantityPerUnit: 8 },
  ],
  // p5 intentionally has no recipe (deferred/seasonal item)
};

export const finishedGoods: FinishedGood[] = [
  { productId: "p1", quantityOnHand: 18, reorderThreshold: 10 },
  { productId: "p2", quantityOnHand: 32, reorderThreshold: 15 },
  { productId: "p3", quantityOnHand: 6, reorderThreshold: 8 },
  { productId: "p4", quantityOnHand: 14, reorderThreshold: 10 },
  { productId: "p5", quantityOnHand: 0, reorderThreshold: 5 },
];

export const inventoryMovements: InventoryMovement[] = [
  { id: "im1", itemType: "raw_material", itemId: "rm1", direction: "in", quantity: 5000, reason: "Restock from WaxCo PH", createdBy: "Owner", createdAt: "2026-08-20T09:00:00Z" },
  { id: "im2", itemType: "finished_good", itemId: "p1", direction: "in", quantity: 20, reason: "Production run", createdBy: "Staff - Ana", createdAt: "2026-08-22T14:00:00Z" },
  { id: "im3", itemType: "finished_good", itemId: "p1", direction: "out", quantity: 2, reason: "Breakage during packing", createdBy: "Staff - Ana", createdAt: "2026-08-25T11:30:00Z" },
  { id: "im4", itemType: "raw_material", itemId: "rm5", direction: "out", quantity: 10, reason: "Production use - Candle Small Tin", createdBy: "Staff - Jun", createdAt: "2026-09-01T10:15:00Z" },
];

const today = new Date("2026-09-08T00:00:00Z");
function daysAgo(n: number) {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
function daysFromNow(n: number) {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export const orders: Order[] = [
  {
    id: "o1001",
    customerName: "Mika Reyes",
    contact: "0917 123 4567",
    source: "Instagram",
    orderDate: daysAgo(6),
    dueDate: daysAgo(1),
    status: "Delivered",
    paymentStatus: "Paid",
    amountPaid: 700,
    paymentMethod: "GCash",
    items: [{ id: "oi1", productId: "p1", quantity: 2, unitPrice: 350, customizationNotes: "Lavender scent" }],
    createdBy: "Staff - Ana",
  },
  {
    id: "o1002",
    customerName: "Carlo Santos",
    contact: "0918 555 2211",
    source: "Facebook",
    orderDate: daysAgo(5),
    dueDate: daysAgo(0),
    status: "Ready",
    paymentStatus: "Partially Paid",
    amountPaid: 200,
    paymentMethod: "Cash",
    items: [
      { id: "oi2", productId: "p3", quantity: 1, unitPrice: 420 },
      { id: "oi3", productId: "p4", quantity: 1, unitPrice: 250, customizationNotes: "Engrave 'Milo'" },
    ],
    createdBy: "Staff - Jun",
  },
  {
    id: "o1003",
    customerName: "Bea Lopez",
    contact: "bea.lopez@email.com",
    source: "Shopee",
    orderDate: daysAgo(3),
    dueDate: daysFromNow(2),
    status: "In Production",
    paymentStatus: "Paid",
    amountPaid: 360,
    paymentMethod: "Bank Transfer",
    items: [{ id: "oi4", productId: "p2", quantity: 2, unitPrice: 180 }],
    createdBy: "Staff - Ana",
  },
  {
    id: "o1004",
    customerName: "Walk-in Customer",
    source: "Walk-in",
    orderDate: daysAgo(1),
    dueDate: daysFromNow(0),
    status: "Pending",
    paymentStatus: "Unpaid",
    amountPaid: 0,
    paymentMethod: "Cash",
    items: [{ id: "oi5", productId: "p4", quantity: 3, unitPrice: 250 }],
    createdBy: "Staff - Jun",
  },
  {
    id: "o1005",
    customerName: "Trisha Uy",
    contact: "0920 888 4433",
    source: "Instagram",
    orderDate: daysAgo(10),
    dueDate: daysAgo(4),
    status: "Completed",
    paymentStatus: "Paid",
    amountPaid: 1050,
    paymentMethod: "GCash",
    items: [{ id: "oi6", productId: "p1", quantity: 3, unitPrice: 350 }],
    createdBy: "Owner",
  },
  {
    id: "o1006",
    customerName: "Noel Garcia",
    source: "Shopee",
    orderDate: daysAgo(15),
    dueDate: daysAgo(9),
    status: "Cancelled",
    paymentStatus: "Unpaid",
    amountPaid: 0,
    paymentMethod: "Other",
    items: [{ id: "oi7", productId: "p3", quantity: 1, unitPrice: 420 }],
    createdBy: "Staff - Ana",
  },
  {
    id: "o1007",
    customerName: "Grace Fernandez",
    contact: "0917 222 9090",
    source: "Facebook",
    orderDate: daysAgo(20),
    dueDate: daysAgo(14),
    status: "Delivered",
    paymentStatus: "Paid",
    amountPaid: 600,
    paymentMethod: "Cash",
    items: [{ id: "oi8", productId: "p2", quantity: 2, unitPrice: 180 }, { id: "oi9", productId: "p4", quantity: 1, unitPrice: 250 }],
    createdBy: "Staff - Jun",
  },
];

export const expenses: Expense[] = [
  { id: "e1", date: daysAgo(19), category: "Materials", amount: 1750, description: "Soy wax + wicks restock", supplier: "WaxCo PH", linkedRestockId: "im1" },
  { id: "e2", date: daysAgo(17), category: "Packaging", amount: 960, description: "Packaging boxes (80 pcs)", supplier: "PackRight" },
  { id: "e3", date: daysAgo(14), category: "Rent", amount: 8000, description: "Shop space rent - September" },
  { id: "e4", date: daysAgo(12), category: "Utilities", amount: 1450, description: "Electricity bill" },
  { id: "e5", date: daysAgo(9), category: "Marketing", amount: 500, description: "Instagram ad boost" },
  { id: "e6", date: daysAgo(6), category: "Shipping", amount: 320, description: "Courier fees for Shopee orders" },
  { id: "e7", date: daysAgo(3), category: "Tools/Equipment", amount: 2200, description: "New silicone molds" },
];

export const staff: Staff[] = [
  { id: "s1", name: "Ana Dizon", position: "Production Helper", payType: "Fixed Salary", rate: 9000, active: true },
  { id: "s2", name: "Jun Villareal", position: "Packing & Orders", payType: "Hourly", rate: 65, active: true },
  { id: "s3", name: "Mel Torres", position: "Freelance Painter", payType: "Per-piece", rate: 15, active: true },
];

export const payrollRuns: PayrollRun[] = [
  { id: "pr1", staffId: "s1", periodStart: daysAgo(23), periodEnd: daysAgo(9), baseAmount: 4500, bonus: 0, deduction: 0, total: 4500, paidOn: daysAgo(8) },
  { id: "pr2", staffId: "s2", periodStart: daysAgo(23), periodEnd: daysAgo(9), baseAmount: 5200, bonus: 300, deduction: 0, total: 5500, paidOn: daysAgo(8) },
  { id: "pr3", staffId: "s3", periodStart: daysAgo(23), periodEnd: daysAgo(9), baseAmount: 1800, bonus: 0, deduction: 100, total: 1700, paidOn: daysAgo(8) },
  { id: "pr4", staffId: "s1", periodStart: daysAgo(8), periodEnd: daysFromNow(6), baseAmount: 4500, bonus: 0, deduction: 0, total: 4500 },
  { id: "pr5", staffId: "s2", periodStart: daysAgo(8), periodEnd: daysFromNow(6), baseAmount: 4800, bonus: 0, deduction: 0, total: 4800 },
];
