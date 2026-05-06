import React, { useState, useMemo, useRef, useEffect } from "react";
import { getTicketCTA, getBookingCTA, fmtDate } from "../data/eventsData.js";

const MONO  = { fontFamily:"'DM Mono',monospace" };
const SERIF = { fontFamily:"'Cormorant Garamond',serif" };

export const TASTE_OPTIONS = [
  { id:"hidden",    label:"Hidden Gems",       filter: v => (v.badges||[]).includes("hidden") },
  { id:"datenight", label:"Date Night",         filter: v => (v.best||"").includes("Date Night") },
  { id:"latenight", label:"Late Night",         filter: v => (v.hours||"").includes("2am") },
  { id:"cocktail",  label:"Cocktail First",     filter: v => v.cat==="Cocktail Lounges"||v.cat==="Hidden Bars" },
  { id:"foodie",    label:"Foodie",             filter: v => ["Dinner","Lunch","Breakfast"].includes(v.cat) },
  { id:"locals",    label:"Locals Only",        filter: v => (v.badges||[]).includes("locals") },
  { id:"rooftop",   label:"Rooftop Views",      filter: v => v.cat==="Rooftops" },
  { id:"sports",    label:"Sports & Games",     filter: v => v.cat==="Sports Bars" },
  { id:"happyhour", label:"Happy Hour",         filter: v => v.cat==="Happy Hour"||(v.cats||[]).includes("Happy Hour") },
  { id:"brunch",    label:"Weekend Brunch",     filter: v => v.cat==="Breakfast" },
  { id:"offstrip",  label:"Off the Main Strip", filter: v => v.hood!=="Downtown" },
  { id:"new",       label:"New & Noteworthy",   filter: v => (v.badges||[]).includes("recentopen") },
];

const PASSPORT_BADGES = [
  { id:"gem",      label:"Hidden Gem Hunter",     hint:"Visit a venue marked Hidden Gem",            test: vis => vis.some(v=>(v.badges||[]).includes("hidden")) },
  { id:"cocktail", label:"Cocktail Connoisseur",  hint:"Visit 3 cocktail lounges or hidden bars",    test: vis => vis.filter(v=>v.cat==="Cocktail Lounges"||v.cat==="Hidden Bars").length>=3 },
  { id:"owl",      label:"Night Owl",             hint:"Visit 2 venues open past 2am",               test: vis => vis.filter(v=>(v.hours||"").includes("2am")).length>=2 },
  { id:"hood",     label:"Neighborhood Explorer", hint:"Visit venues in 3 different neighborhoods",  test: vis => new Set(vis.map(v=>v.hood)).size>=3 },
  { id:"reg",      label:"The Regular",           hint:"Visit 5 venues",                             test: vis => vis.length>=5 },
  { id:"native",   label:"Detroit Native",        hint:"Visit 10 venues",                            test: vis => vis.length>=10 },
  { id:"roof",     label:"Rooftop Society",       hint:"Visit a rooftop venue",                      test: vis => vis.some(v=>v.cat==="Rooftops") },
  { id:"bird",     label:"Early Bird",            hint:"Visit a breakfast or brunch spot",           test: vis => vis.some(v=>v.cat==="Breakfast"||v.cat==="Coffee Shops & Bakeries") },
];

// Each badge has its own distinct passport stamp shape
const STAMP_DEFS = {
  gem:      { shape:"oval-tall",   rot:-5,  subtext:"HIDDEN · DETROIT" },
  cocktail: { shape:"rect",        rot: 3,  subtext:"COCKTAIL · CULTURE" },
  owl:      { shape:"circle",      rot:-2,  subtext:"AFTER DARK" },
  hood:     { shape:"wide",        rot: 4,  subtext:"EXPLORE · THE CITY" },
  reg:      { shape:"square",      rot:-3,  subtext:"5 VENUES · VISITED" },
  native:   { shape:"banner",      rot: 2,  subtext:"DETROIT · INSIDER" },
  roof:     { shape:"arch",        rot:-4,  subtext:"ELEVATED · DETROIT" },
  bird:     { shape:"oval-wide",   rot: 5,  subtext:"MORNING · RITUAL" },
};

const STAMP_ICONS = {
  gem:"◈", cocktail:"◇", owl:"○", hood:"—", reg:"✦", native:"◉", roof:"△", bird:"◇",
};

function getStampStyle(shape, earned) {
  const base = {
    display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
    textAlign:"center", position:"relative", overflow:"hidden",
    border: earned ? "1.5px solid rgba(201,168,76,0.6)" : "1px solid rgba(150,140,130,0.18)",
    background: earned ? "rgba(201,168,76,0.05)" : "rgba(30,28,26,0.5)",
    opacity: earned ? 1 : 0.35,
    transition:"opacity 0.4s, border-color 0.4s",
    padding:"14px 10px",
    boxSizing:"border-box",
  };
  // Inner double-border on earned stamps (ink bleed effect)
  if (earned) {
    base.boxShadow = "inset 0 0 0 3px rgba(201,168,76,0.09), 1px 2px 0 rgba(0,0,0,0.18)";
  }
  switch (shape) {
    case "oval-tall":  return { ...base, borderRadius:"45% 45% 50% 50% / 55% 55% 45% 45%", width:110, height:130 };
    case "rect":       return { ...base, borderRadius:6,     width:148, height:80  };
    case "circle":     return { ...base, borderRadius:"50%", width:112, height:112 };
    case "wide":       return { ...base, borderRadius:8,     width:158, height:68  };
    case "square":     return { ...base, borderRadius:4,     width:104, height:104 };
    case "banner":     return { ...base, borderRadius:3,     width:160, height:58  };
    case "arch":       return { ...base, borderRadius:"55% 55% 35% 35% / 65% 65% 35% 35%", width:112, height:122 };
    case "oval-wide":  return { ...base, borderRadius:"50%", width:138, height:86  };
    default:           return { ...base, borderRadius:"50%", width:110, height:110 };
  }
}

