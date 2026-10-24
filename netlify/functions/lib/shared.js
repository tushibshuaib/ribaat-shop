import { createClient } from "@supabase/supabase-js";

const HEADERS = { "Content-Type": "application/json", "Cache-Control": "no-store" };

export function reply(statusCode, body) {
  return { statusCode, headers: HEADERS, body: JSON.stringify(body) };
}

// Uses the SERVER-ONLY service role key from Netlify environment variables.
export function getAdminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function parseBody(event) {
  if (event.httpMethod !== "POST") {
    return { error: reply(405, { error: "Method not allowed" }) };
  }
  const raw = event.isBase64Encoded
    ? Buffer.from(event.body || "", "base64").toString("utf8")
    : event.body || "";
  if (raw.length > 20000) {
    return { error: reply(413, { error: "Request too large" }) };
  }
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("bad");
    return { data };
  } catch {
    return { error: reply(400, { error: "Invalid request" }) };
  }
}

// Best-effort limiter (resets when the function instance restarts).
const hits = new Map();
export function rateLimited(event, name, max, windowMs) {
  const h = event.headers || {};
  const ip =
    h["x-nf-client-connection-ip"] || h["client-ip"] ||
    String(h["x-forwarded-for"] || "").split(",")[0] || "unknown";
  const key = `${name}:${ip}`;
  const now = Date.now();
  const list = (hits.get(key) || []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) hits.clear();
  return list.length > max;
}
