import React, { useState, useMemo, useRef, useEffect } from "react";
import { getTicketCTA, getBookingCTA, fmtDate } from "../data/eventsData.js";

// ─────────────────────────────────────────────────────────────────────────────
// Typography shortcuts
// ─────────────────────────────────────────────────────────────────────────────
const MONO  = { fontFamily:"'DM Mono',monospace" };
const SERIF = { fontFamily:"'Cormorant Garamond',serif" };

export const TASTE_OPTIONS = [
  { id:"hidden",    label:"Hidden Gems" },
  { id:"datenight", label:"Date Night"  },
  { id:"latenight", label:"Late Night"  },
  { id:"cocktail",  label:"Cocktail First" },
  { id:"foodie",    label:"Foodie"      },
  { id:"locals",    label:"Locals Only" },
  { id:"rooftop",   label:"Rooftop Views" },
  { id:"sports",    label:"Sports & Games" },
  { id:"happyhour", label:"Happy Hour"  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Venue tag system — category defaults + inline v.tags + supplemental overrides
// ─────────────────────────────────────────────────────────────────────────────
const CAT_TAGS = {
  "Breakfast":               ["morning","brunch","food","calm"],
  "Coffee Shops & Bakeries": ["morning","coffee","food","calm"],
  "Lunch":                   ["lunch","food"],
  "Dinner":                  ["dinner","food"],
  "Happy Hour":              ["happyHour","drinks"],
  "Cocktail Lounges":        ["drinks","cocktail"],
  "Hidden Bars":             ["drinks","cocktail","hidden"],
  "Rooftops":                ["drinks","rooftop"],
  "Nightlife":               ["lateNight","highEnergy"],
  "Sports Bars":             ["chill","sportsBar","groupFriendly"],
  "Outdoor Activities":      ["outdoor","daytime","groupFriendly"],
  "Alley Spots":             ["outdoor","chill","groupFriendly"],
};

// Supplemental tags for venues that need additions beyond v.tags + CAT_TAGS.
// These only ADD tags — they never override the venue's own inline tags.
const VTAGS = {
  // Cocktail Lounges — no inline tags, need supplements
  "3":  ["chill","lateNight"],
  "5":  ["hidden","chill","outdoor"],
  "6":  ["elevated","dateNight","morning","food"],
  "8":  ["elevated","dateNight","calm"],
  "9":  ["rooftop"],
  "10": ["elevated","calm","dateNight"],
  "13": ["hidden","chill"],
  "30": ["elevated","dateNight","food","lateNight"],
  // Happy Hour supplement
  "4":  ["happyHour"],
  // Sports Bars supplement
  "18": ["rooftop"],
  // Nightlife supplements
  "20": ["chill","drinks"],
  "21": ["hidden"],
  "23": ["groupFriendly"],
  "88": ["drinks","groupFriendly"],
  "89": ["drinks","groupFriendly"],
  // Dinner — no inline tags, need supplements
  "11": ["dateNight"],
  "24": ["elevated","dateNight","calm"],
  "32": ["chill","groupFriendly"],
  "65": ["lateNight"],
  "69": ["elevated","dateNight"],
  "70": ["elevated","dateNight"],
  "71": ["dateNight","chill"],
  "72": ["chill","groupFriendly"],
  "73": ["elevated","dateNight","calm"],
  "85": ["rooftop"],
  "90": ["happyHour","elevated","dateNight"],
  // Happy Hour category — add dinner/elevated
  "51": ["dinner","elevated","dateNight"],
  "52": ["food","chill","dinner"],
  "53": ["elevated","dateNight","food","dinner"],
  // Lunch — add happyHour to confirmed HH venues, other supplements
  "55": ["happyHour","dinner","chill"],
  "56": ["happyHour"],
  "57": ["chill"],
  "63": ["dinner","chill","groupFriendly"],
  "64": ["dinner","chill","groupFriendly"],
  "78": ["chill"],
  "91": ["happyHour","drinks"],
  "92": ["happyHour","chill","groupFriendly"],
  "93": ["happyHour","chill","groupFriendly"],
  // Coffee/Bakery supplements
  "46": ["lateNight","highEnergy","drinks"],
  "68": ["highEnergy"],
  // Breakfast supplements
  "45": ["chill"],
  // Outdoor — add morning
  "26": ["morning","calm"],
  "27": ["morning"],
  "28": ["morning","calm"],
  // Alley Spots — add drinks
  "15": ["drinks","outdoor"],
  "16": ["lateNight","highEnergy","drinks"],
};

function getVenueTags(v) {
  const id    = String(v.id);
  const own   = v.tags || [];                                           // venue's own inline tags (primary source)
  const sup   = VTAGS[id] || [];                                        // supplemental additions
  const cat   = CAT_TAGS[v.cat] || [];                                  // category defaults
  const hours = (v.hours||"").includes("2am")||(v.hours||"").includes("3am") ? ["lateNight"] : [];
  return [...new Set([...own, ...sup, ...cat, ...hours])];
}

function hasT(v, t) { return getVenueTags(v).includes(t); }

// ─────────────────────────────────────────────────────────────────────────────
// Build My Night — Morning / Afternoon / Night
// ─────────────────────────────────────────────────────────────────────────────
function buildNight(when, who, energy, all) {
  const pool = fn => all.filter(fn);
  const morning  = pool(v => hasT(v,"morning") || hasT(v,"brunch"));
  const lunch    = pool(v => hasT(v,"lunch"));
  const hh       = pool(v => hasT(v,"happyHour"));
  const dinner   = pool(v => hasT(v,"dinner"));
  const drinks   = pool(v => hasT(v,"drinks") || hasT(v,"cocktail"));
  const lateN    = pool(v => hasT(v,"lateNight"));
  const elevated = pool(v => hasT(v,"elevated"));
  const calm     = pool(v => hasT(v,"calm"));
  const chill    = pool(v => hasT(v,"chill") || v.cat==="Sports Bars");
  const highE    = pool(v => hasT(v,"highEnergy") || v.cat==="Nightlife");
  const rooftop  = pool(v => hasT(v,"rooftop") || v.cat==="Rooftops");

  const used = new Set();
  function pick(p) {
    const avail = (p||[]).filter(v => !used.has(String(v.id)));
    if (!avail.length) return null;
    const v = avail[Math.floor(Math.random() * Math.min(avail.length, 8))];
    used.add(String(v.id));
    return v;
  }
  function or(...pools) { for (const p of pools) { const v = pick(p); if (v) return v; } return null; }

  let stops = [];

  if (when === "morning") {
    stops = [
      or(morning),
      or(morning),
      or(rooftop.filter(v=>v.cat!=="Nightlife"), pool(v => v.cat==="Outdoor Activities")),
    ];
  } else if (when === "afternoon") {
    stops = [
      or(lunch, pool(v=>hasT(v,"food"))),
      or(hh, drinks),
      or(drinks, hh),
    ];
  } else {
    // Night — handles all evening + late-night combinations
    if (energy === "calm") {
      stops = [
        or(dinner.filter(v=>hasT(v,"calm")||hasT(v,"elevated")), dinner),
        or(drinks.filter(v=>hasT(v,"calm")||hasT(v,"elevated")), drinks),
        or(drinks.filter(v=>hasT(v,"calm")||hasT(v,"hidden")), drinks),
      ];
    } else if (energy === "chill") {
      stops = [
        or(dinner.filter(v=>!hasT(v,"elevated")), dinner),
        or(chill.filter(v=>hasT(v,"drinks")), hh, chill),
        or(chill, drinks),
      ];
    } else if (energy === "elevated") {
      const isDN   = who === "date";
      const dPool  = isDN
        ? dinner.filter(v=>hasT(v,"elevated")&&hasT(v,"dateNight"))
        : dinner.filter(v=>hasT(v,"elevated"));
      const dkPool = isDN
        ? drinks.filter(v=>hasT(v,"elevated")&&hasT(v,"dateNight"))
        : elevated.filter(v=>hasT(v,"drinks"));
      if (!dPool.length && !dkPool.length && !elevated.length) {
        return { stops:[], reason:"Not enough elevated venues for this combination." };
      }
      stops = [
        or(dPool, dinner.filter(v=>hasT(v,"elevated")), dinner),
        or(dkPool, elevated.filter(v=>hasT(v,"drinks")), drinks),
        or(dkPool, elevated.filter(v=>hasT(v,"drinks")||hasT(v,"rooftop")), rooftop, drinks),
      ];
    } else {
      // highEnergy
      stops = [
        or(dinner),
        or(highE, drinks),
        or(lateN.filter(v=>hasT(v,"highEnergy")), lateN, highE),
      ];
    }
  }

  const clean = stops.filter(Boolean);
  return { stops: clean, reason: clean.length < 2 ? "Not enough matching spots for this combination. Try a different vibe." : "" };
}

function getStopLabel(i, when, energy) {
  const m = {
    morning:         ["MORNING STOP","BRUNCH SPOT","MORNING VIEWS"],
    afternoon:       ["LUNCH STOP","HAPPY HOUR","AFTERNOON COCKTAILS"],
    night_calm:      ["DINNER STOP","COCKTAIL BAR","NIGHTCAP"],
    night_chill:     ["DINNER STOP","LOCAL BAR","LATE DRINKS"],
    night_elevated:  ["DINNER STOP","ELEVATED LOUNGE","AFTER HOURS"],
    night_highenergy:["DINNER STOP","NIGHTLIFE SPOT","AFTER HOURS"],
  };
  const key = when==="night" ? `night_${energy}` : when;
  return (m[key] || m.morning)[i] || `STOP ${i+1}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Icon SVGs
// ─────────────────────────────────────────────────────────────────────────────
const si = { fill:"none", stroke:"currentColor", strokeWidth:1.4, strokeLinecap:"round", strokeLinejoin:"round" };

const IconSunrise   = () => <svg width="16" height="16" viewBox="0 0 16 16" style={si}><path d="M2,11 Q8,4 14,11"/><line x1="8" y1="2" x2="8" y2="1"/><line x1="2" y1="6" x2="1.2" y2="6"/><line x1="14" y1="6" x2="14.8" y2="6"/><line x1="3.5" y1="3.5" x2="2.8" y2="2.8"/><line x1="12.5" y1="3.5" x2="13.2" y2="2.8"/><line x1="1" y1="13" x2="15" y2="13"/></svg>;
const IconSun       = () => <svg width="16" height="16" viewBox="0 0 16 16" style={si}><circle cx="8" cy="8" r="3"/><line x1="8" y1="1" x2="8" y2="2.5"/><line x1="8" y1="13.5" x2="8" y2="15"/><line x1="1" y1="8" x2="2.5" y2="8"/><line x1="13.5" y1="8" x2="15" y2="8"/><line x1="3" y1="3" x2="4.1" y2="4.1"/><line x1="11.9" y1="11.9" x2="13" y2="13"/><line x1="13" y1="3" x2="11.9" y2="4.1"/><line x1="4.1" y1="11.9" x2="3" y2="13"/></svg>;
const IconMoon      = () => <svg width="16" height="16" viewBox="0 0 16 16" style={si}><path d="M12,9 Q12,13 8,14 Q4,15 2.5,11 Q1,7 4,5 Q5,4 7,4 Q5,7 7,9.5 Q9,12 12,9Z"/><line x1="12" y1="2" x2="12" y2="0.5"/><line x1="14" y1="4" x2="15.5" y2="4"/><line x1="13.1" y1="0.9" x2="14" y2="0"/></svg>;
const IconPerson    = () => <svg width="16" height="16" viewBox="0 0 16 16" style={si}><circle cx="8" cy="5.5" r="2.5"/><path d="M3,14 Q3,10 8,10 Q13,10 13,14"/></svg>;
const IconTwo       = () => <svg width="16" height="16" viewBox="0 0 16 16" style={si}><circle cx="5.5" cy="5" r="2"/><circle cx="10.5" cy="5" r="2"/><path d="M1,14 Q1,11 5.5,11 Q10,11 10,14"/><path d="M10,11 Q13.5,11 15,14"/></svg>;
const IconGroup     = () => <svg width="16" height="16" viewBox="0 0 16 16" style={si}><circle cx="4" cy="5" r="1.8"/><circle cx="8.5" cy="4" r="2"/><circle cx="13" cy="5" r="1.8"/><path d="M1,14 Q1,11 4,11"/><path d="M3,14 Q3,10 8.5,10 Q14,10 14,14"/><path d="M13,11 Q16,11 16,14"/></svg>;
const IconLeaf      = () => <svg width="16" height="16" viewBox="0 0 16 16" style={si}><path d="M8,14 Q8,9 13,5 Q15,3 15,2 Q14,2 12,3 Q7,5 6,10 Q5.5,13 8,14Z"/><path d="M8,14 Q7,12 5,15"/><line x1="8" y1="10" x2="8" y2="14"/></svg>;
const IconSmile     = () => <svg width="16" height="16" viewBox="0 0 16 16" style={si}><circle cx="8" cy="8" r="6"/><path d="M5.5,9.5 Q8,12 10.5,9.5"/><circle cx="5.8" cy="7" r="0.5" fill="currentColor" stroke="none"/><circle cx="10.2" cy="7" r="0.5" fill="currentColor" stroke="none"/></svg>;
const IconDiamond   = () => <svg width="16" height="16" viewBox="0 0 16 16" style={si}><polygon points="8,1 14,7 8,15 2,7"/><line x1="2" y1="7" x2="14" y2="7"/><line x1="5" y1="1.8" x2="8" y2="7"/><line x1="11" y1="1.8" x2="8" y2="7"/></svg>;
const IconLightning = () => <svg width="16" height="16" viewBox="0 0 16 16" style={{...si,strokeLinejoin:"round"}}><path d="M9.5,1 L5,9 L8.5,9 L6.5,15 L12,7 L8.5,7Z"/></svg>;

// ─────────────────────────────────────────────────────────────────────────────
// Building SVG art for passport stamps
// ─────────────────────────────────────────────────────────────────────────────
const CAT_BUILDING = {
  "Dinner":                  "classic",
  "Cocktail Lounges":        "artdeco",
  "Hidden Bars":             "dome",
  "Rooftops":                "modern",
  "Breakfast":               "cafe",
  "Coffee Shops & Bakeries": "cafe",
  "Nightlife":               "warehouse",
  "Sports Bars":             "warehouse",
  "Happy Hour":              "arches",
  "Lunch":                   "arches",
  "Outdoor Activities":      "modern",
  "Alley Spots":             "artdeco",
};

function BuildingSVG({ type }) {
  const s = { fill:"none", stroke:"currentColor", strokeWidth:1.15, strokeLinecap:"round", strokeLinejoin:"round" };
  const f = { stroke:"none", fill:"currentColor" };
  switch (type) {
    case "classic": return (
      <svg viewBox="0 0 72 48" width="72" height="48">
        <polyline points="4,20 36,3 68,20" style={s}/>
        <rect x="4" y="20" width="64" height="2.5" style={{...f,opacity:.6}}/>
        {[11,20.5,30,42,51.5,61].map(x=><rect key={x} x={x} y="22.5" width="2.5" height="20" style={{...f,opacity:.45}}/>)}
        <rect x="4" y="42.5" width="64" height="2.5" style={{...f,opacity:.6}}/>
        <path d="M31,42.5 L31,33 Q36,26 41,33 L41,42.5" style={s}/>
        <line x1="4" y1="20" x2="4" y2="45" style={{...s,opacity:.45}}/>
        <line x1="68" y1="20" x2="68" y2="45" style={{...s,opacity:.45}}/>
        <path d="M26,20 L26,12 L30,10 L30,20" style={{...s,opacity:.55}}/>
        <path d="M42,20 L42,12 L46,10 L46,20" style={{...s,opacity:.55}}/>
      </svg>
    );
    case "arches": return (
      <svg viewBox="0 0 72 48" width="72" height="48">
        <rect x="2" y="2" width="68" height="3" style={{...f,opacity:.6}}/>
        <path d="M7,46 L7,24 Q7,12 16,12 Q25,12 25,24 L25,46" style={s}/>
        <path d="M28,46 L28,24 Q28,12 36,12 Q44,12 44,24 L44,46" style={s}/>
        <path d="M47,46 L47,24 Q47,12 56,12 Q65,12 65,24 L65,46" style={s}/>
        <rect x="2" y="46" width="68" height="2" style={{...f,opacity:.6}}/>
        <line x1="25" y1="12" x2="28" y2="12" style={{...s,opacity:.4}}/>
        <line x1="44" y1="12" x2="47" y2="12" style={{...s,opacity:.4}}/>
        <rect x="10" y="36" width="12" height="10" rx="0" style={{...s,opacity:.5}}/>
        <rect x="31" y="36" width="10" height="10" rx="0" style={{...s,opacity:.5}}/>
        <rect x="50" y="36" width="12" height="10" rx="0" style={{...s,opacity:.5}}/>
      </svg>
    );
    case "cafe": return (
      <svg viewBox="0 0 72 48" width="72" height="48">
        <rect x="4" y="16" width="64" height="30" style={s}/>
        <rect x="4" y="16" width="64" height="4" style={{...f,opacity:.5}}/>
        <path d="M2,24 L70,24 L64,34 L8,34Z" style={s}/>
        {[16,26,36,46,56].map(x=><line key={x} x1={x} y1="24" x2={x-3} y2="34" style={{stroke:"currentColor",strokeWidth:.85,opacity:.4}}/>)}
        <rect x="8" y="36" width="18" height="10" style={s}/>
        <rect x="46" y="36" width="18" height="10" style={s}/>
        <rect x="30" y="37" width="12" height="9" style={s}/>
        <line x1="36" y1="3" x2="36" y2="16" style={{stroke:"currentColor",strokeWidth:1.2,opacity:.6}}/>
        <line x1="30" y1="6" x2="42" y2="6" style={{stroke:"currentColor",strokeWidth:1.2,opacity:.5}}/>
      </svg>
    );
    case "artdeco": return (
      <svg viewBox="0 0 72 48" width="72" height="48">
        <rect x="31" y="1" width="10" height="5" style={s}/>
        <rect x="25" y="6" width="22" height="5" style={s}/>
        <rect x="17" y="11" width="38" height="5" style={s}/>
        <rect x="8" y="16" width="56" height="30" style={s}/>
        {[20,30,42,52].map(x=><line key={x} x1={x} y1="16" x2={x} y2="46" style={{stroke:"currentColor",strokeWidth:.75,opacity:.35}}/>)}
        <rect x="30" y="34" width="12" height="12" style={s}/>
        <rect x="8" y="46" width="56" height="2" style={{...f,opacity:.55}}/>
        <line x1="36" y1="1" x2="36" y2="6" style={{stroke:"currentColor",strokeWidth:1.5,opacity:.6,strokeLinecap:"round"}}/>
        <rect x="34" y="0" width="4" height="1.5" style={{...f,opacity:.7}}/>
      </svg>
    );
    case "modern": return (
      <svg viewBox="0 0 72 48" width="72" height="48">
        <rect x="20" y="5" width="32" height="40" style={s}/>
        {[28,36,44].map(x=><line key={x} x1={x} y1="5" x2={x} y2="45" style={{stroke:"currentColor",strokeWidth:.65,opacity:.38}}/>)}
        {[13,21,29,37].map(y=><line key={y} x1="20" y1={y} x2="52" y2={y} style={{stroke:"currentColor",strokeWidth:.65,opacity:.38}}/>)}
        <line x1="36" y1="5" x2="36" y2="0" style={{stroke:"currentColor",strokeWidth:1.5,strokeLinecap:"round"}}/>
        <rect x="4" y="20" width="16" height="25" style={s}/>
        <rect x="52" y="20" width="16" height="25" style={s}/>
        {[26,32,38].map(y=><line key={y} x1="4" y1={y} x2="20" y2={y} style={{stroke:"currentColor",strokeWidth:.6,opacity:.35}}/>)}
        {[26,32,38].map(y=><line key={y+"r"} x1="52" y1={y} x2="68" y2={y} style={{stroke:"currentColor",strokeWidth:.6,opacity:.35}}/>)}
      </svg>
    );
    case "dome": return (
      <svg viewBox="0 0 72 48" width="72" height="48">
        <path d="M16,28 Q16,3 56,3 Q56,3 56,28Z" style={s}/>
        <line x1="36" y1="3" x2="36" y2="28" style={{stroke:"currentColor",strokeWidth:.7,opacity:.35}}/>
        <line x1="24" y1="6" x2="36" y2="28" style={{stroke:"currentColor",strokeWidth:.7,opacity:.35}}/>
        <line x1="48" y1="6" x2="36" y2="28" style={{stroke:"currentColor",strokeWidth:.7,opacity:.35}}/>
        <rect x="6" y="26" width="60" height="3.5" style={{...f,opacity:.5}}/>
        <rect x="4" y="29.5" width="64" height="16.5" style={s}/>
        {[10,20,30,42,52,62].map(x=><rect key={x} x={x} y="29.5" width="2" height="16.5" style={{...f,opacity:.35}}/>)}
        <path d="M27,46 L27,37 Q36,30 45,37 L45,46" style={s}/>
      </svg>
    );
    case "warehouse": return (
      <svg viewBox="0 0 72 48" width="72" height="48">
        <polygon points="36,2 4,16 68,16" style={s}/>
        <rect x="4" y="16" width="64" height="30" style={s}/>
        <circle cx="16" cy="28" r="6.5" style={s}/>
        <circle cx="36" cy="28" r="6.5" style={s}/>
        <circle cx="56" cy="28" r="6.5" style={s}/>
        <rect x="27" y="38" width="18" height="8" style={s}/>
        <line x1="4" y1="16" x2="4" y2="46" style={{...s,opacity:.4}}/>
        <line x1="68" y1="16" x2="68" y2="46" style={{...s,opacity:.4}}/>
      </svg>
    );
    default: return (
      <svg viewBox="0 0 72 48" width="72" height="48">
        <rect x="4" y="10" width="64" height="36" style={s}/>
        <rect x="4" y="10" width="64" height="4" style={{...f,opacity:.5}}/>
        <rect x="30" y="30" width="12" height="16" style={s}/>
        {[10,22,40,52].map(x=><rect key={x} x={x} y="16" width="10" height="10" style={s}/>)}
      </svg>
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Stamp color + rotation helpers
// ─────────────────────────────────────────────────────────────────────────────
const STAMP_PALETTE = [
  { hex:"#C0463A", rgb:"192,70,58"   },
  { hex:"#6B4DA0", rgb:"107,77,160"  },
  { hex:"#3A6B9B", rgb:"58,107,155"  },
  { hex:"#3A7A3A", rgb:"58,122,58"   },
  { hex:"#C06B2A", rgb:"192,107,42"  },
  { hex:"#2A7A8A", rgb:"42,122,138"  },
  { hex:"#8B3A6B", rgb:"139,58,107"  },
  { hex:"#6B5A2A", rgb:"107,90,42"   },
];
const STAMP_ROTS = [-6,4,-3,7,-8,2,-5,6,-2,5,-7,3];

// Y scatter offsets — organic vertical offset for each stamp slot
const SCATTER_Y = [0,-14,8,-6,14,-10,4,-18,6,-12,2,-8,10,-4,16,-10];

function getStampStyle(v) {
  const n = parseInt(String(v.id).replace(/\D/g,"")) || 0;
  return { ...STAMP_PALETTE[n % STAMP_PALETTE.length], rot: STAMP_ROTS[n % STAMP_ROTS.length] };
}

function getStampDate(index) {
  const start = new Date("2025-04-15");
  const d = new Date(start.getTime() + index * 4 * 86400000);
  return d.toLocaleDateString("en-US",{month:"short",day:"2-digit",year:"numeric"}).toUpperCase().replace(",","");
}

// ─────────────────────────────────────────────────────────────────────────────
// VenueStamp — ink-on-paper look, no box border
// ─────────────────────────────────────────────────────────────────────────────
function VenueStamp({ v, index, isNew, onOpen }) {
  const { hex, rgb, rot } = getStampStyle(v);
  const btype = CAT_BUILDING[v.cat] || "classic";
  const portrait = index % 3 === 1;
  const w = portrait ? 118 : 148;
  const h = portrait ? 108 :  90;
  const serial = "DET-" + String(v.id).padStart(4,"0");
  const date   = getStampDate(index);

  return (
    <div
      className={isNew ? "stamp-press" : undefined}
      onClick={() => onOpen && onOpen(String(v.id))}
      style={{
        width:w, height:h, flexShrink:0,
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
        background:`radial-gradient(ellipse at 50% 45%, rgba(${rgb},0.22) 0%, rgba(${rgb},0.08) 55%, transparent 80%)`,
        borderRadius:4, transform:`rotate(${rot}deg)`,
        padding:portrait?"6px 8px 8px":"5px 10px 7px",
        position:"relative", overflow:"hidden", boxSizing:"border-box",
        color: hex,
        filter:`drop-shadow(0 0 5px rgba(${rgb},0.28))`,
        cursor: onOpen ? "pointer" : "default",
      }}
    >
      {/* Diagonal VISITED watermark */}
      <span style={{ position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%) rotate(-18deg)",...MONO,fontSize:"0.24rem",letterSpacing:"0.32em",color:`rgba(${rgb},0.09)`,textTransform:"uppercase",whiteSpace:"nowrap",pointerEvents:"none",userSelect:"none",zIndex:0 }}>
        VISITED
      </span>
      {/* Outer ink ring — simulates rubber stamp border */}
      <div style={{ position:"absolute",inset:4,borderRadius:3,border:`1.5px dashed rgba(${rgb},0.5)`,pointerEvents:"none",zIndex:0 }}/>
      <div style={{ position:"relative",zIndex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,width:"100%" }}>
        <div style={{ opacity:.78, lineHeight:0 }}>
          <BuildingSVG type={btype}/>
        </div>
        <div style={{ ...SERIF,fontSize:"0.80rem",fontWeight:700,color:hex,lineHeight:1.1,textAlign:"center",textTransform:"uppercase",letterSpacing:"0.03em",marginTop:1 }}>
          {stampName(v.name)}
        </div>
        <div style={{ ...MONO,fontSize:"0.25rem",letterSpacing:"0.18em",color:hex,opacity:.65,textTransform:"uppercase" }}>
          {v.hood.toUpperCase()}
        </div>
        <div style={{ ...MONO,fontSize:"0.22rem",letterSpacing:"0.1em",color:hex,opacity:.46,textTransform:"uppercase" }}>
          {date}
        </div>
        <div style={{ ...MONO,fontSize:"0.20rem",letterSpacing:"0.07em",color:hex,opacity:.36 }}>
          {serial}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stamp overlay — full-screen press animation (only when newly earned)
// ─────────────────────────────────────────────────────────────────────────────
function StampOverlay({ venue, onDone }) {
  const { hex, rgb, rot } = getStampStyle(venue);
  const btype = CAT_BUILDING[venue.cat] || "classic";
  useEffect(() => { const t = setTimeout(onDone, 2600); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{ position:"fixed",inset:0,zIndex:9990,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none",background:"rgba(6,4,2,0.58)" }}>
      <div className="stamp-overlay-press" style={{
        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",
        width:230, height:188, border:`2px dashed rgba(${rgb},0.75)`,
        boxShadow:`0 0 0 5px rgba(${rgb},0.08), 0 0 0 8px rgba(${rgb},0.04)`,
        background:`radial-gradient(ellipse at 48% 40%, rgba(${rgb},0.22) 0%, rgba(8,5,2,0.97) 72%)`,
        borderRadius:6, transform:`rotate(${rot}deg)`, padding:"18px 20px", position:"relative", overflow:"hidden",
        color: hex,
        filter:`drop-shadow(0 0 12px rgba(${rgb},0.4))`,
      }}>
        <span style={{ position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%) rotate(-18deg)",...MONO,fontSize:"0.3rem",letterSpacing:"0.38em",color:`rgba(${rgb},0.06)`,textTransform:"uppercase",whiteSpace:"nowrap",pointerEvents:"none",userSelect:"none" }}>
          VISITED
        </span>
        <div style={{ position:"relative",zIndex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4 }}>
          <div style={{ opacity:.78,lineHeight:0 }}><BuildingSVG type={btype}/></div>
          <div style={{ ...SERIF,fontSize:"1.4rem",fontWeight:700,color:hex,lineHeight:1.1,textTransform:"uppercase",textAlign:"center",marginTop:4 }}>
            {venue.name}
          </div>
          <div style={{ ...MONO,fontSize:"0.32rem",letterSpacing:"0.18em",color:hex,opacity:.6,textTransform:"uppercase" }}>
            {venue.hood} · STAMPED
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Venue fallback gradient (when no photo available)
// ─────────────────────────────────────────────────────────────────────────────
const CAT_GRADIENT = {
  "Dinner":                  "linear-gradient(135deg,#2a1a0a 0%,#1a0e06 100%)",
  "Cocktail Lounges":        "linear-gradient(135deg,#1a1030 0%,#0e0818 100%)",
  "Hidden Bars":             "linear-gradient(135deg,#1a1020 0%,#0e0814 100%)",
  "Rooftops":                "linear-gradient(135deg,#0a1a2a 0%,#060e1a 100%)",
  "Breakfast":               "linear-gradient(135deg,#2a180a 0%,#1a0e04 100%)",
  "Coffee Shops & Bakeries": "linear-gradient(135deg,#2a180a 0%,#1a0e04 100%)",
  "Nightlife":               "linear-gradient(135deg,#1a0a20 0%,#0e0612 100%)",
  "Sports Bars":             "linear-gradient(135deg,#0a1a2a 0%,#060e18 100%)",
  "Happy Hour":              "linear-gradient(135deg,#2a1a04 0%,#1a1002 100%)",
  "Lunch":                   "linear-gradient(135deg,#0a1a0a 0%,#061006 100%)",
};
function venueGradient(v) { return CAT_GRADIENT[v.cat] || "linear-gradient(135deg,#1a1408 0%,#0e0c06 100%)"; }

// Clean stamp name — no ellipsis truncation ever
function stampName(name) {
  return name
    .replace(/^The\s+/i, "")
    .replace(/\s+&\s+Company\b/gi, " & Co.")
    .replace(/\s+Standard\b/gi, " Std.")
    .replace(/\s+Restaurant\b/gi, " Rest.")
    .replace(/\s+International\b/gi, " Int'l")
    .replace(/\s+Detroit\b(?!\s+\S)/gi, " Det.");
}

// Unsplash fallback for result cards (mirrors App.jsx CATEGORY_IMG_POOL first entry)
const CAT_IMG_FB = {
  "Dinner":                  "1414235077428-338989a2e8c0",
  "Cocktail Lounges":        "1513558161293-cdaf765ed2fd",
  "Hidden Bars":             "1470337458703-46ad1756a187",
  "Rooftops":                "1477959858617-67f85cf4f1df",
  "Breakfast":               "1533089860892-a7c6f0a88666",
  "Coffee Shops & Bakeries": "1509042239860-f550ce710b93",
  "Nightlife":               "1492684223066-81342ee5ff30",
  "Sports Bars":             "1579952363873-27f3bade9f55",
  "Happy Hour":              "1414235077428-338989a2e8c0",
  "Lunch":                   "1517248135467-4c7edcad34c4",
  "Outdoor Activities":      "1534224373688-37be267ede82",
  "Alley Spots":             "1470337458703-46ad1756a187",
};
function getResultImg(v, photoMap) {
  if (photoMap?.[String(v.id)]) return photoMap[String(v.id)];
  if (v.image) return v.image;
  const id = CAT_IMG_FB[v.cat] || "1470337458703-46ad1756a187";
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=400&q=70`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tonight tab — Build My Night
// ─────────────────────────────────────────────────────────────────────────────
function ChipBtn({ val, current, onSet, label, icon }) {
  const active  = current === val;
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={() => onSet(val)}
      onMouseDown={()=>setPressed(true)} onMouseUp={()=>setPressed(false)} onMouseLeave={()=>setPressed(false)} onTouchStart={()=>setPressed(true)} onTouchEnd={()=>setPressed(false)}
      style={{
        ...MONO, fontSize:"0.48rem", letterSpacing:"0.09em", textTransform:"uppercase",
        display:"flex", alignItems:"center", gap:6, padding:"9px 14px", borderRadius:8,
        border:`1px solid ${active?"var(--c-gold)":"var(--c-border)"}`,
        background: active ? "rgba(201,168,76,0.1)" : "transparent",
        color: active ? "var(--c-gold)" : "var(--c-ash)",
        boxShadow: active ? "0 0 10px rgba(201,168,76,0.15)" : "none",
        cursor:"pointer", transition:"all 0.12s",
        transform: pressed ? "scale(0.91)" : "scale(1)", whiteSpace:"nowrap", flexShrink:0,
      }}
    >
      <span style={{ opacity: active ? 1 : 0.65, flexShrink:0 }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function ResultCard({ v, stopLabel, photoMap, onOpen }) {
  const [pressed, setPressed] = useState(false);
  const thumb = getResultImg(v, photoMap);
  return (
    <div
      onClick={() => onOpen && onOpen(String(v.id))}
      onMouseDown={()=>setPressed(true)} onMouseUp={()=>setPressed(false)} onMouseLeave={()=>setPressed(false)} onTouchStart={()=>setPressed(true)} onTouchEnd={()=>setPressed(false)}
      style={{ display:"flex", alignItems:"stretch", gap:12, background:"var(--c-card)", border:"1px solid var(--c-border)", borderRadius:10, overflow:"hidden", transform:pressed?"scale(0.975)":"scale(1)", transition:"transform 0.08s", cursor:"pointer" }}
    >
      {/* Thumbnail — always shows an image */}
      <div style={{ width:68, flexShrink:0, background:venueGradient(v), position:"relative", overflow:"hidden" }}>
        <img src={thumb} alt="" style={{ position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover" }}/>
      </div>
      {/* Text */}
      <div style={{ flex:1, padding:"12px 14px 12px 0", minWidth:0 }}>
        <div style={{ ...MONO,fontSize:"0.4rem",letterSpacing:"0.18em",textTransform:"uppercase",color:"var(--c-goldD)",marginBottom:3 }}>{stopLabel}</div>
        <div style={{ ...SERIF,fontSize:"1.05rem",fontWeight:600,color:"var(--c-white)",lineHeight:1.2,marginBottom:3 }}>{v.name}</div>
        <div style={{ fontSize:"0.73rem",color:"var(--c-ash)",lineHeight:1.45,marginBottom:4 }}>
          {v.desc && v.desc.length>65 ? v.desc.slice(0,65)+"…" : v.desc}
        </div>
        <div style={{ ...MONO,fontSize:"0.4rem",letterSpacing:"0.08em",textTransform:"uppercase",color:"var(--c-smoke)" }}>{v.cat} · {v.hood}</div>
      </div>
      {/* Arrow (indicates clickable) */}
      <div style={{ display:"flex",alignItems:"center",paddingRight:14,color:"var(--c-borders)" }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><line x1="2" y1="7" x2="12" y2="7"/><polyline points="8,3 12,7 8,11"/></svg>
      </div>
    </div>
  );
}

function TonightTab({ allVenues, photoMap, onOpenVenue }) {
  const [when,    setWhen]    = useState("night");
  const [who,     setWho]     = useState("date");
  const [energy,  setEnergy]  = useState("elevated");
  const [result,  setResult]  = useState(null);
  const [building,setBuilding]= useState(false);
  const [btnPrs,  setBtnPrs]  = useState(false);

  const energyDesc = {
    calm:       "Quiet & intimate — hidden bars, candlelit rooms.",
    chill:      "Casual & easygoing — no pressure, neighborhood spots.",
    elevated:   "Luxury & polished — dinner first, then a proper lounge.",
    highenergy: "Full send — nightlife, late, busy, bumping spots.",
  }[energy] || "";

  function handleBuild() {
    if (building) return;
    setBtnPrs(true); setTimeout(()=>setBtnPrs(false),100);
    setBuilding(true); setResult(null);
    setTimeout(() => {
      setResult(buildNight(when, who, energy, allVenues));
      setBuilding(false);
    }, 700);
  }

  return (
    <div style={{ padding:"24px 20px calc(80px + env(safe-area-inset-bottom))", maxWidth:680, margin:"0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom:6 }}>
        <h2 style={{ ...SERIF,fontSize:"1.9rem",fontWeight:400,color:"var(--c-white)",margin:0,lineHeight:1.1 }}>
          Build My Night ✨
        </h2>
        <p style={{ ...MONO,fontSize:"0.44rem",letterSpacing:"0.07em",color:"var(--c-smoke)",margin:"7px 0 0" }}>
          Answer three questions. We'll craft the perfect night.
        </p>
      </div>

      {/* Q1 — When */}
      <div style={{ marginTop:24, marginBottom:18 }}>
        <p style={{ ...MONO,fontSize:"0.44rem",letterSpacing:"0.16em",textTransform:"uppercase",color:"var(--c-smoke)",margin:"0 0 10px" }}>
          WHEN ARE YOU GOING OUT?
        </p>
        <div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>
          <ChipBtn val="morning"   current={when} onSet={setWhen} label="Morning"    icon={<IconSunrise/>}/>
          <ChipBtn val="afternoon" current={when} onSet={setWhen} label="Afternoon"  icon={<IconSun/>}/>
          <ChipBtn val="night"     current={when} onSet={setWhen} label="Night"      icon={<IconMoon/>}/>
        </div>
      </div>

      {/* Q2 — Who */}
      <div style={{ marginBottom:18 }}>
        <p style={{ ...MONO,fontSize:"0.44rem",letterSpacing:"0.16em",textTransform:"uppercase",color:"var(--c-smoke)",margin:"0 0 10px" }}>
          WHO'S COMING?
        </p>
        <div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>
          <ChipBtn val="solo"  current={who} onSet={setWho} label="Just Me" icon={<IconPerson/>}/>
          <ChipBtn val="date"  current={who} onSet={setWho} label="2 of Us" icon={<IconTwo/>}/>
          <ChipBtn val="group" current={who} onSet={setWho} label="Group"   icon={<IconGroup/>}/>
        </div>
      </div>

      {/* Q3 — Energy */}
      <div style={{ marginBottom:26 }}>
        <p style={{ ...MONO,fontSize:"0.44rem",letterSpacing:"0.16em",textTransform:"uppercase",color:"var(--c-smoke)",margin:"0 0 10px" }}>
          WHAT'S THE ENERGY?
        </p>
        <div style={{ display:"flex",flexWrap:"wrap",gap:8,marginBottom:8 }}>
          <ChipBtn val="calm"       current={energy} onSet={setEnergy} label="Calm"        icon={<IconLeaf/>}/>
          <ChipBtn val="chill"      current={energy} onSet={setEnergy} label="Chill"       icon={<IconSmile/>}/>
          <ChipBtn val="elevated"   current={energy} onSet={setEnergy} label="Elevated"    icon={<IconDiamond/>}/>
          <ChipBtn val="highenergy" current={energy} onSet={setEnergy} label="High Energy" icon={<IconLightning/>}/>
        </div>
        {energyDesc && (
          <p style={{ ...MONO,fontSize:"0.42rem",letterSpacing:"0.04em",color:"var(--c-smoke)",margin:0,lineHeight:1.6 }}>
            {energyDesc}
          </p>
        )}
      </div>

      {/* Build button */}
      <button
        onClick={handleBuild}
        onMouseDown={()=>setBtnPrs(true)} onMouseUp={()=>setBtnPrs(false)} onMouseLeave={()=>setBtnPrs(false)} onTouchStart={()=>setBtnPrs(true)} onTouchEnd={()=>setBtnPrs(false)}
        style={{
          ...MONO, fontSize:"0.54rem", letterSpacing:"0.16em", textTransform:"uppercase",
          width:"100%", padding:"15px 0", borderRadius:100,
          border:"1.5px solid var(--c-goldD)", color:"var(--c-gold)",
          background: building ? "rgba(201,168,76,0.06)" : "rgba(201,168,76,0.04)",
          boxShadow: building ? "none" : "0 0 18px rgba(201,168,76,0.12)",
          cursor:"pointer", transition:"all 0.12s",
          transform: btnPrs ? "scale(0.97)" : "scale(1)",
        }}
      >
        {building ? "Building your night…" : "BUILD MY NIGHT ✨"}
      </button>

      {/* Building pulse */}
      {building && (
        <div className="curating-pulse" style={{ marginTop:16, padding:"14px 18px", background:"var(--c-deep)", borderRadius:10, textAlign:"center" }}>
          <span style={{ ...MONO,fontSize:"0.46rem",letterSpacing:"0.16em",textTransform:"uppercase",color:"var(--c-goldD)" }}>
            Curating your night…
          </span>
        </div>
      )}

      {/* Results */}
      {!building && result && (
        <div className="fade-slide-up" style={{ marginTop:28 }}>
          {result.reason ? (
            <div style={{ textAlign:"center",padding:"20px 0" }}>
              <p style={{ ...SERIF,fontSize:"1rem",fontStyle:"italic",color:"var(--c-smoke)",lineHeight:1.65 }}>
                {result.reason}
              </p>
            </div>
          ) : (
            <>
              <p style={{ ...MONO,fontSize:"0.48rem",letterSpacing:"0.2em",textTransform:"uppercase",color:"var(--c-goldD)",margin:"0 0 18px" }}>
                YOUR NIGHT
              </p>
              <div style={{ position:"relative" }}>
                <div style={{ position:"absolute",left:14,top:20,bottom:20,width:2,background:"linear-gradient(180deg,var(--c-goldD) 0%,rgba(201,168,76,0.2) 100%)",borderRadius:1 }}/>
                <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
                  {result.stops.map((v,i) => (
                    <div key={v.id} style={{ display:"flex",gap:14,alignItems:"flex-start" }}>
                      <div style={{ width:30,height:30,borderRadius:"50%",border:"1.5px solid var(--c-goldD)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,...MONO,fontSize:"0.5rem",color:"var(--c-gold)",background:"var(--c-deep)",position:"relative",zIndex:1,marginTop:20 }}>
                        {i+1}
                      </div>
                      <div style={{ flex:1,minWidth:0 }}>
                        <ResultCard v={v} stopLabel={getStopLabel(i,when,energy)} photoMap={photoMap} onOpen={onOpenVenue}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Saved tab — unified card for spots, events, stays
// ─────────────────────────────────────────────────────────────────────────────
function SavedCard({ thumb, thumbGradient, title, cat, sub, onRemove, onCardClick }) {
  const [pressed, setPressed] = useState(false);
  return (
    <div
      onClick={onCardClick}
      onMouseDown={()=>setPressed(true)} onMouseUp={()=>setPressed(false)} onMouseLeave={()=>setPressed(false)} onTouchStart={()=>setPressed(true)} onTouchEnd={()=>setPressed(false)}
      style={{ display:"flex",alignItems:"stretch",background:"var(--c-card)",border:"1px solid var(--c-border)",borderRadius:10,overflow:"hidden",transform:pressed?"scale(0.975)":"scale(1)",transition:"transform 0.08s", cursor: onCardClick ? "pointer" : "default" }}
    >
      {/* Thumb */}
      <div style={{ width:68,flexShrink:0,background:thumbGradient||"var(--c-deep)",position:"relative",overflow:"hidden" }}>
        {thumb && <img src={thumb} alt="" style={{ position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover" }}/>}
      </div>
      {/* Text */}
      <div style={{ flex:1,padding:"12px 10px",minWidth:0 }}>
        <div style={{ ...MONO,fontSize:"0.41rem",letterSpacing:"0.14em",textTransform:"uppercase",color:"var(--c-goldD)",marginBottom:3 }}>{cat}</div>
        <div style={{ ...SERIF,fontSize:"1.05rem",fontWeight:600,color:"var(--c-white)",lineHeight:1.2,marginBottom:3 }}>{title}</div>
        <div style={{ ...MONO,fontSize:"0.41rem",letterSpacing:"0.06em",textTransform:"uppercase",color:"var(--c-smoke)" }}>{sub}</div>
      </div>
      {/* Actions — consistent arrow right */}
      <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,padding:"0 12px",flexShrink:0 }}>
        <button
          onClick={e=>{e.stopPropagation(); onRemove(e);}}
          style={{ background:"none",border:"none",cursor:"pointer",color:"#C05050",fontSize:"1.1rem",padding:"4px",lineHeight:1,display:"flex" }}
        >♥</button>
        <span style={{ color:"var(--c-borders)",lineHeight:0,display:"flex" }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><line x1="2" y1="7" x2="12" y2="7"/><polyline points="8,3 12,7 8,11"/></svg>
        </span>
      </div>
    </div>
  );
}

function SavedTab({ savedVenues, savedEventItems, savedHotelItems, toggleFav, onUnsaveEvent, onUnsaveHotel, onOpenVenue, photoMap }) {
  const empty = !savedVenues.length && !savedEventItems.length && !savedHotelItems.length;
  return (
    <div style={{ padding:"24px 20px calc(80px + env(safe-area-inset-bottom))", maxWidth:680, margin:"0 auto" }}>
      {empty ? (
        <div style={{ textAlign:"center",padding:"40px 0" }}>
          <p style={{ ...SERIF,fontSize:"1.1rem",fontStyle:"italic",color:"var(--c-smoke)",lineHeight:1.7 }}>
            Tap the heart on any venue, event, or hotel to save it here.
          </p>
        </div>
      ) : (
        <>
          {/* Saved Spots */}
          {savedVenues.length>0 && (
            <div style={{ marginBottom:30 }}>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14 }}>
                <p style={{ ...MONO,fontSize:"0.5rem",letterSpacing:"0.18em",textTransform:"uppercase",color:"var(--c-goldD)",margin:0 }}>SAVED SPOTS</p>
                <span style={{ ...MONO,fontSize:"0.44rem",letterSpacing:"0.08em",color:"var(--c-smoke)" }}>{savedVenues.length} saved</span>
              </div>
              <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                {savedVenues.map(v => (
                  <SavedCard
                    key={v.id}
                    thumb={photoMap?.[String(v.id)]}
                    thumbGradient={venueGradient(v)}
                    title={v.name}
                    cat={v.cat.toUpperCase()}
                    sub={v.hood}
                    onRemove={e=>{e.stopPropagation();toggleFav&&toggleFav(String(v.id));}}
                    onCardClick={()=>onOpenVenue&&onOpenVenue(String(v.id))}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Saved Events */}
          {savedEventItems.length>0 && (
            <div style={{ marginBottom:30 }}>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14 }}>
                <p style={{ ...MONO,fontSize:"0.5rem",letterSpacing:"0.18em",textTransform:"uppercase",color:"var(--c-goldD)",margin:0 }}>SAVED EVENTS</p>
                <span style={{ ...MONO,fontSize:"0.44rem",letterSpacing:"0.08em",color:"var(--c-smoke)" }}>{savedEventItems.length} saved</span>
              </div>
              <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                {savedEventItems.map(item => {
                  const cta = getTicketCTA(item);
                  const badge = item.type==="game"?"SPORTS":item.type==="concert"?"CONCERT":"EVENT";
                  const sub = [item.venue, item.date&&fmtDate(item.date)].filter(Boolean).join(" · ");
                  return (
                    <SavedCard
                      key={item.id}
                      thumb={item.image}
                      thumbGradient="linear-gradient(135deg,#0a1020 0%,#060810 100%)"
                      title={item.title||(item.team&&item.opponent?item.team+" vs. "+item.opponent:item.team||"Event")}
                      cat={badge}
                      sub={sub}
                      onRemove={e=>{e.stopPropagation();onUnsaveEvent&&onUnsaveEvent(item.id,item);}}
                      onCardClick={cta?.url ? ()=>window.open(cta.url,"_blank","noopener") : undefined}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Saved Stays */}
          {savedHotelItems.length>0 && (
            <div>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14 }}>
                <p style={{ ...MONO,fontSize:"0.5rem",letterSpacing:"0.18em",textTransform:"uppercase",color:"var(--c-goldD)",margin:0 }}>SAVED STAYS</p>
                <span style={{ ...MONO,fontSize:"0.44rem",letterSpacing:"0.08em",color:"var(--c-smoke)" }}>{savedHotelItems.length} saved</span>
              </div>
              <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                {savedHotelItems.map(h => {
                  const cta = getBookingCTA(h);
                  return (
                    <SavedCard
                      key={h.id}
                      thumb={h.image}
                      thumbGradient="linear-gradient(135deg,#0a0e1a 0%,#060810 100%)"
                      title={h.name}
                      cat={`${h.hood||"Detroit"} · Hotel`.toUpperCase()}
                      sub={h.price_from ? `From ${h.price_from}/night` : h.hood}
                      onRemove={e=>{e.stopPropagation();onUnsaveHotel&&onUnsaveHotel(h.id);}}
                      onCardClick={cta?.url ? ()=>window.open(cta.url,"_blank","noopener") : undefined}
                    />
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

// ─────────────────────────────────────────────────────────────────────────────
// Passport tab — physical passport book design
// ─────────────────────────────────────────────────────────────────────────────
function PassportTab({ visited, allVenues, navTo, overlayVenueId, onOverlayDone, onOpenVenue }) {
  const [isDark, setIsDark] = useState(() => {
    try { return document.documentElement.getAttribute("data-theme") !== "light"; } catch { return true; }
  });
  useEffect(() => {
    const obs = new MutationObserver(() => {
      setIsDark(document.documentElement.getAttribute("data-theme") !== "light");
    });
    obs.observe(document.documentElement, { attributes:true, attributeFilter:["data-theme"] });
    return () => obs.disconnect();
  }, []);

  const visitedVenues = useMemo(
    () => allVenues.filter(v => visited.includes(String(v.id))),
    [visited, allVenues]
  );

  const total     = visitedVenues.length;
  const milestone = 20;
  const pct       = total===0 ? 0 : Math.min(100, Math.round((total/milestone)*100));
  const stamps    = visitedVenues.slice(0, 16);

  // Theme-aware colors
  const pageBg     = isDark
    ? "linear-gradient(152deg,#1e1608 0%,#130e06 60%,#0f0b04 100%)"
    : "linear-gradient(152deg,#f2e8cc 0%,#e6d9b2 60%,#ddd0a8 100%)";
  const spineBg    = isDark
    ? "linear-gradient(90deg,#0c0904 0%,#181108 100%)"
    : "linear-gradient(90deg,#b8a060 0%,#c8b070 100%)";
  const lineColor  = isDark ? "rgba(201,168,76,0.05)" : "rgba(100,70,20,0.07)";
  const wmColor    = isDark ? "rgba(201,168,76,0.022)" : "rgba(100,70,20,0.045)";
  const borderClr  = isDark ? "rgba(201,168,76,0.09)"  : "rgba(100,70,20,0.2)";
  const headerText = isDark ? "rgba(201,168,76,0.42)"  : "rgba(80,50,15,0.52)";
  const subText    = isDark ? "var(--c-smoke)"          : "rgba(70,45,10,0.6)";
  const countColor = isDark ? "var(--c-white)"          : "rgba(50,30,5,0.88)";
  const goldClr    = isDark ? "var(--c-gold)"           : "rgba(120,85,20,0.85)";
  const spineText  = isDark ? "rgba(201,168,76,0.22)"   : "rgba(60,35,8,0.3)";
  const stitchClr  = isDark ? "rgba(201,168,76,0.14)"   : "rgba(80,50,15,0.2)";
  const progressBg = isDark ? "rgba(201,168,76,0.1)"    : "rgba(100,70,20,0.12)";
  const progressFg = isDark
    ? "linear-gradient(90deg,var(--c-goldD),var(--c-gold))"
    : "linear-gradient(90deg,rgba(120,85,20,0.65),rgba(160,115,30,0.85))";

  // Stamp area height: 2 columns, each row ~105px apart, plus padding
  const stampRows = Math.max(1, Math.ceil(stamps.length / 2));
  const stampAreaH = stampRows * 108 + 60;

  return (
    <div style={{ padding:"16px 20px calc(80px + env(safe-area-inset-bottom))", maxWidth:680, margin:"0 auto" }}>

      {/* Stamp overlay — only fires when newly earned */}
      {overlayVenueId && (
        <StampOverlay
          venue={allVenues.find(v=>String(v.id)===String(overlayVenueId)) || {id:overlayVenueId,name:"Venue",hood:"Detroit",cat:"Dinner"}}
          onDone={onOverlayDone}
        />
      )}

      {/* Passport book */}
      <div style={{
        display:"flex",
        borderRadius:14,
        overflow:"hidden",
        minHeight:"calc(100dvh - 240px)",
        boxShadow: isDark
          ? "0 20px 70px rgba(0,0,0,0.8), 0 2px 12px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(201,168,76,0.07)"
          : "0 20px 70px rgba(0,0,0,0.38), 0 2px 12px rgba(0,0,0,0.22)",
      }}>

        {/* Left spine / binding */}
        <div style={{
          width:24, flexShrink:0,
          background:spineBg,
          borderRight:`1px solid ${borderClr}`,
          position:"relative",
          display:"flex", flexDirection:"column", alignItems:"center",
          paddingTop:16, paddingBottom:16,
          overflow:"hidden",
        }}>
          {/* Spine label text (vertical) */}
          <div style={{
            writingMode:"vertical-rl", textOrientation:"mixed",
            ...MONO, fontSize:"0.21rem", letterSpacing:"0.22em", textTransform:"uppercase",
            color:spineText, transform:"rotate(180deg)",
            flex:1, display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            DETROIT
          </div>
          {/* Binding stitch marks */}
          {[0,1,2,3,4,5,6,7].map(i => (
            <div key={i} style={{
              position:"absolute", width:10, height:1.5, borderRadius:1,
              background:stitchClr,
              top:(40 + i * 55)+"px", left:"50%", transform:"translateX(-50%)",
            }}/>
          ))}
          {/* Binding crease lines */}
          <div style={{ position:"absolute",inset:0,backgroundImage:`repeating-linear-gradient(180deg,transparent 0px,transparent 6px,rgba(0,0,0,0.04) 6px,rgba(0,0,0,0.04) 7px)`,pointerEvents:"none" }}/>
        </div>

        {/* Main page */}
        <div style={{ flex:1, background:pageBg, position:"relative", overflow:"hidden", minWidth:0, display:"flex", flexDirection:"column" }}>

          {/* Horizontal ruled lines */}
          <div style={{ position:"absolute",inset:0,pointerEvents:"none",backgroundImage:`repeating-linear-gradient(0deg,transparent 0px,transparent 28px,${lineColor} 28px,${lineColor} 29px)` }}/>
          {/* Vertical column lines (security paper) */}
          <div style={{ position:"absolute",inset:0,pointerEvents:"none",backgroundImage:`repeating-linear-gradient(90deg,transparent 0px,transparent 55px,${isDark?"rgba(201,168,76,0.018)":"rgba(100,70,20,0.025)"} 55px,${isDark?"rgba(201,168,76,0.018)":"rgba(100,70,20,0.025)"} 56px)` }}/>
          {/* Diagonal security lines */}
          <div style={{ position:"absolute",inset:0,pointerEvents:"none",backgroundImage:`repeating-linear-gradient(47deg,transparent 0px,transparent 18px,${isDark?"rgba(201,168,76,0.012)":"rgba(100,70,20,0.018)"} 18px,${isDark?"rgba(201,168,76,0.012)":"rgba(100,70,20,0.018)"} 18.5px)` }}/>

          {/* Circular watermark rings */}
          <div style={{ position:"absolute",top:"45%",left:"50%",transform:"translate(-50%,-50%)",width:260,height:260,borderRadius:"50%",border:`1px solid ${wmColor}`,pointerEvents:"none" }}/>
          <div style={{ position:"absolute",top:"45%",left:"50%",transform:"translate(-50%,-50%)",width:210,height:210,borderRadius:"50%",border:`1px solid ${wmColor}`,pointerEvents:"none" }}/>
          <div style={{ position:"absolute",top:"45%",left:"50%",transform:"translate(-50%,-50%)",width:155,height:155,borderRadius:"50%",border:`1px solid ${wmColor}`,pointerEvents:"none" }}/>

          {/* DETROIT diagonal watermark */}
          <div style={{ position:"absolute",top:"42%",left:"50%",transform:"translate(-50%,-50%) rotate(-25deg)",...MONO,fontSize:"3.2rem",letterSpacing:"0.26em",color:wmColor,textTransform:"uppercase",whiteSpace:"nowrap",pointerEvents:"none",userSelect:"none" }}>
            DETROIT
          </div>

          {/* Header — integrated progress, no separate card */}
          <div style={{ padding:"18px 20px 14px", borderBottom:`1px solid ${borderClr}`, position:"relative", zIndex:1 }}>
            <div style={{ ...MONO,fontSize:"0.28rem",letterSpacing:"0.32em",textTransform:"uppercase",color:headerText,marginBottom:4 }}>
              EXCLUSIVE DETROIT
            </div>
            <div style={{ ...SERIF,fontSize:"1.12rem",fontWeight:400,color:goldClr,marginBottom:10 }}>
              Insider Passport
            </div>
            {/* Progress row */}
            <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:8 }}>
              <span style={{ ...SERIF,fontSize:"2rem",fontWeight:400,color:countColor,lineHeight:1 }}>{total}</span>
              <span style={{ fontSize:"0.82rem",color:subText,fontWeight:300,flex:1 }}>
                venue{total!==1?"s":""} visited
              </span>
              <span style={{ ...MONO,fontSize:"0.38rem",letterSpacing:"0.08em",color:headerText,flexShrink:0 }}>
                {stamps.length} / 16 stamps
              </span>
            </div>
            <div style={{ background:progressBg, borderRadius:100, height:2, overflow:"hidden", marginBottom:6 }}>
              <div style={{ height:"100%",width:pct+"%",background:progressFg,borderRadius:100,transition:"width 0.7s ease" }}/>
            </div>
            <p style={{ ...MONO,fontSize:"0.38rem",letterSpacing:"0.05em",color:subText,margin:0 }}>
              {total===0 ? "Open any venue and tap ✓ visited to begin" : `${pct}% toward your first ${milestone} discoveries`}
            </p>
          </div>

          {/* Stamp scatter area — flex:1 so it fills the passport height */}
          <div style={{ flex:1, position:"relative", padding:"14px 10px 18px", zIndex:1, minHeight: stampAreaH }}>
            {stamps.length === 0 ? (
              <p style={{ ...MONO,fontSize:"0.42rem",letterSpacing:"0.08em",color:`rgba(201,168,76,0.2)`,textAlign:"center",paddingTop:28,marginBottom:0 }}>
                Visit venues and mark them as visited to earn stamps
              </p>
            ) : (
              <div style={{ display:"flex",flexWrap:"wrap",gap:"4px 6px",justifyContent:"space-around",alignItems:"flex-start" }}>
                {stamps.map((v, i) => (
                  <div
                    key={String(v.id)}
                    style={{ transform:`translateY(${SCATTER_Y[i] || 0}px)`, flexShrink:0 }}
                  >
                    <VenueStamp v={v} index={i} isNew={false} onOpen={onOpenVenue}/>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Page footer */}
          <div style={{ padding:"12px 20px 18px", borderTop:`1px solid ${borderClr}`, textAlign:"center", position:"relative", zIndex:1 }}>
            <div style={{ ...MONO,fontSize:"0.26rem",letterSpacing:"0.24em",textTransform:"uppercase",color:headerText }}>
              YOUR JOURNEY · YOUR CITY · YOUR STAMPS
            </div>
          </div>
        </div>
      </div>

      {/* Empty state CTA */}
      {total === 0 && (
        <div style={{ textAlign:"center",marginTop:24 }}>
          <button
            onClick={()=>navTo("explore")}
            style={{ ...MONO,fontSize:"0.5rem",letterSpacing:"0.14em",textTransform:"uppercase",color:"var(--c-gold)",border:"1px solid var(--c-goldD)",padding:"10px 22px",borderRadius:100,background:"transparent",cursor:"pointer" }}
          >
            Explore Venues →
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root — MyDetroit
// ─────────────────────────────────────────────────────────────────────────────
const TABS = [
  { id:"tonight",  label:"Tonight"  },
  { id:"saved",    label:"Saved"    },
  { id:"passport", label:"Passport" },
];

export default function MyDetroit({
  visited, taste, onTasteChange, onOpenVenue, navTo, allVenues,
  savedVenues, savedEventItems, savedHotelItems,
  toggleFav, onUnsaveEvent, onUnsaveHotel, photoMap,
}) {
  const [subTab, setSubTab] = useState("tonight");

  // Stamp overlay — only fires when visited array gains a new entry
  const prevVisitedRef = useRef(null);
  const [overlayId, setOverlayId] = useState(null);

  useEffect(() => {
    if (prevVisitedRef.current === null) {
      prevVisitedRef.current = new Set(visited);
      return;
    }
    const prev = prevVisitedRef.current;
    const added = visited.filter(id => !prev.has(id));
    if (added.length > 0) {
      setOverlayId(added[0]);
      added.forEach(id => prev.add(id));
    }
  }, [visited]);

  return (
    <div>
      {/* Section header + tabs */}
      <div style={{ background:"var(--c-deep)", padding:"20px 20px 0", borderBottom:"1px solid var(--c-border)" }}>
        <div style={{ maxWidth:680, margin:"0 auto" }}>
          <p style={{ ...MONO,fontSize:"0.52rem",letterSpacing:"0.22em",textTransform:"uppercase",color:"var(--c-gold)",margin:"0 0 5px" }}>Personal Guide</p>
          <h2 style={{ ...SERIF,fontSize:"clamp(1.8rem,5vw,2.8rem)",fontWeight:400,color:"var(--c-white)",margin:"0 0 4px" }}>Itinerary</h2>
          <p style={{ fontSize:"0.84rem",color:"var(--c-smoke)",margin:0 }}>Curated to how you explore Detroit.</p>
        </div>
        <div style={{ maxWidth:680, margin:"18px auto 0" }}>
          <div style={{ display:"flex" }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setSubTab(t.id)}
                style={{ ...MONO,fontSize:"0.52rem",letterSpacing:"0.12em",textTransform:"uppercase",padding:"12px 18px",background:"none",border:"none",cursor:"pointer",color:subTab===t.id?"var(--c-gold)":"var(--c-smoke)",borderBottom:subTab===t.id?"2px solid var(--c-gold)":"2px solid transparent",transition:"color 0.15s,border-color 0.15s",whiteSpace:"nowrap",flexShrink:0 }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {subTab==="tonight"  && <TonightTab allVenues={allVenues} photoMap={photoMap} onOpenVenue={onOpenVenue}/>}
      {subTab==="saved"    && <SavedTab savedVenues={savedVenues||[]} savedEventItems={savedEventItems||[]} savedHotelItems={savedHotelItems||[]} toggleFav={toggleFav} onUnsaveEvent={onUnsaveEvent} onUnsaveHotel={onUnsaveHotel} onOpenVenue={onOpenVenue} photoMap={photoMap}/>}
      {subTab==="passport" && <PassportTab visited={visited} allVenues={allVenues} navTo={navTo} overlayVenueId={overlayId} onOverlayDone={()=>setOverlayId(null)} onOpenVenue={onOpenVenue}/>}
    </div>
  );
}
