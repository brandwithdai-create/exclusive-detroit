import { Router } from "express";
import { logger } from "../lib/logger";

const router = Router();

const KEY = process.env.GOOGLE_PLACES_KEY;
const BASE = "https://places.googleapis.com/v1";

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
// Returns real photo URLs (CDN links — no API key embedded) + place metadata
router.get("/places/photos", async (req, res) => {
  if (!KEY) {
    logger.warn("GOOGLE_PLACES_KEY not set");
    return res.json({ photos: [], rating: null, ratingCount: null });
  }

  const query = req.query["query"] as string | undefined;
  if (!query) return res.status(400).json({ error: "query param required" });

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
    if (!place) return res.json({ photos: [], rating: null, ratingCount: null });

    // Resolve up to 3 photo CDN URLs (no API key in the returned URLs)
    const photoRefs = (place.photos || []).slice(0, 3);
    const photoUrls = await Promise.all(
      photoRefs.map((p) => resolvePhotoUrl(p.name))
    );
    const photos = photoUrls.filter(Boolean) as string[];

    logger.info({ query, placeId: place.id, photoCount: photos.length }, "Places photos fetched");

    res.json({
      photos,
      placeId: place.id,
      rating: place.rating ?? null,
      ratingCount: place.userRatingCount ?? null,
      name: place.displayName?.text ?? null,
      address: place.formattedAddress ?? null,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ query, err: msg }, "Places photos error");
    res.status(500).json({ error: msg });
  }
});

// GET /api/places/search?query=hidden+bars+detroit
// Returns list of places with metadata + first photo CDN URL
router.get("/places/search", async (req, res) => {
  if (!KEY) return res.json({ results: [] });

  const query = req.query["query"] as string | undefined;
  if (!query) return res.status(400).json({ error: "query param required" });

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

    res.json({ results });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ query, err: msg }, "Places search error");
    res.status(500).json({ error: msg });
  }
});

export default router;
