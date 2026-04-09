// ─────────────────────────────────────────────────────────────────────────────
// Exclusive Detroit — Events Data Layer
// All ticket / booking URLs are affiliate-ready.
// To activate affiliate links, populate the affiliate_* field for any item.
// The CTA helpers below will automatically prefer the affiliate URL.
// ─────────────────────────────────────────────────────────────────────────────
// TODO (Games): Replace static array with Ticketmaster Discovery API
//   GET https://app.ticketmaster.com/discovery/v2/events.json
//   ?classificationName=sports&city=Detroit&apikey=YOUR_KEY
//
// TODO (Events): Replace static array with Eventbrite API
//   GET https://www.eventbriteapi.com/v3/events/search/
//   ?location.address=Detroit,MI&token=YOUR_TOKEN
//
// TODO (Concerts): Replace static array with Ticketmaster Discovery API
//   ?classificationName=music&city=Detroit&apikey=YOUR_KEY
// ─────────────────────────────────────────────────────────────────────────────

// ── CTA helpers ─────────────────────────────────────────────────────────────
// Swap in affiliate URLs globally by populating the affiliate_* fields below.

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
// Detroit home games only — Pistons, Tigers, Red Wings, Lions
// Stubhub as default ticket source; affiliate_ticket_url left null for now.