function getCTA(v) {
  if (v.reservationUrl) return { label: v.reservationLabel || "Book Now", url: v.reservationUrl };
  if (v.websiteUrl)     return { label: "Visit Website", url: v.websiteUrl };
  return null;
}

function getSmartSuggestion(allVenues) {
  const h = new Date().getHours();
  let pool;
  if      (h >= 6  && h < 11) pool = allVenues.filter(v => v.cat==="Breakfast" || v.cat==="Coffee Shops & Bakeries");
  else if (h >= 11 && h < 15) pool = allVenues.filter(v => v.cat==="Lunch" || v.cat==="Dinner" || (v.cats||[]).includes("Lunch"));
  else if (h >= 15 && h < 18) pool = allVenues.filter(v => v.cat==="Happy Hour" || v.cat==="Rooftops" || (v.cats||[]).includes("Happy Hour"));
  else if (h >= 18 && h < 23) pool = allVenues.filter(v => v.cat==="Dinner" || v.cat==="Cocktail Lounges" || (v.best||"").includes("Date Night"));
  else                         pool = allVenues.filter(v => (v.hours||"").includes("2am") || v.cat==="Nightlife" || v.cat==="Hidden Bars");
  if (!pool.length) pool = allVenues;
  return pool[Math.floor(Math.random() * pool.length)];
}

function getTimeLabel() {
  const h = new Date().getHours();
  if (h >= 6  && h < 11) return "Morning Pick";
  if (h >= 11 && h < 15) return "Lunch Idea";
  if (h >= 15 && h < 18) return "Afternoon Escape";
  if (h >= 18 && h < 23) return "Tonight";
  return "Late Night";
}

// Tag helpers
function tags(v) { return v.tags || []; }
function hasTag(v, t) { return tags(v).includes(t); }

function buildNight(when, who, energy, pool) {
  const used = new Set();

  function pick(candidates, fallback) {
    const src = candidates.length ? candidates : (fallback || []);
    const avail = src.filter(v => !used.has(String(v.id)));
    if (!avail.length) return null;
    const choice = avail[Math.floor(Math.random() * Math.min(avail.length, 6))];
    used.add(String(choice.id));
    return choice;
  }

  let foodPool, drinkPool, afterPool;

  if (when === "morning") {
    foodPool  = pool.filter(v => v.cat==="Breakfast" || v.cat==="Coffee Shops & Bakeries");
    drinkPool = pool.filter(v => v.cat==="Happy Hour" || v.cat==="Rooftops" || (v.cats||[]).includes("Happy Hour"));
    afterPool = pool.filter(v => hasTag(v,"calm") || v.cat==="Cocktail Lounges");

  } else if (when === "afternoon") {
    foodPool  = pool.filter(v => v.cat==="Lunch" || v.cat==="Dinner" || (v.cats||[]).includes("Lunch"));
    drinkPool = pool.filter(v => v.cat==="Happy Hour" || v.cat==="Rooftops" || (v.cats||[]).includes("Happy Hour"));
    afterPool = pool.filter(v => hasTag(v,"elevated") && hasTag(v,"drinks"));
    if (!foodPool.length) foodPool = pool.filter(v => v.cat==="Dinner");
    if (!afterPool.length) afterPool = pool.filter(v => v.cat==="Cocktail Lounges");

  } else if (when === "late") {
    foodPool  = pool.filter(v => v.cat==="Dinner" && (v.hours||"").includes("2am"));
    drinkPool = pool.filter(v => hasTag(v,"drinks") && (v.hours||"").includes("2am"));
    afterPool = pool.filter(v => (hasTag(v,"highEnergy") || v.cat==="Nightlife") && (v.hours||"").includes("2am"));
    if (!foodPool.length)  foodPool  = pool.filter(v => v.cat==="Dinner");
    if (!drinkPool.length) drinkPool = pool.filter(v => v.cat==="Cocktail Lounges" || v.cat==="Hidden Bars");
    if (!afterPool.length) afterPool = pool.filter(v => v.cat==="Nightlife" || v.cat==="Hidden Bars");

  } else {
    // Evening — energy drives everything
    if (energy === "calm") {
      // Quiet, intimate — candlelit bar or James Beard spot, then a hidden lounge
      foodPool  = pool.filter(v => v.cat==="Dinner" && (hasTag(v,"elevated") || hasTag(v,"calm") || (v.best||"").includes("Date Night")));
      drinkPool = pool.filter(v => hasTag(v,"calm") && hasTag(v,"drinks"));
      afterPool = pool.filter(v => (hasTag(v,"calm") || hasTag(v,"elevated")) && hasTag(v,"drinks"));
      if (!foodPool.length)  foodPool  = pool.filter(v => v.cat==="Dinner");
      if (!drinkPool.length) drinkPool = pool.filter(v => v.cat==="Hidden Bars" || v.cat==="Cocktail Lounges");

    } else if (energy === "chill") {
      // Casual — solid food, neighborhood bar vibes
      foodPool  = pool.filter(v => v.cat==="Dinner" || hasTag(v,"chill"));
      drinkPool = pool.filter(v => hasTag(v,"chill") && hasTag(v,"drinks"));
      afterPool = pool.filter(v => hasTag(v,"chill") || v.cat==="Happy Hour" || v.cat==="Sports Bars");
      if (!drinkPool.length) drinkPool = pool.filter(v => v.cat==="Happy Hour" || v.cat==="Sports Bars" || v.cat==="Cocktail Lounges");
      if (!afterPool.length) afterPool = pool.filter(v => v.cat==="Nightlife" || v.cat==="Cocktail Lounges");

    } else if (energy === "elevated") {
      // Luxury, polished — dinner first, polished lounge, dessert/after
      const isDN = who === "date";
      foodPool  = isDN
        ? pool.filter(v => hasTag(v,"elevated") && hasTag(v,"food") && hasTag(v,"dateNight"))
        : pool.filter(v => hasTag(v,"elevated") && hasTag(v,"food"));
      drinkPool = isDN
        ? pool.filter(v => hasTag(v,"elevated") && hasTag(v,"drinks") && hasTag(v,"dateNight"))
        : pool.filter(v => hasTag(v,"elevated") && hasTag(v,"drinks"));
      afterPool = pool.filter(v => hasTag(v,"elevated") && hasTag(v,"drinks") && (v.hours||"").includes("2am"));
      if (!foodPool.length)  foodPool  = pool.filter(v => v.cat==="Dinner" && (v.best||"").includes("Date Night"));
      if (!drinkPool.length) drinkPool = pool.filter(v => v.cat==="Cocktail Lounges" || v.cat==="Hidden Bars");
      if (!afterPool.length) afterPool = drinkPool;

    } else {
      // High Energy — big dinner, then nightlife
      foodPool  = pool.filter(v => v.cat==="Dinner" || hasTag(v,"food"));
      drinkPool = pool.filter(v => hasTag(v,"highEnergy") || v.cat==="Nightlife");
      afterPool = pool.filter(v => (hasTag(v,"highEnergy") || v.cat==="Nightlife") && (v.hours||"").includes("2am"));
      if (!drinkPool.length) drinkPool = pool.filter(v => v.cat==="Nightlife" || v.cat==="Cocktail Lounges");
      if (!afterPool.length) afterPool = drinkPool;
    }
  }

  // Universal fallbacks
  if (!foodPool.length)  foodPool  = pool.filter(v => ["Dinner","Lunch","Breakfast"].includes(v.cat));
  if (!drinkPool.length) drinkPool = pool.filter(v => v.cat==="Cocktail Lounges" || v.cat==="Hidden Bars");
  if (!afterPool.length) afterPool = pool.filter(v => v.cat==="Nightlife" || v.cat==="Hidden Bars" || v.cat==="Cocktail Lounges");

  return [pick(foodPool), pick(drinkPool), pick(afterPool)].filter(Boolean);
}

