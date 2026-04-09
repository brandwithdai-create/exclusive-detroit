// ─────────────────────────────────────────────────────────────────────────────
// Exclusive Detroit — Live Data Fetcher
// Ticketmaster Discovery API + Eventbrite API
// Falls back to curated data if keys are missing or requests fail.
// ─────────────────────────────────────────────────────────────────────────────

import { GAMES, DETROIT_EVENTS, CONCERTS, isUpcoming } from "./eventsData.js";

const TM_KEY   = import.meta.env.VITE_TICKETMASTER_KEY;
const EB_TOKEN = import.meta.env.VITE_EVENTBRITE_TOKEN;

// ── Dedupe helper ────────────────────────────────────────────────────────────
function dedupeById(arr) {
  const seen = new Set();
  return arr.filter(x => {
    if (seen.has(x.id)) return false;
    seen.add(x.id);
    return true;
  });
}

// ── Week range helpers ───────────────────────────────────────────────────────
function getWeekRange() {
  const now  = new Date();
  const end  = new Date(now);
  end.setDate(end.getDate() + 14); // look 2 weeks ahead for better coverage
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
// 14+ images per sport — enough for a full 2-week MLB schedule without repeats.
// Each image is a different angle/moment so cards look distinct even for the same team.
const SPORT_IMAGE_POOLS = {
  MLB: [
    "https://images.unsplash.com/photo-1471295253337-3ceaaedca402?w=800&q=85", // batter swing
    "https://images.unsplash.com/photo-1562077772-3bd90403f7f0?w=800&q=85",    // outfield action
    "https://images.unsplash.com/photo-1509773896068-7fd415d91e2e?w=800&q=85", // stadium crowd
    "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=800&q=85", // night game
    "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=800&q=85", // baseball glove
    "https://images.unsplash.com/photo-1529768167801-9173d94c2a42?w=800&q=85", // stadium overview
    "https://images.unsplash.com/photo-1585149764328-9b1cd98c0bb0?w=800&q=85", // play at base
    "https://images.unsplash.com/photo-1547347298-4074fc3086f0?w=800&q=85",    // dugout/stadium
    "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=85", // arena lights
    "https://images.unsplash.com/photo-1622548697893-d4f5aaf7e9f4?w=800&q=85", // baseball pitch
    "https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?w=800&q=85", // ballpark aerial
    "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=85",    // sports crowd
    "https://images.unsplash.com/photo-1516802273409-68526ee1bdd6?w=800&q=85", // sports arena
    "https://images.unsplash.com/photo-1587280501635-68a0ef0ccb13?w=800&q=85", // baseball game
    "https://images.unsplash.com/photo-1489459237519-2a17a20fe071?w=800&q=85", // baseball field
  ],
  NBA: [
    "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=85",    // court/arena
    "https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&q=85", // game action
    "https://images.unsplash.com/photo-1485395578879-6ba4a42d7383?w=800&q=85", // hoop close-up
    "https://images.unsplash.com/photo-1460542683952-17fa7eb0f769?w=800&q=85", // arena lights
    "https://images.unsplash.com/photo-1556804335-2fa563e93aae?w=800&q=85",    // dunk/action
    "https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=800&q=85", // player/ball
    "https://images.unsplash.com/photo-1515523110800-9415d13b84a8?w=800&q=85", // arena crowd
    "https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=800&q=85", // basketball game
  ],
  NHL: [
    "https://images.unsplash.com/photo-1515703407324-5f753afd8be8?w=800&q=85", // ice action
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=85", // hockey game
    "https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=800&q=85", // rink overhead
    "https://images.unsplash.com/photo-1612966797534-ef0d7de9fa47?w=800&q=85", // hockey match
    "https://images.unsplash.com/photo-1548445929-4f60a497f851?w=800&q=85",    // stadium seats
    "https://images.unsplash.com/photo-1569097656579-b1be2d88bb72?w=800&q=85", // rink/ice
    "https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?w=800&q=85", // arena aerial
    "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=85",    // arena crowd
  ],
  NFL: [
    "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=85", // game action
    "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=85", // football action
    "https://images.unsplash.com/photo-1461896836234-19f36d1b8e0f?w=800&q=85", // stadium aerial
    "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800&q=85", // crowd energy
    "https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?w=800&q=85", // play in action
    "https://images.unsplash.com/photo-1460518451285-97b6aa326961?w=800&q=85", // stadium lights
    "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=85", // arena night
    "https://images.unsplash.com/photo-1516802273409-68526ee1bdd6?w=800&q=85", // sports arena
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

// ── Fetch Games from Ticketmaster ─────────────────────────────────────────────
export async function fetchLiveGames() {
  if (!TM_KEY) return GAMES.filter(g => isUpcoming(g.date));

  const { startDateTime, endDateTime } = getWeekRange();
  const url = new URL("https://app.ticketmaster.com/discovery/v2/events.json");
  url.searchParams.set("apikey", TM_KEY);
  url.searchParams.set("classificationName", "sports");
  url.searchParams.set("city", "Detroit");
  url.searchParams.set("stateCode", "MI");
  url.searchParams.set("countryCode", "US");
  url.searchParams.set("startDateTime", startDateTime);
  url.searchParams.set("endDateTime", endDateTime);
  url.searchParams.set("size", "50");
  url.searchParams.set("sort", "date,asc");

  try {
    const res  = await fetch(url.toString());
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

    return dedupeById([...live, ...curatedFill]);
  } catch (err) {
    console.warn("[ExclusiveDetroit] Games fetch failed, using curated:", err.message);
    return GAMES.filter(g => isUpcoming(g.date));
  }
}

// ── Fetch Concerts from Ticketmaster ─────────────────────────────────────────
export async function fetchLiveConcerts() {
  if (!TM_KEY) return CONCERTS.filter(c => isUpcoming(c.date));

  const { startDateTime, endDateTime } = getWeekRange();
  const url = new URL("https://app.ticketmaster.com/discovery/v2/events.json");
  url.searchParams.set("apikey", TM_KEY);
  url.searchParams.set("classificationName", "music");
  url.searchParams.set("city", "Detroit");
  url.searchParams.set("stateCode", "MI");
  url.searchParams.set("countryCode", "US");
  url.searchParams.set("startDateTime", startDateTime);
  url.searchParams.set("endDateTime", endDateTime);
  url.searchParams.set("size", "50");
  url.searchParams.set("sort", "date,asc");

  try {
    const res  = await fetch(url.toString());
    if (!res.ok) throw new Error(`TM API ${res.status}`);
    const data = await res.json();
    const events = data?._embedded?.events || [];

    const concerts = events.map(ev => {
      const attraction = ev._embedded?.attractions?.[0];
      const venue      = ev._embedded?.venues?.[0];
      const dateObj    = ev.dates?.start;
      const dateStr    = dateObj?.localDate || "";
      const timeStr    = formatTMTime(dateObj?.dateTime, dateObj?.localTime);
      const hood       = normalizeHood(venue?.city?.name, venue?.name);
      const genre      = ev.classifications?.[0]?.genre?.name || "Music";
      const img        = tmImageUrl(ev.images);

      return {
        id:                `tm-concert-${ev.id}`,
        type:              "concert",
        artist:            attraction?.name || ev.name,
        title:             attraction?.name || ev.name,
        venue:             venue?.name || "Detroit",
        hood,
        date:              dateStr,
        time:              timeStr,
        category:          genre,
        desc:              `Live at ${venue?.name || "Detroit"}. ${genre} event. Doors open shortly before show time.`,
        image:             img,
        ticket_url:        ev.url || null,
        affiliate_ticket_url: null,
        website_url:       ev.url || null,
        _source:           "ticketmaster",
      };
    }).filter(c => c.date && isUpcoming(c.date));

    const live = dedupeById(concerts);
    if (live.length >= 3) return live;

    // Supplement with curated if sparse
    const liveIds = new Set(live.map(c => c.artist?.toLowerCase()));
    const extra   = CONCERTS
      .filter(c => isUpcoming(c.date) && !liveIds.has(c.artist?.toLowerCase()))
      .slice(0, 6 - live.length);
    return dedupeById([...live, ...extra]);
  } catch (err) {
    console.warn("[ExclusiveDetroit] Concerts fetch failed, using curated:", err.message);
    return CONCERTS.filter(c => isUpcoming(c.date));
  }
}

// ── Fetch Events from Eventbrite ──────────────────────────────────────────────
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

export async function fetchLiveEvents() {
  if (!EB_TOKEN) return DETROIT_EVENTS.filter(e => isUpcoming(e.date));

  const { startDateTime, endDateTime } = getWeekRange();
  // Eventbrite: search Detroit-area events
  const url = new URL("https://www.eventbriteapi.com/v3/events/search/");
  url.searchParams.set("location.address", "Detroit, MI");
  url.searchParams.set("location.within", "10mi");
  url.searchParams.set("start_date.range_start", startDateTime);
  url.searchParams.set("start_date.range_end", endDateTime);
  url.searchParams.set("sort_by", "date");
  url.searchParams.set("expand", "venue,organizer,ticket_classes,category");
  url.searchParams.set("page_size", "50");

  try {
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${EB_TOKEN}` },
    });
    if (!res.ok) throw new Error(`EB API ${res.status}`);
    const data = await res.json();
    const evts = data?.events || [];

    const events = evts
      .filter(ev => {
        // Only free or ticketed events in central Detroit areas
        const city   = (ev.venue?.city || "").toLowerCase();
        const addr   = (ev.venue?.address?.city || "").toLowerCase();
        return city.includes("detroit") || addr.includes("detroit");
      })
      .map(ev => {
        const hood     = normalizeHood(ev.venue?.city, ev.venue?.name);
        const dateStr  = ev.start?.local?.slice(0, 10) || "";
        const timeRaw  = ev.start?.local?.slice(11, 16) || "";
        const timeStr  = timeRaw
          ? (() => {
              const [h, m] = timeRaw.split(":").map(Number);
              const ampm   = h >= 12 ? "PM" : "AM";
              return `${h % 12 || 12}:${String(m).padStart(2,"0")} ${ampm}`;
            })()
          : "TBA";

        const rawDesc  = ev.description?.text || ev.summary || "";
        const desc     = rawDesc.length > 180 ? rawDesc.slice(0, 177) + "…" : rawDesc || `${ev.name?.text || "Event"} in Detroit.`;
        const img      = ev.logo?.url || null;
        const ticketUrl = ev.url || null;

        return {
          id:                `eb-event-${ev.id}`,
          type:              "event",
          title:             ev.name?.text || "Detroit Event",
          venue:             ev.venue?.name || "Detroit",
          hood,
          date:              dateStr,
          time:              timeStr,
          category:          ev.category?.name || "Event",
          desc,
          image:             img,
          ticket_url:        ticketUrl,
          affiliate_ticket_url: null,
          website_url:       ticketUrl,
          _source:           "eventbrite",
        };
      })
      .filter(e => e.date && isUpcoming(e.date));

    const live = dedupeById(events);
    if (live.length >= 3) return live;

    // Supplement with curated if sparse
    const liveTitles = new Set(live.map(e => e.title.toLowerCase()));
    const extra      = DETROIT_EVENTS
      .filter(e => isUpcoming(e.date) && !liveTitles.has(e.title.toLowerCase()))
      .slice(0, 8 - live.length);
    return dedupeById([...live, ...extra]);
  } catch (err) {
    console.warn("[ExclusiveDetroit] Events fetch failed, using curated:", err.message);
    return DETROIT_EVENTS.filter(e => isUpcoming(e.date));
  }
}
