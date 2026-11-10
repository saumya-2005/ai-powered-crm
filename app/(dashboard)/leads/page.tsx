"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { STATUSES } from "@/lib/schemas";
import type { Lead } from "@/lib/types";
import { btnDanger, btnGhost, btnPrimary, cardCls, inputCls } from "@/lib/constants";
import { formatDate } from "@/lib/dates";
import LeadForm from "@/components/LeadForm";
import { EmptyState, ErrorBox, LoadingBlock, PageHeader, PriorityBadge, StatusBadge } from "@/components/ui";

export default function LeadsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [status, setStatus] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);

  // Wait 300ms after typing before searching
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: leads, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["leads", debounced, status],
    queryFn: () => api<Lead[]>(`/api/leads?q=${encodeURIComponent(debounced)}&status=${status}`),
    placeholderData: keepPreviousData,
  });

  const remove = useMutation({
    mutationFn: (id: string) => api(`/api/leads/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(lead: Lead) {
    setEditing(lead);
    setFormOpen(true);
  }
  function confirmDelete(lead: Lead) {
    if (window.confirm(`Delete ${lead.full_name}? This also deletes their activities and follow-ups.`)) {
      remove.mutate(lead.id);
    }
  }

  const filtersActive = debounced !== "" || status !== "all";

  return (
    <div>
      <PageHeader
        title="Leads"
        subtitle="Search, filter and manage everyone in your pipeline."
        action={<button onClick={openAdd} className={btnPrimary}>Add lead</button>}
      />

      {/* Search and status filter */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email or company"
          className={`${inputCls} sm:max-w-sm`}
          aria-label="Search leads"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputCls} sm:w-48`} aria-label="Filter by status">
          <option value="all">All statuses</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {remove.isError && <p className="mb-3 text-sm text-red-600">{remove.error.message}</p>}
      {isLoading && <LoadingBlock rows={6} />}
      {isError && <ErrorBox message={error.message} onRetry={() => refetch()} />}

      {leads && leads.length === 0 && (
        <EmptyState
          title={filtersActive ? "No leads match your search" : "No leads yet"}
          text={filtersActive ? "Try a different name or clear the status filter." : "Add your first lead to start tracking your sales."}
          action={!filtersActive && <button onClick={openAdd} className={btnPrimary}>Add lead</button>}
        />
      )}

      {leads && leads.length > 0 && (
        <>
          {/* Table for tablets and desktops */}
          <div className={`${cardCls} hidden overflow-x-auto md:block`}>
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">AI score</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/leads/${l.id}`} className="font-medium text-indigo-600 hover:underline">{l.full_name}</Link>
                      <p className="text-xs text-slate-500">{l.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{l.company}</td>
                    <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                    <td className="px-4 py-3"><PriorityBadge priority={l.priority} /></td>
                    <td className="px-4 py-3 text-slate-700">{l.ai_score ?? "-"}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(l.created_at.slice(0, 10))}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(l)} className={btnGhost}>Edit</button>
                        <button onClick={() => confirmDelete(l)} className={btnDanger}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards for phones */}
          <div className="space-y-3 md:hidden">
            {leads.map((l) => (
              <div key={l.id} className={`${cardCls} p-4`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/leads/${l.id}`} className="font-medium text-indigo-600">{l.full_name}</Link>
                    <p className="truncate text-sm text-slate-500">{l.company}</p>
                  </div>
                  <StatusBadge status={l.status} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <PriorityBadge priority={l.priority} />
                  <span>AI score: {l.ai_score ?? "-"}</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => openEdit(l)} className={`${btnGhost} flex-1`}>Edit</button>
                  <button onClick={() => confirmDelete(l)} className={`${btnDanger} flex-1`}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <LeadForm open={formOpen} onClose={() => setFormOpen(false)} lead={editing} />
    </div>
  );
}
