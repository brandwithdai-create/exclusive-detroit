// Vercel serverless function — Detroit concerts via Ticketmaster
// Path: /api/events/concerts
// VITE_TICKETMASTER_KEY must be set in Vercel project environment variables.
//
// PRODUCTION ARCHITECTURE:
//   - This function lives in GitHub main → Vercel auto-deploys on push
//   - Vercel CDN caches responses for 5 min (s-maxage=300)
//   - stale-while-revalidate=3600: CDN serves stale while background-refreshing (1 hr)
//   - stale-if-error=86400: CDN serves last-known-good data for 24 hr on Ticketmaster outage
//   - The catch-all rewrite in vercel.json does NOT intercept /api/* (functions have priority)

const KEY = process.env.VITE_TICKETMASTER_KEY;
const TM_BASE = "https://app.ticketmaster.com/discovery/v2/events.json";

function getDateRange() {
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + 60);
  const pad = n => String(n).padStart(2, "0");
  const fmt = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return { startDateTime: `${fmt(now)}T00:00:00Z`, endDateTime: `${fmt(end)}T23:59:59Z` };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  if (!KEY) {
    console.error("[ExclusiveDetroit] VITE_TICKETMASTER_KEY not set in Vercel environment variables");
    return res.status(500).json({ error: "VITE_TICKETMASTER_KEY not configured" });
  }

  try {
    const { startDateTime, endDateTime } = getDateRange();
    const url = new URL(TM_BASE);
    url.searchParams.set("apikey",             KEY);
    url.searchParams.set("city",               "Detroit");
    url.searchParams.set("stateCode",          "MI");
    url.searchParams.set("countryCode",        "US");
    url.searchParams.set("startDateTime",      startDateTime);
    url.searchParams.set("endDateTime",        endDateTime);
    url.searchParams.set("sort",               "date,asc");
    url.searchParams.set("classificationName", "music");
    url.searchParams.set("size",               "50");

    const tmRes = await fetch(url.toString());
    if (!tmRes.ok) {
      const text = await tmRes.text();
      console.error(`[ExclusiveDetroit] Ticketmaster concerts HTTP ${tmRes.status}:`, text.slice(0, 200));
      return res.status(502).json({ error: `Ticketmaster HTTP ${tmRes.status}` });
    }

    const data = await tmRes.json();
    // s-maxage=300: fresh for 5 min on CDN
    // stale-while-revalidate=3600: serve stale while refreshing for up to 1 hour
    // stale-if-error=86400: serve last-known-good for 24 hr on upstream error
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=3600, stale-if-error=86400");
    return res.json(data);
  } catch (err) {
    console.error("[ExclusiveDetroit] concerts fetch error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
