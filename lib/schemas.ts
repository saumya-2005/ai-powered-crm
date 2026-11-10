import { z } from "zod";

// Allowed values (used by forms, API and database)
export const STATUSES = ["New", "Contacted", "Interested", "Negotiation", "Converted", "Lost"] as const;
export const PRIORITIES = ["Low", "Medium", "High"] as const;
export const ACTIVITY_TYPES = ["Call", "Email", "Meeting", "Note", "Follow-up"] as const;

export type Status = (typeof STATUSES)[number];
export type Priority = (typeof PRIORITIES)[number];

// Lead validation (same schema is used in the form and in the API)
export const leadSchema = z.object({
  full_name: z.string().min(2, "Name is required"),
  email: z.union([z.string().email("Enter a valid email"), z.literal("")]).optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  source: z.string().optional(),
  status: z.enum(STATUSES),
  priority: z.enum(PRIORITIES),
  notes: z.string().optional(),
});
export type LeadInput = z.infer<typeof leadSchema>;

// Activity validation
export const activitySchema = z.object({
  lead_id: z.string().min(1),
  type: z.enum(ACTIVITY_TYPES),
  description: z.string().min(1, "Description is required"),
});

// Follow-up validation (due_date must look like 2026-11-20)
export const followUpSchema = z.object({
  lead_id: z.string().min(1, "Select a lead"),
  title: z.string().min(2, "Title is required"),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a due date"),
});