export const GAMES = [
  {
    id: "game-tigers-1",
    sport: "MLB",
    team: "Detroit Tigers",
    teamShort: "Tigers",
    opponent: "Cleveland Guardians",
    home: true,
    date: "2026-04-10",
    time: "7:10 PM ET",
    venue: "Comerica Park",
    hood: "Downtown",
    note: "Friday Night Game",
    image: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=85",
    logo_url: "https://a.espncdn.com/i/teamlogos/mlb/500/det.png",
    images: [],
    ticket_url: "https://www.stubhub.com/detroit-tigers-tickets/performer/4881/",
    affiliate_ticket_url: null,
    website_url: "https://www.mlb.com/tigers",
  },
  {
    id: "game-tigers-2",
    sport: "MLB",
    team: "Detroit Tigers",
    teamShort: "Tigers",
    opponent: "Cleveland Guardians",
    home: true,
    date: "2026-04-11",
    time: "1:10 PM ET",
    venue: "Comerica Park",
    hood: "Downtown",
    note: "Saturday Matinee",
    image: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=85",
    logo_url: "https://a.espncdn.com/i/teamlogos/mlb/500/det.png",
    images: [],
    ticket_url: "https://www.stubhub.com/detroit-tigers-tickets/performer/4881/",
    affiliate_ticket_url: null,
    website_url: "https://www.mlb.com/tigers",
  },
  {
    id: "game-pistons-1",
    sport: "NBA",
    team: "Detroit Pistons",
    teamShort: "Pistons",
    opponent: "Indiana Pacers",
    home: true,
    date: "2026-04-11",
    time: "7:00 PM ET",
    venue: "Little Caesars Arena",
    hood: "Downtown",
    note: "Play-In Contention",
    image: "https://images.unsplash.com/photo-1546519638405-a9d1e19a8e54?w=800&q=85",
    logo_url: "https://a.espncdn.com/i/teamlogos/nba/500/det.png",
    images: [],
    ticket_url: "https://www.stubhub.com/detroit-pistons-tickets/performer/4856/",
    affiliate_ticket_url: null,
    website_url: "https://www.nba.com/pistons",
  },
  {
    id: "game-wings-1",
    sport: "NHL",
    team: "Detroit Red Wings",
    teamShort: "Red Wings",
    opponent: "Pittsburgh Penguins",
    home: true,
    date: "2026-04-12",
    time: "7:00 PM ET",
    venue: "Little Caesars Arena",
    hood: "Downtown",
    note: "Sunday Night Hockey",
    image: "https://images.unsplash.com/photo-1515703407324-5f753afd8be8?w=800&q=85",
    logo_url: "https://a.espncdn.com/i/teamlogos/nhl/500/det.png",
    images: [],
    ticket_url: "https://www.stubhub.com/detroit-red-wings-tickets/performer/4884/",
    affiliate_ticket_url: null,
    website_url: "https://www.nhl.com/redwings",
  },
  {
    id: "game-tigers-3",
    sport: "MLB",
    team: "Detroit Tigers",
    teamShort: "Tigers",
    opponent: "Chicago White Sox",
    home: true,
    date: "2026-04-14",
    time: "7:10 PM ET",
    venue: "Comerica Park",
    hood: "Downtown",
    note: null,
    image: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=85",
    logo_url: "https://a.espncdn.com/i/teamlogos/mlb/500/det.png",
    images: [],
    ticket_url: "https://www.stubhub.com/detroit-tigers-tickets/performer/4881/",
    affiliate_ticket_url: null,
    website_url: "https://www.mlb.com/tigers",
  },
  {
    id: "game-pistons-2",
    sport: "NBA",
    team: "Detroit Pistons",
    teamShort: "Pistons",
    opponent: "Cleveland Cavaliers",
    home: true,
    date: "2026-04-15",
    time: "7:30 PM ET",
    venue: "Little Caesars Arena",
    hood: "Downtown",
    note: null,
    image: "https://images.unsplash.com/photo-1546519638405-a9d1e19a8e54?w=800&q=85",
    logo_url: "https://a.espncdn.com/i/teamlogos/nba/500/det.png",
    images: [],
    ticket_url: "https://www.stubhub.com/detroit-pistons-tickets/performer/4856/",
    affiliate_ticket_url: null,
    website_url: "https://www.nba.com/pistons",
  },
  {
    id: "game-wings-2",
    sport: "NHL",
    team: "Detroit Red Wings",
    teamShort: "Red Wings",
    opponent: "Toronto Maple Leafs",
    home: true,
    date: "2026-04-16",
    time: "7:30 PM ET",
    venue: "Little Caesars Arena",
    hood: "Downtown",
    note: null,
    image: "https://images.unsplash.com/photo-1515703407324-5f753afd8be8?w=800&q=85",
    logo_url: "https://a.espncdn.com/i/teamlogos/nhl/500/det.png",
    images: [],
    ticket_url: "https://www.stubhub.com/detroit-red-wings-tickets/performer/4884/",
    affiliate_ticket_url: null,
    website_url: "https://www.nhl.com/redwings",
  },
  {
    id: "game-tigers-4",
    sport: "MLB",
    team: "Detroit Tigers",
    teamShort: "Tigers",
    opponent: "Kansas City Royals",
    home: true,
    date: "2026-04-17",
    time: "7:10 PM ET",
    venue: "Comerica Park",
    hood: "Downtown",
    note: "Friday Night Game",
    image: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=85",
    logo_url: "https://a.espncdn.com/i/teamlogos/mlb/500/det.png",
    images: [],
    ticket_url: "https://www.stubhub.com/detroit-tigers-tickets/performer/4881/",
    affiliate_ticket_url: null,
    website_url: "https://www.mlb.com/tigers",
  },
  {
    id: "game-tigers-5",
    sport: "MLB",
    team: "Detroit Tigers",
    teamShort: "Tigers",
    opponent: "Kansas City Royals",
    home: true,
    date: "2026-04-18",
    time: "1:10 PM ET",
    venue: "Comerica Park",
    hood: "Downtown",
    note: "Saturday Matinee",
    image: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=85",
    logo_url: "https://a.espncdn.com/i/teamlogos/mlb/500/det.png",
    images: [],
    ticket_url: "https://www.stubhub.com/detroit-tigers-tickets/performer/4881/",
    affiliate_ticket_url: null,
    website_url: "https://www.mlb.com/tigers",
  },
];

// ── Events ───────────────────────────────────────────────────────────────────
// TODO: Replace with live Eventbrite API. Current data is curated placeholder.

