import type { Priority, Status } from "@/lib/schemas";

// Result returned by the AI feature
export type AiResult = {
  summary: string;
  score: number;
  conversion_probability: number;
  next_best_action: string;
  follow_up_message: string;
  source: "gemini" | "mock";
};

export type Lead = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string | null;
  status: Status;
  priority: Priority;
  notes: string | null;
  ai_score: number | null;
  ai_probability: number | null;
  ai_result: AiResult | null;
  created_at: string;
};

export type Activity = {
  id: string;
  lead_id: string;
  type: string;
  description: string | null;
  created_at: string;
};

export type FollowUp = {
  id: string;
  lead_id: string;
  title: string;
  due_date: string;
  completed: boolean;
  created_at: string;
  leads?: { full_name: string; company: string | null } | null;
};

export type Stats = {
  total: number;
  newLeads: number;
  converted: number;
  pendingFollowUps: number;
  overdueFollowUps: number;
  conversionRate: number;
  byStatus: { name: string; value: number }[];
  bySource: { name: string; value: number }[];
  byMonth: { month: string; leads: number; converted: number }[];
  recent: { id: string; type: string; description: string | null; created_at: string; lead_id: string; lead_name: string }[];
};
