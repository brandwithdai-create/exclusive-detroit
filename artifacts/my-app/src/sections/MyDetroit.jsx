import React, { useState, useMemo } from "react";

const C = {
  black:"var(--c-black)", deep:"var(--c-deep)", card:"var(--c-card)",
  border:"var(--c-border)", borderS:"var(--c-borders)",
  gold:"var(--c-gold)", goldL:"var(--c-goldL)", goldD:"var(--c-goldD)",
  smoke:"var(--c-smoke)", ash:"var(--c-ash)", bone:"var(--c-bone)",
  white:"var(--c-white)", purple:"var(--c-purple)",
};

export const TASTE_OPTIONS = [
  { id:"hidden",    label:"Hidden Gems",        filter: v => (v.badges||[]).includes("hidden") },
  { id:"datenight", label:"Date Night",          filter: v => (v.best||"").includes("Date Night") },
  { id:"latenight", label:"Late Night",          filter: v => (v.hours||"").includes("2am") },
  { id:"cocktail",  label:"Cocktail First",      filter: v => v.cat==="Cocktail Lounges"||v.cat==="Hidden Bars" },
  { id:"foodie",    label:"Foodie",              filter: v => ["Dinner","Lunch","Breakfast"].includes(v.cat) },
  { id:"locals",    label:"Locals Only",         filter: v => (v.badges||[]).includes("locals") },
  { id:"rooftop",   label:"Rooftop Views",       filter: v => v.cat==="Rooftops" },
  { id:"sports",    label:"Sports & Games",      filter: v => v.cat==="Sports Bars" },
  { id:"happyhour", label:"Happy Hour",          filter: v => v.cat==="Happy Hour"||(v.cats||[]).includes("Happy Hour") },
  { id:"brunch",    label:"Weekend Brunch",      filter: v => v.cat==="Breakfast" },
  { id:"offstrip",  label:"Off the Main Strip",  filter: v => v.hood!=="Downtown" },
  { id:"new",       label:"New & Noteworthy",    filter: v => (v.badges||[]).includes("recentopen") },
];

const PASSPORT_BADGES = [
  { id:"gem",      label:"Hidden Gem Hunter",     hint:"Visit a venue marked Hidden Gem",              test: vis => vis.some(v=>(v.badges||[]).includes("hidden")) },
  { id:"cocktail", label:"Cocktail Connoisseur",  hint:"Visit 3 cocktail lounges or hidden bars",     test: vis => vis.filter(v=>v.cat==="Cocktail Lounges"||v.cat==="Hidden Bars").length>=3 },
  { id:"owl",      label:"Night Owl",             hint:"Visit 2 venues open past 2am",                test: vis => vis.filter(v=>(v.hours||"").includes("2am")).length>=2 },
  { id:"hood",     label:"Neighborhood Explorer", hint:"Visit venues in 3 different neighborhoods",   test: vis => new Set(vis.map(v=>v.hood)).size>=3 },
  { id:"reg",      label:"The Regular",           hint:"Visit 5 venues",                              test: vis => vis.length>=5 },
  { id:"native",   label:"Detroit Native",        hint:"Visit 10 venues",                             test: vis => vis.length>=10 },
  { id:"roof",     label:"Rooftop Society",       hint:"Visit a rooftop venue",                       test: vis => vis.some(v=>v.cat==="Rooftops") },
  { id:"bird",     label:"Early Bird",            hint:"Visit a breakfast or brunch spot",            test: vis => vis.some(v=>v.cat==="Breakfast"||v.cat==="Coffee Shops & Bakeries") },
];

