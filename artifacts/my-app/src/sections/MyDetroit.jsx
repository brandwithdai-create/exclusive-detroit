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
// Passport stamp icons — category-specific line art (replaces building SVGs)
// ─────────────────────────────────────────────────────────────────────────────
const CAT_ICON = {
  "Cocktail Lounges":        "cocktail",
  "Hidden Bars":             "bottle",
  "Rooftops":                "rooftop",
  "Nightlife":               "disco",
  "Coffee Shops & Bakeries": "coffee",
  "Dinner":                  "dining",
  "Breakfast":               "sunrise",
  "Sports Bars":             "trophy",
  "Happy Hour":              "beer",
  "Lunch":                   "plate",
  "Outdoor Activities":      "tree",
  "Alley Spots":             "door",
};

function StampIconSVG({ cat, ink }) {
  const type = CAT_ICON[cat] || "building";
  const s = { stroke:ink, fill:"none", strokeWidth:1.3, strokeLinecap:"round", strokeLinejoin:"round" };
  const f = { fill:ink, stroke:"none" };
  switch(type) {
    case "cocktail": return (
      <svg viewBox="0 0 40 32" width="40" height="32">
        <path d="M7,4 L33,4 L20,20 L20,27" style={s}/>
        <line x1="13" y1="27" x2="27" y2="27" style={s}/>
        <path d="M13,11 L20,18" style={{...s,strokeWidth:.75,opacity:.5}}/>
        <ellipse cx="20" cy="9" rx="7" ry="2.5" style={{...s,strokeWidth:.6,opacity:.32}}/>
      </svg>
    );
    case "bottle": return (
      <svg viewBox="0 0 40 32" width="40" height="32">
        <path d="M16,29 L16,20 L12,14 L12,6 L28,6 L28,14 L24,20 L24,29 Z" style={s}/>
        <line x1="12" y1="10" x2="28" y2="10" style={{...s,strokeWidth:.7,opacity:.5}}/>
        <rect x="16" y="3" width="8" height="3" rx="1" style={s}/>
        <ellipse cx="20" cy="23" rx="2.5" ry="1.5" style={{...s,strokeWidth:.6,opacity:.4}}/>
      </svg>
    );
    case "rooftop": return (
      <svg viewBox="0 0 40 32" width="40" height="32">
        <polyline points="2,26 2,20 6,20 6,22 10,22 10,14 16,14 16,22 20,22 20,15 26,15 26,22 30,22 30,20 36,20 36,22 38,22 38,26" style={{...s,strokeWidth:.85}}/>
        <line x1="2" y1="26" x2="38" y2="26" style={s}/>
        {[10,20,30].map(x=><line key={x} x1={x} y1="10" x2={x} y2="7" style={{...s,strokeWidth:.6,opacity:.5}}/>)}
      </svg>
    );
    case "disco": return (
      <svg viewBox="0 0 40 32" width="40" height="32">
        <circle cx="20" cy="16" r="9" style={s}/>
        <ellipse cx="20" cy="16" rx="3.5" ry="9" style={{...s,strokeWidth:.6,opacity:.4}}/>
        <line x1="20" y1="7" x2="20" y2="25" style={{...s,strokeWidth:.45,opacity:.28}}/>
        <line x1="11" y1="16" x2="29" y2="16" style={{...s,strokeWidth:.45,opacity:.28}}/>
        <line x1="20" y1="3" x2="20" y2="5" style={{...s,strokeWidth:.8,opacity:.7}}/>
        <line x1="29" y1="6" x2="31" y2="4" style={{...s,strokeWidth:.7,opacity:.6}}/>
        <line x1="32" y1="16" x2="35" y2="16" style={{...s,strokeWidth:.7,opacity:.55}}/>
      </svg>
    );
    case "coffee": return (
      <svg viewBox="0 0 40 32" width="40" height="32">
        <path d="M7,12 L7,26 Q7,30 11,30 L27,30 Q31,30 31,26 L31,12 Z" style={s}/>
        <path d="M31,16 Q38,16 38,22 Q38,28 31,28" style={s}/>
        <line x1="7" y1="12" x2="31" y2="12" style={s}/>
        <path d="M13,7 Q13,3 17,3 Q17,7 21,7 Q21,3 25,3" style={{...s,strokeWidth:.75,opacity:.52}}/>
      </svg>
    );
    case "dining": return (
      <svg viewBox="0 0 40 32" width="40" height="32">
        <line x1="13" y1="2" x2="13" y2="30" style={s}/>
        <path d="M9,2 L9,13 Q9,17 13,17" style={s}/>
        <path d="M17,2 L17,13 Q17,17 13,17" style={s}/>
        <path d="M26,2 Q33,2 33,10 Q33,16 26,17 L26,30" style={s}/>
      </svg>
    );
    case "sunrise": return (
      <svg viewBox="0 0 40 32" width="40" height="32">
        <path d="M4,26 Q4,14 20,14 Q36,14 36,26" style={s}/>
        <line x1="20" y1="10" x2="20" y2="4" style={s}/>
        <line x1="29" y1="13" x2="33" y2="9" style={{...s,opacity:.7}}/>
        <line x1="11" y1="13" x2="7" y2="9" style={{...s,opacity:.7}}/>
        <line x1="34" y1="20" x2="38" y2="20" style={{...s,opacity:.6}}/>
        <line x1="6" y1="20" x2="2" y2="20" style={{...s,opacity:.6}}/>
        <line x1="2" y1="29" x2="38" y2="29" style={{...s,strokeWidth:.65,opacity:.42}}/>
      </svg>
    );
    case "trophy": return (
      <svg viewBox="0 0 40 32" width="40" height="32">
        <path d="M13,3 L13,18 Q13,26 20,26 Q27,26 27,18 L27,3 Z" style={s}/>
        <path d="M13,8 Q7,8 7,14 Q7,19 13,19" style={s}/>
        <path d="M27,8 Q33,8 33,14 Q33,19 27,19" style={s}/>
        <line x1="16" y1="26" x2="24" y2="26" style={s}/>
        <rect x="14" y="26" width="12" height="4" rx="1" style={s}/>
      </svg>
    );
    case "beer": return (
      <svg viewBox="0 0 40 32" width="40" height="32">
        <path d="M10,10 L10,28 Q10,31 14,31 L26,31 Q30,31 30,28 L30,10 Z" style={s}/>
        <line x1="10" y1="10" x2="30" y2="10" style={s}/>
        <path d="M30,14 Q37,14 37,20 Q37,25 30,25" style={s}/>
        <path d="M12,8 L12,5 Q14,3 16,5 Q18,3 20,5 Q22,3 24,5 Q26,3 28,5 L28,8" style={{...s,strokeWidth:.65,opacity:.48}}/>
      </svg>
    );
    case "plate": return (
      <svg viewBox="0 0 40 32" width="40" height="32">
        <ellipse cx="20" cy="22" rx="16" ry="8" style={s}/>
        <ellipse cx="20" cy="22" rx="10" ry="5" style={{...s,strokeWidth:.65,opacity:.42}}/>
        <path d="M12,18 Q12,8 20,8 Q28,8 28,18" style={s}/>
      </svg>
    );
    case "tree": return (
      <svg viewBox="0 0 40 32" width="40" height="32">
        <path d="M20,3 L32,18 L25,18 L32,27 L20,27 L8,27 L15,18 L8,18 Z" style={s}/>
        <line x1="20" y1="27" x2="20" y2="31" style={s}/>
      </svg>
    );
    case "door": return (
      <svg viewBox="0 0 40 32" width="40" height="32">
        <path d="M9,30 L9,8 Q9,3 20,3 Q31,3 31,8 L31,30 Z" style={s}/>
        <line x1="9" y1="30" x2="31" y2="30" style={s}/>
        <circle cx="27" cy="17" r="1.5" style={f}/>
        <path d="M9,8 Q20,5 31,8" style={{...s,strokeWidth:.55,opacity:.38}}/>
      </svg>
    );
    default: return (
      <svg viewBox="0 0 40 32" width="40" height="32">
        <polyline points="4,20 20,6 36,20" style={s}/>
        <rect x="4" y="20" width="32" height="10" style={s}/>
        <rect x="9" y="23" width="6" height="7" style={{...s,opacity:.55}}/>
        <rect x="25" y="23" width="6" height="7" style={{...s,opacity:.55}}/>
        <rect x="17" y="23" width="6" height="5" style={{...s,opacity:.5}}/>
      </svg>
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Stamp frame shapes — 10 unique outlines with authentic ink roughness filter
// ─────────────────────────────────────────────────────────────────────────────
const STAMP_DIMS = [
  {w:96,  h:96 }, // 0: circle
  {w:140, h:82 }, // 1: landscape rounded rect
  {w:112, h:100}, // 2: diamond
  {w:110, h:100}, // 3: hexagon
  {w:142, h:80 }, // 4: wide oval
  {w:98,  h:120}, // 5: portrait rounded rect
  {w:106, h:106}, // 6: octagon
  {w:92,  h:114}, // 7: tall oval
  {w:108, h:110}, // 8: arch / shield
  {w:112, h:100}, // 9: squircle
];

function StampOutline({ shape, w, h, ink, seed }) {
  const fId = `ink-${seed}`;
  const s1 = { stroke:ink, fill:"none", strokeWidth:1.55, strokeLinecap:"round", strokeLinejoin:"round" };
  const s2 = { stroke:ink, fill:"none", strokeWidth:0.65, strokeLinecap:"round", strokeLinejoin:"round" };
  let inner;
  switch(shape) {
    case 0:
      inner = (
        <g filter={`url(#${fId})`}>
          <circle cx={w/2} cy={h/2} r={w/2-5} style={s1}/>
          <circle cx={w/2} cy={h/2} r={w/2-13} style={{...s2,strokeDasharray:"4 3"}}/>
        </g>
      ); break;
    case 1:
      inner = (
        <g filter={`url(#${fId})`}>
          <rect x={5} y={5} width={w-10} height={h-10} rx={10} style={s1}/>
          <rect x={11} y={11} width={w-22} height={h-22} rx={7} style={s2}/>
        </g>
      ); break;
    case 2:
      inner = (
        <g filter={`url(#${fId})`}>
          <path d={`M${w/2},5 L${w-5},${h/2} L${w/2},${h-5} L5,${h/2} Z`} style={s1}/>
          <path d={`M${w/2},16 L${w-16},${h/2} L${w/2},${h-16} L16,${h/2} Z`} style={s2}/>
        </g>
      ); break;
    case 3: {
      const cx=w/2, cy=h/2, r=Math.min(w,h)/2-5, r2=r-10;
      const pts  = Array.from({length:6},(_,i)=>{const a=(i*60-30)*Math.PI/180;return `${(cx+r*Math.cos(a)).toFixed(1)},${(cy+r*Math.sin(a)).toFixed(1)}`;}).join(" ");
      const pts2 = Array.from({length:6},(_,i)=>{const a=(i*60-30)*Math.PI/180;return `${(cx+r2*Math.cos(a)).toFixed(1)},${(cy+r2*Math.sin(a)).toFixed(1)}`;}).join(" ");
      inner = (
        <g filter={`url(#${fId})`}>
          <polygon points={pts} style={s1}/>
          <polygon points={pts2} style={s2}/>
        </g>
      ); break;
    }
    case 4:
      inner = (
        <g filter={`url(#${fId})`}>
          <ellipse cx={w/2} cy={h/2} rx={w/2-5} ry={h/2-4} style={s1}/>
          <ellipse cx={w/2} cy={h/2} rx={w/2-13} ry={h/2-11} style={{...s2,strokeDasharray:"3 3"}}/>
        </g>
      ); break;
    case 5:
      inner = (
        <g filter={`url(#${fId})`}>
          <rect x={5} y={5} width={w-10} height={h-10} rx={13} style={s1}/>
          <rect x={12} y={12} width={w-24} height={h-24} rx={9} style={s2}/>
        </g>
      ); break;
    case 6: {
      const tr=Math.round(Math.min(w,h)*0.195);
      const pts =`${tr},3 ${w-tr},3 ${w-3},${tr} ${w-3},${h-tr} ${w-tr},${h-3} ${tr},${h-3} 3,${h-tr} 3,${tr}`;
      const t2=tr+9;
      const pts2=`${t2},11 ${w-t2},11 ${w-11},${t2} ${w-11},${h-t2} ${w-t2},${h-11} ${t2},${h-11} 11,${h-t2} 11,${t2}`;
      inner = (
        <g filter={`url(#${fId})`}>
          <polygon points={pts} style={s1}/>
          <polygon points={pts2} style={s2}/>
        </g>
      ); break;
    }
    case 7:
      inner = (
        <g filter={`url(#${fId})`}>
          <ellipse cx={w/2} cy={h/2} rx={w/2-5} ry={h/2-5} style={s1}/>
          <ellipse cx={w/2} cy={h/2} rx={w/2-13} ry={h/2-13} style={{...s2,strokeDasharray:"3 2"}}/>
        </g>
      ); break;
    case 8: {
      const cx=w/2, qy=(h*0.44).toFixed(1), qy2=(h*0.45).toFixed(1);
      inner = (
        <g filter={`url(#${fId})`}>
          <path d={`M6,${h-5} L6,${qy} Q6,5 ${cx},5 Q${w-6},5 ${w-6},${qy} L${w-6},${h-5} Z`} style={s1}/>
          <path d={`M13,${h-11} L13,${qy2} Q13,13 ${cx},13 Q${w-13},13 ${w-13},${qy2} L${w-13},${h-11} Z`} style={s2}/>
        </g>
      ); break;
    }
    default:
      inner = (
        <g filter={`url(#${fId})`}>
          <rect x={5} y={5} width={w-10} height={h-10} rx={20} style={s1}/>
          <rect x={12} y={12} width={w-24} height={h-24} rx={14} style={s2}/>
        </g>
      );
  }
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position:"absolute",inset:0,overflow:"visible",pointerEvents:"none"}}>
      <defs>
        <filter id={fId} x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="3" seed={seed} result="noise"/>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.6" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
      </defs>
      {inner}
    </svg>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// Stamp color + rotation helpers
// ─────────────────────────────────────────────────────────────────────────────
// Vintage ink colors — authentic passport stamp palette
const STAMP_INKS = ["#1C2B6E","#7A1C1C","#2A4A0C","#0C3A3A","#38186A","#4A1E06","#1A3158","#1C3A1C"];
const STAMP_ROTS = [-7,5,-4,8,-9,3,-6,7,-2,6,-8,4,-5,9,-3,6];

// Y scatter offsets — organic vertical offset for each stamp slot
const SCATTER_Y = [0,-14,8,-6,14,-10,4,-18,6,-12,2,-8,10,-4,16,-10];

function getStampInk(n) { return STAMP_INKS[n % STAMP_INKS.length]; }


// ─────────────────────────────────────────────────────────────────────────────
// Short category labels for stamps
// ─────────────────────────────────────────────────────────────────────────────
const CAT_SHORT = {
  "Cocktail Lounges":        "COCKTAIL LOUNGE",
  "Hidden Bars":             "SPEAKEASY",
  "Rooftops":                "ROOFTOP",
  "Nightlife":               "NIGHTLIFE",
  "Coffee Shops & Bakeries": "CAFÉ",
  "Dinner":                  "DINING",
  "Breakfast":               "BREAKFAST",
  "Sports Bars":             "SPORTS BAR",
  "Happy Hour":              "HAPPY HOUR",
  "Lunch":                   "LUNCH",
  "Outdoor Activities":      "OUTDOORS",
  "Alley Spots":             "ALLEY SPOT",
};
const ORNS = ["★","✦","◆","✿"];

// ─────────────────────────────────────────────────────────────────────────────
// VenueStamp — ink-on-paper passport stamp, unique per venue
// ─────────────────────────────────────────────────────────────────────────────
function VenueStamp({ v, index, isNew, onOpen, date: propDate }) {
  const n = parseInt(String(v.id).replace(/\D/g,"")) || 0;
  const ink = getStampInk(n);
  const rot = STAMP_ROTS[n % STAMP_ROTS.length];
  const offsetX = ((n*7)%9)-4;
  const offsetY = ((n*13)%7)-3;
  const shape = n % 10;
  const { w, h } = STAMP_DIMS[shape];
  const date = propDate || "VISITED";
  const isLandscape = shape===1||shape===4;
  const isPortrait  = shape===5||shape===7;

  return (
    <div
      className={isNew ? "stamp-press" : undefined}
      onClick={() => onOpen && onOpen(String(v.id))}
      style={{
        width:w, height:h, flexShrink:0, position:"relative",
        transform:`rotate(${rot}deg) translate(${offsetX}px,${offsetY}px)`,
        cursor: onOpen ? "pointer" : "default",
      }}
    >
      {/* SVG stamp frame with ink roughness filter */}
      <StampOutline shape={shape} w={w} h={h} ink={ink} seed={n}/>
      {/* Content */}
      <div style={{
        position:"absolute", inset:0, display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", boxSizing:"border-box",
        padding: isLandscape ? "6px 18px" : isPortrait ? "14px 8px" : "10px",
        gap:2, textAlign:"center",
      }}>
        <div style={{lineHeight:0, opacity:0.84, transform:"scale(0.76)", transformOrigin:"center"}}>
          <StampIconSVG cat={v.cat} ink={ink}/>
        </div>
        <div style={{...SERIF, fontSize:isPortrait?"0.78rem":"0.72rem", fontWeight:700, color:ink, lineHeight:1.1, textTransform:"uppercase", letterSpacing:"0.04em", wordBreak:"break-word"}}>
          {stampName(v.name)}
        </div>
        <div style={{...MONO, fontSize:"0.34rem", letterSpacing:"0.14em", color:ink, opacity:0.70, textTransform:"uppercase"}}>
          {v.hood.toUpperCase()}
        </div>
        <div style={{...MONO, fontSize:"0.28rem", letterSpacing:"0.08em", color:ink, opacity:0.48}}>
          {date}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stamp overlay — full-screen press animation (only when newly earned)
// ─────────────────────────────────────────────────────────────────────────────
function StampOverlay({ venue, onDone }) {
  const n = parseInt(String(venue.id).replace(/\D/g,"")) || 0;
  const ink = getStampInk(n);
  const rot = STAMP_ROTS[n % STAMP_ROTS.length];
  const shape = n % 10;
  const { w: sw, h: sh } = STAMP_DIMS[shape];
  const scale = Math.min(280/sw, 240/sh);
  const W = Math.round(sw*scale), H = Math.round(sh*scale);
  const catLabel = CAT_SHORT[venue.cat] || venue.cat?.toUpperCase() || "DETROIT";
  const today = new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}).toUpperCase();
  useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, [onDone]);
  const isLandscape = shape===1||shape===4;
  const isPortrait  = shape===5||shape===7;
  return (
    <div style={{position:"fixed",inset:0,zIndex:9990,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none",background:"rgba(6,4,2,0.70)"}}>
      <div className="stamp-overlay-press" style={{position:"relative",width:W,height:H,transform:`rotate(${rot*0.6}deg)`}}>
        <StampOutline shape={shape} w={W} h={H} ink={ink} seed={n+100}/>
        <div style={{
          position:"absolute", inset:0, display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", gap:5, textAlign:"center",
          padding: isLandscape ? "10px 24px" : isPortrait ? "20px 12px" : "14px",
        }}>
          <div style={{...MONO,fontSize:"0.34rem",letterSpacing:"0.22em",textTransform:"uppercase",color:ink,opacity:0.68}}>
            ✦ EXCLUSIVE DETROIT ✦
          </div>
          <div style={{lineHeight:0, opacity:0.86, transform:"scale(1.0)", transformOrigin:"center"}}>
            <StampIconSVG cat={venue.cat} ink={ink}/>
          </div>
          <div style={{...SERIF,fontSize:"1.4rem",fontWeight:700,color:ink,lineHeight:1.08,textTransform:"uppercase",letterSpacing:"0.04em"}}>
            {stampName(venue.name)}
          </div>
          <div style={{...MONO,fontSize:"0.40rem",letterSpacing:"0.18em",textTransform:"uppercase",color:ink,opacity:0.72}}>
            {venue.hood.toUpperCase()}
          </div>
          <div style={{...MONO,fontSize:"0.30rem",letterSpacing:"0.10em",textTransform:"uppercase",color:ink,opacity:0.52}}>
            {catLabel}
          </div>
          <div style={{...MONO,fontSize:"0.28rem",letterSpacing:"0.08em",color:ink,opacity:0.40}}>
            {today}
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
        ...MONO, fontSize:"0.58rem", letterSpacing:"0.09em", textTransform:"uppercase",
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

// ── Dynamic concierge summary sentence ───────────────────────────────────────
function buildNightSummary(when, who, energy) {
  const timeWord = { morning:"morning coffee and brunch run", afternoon:"afternoon in Detroit", night:"late-night experience in Detroit" }[when] || "night in Detroit";
  const whoSuffix = { solo:"— just you.", date:"for two.", group:"for a group." }[who] || "for you.";
  const vibe = { calm:"a calm, intimate", chill:"a relaxed", elevated:"a polished, elevated", highenergy:"a high-energy" }[energy] || "an elevated";
  if (!when && !who && !energy) return "Answer the questions above and we'll craft your perfect Detroit night.";
  if (who === "solo" && energy === "calm") return `We're building a quiet solo ${timeWord} ${whoSuffix}`;
  return `We're building ${vibe} ${timeWord} ${whoSuffix}`;
}

function TonightTab({ allVenues, photoMap, onOpenVenue, onSavePlan }) {
  const [when,    setWhen]    = useState("night");
  const [who,     setWho]     = useState("date");
  const [energy,  setEnergy]  = useState("elevated");
  const [result,  setResult]  = useState(null);
  const [building,setBuilding]= useState(false);
  const [btnPrs,  setBtnPrs]  = useState(false);

  function handleBuild() {
    if (building) return;
    setBtnPrs(true); setTimeout(()=>setBtnPrs(false),100);
    setBuilding(true); setResult(null);
    setTimeout(() => {
      setResult(buildNight(when, who, energy, allVenues));
      setBuilding(false);
    }, 700);
  }

  // Step number circle
  const StepNum = ({n}) => (
    <div style={{ width:38,height:38,borderRadius:"50%",border:"1.5px solid var(--c-gold)",background:"rgba(201,168,76,0.12)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,...MONO,fontSize:"0.7rem",fontWeight:600,color:"var(--c-gold)",zIndex:1,position:"relative" }}>
      {n}
    </div>
  );

  return (
    <div style={{ position:"relative", backgroundImage:"url('/detroit-skyline.jpg')", backgroundSize:"cover", backgroundPosition:"50% 62%", minHeight:"100vh" }}>
      {/* Cinematic overlay — no blur to keep image crisp */}
      <div style={{ position:"absolute",inset:0,background:"var(--c-tonight-overlay)",pointerEvents:"none",zIndex:0 }}/>
      <div style={{ position:"relative",zIndex:1, padding:"28px 20px calc(90px + env(safe-area-inset-bottom))", maxWidth:680, margin:"0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <p style={{ ...MONO,fontSize:"0.44rem",letterSpacing:"0.22em",textTransform:"uppercase",color:"var(--c-gold)",margin:"0 0 6px",opacity:0.8 }}>Personal Concierge</p>
        <h2 style={{ ...SERIF,fontSize:"2.2rem",fontWeight:400,color:"var(--c-white)",margin:0,lineHeight:1.1 }}>
          Build My Night ✨
        </h2>
        <p style={{ ...MONO,fontSize:"0.44rem",letterSpacing:"0.07em",color:"var(--c-smoke)",margin:"8px 0 0" }}>
          Answer three questions. We'll craft the perfect night.
        </p>
      </div>

      {/* Step flow — numbered 1→2→3 with dotted connector */}
      <div style={{ position:"relative" }}>
        {/* Dotted connector line behind the circles */}
        <div style={{ position:"absolute",left:18,top:38,bottom:38,borderLeft:"2px dashed rgba(201,168,76,0.35)",zIndex:0,pointerEvents:"none" }}/>

        {/* Q1 — When */}
        <div style={{ display:"flex",gap:14,alignItems:"flex-start",marginBottom:18 }}>
          <StepNum n={1}/>
          <div style={{ flex:1,background:"var(--c-tonight-glass)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",border:"1px solid var(--c-tonight-glass-bdr)",borderRadius:14,padding:"16px 18px",marginTop:0 }}>
            <p style={{ ...MONO,fontSize:"0.58rem",letterSpacing:"0.14em",textTransform:"uppercase",color:"var(--c-white)",margin:"0 0 12px",opacity:0.9 }}>
              When does your night begin?
            </p>
            <div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>
              <ChipBtn val="morning"   current={when} onSet={setWhen} label="Morning"    icon={<IconSunrise/>}/>
              <ChipBtn val="afternoon" current={when} onSet={setWhen} label="Afternoon"  icon={<IconSun/>}/>
              <ChipBtn val="night"     current={when} onSet={setWhen} label="Night"      icon={<IconMoon/>}/>
            </div>
          </div>
        </div>

        {/* Q2 — Who */}
        <div style={{ display:"flex",gap:14,alignItems:"flex-start",marginBottom:18 }}>
          <StepNum n={2}/>
          <div style={{ flex:1,background:"var(--c-tonight-glass)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",border:"1px solid var(--c-tonight-glass-bdr)",borderRadius:14,padding:"16px 18px" }}>
            <p style={{ ...MONO,fontSize:"0.58rem",letterSpacing:"0.14em",textTransform:"uppercase",color:"var(--c-white)",margin:"0 0 12px",opacity:0.9 }}>
              Who's joining you?
            </p>
            <div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>
              <ChipBtn val="solo"  current={who} onSet={setWho} label="Just Me" icon={<IconPerson/>}/>
              <ChipBtn val="date"  current={who} onSet={setWho} label="2 of Us" icon={<IconTwo/>}/>
              <ChipBtn val="group" current={who} onSet={setWho} label="Group"   icon={<IconGroup/>}/>
            </div>
          </div>
        </div>

        {/* Q3 — Energy */}
        <div style={{ display:"flex",gap:14,alignItems:"flex-start",marginBottom:24 }}>
          <StepNum n={3}/>
          <div style={{ flex:1,background:"var(--c-tonight-glass)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",border:"1px solid var(--c-tonight-glass-bdr)",borderRadius:14,padding:"16px 18px" }}>
            <p style={{ ...MONO,fontSize:"0.58rem",letterSpacing:"0.14em",textTransform:"uppercase",color:"var(--c-white)",margin:"0 0 12px",opacity:0.9 }}>
              What's the energy tonight?
            </p>
            <div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>
              <ChipBtn val="calm"       current={energy} onSet={setEnergy} label="Calm"        icon={<IconLeaf/>}/>
              <ChipBtn val="chill"      current={energy} onSet={setEnergy} label="Chill"       icon={<IconSmile/>}/>
              <ChipBtn val="elevated"   current={energy} onSet={setEnergy} label="Elevated"    icon={<IconDiamond/>}/>
              <ChipBtn val="highenergy" current={energy} onSet={setEnergy} label="High Energy" icon={<IconLightning/>}/>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic summary card — updates live as user makes selections */}
      <div style={{ marginBottom:16,padding:"18px 20px",background:"var(--c-tonight-glass)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",border:"1px solid var(--c-tonight-glass-bdr)",borderRadius:14,display:"flex",alignItems:"center",gap:14 }}>
        <span style={{ fontSize:"1.1rem",opacity:0.75,flexShrink:0,color:"var(--c-gold)" }}>✦</span>
        <p style={{ ...SERIF,fontSize:"1.0rem",fontStyle:"italic",color:"var(--c-white)",lineHeight:1.55,margin:0 }}>
          {buildNightSummary(when, who, energy)}
        </p>
      </div>

      {/* Build button — solid gold */}
      <button
        onClick={handleBuild}
        onMouseDown={()=>setBtnPrs(true)} onMouseUp={()=>setBtnPrs(false)} onMouseLeave={()=>setBtnPrs(false)} onTouchStart={()=>setBtnPrs(true)} onTouchEnd={()=>setBtnPrs(false)}
        style={{
          ...MONO, fontSize:"0.54rem", letterSpacing:"0.16em", textTransform:"uppercase",
          width:"100%", padding:"17px 0", borderRadius:100,
          border:"none", color:"var(--c-btn-cta-txt)",
          background: building ? "rgba(160,122,40,0.85)" : "linear-gradient(135deg,#C9A84C 0%,#A8872E 100%)",
          boxShadow: building ? "none" : "0 4px 28px rgba(201,168,76,0.32)",
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
              {onSavePlan && (
                <button
                  onClick={() => onSavePlan({ when, who, energy, stops: result.stops })}
                  style={{ ...MONO, display:"block", width:"100%", marginTop:16, padding:"13px 0", borderRadius:100, background:"rgba(201,168,76,0.08)", border:"1.5px solid var(--c-goldD)", color:"var(--c-gold)", fontSize:"0.52rem", letterSpacing:"0.16em", textTransform:"uppercase", cursor:"pointer", transition:"all 0.15s" }}
                >
                  SAVE THIS NIGHT ✦
                </button>
              )}
            </>
          )}
        </div>
      )}
      </div>
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

function SavedTab({ savedVenues, savedEventItems, savedHotelItems, toggleFav, onUnsaveEvent, onUnsaveHotel, onOpenVenue, photoMap, savedPlans, onDeletePlan }) {
  const empty = !savedVenues.length && !savedEventItems.length && !savedHotelItems.length && (!savedPlans || !savedPlans.length);
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
          {/* Saved Plans — first */}
          {savedPlans && savedPlans.length > 0 && (
            <div style={{ marginBottom:30 }}>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14 }}>
                <p style={{ ...MONO,fontSize:"0.5rem",letterSpacing:"0.18em",textTransform:"uppercase",color:"var(--c-goldD)",margin:0 }}>SAVED PLANS</p>
                <span style={{ ...MONO,fontSize:"0.44rem",letterSpacing:"0.08em",color:"var(--c-smoke)" }}>{savedPlans.length} saved</span>
              </div>
              <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
                {savedPlans.map(plan => (
                  <div key={plan.id} style={{ background:"var(--c-card)",border:"1px solid var(--c-border)",borderRadius:10,overflow:"hidden" }}>
                    <div style={{ padding:"12px 14px 8px",display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
                      <div>
                        <div style={{ ...MONO,fontSize:"0.41rem",letterSpacing:"0.14em",textTransform:"uppercase",color:"var(--c-goldD)",marginBottom:3 }}>
                          {plan.when&&plan.when.charAt(0).toUpperCase()+plan.when.slice(1)} · {plan.energy&&plan.energy.charAt(0).toUpperCase()+plan.energy.slice(1)}
                        </div>
                        <div style={{ ...SERIF,fontSize:"1rem",color:"var(--c-white)",lineHeight:1.2 }}>
                          {(plan.stops||[]).length}-Stop Night
                        </div>
                        {plan.savedAt && <div style={{ ...MONO,fontSize:"0.38rem",color:"var(--c-smoke)",marginTop:2 }}>{plan.savedAt}</div>}
                      </div>
                      {onDeletePlan && (
                        <button onClick={() => onDeletePlan(plan.id)} style={{ background:"none",border:"none",cursor:"pointer",color:"#C05050",fontSize:"1rem",padding:"4px",lineHeight:1,flexShrink:0 }}>♥</button>
                      )}
                    </div>
                    <div style={{ padding:"0 14px 12px",display:"flex",flexDirection:"column" }}>
                      {(plan.stops||[]).map((v,i) => (
                        <div key={v.id} onClick={() => onOpenVenue&&onOpenVenue(String(v.id))} style={{ display:"flex",alignItems:"center",gap:8,cursor:"pointer",padding:"6px 0",borderTop:i===0?"none":"1px solid var(--c-borders)" }}>
                          <div style={{ ...MONO,fontSize:"0.38rem",color:"var(--c-goldD)",letterSpacing:"0.12em",flexShrink:0,minWidth:16,textAlign:"center" }}>{i+1}</div>
                          <div style={{ ...SERIF,fontSize:"0.9rem",color:"var(--c-white)",lineHeight:1.2,flex:1 }}>{v.name}</div>
                          <div style={{ ...MONO,fontSize:"0.36rem",color:"var(--c-smoke)",letterSpacing:"0.08em",flexShrink:0 }}>{v.cat}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
function PassportTab({ visited, allVenues, navTo, overlayVenueId, onOverlayDone, onOpenVenue, visitedDates }) {
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
  const milestone = allVenues.length;
  const pct       = total===0 ? 0 : Math.min(100, Math.round((total/milestone)*100));
  const stamps    = visitedVenues;

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
              <span style={{ ...MONO,fontSize:"0.44rem",letterSpacing:"0.08em",color:headerText,flexShrink:0 }}>
                {total} / {allVenues.length} stamped
              </span>
            </div>
            <div style={{ background:progressBg, borderRadius:100, height:2, overflow:"hidden", marginBottom:6 }}>
              <div style={{ height:"100%",width:pct+"%",background:progressFg,borderRadius:100,transition:"width 0.7s ease" }}/>
            </div>
            <p style={{ ...MONO,fontSize:"0.38rem",letterSpacing:"0.05em",color:subText,margin:0 }}>
              {total===0 ? "Open any venue and tap ✓ visited to begin" : `${pct}% of Detroit explored`}
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
                {stamps.map((v, i) => {
                  const rawDate = visitedDates?.[String(v.id)];
                  const displayDate = rawDate || null;
                  return (
                    <div
                      key={String(v.id)}
                      style={{ transform:`translateY(${SCATTER_Y[i % SCATTER_Y.length] || 0}px)`, flexShrink:0 }}
                    >
                      <VenueStamp v={v} index={i} isNew={false} onOpen={onOpenVenue} date={displayDate}/>
                    </div>
                  );
                })}
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
  savedPlans, onSavePlan, onDeletePlan, visitedDates,
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
      <div style={{ background:"var(--c-deep)", padding:"12px 20px 0", borderBottom:"1px solid var(--c-border)" }}>
        <div style={{ maxWidth:680, margin:"0 auto" }}>
          <p style={{ ...MONO,fontSize:"0.52rem",letterSpacing:"0.22em",textTransform:"uppercase",color:"var(--c-gold)",margin:"0 0 5px" }}>Personal Guide</p>
          <h2 style={{ ...SERIF,fontSize:"clamp(1.8rem,5vw,2.8rem)",fontWeight:400,color:"var(--c-white)",margin:"0 0 4px" }}>Itinerary</h2>
          <p style={{ fontSize:"0.84rem",color:"var(--c-smoke)",margin:0 }}>Curated to how you explore Detroit.</p>
        </div>
        <div style={{ maxWidth:680, margin:"8px auto 0" }}>
          <div style={{ display:"flex" }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setSubTab(t.id)}
                style={{ ...MONO,fontSize:"0.52rem",letterSpacing:"0.12em",textTransform:"uppercase",padding:"8px 16px",background:"none",border:"none",cursor:"pointer",color:subTab===t.id?"var(--c-gold)":"var(--c-smoke)",borderBottom:subTab===t.id?"2px solid var(--c-gold)":"2px solid transparent",transition:"color 0.15s,border-color 0.15s",whiteSpace:"nowrap",flexShrink:0 }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {subTab==="tonight"  && <TonightTab allVenues={allVenues} photoMap={photoMap} onOpenVenue={onOpenVenue} onSavePlan={onSavePlan}/>}
      {subTab==="saved"    && <SavedTab savedVenues={savedVenues||[]} savedEventItems={savedEventItems||[]} savedHotelItems={savedHotelItems||[]} toggleFav={toggleFav} onUnsaveEvent={onUnsaveEvent} onUnsaveHotel={onUnsaveHotel} onOpenVenue={onOpenVenue} photoMap={photoMap} savedPlans={savedPlans||[]} onDeletePlan={onDeletePlan}/>}
      {subTab==="passport" && <PassportTab visited={visited} allVenues={allVenues} navTo={navTo} overlayVenueId={overlayId} onOverlayDone={()=>setOverlayId(null)} onOpenVenue={onOpenVenue} visitedDates={visitedDates}/>}
    </div>
  );
}
