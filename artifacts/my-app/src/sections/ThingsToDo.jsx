import React, { useState, useEffect, useCallback } from "react";
import { getTicketCTA, fmtDate } from "../data/eventsData.js";
import { fetchLiveGames, fetchLiveConcerts, fetchLiveEvents } from "../data/fetchLiveData.js";

const C = {
  black:"var(--c-black)", deep:"var(--c-deep)", card:"var(--c-card)", border:"var(--c-border)", borderS:"var(--c-borders)",
  gold:"var(--c-gold)", goldL:"var(--c-goldL)", goldD:"var(--c-goldD)",
  smoke:"var(--c-smoke)", ash:"var(--c-ash)", bone:"var(--c-bone)", white:"var(--c-white)", purple:"var(--c-purple)",
};

const SPORT_COLORS = {
  MLB: { bg:"rgba(201,168,76,0.12)", color:"var(--c-goldL)", border:"rgba(201,168,76,0.35)" },
  NBA: { bg:"rgba(200,40,40,0.12)",  color:"#E8A0A0",        border:"rgba(200,40,40,0.35)" },
  NHL: { bg:"rgba(200,40,40,0.12)",  color:"#E8A0A0",        border:"rgba(200,40,40,0.35)" },
  NFL: { bg:"rgba(40,80,180,0.12)",  color:"var(--c-purple)", border:"rgba(40,80,180,0.35)" },
};

function SaveBtn({ saved, onSave }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onSave(); }}
      style={{ background:"none", border:"none", cursor:"pointer", color:saved ? C.gold : C.bone, fontSize:"1.1rem", padding:"10px 12px", display:"inline-flex", alignItems:"center", justifyContent:"center", outline:"none", minWidth:44, minHeight:44, transition:"color 0.18s", flexShrink:0 }}
    >
      {saved ? "\u2665" : "\u2661"}
    </button>
  );
}

function CTABtn({ item }) {
  const cta = getTicketCTA(item);
  if (!cta) return null;
  return (
    <a
      href={cta.url} target="_blank" rel="noopener noreferrer"
      onClick={e => e.stopPropagation()}
      style={{ display:"inline-block", background:C.gold, color:C.black, fontFamily:"'DM Mono',monospace", fontSize:"0.57rem", letterSpacing:"0.13em", textTransform:"uppercase", padding:"8px 14px", borderRadius:6, fontWeight:500, textDecoration:"none", cursor:"pointer", flexShrink:0 }}
    >
      {cta.label}
    </a>
  );
}

function CardImage({ src, alt, logo, height=180 }) {
  const [err, setErr] = useState(false);
  const [logoErr, setLogoErr] = useState(false);
  if (!src || err) return null;
  return (
    <div style={{ height, overflow:"hidden", background:C.deep, flexShrink:0, position:"relative" }}>
      <img
        src={src} alt={alt}
        onError={() => setErr(true)}
        style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
      />
      {logo && !logoErr && (
        <img
          src={logo} alt=""
          onError={() => setLogoErr(true)}
          style={{ position:"absolute", bottom:10, right:10, width:44, height:44, objectFit:"contain", display:"block", filter:"drop-shadow(0 1px 4px rgba(0,0,0,0.55))" }}
        />
      )}
    </div>
  );
}

