// ─────────────────────────────────────────────────────────────────────────────
// Exclusive Detroit — Events Data Layer
// Static arrays are FALLBACK ONLY for the Ticketmaster API.
// Every item shown in-app MUST have a real ticket_url — enforced in fetchLiveData.
// ─────────────────────────────────────────────────────────────────────────────

// ── CTA helpers ─────────────────────────────────────────────────────────────
export function getTicketCTA(item) {
  const url = item.affiliate_ticket_url || item.ticket_url || item.website_url;
  if (!url) return null;
  return { url, label: "Get Tickets" };
}

export function getBookingCTA(hotel) {
  const url = hotel.affiliate_booking_url || hotel.booking_url || hotel.website_url;
  if (!url) return null;
  return { url, label: "View Rooms" };
}

// ── Date helpers ─────────────────────────────────────────────────────────────
export function fmtDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });
}

export function isUpcoming(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d) >= new Date(new Date().setHours(0, 0, 0, 0));
}

// ── Games ────────────────────────────────────────────────────────────────────
// Detroit home games fallback — used only when Ticketmaster API is unavailable.
// Ticket URLs point to official team ticketing pages (real, verified sources).
export const GAMES = [
  {
    id: "game-tigers-fallback",
    sport: "MLB",
    team: "Detroit Tigers",
    teamShort: "Tigers",
    opponent: "Upcoming",
    home: true,
    date: "2026-04-18",
    time: "1:10 PM ET",
    venue: "Comerica Park",
    hood: "Downtown",
    note: null,
    image: "https://images.unsplash.com/photo-1471295253337-3ceaaedca402?w=800&q=85",
    logo_url: "https://a.espncdn.com/i/teamlogos/mlb/500/det.png",
    images: [],
    ticket_url: "https://www.mlb.com/tigers/tickets",
    affiliate_ticket_url: null,
    website_url: "https://www.mlb.com/tigers",
  },
  {
    id: "game-pistons-fallback",
    sport: "NBA",
    team: "Detroit Pistons",
    teamShort: "Pistons",
    opponent: "Upcoming",
    home: true,
    date: "2026-04-22",
    time: "7:00 PM ET",
    venue: "Little Caesars Arena",
    hood: "Downtown",
    note: null,
    image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=85",
    logo_url: "https://a.espncdn.com/i/teamlogos/nba/500/det.png",
    images: [],
    ticket_url: "https://www.nba.com/pistons/tickets",
    affiliate_ticket_url: null,
    website_url: "https://www.nba.com/pistons",
  },
  {
    id: "game-wings-fallback",
    sport: "NHL",
    team: "Detroit Red Wings",
    teamShort: "Red Wings",
    opponent: "Upcoming",
    home: true,
    date: "2026-04-25",
    time: "7:00 PM ET",
    venue: "Little Caesars Arena",
    hood: "Downtown",
    note: null,
    image: "https://images.unsplash.com/photo-1515703407324-5f753afd8be8?w=800&q=85",
    logo_url: "https://a.espncdn.com/i/teamlogos/nhl/500/det.png",
    images: [],
    ticket_url: "https://www.nhl.com/redwings/tickets",
    affiliate_ticket_url: null,
    website_url: "https://www.nhl.com/redwings",
  },
];

// ── Events ───────────────────────────────────────────────────────────────────
// Static array intentionally empty.
// All events are sourced live from Ticketmaster (fetchLiveEvents).
// Every displayed event must have a verified ticket_url — no placeholders.
export const DETROIT_EVENTS = [];

// ── Concerts ─────────────────────────────────────────────────────────────────
// Static array intentionally empty.
// All concerts are sourced live from Ticketmaster (fetchLiveConcerts).
// Every displayed concert must have a verified ticket_url — no placeholders.
export const CONCERTS = [];

