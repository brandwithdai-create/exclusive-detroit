// ─────────────────────────────────────────────────────────────────────────────
// Exclusive Detroit — Google Places API client
//
// DISABLED: All venue images are stored locally (photoMap in App.jsx) and
// all hotels have local images defined in eventsData.js. Zero Places API
// calls are needed at runtime. These stubs ensure no accidental charges.
// ─────────────────────────────────────────────────────────────────────────────

const EMPTY_PHOTO = { photos: [], rating: null, ratingCount: null, placeId: null, name: null, address: null };
const EMPTY_SEARCH = { results: [] };

/**
 * DISABLED — returns empty immediately. No Google Places API call is made.
 * All venue photos are stored in the static photoMap in App.jsx.
 */
export async function fetchPlacePhotos(_query) {
  return EMPTY_PHOTO;
}

/**
 * DISABLED — returns empty immediately. No Google Places API call is made.
 */
export async function fetchPlaceSearch(_query) {
  return EMPTY_SEARCH;
}
