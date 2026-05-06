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
  "Dinner":                  ["steakhouse","parisian","mansion_georgian","classic_diner","european_cafe","hotel_grand"],
  "Cocktail Lounges":        ["artdeco_tower","speakeasy","artdeco_lobby","guardian","nightclub"],
  "Hidden Bars":             ["speakeasy","brownstone","loft_building","nightclub","brownstone_pair"],
  "Rooftops":                ["rooftop_bar","hotel_modern","loft_building","clock_tower"],
  "Breakfast":               ["bakery","cafe_parisian","european_cafe","classic_diner"],
  "Coffee Shops & Bakeries": ["bakery","cafe_parisian","parisian","european_cafe"],
  "Nightlife":               ["nightclub","theater_marquee","theater_grand","warehouse_industrial"],
  "Sports Bars":             ["warehouse_industrial","classic_diner","loft_building","brownstone_pair"],
  "Happy Hour":              ["arches_roman","european_cafe","columns_greek","parisian"],
  "Lunch":                   ["mediterranean","parisian","european_cafe","steakhouse"],
  "Outdoor Activities":      ["japanese_pagoda","japanese_izakaya","rooftop_bar","waterfront"],
  "Alley Spots":             ["speakeasy","brownstone","boutique_hotel","loft_building"],
};

