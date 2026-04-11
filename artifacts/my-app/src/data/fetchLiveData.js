// ─────────────────────────────────────────────────────────────────────────────
// Exclusive Detroit — Live Data Fetcher
// Ticketmaster Discovery API — powers games, concerts, and local events.
//
// INTEGRITY RULE: Every item returned by these functions MUST have a ticket_url.
// No placeholder data, no fabricated events, no events without working ticket links.
// If the API fails for concerts/events, an empty array is returned — never fake data.
// ─────────────────────────────────────────────────────────────────────────────

import { GAMES, DETROIT_EVENTS, CONCERTS, isUpcoming } from "./eventsData.js";

const TM_KEY = import.meta.env.VITE_TICKETMASTER_KEY;

// ── Dedupe helper ────────────────────────────────────────────────────────────
function dedupeById(arr) {
  const seen = new Set();
  return arr.filter(x => {
    if (seen.has(x.id)) return false;
    seen.add(x.id);
    return true;
  });
}

// ── Date sort helper ─────────────────────────────────────────────────────────
function sortByDate(arr) {
  return [...arr].sort((a, b) => {
    const da = a.date || "9999-99-99";
    const db = b.date || "9999-99-99";
    return da.localeCompare(db);
  });
}

// ── Date range helpers ───────────────────────────────────────────────────────
function getDateRange(daysAhead = 60) {
  const now  = new Date();
  const end  = new Date(now);
  end.setDate(end.getDate() + daysAhead);
  const pad  = n => String(n).padStart(2, "0");
  const fmt  = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  return {
    startDateTime: `${fmt(now)}T00:00:00Z`,
    endDateTime:   `${fmt(end)}T23:59:59Z`,
  };
}

// ─── DETROIT TEAM MAPPINGS ────────────────────────────────────────────────────
const DETROIT_TEAMS = {
  lions:       { name:"Detroit Lions",    sport:"NFL", short:"Lions"    },
  tigers:      { name:"Detroit Tigers",   sport:"MLB", short:"Tigers"   },
  pistons:     { name:"Detroit Pistons",  sport:"NBA", short:"Pistons"  },
  "red wings": { name:"Detroit Red Wings", sport:"NHL", short:"Red Wings" },
};

// ESPN CDN team logo URLs
const SPORT_LOGOS = {
  MLB: "https://a.espncdn.com/i/teamlogos/mlb/500/det.png",
  NBA: "https://a.espncdn.com/i/teamlogos/nba/500/det.png",
  NHL: "https://a.espncdn.com/i/teamlogos/nhl/500/det.png",
  NFL: "https://a.espncdn.com/i/teamlogos/nfl/500/det.png",
};