function buildNight(when, group, energy, pool) {
  const used = new Set();
  function pick(candidates) {
    const avail = candidates.filter(v => !used.has(String(v.id)));
    if (!avail.length) return null;
    const choice = avail[used.size % avail.length];
    used.add(String(choice.id));
    return choice;
  }

  let s1 = when === "early"
    ? pool.filter(v => v.cat==="Happy Hour"||(v.cats||[]).includes("Happy Hour")||v.cat==="Cocktail Lounges")
    : pool.filter(v => (v.cat==="Cocktail Lounges"||v.cat==="Hidden Bars")&&(v.hours||"").includes("2am"));
  if (!s1.length) s1 = pool.filter(v => v.cat==="Cocktail Lounges"||v.cat==="Hidden Bars");

  let s2;
  if (energy === "chill") {
    s2 = pool.filter(v => v.cat==="Dinner"||(v.best||"").includes("Date Night"));
    if (group === "solo") {
      const local = s2.filter(v => (v.badges||[]).includes("locals"));
      if (local.length) s2 = local;
    }
  } else if (energy === "medium") {
    s2 = pool.filter(v => v.cat==="Rooftops"||v.cat==="Cocktail Lounges"||(v.badges||[]).includes("hidden"));
    if (!s2.length) s2 = pool.filter(v => v.cat==="Dinner");
  } else {
    s2 = pool.filter(v => v.cat==="Nightlife"||(v.badges||[]).includes("hidden"));
  }
  if (!s2.length) s2 = pool.filter(v => v.cat==="Dinner");

  let s3 = pool.filter(v =>
    (v.cat==="Nightlife"||v.cat==="Hidden Bars"||v.cat==="Cocktail Lounges") &&
    (v.hours||"").includes("2am")
  );
  if (!s3.length) s3 = pool.filter(v => v.cat==="Nightlife"||v.cat==="Hidden Bars");

  return [pick(s1), pick(s2), pick(s3)].filter(Boolean);
}

const MONO = { fontFamily:"'DM Mono',monospace" };
const SERIF = { fontFamily:"'Cormorant Garamond',serif" };

function SectionLabel({ children }) {
  return (
    <p style={{ ...MONO, fontSize:"0.5rem", letterSpacing:"0.2em", textTransform:"uppercase", color:C.goldD, margin:"0 0 14px" }}>
      {children}
    </p>
  );
}

function VenueRow({ v, onOpen }) {
  return (
    <button
      onClick={() => onOpen(String(v.id))}
      style={{
        display:"flex", alignItems:"flex-start", gap:14, padding:"14px 16px",
        background:"var(--c-card)", border:"1px solid var(--c-border)", borderRadius:10,
        cursor:"pointer", textAlign:"left", width:"100%", transition:"border-color 0.18s",
      }}
    >
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
          <span style={{ ...MONO, fontSize:"0.44rem", letterSpacing:"0.14em", textTransform:"uppercase", color:C.gold }}>
            {v.cat}
          </span>
          <span style={{ ...MONO, fontSize:"0.44rem", letterSpacing:"0.1em", textTransform:"uppercase", color:C.smoke }}>
            {v.hood}
          </span>
        </div>
        <div style={{ ...SERIF, fontSize:"1.05rem", fontWeight:600, color:C.white, lineHeight:1.2, marginBottom:3 }}>
          {v.name}
        </div>
        <div style={{ fontSize:"0.75rem", color:C.ash, fontWeight:300, lineHeight:1.5 }}>
          {v.desc.length > 85 ? v.desc.slice(0, 85) + "…" : v.desc}
        </div>
      </div>
      <span style={{ color:C.goldD, fontSize:"0.85rem", flexShrink:0, marginTop:2 }}>→</span>
    </button>
  );
}

