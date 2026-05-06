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
  { id:"gem",      label:"Hidden Gem Hunter",     hint:"Visit any venue marked Hidden Gem",         test: vis => vis.some(v=>(v.badges||[]).includes("hidden")) },
  { id:"cocktail", label:"Cocktail Connoisseur",  hint:"Visit 3 cocktail lounges or hidden bars",   test: vis => vis.filter(v=>v.cat==="Cocktail Lounges"||v.cat==="Hidden Bars").length>=3 },
  { id:"owl",      label:"Night Owl",             hint:"Visit 2 venues open past 2am",              test: vis => vis.filter(v=>(v.hours||"").includes("2am")).length>=2 },
  { id:"hood",     label:"Neighborhood Explorer", hint:"Visit venues in 3 different neighborhoods", test: vis => new Set(vis.map(v=>v.hood)).size>=3 },
  { id:"reg",      label:"The Regular",           hint:"Visit any 5 venues",                        test: vis => vis.length>=5 },
  { id:"native",   label:"Detroit Native",        hint:"Visit any 10 venues",                       test: vis => vis.length>=10 },
  { id:"roof",     label:"Rooftop Society",       hint:"Visit any rooftop venue",                   test: vis => vis.some(v=>v.cat==="Rooftops") },
  { id:"bird",     label:"Early Bird",            hint:"Visit a breakfast or brunch spot",          test: vis => vis.some(v=>v.cat==="Breakfast"||v.cat==="Coffee Shops & Bakeries") },
];

// Real passport stamp definitions — each badge gets a unique ink color and layout
const STAMP_DEFS = {
  gem:      { ink:"#8B3030", rgb:"139,48,48",   shape:"rect",   rot:-5, status:"HIDDEN ENTRY",            name:"HIDDEN GEM HUNTER",    sub:"UNDERGROUND · DETROIT", side:"ENTERED",  serial:"DET-0425-001", deco:"◆" },
  cocktail: { ink:"#2D6040", rgb:"45,96,64",    shape:"penta",  rot: 3, status:"VERIFIED",                name:"COCKTAIL CONNOISSEUR", sub:"CRAFT · 2025",          side:null,       serial:"DET-0425-003", deco:"◇" },
  owl:      { ink:"#1E2F5C", rgb:"30,47,92",    shape:"rect",   rot:-2, status:"DETROIT NIGHT OWL",       name:"LATE NIGHTS · GOOD LIGHTS", sub:"AFTER DARK",      side:"VISITED",  serial:"DET-0425-004", deco:"✦" },
  hood:     { ink:"#2B4F8A", rgb:"43,79,138",   shape:"circle", rot: 4, status:"DETROIT, MI",             name:"NEIGHBORHOOD EXPLORER", sub:"EXPLORE",            side:null,       serial:"DET-0425-002", deco:"— — —" },
  reg:      { ink:"#7B2D2D", rgb:"123,45,45",   shape:"oval",   rot:-3, status:"★",                       name:"THE REGULAR",          sub:"5+ VISITS",             side:null,       serial:"DET-0425-005", deco:"★" },
  native:   { ink:"#1A2D4A", rgb:"26,45,74",    shape:"rect",   rot: 2, status:"DETROIT",                 name:"NATIVE",               sub:"LOCAL STATUS",          side:"APPROVED", serial:"DET-0425-006", deco:"◈" },
  roof:     { ink:"#2A5080", rgb:"42,80,128",   shape:"rect",   rot:-4, status:"DETROIT",                 name:"ROOFTOP SOCIETY",      sub:"SKYLINE CHASER · ELEVATED", side:"ELEVATED", serial:"DET-0425-007", deco:"△△△" },
  bird:     { ink:"#7B4020", rgb:"123,64,32",   shape:"oval",   rot: 5, status:"DETROIT ★",               name:"EARLY BIRD",           sub:"MORNING RITUALS",       side:null,       serial:"DET-0425-008", deco:"◉" },
};

// ── Tag helpers ────────────────────────────────────────────────────────────────
function hasTag(v, t) { return (v.tags||[]).includes(t); }

const isMorning   = v => v.cat==="Breakfast" || v.cat==="Coffee Shops & Bakeries" || hasTag(v,"morning") || hasTag(v,"brunch");
const isLunch     = v => v.cat==="Lunch"     || (v.cats||[]).includes("Lunch")      || hasTag(v,"lunch");
const isDinner    = v => v.cat==="Dinner"    || hasTag(v,"dinner");
const isHH        = v => v.cat==="Happy Hour"|| (v.cats||[]).includes("Happy Hour") || hasTag(v,"happyHour");
const isDrinks    = v => v.cat==="Cocktail Lounges"||v.cat==="Hidden Bars"||v.cat==="Rooftops"||hasTag(v,"drinks");
const isNightlife = v => v.cat==="Nightlife" || hasTag(v,"highEnergy");
const isLateNight = v => (v.hours||"").includes("2am") || hasTag(v,"lateNight");

// ── Tonight quick-filter chips ─────────────────────────────────────────────────
const TONIGHT_CHIPS = [
  { id:"happyhour", label:"Happy Hour",   count: true, filter: isHH },
  { id:"latenight", label:"Late Night",   count: true, filter: isLateNight },
  { id:"datenight", label:"Date Night",   count: true, filter: v => (v.best||"").includes("Date Night")||hasTag(v,"dateNight") },
  { id:"elevated",  label:"Elevated",     count: true, filter: v => hasTag(v,"elevated") },
  { id:"chill",     label:"Chill",        count: true, filter: v => hasTag(v,"chill") },
  { id:"rooftop",   label:"Rooftop",      count: true, filter: v => v.cat==="Rooftops" },
  { id:"locals",    label:"Locals Only",  count: true, filter: v => (v.badges||[]).includes("locals") },
  { id:"hidden",    label:"Hidden Gems",  count: true, filter: v => (v.badges||[]).includes("hidden") },
];

