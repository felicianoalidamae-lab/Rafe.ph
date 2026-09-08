"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

export default function LoginPage() {
  const { login, loginAs } = useStore();
  const router = useRouter();
  const [email, setEmail] = useState("owner@rafe.ph");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = login(email, password);
    if (result.ok) {
      router.replace("/dashboard");
    } else {
      setError(result.error ?? "Login failed.");
    }
  }

  function quickLogin(role: "owner" | "staff") {
    loginAs(role);
    router.replace("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-2xl font-semibold tracking-tight">Rafe.ph</div>
          <div className="text-sm text-black/50 mt-1">Business Manager — Demo</div>
        </div>

        <div className="bg-white rounded-xl border border-black/10 p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-black/60 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-black/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-black/60 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-black/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              className="w-full rounded-md bg-black text-white text-sm font-medium py-2 hover:bg-black/85 transition-colors"
            >
              Log in
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-black/40">
            <div className="flex-1 h-px bg-black/10" />
            quick demo login
            <div className="flex-1 h-px bg-black/10" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => quickLogin("owner")}
              className="rounded-md border border-black/15 py-2 text-sm font-medium hover:bg-black/5 transition-colors"
            >
              Owner view
            </button>
            <button
              onClick={() => quickLogin("staff")}
              className="rounded-md border border-black/15 py-2 text-sm font-medium hover:bg-black/5 transition-colors"
            >
              Staff view
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-black/40 mt-5">
          Demo credentials: owner@rafe.ph / staff@rafe.ph, password demo123
        </p>
      </div>
    </div>
  );
}
