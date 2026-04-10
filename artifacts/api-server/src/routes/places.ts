import { Router } from "express";
import { logger } from "../lib/logger";
import { pool } from "@workspace/db";

const router = Router();

const KEY = process.env.GOOGLE_PLACES_KEY;
const BASE = "https://places.googleapis.com/v1";

// ── Server-side cache (24-hour TTL) ─────────────────────────────────────────
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const _cache = new Map<string, { ts: number; data: unknown }>();

function cacheGet(key: string): unknown | null {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) { _cache.delete(key); return null; }
  return entry.data;
}
function cacheSet(key: string, data: unknown): void {
  _cache.set(key, { ts: Date.now(), data });
}

type PhotoRef = {
  name: string;
  authorAttributions?: { displayName: string }[];
};

type PlaceResult = {
  id?: string;
  displayName?: { text: string };
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  photos?: PhotoRef[];
  location?: { latitude: number; longitude: number };
};

async function textSearch(query: string, fields: string): Promise<PlaceResult[]> {
  if (!KEY) return [];
  const res = await fetch(`${BASE}/places:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": KEY,
      "X-Goog-FieldMask": fields,
    },
    body: JSON.stringify({ textQuery: query }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Places API ${res.status}: ${text}`);
  }
  const data = await res.json() as { places?: PlaceResult[] };
  return data.places || [];
}

async function resolvePhotoUrl(photoName: string): Promise<string | null> {
  if (!KEY) return null;
  const res = await fetch(
    `${BASE}/${photoName}/media?maxWidthPx=800&skipHttpRedirect=true&key=${KEY}`
  );
  if (!res.ok) return null;
  const data = await res.json() as { photoUri?: string };
  return data.photoUri || null;
}

