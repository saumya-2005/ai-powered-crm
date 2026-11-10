"use client";

import Link from "next/link";
import { useState } from "react";
import {
  DndContext, DragOverlay, PointerSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { STATUSES, type Status } from "@/lib/schemas";
import type { Lead } from "@/lib/types";
import { STATUS_HEX, cardCls } from "@/lib/constants";
import { EmptyState, ErrorBox, LoadingBlock, PageHeader, PriorityBadge } from "@/components/ui";

const KEY = ["leads", "all"];

// The content of a lead card (also used inside the drag preview)
function CardBody({ lead, onMove }: { lead: Lead; onMove?: (status: Status) => void }) {
  return (
    <div className={`${cardCls} p-3`}>
      <Link href={`/leads/${lead.id}`} className="block truncate text-sm font-medium text-indigo-600 hover:underline">
        {lead.full_name}
      </Link>
      <p className="truncate text-xs text-slate-500">{lead.company || "No company"}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <PriorityBadge priority={lead.priority} />
        {lead.ai_score !== null && <span className="text-xs text-slate-500">AI score {lead.ai_score}</span>}
      </div>
      {/* Dropdown is an alternative to drag and drop (good for touch screens) */}
      {onMove && (
        <select
          value={lead.status}
          onChange={(e) => onMove(e.target.value as Status)}
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          aria-label={`Change stage for ${lead.full_name}`}
          className="mt-3 w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700"
        >
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      )}
    </div>
  );
}

function DraggableCard({ lead, onMove }: { lead: Lead; onMove: (id: string, status: Status) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className={`cursor-grab touch-manipulation active:cursor-grabbing ${isDragging ? "opacity-40" : ""}`}>
      <CardBody lead={lead} onMove={(s) => onMove(lead.id, s)} />
    </div>
  );
}

function Column({ status, leads, onMove }: { status: Status; leads: Lead[]; onMove: (id: string, status: Status) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <section
      ref={setNodeRef}
      className={`flex w-[17rem] shrink-0 flex-col rounded-xl border p-3 transition-colors sm:w-72 ${isOver ? "border-indigo-400 bg-indigo-50" : "border-slate-200 bg-slate-100/70"}`}
      aria-label={`${status} column`}
    >
      <header className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_HEX[status] }} />
          <h2 className="text-sm font-semibold">{status}</h2>
        </div>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-600">{leads.length}</span>
      </header>
      <div className="max-h-[65vh] min-h-[6rem] space-y-2 overflow-y-auto">
        {leads.map((l) => <DraggableCard key={l.id} lead={l} onMove={onMove} />)}
        {leads.length === 0 && <p className="py-6 text-center text-xs text-slate-400">Drop a lead here</p>}
      </div>
    </section>
  );
}

export default function PipelinePage() {
  const qc = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);

  // Mouse needs a small drag distance, touch needs a short press (so scrolling still works)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 6 } })
  );

  const { data: leads, isLoading, isError, error, refetch } = useQuery({
    queryKey: KEY,
    queryFn: () => api<Lead[]>("/api/leads"),
  });

  // Change the stage. The screen updates first, then the server is called.
  const move = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Status }) =>
      api(`/api/leads/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: KEY });
      const previous = qc.getQueryData<Lead[]>(KEY);
      qc.setQueryData<Lead[]>(KEY, (old) => old?.map((l) => (l.id === id ? { ...l, status } : l)));
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(KEY, ctx.previous); // undo if the server failed
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });

  const handleMove = (id: string, status: Status) => move.mutate({ id, status });

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }
  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    if (!e.over || !leads) return;
    const lead = leads.find((l) => l.id === e.active.id);
    const newStatus = e.over.id as Status;
    if (lead && lead.status !== newStatus) handleMove(lead.id, newStatus);
  }

  const activeLead = leads?.find((l) => l.id === activeId);

  return (
    <div>
      <PageHeader title="Pipeline" subtitle="Drag a lead to another stage, or use the dropdown on the card." />

      {isLoading && <LoadingBlock rows={5} />}
      {isError && <ErrorBox message={error.message} onRetry={() => refetch()} />}
      {move.isError && <p className="mb-3 text-sm text-red-600">Could not update the stage: {move.error.message}</p>}
      {leads && leads.length === 0 && <EmptyState title="Your pipeline is empty" text="Add leads first, then manage them here." action={<Link href="/leads" className="text-sm text-indigo-600 hover:underline">Go to leads</Link>} />}

      {leads && leads.length > 0 && (
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActiveId(null)}>
          <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
            {STATUSES.map((s) => (
              <Column key={s} status={s} leads={leads.filter((l) => l.status === s)} onMove={handleMove} />
            ))}
          </div>
          <DragOverlay>{activeLead ? <CardBody lead={activeLead} /> : null}</DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
