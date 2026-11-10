"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { FollowUp } from "@/lib/types";
import { todayStr } from "@/lib/dates";
import { cardCls } from "@/lib/constants";
import FollowUpForm from "@/components/FollowUpForm";
import FollowUpList from "@/components/FollowUpList";
import { ErrorBox, LoadingBlock, PageHeader } from "@/components/ui";

type Tab = "overdue" | "upcoming" | "completed";

export default function FollowUpsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("upcoming");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["follow-ups", "all"],
    queryFn: () => api<FollowUp[]>("/api/follow-ups"),
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["follow-ups"] });
    qc.invalidateQueries({ queryKey: ["stats"] });
  };
  const toggle = useMutation({
    mutationFn: (f: FollowUp) => api(`/api/follow-ups/${f.id}`, { method: "PATCH", body: JSON.stringify({ completed: !f.completed }) }),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: (f: FollowUp) => api(`/api/follow-ups/${f.id}`, { method: "DELETE" }),
    onSuccess: refresh,
  });

  // Split the list into the three groups
  const today = todayStr();
  const groups = {
    overdue: (data ?? []).filter((f) => !f.completed && f.due_date < today),
    upcoming: (data ?? []).filter((f) => !f.completed && f.due_date >= today),
    completed: (data ?? []).filter((f) => f.completed),
  };
  const tabs: { key: Tab; label: string }[] = [
    { key: "overdue", label: "Overdue" },
    { key: "upcoming", label: "Upcoming" },
    { key: "completed", label: "Completed" },
  ];
  const emptyText: Record<Tab, string> = {
    overdue: "Nothing is overdue. Nice work.",
    upcoming: "No upcoming follow-ups. Add one above.",
    completed: "Completed follow-ups will show up here.",
  };

  return (
    <div>
      <PageHeader title="Follow-ups" subtitle="Reminders so no lead is forgotten." />

      <section className={`${cardCls} mb-6 p-4 sm:p-5`}>
        <h2 className="mb-3 font-semibold">New follow-up</h2>
        <FollowUpForm />
      </section>

      {isLoading && <LoadingBlock rows={4} />}
      {isError && <ErrorBox message={error.message} onRetry={() => refetch()} />}

      {data && (
        <section className={`${cardCls} p-4 sm:p-5`}>
          <div className="mb-3 flex gap-1 overflow-x-auto border-b border-slate-200" role="tablist">
            {tabs.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => setTab(t.key)}
                className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium ${
                  tab === t.key ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {t.label} ({groups[t.key].length})
              </button>
            ))}
          </div>

          {groups[tab].length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">{emptyText[tab]}</p>
          ) : (
            <FollowUpList items={groups[tab]} showLead onToggle={(f) => toggle.mutate(f)} onDelete={(f) => remove.mutate(f)} />
          )}
        </section>
      )}
    </div>
  );
}