// ── Full venue list for one-time import ──────────────────────────────────────
// Each entry: { id: venueId, query: searchQuery }
// After running POST /api/places/import, photos are permanently stored in DB.
// No Google API calls are made during normal app usage.
const VENUE_IMPORT_LIST = [
  { id: "1",  query: "Bad Luck Bar Detroit MI" },
  { id: "2",  query: "The Shelby cocktail bar Detroit MI" },
  { id: "3",  query: "Parlay Detroit speakeasy" },
  { id: "4",  query: "Standby bar Detroit MI" },
  { id: "5",  query: "The Skip Detroit belt alley" },
  { id: "6",  query: "The Apparatus Room Detroit Foundation Hotel" },
  { id: "7",  query: "Time Will Tell bar Detroit Woodward Ave" },
  { id: "8",  query: "Shinola Hotel Detroit" },
  { id: "9",  query: "The Monarch Club Detroit" },
  { id: "10", query: "The Conservatory AC Hotel Detroit" },
  { id: "11", query: "IO Rooftop Godfrey Hotel Detroit" },
  { id: "12", query: "Kampers Rooftop Lounge Book Tower Detroit" },
  { id: "13", query: "Johnny Noodle King Detroit" },
  { id: "14", query: "The Monarch Club Detroit rooftop" },
  { id: "15", query: "The Belt alley Detroit" },
  { id: "16", query: "Deluxx Fluxx Detroit" },
  { id: "17", query: "Parlay Detroit sports bar" },
  { id: "18", query: "Gillys Clubhouse Detroit Woodward Ave" },
  { id: "19", query: "Post Bar Detroit Broadway" },
  { id: "20", query: "TV Lounge Detroit Grand River Ave" },
  { id: "21", query: "Marble Bar Detroit" },
  { id: "22", query: "The Spotlighter Theatre Detroit" },
  { id: "23", query: "The Majestic Theatre Detroit" },
  { id: "24", query: "Chartreuse Kitchen Cocktails Detroit" },
  { id: "25", query: "Parc Detroit restaurant" },
  { id: "26", query: "Belle Isle Detroit" },
  { id: "27", query: "Eastern Market Detroit" },
  { id: "28", query: "Dequindre Cut Greenway Detroit" },
  { id: "30", query: "The Peterboro Detroit" },
  { id: "31", query: "Batch Brewing Company Detroit Corktown" },
  { id: "32", query: "Ottava Via Detroit" },
  { id: "33", query: "Lager House Detroit" },
  { id: "34", query: "Prime and Proper Detroit" },
  { id: "35", query: "BESA restaurant Detroit" },
  { id: "36", query: "Ostrea Detroit" },
  { id: "37", query: "Barda Detroit restaurant" },
  { id: "38", query: "Selden Standard Detroit" },
  { id: "39", query: "Hiroki-San Detroit Book Tower" },
  { id: "40", query: "Le Supreme Detroit Book Tower" },
  { id: "41", query: "The Aladdin Sane Detroit" },
  { id: "42", query: "Hudson Cafe Detroit" },
  { id: "43", query: "Dime Store Detroit" },
  { id: "44", query: "Babo Detroit restaurant" },
  { id: "45", query: "Joe Louis Southern Kitchen Detroit" },
  { id: "46", query: "SPKRBOX Detroit" },
  { id: "47", query: "Cannelle patisserie Detroit" },
  { id: "48", query: "Madcap Coffee Detroit Parkers Alley" },
  { id: "49", query: "Dessert Oasis Coffee Roasters Detroit" },
  { id: "50", query: "Avalon International Breads Detroit" },
  { id: "51", query: "London Chop House Detroit" },
  { id: "52", query: "Ima Izakaya Detroit Corktown" },
  { id: "53", query: "Experience Zuzu Detroit" },
  { id: "55", query: "Ima noodles Detroit Midtown" },
  { id: "56", query: "Eatori Market Detroit" },
  { id: "57", query: "Frita Batidos Detroit" },
  { id: "63", query: "Vicentes Cuban Cuisine Detroit" },
  { id: "64", query: "Fixins Soul Kitchen Detroit" },
  { id: "65", query: "Grey Ghost Detroit" },
  { id: "67", query: "Tin Roof Detroit" },
  { id: "68", query: "Orange Room SPKRBOX Detroit" },
  { id: "69", query: "Vecino Detroit restaurant" },
  { id: "70", query: "Soraya Detroit Federal Reserve Building" },
  { id: "71", query: "Bash Original Izakaya Detroit" },
  { id: "72", query: "Sahara restaurant Detroit" },
  { id: "73", query: "Adelina Detroit restaurant" },
  { id: "74", query: "Sexy Steak Detroit" },
  { id: "75", query: "Leila Detroit restaurant" },
  { id: "76", query: "San Morello Detroit Shinola Hotel" },
  { id: "77", query: "Mezcal restaurant Detroit Cass Corridor" },
  { id: "78", query: "Condado Tacos Detroit" },
  { id: "79", query: "Bakersfield Detroit" },
  { id: "80", query: "La Lanterna Detroit" },
  { id: "81", query: "The Lone Goat Detroit" },
  { id: "82", query: "Bucharest Grill Detroit" },
  { id: "83", query: "Cibo Detroit Cambria Hotel" },
  { id: "84", query: "Highlands restaurant Renaissance Center Detroit" },
  { id: "85", query: "High Bar Renaissance Center Detroit" },
  { id: "86", query: "Haus of Brunch Detroit Westin Book Cadillac" },
  { id: "87", query: "The Brakeman Detroit" },
  { id: "r1", query: "Bar Chenin Detroit Siren Hotel" },
  { id: "r2", query: "Father Forgive Me bar Detroit" },
  { id: "r3", query: "Pocket Change bar Detroit Eastern Market" },
  { id: "r4", query: "Street Beet Detroit Corktown" },
  { id: "r5", query: "Dirty Shake Detroit" },
  { id: "u1", query: "Sunda New Asian Detroit" },
];

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// GET /api/places/venue-photos
// Returns all stored venue photos from DB as a flat map: { [venueId]: photoUrl }
// This is what the frontend calls on startup — one request, zero Google API calls.
router.get("/places/venue-photos", async (_req, res) => {
  try {
    const result = await pool.query(
      "SELECT venue_id, photo_url FROM venue_photos WHERE photo_url IS NOT NULL"
    );
    const photos: Record<string, string> = {};
    for (const row of result.rows) {
      if (row.photo_url) photos[row.venue_id] = row.photo_url;
    }
    logger.info({ count: result.rows.length }, "Served venue photos from DB");
    return res.json({ photos });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ err: msg }, "Error reading venue photos from DB");
    return res.json({ photos: {} });
  }
});

