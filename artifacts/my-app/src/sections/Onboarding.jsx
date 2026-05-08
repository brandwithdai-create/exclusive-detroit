import React, { useState, useRef, useEffect } from "react";

const MONO  = { fontFamily:"'DM Mono',monospace" };
const SERIF = { fontFamily:"'Cormorant Garamond',serif" };

/* ── Animation keyframes injected once ────────────────────────────────── */
const ANIM_CSS = `
@keyframes ob-fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes ob-fadeIn{from{opacity:0}to{opacity:1}}
@keyframes ob-compassPulse{0%,100%{transform:scale(1);opacity:.95}50%{transform:scale(1.10);opacity:1}}
@keyframes ob-iconGlow{0%,100%{filter:drop-shadow(0 0 3px rgba(201,168,76,0.35))}50%{filter:drop-shadow(0 0 14px rgba(201,168,76,0.90))}}
@keyframes ob-heartFill{0%{transform:scale(1)}35%{transform:scale(1.28)}65%{transform:scale(0.94)}100%{transform:scale(1)}}
@keyframes ob-chipIn{from{opacity:0;transform:translateX(22px)}to{opacity:1;transform:translateX(0)}}
@keyframes ob-slideRight{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}
@keyframes ob-cardUp{from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:translateY(0)}}
@keyframes ob-btnPulse{0%,100%{box-shadow:0 0 0 0 rgba(201,168,76,0)}50%{box-shadow:0 0 0 7px rgba(201,168,76,0.18)}}

@keyframes ob-stampDrop{
  0%{opacity:0;transform:scale(2.2) rotate(-26deg)}
  42%{opacity:1;transform:scale(0.80) rotate(-4deg)}
  60%{transform:scale(1.12) rotate(-10deg)}
  75%{transform:scale(0.94) rotate(-6deg)}
  88%{transform:scale(1.04) rotate(-8.5deg)}
  100%{opacity:1;transform:scale(1) rotate(-8deg)}
}

@keyframes ob-ripple1{
  0%{opacity:0.78;transform:scale(0.72)}
  100%{opacity:0;transform:scale(2.50)}
}

@keyframes ob-handApproach{
  from{opacity:0;transform:translateY(42px)}
  to{opacity:1;transform:translateY(0)}
}

@keyframes ob-handTap{
  0%{transform:translateY(0)}
  30%{transform:translateY(10px) scale(0.93)}
  62%{transform:translateY(4px) scale(0.97)}
  100%{transform:translateY(2px) scale(1)}
}

@keyframes ob-stampGlow{
  0%,100%{filter:drop-shadow(0 0 10px rgba(201,168,76,0.50))}
  50%{filter:drop-shadow(0 0 40px rgba(201,168,76,1.00)) drop-shadow(0 0 18px rgba(201,168,76,0.80))}
}

@keyframes ob-arrowDraw{
  from{stroke-dashoffset:160}
  to{stroke-dashoffset:0}
}

@keyframes ob-pulseBorder{
  0%,100%{border-color:rgba(201,168,76,0.88);box-shadow:0 0 18px rgba(201,168,76,0.55)}
  50%{border-color:rgba(201,168,76,1);box-shadow:0 0 32px rgba(201,168,76,0.88),0 0 8px rgba(201,168,76,0.60)}
}
`;

