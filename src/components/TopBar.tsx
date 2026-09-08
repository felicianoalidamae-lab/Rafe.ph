"use client";

import { useStore } from "@/lib/store";

export function TopBar() {
  const { user, logout } = useStore();

  return (
    <header className="flex items-center justify-between border-b border-black/10 bg-white px-4 md:px-6 py-3">
      <div className="md:hidden font-semibold">Rafe.ph</div>
      <div className="hidden md:block text-sm text-black/50">
        Signed in as <span className="font-medium text-black/80">{user?.name}</span>{" "}
        <span className="ml-1 rounded-full bg-black/5 px-2 py-0.5 text-xs uppercase tracking-wide">
          {user?.role}
        </span>
      </div>
      <button
        onClick={logout}
        className="text-sm rounded-md border border-black/15 px-3 py-1.5 hover:bg-black/5 transition-colors"
      >
        Log out
      </button>
    </header>
  );
}
