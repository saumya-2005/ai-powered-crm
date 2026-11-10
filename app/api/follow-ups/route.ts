import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { followUpSchema } from "@/lib/schemas";

// GET /api/follow-ups?lead_id=...  -> follow-ups with the lead name (earliest due date first)
export async function GET(req: Request) {
  const leadId = new URL(req.url).searchParams.get("lead_id");
  let query = supabase.from("follow_ups").select("*, leads(full_name, company)").order("due_date", { ascending: true });
  if (leadId) query = query.eq("lead_id", leadId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/follow-ups -> create a reminder
export async function POST(req: Request) {
  const parsed = followUpSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, { status: 400 });
  }
  const { data, error } = await supabase.from("follow_ups").insert(parsed.data).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
