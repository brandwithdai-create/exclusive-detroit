// Vercel serverless function — Detroit events via Ticketmaster
// Path: /api/events/[type]  (handles games, concerts, theatre, family)
// VITE_TICKETMASTER_KEY must be set in Vercel project environment variables.

const KEY = process.env.VITE_TICKETMASTER_KEY;
const TM_BASE = "https://app.ticketmaster.com/discovery/v2/events.json";

const TYPE_MAP = {
  games:    { classificationName: "sports",        size: "50" },
  concerts: { classificationName: "music",          size: "50" },
  theatre:  { classificationName: "arts & theatre", size: "50" },
  family:   { classificationName: "family",         size: "25" },
};

function getDateRange(daysAhead = 60) {
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + daysAhead);
  const pad = n => String(n).padStart(2, "0");
  const fmt = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return {
    startDateTime: `${fmt(now)}T00:00:00Z`,
    endDateTime:   `${fmt(end)}T23:59:59Z`,
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  const { type } = req.query;
  const params = TYPE_MAP[type];

  if (!params) {
    return res.status(404).json({ error: `Unknown event type: "${type}"` });
  }

  if (!KEY) {
    console.error("[ExclusiveDetroit] VITE_TICKETMASTER_KEY is not set in Vercel environment variables");
    return res.status(500).json({ error: "VITE_TICKETMASTER_KEY not configured" });
  }

  try {
    const { startDateTime, endDateTime } = getDateRange(60);
    const url = new URL(TM_BASE);
    url.searchParams.set("apikey",             KEY);
    url.searchParams.set("city",               "Detroit");
    url.searchParams.set("stateCode",          "MI");
    url.searchParams.set("countryCode",        "US");
    url.searchParams.set("startDateTime",      startDateTime);
    url.searchParams.set("endDateTime",        endDateTime);
    url.searchParams.set("sort",               "date,asc");
    url.searchParams.set("classificationName", params.classificationName);
    url.searchParams.set("size",               params.size);

    const tmRes = await fetch(url.toString());
    if (!tmRes.ok) {
      const text = await tmRes.text();
      console.error(`[ExclusiveDetroit] Ticketmaster HTTP ${tmRes.status} for ${type}:`, text.slice(0, 200));
      return res.status(502).json({ error: `Ticketmaster HTTP ${tmRes.status}` });
    }

    const data = await tmRes.json();

    // Cache at Vercel CDN edge for 5 minutes, serve stale up to 30 min
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=1800");
    return res.json(data);

  } catch (err) {
    console.error(`[ExclusiveDetroit] Events fetch error (${type}):`, err.message);
    return res.status(500).json({ error: err.message });
  }
}
