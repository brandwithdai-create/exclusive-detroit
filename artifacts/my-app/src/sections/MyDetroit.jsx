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
  { id:"gem",      label:"Hidden Gem Hunter",     hint:"Visit any venue marked Hidden Gem",          test: vis => vis.some(v=>(v.badges||[]).includes("hidden")) },
  { id:"cocktail", label:"Cocktail Connoisseur",  hint:"Visit 3 cocktail lounges or hidden bars",    test: vis => vis.filter(v=>v.cat==="Cocktail Lounges"||v.cat==="Hidden Bars").length>=3 },
  { id:"owl",      label:"Night Owl",             hint:"Visit 2 venues open past 2am",               test: vis => vis.filter(v=>(v.hours||"").includes("2am")).length>=2 },
  { id:"hood",     label:"Neighborhood Explorer", hint:"Visit venues in 3 different neighborhoods",  test: vis => new Set(vis.map(v=>v.hood)).size>=3 },
  { id:"reg",      label:"The Regular",           hint:"Visit any 5 venues",                         test: vis => vis.length>=5 },
  { id:"native",   label:"Detroit Native",        hint:"Visit any 10 venues",                        test: vis => vis.length>=10 },
  { id:"roof",     label:"Rooftop Society",       hint:"Visit any rooftop venue",                    test: vis => vis.some(v=>v.cat==="Rooftops") },
  { id:"bird",     label:"Early Bird",            hint:"Visit a breakfast or brunch spot",           test: vis => vis.some(v=>v.cat==="Breakfast"||v.cat==="Coffee Shops & Bakeries") },
];

// Real passport stamp definitions — each badge gets a unique shape, status line, and serial
const STAMP_DEFS = {
  gem:      { shape:"oval",   rot:-5,  status:"HIDDEN ENTRY",  sub:"UNDERGROUND · DETROIT",     serial:"DET-HID-001" },
  cocktail: { shape:"rect",   rot: 3,  status:"VERIFIED",      sub:"CRAFT COCKTAIL · 2025",     serial:"DET-CKT-002" },
  owl:      { shape:"circle", rot:-2,  status:"ADMITTED",      sub:"AFTER DARK · MICHIGAN",     serial:"DET-OWL-003" },
  hood:     { shape:"wide",   rot: 4,  status:"ENTRY",         sub:"NEIGHBORHOODS · 2025",      serial:"DET-NBR-004" },
  reg:      { shape:"square", rot:-3,  status:"REGULAR",       sub:"5 VISITS · MICHIGAN",       serial:"DET-REG-005" },
  native:   { shape:"banner", rot: 2,  status:"INSIDER",       sub:"DETROIT NATIVE · 2025",     serial:"DET-NAT-006" },
  roof:     { shape:"arch",   rot:-4,  status:"ELEVATED",      sub:"SKYLINE · DETROIT",         serial:"DET-TOP-007" },
  bird:     { shape:"oval",   rot: 5,  status:"EARLY ENTRY",   sub:"MORNING · MICHIGAN",        serial:"DET-BRD-008" },
};

// ── Tag helpers ────────────────────────────────────────────────────────────────
function tags(v) { return v.tags || []; }
function hasTag(v, t) { return tags(v).includes(t); }

// Strict eligibility — never fall back to wrong category
const isMorning   = v => v.cat === "Breakfast" || v.cat === "Coffee Shops & Bakeries" || hasTag(v,"morning") || hasTag(v,"brunch");
const isLunch     = v => v.cat === "Lunch"     || (v.cats||[]).includes("Lunch")     || hasTag(v,"lunch");
const isDinner    = v => v.cat === "Dinner"    || hasTag(v,"dinner");
const isHH        = v => v.cat === "Happy Hour" || (v.cats||[]).includes("Happy Hour") || hasTag(v,"happyHour");
const isDrinks    = v => v.cat === "Cocktail Lounges" || v.cat === "Hidden Bars" || v.cat === "Rooftops" || hasTag(v,"drinks");
const isNightlife = v => v.cat === "Nightlife" || hasTag(v,"highEnergy");
const isLateNight = v => (v.hours||"").includes("2am") || hasTag(v,"lateNight");

