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

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
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
