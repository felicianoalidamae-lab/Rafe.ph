"use client";

import { useEffect, useRef } from "react";

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-xl border border-black/10 p-5 ${className}`}>{children}</div>;
}

export function KpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <div className="text-xs font-medium text-black/50">{label}</div>
      <div className="text-2xl font-semibold mt-1 tracking-tight">{value}</div>
      {hint && <div className="text-xs text-black/40 mt-1">{hint}</div>}
    </Card>
  );
}

const BADGE_COLORS: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-800",
  "In Production": "bg-blue-100 text-blue-800",
  Ready: "bg-violet-100 text-violet-800",
  Completed: "bg-emerald-100 text-emerald-800",
  Delivered: "bg-emerald-100 text-emerald-800",
  Cancelled: "bg-red-100 text-red-700",
  Unpaid: "bg-red-100 text-red-700",
  "Partially Paid": "bg-amber-100 text-amber-800",
  Paid: "bg-emerald-100 text-emerald-800",
};

export function Badge({ text }: { text: string }) {
  const color = BADGE_COLORS[text] ?? "bg-black/5 text-black/70";
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>{text}</span>;
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-black/50 mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  type = "button",
  className = "",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  type?: "button" | "submit";
  className?: string;
  disabled?: boolean;
}) {
  const base = "rounded-md text-sm font-medium px-3.5 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const variants: Record<string, string> = {
    primary: "bg-black text-white hover:bg-black/85",
    secondary: "border border-black/15 hover:bg-black/5",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "hover:bg-black/5",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        ref={ref}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl border border-black/10 w-full max-w-lg max-h-[85vh] overflow-y-auto p-6 shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-black/40 hover:text-black text-xl leading-none">
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-black/60 mb-1">{label}</label>
      {children}
    </div>
  );
}

export const inputClass =
  "w-full rounded-md border border-black/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20";
