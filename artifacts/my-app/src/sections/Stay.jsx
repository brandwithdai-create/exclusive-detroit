import React from "react";
import { HOTELS, getBookingCTA } from "../data/eventsData.js";
import { fetchPlacePhotos } from "../data/fetchPlaces.js";

const C = {
  black:"var(--c-black)", deep:"var(--c-deep)", card:"var(--c-card)", border:"var(--c-border)", borderS:"var(--c-borders)",
  gold:"var(--c-gold)", goldL:"var(--c-goldL)", goldD:"var(--c-goldD)",
  smoke:"var(--c-smoke)", ash:"var(--c-ash)", bone:"var(--c-bone)", white:"var(--c-white)", purple:"var(--c-purple)",
};

function SaveBtn({ saved, onSave }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onSave(); }}
      style={{ background:"none", border:"none", cursor:"pointer", color:saved ? C.gold : C.bone, fontSize:"1.1rem", padding:"10px 12px", display:"inline-flex", alignItems:"center", justifyContent:"center", outline:"none", minWidth:44, minHeight:44, transition:"color 0.18s", flexShrink:0 }}
    >
      {saved ? "\u2665" : "\u2661"}
    </button>
  );
}

function StarRating({ rating, ratingCount }) {
  if (!rating) return null;
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const stars = Array.from({ length: 5 }, (_, i) => {
    if (i < full) return "★";
    if (i === full && half) return "½";
    return "☆";
  });
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
      <span style={{ color:C.gold, fontSize:"0.85rem", letterSpacing:"0.02em" }}>{stars.join("")}</span>
      <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.55rem", color:C.smoke, letterSpacing:"0.06em" }}>
        {rating.toFixed(1)}{ratingCount ? ` · ${ratingCount.toLocaleString()} reviews` : ""}
      </span>
    </div>
  );
}

function CardImage({ localSrc, placesPhoto, alt, height = 210 }) {
  const [err, setErr] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  const src = (!err && placesPhoto) ? placesPhoto : localSrc;

  if (!src) return null;
  return (
    <div style={{
      height,
      overflow: "hidden",
      flexShrink: 0,
      position: "relative",
      background: "linear-gradient(90deg,#1a1820 25%,#232030 50%,#1a1820 75%)",
      backgroundSize: "200% 100%",
      animation: loaded ? "none" : "shimmer 1.4s infinite",
    }}>
      <img
        key={src}
        src={src}
        alt={alt}
        onError={() => { setErr(true); setLoaded(true); }}
        onLoad={() => setLoaded(true)}
        style={{
          width: "100%", height: "100%", objectFit: "cover", display: "block",
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.35s ease",
        }}
      />
    </div>
  );
}

function useHotelPlaces(hotel) {
  const [placesData, setPlacesData] = React.useState(null);

  React.useEffect(() => {
    const query = `${hotel.name} ${hotel.addr} Detroit`;
    fetchPlacePhotos(query).then(data => {
      if (data?.photos?.length || data?.rating) {
        setPlacesData(data);
      }
    });
  }, [hotel.id]);

  return placesData;
}