/* ── Per-slide configuration ──────────────────────────────────────────── */
const SLIDES = [
  {
    id:"discover", dark:true,
    bg:"/detroit-skyline.jpg", bgPos:"center 32%",
    imgFilter:"brightness(0.70) saturate(1.12)",
    overlay:"linear-gradient(to bottom,rgba(4,2,1,0.30) 0%,rgba(4,2,1,0.04) 26%,rgba(4,2,1,0.38) 58%,rgba(4,2,1,0.93) 78%,rgba(4,2,1,0.99) 100%)",
  },
  {
    id:"build", dark:false,
    bg:"/detroit-skyline-light.jpg", bgPos:"center 44%",
    imgFilter:"brightness(0.84) saturate(0.82) sepia(0.22)",
    overlay:"linear-gradient(to bottom,rgba(240,228,200,0.56) 0%,rgba(240,228,200,0.16) 28%,rgba(240,228,200,0.60) 60%,rgba(240,228,200,0.96) 76%,rgba(240,228,200,0.99) 100%)",
  },
  {
    id:"passport", dark:true,
    bg:"/detroit-skyline.jpg", bgPos:"center 16%",
    imgFilter:"brightness(0.36) saturate(0.70)",
    overlay:"linear-gradient(to bottom,rgba(4,2,1,0.65) 0%,rgba(4,2,1,0.38) 30%,rgba(4,2,1,0.78) 62%,rgba(4,2,1,0.97) 82%,rgba(4,2,1,0.99) 100%)",
  },
  {
    id:"save", dark:false,
    bg:"/hotels/shinola.jpg", bgPos:"center 28%",
    imgFilter:"brightness(0.98) saturate(0.78) sepia(0.14)",
    overlay:"linear-gradient(to bottom,rgba(240,228,200,0.44) 0%,rgba(240,228,200,0.10) 26%,rgba(240,228,200,0.54) 60%,rgba(240,228,200,0.96) 76%,rgba(240,228,200,0.99) 100%)",
  },
];

const ORNAMENTS = [
  "EXCLUSIVE DETROIT",
  "PERSONALIZED ITINERARY",
  "YOUR DETROIT JOURNEY",
  "ALWAYS WITH YOU",
];

const DESCS = [
  "The insider's guide to Detroit's most exclusive dining, cocktails, experiences, and hidden gems.",
  "Answer a few questions and we'll craft your perfect 3-stop Detroit itinerary — tailored to you.",
  "Mark venues as visited and earn passport stamps with your visit dates. Your Detroit journey, recorded.",
  "Heart venues, save nights, collect passport stamps. Everything stays on your device — no account needed.",
];

const TITLES = [
  { line1:"Discover", line2:"Detroit", line3:"Hidden Gems" },
  { line1:"Build", line2:"My Night" },
  { line1:"Collect", line2:"Passport Stamps" },
  { line1:"Save", line2:"Everything" },
];

/* ── Color palette per theme ──────────────────────────────────────────── */
function palette(dark) {
  return {
    gold:    dark ? "rgba(201,168,76,0.96)"  : "rgba(138,96,16,0.90)",
    goldD:   dark ? "rgba(201,168,76,0.78)"  : "rgba(138,96,16,0.72)",
    title1:  dark ? "#ffffff"                : "#1A0E00",
    title2:  dark ? "rgba(201,168,76,0.96)"  : "rgba(138,96,16,0.90)",
    desc:    dark ? "rgba(232,224,212,0.82)" : "rgba(58,32,8,0.76)",
    orn:     dark ? "rgba(201,168,76,0.66)"  : "rgba(138,96,16,0.62)",
    skip:    dark ? "rgba(232,224,212,0.46)" : "rgba(58,32,8,0.36)",
    dotOn:   dark ? "rgba(201,168,76,0.96)"  : "rgba(138,96,16,0.88)",
    dotOff:  dark ? "rgba(201,168,76,0.22)"  : "rgba(138,96,16,0.18)",
    nxtBg:   dark ? "rgba(10,8,6,0.62)"      : "rgba(245,238,218,0.94)",
    nxtBdr:  dark ? "rgba(201,168,76,0.50)"  : "rgba(138,96,16,0.52)",
    nxtTxt:  dark ? "rgba(201,168,76,0.96)"  : "#2E1A0E",
    chipBg:  dark ? "rgba(14,11,6,0.75)"     : "rgba(245,238,218,0.88)",
    chipBdr: dark ? "rgba(201,168,76,0.22)"  : "rgba(138,96,16,0.24)",
    chipLbl: dark ? "rgba(201,168,76,0.68)"  : "rgba(138,96,16,0.62)",
    chipVal: dark ? "rgba(235,225,210,0.92)" : "#1A0E00",
    ts:      dark ? "0 2px 28px rgba(0,0,0,0.65)" : "0 1px 12px rgba(240,230,200,0.72)",
  };
}

