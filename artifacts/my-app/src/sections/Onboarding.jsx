import React, { useState, useRef } from "react";

const MONO  = { fontFamily: "'DM Mono',monospace" };
const SERIF = { fontFamily: "'Cormorant Garamond',serif" };

const SLIDES = [
  {
    icon: "compass",
    title: "Detroit Hidden Gems",
    desc: "The insider's guide to Detroit restaurants, bars, rooftops, events, and hidden gems — curated for those who know.",
  },
  {
    icon: "lightning",
    title: "Build My Night",
    desc: "Choose your time, vibe, and group. Get a personalized 3-stop Detroit itinerary built for tonight.",
  },
  {
    icon: "stamp",
    title: "Collect Passport Stamps",
    desc: "Mark venues as visited and earn permanent passport stamps with your visit dates. Your Detroit journey, recorded.",
  },
  {
    icon: "heart",
    title: "Save Everything",
    desc: "Heart venues, save nights, bookmark hotels and events. Everything stays on your device — no account needed.",
  },
];

const si = { fill: "none", stroke: "currentColor", strokeWidth: 1.3, strokeLinecap: "round", strokeLinejoin: "round" };

function IconCompass() {
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" style={si} color="var(--c-gold)">
      <circle cx="26" cy="26" r="20"/>
      <circle cx="26" cy="26" r="2.5" fill="var(--c-gold)" stroke="none"/>
      <polygon points="26,10 29,24 26,22 23,24" fill="var(--c-gold)" stroke="none" opacity="0.9"/>
      <polygon points="26,42 23,28 26,30 29,28" fill="var(--c-goldD)" stroke="none" opacity="0.55"/>
      <line x1="26" y1="6" x2="26" y2="10"/>
      <line x1="26" y1="42" x2="26" y2="46"/>
      <line x1="6"  y1="26" x2="10" y2="26"/>
      <line x1="42" y1="26" x2="46" y2="26"/>
    </svg>
  );
}

function IconLightning() {
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" style={{...si, strokeLinejoin:"round"}} color="var(--c-gold)">
      <path d="M30,6 L18,28 H26 L22,46 L36,22 H28 Z" fill="rgba(201,168,76,0.14)" stroke="var(--c-gold)"/>
    </svg>
  );
}

function IconStamp() {
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" style={si} color="var(--c-gold)">
      <circle cx="26" cy="26" r="19" strokeDasharray="4 2.5"/>
      <circle cx="26" cy="26" r="13"/>
      <path d="M26,15 L28.5,21.5 L35.5,21.5 L29.8,25.8 L32,32.5 L26,28.2 L20,32.5 L22.2,25.8 L16.5,21.5 L23.5,21.5 Z" fill="rgba(201,168,76,0.18)" stroke="var(--c-gold)"/>
    </svg>
  );
}

function IconHeart() {
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" style={si} color="var(--c-gold)">
      <path d="M26,40 C26,40 8,28 8,17 C8,11.5 12.5,7 18,7 C21.5,7 24.5,8.8 26,11.5 C27.5,8.8 30.5,7 34,7 C39.5,7 44,11.5 44,17 C44,28 26,40 26,40 Z" fill="rgba(201,168,76,0.14)" stroke="var(--c-gold)"/>
    </svg>
  );
}

function SlideIcon({ type }) {
  if (type === "compass")   return <IconCompass />;
  if (type === "lightning") return <IconLightning />;
  if (type === "stamp")     return <IconStamp />;
  if (type === "heart")     return <IconHeart />;
  return null;
}

