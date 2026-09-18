import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

// Set these in Netlify: Site configuration -> Environment variables.
// SUPABASE_URL: same project URL as VITE_SUPABASE_URL
// SUPABASE_SERVICE_ROLE_KEY: the *service_role* key (Project Settings -> API). Never expose this to the browser.
// EXPORT_PASSPHRASE: whatever passphrase you want to gate the export with.

function toCsv(addresses: string[]): string {
  const header = "Wallet address,Custom mint limit (optional),Custom price in native token e.g. ETH (optional)";
  const rows = addresses.map((a) => `${a},,`);
  return [header, ...rows].join("\r\n") + "\r\n";
}

export const handler: Handler = async (event) => {
  const passphrase =
    event.queryStringParameters?.passphrase ||
    event.headers["x-export-passphrase"];

  const expected = process.env.EXPORT_PASSPHRASE;

  if (!expected) {
    return { statusCode: 500, body: "EXPORT_PASSPHRASE is not configured on the server." };
  }

  if (!passphrase || passphrase !== expected) {
    return { statusCode: 401, body: "Unauthorized" };
  }

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return { statusCode: 500, body: "Supabase server env vars are not configured." };
  }

  const supabase = createClient(url, serviceKey);

  const { data, error } = await supabase
    .from("robinhood_whitelist")
    .select("wallet_address")
    .order("created_at", { ascending: true });

  if (error) {
    return { statusCode: 500, body: `Failed to fetch whitelist: ${error.message}` };
  }

  const addresses = (data ?? []).map((row) => row.wallet_address as string);
  const csv = toCsv(addresses);

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="robinhood-opensea-allowlist.csv"`,
    },
    body: csv,
  };
};
