"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  ownerOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "▦" },
  { href: "/orders", label: "Orders", icon: "🧾" },
  { href: "/inventory", label: "Inventory", icon: "📦" },
  { href: "/products", label: "Products & Recipes", icon: "🧴" },
  { href: "/expenses", label: "Expenses", icon: "💸", ownerOnly: true },
  { href: "/payroll", label: "Payroll", icon: "👥", ownerOnly: true },
  { href: "/reports", label: "Reports", icon: "📊", ownerOnly: true },
];

export function Sidebar() {
  const { user } = useStore();
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-60 shrink-0 flex-col border-r border-black/10 bg-white">
      <div className="px-5 py-5 border-b border-black/10">
        <div className="font-semibold text-lg tracking-tight">Rafe.ph</div>
        <div className="text-xs text-black/50">Business Manager</div>
      </div>
      <nav className="flex-1 py-3">
        {NAV_ITEMS.map((item) => {
          if (item.ownerOnly && user?.role !== "owner") return null;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-black/5 text-black font-medium border-r-2 border-black"
                  : "text-black/60 hover:bg-black/5 hover:text-black"
              }`}
            >
              <span className="w-5 text-center">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-4 text-[11px] leading-relaxed text-black/40 border-t border-black/10">
        Demo mode — data resets on reload.
      </div>
    </aside>
  );
}