function GameCard({ game, saved, onSave }) {
  const sc = SPORT_COLORS[game.sport] || SPORT_COLORS.MLB;
  return (
    <div style={{ background:C.card, border:"1px solid "+C.border, borderRadius:12, overflow:"hidden", display:"flex", flexDirection:"column", animation:"fadeSlideIn 0.28s ease both" }}>
      <CardImage src={game.image} alt={game.team} logo={game.logo_url} />
      <div style={{ padding:"16px 18px 18px", display:"flex", flexDirection:"column", gap:9, flex:1 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ background:sc.bg, color:sc.color, border:"1.5px solid "+sc.border, borderRadius:100, padding:"3px 9px", fontSize:"0.49rem", fontFamily:"'DM Mono',monospace", letterSpacing:"0.12em", textTransform:"uppercase" }}>
            {game.sport}
          </span>
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.49rem", letterSpacing:"0.1em", textTransform:"uppercase", color:C.smoke }}>
            {game.hood}
          </span>
        </div>
        <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.35rem", fontWeight:600, color:C.white, lineHeight:1.15, margin:0 }}>
          {game.team}
        </h3>
        <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.2rem", fontWeight:600, color:C.white, margin:0, lineHeight:1.2 }}>
          vs. {game.opponent}
        </p>
        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.72rem", letterSpacing:"0.08em", color:C.goldL, fontWeight:500 }}>
          {game.date ? fmtDate(game.date) : "Date TBA"} · {game.time}
        </span>
        <p style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.57rem", letterSpacing:"0.07em", color:C.ash, margin:0 }}>
          {game.venue}
        </p>
        {game.note && (
          <span style={{ alignSelf:"flex-start", background:"rgba(201,168,76,0.08)", border:"1px solid rgba(201,168,76,0.22)", borderRadius:100, padding:"2px 9px", fontSize:"0.47rem", fontFamily:"'DM Mono',monospace", letterSpacing:"0.1em", textTransform:"uppercase", color:C.goldL }}>
            {game.note}
          </span>
        )}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 18px 14px", borderTop:"1px solid "+C.borderS }}>
        <CTABtn item={game} />
        <SaveBtn saved={saved} onSave={() => onSave(game.id)} />
      </div>
    </div>
  );
}

function EventCard({ event, saved, onSave, titleKey = "title" }) {
  const title = event[titleKey] || event.title || event.artist || "";
  return (
    <div style={{ background:C.card, border:"1px solid "+C.border, borderRadius:12, overflow:"hidden", display:"flex", flexDirection:"column", animation:"fadeSlideIn 0.28s ease both" }}>
      <CardImage src={event.image} alt={title} />
      <div style={{ padding:"16px 18px 18px", display:"flex", flexDirection:"column", gap:9, flex:1 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.49rem", letterSpacing:"0.16em", textTransform:"uppercase", color:C.gold }}>
            {event.category}
          </span>
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.49rem", letterSpacing:"0.1em", textTransform:"uppercase", color:C.smoke }}>
            {event.hood}
          </span>
        </div>
        <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.3rem", fontWeight:600, color:C.white, lineHeight:1.15, margin:0 }}>
          {title}
        </h3>
        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.5rem", letterSpacing:"0.08em", color:C.ash }}>
          {event.venue} · {event.date ? fmtDate(event.date) : "Date TBA"} · {event.time}
        </span>
        {event.desc && (
          <p style={{ fontSize:"0.78rem", color:C.ash, fontWeight:300, lineHeight:1.65, margin:0, flex:1 }}>
            {event.desc}
          </p>
        )}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 18px 14px", borderTop:"1px solid "+C.borderS }}>
        <CTABtn item={event} />
        <SaveBtn saved={saved} onSave={() => onSave(event.id)} />
      </div>
    </div>
  );
}

function LoadingGrid() {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:15 }}>
      {[1,2,3].map(i => (
        <div key={i} style={{ background:C.card, border:"1px solid "+C.border, borderRadius:12, height:260, animation:"fadeSlideIn 0.28s ease both", opacity:0.5 }} />
      ))}
    </div>
  );
}

const TABS = [
  { key:"games",    label:"Games"    },
  { key:"events",   label:"Events"   },
  { key:"concerts", label:"Concerts" },
];

// Cache so we don't re-fetch on every tab switch within a session
const _cache = { games:null, events:null, concerts:null };