function buildNight(when, who, energy, pool) {
  const used = new Set();

  function pick(candidates) {
    const avail = candidates.filter(v => !used.has(String(v.id)));
    if (!avail.length) return null;
    const idx = Math.floor(Math.random() * Math.min(avail.length, 6));
    used.add(String(avail[idx].id));
    return avail[idx];
  }

  let s1 = null, s2 = null, s3 = null;

  // ── MORNING ────────────────────────────────────────────────────────────────
  if (when === "morning") {
    const foodPool = pool.filter(isMorning);
    s1 = pick(foodPool);
    s2 = pick(foodPool); // second stop from same category (different venue)
    s3 = pick(pool.filter(v => v.cat === "Outdoor Activities" || v.cat === "Rooftops"));
  }

  // ── AFTERNOON ──────────────────────────────────────────────────────────────
  else if (when === "afternoon") {
    const lunchPool = pool.filter(isLunch);
    const hhPool    = pool.filter(isHH);
    const roofPool  = pool.filter(v => v.cat === "Rooftops");
    s1 = pick(lunchPool);
    s2 = pick(hhPool.length ? hhPool : roofPool);
    s3 = pick(pool.filter(isDrinks));
  }

  // ── LATE NIGHT ─────────────────────────────────────────────────────────────
  else if (when === "late") {
    const latePool = pool.filter(isLateNight);
    if (!latePool.length) return [];
    s1 = pick(latePool.filter(isDinner));
    s2 = pick(latePool.filter(isDrinks));
    s3 = pick(latePool.filter(v => isNightlife(v) || isDrinks(v)));
  }

  // ── EVENING ────────────────────────────────────────────────────────────────
  else {
    if (energy === "calm") {
      // Quiet, intimate: elevated dinner → calm hidden bar → calm lounge
      const dinnerPool = pool.filter(v => isDinner(v) && (hasTag(v,"elevated") || (v.best||"").includes("Date Night")));
      const drinkPool  = pool.filter(v => isDrinks(v) && (hasTag(v,"calm") || hasTag(v,"elevated")));
      s1 = pick(dinnerPool);
      s2 = pick(drinkPool);
      s3 = pick(drinkPool);
    }
    else if (energy === "chill") {
      // Casual: dinner → neighborhood bar/HH → easy nightlife
      const dinnerPool = pool.filter(v => isDinner(v) && !hasTag(v,"elevated"));
      const chillDrink = pool.filter(v => isDrinks(v) && hasTag(v,"chill"));
      const casualDrink = pool.filter(v => isDrinks(v) && !hasTag(v,"elevated"));
      s1 = pick(dinnerPool.length ? dinnerPool : pool.filter(isDinner));
      s2 = pick(chillDrink.length ? chillDrink : casualDrink);
      s3 = pick(pool.filter(v => isDrinks(v) || isHH(v)));
    }
    else if (energy === "elevated") {
      // Luxury: elevated dinner first, polished lounge, refined after
      const isDN = who === "date";
      const dinnerPool = isDN
        ? pool.filter(v => isDinner(v) && hasTag(v,"elevated") && hasTag(v,"dateNight"))
        : pool.filter(v => isDinner(v) && hasTag(v,"elevated"));
      const drinkPool  = isDN
        ? pool.filter(v => isDrinks(v) && hasTag(v,"elevated") && hasTag(v,"dateNight"))
        : pool.filter(v => isDrinks(v) && hasTag(v,"elevated"));
      const afterPool  = pool.filter(v => isDrinks(v) && hasTag(v,"elevated"));
      if (!dinnerPool.length && !drinkPool.length) return [];
      s1 = pick(dinnerPool);
      s2 = pick(drinkPool);
      s3 = pick(afterPool);
    }
    else {
      // High Energy: dinner → nightlife → late nightlife
      const dinnerPool  = pool.filter(isDinner);
      const partyPool   = pool.filter(v => isNightlife(v) || hasTag(v,"highEnergy"));
      const lateParty   = pool.filter(v => (isNightlife(v) || hasTag(v,"highEnergy")) && isLateNight(v));
      s1 = pick(dinnerPool);
      s2 = pick(partyPool.length ? partyPool : pool.filter(isDrinks));
      s3 = pick(lateParty.length ? lateParty : pool.filter(v => isDrinks(v) || isNightlife(v)));
    }
  }

  return [s1, s2, s3].filter(Boolean);
}

const STOP_LABELS = {
  morning:   ["Breakfast Stop",  "Second Stop",   "Third Stop"],
  afternoon: ["Lunch Stop",      "Happy Hour",    "Cocktails"],
  evening:   ["Dinner",          "Cocktails",     "After Hours"],
  late:      ["Late Eats",       "Nightcap",      "After Hours"],
};

// ── Shared UI components ───────────────────────────────────────────────────────

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
        transition:"border-color 0.18s, transform 0.08s",
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
        cursor:"pointer", transition:"all 0.12s",
        transform: pressed ? "scale(0.93)" : "scale(1)",
      }}
    >
      {label}
    </button>
  );
}

