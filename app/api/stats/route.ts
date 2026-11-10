import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type LeadRow = { status: string; source: string | null; created_at: string };
type FollowUpRow = { completed: boolean; due_date: string };
type ActivityRow = {
  id: string; type: string; description: string | null; created_at: string; lead_id: string;
  leads: { full_name: string } | null;
};

// Turn a list of names into [{ name, value }] counts
function countBy(items: string[]) {
  const map = new Map<string, number>();
  items.forEach((i) => map.set(i, (map.get(i) ?? 0) + 1));
  return Array.from(map, ([name, value]) => ({ name, value }));
}

// GET /api/stats?today=YYYY-MM-DD -> all numbers and chart data for the dashboard
export async function GET(req: Request) {
  const today = new URL(req.url).searchParams.get("today") ?? new Date().toISOString().slice(0, 10);

  const [leadsRes, followUpsRes, activitiesRes] = await Promise.all([
    supabase.from("leads").select("status, source, created_at"),
    supabase.from("follow_ups").select("completed, due_date"),
    supabase
      .from("activities")
      .select("id, type, description, created_at, lead_id, leads(full_name)")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const failed = leadsRes.error || followUpsRes.error || activitiesRes.error;
  if (failed) return NextResponse.json({ error: failed.message }, { status: 500 });

  const leads = (leadsRes.data ?? []) as LeadRow[];
  const followUps = (followUpsRes.data ?? []) as FollowUpRow[];
  const activities = (activitiesRes.data ?? []) as unknown as ActivityRow[];

  const total = leads.length;
  const converted = leads.filter((l) => l.status === "Converted").length;
  const pending = followUps.filter((f) => !f.completed);

  // Last 6 months: how many leads were created and how many of them are converted
  const now = new Date();
  const byMonth = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const inMonth = leads.filter((l) => {
      const c = new Date(l.created_at);
      return c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth();
    });
    return {
      month: d.toLocaleString("en-US", { month: "short" }),
      leads: inMonth.length,
      converted: inMonth.filter((l) => l.status === "Converted").length,
    };
  });

  return NextResponse.json({
    total,
    newLeads: leads.filter((l) => l.status === "New").length,
    converted,
    pendingFollowUps: pending.length,
    overdueFollowUps: pending.filter((f) => f.due_date < today).length,
    conversionRate: total === 0 ? 0 : Math.round((converted / total) * 1000) / 10,
    byStatus: countBy(leads.map((l) => l.status)),
    bySource: countBy(leads.map((l) => l.source || "Unknown")),
    byMonth,
    recent: activities.map((a) => ({
      id: a.id,
      type: a.type,
      description: a.description,
      created_at: a.created_at,
      lead_id: a.lead_id,
      lead_name: a.leads?.full_name ?? "Unknown lead",
    })),
  });
}
