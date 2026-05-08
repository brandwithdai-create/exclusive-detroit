import React, { useState, useRef, useEffect } from "react";

const MONO  = { fontFamily: "'DM Mono',monospace" };
const SERIF = { fontFamily: "'Cormorant Garamond',serif" };

const SLIDES = [
  {
    icon: "compass",
    title: "Detroit\nHidden Gems",
    desc: "The insider's guide to Detroit restaurants, bars, rooftops, events, and hidden gems — curated for those who know.",
    bgPos: "center 30%",
  },
  {
    icon: "lightning",
    title: "Build\nMy Night",
    desc: "Choose your time, vibe, and group. Get a personalized 3-stop Detroit itinerary built for tonight.",
    bgPos: "center 44%",
  },
  {
    icon: "stamp",
    title: "Collect\nPassport Stamps",
    desc: "Mark venues as visited and earn permanent passport stamps with your visit dates. Your Detroit journey, recorded.",
    bgPos: "center 36%",
  },
  {
    icon: "heart",
    title: "Save\nEverything",
    desc: "Heart venues, save nights, bookmark hotels and events. Everything stays on your device — no account needed.",
    bgPos: "center 22%",
  },
];

function useDark() {
  const [dark, setDark] = useState(() => {
    try {
      const t = document.documentElement.dataset.theme;
      if (t === "dark")  return true;
      if (t === "light") return false;
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch { return true; }
  });
  useEffect(() => {
    const obs = new MutationObserver(() => {
      const t = document.documentElement.dataset.theme;
      setDark(t === "dark" ? true : t === "light" ? false : window.matchMedia("(prefers-color-scheme: dark)").matches);
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

function IconCompass({ c }) {
  const s = { fill:"none", stroke:c, strokeWidth:1.3, strokeLinecap:"round", strokeLinejoin:"round" };
  return (
    <svg width="44" height="44" viewBox="0 0 52 52" style={s}>
      <circle cx="26" cy="26" r="20"/>
      <circle cx="26" cy="26" r="2.5" fill={c} stroke="none"/>
      <polygon points="26,10 29,24 26,22 23,24" fill={c} fillOpacity="0.95" stroke="none"/>
      <polygon points="26,42 23,28 26,30 29,28" fill={c} fillOpacity="0.40" stroke="none"/>
      <line x1="26" y1="6"  x2="26" y2="10"/>
      <line x1="26" y1="42" x2="26" y2="46"/>
      <line x1="6"  y1="26" x2="10" y2="26"/>
      <line x1="42" y1="26" x2="46" y2="26"/>
    </svg>
  );
}
function IconLightning({ c }) {
  return (
    <svg width="44" height="44" viewBox="0 0 52 52">
      <path d="M30,6 L18,28 H26 L22,46 L36,22 H28 Z" fill={c} fillOpacity="0.18" stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function IconStamp({ c }) {
  const s = { fill:"none", stroke:c, strokeWidth:1.3, strokeLinecap:"round", strokeLinejoin:"round" };
  return (
    <svg width="44" height="44" viewBox="0 0 52 52" style={s}>
      <circle cx="26" cy="26" r="19" strokeDasharray="4 2.5"/>
      <circle cx="26" cy="26" r="13"/>
      <path d="M26,15 L28.5,21.5 L35.5,21.5 L29.8,25.8 L32,32.5 L26,28.2 L20,32.5 L22.2,25.8 L16.5,21.5 L23.5,21.5 Z" fill={c} fillOpacity="0.18" stroke={c}/>
    </svg>
  );
}
function IconHeart({ c }) {
  const s = { fill:"none", stroke:c, strokeWidth:1.3, strokeLinecap:"round", strokeLinejoin:"round" };
  return (
    <svg width="44" height="44" viewBox="0 0 52 52" style={s}>
      <path d="M26,40 C26,40 8,28 8,17 C8,11.5 12.5,7 18,7 C21.5,7 24.5,8.8 26,11.5 C27.5,8.8 30.5,7 34,7 C39.5,7 44,11.5 44,17 C44,28 26,40 26,40 Z" fill={c} fillOpacity="0.14"/>
    </svg>
  );
}
function SlideIcon({ type, c }) {
  if (type === "compass")   return <IconCompass   c={c} />;
  if (type === "lightning") return <IconLightning c={c} />;
  if (type === "stamp")     return <IconStamp     c={c} />;
  if (type === "heart")     return <IconHeart     c={c} />;
  return null;
}

export default function Onboarding({ onDone }) {
  const [slide, setSlide] = useState(0);
  const touchStartX       = useRef(null);
  const total             = SLIDES.length;
  const isLast            = slide === total - 1;
  const s                 = SLIDES[slide];
  const dark              = useDark();

  const overlay   = dark
    ? "linear-gradient(to bottom, rgba(4,2,1,0.40) 0%, rgba(4,2,1,0.08) 30%, rgba(4,2,1,0.28) 58%, rgba(4,2,1,0.88) 78%, rgba(4,2,1,0.97) 100%)"
    : "linear-gradient(to bottom, rgba(252,247,238,0.62) 0%, rgba(252,247,238,0.18) 28%, rgba(252,247,238,0.36) 56%, rgba(252,247,238,0.90) 78%, rgba(252,247,238,0.98) 100%)";
  const imgFilter = dark
    ? "brightness(0.85) saturate(1.05)"
    : "brightness(1.12) saturate(1.05) contrast(1.04)";

  const titleTxt  = dark ? "#ffffff"                  : "#1A0E00";
  const descTxt   = dark ? "rgba(232,224,212,0.82)"   : "rgba(58,32,8,0.78)";
  const ornTxt    = dark ? "rgba(201,168,76,0.78)"    : "rgba(138,96,16,0.82)";
  const skipTxt   = dark ? "rgba(232,224,212,0.52)"   : "rgba(58,32,8,0.42)";
  const iconColor = dark ? "rgba(201,168,76,0.95)"    : "rgba(138,96,16,0.88)";
  const dotOn     = dark ? "rgba(201,168,76,0.95)"    : "rgba(138,96,16,0.88)";
  const dotOff    = dark ? "rgba(201,168,76,0.24)"    : "rgba(138,96,16,0.20)";

  const nxtBg     = dark ? "rgba(10,8,6,0.55)"        : "rgba(250,243,225,0.94)";
  const nxtBdr    = dark ? "rgba(201,168,76,0.52)"    : "rgba(172,92,52,0.68)";
  const nxtTxt    = dark ? "rgba(201,168,76,0.95)"    : "#2E1A0E";
  const gsBg      = dark ? "rgba(201,168,76,0.18)"    : "rgba(180,135,55,0.96)";
  const gsBdr     = dark ? "rgba(201,168,76,0.52)"    : "rgba(172,92,52,0.72)";
  const gsTxt     = dark ? "rgba(201,168,76,0.95)"    : "#1A0E00";
  const titleShadow = dark ? "0 2px 24px rgba(0,0,0,0.55)" : "0 1px 10px rgba(252,248,240,0.65)";
  const descShadow  = dark ? "0 1px 8px rgba(0,0,0,0.50)"  : "0 1px 6px rgba(252,248,240,0.55)";

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
      {/* Detroit skyline — pans to a different crop per slide */}
      {SLIDES.map((sl, i) => (
        <div
          key={i}
          style={{
            position:"absolute", inset:0,
            backgroundImage:"url(/detroit-skyline.jpg)",
            backgroundSize:"cover",
            backgroundPosition: sl.bgPos,
            filter: imgFilter,
            transform:`translateX(${(i - slide) * 100}%)`,
            transition:"transform 0.42s cubic-bezier(0.32,0.72,0,1)",
            willChange:"transform",
          }}
        />
      ))}

      {/* Theme-adaptive gradient overlay */}
      <div style={{ position:"absolute", inset:0, background:overlay, pointerEvents:"none" }}/>

      {/* SKIP */}
      {!isLast && (
        <button
          onClick={handleDone}
          style={{ ...MONO, position:"absolute", top:"calc(18px + env(safe-area-inset-top))", right:22, background:"none", border:"none", color:skipTxt, fontSize:"0.50rem", letterSpacing:"0.18em", textTransform:"uppercase", cursor:"pointer", padding:"10px 0", zIndex:10 }}
        >
          SKIP
        </button>
      )}

      {/* Icon — centered upper area */}
      <div style={{ position:"absolute", top:"30%", left:"50%", transform:"translate(-50%,-50%)", opacity:0.95, transition:"opacity 0.3s" }}>
        <SlideIcon type={s.icon} c={iconColor} />
      </div>

      {/* Bottom content */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"0 32px calc(44px + env(safe-area-inset-bottom))", display:"flex", flexDirection:"column", alignItems:"center" }}>
        {/* Ornament */}
        <div style={{ ...MONO, fontSize:"0.48rem", letterSpacing:"0.26em", color:ornTxt, marginBottom:14 }}>
          ◆ EXCLUSIVE DETROIT ◆
        </div>

        {/* Title */}
        <h2 style={{ ...SERIF, fontSize:"clamp(2rem,7vw,2.6rem)", fontWeight:300, color:titleTxt, margin:"0 0 12px", textAlign:"center", lineHeight:1.05, whiteSpace:"pre-line", textShadow:titleShadow }}>
          {s.title}
        </h2>

        {/* Description */}
        <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"0.86rem", color:descTxt, lineHeight:1.65, textAlign:"center", margin:"0 0 26px", maxWidth:300, fontWeight:300, textShadow:descShadow }}>
          {s.desc}
        </p>

        {/* Dot indicators */}
        <div style={{ display:"flex", gap:7, alignItems:"center", marginBottom:18 }}>
          {SLIDES.map((_, i) => (
            <div
              key={i}
              onClick={() => setSlide(i)}
              style={{ width: i === slide ? 22 : 6, height:6, borderRadius:3, background: i === slide ? dotOn : dotOff, transition:"all 0.25s", cursor:"pointer" }}
            />
          ))}
        </div>

        {/* NEXT / GET STARTED */}
        <button
          onClick={isLast ? handleDone : next}
          style={{ ...MONO, width:"100%", padding:"15px 0", borderRadius:100, background: isLast ? gsBg : nxtBg, border:`1.5px solid ${isLast ? gsBdr : nxtBdr}`, color: isLast ? gsTxt : nxtTxt, fontSize:"0.52rem", letterSpacing:"0.18em", textTransform:"uppercase", cursor:"pointer", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)", transition:"all 0.2s" }}
        >
          {isLast ? "GET STARTED ✦" : "NEXT →"}
        </button>
      </div>
    </div>
  );
}