// Sport-specific action photography pools — rotated by index for card variety.
const PX = (id) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=800&h=450&fit=crop`;

const SPORT_IMAGE_POOLS = {
  MLB: [
    "https://images.unsplash.com/photo-1471295253337-3ceaaedca402?w=800&q=85",
    "https://images.unsplash.com/photo-1529768167801-9173d94c2a42?w=800&q=85",
    PX(1308713),
  ],
  NBA: [
    "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=85",
    "https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&q=85",
    "https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=800&q=85",
    "https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=800&q=85",
    "https://images.unsplash.com/photo-1515523110800-9415d13b84a8?w=800&q=85",
    "https://images.unsplash.com/photo-1516802273409-68526ee1bdd6?w=800&q=85",
    PX(945471),
  ],
  NHL: [
    "https://images.unsplash.com/photo-1515703407324-5f753afd8be8?w=800&q=85",
    "https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?w=800&q=85",
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=85",
  ],
  NFL: [
    "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800&q=85",
    PX(1618200),
    PX(2570139),
    PX(209956),
    PX(1618294),
    PX(1618305),
  ],
};

function detectTeamInfo(name) {
  const n = (name || "").toLowerCase();
  for (const [key, val] of Object.entries(DETROIT_TEAMS)) {
    if (n.includes(key)) return val;
  }
  return null;
}

function formatTMTime(datetime, localTime) {
  if (!datetime && !localTime) return "TBA";
  try {
    const t = localTime || datetime.split("T")[1]?.slice(0, 5);
    if (!t) return "TBA";
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12  = h % 12 || 12;
    return `${h12}:${String(m).padStart(2,"0")} ${ampm} ET`;
  } catch { return "TBA"; }
}

function tmImageUrl(images, preferRatio = "16_9") {
  if (!images?.length) return null;
  const match = images.find(i => i.ratio === preferRatio && i.width > 400);
  return match?.url || images[0]?.url || null;
}

// ── Ticketmaster base URL builder ─────────────────────────────────────────────
function tmUrl(extraParams, daysAhead = 60) {
  const { startDateTime, endDateTime } = getDateRange(daysAhead);
  const url = new URL("https://app.ticketmaster.com/discovery/v2/events.json");
  url.searchParams.set("apikey", TM_KEY);
  url.searchParams.set("city", "Detroit");
  url.searchParams.set("stateCode", "MI");
  url.searchParams.set("countryCode", "US");
  url.searchParams.set("startDateTime", startDateTime);
  url.searchParams.set("endDateTime", endDateTime);
  url.searchParams.set("sort", "date,asc");
  for (const [k, v] of Object.entries(extraParams)) url.searchParams.set(k, v);
  return url.toString();
}

// ── Fetch Games from Ticketmaster ─────────────────────────────────────────────
// On API success: returns real Ticketmaster Detroit home games.
// On API failure: falls back to static GAMES array (real venues, real team ticket pages).
export async function fetchLiveGames() {
  if (!TM_KEY) return sortByDate(GAMES.filter(g => isUpcoming(g.date)));

  const url = tmUrl({ classificationName: "sports", size: "50" });

  try {
    const res  = await fetch(url);
    if (!res.ok) throw new Error(`TM API ${res.status}`);
    const data = await res.json();
    const events = data?._embedded?.events || [];

    const games = [];
    const sportCounts = {};
    for (const ev of events) {
      const attractions = ev?._embedded?.attractions || [];
      const name = (attractions[0]?.name || ev.name || "").toLowerCase();

      const isDetroit = ["lion","tiger","piston","red wing"].some(k => name.includes(k));
      if (!isDetroit) continue;

      const teamInfo = detectTeamInfo(attractions[0]?.name || ev.name);
      if (!teamInfo) continue;

      // Only include events with a real Ticketmaster ticket URL
      const ticketUrl = ev.url || null;
      if (!ticketUrl) continue;

      const rawName  = ev.name || "";
      const vsParts  = rawName.split(/\s+vs\.?\s+/i);
      const opponent = vsParts.length > 1 ? vsParts[1].trim() : "TBA";

      const dateObj   = ev.dates?.start;
      const dateStr   = dateObj?.localDate || "";
      const timeStr   = formatTMTime(dateObj?.dateTime, dateObj?.localTime);
      const venue     = ev._embedded?.venues?.[0];
      const venueName = venue?.name || "Detroit";
      const tmImg     = tmImageUrl(ev.images, "16_9");
      const pool      = SPORT_IMAGE_POOLS[teamInfo.sport] || SPORT_IMAGE_POOLS.MLB;
      const idx       = sportCounts[teamInfo.sport] || 0;
      sportCounts[teamInfo.sport] = idx + 1;
      const img       = pool[idx % pool.length];

      games.push({
        id:                   `tm-game-${ev.id}`,
        sport:                teamInfo.sport,
        team:                 teamInfo.name,
        teamShort:            teamInfo.short,
        opponent,
        home:                 true,
        date:                 dateStr,
        time:                 timeStr,
        venue:                venueName,
        hood:                 "Downtown",
        note:                 null,
        image:                img,
        logo_url:             SPORT_LOGOS[teamInfo.sport] || null,
        images:               tmImg ? [tmImg] : [],
        ticket_url:           ticketUrl,
        affiliate_ticket_url: null,
        website_url:          ticketUrl,
        _source:              "ticketmaster",
      });
    }

    const live = sortByDate(dedupeById(games));

    // If TM returned no Detroit games, fall back to static (real venues/team pages)
    if (live.length === 0) {
      return sortByDate(GAMES.filter(g => isUpcoming(g.date)));
    }
    return live;
  } catch (err) {
    console.warn("[ExclusiveDetroit] Games fetch failed, using curated:", err.message);
    return sortByDate(GAMES.filter(g => isUpcoming(g.date)));
  }
}

// ── Shared: hood normalizer ───────────────────────────────────────────────────
const DETROIT_HOODS = ["downtown detroit", "midtown", "corktown", "eastern market", "bricktown", "new center", "rivertown", "brush park"];
function normalizeHood(city, venueName) {
  const combined = `${city || ""} ${venueName || ""}`.toLowerCase();
  for (const h of DETROIT_HOODS) {
    if (combined.includes(h)) {
      return h.split(" ").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
    }
  }
  return "Detroit";
}

// ── Shared: map a Ticketmaster event → concert/event object ──────────────────
function mapTmEvent(ev, type = "concert") {
  const attraction = ev._embedded?.attractions?.[0];
  const venue      = ev._embedded?.venues?.[0];
  const dateObj    = ev.dates?.start;
  const dateStr    = dateObj?.localDate || "";
  const timeStr    = formatTMTime(dateObj?.dateTime, dateObj?.localTime);
  const hood       = normalizeHood(venue?.city?.name, venue?.name);
  const genre      = ev.classifications?.[0]?.genre?.name
                   || ev.classifications?.[0]?.segment?.name
                   || (type === "concert" ? "Music" : "Event");
  const img        = tmImageUrl(ev.images);
  const artistName = attraction?.name || ev.name;
  const venueName  = venue?.name || "Detroit";
  const ticketUrl  = ev.url || null;

  return {
    id:                   `tm-${type}-${ev.id}`,
    type,
    artist:               type === "concert" ? artistName : undefined,
    title:                artistName,
    venue:                venueName,
    hood,
    date:                 dateStr,
    time:                 timeStr,
    category:             genre,
    desc:                 `Live at ${venueName}. ${genre}. Doors open shortly before show time.`,
    image:                img,
    ticket_url:           ticketUrl,
    affiliate_ticket_url: null,
    website_url:          ticketUrl,
    _source:              "ticketmaster",
  };
}

// ── Fetch Concerts from Ticketmaster ─────────────────────────────────────────
// Returns only verified Ticketmaster events with real ticket URLs.
// On API failure: returns [] — no fake fallback data.
export async function fetchLiveConcerts() {
  if (!TM_KEY) return [];

  try {
    const res  = await fetch(tmUrl({ classificationName: "music", size: "50" }));
    if (!res.ok) throw new Error(`TM API ${res.status}`);
    const data = await res.json();
    const events = data?._embedded?.events || [];

    const concerts = events
      .map(ev => mapTmEvent(ev, "concert"))
      .filter(c => c.date && isUpcoming(c.date) && c.ticket_url);

    return sortByDate(dedupeById(concerts));
  } catch (err) {
    console.warn("[ExclusiveDetroit] Concerts fetch failed:", err.message);
    return [];
  }
}

// ── Fetch Events from Ticketmaster (Arts, Theatre, Comedy, Family, Misc) ──────
// Returns only verified Ticketmaster events with real ticket URLs.
// On API failure: returns [] — no fake fallback data.
export async function fetchLiveEvents() {
  if (!TM_KEY) return [];

  try {
    const [r1, r2] = await Promise.all([
      fetch(tmUrl({ classificationName: "arts & theatre", size: "50" })),
      fetch(tmUrl({ classificationName: "family", size: "25" })),
    ]);

    const [d1, d2] = await Promise.all([
      r1.ok ? r1.json() : Promise.resolve({}),
      r2.ok ? r2.json() : Promise.resolve({}),
    ]);

    const allEvs = [
      ...(d1?._embedded?.events || []),
      ...(d2?._embedded?.events || []),
    ];

    const events = allEvs
      .map(ev => mapTmEvent(ev, "event"))
      .filter(e => e.date && isUpcoming(e.date) && e.ticket_url);

    return sortByDate(dedupeById(events));
  } catch (err) {
    console.warn("[ExclusiveDetroit] Events fetch failed:", err.message);
    return [];
  }
}