export const DETROIT_EVENTS = [
  {
    id: "event-1",
    type: "event",
    title: "Detroit Jazz Festival — Spring Preview",
    venue: "Detroit Institute of Arts",
    hood: "Midtown",
    date: "2026-04-11",
    time: "7:00 PM",
    category: "Jazz & Music",
    desc: "An intimate spring preview of Detroit's legendary jazz tradition inside the DIA's Rivera Court. Live performances from local and national artists inside one of the city's most stunning architectural spaces.",
    ticket_url: "https://www.eventbrite.com/d/mi--detroit/detroit-jazz/",
    affiliate_ticket_url: null,
    website_url: "https://www.detroitjazzfest.org",
  },
  {
    id: "event-2",
    type: "event",
    title: "Detroit Design & Culture Night",
    venue: "The Shinola Hotel",
    hood: "Downtown",
    date: "2026-04-14",
    time: "6:30 PM",
    category: "Art & Culture",
    desc: "A curated evening celebrating Detroit's creative renaissance. Designers, architects, and makers gather for drinks, conversation, and a live showcase of Detroit-made goods.",
    ticket_url: "https://www.eventbrite.com/d/mi--detroit/",
    affiliate_ticket_url: null,
    website_url: "https://www.theshinolahotel.com",
  },
  {
    id: "event-3",
    type: "event",
    title: "Hamilton — The Musical",
    venue: "Fox Theatre",
    hood: "Downtown",
    date: "2026-04-15",
    time: "8:00 PM",
    category: "Theatre",
    desc: "Lin-Manuel Miranda's Pulitzer Prize-winning musical at one of America's most beautiful theatres. A night of unforgettable music, storytelling, and spectacle in Detroit's crown jewel.",
    ticket_url: "https://www.stubhub.com/hamilton-detroit-tickets/",
    affiliate_ticket_url: null,
    website_url: "https://www.olympiaentertainment.com/fox-theatre",
  },
  {
    id: "event-4",
    type: "event",
    title: "Detroit Symphony Orchestra — Spring Gala",
    venue: "Orchestra Hall",
    hood: "Midtown",
    date: "2026-04-18",
    time: "8:00 PM",
    category: "Classical",
    desc: "An evening of world-class orchestral performance at one of the finest concert halls in the country. The DSO continues its landmark spring season with an all-Brahms program.",
    ticket_url: "https://www.stubhub.com/detroit-symphony-orchestra-tickets/",
    affiliate_ticket_url: null,
    website_url: "https://www.dso.org",
  },
  {
    id: "event-5",
    type: "event",
    title: "Eastern Market After Dark",
    venue: "Eastern Market",
    hood: "Eastern Market",
    date: "2026-04-25",
    time: "5:00 PM",
    category: "Food & Drink",
    desc: "Detroit's legendary Eastern Market transforms into a vibrant evening experience. Local vendors, craft cocktails, live DJs, and Detroit's best street food across the historic sheds.",
    ticket_url: null,
    affiliate_ticket_url: null,
    website_url: "https://www.easternmarket.org",
  },
  {
    id: "event-6",
    type: "event",
    title: "Movement Electronic Music Festival",
    venue: "Hart Plaza",
    hood: "Downtown",
    date: "2026-05-23",
    time: "12:00 PM",
    category: "Music Festival",
    desc: "The world's premier electronic music festival returns to Hart Plaza on the Detroit Riverfront. Three days of techno, house, and electronic music across multiple stages — the festival that started it all.",
    ticket_url: "https://www.stubhub.com/movement-music-festival-tickets/",
    affiliate_ticket_url: null,
    website_url: "https://movement.us",
  },
];

// ── Concerts ─────────────────────────────────────────────────────────────────
// TODO: Replace with live Ticketmaster Discovery API. Current data is curated.

