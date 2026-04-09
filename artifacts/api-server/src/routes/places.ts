import { Router } from "express";
import { logger } from "../lib/logger";

const router = Router();

const KEY = process.env.GOOGLE_PLACES_KEY;
const BASE = "https://places.googleapis.com/v1";

// ── Server-side cache (24-hour TTL) ─────────────────────────────────────────
// Prevents duplicate Google API charges when the same query is made
// multiple times within a day (e.g. multiple users requesting the same hotel).
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
