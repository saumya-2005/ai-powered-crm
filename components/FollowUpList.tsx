"use client";

import Link from "next/link";
import type { FollowUp } from "@/lib/types";
import { formatDate, todayStr } from "@/lib/dates";
import { btnDanger } from "@/lib/constants";

type Props = {
  items: FollowUp[];
  onToggle: (item: FollowUp) => void;
  onDelete: (item: FollowUp) => void;
  showLead?: boolean; // show the lead name (used on the main follow-ups page)
};

// List of follow-ups with a checkbox to complete them and an "Overdue" label
export default function FollowUpList({ items, onToggle, onDelete, showLead }: Props) {
  const today = todayStr();

  return (
    <ul className="divide-y divide-slate-100">
      {items.map((f) => {
        const overdue = !f.completed && f.due_date < today;
        const dueToday = !f.completed && f.due_date === today;
        return (
          <li key={f.id} className="flex items-start gap-3 py-3">
            <input
              type="checkbox"
              checked={f.completed}
              onChange={() => onToggle(f)}
              aria-label={`Mark "${f.title}" as completed`}
              className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-indigo-600"
            />
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-medium ${f.completed ? "text-slate-400 line-through" : "text-slate-900"}`}>{f.title}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                {showLead && f.leads && (
                  <Link href={`/leads/${f.lead_id}`} className="text-indigo-600 hover:underline">{f.leads.full_name}</Link>
                )}
                <span>Due {formatDate(f.due_date)}</span>
                {overdue && <span className="rounded-full bg-red-100 px-2 py-0.5 font-medium text-red-700">Overdue</span>}
                {dueToday && <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700">Due today</span>}
                {f.completed && <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-700">Done</span>}
              </div>
            </div>
            <button onClick={() => onDelete(f)} className={btnDanger} aria-label={`Delete ${f.title}`}>Delete</button>
          </li>
        );
      })}
    </ul>
  );
}