export const CONCERTS = [
  {
    id: "concert-1",
    type: "concert",
    artist: "Jack White",
    venue: "Fox Theatre",
    hood: "Downtown",
    date: "2026-04-17",
    time: "8:00 PM",
    category: "Rock",
    desc: "Detroit's own Jack White returns home for a landmark solo show at the iconic Fox Theatre. Blues-infused rock, White Stripes classics, and a concert experience unlike any other.",
    ticket_url: "https://www.stubhub.com/jack-white-tickets/",
    affiliate_ticket_url: null,
    website_url: "https://www.jackwhiteiii.com",
  },
  {
    id: "concert-2",
    type: "concert",
    artist: "Big Sean",
    venue: "Little Caesars Arena",
    hood: "Downtown",
    date: "2026-04-22",
    time: "8:00 PM",
    category: "Hip-Hop",
    desc: "Detroit-raised rapper Big Sean brings his World Tour home to Little Caesars Arena. A full homecoming production from one of the city's most celebrated artists.",
    ticket_url: "https://www.stubhub.com/big-sean-tickets/",
    affiliate_ticket_url: null,
    website_url: null,
  },
  {
    id: "concert-3",
    type: "concert",
    artist: "The War on Drugs",
    venue: "The Masonic Temple",
    hood: "Midtown",
    date: "2026-04-24",
    time: "9:00 PM",
    category: "Indie Rock",
    desc: "Philadelphia rock legends at Detroit's magnificent Masonic Temple — one of the finest concert venues in the country. An immersive night of layered, cinematic rock.",
    ticket_url: "https://www.stubhub.com/the-war-on-drugs-tickets/",
    affiliate_ticket_url: null,
    website_url: null,
  },
  {
    id: "concert-4",
    type: "concert",
    artist: "Khruangbin",
    venue: "Aretha Franklin Amphitheatre",
    hood: "Downtown",
    date: "2026-05-01",
    time: "8:30 PM",
    category: "Soul / World",
    desc: "Houston's psychedelic soul trio performs alongside the Detroit Riverwalk. Hypnotic bass lines, reverb-soaked guitar, and cinematic grooves under the open sky.",
    ticket_url: "https://www.stubhub.com/khruangbin-tickets/",
    affiliate_ticket_url: null,
    website_url: null,
  },
  {
    id: "concert-5",
    type: "concert",
    artist: "SZA",
    venue: "Little Caesars Arena",
    hood: "Downtown",
    date: "2026-05-08",
    time: "7:30 PM",
    category: "R&B",
    desc: "Following her record-breaking SOS Tour, SZA returns for a second Detroit stop due to overwhelming demand. An unforgettable night of R&B, alt-soul, and Grammy-winning performance.",
    ticket_url: "https://www.stubhub.com/sza-tickets/",
    affiliate_ticket_url: null,
    website_url: null,
  },
  {
    id: "concert-6",
    type: "concert",
    artist: "Lana Del Rey",
    venue: "Pine Knob Music Theatre",
    hood: "Metro Detroit",
    date: "2026-06-12",
    time: "8:00 PM",
    category: "Dream Pop",
    desc: "Lana Del Rey performs under the stars at the legendary Pine Knob Music Theatre — Michigan's premier outdoor amphitheatre. A cinematic summer evening of torch songs and melancholy glamour.",
    ticket_url: "https://www.stubhub.com/lana-del-rey-tickets/",
    affiliate_ticket_url: null,
    website_url: null,
  },
];

// ── Hotels ───────────────────────────────────────────────────────────────────
// Curated Downtown / Midtown / Corktown Detroit hotels.
// affiliate_booking_url: null — swap Booking.com affiliate links in here later.

