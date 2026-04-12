// Vercel serverless function — production health check
// Path: /api/health
// Tests that the Ticketmaster key is configured and the 3 core event endpoints
// can reach Ticketmaster's API. Returns a structured JSON status object.
// This endpoint is called by the GitHub Actions monitor every 30 minutes.

const KEY = process.env.VITE_TICKETMASTER_KEY;
const TM_BASE = "https://app.ticketmaster.com/discovery/v2/events.json";

async function probe(classificationName) {
  const start = Date.now();
  try {
    const url = new URL(TM_BASE);
    url.searchParams.set("apikey", KEY);
    url.searchParams.set("city", "Detroit");
    url.searchParams.set("stateCode", "MI");
    url.searchParams.set("countryCode", "US");
    url.searchParams.set("classificationName", classificationName);
    url.searchParams.set("size", "1");

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });
    const ct = res.headers.get("content-type") || "";
    const ms = Date.now() - start;

    if (!res.ok) {
      return { ok: false, status: res.status, ms, error: `HTTP ${res.status}` };
    }
    if (!ct.includes("application/json")) {
      return { ok: false, status: res.status, ms, error: `Non-JSON: ${ct}` };
    }
    await res.json();
    return { ok: true, status: res.status, ms };
  } catch (err) {
    return { ok: false, status: 0, ms: Date.now() - start, error: err.message };
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");

  if (!KEY) {
    return res.status(500).json({
      healthy: false,
      error: "VITE_TICKETMASTER_KEY not configured",
      ts: new Date().toISOString(),
    });
  }

  const [games, concerts, theatre] = await Promise.all([
    probe("sports"),
    probe("music"),
    probe("arts & theatre"),
  ]);

  const healthy = games.ok && concerts.ok && theatre.ok;

  return res.status(healthy ? 200 : 502).json({
    healthy,
    ts: new Date().toISOString(),
    endpoints: { games, concerts, theatre },
  });
}
