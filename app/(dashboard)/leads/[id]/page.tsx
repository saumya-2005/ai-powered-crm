"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { FollowUp, Lead } from "@/lib/types";
import { btnDanger, btnGhost, cardCls } from "@/lib/constants";
import { formatDate } from "@/lib/dates";
import LeadForm from "@/components/LeadForm";
import AiPanel from "@/components/AiPanel";
import Timeline from "@/components/Timeline";
import FollowUpForm from "@/components/FollowUpForm";
import FollowUpList from "@/components/FollowUpList";
import { EmptyState, ErrorBox, LoadingBlock, PriorityBadge, StatusBadge } from "@/components/ui";

// One row of lead details
function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="break-words text-right text-slate-900">{value || "-"}</dd>
    </div>
  );
}

export default function LeadProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);

  const { data: lead, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["lead", id],
    queryFn: () => api<Lead>(`/api/leads/${id}`),
  });

  const { data: followUps } = useQuery({
    queryKey: ["follow-ups", id],
    queryFn: () => api<FollowUp[]>(`/api/follow-ups?lead_id=${id}`),
  });

  const refreshFollowUps = () => {
    qc.invalidateQueries({ queryKey: ["follow-ups"] });
    qc.invalidateQueries({ queryKey: ["stats"] });
  };

  const toggle = useMutation({
    mutationFn: (f: FollowUp) => api(`/api/follow-ups/${f.id}`, { method: "PATCH", body: JSON.stringify({ completed: !f.completed }) }),
    onSuccess: refreshFollowUps,
  });
  const removeFollowUp = useMutation({
    mutationFn: (f: FollowUp) => api(`/api/follow-ups/${f.id}`, { method: "DELETE" }),
    onSuccess: refreshFollowUps,
  });

  const removeLead = useMutation({
    mutationFn: () => api(`/api/leads/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      router.push("/leads");
    },
  });

  if (isLoading) return <LoadingBlock rows={6} />;
  if (isError) return <ErrorBox message={error.message} onRetry={() => refetch()} />;
  if (!lead) return <EmptyState title="Lead not found" action={<Link href="/leads" className={btnGhost}>Back to leads</Link>} />;

  return (
    <div>
      <Link href="/leads" className="text-sm text-indigo-600 hover:underline">Back to leads</Link>

      <div className="mb-6 mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{lead.full_name}</h1>
          <p className="mt-1 text-sm text-slate-500">{lead.company || "No company"}</p>
          <div className="mt-2 flex gap-2">
            <StatusBadge status={lead.status} />
            <PriorityBadge priority={lead.priority} />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditOpen(true)} className={btnGhost}>Edit lead</button>
          <button
            onClick={() => window.confirm(`Delete ${lead.full_name}?`) && removeLead.mutate()}
            disabled={removeLead.isPending}
            className={btnDanger}
          >
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column: details + follow-ups */}
        <div className="space-y-6 lg:col-span-1">
          <section className={`${cardCls} p-4 sm:p-5`}>
            <h2 className="mb-2 font-semibold">Details</h2>
            <dl className="divide-y divide-slate-100">
              <Detail label="Email" value={lead.email} />
              <Detail label="Phone" value={lead.phone} />
              <Detail label="Source" value={lead.source} />
              <Detail label="Created" value={formatDate(lead.created_at.slice(0, 10))} />
              <Detail label="Notes" value={lead.notes} />
            </dl>
          </section>

          <section className={`${cardCls} p-4 sm:p-5`}>
            <h2 className="mb-3 font-semibold">Follow-ups</h2>
            <FollowUpForm leadId={lead.id} />
            <div className="mt-4">
              {followUps && followUps.length === 0 && <p className="text-sm text-slate-500">No follow-ups for this lead yet.</p>}
              {followUps && followUps.length > 0 && (
                <FollowUpList items={followUps} onToggle={(f) => toggle.mutate(f)} onDelete={(f) => removeFollowUp.mutate(f)} />
              )}
            </div>
          </section>
        </div>

        {/* Right column: AI + timeline */}
        <div className="space-y-6 lg:col-span-2">
          <AiPanel lead={lead} />
          <section className={`${cardCls} p-4 sm:p-5`}>
            <h2 className="mb-4 font-semibold">Activity timeline</h2>
            <Timeline leadId={lead.id} />
          </section>
        </div>
      </div>

      <LeadForm open={editOpen} onClose={() => setEditOpen(false)} lead={lead} />
    </div>
  );
}
