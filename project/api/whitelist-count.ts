import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

// Public, read-only endpoint: returns only a count, never the addresses themselves.
// Uses the service_role key server-side to bypass RLS (the anon key can't SELECT at all,
// by design — see supabase/robinhood_whitelist.sql), but only ever exposes a number.
const WHITELIST_CAP = 199;

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    res.status(500).json({ error: "Supabase server env vars are not configured." });
    return;
  }

  const supabase = createClient(url, serviceKey);

  const { count, error } = await supabase
    .from("robinhood_whitelist")
    .select("*", { count: "exact", head: true });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.setHeader("Cache-Control", "public, max-age=15, stale-while-revalidate=30");
  res.status(200).json({ count: count ?? 0, cap: WHITELIST_CAP });
}
