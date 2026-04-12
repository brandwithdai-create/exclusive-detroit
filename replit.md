# Workspace — ExclusiveDetroit

## Overview

pnpm workspace monorepo. **ExclusiveDetroit** is a Detroit nightlife + lifestyle PWA at `www.exclusivedetroitapp.com`. Built with React (React.createElement, no JSX in App.jsx) + Vite.

## App Sections (Nav order)
- **EXPLORE** — venue cards with category/filter/sort, Near Me geolocation
- **MAP** — Leaflet map with venue pins
- **DO** (section=things-to-do) — Things To Do: Games / Events / Concerts tabs
- **STAY** (section=stay) — Where to Stay: curated hotel cards
- **SAVES** — saved venues, events, hotels (hearts)
- **AREAS** — neighborhood guide
- **ABOUT** — brand/about page
- **Settings** — gear icon, theme, suggest a spot, share

## Data Files (src/data/)
- `eventsData.js` — GAMES, DETROIT_EVENTS, CONCERTS, HOTELS arrays + CTA helpers (affiliate-ready)
  - `getTicketCTA(item)` — returns affiliate_ticket_url → ticket_url → website_url
  - `getBookingCTA(hotel)` — returns affiliate_booking_url → booking_url → website_url
  - TODO comments mark where Ticketmaster/Eventbrite API calls go

## Section Components (src/sections/)
- `ThingsToDo.jsx` — Games/Events/Concerts tabs, save state via savedEvents localStorage
- `Stay.jsx` — Hotel grid, save state via savedHotels localStorage

## Production Architecture (App Store ready)

**Hosting**: Vercel only. `exclusivedetroitapp.com` auto-deploys from `github.com/brandwithdai-create/exclusive-detroit` `main` branch. Replit deployment button is NOT used for the live domain.

**Required Vercel Environment Variables**:
- `VITE_TICKETMASTER_KEY` — Ticketmaster Discovery API key (server-side only, never in browser bundle)

**Vercel API Functions** (at `artifacts/my-app/api/`):
- `/api/events/games` — Detroit sports via Ticketmaster
- `/api/events/concerts` — Detroit concerts via Ticketmaster
- `/api/events/theatre` — Arts & theatre via Ticketmaster
- `/api/events/family` — Family events via Ticketmaster
- `/api/health` — Health check, probes all 3 categories, returns JSON status
- `/api/places` — Google Places (disabled / returns empty)

**Cache-Control strategy** (all event functions):
- `s-maxage=300` — CDN caches fresh responses for 5 min
- `stale-while-revalidate=3600` — CDN serves stale while background-refreshing (1 hr)
- `stale-if-error=86400` — CDN serves last-known-good for 24 hr if Ticketmaster is down

**Routing** (`vercel.json`): Vercel routes API functions before evaluating rewrites. The `/(.*) → /index.html` catch-all does NOT intercept `/api/*` calls.

**Monitoring**: `.github/workflows/monitor-endpoints.yml` runs every 30 min. Checks `/api/health`, games, concerts, and theatre. GitHub emails repo owner if any check fails.

**Post-deploy verification**: `sh scripts/verify-endpoints.sh` — tests 4 endpoints and exits 1 on any failure.

**Push to production**: Checkpoint auto-commits. Then `sh push.sh` → GitHub → Vercel auto-deploys in ~2 min.

**Error fallback**: If a Ticketmaster fetch fails, `ThingsToDo.jsx` shows "temporarily unavailable" (distinct from a genuine empty calendar). Games always show (static fallback array). CDN `stale-if-error` means users never see an error state unless Ticketmaster has been down for 24+ hours.

## Standing Update Rules (enforce every session without exception)

### 1. Static venue/hotel lists — never change without explicit approval
- Do NOT add any venue, hotel, restaurant, or bar without the user explicitly naming it and approving it
- Dynamic categories (games, events, sports tickets) may auto-populate from their live APIs
- `VENUES` in App.jsx and `HOTELS` in eventsData.js are locked unless the user says otherwise