// ── Hotels ───────────────────────────────────────────────────────────────────
// Curated Downtown / Midtown / Corktown Detroit hotels.
export const HOTELS = [
  {
    id: "hotel-10",
    name: "Hotel David Whitney",
    hood: "Grand Circus Park",
    addr: "1 Park Ave",
    desc: "A soaring 1915 Gothic skyscraper transformed into one of Detroit's most striking luxury hotels. Autograph Collection by Marriott — with a dramatic 17-story atrium lobby and refined rooms.",
    price_from: "From $199/night",
    features: ["Historic Landmark", "Autograph Collection", "Grand Circus Park"],
    image: "/hotels/whitney.jpg",
    images: [],
    booking_url: "https://www.booking.com/hotel/us/aloft-detroit-at-the-david-whitney.html",
    affiliate_booking_url: null,
    website_url: "https://www.marriott.com/en-us/hotels/dtwkd-hotel-david-whitney-autograph-collection/overview/",
  },
  {
    id: "hotel-9",
    name: "Element Detroit at the Metropolitan",
    hood: "Bricktown",
    addr: "33 John R St",
    desc: "An extended-stay gem inside the breathtaking 1925 Metropolitan Building — one of Detroit's finest examples of Gothic commercial architecture. Smartly designed suites with full kitchens.",
    price_from: "From $149/night",
    features: ["Historic Building", "Suite-Style Rooms", "Bricktown"],
    image: "/hotels/metropolitan.jpg",
    images: [],
    booking_url: "https://www.booking.com/hotel/us/element-detroit-at-the-metropolitan.html",
    affiliate_booking_url: null,
    website_url: "https://www.marriott.com/en-us/hotels/dtwel-element-detroit-at-the-metropolitan/overview/",
  },
  {
    id: "hotel-8",
    name: "AC Hotel Detroit at the Bonstelle",
    hood: "Brush Park",
    addr: "10 Eliot St",
    desc: "A sleek, design-forward hotel in Brush Park — steps from Little Caesars Arena and Comerica Park. Housed in the historic Bonstelle Theatre building with striking contemporary interiors.",
    price_from: "From $179/night",
    features: ["Brush Park", "Design Hotel", "LCA Adjacent"],
    image: "/hotels/bonstelle.jpg",
    images: [],
    booking_url: "https://www.booking.com/hotel/us/ac-detroit-at-bonstelle.html",
    affiliate_booking_url: null,
    website_url: "https://www.marriott.com/en-us/hotels/dtwac-ac-hotel-detroit-at-the-bonstelle/overview/",
  },
  {
    id: "hotel-1",
    name: "The Shinola Hotel",
    hood: "Downtown",
    addr: "1400 Woodward Ave",
    desc: "Detroit's premier luxury boutique hotel, built by the watchmaker that put the city back on the map. Hand-crafted interiors, curated retail, and a collection of acclaimed restaurants.",
    price_from: "From $279/night",
    features: ["Boutique Luxury", "Woodward Ave", "Award-Winning Dining"],
    image: "/hotels/shinola.jpg",
    images: [],
    booking_url: "https://www.booking.com/hotel/us/shinola.html",
    affiliate_booking_url: null,
    website_url: "https://www.shinolahotel.com",
  },
  {
    id: "hotel-4",
    name: "The Westin Book Cadillac",
    hood: "Downtown",
    addr: "1114 Washington Blvd",
    desc: "A 1924 masterpiece — once the tallest hotel in the world. Meticulously restored to its original grandeur, the Book Cadillac remains one of Detroit's most iconic and finest stays.",
    price_from: "From $199/night",
    features: ["Historic Landmark", "Full Service", "Luxury Spa"],
    image: "/hotels/book-cadillac.jpg",
    images: [],
    booking_url: "https://www.booking.com/hotel/us/westin-book-cadillac.html",
    affiliate_booking_url: null,
    website_url: "https://www.marriott.com/hotels/travel/dtwwi-the-westin-book-cadillac-detroit/",
  },
  {
    id: "hotel-2",
    name: "The Siren Hotel",
    hood: "Downtown",
    addr: "1509 Broadway St",
    desc: "A lovingly restored 1926 art deco gem in the heart of downtown Detroit. Home to Bar Chenin, Candy Bar, and Rebelle — one of the city's best restaurant collections under one historic roof.",
    price_from: "From $169/night",
    features: ["Art Deco", "Boutique", "Bar Chenin"],
    image: "/hotels/siren.jpg",
    images: [],
    booking_url: "https://www.booking.com/hotel/us/the-siren.html",
    affiliate_booking_url: null,
    website_url: "https://ash.world/hotels/the-siren",
  },
  {
    id: "hotel-3",
    name: "Detroit Foundation Hotel",
    hood: "Downtown",
    addr: "250 W Larned St",
    desc: "Housed in a restored 1929 fire department headquarters, the Foundation Hotel fuses industrial heritage with refined Detroit hospitality. Rooftop views and a bar worth staying in town for.",
    price_from: "From $189/night",
    features: ["Historic Building", "Rooftop Bar", "Riverwalk Adjacent"],
    image: "/hotels/foundation.jpg",
    images: [],
    booking_url: "https://www.booking.com/hotel/us/detroit-foundation.html",
    affiliate_booking_url: null,
    website_url: "https://detroitfoundationhotel.com/",
  },
  {
    id: "hotel-5",
    name: "Trumbull & Porter Hotel",
    hood: "Corktown",
    addr: "1331 Trumbull St",
    desc: "A converted motor lodge turned boutique gem in Detroit's hippest neighborhood. Local art, a rooftop deck with Belle Isle views, and Corktown's best bars just steps away.",
    price_from: "From $149/night",
    features: ["Corktown", "Boutique", "Rooftop Deck"],
    image: "/hotels/trumbull.jpg",
    images: [],
    booking_url: "https://www.booking.com/hotel/us/trumbull-amp-porter.html",
    affiliate_booking_url: null,
    website_url: "https://www.trumbullandporter.com/",
  },
];
