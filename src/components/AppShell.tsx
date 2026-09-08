"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

const OWNER_ONLY_PREFIXES = ["/expenses", "/payroll", "/reports", "/users"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, hydrated, dataLoading, dataError, refresh } = useStore();
  const pathname = usePathname();
  const router = useRouter();

  const isLoginRoute = pathname === "/login";

  useEffect(() => {
    if (!hydrated) return;
    if (pathname === "/") {
      router.replace(user ? "/dashboard" : "/login");
      return;
    }
    if (!user && !isLoginRoute) {
      router.replace("/login");
    }
    if (user && isLoginRoute) {
      router.replace("/dashboard");
    }
  }, [user, hydrated, pathname, isLoginRoute, router]);

  if (!hydrated || pathname === "/") {
    return null;
  }

  if (!user) {
    return <>{children}</>;
  }

  const restricted = user.role === "staff" && OWNER_ONLY_PREFIXES.some((p) => pathname.startsWith(p));

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto">
          {dataError ? (
            <div className="rounded-lg border border-red-300 bg-red-50 text-red-900 p-6">
              <h2 className="font-semibold text-lg mb-1">Couldn&apos;t load data from Supabase</h2>
              <p className="text-sm mb-3">{dataError}</p>
              <p className="text-sm mb-4 text-red-800/80">
                Make sure <code className="bg-red-100 px-1 rounded">supabase/schema.sql</code> has been run in
                your Supabase project&apos;s SQL Editor, and that <code className="bg-red-100 px-1 rounded">SUPABASE_URL</code>{" "}
                / <code className="bg-red-100 px-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code> are set correctly.
              </p>
              <button
                onClick={() => void refresh()}
                className="text-sm rounded-md border border-red-300 px-3 py-1.5 hover:bg-red-100 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : dataLoading ? (
            <div className="text-sm text-black/40 py-12 text-center">Loading data from Supabase...</div>
          ) : restricted ? (
            <div className="rounded-lg border border-amber-300 bg-amber-50 text-amber-900 p-6">
              <h2 className="font-semibold text-lg mb-1">Access restricted</h2>
              <p className="text-sm">
                This section is only available to Owner/Admin accounts. Staff accounts can access
                Orders and Inventory.
              </p>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
