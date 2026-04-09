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
      onClick={onSave}
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
    <div style={{ display:"flex", alignItems:"center", gap:4 }}>
      <span style={{ color:C.gold, fontSize:"0.72rem", letterSpacing:"0.02em" }}>{stars.join("")}</span>
      <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.47rem", color:C.smoke, letterSpacing:"0.06em" }}>
        {rating.toFixed(1)}{ratingCount ? ` · ${ratingCount.toLocaleString()} reviews` : ""}
      </span>
    </div>
  );
}

function CardImage({ localSrc, placesPhoto, alt }) {
  const [err, setErr] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  // Use the real Places photo once available; fall back to local file
  const src = (!err && placesPhoto) ? placesPhoto : localSrc;

  if (!src) return null;
  return (
    <div style={{
      height: 200,
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
      {/* "Real photo" badge shown when using a Places photo */}
      {placesPhoto && loaded && !err && (
        <div style={{
          position: "absolute", bottom: 8, left: 8,
          background: "rgba(6,5,10,0.65)", backdropFilter: "blur(6px)",
          borderRadius: 4, padding: "2px 6px",
        }}>
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.38rem", letterSpacing:"0.1em", textTransform:"uppercase", color:"rgba(255,255,255,0.6)" }}>
            Google Photos
          </span>
        </div>
      )}
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

function HotelCard({ hotel, saved, onSave }) {
  const cta = getBookingCTA(hotel);
  const places = useHotelPlaces(hotel);

  return (
    <div style={{ background:C.card, border:"1px solid "+C.border, borderRadius:12, overflow:"hidden", display:"flex", flexDirection:"column", animation:"fadeSlideIn 0.28s ease both" }}>
      <CardImage
        localSrc={hotel.image}
        placesPhoto={places?.photos?.[0] || null}
        alt={hotel.name}
      />
      <div style={{ padding:"16px 18px 18px", display:"flex", flexDirection:"column", gap:9, flex:1 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.49rem", letterSpacing:"0.16em", textTransform:"uppercase", color:C.gold }}>
            {hotel.hood}
          </span>
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.49rem", letterSpacing:"0.08em", color:C.gold, fontWeight:500 }}>
            {hotel.price_from}
          </span>
        </div>
        <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.3rem", fontWeight:600, color:C.white, lineHeight:1.15, margin:0 }}>
          {hotel.name}
        </h3>
        <p style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.49rem", letterSpacing:"0.06em", color:C.smoke, margin:0 }}>
          {hotel.addr}
        </p>
        <StarRating rating={places?.rating} ratingCount={places?.ratingCount} />
        <p style={{ fontSize:"0.78rem", color:C.ash, fontWeight:300, lineHeight:1.65, margin:0, flex:1 }}>
          {hotel.desc}
        </p>
        <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
          {hotel.features.map(f => (
            <span key={f} style={{ border:"1.5px solid var(--c-filter-bdr)", color:C.ash, borderRadius:100, padding:"3px 9px", fontSize:"0.49rem", fontFamily:"'DM Mono',monospace", letterSpacing:"0.1em", textTransform:"uppercase", whiteSpace:"nowrap" }}>
              {f}
            </span>
          ))}
        </div>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 18px 14px", borderTop:"1px solid "+C.borderS }}>
        {cta ? (
          <a
            href={cta.url} target="_blank" rel="noopener noreferrer"
            style={{ display:"inline-block", background:C.gold, color:C.black, fontFamily:"'DM Mono',monospace", fontSize:"0.57rem", letterSpacing:"0.13em", textTransform:"uppercase", padding:"8px 14px", borderRadius:6, fontWeight:500, textDecoration:"none", cursor:"pointer" }}
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
  return (
    <div>
      {/* Section header */}
      <div style={{ background:C.deep, padding:"64px 22px 40px", borderBottom:"1px solid "+C.border }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <p style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.53rem", letterSpacing:"0.22em", textTransform:"uppercase", color:C.gold, marginBottom:8 }}>
            Detroit
          </p>
          <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(1.8rem,5vw,3rem)", fontWeight:400, color:C.white, margin:0 }}>
            Where to Stay
          </h2>
          <p style={{ fontSize:"0.82rem", color:C.ash, fontWeight:300, lineHeight:1.7, marginTop:12, maxWidth:560 }}>
            Curated hotels in Downtown, Midtown, and Corktown — chosen for character, location, and the full Detroit experience.
          </p>
        </div>
      </div>

      {/* Hotel grid */}
      <div style={{ maxWidth:1200, margin:"0 auto", padding:"32px 22px 64px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:15 }}>
          {HOTELS.map(h => (
            <HotelCard key={h.id} hotel={h} saved={isSavedHotel(h.id)} onSave={toggleSavedHotel} />
          ))}
        </div>
        <p style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.44rem", letterSpacing:"0.1em", textTransform:"uppercase", color:C.smoke, textAlign:"center", paddingTop:32 }}>
          Prices are indicative · Always verify availability before booking
        </p>
      </div>
    </div>
  );
}
