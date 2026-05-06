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
// PASSPORT BOOK SYSTEM — CAT_BUILDING + BuildingSVG
// Detailed architectural silhouettes for VenueStamp (passport tab) ONLY.
// Never used in venue card footers — that system uses CardStamp in App.jsx.
// ─────────────────────────────────────────────────────────────────────────────
const CAT_BUILDING = {
  "Cocktail Lounges":        ["deco","arch","classic"],
  "Hidden Bars":             ["warehouse","loft","industrial"],
  "Rooftops":                ["terrace","modern","tower"],
  "Nightlife":               ["deco","modern","classic"],
  "Coffee Shops & Bakeries": ["cottage","tudor","classic"],
  "Dinner":                  ["arch","classic","deco"],
  "Breakfast":               ["cottage","classic","tudor"],
  "Sports Bars":             ["industrial","warehouse","classic"],
  "Happy Hour":              ["classic","loft","deco"],
  "Lunch":                   ["classic","cottage","arch"],
  "Outdoor Activities":      ["pavilion","bridge","terrace"],
  "Alley Spots":             ["loft","warehouse","industrial"],
};
function BuildingSVG({ type }) {
  const s  = { stroke:"currentColor", fill:"none", strokeWidth:1.2, strokeLinecap:"round", strokeLinejoin:"round" };
  const sd = { ...s, strokeWidth:0.6, opacity:0.52 };
  switch(type) {
    case "classic": return (
      <svg viewBox="0 0 72 52" width="72" height="52" style={{display:"block"}}>
        <path d="M8,22 L36,8 L64,22" style={s}/>
        <line x1="8" y1="22" x2="64" y2="22" style={s}/>
        <rect x="12" y="22" width="48" height="28" style={s}/>
        {[20,30,42,52].map(x=><line key={x} x1={x} y1="22" x2={x} y2="50" style={{...s,strokeWidth:.85}}/>)}
        <path d="M28,50 L28,38 Q28,34 36,34 Q44,34 44,38 L44,50" style={s}/>
        {[[14,26],[26,26],[40,26],[52,26]].map(([x,y])=><rect key={x} x={x} y={y} width="6" height="6" style={sd}/>)}
      </svg>
    );
    case "tower": return (
      <svg viewBox="0 0 72 52" width="72" height="52" style={{display:"block"}}>
        <line x1="36" y1="0" x2="36" y2="6" style={{...s,strokeWidth:1.6}}/>
        <rect x="30" y="6" width="12" height="8" style={s}/>
        <line x1="22" y1="14" x2="50" y2="14" style={sd}/>
        <rect x="20" y="14" width="32" height="10" style={s}/>
        <line x1="12" y1="24" x2="60" y2="24" style={sd}/>
        <rect x="12" y="24" width="48" height="26" style={s}/>
        {[32,38].map(x=><rect key={x} x={x} y={8} width="3" height="4" style={sd}/>)}
        {[23,30,38,45].map(x=><rect key={x} x={x} y={16} width="3" height="5" style={sd}/>)}
        {[14,22,30,38,46,54].map(x=><rect key={x} x={x} y={27} width="6" height="8" style={sd}/>)}
      </svg>
    );
    case "warehouse": return (
      <svg viewBox="0 0 72 52" width="72" height="52" style={{display:"block"}}>
        <rect x="4" y="20" width="64" height="30" style={s}/>
        <rect x="22" y="10" width="28" height="10" style={s}/>
        <line x1="4" y1="20" x2="22" y2="20" style={s}/>
        <line x1="50" y1="20" x2="68" y2="20" style={s}/>
        {[8,24,40,56].map(x=><path key={x} d={`M${x},50 L${x},34 Q${x},28 ${x+7},28 Q${x+14},28 ${x+14},34 L${x+14},50`} style={s}/>)}
        <line x1="4" y1="30" x2="68" y2="30" style={sd}/>
        <rect x="28" y="38" width="16" height="12" style={{...s,strokeWidth:.8}}/>
      </svg>
    );
    case "arch": return (
      <svg viewBox="0 0 72 52" width="72" height="52" style={{display:"block"}}>
        <path d="M4,10 L36,2 L68,10" style={s}/>
        <rect x="4" y="10" width="64" height="5" style={s}/>
        {[6,10,62,66].map(x=><line key={x} x1={x} y1="15" x2={x} y2="50" style={s}/>)}
        <path d="M20,50 L20,26 Q20,14 36,14 Q52,14 52,26 L52,50" style={s}/>
        <path d="M31,14 L36,10 L41,14" style={sd}/>
        <line x1="0" y1="48" x2="72" y2="48" style={sd}/>
      </svg>
    );
    case "tudor": return (
      <svg viewBox="0 0 72 52" width="72" height="52" style={{display:"block"}}>
        <rect x="8" y="26" width="56" height="24" style={s}/>
        <path d="M4,26 L36,8 L68,26" style={s}/>
        <path d="M4,30 L18,22 L32,30" style={{...s,strokeWidth:.9}}/>
        <path d="M40,30 L54,22 L68,30" style={{...s,strokeWidth:.9}}/>
        <line x1="8" y1="38" x2="64" y2="38" style={sd}/>
        <line x1="22" y1="26" x2="34" y2="38" style={sd}/>
        <line x1="50" y1="26" x2="38" y2="38" style={sd}/>
        {[10,26,42,56].map(x=><rect key={x} x={x} y={29} width="8" height="7" rx="1" style={sd}/>)}
        <path d="M29,50 L29,40 Q29,37 36,37 Q43,37 43,40 L43,50" style={s}/>
      </svg>
    );
    case "deco": return (
      <svg viewBox="0 0 72 52" width="72" height="52" style={{display:"block"}}>
        <path d="M26,14 L26,10 L30,8 L30,6 L36,3 L42,6 L42,8 L46,10 L46,14" style={s}/>
        <rect x="22" y="14" width="28" height="8" style={s}/>
        <rect x="16" y="22" width="40" height="8" style={s}/>
        <rect x="10" y="30" width="52" height="20" style={s}/>
        {[14,20,28,36,44,52,58].map(x=><line key={x} x1={x} y1="30" x2={x} y2="50" style={{...sd,strokeWidth:.42}}/>)}
        {[24,32,40].map(x=><rect key={x} x={x} y={33} width="6" height="9" style={sd}/>)}
        <line x1="10" y1="40" x2="62" y2="40" style={sd}/>
      </svg>
    );
    case "modern": return (
      <svg viewBox="0 0 72 52" width="72" height="52" style={{display:"block"}}>
        <rect x="18" y="4" width="36" height="46" style={s}/>
        {[10,16,22,28,34,40,46].map(y=><line key={y} x1="18" y1={y} x2="54" y2={y} style={{...sd,strokeWidth:.32}}/>)}
        {[24,30,36,42,48].map(x=><line key={x} x1={x} y1="4" x2={x} y2="50" style={{...sd,strokeWidth:.32}}/>)}
        <rect x="26" y="0" width="20" height="5" style={{...s,strokeWidth:.9}}/>
        <path d="M12,50 L12,46 L60,46 L60,50" style={{...s,strokeWidth:.9}}/>
        <path d="M8,50 L8,48 L64,48 L64,50" style={sd}/>
      </svg>
    );
    case "industrial": return (
      <svg viewBox="0 0 72 52" width="72" height="52" style={{display:"block"}}>
        <path d="M4,30 L16,16 L16,30 L28,16 L28,30 L40,16 L40,30 L52,16 L52,30 L64,16 L68,22 L68,30" style={s}/>
        <rect x="4" y="30" width="64" height="20" style={s}/>
        <rect x="54" y="12" width="7" height="18" style={{...s,strokeWidth:.9}}/>
        <line x1="54" y1="10" x2="61" y2="10" style={sd}/>
        {[8,22,36,50].map(x=><rect key={x} x={x} y={36} width="10" height="14" style={sd}/>)}
      </svg>
    );
    case "loft": return (
      <svg viewBox="0 0 72 52" width="72" height="52" style={{display:"block"}}>
        <rect x="6" y="10" width="60" height="40" style={s}/>
        <line x1="6" y1="10" x2="66" y2="10" style={{...s,strokeWidth:1.5}}/>
        {[[8,12],[22,12],[36,12],[50,12],[8,28],[22,28],[36,28],[50,28]].map(([x,y])=>(
          <rect key={`${x}-${y}`} x={x} y={y} width="12" height="11" style={{...s,strokeWidth:.9}}/>
        ))}
        {[8,22,36,50].flatMap(x=>[12,28].map(y=>(
          <line key={`${x}-${y}`} x1={x+6} y1={y} x2={x+6} y2={y+11} style={{...sd,strokeWidth:.42}}/>
        )))}
        <path d="M50,10 L50,6 L56,4 L62,4 L66,6 L66,10" style={{...s,strokeWidth:.8}}/>
      </svg>
    );
    case "bridge": return (
      <svg viewBox="0 0 72 52" width="72" height="52" style={{display:"block"}}>
        <path d="M2,40 Q36,8 70,40" style={s}/>
        <line x1="0" y1="40" x2="72" y2="40" style={s}/>
        {[12,20,28,36,44,52,60].map(x=>{
          const yA = Math.round(40 - 32*Math.sin(Math.PI*x/72));
          return <line key={x} x1={x} y1={40} x2={x} y2={yA} style={sd}/>;
        })}
        {[18,54].map(x=>(
          <React.Fragment key={x}>
            <line x1={x} y1={10} x2={x} y2={40} style={{...s,strokeWidth:1.4}}/>
            <line x1={x-5} y1={20} x2={x+5} y2={20} style={sd}/>
          </React.Fragment>
        ))}
        {[16,36,56].map(x=><path key={x} d={`M${x-5},46 Q${x},44 ${x+5},46`} style={{...sd,opacity:.35}}/>)}
      </svg>
    );
    case "terrace": return (
      <svg viewBox="0 0 72 52" width="72" height="52" style={{display:"block"}}>
        <line x1="0" y1="30" x2="72" y2="30" style={{...s,strokeWidth:1.5}}/>
        <rect x="4" y="22" width="64" height="8" style={s}/>
        {Array.from({length:10},(_,i)=>7+i*6).map(x=><line key={x} x1={x} y1="22" x2={x} y2="30" style={{...sd,strokeWidth:.62}}/>)}
        {[8,22,38,52].map(x=><rect key={x} x={x} y={12} width="9" height="10" rx="2" style={{...s,strokeWidth:.9}}/>)}
        {[12,26,42,56].map(x=><path key={x} d={`M${x},12 Q${x-2},8 ${x},5 Q${x+2},8 ${x},12`} style={sd}/>)}
        <path d="M2,22 L2,16 L10,16 L10,12 L16,12 L16,18 L22,18 L22,14 L28,14 L28,22" style={{...sd,opacity:.4}}/>
        <path d="M44,22 L44,18 L50,18 L50,12 L58,12 L58,8 L62,8 L62,16 L68,16 L68,22" style={{...sd,opacity:.4}}/>
      </svg>
    );
    case "pavilion": return (
      <svg viewBox="0 0 72 52" width="72" height="52" style={{display:"block"}}>
        <path d="M2,26 Q36,6 70,26" style={s}/>
        <path d="M8,28 Q36,12 64,28" style={{...s,strokeWidth:.7,opacity:.5}}/>
        {[8,20,36,52,64].map(x=><line key={x} x1={x} y1="28" x2={x} y2="50" style={s}/>)}
        <line x1="6" y1="28" x2="66" y2="28" style={{...s,strokeWidth:1.4}}/>
        <line x1="4" y1="50" x2="68" y2="50" style={s}/>
        <line x1="0" y1="48" x2="72" y2="48" style={sd}/>
        <circle cx="36" cy="18" r="4" style={{...sd,strokeWidth:.6}}/>
      </svg>
    );
    case "cottage": return (
      <svg viewBox="0 0 72 52" width="72" height="52" style={{display:"block"}}>
        <rect x="10" y="26" width="52" height="24" style={s}/>
        <path d="M4,26 L36,8 L68,26" style={s}/>
        <rect x="48" y="10" width="7" height="16" style={{...s,strokeWidth:.9}}/>
        <rect x="10" y="38" width="24" height="12" style={{...s,strokeWidth:.9}}/>
        {[14,22,30].map(x=><line key={x} x1={x} y1="38" x2={x} y2="50" style={{...sd,strokeWidth:.8}}/>)}
        <line x1="8" y1="38" x2="36" y2="38" style={{...s,strokeWidth:1.0}}/>
        <rect x="38" y="30" width="10" height="10" rx="1" style={sd}/>
        <rect x="14" y="28" width="9" height="8" rx="1" style={sd}/>
        <rect x="23" y="40" width="8" height="10" style={{...sd,strokeWidth:.8}}/>
      </svg>
    );
    default: return (
      <svg viewBox="0 0 72 52" width="72" height="52" style={{display:"block"}}>
        <rect x="14" y="18" width="44" height="32" style={s}/>
        <path d="M8,18 L36,6 L64,18" style={s}/>
        <path d="M26,50 L26,38 Q26,34 36,34 Q46,34 46,38 L46,50" style={s}/>
        {[[16,22],[26,22],[42,22],[52,22]].map(([x,y])=><rect key={x} x={x} y={y} width="7" height="7" style={sd}/>)}
      </svg>
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// VENUE CARD FOOTER SYSTEM — CAT_ICON + StampIconSVG
// Used by StampOverlay (press animation). Card footer uses CardStamp (App.jsx).
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

// (StampOutline removed — old dashed-card design uses div borders instead)

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
// VenueStamp — dashed-card passport stamp with colored fill, unique per venue
// ─────────────────────────────────────────────────────────────────────────────
function VenueStamp({ v, index, isNew, onOpen, date: propDate }) {
  const { hex, rgb, rot } = getStampStyle(v);
  const n = parseInt(String(v.id).replace(/\D/g,"")) || 0;
  const catTypes = CAT_BUILDING[v.cat] || ["classic"];
  const typeArr = Array.isArray(catTypes) ? catTypes : [catTypes];
  const btype = typeArr[n % typeArr.length];
  const catLabel = CAT_SHORT[v.cat] || v.cat?.toUpperCase() || "DETROIT";
  const serial = "DET-" + String(v.id).padStart(4,"0");
  const date   = propDate || null;
  const orn = ORNS[n % ORNS.length];

  // 3 layout shapes cycling by index position
  const shape = index % 3; // 0=landscape, 1=portrait, 2=square
  const w = shape === 1 ? 120 : shape === 2 ? 130 : 158;
  const h = shape === 1 ? 126 : shape === 2 ? 122 : 98;
  const svgScale = shape === 1 ? 0.78 : shape === 2 ? 0.84 : 0.74;
  const bv = n % 2; // border variant: 0=single dashed, 1=double dashed

  return (
    <div
      className={isNew ? "stamp-press" : undefined}
      onClick={() => onOpen && onOpen(String(v.id))}
      style={{
        width:w, height:h, flexShrink:0,
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
        background:`radial-gradient(ellipse at 50% 40%, rgba(${rgb},0.30) 0%, rgba(${rgb},0.10) 55%, transparent 82%)`,
        borderRadius:4, transform:`rotate(${rot}deg)`,
        padding:"5px 8px 6px",
        position:"relative", overflow:"hidden", boxSizing:"border-box",
        color: hex,
        filter:`drop-shadow(0 0 10px rgba(${rgb},0.38))`,
        cursor: onOpen ? "pointer" : "default",
      }}
    >
      {/* Diagonal watermark */}
      <span style={{ position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%) rotate(-16deg)",...MONO,fontSize:"0.20rem",letterSpacing:"0.28em",color:`rgba(${rgb},0.06)`,textTransform:"uppercase",whiteSpace:"nowrap",pointerEvents:"none",userSelect:"none",zIndex:0 }}>
        EXCLUSIVE DETROIT
      </span>

      {/* Outer dashed border */}
      <div style={{ position:"absolute",inset:3,borderRadius:3,border:`1.5px dashed rgba(${rgb},0.55)`,pointerEvents:"none",zIndex:0 }}/>

      {/* Double dashed inner border (variant 1) */}
      {bv === 1 && <div style={{ position:"absolute",inset:7,borderRadius:2,border:`1px dashed rgba(${rgb},0.22)`,pointerEvents:"none",zIndex:0 }}/>}

      <div style={{ position:"relative",zIndex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:shape===1?2:1,width:"100%" }}>

        {/* EXCLUSIVE DETROIT header */}
        <div style={{ ...MONO,fontSize:"0.26rem",letterSpacing:"0.28em",color:hex,opacity:.52,textTransform:"uppercase",textAlign:"center",marginBottom:1 }}>
          {orn} EXCLUSIVE DETROIT {orn}
        </div>

        {/* Building illustration */}
        <div style={{ opacity:.86, lineHeight:0, transform:`scale(${svgScale})`, transformOrigin:"center", marginBottom:-1 }}>
          <BuildingSVG type={btype}/>
        </div>

        {/* Venue name */}
        <div style={{ ...SERIF,fontSize:shape===1?"0.88rem":"0.82rem",fontWeight:700,color:hex,lineHeight:1.05,textAlign:"center",textTransform:"uppercase",letterSpacing:"0.02em",marginTop:shape===1?2:1 }}>
          {stampName(v.name)}
        </div>

        {/* Neighborhood */}
        <div style={{ ...MONO,fontSize:"0.38rem",letterSpacing:"0.14em",color:hex,opacity:.72,textTransform:"uppercase",textAlign:"center" }}>
          {v.hood.toUpperCase()}
        </div>

        {/* Category */}
        <div style={{ ...MONO,fontSize:"0.28rem",letterSpacing:"0.10em",color:hex,opacity:.46,textTransform:"uppercase",textAlign:"center" }}>
          ✦ {catLabel} ✦
        </div>

        {/* VISITED */}
        <div style={{ ...MONO,fontSize:"0.30rem",letterSpacing:"0.12em",color:hex,opacity:.62,textTransform:"uppercase" }}>
          VISITED
        </div>

        {/* Date — only shown when a real date is stored */}
        {date && (
          <div style={{ ...MONO,fontSize:"0.28rem",letterSpacing:"0.07em",color:hex,opacity:.40 }}>
            {date}
          </div>
        )}

        {/* Serial */}
        <div style={{ ...MONO,fontSize:"0.24rem",letterSpacing:"0.06em",color:hex,opacity:.26 }}>
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
  const n = parseInt(String(venue.id).replace(/\D/g,"")) || 0;
  const catTypesO = CAT_BUILDING[venue.cat] || ["classic"];
  const typeArrO = Array.isArray(catTypesO) ? catTypesO : [catTypesO];
  const btype = typeArrO[n % typeArrO.length];
  const orn = ORNS[n % ORNS.length];
  const serial = "DET-" + String(venue.id).padStart(4,"0");
  const catLabel = CAT_SHORT[venue.cat] || venue.cat?.toUpperCase() || "DETROIT";
  useEffect(() => { const t = setTimeout(onDone, 2900); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{ position:"fixed",inset:0,zIndex:9990,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none",background:"rgba(5,3,1,0.65)" }}>
      <div className="stamp-overlay-press" style={{
        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",
        width:268, minHeight:0,
        border:`2px dashed rgba(${rgb},0.82)`,
        boxShadow:`0 0 0 6px rgba(${rgb},0.07), 0 0 0 11px rgba(${rgb},0.03), 0 0 56px rgba(${rgb},0.26)`,
        background:`radial-gradient(ellipse at 48% 38%, rgba(${rgb},0.28) 0%, rgba(7,4,1,0.98) 72%)`,
        borderRadius:6, transform:`rotate(${rot}deg)`, padding:"14px 20px 16px", position:"relative", overflow:"hidden",
        color: hex,
        filter:`drop-shadow(0 0 20px rgba(${rgb},0.48))`,
      }}>
        {/* Watermark */}
        <span style={{ position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%) rotate(-14deg)",...MONO,fontSize:"0.32rem",letterSpacing:"0.42em",color:`rgba(${rgb},0.055)`,textTransform:"uppercase",whiteSpace:"nowrap",pointerEvents:"none",userSelect:"none" }}>
          EXCLUSIVE DETROIT
        </span>

        {/* Inner border */}
        <div style={{ position:"absolute",inset:10,border:`0.5px dashed rgba(${rgb},0.12)`,borderRadius:2,pointerEvents:"none" }}/>

        <div style={{ position:"relative",zIndex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,width:"100%" }}>
          {/* Header */}
          <div style={{ ...MONO,fontSize:"0.28rem",letterSpacing:"0.30em",textTransform:"uppercase",color:hex,opacity:.58,marginBottom:1 }}>
            {orn} EXCLUSIVE DETROIT {orn}
          </div>

          <div style={{ width:"72%",height:"0.5px",background:`rgba(${rgb},0.32)`,marginBottom:2 }}/>

          {/* Building */}
          <div style={{ opacity:.82, lineHeight:0, transform:"scale(1.0)", transformOrigin:"center" }}>
            <BuildingSVG type={btype}/>
          </div>

          <div style={{ width:"62%",height:"0.5px",background:`rgba(${rgb},0.22)`,marginBottom:1 }}/>

          {/* Venue name */}
          <div style={{ ...SERIF,fontSize:"1.35rem",fontWeight:700,color:hex,lineHeight:1.08,textTransform:"uppercase",textAlign:"center",letterSpacing:"0.02em" }}>
            {stampName(venue.name)}
          </div>

          <div style={{ width:"82%",height:"0.5px",background:`rgba(${rgb},0.45)`,marginTop:2,marginBottom:2 }}/>

          {/* Neighborhood */}
          <div style={{ ...MONO,fontSize:"0.40rem",letterSpacing:"0.20em",color:hex,opacity:.80,textTransform:"uppercase" }}>
            {venue.hood.toUpperCase()}
          </div>

          {/* Category */}
          <div style={{ ...MONO,fontSize:"0.30rem",letterSpacing:"0.14em",color:hex,opacity:.55,textTransform:"uppercase" }}>
            {orn} {catLabel} {orn}
          </div>

          {/* VISITED */}
          <div style={{ ...MONO,fontSize:"0.32rem",letterSpacing:"0.18em",color:hex,opacity:.70,textTransform:"uppercase",marginTop:1 }}>
            VISITED
          </div>

          {/* Bottom ornament divider */}
          <div style={{ display:"flex",alignItems:"center",gap:5,width:"80%",marginTop:2 }}>
            <div style={{ flex:1,height:"0.5px",background:`rgba(${rgb},0.32)` }}/>
            <span style={{ fontSize:"0.20rem",color:hex,opacity:.38 }}>✦</span>
            <div style={{ flex:1,height:"0.5px",background:`rgba(${rgb},0.32)` }}/>
          </div>

          {/* Serial */}
          <div style={{ ...MONO,fontSize:"0.28rem",letterSpacing:"0.12em",color:hex,opacity:.42 }}>
            {serial} · PASSPORT VERIFIED
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
  const isHighE = val === "highenergy" && active;
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={() => onSet(val)}
      onMouseDown={()=>setPressed(true)} onMouseUp={()=>setPressed(false)} onMouseLeave={()=>setPressed(false)} onTouchStart={()=>setPressed(true)} onTouchEnd={()=>setPressed(false)}
      style={{
        ...MONO, fontSize:"0.58rem", letterSpacing:"0.09em", textTransform:"uppercase",
        display:"flex", alignItems:"center", gap:6, padding:"9px 14px", borderRadius:8,
        border:`1px solid ${active ? (isHighE ? "rgba(232,120,40,0.7)" : "rgba(201,168,76,0.55)") : "rgba(201,168,76,0.30)"}`,
        background: active
          ? (isHighE ? "linear-gradient(135deg,#E8832A 0%,#C96A16 100%)" : "linear-gradient(135deg,#C9A84C 0%,#A8872E 100%)")
          : "var(--c-tonight-chip-bg)",
        color: active ? "#0A0808" : "var(--c-tonight-chip-txt)",
        boxShadow: active
          ? (isHighE ? "0 2px 16px rgba(232,120,40,0.45)" : "0 2px 14px rgba(201,168,76,0.35)")
          : "none",
        cursor:"pointer", transition:"all 0.12s",
        transform: pressed ? "scale(0.91)" : "scale(1)", whiteSpace:"nowrap", flexShrink:0,
      }}
    >
      <span style={{ opacity: active ? 1 : 0.7, flexShrink:0 }}>{icon}</span>
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
    <div style={{ width:38,height:38,borderRadius:"50%",border:"2px solid var(--c-gold)",background:"rgba(201,168,76,0.22)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,...MONO,fontSize:"0.78rem",fontWeight:700,color:"var(--c-gold)",zIndex:1,position:"relative",boxShadow:"0 0 10px rgba(201,168,76,0.38),inset 0 0 6px rgba(201,168,76,0.10)" }}>
      {n}
    </div>
  );

  return (
    <div style={{ position:"relative", minHeight:"calc(100dvh - 68px - env(safe-area-inset-top))" }}>
      {/* Background image — fixed 100dvh height so it never zooms when results load */}
      <img src="/detroit-skyline.jpg" alt="" aria-hidden="true" style={{ position:"absolute",top:0,left:0,width:"100%",height:"100dvh",objectFit:"cover",objectPosition:"center 30%",pointerEvents:"none",userSelect:"none",zIndex:0,display:"block" }}/>
      {/* Cinematic overlay — same fixed height as image */}
      <div style={{ position:"absolute",top:0,left:0,width:"100%",height:"100dvh",background:"var(--c-tonight-overlay)",pointerEvents:"none",zIndex:0 }}/>
      <div style={{ position:"relative",zIndex:1, padding:"28px 20px calc(80px + env(safe-area-inset-bottom))", maxWidth:680, margin:"0 auto" }}>

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
        <div style={{ position:"absolute",left:18,top:38,bottom:38,borderLeft:"2.5px dashed rgba(201,168,76,0.85)",zIndex:0,pointerEvents:"none" }}/>

        {/* Q1 — When */}
        <div style={{ display:"flex",gap:14,alignItems:"flex-start",marginBottom:20 }}>
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
        <div style={{ display:"flex",gap:14,alignItems:"flex-start",marginBottom:20 }}>
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
        <div style={{ display:"flex",gap:14,alignItems:"flex-start",marginBottom:26 }}>
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

      {/* Summary + CTA — single glass card matching mockup */}
      <div style={{ background:"var(--c-tonight-glass)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",border:"1px solid var(--c-tonight-glass-bdr)",borderRadius:16,padding:"20px 20px 20px" }}>
        {/* Summary text */}
        <div style={{ display:"flex",alignItems:"flex-start",gap:12,marginBottom:18 }}>
          <span style={{ fontSize:"1.3rem",color:"var(--c-gold)",flexShrink:0,lineHeight:1,marginTop:2 }}>✦</span>
          <p style={{ ...SERIF,fontSize:"1.05rem",fontStyle:"italic",color:"var(--c-white)",lineHeight:1.6,margin:0 }}>
            {buildNightSummary(when, who, energy)}
          </p>
        </div>
        {/* Build button — solid gold */}
        <button
          onClick={handleBuild}
          onMouseDown={()=>setBtnPrs(true)} onMouseUp={()=>setBtnPrs(false)} onMouseLeave={()=>setBtnPrs(false)} onTouchStart={()=>setBtnPrs(true)} onTouchEnd={()=>setBtnPrs(false)}
          style={{
            ...MONO, fontSize:"0.54rem", letterSpacing:"0.18em", textTransform:"uppercase",
            width:"100%", padding:"18px 0", borderRadius:100,
            border:"none", color:"#0A0808",
            background: building ? "rgba(160,122,40,0.85)" : "linear-gradient(135deg,#C9A84C 0%,#A8872E 100%)",
            boxShadow: building ? "none" : "0 4px 28px rgba(201,168,76,0.4)",
            cursor:"pointer", transition:"all 0.12s",
            transform: btnPrs ? "scale(0.97)" : "scale(1)",
          }}
        >
          {building ? "Building your night…" : "BUILD MY NIGHT ✨"}
        </button>
      </div>

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
