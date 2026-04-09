import React, { useState, useEffect, useCallback } from "react";
import { getTicketCTA, fmtDate } from "../data/eventsData.js";
import { fetchLiveGames, fetchLiveConcerts, fetchLiveEvents } from "../data/fetchLiveData.js";
import { fetchPlacePhotos } from "../data/fetchPlaces.js";

const C = {
  black:"var(--c-black)", deep:"var(--c-deep)", card:"var(--c-card)", border:"var(--c-border)", borderS:"var(--c-borders)",
  gold:"var(--c-gold)", goldL:"var(--c-goldL)", goldD:"var(--c-goldD)",
  smoke:"var(--c-smoke)", ash:"var(--c-ash)", bone:"var(--c-bone)", white:"var(--c-white)", purple:"var(--c-purple)",
};

const SPORT_COLORS = {
  MLB: { bg:"rgba(201,168,76,0.24)",  color:"var(--c-gold)",   border:"rgba(201,168,76,0.72)" },
  NBA: { bg:"rgba(30,80,200,0.18)",   color:"#8AACFF",         border:"rgba(30,80,200,0.58)" },
  NHL: { bg:"rgba(210,30,30,0.22)",   color:"#FF5A5A",         border:"rgba(210,30,30,0.72)" },
  NFL: { bg:"rgba(0,118,182,0.18)",   color:"#7DC8F5",         border:"rgba(0,118,182,0.58)" },
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
      style={{ display:"inline-block", background:C.gold, color:C.black, fontFamily:"'DM Mono',monospace", fontSize:"0.57rem", letterSpacing:"0.13em", textTransform:"uppercase", padding:"10px 18px", borderRadius:6, fontWeight:500, textDecoration:"none", cursor:"pointer", flexShrink:0 }}
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
      style={{ flex:1, display:"block", background:C.gold, color:C.black, fontFamily:"'DM Mono',monospace", fontSize:"0.57rem", letterSpacing:"0.13em", textTransform:"uppercase", padding:"10px 18px", borderRadius:6, fontWeight:500, textDecoration:"none", cursor:"pointer", textAlign:"center" }}
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
  const title = isGame ? null : (item.artist || item.title || "");
  const categoryLabel = isGame ? item.sport : item.category;
  const sc = isGame ? (SPORT_COLORS[item.sport] || SPORT_COLORS.MLB) : null;

  useEffect(() => {
    const fn = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);

  const curatedLine = isGame && item.note
    ? `${item.note} at ${item.venue}.`
    : (!isGame && item.desc ? item.desc.split(/\.\s/)[0] + "." : null);

  return (
    <>
      <div
        onClick={onClose}
        style={{ position:"fixed", inset:0, background:"var(--c-modal-bd)", zIndex:800, backdropFilter:"blur(6px)", WebkitBackdropFilter:"blur(6px)" }}
      />
      <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:"min(600px,93vw)", maxHeight:"92vh", overflowY:"auto", background:"var(--c-modal-bg)", border:"1px solid var(--c-modal-bdr)", borderRadius:16, zIndex:900 }}>

        <div style={{ position:"relative", flexShrink:0 }}>
          {isGame
            ? <CardImage src={item.resolvedImage || item.image} alt={item.team} logo={item.logo_url} height={290} />
            : <CardImage src={item.resolvedImage || item.image} alt={title} height={290} />
          }
          <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"55%", background:"linear-gradient(to bottom, transparent, var(--c-modal-grad))", pointerEvents:"none" }} />
        </div>

        <div style={{ padding:"16px 22px 28px", display:"flex", flexDirection:"column", gap:14 }}>

          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.49rem", letterSpacing:"0.16em", textTransform:"uppercase", color:C.gold, fontWeight:400 }}>
              {categoryLabel}
            </span>
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.49rem", letterSpacing:"0.12em", textTransform:"uppercase", color:"var(--c-modal-hood)" }}>
                {item.hood}
              </span>
              <button
                onClick={e => { e.stopPropagation(); onClose(); }}
                style={{ background:"none", border:"none", color:"var(--c-modal-close)", cursor:"pointer", fontSize:"1.15rem", fontWeight:300, flexShrink:0, transition:"color 0.18s", minWidth:36, minHeight:36, display:"flex", alignItems:"center", justifyContent:"center", lineHeight:1, padding:0 }}
              >✕</button>
            </div>
          </div>

          <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(1.65rem,5vw,2.3rem)", fontWeight:600, color:"var(--c-modal-title)", lineHeight:1.07, margin:0, letterSpacing:"-0.01em" }}>
            {isGame ? (
              <>{item.team} <span style={{ color:"var(--c-modal-vs)", fontWeight:400 }}>vs.</span> {item.opponent}</>
            ) : title}
          </h2>

          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.75rem", letterSpacing:"0.04em", color:C.goldL, fontWeight:500 }}>
              {item.date ? fmtDate(item.date) : "Date TBA"} · {item.time}
            </span>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"0.82rem", color:"var(--c-modal-meta)", fontWeight:300 }}>
              {item.venue} · Detroit, MI
            </span>
          </div>

          {curatedLine && (
            <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.08rem", fontStyle:"italic", color:"var(--c-modal-quote)", fontWeight:400, lineHeight:1.5, margin:0 }}>
              {curatedLine}
            </p>
          )}

          <div style={{ display:"flex", gap:10, alignItems:"stretch", marginTop:4 }}>
            <CTABtnFull item={item} />
            <button
              onClick={() => onSave(item.id, item)}
              style={{ padding:"0 18px", background:saved?"rgba(201,168,76,0.15)":"var(--c-modal-save-bg)", border:"1.5px solid "+(saved?"rgba(201,168,76,0.7)":"var(--c-modal-save-bdr)"), color:saved?C.gold:"var(--c-modal-save-clr)", fontFamily:"'DM Mono',monospace", fontSize:"0.52rem", letterSpacing:"0.12em", textTransform:"uppercase", borderRadius:8, cursor:"pointer", transition:"all 0.18s", flexShrink:0, whiteSpace:"nowrap" }}
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
      onClick={() => onOpen({ ...game, resolvedImage: game.image }, "game")}
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
        <SaveBtn saved={saved} onSave={() => onSave(game.id, game)} />
      </div>
    </div>
  );
}

