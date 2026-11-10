import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import type { Activity, AiResult, Lead } from "@/lib/types";

export const maxDuration = 30;

const bodySchema = z.object({ lead_id: z.string().min(1) });

// The JSON shape we expect back from the AI model
const aiSchema = z.object({
  summary: z.string(),
  score: z.number(),
  conversion_probability: z.number(),
  next_best_action: z.string(),
  follow_up_message: z.string(),
});

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(n)));

// MOCK AI: used when there is no Gemini key or Gemini fails.
// It uses simple rules (status, priority, contact info, activity count) to make a demo result.
function buildMock(lead: Lead, activities: Activity[]): AiResult {
  const baseByStatus: Record<string, number> = { New: 30, Contacted: 45, Interested: 65, Negotiation: 80, Converted: 95, Lost: 8 };
  let score = baseByStatus[lead.status] ?? 40;
  if (lead.priority === "High") score += 8;
  if (lead.priority === "Low") score -= 5;
  score += Math.min(activities.length * 2, 10);
  if (!lead.email) score -= 5;
  if (!lead.phone) score -= 5;
  score = clamp(score, 1, 100);

  const actionByStatus: Record<string, string> = {
    New: "Send a short introduction email and book a first call within 24 hours.",
    Contacted: "Follow up with a call and share a one-page product overview.",
    Interested: "Schedule a product demo and share pricing details.",
    Negotiation: "Send a clear proposal with a deadline and involve a decision maker.",
    Converted: "Send a welcome message and plan onboarding.",
    Lost: "Wait a few weeks, then reach out with a new offer or update.",
  };

  const firstName = lead.full_name.split(" ")[0];
  const company = lead.company || "your company";

  return {
    summary: `${lead.full_name} from ${company} came in through ${lead.source || "an unknown source"}. Current stage: ${lead.status}, priority: ${lead.priority}. ${
      lead.notes ? `Notes: ${lead.notes}` : "There are no notes yet."
    } ${activities.length} activities are logged for this lead.`,
    score,
    conversion_probability: clamp(score * 0.9, 1, 99),
    next_best_action: actionByStatus[lead.status] ?? "Reach out and ask about their current needs.",
    follow_up_message: `Hi ${firstName},\n\nThank you for your interest. I wanted to follow up and see if you have any questions about how we can help ${company}. I would be happy to set up a short call at a time that suits you.\n\nBest regards`,
    source: "mock",
  };
}

// REAL AI: asks Gemini and checks that the answer has the right JSON shape.
// Returns null on any problem so the caller can use the mock instead.
async function askGemini(lead: Lead, activities: Activity[]): Promise<AiResult | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const history = activities.length
    ? activities.map((a) => `- ${a.created_at.slice(0, 10)} ${a.type}: ${a.description}`).join("\n")
    : "No activities yet.";

  const prompt = `You are a sales assistant inside a CRM. Analyze this lead and help the sales representative.

Lead:
- Name: ${lead.full_name}
- Company: ${lead.company || "unknown"}
- Email: ${lead.email || "missing"}
- Phone: ${lead.phone || "missing"}
- Source: ${lead.source || "unknown"}
- Status: ${lead.status}
- Priority: ${lead.priority}
- Notes: ${lead.notes || "none"}
- Created: ${lead.created_at.slice(0, 10)}

Recent activities (newest first):
${history}

Return ONLY valid JSON in exactly this format:
{
  "summary": "2-3 sentences about the lead profile and needs",
  "score": <number from 1 to 100>,
  "conversion_probability": <number from 0 to 100>,
  "next_best_action": "one clear next step for the sales representative",
  "follow_up_message": "a short, personalized, professional follow-up email or message"
}`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json", temperature: 0.4 },
    });
    // Remove ```json fences if the model adds them, then parse and validate
    const text = (response.text ?? "").replace(/```json|```/g, "").trim();
    const parsed = aiSchema.parse(JSON.parse(text));
    return {
      ...parsed,
      score: clamp(parsed.score, 1, 100),
      conversion_probability: clamp(parsed.conversion_probability, 0, 100),
      source: "gemini",
    };
  } catch (err) {
    console.error("Gemini failed, using the mock response instead:", err);
    return null;
  }
}

// POST /api/ai/analyze  body: { lead_id }
export async function POST(req: Request) {
  const body = bodySchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "lead_id is required" }, { status: 400 });

  const { data: leadData, error: leadError } = await supabase.from("leads").select("*").eq("id", body.data.lead_id).single();
  if (leadError || !leadData) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  const lead = leadData as Lead;

  const { data: activityData } = await supabase
    .from("activities")
    .select("*")
    .eq("lead_id", lead.id)
    .order("created_at", { ascending: false })
    .limit(10);
  const activities = (activityData ?? []) as Activity[];

  const result = (await askGemini(lead, activities)) ?? buildMock(lead, activities);

  // Save the result so it is still there after a page refresh
  const { error: saveError } = await supabase
    .from("leads")
    .update({ ai_score: result.score, ai_probability: result.conversion_probability, ai_result: result })
    .eq("id", lead.id);
  if (saveError) return NextResponse.json({ error: saveError.message }, { status: 500 });

  return NextResponse.json({ result });
}