function ForYouTab({ taste, onTasteChange, allVenues, onOpenVenue }) {
  const MAX = 3;

  const forYouVenues = useMemo(() => {
    if (!taste.length) return [];
    const filters = TASTE_OPTIONS.filter(t => taste.includes(t.id)).map(t => t.filter);
    return allVenues
      .map(v => ({ v, score: filters.reduce((acc, fn) => acc + (fn(v) ? 1 : 0), 0) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(x => x.v);
  }, [taste, allVenues]);

  return (
    <div style={{ padding:"24px 22px 56px", maxWidth:1200, margin:"0 auto" }}>
      <div style={{ marginBottom:28 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
          <SectionLabel>Your Taste Profile</SectionLabel>
          {taste.length > 0 && (
            <span style={{ ...MONO, fontSize:"0.44rem", letterSpacing:"0.1em", color:C.smoke, marginBottom:14 }}>
              {taste.length}/{MAX} selected
            </span>
          )}
        </div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
          {TASTE_OPTIONS.map(opt => {
            const selected = taste.includes(opt.id);
            const disabled = !selected && taste.length >= MAX;
            return (
              <button
                key={opt.id}
                onClick={() => {
                  if (selected) onTasteChange(taste.filter(t => t !== opt.id));
                  else if (!disabled) onTasteChange([...taste, opt.id]);
                }}
                style={{
                  ...MONO, fontSize:"0.5rem", letterSpacing:"0.12em", textTransform:"uppercase",
                  padding:"8px 14px", borderRadius:100,
                  border:"1px solid " + (selected ? C.gold : "var(--c-border)"),
                  background: selected ? "rgba(201,168,76,0.12)" : "transparent",
                  color: selected ? C.gold : disabled ? "var(--c-borders)" : C.ash,
                  cursor: disabled ? "default" : "pointer",
                  transition:"all 0.18s", opacity: disabled ? 0.38 : 1,
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        {taste.length === MAX && (
          <p style={{ ...MONO, fontSize:"0.43rem", letterSpacing:"0.07em", color:C.smoke, marginTop:10, marginBottom:0 }}>
            Tap a selection to change it
          </p>
        )}
      </div>

      {taste.length === 0 ? (
        <div style={{ textAlign:"center", padding:"48px 0", borderTop:"1px solid var(--c-borders)" }}>
          <p style={{ ...SERIF, fontSize:"1.25rem", fontWeight:400, color:C.white, marginBottom:8 }}>
            Select your tastes above
          </p>
          <p style={{ fontSize:"0.82rem", color:C.smoke, fontWeight:300 }}>
            Your personalized Detroit guide will appear here.
          </p>
        </div>
      ) : (
        <div style={{ borderTop:"1px solid var(--c-borders)", paddingTop:24 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
            <SectionLabel>Curated for You</SectionLabel>
            <span style={{ ...MONO, fontSize:"0.44rem", color:C.smoke, marginBottom:14 }}>
              {forYouVenues.length} spot{forYouVenues.length !== 1 ? "s" : ""}
            </span>
          </div>
          {forYouVenues.length === 0 ? (
            <p style={{ fontSize:"0.82rem", color:C.smoke, fontWeight:300 }}>No matches found for your selections.</p>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {forYouVenues.map(v => <VenueRow key={v.id} v={v} onOpen={onOpenVenue} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const STOP_LABELS = ["First Stop", "Main Event", "After Hours"];

function BuildNightTab({ allVenues, onOpenVenue }) {
  const [when,      setWhen]      = useState(null);
  const [group,     setGroup]     = useState(null);
  const [energy,    setEnergy]    = useState(null);
  const [result,    setResult]    = useState(null);
  const [generated, setGenerated] = useState(false);

  const ready = when && group && energy;

  function generate() {
    if (!ready) return;
    setResult(buildNight(when, group, energy, allVenues));
    setGenerated(true);
  }

  function reset() {
    setWhen(null); setGroup(null); setEnergy(null);
    setResult(null); setGenerated(false);
  }

  function OptionBtn({ val, current, onSet, label }) {
    const active = current === val;
    return (
      <button
        onClick={() => onSet(val)}
        style={{
          ...MONO, fontSize:"0.5rem", letterSpacing:"0.1em", textTransform:"uppercase",
          padding:"9px 16px", borderRadius:8, whiteSpace:"nowrap",
          border:"1px solid " + (active ? C.gold : "var(--c-border)"),
          background: active ? "rgba(201,168,76,0.1)" : "transparent",
          color: active ? C.gold : C.ash,
          cursor:"pointer", transition:"all 0.18s",
        }}
      >
        {label}
      </button>
    );
  }

  if (generated) {
    return (
      <div style={{ padding:"24px 22px 56px", maxWidth:640, margin:"0 auto" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
          <SectionLabel>Your Night</SectionLabel>
          <button
            onClick={reset}
            style={{ ...MONO, fontSize:"0.44rem", letterSpacing:"0.1em", textTransform:"uppercase", background:"transparent", border:"1px solid var(--c-border)", color:C.smoke, padding:"6px 12px", borderRadius:6, cursor:"pointer", marginBottom:14 }}
          >
            Rebuild
          </button>
        </div>
        {!result || result.length === 0 ? (
          <div style={{ textAlign:"center", padding:"48px 0" }}>
            <p style={{ ...SERIF, fontSize:"1.2rem", color:C.white, marginBottom:8 }}>No match found</p>
            <p style={{ fontSize:"0.82rem", color:C.smoke, fontWeight:300 }}>Try different choices</p>
          </div>
        ) : result.map((v, i) => (
          <div key={v.id} style={{ display:"flex", gap:14, marginBottom: i < result.length - 1 ? 0 : 0 }}>
            <div style={{ flexShrink:0, display:"flex", flexDirection:"column", alignItems:"center", paddingTop:2 }}>
              <div style={{ width:24, height:24, borderRadius:"50%", border:"1px solid " + C.gold, display:"flex", alignItems:"center", justifyContent:"center", ...MONO, fontSize:"0.5rem", color:C.gold, flexShrink:0 }}>
                {i + 1}
              </div>
              {i < result.length - 1 && (
                <div style={{ width:1, flex:1, background:"var(--c-border)", marginTop:6, marginBottom:6, minHeight:24 }} />
              )}
            </div>
            <div style={{ flex:1, background:"var(--c-card)", border:"1px solid var(--c-border)", borderRadius:10, padding:"14px 16px", marginBottom: i < result.length - 1 ? 14 : 0 }}>
              <p style={{ ...MONO, fontSize:"0.42rem", letterSpacing:"0.15em", textTransform:"uppercase", color:C.goldD, margin:"0 0 5px" }}>
                {STOP_LABELS[i]}
              </p>
              <div style={{ ...MONO, fontSize:"0.43rem", letterSpacing:"0.12em", textTransform:"uppercase", color:C.gold, marginBottom:4 }}>
                {v.cat} · {v.hood}
              </div>
              <h3 style={{ ...SERIF, fontSize:"1.15rem", fontWeight:600, color:C.white, lineHeight:1.2, margin:"0 0 6px" }}>
                {v.name}
              </h3>
              <p style={{ fontSize:"0.76rem", color:C.ash, fontWeight:300, lineHeight:1.5, margin:"0 0 8px" }}>
                {v.desc.length > 95 ? v.desc.slice(0, 95) + "…" : v.desc}
              </p>
              {v.best && (
                <p style={{ ...MONO, fontSize:"0.43rem", letterSpacing:"0.07em", color:C.smoke, margin:"0 0 10px" }}>
                  Best for: {v.best}
                </p>
              )}
              <div style={{ paddingTop:10, borderTop:"1px solid var(--c-borders)" }}>
                <button
                  onClick={() => onOpenVenue(String(v.id))}
                  style={{ ...MONO, fontSize:"0.5rem", letterSpacing:"0.12em", textTransform:"uppercase", background:C.gold, color:"var(--c-black)", border:"none", borderRadius:6, padding:"8px 16px", cursor:"pointer", fontWeight:500 }}
                >
                  View Details →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ padding:"24px 22px 56px", maxWidth:520, margin:"0 auto" }}>
      <p style={{ ...SERIF, fontSize:"1.05rem", fontWeight:400, color:C.smoke, fontStyle:"italic", marginBottom:28, lineHeight:1.65 }}>
        Answer three questions. We'll build your night from Detroit's best venues.
      </p>
      <div style={{ display:"flex", flexDirection:"column", gap:22 }}>
        <div>
          <p style={{ ...MONO, fontSize:"0.5rem", letterSpacing:"0.2em", textTransform:"uppercase", color:C.goldD, margin:"0 0 10px" }}>When are you going out?</p>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <OptionBtn val="early" current={when} onSet={setWhen} label="Early Evening  ·  5–9pm" />
            <OptionBtn val="late"  current={when} onSet={setWhen} label="Night  ·  9pm – close" />
          </div>
        </div>
        <div>
          <p style={{ ...MONO, fontSize:"0.5rem", letterSpacing:"0.2em", textTransform:"uppercase", color:C.goldD, margin:"0 0 10px" }}>Who's coming?</p>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <OptionBtn val="solo"  current={group} onSet={setGroup} label="Just Me" />
            <OptionBtn val="date"  current={group} onSet={setGroup} label="Date Night" />
            <OptionBtn val="group" current={group} onSet={setGroup} label="Group" />
          </div>
        </div>
        <div>
          <p style={{ ...MONO, fontSize:"0.5rem", letterSpacing:"0.2em", textTransform:"uppercase", color:C.goldD, margin:"0 0 10px" }}>What's the energy?</p>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <OptionBtn val="chill"  current={energy} onSet={setEnergy} label="Chill" />
            <OptionBtn val="medium" current={energy} onSet={setEnergy} label="Good Vibes" />
            <OptionBtn val="wild"   current={energy} onSet={setEnergy} label="All Out" />
          </div>
        </div>
      </div>
      <button
        onClick={generate}
        disabled={!ready}
        style={{
          marginTop:28, ...MONO, fontSize:"0.55rem", letterSpacing:"0.15em", textTransform:"uppercase",
          padding:"13px 32px", borderRadius:100, border:"none", width:"100%",
          background: ready ? C.gold : "var(--c-border)",
          color: ready ? "var(--c-black)" : C.smoke,
          cursor: ready ? "pointer" : "default",
          transition:"all 0.2s", fontWeight:500,
        }}
      >
        Build My Night →
      </button>
    </div>
  );
}

function PassportTab({ visited, allVenues, onOpenVenue, navTo }) {
  const visitedVenues = useMemo(
    () => allVenues.filter(v => visited.includes(String(v.id))),
    [visited, allVenues]
  );

  const badges = PASSPORT_BADGES.map(b => ({ ...b, earned: b.test(visitedVenues) }));
  const earnedCount = badges.filter(b => b.earned).length;
  const milestone = 20;
  const pct = visitedVenues.length === 0 ? 0 : Math.min(100, Math.round((visitedVenues.length / milestone) * 100));
  const recentVisited = visitedVenues.slice(-5).reverse();

  return (
    <div style={{ padding:"24px 22px 56px", maxWidth:1200, margin:"0 auto" }}>
      <div style={{ background:"var(--c-card)", border:"1px solid var(--c-border)", borderRadius:12, padding:"20px 20px 18px", marginBottom:24 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
          <div>
            <p style={{ ...MONO, fontSize:"0.44rem", letterSpacing:"0.18em", textTransform:"uppercase", color:C.goldD, margin:"0 0 4px" }}>Detroit Insider Passport</p>
            <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
              <span style={{ ...SERIF, fontSize:"2rem", fontWeight:400, color:C.white, lineHeight:1 }}>{visitedVenues.length}</span>
              <span style={{ fontSize:"0.84rem", color:C.smoke, fontWeight:300 }}>venue{visitedVenues.length !== 1 ? "s" : ""} visited</span>
            </div>
          </div>
          <div style={{ textAlign:"right" }}>
            <span style={{ ...MONO, fontSize:"0.44rem", letterSpacing:"0.1em", color:C.gold }}>{earnedCount} / {badges.length} badges</span>
          </div>
        </div>
        <div style={{ background:"var(--c-borders)", borderRadius:100, height:2, overflow:"hidden" }}>
          <div style={{ height:"100%", width:pct + "%", background:C.gold, borderRadius:100, transition:"width 0.6s ease" }} />
        </div>
        <p style={{ ...MONO, fontSize:"0.41rem", letterSpacing:"0.07em", color:C.smoke, marginTop:7, marginBottom:0 }}>
          {visitedVenues.length === 0 ? "Open any venue and mark it as visited to begin" : `${pct}% of your first ${milestone} discovered`}
        </p>
      </div>

      <div style={{ marginBottom:28 }}>
        <SectionLabel>Badges</SectionLabel>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))", gap:10 }}>
          {badges.map(b => (
            <div
              key={b.id}
              style={{
                background: b.earned ? "rgba(201,168,76,0.07)" : "var(--c-card)",
                border:"1px solid " + (b.earned ? "rgba(201,168,76,0.3)" : "var(--c-border)"),
                borderRadius:10, padding:"14px 16px",
                opacity: b.earned ? 1 : 0.45,
                transition:"opacity 0.3s",
              }}
            >
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ ...MONO, fontSize:"0.42rem", letterSpacing:"0.12em", textTransform:"uppercase", color: b.earned ? C.gold : C.smoke }}>
                  {b.earned ? "Earned" : "Locked"}
                </span>
                {b.earned && <span style={{ color:C.goldD, fontSize:"0.65rem", lineHeight:1 }}>◈</span>}
              </div>
              <div style={{ ...SERIF, fontSize:"0.98rem", fontWeight:600, color: b.earned ? C.white : C.ash, lineHeight:1.2, marginBottom:5 }}>
                {b.label}
              </div>
              <div style={{ ...MONO, fontSize:"0.41rem", letterSpacing:"0.06em", color:C.smoke, lineHeight:1.5 }}>
                {b.hint}
              </div>
            </div>
          ))}
        </div>
      </div>

      {recentVisited.length > 0 ? (
        <div>
          <SectionLabel>Recently Visited</SectionLabel>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {recentVisited.map(v => (
              <button
                key={v.id}
                onClick={() => onOpenVenue(String(v.id))}
                style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", background:"var(--c-card)", border:"1px solid var(--c-border)", borderRadius:8, cursor:"pointer", textAlign:"left", width:"100%", transition:"border-color 0.18s" }}
              >
                <div>
                  <div style={{ ...SERIF, fontSize:"1rem", fontWeight:600, color:C.white, marginBottom:2 }}>{v.name}</div>
                  <div style={{ ...MONO, fontSize:"0.41rem", letterSpacing:"0.1em", textTransform:"uppercase", color:C.smoke }}>{v.cat} · {v.hood}</div>
                </div>
                <span style={{ color:C.goldD, fontSize:"0.85rem", flexShrink:0 }}>→</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ textAlign:"center", padding:"24px 0" }}>
          <p style={{ ...SERIF, fontSize:"1.05rem", fontWeight:400, color:C.smoke, fontStyle:"italic", lineHeight:1.6, marginBottom:16 }}>
            Open any venue and tap "Mark as Visited" to build your passport.
          </p>
          <button
            onClick={() => navTo("explore")}
            style={{ ...MONO, fontSize:"0.5rem", letterSpacing:"0.14em", textTransform:"uppercase", color:C.gold, border:"1px solid var(--c-goldD)", padding:"9px 20px", borderRadius:6, background:"transparent", cursor:"pointer" }}
          >
            Explore Venues →
          </button>
        </div>
      )}
    </div>
  );
}

const TABS = [
  { id:"foryou",   label:"For You" },
  { id:"tonight",  label:"Tonight" },
  { id:"passport", label:"Passport" },
];

export default function MyDetroit({ visited, taste, onTasteChange, onOpenVenue, navTo, allVenues }) {
  const [subTab, setSubTab] = useState("foryou");

  return (
    <div>
      <div style={{ background:"var(--c-deep)", padding:"46px 22px 0", borderBottom:"1px solid var(--c-border)" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <p style={{ ...MONO, fontSize:"0.53rem", letterSpacing:"0.22em", textTransform:"uppercase", color:"var(--c-gold)", marginBottom:5 }}>
            Personal Guide
          </p>
          <h2 style={{ ...SERIF, fontSize:"clamp(1.8rem,5vw,3rem)", fontWeight:400, color:"var(--c-white)", marginBottom:4 }}>
            My Detroit
          </h2>
          <p style={{ fontSize:"0.84rem", color:"var(--c-smoke)", marginBottom:0 }}>
            Personalized to how you explore the city.
          </p>
        </div>
        <div style={{ maxWidth:1200, margin:"20px auto 0" }}>
          <div style={{ display:"flex" }}>
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setSubTab(t.id)}
                style={{
                  ...MONO, fontSize:"0.55rem", letterSpacing:"0.14em", textTransform:"uppercase",
                  padding:"12px 20px", background:"transparent", border:"none", cursor:"pointer",
                  color: subTab === t.id ? "var(--c-gold)" : "var(--c-smoke)",
                  borderBottom: subTab === t.id ? "2px solid var(--c-gold)" : "2px solid transparent",
                  transition:"color 0.18s, border-color 0.18s", marginBottom:-1,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {subTab === "foryou"   && <ForYouTab   taste={taste} onTasteChange={onTasteChange} allVenues={allVenues} onOpenVenue={onOpenVenue} />}
      {subTab === "tonight"  && <BuildNightTab allVenues={allVenues} onOpenVenue={onOpenVenue} />}
      {subTab === "passport" && <PassportTab   visited={visited} allVenues={allVenues} onOpenVenue={onOpenVenue} navTo={navTo} />}
    </div>
  );
}