/* ── SVG icons ───────────────────────────────────────────────────────── */
function PassportSVG({ stroke, w=16, h=13 }) {
  return (
    <svg width={w} height={h} viewBox="0 0 72 50" fill="none" stroke={stroke} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <rect x="10" y="22" width="52" height="26"/>
      <rect x="24" y="12" width="24" height="10"/>
      <rect x="30" y="6" width="12" height="6"/>
      <rect x="16" y="17" width="40" height="5"/>
      <rect x="14" y="29" width="8" height="8" opacity="0.5"/>
      <rect x="28" y="34" width="16" height="14"/>
      <rect x="50" y="29" width="8" height="8" opacity="0.5"/>
    </svg>
  );
}

/* ── Hand SVG — index finger extended upward, other fingers curled ─── */
function HandSVG() {
  const skin = "rgba(216,176,118,0.97)";
  const dark  = "rgba(148,98,38,0.24)";
  return (
    <svg width="46" height="66" viewBox="0 0 46 66" fill="none">
      {/* Index finger body */}
      <rect x="14" y="2" width="16" height="38" rx="8" fill={skin}/>
      {/* Fingernail */}
      <ellipse cx="22" cy="7" rx="5" ry="5.5" fill="rgba(244,216,172,0.55)"/>
      {/* Knuckle crease */}
      <path d="M16 33 Q22 36 30 33" stroke={dark} strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      {/* Palm */}
      <path d="M6 40 Q4 55 22 62 Q40 55 40 40 Z" fill={skin}/>
      {/* Middle finger curled — right of index */}
      <path d="M31 18 C40 15 42 28 40 37 L40 40" stroke={skin} strokeWidth="11" strokeLinecap="round" fill="none"/>
      {/* Ring finger */}
      <path d="M31 30 C37 28 38 34 38 40" stroke={skin} strokeWidth="9" strokeLinecap="round" fill="none"/>
      {/* Pinky */}
      <path d="M31 36 C34 34 34 38 34 40" stroke={skin} strokeWidth="7" strokeLinecap="round" fill="none"/>
      {/* Thumb — left of index */}
      <path d="M6 32 C-2 26 -1 16 6 13 C13 10 18 17 18 27 L14 40" stroke={skin} strokeWidth="10" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

/* ── Slide 1 upper: animated compass ────────────────────────────────── */
function CompassAnim({ c }) {
  return (
    <div style={{ animation:"ob-fadeIn 0.6s ease both 0.2s, ob-compassPulse 3.2s ease-in-out 0.8s infinite" }}>
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style={{ filter:`drop-shadow(0 0 10px ${c.replace("0.96","0.45")})` }}>
        <circle cx="32" cy="32" r="26" stroke={c} strokeWidth="1.2" strokeDasharray="3.5 2.5"/>
        <circle cx="32" cy="32" r="18" stroke={c} strokeWidth="0.8" opacity="0.4"/>
        <circle cx="32" cy="32" r="3" fill={c}/>
        <polygon points="32,10 35.5,28 32,25 28.5,28" fill={c} fillOpacity="0.95"/>
        <polygon points="32,54 28.5,36 32,39 35.5,36" fill={c} fillOpacity="0.30"/>
        <line x1="32" y1="6" x2="32" y2="10" stroke={c} strokeWidth="1.3"/>
        <line x1="32" y1="54" x2="32" y2="58" stroke={c} strokeWidth="1.3"/>
        <line x1="6" y1="32" x2="10" y2="32" stroke={c} strokeWidth="1.3"/>
        <line x1="54" y1="32" x2="58" y2="32" stroke={c} strokeWidth="1.3"/>
      </svg>
    </div>
  );
}

/* ── Slide 2 upper: sparkle icon ───────────────────────────────────── */
function SparkleAnim({ c }) {
  return (
    <div style={{ animation:"ob-fadeIn 0.6s ease both 0.2s, ob-iconGlow 2.8s ease-in-out 0.8s infinite" }}>
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style={{ filter:`drop-shadow(0 0 8px ${c.replace("0.90","0.38")})` }}>
        <circle cx="32" cy="32" r="26" stroke={c} strokeWidth="1.2" strokeDasharray="4 2.5"/>
        <path d="M32,16 L34.2,28 L46,27 L36,32 L40,43 L32,36 L24,43 L28,32 L18,27 L29.8,28 Z" fill={c} fillOpacity="0.20" stroke={c} strokeWidth="1.1" strokeLinejoin="round"/>
        <circle cx="32" cy="32" r="2.5" fill={c}/>
        <circle cx="32" cy="10" r="1.5" fill={c} opacity="0.55"/>
        <circle cx="50" cy="20" r="1" fill={c} opacity="0.45"/>
        <circle cx="14" cy="20" r="1" fill={c} opacity="0.45"/>
      </svg>
    </div>
  );
}

/* ── Slide 3 — full passport interaction scene ──────────────────────── */
function PassportCardAnim() {
  const [phase, setPhase] = useState(0);
  // Phase timeline:
  // 0 → card floats in (immediate)
  // 1 (900ms)  → hand approaches passport button
  // 2 (1800ms) → passport button glows + ripple rings start
  // 3 (2550ms) → hand taps (press animation)
  // 4 (3100ms) → VISITED stamp slams down
  // 5 (4000ms) → stamp glow pulse + curved arrow draws
  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 900),
      setTimeout(() => setPhase(2), 1800),
      setTimeout(() => setPhase(3), 2550),
      setTimeout(() => setPhase(4), 3100),
      setTimeout(() => setPhase(5), 4000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const GOLD   = "rgba(201,168,76,1)";
  const GOLD_D = "rgba(201,168,76,0.72)";

  return (
    <div style={{ position:"relative", animation:"ob-cardUp 0.65s cubic-bezier(0.22,1,0.36,1) both 0.15s" }}>

      {/* ── Curved dashed arrow: stamp → passport button ── */}
      {phase >= 5 && (
        <svg
          style={{ position:"absolute", top:0, left:0, width:310, height:300,
            overflow:"visible", pointerEvents:"none", zIndex:12 }}
        >
          <path
            d="M 254 -22 C 308 52 300 155 240 226"
            stroke="rgba(201,168,76,0.55)" strokeWidth="1.6" fill="none"
            strokeDasharray="5 4" strokeLinecap="round"
            strokeDashoffset="0"
            style={{ animation:"ob-arrowDraw 0.90s ease both" }}
          />
          {/* Arrowhead */}
          <path d="M232,224 L243,232 L237,218"
            stroke="rgba(201,168,76,0.55)" strokeWidth="1.6"
            fill="none" strokeLinecap="round" strokeLinejoin="round"
            style={{ animation:"ob-fadeIn 0.40s ease both 0.82s" }}
          />
        </svg>
      )}

      {/* ── Venue card ── */}
      <div style={{
        width: 270,
        background: "rgba(7,5,2,0.97)",
        border: `1.5px solid rgba(201,168,76,${phase >= 4 ? 0.60 : 0.42})`,
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: `0 20px 60px rgba(0,0,0,0.80), 0 0 0 1px rgba(201,168,76,0.07)${phase >= 5 ? ", 0 0 48px rgba(201,168,76,0.07)" : ""}`,
        transform: "rotate(-2deg)",
        transition: "border-color 0.45s, box-shadow 0.55s",
        position: "relative",
      }}>

        {/* Image strip */}
        <div style={{ height:132, background:"rgba(16,8,3,1)", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute",inset:0,backgroundImage:"url(/hotels/foundation.jpg)",backgroundSize:"cover",backgroundPosition:"center 35%",opacity:0.75 }}/>
          <div style={{ position:"absolute",inset:0,background:"linear-gradient(to bottom,transparent 38%,rgba(7,5,2,0.72))" }}/>
          <div style={{ position:"absolute",top:9,right:9,width:30,height:30,borderRadius:"50%",
            background:"rgba(0,0,0,0.54)",border:"1px solid rgba(255,255,255,0.20)",
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:"0.80rem",color:"rgba(255,255,255,0.88)" }}>♡</div>
        </div>

        {/* Card content */}
        <div style={{ padding:"11px 13px 6px" }}>
          <div style={{ ...MONO,fontSize:"0.32rem",letterSpacing:"0.14em",textTransform:"uppercase",color:GOLD_D,marginBottom:5 }}>
            Rooftops · Downtown
          </div>
          <div style={{ ...SERIF,fontSize:"1.05rem",fontWeight:700,color:"#fff",lineHeight:1.05,marginBottom:2 }}>
            Monarch Club
          </div>
          <div style={{ ...SERIF,fontSize:"0.72rem",fontWeight:400,color:"rgba(210,200,185,0.88)",lineHeight:1.1,marginBottom:6 }}>
            Rooftop Terraces
          </div>
          <div style={{ ...MONO,fontSize:"0.30rem",letterSpacing:"0.05em",color:"rgba(201,168,76,0.72)",marginBottom:0 }}>
            🍹 Fire pit terraces · Intimate
          </div>
        </div>

        {/* CTA row */}
        <div style={{ display:"flex",gap:7,padding:"5px 10px 13px",alignItems:"center" }}>
          {/* Book Now */}
          <div style={{ flex:1,padding:"10px 0",borderRadius:9,
            background:"linear-gradient(135deg,#B88E38 0%,#C9A848 100%)",
            textAlign:"center",...MONO,fontSize:"0.42rem",letterSpacing:"0.17em",
            textTransform:"uppercase",color:"#0C0904",fontWeight:700 }}>
            BOOK NOW
          </div>

          {/* Passport button — glows on phase ≥ 2 */}
          <div style={{
            position: "relative",
            width: 42, height: 42, flexShrink: 0, borderRadius: 9,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: phase >= 2 ? "rgba(201,168,76,0.20)" : "rgba(201,168,76,0.06)",
            border: phase >= 2 ? "1.5px solid rgba(201,168,76,0.90)" : "1.5px solid rgba(201,168,76,0.28)",
            boxShadow: phase >= 2 ? "0 0 24px rgba(201,168,76,0.70), 0 0 8px rgba(201,168,76,0.45)" : "none",
            transition: "all 0.42s cubic-bezier(0.22,1,0.36,1)",
            animation: phase >= 2 ? "ob-pulseBorder 1.1s ease-in-out 0.1s 3" : "none",
            zIndex: 2,
          }}>
            <PassportSVG stroke={GOLD} w={16} h={13}/>

            {/* Ripple rings — 3 staggered */}
            {phase >= 2 && [0, 0.35, 0.70].map((delay, i) => (
              <div key={i} style={{
                position: "absolute",
                inset: -(5 + i * 9),
                borderRadius: 13 + i * 9,
                border: `${1.6 - i * 0.4}px solid rgba(201,168,76,${0.65 - i * 0.18})`,
                animation: `ob-ripple1 1.20s ease-out ${delay}s infinite`,
                pointerEvents: "none",
              }}/>
            ))}
          </div>
        </div>
      </div>

      {/* ── Hand / finger ── */}
      {phase >= 1 && (
        <div style={{
          position: "absolute",
          bottom: -14,
          right: 4,
          zIndex: 20,
          pointerEvents: "none",
          transformOrigin: "bottom center",
          animation: phase >= 3
            ? "ob-handTap 0.58s cubic-bezier(0.34,1.56,0.64,1) both"
            : "ob-handApproach 0.78s cubic-bezier(0.22,1,0.36,1) both",
        }}>
          <HandSVG/>
        </div>
      )}

      {/* ── VISITED stamp ── */}
      {phase >= 4 && (
        <div style={{
          position: "absolute",
          top: -40,
          right: -16,
          zIndex: 15,
          animation: "ob-stampDrop 0.78s cubic-bezier(0.22,1,0.36,1) both",
          filter: phase >= 5 ? undefined : "drop-shadow(0 6px 28px rgba(201,168,76,0.40))",
        }}>
          <div style={{
            width: 120, height: 120, borderRadius: "50%",
            border: "3.5px solid rgba(201,168,76,0.94)",
            background: "rgba(5,3,1,0.98)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            position: "relative",
            boxShadow: phase >= 5
              ? "0 0 52px rgba(201,168,76,0.72), 0 0 22px rgba(201,168,76,0.50), inset 0 0 36px rgba(201,168,76,0.10)"
              : "0 8px 36px rgba(201,168,76,0.38), inset 0 0 18px rgba(201,168,76,0.06)",
            transform: "rotate(-8deg)",
            transition: "box-shadow 0.70s ease",
            animation: phase >= 5 ? "ob-stampGlow 2.4s ease-in-out 0.15s 2" : "none",
          }}>
            {/* Inner dashed ring */}
            <div style={{
              position: "absolute", inset: 9, borderRadius: "50%",
              border: "1px dashed rgba(201,168,76,0.35)",
              pointerEvents: "none",
            }}/>
            {/* Stars ring dots */}
            <div style={{ ...MONO,fontSize:"0.22rem",letterSpacing:"0.13em",
              color:"rgba(201,168,76,0.74)",textTransform:"uppercase",
              lineHeight:1, marginBottom:6 }}>
              ★ EXCL DETROIT ★
            </div>
            <div style={{ ...MONO,fontSize:"0.80rem",fontWeight:700,letterSpacing:"0.06em",
              color:GOLD,textTransform:"uppercase",lineHeight:1, marginBottom:4 }}>
              VISITED
            </div>
            <div style={{ ...MONO,fontSize:"0.22rem",letterSpacing:"0.06em",
              color:"rgba(201,168,76,0.68)",textTransform:"uppercase",lineHeight:1 }}>
              MAY 24, 2026
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Slide 4 upper: animated heart ─────────────────────────────────── */
function HeartAnim({ c, filled }) {
  const path="M32,46 C32,46 10,32 10,19 C10,12.4 15.4,7 22,7 C25.9,7 29.4,9 32,12.3 C34.6,9 38.1,7 42,7 C48.6,7 54,12.4 54,19 C54,32 32,46 32,46 Z";
  return (
    <div style={{ animation:"ob-fadeIn 0.6s ease both 0.2s", position:"relative" }}>
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style={{ filter:`drop-shadow(0 0 ${filled?"14px":"6px"} ${c.replace("0.90","0.45")})`, transition:"filter 0.5s" }}>
        <circle cx="32" cy="32" r="26" stroke={c} strokeWidth="1.2" strokeDasharray="3.5 2.5"/>
        <path d={path}
          fill={filled ? c : "none"}
          fillOpacity={filled ? 0.90 : 0}
          stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"
          style={{ transition:"fill-opacity 0.45s, fill 0.45s", animation:filled?"ob-heartFill 0.55s ease":"none" }}
        />
      </svg>
    </div>
  );
}

/* ── Slide 2 chips ───────────────────────────────────────────────────── */
function BuildChips({ c }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setShown(1), 600);
    const t2 = setTimeout(() => setShown(2), 1150);
    const t3 = setTimeout(() => setShown(3), 1700);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);
  const chips = [
    { icon:"◷", label:"TIME", value:"7PM" },
    { icon:"✦", label:"VIBE", value:"UPSCALE" },
    { icon:"◉", label:"GROUP", value:"2 OF US" },
  ];
  return (
    <div style={{ display:"flex",gap:6,alignItems:"center",justifyContent:"center",marginBottom:18,flexWrap:"nowrap" }}>
      {chips.map((chip, i) => (
        <React.Fragment key={chip.label}>
          <div style={{ opacity:shown>i?1:0, transform:shown>i?"translateX(0)":"translateX(22px)", transition:`opacity 0.40s,transform 0.40s`, display:"flex",flexDirection:"column",alignItems:"center",gap:3,background:c.chipBg,border:`1px solid ${c.chipBdr}`,borderRadius:10,padding:"8px 11px",minWidth:60 }}>
            <span style={{ ...MONO,fontSize:"0.62rem",color:c.gold,lineHeight:1 }}>{chip.icon}</span>
            <span style={{ ...MONO,fontSize:"0.34rem",letterSpacing:"0.11em",color:c.chipLbl,textTransform:"uppercase",lineHeight:1 }}>{chip.label}</span>
            <span style={{ ...MONO,fontSize:"0.48rem",fontWeight:700,color:c.chipVal,lineHeight:1 }}>{chip.value}</span>
          </div>
          {i < chips.length-1 && (
            <span style={{ ...MONO,fontSize:"0.80rem",color:c.goldD,opacity:shown>i?0.60:0,transition:"opacity 0.40s",lineHeight:1,flexShrink:0 }}>→</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ── Slide 4 save items ─────────────────────────────────────────────── */
function SaveItems({ c }) {
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVis(true), 450);
    return () => clearTimeout(t);
  }, []);
  const items = [
    { type:"heart", label:"Bad Luck Bar saved" },
    { type:"passport", label:"Monarch Club stamped" },
    { type:"plan", label:"Friday Night plan saved" },
  ];
  function ItemIcon({ type }) {
    const s = c.gold;
    if (type === "heart") return <span style={{ fontSize:"0.90rem",color:s,lineHeight:1 }}>♥</span>;
    if (type === "passport") return <PassportSVG stroke={s} w={14} h={11}/>;
    return <span style={{ ...MONO,fontSize:"0.68rem",color:s,lineHeight:1 }}>✦</span>;
  }
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:7,marginBottom:18,width:"100%",maxWidth:270 }}>
      {items.map((item, i) => (
        <div key={item.label} style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 14px",background:c.chipBg,border:`1px solid ${c.chipBdr}`,borderRadius:10,opacity:vis?1:0,transform:vis?"translateX(0)":"translateX(30px)",transition:`opacity 0.42s ${i*0.14}s,transform 0.42s ${i*0.14}s` }}>
          <div style={{ width:22,height:22,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}><ItemIcon type={item.type}/></div>
          <span style={{ ...MONO,fontSize:"0.44rem",letterSpacing:"0.06em",color:c.chipVal }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Main Onboarding component ─────────────────────────────────────── */
export default function Onboarding({ onDone }) {
  const [slide, setSlide]         = useState(0);
  const [heartFilled, setHeart]   = useState(false);
  const touchStartX               = useRef(null);
  const total                     = SLIDES.length;
  const isLast                    = slide === total - 1;
  const sl                        = SLIDES[slide];
  const c                         = palette(sl.dark);

  // Inject keyframes
  useEffect(() => {
    const s = document.createElement("style");
    s.id = "ob-anim";
    s.textContent = ANIM_CSS;
    document.head.appendChild(s);
    return () => { const el = document.getElementById("ob-anim"); if (el) el.remove(); };
  }, []);

  // Heart fill triggers on slide 3
  useEffect(() => {
    if (slide !== 3) { setHeart(false); return; }
    const t = setTimeout(() => setHeart(true), 550);
    return () => clearTimeout(t);
  }, [slide]);

  function handleDone() {
    try { localStorage.setItem("ed-onboarding-done","1"); } catch {}
    onDone();
  }
  function next() { slide < total-1 ? setSlide(n=>n+1) : handleDone(); }
  function prev() { if (slide > 0) setSlide(n=>n-1); }
  function onTouchStart(e) { touchStartX.current = e.touches[0].clientX; }
  function onTouchEnd(e) {
    if (touchStartX.current === null) return;
    const d = touchStartX.current - e.changedTouches[0].clientX;
    if (d > 40) next(); else if (d < -40) prev();
    touchStartX.current = null;
  }

  const t = TITLES[slide];

  // Passport slide (2) needs more vertical room for the large card + stamp overflow
  const iconTop = slide === 2 ? "36%" : "28%";

  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
      style={{ position:"fixed",inset:0,zIndex:9999,overflow:"hidden",userSelect:"none" }}>

      {/* ── Per-slide backgrounds ── */}
      {SLIDES.map((s, i) => (
        <div key={s.id} style={{ position:"absolute",inset:0,transform:`translateX(${(i-slide)*100}%)`,transition:"transform 0.44s cubic-bezier(0.32,0.72,0,1)",willChange:"transform" }}>
          <div style={{ position:"absolute",inset:0,backgroundImage:`url(${s.bg})`,backgroundSize:"cover",backgroundPosition:s.bgPos,filter:s.imgFilter }}/>
          <div style={{ position:"absolute",inset:0,background:s.overlay }}/>
        </div>
      ))}

      {/* ── SKIP ── */}
      {!isLast && (
        <button onClick={handleDone}
          style={{ ...MONO,position:"absolute",top:"calc(18px + env(safe-area-inset-top))",right:22,background:"none",border:"none",color:c.skip,fontSize:"0.50rem",letterSpacing:"0.18em",textTransform:"uppercase",cursor:"pointer",padding:"10px 0",zIndex:10 }}>
          SKIP
        </button>
      )}

      {/* ── Upper icon / interactive area ── */}
      <div key={`icon-${slide}`}
        style={{ position:"absolute",top:iconTop,left:"50%",transform:"translate(-50%,-50%)",zIndex:2,display:"flex",alignItems:"center",justifyContent:"center" }}>
        {slide === 0 && <CompassAnim c={c.gold}/>}
        {slide === 1 && <SparkleAnim c={c.gold}/>}
        {slide === 2 && <PassportCardAnim/>}
        {slide === 3 && <HeartAnim c={c.gold} filled={heartFilled}/>}
      </div>

      {/* ── Bottom content ── */}
      <div key={`bottom-${slide}`}
        style={{ position:"absolute",bottom:0,left:0,right:0,padding:"0 28px calc(44px + env(safe-area-inset-bottom))",display:"flex",flexDirection:"column",alignItems:"center",zIndex:2,animation:"ob-fadeUp 0.48s ease both 0.12s" }}>

        {/* Ornament */}
        <div style={{ ...MONO,fontSize:"0.42rem",letterSpacing:"0.26em",color:c.orn,marginBottom:12,textAlign:"center" }}>
          ◆ {ORNAMENTS[slide]} ◆
        </div>

        {/* Title */}
        <h2 style={{ ...SERIF,margin:"0 0 10px",textAlign:"center",lineHeight:1.05 }}>
          <span style={{ display:"block",fontSize:"clamp(2.1rem,7.5vw,2.8rem)",fontWeight:300,color:c.title1,textShadow:c.ts,letterSpacing:"0em" }}>{t.line1}</span>
          <span style={{ display:"block",fontSize:"clamp(2.1rem,7.5vw,2.8rem)",fontWeight:500,color:c.title2,textShadow:c.ts,letterSpacing:"-0.01em" }}>{t.line2}</span>
          {t.line3 && <span style={{ display:"block",fontSize:"clamp(1.1rem,4vw,1.35rem)",fontWeight:300,color:c.title1,textShadow:c.ts,letterSpacing:"0.02em",marginTop:2 }}>{t.line3}</span>}
        </h2>

        {/* Description */}
        <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:"0.86rem",color:c.desc,lineHeight:1.65,textAlign:"center",margin:"0 0 16px",maxWidth:288,fontWeight:300 }}>
          {DESCS[slide]}
        </p>

        {/* Per-slide interactive elements */}
        {slide === 1 && <BuildChips c={c}/>}
        {slide === 3 && <SaveItems c={c}/>}

        {/* Dot indicators */}
        <div style={{ display:"flex",gap:7,alignItems:"center",marginBottom:16 }}>
          {SLIDES.map((_, i) => (
            <div key={i} onClick={()=>setSlide(i)}
              style={{ width:i===slide?22:6,height:6,borderRadius:3,background:i===slide?c.dotOn:c.dotOff,transition:"all 0.28s",cursor:"pointer" }}/>
          ))}
        </div>

        {/* NEXT / GET STARTED */}
        <button onClick={isLast ? handleDone : next}
          style={{ ...MONO,width:"100%",padding:"15px 0",borderRadius:100,
            background:isLast?"linear-gradient(135deg,rgba(180,135,55,0.97) 0%,rgba(210,168,80,0.95) 100%)":c.nxtBg,
            border:`1.5px solid ${isLast?"rgba(172,92,52,0.70)":c.nxtBdr}`,
            color:isLast?"#1A0800":c.nxtTxt,
            fontSize:"0.52rem",letterSpacing:"0.18em",textTransform:"uppercase",cursor:"pointer",
            backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",transition:"all 0.22s",
            fontWeight:isLast?700:400 }}>
          {isLast ? "GET STARTED ✦" : "NEXT →"}
        </button>
      </div>
    </div>
  );
}
