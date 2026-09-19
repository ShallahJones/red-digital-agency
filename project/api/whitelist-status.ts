import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

// Public status lookup for ONE wallet at a time. The tables themselves stay unreadable to the
// anon key; this route uses the service_role key server-side and only ever answers about the
// single address the caller typed in. It never returns the list or any other address.
//   cleared -> in robinhood_whitelist (the real, capped-at-199 allocation)
//   late    -> only in robinhood_whitelist_overflow (arrived after the cap; no clearance)
//   none    -> in neither
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    res.status(500).json({ error: "Supabase server env vars are not configured." });
    return;
  }

  const raw = String(Array.isArray(req.query.address) ? req.query.address[0] : req.query.address ?? "").trim();
  if (!/^0x[0-9a-fA-F]{40}$/.test(raw)) {
    res.status(400).json({ error: "Not a valid address." });
    return;
  }
  const addr = raw.toLowerCase();

  const supabase = createClient(url, serviceKey);
  const [main, overflow] = await Promise.all([
    supabase.from("robinhood_whitelist").select("id", { head: true, count: "exact" }).eq("wallet_address", addr),
    supabase.from("robinhood_whitelist_overflow").select("id", { head: true, count: "exact" }).eq("wallet_address", addr),
  ]);
  if (main.error || overflow.error) {
    res.status(500).json({ error: "Lookup failed." });
    return;
  }

  const status = (main.count ?? 0) > 0 ? "cleared" : (overflow.count ?? 0) > 0 ? "late" : "none";
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({ status });
}