const STOP_LABELS = {
  morning:   ["Breakfast Stop", "Second Stop",  "Third Stop"],
  afternoon: ["Lunch Stop",     "Second Stop",  "Third Stop"],
  evening:   ["Dinner",         "Cocktails",    "After Hours"],
  late:      ["Late Eats",      "Nightcap",     "After Hours"],
};

function SectionLabel({ children, style }) {
  return (
    <p style={{ ...MONO, fontSize:"0.52rem", letterSpacing:"0.2em", textTransform:"uppercase", color:"var(--c-goldD)", margin:"0 0 14px", ...style }}>
      {children}
    </p>
  );
}

function VenueRow({ v, onOpen }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={() => onOpen(String(v.id))}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        display:"flex", alignItems:"flex-start", gap:14, padding:"14px 16px",
        background:"var(--c-card)", border:"1px solid var(--c-border)", borderRadius:10,
        cursor:"pointer", textAlign:"left", width:"100%",
        transition:"border-color 0.18s, transform 0.1s",
        transform: pressed ? "scale(0.975)" : "scale(1)",
      }}
    >
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
          <span style={{ ...MONO, fontSize:"0.46rem", letterSpacing:"0.14em", textTransform:"uppercase", color:"var(--c-gold)" }}>
            {v.cat}
          </span>
          <span style={{ ...MONO, fontSize:"0.44rem", letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--c-smoke)" }}>
            {v.hood}
          </span>
        </div>
        <div style={{ ...SERIF, fontSize:"1.08rem", fontWeight:600, color:"var(--c-white)", lineHeight:1.2, marginBottom:3 }}>
          {v.name}
        </div>
        <div style={{ fontSize:"0.77rem", color:"var(--c-ash)", fontWeight:300, lineHeight:1.5 }}>
          {v.desc.length > 85 ? v.desc.slice(0, 85) + "…" : v.desc}
        </div>
      </div>
      <span style={{ color:"var(--c-goldD)", fontSize:"0.85rem", flexShrink:0, marginTop:2 }}>→</span>
    </button>
  );
}

function OptionBtn({ val, current, onSet, label }) {
  const active  = current === val;
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={() => onSet(val)}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        ...MONO, fontSize:"0.5rem", letterSpacing:"0.1em", textTransform:"uppercase",
        padding:"9px 16px", borderRadius:8, whiteSpace:"nowrap",
        border:"1px solid " + (active ? "var(--c-gold)" : "var(--c-border)"),
        background: active ? "rgba(201,168,76,0.1)" : "transparent",
        color: active ? "var(--c-gold)" : "var(--c-ash)",
        cursor:"pointer", transition:"all 0.15s",
        transform: pressed ? "scale(0.94)" : "scale(1)",
      }}
    >
      {label}
    </button>
  );
}

// Stamp press overlay — full-screen animation when badge earned
function StampOverlay({ badge, onDone }) {
  const def  = STAMP_DEFS[badge.id] || {};
  const icon = STAMP_ICONS[badge.id] || "◈";

  useEffect(() => {
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:9990,
      display:"flex", alignItems:"center", justifyContent:"center",
      pointerEvents:"none",
      background:"rgba(10,9,8,0.45)",
    }}>
      <div className="stamp-overlay-press" style={{
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
        padding:"36px 44px",
        border:"3px solid rgba(201,168,76,0.75)",
        borderRadius:8,
        background:"rgba(20,17,14,0.9)",
        boxShadow:"inset 0 0 0 6px rgba(201,168,76,0.09), 0 0 60px rgba(201,168,76,0.14)",
        transform:"rotate(" + (def.rot || 0) + "deg)",
        minWidth:220,
        textAlign:"center",
      }}>
        <div style={{ ...MONO, fontSize:"0.46rem", letterSpacing:"0.3em", textTransform:"uppercase", color:"rgba(201,168,76,0.6)", marginBottom:10 }}>
          STAMP EARNED
        </div>
        <div style={{ fontSize:"1.6rem", color:"var(--c-gold)", marginBottom:10, lineHeight:1 }}>{icon}</div>
        <div style={{ ...SERIF, fontSize:"1.5rem", fontWeight:600, color:"var(--c-white)", lineHeight:1.2, marginBottom:8 }}>
          {badge.label}
        </div>
        <div style={{ ...MONO, fontSize:"0.42rem", letterSpacing:"0.2em", textTransform:"uppercase", color:"rgba(201,168,76,0.55)" }}>
          {def.subtext || "DETROIT · 2025"}
        </div>
      </div>
    </div>
  );
}

