import React, { useState, useEffect, useCallback } from "react";
import { getTicketCTA, fmtDate } from "../data/eventsData.js";
import { fetchLiveGames, fetchLiveConcerts, fetchLiveEvents } from "../data/fetchLiveData.js";

const C = {
  black:"var(--c-black)", deep:"var(--c-deep)", card:"var(--c-card)", border:"var(--c-border)", borderS:"var(--c-borders)",
  gold:"var(--c-gold)", goldL:"var(--c-goldL)", goldD:"var(--c-goldD)",
  smoke:"var(--c-smoke)", ash:"var(--c-ash)", bone:"var(--c-bone)", white:"var(--c-white)", purple:"var(--c-purple)",
};

const SPORT_COLORS = {
  MLB: { bg:"rgba(201,168,76,0.15)",  color:"var(--c-goldL)",  border:"rgba(201,168,76,0.50)" },
  NBA: { bg:"rgba(30,80,200,0.15)",   color:"#8AACFF",         border:"rgba(30,80,200,0.50)" },
  NHL: { bg:"rgba(210,30,30,0.16)",   color:"#FF7878",         border:"rgba(210,30,30,0.55)" },
  NFL: { bg:"rgba(0,118,182,0.15)",   color:"#7DC8F5",         border:"rgba(0,118,182,0.50)" },
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

function CTABtn({ item, stopProp = true }) {
  const cta = getTicketCTA(item);
  if (!cta) return null;
  return (
    <a
      href={cta.url} target="_blank" rel="noopener noreferrer"
      onClick={e => { if (stopProp) e.stopPropagation(); }}
      style={{ display:"inline-block", background:C.gold, color:C.black, fontFamily:"'DM Mono',monospace", fontSize:"0.57rem", letterSpacing:"0.13em", textTransform:"uppercase", padding:"9px 16px", borderRadius:6, fontWeight:500, textDecoration:"none", cursor:"pointer", flexShrink:0 }}
    >
      {cta.label}
    </a>
  );
}

function CTABtnFull({ item }) {
  const cta = getTicketCTA(item);
  if (!cta) return null;
  return (
    <a
      href={cta.url} target="_blank" rel="noopener noreferrer"
      style={{ flex:1, display:"block", background:C.gold, color:C.black, fontFamily:"'DM Mono',monospace", fontSize:"0.55rem", letterSpacing:"0.13em", textTransform:"uppercase", padding:"13px 18px", borderRadius:6, fontWeight:500, textDecoration:"none", cursor:"pointer", textAlign:"center" }}
    >
      {cta.label}
    </a>
  );
}

function CardImage({ src, alt, logo, height=200 }) {
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
          style={{ position:"absolute", bottom:12, right:12, width:48, height:48, objectFit:"contain", display:"block", filter:"drop-shadow(0 2px 6px rgba(0,0,0,0.7))" }}
        />
      )}
    </div>
  );
}

function MetaRow({ date, time, venue }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
      <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.72rem", letterSpacing:"0.07em", color:C.goldL, fontWeight:500 }}>
        {date ? fmtDate(date) : "Date TBA"} · {time}
      </span>
      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"0.78rem", color:C.ash, fontWeight:300 }}>
        {venue}
      </span>
    </div>
  );
}

