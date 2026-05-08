// Fixed Unsplash photo sets by venue category — no runtime API dependency
// All photo IDs are stable Unsplash CDN URLs that do not rotate or expire

const U = (id) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=480&q=82`;

const SETS = {
  cocktailBar: [
    U("1514362545857-3bc16c4c7d1b"),
    U("1551024709-8f23befc548b"),
    U("1559329007-40df8a9345d8"),
    U("1572116469696-31de0f17cc34"),
  ],
  speakeasy: [
    U("1470337458703-4ad1721b7548"),
    U("1514362545857-3bc16c4c7d1b"),
    U("1551024709-8f23befc548b"),
    U("1497515114629-f71d768fd85c"),
  ],
  rooftop: [
    U("1449824913935-59a10b8d2000"),
    U("1506905925346-21bda4d32df4"),
    U("1477959858617-67f85cf4f1df"),
    U("1531512073830-ba6a00b00695"),
  ],
  nightclub: [
    U("1470229538611-c400be14a34a"),
    U("1500530855697-b586d89ba3ee"),
    U("1540039155733-5bb30b8131f5"),
    U("1508700115892-45ecd05ae2ad"),
  ],
  liveMusic: [
    U("1501854140801-50d01698950b"),
    U("1470229538611-c400be14a34a"),
    U("1508700115892-45ecd05ae2ad"),
    U("1540039155733-5bb30b8131f5"),
  ],
  fineDining: [
    U("1414235077428-338989a2e8c0"),
    U("1504674900247-0877df9cc836"),
    U("1559339352-11d035aa65de"),
    U("1424847651672-bf20a4b0982b"),
  ],
  casualDining: [
    U("1546069901-ba9599a7e63c"),
    U("1565299624946-b28f40a0ae38"),
    U("1567620905732-2d1ec7ab7445"),
    U("1555396273-367ea4eb4db5"),
  ],
  coffee: [
    U("1495474472287-4d71bcdd2085"),
    U("1509042239860-f550ce710b93"),
    U("1447933601652-9df4b4f7c1d3"),
    U("1442512595331-e3e8b0b1b9a6"),
  ],
  sportsBar: [
    U("1555396273-367ea4eb4db5"),
    U("1546873994-08d37701d030"),
    U("1571896349842-33c89424de2d"),
    U("1541532713588-10927dd6e18c"),
  ],
  outdoors: [
    U("1449824913935-59a10b8d2000"),
    U("1455849318743-b2233052fcff"),
    U("1506905925346-21bda4d32df4"),
    U("1477959858617-67f85cf4f1df"),
  ],
};

// Maps venue.cat to a photo set
export const CATEGORY_GALLERY = {
  "Cocktail Lounges":           SETS.cocktailBar,
  "Hidden Bars":                SETS.speakeasy,
  "Alley Spots":                SETS.speakeasy,
  "Rooftops":                   SETS.rooftop,
  "Nightlife":                  SETS.nightclub,
  "Live Music":                 SETS.liveMusic,
  "Jazz & Blues":               SETS.liveMusic,
  "Sports Bars":                SETS.sportsBar,
  "Dinner":                     SETS.fineDining,
  "Lunch":                      SETS.casualDining,
  "Breakfast":                  SETS.coffee,
  "Happy Hour":                 SETS.cocktailBar,
  "Coffee Shops & Bakeries":    SETS.coffee,
  "Fine Dining":                SETS.fineDining,
  "Pan-Asian Restaurant":       SETS.fineDining,
  "Outdoor Activities":         SETS.outdoors,
  "Immersive Entertainment":    SETS.nightclub,
  "Hotels":                     SETS.fineDining,
  "Luxury Hotel":               SETS.fineDining,
};
