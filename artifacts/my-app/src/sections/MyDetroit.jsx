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
// Venue tag system — category defaults + per-venue overrides
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
};

// Per-venue tag overrides (keyed by venue ID as string)
const VTAGS = {
  "1":  ["dinner","elevated","dateNight","calm","food"],          // London Chop House
  "5":  ["dinner","elevated","dateNight","food"],                 // Antietam
  "7":  ["drinks","cocktail","elevated","lateNight","dateNight"], // Standby
  "9":  ["dinner","elevated","dateNight","calm","food"],          // Prime + Proper
  "10": ["dinner","food","calm"],                                  // Roast
  "13": ["dinner","lunch","food","chill"],                         // Ima
  "17": ["drinks","cocktail","elevated","rooftop"],               // Wright & Co
  "25": ["dinner","food","calm"],                                  // (Roast alt)
  "30": ["drinks","cocktail","lateNight"],                         // Downtown bar
  "34": ["drinks","cocktail","elevated","lateNight"],             // The Peterboro
  "35": ["drinks","cocktail","elevated","lateNight"],             // The Shelby
  "37": ["outdoor","groupFriendly","sports","daytime"],           // Topgolf
  "38": ["dinner","elevated","dateNight","calm","food"],          // Detroit Athletic Club
  "39": ["dinner","elevated","dateNight","calm","food"],          // Apparatus Room
  "40": ["drinks","cocktail","elevated","hidden","calm"],         // Sugar House
  "41": ["drinks","cocktail","elevated","rooftop","lateNight"],  // Sixty K
  "44": ["dinner","elevated","dateNight","food"],                 // Chartreuse
  "46": ["drinks","cocktail","elevated","dateNight","lateNight"],// The Peterboro (alt)
  "47": ["dinner","elevated","dateNight","calm","food"],          // Sexy Steak
  "55": ["drinks","cocktail","rooftop","elevated","dateNight"],  // High Bar
  "67": ["drinks","cocktail","elevated","dateNight","lateNight"],// Candy Bar
  "71": ["dinner","food","chill"],                                 // Baobab Fare
  "73": ["dinner","elevated","dateNight","calm","food"],          // Parc Detroit
  "74": ["drinks","cocktail","hidden","lateNight","calm"],        // Bad Luck Bar
  "75": ["dinner","food","chill"],
  "76": ["drinks","cocktail","elevated","rooftop","dateNight"],   // Townhouse
  "77": ["dinner","elevated","food"],
  "78": ["dinner","food","chill"],
  "79": ["lunch","food","chill"],
  "80": ["drinks","cocktail","lateNight"],
  "81": ["drinks","cocktail","elevated"],
  "82": ["dinner","food"],
  "83": ["drinks","cocktail"],
  "84": ["drinks","cocktail","hidden","lateNight"],
  "85": ["dinner","elevated","food"],
  "86": ["drinks","cocktail","chill"],
  "87": ["dinner","food","chill"],
  "88": ["drinks","cocktail","elevated","dateNight"],
  "89": ["dinner","elevated","dateNight","food"],
  "90": ["drinks","cocktail","elevated","lateNight"],             // TWT
  "91": ["drinks","cocktail","elevated","dateNight","lateNight"], // Candy Bar (v2)
  "92": ["drinks","cocktail","elevated","rooftop"],               // High Bar (v2)
  "93": ["drinks","cocktail","calm","hidden"],                    // Skip
  "94": ["drinks","cocktail","elevated","dateNight","lateNight"], // Candy Bar
  "95": ["drinks","cocktail","elevated","rooftop","dateNight"],   // Wright & Company
  "96": ["dinner","elevated","dateNight","food"],                 // Townhouse
  "97": ["drinks","cocktail","chill"],
  "98": ["dinner","food"],
  "99": ["drinks","cocktail","elevated"],
};

function getVenueTags(v) {
  const id    = String(v.id);
  const spec  = VTAGS[id]   || [];
  const cat   = CAT_TAGS[v.cat] || [];
  const hours = (v.hours||"").includes("2am")||(v.hours||"").includes("3am") ? ["lateNight"] : [];
  return [...new Set([...spec, ...cat, ...hours])];
}

function hasT(v, t) { return getVenueTags(v).includes(t); }