// POST /api/places/import
// One-time endpoint: fetches Google Places photos for all venues and stores in DB.
// Safe to call multiple times — skips venues already in DB (idempotent).
// Cost: ~$4 total for all 88 venues. After this, no live API calls for venue photos.
router.post("/places/import", async (req, res) => {
  if (!KEY) {
    return res.status(500).json({ error: "GOOGLE_PLACES_KEY not configured" });
  }

  const secret = req.body?.secret as string | undefined;
  if (secret !== "import-venues-2024") {
    return res.status(403).json({ error: "Unauthorized" });
  }

  // Check which venues are already imported
  let existingIds = new Set<string>();
  try {
    const existing = await pool.query("SELECT venue_id FROM venue_photos");
    existingIds = new Set(existing.rows.map((r: { venue_id: string }) => r.venue_id));
  } catch (err) {
    logger.error({ err }, "Failed to read existing venue IDs");
  }

  const toImport = VENUE_IMPORT_LIST.filter(v => !existingIds.has(v.id));
  logger.info({ total: VENUE_IMPORT_LIST.length, toImport: toImport.length, existing: existingIds.size }, "Starting venue photo import");

  const results: { id: string; status: string; photoUrl?: string; error?: string }[] = [];

  // Send initial response headers so the client doesn't time out
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Transfer-Encoding", "chunked");
  res.write('{"importing":true,"results":[');

  let first = true;
  for (const venue of toImport) {
    try {
      // Rate limit: 150ms between calls to avoid API quota errors
      if (!first) await sleep(150);

      const fields = [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.rating",
        "places.userRatingCount",
        "places.photos",
      ].join(",");

      const places = await textSearch(venue.query, fields);
      const place = places[0];

      if (!place) {
        await pool.query(
          `INSERT INTO venue_photos (venue_id, photo_url, place_id, rating, rating_count, search_query)
           VALUES ($1, NULL, NULL, NULL, NULL, $2)
           ON CONFLICT (venue_id) DO NOTHING`,
          [venue.id, venue.query]
        );
        const r = { id: venue.id, status: "not_found" };
        results.push(r);
        res.write((first ? "" : ",") + JSON.stringify(r));
        logger.warn({ venueId: venue.id, query: venue.query }, "Venue not found in Google Places");
        first = false;
        continue;
      }

      const photoRef = place.photos?.[0];
      let photoUrl: string | null = null;
      if (photoRef) {
        await sleep(50); // small delay before photo media call
        photoUrl = await resolvePhotoUrl(photoRef.name);
      }

      await pool.query(
        `INSERT INTO venue_photos (venue_id, photo_url, place_id, rating, rating_count, search_query)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (venue_id) DO UPDATE SET
           photo_url = EXCLUDED.photo_url,
           place_id = EXCLUDED.place_id,
           rating = EXCLUDED.rating,
           rating_count = EXCLUDED.rating_count,
           search_query = EXCLUDED.search_query,
           fetched_at = NOW()`,
        [venue.id, photoUrl, place.id || null, place.rating || null, place.userRatingCount || null, venue.query]
      );

      const r = { id: venue.id, status: photoUrl ? "ok" : "no_photo", photoUrl: photoUrl || undefined };
      results.push(r);
      res.write((first ? "" : ",") + JSON.stringify(r));
      logger.info({ venueId: venue.id, query: venue.query, hasPhoto: !!photoUrl }, "Venue photo imported");
      first = false;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const r = { id: venue.id, status: "error", error: msg };
      results.push(r);
      res.write((first ? "" : ",") + JSON.stringify(r));
      logger.error({ venueId: venue.id, err: msg }, "Error importing venue photo");
      first = false;
    }
  }

  const summary = {
    total: VENUE_IMPORT_LIST.length,
    alreadyExisted: existingIds.size,
    attempted: toImport.length,
    ok: results.filter(r => r.status === "ok").length,
    no_photo: results.filter(r => r.status === "no_photo").length,
    not_found: results.filter(r => r.status === "not_found").length,
    errors: results.filter(r => r.status === "error").length,
  };

  logger.info(summary, "Venue photo import complete");
  res.write(`],"summary":${JSON.stringify(summary)}}`);
  res.end();
});

