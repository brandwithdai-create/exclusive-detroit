import React, { useState, useRef } from "react";

const MONO  = { fontFamily: "'DM Mono',monospace" };
const SERIF = { fontFamily: "'Cormorant Garamond',serif" };

const SLIDES = [
  {
    icon: "compass",
    bg: "/onboarding/slide1.jpg",
    label: "Detroit Hidden Gems",
    title: "Detroit\nHidden Gems",
    desc: "The insider's guide to Detroit restaurants, bars, rooftops, events, and hidden gems — curated for those who know.",
  },
  {
    icon: "lightning",
    bg: "/onboarding/slide2.jpg",
    label: "Build My Night",
    title: "Build\nMy Night",
    desc: "Choose your time, vibe, and group. Get a personalized 3-stop Detroit itinerary built for tonight.",
  },
  {
    icon: "stamp",
    bg: "/onboarding/slide3.jpg",
    label: "Collect Passport Stamps",
    title: "Collect\nPassport Stamps",
    desc: "Mark venues as visited and earn permanent passport stamps with your visit dates. Your Detroit journey, recorded.",
  },
  {
    icon: "heart",
    bg: "/onboarding/slide4.jpg",
    label: "Save Everything",
    title: "Save\nEverything",
    desc: "Heart venues, save nights, bookmark hotels and events. Everything stays on your device — no account needed.",
  },
];

const si = { fill:"none", stroke:"currentColor", strokeWidth:1.3, strokeLinecap:"round", strokeLinejoin:"round" };