// ─────────────────────────────────────────────────────────────────────────────
// Build My Night — strict filtering
// ─────────────────────────────────────────────────────────────────────────────
function buildNight(when, who, energy, all) {
  const pool = fn => all.filter(fn);
  const dinner   = pool(v => hasT(v,"dinner"));
  const morning  = pool(v => hasT(v,"morning") || hasT(v,"brunch"));
  const lunch    = pool(v => hasT(v,"lunch"));
  const hh       = pool(v => hasT(v,"happyHour"));
  const drinks   = pool(v => hasT(v,"drinks") || hasT(v,"cocktail"));
  const lateN    = pool(v => hasT(v,"lateNight"));
  const elevated = pool(v => hasT(v,"elevated"));
  const calm     = pool(v => hasT(v,"calm"));
  const chill    = pool(v => hasT(v,"chill") || v.cat==="Sports Bars");
  const highE    = pool(v => hasT(v,"highEnergy") || v.cat==="Nightlife");
  const dateN    = pool(v => hasT(v,"dateNight"));
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
    stops = [or(morning), or(morning), or(rooftop, pool(v => v.cat==="Outdoor Activities"))];
  } else if (when === "afternoon") {
    stops = [or(lunch, pool(v=>hasT(v,"food"))), or(hh, drinks), or(drinks)];
  } else if (when === "late") {
    if (!lateN.length) return { stops:[], reason:"No late-night venues match this selection. Try Evening instead." };
    stops = [
      or(lateN.filter(v=>hasT(v,"dinner")), lateN.filter(v=>hasT(v,"food"))),
      or(lateN.filter(v=>hasT(v,"drinks"))),
      or(lateN),
    ];
  } else { // evening
    if (energy === "calm") {
      stops = [
        or(dinner.filter(v=>hasT(v,"calm")||hasT(v,"elevated")), dinner),
        or(drinks.filter(v=>hasT(v,"calm")||hasT(v,"elevated")), drinks),
        or(drinks.filter(v=>hasT(v,"calm")), drinks),
      ];
    } else if (energy === "chill") {
      stops = [
        or(dinner.filter(v=>!hasT(v,"elevated")), dinner),
        or(chill.filter(v=>hasT(v,"drinks")), hh, chill),
        or(chill, drinks),
      ];
    } else if (energy === "elevated") {
      const isDN   = who === "date";
      const dPool  = isDN ? dinner.filter(v=>hasT(v,"elevated")&&hasT(v,"dateNight")) : dinner.filter(v=>hasT(v,"elevated"));
      const dkPool = isDN ? drinks.filter(v=>hasT(v,"elevated")&&hasT(v,"dateNight")) : elevated.filter(v=>hasT(v,"drinks"));
      if (!dPool.length && !dkPool.length && !elevated.length) {
        return { stops:[], reason:"Not enough elevated venues for this combination." };
      }
      stops = [or(dPool, dinner.filter(v=>hasT(v,"elevated")), dinner), or(dkPool, elevated.filter(v=>hasT(v,"drinks")), drinks), or(dkPool, elevated.filter(v=>hasT(v,"drinks")), drinks)];
    } else { // highEnergy
      stops = [or(dinner), or(highE, drinks), or(lateN.filter(v=>hasT(v,"highEnergy")), lateN, highE)];
    }
  }

  const clean = stops.filter(Boolean);
  return { stops: clean, reason: clean.length < 2 ? "Not enough matching spots for this combination. Try another time or vibe." : "" };
}

