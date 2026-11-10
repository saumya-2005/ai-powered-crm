// Shared colors, lists and Tailwind class strings used across the app

export const SOURCES = ["Website", "LinkedIn", "Referral", "Cold Call", "Event", "Email Campaign", "Other"];

export const STATUS_STYLES: Record<string, string> = {
  New: "bg-sky-100 text-sky-700",
  Contacted: "bg-violet-100 text-violet-700",
  Interested: "bg-amber-100 text-amber-700",
  Negotiation: "bg-orange-100 text-orange-700",
  Converted: "bg-emerald-100 text-emerald-700",
  Lost: "bg-rose-100 text-rose-700",
};

export const STATUS_HEX: Record<string, string> = {
  New: "#0ea5e9",
  Contacted: "#8b5cf6",
  Interested: "#f59e0b",
  Negotiation: "#f97316",
  Converted: "#10b981",
  Lost: "#f43f5e",
};

export const PRIORITY_STYLES: Record<string, string> = {
  Low: "bg-slate-100 text-slate-600",
  Medium: "bg-blue-100 text-blue-700",
  High: "bg-red-100 text-red-700",
};

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50";
export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50";
export const btnDanger =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50";
export const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";
export const cardCls = "rounded-xl border border-slate-200 bg-white shadow-sm";
