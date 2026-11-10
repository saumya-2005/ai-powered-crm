import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { leadSchema } from "@/lib/schemas";

// GET /api/leads?q=text&status=New  -> list leads (search + filter)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  // Remove characters that could break the search filter
  const q = (searchParams.get("q") ?? "").replace(/[,()%*]/g, " ").trim();
  const status = searchParams.get("status");

  let query = supabase.from("leads").select("*").order("created_at", { ascending: false });
  if (status && status !== "all") query = query.eq("status", status);
  if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,company.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/leads -> create a lead
export async function POST(req: Request) {
  const parsed = leadSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, { status: 400 });
  }
  const { data, error } = await supabase.from("leads").insert(parsed.data).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