### 2. Google Places API — off by default
- Do NOT use Google Places API unless the user explicitly approves it for a specific session
- When approved: one-time shell import only, for the exact venues named, images saved as permanent static assets in `public/venue-photos/{id}.jpg`
- Zero runtime calls, no refresh, no background calls, no ongoing dependency after import

### 3. Booking link priority for every new venue
1. OpenTable (`reservationUrl`) — check the venue's own website HTML for the real slug
2. Venue's own bookable website (`reservationUrl`) if it has a table booking flow
3. Resy (`reservationUrl`) — confirmed 200 via fetch
4. Correct website URL (`websiteUrl`) with "Visit Website" CTA as last resort

### 4. Every new venue must be fully verified before going in
- Correct name, neighborhood (`hood`), category (`cat`), `cats[]` array
- Correct hours, address, coordinates in `COORDS`
- Correct static image — real photo, matched to the correct venue, no placeholder
- Correct booking/website link with correct CTA label (Book Now / Visit Website / Get Tickets)
- Uses the exact same VCard layout/structure as all other venues — no custom formatting
- No duplicates in any filter category or in All Spots

### 5. Pre-push checklist — tell the user exactly what changed
Before any push, report: what was added/changed, image source, CTA type + destination, which filter categories it appears in, and confirm no duplicates

## Key Constraints
- App.jsx uses React.createElement throughout — NEVER convert to JSX
- All CSS vars defined in index.html (3 theme blocks: :root dark, [data-theme="light"], @media light)
- C object uses CSS vars like "var(--c-black)"
- Nav items called as direct functions, MapView/ThingsToDo/Stay as React.createElement
- GitHub push: `bash push.sh` | Vercel: Root Dir `artifacts/my-app`, Build `pnpm build`, Output `dist`

## Monetization Structure
- Affiliate ticket links: set `affiliate_ticket_url` in eventsData.js GAMES/DETROIT_EVENTS/CONCERTS
- Affiliate hotel links: set `affiliate_booking_url` in eventsData.js HOTELS
- Future: Ticketmaster Discovery API (games/concerts), Eventbrite API (events)

## localStorage Keys
- `savedSpots` — saved venue IDs
- `savedEvents` — saved game/event/concert IDs
- `savedHotels` — saved hotel IDs
- `ed-theme` — appearance setting

## Venue Photo System (Permanent DB Storage)

Photos for all venues are permanently stored in PostgreSQL — zero Google API calls on page load. New venues (id:94 Candy Bar, id:95 Wright & Company, id:96 Townhouse Detroit) use static `/venue-photos/{id}.jpg` files (priority over DB). Venues id:90-96 use static local image files.

**Database table**: `venue_photos` (venue_id TEXT PK, photo_url TEXT, place_id, rating, rating_count, search_query, fetched_at)

**How it works**:
1. On startup, App.jsx fetches `GET /api/places/venue-photos` once — returns `{photos: {venueId: photoUrl}}`
2. VCard, UCard, Modal, MapView all use DB photo first, Unsplash fallback if missing
3. Photos are real Google Places CDN URLs (lh3.googleusercontent.com)

**Import endpoint**: `POST /api/places/import` with body `{"secret":"import-venues-2024"}`
- Idempotent — skips venues already in DB
- One-time cost: ~$4 for all 85 venues
- Run when adding new venues or to refresh stale photos

**Cost protection rules** (critical — never remove):
- Venue cards NEVER call Google API — always read from DB or Unsplash fallback
- ALL 10 hotels now have local images — Google API is NEVER called anywhere in the app
- `fetchPlacePhotos` must NEVER be imported in App.jsx
- Stay.jsx still has `if (hotel.image) return;` guard — keep it as protection for future hotels

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM (venue_photos table for permanent photo storage)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