function getStopLabel(i, when, energy) {
  const m = {
    morning:           ["MORNING STOP","BRUNCH SPOT","MORNING VIEWS"],
    afternoon:         ["LUNCH STOP","HAPPY HOUR","AFTERNOON COCKTAILS"],
    late:              ["LATE EATS","NIGHTCAP","AFTER HOURS"],
    evening_calm:      ["DINNER STOP","COCKTAIL BAR","NIGHTCAP"],
    evening_chill:     ["DINNER STOP","LOCAL BAR","LATE DRINKS"],
    evening_elevated:  ["DINNER STOP","ELEVATED LOUNGE","AFTER HOURS"],
    evening_highenergy:["DINNER STOP","NIGHTLIFE SPOT","AFTER HOURS"],
  };
  const key = when==="evening" ? `evening_${energy}` : when;
  return (m[key] || m.morning)[i] || `STOP ${i+1}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Icon SVGs
// ─────────────────────────────────────────────────────────────────────────────
const si = { fill:"none", stroke:"currentColor", strokeWidth:1.4, strokeLinecap:"round", strokeLinejoin:"round" };

const IconSunrise   = () => <svg width="16" height="16" viewBox="0 0 16 16" style={si}><path d="M2,11 Q8,4 14,11"/><line x1="8" y1="2" x2="8" y2="1"/><line x1="2" y1="6" x2="1.2" y2="6"/><line x1="14" y1="6" x2="14.8" y2="6"/><line x1="3.5" y1="3.5" x2="2.8" y2="2.8"/><line x1="12.5" y1="3.5" x2="13.2" y2="2.8"/><line x1="1" y1="13" x2="15" y2="13"/></svg>;
const IconSun       = () => <svg width="16" height="16" viewBox="0 0 16 16" style={si}><circle cx="8" cy="8" r="3"/><line x1="8" y1="1" x2="8" y2="2.5"/><line x1="8" y1="13.5" x2="8" y2="15"/><line x1="1" y1="8" x2="2.5" y2="8"/><line x1="13.5" y1="8" x2="15" y2="8"/><line x1="3" y1="3" x2="4.1" y2="4.1"/><line x1="11.9" y1="11.9" x2="13" y2="13"/><line x1="13" y1="3" x2="11.9" y2="4.1"/><line x1="4.1" y1="11.9" x2="3" y2="13"/></svg>;
const IconMoon      = () => <svg width="16" height="16" viewBox="0 0 16 16" style={si}><path d="M12,9 Q12,13 8,14 Q4,15 2.5,11 Q1,7 4,5 Q5,4 7,4 Q5,7 7,9.5 Q9,12 12,9Z"/><line x1="12" y1="2" x2="12" y2="0.5"/><line x1="14" y1="4" x2="15.5" y2="4"/><line x1="13.1" y1="0.9" x2="14" y2="0"/></svg>;
const IconCrescent  = () => <svg width="16" height="16" viewBox="0 0 16 16" style={si}><path d="M10,2 Q15,4.5 15,9 Q15,14 10,14.5 Q5,15 3,12 Q7,11 8,8.5 Q9,6 10,2Z"/></svg>;
const IconPerson    = () => <svg width="16" height="16" viewBox="0 0 16 16" style={si}><circle cx="8" cy="5.5" r="2.5"/><path d="M3,14 Q3,10 8,10 Q13,10 13,14"/></svg>;
const IconTwo       = () => <svg width="16" height="16" viewBox="0 0 16 16" style={si}><circle cx="5.5" cy="5" r="2"/><circle cx="10.5" cy="5" r="2"/><path d="M1,14 Q1,11 5.5,11 Q10,11 10,14"/><path d="M10,11 Q13.5,11 15,14"/></svg>;
const IconGroup     = () => <svg width="16" height="16" viewBox="0 0 16 16" style={si}><circle cx="4" cy="5" r="1.8"/><circle cx="8.5" cy="4" r="2"/><circle cx="13" cy="5" r="1.8"/><path d="M1,14 Q1,11 4,11"/><path d="M3,14 Q3,10 8.5,10 Q14,10 14,14"/><path d="M13,11 Q16,11 16,14"/></svg>;
const IconLeaf      = () => <svg width="16" height="16" viewBox="0 0 16 16" style={si}><path d="M8,14 Q8,9 13,5 Q15,3 15,2 Q14,2 12,3 Q7,5 6,10 Q5.5,13 8,14Z"/><path d="M8,14 Q7,12 5,15"/><line x1="8" y1="10" x2="8" y2="14"/></svg>;
const IconSmile     = () => <svg width="16" height="16" viewBox="0 0 16 16" style={si}><circle cx="8" cy="8" r="6"/><path d="M5.5,9.5 Q8,12 10.5,9.5"/><circle cx="5.8" cy="7" r="0.5" fill="currentColor" stroke="none"/><circle cx="10.2" cy="7" r="0.5" fill="currentColor" stroke="none"/></svg>;
const IconDiamond   = () => <svg width="16" height="16" viewBox="0 0 16 16" style={si}><polygon points="8,1 14,7 8,15 2,7"/><line x1="2" y1="7" x2="14" y2="7"/><line x1="5" y1="1.8" x2="8" y2="7"/><line x1="11" y1="1.8" x2="8" y2="7"/></svg>;
const IconLightning = () => <svg width="16" height="16" viewBox="0 0 16 16" style={{...si,strokeLinejoin:"round"}}><path d="M9.5,1 L5,9 L8.5,9 L6.5,15 L12,7 L8.5,7Z"/></svg>;
const IconBookmark  = () => <svg width="16" height="16" viewBox="0 0 16 16" style={si}><path d="M4,2 L12,2 L12,14 L8,11 L4,14Z"/></svg>;

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
};

function BuildingSVG({ type }) {
  const s = { fill:"none", stroke:"currentColor", strokeWidth:1.25, strokeLinecap:"round", strokeLinejoin:"round" };
  const f = { stroke:"none",  fill:"currentColor" };
  switch (type) {
    case "classic": return (
      <svg viewBox="0 0 72 42" width="72" height="42">
        <polyline points="4,17 36,3 68,17" style={s}/>
        <rect x="4" y="17" width="64" height="2.5" style={{...f,opacity:.65}}/>
        {[11,20.5,33.5,47,56.5].map(x=><rect key={x} x={x} y="19.5" width="2.5" height="18" style={{...f,opacity:.5}}/>)}
        <rect x="4" y="37.5" width="64" height="2.5" style={{...f,opacity:.65}}/>
        <path d="M31,37.5 L31,29 Q36,23 41,29 L41,37.5" style={s}/>
      </svg>
    );
    case "arches": return (
      <svg viewBox="0 0 72 42" width="72" height="42">
        <rect x="2" y="2" width="68" height="3" style={{...f,opacity:.65}}/>
        <path d="M7,40 L7,22 Q7,12 16,12 Q25,12 25,22 L25,40" style={s}/>
        <path d="M28,40 L28,22 Q28,12 36,12 Q44,12 44,22 L44,40" style={s}/>
        <path d="M47,40 L47,22 Q47,12 56,12 Q65,12 65,22 L65,40" style={s}/>
        <rect x="2" y="40" width="68" height="2" style={{...f,opacity:.65}}/>
        <rect x="23" y="12" width="5" height="28" style={{...f,opacity:.35}}/>
        <rect x="43" y="12" width="5" height="28" style={{...f,opacity:.35}}/>
      </svg>
    );
    case "pagoda": return (
      <svg viewBox="0 0 72 42" width="72" height="42">
        <path d="M36,2 L52,13 L20,13Z" style={s}/>
        <path d="M20,13 C14,15 8,13 4,10" style={s}/>
        <path d="M52,13 C58,15 64,13 68,10" style={s}/>
        <rect x="18" y="13" width="36" height="2" style={{...f,opacity:.5}}/>
        <path d="M22,15 L50,15 L58,26 L14,26Z" style={s}/>
        <path d="M14,26 C8,28 2,26 0,23" style={s}/>
        <path d="M58,26 C64,28 70,26 72,23" style={s}/>
        <rect x="14" y="26" width="44" height="14" style={s}/>
        <rect x="29" y="30" width="14" height="10" rx="1" style={s}/>
      </svg>
    );
    case "cafe": return (
      <svg viewBox="0 0 72 42" width="72" height="42">
        <rect x="4" y="14" width="64" height="26" style={s}/>
        <rect x="4" y="14" width="64" height="3.5" style={{...f,opacity:.55}}/>
        <path d="M2,21 L70,21 L64,30 L8,30Z" style={s}/>
        {[16,26,36,46,56].map(x=><line key={x} x1={x} y1="21" x2={x-3} y2="30" style={{stroke:"currentColor",strokeWidth:.9,opacity:.45}}/>)}
        <rect x="8" y="32" width="18" height="8" style={s}/>
        <rect x="46" y="32" width="18" height="8" style={s}/>
        <rect x="30" y="33" width="12" height="7" style={s}/>
      </svg>
    );
    case "artdeco": return (
      <svg viewBox="0 0 72 42" width="72" height="42">
        <rect x="30" y="2" width="12" height="5" style={s}/>
        <rect x="24" y="7" width="24" height="5" style={s}/>
        <rect x="16" y="12" width="40" height="5" style={s}/>
        <rect x="8" y="17" width="56" height="23" style={s}/>
        {[18,28,44,54].map(x=><line key={x} x1={x} y1="17" x2={x} y2="40" style={{stroke:"currentColor",strokeWidth:.8,opacity:.38}}/>)}
        <rect x="29" y="32" width="14" height="8" style={s}/>
        <rect x="8" y="40" width="56" height="2" style={{...f,opacity:.6}}/>
      </svg>
    );
    case "modern": return (
      <svg viewBox="0 0 72 42" width="72" height="42">
        <rect x="20" y="4" width="32" height="36" style={s}/>
        {[28,36,44].map(x=><line key={x} x1={x} y1="4" x2={x} y2="40" style={{stroke:"currentColor",strokeWidth:.7,opacity:.42}}/>)}
        {[12,20,28].map(y=><line key={y} x1="20" y1={y} x2="52" y2={y} style={{stroke:"currentColor",strokeWidth:.7,opacity:.42}}/>)}
        <line x1="36" y1="4" x2="36" y2="0" style={{stroke:"currentColor",strokeWidth:1.5,strokeLinecap:"round"}}/>
        <rect x="4" y="18" width="16" height="22" style={s}/>
        <rect x="52" y="18" width="16" height="22" style={s}/>
      </svg>
    );
    case "dome": return (
      <svg viewBox="0 0 72 42" width="72" height="42">
        <path d="M18,26 Q18,4 54,4 Q54,4 54,26Z" style={s}/>
        <rect x="6" y="24" width="60" height="3.5" style={{...f,opacity:.5}}/>
        <rect x="4" y="27.5" width="64" height="12.5" style={s}/>
        {[10,20,30,42,52,62].map(x=><rect key={x} x={x} y="27.5" width="2" height="12.5" style={{...f,opacity:.38}}/>)}
        <path d="M28,40 L28,33 Q36,27 44,33 L44,40" style={s}/>
      </svg>
    );
    case "warehouse": return (
      <svg viewBox="0 0 72 42" width="72" height="42">
        <polygon points="36,2 4,14 68,14" style={s}/>
        <rect x="4" y="14" width="64" height="26" style={s}/>
        <circle cx="18" cy="26" r="6" style={s}/>
        <circle cx="36" cy="26" r="6" style={s}/>
        <circle cx="54" cy="26" r="6" style={s}/>
        <rect x="26" y="34" width="20" height="6" style={s}/>
      </svg>
    );
    default: return (
      <svg viewBox="0 0 72 42" width="72" height="42">
        <rect x="4" y="8" width="64" height="32" style={s}/>
        <rect x="4" y="8" width="64" height="4" style={{...f,opacity:.5}}/>
        <rect x="30" y="28" width="12" height="12" style={s}/>
        {[10,22,40,52].map(x=><rect key={x} x={x} y="14" width="10" height="10" style={s}/>)}
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
// VenueStamp — a single passport stamp for a visited venue
// ─────────────────────────────────────────────────────────────────────────────
function VenueStamp({ v, index, isNew }) {
  const { hex, rgb, rot } = getStampStyle(v);
  const btype = CAT_BUILDING[v.cat] || "classic";
  const portrait = index % 3 === 1;
  const w = portrait ? 120 : 150;
  const h = portrait ? 110 :  92;
  const serial = "DET-" + String(v.id).padStart(4,"0");
  const date   = getStampDate(index);

  return (
    <div
      className={isNew ? "stamp-press" : undefined}
      style={{
        width:w, height:h, flexShrink:0,
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
        border:`1.5px solid ${hex}`,
        boxShadow:`0 0 0 2.5px rgba(${rgb},0.09), inset 0 0 0 3px rgba(${rgb},0.04)`,
        background:`radial-gradient(ellipse at 50% 38%, rgba(${rgb},0.13) 0%, rgba(${rgb},0.04) 60%, transparent 85%)`,
        borderRadius:4, transform:`rotate(${rot}deg)`,
        padding:portrait?"6px 8px 8px":"5px 10px 7px",
        position:"relative", overflow:"hidden", boxSizing:"border-box",
        color: hex,
      }}
    >
      {/* Diagonal VISITED watermark */}
      <span style={{ position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%) rotate(-18deg)",...MONO,fontSize:"0.26rem",letterSpacing:"0.32em",color:`rgba(${rgb},0.07)`,textTransform:"uppercase",whiteSpace:"nowrap",pointerEvents:"none",userSelect:"none",zIndex:0 }}>
        VISITED
      </span>
      <div style={{ position:"relative",zIndex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,width:"100%" }}>
        {/* Building art */}
        <div style={{ opacity:.72, lineHeight:0 }}>
          <BuildingSVG type={btype}/>
        </div>
        {/* Venue name */}
        <div style={{ ...SERIF,fontSize:"0.82rem",fontWeight:700,color:hex,lineHeight:1.1,textAlign:"center",textTransform:"uppercase",letterSpacing:"0.03em",marginTop:1 }}>
          {v.name.length>14 ? v.name.slice(0,13)+"…" : v.name}
        </div>
        {/* Neighborhood */}
        <div style={{ ...MONO,fontSize:"0.27rem",letterSpacing:"0.18em",color:hex,opacity:.65,textTransform:"uppercase" }}>
          {v.hood.toUpperCase()}
        </div>
        {/* Date */}
        <div style={{ ...MONO,fontSize:"0.25rem",letterSpacing:"0.1em",color:hex,opacity:.48,textTransform:"uppercase" }}>
          {date}
        </div>
        {/* Serial */}
        <div style={{ ...MONO,fontSize:"0.23rem",letterSpacing:"0.07em",color:hex,opacity:.38 }}>
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
        width:230, height:188, border:`2px solid rgba(${rgb},0.85)`,
        boxShadow:`0 0 0 5px rgba(${rgb},0.08), 0 0 0 8px rgba(${rgb},0.04)`,
        background:`radial-gradient(ellipse at 48% 40%, rgba(${rgb},0.22) 0%, rgba(8,5,2,0.97) 72%)`,
        borderRadius:6, transform:`rotate(${rot}deg)`, padding:"18px 20px", position:"relative", overflow:"hidden",
        color: hex,
      }}>
        <span style={{ position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%) rotate(-18deg)",...MONO,fontSize:"0.3rem",letterSpacing:"0.38em",color:`rgba(${rgb},0.06)`,textTransform:"uppercase",whiteSpace:"nowrap",pointerEvents:"none",userSelect:"none" }}>
          VISITED
        </span>
        <div style={{ position:"relative",zIndex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4 }}>
          <div style={{ opacity:.75,lineHeight:0 }}><BuildingSVG type={btype}/></div>
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

function ResultCard({ v, stopLabel, photoMap }) {
  const [pressed, setPressed] = useState(false);
  const thumb = photoMap?.[String(v.id)];
  return (
    <div
      onMouseDown={()=>setPressed(true)} onMouseUp={()=>setPressed(false)} onMouseLeave={()=>setPressed(false)} onTouchStart={()=>setPressed(true)} onTouchEnd={()=>setPressed(false)}
      style={{ display:"flex", alignItems:"stretch", gap:12, background:"var(--c-card)", border:"1px solid var(--c-border)", borderRadius:10, overflow:"hidden", transform:pressed?"scale(0.975)":"scale(1)", transition:"transform 0.08s" }}
    >
      {/* Thumbnail */}
      <div style={{ width:68, flexShrink:0, background: thumb ? "var(--c-deep)" : venueGradient(v), position:"relative", overflow:"hidden" }}>
        {thumb && <img src={thumb} alt="" style={{ position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover" }}/>}
      </div>
      {/* Text */}
      <div style={{ flex:1, padding:"12px 4px 12px 0", minWidth:0 }}>
        <div style={{ ...MONO,fontSize:"0.4rem",letterSpacing:"0.18em",textTransform:"uppercase",color:"var(--c-goldD)",marginBottom:3 }}>{stopLabel}</div>
        <div style={{ ...SERIF,fontSize:"1.05rem",fontWeight:600,color:"var(--c-white)",lineHeight:1.2,marginBottom:3 }}>{v.name}</div>
        <div style={{ fontSize:"0.73rem",color:"var(--c-ash)",lineHeight:1.45,marginBottom:4 }}>
          {v.desc && v.desc.length>65 ? v.desc.slice(0,65)+"…" : v.desc}
        </div>
        <div style={{ ...MONO,fontSize:"0.4rem",letterSpacing:"0.08em",textTransform:"uppercase",color:"var(--c-smoke)" }}>{v.cat} · {v.hood}</div>
      </div>
      {/* Bookmark */}
      <div style={{ display:"flex",alignItems:"center",paddingRight:14,color:"var(--c-borders)" }}>
        <IconBookmark/>
      </div>
    </div>
  );
}

function TonightTab({ allVenues, photoMap }) {
  const [when,    setWhen]    = useState("evening");
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

  function handleRebuild() {
    if (!result || building) return;
    setBuilding(true); setResult(null);
    setTimeout(() => {
      setResult(buildNight(when, who, energy, allVenues));
      setBuilding(false);
    }, 500);
  }

  return (
    <div style={{ padding:"24px 20px 64px", maxWidth:680, margin:"0 auto" }}>

      {/* Header */}
      <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:6 }}>
        <div>
          <h2 style={{ ...SERIF,fontSize:"1.9rem",fontWeight:400,color:"var(--c-white)",margin:0,lineHeight:1.1 }}>
            Build My Night ✨
          </h2>
          <p style={{ ...MONO,fontSize:"0.44rem",letterSpacing:"0.07em",color:"var(--c-smoke)",margin:"7px 0 0" }}>
            Answer three questions. We'll craft the perfect night.
          </p>
        </div>
        {result && !building && (
          <button
            onClick={handleRebuild}
            style={{ ...MONO,fontSize:"0.46rem",letterSpacing:"0.12em",textTransform:"uppercase",border:"1px solid var(--c-border)",background:"transparent",color:"var(--c-smoke)",padding:"7px 13px",borderRadius:6,cursor:"pointer",marginTop:4,flexShrink:0 }}
          >
            REBUILD
          </button>
        )}
      </div>

      {/* Q1 — When */}
      <div style={{ marginTop:24, marginBottom:18 }}>
        <p style={{ ...MONO,fontSize:"0.44rem",letterSpacing:"0.16em",textTransform:"uppercase",color:"var(--c-smoke)",margin:"0 0 10px" }}>
          WHEN ARE YOU GOING OUT?
        </p>
        <div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>
          <ChipBtn val="morning"   current={when} onSet={setWhen} label="Morning"    icon={<IconSunrise/>}/>
          <ChipBtn val="afternoon" current={when} onSet={setWhen} label="Afternoon"  icon={<IconSun/>}/>
          <ChipBtn val="evening"   current={when} onSet={setWhen} label="Evening"    icon={<IconMoon/>}/>
          <ChipBtn val="late"      current={when} onSet={setWhen} label="Late Night" icon={<IconCrescent/>}/>
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
                {/* Gold connecting line */}
                <div style={{ position:"absolute",left:14,top:20,bottom:20,width:2,background:"linear-gradient(180deg,var(--c-goldD) 0%,rgba(201,168,76,0.2) 100%)",borderRadius:1 }}/>
                <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
                  {result.stops.map((v,i) => (
                    <div key={v.id} style={{ display:"flex",gap:14,alignItems:"flex-start" }}>
                      {/* Number circle */}
                      <div style={{ width:30,height:30,borderRadius:"50%",border:"1.5px solid var(--c-goldD)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,...MONO,fontSize:"0.5rem",color:"var(--c-gold)",background:"var(--c-deep)",position:"relative",zIndex:1,marginTop:20 }}>
                        {i+1}
                      </div>
                      <div style={{ flex:1,minWidth:0 }}>
                        <ResultCard v={v} stopLabel={getStopLabel(i,when,energy)} photoMap={photoMap}/>
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
function SavedCard({ thumb, thumbGradient, title, cat, sub, onRemove, href, ctaLabel }) {
  const [pressed, setPressed] = useState(false);
  return (
    <div
      onMouseDown={()=>setPressed(true)} onMouseUp={()=>setPressed(false)} onMouseLeave={()=>setPressed(false)} onTouchStart={()=>setPressed(true)} onTouchEnd={()=>setPressed(false)}
      style={{ display:"flex",alignItems:"stretch",background:"var(--c-card)",border:"1px solid var(--c-border)",borderRadius:10,overflow:"hidden",transform:pressed?"scale(0.975)":"scale(1)",transition:"transform 0.08s" }}
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
      {/* Actions */}
      <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,padding:"0 12px",flexShrink:0 }}>
        <button onClick={onRemove} style={{ background:"none",border:"none",cursor:"pointer",color:"#C05050",fontSize:"1.1rem",padding:"4px",lineHeight:1,display:"flex" }}>♥</button>
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" style={{ color:"var(--c-borders)",lineHeight:0,display:"flex" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><line x1="2" y1="12" x2="12" y2="2"/><polyline points="5,2 12,2 12,9"/></svg>
          </a>
        ) : (
          <span style={{ color:"var(--c-borders)",lineHeight:0,display:"flex" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><line x1="2" y1="7" x2="12" y2="7"/><polyline points="8,3 12,7 8,11"/></svg>
          </span>
        )}
      </div>
    </div>
  );
}

function SavedTab({ savedVenues, savedEventItems, savedHotelItems, toggleFav, onUnsaveEvent, onUnsaveHotel, onOpenVenue, photoMap }) {
  const empty = !savedVenues.length && !savedEventItems.length && !savedHotelItems.length;
  return (
    <div style={{ padding:"24px 20px 64px", maxWidth:680, margin:"0 auto" }}>
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
                    href={null}
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
                      title={item.label}
                      cat={badge}
                      sub={sub}
                      onRemove={e=>{e.stopPropagation();onUnsaveEvent&&onUnsaveEvent(item.id,item);}}
                      href={cta?.url}
                      ctaLabel={cta?.label}
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
                      cat={`${h.hood || "Detroit"} · Hotel`.toUpperCase()}
                      sub={h.price_from ? `From ${h.price_from}/night` : h.hood}
                      onRemove={e=>{e.stopPropagation();onUnsaveHotel&&onUnsaveHotel(h.id);}}
                      href={cta?.url}
                      ctaLabel={cta?.label}
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
// Passport tab
// ─────────────────────────────────────────────────────────────────────────────
function PassportTab({ visited, allVenues, navTo, overlayVenueId, onOverlayDone }) {
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

  const total    = visitedVenues.length;
  const milestone = 20;
  const pct      = total===0 ? 0 : Math.min(100, Math.round((total/milestone)*100));
  const stamps   = visitedVenues.slice(0, 16); // max 16 stamps on page

  // Passport page background
  const pageBg = isDark
    ? "linear-gradient(148deg,#1d1609 0%,#120e06 100%)"
    : "linear-gradient(148deg,#f0e8cc 0%,#e4d8b0 100%)";
  const lineColor  = isDark ? "rgba(201,168,76,0.055)" : "rgba(100,70,20,0.08)";
  const wmColor    = isDark ? "rgba(201,168,76,0.025)" : "rgba(100,70,20,0.05)";
  const borderClr  = isDark ? "rgba(201,168,76,0.10)"  : "rgba(100,70,20,0.22)";
  const headerText = isDark ? "rgba(201,168,76,0.45)"  : "rgba(80,50,15,0.55)";
  const subText    = isDark ? "var(--c-smoke)"          : "rgba(70,45,10,0.6)";

  return (
    <div style={{ padding:"24px 20px 64px", maxWidth:680, margin:"0 auto" }}>

      {/* Stamp overlay */}
      {overlayVenueId && (
        <StampOverlay
          venue={allVenues.find(v=>String(v.id)===String(overlayVenueId)) || {id:overlayVenueId,name:"Venue",hood:"Detroit",cat:"Dinner"}}
          onDone={onOverlayDone}
        />
      )}

      {/* Stats bar */}
      <div style={{ background:"var(--c-card)",border:"1px solid var(--c-border)",borderRadius:12,padding:"20px 20px 16px",marginBottom:20 }}>
        <div style={{ display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:12 }}>
          <div style={{ display:"flex",alignItems:"baseline",gap:10 }}>
            <span style={{ ...SERIF,fontSize:"2.4rem",fontWeight:400,color:"var(--c-white)",lineHeight:1 }}>{total}</span>
            <span style={{ fontSize:"0.86rem",color:"var(--c-smoke)",fontWeight:300 }}>
              venue{total!==1?"s":""} visited
            </span>
          </div>
          <span style={{ ...MONO,fontSize:"0.46rem",letterSpacing:"0.1em",color:"var(--c-gold)" }}>
            {stamps.length} / 16 stamps
          </span>
        </div>
        <div style={{ background:"var(--c-borders)",borderRadius:100,height:2,overflow:"hidden",marginBottom:7 }}>
          <div style={{ height:"100%",width:pct+"%",background:"linear-gradient(90deg,var(--c-goldD),var(--c-gold))",borderRadius:100,transition:"width 0.7s ease" }}/>
        </div>
        <p style={{ ...MONO,fontSize:"0.41rem",letterSpacing:"0.06em",color:subText,margin:0 }}>
          {total===0 ? "Open any venue and mark it as visited to begin" : `${pct}% of your first ${milestone} discovered`}
        </p>
      </div>

      {/* Passport book page */}
      <div style={{ borderRadius:10, overflow:"hidden", boxShadow:"0 8px 32px rgba(0,0,0,0.45)" }}>

        {/* Passport header strip */}
        <div style={{ background:"var(--c-deep)", border:`1px solid ${borderClr}`, borderBottom:"none", borderRadius:"10px 10px 0 0", padding:"14px 20px 12px", textAlign:"center" }}>
          <div style={{ ...MONO,fontSize:"0.3rem",letterSpacing:"0.32em",textTransform:"uppercase",color:"var(--c-goldD)" }}>EXCLUSIVE DETROIT</div>
          <div style={{ ...SERIF,fontSize:"1.08rem",fontWeight:400,color:"var(--c-gold)",margin:"3px 0 2px" }}>Insider Passport</div>
          <div style={{ ...MONO,fontSize:"0.28rem",letterSpacing:"0.16em",textTransform:"uppercase",color:headerText }}>DETROIT INSIDER PASSPORT</div>
        </div>

        {/* Parchment stamp area */}
        <div style={{ background:pageBg, border:`1px solid ${borderClr}`, borderTop:"none", borderRadius:"0 0 10px 10px", padding:"28px 16px 32px", position:"relative", overflow:"hidden" }}>

          {/* Horizontal page lines */}
          <div style={{ position:"absolute",inset:0,pointerEvents:"none",backgroundImage:`repeating-linear-gradient(0deg,transparent 0px,transparent 28px,${lineColor} 28px,${lineColor} 29px)` }}/>

          {/* Circular watermark */}
          <div style={{ position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:240,height:240,borderRadius:"50%",border:`1px solid ${wmColor}`,pointerEvents:"none" }}/>
          <div style={{ position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:200,height:200,borderRadius:"50%",border:`1px solid ${wmColor}`,pointerEvents:"none" }}/>

          {/* DETROIT watermark text */}
          <div style={{ position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%) rotate(-28deg)",...MONO,fontSize:"3.5rem",letterSpacing:"0.24em",color:wmColor,textTransform:"uppercase",whiteSpace:"nowrap",pointerEvents:"none",userSelect:"none" }}>
            DETROIT
          </div>

          {/* Stamp grid */}
          <div style={{ position:"relative",zIndex:1,display:"flex",flexWrap:"wrap",gap:"18px 12px",justifyContent:"center",alignItems:"flex-start" }}>
            {stamps.map((v,i) => (
              <VenueStamp key={String(v.id)} v={v} index={i} isNew={false} />
            ))}
          </div>

          {total === 0 && (
            <p style={{ ...MONO,fontSize:"0.42rem",letterSpacing:"0.08em",color:"rgba(201,168,76,0.25)",textAlign:"center",position:"relative",zIndex:1,marginTop:20,marginBottom:0 }}>
              Visit venues and mark them as visited to earn stamps
            </p>
          )}

          {/* Footer */}
          <div style={{ position:"relative",zIndex:1,textAlign:"center",marginTop:26,paddingTop:16,borderTop:`1px solid ${borderClr}` }}>
            <div style={{ ...MONO,fontSize:"0.28rem",letterSpacing:"0.22em",color:headerText,textTransform:"uppercase" }}>
              YOUR JOURNEY. YOUR CITY. YOUR STAMPS.
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
  const prevVisitedRef  = useRef(null);
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
      <div style={{ background:"var(--c-deep)", padding:"46px 20px 0", borderBottom:"1px solid var(--c-border)" }}>
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

      {subTab==="tonight"  && <TonightTab allVenues={allVenues} photoMap={photoMap}/>}
      {subTab==="saved"    && <SavedTab savedVenues={savedVenues||[]} savedEventItems={savedEventItems||[]} savedHotelItems={savedHotelItems||[]} toggleFav={toggleFav} onUnsaveEvent={onUnsaveEvent} onUnsaveHotel={onUnsaveHotel} onOpenVenue={onOpenVenue} photoMap={photoMap}/>}
      {subTab==="passport" && <PassportTab visited={visited} allVenues={allVenues} navTo={navTo} overlayVenueId={overlayId} onOverlayDone={()=>setOverlayId(null)}/>}
    </div>
  );
}
