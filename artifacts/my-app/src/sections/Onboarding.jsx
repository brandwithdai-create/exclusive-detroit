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
@keyframes ob-stampDrop{0%{opacity:0;transform:scale(1.7) rotate(-18deg)}52%{opacity:1;transform:scale(0.86) rotate(3deg)}72%{transform:scale(1.08) rotate(-2deg)}100%{opacity:1;transform:scale(1) rotate(-7deg)}}
@keyframes ob-slideRight{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}
@keyframes ob-cardUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
@keyframes ob-btnPulse{0%,100%{box-shadow:0 0 0 0 rgba(201,168,76,0)}50%{box-shadow:0 0 0 6px rgba(201,168,76,0.18)}}
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

// titleLine1 is white/dark, titleLine2 is gold
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

/* ── Slide 3 upper: mini venue card + stamp ────────────────────────── */
function PassportCardAnim() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 1100);
    const t2 = setTimeout(() => setPhase(2), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  const GOLD = "rgba(201,168,76,1)";
  return (
    <div style={{ position:"relative", animation:"ob-cardUp 0.55s cubic-bezier(0.22,1,0.36,1) both 0.25s" }}>
      {/* Mini venue card */}
      <div style={{ width:210, background:"rgba(8,6,3,0.93)", border:"1.5px solid rgba(201,168,76,0.44)", borderRadius:14, overflow:"hidden", boxShadow:"0 8px 36px rgba(0,0,0,0.60)" }}>
        {/* Image strip */}
        <div style={{ height:84, background:"rgba(28,18,6,1)", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute",inset:0,background:"url(/venue-photos/12.jpg) center/cover",opacity:0.52 }}/>
          <div style={{ position:"absolute",inset:0,background:"linear-gradient(to bottom,transparent 40%,rgba(8,6,3,0.72))" }}/>
          <div style={{ position:"absolute",top:7,right:7,width:26,height:26,borderRadius:"50%",background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid rgba(255,255,255,0.18)",fontSize:"0.72rem",color:"rgba(255,255,255,0.88)" }}>♡</div>
        </div>
        {/* Content */}
        <div style={{ padding:"8px 10px 4px" }}>
          <div style={{ ...MONO,fontSize:"0.36rem",letterSpacing:"0.14em",textTransform:"uppercase",color:GOLD,marginBottom:3 }}>Rooftops · Downtown</div>
          <div style={{ ...SERIF,fontSize:"0.80rem",fontWeight:600,color:"#fff",lineHeight:1.1,marginBottom:2 }}>Monarch Club Rooftop</div>
          <div style={{ ...SERIF,fontSize:"0.54rem",fontStyle:"italic",color:"rgba(201,168,76,0.88)",marginBottom:6 }}>🍹 fire pit terraces · intimate</div>
        </div>
        {/* CTA row */}
        <div style={{ display:"flex",gap:6,padding:"4px 8px 10px",alignItems:"center" }}>
          <div style={{ flex:1,padding:"8px 0",borderRadius:8,background:"linear-gradient(135deg,#B88E38 0%,#C9A848 100%)",textAlign:"center",...MONO,fontSize:"0.40rem",letterSpacing:"0.16em",textTransform:"uppercase",color:"#0C0904",fontWeight:700 }}>BOOK NOW</div>
          <div style={{ width:34,height:34,flexShrink:0,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",background:phase>=1?"rgba(201,168,76,0.22)":"rgba(201,168,76,0.06)",border:phase>=1?"1.5px solid rgba(201,168,76,0.72)":"1.5px solid rgba(201,168,76,0.26)",transition:"all 0.35s",transform:phase===1?"scale(1.14)":"scale(1)",animation:phase>=1?"ob-btnPulse 0.8s ease 0.1s":"none" }}>
            <PassportSVG stroke={GOLD} w={14} h={11}/>
          </div>
        </div>
      </div>
      {/* Stamp */}
      {phase >= 2 && (
        <div style={{ position:"absolute",top:-22,right:10,animation:"ob-stampDrop 0.70s cubic-bezier(0.22,1,0.36,1) both",zIndex:10 }}>
          <div style={{ width:90,height:90,borderRadius:"50%",border:"3px solid rgba(201,168,76,0.88)",background:"rgba(6,4,1,0.94)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 22px rgba(201,168,76,0.38),inset 0 0 18px rgba(201,168,76,0.06)",transform:"rotate(-7deg)" }}>
            <div style={{ ...MONO,fontSize:"0.22rem",letterSpacing:"0.13em",color:"rgba(201,168,76,0.68)",textTransform:"uppercase",lineHeight:1,marginBottom:4 }}>★ EXCL DETROIT ★</div>
            <div style={{ ...MONO,fontSize:"0.58rem",fontWeight:700,letterSpacing:"0.08em",color:"rgba(201,168,76,1)",textTransform:"uppercase",lineHeight:1,marginBottom:3 }}>VISITED</div>
            <div style={{ ...MONO,fontSize:"0.22rem",letterSpacing:"0.06em",color:"rgba(201,168,76,0.66)",textTransform:"uppercase",lineHeight:1 }}>MAY 24, 2026</div>
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

  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
      style={{ position:"fixed",inset:0,zIndex:9999,overflow:"hidden",userSelect:"none" }}>

      {/* ── Per-slide backgrounds (slide with translateX) ── */}
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
        style={{ position:"absolute",top:"28%",left:"50%",transform:"translate(-50%,-50%)",zIndex:2,display:"flex",alignItems:"center",justifyContent:"center" }}>
        {slide === 0 && <CompassAnim c={c.gold}/>}
        {slide === 1 && <SparkleAnim c={c.gold}/>}
        {slide === 2 && <PassportCardAnim/>}
        {slide === 3 && <HeartAnim c={c.gold} filled={heartFilled}/>}
      </div>

      {/* ── Bottom content (key forces remount → re-triggers animations) ── */}
      <div key={`bottom-${slide}`}
        style={{ position:"absolute",bottom:0,left:0,right:0,padding:"0 28px calc(44px + env(safe-area-inset-bottom))",display:"flex",flexDirection:"column",alignItems:"center",zIndex:2,animation:"ob-fadeUp 0.48s ease both 0.12s" }}>

        {/* Ornament */}
        <div style={{ ...MONO,fontSize:"0.42rem",letterSpacing:"0.26em",color:c.orn,marginBottom:12,textAlign:"center" }}>
          ◆ {ORNAMENTS[slide]} ◆
        </div>

        {/* Title — line1 white/dark, line2 gold, optional line3 smaller */}
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
