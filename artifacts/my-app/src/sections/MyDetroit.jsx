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

const STAMP_ROTATIONS = [-4, 3, -2, 5, -3, 2, -1, 4];

function getCTA(v) {
  if (v.reservationUrl) return { label: v.reservationLabel || "Book Now", url: v.reservationUrl };
  if (v.websiteUrl)     return { label: "Visit Website", url: v.websiteUrl };
  return null;
}

function getSmartSuggestion(allVenues) {
  const h = new Date().getHours();
  let pool;
  if (h >= 6 && h < 11) {
    pool = allVenues.filter(v => v.cat==="Breakfast" || v.cat==="Coffee Shops & Bakeries");
  } else if (h >= 11 && h < 15) {
    pool = allVenues.filter(v => v.cat==="Lunch" || v.cat==="Dinner" || (v.cats||[]).includes("Lunch"));
  } else if (h >= 15 && h < 18) {
    pool = allVenues.filter(v => v.cat==="Happy Hour" || v.cat==="Rooftops" || (v.cats||[]).includes("Happy Hour"));
  } else if (h >= 18 && h < 23) {
    pool = allVenues.filter(v => v.cat==="Dinner" || v.cat==="Cocktail Lounges" || (v.best||"").includes("Date Night"));
  } else {
    pool = allVenues.filter(v => (v.hours||"").includes("2am") || v.cat==="Nightlife" || v.cat==="Hidden Bars");
  }
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

function buildNight(when, who, energy, pool) {
  const used = new Set();

  function pick(candidates, fallback) {
    const src = candidates.length ? candidates : (fallback || []);
    const avail = src.filter(v => !used.has(String(v.id)));
    if (!avail.length) return null;
    const choice = avail[Math.floor(Math.random() * Math.min(avail.length, 5))];
    used.add(String(choice.id));
    return choice;
  }

  // STOP 1 — Food / anchor (always first)
  let foodPool;
  if (when === "morning") {
    foodPool = pool.filter(v => v.cat==="Breakfast" || v.cat==="Coffee Shops & Bakeries");
  } else if (when === "afternoon") {
    foodPool = pool.filter(v => v.cat==="Lunch" || v.cat==="Dinner" || (v.cats||[]).includes("Lunch"));
    if (!foodPool.length) foodPool = pool.filter(v => v.cat==="Dinner");
  } else if (when === "evening") {
    if (who === "date") {
      foodPool = pool.filter(v => v.cat==="Dinner" || (v.best||"").includes("Date Night"));
    } else if (who === "group") {
      foodPool = pool.filter(v => v.cat==="Dinner" || v.cat==="Sports Bars");
    } else {
      foodPool = pool.filter(v => v.cat==="Dinner");
    }
  } else {
    foodPool = pool.filter(v => v.cat==="Dinner" && (v.hours||"").includes("2am"));
    if (!foodPool.length) foodPool = pool.filter(v => v.cat==="Dinner");
  }
  if (!foodPool.length) foodPool = pool.filter(v => ["Dinner","Lunch","Breakfast"].includes(v.cat));

  // STOP 2 — Drinks / experience
  let drinkPool;
  if (when === "morning") {
    drinkPool = pool.filter(v => v.cat==="Happy Hour" || v.cat==="Rooftops" || (v.cats||[]).includes("Happy Hour"));
    if (!drinkPool.length) drinkPool = pool.filter(v => v.cat==="Cocktail Lounges");
  } else if (when === "afternoon") {
    drinkPool = pool.filter(v => v.cat==="Happy Hour" || v.cat==="Rooftops");
  } else {
    if (energy === "elevated") {
      drinkPool = pool.filter(v => v.cat==="Rooftops" || v.cat==="Cocktail Lounges" || (v.badges||[]).includes("hidden"));
    } else if (energy === "highenergy") {
      drinkPool = pool.filter(v => v.cat==="Nightlife" || v.cat==="Hidden Bars" || v.cat==="Cocktail Lounges");
    } else {
      drinkPool = who === "date"
        ? pool.filter(v => v.cat==="Cocktail Lounges" || (v.best||"").includes("Date Night"))
        : pool.filter(v => v.cat==="Cocktail Lounges" || v.cat==="Happy Hour");
    }
  }
  if (!drinkPool.length) drinkPool = pool.filter(v => v.cat==="Cocktail Lounges" || v.cat==="Hidden Bars");

  // STOP 3 — After / late
  let afterPool;
  if (when === "morning" || when === "afternoon") {
    afterPool = pool.filter(v => v.cat==="Cocktail Lounges" || v.cat==="Hidden Bars" || v.cat==="Rooftops");
  } else {
    afterPool = pool.filter(v =>
      (v.cat==="Nightlife" || v.cat==="Hidden Bars" || v.cat==="Cocktail Lounges") &&
      (v.hours||"").includes("2am")
    );
    if (!afterPool.length) afterPool = pool.filter(v => v.cat==="Nightlife" || v.cat==="Hidden Bars");
  }
  if (!afterPool.length) afterPool = pool.filter(v => v.cat==="Cocktail Lounges" || v.cat==="Nightlife");

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
  return (
    <button
      onClick={() => onOpen(String(v.id))}
      style={{
        display:"flex", alignItems:"flex-start", gap:14, padding:"14px 16px",
        background:"var(--c-card)", border:"1px solid var(--c-border)", borderRadius:10,
        cursor:"pointer", textAlign:"left", width:"100%", transition:"border-color 0.18s",
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
  const active = current === val;
  return (
    <button
      onClick={() => onSet(val)}
      style={{
        ...MONO, fontSize:"0.5rem", letterSpacing:"0.1em", textTransform:"uppercase",
        padding:"9px 16px", borderRadius:8, whiteSpace:"nowrap",
        border:"1px solid " + (active ? "var(--c-gold)" : "var(--c-border)"),
        background: active ? "rgba(201,168,76,0.1)" : "transparent",
        color: active ? "var(--c-gold)" : "var(--c-ash)",
        cursor:"pointer", transition:"all 0.18s",
      }}
    >
      {label}
    </button>
  );
}

function ForYouTab({ taste, onTasteChange, allVenues, onOpenVenue }) {
  const MAX = 3;
  const [suggestion, setSuggestion] = useState(null);

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
    setSuggestion(getSmartSuggestion(allVenues));
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
            background:"transparent", color:"var(--c-gold)", cursor:"pointer", transition:"all 0.18s",
          }}
        >
          {suggestion ? "Pick Again →" : "Choose for Me →"}
        </button>

        {suggestion && (
          <button
            onClick={() => onOpenVenue(String(suggestion.id))}
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
            const selected  = taste.includes(opt.id);
            const disabled  = !selected && taste.length >= MAX;
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
                  transition:"all 0.18s", opacity: disabled ? 0.38 : 1,
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
        <div style={{ textAlign:"center", padding:"36px 0", borderTop:"1px solid var(--c-borders)" }}>
          <p style={{ ...SERIF, fontSize:"1.2rem", fontWeight:400, color:"var(--c-white)", marginBottom:8 }}>
            Select your tastes above
          </p>
          <p style={{ fontSize:"0.83rem", color:"var(--c-smoke)", fontWeight:300 }}>
            Your personalised Detroit guide will appear here.
          </p>
        </div>
      ) : (
        <div style={{ borderTop:"1px solid var(--c-borders)", paddingTop:24 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
            <SectionLabel style={{ marginBottom:0 }}>Curated for You</SectionLabel>
            <span style={{ ...MONO, fontSize:"0.46rem", color:"var(--c-smoke)" }}>
              {forYouVenues.length} spot{forYouVenues.length !== 1 ? "s" : ""}
            </span>
          </div>
          {forYouVenues.length === 0 ? (
            <p style={{ fontSize:"0.83rem", color:"var(--c-smoke)", fontWeight:300 }}>No matches for your selections.</p>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {forYouVenues.map(v => <VenueRow key={v.id} v={v} onOpen={onOpenVenue} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BuildNightTab({ allVenues, onOpenVenue }) {
  const [when,      setWhen]      = useState(null);
  const [who,       setWho]       = useState(null);
  const [energy,    setEnergy]    = useState(null);
  const [result,    setResult]    = useState(null);
  const [generated, setGenerated] = useState(false);

  const ready = when && who && energy;

  function generate() {
    if (!ready) return;
    setResult(buildNight(when, who, energy, allVenues));
    setGenerated(true);
  }

  function reset() {
    setWhen(null); setWho(null); setEnergy(null);
    setResult(null); setGenerated(false);
  }

  const stopLabels = (when && STOP_LABELS[when]) || STOP_LABELS.evening;

  if (generated) {
    return (
      <div style={{ padding:"24px 22px 56px", maxWidth:640, margin:"0 auto" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
          <SectionLabel style={{ marginBottom:0 }}>Your Night</SectionLabel>
          <button
            onClick={reset}
            style={{ ...MONO, fontSize:"0.46rem", letterSpacing:"0.1em", textTransform:"uppercase", background:"transparent", border:"1px solid var(--c-border)", color:"var(--c-smoke)", padding:"7px 14px", borderRadius:6, cursor:"pointer" }}
          >
            Rebuild
          </button>
        </div>

        {!result || result.length === 0 ? (
          <div style={{ textAlign:"center", padding:"48px 0" }}>
            <p style={{ ...SERIF, fontSize:"1.2rem", color:"var(--c-white)", marginBottom:8 }}>No match found</p>
            <p style={{ fontSize:"0.83rem", color:"var(--c-smoke)", fontWeight:300 }}>Try different choices</p>
          </div>
        ) : result.map((v, i) => (
          <div key={v.id} style={{ display:"flex", gap:14 }}>
            <div style={{ flexShrink:0, display:"flex", flexDirection:"column", alignItems:"center", paddingTop:2 }}>
              <div style={{ width:26, height:26, borderRadius:"50%", border:"1px solid var(--c-gold)", display:"flex", alignItems:"center", justifyContent:"center", ...MONO, fontSize:"0.52rem", color:"var(--c-gold)", flexShrink:0 }}>
                {i + 1}
              </div>
              {i < result.length - 1 && (
                <div style={{ width:1, flex:1, background:"var(--c-border)", marginTop:6, marginBottom:6, minHeight:24 }} />
              )}
            </div>
            <div style={{ flex:1, background:"var(--c-card)", border:"1px solid var(--c-border)", borderRadius:10, padding:"14px 16px", marginBottom: i < result.length - 1 ? 14 : 0 }}>
              <p style={{ ...MONO, fontSize:"0.44rem", letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--c-goldD)", margin:"0 0 5px" }}>
                {stopLabels[i] || "Stop " + (i + 1)}
              </p>
              <div style={{ ...MONO, fontSize:"0.44rem", letterSpacing:"0.12em", textTransform:"uppercase", color:"var(--c-gold)", marginBottom:5 }}>
                {v.cat} · {v.hood}
              </div>
              <h3 style={{ ...SERIF, fontSize:"1.18rem", fontWeight:600, color:"var(--c-white)", lineHeight:1.2, margin:"0 0 6px" }}>
                {v.name}
              </h3>
              <p style={{ fontSize:"0.77rem", color:"var(--c-ash)", fontWeight:300, lineHeight:1.5, margin:"0 0 8px" }}>
                {v.desc.length > 95 ? v.desc.slice(0, 95) + "…" : v.desc}
              </p>
              {v.best && (
                <p style={{ ...MONO, fontSize:"0.44rem", letterSpacing:"0.07em", color:"var(--c-smoke)", margin:"0 0 10px" }}>
                  Best for: {v.best}
                </p>
              )}
              <div style={{ paddingTop:10, borderTop:"1px solid var(--c-borders)" }}>
                <button
                  onClick={() => onOpenVenue(String(v.id))}
                  style={{ ...MONO, fontSize:"0.5rem", letterSpacing:"0.12em", textTransform:"uppercase", background:"var(--c-gold)", color:"var(--c-black)", border:"none", borderRadius:6, padding:"8px 16px", cursor:"pointer", fontWeight:500 }}
                >
                  View Details →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ padding:"24px 22px 56px", maxWidth:520, margin:"0 auto" }}>
      <p style={{ ...SERIF, fontSize:"1.05rem", fontWeight:400, color:"var(--c-smoke)", fontStyle:"italic", marginBottom:28, lineHeight:1.65 }}>
        Answer three questions. We'll build your itinerary from Detroit's best spots.
      </p>
      <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
        <div>
          <p style={{ ...MONO, fontSize:"0.52rem", letterSpacing:"0.2em", textTransform:"uppercase", color:"var(--c-goldD)", margin:"0 0 10px" }}>When are you going out?</p>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <OptionBtn val="morning"   current={when} onSet={setWhen} label="Morning" />
            <OptionBtn val="afternoon" current={when} onSet={setWhen} label="Afternoon" />
            <OptionBtn val="evening"   current={when} onSet={setWhen} label="Evening" />
            <OptionBtn val="late"      current={when} onSet={setWhen} label="Late Night" />
          </div>
        </div>
        <div>
          <p style={{ ...MONO, fontSize:"0.52rem", letterSpacing:"0.2em", textTransform:"uppercase", color:"var(--c-goldD)", margin:"0 0 10px" }}>Who's coming?</p>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <OptionBtn val="solo"  current={who} onSet={setWho} label="Just Me" />
            <OptionBtn val="date"  current={who} onSet={setWho} label="2 of Us" />
            <OptionBtn val="group" current={who} onSet={setWho} label="Group" />
          </div>
        </div>
        <div>
          <p style={{ ...MONO, fontSize:"0.52rem", letterSpacing:"0.2em", textTransform:"uppercase", color:"var(--c-goldD)", margin:"0 0 10px" }}>What's the energy?</p>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <OptionBtn val="chill"      current={energy} onSet={setEnergy} label="Chill" />
            <OptionBtn val="elevated"   current={energy} onSet={setEnergy} label="Elevated" />
            <OptionBtn val="highenergy" current={energy} onSet={setEnergy} label="High Energy" />
          </div>
        </div>
      </div>
      <button
        onClick={generate}
        disabled={!ready}
        style={{
          marginTop:28, ...MONO, fontSize:"0.56rem", letterSpacing:"0.15em", textTransform:"uppercase",
          padding:"14px 32px", borderRadius:100, border:"none", width:"100%",
          background: ready ? "var(--c-gold)" : "var(--c-border)",
          color: ready ? "var(--c-black)" : "var(--c-smoke)",
          cursor: ready ? "pointer" : "default",
          transition:"all 0.2s", fontWeight:500,
        }}
      >
        Build My Night →
      </button>
    </div>
  );
}

function SavedSpotsTab({ savedVenues, savedEventItems, savedHotelItems, toggleFav, onUnsaveEvent, onUnsaveHotel, onOpenVenue }) {
  const allEmpty = savedVenues.length === 0 && savedEventItems.length === 0 && savedHotelItems.length === 0;
  const multiSec = (savedVenues.length > 0 ? 1 : 0) + (savedEventItems.length > 0 ? 1 : 0) + (savedHotelItems.length > 0 ? 1 : 0) > 1;

  function SecHdr({ children }) {
    return (
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18, marginTop:4 }}>
        <span style={{ ...MONO, fontSize:"0.5rem", letterSpacing:"0.2em", textTransform:"uppercase", color:"var(--c-goldD)" }}>{children}</span>
        <div style={{ flex:1, height:1, background:"rgba(201,168,76,0.18)" }} />
      </div>
    );
  }

  function MiniCard({ onClick, children }) {
    return (
      <div
        onClick={onClick}
        style={{ background:"var(--c-card)", borderRadius:10, border:"1px solid var(--c-border)", cursor:"pointer", overflow:"hidden" }}
      >
        {children}
      </div>
    );
  }

  return (
    <div style={{ padding:"24px 22px 56px", maxWidth:1200, margin:"0 auto" }}>
      {allEmpty ? (
        <div style={{ textAlign:"center", padding:"56px 20px" }}>
          <div style={{ fontSize:"1.6rem", color:"var(--c-goldD)", marginBottom:14 }}>◈</div>
          <p style={{ ...SERIF, fontSize:"1.4rem", fontWeight:400, color:"var(--c-white)", marginBottom:8 }}>Nothing saved yet</p>
          <p style={{ fontSize:"0.83rem", color:"var(--c-smoke)", fontWeight:300 }}>
            Browse spots and tap the heart to build your list.
          </p>
        </div>
      ) : (
        <>
          {savedVenues.length > 0 && (
            <div style={{ marginBottom: multiSec ? 36 : 0 }}>
              {multiSec && <SecHdr>Dining & Drinks</SecHdr>}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:12 }}>
                {savedVenues.map(v => {
                  const cta = getCTA(v);
                  return (
                    <MiniCard key={v.id} onClick={() => onOpenVenue(String(v.id))}>
                      <div style={{ padding:"14px 16px" }}>
                        <div style={{ ...MONO, fontSize:"0.46rem", letterSpacing:"0.14em", textTransform:"uppercase", color:"var(--c-gold)", marginBottom:5 }}>
                          {v.hood} · {v.cat}
                        </div>
                        <div style={{ ...SERIF, fontSize:"1.05rem", fontWeight:600, color:"var(--c-white)", lineHeight:1.2, marginBottom:5 }}>
                          {v.name}
                        </div>
                        <div style={{ fontSize:"0.76rem", color:"var(--c-smoke)", fontWeight:300, marginBottom:10 }}>
                          {v.desc.length > 60 ? v.desc.slice(0, 60) + "…" : v.desc}
                        </div>
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                          {cta ? (
                            <a href={cta.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ display:"inline-block", background:"var(--c-gold)", color:"var(--c-black)", ...MONO, fontSize:"0.5rem", letterSpacing:"0.12em", textTransform:"uppercase", padding:"7px 14px", borderRadius:5, fontWeight:500, textDecoration:"none" }}>
                              {cta.label}
                            </a>
                          ) : <span />}
                          <button onClick={e => { e.stopPropagation(); toggleFav(String(v.id)); }} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--c-gold)", fontSize:"1.2rem", padding:"6px 4px", lineHeight:1 }}>♥</button>
                        </div>
                      </div>
                    </MiniCard>
                  );
                })}
              </div>
            </div>
          )}

          {savedEventItems.length > 0 && (
            <div style={{ marginBottom: savedHotelItems.length > 0 ? 36 : 0 }}>
              <SecHdr>Events & Tickets</SecHdr>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:12 }}>
                {savedEventItems.map(item => {
                  const cta   = getTicketCTA(item);
                  const label = item.title || (item.team + " vs. " + item.opponent);
                  const badge = item.sport || item.category || "Event";
                  return (
                    <MiniCard key={item.id} onClick={() => {}}>
                      {item.image && <img src={item.image} alt="" loading="lazy" style={{ width:"100%", height:120, objectFit:"cover", display:"block" }} />}
                      <div style={{ padding:"13px 14px" }}>
                        <div style={{ ...MONO, fontSize:"0.46rem", letterSpacing:"0.14em", textTransform:"uppercase", color:"var(--c-gold)", marginBottom:5 }}>{badge}</div>
                        <div style={{ ...SERIF, fontSize:"1.05rem", fontWeight:600, color:"var(--c-white)", lineHeight:1.2, marginBottom:5 }}>{label}</div>
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

function PassportTab({ visited, allVenues, onOpenVenue, navTo }) {
  const visitedVenues = useMemo(
    () => allVenues.filter(v => visited.includes(String(v.id))),
    [visited, allVenues]
  );

  const badges = PASSPORT_BADGES.map(b => ({ ...b, earned: b.test(visitedVenues) }));
  const earnedCount   = badges.filter(b => b.earned).length;
  const milestone     = 20;
  const pct           = visitedVenues.length === 0 ? 0 : Math.min(100, Math.round((visitedVenues.length / milestone) * 100));
  const recentVisited = visitedVenues.slice(-5).reverse();

  // Track newly earned for animation
  const prevEarnedRef  = useRef(new Set());
  const earnedIds      = useMemo(() => new Set(badges.filter(b => b.earned).map(b => b.id)), [badges]);
  const newlyEarnedIds = useMemo(() => new Set([...earnedIds].filter(id => !prevEarnedRef.current.has(id))), [earnedIds]);
  useEffect(() => { prevEarnedRef.current = earnedIds; }, [earnedIds]);

  return (
    <div style={{ padding:"24px 22px 56px", maxWidth:1200, margin:"0 auto" }}>

      {/* Header card */}
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

      {/* Passport stamps */}
      <div style={{ marginBottom:32 }}>
        <SectionLabel>Passport Stamps</SectionLabel>
        <div style={{ display:"flex", flexWrap:"wrap", gap:16, justifyContent:"flex-start" }}>
          {badges.map((b, i) => {
            const rot    = STAMP_ROTATIONS[i % STAMP_ROTATIONS.length];
            const isNew  = newlyEarnedIds.has(b.id);
            return (
              <div
                key={b.id}
                className={isNew ? "stamp-press" : undefined}
                style={{
                  "--stamp-rot": rot + "deg",
                  flexBasis:"calc(50% - 8px)",
                  maxWidth:200,
                  aspectRatio:"1",
                  borderRadius:"50%",
                  border:"2px solid " + (b.earned ? "rgba(201,168,76,0.55)" : "rgba(150,140,130,0.2)"),
                  boxShadow: b.earned
                    ? "0 0 0 5px rgba(201,168,76,0.07), inset 0 0 0 4px rgba(201,168,76,0.07)"
                    : "none",
                  background: b.earned ? "rgba(201,168,76,0.06)" : "var(--c-card)",
                  opacity: b.earned ? 1 : 0.38,
                  transform:"rotate(" + rot + "deg)",
                  display:"flex",
                  flexDirection:"column",
                  alignItems:"center",
                  justifyContent:"center",
                  padding:16,
                  textAlign:"center",
                  position:"relative",
                  overflow:"hidden",
                  transition:"opacity 0.35s, border-color 0.35s",
                }}
              >
                {b.earned && (
                  <span style={{
                    position:"absolute", top:"50%", left:"50%",
                    transform:"translate(-50%,-50%) rotate(-22deg)",
                    ...MONO, fontSize:"0.38rem", letterSpacing:"0.28em",
                    color:"rgba(201,168,76,0.18)", textTransform:"uppercase",
                    whiteSpace:"nowrap", pointerEvents:"none", zIndex:1,
                  }}>
                    STAMPED
                  </span>
                )}
                <div style={{ position:"relative", zIndex:2 }}>
                  <div style={{
                    width:28, height:28, borderRadius:"50%",
                    border:"1.5px solid " + (b.earned ? "rgba(201,168,76,0.5)" : "rgba(150,140,130,0.25)"),
                    display:"flex", alignItems:"center", justifyContent:"center",
                    margin:"0 auto 8px", color: b.earned ? "var(--c-gold)" : "var(--c-smoke)",
                    fontSize:"0.65rem",
                  }}>
                    {b.earned ? "◈" : "○"}
                  </div>
                  <div style={{ ...SERIF, fontSize:"0.94rem", fontWeight:600, color: b.earned ? "var(--c-white)" : "var(--c-ash)", lineHeight:1.2, marginBottom: b.earned ? 0 : 6 }}>
                    {b.label}
                  </div>
                  {!b.earned && (
                    <div style={{ ...MONO, fontSize:"0.43rem", letterSpacing:"0.06em", color:"var(--c-smoke)", lineHeight:1.45, marginTop:4 }}>
                      {b.hint}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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