function extractHHTime(v) {
  const m = (v.hours||"").match(/Happy Hour[:\s*]+([^|]+)/i);
  if (!m) return "";
  return m[1].trim().replace(/[Mm]on.*|[Tt]ue.*|[Ww]ed.*|[Tt]hu.*|[Ff]ri.*|[Ss]at.*|[Ss]un.*/,"").trim().replace(/\s+/g," ").trim();
}

// ── Build Night logic (strict) ─────────────────────────────────────────────────
const STOP_LABELS = {
  morning:   ["Breakfast Stop","Second Stop","Morning Activity"],
  afternoon: ["Lunch Stop","Happy Hour","Evening Cocktails"],
  evening:   ["Dinner","Cocktails","After Hours"],
  late:      ["Late Eats","Nightcap","After Hours"],
};

function buildNight(when, who, energy, pool) {
  const used = new Set();
  function pick(candidates) {
    const avail = candidates.filter(v => !used.has(String(v.id)));
    if (!avail.length) return null;
    const idx = Math.floor(Math.random() * Math.min(avail.length, 6));
    used.add(String(avail[idx].id));
    return avail[idx];
  }
  let s1=null, s2=null, s3=null;
  if (when==="morning") {
    const morning = pool.filter(isMorning);
    s1 = pick(morning); s2 = pick(morning);
    s3 = pick(pool.filter(v => v.cat==="Outdoor Activities"||v.cat==="Rooftops"));
  } else if (when==="afternoon") {
    s1 = pick(pool.filter(isLunch));
    s2 = pick(pool.filter(v => isHH(v)||v.cat==="Rooftops"));
    s3 = pick(pool.filter(isDrinks));
  } else if (when==="late") {
    const late = pool.filter(isLateNight);
    if (!late.length) return [];
    s1 = pick(late.filter(isDinner));
    s2 = pick(late.filter(isDrinks));
    s3 = pick(late.filter(v => isNightlife(v)||isDrinks(v)));
  } else {
    if (energy==="calm") {
      const din  = pool.filter(v => isDinner(v)&&(hasTag(v,"elevated")||(v.best||"").includes("Date Night")));
      const drk  = pool.filter(v => isDrinks(v)&&(hasTag(v,"calm")||hasTag(v,"elevated")));
      s1=pick(din); s2=pick(drk); s3=pick(drk);
    } else if (energy==="chill") {
      const din  = pool.filter(v => isDinner(v)&&!hasTag(v,"elevated"));
      const drk  = pool.filter(v => isDrinks(v)&&hasTag(v,"chill"));
      s1=pick(din.length?din:pool.filter(isDinner));
      s2=pick(drk.length?drk:pool.filter(v=>isDrinks(v)&&!hasTag(v,"elevated")));
      s3=pick(pool.filter(v=>isDrinks(v)||isHH(v)));
    } else if (energy==="elevated") {
      const isDN = who==="date";
      const din  = isDN ? pool.filter(v=>isDinner(v)&&hasTag(v,"elevated")&&hasTag(v,"dateNight")) : pool.filter(v=>isDinner(v)&&hasTag(v,"elevated"));
      const drk  = isDN ? pool.filter(v=>isDrinks(v)&&hasTag(v,"elevated")&&hasTag(v,"dateNight")) : pool.filter(v=>isDrinks(v)&&hasTag(v,"elevated"));
      if (!din.length&&!drk.length) return [];
      s1=pick(din); s2=pick(drk); s3=pick(pool.filter(v=>isDrinks(v)&&hasTag(v,"elevated")));
    } else {
      const din  = pool.filter(isDinner);
      const party= pool.filter(v=>isNightlife(v)||hasTag(v,"highEnergy"));
      const late = pool.filter(v=>(isNightlife(v)||hasTag(v,"highEnergy"))&&isLateNight(v));
      s1=pick(din);
      s2=pick(party.length?party:pool.filter(isDrinks));
      s3=pick(late.length?late:pool.filter(v=>isDrinks(v)||isNightlife(v)));
    }
  }
  return [s1,s2,s3].filter(Boolean);
}

// ── Shared UI ─────────────────────────────────────────────────────────────────
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
    <button onClick={()=>onOpen(String(v.id))} onMouseDown={()=>setPressed(true)} onMouseUp={()=>setPressed(false)} onMouseLeave={()=>setPressed(false)} onTouchStart={()=>setPressed(true)} onTouchEnd={()=>setPressed(false)}
      style={{ display:"flex", alignItems:"flex-start", gap:14, padding:"14px 16px", background:"var(--c-card)", border:"1px solid var(--c-border)", borderRadius:10, cursor:"pointer", textAlign:"left", width:"100%", transform:pressed?"scale(0.975)":"scale(1)", transition:"transform 0.08s" }}
    >
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
          <span style={{ ...MONO, fontSize:"0.44rem", letterSpacing:"0.14em", textTransform:"uppercase", color:"var(--c-gold)" }}>{v.cat}</span>
          <span style={{ ...MONO, fontSize:"0.42rem", letterSpacing:"0.08em", textTransform:"uppercase", color:"var(--c-smoke)" }}>{v.hood}</span>
        </div>
        <div style={{ ...SERIF, fontSize:"1.08rem", fontWeight:600, color:"var(--c-white)", lineHeight:1.2, marginBottom:3 }}>{v.name}</div>
        <div style={{ fontSize:"0.76rem", color:"var(--c-ash)", fontWeight:300, lineHeight:1.5 }}>
          {v.desc.length>85 ? v.desc.slice(0,85)+"…" : v.desc}
        </div>
      </div>
      <span style={{ color:"var(--c-goldD)", fontSize:"0.85rem", flexShrink:0, marginTop:2 }}>→</span>
    </button>
  );
}