export default function ThingsToDo({ isSavedEvent, toggleSavedEvent, initialTab = "games" }) {
  const [tab, setTab] = useState(initialTab);
  const [games,    setGames]    = useState(_cache.games    || []);
  const [events,   setEvents]   = useState(_cache.events   || []);
  const [concerts, setConcerts] = useState(_cache.concerts || []);
  const [loading,  setLoading]  = useState({ games:!_cache.games, events:!_cache.events, concerts:!_cache.concerts });

  const load = useCallback(async (key, fetcher, setter) => {
    if (_cache[key]) return;
    try {
      const data = await fetcher();
      _cache[key] = data;
      setter(data);
    } catch {
      // fetcher already falls back internally
    } finally {
      setLoading(l => ({ ...l, [key]: false }));
    }
  }, []);

  useEffect(() => {
    load("games",    fetchLiveGames,    setGames);
    load("events",   fetchLiveEvents,   setEvents);
    load("concerts", fetchLiveConcerts, setConcerts);
  }, [load]);

  // Keep tab in sync if parent navigates here with a specific tab
  useEffect(() => { setTab(initialTab); }, [initialTab]);

  const tabBtnStyle = (active) => ({
    fontFamily:"'DM Mono',monospace",
    fontSize:"0.52rem",
    letterSpacing:"0.11em",
    textTransform:"uppercase",
    padding:"7px 16px",
    border:"1.5px solid " + (active ? C.gold : "var(--c-filter-bdr)"),
    background: active ? C.gold : "transparent",
    color: active ? C.black : C.ash,
    borderRadius:100,
    cursor:"pointer",
    transition:"all 0.16s",
    whiteSpace:"nowrap",
    flexShrink:0,
  });

  const emptyMsg = (label) => (
    <div style={{ textAlign:"center", padding:"60px 22px", color:C.smoke }}>
      <p style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.52rem", letterSpacing:"0.12em", textTransform:"uppercase" }}>
        No upcoming {label} right now — check back soon.
      </p>
    </div>
  );

  const grid = (items, renderCard) => (
    items.length === 0 ? emptyMsg(tab) : (
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:15 }}>
        {items.map(renderCard)}
      </div>
    )
  );

  return (
    <div>
      <div style={{ background:C.deep, padding:"64px 22px 40px", borderBottom:"1px solid "+C.border }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <p style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.53rem", letterSpacing:"0.22em", textTransform:"uppercase", color:C.gold, marginBottom:8 }}>
            Detroit
          </p>
          <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(1.8rem,5vw,3rem)", fontWeight:400, color:C.white, margin:0 }}>
            Things To Do
          </h2>
          <p style={{ fontSize:"0.82rem", color:C.ash, fontWeight:300, lineHeight:1.7, marginTop:12, maxWidth:560 }}>
            Detroit games, local events, and concerts — everything happening in the city right now.
          </p>
        </div>
      </div>

      <div style={{ background:C.black, borderBottom:"1px solid "+C.border, padding:"12px 22px" }}>
        <div style={{ maxWidth:1200, margin:"0 auto", display:"flex", gap:8 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={tabBtnStyle(tab === t.key)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth:1200, margin:"0 auto", padding:"32px 22px 64px" }}>
        {tab === "games" && (
          loading.games ? <LoadingGrid /> :
          grid(games, g => (
            <GameCard key={g.id} game={g} saved={isSavedEvent(g.id)} onSave={toggleSavedEvent} />
          ))
        )}
        {tab === "events" && (
          loading.events ? <LoadingGrid /> :
          grid(events, e => (
            <EventCard key={e.id} event={e} saved={isSavedEvent(e.id)} onSave={toggleSavedEvent} />
          ))
        )}
        {tab === "concerts" && (
          loading.concerts ? <LoadingGrid /> :
          grid(concerts, c => (
            <EventCard key={c.id} event={{ ...c, title: c.artist || c.title }} saved={isSavedEvent(c.id)} onSave={toggleSavedEvent} />
          ))
        )}

        <p style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.44rem", letterSpacing:"0.1em", textTransform:"uppercase", color:C.smoke, textAlign:"center", paddingTop:32 }}>
          Dates and times subject to change · Always verify before attending
        </p>
      </div>
    </div>
  );
}
