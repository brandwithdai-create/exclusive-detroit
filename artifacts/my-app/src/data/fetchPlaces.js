// ─────────────────────────────────────────────────────────────────────────────
// Exclusive Detroit — Google Places API client
//
// COST CONTROLS (critical — do not remove):
//   - localStorage cache: 24-hour TTL prevents re-fetching on refresh
//   - Session cache: prevents duplicate calls within the same session
//   - In-flight dedup: prevents parallel duplicate requests
//   - Only called for hotels without a local image (never for venue cards)
// ─────────────────────────────────────────────────────────────────────────────

const LS_PREFIX = "excl_places_v1_";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function lsGet(key) {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) { localStorage.removeItem(LS_PREFIX + key); return null; }
    return data;
  } catch { return null; }
}

function lsSet(key, data) {
  try { localStorage.setItem(LS_PREFIX + key, JSON.stringify({ ts: Date.now(), data })); } catch {}
}

// Session-level cache (cleared on refresh — first line of defense)
const _photoCache = new Map();
const _searchCache = new Map();
// In-flight dedup: prevents duplicate parallel requests for the same query
const _inFlight = new Map();

/**
 * Fetch Google Places photo + metadata for a single location.
 * ONLY call this for hotels that lack a local image. Never call for venue cards.
 * @param {string} query  e.g. "The Shinola Hotel 1400 Woodward Ave Detroit"
 */
export async function fetchPlacePhotos(query) {
  // 1. Session cache
  if (_photoCache.has(query)) return _photoCache.get(query);

  // 2. Persistent localStorage cache (survives page refresh)
  const persisted = lsGet(query);
  if (persisted) { _photoCache.set(query, persisted); return persisted; }

  // 3. In-flight dedup — if same query is already pending, wait for it
  if (_inFlight.has(query)) return _inFlight.get(query);

  const fallback = { photos: [], rating: null, ratingCount: null, placeId: null, name: null, address: null };

  const promise = (async () => {
    try {
      const res = await fetch(`/api/places/photos?query=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error(`Places proxy ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      _photoCache.set(query, data);
      lsSet(query, data);
      return data;
    } catch (err) {
      console.warn("[Places] fetchPlacePhotos failed:", err.message);
      _photoCache.set(query, fallback);
      return fallback;
    } finally {
      _inFlight.delete(query);
    }
  })();

  _inFlight.set(query, promise);
  return promise;
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