// ── Full-screen stamp overlay ─────────────────────────────────────────────────

function StampOverlay({ badge, onDone }) {
  const def  = STAMP_DEFS[badge.id] || {};
  const rot  = def.rot || 0;

  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:9990,
      display:"flex", alignItems:"center", justifyContent:"center",
      pointerEvents:"none",
      background:"rgba(10,8,6,0.5)",
    }}>
      <div
        className="stamp-overlay-press"
        style={{
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
          textAlign:"center", padding:"32px 40px",
          border:"2.5px solid rgba(201,168,76,0.8)",
          boxShadow:"0 0 0 6px rgba(201,168,76,0.08), 0 0 0 8px rgba(201,168,76,0.04), inset 0 0 0 6px rgba(201,168,76,0.07)",
          background:"radial-gradient(ellipse at 45% 40%, rgba(201,168,76,0.18) 0%, rgba(14,11,8,0.97) 70%)",
          borderRadius: def.shape === "circle" ? "50%" : def.shape === "oval" ? "50% / 45%" : 8,
          transform:`rotate(${rot}deg)`,
          minWidth:220, minHeight:170,
        }}
      >
        <div style={{ ...MONO, fontSize:"0.36rem", letterSpacing:"0.32em", color:"rgba(201,168,76,0.75)", textTransform:"uppercase", marginBottom:6 }}>
          {def.status || "STAMP EARNED"}
        </div>
        <div style={{ ...MONO, fontSize:"0.52rem", letterSpacing:"0.26em", color:"rgba(201,168,76,0.9)", fontWeight:600, marginBottom:10 }}>
          DETROIT
        </div>
        <div style={{ ...SERIF, fontSize:"1.45rem", fontWeight:600, color:"rgba(255,255,255,0.95)", lineHeight:1.2, marginBottom:10 }}>
          {badge.label}
        </div>
        <div style={{ ...MONO, fontSize:"0.34rem", letterSpacing:"0.18em", color:"rgba(201,168,76,0.55)", textTransform:"uppercase" }}>
          {def.sub || "2025 · MICHIGAN"}
        </div>
        <div style={{ ...MONO, fontSize:"0.3rem", letterSpacing:"0.1em", color:"rgba(201,168,76,0.3)", marginTop:6 }}>
          {def.serial || "DET-000"}
        </div>
      </div>
    </div>
  );
}

// ── For You tab ───────────────────────────────────────────────────────────────

function ForYouTab({ taste, onTasteChange, allVenues, onOpenVenue }) {
  const MAX = 3;

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

  return (
    <div style={{ padding:"24px 22px 56px", maxWidth:1200, margin:"0 auto" }}>

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
          <p style={{ ...SERIF, fontSize:"1rem", color:"var(--c-smoke)", fontStyle:"italic" }}>
            No matches found for that combination.
          </p>
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

// ── Build Night tab ───────────────────────────────────────────────────────────

function BuildNightTab({ allVenues, onOpenVenue }) {
  const [when,     setWhen]     = useState("evening");
  const [who,      setWho]      = useState("solo");
  const [energy,   setEnergy]   = useState("elevated");
  const [night,    setNight]    = useState(null);
  const [building, setBuilding] = useState(false);
  const [btnPress, setBtnPress] = useState(false);

  function handleBuild() {
    if (building) return;
    setBtnPress(true);
    setTimeout(() => setBtnPress(false), 100);
    setBuilding(true);
    setNight(null);
    setTimeout(() => {
      setNight(buildNight(when, who, energy, allVenues));
      setBuilding(false);
    }, 680);
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
              { val:"morning",   label:"Morning"   },
              { val:"afternoon", label:"Afternoon" },
              { val:"evening",   label:"Evening"   },
              { val:"late",      label:"Late Night"},
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
              { val:"group", label:"Group"   },
            ].map(o => <OptionBtn key={o.val} val={o.val} current={who} onSet={setWho} label={o.label} />)}
          </div>
        </div>

        {/* Energy */}
        <div style={{ marginBottom:22 }}>
          <p style={{ ...MONO, fontSize:"0.46rem", letterSpacing:"0.16em", textTransform:"uppercase", color:"var(--c-smoke)", margin:"0 0 10px" }}>Energy</p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:8 }}>
            {[
              { val:"calm",       label:"Calm"        },
              { val:"chill",      label:"Chill"       },
              { val:"elevated",   label:"Elevated"    },
              { val:"highenergy", label:"High Energy" },
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
            transition:"all 0.12s",
            transform: btnPress ? "scale(0.93)" : "scale(1)",
          }}
        >
          {building ? "Building…" : night !== null ? "Rebuild →" : "Build My Night →"}
        </button>
      </div>

      {building && (
        <div className="curating-pulse" style={{ padding:"18px 20px", background:"var(--c-card)", border:"1px solid var(--c-border)", borderRadius:12 }}>
          <div style={{ ...MONO, fontSize:"0.48rem", letterSpacing:"0.18em", textTransform:"uppercase", color:"var(--c-goldD)" }}>
            Building your night…
          </div>
        </div>
      )}

      {!building && night !== null && night.length === 0 && (
        <div style={{ textAlign:"center", padding:"32px 0" }}>
          <p style={{ ...SERIF, fontSize:"1.05rem", fontWeight:400, color:"var(--c-smoke)", fontStyle:"italic", lineHeight:1.7, marginBottom:6 }}>
            Not enough matches for that combination.
          </p>
          <p style={{ ...MONO, fontSize:"0.46rem", letterSpacing:"0.08em", color:"var(--c-smoke)" }}>
            Try a different time of day or energy level.
          </p>
        </div>
      )}

      {!building && night && night.length > 0 && (
        <div className="fade-slide-up">
          <SectionLabel>Your Night</SectionLabel>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
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
    </div>
  );
}