// ── Tonight tab ───────────────────────────────────────────────────────────────
const CAT_ACCENT = {
  "Cocktail Lounges":"#9B7D3A","Hidden Bars":"#8B3030","Dinner":"#3A6B4A",
  "Happy Hour":"#B87B20","Nightlife":"#3A3A8B","Rooftops":"#2A5580",
  "Breakfast":"#7B4520","Lunch":"#3A6B4A","Coffee Shops & Bakeries":"#7B4520",
  "Sports Bars":"#3A4A8B","Outdoor Activities":"#2A6B4A",
};

function TonightVenueCard({ v, chipId, onOpen }) {
  const [pressed, setPressed] = useState(false);
  const hhTime = chipId==="happyhour" ? extractHHTime(v) : "";
  const accent = CAT_ACCENT[v.cat] || "var(--c-goldD)";
  const tagLabel = chipId==="happyhour" && hhTime ? `HAPPY HOUR ${hhTime}` : v.cat.toUpperCase();

  return (
    <button onClick={()=>onOpen(String(v.id))} onMouseDown={()=>setPressed(true)} onMouseUp={()=>setPressed(false)} onMouseLeave={()=>setPressed(false)} onTouchStart={()=>setPressed(true)} onTouchEnd={()=>setPressed(false)}
      style={{ display:"flex", alignItems:"stretch", gap:0, background:"var(--c-card)", border:"1px solid var(--c-border)", borderRadius:10, cursor:"pointer", textAlign:"left", width:"100%", overflow:"hidden", transform:pressed?"scale(0.975)":"scale(1)", transition:"transform 0.08s" }}
    >
      <div style={{ width:4, flexShrink:0, background:accent }} />
      <div style={{ flex:1, padding:"14px 14px 14px 14px", minWidth:0 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
          <div>
            <div style={{ ...MONO, fontSize:"0.42rem", letterSpacing:"0.14em", textTransform:"uppercase", color:accent, marginBottom:2 }}>{tagLabel}</div>
            <div style={{ ...SERIF, fontSize:"1.05rem", fontWeight:600, color:"var(--c-white)", lineHeight:1.2 }}>{v.name}</div>
          </div>
          <div style={{ ...MONO, fontSize:"0.42rem", letterSpacing:"0.06em", textTransform:"uppercase", color:"var(--c-smoke)", flexShrink:0, marginLeft:10 }}>{v.hood}</div>
        </div>
        <div style={{ fontSize:"0.75rem", color:"var(--c-ash)", lineHeight:1.5 }}>
          {v.desc.length>90 ? v.desc.slice(0,90)+"…" : v.desc}
        </div>
      </div>
      <div style={{ display:"flex", alignItems:"center", paddingRight:14, color:"var(--c-goldD)", fontSize:"0.85rem" }}>→</div>
    </button>
  );
}

function OptionBtn({ val, current, onSet, label }) {
  const active  = current===val;
  const [pressed, setPressed] = useState(false);
  return (
    <button onClick={()=>onSet(val)} onMouseDown={()=>setPressed(true)} onMouseUp={()=>setPressed(false)} onMouseLeave={()=>setPressed(false)} onTouchStart={()=>setPressed(true)} onTouchEnd={()=>setPressed(false)}
      style={{ ...MONO, fontSize:"0.5rem", letterSpacing:"0.1em", textTransform:"uppercase", padding:"9px 16px", borderRadius:8, whiteSpace:"nowrap", border:"1px solid "+(active?"var(--c-gold)":"var(--c-border)"), background:active?"rgba(201,168,76,0.1)":"transparent", color:active?"var(--c-gold)":"var(--c-ash)", cursor:"pointer", transition:"all 0.12s", transform:pressed?"scale(0.93)":"scale(1)" }}
    >
      {label}
    </button>
  );
}

function TonightTab({ allVenues, onOpenVenue }) {
  const [chip,    setChip]    = useState("happyhour");
  const [showBuild, setShowBuild] = useState(false);
  const [when,    setWhen]    = useState("evening");
  const [who,     setWho]     = useState("solo");
  const [energy,  setEnergy]  = useState("elevated");
  const [night,   setNight]   = useState(null);
  const [building,setBuilding]= useState(false);
  const [btnPress,setBtnPress]= useState(false);

  const filtered = useMemo(() => {
    const def = TONIGHT_CHIPS.find(c=>c.id===chip);
    if (!def) return [];
    return allVenues.filter(def.filter).slice(0,18);
  }, [chip, allVenues]);

  function handleBuild() {
    if (building) return;
    setBtnPress(true); setTimeout(()=>setBtnPress(false),100);
    setBuilding(true); setNight(null);
    setTimeout(() => { setNight(buildNight(when,who,energy,allVenues)); setBuilding(false); }, 680);
  }

  const labels = STOP_LABELS[when]||STOP_LABELS.evening;
  const energyDesc = { calm:"Quiet & intimate — hidden bars, candlelit rooms", chill:"Casual & easy — neighborhood spots, no pressure", elevated:"Luxury & polished — dinner first, then a proper lounge", highenergy:"Full send — nightlife, late, busy spots" }[energy]||"";

  return (
    <div style={{ padding:"24px 22px 56px", maxWidth:1200, margin:"0 auto" }}>

      {/* Quick filter chips */}
      <div style={{ marginBottom:20 }}>
        <SectionLabel>Filter by Vibe</SectionLabel>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {TONIGHT_CHIPS.map(c => {
            const count = allVenues.filter(c.filter).length;
            const active = chip===c.id;
            return (
              <button key={c.id} onClick={()=>setChip(c.id)}
                style={{ ...MONO, fontSize:"0.5rem", letterSpacing:"0.1em", textTransform:"uppercase", padding:"8px 14px", borderRadius:100, border:"1px solid "+(active?"var(--c-gold)":"var(--c-border)"), background:active?"rgba(201,168,76,0.12)":"transparent", color:active?"var(--c-gold)":"var(--c-ash)", cursor:"pointer", transition:"all 0.12s", whiteSpace:"nowrap" }}
              >
                {c.label}
                {active && count>0 && <span style={{ marginLeft:5, opacity:0.65 }}>{count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Venue list */}
      {filtered.length>0 ? (
        <div className="fade-slide-up" style={{ marginBottom:28 }}>
          <div style={{ ...MONO, fontSize:"0.44rem", letterSpacing:"0.14em", textTransform:"uppercase", color:"var(--c-smoke)", marginBottom:14 }}>
            {TONIGHT_CHIPS.find(c=>c.id===chip)?.label} Spots &nbsp;·&nbsp; {filtered.length} venues
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {filtered.map(v => <TonightVenueCard key={v.id} v={v} chipId={chip} onOpen={onOpenVenue} />)}
          </div>
        </div>
      ) : (
        <div style={{ padding:"24px 0", textAlign:"center" }}>
          <p style={{ ...SERIF, fontSize:"1rem", color:"var(--c-smoke)", fontStyle:"italic" }}>No venues match this filter yet.</p>
        </div>
      )}

      {/* Build My Night divider */}
      <div style={{ borderTop:"1px solid var(--c-border)", paddingTop:20 }}>
        <button onClick={()=>setShowBuild(b=>!b)}
          style={{ ...MONO, fontSize:"0.52rem", letterSpacing:"0.14em", textTransform:"uppercase", color:"var(--c-gold)", border:"1px solid var(--c-goldD)", padding:"10px 20px", borderRadius:100, background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", gap:8, transition:"all 0.12s" }}
        >
          Build My Night {showBuild?"↑":"→"}
        </button>
      </div>

      {showBuild && (
        <div className="fade-slide-up" style={{ marginTop:18, background:"var(--c-card)", border:"1px solid var(--c-border)", borderRadius:14, padding:"22px 20px 20px" }}>
          <p style={{ ...MONO, fontSize:"0.5rem", letterSpacing:"0.18em", textTransform:"uppercase", color:"var(--c-goldD)", margin:"0 0 5px" }}>Build My Night</p>
          <p style={{ ...SERIF, fontSize:"1.05rem", fontWeight:400, color:"var(--c-white)", margin:"0 0 22px" }}>Tell us how you want to spend it.</p>

          <div style={{ marginBottom:16 }}>
            <p style={{ ...MONO, fontSize:"0.44rem", letterSpacing:"0.14em", textTransform:"uppercase", color:"var(--c-smoke)", margin:"0 0 8px" }}>When</p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {[["morning","Morning"],["afternoon","Afternoon"],["evening","Evening"],["late","Late Night"]].map(([v,l])=><OptionBtn key={v} val={v} current={when} onSet={setWhen} label={l}/>)}
            </div>
          </div>
          <div style={{ marginBottom:16 }}>
            <p style={{ ...MONO, fontSize:"0.44rem", letterSpacing:"0.14em", textTransform:"uppercase", color:"var(--c-smoke)", margin:"0 0 8px" }}>Who</p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {[["solo","Just Me"],["date","2 of Us"],["group","Group"]].map(([v,l])=><OptionBtn key={v} val={v} current={who} onSet={setWho} label={l}/>)}
            </div>
          </div>
          <div style={{ marginBottom:20 }}>
            <p style={{ ...MONO, fontSize:"0.44rem", letterSpacing:"0.14em", textTransform:"uppercase", color:"var(--c-smoke)", margin:"0 0 8px" }}>Energy</p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:6 }}>
              {[["calm","Calm"],["chill","Chill"],["elevated","Elevated"],["highenergy","High Energy"]].map(([v,l])=><OptionBtn key={v} val={v} current={energy} onSet={setEnergy} label={l}/>)}
            </div>
            {energyDesc && <p style={{ ...MONO, fontSize:"0.43rem", letterSpacing:"0.06em", color:"var(--c-smoke)", margin:"4px 0 0", lineHeight:1.5 }}>{energyDesc}</p>}
          </div>
          <button onClick={handleBuild}
            style={{ ...MONO, fontSize:"0.52rem", letterSpacing:"0.14em", textTransform:"uppercase", padding:"12px 24px", borderRadius:100, border:"1px solid var(--c-goldD)", background:building?"rgba(201,168,76,0.08)":"transparent", color:"var(--c-gold)", cursor:"pointer", transition:"all 0.12s", transform:btnPress?"scale(0.93)":"scale(1)" }}
          >
            {building?"Building…":night!==null?"Rebuild →":"Build My Night →"}
          </button>

          {building && (
            <div className="curating-pulse" style={{ marginTop:16, padding:"16px", background:"var(--c-deep)", borderRadius:10 }}>
              <span style={{ ...MONO, fontSize:"0.46rem", letterSpacing:"0.16em", textTransform:"uppercase", color:"var(--c-goldD)" }}>Building your night…</span>
            </div>
          )}

          {!building && night!==null && night.length===0 && (
            <div style={{ textAlign:"center", padding:"20px 0" }}>
              <p style={{ ...SERIF, fontSize:"1rem", color:"var(--c-smoke)", fontStyle:"italic" }}>Not enough matches — try a different time or vibe.</p>
            </div>
          )}

          {!building && night && night.length>0 && (
            <div className="fade-slide-up" style={{ marginTop:20 }}>
              <SectionLabel>Your Night</SectionLabel>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {night.map((v,i) => (
                  <div key={v.id}>
                    <p style={{ ...MONO, fontSize:"0.43rem", letterSpacing:"0.16em", textTransform:"uppercase", color:"var(--c-goldD)", margin:"0 0 6px" }}>{labels[i]||"Stop "+(i+1)}</p>
                    <VenueRow v={v} onOpen={onOpenVenue} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Saved tab ─────────────────────────────────────────────────────────────────
function MiniCard({ children, onClick }) {
  const [pressed, setPressed] = useState(false);
  return (
    <div onClick={onClick} onMouseDown={()=>setPressed(true)} onMouseUp={()=>setPressed(false)} onMouseLeave={()=>setPressed(false)} onTouchStart={()=>setPressed(true)} onTouchEnd={()=>setPressed(false)}
      style={{ background:"var(--c-card)", border:"1px solid var(--c-border)", borderRadius:10, overflow:"hidden", cursor:onClick?"pointer":"default", transition:"transform 0.08s", transform:pressed?"scale(0.975)":"scale(1)" }}
    >
      {children}
    </div>
  );
}

function SecHdr({ children }) {
  return <p style={{ ...MONO, fontSize:"0.52rem", letterSpacing:"0.18em", textTransform:"uppercase", color:"var(--c-goldD)", margin:"0 0 12px" }}>{children}</p>;
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
          {savedVenues.length>0 && (
            <div style={{ marginBottom:28 }}>
              <SecHdr>Saved Spots</SecHdr>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {savedVenues.map(v => (
                  <button key={v.id} onClick={()=>onOpenVenue(String(v.id))}
                    style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"13px 16px", background:"var(--c-card)", border:"1px solid var(--c-border)", borderRadius:8, cursor:"pointer", textAlign:"left", width:"100%", transition:"border-color 0.18s" }}
                  >
                    <div>
                      <div style={{ ...SERIF, fontSize:"1.02rem", fontWeight:600, color:"var(--c-white)", marginBottom:2 }}>{v.name}</div>
                      <div style={{ ...MONO, fontSize:"0.44rem", letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--c-smoke)" }}>{v.cat} · {v.hood}</div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <button onClick={e=>{e.stopPropagation();toggleFav&&toggleFav(String(v.id));}} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--c-gold)", fontSize:"1.2rem", padding:"6px 4px", lineHeight:1 }}>♥</button>
                      <span style={{ color:"var(--c-goldD)", fontSize:"0.85rem" }}>→</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {savedEventItems.length>0 && (
            <div style={{ marginBottom:28 }}>
              <SecHdr>Saved Events</SecHdr>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:12 }}>
                {savedEventItems.map(item => {
                  const badge = item.type==="game"?"Sports":item.type==="concert"?"Concerts":"Events";
                  const cta   = getTicketCTA(item);
                  return (
                    <MiniCard key={item.id} onClick={()=>{}}>
                      {item.image&&<img src={item.image} alt="" loading="lazy" style={{ width:"100%", height:120, objectFit:"cover", display:"block" }}/>}
                      <div style={{ padding:"13px 14px" }}>
                        <div style={{ ...MONO, fontSize:"0.46rem", letterSpacing:"0.14em", textTransform:"uppercase", color:"var(--c-gold)", marginBottom:5 }}>{badge}</div>
                        <div style={{ ...SERIF, fontSize:"1.05rem", fontWeight:600, color:"var(--c-white)", lineHeight:1.2, marginBottom:5 }}>{item.label}</div>
                        <div style={{ fontSize:"0.76rem", color:"var(--c-smoke)", fontWeight:300, marginBottom:10 }}>{item.venue}{item.date?" · "+fmtDate(item.date):""}</div>
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                          {cta?(<a href={cta.url} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{ display:"inline-block", background:"var(--c-gold)", color:"var(--c-black)", ...MONO, fontSize:"0.5rem", letterSpacing:"0.12em", textTransform:"uppercase", padding:"7px 14px", borderRadius:5, fontWeight:500, textDecoration:"none" }}>{cta.label}</a>):<span/>}
                          <button onClick={e=>{e.stopPropagation();onUnsaveEvent&&onUnsaveEvent(item.id,item);}} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--c-gold)", fontSize:"1.2rem", padding:"6px 4px", lineHeight:1 }}>♥</button>
                        </div>
                      </div>
                    </MiniCard>
                  );
                })}
              </div>
            </div>
          )}

          {savedHotelItems.length>0 && (
            <div>
              <SecHdr>Hotel Stays</SecHdr>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:12 }}>
                {savedHotelItems.map(h => {
                  const cta = getBookingCTA(h);
                  return (
                    <MiniCard key={h.id} onClick={()=>{}}>
                      {h.image&&<img src={h.image} alt="" loading="lazy" style={{ width:"100%", height:120, objectFit:"cover", display:"block" }}/>}
                      <div style={{ padding:"13px 14px" }}>
                        <div style={{ ...MONO, fontSize:"0.46rem", letterSpacing:"0.14em", textTransform:"uppercase", color:"var(--c-gold)", marginBottom:5 }}>{h.hood} · Hotel</div>
                        <div style={{ ...SERIF, fontSize:"1.05rem", fontWeight:600, color:"var(--c-white)", lineHeight:1.2, marginBottom:4 }}>{h.name}</div>
                        <div style={{ fontSize:"0.76rem", color:"var(--c-smoke)", fontWeight:300, marginBottom:10 }}>{h.price_from||""}</div>
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                          {cta?(<a href={cta.url} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{ display:"inline-block", background:"var(--c-gold)", color:"var(--c-black)", ...MONO, fontSize:"0.5rem", letterSpacing:"0.12em", textTransform:"uppercase", padding:"7px 14px", borderRadius:5, fontWeight:500, textDecoration:"none" }}>{cta.label}</a>):<span/>}
                          <button onClick={e=>{e.stopPropagation();onUnsaveHotel&&onUnsaveHotel(h.id);}} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--c-gold)", fontSize:"1.2rem", padding:"6px 4px", lineHeight:1 }}>♥</button>
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

// ── Stamp overlay ─────────────────────────────────────────────────────────────
function StampOverlay({ badge, onDone }) {
  const def = STAMP_DEFS[badge.id] || {};
  const rgb = def.rgb || "201,168,76";
  const ink = def.ink || "#C9A84C";
  const rot = def.rot || 0;

  useEffect(() => {
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [onDone]);

  const isRound = def.shape==="circle"||def.shape==="oval";
  const radius  = def.shape==="circle"?"50%":def.shape==="oval"?"50%/40%":8;

  return (
    <div style={{ position:"fixed", inset:0, zIndex:9990, display:"flex", alignItems:"center", justifyContent:"center", pointerEvents:"none", background:"rgba(8,6,4,0.55)" }}>
      <div className="stamp-overlay-press" style={{
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center",
        padding: isRound?"36px 44px":"32px 44px",
        border:`2.5px solid rgba(${rgb},0.82)`,
        boxShadow:`0 0 0 5px rgba(${rgb},0.07), 0 0 0 8px rgba(${rgb},0.04), inset 0 0 0 5px rgba(${rgb},0.06)`,
        background:`radial-gradient(ellipse at 48% 42%, rgba(${rgb},0.22) 0%, rgba(12,9,6,0.97) 70%)`,
        borderRadius: radius,
        transform:`rotate(${rot}deg)`,
        minWidth: isRound?190:240, minHeight: isRound?180:160,
        position:"relative", overflow:"hidden",
      }}>
        {/* Watermark */}
        <span style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%) rotate(-18deg)", ...MONO, fontSize:"0.32rem", letterSpacing:"0.38em", color:`rgba(${rgb},0.07)`, textTransform:"uppercase", whiteSpace:"nowrap", pointerEvents:"none", userSelect:"none" }}>
          STAMPED
        </span>
        {/* Side text for rect stamps */}
        {def.side && (
          <div style={{ position:"absolute", left:5, top:"50%", transform:"translateY(-50%) rotate(180deg)", writingMode:"vertical-rl", textOrientation:"mixed", ...MONO, fontSize:"0.27rem", letterSpacing:"0.28em", color:`rgba(${rgb},0.55)`, textTransform:"uppercase", whiteSpace:"nowrap" }}>
            {def.side}
          </div>
        )}
        <div style={{ position:"relative", zIndex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
          <div style={{ ...MONO, fontSize:"0.36rem", letterSpacing:"0.3em", color:`rgba(${rgb},0.8)`, textTransform:"uppercase" }}>{def.status||"STAMP EARNED"}</div>
          <div style={{ ...MONO, fontSize:"0.52rem", letterSpacing:"0.26em", color:`rgba(${rgb},0.6)`, fontWeight:600 }}>DETROIT</div>
          {def.deco && <div style={{ ...MONO, fontSize:"0.48rem", color:`rgba(${rgb},0.55)`, letterSpacing:"0.1em" }}>{def.deco}</div>}
          <div style={{ ...SERIF, fontSize:"1.42rem", fontWeight:600, color:"rgba(255,255,255,0.95)", lineHeight:1.2, textAlign:"center" }}>{def.name||badge.label}</div>
          <div style={{ ...MONO, fontSize:"0.34rem", letterSpacing:"0.18em", color:`rgba(${rgb},0.55)`, textTransform:"uppercase" }}>{def.sub||"2025 · MICHIGAN"}</div>
          <div style={{ ...MONO, fontSize:"0.3rem", letterSpacing:"0.1em", color:`rgba(${rgb},0.32)`, marginTop:2 }}>{def.serial}</div>
        </div>
      </div>
    </div>
  );
}

// ── Passport stamp ─────────────────────────────────────────────────────────────
function getShapeCSS(shape) {
  switch (shape) {
    case "rect":   return { borderRadius:5,                         width:155, minHeight:90,  padding:"9px 14px 9px 22px" };
    case "circle": return { borderRadius:"50%",                     width:122, minHeight:122, padding:"14px 12px" };
    case "oval":   return { borderRadius:"50%/38%",                 width:130, minHeight:110, padding:"11px 14px" };
    case "penta":  return { borderRadius:"10px 10px 42% 42%/10px 10px 38% 38%", width:132, minHeight:120, padding:"13px 14px" };
    default:       return { borderRadius:5,                         width:150, minHeight:82,  padding:"9px 14px" };
  }
}

function PassportStamp({ badge, earned, isNew, overlayActive }) {
  const def  = STAMP_DEFS[badge.id] || {};
  const rgb  = def.rgb || "120,110,90";
  const sh   = getShapeCSS(def.shape||"rect");

  const a1 = earned ? 0.80 : 0.14;
  const a2 = earned ? 0.52 : 0.09;
  const a3 = earned ? 0.18 : 0.04;

  const inkFull = `rgba(${rgb},${a1})`;
  const inkMid  = `rgba(${rgb},${a2})`;
  const inkBg   = `rgba(${rgb},${a3})`;

  return (
    <div className={isNew&&!overlayActive?"stamp-press":undefined} style={{
      ...sh,
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      textAlign:"center", position:"relative", overflow:"hidden", flexShrink:0,
      border:`1.5px solid ${inkFull}`,
      boxShadow: earned
        ? `0 0 0 3px ${inkBg}, inset 0 0 0 4px rgba(${rgb},0.05), 1px 2px 4px rgba(0,0,0,0.3)`
        : `inset 0 0 0 3px rgba(${rgb},0.04)`,
      background: earned
        ? `radial-gradient(ellipse at 46% 40%, rgba(${rgb},0.20) 0%, rgba(${rgb},0.07) 55%, transparent 85%)`
        : `rgba(${rgb},0.025)`,
      opacity: earned ? 1 : 0.20,
      transform:`rotate(${def.rot||0}deg)`,
      transition:"opacity 0.5s",
      boxSizing:"border-box",
    }}>
      {/* Vertical side text */}
      {def.side && (
        <div style={{ position:"absolute", left:4, top:"50%", transform:"translateY(-50%) rotate(180deg)", writingMode:"vertical-rl", textOrientation:"mixed", ...MONO, fontSize:"0.25rem", letterSpacing:"0.28em", color:inkMid, textTransform:"uppercase", whiteSpace:"nowrap" }}>
          {def.side}
        </div>
      )}
      {/* Diagonal watermark */}
      {earned && (
        <span style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%) rotate(-18deg)", ...MONO, fontSize:"0.28rem", letterSpacing:"0.38em", color:`rgba(${rgb},0.06)`, textTransform:"uppercase", whiteSpace:"nowrap", pointerEvents:"none", zIndex:0, userSelect:"none" }}>
          STAMPED
        </span>
      )}

      <div style={{ position:"relative", zIndex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2, width:"100%" }}>
        {/* Top status */}
        <div style={{ ...MONO, fontSize:"0.3rem", letterSpacing:"0.24em", color:inkFull, textTransform:"uppercase", lineHeight:1 }}>
          {earned ? (def.status||"ADMITTED") : "LOCKED"}
        </div>
        {/* DETROIT (not for round stamps — they use status instead) */}
        {def.shape!=="circle"&&def.shape!=="oval" && (
          <div style={{ ...MONO, fontSize:"0.42rem", letterSpacing:"0.22em", color:inkMid, fontWeight:600, lineHeight:1 }}>DETROIT</div>
        )}
        {/* Decorator */}
        {def.deco && earned && (
          <div style={{ ...MONO, fontSize:"0.4rem", color:inkMid, lineHeight:1.2, letterSpacing:"0.1em" }}>{def.deco}</div>
        )}
        {/* Badge name */}
        <div style={{ ...SERIF, fontSize:"0.87rem", fontWeight:600, color:earned?`rgba(${rgb},0.95)`:`rgba(${rgb},0.45)`, lineHeight:1.2, textAlign:"center", marginTop:1, marginBottom:1 }}>
          {def.name||badge.label}
        </div>
        {/* Sub / hint */}
        {earned ? (
          <div style={{ ...MONO, fontSize:"0.29rem", letterSpacing:"0.15em", color:inkMid, textTransform:"uppercase", lineHeight:1 }}>{def.sub}</div>
        ) : (
          <div style={{ ...MONO, fontSize:"0.35rem", letterSpacing:"0.03em", color:`rgba(${rgb},0.38)`, lineHeight:1.35, textAlign:"center", maxWidth:88 }}>{badge.hint}</div>
        )}
        {/* Serial */}
        {earned && (
          <div style={{ ...MONO, fontSize:"0.27rem", letterSpacing:"0.1em", color:inkMid, marginTop:2 }}>{def.serial}</div>
        )}
      </div>
    </div>
  );
}

// ── Passport tab ──────────────────────────────────────────────────────────────
function PassportTab({ visited, allVenues, onOpenVenue, navTo }) {
  const visitedVenues = useMemo(() => allVenues.filter(v=>visited.includes(String(v.id))), [visited,allVenues]);
  const badges        = PASSPORT_BADGES.map(b => ({ ...b, earned: b.test(visitedVenues) }));
  const earnedCount   = badges.filter(b=>b.earned).length;
  const milestone     = 20;
  const pct           = visitedVenues.length===0 ? 0 : Math.min(100,Math.round((visitedVenues.length/milestone)*100));
  const recentVisited = visitedVenues.slice(-5).reverse();

  const prevEarnedRef  = useRef(new Set());
  const earnedIds      = useMemo(() => new Set(badges.filter(b=>b.earned).map(b=>b.id)), [badges]);
  const newlyEarnedIds = useMemo(() => new Set([...earnedIds].filter(id=>!prevEarnedRef.current.has(id))), [earnedIds]);
  useEffect(() => { prevEarnedRef.current = earnedIds; }, [earnedIds]);

  const [overlayBadge, setOverlayBadge] = useState(null);
  useEffect(() => {
    if (newlyEarnedIds.size>0) {
      const b = badges.find(b=>newlyEarnedIds.has(b.id));
      if (b) setOverlayBadge(b);
    }
  }, [newlyEarnedIds.size]);

  return (
    <div style={{ padding:"24px 22px 56px", maxWidth:1200, margin:"0 auto" }}>

      {overlayBadge && <StampOverlay badge={overlayBadge} onDone={()=>setOverlayBadge(null)} />}

      {/* Progress card */}
      <div style={{ background:"var(--c-card)", border:"1px solid var(--c-border)", borderRadius:14, padding:"22px 22px 18px", marginBottom:24 }}>
        <p style={{ ...MONO, fontSize:"0.46rem", letterSpacing:"0.2em", textTransform:"uppercase", color:"var(--c-goldD)", margin:"0 0 6px" }}>Detroit Insider Passport</p>
        <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:14 }}>
          <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
            <span style={{ ...SERIF, fontSize:"2.2rem", fontWeight:400, color:"var(--c-white)", lineHeight:1 }}>{visitedVenues.length}</span>
            <span style={{ fontSize:"0.86rem", color:"var(--c-smoke)", fontWeight:300 }}>venue{visitedVenues.length!==1?"s":""} visited</span>
          </div>
          <span style={{ ...MONO, fontSize:"0.48rem", letterSpacing:"0.1em", color:"var(--c-gold)" }}>{earnedCount} / {badges.length} stamps</span>
        </div>
        <div style={{ background:"var(--c-borders)", borderRadius:100, height:2, overflow:"hidden" }}>
          <div style={{ height:"100%", width:pct+"%", background:"var(--c-gold)", borderRadius:100, transition:"width 0.7s ease" }} />
        </div>
        <p style={{ ...MONO, fontSize:"0.43rem", letterSpacing:"0.07em", color:"var(--c-smoke)", marginTop:8, marginBottom:0 }}>
          {visitedVenues.length===0 ? "Open any venue and mark it as visited to begin" : pct+"% of your first "+milestone+" discovered"}
        </p>
      </div>

      {/* Passport page */}
      <div style={{ marginBottom:28 }}>
        <SectionLabel>Your Stamps</SectionLabel>

        {/* Page header strip */}
        <div style={{ background:"var(--c-card)", border:"1px solid var(--c-border)", borderRadius:"10px 10px 0 0", padding:"14px 20px 12px", borderBottom:"1px solid rgba(201,168,76,0.12)", textAlign:"center" }}>
          <div style={{ ...MONO, fontSize:"0.34rem", letterSpacing:"0.32em", color:"var(--c-goldD)", textTransform:"uppercase" }}>EXCLUSIVE DETROIT</div>
          <div style={{ ...SERIF, fontSize:"1.05rem", color:"var(--c-gold)", fontWeight:400, margin:"3px 0 2px" }}>Insider Passport</div>
          <div style={{ ...MONO, fontSize:"0.3rem", letterSpacing:"0.14em", color:"var(--c-smoke)", textTransform:"uppercase" }}>YOUR JOURNEY · YOUR CITY · YOUR STAMPS</div>
        </div>

        {/* Parchment stamp page */}
        <div style={{
          background:"linear-gradient(148deg, rgba(34,27,18,0.95) 0%, rgba(20,15,9,0.98) 100%)",
          border:"1px solid rgba(201,168,76,0.08)", borderTop:"none",
          borderRadius:"0 0 10px 10px",
          padding:"32px 20px 36px",
          position:"relative", overflow:"hidden",
        }}>
          {/* Horizontal page lines */}
          <div style={{ position:"absolute", inset:0, pointerEvents:"none", backgroundImage:"repeating-linear-gradient(0deg, transparent 0px, transparent 30px, rgba(201,168,76,0.025) 30px, rgba(201,168,76,0.025) 31px)" }} />
          {/* Faint background watermark */}
          <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%) rotate(-30deg)", ...MONO, fontSize:"4rem", letterSpacing:"0.2em", color:"rgba(201,168,76,0.025)", textTransform:"uppercase", whiteSpace:"nowrap", pointerEvents:"none", userSelect:"none" }}>
            DETROIT
          </div>

          {/* Stamp grid */}
          <div style={{ position:"relative", zIndex:1, display:"flex", flexWrap:"wrap", gap:"22px 14px", justifyContent:"center", alignItems:"flex-start" }}>
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

          {earnedCount===0 && (
            <p style={{ ...MONO, fontSize:"0.42rem", letterSpacing:"0.08em", color:"rgba(201,168,76,0.28)", textAlign:"center", marginTop:22, marginBottom:0, position:"relative", zIndex:1 }}>
              Visit venues and mark them as visited to earn stamps
            </p>
          )}

          {/* Page footer */}
          <div style={{ position:"relative", zIndex:1, textAlign:"center", marginTop:24, paddingTop:14, borderTop:"1px solid rgba(201,168,76,0.07)" }}>
            <div style={{ ...MONO, fontSize:"0.3rem", letterSpacing:"0.2em", color:"rgba(201,168,76,0.22)", textTransform:"uppercase" }}>
              DETROIT INSIDER PASSPORT
            </div>
          </div>
        </div>
      </div>

      {/* Recently visited */}
      {recentVisited.length>0 ? (
        <div>
          <SectionLabel>Recently Visited</SectionLabel>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {recentVisited.map(v => (
              <button key={v.id} onClick={()=>onOpenVenue(String(v.id))}
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
          <button onClick={()=>navTo("explore")} style={{ ...MONO, fontSize:"0.5rem", letterSpacing:"0.14em", textTransform:"uppercase", color:"var(--c-gold)", border:"1px solid var(--c-goldD)", padding:"9px 20px", borderRadius:6, background:"transparent", cursor:"pointer" }}>
            Explore Venues →
          </button>
        </div>
      )}
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
const TABS = [
  { id:"tonight",  label:"Tonight"  },
  { id:"saved",    label:"Saved"    },
  { id:"passport", label:"Passport" },
];

export default function MyDetroit({
  visited, taste, onTasteChange, onOpenVenue, navTo, allVenues,
  savedVenues, savedEventItems, savedHotelItems,
  toggleFav, onUnsaveEvent, onUnsaveHotel,
}) {
  const [subTab, setSubTab] = useState("tonight");

  return (
    <div>
      <div style={{ background:"var(--c-deep)", padding:"46px 22px 0", borderBottom:"1px solid var(--c-border)" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <p style={{ ...MONO, fontSize:"0.53rem", letterSpacing:"0.22em", textTransform:"uppercase", color:"var(--c-gold)", marginBottom:5 }}>Personal Guide</p>
          <h2 style={{ ...SERIF, fontSize:"clamp(1.8rem,5vw,3rem)", fontWeight:400, color:"var(--c-white)", marginBottom:4 }}>Itinerary</h2>
          <p style={{ fontSize:"0.84rem", color:"var(--c-smoke)", marginBottom:0 }}>Curated to how you explore Detroit.</p>
        </div>
        <div style={{ maxWidth:1200, margin:"18px auto 0" }}>
          <div style={{ display:"flex", gap:0 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={()=>setSubTab(t.id)}
                style={{ ...MONO, fontSize:"0.52rem", letterSpacing:"0.12em", textTransform:"uppercase", padding:"12px 16px", background:"none", border:"none", cursor:"pointer", color:subTab===t.id?"var(--c-gold)":"var(--c-smoke)", borderBottom:subTab===t.id?"2px solid var(--c-gold)":"2px solid transparent", transition:"color 0.18s, border-color 0.18s", whiteSpace:"nowrap", flexShrink:0 }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {subTab==="tonight"  && <TonightTab allVenues={allVenues} onOpenVenue={onOpenVenue} />}
      {subTab==="saved"    && <SavedSpotsTab savedVenues={savedVenues||[]} savedEventItems={savedEventItems||[]} savedHotelItems={savedHotelItems||[]} toggleFav={toggleFav} onUnsaveEvent={onUnsaveEvent} onUnsaveHotel={onUnsaveHotel} onOpenVenue={onOpenVenue} />}
      {subTab==="passport" && <PassportTab visited={visited} allVenues={allVenues} onOpenVenue={onOpenVenue} navTo={navTo} />}
    </div>
  );
}
