// ─────────────────────────────────────────────────────────────────────────────
// Exclusive Detroit — Live Data Fetcher  v4
// Single source of truth: Ticketmaster Discovery API only.
//
// INTEGRITY RULES (enforced per-event, no exceptions):
//   1. Every event object is built from ONE Ticketmaster response object.
//   2. title, date, venue, and ticket_url must all be present and non-empty.
//   3. ticket_url must start with https:// — no relative URLs, no placeholders.
//   4. ticket_url domain must be in TRUSTED_TICKET_DOMAINS. This rejects resale
//      and secondary-market listings (e.g. GOFEVO) that TM sometimes returns
//      alongside primary events.
//   5. image must be a real URL from the TM response — no stock photos injected.
//      Exception: Games use a sport-specific photo pool because TM returns the
//      same team-promo image for every home game of the same team.
//   6. desc comes from the TM event's own `info` or `pleaseNote` field only.
//      We never generate synthetic descriptions.
//   7. _source is tagged on every object so the UI can log and verify origin.
//   8. On any API failure, concerts and events return [] — never demo data.
//   9. Games fall back to the static GAMES array (real venue / real team ticketing
//      page URLs) only when TM returns zero Detroit home-game results.
//  10. After ID-based dedup, a content-based dedup collapses any remaining events
//      that share the same normalized title + venue + date (same-day window).
//      The first occurrence (primary TM listing) always wins.
// ─────────────────────────────────────────────────────────────────────────────

import { GAMES, isUpcoming } from "./eventsData.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

function dedupeById(arr) {
  const seen = new Set();
  return arr.filter(x => { if (seen.has(x.id)) return false; seen.add(x.id); return true; });
}

function sortByDate(arr) {
  return [...arr].sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));
}

// ── Trusted ticket-domain allowlist ───────────────────────────────────────────
// Ticketmaster's API can return resale/secondary-market listings (e.g. GOFEVO)
// alongside primary events. Only events whose ticket URL belongs to a trusted
// primary-ticket domain are displayed. Eventbrite is included for future use.
const TRUSTED_TICKET_DOMAINS = [
  "ticketmaster.com",
  "livenation.com",
  "ticketweb.com",    // Ticketmaster-owned; used for small/local venues
  "eventbrite.com",
  "axs.com",
];

function isTrustedTicketDomain(url) {
  if (!url) return false;
  try {
    const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    return TRUSTED_TICKET_DOMAINS.some(d => hostname === d || hostname.endsWith("." + d));
  } catch { return false; }
}

// ── Content-based deduplication ───────────────────────────────────────────────
// Two-level duplicate detection:
//
// Level A — Same venue: collapses events sharing title-prefix + venue + date.
//   Handles TM's per-ticket-type variants (e.g. "Hamilton (Touring)" vs
//   "Hamilton (Touring) - Recommended for ages 10+") and matinee/evening pairs.
//
// Level B — Different venue, same time: collapses events sharing title-prefix +
//   date + start time (within CROSS_VENUE_WINDOW_HRS) across different venues.
//   A touring show cannot physically be at two venues simultaneously; when TM
//   returns two such entries the second is a data error. The first entry in the
//   API response (the primary/canonical listing) is always kept.
//   TBA-time events are never cross-venue deduped (can't compare unknown times).
//
// The array must be pre-sorted so the canonical TM listing appears first.

const CROSS_VENUE_WINDOW_HRS = 2;

