import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

// Set these in Vercel: Project Settings -> Environment Variables.
// SUPABASE_URL: same project URL as VITE_SUPABASE_URL
// SUPABASE_SERVICE_ROLE_KEY: the *service_role* key (Supabase Project Settings -> API). Never expose this to the browser.
// EXPORT_PASSPHRASE: whatever passphrase you want to gate the export with.

function toCsv(addresses: string[]): string {
  const header = "Wallet address,Custom mint limit (optional),Custom price in native token e.g. ETH (optional)";
  const rows = addresses.map((a) => `${a},,`);
  return [header, ...rows].join("\r\n") + "\r\n";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const passphrase =
    (req.query.passphrase as string | undefined) ||
    (req.headers["x-export-passphrase"] as string | undefined);

  const expected = process.env.EXPORT_PASSPHRASE;

  if (!expected) {
    res.status(500).send("EXPORT_PASSPHRASE is not configured on the server.");
    return;
  }

  if (!passphrase || passphrase !== expected) {
    res.status(401).send("Unauthorized");
    return;
  }

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    res.status(500).send("Supabase server env vars are not configured.");
    return;
  }

  const supabase = createClient(url, serviceKey);

  const { data, error } = await supabase
    .from("robinhood_whitelist")
    .select("wallet_address")
    .order("created_at", { ascending: true });

  if (error) {
    res.status(500).send(`Failed to fetch whitelist: ${error.message}`);
    return;
  }

  const addresses = (data ?? []).map((row) => row.wallet_address as string);
  const csv = toCsv(addresses);

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="robinhood-opensea-allowlist.csv"');
  res.status(200).send(csv);
}
