import { NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";

type Ctx = { params: Promise<{ id: string }> };

// Fields that can be changed on a follow-up
const patchSchema = z.object({
  completed: z.boolean().optional(),
  title: z.string().min(2).optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// PATCH /api/follow-ups/:id -> mark as completed, or change title / date
export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const { data, error } = await supabase.from("follow_ups").update(parsed.data).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/follow-ups/:id
export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const { error } = await supabase.from("follow_ups").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