function BuildingSVG({ type }) {
  const s = { fill:"none", stroke:"currentColor", strokeWidth:1.15, strokeLinecap:"round", strokeLinejoin:"round" };
  const f = { stroke:"none", fill:"currentColor" };
  switch (type) {

    // ── ART DECO TOWER (stepped setback skyscraper) ──────────────────────
    case "artdeco_tower": return (
      <svg viewBox="0 0 72 48" width="72" height="48">
        <line x1="36" y1="0" x2="36" y2="5" style={{...s,strokeWidth:1.6}}/>
        <rect x="34" y="5" width="4" height="2" style={{...f,opacity:.7}}/>
        <rect x="31" y="7" width="10" height="4" style={s}/>
        {[33,36,39].map(x=><line key={x} x1={x} y1="7" x2={x} y2="11" style={{...s,strokeWidth:.55,opacity:.3}}/>)}
        <rect x="25" y="11" width="22" height="5" style={s}/>
        {[28,31,34,37,41,44].map(x=><line key={x} x1={x} y1="11" x2={x} y2="16" style={{...s,strokeWidth:.5,opacity:.28}}/>)}
        <rect x="18" y="16" width="36" height="5" style={s}/>
        <rect x="18" y="16" width="36" height="1.8" style={{...f,opacity:.42}}/>
        <rect x="12" y="21" width="48" height="25" style={s}/>
        {[22,30,38,42,50].map(x=><line key={x} x1={x} y1="21" x2={x} y2="46" style={{...s,strokeWidth:.6,opacity:.25}}/>)}
        {[14,19].map(x=>[28,35,42].map(y=><rect key={x+"-"+y} x={x} y={y} width="5.5" height="5" style={{...s,opacity:.5}}/>))}
        {[52,58].map(x=>[28,35,42].map(y=><rect key={x+"-"+y} x={x} y={y} width="5.5" height="5" style={{...s,opacity:.5}}/>))}
        <rect x="28" y="33" width="16" height="13" style={s}/>
        <rect x="10" y="46" width="52" height="2" style={{...f,opacity:.5}}/>
      </svg>
    );

    // ── ART DECO LOBBY (grand entrance arch) ──────────────────────────────
    case "artdeco_lobby": return (
      <svg viewBox="0 0 72 48" width="72" height="48">
        <rect x="2" y="2" width="68" height="2.5" style={{...f,opacity:.55}}/>
        <rect x="6" y="4.5" width="60" height="3" style={s}/>
        <rect x="10" y="7.5" width="52" height="3" style={s}/>
        <rect x="4" y="10.5" width="64" height="35" style={s}/>
        {[8,16].map(x=>[14,22,30].map(y=><rect key={x+"-"+y} x={x} y={y} width="6" height="7" style={{...s,opacity:.52}}/>))}
        {[50,58].map(x=>[14,22,30].map(y=><rect key={x+"-"+y} x={x} y={y} width="6" height="7" style={{...s,opacity:.52}}/>))}
        <path d="M28,46 L28,26 Q36,14 44,26 L44,46" style={s}/>
        {[30,36,42].map((x,i)=><line key={x} x1={x} y1={i===1?14:16} x2="36" y2="26" style={{...s,strokeWidth:.6,opacity:.35}}/>)}
        <path d="M28,26 Q36,14 44,26" style={{...s,opacity:.4}}/>
        <rect x="26" y="44" width="20" height="2" style={{...f,opacity:.4}}/>
        <rect x="24" y="46" width="24" height="2" style={{...f,opacity:.4}}/>
      </svg>
    );

    // ── GUARDIAN BUILDING (Detroit landmark, stepped pyramid) ─────────────
    case "guardian": return (
      <svg viewBox="0 0 72 48" width="72" height="48">
        <polygon points="36,1 33,6 39,6" style={{...s,opacity:.7}}/>
        <rect x="32" y="6" width="8" height="2" style={{...f,opacity:.7}}/>
        <rect x="28" y="8" width="16" height="2" style={{...f,opacity:.6}}/>
        <rect x="24" y="10" width="24" height="3" style={{...f,opacity:.5}}/>
        <rect x="20" y="13" width="32" height="14" style={s}/>
        <rect x="20" y="19" width="32" height="1.5" style={{...f,opacity:.38}}/>
        {[26,32,38].map(x=><path key={x} d={`M${x},27 L${x},22 Q${x+3},18 ${x+6},22 L${x+6},27`} style={{...s,opacity:.5}}/>)}
        <rect x="8" y="27" width="14" height="19" style={s}/>
        <rect x="50" y="27" width="14" height="19" style={s}/>
        {[10,14].map(x=>[30,36,40].map(y=><rect key={x+"-"+y} x={x} y={y} width="4" height="5" style={{...s,opacity:.45}}/>))}
        {[52,56].map(x=>[30,36,40].map(y=><rect key={x+"-"+y} x={x} y={y} width="4" height="5" style={{...s,opacity:.45}}/>))}
        <rect x="6" y="46" width="60" height="2" style={{...f,opacity:.48}}/>
      </svg>
    );

    // ── PARISIAN (Haussmann facade, mansard roof) ──────────────────────────
    case "parisian": return (
      <svg viewBox="0 0 72 48" width="72" height="48">
        <path d="M4,17 L8,7 L64,7 L68,17Z" style={s}/>
        <path d="M18,17 L18,11 Q22,8 26,11 L26,17" style={{...s,opacity:.55}}/>
        <path d="M32,17 L32,10 Q36,7 40,10 L40,17" style={{...s,opacity:.55}}/>
        <path d="M46,17 L46,11 Q50,8 54,11 L54,17" style={{...s,opacity:.55}}/>
        <rect x="4" y="17" width="64" height="2.5" style={{...f,opacity:.52}}/>
        <rect x="4" y="19.5" width="64" height="26" style={s}/>
        <path d="M10,36 L10,26 Q16,21 22,26 L22,36" style={{...s,opacity:.58}}/>
        <path d="M30,36 L30,26 Q36,21 42,26 L42,36" style={{...s,opacity:.58}}/>
        <path d="M50,36 L50,26 Q56,21 62,26 L62,36" style={{...s,opacity:.58}}/>
        <rect x="10" y="20.5" width="12" height="5" style={{...s,opacity:.48}}/>
        <rect x="30" y="20.5" width="12" height="5" style={{...s,opacity:.48}}/>
        <rect x="50" y="20.5" width="12" height="5" style={{...s,opacity:.48}}/>
        <line x1="8" y1="36.5" x2="64" y2="36.5" style={{...s,strokeWidth:.7,opacity:.4}}/>
        <rect x="4" y="45.5" width="64" height="2.5" style={{...f,opacity:.48}}/>
      </svg>
    );

    // ── BROWNSTONE (NYC stoop, arched windows) ────────────────────────────
    case "brownstone": return (
      <svg viewBox="0 0 72 48" width="72" height="48">
        <rect x="8" y="8" width="56" height="38" style={s}/>
        <rect x="6" y="5.5" width="60" height="3.5" style={{...f,opacity:.52}}/>
        <path d="M6,5.5 L8,2.5 L64,2.5 L66,5.5" style={{...s,opacity:.44}}/>
        {[12,28,44,58].map(x=><rect key={x} x={x} y="11" width="9" height="10" style={{...s,opacity:.52}}/>)}
        <path d="M12,32 L12,22 Q17.5,17 23,22 L23,32" style={{...s,opacity:.58}}/>
        <path d="M28,32 L28,22 Q33,17 38,22 L38,32" style={{...s,opacity:.58}}/>
        <path d="M42,32 L42,22 Q47.5,17 53,22 L53,32" style={{...s,opacity:.58}}/>
        <path d="M27,46 L27,38 Q36,32 45,38 L45,46" style={s}/>
        <rect x="22" y="44.5" width="28" height="1.5" style={{...f,opacity:.4}}/>
        <rect x="20" y="46" width="32" height="2" style={{...f,opacity:.4}}/>
        <line x1="22" y1="38" x2="22" y2="44.5" style={{...s,strokeWidth:.8,opacity:.36}}/>
        <line x1="50" y1="38" x2="50" y2="44.5" style={{...s,strokeWidth:.8,opacity:.36}}/>
      </svg>
    );

    // ── BROWNSTONE PAIR (two adjacent townhouses) ─────────────────────────
    case "brownstone_pair": return (
      <svg viewBox="0 0 72 48" width="72" height="48">
        <rect x="2" y="13" width="30" height="33" style={s}/>
        <rect x="2" y="11" width="30" height="3" style={{...f,opacity:.48}}/>
        <path d="M2,11 L4,8 L30,8 L32,11" style={{...s,opacity:.42}}/>
        <rect x="5" y="17" width="7" height="8" style={{...s,opacity:.5}}/>
        <rect x="16" y="17" width="7" height="8" style={{...s,opacity:.5}}/>
        <path d="M5,34 L5,27 Q9,23 13,27 L13,34" style={{...s,opacity:.52}}/>
        <path d="M20,34 L20,27 Q24,23 28,27 L28,34" style={{...s,opacity:.52}}/>
        <path d="M7,46 L7,40 Q12,36 17,40 L17,46" style={s}/>
        <rect x="4" y="44" width="15" height="2" style={{...f,opacity:.35}}/>
        <rect x="34" y="7" width="36" height="39" style={s}/>
        <rect x="34" y="4.5" width="36" height="3.5" style={{...f,opacity:.5}}/>
        <path d="M34,4.5 L36,1.5 L68,1.5 L70,4.5" style={{...s,opacity:.42}}/>
        {[37,47,57].map(x=><rect key={x} x={x} y="10" width="8" height="9" style={{...s,opacity:.52}}/>)}
        {[37,47,57].map(x=><path key={x+"a"} d={`M${x},31 L${x},23 Q${x+4},18 ${x+8},23 L${x+8},31`} style={{...s,opacity:.52}}/>)}
        <path d="M44,46 L44,38 Q50,33 56,38 L56,46" style={s}/>
      </svg>
    );

    // ── SPEAKEASY (basement hidden bar, staircase down) ───────────────────
    case "speakeasy": return (
      <svg viewBox="0 0 72 48" width="72" height="48">
        <rect x="4" y="2" width="64" height="28" style={s}/>
        <rect x="4" y="2" width="64" height="3" style={{...f,opacity:.48}}/>
        {[10,22,50,62].map(x=><rect key={x} x={x} y="6" width="10" height="9" style={{...s,opacity:.5}}/>)}
        <rect x="31" y="16" width="10" height="3" style={{...s,opacity:.42}}/>
        <rect x="0" y="30" width="72" height="3" style={{...f,opacity:.3}}/>
        <path d="M26,33 L26,48" style={s}/>
        <path d="M46,33 L46,48" style={s}/>
        <line x1="26" y1="36" x2="46" y2="36" style={{...s,opacity:.62}}/>
        <line x1="26" y1="39" x2="46" y2="39" style={{...s,opacity:.5}}/>
        <line x1="26" y1="42" x2="46" y2="42" style={{...s,opacity:.38}}/>
        <line x1="26" y1="45" x2="46" y2="45" style={{...s,opacity:.28}}/>
        <rect x="32" y="41" width="8" height="7" style={{...s,opacity:.65}}/>
        <circle cx="38" cy="44.5" r="1" style={{...f,opacity:.5}}/>
        <line x1="24" y1="33" x2="24" y2="30" style={{...s,strokeWidth:.85,opacity:.42}}/>
        <line x1="48" y1="33" x2="48" y2="30" style={{...s,strokeWidth:.85,opacity:.42}}/>
        <line x1="24" y1="30" x2="48" y2="30" style={{...s,strokeWidth:.85,opacity:.34}}/>
      </svg>
    );

    // ── THEATER MARQUEE (movie/entertainment theater) ─────────────────────
    case "theater_marquee": return (
      <svg viewBox="0 0 72 48" width="72" height="48">
        <rect x="4" y="4" width="64" height="14" style={s}/>
        <rect x="4" y="4" width="64" height="3" style={{...f,opacity:.5}}/>
        <path d="M20,7 Q36,3 52,7" style={{...s,opacity:.45}}/>
        <rect x="30" y="0" width="12" height="18" style={{...s,opacity:.6}}/>
        <rect x="31" y="1" width="10" height="16" style={{...f,opacity:.15}}/>
        <path d="M2,18 L2,28 L70,28 L70,18Z" style={s}/>
        <rect x="2" y="18" width="68" height="2" style={{...f,opacity:.45}}/>
        {[6,10,14,18,22,26,30,34,38,42,46,50,54,58,62,66].map(x=><circle key={x} cx={x} cy="23.5" r="1.3" style={{...f,opacity:.58}}/>)}
        <rect x="4" y="28" width="64" height="18" style={s}/>
        <rect x="8" y="32" width="14" height="14" style={{...s,opacity:.52}}/>
        <rect x="50" y="32" width="14" height="14" style={{...s,opacity:.52}}/>
        <path d="M29,46 L29,34 Q36,30 43,34 L43,46" style={s}/>
        <line x1="29" y1="34" x2="43" y2="34" style={{...s,strokeWidth:.65,opacity:.4}}/>
      </svg>
    );

    // ── THEATER GRAND (classical opera / performing arts) ─────────────────
    case "theater_grand": return (
      <svg viewBox="0 0 72 48" width="72" height="48">
        <path d="M2,21 L36,5 L70,21Z" style={s}/>
        <path d="M12,21 L36,9 L60,21Z" style={{...f,opacity:.16}}/>
        <rect x="2" y="21" width="68" height="2.5" style={{...f,opacity:.48}}/>
        <rect x="2" y="23.5" width="68" height="2" style={s}/>
        {[9,18,27,36,45,54,63].map(x=><rect key={x} x={x-1} y="25.5" width="3" height="21" style={{...s,opacity:.62}}/>)}
        {[9,18,27,36,45,54,63].map(x=><rect key={x+"b"} x={x-2} y="25" width="5" height="1.5" style={{...f,opacity:.44}}/>)}
        {[9,18,27,36,45,54,63].map(x=><rect key={x+"c"} x={x-2} y="46" width="5" height="1.5" style={{...f,opacity:.44}}/>)}
        <path d="M28,46 L28,32 Q36,27 44,32 L44,46" style={s}/>
        <line x1="4" y1="23.5" x2="68" y2="23.5" style={{...s,strokeWidth:.65,opacity:.38}}/>
        <path d="M14,20 Q22,17 30,20" style={{...s,opacity:.35,strokeWidth:.6}}/>
        <path d="M42,20 Q50,17 58,20" style={{...s,opacity:.35,strokeWidth:.6}}/>
        <rect x="2" y="46" width="68" height="2" style={{...f,opacity:.38}}/>
      </svg>
    );

    // ── BAKERY (French patisserie, scalloped awning) ───────────────────────
    case "bakery": return (
      <svg viewBox="0 0 72 48" width="72" height="48">
        <rect x="4" y="6" width="64" height="40" style={s}/>
        <rect x="4" y="6" width="64" height="5" style={{...f,opacity:.46}}/>
        <line x1="24" y1="2" x2="48" y2="2" style={{...s,strokeWidth:1.3,opacity:.48}}/>
        <line x1="26" y1="5" x2="46" y2="5" style={{...s,strokeWidth:.7,opacity:.3}}/>
        <path d="M2,11 Q9,17 16,11 Q23,17 30,11 Q37,17 44,11 Q51,17 58,11 Q65,17 70,11 L70,17 L2,17Z" style={s}/>
        <rect x="8" y="17" width="56" height="19" style={s}/>
        {[16,24,32,40,48,56].map(x=><line key={x} x1={x} y1="17" x2={x} y2="36" style={{...s,strokeWidth:.6,opacity:.32}}/>)}
        <line x1="8" y1="26.5" x2="64" y2="26.5" style={{...s,strokeWidth:.6,opacity:.32}}/>
        <rect x="10" y="37" width="16" height="9" style={s}/>
        <rect x="46" y="37" width="16" height="9" style={s}/>
        <rect x="30" y="37" width="12" height="9" style={s}/>
        <circle cx="35" cy="41.5" r="1" style={{...f,opacity:.5}}/>
      </svg>
    );

    // ── CAFÉ PARISIAN (with outdoor table + umbrella) ─────────────────────
    case "cafe_parisian": return (
      <svg viewBox="0 0 72 48" width="72" height="48">
        <rect x="18" y="4" width="52" height="42" style={s}/>
        <rect x="18" y="4" width="52" height="3" style={{...f,opacity:.48}}/>
        <path d="M16,7 L16,15 L72,15 L72,7Z" style={s}/>
        {[22,28,34,40,46,52,58,64,70].map(x=><line key={x} x1={x} y1="7" x2={x} y2="15" style={{stroke:"currentColor",strokeWidth:.7,opacity:.33}}/>)}
        <path d="M22,40 L22,19 Q28,13 34,19 L34,40" style={{...s,opacity:.6}}/>
        <path d="M38,40 L38,19 Q44,13 50,19 L50,40" style={{...s,opacity:.6}}/>
        <path d="M54,40 L54,19 Q60,13 66,19 L66,40" style={{...s,opacity:.6}}/>
        <circle cx="8" cy="37" r="5" style={{...s,opacity:.52}}/>
        <line x1="8" y1="42" x2="5" y2="48" style={{...s,opacity:.42}}/>
        <line x1="8" y1="42" x2="11" y2="48" style={{...s,opacity:.42}}/>
        <line x1="8" y1="28" x2="8" y2="37" style={{...s,strokeWidth:.85,opacity:.4}}/>
        <path d="M2,28 Q8,24 14,28" style={{...s,opacity:.44}}/>
        <line x1="0" y1="46" x2="72" y2="46" style={{...s,strokeWidth:.55,opacity:.25}}/>
      </svg>
    );

    // ── STEAKHOUSE (heavy dark facade, grid windows) ──────────────────────
    case "steakhouse": return (
      <svg viewBox="0 0 72 48" width="72" height="48">
        <rect x="2" y="8" width="68" height="5" style={s}/>
        <rect x="2" y="6" width="68" height="3" style={{...f,opacity:.4}}/>
        <path d="M6,6 L6,3 L14,1 L58,1 L66,3 L66,6" style={{...s,opacity:.48}}/>
        <rect x="4" y="13" width="64" height="33" style={s}/>
        <rect x="4" y="13" width="64" height="3.5" style={{...f,opacity:.52}}/>
        <rect x="8" y="19" width="22" height="24" style={s}/>
        <rect x="42" y="19" width="22" height="24" style={s}/>
        <line x1="19" y1="19" x2="19" y2="43" style={{...s,strokeWidth:.65,opacity:.35}}/>
        <line x1="8" y1="31" x2="30" y2="31" style={{...s,strokeWidth:.65,opacity:.35}}/>
        <line x1="53" y1="19" x2="53" y2="43" style={{...s,strokeWidth:.65,opacity:.35}}/>
        <line x1="42" y1="31" x2="64" y2="31" style={{...s,strokeWidth:.65,opacity:.35}}/>
        <path d="M30,17 L30,13 L42,13 L42,17" style={{...s,opacity:.58}}/>
        <line x1="28" y1="17" x2="44" y2="17" style={{...s,strokeWidth:1.1,opacity:.48}}/>
        <rect x="31" y="34" width="10" height="12" style={s}/>
        <rect x="28" y="44" width="16" height="2" style={{...f,opacity:.38}}/>
        <rect x="26" y="46" width="20" height="2" style={{...f,opacity:.38}}/>
      </svg>
    );

    // ── JAPANESE IZAKAYA (lanterns, noren curtain) ────────────────────────
    case "japanese_izakaya": return (
      <svg viewBox="0 0 72 48" width="72" height="48">
        <rect x="8" y="10" width="56" height="36" style={s}/>
        <path d="M4,14 L36,4 L68,14" style={{...s,strokeWidth:1.4}}/>
        <rect x="4" y="14" width="64" height="2.5" style={{...f,opacity:.44}}/>
        <rect x="16" y="14" width="40" height="6" style={{...s,opacity:.58}}/>
        {[22,28,34,40,46].map(x=><line key={x} x1={x} y1="15" x2={x} y2="19.5" style={{...s,strokeWidth:1.1,opacity:.42}}/>)}
        {[16,22,29,36,43].map(x=><path key={x} d={`M${x},20 Q${x+2},26 ${x},32`} style={{...s,strokeWidth:.8,opacity:.5}}/>)}
        <line x1="16" y1="20" x2="51" y2="20" style={{...s,strokeWidth:.65,opacity:.38}}/>
        <rect x="26" y="32" width="20" height="14" style={s}/>
        <line x1="36" y1="32" x2="36" y2="46" style={{...s,strokeWidth:.65,opacity:.42}}/>
        <path d="M10,14 Q11,22 10,30 Q12,32 14,30 Q16,26 14,20 Q12,16 10,14Z" style={{...s,opacity:.52}}/>
        <path d="M62,14 Q63,22 62,30 Q64,32 66,30 Q68,26 66,20 Q64,16 62,14Z" style={{...s,opacity:.52}}/>
        <line x1="10" y1="14" x2="10" y2="10" style={{...s,strokeWidth:.7,opacity:.36}}/>
        <line x1="62" y1="14" x2="62" y2="10" style={{...s,strokeWidth:.7,opacity:.36}}/>
      </svg>
    );

    // ── JAPANESE PAGODA (two-tier, upturned eaves) ────────────────────────
    case "japanese_pagoda": return (
      <svg viewBox="0 0 72 48" width="72" height="48">
        <line x1="36" y1="0" x2="36" y2="6" style={{...s,strokeWidth:1.5}}/>
        <line x1="33" y1="2" x2="39" y2="2" style={{...s,strokeWidth:.8,opacity:.48}}/>
        <path d="M4,18 L36,8 L68,18" style={{...s,strokeWidth:1.4}}/>
        <path d="M4,18 Q2,21 0,21" style={{...s,opacity:.45}}/>
        <path d="M68,18 Q70,21 72,21" style={{...s,opacity:.45}}/>
        <rect x="20" y="18" width="32" height="10" style={s}/>
        {[26,32,38,44].map(x=><line key={x} x1={x} y1="18" x2={x} y2="28" style={{...s,strokeWidth:.55,opacity:.3}}/>)}
        <path d="M2,33 L36,24 L70,33" style={{...s,strokeWidth:1.3}}/>
        <path d="M2,33 Q0,36 -2,37" style={{...s,opacity:.42}}/>
        <path d="M70,33 Q72,36 74,37" style={{...s,opacity:.42}}/>
        <rect x="10" y="33" width="52" height="13" style={s}/>
        {[14,22,30,42,50,58].map(x=><rect key={x} x={x} y="36" width="6" height="10" style={{...s,opacity:.52}}/>)}
        <rect x="8" y="46" width="56" height="2" style={{...f,opacity:.38}}/>
      </svg>
    );

    // ── MODERN GLASS HOTEL (curtain wall tower) ───────────────────────────
    case "hotel_modern": return (
      <svg viewBox="0 0 72 48" width="72" height="48">
        <rect x="22" y="2" width="28" height="44" style={s}/>
        {[6,10,14,18,22,26,30,34,38,42].map(y=><line key={y} x1="22" y1={y} x2="50" y2={y} style={{stroke:"currentColor",strokeWidth:.52,opacity:.33}}/>)}
        {[28,34,40,44].map(x=><line key={x} x1={x} y1="2" x2={x} y2="46" style={{stroke:"currentColor",strokeWidth:.52,opacity:.33}}/>)}
        <rect x="6" y="22" width="16" height="24" style={s}/>
        <rect x="50" y="22" width="16" height="24" style={s}/>
        {[26,30,36,40].map(y=><line key={y} x1="6" y1={y} x2="22" y2={y} style={{stroke:"currentColor",strokeWidth:.48,opacity:.28}}/>)}
        {[26,30,36,40].map(y=><line key={y+"r"} x1="50" y1={y} x2="66" y2={y} style={{stroke:"currentColor",strokeWidth:.48,opacity:.28}}/>)}
        <path d="M29,46 L29,42 L43,42 L43,46" style={{...s,opacity:.52}}/>
        <line x1="27" y1="42" x2="45" y2="42" style={{...s,strokeWidth:1.1,opacity:.48}}/>
        <line x1="36" y1="2" x2="36" y2="0" style={{...s,strokeWidth:1.5}}/>
      </svg>
    );

    // ── GRAND HISTORIC HOTEL (ornate cornice, marquee) ────────────────────
    case "hotel_grand": return (
      <svg viewBox="0 0 72 48" width="72" height="48">
        <path d="M2,10 Q36,4 70,10" style={{...s,opacity:.5}}/>
        <rect x="2" y="10" width="68" height="2.5" style={{...f,opacity:.48}}/>
        <line x1="36" y1="4" x2="36" y2="10" style={{...s,strokeWidth:.9,opacity:.45}}/>
        <path d="M36,4 L46,6 L36,8Z" style={{...f,opacity:.52}}/>
        <rect x="2" y="12.5" width="68" height="31" style={s}/>
        {[5,13,21,51,59,67].map(x=>[16,24,30].map(y=><rect key={x+"-"+y} x={x} y={y} width="6.5" height="7" style={{...s,opacity:.48}}/>))}
        {[30,38].map(y=><rect key={y} x={30} y={y} width="12" height="7" style={{...s,opacity:.48}}/>)}
        <path d="M22,43.5 L22,38 L50,38 L50,43.5" style={s}/>
        <line x1="20" y1="38" x2="52" y2="38" style={{...s,strokeWidth:1.1,opacity:.5}}/>
        {[24,28,32,36,40,44,48].map(x=><circle key={x} cx={x} cy="40.5" r="1" style={{...f,opacity:.52}}/>)}
        <path d="M30,43.5 L30,40 Q36,37 42,40 L42,43.5" style={{...s,opacity:.5}}/>
        <rect x="2" y="43.5" width="68" height="2.5" style={{...f,opacity:.4}}/>
      </svg>
    );

    // ── BOUTIQUE HOTEL (townhouse scale, arched entry) ────────────────────
    case "boutique_hotel": return (
      <svg viewBox="0 0 72 48" width="72" height="48">
        <rect x="8" y="6" width="56" height="40" style={s}/>
        <rect x="6" y="4" width="60" height="3.5" style={s}/>
        <path d="M18,4 L18,1.5 L24,0 L48,0 L54,1.5 L54,4" style={{...s,opacity:.46}}/>
        <rect x="12" y="12" width="14" height="10" rx="1" style={{...s,opacity:.56}}/>
        <rect x="30" y="12" width="12" height="10" rx="1" style={{...s,opacity:.56}}/>
        <rect x="46" y="12" width="14" height="10" rx="1" style={{...s,opacity:.56}}/>
        {[12,46].map(x=><line key={x} x1={x+2} y1="23" x2={x+12} y2="23" style={{...s,strokeWidth:.8,opacity:.38}}/>)}
        <rect x="12" y="28" width="14" height="9" rx="1" style={{...s,opacity:.52}}/>
        <rect x="46" y="28" width="14" height="9" rx="1" style={{...s,opacity:.52}}/>
        <path d="M28,46 L28,35 Q36,29 44,35 L44,46" style={s}/>
        <line x1="26" y1="35" x2="46" y2="35" style={{...s,strokeWidth:1.1,opacity:.5}}/>
        <path d="M24,35 Q36,30 48,35" style={{...s,opacity:.4}}/>
      </svg>
    );

    // ── ROOFTOP BAR (terrace with pergola, cityscape) ─────────────────────
    case "rooftop_bar": return (
      <svg viewBox="0 0 72 48" width="72" height="48">
        <path d="M0,32 L0,22 L8,22 L8,26 L14,26 L14,18 L20,18 L20,32" style={{...s,strokeWidth:.65,opacity:.22}}/>
        <path d="M52,32 L52,24 L58,24 L58,20 L64,20 L64,26 L70,26 L72,26 L72,32" style={{...s,strokeWidth:.65,opacity:.22}}/>
        <rect x="4" y="30" width="64" height="16" style={s}/>
        <rect x="4" y="30" width="64" height="2.5" style={{...f,opacity:.46}}/>
        <line x1="14" y1="30" x2="14" y2="14" style={{...s,opacity:.52}}/>
        <line x1="58" y1="30" x2="58" y2="14" style={{...s,opacity:.52}}/>
        <line x1="12" y1="14" x2="60" y2="14" style={{...s,opacity:.48}}/>
        {[18,24,30,36,42,48,54].map(x=><line key={x} x1={x} y1="14" x2={x} y2="30" style={{...s,opacity:.25,strokeWidth:.6}}/>)}
        <line x1="4" y1="22" x2="4" y2="30" style={{...s,opacity:.44}}/>
        <line x1="68" y1="22" x2="68" y2="30" style={{...s,opacity:.44}}/>
        <line x1="4" y1="22" x2="68" y2="22" style={{...s,opacity:.36}}/>
        {[10,16,22,28,34,40,46,52,58,64].map(x=><line key={x} x1={x} y1="22" x2={x} y2="30" style={{...s,strokeWidth:.6,opacity:.28}}/>)}
        <rect x="16" y="36" width="12" height="8" rx="2" style={{...s,opacity:.44}}/>
        <rect x="44" y="36" width="12" height="8" rx="2" style={{...s,opacity:.44}}/>
      </svg>
    );

    // ── WAREHOUSE INDUSTRIAL (sawtooth roof, arched windows) ──────────────
    case "warehouse_industrial": return (
      <svg viewBox="0 0 72 48" width="72" height="48">
        <path d="M2,20 L2,12 L14,5 L14,20 L26,12 L26,20 L38,12 L38,20 L50,12 L50,20 L62,12 L62,20 L70,20" style={s}/>
        <rect x="2" y="20" width="68" height="26" style={s}/>
        {[24,28,32,36,40].map(y=><line key={y} x1="2" y1={y} x2="70" y2={y} style={{stroke:"currentColor",strokeWidth:.42,opacity:.2}}/>)}
        <path d="M7,46 L7,30 Q15,22 23,30 L23,46" style={{...s,opacity:.58}}/>
        <path d="M27,46 L27,30 Q35,22 43,30 L43,46" style={{...s,opacity:.58}}/>
        <path d="M47,46 L47,30 Q55,22 63,30 L63,46" style={{...s,opacity:.58}}/>
        <rect x="2" y="38" width="4" height="8" style={{...s,opacity:.48}}/>
        {[39,41,43,45].map(y=><line key={y} x1="2" y1={y} x2="6" y2={y} style={{stroke:"currentColor",strokeWidth:.48,opacity:.36}}/>)}
      </svg>
    );

    // ── GREEK REVIVAL (Doric columns, pediment) ───────────────────────────
    case "columns_greek": return (
      <svg viewBox="0 0 72 48" width="72" height="48">
        <path d="M2,20 L36,4 L70,20Z" style={s}/>
        <path d="M12,20 L36,7 L60,20Z" style={{...f,opacity:.16}}/>
        <rect x="2" y="20" width="68" height="4" style={{...f,opacity:.48}}/>
        <rect x="2" y="24" width="68" height="2" style={s}/>
        {[9,18,27,45,54,63].map(x=>[26,46].map((y,i)=><rect key={x+"-"+i} x={x-1} y={y} width="2.5" height={i===0?1.5:20} style={{...s,opacity:i===0?.55:.66}}/>))}
        {[9,18,27,45,54,63].map(x=><rect key={x+"cap"} x={x-2.5} y="25" width="5.5" height="1.5" style={{...f,opacity:.42}}/>)}
        {[21,27,33,39].map(x=><rect key={x+"tf"} x={x} y="20" width="3.5" height="4" style={{...f,opacity:.35}}/>)}
        <rect x="2" y="46" width="68" height="2" style={{...f,opacity:.42}}/>
        <path d="M28,46 L28,34 Q36,29 44,34 L44,46" style={s}/>
      </svg>
    );

    // ── ROMAN ARCHES (3 barrel arches with keystones) ─────────────────────
    case "arches_roman": return (
      <svg viewBox="0 0 72 48" width="72" height="48">
        <rect x="2" y="2" width="68" height="3" style={{...f,opacity:.52}}/>
        <rect x="2" y="5" width="68" height="2" style={s}/>
        <rect x="2" y="38" width="68" height="8" style={s}/>
        <line x1="2" y1="43" x2="70" y2="43" style={{...s,strokeWidth:.55,opacity:.32}}/>
        <path d="M4,38 L4,20 Q4,7 14,7 Q24,7 24,20 L24,38" style={s}/>
        <path d="M26,38 L26,20 Q26,7 36,7 Q46,7 46,20 L46,38" style={s}/>
        <path d="M48,38 L48,20 Q48,7 58,7 Q68,7 68,20 L68,38" style={s}/>
        <polygon points="14,7 12,10 16,10" style={{...f,opacity:.55}}/>
        <polygon points="36,7 34,10 38,10" style={{...f,opacity:.55}}/>
        <polygon points="58,7 56,10 60,10" style={{...f,opacity:.55}}/>
        <rect x="24" y="7" width="3" height="31" style={{...f,opacity:.22}}/>
        <rect x="45" y="7" width="3" height="31" style={{...f,opacity:.22}}/>
        <rect x="8" y="24" width="12" height="14" style={{...s,opacity:.5}}/>
        <rect x="30" y="24" width="12" height="14" style={{...s,opacity:.5}}/>
        <rect x="52" y="24" width="12" height="14" style={{...s,opacity:.5}}/>
      </svg>
    );

    // ── DOME / CAPITOL (civic dome, colonnade drum) ───────────────────────
    case "dome_capitol": return (
      <svg viewBox="0 0 72 48" width="72" height="48">
        <rect x="34" y="0" width="4" height="5" style={{...s,opacity:.58}}/>
        <path d="M15,22 Q15,1 57,1 Q57,1 57,22Z" style={s}/>
        <line x1="36" y1="1" x2="36" y2="22" style={{stroke:"currentColor",strokeWidth:.58,opacity:.28}}/>
        <line x1="25" y1="4" x2="36" y2="22" style={{stroke:"currentColor",strokeWidth:.55,opacity:.28}}/>
        <line x1="47" y1="4" x2="36" y2="22" style={{stroke:"currentColor",strokeWidth:.55,opacity:.28}}/>
        <line x1="18" y1="13" x2="36" y2="22" style={{stroke:"currentColor",strokeWidth:.48,opacity:.22}}/>
        <line x1="54" y1="13" x2="36" y2="22" style={{stroke:"currentColor",strokeWidth:.48,opacity:.22}}/>
        <rect x="13" y="22" width="46" height="6" style={s}/>
        {[16,20,24,28,32,36,40,44,48,52,56].map(x=><line key={x} x1={x} y1="22" x2={x} y2="28" style={{stroke:"currentColor",strokeWidth:.75,opacity:.42}}/>)}
        <rect x="6" y="28" width="60" height="3" style={s}/>
        <rect x="4" y="31" width="64" height="15" style={s}/>
        {[8,18,30,42,54,62].map(x=><rect key={x} x={x} y="34" width="8" height="9" style={{...s,opacity:.46}}/>)}
        <rect x="2" y="46" width="68" height="2" style={{...f,opacity:.38}}/>
      </svg>
    );

    // ── EUROPEAN CAFÉ (corner building, arched windows) ───────────────────
    case "european_cafe": return (
      <svg viewBox="0 0 72 48" width="72" height="48">
        <rect x="14" y="4" width="56" height="42" style={s}/>
        <rect x="14" y="4" width="56" height="3" style={{...f,opacity:.46}}/>
        <path d="M12,7 L12,16 L72,16 L72,7Z" style={s}/>
        {[18,24,30,36,42,48,54,60,66].map(x=><line key={x} x1={x} y1="7" x2={x} y2="16" style={{stroke:"currentColor",strokeWidth:.7,opacity:.32}}/>)}
        <path d="M18,42 L18,20 Q24,14 30,20 L30,42" style={{...s,opacity:.6}}/>
        <path d="M34,42 L34,20 Q40,14 46,20 L46,42" style={{...s,opacity:.6}}/>
        <path d="M50,42 L50,20 Q56,14 62,20 L62,42" style={{...s,opacity:.6}}/>
        <circle cx="6" cy="36" r="4.5" style={{...s,opacity:.5}}/>
        <line x1="6" y1="40" x2="4" y2="46" style={{...s,opacity:.4}}/>
        <line x1="6" y1="40" x2="8" y2="46" style={{...s,opacity:.4}}/>
        <line x1="6" y1="28" x2="6" y2="36" style={{...s,strokeWidth:.82,opacity:.4}}/>
        <path d="M0,28 Q6,24 12,28" style={{...s,opacity:.42}}/>
        <line x1="0" y1="46" x2="72" y2="46" style={{...s,strokeWidth:.55,opacity:.24}}/>
      </svg>
    );

    // ── GEORGIAN MANSION (symmetrical, columned portico) ──────────────────
    case "mansion_georgian": return (
      <svg viewBox="0 0 72 48" width="72" height="48">
        <rect x="2" y="14" width="14" height="32" style={s}/>
        <rect x="56" y="14" width="14" height="32" style={s}/>
        <rect x="14" y="7" width="44" height="39" style={s}/>
        <rect x="14" y="7" width="44" height="3" style={{...f,opacity:.45}}/>
        <path d="M24,21 L36,13 L48,21Z" style={s}/>
        {[26,30,34,38,42,46].map(x=><rect key={x} x={x-1} y="21" width="2.5" height="19" style={{...s,opacity:.58}}/>)}
        <rect x="24" y="20.5" width="24" height="1.5" style={{...f,opacity:.4}}/>
        {[16,22,42,48].map(x=>[10,18].map(y=><rect key={x+"-"+y} x={x} y={y} width="7" height="8.5" style={{...s,opacity:.5}}/>))}
        <rect x="4" y="20" width="7" height="8" style={{...s,opacity:.46}}/>
        <rect x="4" y="32" width="7" height="8" style={{...s,opacity:.46}}/>
        <rect x="61" y="20" width="7" height="8" style={{...s,opacity:.46}}/>
        <rect x="61" y="32" width="7" height="8" style={{...s,opacity:.46}}/>
        <rect x="16" y="14" width="4" height="4" style={{...s,opacity:.45}}/>
        <rect x="52" y="14" width="4" height="4" style={{...s,opacity:.45}}/>
        <rect x="33" y="37" width="6" height="9" style={s}/>
        <rect x="30" y="46" width="12" height="2" style={{...f,opacity:.38}}/>
      </svg>
    );

    // ── URBAN LOFT (converted industrial, fire escape) ────────────────────
    case "loft_building": return (
      <svg viewBox="0 0 72 48" width="72" height="48">
        <rect x="2" y="10" width="52" height="36" style={s}/>
        <rect x="54" y="18" width="16" height="28" style={s}/>
        <rect x="6" y="13" width="14" height="19" style={{...s,opacity:.58}}/>
        <rect x="24" y="13" width="14" height="19" style={{...s,opacity:.58}}/>
        <rect x="42" y="13" width="10" height="19" style={{...s,opacity:.58}}/>
        <line x1="13" y1="13" x2="13" y2="32" style={{...s,strokeWidth:.6,opacity:.33}}/>
        <line x1="31" y1="13" x2="31" y2="32" style={{...s,strokeWidth:.6,opacity:.33}}/>
        <line x1="47" y1="13" x2="47" y2="32" style={{...s,strokeWidth:.6,opacity:.33}}/>
        <line x1="6" y1="22.5" x2="20" y2="22.5" style={{...s,strokeWidth:.6,opacity:.33}}/>
        <line x1="24" y1="22.5" x2="38" y2="22.5" style={{...s,strokeWidth:.6,opacity:.33}}/>
        <path d="M54,18 L54,10 L60,10 L60,18" style={{...s,strokeWidth:.75,opacity:.48}}/>
        <path d="M60,18 L60,28 L66,28 L66,38" style={{...s,strokeWidth:.75,opacity:.45}}/>
        <rect x="57" y="22" width="4" height="5" style={{...s,opacity:.44}}/>
        <rect x="57" y="32" width="4" height="5" style={{...s,opacity:.44}}/>
        <rect x="10" y="35" width="16" height="11" style={s}/>
        <line x1="2" y1="34" x2="52" y2="34" style={{...s,strokeWidth:.6,opacity:.32}}/>
      </svg>
    );

    // ── NIGHTCLUB (velvet rope, arched entry, marquee sign) ───────────────
    case "nightclub": return (
      <svg viewBox="0 0 72 48" width="72" height="48">
        <rect x="4" y="8" width="64" height="38" style={s}/>
        <rect x="4" y="8" width="64" height="4" style={{...f,opacity:.5}}/>
        <rect x="30" y="0" width="12" height="12" style={s}/>
        {[32,36,40].map(x=><circle key={x} cx={x} cy="5" r="1.2" style={{...f,opacity:.52}}/>)}
        <rect x="8" y="16" width="18" height="14" style={{...s,opacity:.5}}/>
        <rect x="46" y="16" width="18" height="14" style={{...s,opacity:.5}}/>
        {[10,14,18,20].map(x=><line key={x} x1={x} y1="17" x2={x} y2="29" style={{stroke:"currentColor",strokeWidth:.65,opacity:.28}}/>)}
        {[48,52,56,60].map(x=><line key={x} x1={x} y1="17" x2={x} y2="29" style={{stroke:"currentColor",strokeWidth:.65,opacity:.28}}/>)}
        <path d="M26,46 L26,32 Q32,26 36,26 Q40,26 46,32 L46,46" style={s}/>
        {[28,32,36,40,44].map(x=><circle key={x} cx={x} cy="30" r="1" style={{...f,opacity:.48}}/>)}
        <line x1="14" y1="34" x2="14" y2="46" style={{...s,strokeWidth:1.1,opacity:.44}}/>
        <line x1="58" y1="34" x2="58" y2="46" style={{...s,strokeWidth:1.1,opacity:.44}}/>
        <path d="M14,36 Q36,32 58,36" style={{...s,strokeWidth:.72,opacity:.38}}/>
      </svg>
    );

    // ── CLASSIC DINER (streamline moderne, barrel roof) ───────────────────
    case "classic_diner": return (
      <svg viewBox="0 0 72 48" width="72" height="48">
        <path d="M4,20 Q4,6 36,6 Q68,6 68,20" style={s}/>
        <rect x="4" y="20" width="64" height="26" style={s}/>
        {[10,16,22,28,34,40,46,52,58,64].map(x=><line key={x} x1={x} y1="20" x2={x} y2="46" style={{stroke:"currentColor",strokeWidth:.52,opacity:.25}}/>)}
        <rect x="6" y="24" width="60" height="10" style={{...s,opacity:.56}}/>
        {[14,22,30,38,46,54].map(x=><circle key={x} cx={x} cy="36" r="2.5" style={{...s,opacity:.44}}/>)}
        <rect x="26" y="25" width="20" height="5" style={{...s,opacity:.42}}/>
        <rect x="32" y="36" width="8" height="10" style={s}/>
        <line x1="20" y1="9" x2="52" y2="9" style={{...s,strokeWidth:1.1,opacity:.44}}/>
        <line x1="22" y1="12" x2="50" y2="12" style={{...s,strokeWidth:.68,opacity:.28}}/>
      </svg>
    );

    // ── MEDITERRANEAN (bell tower + arched colonnade) ─────────────────────
    case "mediterranean": return (
      <svg viewBox="0 0 72 48" width="72" height="48">
        <rect x="2" y="4" width="10" height="42" style={s}/>
        <path d="M2,4 Q7,0 12,4" style={{...s,opacity:.48}}/>
        <rect x="3" y="11" width="8" height="6" style={{...s,opacity:.52}}/>
        <path d="M5,16 Q7,19 9,16" style={{...s,opacity:.42}}/>
        <path d="M14,46 L14,28 Q14,17 22,17 Q30,17 30,28 L30,46" style={s}/>
        <path d="M32,46 L32,28 Q32,17 40,17 Q48,17 48,28 L48,46" style={s}/>
        <path d="M50,46 L50,28 Q50,17 58,17 Q66,17 66,28 L66,46" style={s}/>
        <rect x="12" y="8" width="58" height="10" style={s}/>
        <rect x="12" y="8" width="58" height="2.5" style={{...f,opacity:.44}}/>
        <path d="M12,8 Q16,5 20,8 Q24,5 28,8 Q32,5 36,8 Q40,5 44,8 Q48,5 52,8 Q56,5 60,8 Q64,5 68,8 Q70,5 72,8" style={{...s,strokeWidth:.65,opacity:.42}}/>
        {[22,40,58].map(x=><rect key={x} x={x-4} y="16" width="8" height="2" style={{...f,opacity:.38}}/>)}
        {[18,36,54].map(x=>[36,42].map(y=><rect key={x+"-"+y} x={x} y={y} width="6" height="8" style={{...s,opacity:.5}}/>))}
      </svg>
    );

    // ── WATERFRONT (riverside building, dock pilings) ─────────────────────
    case "waterfront": return (
      <svg viewBox="0 0 72 48" width="72" height="48">
        <path d="M0,38 Q18,36 36,38 Q54,40 72,38" style={{...s,strokeWidth:.75,opacity:.42}}/>
        <path d="M0,42 Q18,40 36,42 Q54,44 72,42" style={{...s,strokeWidth:.55,opacity:.28}}/>
        <rect x="10" y="8" width="52" height="30" style={s}/>
        <rect x="10" y="8" width="52" height="3" style={{...f,opacity:.46}}/>
        <path d="M10,38 L10,26 Q10,18 18,18 Q26,18 26,26 L26,38" style={s}/>
        <path d="M28,38 L28,26 Q28,18 36,18 Q44,18 44,26 L44,38" style={s}/>
        <path d="M46,38 L46,26 Q46,18 54,18 Q62,18 62,26 L62,38" style={s}/>
        {[14,22,30,42,50,58].map(x=><rect key={x} x={x} y="10" width="6" height="7" style={{...s,opacity:.5}}/>)}
        <rect x="16" y="38" width="42" height="2" style={{...f,opacity:.32}}/>
        <line x1="20" y1="38" x2="20" y2="46" style={{...s,strokeWidth:1.2,opacity:.4}}/>
        <line x1="36" y1="38" x2="36" y2="46" style={{...s,strokeWidth:1.2,opacity:.4}}/>
        <line x1="52" y1="38" x2="52" y2="46" style={{...s,strokeWidth:1.2,opacity:.4}}/>
      </svg>
    );

    // ── CLOCK TOWER (Gothic, clock face, flying buttresses) ───────────────
    case "clock_tower": return (
      <svg viewBox="0 0 72 48" width="72" height="48">
        <polygon points="24,0 22,5 26,5" style={{...f,opacity:.55}}/>
        <polygon points="48,0 46,5 50,5" style={{...f,opacity:.55}}/>
        <line x1="24" y1="0" x2="24" y2="8" style={{...s,strokeWidth:1.2,opacity:.52}}/>
        <line x1="48" y1="0" x2="48" y2="8" style={{...s,strokeWidth:1.2,opacity:.52}}/>
        <rect x="20" y="4" width="32" height="10" style={s}/>
        <path d="M22,14 L22,8 Q36,4 50,8 L50,14" style={{...s,opacity:.4}}/>
        <circle cx="36" cy="21" r="10" style={s}/>
        {Array.from({length:12},(_,i)=>{const a=i*30*Math.PI/180;const r=8;return <line key={i} x1={36+r*0.75*Math.sin(a)} y1={21-r*0.75*Math.cos(a)} x2={36+r*Math.sin(a)} y2={21-r*Math.cos(a)} style={{...s,strokeWidth:i%3===0?1:.45,opacity:i%3===0?.58:.32}}/>;} )}
        <line x1="36" y1="21" x2="36" y2="15" style={{...s,strokeWidth:1.2,opacity:.62,strokeLinecap:"round"}}/>
        <line x1="36" y1="21" x2="41" y2="23" style={{...s,strokeWidth:.88,opacity:.52,strokeLinecap:"round"}}/>
        <rect x="20" y="31" width="32" height="15" style={s}/>
        <path d="M24,31 L24,25 Q36,19 48,25 L48,31" style={{...s,opacity:.5}}/>
        <rect x="26" y="35" width="6" height="8" style={{...s,opacity:.46}}/>
        <rect x="40" y="35" width="6" height="8" style={{...s,opacity:.46}}/>
        <path d="M20,31 Q12,37 10,46" style={{...s,strokeWidth:.68,opacity:.36}}/>
        <path d="M52,31 Q60,37 62,46" style={{...s,strokeWidth:.68,opacity:.36}}/>
      </svg>
    );

    // ── DEFAULT (classic gabled building) ────────────────────────────────
    default: return (
      <svg viewBox="0 0 72 48" width="72" height="48">
        <polyline points="4,20 36,3 68,20" style={s}/>
        <rect x="4" y="20" width="64" height="2.5" style={{...f,opacity:.6}}/>
        {[11,20.5,30,42,51.5,61].map(x=><rect key={x} x={x} y="22.5" width="2.5" height="20" style={{...f,opacity:.45}}/>)}
        <rect x="4" y="42.5" width="64" height="2.5" style={{...f,opacity:.6}}/>
        <path d="M31,42.5 L31,33 Q36,26 41,33 L41,42.5" style={s}/>
        <line x1="4" y1="20" x2="4" y2="45" style={{...s,opacity:.44}}/>
        <line x1="68" y1="20" x2="68" y2="45" style={{...s,opacity:.44}}/>
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
function VenueStamp({ v, index, isNew, onOpen, date: propDate }) {
  const { hex, rgb, rot } = getStampStyle(v);
  const catTypes = CAT_BUILDING[v.cat] || ["classic"];
  const typeArr = Array.isArray(catTypes) ? catTypes : [catTypes];
  const btype = typeArr[parseInt(String(v.id).replace(/\D/g,"")) % typeArr.length];
  const portrait = index % 3 === 1;
  const w = portrait ? 118 : 148;
  const h = portrait ? 108 :  90;
  const serial = "DET-" + String(v.id).padStart(4,"0");
  const date   = propDate || getStampDate(index);

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
  const catTypesO = CAT_BUILDING[venue.cat] || ["classic"];
  const typeArrO = Array.isArray(catTypesO) ? catTypesO : [catTypesO];
  const btype = typeArrO[parseInt(String(venue.id).replace(/\D/g,"")) % typeArrO.length];
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

function TonightTab({ allVenues, photoMap, onOpenVenue, onSavePlan }) {
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

          {/* Saved Plans */}
          {savedPlans && savedPlans.length > 0 && (
            <div style={{ marginTop: savedVenues.length||savedEventItems.length||savedHotelItems.length ? 30 : 0 }}>
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
  const milestone = 20;
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
                {stamps.map((v, i) => {
                  const rawDate = visitedDates?.[String(v.id)];
                  const displayDate = rawDate
                    ? new Date(rawDate).toLocaleDateString("en-US",{month:"short",day:"2-digit",year:"numeric"}).toUpperCase().replace(",","")
                    : null;
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
      <div style={{ background:"var(--c-deep)", padding:"20px 20px 0", borderBottom:"1px solid var(--c-border)" }}>
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