function DetailModal({ item, type, saved, onSave, onClose }) {
  if (!item) return null;
  const isGame = type === "game";
  const title = isGame ? `${item.team} vs. ${item.opponent}` : (item.artist || item.title || "");
  const categoryLabel = isGame ? item.sport : item.category;

  useEffect(() => {
    const fn = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);

  return (
    <>
      <div
        onClick={onClose}
        style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.88)", zIndex:800, backdropFilter:"blur(4px)", WebkitBackdropFilter:"blur(4px)" }}
      />
      <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:"min(640px,93vw)", maxHeight:"90vh", overflowY:"auto", background:C.deep, border:"1px solid "+C.border, borderRadius:12, zIndex:900 }}>
        {isGame ? (
          <CardImage src={item.image} alt={item.team} logo={item.logo_url} height={240} />
        ) : (
          <CardImage src={item.image} alt={title} height={240} />
        )}
        <div style={{ padding:"20px 24px 28px", display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            {isGame ? (
              <span style={{ background: SPORT_COLORS[item.sport]?.bg || "rgba(201,168,76,0.12)", color: SPORT_COLORS[item.sport]?.color || C.goldL, border:"1.5px solid "+(SPORT_COLORS[item.sport]?.border || "rgba(201,168,76,0.35)"), borderRadius:100, padding:"3px 10px", fontSize:"0.52rem", fontFamily:"'DM Mono',monospace", letterSpacing:"0.12em", textTransform:"uppercase" }}>
                {categoryLabel}
              </span>
            ) : (
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.52rem", letterSpacing:"0.15em", textTransform:"uppercase", color:C.gold }}>
                {categoryLabel}
              </span>
            )}
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.52rem", letterSpacing:"0.1em", textTransform:"uppercase", color:C.smoke }}>
                {item.hood}
              </span>
              <button
                onClick={e => { e.stopPropagation(); onClose(); }}
                style={{ width:30, height:30, borderRadius:"50%", background:"rgba(128,128,128,0.12)", border:"1px solid rgba(128,128,128,0.30)", color:C.ash, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.82rem", fontWeight:400, flexShrink:0, transition:"all 0.18s", lineHeight:1 }}
              >✕</button>
            </div>
          </div>

          <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(1.4rem,4vw,1.9rem)", fontWeight:600, color:C.white, lineHeight:1.1, margin:0 }}>
            {isGame ? (
              <>{item.team} <span style={{ color:C.smoke, fontWeight:400 }}>vs.</span> {item.opponent}</>
            ) : title}
          </h2>

          <MetaRow date={item.date} time={item.time} venue={item.venue} />

          {isGame && item.note && (
            <span style={{ alignSelf:"flex-start", background:"rgba(201,168,76,0.08)", border:"1px solid rgba(201,168,76,0.22)", borderRadius:100, padding:"4px 12px", fontSize:"0.52rem", fontFamily:"'DM Mono',monospace", letterSpacing:"0.1em", textTransform:"uppercase", color:C.goldL }}>
              {item.note}
            </span>
          )}

          {!isGame && item.desc && (
            <p style={{ fontSize:"0.84rem", color:C.ash, fontWeight:300, lineHeight:1.72, margin:0 }}>
              {item.desc}
            </p>
          )}

          <div style={{ background:C.card, border:"1px solid "+C.borderS, borderRadius:6, padding:"12px 16px", display:"flex", flexDirection:"column", gap:8 }}>
            {[["Venue", item.venue], ["Date", item.date ? fmtDate(item.date) : null], ["Time", item.time]].filter(p => p[1]).map(p => (
              <div key={p[0]} style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.49rem", letterSpacing:"0.1em", textTransform:"uppercase", color:C.smoke, minWidth:52, paddingTop:2, flexShrink:0 }}>{p[0]}</span>
                <span style={{ fontSize:"0.81rem", color:C.ash, fontWeight:300, lineHeight:1.5 }}>{p[1]}</span>
              </div>
            ))}
          </div>

          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <CTABtnFull item={item} />
            <button
              onClick={() => onSave(item.id)}
              style={{ padding:"12px 14px", background:saved?"rgba(201,168,76,0.15)":"transparent", border:"1px solid "+(saved?C.gold:"rgba(232,224,212,0.28)"), color:saved?C.gold:C.bone, fontFamily:"'DM Mono',monospace", fontSize:"0.58rem", letterSpacing:"0.12em", textTransform:"uppercase", borderRadius:6, cursor:"pointer", transition:"all 0.18s", flexShrink:0 }}
            >
              {saved ? "\u2665 Saved" : "\u2661 Save"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function GameCard({ game, saved, onSave, onOpen }) {
  const [hov, setHov] = useState(false);
  const sc = SPORT_COLORS[game.sport] || SPORT_COLORS.MLB;
  return (
    <div
      onClick={() => onOpen(game, "game")}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background:C.card, border:"1px solid "+(hov?C.goldD:C.border), borderRadius:12, overflow:"hidden", display:"flex", flexDirection:"column", animation:"fadeSlideIn 0.28s ease both", cursor:"pointer", transform:hov?"translateY(-3px)":"none", boxShadow:hov?"var(--c-shdw-h)":"var(--c-shdw-f)", transition:"all 0.22s" }}
    >
      <CardImage src={game.image} alt={game.team} logo={game.logo_url} height={200} />
      <div style={{ padding:"16px 18px 18px", display:"flex", flexDirection:"column", gap:10, flex:1 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ background:sc.bg, color:sc.color, border:"1.5px solid "+sc.border, borderRadius:100, padding:"3px 10px", fontSize:"0.52rem", fontFamily:"'DM Mono',monospace", letterSpacing:"0.12em", textTransform:"uppercase" }}>
            {game.sport}
          </span>
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.52rem", letterSpacing:"0.1em", textTransform:"uppercase", color:C.smoke }}>
            {game.hood}
          </span>
        </div>
        <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.25rem", fontWeight:600, color:C.white, lineHeight:1.2, margin:0 }}>
          {game.team} <span style={{ color:C.smoke, fontWeight:400 }}>vs.</span> {game.opponent}
        </h3>
        <MetaRow date={game.date} time={game.time} venue={game.venue} />
        {game.note && (
          <span style={{ alignSelf:"flex-start", background:"rgba(201,168,76,0.08)", border:"1px solid rgba(201,168,76,0.22)", borderRadius:100, padding:"3px 10px", fontSize:"0.52rem", fontFamily:"'DM Mono',monospace", letterSpacing:"0.1em", textTransform:"uppercase", color:C.goldL }}>
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

function EventCard({ event, saved, onSave, onOpen, type = "event" }) {
  const [hov, setHov] = useState(false);
  const title = event.artist || event.title || "";
  return (
    <div
      onClick={() => onOpen(event, type)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background:C.card, border:"1px solid "+(hov?C.goldD:C.border), borderRadius:12, overflow:"hidden", display:"flex", flexDirection:"column", animation:"fadeSlideIn 0.28s ease both", cursor:"pointer", transform:hov?"translateY(-3px)":"none", boxShadow:hov?"var(--c-shdw-h)":"var(--c-shdw-f)", transition:"all 0.22s" }}
    >
      <CardImage src={event.image} alt={title} height={200} />
      <div style={{ padding:"16px 18px 18px", display:"flex", flexDirection:"column", gap:10, flex:1 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.52rem", letterSpacing:"0.14em", textTransform:"uppercase", color:C.gold }}>
            {event.category}
          </span>
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.52rem", letterSpacing:"0.1em", textTransform:"uppercase", color:C.smoke }}>
            {event.hood}
          </span>
        </div>
        <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.3rem", fontWeight:600, color:C.white, lineHeight:1.15, margin:0 }}>
          {title}
        </h3>
        <MetaRow date={event.date} time={event.time} venue={event.venue} />
        {event.desc && (
          <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"0.82rem", color:C.ash, fontWeight:300, lineHeight:1.65, margin:0, flex:1 }}>
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
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:15 }}>
      {[1,2,3].map(i => (
        <div key={i} style={{ background:C.card, border:"1px solid "+C.border, borderRadius:12, height:320, animation:"fadeSlideIn 0.28s ease both", opacity:0.5 }} />
      ))}
    </div>
  );
}

const TABS = [
  { key:"games",    label:"Games"    },
  { key:"events",   label:"Events"   },
  { key:"concerts", label:"Concerts" },
];

const _cache = { games:null, events:null, concerts:null };

export default function ThingsToDo({ isSavedEvent, toggleSavedEvent, initialTab = "games" }) {
  const [tab, setTab] = useState(initialTab);
  const [games,    setGames]    = useState(_cache.games    || []);
  const [events,   setEvents]   = useState(_cache.events   || []);
  const [concerts, setConcerts] = useState(_cache.concerts || []);
  const [loading,  setLoading]  = useState({ games:!_cache.games, events:!_cache.events, concerts:!_cache.concerts });
  const [activeItem, setActiveItem] = useState(null);
  const [activeType, setActiveType] = useState(null);

  const load = useCallback(async (key, fetcher, setter) => {
    if (_cache[key]) return;
    try {
      const data = await fetcher();
      _cache[key] = data;
      setter(data);
    } catch {
    } finally {
      setLoading(l => ({ ...l, [key]: false }));
    }
  }, []);

  useEffect(() => {
    load("games",    fetchLiveGames,    setGames);
    load("events",   fetchLiveEvents,   setEvents);
    load("concerts", fetchLiveConcerts, setConcerts);
  }, [load]);

  useEffect(() => { setTab(initialTab); }, [initialTab]);

  const handleOpen = useCallback((item, type) => {
    setActiveItem(item);
    setActiveType(type);
  }, []);

  const handleClose = useCallback(() => {
    setActiveItem(null);
    setActiveType(null);
  }, []);

  const tabBtnStyle = (active) => ({
    fontFamily:"'DM Mono',monospace",
    fontSize:"0.55rem",
    letterSpacing:"0.11em",
    textTransform:"uppercase",
    padding:"8px 18px",
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
      <p style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.55rem", letterSpacing:"0.12em", textTransform:"uppercase" }}>
        No upcoming {label} right now — check back soon.
      </p>
    </div>
  );

  const grid = (items, renderCard) => (
    items.length === 0 ? emptyMsg(tab) : (
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:15 }}>
        {items.map(renderCard)}
      </div>
    )
  );

  return (
    <div>
      <div style={{ background:C.deep, padding:"64px 22px 40px", borderBottom:"1px solid "+C.border }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <p style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.55rem", letterSpacing:"0.22em", textTransform:"uppercase", color:C.gold, marginBottom:8 }}>
            Detroit
          </p>
          <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(1.8rem,5vw,3rem)", fontWeight:400, color:C.white, margin:0 }}>
            Things To Do
          </h2>
          <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"0.88rem", color:C.bone, fontWeight:300, lineHeight:1.7, marginTop:12, maxWidth:560 }}>
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
            <GameCard key={g.id} game={g} saved={isSavedEvent(g.id)} onSave={toggleSavedEvent} onOpen={handleOpen} />
          ))
        )}
        {tab === "events" && (
          loading.events ? <LoadingGrid /> :
          grid(events, e => (
            <EventCard key={e.id} event={e} saved={isSavedEvent(e.id)} onSave={toggleSavedEvent} onOpen={handleOpen} type="event" />
          ))
        )}
        {tab === "concerts" && (
          loading.concerts ? <LoadingGrid /> :
          grid(concerts, c => (
            <EventCard key={c.id} event={{ ...c, title: c.artist || c.title }} saved={isSavedEvent(c.id)} onSave={toggleSavedEvent} onOpen={handleOpen} type="concert" />
          ))
        )}

        <p style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.47rem", letterSpacing:"0.1em", textTransform:"uppercase", color:C.smoke, textAlign:"center", paddingTop:32 }}>
          Dates and times subject to change · Always verify before attending
        </p>
      </div>

      {activeItem && (
        <DetailModal
          item={activeItem}
          type={activeType}
          saved={isSavedEvent(activeItem.id)}
          onSave={toggleSavedEvent}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
