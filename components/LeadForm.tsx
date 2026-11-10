"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { leadSchema, PRIORITIES, STATUSES, type LeadInput } from "@/lib/schemas";
import { api } from "@/lib/api";
import type { Lead } from "@/lib/types";
import { SOURCES, btnGhost, btnPrimary, inputCls } from "@/lib/constants";
import { Modal } from "@/components/ui";

const emptyValues: LeadInput = {
  full_name: "", email: "", phone: "", company: "", source: "Website", status: "New", priority: "Medium", notes: "",
};

type Props = { open: boolean; onClose: () => void; lead?: Lead | null };

// Add / edit lead form. Pass "lead" to edit, leave it empty to add.
export default function LeadForm({ open, onClose, lead }: Props) {
  const qc = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<LeadInput>({
    resolver: zodResolver(leadSchema),
    defaultValues: emptyValues,
  });

  // Fill the form when it opens (existing values for edit, empty values for add)
  useEffect(() => {
    if (!open) return;
    reset(
      lead
        ? {
            full_name: lead.full_name,
            email: lead.email ?? "",
            phone: lead.phone ?? "",
            company: lead.company ?? "",
            source: lead.source ?? "Website",
            status: lead.status,
            priority: lead.priority,
            notes: lead.notes ?? "",
          }
        : emptyValues
    );
  }, [open, lead, reset]);

  const mutation = useMutation({
    mutationFn: (values: LeadInput) =>
      lead
        ? api<Lead>(`/api/leads/${lead.id}`, { method: "PATCH", body: JSON.stringify(values) })
        : api<Lead>("/api/leads", { method: "POST", body: JSON.stringify(values) }),
    onSuccess: () => {
      // Refresh every screen that shows leads
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      onClose();
    },
  });

  const label = "mb-1 block text-sm font-medium text-slate-700";
  const err = "mt-1 text-xs text-red-600";

  return (
    <Modal open={open} onClose={onClose} title={lead ? "Edit lead" : "Add lead"}>
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="full_name">Full name</label>
            <input id="full_name" className={inputCls} {...register("full_name")} />
            {errors.full_name && <p className={err}>{errors.full_name.message}</p>}
          </div>
          <div>
            <label className={label} htmlFor="company">Company</label>
            <input id="company" className={inputCls} {...register("company")} />
          </div>
          <div>
            <label className={label} htmlFor="email">Email</label>
            <input id="email" type="email" className={inputCls} {...register("email")} />
            {errors.email && <p className={err}>{errors.email.message}</p>}
          </div>
          <div>
            <label className={label} htmlFor="phone">Phone</label>
            <input id="phone" type="tel" className={inputCls} {...register("phone")} />
          </div>
          <div>
            <label className={label} htmlFor="source">Lead source</label>
            <select id="source" className={inputCls} {...register("source")}>
              {SOURCES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="status">Status</label>
            <select id="status" className={inputCls} {...register("status")}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={label} htmlFor="priority">Priority</label>
            <select id="priority" className={inputCls} {...register("priority")}>
              {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={label} htmlFor="notes">Notes</label>
            <textarea id="notes" rows={3} className={inputCls} {...register("notes")} />
          </div>
        </div>

        {mutation.isError && <p className="text-sm text-red-600">{mutation.error.message}</p>}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className={btnGhost}>Cancel</button>
          <button type="submit" disabled={mutation.isPending} className={btnPrimary}>
            {mutation.isPending ? "Saving..." : lead ? "Save changes" : "Add lead"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
