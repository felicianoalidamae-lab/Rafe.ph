"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader, Card, Badge } from "@/components/ui";
import { peso } from "@/lib/format";

export default function ProductsPage() {
  const { products, rawMaterials, recipes, user } = useStore();
  const [expandedId, setExpandedId] = useState<string | null>(products[0]?.id ?? null);

  return (
    <div>
      <PageHeader
        title="Products & Recipes"
        description={
          user?.role === "owner"
            ? "Product catalog and bill of materials (BOM) for each item."
            : "Product catalog and recipes (view only)."
        }
      />

      <div className="grid md:grid-cols-2 gap-4">
        {products.map((product) => {
          const recipe = recipes[product.id];
          const expanded = expandedId === product.id;
          return (
            <Card key={product.id}>
              <div
                className="flex items-start justify-between cursor-pointer"
                onClick={() => setExpandedId(expanded ? null : product.id)}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{product.name}</span>
                    {!product.isActive && <Badge text="Cancelled" />}
                  </div>
                  <div className="text-xs text-black/50 mt-0.5">
                    {product.category} · SKU {product.sku}
                  </div>
                  {product.notes && <div className="text-xs text-black/40 mt-1">{product.notes}</div>}
                </div>
                <div className="text-right shrink-0">
                  <div className="font-medium">{peso(product.basePrice)}</div>
                  <div className="text-xs text-black/40 mt-1">{expanded ? "Hide BOM ▲" : "View BOM ▼"}</div>
                </div>
              </div>

              {expanded && (
                <div className="mt-4 pt-4 border-t border-black/10">
                  {!recipe || recipe.length === 0 ? (
                    <p className="text-sm text-black/40">
                      No recipe defined — this product won&apos;t auto-deduct raw materials on production.
                    </p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-black/40">
                          <th className="pb-2 font-normal">Raw material</th>
                          <th className="pb-2 font-normal text-right">Qty / unit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recipe.map((item) => {
                          const rm = rawMaterials.find((r) => r.id === item.rawMaterialId);
                          return (
                            <tr key={item.rawMaterialId} className="border-t border-black/5">
                              <td className="py-1.5">{rm?.name ?? item.rawMaterialId}</td>
                              <td className="py-1.5 text-right">
                                {item.quantityPerUnit}
                                {rm?.unit}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
