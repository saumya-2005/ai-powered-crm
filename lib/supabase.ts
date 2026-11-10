import { createClient } from "@supabase/supabase-js";

// Supabase client for server-side use only (API routes).
// The service role key must never be used in frontend code.
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);