// ── Saved Spots tab ───────────────────────────────────────────────────────────

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
        transition:"transform 0.08s, border-color 0.18s",
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

// ── Passport stamp ─────────────────────────────────────────────────────────────

function getShapeStyle(shape) {
  switch (shape) {
    case "oval":   return { borderRadius:"50%", width:116, height:128, padding:"12px 10px" };
    case "rect":   return { borderRadius:7,     width:150, height:86,  padding:"10px 14px" };
    case "circle": return { borderRadius:"50%", width:112, height:112, padding:"12px" };
    case "wide":   return { borderRadius:5,     width:158, height:70,  padding:"8px 14px" };
    case "square": return { borderRadius:5,     width:108, height:108, padding:"12px 10px" };
    case "banner": return { borderRadius:3,     width:162, height:60,  padding:"8px 14px" };
    case "arch":   return { borderRadius:"54% 54% 34% 34% / 64% 64% 36% 36%", width:112, height:124, padding:"12px 10px" };
    default:       return { borderRadius:6,     width:140, height:80,  padding:"10px 12px" };
  }
}

function PassportStamp({ badge, earned, isNew, overlayActive }) {
  const def  = STAMP_DEFS[badge.id] || {};
  const sh   = getShapeStyle(def.shape || "rect");

  const goldInk  = earned ? "rgba(201,168,76,0.8)"  : "rgba(120,110,90,0.2)";
  const goldFade = earned ? "rgba(201,168,76,0.45)" : "rgba(120,110,90,0.1)";
  const goldDeep = earned ? "rgba(201,168,76,0.25)" : "rgba(120,110,90,0.06)";

  return (
    <div
      className={isNew && !overlayActive ? "stamp-press" : undefined}
      style={{
        ...sh,
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        textAlign:"center", position:"relative", overflow:"hidden",
        flexShrink: 0,
        // Ink stamp border — outer ring + inset ring
        border: `1.5px solid ${goldInk}`,
        boxShadow: earned
          ? `0 0 0 3px ${goldDeep}, inset 0 0 0 4px ${goldDeep}, 1px 2px 3px rgba(0,0,0,0.25)`
          : `inset 0 0 0 3px ${goldDeep}`,
        // Radial ink-bleed gradient
        background: earned
          ? `radial-gradient(ellipse at 48% 42%, rgba(201,168,76,0.16) 0%, rgba(201,168,76,0.06) 50%, transparent 80%)`
          : "rgba(22,18,14,0.55)",
        opacity: earned ? 1 : 0.28,
        transform: `rotate(${def.rot || 0}deg)`,
        transition: "opacity 0.5s, border-color 0.5s",
        boxSizing: "border-box",
      }}
    >
      {/* Diagonal watermark on earned stamps */}
      {earned && (
        <span style={{
          position:"absolute", top:"50%", left:"50%",
          transform:"translate(-50%,-50%) rotate(-18deg)",
          ...MONO, fontSize:"0.28rem", letterSpacing:"0.34em",
          color:"rgba(201,168,76,0.08)", textTransform:"uppercase",
          whiteSpace:"nowrap", pointerEvents:"none", zIndex:0, userSelect:"none",
        }}>
          STAMPED
        </span>
      )}

      <div style={{ position:"relative", zIndex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2, width:"100%" }}>
        {/* Status / entry type */}
        <div style={{ ...MONO, fontSize:"0.31rem", letterSpacing:"0.3em", color: goldInk, textTransform:"uppercase", lineHeight:1 }}>
          {earned ? (def.status || "ADMITTED") : "LOCKED"}
        </div>
        {/* DETROIT */}
        <div style={{ ...MONO, fontSize:"0.45rem", letterSpacing:"0.24em", color: goldFade, fontWeight:600, lineHeight:1 }}>
          DETROIT
        </div>
        {/* Badge label */}
        <div style={{ ...SERIF, fontSize:"0.9rem", fontWeight:600, color: earned ? "rgba(255,255,255,0.92)" : "rgba(160,150,130,0.5)", lineHeight:1.2, marginTop:2, marginBottom:2, textAlign:"center" }}>
          {badge.label}
        </div>
        {/* Subtext / hint */}
        {earned ? (
          <div style={{ ...MONO, fontSize:"0.3rem", letterSpacing:"0.14em", color: goldDeep, textTransform:"uppercase", lineHeight:1 }}>
            {def.sub || "2025 · MICHIGAN"}
          </div>
        ) : (
          <div style={{ ...MONO, fontSize:"0.36rem", letterSpacing:"0.03em", color:"rgba(130,120,100,0.55)", lineHeight:1.35, textAlign:"center", maxWidth:86 }}>
            {badge.hint}
          </div>
        )}
        {/* Serial number */}
        {earned && (
          <div style={{ ...MONO, fontSize:"0.28rem", letterSpacing:"0.1em", color: goldDeep, marginTop:2 }}>
            {def.serial}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Passport tab ──────────────────────────────────────────────────────────────

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

  // Track newly earned for stamp overlay
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
      <div style={{ background:"var(--c-card)", border:"1px solid var(--c-border)", borderRadius:14, padding:"22px 22px 18px", marginBottom:24 }}>
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

      {/* Passport page — stamps as real ink marks */}
      <div style={{ marginBottom:28 }}>
        <SectionLabel>Passport Stamps</SectionLabel>

        {/* Passport page container */}
        <div style={{
          background:"linear-gradient(148deg, rgba(38,31,22,0.9) 0%, rgba(26,21,14,0.96) 100%)",
          border:"1px solid rgba(201,168,76,0.1)",
          borderRadius:12,
          padding:"28px 20px 32px",
          position:"relative",
          overflow:"hidden",
        }}>
          {/* Subtle page lines */}
          <div style={{
            position:"absolute", inset:0, pointerEvents:"none",
            backgroundImage:"repeating-linear-gradient(0deg, transparent 0px, transparent 30px, rgba(201,168,76,0.028) 30px, rgba(201,168,76,0.028) 31px)",
          }} />
          {/* Page header text */}
          <div style={{ position:"relative", zIndex:1, textAlign:"center", marginBottom:24, paddingBottom:16, borderBottom:"1px solid rgba(201,168,76,0.08)" }}>
            <div style={{ ...MONO, fontSize:"0.33rem", letterSpacing:"0.32em", color:"rgba(201,168,76,0.38)", textTransform:"uppercase" }}>
              EXCLUSIVE DETROIT
            </div>
            <div style={{ ...SERIF, fontSize:"1rem", color:"rgba(201,168,76,0.55)", fontWeight:400, margin:"4px 0 2px" }}>
              Insider Passport
            </div>
            <div style={{ ...MONO, fontSize:"0.3rem", letterSpacing:"0.12em", color:"rgba(201,168,76,0.22)", textTransform:"uppercase" }}>
              MICHIGAN, UNITED STATES · ISSUED 2025
            </div>
          </div>

          {/* Stamp grid — 2 columns, stamps scattered with rotation */}
          <div style={{ position:"relative", zIndex:1, display:"flex", flexWrap:"wrap", gap:"20px 14px", justifyContent:"center", alignItems:"flex-start" }}>
            {badges.map(b => (
              <PassportStamp
                key={b.id}
                badge={b}
                earned={b.earned}
                isNew={newlyEarnedIds.has(b.id)}
                overlayActive={!!overlayBadge}
              />
            ))}
          </div>

          {earnedCount === 0 && (
            <p style={{ ...MONO, fontSize:"0.43rem", letterSpacing:"0.08em", color:"rgba(201,168,76,0.3)", textAlign:"center", marginTop:20, marginBottom:0 }}>
              Earn stamps by visiting venues and marking them as visited
            </p>
          )}
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

// ── Root component ─────────────────────────────────────────────────────────────

const TABS = [
  { id:"foryou",   label:"For You"  },
  { id:"tonight",  label:"Tonight"  },
  { id:"saved",    label:"Saved"    },
  { id:"passport", label:"Passport" },
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
