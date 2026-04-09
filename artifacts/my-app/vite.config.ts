import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import type { Plugin } from "vite";

const isReplit = process.env.REPL_ID !== undefined;
const isDev = process.env.NODE_ENV !== "production";

const port = Number(process.env.PORT || 5173);
const basePath = process.env.BASE_PATH || "/";

// ── Dev-only Places API proxy middleware ──────────────────────────────────────
// In production (Vercel), /api/places/* is handled by api/places.js serverless fn.
// In development (Replit Vite server), this plugin intercepts the same paths.
function placesDevProxy(): Plugin {
  const KEY = process.env.GOOGLE_PLACES_KEY;
  const GBASE = "https://places.googleapis.com/v1";

  async function textSearch(query: string, fields: string) {
    const r = await fetch(`${GBASE}/places:searchText`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": KEY!,
        "X-Goog-FieldMask": fields,
      },
      body: JSON.stringify({ textQuery: query }),
    });
    if (!r.ok) throw new Error(`Places ${r.status}: ${await r.text()}`);
    const d = await r.json() as { places?: unknown[] };
    return (d.places || []) as Record<string, unknown>[];
  }

  async function resolvePhoto(name: string): Promise<string | null> {
    const r = await fetch(`${GBASE}/${name}/media?maxWidthPx=800&skipHttpRedirect=true&key=${KEY}`);
    if (!r.ok) return null;
    const d = await r.json() as { photoUri?: string };
    return d.photoUri || null;
  }

  return {
    name: "places-dev-proxy",
    configureServer(server) {
      server.middlewares.use("/api/places", async (req, res) => {
        res.setHeader("Content-Type", "application/json");
        if (!KEY) {
          res.end(JSON.stringify({ error: "GOOGLE_PLACES_KEY not configured" }));
          return;
        }

        const url = new URL(req.url!, `http://localhost`);
        const isSearch = url.pathname.endsWith("/search");
        const query = url.searchParams.get("query") || "";

        if (!query) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: "query required" }));
          return;
        }

        try {
          if (isSearch) {
            const fields = "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.photos,places.location";
            const places = await textSearch(query, fields);
            const results = await Promise.all(
              places.slice(0, 10).map(async (p) => {
                const photos = p["photos"] as { name: string }[] | undefined;
                const photoUrl = photos?.[0] ? await resolvePhoto(photos[0].name) : null;
                const loc = p["location"] as { latitude?: number; longitude?: number } | undefined;
                const display = p["displayName"] as { text?: string } | undefined;
                return {
                  placeId: p["id"],
                  name: display?.text ?? null,
                  address: p["formattedAddress"] ?? null,
                  rating: p["rating"] ?? null,
                  ratingCount: p["userRatingCount"] ?? null,
                  lat: loc?.latitude ?? null,
                  lng: loc?.longitude ?? null,
                  photoUrl,
                };
              })
            );
            res.end(JSON.stringify({ results }));
          } else {
            const fields = "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.photos";
            const places = await textSearch(query, fields);
            const place = places[0];
            if (!place) {
              res.end(JSON.stringify({ photos: [], rating: null, ratingCount: null }));
              return;
            }
            const photos = place["photos"] as { name: string }[] | undefined;
            const photoRefs = (photos || []).slice(0, 3);
            const photoUrls = await Promise.all(photoRefs.map((p) => resolvePhoto(p.name)));
            const display = place["displayName"] as { text?: string } | undefined;
            res.end(JSON.stringify({
              photos: photoUrls.filter(Boolean),
              placeId: place["id"],
              rating: place["rating"] ?? null,
              ratingCount: place["userRatingCount"] ?? null,
              name: display?.text ?? null,
              address: place["formattedAddress"] ?? null,
            }));
          }
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: msg }));
        }
      });
    },
  };
}

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    ...(isDev ? [placesDevProxy()] : []),
    ...(isDev && isReplit
      ? [
          (await import("@replit/vite-plugin-runtime-error-modal")).default(),
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
