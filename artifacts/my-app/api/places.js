// Vercel serverless function — runs server-side only, API key never reaches the browser
// Path: /api/places  (Vercel routes /api/* to this handler)

const KEY = process.env.GOOGLE_PLACES_KEY;
const BASE = "https://places.googleapis.com/v1";

async function textSearch(query, fields) {
  const res = await fetch(`${BASE}/places:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": KEY,
      "X-Goog-FieldMask": fields,
    },
    body: JSON.stringify({ textQuery: query }),
  });
  if (!res.ok) throw new Error(`Places API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.places || [];
}

async function resolvePhotoUrl(photoName) {
  const res = await fetch(
    `${BASE}/${photoName}/media?maxWidthPx=800&skipHttpRedirect=true&key=${KEY}`
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.photoUri || null;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://www.exclusivedetroitapp.com");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  if (!KEY) {
    return res.status(500).json({ error: "GOOGLE_PLACES_KEY not configured" });
  }

  const url = new URL(req.url, `https://${req.headers.host}`);
  const action = url.searchParams.get("action") || "photos";
  const query = url.searchParams.get("query");

  if (!query) return res.status(400).json({ error: "query param required" });

  try {
    if (action === "photos") {
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

      const photoRefs = (place.photos || []).slice(0, 3);
      const photoUrls = await Promise.all(photoRefs.map((p) => resolvePhotoUrl(p.name)));
      const photos = photoUrls.filter(Boolean);

      return res.json({
        photos,
        placeId: place.id,
        rating: place.rating ?? null,
        ratingCount: place.userRatingCount ?? null,
        name: place.displayName?.text ?? null,
        address: place.formattedAddress ?? null,
      });
    }

    if (action === "search") {
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
          const photoUrl = p.photos?.[0] ? await resolvePhotoUrl(p.photos[0].name) : null;
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
      return res.json({ results });
    }

    return res.status(400).json({ error: "Unknown action" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