export const HOTELS = [
  {
    id: "hotel-1",
    name: "The Shinola Hotel",
    hood: "Downtown",
    addr: "1400 Woodward Ave",
    desc: "Detroit's premier luxury boutique hotel, built by the watchmaker that put the city back on the map. Hand-crafted interiors, curated retail, and a collection of acclaimed restaurants.",
    price_from: "From $279/night",
    features: ["Boutique Luxury", "Woodward Ave", "Award-Winning Dining"],
    // Warm craft-luxury aesthetic: leather, warm wood, artisan lighting — mirrors Shinola's signature interiors
    image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=85",
    images: [],
    booking_url: "https://www.theshinolahotel.com/rooms",
    affiliate_booking_url: null,
    website_url: "https://www.theshinolahotel.com",
  },
  {
    id: "hotel-2",
    name: "The Siren Hotel",
    hood: "Downtown",
    addr: "1509 Broadway St",
    desc: "A lovingly restored 1926 art deco gem in the heart of downtown Detroit. Home to Bar Chenin, Candy Bar, and Rebelle — one of the city's best restaurant collections under one historic roof.",
    price_from: "From $169/night",
    features: ["Art Deco", "Boutique", "Bar Chenin"],
    // Moody art-deco lobby with rich tones — reflects the 1926 Wurlitzer Building aesthetic
    image: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=85",
    images: [],
    booking_url: "https://www.thesirenhotel.com/rooms",
    affiliate_booking_url: null,
    website_url: "https://www.thesirenhotel.com",
  },
  {
    id: "hotel-3",
    name: "Detroit Foundation Hotel",
    hood: "Downtown",
    addr: "250 W Larned St",
    desc: "Housed in a restored 1929 fire department headquarters, the Foundation Hotel fuses industrial heritage with refined Detroit hospitality. Rooftop views and a bar worth staying in town for.",
    price_from: "From $189/night",
    features: ["Historic Building", "Rooftop Bar", "Riverwalk Adjacent"],
    // Exposed brick, high ceilings, refined industrial — matches the converted fire station character
    image: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=85",
    images: [],
    booking_url: "https://www.foundationhotel.com/detroit/rooms",
    affiliate_booking_url: null,
    website_url: "https://www.foundationhotel.com/detroit",
  },
  {
    id: "hotel-4",
    name: "The Westin Book Cadillac",
    hood: "Downtown",
    addr: "1114 Washington Blvd",
    desc: "A 1924 masterpiece — once the tallest hotel in the world. Meticulously restored to its original grandeur, the Book Cadillac remains one of Detroit's most iconic and finest stays.",
    price_from: "From $199/night",
    features: ["Historic Landmark", "Full Service", "Luxury Spa"],
    // Grand historic hotel lobby with ornate chandeliers — matches the Book Cadillac's restored 1924 grandeur
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=85",
    images: [],
    booking_url: "https://www.marriott.com/hotels/travel/dtwwi-the-westin-book-cadillac-detroit/",
    affiliate_booking_url: null,
    website_url: "https://www.marriott.com/hotels/travel/dtwwi-the-westin-book-cadillac-detroit/",
  },
  {
    id: "hotel-5",
    name: "Arlo Detroit",
    hood: "Downtown",
    addr: "2 Washington Blvd",
    desc: "A modern lifestyle hotel at the center of downtown's new energy. Rooftop pool, design-forward rooms, and a social lobby that feels like the best version of the city living inside it.",
    price_from: "From $159/night",
    features: ["Rooftop Pool", "Modern Design", "Prime Location"],
    // Rooftop infinity pool with city views — directly represents Arlo's signature rooftop experience
    image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=85",
    images: [],
    booking_url: "https://www.arlohotels.com/detroit/",
    affiliate_booking_url: null,
    website_url: "https://www.arlohotels.com/detroit/",
  },
  {
    id: "hotel-6",
    name: "Marriott at the Renaissance Center",
    hood: "Downtown",
    addr: "400 Renaissance Center",
    desc: "Perched inside Detroit's iconic Renaissance Center with sweeping views of the Detroit River and Windsor skyline. Steps from the Riverwalk — the city's most scenic wake-up call.",
    price_from: "From $149/night",
    features: ["Riverfront Views", "Full Service", "Renaissance Center"],
    // Modern hotel room with expansive river/city view — captures the RenCen's signature vantage point
    image: "https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?w=800&q=85",
    images: [],
    booking_url: "https://www.marriott.com/hotels/travel/dtwdt-detroit-marriott-at-the-renaissance-center/",
    affiliate_booking_url: null,
    website_url: "https://www.marriott.com/hotels/travel/dtwdt-detroit-marriott-at-the-renaissance-center/",
  },
  {
    id: "hotel-7",
    name: "The Cambria Detroit",
    hood: "Downtown",
    addr: "600 W Lafayette Blvd",
    desc: "Art-forward interiors, a rooftop bar with skyline views, and a prime location between Corktown and the heart of downtown. Detroit's most stylish mid-range stay.",
    price_from: "From $139/night",
    features: ["Rooftop Bar", "Art-Forward", "Corktown Adjacent"],
    // Lively rooftop terrace bar with skyline backdrop — the defining feature of the Cambria experience
    image: "https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=800&q=85",
    images: [],
    booking_url: "https://www.choicehotels.com/michigan/detroit/cambria-hotels/mi517",
    affiliate_booking_url: null,
    website_url: "https://www.choicehotels.com/michigan/detroit/cambria-hotels/mi517",
  },
];