function EventCard({ event, saved, onSave, onOpen, type = "event" }) {
  const [hov, setHov] = useState(false);
  const [venueSrc, setVenueSrc] = useState(event.image);
  const title = event.artist || event.title || "";

  useEffect(() => {
    if (!event.places_query) return;
    fetchPlacePhotos(event.places_query).then(d => {
      if (d?.photos?.[0]) setVenueSrc(d.photos[0]);
    });
  }, [event.places_query]);

  return (
    <div
      onClick={() => onOpen({ ...event, resolvedImage: venueSrc }, type)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background:C.card, border:"1px solid "+(hov?C.goldD:C.border), borderRadius:12, overflow:"hidden", display:"flex", flexDirection:"column", animation:"fadeSlideIn 0.28s ease both", cursor:"pointer", transform:hov?"translateY(-3px)":"none", boxShadow:hov?"var(--c-shdw-h)":"var(--c-shdw-f)", transition:"all 0.22s" }}
    >
      <CardImage src={venueSrc} alt={title} height={200} />
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
        <SaveBtn saved={saved} onSave={() => onSave(event.id, event)} />
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

export default function ThingsToDo({ isSavedEvent, toggleSavedEvent, initialTab = "games", onBack }) {
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
      <div style={{ background:C.deep, paddingTop: onBack ? 70 : 0, paddingLeft:22, paddingRight:22, paddingBottom: onBack ? 12 : 0 }}>
        {onBack && (
          <div style={{ maxWidth:1200, margin:"0 auto" }}>
            <button onClick={onBack} style={{ background:"none", border:"none", cursor:"pointer", color:C.ash, fontFamily:"'DM Mono',monospace", fontSize:"0.52rem", letterSpacing:"0.18em", textTransform:"uppercase", padding:"6px 0", display:"inline-flex", alignItems:"center", gap:9, transition:"color 0.18s", minHeight:40 }}
              onMouseEnter={e=>e.currentTarget.style.color=C.goldL} onMouseLeave={e=>e.currentTarget.style.color=C.ash}>
              <span style={{ fontSize:"1.1rem", lineHeight:1, fontWeight:300, letterSpacing:0 }}>←</span>Back
            </button>
          </div>
        )}
      </div>
      <div style={{ background:C.deep, padding: onBack ? "16px 22px 40px" : "64px 22px 40px", borderBottom:"1px solid "+C.border }}>
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