function ForYouTab({ taste, onTasteChange, allVenues, onOpenVenue }) {
  const MAX = 3;
  const [suggestion, setSuggestion] = useState(null);
  const [curating, setCurating]     = useState(false);
  const [btnPressed, setBtnPressed] = useState(false);

  const forYouVenues = useMemo(() => {
    if (!taste.length) return [];
    const filters = TASTE_OPTIONS.filter(t => taste.includes(t.id)).map(t => t.filter);
    return allVenues
      .map(v => ({ v, score: filters.reduce((acc, fn) => acc + (fn(v) ? 1 : 0), 0) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(x => x.v);
  }, [taste, allVenues]);

  function chooseForMe() {
    if (curating) return;
    setBtnPressed(true);
    setTimeout(() => setBtnPressed(false), 120);
    setCurating(true);
    setSuggestion(null);
    setTimeout(() => {
      setSuggestion(getSmartSuggestion(allVenues));
      setCurating(false);
    }, 900);
  }

  return (
    <div style={{ padding:"24px 22px 56px", maxWidth:1200, margin:"0 auto" }}>

      {/* Randomizer */}
      <div style={{ background:"var(--c-card)", border:"1px solid var(--c-border)", borderRadius:14, padding:"20px 20px 18px", marginBottom:28 }}>
        <p style={{ ...MONO, fontSize:"0.5rem", letterSpacing:"0.18em", textTransform:"uppercase", color:"var(--c-goldD)", margin:"0 0 5px" }}>
          Not sure what to do today?
        </p>
        <p style={{ ...SERIF, fontSize:"1.05rem", fontWeight:400, color:"var(--c-white)", margin:"0 0 14px" }}>
          Choose for Me
        </p>
        <button
          onClick={chooseForMe}
          style={{
            ...MONO, fontSize:"0.52rem", letterSpacing:"0.14em", textTransform:"uppercase",
            padding:"10px 22px", borderRadius:100, border:"1px solid var(--c-goldD)",
            background:"transparent", color:"var(--c-gold)", cursor:"pointer",
            transition:"all 0.15s", transform: btnPressed ? "scale(0.94)" : "scale(1)",
          }}
        >
          {curating ? "Curating…" : suggestion ? "Pick Again →" : "Choose for Me →"}
        </button>

        {curating && (
          <div className="curating-pulse" style={{ marginTop:18, padding:"14px 16px", background:"rgba(201,168,76,0.04)", border:"1px solid rgba(201,168,76,0.14)", borderRadius:10 }}>
            <div style={{ ...MONO, fontSize:"0.48rem", letterSpacing:"0.18em", textTransform:"uppercase", color:"var(--c-goldD)" }}>
              Curating your night…
            </div>
          </div>
        )}

        {!curating && suggestion && (
          <button
            onClick={() => onOpenVenue(String(suggestion.id))}
            className="fade-slide-up"
            style={{
              display:"flex", alignItems:"flex-start", gap:14, padding:"14px 16px",
              background:"rgba(201,168,76,0.06)", border:"1px solid rgba(201,168,76,0.22)",
              borderRadius:10, cursor:"pointer", textAlign:"left", width:"100%",
              transition:"border-color 0.18s", marginTop:14,
            }}
          >
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                <span style={{ ...MONO, fontSize:"0.44rem", letterSpacing:"0.18em", textTransform:"uppercase", color:"var(--c-gold)" }}>
                  {getTimeLabel()}
                </span>
                <span style={{ ...MONO, fontSize:"0.4rem", color:"var(--c-smoke)" }}>·</span>
                <span style={{ ...MONO, fontSize:"0.44rem", letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--c-smoke)" }}>
                  {suggestion.cat}
                </span>
              </div>
              <div style={{ ...SERIF, fontSize:"1.12rem", fontWeight:600, color:"var(--c-white)", lineHeight:1.2, marginBottom:3 }}>
                {suggestion.name}
              </div>
              <div style={{ fontSize:"0.77rem", color:"var(--c-ash)", fontWeight:300, lineHeight:1.5 }}>
                {suggestion.desc.length > 90 ? suggestion.desc.slice(0, 90) + "…" : suggestion.desc}
              </div>
            </div>
            <span style={{ color:"var(--c-goldD)", fontSize:"0.85rem", flexShrink:0, marginTop:2 }}>→</span>
          </button>
        )}
      </div>

      {/* Taste profile */}
      <div style={{ marginBottom:28 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
          <SectionLabel style={{ marginBottom:0 }}>Your Taste Profile</SectionLabel>
          {taste.length > 0 && (
            <span style={{ ...MONO, fontSize:"0.46rem", letterSpacing:"0.1em", color:"var(--c-smoke)" }}>
              {taste.length}/{MAX} selected
            </span>
          )}
        </div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
          {TASTE_OPTIONS.map(opt => {
            const selected = taste.includes(opt.id);
            const disabled = !selected && taste.length >= MAX;
            return (
              <button
                key={opt.id}
                onClick={() => {
                  if (selected)       onTasteChange(taste.filter(t => t !== opt.id));
                  else if (!disabled) onTasteChange([...taste, opt.id]);
                }}
                style={{
                  ...MONO, fontSize:"0.5rem", letterSpacing:"0.12em", textTransform:"uppercase",
                  padding:"8px 14px", borderRadius:100,
                  border:"1px solid " + (selected ? "var(--c-gold)" : "var(--c-border)"),
                  background: selected ? "rgba(201,168,76,0.12)" : "transparent",
                  color: selected ? "var(--c-gold)" : disabled ? "var(--c-borders)" : "var(--c-ash)",
                  cursor: disabled ? "default" : "pointer",
                  transition:"all 0.15s", opacity: disabled ? 0.38 : 1,
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        {taste.length === MAX && (
          <p style={{ ...MONO, fontSize:"0.46rem", letterSpacing:"0.07em", color:"var(--c-smoke)", marginTop:10, marginBottom:0 }}>
            Tap a selection to change it.
          </p>
        )}
      </div>

      {/* Curated results */}
      {taste.length === 0 ? (
        <div style={{ textAlign:"center", padding:"24px 0" }}>
          <p style={{ ...SERIF, fontSize:"1.1rem", fontWeight:400, color:"var(--c-smoke)", fontStyle:"italic", lineHeight:1.7 }}>
            Select up to 3 preferences above to see venues matched to your taste.
          </p>
        </div>
      ) : forYouVenues.length === 0 ? (
        <div style={{ textAlign:"center", padding:"24px 0" }}>
          <p style={{ ...SERIF, fontSize:"1rem", color:"var(--c-smoke)", fontStyle:"italic" }}>No matches found for that combination.</p>
        </div>
      ) : (
        <div>
          <SectionLabel>Matched For You</SectionLabel>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {forYouVenues.map(v => <VenueRow key={v.id} v={v} onOpen={onOpenVenue} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function BuildNightTab({ allVenues, onOpenVenue }) {
  const [when,   setWhen]   = useState("evening");
  const [who,    setWho]    = useState("solo");
  const [energy, setEnergy] = useState("elevated");
  const [night,  setNight]  = useState(null);
  const [building, setBuilding] = useState(false);
  const [btnPressed, setBtnPressed] = useState(false);

  function handleBuild() {
    if (building) return;
    setBtnPressed(true);
    setTimeout(() => setBtnPressed(false), 120);
    setBuilding(true);
    setNight(null);
    setTimeout(() => {
      setNight(buildNight(when, who, energy, allVenues));
      setBuilding(false);
    }, 700);
  }

  const labels = STOP_LABELS[when] || STOP_LABELS.evening;

  const energyDesc = {
    calm:      "Quiet & intimate — hidden bars, candlelit rooms",
    chill:     "Casual & easy — neighborhood spots, no fuss",
    elevated:  "Luxury & polished — dinner first, then a proper lounge",
    highenergy:"Nightlife energy — lively, late, full send",
  }[energy] || "";

  return (
    <div style={{ padding:"24px 22px 56px", maxWidth:1200, margin:"0 auto" }}>

      <div style={{ background:"var(--c-card)", border:"1px solid var(--c-border)", borderRadius:14, padding:"22px 20px 20px", marginBottom:24 }}>
        <p style={{ ...MONO, fontSize:"0.5rem", letterSpacing:"0.18em", textTransform:"uppercase", color:"var(--c-goldD)", margin:"0 0 5px" }}>
          Build My Night
        </p>
        <p style={{ ...SERIF, fontSize:"1.05rem", fontWeight:400, color:"var(--c-white)", margin:"0 0 22px" }}>
          Tell us how you want to spend it.
        </p>

        {/* When */}
        <div style={{ marginBottom:18 }}>
          <p style={{ ...MONO, fontSize:"0.46rem", letterSpacing:"0.16em", textTransform:"uppercase", color:"var(--c-smoke)", margin:"0 0 10px" }}>When</p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {[
              { val:"morning",   label:"Morning" },
              { val:"afternoon", label:"Afternoon" },
              { val:"evening",   label:"Evening" },
              { val:"late",      label:"Late Night" },
            ].map(o => <OptionBtn key={o.val} val={o.val} current={when} onSet={setWhen} label={o.label} />)}
          </div>
        </div>

        {/* Who */}
        <div style={{ marginBottom:18 }}>
          <p style={{ ...MONO, fontSize:"0.46rem", letterSpacing:"0.16em", textTransform:"uppercase", color:"var(--c-smoke)", margin:"0 0 10px" }}>Who</p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {[
              { val:"solo",  label:"Just Me" },
              { val:"date",  label:"2 of Us" },
              { val:"group", label:"Group" },
            ].map(o => <OptionBtn key={o.val} val={o.val} current={who} onSet={setWho} label={o.label} />)}
          </div>
        </div>

        {/* Energy */}
        <div style={{ marginBottom:22 }}>
          <p style={{ ...MONO, fontSize:"0.46rem", letterSpacing:"0.16em", textTransform:"uppercase", color:"var(--c-smoke)", margin:"0 0 10px" }}>Energy</p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:8 }}>
            {[
              { val:"calm",      label:"Calm" },
              { val:"chill",     label:"Chill" },
              { val:"elevated",  label:"Elevated" },
              { val:"highenergy",label:"High Energy" },
            ].map(o => <OptionBtn key={o.val} val={o.val} current={energy} onSet={setEnergy} label={o.label} />)}
          </div>
          {energyDesc && (
            <p style={{ ...MONO, fontSize:"0.44rem", letterSpacing:"0.06em", color:"var(--c-smoke)", margin:"6px 0 0", lineHeight:1.5 }}>
              {energyDesc}
            </p>
          )}
        </div>

        <button
          onClick={handleBuild}
          style={{
            ...MONO, fontSize:"0.53rem", letterSpacing:"0.14em", textTransform:"uppercase",
            padding:"12px 26px", borderRadius:100,
            border:"1px solid var(--c-goldD)",
            background: building ? "rgba(201,168,76,0.08)" : "transparent",
            color:"var(--c-gold)", cursor:"pointer",
            transition:"all 0.15s",
            transform: btnPressed ? "scale(0.94)" : "scale(1)",
          }}
        >
          {building ? "Building…" : night ? "Rebuild →" : "Build My Night →"}
        </button>
      </div>

      {building && (
        <div className="curating-pulse" style={{ padding:"18px 20px", background:"var(--c-card)", border:"1px solid var(--c-border)", borderRadius:12 }}>
          <div style={{ ...MONO, fontSize:"0.48rem", letterSpacing:"0.18em", textTransform:"uppercase", color:"var(--c-goldD)" }}>
            Building your night…
          </div>
        </div>
      )}

      {!building && night && night.length > 0 && (
        <div className="fade-slide-up">
          <SectionLabel>Your Night</SectionLabel>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {night.map((v, i) => (
              <div key={v.id}>
                <p style={{ ...MONO, fontSize:"0.44rem", letterSpacing:"0.18em", textTransform:"uppercase", color:"var(--c-goldD)", margin:"0 0 6px" }}>
                  {labels[i] || "Stop " + (i + 1)}
                </p>
                <VenueRow v={v} onOpen={onOpenVenue} />
              </div>
            ))}
          </div>
        </div>
      )}

      {!building && night && night.length === 0 && (
        <div style={{ textAlign:"center", padding:"24px 0" }}>
          <p style={{ ...SERIF, fontSize:"1rem", color:"var(--c-smoke)", fontStyle:"italic" }}>
            No matches found. Try a different combination.
          </p>
        </div>
      )}
    </div>
  );
}

function MiniCard({ children, onClick }) {
  const [pressed, setPressed] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        background:"var(--c-card)", border:"1px solid var(--c-border)",
        borderRadius:10, overflow:"hidden", cursor: onClick ? "pointer" : "default",
        transition:"transform 0.1s, border-color 0.18s",
        transform: pressed ? "scale(0.975)" : "scale(1)",
      }}
    >
      {children}
    </div>
  );
}

function SecHdr({ children }) {
  return (
    <p style={{ ...MONO, fontSize:"0.52rem", letterSpacing:"0.18em", textTransform:"uppercase", color:"var(--c-goldD)", margin:"0 0 12px" }}>
      {children}
    </p>
  );
}

function SavedSpotsTab({ savedVenues, savedEventItems, savedHotelItems, toggleFav, onUnsaveEvent, onUnsaveHotel, onOpenVenue }) {
  const empty = !savedVenues.length && !savedEventItems.length && !savedHotelItems.length;
  return (
    <div style={{ padding:"24px 22px 56px", maxWidth:1200, margin:"0 auto" }}>
      {empty ? (
        <div style={{ textAlign:"center", padding:"32px 0" }}>
          <p style={{ ...SERIF, fontSize:"1.1rem", fontWeight:400, color:"var(--c-smoke)", fontStyle:"italic", lineHeight:1.7 }}>
            Tap the heart on any venue, event, or hotel to save it here.
          </p>
        </div>
      ) : (
        <>
          {savedVenues.length > 0 && (
            <div style={{ marginBottom:28 }}>
              <SecHdr>Saved Spots</SecHdr>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {savedVenues.map(v => (
                  <button
                    key={v.id}
                    onClick={() => onOpenVenue(String(v.id))}
                    style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"13px 16px", background:"var(--c-card)", border:"1px solid var(--c-border)", borderRadius:8, cursor:"pointer", textAlign:"left", width:"100%", transition:"border-color 0.18s" }}
                  >
                    <div>
                      <div style={{ ...SERIF, fontSize:"1.02rem", fontWeight:600, color:"var(--c-white)", marginBottom:2 }}>{v.name}</div>
                      <div style={{ ...MONO, fontSize:"0.44rem", letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--c-smoke)" }}>{v.cat} · {v.hood}</div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <button onClick={e => { e.stopPropagation(); toggleFav && toggleFav(String(v.id)); }} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--c-gold)", fontSize:"1.2rem", padding:"6px 4px", lineHeight:1 }}>♥</button>
                      <span style={{ color:"var(--c-goldD)", fontSize:"0.85rem" }}>→</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {savedEventItems.length > 0 && (
            <div style={{ marginBottom:28 }}>
              <SecHdr>Saved Events</SecHdr>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:12 }}>
                {savedEventItems.map(item => {
                  const badge = item.type==="game" ? "Sports" : item.type==="concert" ? "Concerts" : "Events";
                  const cta   = getTicketCTA(item);
                  return (
                    <MiniCard key={item.id} onClick={() => {}}>
                      {item.image && <img src={item.image} alt="" loading="lazy" style={{ width:"100%", height:120, objectFit:"cover", display:"block" }} />}
                      <div style={{ padding:"13px 14px" }}>
                        <div style={{ ...MONO, fontSize:"0.46rem", letterSpacing:"0.14em", textTransform:"uppercase", color:"var(--c-gold)", marginBottom:5 }}>{badge}</div>
                        <div style={{ ...SERIF, fontSize:"1.05rem", fontWeight:600, color:"var(--c-white)", lineHeight:1.2, marginBottom:5 }}>{item.label}</div>
                        <div style={{ fontSize:"0.76rem", color:"var(--c-smoke)", fontWeight:300, marginBottom:10 }}>
                          {item.venue}{item.date ? " · " + fmtDate(item.date) : ""}
                        </div>
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                          {cta ? (
                            <a href={cta.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ display:"inline-block", background:"var(--c-gold)", color:"var(--c-black)", ...MONO, fontSize:"0.5rem", letterSpacing:"0.12em", textTransform:"uppercase", padding:"7px 14px", borderRadius:5, fontWeight:500, textDecoration:"none" }}>
                              {cta.label}
                            </a>
                          ) : <span />}
                          <button onClick={e => { e.stopPropagation(); onUnsaveEvent && onUnsaveEvent(item.id, item); }} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--c-gold)", fontSize:"1.2rem", padding:"6px 4px", lineHeight:1 }}>♥</button>
                        </div>
                      </div>
                    </MiniCard>
                  );
                })}
              </div>
            </div>
          )}

          {savedHotelItems.length > 0 && (
            <div>
              <SecHdr>Hotel Stays</SecHdr>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:12 }}>
                {savedHotelItems.map(h => {
                  const cta = getBookingCTA(h);
                  return (
                    <MiniCard key={h.id} onClick={() => {}}>
                      {h.image && <img src={h.image} alt="" loading="lazy" style={{ width:"100%", height:120, objectFit:"cover", display:"block" }} />}
                      <div style={{ padding:"13px 14px" }}>
                        <div style={{ ...MONO, fontSize:"0.46rem", letterSpacing:"0.14em", textTransform:"uppercase", color:"var(--c-gold)", marginBottom:5 }}>{h.hood} · Hotel</div>
                        <div style={{ ...SERIF, fontSize:"1.05rem", fontWeight:600, color:"var(--c-white)", lineHeight:1.2, marginBottom:4 }}>{h.name}</div>
                        <div style={{ fontSize:"0.76rem", color:"var(--c-smoke)", fontWeight:300, marginBottom:10 }}>{h.price_from || ""}</div>
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                          {cta ? (
                            <a href={cta.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ display:"inline-block", background:"var(--c-gold)", color:"var(--c-black)", ...MONO, fontSize:"0.5rem", letterSpacing:"0.12em", textTransform:"uppercase", padding:"7px 14px", borderRadius:5, fontWeight:500, textDecoration:"none" }}>
                              {cta.label}
                            </a>
                          ) : <span />}
                          <button onClick={e => { e.stopPropagation(); onUnsaveHotel && onUnsaveHotel(h.id); }} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--c-gold)", fontSize:"1.2rem", padding:"6px 4px", lineHeight:1 }}>♥</button>
                        </div>
                      </div>
                    </MiniCard>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PassportStamp({ badge, def, earned, isNew }) {
  const icon  = STAMP_ICONS[badge.id] || "◈";
  const shape = def ? def.shape : "circle";
  const rot   = def ? def.rot  : 0;
  const sub   = def ? def.subtext : "DETROIT · 2025";
  const st    = getStampStyle(shape, earned);

  return (
    <div
      key={badge.id}
      className={isNew ? "stamp-press" : undefined}
      style={{
        ...st,
        flexShrink: 0,
        transform: `rotate(${rot}deg)`,
        transition:"opacity 0.4s, border-color 0.4s",
      }}
    >
      {earned && (
        <span style={{
          position:"absolute", top:"50%", left:"50%",
          transform:"translate(-50%,-50%) rotate(-18deg)",
          ...MONO, fontSize:"0.35rem", letterSpacing:"0.28em",
          color:"rgba(201,168,76,0.13)", textTransform:"uppercase",
          whiteSpace:"nowrap", pointerEvents:"none", zIndex:1,
          userSelect:"none",
        }}>
          STAMPED
        </span>
      )}
      <div style={{ position:"relative", zIndex:2, display:"flex", flexDirection:"column", alignItems:"center" }}>
        <div style={{
          fontSize:"0.7rem", marginBottom:5, lineHeight:1,
          color: earned ? "var(--c-gold)" : "var(--c-smoke)",
        }}>
          {earned ? icon : "○"}
        </div>
        <div style={{ ...SERIF, fontSize:"0.88rem", fontWeight:600, color: earned ? "var(--c-white)" : "var(--c-ash)", lineHeight:1.2, marginBottom: earned ? 4 : 6, textAlign:"center" }}>
          {badge.label}
        </div>
        {earned ? (
          <div style={{ ...MONO, fontSize:"0.36rem", letterSpacing:"0.16em", textTransform:"uppercase", color:"rgba(201,168,76,0.5)", textAlign:"center" }}>
            {sub}
          </div>
        ) : (
          <div style={{ ...MONO, fontSize:"0.4rem", letterSpacing:"0.04em", color:"var(--c-smoke)", lineHeight:1.4, textAlign:"center", maxWidth:80 }}>
            {badge.hint}
          </div>
        )}
      </div>
    </div>
  );
}

function PassportTab({ visited, allVenues, onOpenVenue, navTo }) {
  const visitedVenues = useMemo(
    () => allVenues.filter(v => visited.includes(String(v.id))),
    [visited, allVenues]
  );

  const badges      = PASSPORT_BADGES.map(b => ({ ...b, earned: b.test(visitedVenues) }));
  const earnedCount = badges.filter(b => b.earned).length;
  const milestone   = 20;
  const pct         = visitedVenues.length === 0 ? 0 : Math.min(100, Math.round((visitedVenues.length / milestone) * 100));
  const recentVisited = visitedVenues.slice(-5).reverse();

  // Track newly earned for stamp overlay animation
  const prevEarnedRef  = useRef(new Set());
  const earnedIds      = useMemo(() => new Set(badges.filter(b => b.earned).map(b => b.id)), [badges]);
  const newlyEarnedIds = useMemo(() => new Set([...earnedIds].filter(id => !prevEarnedRef.current.has(id))), [earnedIds]);
  useEffect(() => { prevEarnedRef.current = earnedIds; }, [earnedIds]);

  const [overlayBadge, setOverlayBadge] = useState(null);
  useEffect(() => {
    if (newlyEarnedIds.size > 0) {
      const b = badges.find(b => newlyEarnedIds.has(b.id));
      if (b) setOverlayBadge(b);
    }
  }, [newlyEarnedIds.size]);

  return (
    <div style={{ padding:"24px 22px 56px", maxWidth:1200, margin:"0 auto" }}>

      {/* Full-screen stamp overlay */}
      {overlayBadge && (
        <StampOverlay badge={overlayBadge} onDone={() => setOverlayBadge(null)} />
      )}

      {/* Header */}
      <div style={{ background:"var(--c-card)", border:"1px solid var(--c-border)", borderRadius:14, padding:"22px 22px 18px", marginBottom:28 }}>
        <p style={{ ...MONO, fontSize:"0.46rem", letterSpacing:"0.2em", textTransform:"uppercase", color:"var(--c-goldD)", margin:"0 0 6px" }}>
          Detroit Insider Passport
        </p>
        <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:14 }}>
          <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
            <span style={{ ...SERIF, fontSize:"2.2rem", fontWeight:400, color:"var(--c-white)", lineHeight:1 }}>
              {visitedVenues.length}
            </span>
            <span style={{ fontSize:"0.86rem", color:"var(--c-smoke)", fontWeight:300 }}>
              venue{visitedVenues.length !== 1 ? "s" : ""} visited
            </span>
          </div>
          <span style={{ ...MONO, fontSize:"0.48rem", letterSpacing:"0.1em", color:"var(--c-gold)" }}>
            {earnedCount} / {badges.length} stamps
          </span>
        </div>
        <div style={{ background:"var(--c-borders)", borderRadius:100, height:2, overflow:"hidden" }}>
          <div style={{ height:"100%", width:pct + "%", background:"var(--c-gold)", borderRadius:100, transition:"width 0.7s ease" }} />
        </div>
        <p style={{ ...MONO, fontSize:"0.44rem", letterSpacing:"0.07em", color:"var(--c-smoke)", marginTop:8, marginBottom:0 }}>
          {visitedVenues.length === 0
            ? "Open any venue and mark it as visited to begin"
            : pct + "% of your first " + milestone + " discovered"}
        </p>
      </div>

      {/* Passport stamps — mixed shapes, real passport aesthetic */}
      <div style={{ marginBottom:32 }}>
        <SectionLabel>Passport Stamps</SectionLabel>
        <div style={{ display:"flex", flexWrap:"wrap", gap:18, justifyContent:"flex-start", alignItems:"flex-start" }}>
          {badges.map(b => (
            <PassportStamp
              key={b.id}
              badge={b}
              def={STAMP_DEFS[b.id]}
              earned={b.earned}
              isNew={newlyEarnedIds.has(b.id)}
            />
          ))}
        </div>
      </div>

      {/* Recently visited */}
      {recentVisited.length > 0 ? (
        <div>
          <SectionLabel>Recently Visited</SectionLabel>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {recentVisited.map(v => (
              <button
                key={v.id}
                onClick={() => onOpenVenue(String(v.id))}
                style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"13px 16px", background:"var(--c-card)", border:"1px solid var(--c-border)", borderRadius:8, cursor:"pointer", textAlign:"left", width:"100%", transition:"border-color 0.18s" }}
              >
                <div>
                  <div style={{ ...SERIF, fontSize:"1.02rem", fontWeight:600, color:"var(--c-white)", marginBottom:2 }}>{v.name}</div>
                  <div style={{ ...MONO, fontSize:"0.44rem", letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--c-smoke)" }}>{v.cat} · {v.hood}</div>
                </div>
                <span style={{ color:"var(--c-goldD)", fontSize:"0.85rem", flexShrink:0 }}>→</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ textAlign:"center", padding:"24px 0" }}>
          <p style={{ ...SERIF, fontSize:"1.05rem", fontWeight:400, color:"var(--c-smoke)", fontStyle:"italic", lineHeight:1.6, marginBottom:16 }}>
            Open any venue and tap "Mark as Visited" to build your passport.
          </p>
          <button
            onClick={() => navTo("explore")}
            style={{ ...MONO, fontSize:"0.5rem", letterSpacing:"0.14em", textTransform:"uppercase", color:"var(--c-gold)", border:"1px solid var(--c-goldD)", padding:"9px 20px", borderRadius:6, background:"transparent", cursor:"pointer" }}
          >
            Explore Venues →
          </button>
        </div>
      )}
    </div>
  );
}

const TABS = [
  { id:"foryou",   label:"For You" },
  { id:"tonight",  label:"Tonight" },
  { id:"saved",    label:"Saved"   },
  { id:"passport", label:"Passport"},
];

export default function MyDetroit({
  visited, taste, onTasteChange, onOpenVenue, navTo, allVenues,
  savedVenues, savedEventItems, savedHotelItems,
  toggleFav, onUnsaveEvent, onUnsaveHotel,
}) {
  const [subTab, setSubTab] = useState("foryou");

  return (
    <div>
      <div style={{ background:"var(--c-deep)", padding:"46px 22px 0", borderBottom:"1px solid var(--c-border)" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <p style={{ ...MONO, fontSize:"0.53rem", letterSpacing:"0.22em", textTransform:"uppercase", color:"var(--c-gold)", marginBottom:5 }}>
            Personal Guide
          </p>
          <h2 style={{ ...SERIF, fontSize:"clamp(1.8rem,5vw,3rem)", fontWeight:400, color:"var(--c-white)", marginBottom:4 }}>
            Itinerary
          </h2>
          <p style={{ fontSize:"0.84rem", color:"var(--c-smoke)", marginBottom:0 }}>
            Curated to how you explore Detroit.
          </p>
        </div>
        <div style={{ maxWidth:1200, margin:"18px auto 0" }}>
          <div style={{ display:"flex", gap:0 }}>
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setSubTab(t.id)}
                style={{
                  ...MONO, fontSize:"0.52rem", letterSpacing:"0.12em", textTransform:"uppercase",
                  padding:"12px 14px", background:"none", border:"none", cursor:"pointer",
                  color: subTab === t.id ? "var(--c-gold)" : "var(--c-smoke)",
                  borderBottom: subTab === t.id ? "2px solid var(--c-gold)" : "2px solid transparent",
                  transition:"color 0.18s, border-color 0.18s", whiteSpace:"nowrap", flexShrink:0,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {subTab === "foryou"   && <ForYouTab taste={taste} onTasteChange={onTasteChange} allVenues={allVenues} onOpenVenue={onOpenVenue} />}
      {subTab === "tonight"  && <BuildNightTab allVenues={allVenues} onOpenVenue={onOpenVenue} />}
      {subTab === "saved"    && <SavedSpotsTab savedVenues={savedVenues||[]} savedEventItems={savedEventItems||[]} savedHotelItems={savedHotelItems||[]} toggleFav={toggleFav} onUnsaveEvent={onUnsaveEvent} onUnsaveHotel={onUnsaveHotel} onOpenVenue={onOpenVenue} />}
      {subTab === "passport" && <PassportTab visited={visited} allVenues={allVenues} onOpenVenue={onOpenVenue} navTo={navTo} />}
    </div>
  );
}