function HotelDetailModal({ hotel, places, saved, onSave, onClose }) {
  React.useEffect(() => {
    const fn = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);

  const cta = getBookingCTA(hotel);

  return (
    <>
      <div
        onClick={onClose}
        style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.88)", zIndex:800, backdropFilter:"blur(4px)", WebkitBackdropFilter:"blur(4px)" }}
      />
      <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:"min(660px,93vw)", maxHeight:"90vh", overflowY:"auto", background:C.deep, border:"1px solid "+C.border, borderRadius:12, zIndex:900 }}>
        <CardImage localSrc={hotel.image} placesPhoto={places?.photos?.[0] || null} alt={hotel.name} height={260} />
        <div style={{ padding:"20px 24px 28px", display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.55rem", letterSpacing:"0.16em", textTransform:"uppercase", color:C.gold }}>
              {hotel.hood}
            </span>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.62rem", letterSpacing:"0.06em", color:C.goldL, fontWeight:500 }}>
                {hotel.price_from}
              </span>
              <button
                onClick={onClose}
                style={{ width:44, height:44, borderRadius:"50%", background:"var(--c-close-bg)", border:"1px solid var(--c-close-bdr)", color:"var(--c-close-txt)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.1rem", fontWeight:400, flexShrink:0, transition:"background 0.18s" }}
              >×</button>
            </div>
          </div>

          <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(1.5rem,4vw,2rem)", fontWeight:600, color:C.white, lineHeight:1.1, margin:0 }}>
            {hotel.name}
          </h2>

          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"0.82rem", color:C.ash, fontWeight:300 }}>
            {hotel.addr}
          </span>

          <StarRating rating={places?.rating} ratingCount={places?.ratingCount} />

          <p style={{ fontSize:"0.86rem", color:C.ash, fontWeight:300, lineHeight:1.72, margin:0 }}>
            {hotel.desc}
          </p>

          {hotel.features?.length > 0 && (
            <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
              {hotel.features.map(f => (
                <span key={f} style={{ border:"1.5px solid var(--c-filter-bdr)", color:C.ash, borderRadius:100, padding:"3px 10px", fontSize:"0.52rem", fontFamily:"'DM Mono',monospace", letterSpacing:"0.1em", textTransform:"uppercase", whiteSpace:"nowrap" }}>
                  {f}
                </span>
              ))}
            </div>
          )}

          {hotel.exclusive && (
            <div style={{ background:"var(--c-excl-bg)", border:"1px solid var(--c-excl-bdr)", borderRadius:6, padding:"13px 16px" }}>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.52rem", letterSpacing:"0.15em", textTransform:"uppercase", color:C.gold, display:"block", marginBottom:6 }}>Why it's worth it</span>
              <p style={{ fontSize:"0.83rem", color:C.bone, fontWeight:300, fontStyle:"italic", lineHeight:1.62, margin:0 }}>
                {hotel.exclusive}
              </p>
            </div>
          )}

          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            {cta ? (
              <a
                href={cta.url} target="_blank" rel="noopener noreferrer"
                style={{ flex:1, display:"block", background:C.gold, color:C.black, fontFamily:"'DM Mono',monospace", fontSize:"0.55rem", letterSpacing:"0.13em", textTransform:"uppercase", padding:"13px 18px", borderRadius:6, fontWeight:500, textDecoration:"none", cursor:"pointer", textAlign:"center" }}
              >
                {cta.label}
              </a>
            ) : <span style={{ flex:1 }} />}
            <button
              onClick={() => onSave(hotel.id)}
              style={{ padding:"12px 14px", background:saved?"rgba(201,168,76,0.15)":"transparent", border:"1px solid "+(saved?C.gold:C.border), color:saved?C.gold:C.bone, fontFamily:"'DM Mono',monospace", fontSize:"0.58rem", letterSpacing:"0.12em", textTransform:"uppercase", borderRadius:6, cursor:"pointer", transition:"all 0.18s", flexShrink:0 }}
            >
              {saved ? "\u2665 Saved" : "\u2661 Save"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function HotelCard({ hotel, saved, onSave, onOpen }) {
  const [hov, setHov] = React.useState(false);
  const cta = getBookingCTA(hotel);
  const places = useHotelPlaces(hotel);

  return (
    <div
      onClick={() => onOpen(hotel, places)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background:C.card, border:"1px solid "+(hov?C.goldD:C.border), borderRadius:12, overflow:"hidden", display:"flex", flexDirection:"column", animation:"fadeSlideIn 0.28s ease both", cursor:"pointer", transform:hov?"translateY(-3px)":"none", boxShadow:hov?"var(--c-shdw-h)":"var(--c-shdw-f)", transition:"all 0.22s" }}
    >
      <CardImage
        localSrc={hotel.image}
        placesPhoto={places?.photos?.[0] || null}
        alt={hotel.name}
      />
      <div style={{ padding:"18px 20px 18px", display:"flex", flexDirection:"column", gap:10, flex:1 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.55rem", letterSpacing:"0.16em", textTransform:"uppercase", color:C.gold }}>
            {hotel.hood}
          </span>
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.62rem", letterSpacing:"0.06em", color:C.goldL, fontWeight:500 }}>
            {hotel.price_from}
          </span>
        </div>

        <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.35rem", fontWeight:600, color:C.white, lineHeight:1.15, margin:0 }}>
          {hotel.name}
        </h3>

        <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"0.78rem", color:C.ash, fontWeight:300 }}>
          {hotel.addr}
        </span>

        <StarRating rating={places?.rating} ratingCount={places?.ratingCount} />

        <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"0.82rem", color:C.ash, fontWeight:300, lineHeight:1.65, margin:0, flex:1 }}>
          {hotel.desc}
        </p>

        <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
          {hotel.features.map(f => (
            <span key={f} style={{ border:"1.5px solid var(--c-filter-bdr)", color:C.ash, borderRadius:100, padding:"3px 10px", fontSize:"0.52rem", fontFamily:"'DM Mono',monospace", letterSpacing:"0.1em", textTransform:"uppercase", whiteSpace:"nowrap" }}>
              {f}
            </span>
          ))}
        </div>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 20px 14px", borderTop:"1px solid "+C.borderS }}>
        {cta ? (
          <a
            href={cta.url} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{ display:"inline-block", background:C.gold, color:C.black, fontFamily:"'DM Mono',monospace", fontSize:"0.57rem", letterSpacing:"0.13em", textTransform:"uppercase", padding:"9px 16px", borderRadius:6, fontWeight:500, textDecoration:"none", cursor:"pointer" }}
          >
            {cta.label}
          </a>
        ) : <span />}
        <SaveBtn saved={saved} onSave={() => onSave(hotel.id)} />
      </div>
    </div>
  );
}

