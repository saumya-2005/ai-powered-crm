import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { leadSchema } from "@/lib/schemas";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/leads/:id -> one lead
export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const { data, error } = await supabase.from("leads").select("*").eq("id", id).single();
  if (error) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  return NextResponse.json(data);
}

// PATCH /api/leads/:id -> edit fields, or only change the status (used by the pipeline)
export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const parsed = leadSchema.partial().safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, { status: 400 });
  }
  const { data, error } = await supabase.from("leads").update(parsed.data).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/leads/:id -> delete a lead (its activities and follow-ups are deleted too)
export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const { error } = await supabase.from("leads").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}