// GET /api/places/photos?query=Shinola Hotel Detroit
// Returns 1 photo URL + place metadata.
// NOTE: Only called for hotels without a local image — see Stay.jsx useHotelPlaces.
router.get("/places/photos", async (req, res) => {
  if (!KEY) {
    logger.warn("GOOGLE_PLACES_KEY not set");
    return res.json({ photos: [], rating: null, ratingCount: null });
  }

  const query = req.query["query"] as string | undefined;
  if (!query) return res.status(400).json({ error: "query param required" });

  // Check server-side cache first — saves Google API charges
  const cached = cacheGet(`photos:${query}`);
  if (cached) {
    logger.info({ query }, "Places photos served from server cache");
    return res.json(cached);
  }

  try {
    const fields = [
      "places.id",
      "places.displayName",
      "places.formattedAddress",
      "places.rating",
      "places.userRatingCount",
      "places.photos",
    ].join(",");

    const places = await textSearch(query, fields);
    const place = places[0];
    if (!place) {
      const empty = { photos: [], rating: null, ratingCount: null };
      cacheSet(`photos:${query}`, empty);
      return res.json(empty);
    }

    // Only resolve 1 photo (was 3 — this cuts photo media API calls by 66%)
    const photoRef = place.photos?.[0];
    const photoUrl = photoRef ? await resolvePhotoUrl(photoRef.name) : null;
    const photos = photoUrl ? [photoUrl] : [];

    const result = {
      photos,
      placeId: place.id,
      rating: place.rating ?? null,
      ratingCount: place.userRatingCount ?? null,
      name: place.displayName?.text ?? null,
      address: place.formattedAddress ?? null,
    };

    cacheSet(`photos:${query}`, result);
    logger.info({ query, placeId: place.id, photoCount: photos.length }, "Places photos fetched from Google");

    return res.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ query, err: msg }, "Places photos error");
    return res.status(500).json({ error: msg });
  }
});

// GET /api/places/search?query=hidden+bars+detroit
// Returns list of places with metadata + first photo CDN URL.
// NOTE: Not currently called by the app — kept for future use.
router.get("/places/search", async (req, res) => {
  if (!KEY) return res.json({ results: [] });

  const query = req.query["query"] as string | undefined;
  if (!query) return res.status(400).json({ error: "query param required" });

  const cached = cacheGet(`search:${query}`);
  if (cached) return res.json(cached);

  try {
    const fields = [
      "places.id",
      "places.displayName",
      "places.formattedAddress",
      "places.rating",
      "places.userRatingCount",
      "places.photos",
      "places.location",
    ].join(",");

    const places = await textSearch(query, fields);

    const results = await Promise.all(
      places.slice(0, 10).map(async (p) => {
        const photoUrl = p.photos?.[0]
          ? await resolvePhotoUrl(p.photos[0].name)
          : null;
        return {
          placeId: p.id,
          name: p.displayName?.text ?? null,
          address: p.formattedAddress ?? null,
          rating: p.rating ?? null,
          ratingCount: p.userRatingCount ?? null,
          lat: p.location?.latitude ?? null,
          lng: p.location?.longitude ?? null,
          photoUrl,
        };
      })
    );

    const result = { results };
    cacheSet(`search:${query}`, result);
    return res.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ query, err: msg }, "Places search error");
    return res.status(500).json({ error: msg });
  }
});

export default router;