export default function Stay({ isSavedHotel, toggleSavedHotel }) {
  const [activeHotel, setActiveHotel] = React.useState(null);
  const [activePlaces, setActivePlaces] = React.useState(null);

  const handleOpen = (hotel, places) => {
    setActiveHotel(hotel);
    setActivePlaces(places);
  };

  const handleClose = () => {
    setActiveHotel(null);
    setActivePlaces(null);
  };

  return (
    <div>
      <div style={{ background:C.deep, padding:"64px 22px 40px", borderBottom:"1px solid "+C.border }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <p style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.55rem", letterSpacing:"0.22em", textTransform:"uppercase", color:C.gold, marginBottom:8 }}>
            Detroit
          </p>
          <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(1.8rem,5vw,3rem)", fontWeight:400, color:C.white, margin:0 }}>
            Where to Stay
          </h2>
          <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"0.88rem", color:C.ash, fontWeight:300, lineHeight:1.7, marginTop:12, maxWidth:560 }}>
            Curated hotels in Downtown, Midtown, and Corktown — chosen for character, location, and the full Detroit experience.
          </p>
        </div>
      </div>

      <div style={{ maxWidth:1200, margin:"0 auto", padding:"32px 22px 64px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:15 }}>
          {HOTELS.map(h => (
            <HotelCard key={h.id} hotel={h} saved={isSavedHotel(h.id)} onSave={toggleSavedHotel} onOpen={handleOpen} />
          ))}
        </div>
        <p style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.47rem", letterSpacing:"0.1em", textTransform:"uppercase", color:C.smoke, textAlign:"center", paddingTop:32 }}>
          Prices are indicative · Always verify availability before booking
        </p>
      </div>

      {activeHotel && (
        <HotelDetailModal
          hotel={activeHotel}
          places={activePlaces}
          saved={isSavedHotel(activeHotel.id)}
          onSave={toggleSavedHotel}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
