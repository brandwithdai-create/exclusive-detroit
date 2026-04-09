// ─────────────────────────────────────────────────────────────────────────────
// Exclusive Detroit — Google Places API client
//
// Routing:
//   Dev  (Replit):  /api/* → Express API server (port 8080)  → Google Places
//   Prod (Vercel):  /api/* → Vercel serverless fn (api/places.js) → Google Places
//
// The API key lives only on the server — never in the browser bundle.
// ─────────────────────────────────────────────────────────────────────────────

// Session-level cache so we don't re-fetch the same query on every render.
const _photoCache = new Map();
const _searchCache = new Map();

/**
 * Fetch real Google Places photos + metadata for a single location.
 * @param {string} query  e.g. "The Shinola Hotel Detroit MI"
 * @returns {{ photos: string[], rating: number|null, ratingCount: number|null, placeId: string|null, name: string|null, address: string|null }}
 */
export async function fetchPlacePhotos(query) {
  if (_photoCache.has(query)) return _photoCache.get(query);

  const fallback = { photos: [], rating: null, ratingCount: null, placeId: null, name: null, address: null };

  try {
    const res = await fetch(`/api/places/photos?query=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error(`Places proxy ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    _photoCache.set(query, data);
    return data;
  } catch (err) {
    console.warn("[Places] fetchPlacePhotos failed:", err.message);
    _photoCache.set(query, fallback);
    return fallback;
  }
}

/**
 * Search Google Places for a text query.
 * @param {string} query  e.g. "hidden cocktail bars Detroit"
 * @returns {{ results: Array<{ placeId, name, address, rating, ratingCount, lat, lng, photoUrl }> }}
 */
export async function fetchPlaceSearch(query) {
  if (_searchCache.has(query)) return _searchCache.get(query);

  try {
    const res = await fetch(`/api/places/search?query=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error(`Places proxy ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    _searchCache.set(query, data);
    return data;
  } catch (err) {
    console.warn("[Places] fetchPlaceSearch failed:", err.message);
    const fallback = { results: [] };
    _searchCache.set(query, fallback);
    return fallback;
  }
}