export default function Onboarding({ onDone }) {
  const [slide, setSlide]     = useState(0);
  const touchStartX           = useRef(null);
  const total                 = SLIDES.length;
  const isLast                = slide === total - 1;

  function handleDone() {
    try { localStorage.setItem("ed-onboarding-done", "1"); } catch (e) {}
    onDone();
  }

  function next() { if (slide < total - 1) setSlide(s => s + 1); else handleDone(); }
  function prev() { if (slide > 0) setSlide(s => s - 1); }

  function onTouchStart(e) { touchStartX.current = e.touches[0].clientX; }
  function onTouchEnd(e) {
    if (touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (delta > 40) next();
    else if (delta < -40) prev();
    touchStartX.current = null;
  }

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{ position:"fixed", inset:0, zIndex:9999, background:"var(--c-deep)", display:"flex", flexDirection:"column", overflow:"hidden", userSelect:"none" }}
    >
      {/* Skip — hidden on last slide */}
      {!isLast && (
        <button
          onClick={handleDone}
          style={{ ...MONO, position:"absolute", top:"calc(18px + env(safe-area-inset-top))", right:22, background:"none", border:"none", color:"var(--c-smoke)", fontSize:"0.52rem", letterSpacing:"0.16em", textTransform:"uppercase", cursor:"pointer", padding:"10px 0", zIndex:1 }}
        >
          SKIP
        </button>
      )}

      {/* Slide viewport */}
      <div style={{ flex:1, position:"relative", overflow:"hidden" }}>
        {SLIDES.map((s, i) => (
          <div
            key={i}
            style={{
              position:"absolute", inset:0,
              display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
              padding:"0 40px",
              transform:`translateX(${(i - slide) * 100}%)`,
              transition:"transform 0.32s cubic-bezier(0.32,0.72,0,1)",
            }}
          >
            {/* Icon */}
            <div style={{ marginBottom:28, opacity:0.95 }}>
              <SlideIcon type={s.icon} />
            </div>

            {/* Ornament */}
            <div style={{ ...MONO, fontSize:"0.52rem", letterSpacing:"0.22em", color:"var(--c-goldD)", marginBottom:18, opacity:0.88 }}>
              ◆ EXCLUSIVE DETROIT ◆
            </div>

            {/* Title */}
            <h2 style={{ ...SERIF, fontSize:"clamp(1.55rem,6vw,2.1rem)", fontWeight:400, color:"var(--c-white)", margin:"0 0 14px", textAlign:"center", lineHeight:1.15 }}>
              {s.title}
            </h2>

            {/* Description */}
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"0.88rem", color:"var(--c-bone)", lineHeight:1.68, textAlign:"center", margin:0, maxWidth:300, fontWeight:300 }}>
              {s.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Bottom controls */}
      <div style={{ padding:"0 32px calc(44px + env(safe-area-inset-bottom))", display:"flex", flexDirection:"column", alignItems:"center", gap:18 }}>

        {/* Dot indicators */}
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {SLIDES.map((_, i) => (
            <div
              key={i}
              onClick={() => setSlide(i)}
              style={{
                width: i === slide ? 22 : 6, height:6,
                borderRadius:3,
                background: i === slide ? "var(--c-gold)" : "rgba(201,168,76,0.22)",
                transition:"all 0.25s",
                cursor:"pointer",
              }}
            />
          ))}
        </div>

        {/* Navigation row */}
        <div style={{ display:"flex", alignItems:"center", width:"100%" }}>
          <button
            onClick={isLast ? handleDone : next}
            style={{ ...MONO, flex:1, padding:"13px 0", borderRadius:100, background:"rgba(201,168,76,0.08)", border:"1.5px solid var(--c-goldD)", color:"var(--c-gold)", fontSize:"0.52rem", letterSpacing:"0.18em", textTransform:"uppercase", cursor:"pointer", transition:"all 0.15s" }}
          >
            {isLast ? "GET STARTED ✦" : "NEXT →"}
          </button>
        </div>

        {/* Bottom skip */}
        <button
          onClick={handleDone}
          style={{ ...MONO, background:"none", border:"none", color:"var(--c-smoke)", fontSize:"0.48rem", letterSpacing:"0.14em", textTransform:"uppercase", cursor:"pointer", padding:"6px 0", opacity:0.7 }}
        >
          SKIP
        </button>
      </div>
    </div>
  );
}
