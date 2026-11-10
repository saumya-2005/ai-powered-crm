"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { followUpSchema } from "@/lib/schemas";
import type { FollowUp, Lead } from "@/lib/types";
import { todayStr } from "@/lib/dates";
import { btnPrimary, inputCls } from "@/lib/constants";

// Form to create a follow-up reminder.
// If "leadId" is given, the lead is fixed. Otherwise the user picks a lead.
export default function FollowUpForm({ leadId }: { leadId?: string }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(todayStr());
  const [selectedLead, setSelectedLead] = useState("");
  const [formError, setFormError] = useState("");

  // Load leads only when we need the lead dropdown
  const { data: leads } = useQuery({
    queryKey: ["leads", "all"],
    queryFn: () => api<Lead[]>("/api/leads"),
    enabled: !leadId,
  });

  const add = useMutation({
    mutationFn: (body: { lead_id: string; title: string; due_date: string }) =>
      api<FollowUp>("/api/follow-ups", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      setTitle("");
      qc.invalidateQueries({ queryKey: ["follow-ups"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = followUpSchema.safeParse({ lead_id: leadId ?? selectedLead, title: title.trim(), due_date: dueDate });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0].message);
      return;
    }
    setFormError("");
    add.mutate(parsed.data);
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {!leadId && (
        <select value={selectedLead} onChange={(e) => setSelectedLead(e.target.value)} className={inputCls} aria-label="Lead">
          <option value="">Select a lead</option>
          {leads?.map((l) => (
            <option key={l.id} value={l.id}>{l.full_name}{l.company ? ` (${l.company})` : ""}</option>
          ))}
        </select>
      )}
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to be done?" className={inputCls} aria-label="Follow-up title" />
      <div className="flex flex-col gap-3 sm:flex-row">
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} aria-label="Due date" />
        <button type="submit" disabled={add.isPending} className={`${btnPrimary} sm:shrink-0`}>
          {add.isPending ? "Adding..." : "Add follow-up"}
        </button>
      </div>
      {(formError || add.isError) && <p className="text-sm text-red-600">{formError || add.error?.message}</p>}
    </form>
  );
}
