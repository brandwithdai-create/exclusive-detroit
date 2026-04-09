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

// Sport-specific action photography fallback (Unsplash) used when Ticketmaster
// provides no image for a live game, or for curated static entries.
const SPORT_ACTION_IMAGES = {
  MLB: "https://images.unsplash.com/photo-1471295253337-3ceaaedca402?w=800&q=85",
  NBA: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=85",
  NHL: "https://images.unsplash.com/photo-1515703407324-5f753afd8be8?w=800&q=85",
  NFL: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=85",
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
      const tmImg    = tmImageUrl(ev.images);
      // Always use sport-specific action photography as the primary card image.
      // Ticketmaster images are usually team-branded graphics/logos, not action shots.
      // The Ticketmaster image is stored in images[] for future use (gallery, etc.).
      const img      = SPORT_ACTION_IMAGES[teamInfo.sport] || null;

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
