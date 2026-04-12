import { Router } from "express";
import { logger } from "../lib/logger";

const router = Router();

const TM_KEY = process.env.VITE_TICKETMASTER_KEY;
const TM_BASE = "https://app.ticketmaster.com/discovery/v2/events.json";

const CACHE_TTL_MS = 5 * 60 * 1000;
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

function getDateRange(daysAhead = 60) {
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + daysAhead);
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return {
    startDateTime: `${fmt(now)}T00:00:00Z`,
    endDateTime: `${fmt(end)}T23:59:59Z`,
  };
}

async function fetchTM(params: Record<string, string>): Promise<unknown> {
  if (!TM_KEY) throw new Error("VITE_TICKETMASTER_KEY not configured");
  const { startDateTime, endDateTime } = getDateRange(60);
  const url = new URL(TM_BASE);
  url.searchParams.set("apikey", TM_KEY);
  url.searchParams.set("city", "Detroit");
  url.searchParams.set("stateCode", "MI");
  url.searchParams.set("countryCode", "US");
  url.searchParams.set("startDateTime", startDateTime);
  url.searchParams.set("endDateTime", endDateTime);
  url.searchParams.set("sort", "date,asc");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TM HTTP ${res.status}`);
  return res.json();
}

router.get("/events/games", async (_req, res) => {
  try {
    const cached = cacheGet("games");
    if (cached) { res.json(cached); return; }
    const data = await fetchTM({ classificationName: "sports", size: "50" });
    cacheSet("games", data);
    res.json(data);
  } catch (err) {
    logger.error({ err }, "TM games fetch failed");
    res.status(500).json({ _embedded: { events: [] } });
  }
});

router.get("/events/concerts", async (_req, res) => {
  try {
    const cached = cacheGet("concerts");
    if (cached) { res.json(cached); return; }
    const data = await fetchTM({ classificationName: "music", size: "50" });
    cacheSet("concerts", data);
    res.json(data);
  } catch (err) {
    logger.error({ err }, "TM concerts fetch failed");
    res.status(500).json({ _embedded: { events: [] } });
  }
});

router.get("/events/theatre", async (_req, res) => {
  try {
    const cached = cacheGet("theatre");
    if (cached) { res.json(cached); return; }
    const data = await fetchTM({ classificationName: "arts & theatre", size: "50" });
    cacheSet("theatre", data);
    res.json(data);
  } catch (err) {
    logger.error({ err }, "TM theatre fetch failed");
    res.status(500).json({ _embedded: { events: [] } });
  }
});

router.get("/events/family", async (_req, res) => {
  try {
    const cached = cacheGet("family");
    if (cached) { res.json(cached); return; }
    const data = await fetchTM({ classificationName: "family", size: "25" });
    cacheSet("family", data);
    res.json(data);
  } catch (err) {
    logger.error({ err }, "TM family fetch failed");
    res.status(500).json({ _embedded: { events: [] } });
  }
});

export default router;
