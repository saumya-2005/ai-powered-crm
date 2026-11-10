import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { activitySchema } from "@/lib/schemas";

// GET /api/activities?lead_id=...  -> activities of one lead (newest first)
export async function GET(req: Request) {
  const leadId = new URL(req.url).searchParams.get("lead_id");
  let query = supabase.from("activities").select("*").order("created_at", { ascending: false });
  if (leadId) query = query.eq("lead_id", leadId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/activities -> add a call, email, meeting, note or follow-up record
export async function POST(req: Request) {
  const parsed = activitySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, { status: 400 });
  }
  const { data, error } = await supabase.from("activities").insert(parsed.data).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