function IconCompass() {
  return (
    <svg width="44" height="44" viewBox="0 0 52 52" style={si} color="rgba(201,168,76,0.95)">
      <circle cx="26" cy="26" r="20"/>
      <circle cx="26" cy="26" r="2.5" fill="rgba(201,168,76,0.95)" stroke="none"/>
      <polygon points="26,10 29,24 26,22 23,24" fill="rgba(201,168,76,0.95)" stroke="none" opacity="0.9"/>
      <polygon points="26,42 23,28 26,30 29,28" fill="rgba(201,168,76,0.55)" stroke="none" opacity="0.55"/>
      <line x1="26" y1="6" x2="26" y2="10"/>
      <line x1="26" y1="42" x2="26" y2="46"/>
      <line x1="6"  y1="26" x2="10" y2="26"/>
      <line x1="42" y1="26" x2="46" y2="26"/>
    </svg>
  );
}
function IconLightning() {
  return (
    <svg width="44" height="44" viewBox="0 0 52 52" style={{...si,strokeLinejoin:"round"}} color="rgba(201,168,76,0.95)">
      <path d="M30,6 L18,28 H26 L22,46 L36,22 H28 Z" fill="rgba(201,168,76,0.18)" stroke="rgba(201,168,76,0.95)"/>
    </svg>
  );
}
function IconStamp() {
  return (
    <svg width="44" height="44" viewBox="0 0 52 52" style={si} color="rgba(201,168,76,0.95)">
      <circle cx="26" cy="26" r="19" strokeDasharray="4 2.5"/>
      <circle cx="26" cy="26" r="13"/>
      <path d="M26,15 L28.5,21.5 L35.5,21.5 L29.8,25.8 L32,32.5 L26,28.2 L20,32.5 L22.2,25.8 L16.5,21.5 L23.5,21.5 Z" fill="rgba(201,168,76,0.18)" stroke="rgba(201,168,76,0.95)"/>
    </svg>
  );
}
function IconHeart() {
  return (
    <svg width="44" height="44" viewBox="0 0 52 52" style={si} color="rgba(201,168,76,0.95)">
      <path d="M26,40 C26,40 8,28 8,17 C8,11.5 12.5,7 18,7 C21.5,7 24.5,8.8 26,11.5 C27.5,8.8 30.5,7 34,7 C39.5,7 44,11.5 44,17 C44,28 26,40 26,40 Z" fill="rgba(201,168,76,0.14)" stroke="rgba(201,168,76,0.95)"/>
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
  const [slide, setSlide] = useState(0);
  const touchStartX       = useRef(null);
  const total             = SLIDES.length;
  const isLast            = slide === total - 1;
  const s                 = SLIDES[slide];

  function handleDone() {
    try { localStorage.setItem("ed-onboarding-done", "1"); } catch (e) {}
    onDone();
  }
  function next() { if (slide < total - 1) setSlide(n => n + 1); else handleDone(); }
  function prev() { if (slide > 0) setSlide(n => n - 1); }
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
      style={{ position:"fixed", inset:0, zIndex:9999, overflow:"hidden", userSelect:"none" }}
    >
      {/* Background slides */}
      {SLIDES.map((sl, i) => (
        <div
          key={i}
          style={{
            position:"absolute", inset:0,
            backgroundImage:`url(${sl.bg})`,
            backgroundSize:"cover",
            backgroundPosition:"center",
            transform:`translateX(${(i - slide) * 100}%)`,
            transition:"transform 0.42s cubic-bezier(0.32,0.72,0,1)",
            willChange:"transform",
          }}
        />
      ))}

      {/* Cinematic overlay — dark vignette, bottom emphasis */}
      <div style={{
        position:"absolute", inset:0,
        background:"linear-gradient(to bottom, rgba(4,3,8,0.38) 0%, rgba(4,3,8,0.10) 35%, rgba(4,3,8,0.18) 58%, rgba(4,3,8,0.78) 80%, rgba(4,3,8,0.96) 100%)",
        pointerEvents:"none",
      }}/>

      {/* Top SKIP only */}
      {!isLast && (
        <button
          onClick={handleDone}
          style={{ ...MONO, position:"absolute", top:"calc(18px + env(safe-area-inset-top))", right:22, background:"none", border:"none", color:"rgba(232,224,212,0.65)", fontSize:"0.50rem", letterSpacing:"0.18em", textTransform:"uppercase", cursor:"pointer", padding:"10px 0", zIndex:10 }}
        >
          SKIP
        </button>
      )}

      {/* Icon — centered upper area */}
      <div style={{
        position:"absolute", top:"30%", left:"50%",
        transform:"translate(-50%,-50%)",
        opacity:0.92,
        transition:"opacity 0.3s",
      }}>
        <SlideIcon type={s.icon} />
      </div>

      {/* Bottom content */}
      <div style={{
        position:"absolute", bottom:0, left:0, right:0,
        padding:"0 32px calc(44px + env(safe-area-inset-bottom))",
        display:"flex", flexDirection:"column", alignItems:"center", gap:0,
      }}>
        {/* Ornament */}
        <div style={{ ...MONO, fontSize:"0.48rem", letterSpacing:"0.26em", color:"rgba(201,168,76,0.80)", marginBottom:14 }}>
          ◆ EXCLUSIVE DETROIT ◆
        </div>

        {/* Title */}
        <h2 style={{
          ...SERIF,
          fontSize:"clamp(2rem,7vw,2.6rem)",
          fontWeight:300,
          color:"#fff",
          margin:"0 0 12px",
          textAlign:"center",
          lineHeight:1.05,
          whiteSpace:"pre-line",
          textShadow:"0 2px 24px rgba(0,0,0,0.55)",
        }}>
          {s.title}
        </h2>

        {/* Description */}
        <p style={{
          fontFamily:"'DM Sans',sans-serif",
          fontSize:"0.86rem",
          color:"rgba(232,224,212,0.82)",
          lineHeight:1.65,
          textAlign:"center",
          margin:"0 0 26px",
          maxWidth:300,
          fontWeight:300,
          textShadow:"0 1px 8px rgba(0,0,0,0.5)",
        }}>
          {s.desc}
        </p>

        {/* Dot indicators */}
        <div style={{ display:"flex", gap:7, alignItems:"center", marginBottom:18 }}>
          {SLIDES.map((_, i) => (
            <div
              key={i}
              onClick={() => setSlide(i)}
              style={{
                width: i === slide ? 22 : 6, height:6,
                borderRadius:3,
                background: i === slide ? "rgba(201,168,76,0.95)" : "rgba(201,168,76,0.25)",
                transition:"all 0.25s",
                cursor:"pointer",
              }}
            />
          ))}
        </div>

        {/* NEXT / GET STARTED button */}
        <button
          onClick={isLast ? handleDone : next}
          style={{
            ...MONO,
            width:"100%",
            padding:"15px 0",
            borderRadius:100,
            background: isLast ? "rgba(201,168,76,0.18)" : "rgba(10,8,6,0.55)",
            border:"1.5px solid rgba(201,168,76,0.55)",
            color:"rgba(201,168,76,0.95)",
            fontSize:"0.52rem",
            letterSpacing:"0.18em",
            textTransform:"uppercase",
            cursor:"pointer",
            backdropFilter:"blur(12px)",
            WebkitBackdropFilter:"blur(12px)",
            transition:"all 0.2s",
          }}
        >
          {isLast ? "GET STARTED ✦" : "NEXT →"}
        </button>
      </div>
    </div>
  );
}
