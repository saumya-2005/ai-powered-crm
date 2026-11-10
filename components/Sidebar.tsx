"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/", label: "Dashboard", icon: "▦" },
  { href: "/leads", label: "Leads", icon: "☰" },
  { href: "/pipeline", label: "Pipeline", icon: "◫" },
{ href: "/follow-ups", label: "Follow-ups", icon: "☑" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false); // mobile menu open or closed

  // A link is active when the path matches (Dashboard only matches "/")
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const nav = (
    <nav className="flex flex-col gap-1">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          onClick={() => setOpen(false)}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
            isActive(l.href) ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
          }`}
        >
          <span className="w-5 text-center" aria-hidden>{l.icon}</span>
          {l.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-8 bg-slate-900 p-4 md:flex">
        <div className="px-3 pt-2 text-lg font-semibold tracking-tight text-white">AI CRM</div>
        {nav}
        <p className="mt-auto px-3 text-xs text-slate-500">Leads, pipeline and follow-ups in one place</p>
      </aside>

      {/* Mobile top bar with a dropdown menu */}
      <header className="sticky top-0 z-30 bg-slate-900 md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-lg font-semibold text-white">AI CRM</span>
          <button
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            aria-expanded={open}
            className="rounded-lg px-3 py-1.5 text-xl text-white hover:bg-slate-800"
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
        {open && <div className="border-t border-slate-800 p-3">{nav}</div>}
      </header>
    </>
  );
}
