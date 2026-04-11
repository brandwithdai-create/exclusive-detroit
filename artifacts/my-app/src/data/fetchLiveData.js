// ─────────────────────────────────────────────────────────────────────────────
// Exclusive Detroit — Live Data Fetcher
// Ticketmaster Discovery API — powers games, concerts, and local events.
// Falls back to curated data if the key is missing or requests fail.
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
  lions:    { name:"Detroit Lions",    sport:"NFL", short:"Lions"    },
  tigers:   { name:"Detroit Tigers",   sport:"MLB", short:"Tigers"   },
  pistons:  { name:"Detroit Pistons",  sport:"NBA", short:"Pistons"  },
  "red wings": { name:"Detroit Red Wings", sport:"NHL", short:"Red Wings" },
};

// ESPN CDN team logo URLs — used as badge overlay on game card images
const SPORT_LOGOS = {
  MLB: "https://a.espncdn.com/i/teamlogos/mlb/500/det.png",
  NBA: "https://a.espncdn.com/i/teamlogos/nba/500/det.png",
  NHL: "https://a.espncdn.com/i/teamlogos/nhl/500/det.png",
  NFL: "https://a.espncdn.com/i/teamlogos/nfl/500/det.png",

};

// Sport-specific action photography pools — unique images per sport.
// Rotated by index so every game card gets a different photo.
// Every image below was VISUALLY VERIFIED via screenshot — no guessing.
// All broken 404s and mis-labeled images (boots, book, volleyball, etc.) removed.
// Pexels images use the crop format for consistent 16:9 card aspect ratio.
const PX = (id) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=800&h=450&fit=crop`;

const SPORT_IMAGE_POOLS = {
  // Verified: all show baseball (stadium aerial, home-plate play, baseballs)
  MLB: [
    "https://images.unsplash.com/photo-1471295253337-3ceaaedca402?w=800&q=85", // baseball stadium from above
    "https://images.unsplash.com/photo-1529768167801-9173d94c2a42?w=800&q=85", // slide play at home plate
    PX(1308713),                                                                 // baseballs close-up
  ],
  // Verified: all show basketball court, arena, or player action
  NBA: [
    "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=85",    // ball through hoop
    "https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&q=85", // arena wide shot
    "https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=800&q=85", // player dunking
    "https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=800&q=85", // basketballs close-up
    "https://images.unsplash.com/photo-1515523110800-9415d13b84a8?w=800&q=85", // hoop net close-up
    "https://images.unsplash.com/photo-1516802273409-68526ee1bdd6?w=800&q=85", // Spalding NBA ball
    PX(945471),                                                                  // basketball court
  ],
  // Verified: all show ice hockey — goal post, game action, rink
  NHL: [
    "https://images.unsplash.com/photo-1515703407324-5f753afd8be8?w=800&q=85", // hockey goal post
    "https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?w=800&q=85", // hockey game action
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=85", // empty ice rink
  ],
  // Verified: all show American football
  NFL: [
    "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800&q=85", // football on field
    PX(1618200),                                                                 // scrimmage line
    PX(2570139),                                                                 // football on grass
    PX(209956),                                                                  // football on turf
    PX(1618294),                                                                 // game action
    PX(1618305),                                                                 // game action 2
  ],
};

function detectSport(attraction) {
  const name = (attraction?.name || "").toLowerCase();
  if (name.includes("lion"))      return "NFL";
  if (name.includes("tiger"))     return "MLB";
  if (name.includes("piston"))    return "NBA";
  if (name.includes("red wing"))  return "NHL";
  return null;
}

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
      // Only Detroit home games for our four teams
      const attractions = ev?._embedded?.attractions || [];
      const name = (attractions[0]?.name || ev.name || "").toLowerCase();

      const isDetroit = ["lion","tiger","piston","red wing"].some(k => name.includes(k));
      if (!isDetroit) continue;

      const teamInfo = detectTeamInfo(attractions[0]?.name || ev.name);
      if (!teamInfo) continue;

      // Find opponent from the name (usually "Team vs Opponent")
      const rawName  = ev.name || "";
      const vsParts  = rawName.split(/\s+vs\.?\s+/i);
      const opponent = vsParts.length > 1 ? vsParts[1].trim() : "TBA";

      const dateObj  = ev.dates?.start;
      const dateStr  = dateObj?.localDate || "";
      const timeStr  = formatTMTime(dateObj?.dateTime, dateObj?.localTime);
      const venue    = ev._embedded?.venues?.[0];
      const venueName = venue?.name || "Detroit";
      const tmImg    = tmImageUrl(ev.images, "16_9");
      // TM uses the SAME team-level promotional image for all home games of a team
      // (not per-game unique images). Use our curated sport pool for guaranteed uniqueness.
      // TM image is saved in images[] for gallery/reference use only.
      const pool     = SPORT_IMAGE_POOLS[teamInfo.sport] || SPORT_IMAGE_POOLS.MLB;
      const idx      = sportCounts[teamInfo.sport] || 0;
      sportCounts[teamInfo.sport] = idx + 1;
      const img      = pool[idx % pool.length];

      games.push({
        id:                `tm-game-${ev.id}`,
        sport:             teamInfo.sport,
        team:              teamInfo.name,
        teamShort:         teamInfo.short,
        opponent,
        home:              true,
        date:              dateStr,
        time:              timeStr,
        venue:             venueName,
        hood:              "Downtown",
        note:              null,
        image:             img,
        logo_url:          SPORT_LOGOS[teamInfo.sport] || null,
        images:            tmImg ? [tmImg] : [],
        ticket_url:        ev.url || (teamInfo.sport === "MLB" ? "https://www.stubhub.com/detroit-tigers-tickets/category/138300332" : teamInfo.sport === "NBA" ? "https://www.stubhub.com/detroit-pistons-tickets/performer/2862" : teamInfo.sport === "NHL" ? "https://www.stubhub.com/detroit-red-wings-tickets/performer/2767" : "https://www.stubhub.com/detroit-lions-tickets/performer/6048"),
        affiliate_ticket_url: null,
        website_url:       ev.url || null,
        _source:           "ticketmaster",
      });
    }

    const live = dedupeById(games);
    // Merge curated fallback for any team not found live
    const liveSports = new Set(live.map(g => g.sport));
    const curatedFill = GAMES
      .filter(g => isUpcoming(g.date) && !liveSports.has(g.sport))
      .slice(0, 4);

    return sortByDate(dedupeById([...live, ...curatedFill]));
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

// ── Shared: map a Ticketmaster event to a concert/event object ────────────────
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
    ticket_url:           ev.url || null,
    affiliate_ticket_url: null,
    website_url:          ev.url || null,
    _source:              "ticketmaster",
  };
}

// ── Fetch Concerts from Ticketmaster ─────────────────────────────────────────
export async function fetchLiveConcerts() {
  if (!TM_KEY) return sortByDate(CONCERTS.filter(c => isUpcoming(c.date)));

  try {
    const res  = await fetch(tmUrl({ classificationName: "music", size: "50" }));
    if (!res.ok) throw new Error(`TM API ${res.status}`);
    const data = await res.json();
    const events = data?._embedded?.events || [];

    const concerts = events
      .map(ev => mapTmEvent(ev, "concert"))
      .filter(c => c.date && isUpcoming(c.date));

    const live = dedupeById(concerts);
    if (live.length >= 3) return sortByDate(live);

    // Supplement with curated if sparse
    const liveIds = new Set(live.map(c => c.artist?.toLowerCase()));
    const extra   = CONCERTS
      .filter(c => isUpcoming(c.date) && !liveIds.has(c.artist?.toLowerCase()))
      .slice(0, 6 - live.length);
    return sortByDate(dedupeById([...live, ...extra]));
  } catch (err) {
    console.warn("[ExclusiveDetroit] Concerts fetch failed, using curated:", err.message);
    return sortByDate(CONCERTS.filter(c => isUpcoming(c.date)));
  }
}

// ── Fetch Events from Ticketmaster (Arts, Theatre, Comedy, Family, Misc) ──────
// Pulls arts & theatre + family + comedy + miscellaneous categories from
// Ticketmaster — replaces the deprecated Eventbrite public search API.
export async function fetchLiveEvents() {
  if (!TM_KEY) return sortByDate(DETROIT_EVENTS.filter(e => isUpcoming(e.date)));

  try {
    // Fetch arts/theatre and family/comedy in parallel for broader coverage
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
      .filter(e => e.date && isUpcoming(e.date));

    const live = dedupeById(events);
    if (live.length >= 3) return sortByDate(live);

    // Supplement with curated if sparse
    const liveTitles = new Set(live.map(e => e.title.toLowerCase()));
    const extra      = DETROIT_EVENTS
      .filter(e => isUpcoming(e.date) && !liveTitles.has(e.title.toLowerCase()))
      .slice(0, 8 - live.length);
    return sortByDate(dedupeById([...live, ...extra]));
  } catch (err) {
    console.warn("[ExclusiveDetroit] Events fetch failed, using curated:", err.message);
    return sortByDate(DETROIT_EVENTS.filter(e => isUpcoming(e.date)));
  }
}
