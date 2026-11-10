"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ACTIVITY_TYPES, activitySchema } from "@/lib/schemas";
import type { Activity } from "@/lib/types";
import { formatDateTime } from "@/lib/dates";
import { btnPrimary, inputCls } from "@/lib/constants";
import { EmptyState, ErrorBox, LoadingBlock } from "@/components/ui";

const ICONS: Record<string, string> = { Call: "📞", Email: "✉️", Meeting: "👥", Note: "📝", "Follow-up": "⏰" };

// Activity history of one lead + form to add a new record
export default function Timeline({ leadId }: { leadId: string }) {
  const qc = useQueryClient();
  const [type, setType] = useState<string>("Call");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState("");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["activities", leadId],
    queryFn: () => api<Activity[]>(`/api/activities?lead_id=${leadId}`),
  });

  const add = useMutation({
    mutationFn: (body: { lead_id: string; type: string; description: string }) =>
      api<Activity>("/api/activities", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      setDescription("");
      qc.invalidateQueries({ queryKey: ["activities"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = activitySchema.safeParse({ lead_id: leadId, type, description: description.trim() });
    if (!parsed.success) {
      setFormError("Write a short description of what happened.");
      return;
    }
    setFormError("");
    add.mutate(parsed.data);
  }

  return (
    <div>
      <form onSubmit={submit} className="mb-6 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <select value={type} onChange={(e) => setType(e.target.value)} className={`${inputCls} sm:w-40`} aria-label="Activity type">
            {ACTIVITY_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What happened?" className={inputCls} aria-label="Description" />
          <button type="submit" disabled={add.isPending} className={`${btnPrimary} sm:shrink-0`}>
            {add.isPending ? "Adding..." : "Add record"}
          </button>
        </div>
        {(formError || add.isError) && <p className="text-sm text-red-600">{formError || add.error?.message}</p>}
      </form>

      {isLoading && <LoadingBlock rows={3} />}
      {isError && <ErrorBox message={error.message} onRetry={() => refetch()} />}
      {data && data.length === 0 && <EmptyState title="No activity yet" text="Log a call, email, meeting or note to start the timeline." />}
      {data && data.length > 0 && (
        <ol className="relative ml-3 space-y-5 border-l border-slate-200">
          {data.map((a) => (
            <li key={a.id} className="ml-6">
              <span className="absolute -left-3.5 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-sm" aria-hidden>
                {ICONS[a.type] ?? "•"}
              </span>
              <p className="text-sm font-medium text-slate-900">{a.type}</p>
              {a.description && <p className="mt-0.5 text-sm text-slate-600">{a.description}</p>}
              <p className="mt-1 text-xs text-slate-400">{formatDateTime(a.created_at)}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