function normalizeTitle(title) {
  return (title || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function titlesOverlap(a, b) {
  if (a === b) return true;
  if (b.startsWith(a + " ") || a.startsWith(b + " ")) return true;
  return false;
}

// Parse "H:MM AM/PM ET" → decimal hours (null if TBA / unparseable)
function parseDisplayTime(timeStr) {
  if (!timeStr || timeStr === "TBA") return null;
  const m = timeStr.match(/^(\d+):(\d+)\s+(AM|PM)/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const pm = m[3].toUpperCase() === "PM";
  if (pm && h !== 12) h += 12;
  if (!pm && h === 12) h = 0;
  return h + parseInt(m[2], 10) / 60;
}

function timesAreClose(timeA, timeB) {
  const a = parseDisplayTime(timeA);
  const b = parseDisplayTime(timeB);
  if (a === null || b === null) return false; // TBA → cannot compare → not a dup
  return Math.abs(a - b) <= CROSS_VENUE_WINDOW_HRS;
}

function dedupeByContent(arr) {
  const kept = [];
  for (const ev of arr) {
    const normTitle = normalizeTitle(ev.title);
    const venue     = (ev.venue || "").toLowerCase().trim();
    const date      = ev.date || "";

    const isDup = kept.some(k => {
      if ((k.date || "") !== date) return false;
      if (!titlesOverlap(normalizeTitle(k.title), normTitle)) return false;

      const kVenue = (k.venue || "").toLowerCase().trim();

      // Level A: same venue → always a duplicate
      if (kVenue === venue) return true;

      // Level B: different venue, same title, same date, same start time
      // → touring show listed at two venues simultaneously → TM data error
      return timesAreClose(k.time, ev.time);
    });

    if (isDup) {
      console.log(`[ExclusiveDetroit] CONTENT-DEDUP removed "${ev.title}" on ${date} @ ${ev.venue} (url: ${ev.ticket_url})`);
    } else {
      kept.push(ev);
    }
  }
  return kept;
}


function formatTMTime(datetime, localTime) {
  if (!datetime && !localTime) return "TBA";
  try {
    const t = localTime || datetime.split("T")[1]?.slice(0, 5);
    if (!t) return "TBA";
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    return `${h % 12 || 12}:${String(m).padStart(2,"0")} ${ampm} ET`;
  } catch { return "TBA"; }
}

function tmImageUrl(images, preferRatio = "16_9") {
  if (!images?.length) return null;
  const match = images.find(i => i.ratio === preferRatio && i.width > 400);
  return match?.url || images.find(i => i.url)?.url || null;
}


// ── Strict per-event validator ────────────────────────────────────────────────
// All five fields must belong to the same TM event object.
// Returns true if the event passes; logs a warning and returns false if not.
function validateEvent(built, tmEventId, label) {
  const required = { title: built.title, date: built.date, venue: built.venue, ticket_url: built.ticket_url };
  for (const [field, val] of Object.entries(required)) {
    if (!val || String(val).trim() === "") {
      console.warn(`[ExclusiveDetroit] SKIP ${label} tmId=${tmEventId}: missing field "${field}"`);
      return false;
    }
  }
  if (!built.ticket_url.startsWith("https://")) {
    console.warn(`[ExclusiveDetroit] SKIP ${label} tmId=${tmEventId}: ticket_url is not https ("${built.ticket_url}")`);
    return false;
  }
  if (!isTrustedTicketDomain(built.ticket_url)) {
    console.warn(`[ExclusiveDetroit] SKIP ${label} tmId=${tmEventId}: untrusted ticket domain — resale/secondary source excluded ("${built.ticket_url}")`);
    return false;
  }
  if (!built.image || !built.image.startsWith("http")) {
    console.warn(`[ExclusiveDetroit] SKIP ${label} tmId=${tmEventId}: no valid image URL`);
    return false;
  }
  return true;
}

// ── Source logger ─────────────────────────────────────────────────────────────
function logBatch(label, items) {
  console.log(`[ExclusiveDetroit] ${label}: ${items.length} items | ${new Date().toISOString()} | first: "${(items[0]?.title || items[0]?.team) ?? "—"}"`);
}

// ── Team / sport helpers ──────────────────────────────────────────────────────
const DETROIT_TEAMS = {
  lions:       { name:"Detroit Lions",    sport:"NFL", short:"Lions"    },
  tigers:      { name:"Detroit Tigers",   sport:"MLB", short:"Tigers"   },
  pistons:     { name:"Detroit Pistons",  sport:"NBA", short:"Pistons"  },
  "red wings": { name:"Detroit Red Wings", sport:"NHL", short:"Red Wings" },
};
const SPORT_LOGOS = {
  MLB: "https://a.espncdn.com/i/teamlogos/mlb/500/det.png",
  NBA: "https://a.espncdn.com/i/teamlogos/nba/500/det.png",
  NHL: "https://a.espncdn.com/i/teamlogos/nhl/500/det.png",
  NFL: "https://a.espncdn.com/i/teamlogos/nfl/500/det.png",
};
const PX = id => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=800&h=450&fit=crop`;
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
    PX(945471),
  ],
  NHL: [
    "https://images.unsplash.com/photo-1515703407324-5f753afd8be8?w=800&q=85",
    "https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?w=800&q=85",
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=85",
  ],
  NFL: [
    "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800&q=85",
    PX(1618200), PX(2570139), PX(209956),
  ],
};

function detectTeamInfo(name) {
  const n = (name || "").toLowerCase();
  for (const [key, val] of Object.entries(DETROIT_TEAMS)) {
    if (n.includes(key)) return val;
  }
  return null;
}

// ── Hood normalizer ───────────────────────────────────────────────────────────
const DETROIT_HOODS = ["downtown detroit","midtown","corktown","eastern market","bricktown","new center","rivertown","brush park"];
function normalizeHood(city, venueName) {
  const combined = `${city || ""} ${venueName || ""}`.toLowerCase();
  for (const h of DETROIT_HOODS) {
    if (combined.includes(h)) return h.split(" ").map(w => w[0].toUpperCase()+w.slice(1)).join(" ");
  }
  return "Detroit";
}

// ── TM event mapper ───────────────────────────────────────────────────────────
// Builds one flat object strictly from one TM event (`ev`).
// No fields are injected from outside sources.
// desc uses TM's own info/pleaseNote — null if TM provides none.
function mapTmEvent(ev, type = "concert") {
  const attraction = ev._embedded?.attractions?.[0];
  const venue      = ev._embedded?.venues?.[0];
  const dateObj    = ev.dates?.start;
  const ticketUrl  = ev.url || null;
  const img        = tmImageUrl(ev.images);

  // Description: only use what TM actually provides — never generate synthetic text
  const desc = (ev.info && ev.info.trim()) ? ev.info.trim()
             : (ev.pleaseNote && ev.pleaseNote.trim()) ? ev.pleaseNote.trim()
             : null;

  return {
    id:                   `tm-${type}-${ev.id}`,
    type,
    artist:               type === "concert" ? (attraction?.name || ev.name) : undefined,
    title:                attraction?.name || ev.name || "",
    venue:                venue?.name || "",
    hood:                 normalizeHood(venue?.city?.name, venue?.name),
    date:                 dateObj?.localDate || "",
    time:                 formatTMTime(dateObj?.dateTime, dateObj?.localTime),
    category:             ev.classifications?.[0]?.genre?.name
                          || ev.classifications?.[0]?.segment?.name
                          || (type === "concert" ? "Music" : "Event"),
    desc,                 // real TM content only, or null
    image:                img,
    ticket_url:           ticketUrl,
    affiliate_ticket_url: null,
    website_url:          ticketUrl,
    _source:              "ticketmaster",
    _tm_id:               ev.id,
  };
}

// ── fetchLiveGames ─────────────────────────────────────────────────────────────
export async function fetchLiveGames() {
  const API_URL = "/api/events/games";
  try {
    console.log("[ExclusiveDetroit] Fetching games from", API_URL);
    const res = await fetch(API_URL);
    const ct = res.headers.get("content-type") || "";
    if (!res.ok) {
      console.error(`[ExclusiveDetroit] Games API error: HTTP ${res.status} from ${API_URL}`);
      throw new Error(`Server HTTP ${res.status}`);
    }
    if (!ct.includes("application/json")) {
      console.error(`[ExclusiveDetroit] Games API returned non-JSON (content-type: "${ct}") — API server may not be reachable`);
      throw new Error(`Non-JSON response: ${ct}`);
    }
    const data = await res.json();
    const events = data?._embedded?.events || [];

    const sportCounts = {};
    const games = [];

    for (const ev of events) {
      const attractions = ev?._embedded?.attractions || [];
      const rawAttrName = attractions[0]?.name || ev.name || "";
      const n = rawAttrName.toLowerCase();
      const isDetroit = ["lion","tiger","piston","red wing"].some(k => n.includes(k));
      if (!isDetroit) continue;

      const teamInfo  = detectTeamInfo(rawAttrName);
      if (!teamInfo) continue;

      const ticketUrl = ev.url || null;
      if (!ticketUrl || !ticketUrl.startsWith("https://")) {
        console.warn(`[ExclusiveDetroit] SKIP game tmId=${ev.id}: no valid ticket URL`);
        continue;
      }

      const rawName  = ev.name || "";
      const vsParts  = rawName.split(/\s+vs\.?\s+/i);
      const opponent = vsParts.length > 1 ? vsParts[1].trim() : "TBA";

      const dateObj   = ev.dates?.start;
      const dateStr   = dateObj?.localDate || "";
      if (!dateStr) { console.warn(`[ExclusiveDetroit] SKIP game tmId=${ev.id}: no date`); continue; }

      const venue     = ev._embedded?.venues?.[0];
      const venueName = venue?.name || "";
      if (!venueName) { console.warn(`[ExclusiveDetroit] SKIP game tmId=${ev.id}: no venue`); continue; }

      // Sport image pool: TM sends same team-promo shot for all home games.
      // We rotate our verified sport photo pool for card variety.
      const pool = SPORT_IMAGE_POOLS[teamInfo.sport] || SPORT_IMAGE_POOLS.MLB;
      const idx  = sportCounts[teamInfo.sport] || 0;
      sportCounts[teamInfo.sport] = idx + 1;

      games.push({
        id:                   `tm-game-${ev.id}`,
        sport:                teamInfo.sport,
        team:                 teamInfo.name,
        teamShort:            teamInfo.short,
        opponent,
        home:                 true,
        date:                 dateStr,
        time:                 formatTMTime(dateObj?.dateTime, dateObj?.localTime),
        venue:                venueName,
        hood:                 "Downtown",
        note:                 null,
        image:                pool[idx % pool.length],
        logo_url:             SPORT_LOGOS[teamInfo.sport] || null,
        images:               [],
        ticket_url:           ticketUrl,
        affiliate_ticket_url: null,
        website_url:          ticketUrl,
        _source:              "ticketmaster",
        _tm_id:               ev.id,
      });
    }

    const live = sortByDate(dedupeById(games));
    if (live.length === 0) {
      console.warn("[ExclusiveDetroit] Games: TM returned 0 Detroit games — static fallback");
      return sortByDate(GAMES.filter(g => isUpcoming(g.date)));
    }
    logBatch("Games", live);
    return live;

  } catch (err) {
    console.warn("[ExclusiveDetroit] Games fetch error:", err.message, "— static fallback");
    return sortByDate(GAMES.filter(g => isUpcoming(g.date)));
  }
}

// ── fetchLiveConcerts ──────────────────────────────────────────────────────────
// Throws on network or API errors so ThingsToDo can show a distinct "unavailable" state.
export async function fetchLiveConcerts() {
  const API_URL = "/api/events/concerts";
  console.log("[ExclusiveDetroit] Fetching concerts from", API_URL);
  const res = await fetch(API_URL);
  const ct = res.headers.get("content-type") || "";
  if (!res.ok) {
    const msg = `Concerts API HTTP ${res.status}`;
    console.error(`[ExclusiveDetroit] ${msg} from ${API_URL}`);
    throw new Error(msg);
  }
  if (!ct.includes("application/json")) {
    const msg = `Concerts API returned non-JSON (content-type: "${ct}")`;
    console.error(`[ExclusiveDetroit] ${msg} — API server may not be reachable`);
    throw new Error(msg);
  }
  const data = await res.json();
  const events = data?._embedded?.events || [];

  const concerts = events
    .map(ev => mapTmEvent(ev, "concert"))
    .filter(ev => {
      if (!isUpcoming(ev.date)) return false;
      return validateEvent(ev, ev._tm_id, "concert");
    });

  const result = dedupeByContent(sortByDate(dedupeById(concerts)));
  logBatch("Concerts", result);
  return result;
}

// ── fetchLiveEvents ────────────────────────────────────────────────────────────
// Throws on network or API errors so ThingsToDo can show a distinct "unavailable" state.
// Fetches theatre + family in parallel; both must respond with JSON (partial failure throws).
export async function fetchLiveEvents() {
  console.log("[ExclusiveDetroit] Fetching events from /api/events/theatre + /api/events/family");
  const [r1, r2] = await Promise.all([
    fetch("/api/events/theatre"),
    fetch("/api/events/family"),
  ]);
  const ct1 = r1.headers.get("content-type") || "";
  const ct2 = r2.headers.get("content-type") || "";

  if (!r1.ok || !ct1.includes("application/json")) {
    const msg = `Theatre API HTTP ${r1.status} content-type="${ct1}"`;
    console.error(`[ExclusiveDetroit] ${msg}`);
    throw new Error(msg);
  }
  if (!r2.ok || !ct2.includes("application/json")) {
    const msg = `Family API HTTP ${r2.status} content-type="${ct2}"`;
    console.error(`[ExclusiveDetroit] ${msg}`);
    throw new Error(msg);
  }

  const [d1, d2] = await Promise.all([r1.json(), r2.json()]);

  const allEvs = [
    ...(d1?._embedded?.events || []),
    ...(d2?._embedded?.events || []),
  ];

  const events = allEvs
    .map(ev => mapTmEvent(ev, "event"))
    .filter(ev => {
      if (!isUpcoming(ev.date)) return false;
      return validateEvent(ev, ev._tm_id, "event");
    });

  const result = dedupeByContent(sortByDate(dedupeById(events)));
  logBatch("Events", result);
  return result;
}
