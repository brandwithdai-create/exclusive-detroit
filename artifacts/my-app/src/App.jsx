import React, { useState, useEffect, useCallback, useRef } from "react";
import L from "leaflet";
import ThingsToDo from "./sections/ThingsToDo.jsx";
import Stay from "./sections/Stay.jsx";
// fetchPlacePhotos intentionally NOT imported here — venue cards use static images only
import { GAMES, DETROIT_EVENTS, CONCERTS, HOTELS, fmtDate, getTicketCTA, getBookingCTA } from "./data/eventsData.js";

const FONT_URL = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap";

const C = {
black:"var(--c-black)", deep:"var(--c-deep)", card:"var(--c-card)", border:"var(--c-border)", borderS:"var(--c-borders)",
gold:"var(--c-gold)", goldL:"var(--c-goldL)", goldD:"var(--c-goldD)",
smoke:"var(--c-smoke)", ash:"var(--c-ash)", bone:"var(--c-bone)", white:"var(--c-white)", purple:"var(--c-purple)",
};

const BD = {
hidden:    { bg:"var(--bd-hidden-bg)",  color:"var(--bd-hidden-txt)",  border:"var(--bd-hidden-bdr)",  label:"Hidden Gem" },
locals:    { bg:"var(--bd-locals-bg)",  color:"var(--bd-locals-txt)",  border:"var(--bd-locals-bdr)",  label:"Locals Know" },
firsttimer:{ bg:"var(--bd-first-bg)",   color:"var(--bd-first-txt)",   border:"var(--bd-first-bdr)",   label:"First-Timer" },
recentopen:{ bg:"var(--bd-recent-bg)",  color:"var(--bd-recent-txt)",  border:"var(--bd-recent-bdr)",  label:"Recently Opened" },
justopened:{ bg:"var(--bd-just-bg)",    color:"var(--bd-just-txt)",    border:"var(--bd-just-bdr)",    label:"Just Opened" },
comingsoon:{ bg:"var(--bd-soon-bg)",    color:"var(--bd-soon-txt)",    border:"var(--bd-soon-bdr)",    label:"Coming Soon" },
};

const CUTOFF = new Date("2025-12-05");
const TODAY  = new Date();
function calcStatus(d) {
if (!d) return "comingsoon";
const dt = new Date(d);
if (dt > TODAY) return "comingsoon";
if (dt >= CUTOFF) return "justopened";
return "open";
}

function getCTA(v) {
if (v.reservationUrl) return { label:"Book Now", url:v.reservationUrl };
if (v.ticketUrl)      return { label:"Get Tickets", url:v.ticketUrl };
if (v.websiteUrl)     return { label:"Visit Website", url:v.websiteUrl };
return null;
}

const CATS = ["all","Breakfast","Coffee Shops & Bakeries","Lunch","Dinner","Happy Hour","Sports","Hidden Bars","Speakeasies","Cocktail Lounges","Rooftops","Hotel Lounges","Alley Spots","Nightlife","Comedy / Live Events","Date Night","Outdoor Activities","Midtown","Downtown","Corktown"];

const COORDS={"1":[42.3339,-83.0497],"2":[42.3316,-83.0499],"3":[42.3322,-83.0524],"4":[42.3328,-83.0452],"5":[42.3330,-83.0489],"6":[42.3283,-83.0469],"7":[42.3675,-83.0636],"8":[42.3353,-83.0489],"9":[42.3337,-83.0466],"10":[42.3437,-83.0558],"11":[42.3291,-83.0621],"12":[42.3322,-83.0524],"13":[42.3274,-83.0714],"14":[42.3337,-83.0466],"15":[42.3330,-83.0489],"16":[42.3332,-83.0489],"17":[42.3322,-83.0524],"18":[42.3361,-83.0490],"19":[42.3340,-83.0473],"20":[42.3617,-83.0648],"21":[42.3534,-83.0886],"22":[42.3498,-83.0583],"23":[42.3609,-83.0624],"24":[42.3540,-83.0571],"25":[42.3326,-83.0490],"26":[42.3398,-82.9820],"27":[42.3473,-83.0401],"28":[42.3475,-83.0397],"29":[42.3567,-83.0654],"30":[42.3501,-83.0611],"31":[42.3289,-83.0631],"32":[42.3291,-83.0618],"33":[42.3290,-83.0593],"34":[42.3338,-83.0496],"35":[42.3315,-83.0490],"36":[42.3313,-83.0500],"37":[42.3576,-83.0912],"38":[42.3567,-83.0654],"39":[42.3322,-83.0524],"40":[42.3322,-83.0524],"41":[42.3322,-83.0524],"42":[42.3346,-83.0490],"43":[42.3316,-83.0497],"44":[42.3540,-83.0571],"45":[42.3690,-83.0636],"46":[42.3333,-83.0494],"47":[42.3333,-83.0502],"48":[42.3355,-83.0487],"49":[42.3339,-83.0497],"50":[42.3328,-83.0490],"51":[42.3280,-83.0487],"52":[42.3289,-83.0662],"53":[42.3310,-83.0490],"54":[42.3310,-83.0490],"55":[42.3562,-83.0654],"56":[42.3338,-83.0497],"57":[42.3307,-83.0471],"58":[42.3338,-83.0496],"59":[42.3315,-83.0490],"60":[42.3313,-83.0500],"61":[42.3576,-83.0912],"62":[42.3567,-83.0654],"63":[42.3330,-83.0489],"64":[42.3341,-83.0460],"65":[42.3523,-83.0501],"66":[42.3523,-83.0501],"67":[42.3314,-83.0449],"68":[42.3333,-83.0494],"r1":[42.3340,-83.0470],"r2":[42.3660,-82.9960],"r3":[42.3470,-83.0370],"r4":[42.3291,-83.0621],"r5":[42.3606,-83.0647],"u1":[42.3307,-83.0471],"u2":[42.3319,-83.0475],"u3":[42.3348,-83.0490],"u4":[42.3819,-82.9574],"69":[42.3540,-83.0661],"70":[42.3283,-83.0495],"71":[42.3590,-83.0863],"72":[42.3358,-83.0495],"73":[42.3340,-83.0485],"74":[42.3350,-83.0680],"75":[42.3335,-83.0502],"76":[42.3353,-83.0489],"77":[42.3578,-83.0679],"78":[42.3566,-83.0657],"79":[42.3522,-83.0656],"80":[42.3333,-83.0502],"81":[42.3337,-83.0464],"82":[42.3390,-83.0180],"83":[42.3313,-83.0535],"84":[42.3291,-83.0430],"85":[42.3291,-83.0432],"86":[42.3305,-83.0513],"87":[42.3338,-83.0462]};

function haversine(lat1,lon1,lat2,lon2){const R=3958.8,d2r=Math.PI/180;const dLat=(lat2-lat1)*d2r,dLon=(lon2-lon1)*d2r;const a=Math.sin(dLat/2)**2+Math.cos(lat1*d2r)*Math.cos(lat2*d2r)*Math.sin(dLon/2)**2;return R*2*Math.asin(Math.sqrt(a));}

const VENUES = [
{ id:1,  name:"Bad Luck Bar",                    hood:"Downtown",           cat:"Hidden Bars",
desc:"An experiential cocktail bar tucked in a downtown alley. No signage, walk-ins only, timed seatings. One of the most singular bar experiences in the country.",
vibes:["No Signage","Timed Seatings","Immersive"], addr:"1218 Griswold St, Detroit, MI 48226",
hours:"Mon-Sat 5pm-1am | Sun Closed | Walk-ins only", best:"Weeknight / Weekend",
exclusive:"No sign. No reservation. Walk in, get seated on a timer. The menu is whatever the bartender decides.",
badges:["hidden","locals"], websiteUrl:"https://www.badluckbar.com" },

{ id:2,  name:"The Shelby",                       hood:"Downtown",           cat:"Speakeasies",
desc:"A James Beard-nominated subterranean cocktail bar inside a restored 1925 bank vault. Blue door, down a staircase, and the cocktails are worth every step.",
vibes:["Bank Vault","James Beard Nominated","Craft Cocktails"], addr:"607 Shelby St, Detroit, MI 48226 (blue door, downstairs)",
hours:"Wed-Thu 5pm-12am | Fri-Sat 5pm-1am | Sun-Tue Closed", best:"Date Night / Weeknight",
exclusive:"2022 James Beard semifinalist. NYT 36 Hours in Detroit. Hidden behind a blue door inside a century-old bank vault.",
badges:["hidden","locals"], reservationUrl:"https://www.opentable.com/r/shelby-detroit" },

{ id:3,  name:"Hidden at Parlay Detroit",         hood:"Downtown",           cat:"Speakeasies",
desc:"A speakeasy in the lower level of Parlay Detroit sports bar. Curated cocktails, elevated bites, and a sultry atmosphere that has nothing to do with the sports bar above.",
vibes:["Speakeasy","Craft Cocktails","Underground"], addr:"1260 Washington Blvd, Detroit, MI 48226",
hours:"Sun-Thu 11am-12am | Fri-Sat 11am-2am (speakeasy hours vary)", best:"Weekend",
exclusive:"You have to know to go downstairs. The gap between what's above and what's below is the whole experience.",
badges:["hidden","locals"], websiteUrl:"https://www.parlaydetroit.com" },

{ id:4,  name:"Standby",                          hood:"Downtown",           cat:"Cocktail Lounges",
desc:"A nationally acclaimed subterranean cocktail bar on Gratiot Ave. Two-time James Beard semifinalist for Outstanding Bar Program. Seasonal menus, technically brilliant cocktails.",
vibes:["Craft Cocktails","Candlelit","Seasonal Menu"], addr:"225 Gratiot Ave, Detroit, MI 48226",
hours:"Wed-Thu 5pm-12am | Fri-Sat 5pm-2am | Sun 5pm-12am | Mon-Tue Closed", best:"Weeknight / Date Night",
exclusive:"Two James Beard nominations. A 2025 Tales of the Cocktail Outstanding award. Below street level, below the radar.",
badges:["firsttimer","locals"], reservationUrl:"https://www.opentable.com/r/standby-detroit" },

{ id:5,  name:"The Skip",                         hood:"Downtown",           cat:"Cocktail Lounges",
desc:"An open-air tropical cocktail bar hiding inside The Belt alley from the team that built Standby. Frozen drinks, craft brews, island vibes in a completely hidden outdoor space.",
vibes:["Open Air","Tropical","Frozen Cocktails"], addr:"1234 Library St (The Belt Alley), Detroit, MI 48226",
hours:"Fri-Sat 4pm-2am | Sun 4pm-12am | Mon-Thu Closed", best:"Weekend / Summer",
exclusive:"No street presence. You either know it's there or you walk right past it.",
badges:["hidden","locals"], websiteUrl:"https://www.theskipdetroit.com" },

{ id:6,  name:"The Apparatus Room",               hood:"Downtown",           cat:"Cocktail Lounges",
desc:"The restaurant and bar inside Detroit Foundation Hotel, a meticulous restoration of the 1929 Detroit Fire Department headquarters. Soaring ceilings, exposed brick, New American small plates.",
vibes:["Historic Firehouse","Industrial Chic","New American"], addr:"250 W Larned St, Detroit, MI 48226",
hours:"Mon-Thu 7am-10:45pm | Fri-Sat 7am-11:45pm | Sun 7am-9:45pm", best:"Weeknight / Weekend",
exclusive:"Drinking inside the former Detroit Fire HQ. The original apparatus bays are still visible.",
badges:["firsttimer"], reservationUrl:"https://www.opentable.com/r/the-apparatus-room-detroit" },

{ id:7,  name:"Time Will Tell",                   hood:"New Center",         cat:"Cocktail Lounges",
desc:"A neighborhood cocktail bar on Woodward Ave in Milwaukee Junction from the founder of Sugar House, Detroit's original craft cocktail destination. Whimsical, inventive cocktails in an intimate space.",
vibes:["Neighborhood Bar","Inventive Drinks","Jukebox"], addr:"6408 Woodward Ave, Detroit, MI 48202",
hours:"Sun-Wed 6pm-12am | Thu-Sat 6pm-2am", best:"Weeknight / Date Night",
exclusive:"From the founder of Sugar House. Smaller, warmer, more personal. The kind of bar you make a regular stop.",
badges:["locals","hidden"], websiteUrl:"https://www.timewilltelldet.com" },

{ id:8,  name:"The Living Room - Shinola Hotel",  hood:"Downtown",           cat:"Hotel Lounges",
desc:"A curated Tuesday evening experience inside Detroit's most design-forward boutique hotel. Part gallery opening, part cocktail hour. Tuesdays only, 6-9pm.",
vibes:["Tuesdays Only","Design Forward","Creative Crowd"], addr:"1400 Woodward Ave, Detroit, MI 48226",
hours:"Tuesdays only 6pm-9pm | Hotel lobby open 24/7", best:"Tuesday Evening",
exclusive:"One night a week, the most design-obsessed hotel in Detroit opens its living room.",
badges:["firsttimer","locals"], websiteUrl:"https://www.shinolahotel.com" },

{ id:9,  name:"The Monarch Club",                 hood:"Downtown",           cat:"Hotel Lounges",
desc:"A rooftop cocktail lounge at the penthouse of the beautifully restored Metropolitan Building. Mid-century inspired, fire pit terraces, craft cocktails, and a view of Detroit that rewrites the narrative.",
vibes:["Rooftop Penthouse","City Views","Fire Pits"], addr:"33 John R St, Penthouse, Detroit, MI 48226",
hours:"Mon-Thu 5pm-11pm | Fri 5pm-12am | Sat 4pm-12am | Sun 2pm-8pm", best:"Weeknight / Weekend",
exclusive:"Penthouse of the Metropolitan Building. Two outdoor fire pit terraces. One of the most dramatic views in the city.",
badges:["firsttimer"], reservationUrl:"https://www.opentable.com/r/the-monarch-club-detroit" },

{ id:10, name:"The Conservatory - AC Hotel",      hood:"Midtown / Brush Park",cat:"Hotel Lounges",
desc:"A glass-enclosed bar connecting the AC Hotel Detroit to the restored Bonstelle Theatre. Spanish Modernisme design, gin-forward cocktails, Spanish tapas, and architecture unlike anything else in Detroit.",
vibes:["Glass Conservatory","Spanish Tapas","Gin Cocktails"], addr:"10 Eliot St (corner Woodward and Eliot), Detroit, MI 48201",
hours:"Daily 3pm-11pm (verify before visiting)", best:"Pre-Show / Weeknight",
exclusive:"A glass conservatory connecting a modern hotel to a 115-year-old theatre. Gin cocktails, Spanish tapas, and architecture no other hotel bar here can match.",
badges:["firsttimer"], reservationUrl:"https://www.opentable.com/r/the-conservatory-detroit" },

{ id:11, name:"I|O Rooftop - The Godfrey",        hood:"Corktown",           cat:"Rooftops",
desc:"Detroit's largest indoor/outdoor rooftop lounge at the Godfrey Hotel. Retractable glass walls and ceiling, panoramic skyline views, and a craft cocktail program that matches the altitude.",
vibes:["Retractable Roof","Skyline Views","Craft Cocktails"], addr:"1401 Michigan Ave (7th Floor), Detroit, MI 48216",
hours:"Mon-Tue 5pm-12am | Wed 3pm-9pm | Thu 5pm-12am | Fri-Sat 5pm-2am | Sun 5pm-10pm", best:"Weekend / Sunset",
exclusive:"Detroit's most expansive rooftop. The glass ceiling retracts. The skyline from Corktown is rawer, more honest.",
badges:["firsttimer"], reservationUrl:"https://www.exploretock.com/godfrey-detroit" },

{ id:12, name:"Kamper's Rooftop Lounge",           hood:"Downtown",           cat:"Rooftops",
desc:"A Spanish-inspired tapas and cocktail lounge on the 14th floor of the beautifully restored Book Tower. Basque pintxos, gin and tonics, negronis, sangria, and panoramic views of downtown Detroit.",
vibes:["14th Floor","Book Tower","Spanish Tapas"], addr:"1265 Washington Blvd (14th Floor), Detroit, MI 48226",
hours:"Tue-Thu 5pm-11pm | Fri 5pm-12am | Sat 3pm-12am | Sun 3pm-10pm | Mon Closed", best:"Date Night / Weekend",
exclusive:"Inside one of Detroit's most beautifully restored historic towers. The Basque tapas and Spanish cocktail program feel completely out of place in the best possible way.",
image:"https://images.unsplash.com/photo-1587899897387-091ebd01a6b2?auto=format&fit=crop&w=800&q=75",
badges:["firsttimer","locals"], reservationUrl:"https://resy.com/cities/detroit-mi/venues/kampers" },

{ id:13, name:"Johnny Noodle King Rooftop",        hood:"Corktown",           cat:"Rooftops",
desc:"The hidden rooftop deck above Detroit's beloved ramen institution. Cocktails, sake, and sweeping views of Corktown, Michigan Central Station, and the Ambassador Bridge.",
vibes:["Hidden Rooftop","Corktown Views","MCS Views"], addr:"2601 W Fort St, Detroit, MI 48216",
hours:"Mon-Wed 11am-10pm | Thu-Sat 11am-11pm | Sun 12pm-10pm", best:"Evening / Sunset",
exclusive:"Most diners eat ramen downstairs and never make it up. One of the best views in Corktown and almost nobody knows it's there.",
badges:["hidden","locals"], websiteUrl:"https://www.johnnynoodleking.com" },

{ id:14, name:"Monarch Club Rooftop Terraces",     hood:"Downtown",           cat:"Rooftops",
desc:"Two private outdoor fire pit terraces at the top of the Metropolitan Building. East Court and West Court seat up to 28 each. Detroit's most intimate rooftop experience.",
vibes:["Fire Pit Terraces","Intimate","Skyline"], addr:"33 John R St, Penthouse, Detroit, MI 48226",
hours:"Mon-Thu 5pm-11pm | Fri 5pm-12am | Sat 4pm-12am | Sun 2pm-8pm", best:"Weeknight / Sunset",
exclusive:"Two private fire pit terraces overlooking the entire city. The quieter, more refined side of Detroit rooftop culture.",
image:"https://images.unsplash.com/photo-1510798831971-3eb53ba1e07c?auto=format&fit=crop&w=800&q=75",
badges:["hidden","locals"], reservationUrl:"https://www.opentable.com/r/the-monarch-club-detroit" },

{ id:67, name:"Tin Roof Detroit",                 hood:"Downtown",           cat:"Rooftops",
desc:"A lively rooftop bar and live music venue steps from Campus Martius. Outdoor terrace with sweeping views of Woodward Ave, craft cocktails, cold beer on draft, and live performances most nights.",
vibes:["Live Music","Rooftop Terrace","Craft Cocktails"], addr:"47 E Adams Ave, Detroit, MI 48226",
hours:"Mon-Fri 4pm-2am | Sat-Sun 12pm-2am", best:"Evening / Live Music Nights",
exclusive:"Detroit's most social rooftop — the energy here on a weekend night is unlike anywhere else in the city. Combine with a walk through Campus Martius.",
badges:["firsttimer"], websiteUrl:"https://tinroofbar.com/detroit" },

{ id:15, name:"The Belt",                          hood:"Downtown",           cat:"Alley Spots",
desc:"A once-overlooked downtown alley transformed into a curated open-air gallery lined with murals from international and local artists. Multiple bars spill into the space.",
vibes:["Street Art","Open Air","Gallery Alley"], addr:"Library St between Griswold and Shelby, Detroit, MI 48226",
hours:"Always open | Individual venues vary", best:"Weekend / Any Visit",
exclusive:"At night with the murals lit and bars spilling into the alley, it is the most alive block in Detroit.",
cats:["Alley Spots","Outdoor Activities"],badges:["firsttimer","hidden"], websiteUrl:"https://www.thebelt.org" },

{ id:16, name:"Deluxx Fluxx",                      hood:"Downtown",           cat:"Alley Spots",
desc:"A neon-drenched art bar and nightclub inside The Belt designed by Brooklyn artists FAILE. Custom pinball machines, blacklight room, packed dance floor, cocktails on tap.",
vibes:["Neon Art","Arcade","DJ Nights"], addr:"1274 Library St (The Belt), Detroit, MI 48226",
hours:"Thu 9pm-2am | Fri-Sat 8pm-2am | Sun-Wed Closed", best:"Weekend / Late Night",
exclusive:"Every inch of this place is a handmade art piece you can dance inside. There is nothing else like it in America.",
cats:["Alley Spots","Nightlife"],badges:["firsttimer","locals"], websiteUrl:"https://www.deluxxfluxx.com" },

{ id:17, name:"Parlay Detroit",                    hood:"Downtown",           cat:"Sports",
desc:"An 11,000-square-foot elevated sports bar within walking distance of Ford Field, Comerica Park, and Little Caesars Arena. Part-owned by former Detroit Lion Joique Bell. Cigar lounge, VIP areas, speakeasy on the lower level.",
vibes:["Elevated Sports Bar","VIP Seating","Cigar Lounge"], addr:"1260 Washington Blvd, Detroit, MI 48226",
hours:"Sun-Thu 11am-12am | Fri-Sat 11am-2am", best:"Game Day / Any Day",
exclusive:"Part-owned by a Detroit Lion, walking distance from every major Detroit stadium. 11,000 sq ft, a cigar lounge, VIP areas, and a speakeasy downstairs.",
badges:["locals"], websiteUrl:"https://www.parlaydetroit.com" },

{ id:18, name:"Gilly's Clubhouse",                 hood:"Downtown",           cat:"Sports",
desc:"A tribute sports bar on Woodward Ave honoring Nick 'Gilly' Gilbert. Two floors, the largest TV in downtown Detroit (120 sq ft), arcade games, a rooftop terrace, local Detroit art, and a menu that goes well beyond bar food.",
vibes:["120 sq ft TV Wall","Rooftop Terrace","Local Detroit Art"], addr:"1550 Woodward Ave, Detroit, MI 48226",
hours:"Mon 11am-12am | Tue-Thu 4pm-12am | Fri-Sat 11am-1am | Sun 11am-12am", best:"Game Day / Evenings",
exclusive:"Named after Nick Gilbert. The largest TV in downtown Detroit, a rooftop, Detroit memorabilia on every wall. A tribute to a city, not just a sports bar.",
badges:["firsttimer"], reservationUrl:"https://www.opentable.com/r/gillys-clubhouse-and-rooftop-detroit" },

{ id:19, name:"Post Bar",                          hood:"Downtown",           cat:"Sports",
desc:"Detroit's no-nonsense downtown sports bar anchor on Broadway, open every day from 11am to 2am. Consistent game-day energy in the heart of the city.",
vibes:["Open Daily","Game Day Anchor","Downtown"], addr:"1325 Broadway St, Detroit, MI 48226",
hours:"Mon-Sun 11am-2am", best:"Game Day / Any Day",
exclusive:"Open every day from 11am to 2am. On game nights this is where the energy is real.",
badges:["locals"], websiteUrl:"https://www.postbardetroit.com" },

{ id:20, name:"TV Lounge",                         hood:"Midtown",            cat:"Nightlife",
desc:"A no-frills Midtown dive institution with a legendary jukebox and unpretentious energy that keeps locals coming back at closing time.",
vibes:["Dive Bar","Jukebox","Late Night"], addr:"2548 Grand River Ave, Detroit, MI 48201",
hours:"Daily 11am-4am", best:"Late Night / After Hours",
exclusive:"No bottle service, no velvet rope. Just Detroit in a room with a great jukebox.",
badges:["locals"], websiteUrl:"https://www.tvloungedetroit.com" },

{ id:21, name:"Marble Bar",                        hood:"Midtown",            cat:"Nightlife",
desc:"Detroit's cornerstone underground music venue. Deeply serious about sound - house, techno, jazz, hip-hop. The crowd comes to listen.",
vibes:["Live Music","Electronic","Sound-First"], addr:"1501 Holden St, Detroit, MI 48208",
hours:"Mon, Wed-Thu 8pm-2am | Fri-Sat 8pm-3am | Check listings", best:"Weekend / Late Night",
exclusive:"Detroit invented electronic music. Marble Bar is where the city still practices it.",
badges:["locals","hidden"], websiteUrl:"https://www.themarblebar.com" },

{ id:22, name:"The Spotlighter Theatre",           hood:"Midtown",            cat:"Comedy / Live Events",
desc:"An intimate black-box comedy and performance space in Midtown. Local and touring comedians, improv nights, and late-night variety shows in 150 seats.",
vibes:["Comedy","Black Box","150 Seats"], addr:"415 Ledyard St, Detroit, MI 48201",
hours:"Show nights vary - check spotlighterdetroit.com", best:"Weeknight / Date Night",
exclusive:"150 seats. Nobody is far from anything. Detroit comedy at its most raw.",
badges:["locals","hidden"], websiteUrl:"https://www.spotlighterdetroit.com" },

{ id:23, name:"The Majestic Theatre",              hood:"Midtown",            cat:"Comedy / Live Events",
desc:"A 100-year-old theatre complex anchoring Midtown nightlife. Live music, comedy, and cultural events across three interconnected venues.",
vibes:["Historic Theatre","Live Music","Multi-Venue"], addr:"4140 Woodward Ave, Detroit, MI 48201",
hours:"Varies by show - majesticdetroit.com/events", best:"Weekend / Weeknight",
exclusive:"A century of Detroit culture under one roof. Show up for an unknown opener on a Tuesday.",
badges:["firsttimer"], websiteUrl:"https://www.majesticdetroit.com", ticketUrl:"https://www.majesticdetroit.com/events" },

{ id:24, name:"Chartreuse Kitchen & Cocktails",    hood:"Midtown",            cat:"Date Night",
desc:"A James Beard-nominated farm-to-table restaurant inside the Park Shelton building, steps from the DIA. Seasonal small plates, botanical cocktails, and an intimate room with a well-earned reputation.",
vibes:["James Beard Nominated","Small Plates","Seasonal"], addr:"15 E Kirby St (entrance on Woodward), Detroit, MI 48202",
hours:"Tue-Thu 5pm-9pm | Fri 11:30am-2pm and 5pm-9:30pm | Sat 5pm-9:30pm | Sun 4pm-8pm | Mon Closed", best:"Date Night / Weeknight",
exclusive:"James Beard semifinalist inside the Park Shelton. The entrance makes you feel like you found something. Make a reservation.",
cats:["Date Night","Dinner"],badges:["firsttimer","locals"], reservationUrl:"https://www.opentable.com/r/chartreuse-kitchen-and-cocktails-detroit" },

{ id:25, name:"Parc Detroit",                      hood:"Downtown",           cat:"Date Night",
desc:"A French-inspired bistro overlooking Campus Martius Park. Expansive wine list, wood-fired grill flavors, and floor-to-ceiling windows that open completely in warm weather.",
vibes:["French-Inspired","Campus Martius","Wine Forward"], addr:"800 Woodward Ave, Detroit, MI 48226",
hours:"Mon-Fri Lunch 11am-2:30pm, Dinner 4pm-9:30pm | Sat Brunch 10:30am, Dinner 4:30pm-10:30pm | Sun Brunch 10:30am, Dinner 4:30pm-8:30pm", best:"Date Night / Weekend Brunch",
exclusive:"Campus Martius Park at your feet. Windows that open onto the city. The wine list takes it seriously.",
cats:["Date Night","Dinner"],badges:["firsttimer"], reservationUrl:"https://www.opentable.com/r/parc-detroit" },

{ id:34, name:"Prime + Proper",                   hood:"Downtown",           cat:"Date Night",
desc:"A modern cathedral of American steakhouse dining inside the restored Capitol Park Loft building, built in 1912. All beef is butchered in-house, aged a minimum of 28 days, and cooked over open flame. One of the most design-forward, nationally recognized steakhouses in the Midwest.",
vibes:["USDA Prime","In-House Butcher","Capitol Park","Live Fire"],
addr:"1145 Griswold St, Detroit, MI 48226",
hours:"Sun-Thu 4pm-10pm | Fri-Sat 4pm-11pm",
best:"Date Night / Special Occasion",
exclusive:"Soaring ceilings, marble floors, glass-walled dry-age rooms, and a custom butcher counter visible from every table. One of the most exacting steak restaurants in America.",
cats:["Date Night","Dinner"],badges:["firsttimer"],
reservationUrl:"https://www.opentable.com/r/prime-and-proper-detroit" },

{ id:35, name:"BESA",                             hood:"Downtown",           cat:"Date Night",
desc:"Modern European dining inspired by the Adriatic coast inside the historic Vinton Building on Woodward Ave. Bold flavors built around fresh seafood, handmade pasta, wood-fired lamb, and one of the strongest wine programs in Detroit.",
vibes:["Adriatic Coast","Raw Bar","Wine Forward","Vinton Building"],
addr:"600 Woodward Ave, Detroit, MI 48226",
hours:"Mon-Thu 4pm-10pm | Fri-Sat 4pm-11pm | Sun Closed",
best:"Date Night / Special Occasion",
exclusive:"One of the most serious wine programs in Detroit, inside a beautifully restored historic building on Woodward. The private loft overlooking the dining room is worth requesting for a group.",
cats:["Date Night","Dinner"],badges:["firsttimer"],
reservationUrl:"https://www.opentable.com/r/besa-detroit" },

{ id:36, name:"Ostrea",                           hood:"Downtown",           cat:"Date Night",
desc:"A seafood-forward restaurant in the Financial District from the team behind the legendary London Chop House. Daily rotating oysters from East and West Coast waters, caviar service, hamachi crudo, lobster, and a menu that changes with what's freshest. Champagne-bar energy at street level.",
vibes:["Daily Oysters","Caviar Service","Financial District","London Chop House Team"],
addr:"536 Shelby St, Detroit, MI 48226",
hours:"Mon-Sat 3pm-11pm (kitchen 4pm-10pm) | Sun Closed",
best:"Date Night / Pre-Show",
exclusive:"Fresh oysters delivered every single day. Caviar service. The team behind the most storied steakhouse in Detroit history. Old-school glamour without the formality.",
cats:["Date Night","Dinner"],badges:["firsttimer","locals"],
reservationUrl:"https://www.opentable.com/r/ostrea-detroit" },

{ id:37, name:"Barda",                            hood:"Core City",          cat:"Date Night",
desc:"Detroit's only Argentine-inspired neo-steakhouse in Core City, from Buenos Aires-born chef Javier Bardauil. Every dish is cooked solely on a wood-burning grill and baking hearth. James Beard semifinalist. One of the most distinctive dining experiences in the city.",
vibes:["Live Fire","Argentine","Wood-Burning Grill","Core City"],
addr:"4842 Grand River Ave, Detroit, MI 48208",
hours:"Wed-Thu 5pm-9pm | Fri-Sat 5pm-10pm | Sun-Tue Closed",
best:"Date Night / Special Occasion",
exclusive:"James Beard semifinalist. A wood-burning grill is the only cooking method in the kitchen. Outdoor bonfire seating in a park setting. There is truly nothing else like Barda in Detroit.",
cats:["Date Night","Dinner"],badges:["firsttimer","locals"],
reservationUrl:"https://www.opentable.com/r/barda-detroit" },

{ id:38, name:"Selden Standard",                  hood:"Midtown",            cat:"Date Night",
desc:"A two-time James Beard semifinalist for Outstanding Restaurant. Wood-fired small plates built around what Michigan farms are producing right now. One of the most consistently excellent dining rooms in the city – and a perennial favorite for date nights.",
vibes:["Wood-Fired","James Beard","Small Plates","Seasonal"],
addr:"3921 2nd Ave, Detroit, MI 48201",
hours:"Daily 5pm-10pm",
best:"Date Night / Weekend",
exclusive:"Two-time James Beard Outstanding Restaurant semifinalist. Nationally acclaimed and consistently booked out. The chef's counter is the best seat – reserve well in advance.",
cats:["Date Night","Dinner"],badges:["firsttimer","locals"],
reservationUrl:"https://www.opentable.com/r/selden-standard-detroit" },

{ id:39, name:"Hiroki-San",                        hood:"Downtown",           cat:"Date Night",
desc:"An immersive Japanese dining experience in the lower level of the historic Book Tower. Robatayaki wood-fired skewers, Japanese Wagyu, fresh seafood, and a sake program that rewards deep dives. Built inside a former bank vault with original plaster walls and shoji screens.",
vibes:["Japanese Wagyu","Robatayaki","Book Tower","Tokyo Imports"],
addr:"1265 Washington Blvd (Lower Level, Book Tower), Detroit, MI 48226",
hours:"Tue-Thu 5pm-10pm | Fri 4pm-11pm | Sat 4pm-11pm | Sun 4pm-9pm | Mon Closed",
best:"Date Night / Special Occasion",
exclusive:"Built inside a former bank vault beneath one of Detroit's most historic towers. The shoji-lined private dining room is one of the most intimate dining settings in the city. Reservations are essential.",
cats:["Date Night","Dinner"],badges:["firsttimer","locals"],
reservationUrl:"https://resy.com/cities/detroit-mi/venues/hiroki-san" },

{ id:40, name:"Le Supreme",                        hood:"Downtown",           cat:"Date Night",
desc:"A Parisian-inspired brasserie occupying 6,200 square feet inside the restored Book Tower – the first restaurant to open in the $300 million renovation. Art nouveau tiles, a zinc bar top, oxblood leather booths, and a menu of French classics: seafood towers, steak au poivre, moules frites, and an in-house boulangerie.",
vibes:["French Brasserie","Book Tower","Seafood Tower","All-Day Dining"],
addr:"1265 Washington Blvd (Book Tower), Detroit, MI 48226",
hours:"Mon-Thu 4pm-10pm | Fri 4pm-11pm | Sat 10am-2:30pm and 4pm-11pm | Sun 10am-2:30pm and 4pm-9pm",
best:"Date Night / Weekend Brunch",
exclusive:"The first restaurant to open in Book Tower's $300 million restoration. 210 seats, a 24-seat private dining room with a fireplace, and enough French elegance to make you forget you're in Michigan.",
cats:["Date Night","Dinner"],badges:["firsttimer"],
reservationUrl:"https://resy.com/cities/detroit-mi/venues/le-supreme" },

{ id:41, name:"The Aladdin Sane",                  hood:"Downtown",           cat:"Hidden Bars",
desc:"A bespoke cocktail lounge hidden in the sublevel of the historic Book Tower – 8 seats at the bar, 29 in the lounge, accessed by stepping behind a curtain at the base of the stairs. Named after the David Bowie album and built around the philosophy of Japanese bartending. The most extensive Japanese whisky list in Detroit, including rarities unavailable anywhere else in Michigan.",
vibes:["Japanese Whisky","32 Seats","Book Tower Sublevel","David Bowie"],
addr:"1265 Washington Blvd (Sublevel, Book Tower), Detroit, MI 48226",
hours:"Tue-Thu 5pm-11pm | Fri-Sat 5pm-12am | Sun-Mon Closed",
best:"Date Night / Late Night",
exclusive:"Step behind a curtain at the base of the stairs. 32 seats total. One of the most serious Japanese whisky lists in Michigan. Omakase cocktail experiences available. There is truly nothing else in Detroit that feels like this.",
badges:["hidden","locals"],
reservationUrl:"https://resy.com/cities/detroit-mi/venues/the-aladdin-sane" },

{ id:26, name:"Belle Isle",                        hood:"Detroit River",      cat:"Outdoor Activities",
desc:"A 982-acre island state park in the Detroit River, minutes from downtown. Oldest aquarium in the US, Albert Kahn conservatory, half-mile beach, miles of trails, and the best sunset views in the city.",
vibes:["Sunset Views","Island State Park","Free to Walk"], addr:"MacArthur Bridge at Jefferson Ave and East Grand Blvd, Detroit, MI 48207",
hours:"Daily 5am-10pm | Vehicles need Recreation Passport | Walk, bike, or bus: free", best:"Sunset / Weekend",
exclusive:"A 982-acre island in the middle of the Detroit River, two minutes from downtown. The sunset from the south shore looking back at the skyline is one of the best views in the Midwest.",
badges:["firsttimer","hidden"], websiteUrl:"https://www.belleisleconservancy.org/plan-your-visit" },

{ id:27, name:"Eastern Market Saturday",           hood:"Eastern Market",     cat:"Outdoor Activities",
desc:"One of the oldest and largest public markets in the US. Saturday morning at Eastern Market is a Detroit institution - flower vendors, local produce, street food, galleries, live music.",
vibes:["Farmers Market","Flowers","Saturday Ritual"], addr:"2934 Russell St, Detroit, MI 48207",
hours:"Saturday 6am-4pm year-round", best:"Saturday Morning",
exclusive:"Every Detroit local has a Saturday Eastern Market routine. Going once tells you more about this city than anything else on this list.",
badges:["firsttimer"], websiteUrl:"https://easternmarket.org" },

{ id:28, name:"Dequindre Cut Greenway",            hood:"Eastern Market",     cat:"Outdoor Activities",
desc:"A 2-mile below-grade rail trail connecting Eastern Market to the Detroit Riverfront, flanked by rotating murals. The most atmospheric walk in the city.",
vibes:["Rail Trail","Murals","Riverfront Connection"], addr:"Entrance: Gratiot Ave near Russell St, Detroit, MI 48207",
hours:"Dawn to dusk, year-round", best:"Weekend / Daytime",
exclusive:"A sunken park that most visitors walk right over. The murals change seasonally and the crowd is pure local Detroit.",
badges:["firsttimer","hidden"], websiteUrl:"https://www.detroitriverfront.org/plan-your-visit/parks-greenways/dequindre-cut" },


{ id:30, name:"The Peterboro",                    hood:"Midtown",            cat:"Cocktail Lounges",
desc:"A Cass Corridor cocktail bar and kitchen with contemporary Chinese-American cuisine. Strong cocktail program and a back bar that transforms after 10pm.",
vibes:["Chinese-American","Craft Cocktails","Late Night"], addr:"420 Peterboro St, Detroit, MI 48201",
hours:"Wed-Thu 5pm-9pm | Fri 5pm-11pm | Sat 12pm-11pm | Sun 4:30pm-9pm | Mon-Tue Closed", best:"Weekend / Date Night",
exclusive:"Most people eat dinner and leave. The people who stay for the back bar after 10pm know something most visitors don't.",
badges:["firsttimer","locals"], reservationUrl:"https://www.exploretock.com/the-peterboro-detroit" },

{ id:31, name:"Batch Brewing Company",            hood:"Corktown",           cat:"Corktown",
desc:"Detroit's first nano-brewery and Corktown's communal anchor. Small-batch craft beer brewed on-site, rotating food, live music on stage.",
vibes:["Craft Beer","Live Music","Communal Taproom"], addr:"1400 Porter St, Detroit, MI 48216",
hours:"Mon-Thu 4pm-11pm | Fri-Sat 12pm-12am | Sun 12pm-8pm", best:"Weekend / Anytime",
exclusive:"Detroit's first nano-brewery, still in Corktown, still running the best communal table in the neighborhood.",
cats:["Corktown","Cocktail Lounges"],badges:["firsttimer","locals"], websiteUrl:"https://www.batchbrewingcompany.com" },

{ id:32, name:"Ottava Via",                       hood:"Corktown",           cat:"Corktown",
desc:"A lively modern Italian restaurant on Michigan Ave. Wood-fired pizzas, fresh pastas, outdoor fireplace, and bocce ball lanes on the patio.",
vibes:["Italian","Wood-Fired Pizza","Bocce Ball"], addr:"1400 Michigan Ave, Detroit, MI 48216",
hours:"Sun-Thu 11am-10pm | Fri-Sat 11am-11pm", best:"Date Night / Weekend",
exclusive:"Outdoor fireplace, bocce ball, wood-fired pizza. In summer this patio is one of the best tables in the city.",
cats:["Corktown","Dinner"],badges:["locals"], reservationUrl:"https://resy.com/cities/detroit-mi/venues/ottava-via" },

{ id:33, name:"Lager House",                      hood:"Corktown",           cat:"Corktown",
desc:"A beloved live music dive bar in the heart of Corktown. Original rock, punk, blues, and metal most nights. The bar top is inlaid with signed guitar picks.",
vibes:["Live Music","Dive Bar","Rock and Punk"], addr:"1254 Michigan Ave, Detroit, MI 48216",
hours:"Mon-Thu 1pm-12am | Fri 1pm-2am | Sat 9am-2am | Sun 9am-12am", best:"Weekend / Late Night",
exclusive:"The bar top is inlaid with signed guitar picks from every act that has played here. No cover most nights.",
cats:["Corktown","Cocktail Lounges"],badges:["locals"], ticketUrl:"https://thelagerhouse.com/events", websiteUrl:"https://thelagerhouse.com" },

/* ── BREAKFAST ── */
{ id:42, name:"Hudson Cafe",                       hood:"Downtown",           cat:"Breakfast",
desc:"Detroit's quintessential downtown breakfast and brunch destination, born in 2011 on Woodward Ave just across from the former Hudson's department store site. Massive portions, inventive omelettes, red velvet pancakes, and Monte Cristo French toast. Seven days a week, 8am to 3pm.",
vibes:["Breakfast Staple","Generous Portions","Full Bar","Brunch Cocktails"],
addr:"1241 Woodward Ave, Detroit, MI 48226",
hours:"Mon-Sun 8am-3pm",
best:"Breakfast / Weekend Brunch",
exclusive:"This is where locals go when they want a guaranteed great brunch. Come early or expect a wait — worth it every time. Portions are massive, so come hungry or plan to share.",
badges:["firsttimer","locals"],
reservationUrl:"https://www.opentable.com/r/the-hudson-cafe-detroit" },

{ id:43, name:"Dime Store",                        hood:"Downtown",           cat:"Breakfast",
desc:"A scratch-made, chef-driven brunch bar inside the historic Chrysler House in Downtown Detroit, open since 2014. Named Best Breakfast and Best Brunch in Detroit by Hour Detroit and Metro Times multiple years running. Walk-ins only.",
vibes:["Scratch-Made","Chef-Driven","Walk-Ins Only","Full Bar"],
addr:"719 Griswold St Suite 180 (inside Chrysler House), Detroit, MI 48226",
hours:"Thu-Tue 8am-3pm | Wed Closed | Walk-ins only",
best:"Breakfast / Weekday Brunch",
exclusive:"Nationally recognized and locally beloved since 2014. No reservations – walk-ins only. Come early or expect a wait, and it's worth it.",
badges:["firsttimer","locals"],
websiteUrl:"https://www.eatdimestore.com/detroit/" },

{ id:44, name:"Babo",                              hood:"Midtown",            cat:"Breakfast",
desc:"A gourmet all-day diner in the Park Shelton building in Midtown, named after owner Kris Lelcaj's father ('babo' means dad in Albanian). Creative artisanal takes on comfort food classics – creme brulee French toast, Korean beef cheesesteak, shakshuka – in a bright, lively space with a patio on Woodward.",
vibes:["Gourmet Diner","All-Day","Patio","Korean-Albanian Fusion"],
addr:"15 E Kirby St Suite 115 (Park Shelton), Detroit, MI 48202",
hours:"Mon-Sat 9am-5pm | Sun 9am-3pm",
best:"Breakfast / Weekend Brunch",
exclusive:"Every plate looks like it was designed to be photographed and tastes even better than it looks. The creme brulee French toast is the undisputed champion. OpenTable reservations available.",
badges:["firsttimer","locals"],
reservationUrl:"https://www.opentable.com/r/babo-detroit" },

{ id:45, name:"Joe Louis Southern Kitchen",        hood:"New Center",         cat:"Breakfast",
desc:"A tribute restaurant honoring Detroit boxing legend Joe Louis, serving Southern-style comfort food with an all-day breakfast focus on Woodward Ave in New Center. Signature dishes named after the champ's life: The Weigh In skillet, The Heavyweight omelet, Banana Foster French Toast, BBQ Cajun Smoked Turkey Leg, Mama Lillie's Flapjacks. A second downtown location opened April 2026.",
vibes:["Southern Comfort","Joe Louis Tribute","All-Day Breakfast","New Center"],
addr:"6549 Woodward Ave, Detroit, MI 48202 (New Center) | 1528 Woodward Ave (Downtown, opened April 2026)",
hours:"Mon-Tue 9am-3pm | Wed-Sun 8am-4pm (New Center) | Downtown: Daily 7am-3pm+",
best:"Breakfast / Weekend",
exclusive:"Co-led by Joe Louis Barrow II, son of the boxing legend. The Banana Foster French Toast has a cult following. Arrive early on weekends.",
badges:["firsttimer","locals"],
websiteUrl:"https://joelouissouthernkitchen.com" },

/* ── COFFEE SHOPS & BAKERIES ── */
{ id:46, name:"SPKRBOX",                           hood:"Downtown",           cat:"Coffee Shops & Bakeries",
desc:"A coffee shop by day and Detroit Techno club by night, open every single day from 9am to 2am. Mid-century modern architecture in Capitol Park, two floors with full bars, live DJs nightly on vinyl turntables, and a serious specialty coffee program. The most distinctive coffee shop in Detroit.",
vibes:["Coffee + Techno","9am-2am Daily","Two Floors","Live DJs"],
addr:"200 Grand River Ave, Detroit, MI 48226",
hours:"Daily 9am-2am",
best:"Morning Coffee / Late Night",
exclusive:"A coffee shop that stays open until 2am with a DJ every night. Come for the cortado at 10am, come back for the dance floor at midnight. No other place in Detroit operates like this.",
badges:["locals","hidden"],
websiteUrl:"https://spkrbox.bar" },

{ id:68, name:"Orange Room",                       hood:"Downtown",           cat:"Hidden Bars",
desc:"A tucked-away late-night room beneath SPKRBOX with a darker, more intimate energy. Low lighting, resident DJs spinning underground Detroit sounds, and a crowd that feels like you're in on something most people walking past on Grand River never find out about.",
vibes:["Underground Detroit","Intimate","Late Night DJs"],
addr:"200 Grand River Ave (beneath SPKRBOX), Detroit, MI 48226",
hours:"Daily late night – access through SPKRBOX",
best:"Late Night / After Hours",
exclusive:"You don't stumble into the Orange Room. You find it through SPKRBOX. It's a second layer most people miss — a basement with a pulse and a crowd that got the word.",
badges:["hidden","locals"], websiteUrl:"https://spkrbox.bar" },

{ id:47, name:"Cannelle",                          hood:"Downtown",           cat:"Coffee Shops & Bakeries",
desc:"A French patisserie in Capitol Park from a Paris-trained pastry chef. Handcrafted croissants, chocolate eclairs, tarts, macarons, and espresso drinks. One of the most beautiful pastry cases in the city.",
vibes:["French Patisserie","Handcrafted","Croissants","Capitol Park"],
addr:"45 W Grand River Ave, Detroit, MI 48226",
hours:"Mon-Thu 6:30am-8pm | Fri 6:30am-10pm | Sat 7:30am-10pm | Sun 8am-6pm",
best:"Morning / Afternoon",
exclusive:"Paris-trained technique applied to one of Detroit's finest pastry programs. The chocolate eclairs are exceptional. Detroit has earned a world-class patisserie.",
badges:["firsttimer"],
websiteUrl:"https://www.mkcannelle.com/cannelle-detroit" },

{ id:48, name:"Madcap Coffee",                     hood:"Downtown",           cat:"Coffee Shops & Bakeries",
desc:"A Michigan third-wave specialty coffee roaster in Parker's Alley, tucked behind the Shinola Hotel. Minimalist white-brick interior, single-origin pour overs, expertly pulled espresso, and pastries from local bakeries. The most technically precise coffee experience in Downtown Detroit.",
vibes:["Third-Wave","Single Origin","Parker's Alley","Michigan Roaster"],
addr:"1413 Farmer St (Parker's Alley, behind Shinola Hotel), Detroit, MI 48226",
hours:"Mon-Sun 8am-4pm",
best:"Morning / Afternoon",
exclusive:"Michigan roaster that has been setting the standard for specialty coffee since 2008. The cortado is the test. They pass it every time. Parking validation available.",
badges:["firsttimer","locals"],
websiteUrl:"https://www.madcapcoffee.com/pages/parkers-alley-detroit" },

{ id:49, name:"Dessert Oasis Coffee Roasters",     hood:"Downtown",           cat:"Coffee Shops & Bakeries",
desc:"A Capitol Park Historic District cornerstone since 2015 – a third-wave coffee shop that roasts all its own beans locally, bakes croissants, cookies, muffins, and signature cheesecakes in-house, and hosts open mic nights every Monday from 7-9pm. Open from 6am, staying open until 10pm on weekends.",
vibes:["Local Roaster","In-House Bakery","Open Mic Mondays","Capitol Park"],
addr:"1220 Griswold St, Detroit, MI 48226",
hours:"Mon-Thu 6am-9pm | Fri 6am-10pm | Sat 7am-10pm | Sun 9am-8pm",
best:"Morning / Afternoon / Evening",
exclusive:"Every bean roasted locally. Open mic night every Monday. Cookie butter cheesecake. Open from 6am. The most community-rooted coffee shop in downtown Detroit.",
badges:["locals","firsttimer"],
websiteUrl:"https://docr.coffee/pages/detroit-cafe" },

{ id:50, name:"Avalon International Breads",       hood:"Downtown",           cat:"Coffee Shops & Bakeries",
desc:"Detroit's most beloved artisan bakery on Woodward Ave, an institution since 1997. 100% organic flour, sourdough baked in a 10,000-pound steam-injected oven, challah, scones, sandwiches, and the city's most iconic sea salt chocolate chunk cookies – all alongside a coffee bar. Locally owned, triple-bottom-line committed.",
vibes:["Artisan Bread","100% Organic","Detroit Institution","Sea Salt Cookies"],
addr:"1049 Woodward Ave, Detroit, MI 48226",
hours:"Daily 8am-3pm",
best:"Morning / Anytime",
exclusive:"An institution since 1997. The sea salt chocolate chunk cookies are something close to sacred in this city. Every ingredient is organic. Everything is baked from scratch, every day.",
badges:["firsttimer","locals"],
websiteUrl:"https://www.avalonbakeryandcafe.com" },

/* ── HAPPY HOUR ── */
{ id:51, name:"London Chop House",                 hood:"Downtown",           cat:"Happy Hour",
desc:"Detroit's most storied steakhouse, originally opened in 1938, revived as a jazz-fueled institution in 2012. Happy hour at the bar from 4-6pm Monday through Saturday with discounted cocktails and bar bites. Live jazz nightly, wagyu beef, caviar service, and a cigar lounge downstairs.",
vibes:["Happy Hour 4-6pm","Live Jazz","Historic Steakhouse","Bar Only"],
addr:"155 W Congress St, Detroit, MI 48226",
hours:"Mon-Sat 4pm-10pm | Sun Closed | Happy Hour: Mon-Sat 4pm-6pm at the bar",
best:"Happy Hour / Date Night",
exclusive:"Detroit's original power dining room, open since 1938. Happy hour is bar-seating only – get there early. The French onion soup during happy hour may be the best value in the city.",
badges:["firsttimer"],
reservationUrl:"https://www.opentable.com/r/london-chop-house-detroit" },

{ id:52, name:"Ima Izakaya",                       hood:"Corktown",           cat:"Happy Hour",
desc:"The flagship Ima Izakaya in Corktown, a 2023 James Beard nominee with a 14-seat bar, 10 taps, 30 Japanese whiskies, a robata grill, raw bar, handmade dumplings, and the most celebrated happy hour in Detroit. Every Monday through Friday from 3-6pm, the entire food and drink menu is $5.",
vibes:["$5 Happy Hour 3-6pm","Robata Grill","Raw Bar","James Beard Nominated"],
addr:"2100 Michigan Ave, Detroit, MI 48216",
hours:"Mon-Thu 11am-10pm | Fri 11am-11pm | Sat 12pm-11pm | Sun 12pm-10pm | Happy Hour: Mon-Fri 3pm-6pm",
best:"Happy Hour / Dinner",
exclusive:"Flat-rate happy hour pricing on the full food and drink menu, Monday through Friday 3-6pm (verify current pricing). James Beard nominated. One of the best restaurants in the city running one of the most generous happy hours in the city.",
badges:["firsttimer","locals"],
reservationUrl:"https://www.exploretock.com/imaizakaya" },

{ id:53, name:"Experience Zuzu",                   hood:"Downtown",           cat:"Happy Hour",
desc:"A two-story Asian fusion restaurant and social lounge on Woodward Ave adjacent to the Guardian Building. Happy Hour Monday through Friday from 4-6pm with discounted cocktails and small plates. Bold sushi, wok-fired dishes, omakase towers, and a rooftop-adjacent outdoor bar. One of Downtown Detroit's most visually striking dining rooms.",
vibes:["Happy Hour 4-6pm","Asian Fusion","Two-Story","Guardian Building"],
addr:"511 Woodward Ave Suite 100, Detroit, MI 48226",
hours:"Mon-Wed 4pm-11pm | Thu-Sun 4pm-1am | Happy Hour: Mon-Fri 4pm-6pm",
best:"Happy Hour / Date Night / Late Night",
exclusive:"The most visually immersive dining room in Downtown Detroit. Happy hour is 4-6pm daily with the full cocktail and small plates program. Stay for the full dinner and you will understand why this place is always full.",
badges:["firsttimer"],
reservationUrl:"https://www.opentable.com/r/experience-zuzu-detroit" },


/* ── LUNCH ── */
{ id:55, name:"Ima",                               hood:"Midtown",            cat:"Lunch",
desc:"Detroit's award-winning Japanese noodle restaurant at Wayne State University, open for lunch daily from 11am. Udon, ramen, pho, rice bowls, housemade dumplings, ahi tuna, and a full bar with sake. Detroit Free Press Restaurant of the Year 2019. $5 happy hour Mon-Fri 3-6pm.",
vibes:["Ramen + Udon","Open 11am Daily","Veggie-Forward","Wayne State"],
addr:"4870 Cass Ave, Detroit, MI 48201 (Midtown / Wayne State campus)",
hours:"Mon-Thu 11am-10pm | Fri-Sat 11am-11pm | Sun 12pm-10pm | Happy Hour Mon-Fri 3pm-6pm",
best:"Lunch / Dinner / Happy Hour",
exclusive:"Detroit Free Press Restaurant of the Year. $5 happy hour for everything on the menu. The best noodle bowl in Detroit, open for lunch every day.",
badges:["firsttimer","locals"],
websiteUrl:"https://imanoodles.com" },

{ id:56, name:"Eatori Market",                     hood:"Downtown",           cat:"Lunch",
desc:"A Mediterranean restaurant and specialty market in Capitol Park serving prepared foods and casual bites daily from 9am alongside wines, craft beers, and cocktails. Happy hour 3-6pm Tuesday through Friday. Outdoor patio with Capitol Park views in warm months.",
vibes:["Mediterranean","Capitol Park","Market + Restaurant","Patio"],
addr:"1215 Griswold St, Detroit, MI 48226",
hours:"Market: Sun-Thu 10am-10pm | Fri-Sat 10am-11pm | Restaurant: Tue-Thu 3pm-10pm | Fri 3pm-11pm | Sat-Sun brunch 11am-3:30pm",
best:"Lunch / Afternoon / Happy Hour",
exclusive:"Half specialty grocery market, half restaurant with one of the best patios in Capitol Park. A downtown sleeper that locals know well.",
badges:["locals"],
reservationUrl:"https://www.opentable.com/r/eatori-market-detroit" },

{ id:57, name:"Frita Batidos",                     hood:"Downtown",           cat:"Lunch",
desc:"A Cuban-inspired fast-casual restaurant steps from Little Caesars Arena. Award-winning fritas (Cuban chorizo burgers with shoestring fries), batidos (tropical milkshakes with optional rum), and creative sandwiches. Best Burger Michigan Daily consecutively since 2014.",
vibes:["Cuban Street Food","Chorizo Frita","Tropical Batidos","Near LCA"],
addr:"66 W Columbia St, Detroit, MI 48226",
hours:"Tue-Thu 11am-10pm | Fri-Sat 11am-11pm | Sun 11am-10pm | Mon Closed",
best:"Lunch / Casual Dinner",
exclusive:"Multiple-year award winner for best burger and best Cuban in Detroit. The chorizo frita with a tropical batido is a Detroit rite of passage.",
badges:["firsttimer","locals"],
websiteUrl:"https://fritabatidos.com/detroit/" },

{ id:63, name:"Vicente's Cuban Cuisine",           hood:"Downtown",           cat:"Lunch",
desc:"A Detroit downtown institution since 2005, giving the city an authentic taste of Cuba on Library Street. Cubano sandwiches, paella, ropa vieja, empanadas, mojitos, sangria, and live Latin jazz Wednesday through Thursday. Salsa dancing Fridays and Saturdays.",
vibes:["Cuban","Live Salsa Dancing","Library Street","Since 2005"],
addr:"1250 Library St, Detroit, MI 48226",
hours:"Mon-Thu 11am-10pm | Fri-Sat 11am-2am | Sun 12pm-9pm",
best:"Lunch / Dinner / Live Music Nights",
exclusive:"Two decades of Cuban soul in the heart of downtown Detroit. The paella is made for sharing. Live salsa dancing on Fridays and Saturdays draws a crowd that stays until 2am.",
badges:["firsttimer","locals"],
reservationUrl:"https://book.toasttab.com/restaurants/vicentes-cuban-cuisine-1250-library-st" },

{ id:64, name:"Fixins Soul Kitchen",               hood:"Downtown",           cat:"Lunch",
desc:"A 8,400-square-foot soul food destination on Randolph Street in historic Harmonie Park, opened by NBA All-Star and former Sacramento mayor Kevin Johnson. Chicken and waffles, oxtails, shrimp and grits, fried deviled eggs, and signature Kool-Aid cocktails. Motown art on every wall. Open for lunch daily.",
vibes:["Soul Food","Motown Decor","Harmonie Park","Open Daily"],
addr:"1435 Randolph St, Detroit, MI 48226",
hours:"Mon-Thu 11am-9pm | Fri 11am-11pm | Sat-Sun 10am-11pm",
best:"Lunch / Dinner / Sunday Gospel Brunch",
exclusive:"Founded by an NBA All-Star, built in the heart of Detroit's historic Paradise Valley. The chicken and waffles are the standard. Sunday gospel brunch is an experience.",
badges:["firsttimer"],
reservationUrl:"https://www.opentable.com/r/fixins-soul-kitchen-detroit" },


{ id:65, name:"Grey Ghost",                        hood:"Midtown",            cat:"Dinner",
desc:"A Midtown 'cuts and cocktails' destination in Brush Park from two Chicago-trained chefs. Dry-aged steaks, a 50-foot bar made from reclaimed bowling alley wood, a Prohibition-era rum-runner ethos, and craft cocktails that are widely considered among the best in Detroit. Open daily from 4pm. Reservations via Resy.",
vibes:["Dry-Aged Steaks","50ft Bowling Alley Bar","Brush Park","Craft Cocktails"],
addr:"47 Watson St, Detroit, MI 48201",
hours:"Sun-Thu 4pm-11pm | Fri-Sat 4pm-12am | Sunday brunch 10am-2pm",
best:"Dinner / Date Night / Late Night",
exclusive:"The 50-foot bar top is reclaimed bowling alley wood. Named after a Prohibition-era Detroit rum runner. One of the hardest reservations to get in the city – and consistently worth every effort.",
badges:["firsttimer","locals"],
reservationUrl:"https://resy.com/cities/detroit-mi/venues/greyghost" },

/* ── NEW DINNER ── */
{ id:69, name:"Vecino",                             hood:"Midtown",            cat:"Dinner",
desc:"A modern Mexican restaurant and bar in Midtown Detroit featuring Michigan's first kernel-to-masa program using imported heirloom corn. Every tortilla, tostada, and enchilada made in-house. A wood-fire hearth anchors a menu of whole snapper, ribeye, pollo adobado, and fire-roasted cabbage.",
vibes:["Wood-Fire Hearth","Heirloom Corn Masa","Agave Cocktails"],
addr:"4100 3rd Ave, Detroit, MI 48201",
hours:"Tue-Thu 5pm-10pm | Fri 5pm-10pm | Sat-Sun 4:30pm-10pm | Mon Closed",
best:"Dinner / Date Night",
exclusive:"Michigan's first kernel-to-masa program using imported Mexican heirloom corn. The tortillas are made from scratch daily. One of Midtown's most intentional and impressive kitchens.",
cats:["Dinner","Date Night"], badges:["firsttimer","locals"],
reservationUrl:"https://resy.com/cities/detroit-mi/venues/vecino" },

{ id:70, name:"Soraya",                             hood:"Downtown",           cat:"Dinner",
desc:"A contemporary Japanese restaurant inside Detroit's landmark Federal Reserve Building, opened in November 2024. The menu fuses traditional Japanese cuisine with global influences — Puerto Rican, Korean, and beyond. Standout dishes include flaming spicy tuna rolls and udon cacio e pepe.",
vibes:["Federal Reserve Building","Japanese Fusion","Global Influences"],
addr:"160 W Fort St, Detroit, MI 48226",
hours:"Mon 3pm-10pm | Tue-Thu 12pm-10pm | Fri 3pm-11pm | Sat 4pm-11pm | Sun Closed",
best:"Dinner / Date Night",
exclusive:"Inside the Federal Reserve Building, one of downtown Detroit's most architecturally striking spaces. The fusion of Japanese technique with Caribbean and Korean flavors is completely its own thing.",
badges:["firsttimer","locals"],
reservationUrl:"https://resy.com/cities/detroit-mi/venues/soraya" },

{ id:71, name:"Bash",                               hood:"Woodbridge",         cat:"Dinner",
desc:"Bash Original Izakaya is a modern Japanese restaurant in Detroit's Woodbridge neighborhood, led by Executive Chef James Kim. Bold specialty rolls, refined sashimi, carefully balanced nigiri, pork gyoza, mushroom miso ramen, and an excellent sake selection. Outdoor patio seating in season.",
vibes:["Sushi + Izakaya","Woodbridge Neighborhood","Chef James Kim"],
addr:"5069 Trumbull St, Detroit, MI 48208",
hours:"Mon-Tue 4pm-9pm | Wed-Thu 12pm-9pm | Fri-Sat 12pm-10pm | Sun 12pm-9pm",
best:"Dinner / Date Night",
exclusive:"Consistently rated one of Detroit's best sushi destinations. Reservations are recommended on weekends — it books up. The sake selection and patio are both worth the trip.",
badges:["locals","firsttimer"],
websiteUrl:"https://bashdetroit.com" },

{ id:72, name:"Sahara",                             hood:"Downtown",           cat:"Dinner",
desc:"A Mediterranean and Chaldean Middle Eastern restaurant in The District Detroit, steps from Comerica Park and the Fox Theatre. Mezze, grilled meats, and a full bar in one of the city's most welcoming dining rooms. OpenTable reservations available.",
vibes:["Mediterranean","District Detroit","Grilled Meats"],
addr:"77 W Columbia St, Detroit, MI 48201",
hours:"Mon-Thu 11am-10pm | Fri-Sat 11am-12am | Sun 11am-10pm",
best:"Dinner / Pre-Show",
exclusive:"One of the most genuinely welcoming dining rooms in downtown Detroit. The Chaldean Middle Eastern menu is unlike anything else in the District. Go before a show and plan to stay.",
badges:["firsttimer","locals"],
reservationUrl:"https://www.opentable.com/r/sahara-restaurant-and-grill-bar-the-district-detroit" },

{ id:73, name:"Adelina",                            hood:"Downtown",           cat:"Dinner",
desc:"An Italian-Mediterranean restaurant on Woodward Ave at Gratiot in the heart of downtown Detroit. Dinner nightly Tuesday through Sunday. Handmade pasta, wood-roasted proteins, and a considered cocktail and wine program in a warmly lit downtown room.",
vibes:["Italian-Mediterranean","Woodward Ave","Handmade Pasta"],
addr:"1040 Woodward Ave, Detroit, MI 48226",
hours:"Tue-Thu 5pm-10pm | Fri-Sat 4pm-11pm | Sun 4pm-10pm | Mon Closed",
best:"Dinner / Date Night",
exclusive:"One of the most quietly impressive Italian kitchens to open in downtown Detroit in recent years. The handmade pasta and wood-roasted proteins reward those who discover it before it becomes the reservation everyone is chasing.",
badges:["locals","firsttimer"],
reservationUrl:"https://www.opentable.com/r/adelina-detroit" },

{ id:74, name:"Sexy Steak",                         hood:"Downtown",           cat:"Dinner",
desc:"A halal-friendly Italian steakhouse off Grand River Ave in downtown Detroit. Prime dry-aged steaks, authentic Italian dishes, private dining rooms, and a curated cocktail program. One of the city's most distinctive steakhouse concepts for date nights and special occasions.",
vibes:["Halal-Friendly","Private Dining","Prime Steaks"],
addr:"1942 Grand River Ave, Detroit, MI 48226",
hours:"Mon-Thu 5pm-10pm | Fri-Sat 5pm-11pm | Sun 5pm-10pm",
best:"Date Night / Special Occasion",
exclusive:"Detroit's most distinctive steakhouse concept — halal-certified prime cuts in an Italian fine dining setting with private rooms. The combination does not exist anywhere else in the city.",
cats:["Dinner","Date Night"], badges:["firsttimer"],
reservationUrl:"https://www.opentable.com/r/sexy-steak-detroit" },

{ id:75, name:"Leila",                              hood:"Downtown",           cat:"Dinner",
desc:"A cosmopolitan Lebanese restaurant in Capitol Park bringing the youthful energy of modern Beirut to downtown Detroit. Rooted in the Lebanese tradition of generous family dinners — mezze, grilled meats, sharable plates, and a next-generation take on Middle Eastern dining.",
vibes:["Lebanese","Capitol Park","Modern Beirut Energy"],
addr:"1245 Griswold St, Detroit, MI 48226",
hours:"Mon-Thu 5pm-10pm | Fri-Sat 5pm-11pm | Sun 5pm-10pm (verify before visiting)",
best:"Dinner / Date Night / Group Dinner",
exclusive:"One of the most talked-about restaurants to open in downtown Detroit in years. The communal, sharing-style approach to Lebanese cuisine is exactly right for the city. Reserve early.",
badges:["firsttimer","locals"],
reservationUrl:"https://resy.com/cities/detroit-mi/venues/leila" },

{ id:76, name:"San Morello",                        hood:"Downtown",           cat:"Dinner",
desc:"Chef Andrew Carmellini's Southern Italian neighborhood restaurant on the ground floor of the Shinola Hotel. Housemade pasta, wood-roasted proteins, and an exceptional cocktail and natural wine program in one of the most beautifully designed dining rooms in the city.",
vibes:["Southern Italian","Shinola Hotel","Andrew Carmellini"],
addr:"1400 Woodward Ave (Shinola Hotel), Detroit, MI 48226",
hours:"Dinner Sun-Thu 5pm-9pm | Fri-Sat 5pm-10pm | Breakfast daily from 7am",
best:"Dinner / Date Night",
exclusive:"Andrew Carmellini is one of the most celebrated chefs in America, and San Morello is his Detroit flagship. The room, the pasta, and the wine list are all operating at a level most cities don't get to experience.",
badges:["firsttimer","locals"],
reservationUrl:"https://www.opentable.com/r/san-morello-detroit" },

/* ── NEW LUNCH ── */
{ id:77, name:"Mezcal",                             hood:"Midtown",            cat:"Lunch",
desc:"A lively Mexican restaurant and bar in the Cass Corridor serving fish tacos, birria, quesabirria, street tacos, carnitas, ceviche, and enchiladas. One of Midtown's most consistent lunch anchors with a generous double happy hour on Fridays and Saturdays.",
vibes:["Birria Tacos","Cass Corridor","Mezcal Cocktails"],
addr:"51 W Forest Ave, Detroit, MI 48202",
hours:"Tue-Thu 11am-10pm | Fri-Sat 11am-11pm | Sun 11am-8pm | Mon Closed | Happy Hour: Tue-Thu 2pm-6pm",
best:"Lunch / Happy Hour",
exclusive:"One of the Cass Corridor's most reliable lunch spots. The quesabirria and fish tacos are both standouts. The double happy hour on weeknights is a neighborhood open secret.",
badges:["locals"],
reservationUrl:"https://www.opentable.com/r/mezcal-mexican-bar-and-kitchen-detroit" },

{ id:78, name:"Condado Tacos",                      hood:"Midtown",            cat:"Lunch",
desc:"A build-your-own taco restaurant in Midtown Detroit's Selden corridor with hand-painted murals by local Detroit artists. Craft margaritas, frozen drinks, and a fully customizable taco menu. Open 7 days, from 11am.",
vibes:["Build-Your-Own Tacos","Local Detroit Murals","Craft Margaritas"],
addr:"634 Selden St, Unit A, Detroit, MI 48201",
hours:"Mon-Thu & Sun 11am-11pm | Fri-Sat 11am-12am",
best:"Lunch / Happy Hour",
exclusive:"Every Condado location is unique — the Detroit spot features hand-painted murals commissioned from local Detroit artists. Open 7 days from 11am, which makes it one of the more reliable midday options in Midtown.",
badges:["firsttimer"],
websiteUrl:"https://locations.condadotacos.com/mi/634-selden-st" },

{ id:79, name:"Bakersfield",                        hood:"Midtown",            cat:"Lunch",
desc:"A tacos, tequila, and whiskey bar at 3100 Woodward Ave in Midtown Detroit. Known for bone marrow tacos, a deep agave spirits selection, and shot specials every Tuesday. A late-night bar program runs to midnight on weekends. Open daily — lunch anytime from 4pm on weekdays, 11am on weekends.",
vibes:["Bone Marrow Tacos","Tequila + Whiskey","Tuesday Shot Specials"],
addr:"3100 Woodward Ave, Detroit, MI 48201",
hours:"Mon-Thu 4pm-11pm | Fri-Sat 11am-12am | Sun 11am-10pm",
best:"Lunch / Late Night / Tuesdays",
exclusive:"The bone marrow taco is one of the most discussed bites in Midtown. The whiskey and agave list is serious. Tuesday shot specials make it a neighborhood fixture mid-week.",
badges:["locals","firsttimer"],
reservationUrl:"https://www.opentable.com/r/bakersfield-detroit-2" },

{ id:80, name:"La Lanterna",                        hood:"Downtown",           cat:"Lunch",
desc:"An Italian family restaurant in the Albert Building in Capitol Park serving Neapolitan brick oven pizzas, pastas, salads, and paninis daily from noon. The family has been rooted in Capitol Park since 1956. Full bar with a selection of California and Italian wines.",
vibes:["Brick Oven Pizza","Capitol Park","Family Since 1956"],
addr:"1224 Griswold St, Detroit, MI 48226",
hours:"Mon-Thu 12pm-9pm | Fri-Sat 12pm-10pm | Sun 12pm-7pm | Happy Hour: Tue-Fri 3pm-6pm",
best:"Lunch / Dinner / Happy Hour",
exclusive:"A Capitol Park institution since 1956. The family has outlasted every trend in downtown Detroit. The Neapolitan pizza and happy hour are reliable in a neighborhood where consistency matters.",
badges:["locals","firsttimer"],
websiteUrl:"https://lalanternadetroit.com" },

{ id:81, name:"The Lone Goat",                      hood:"Downtown",           cat:"Lunch",
desc:"Detroit's English pub inside the Metropolitan Building on John R Street. Open daily from 11am for lunch and dinner. British pub classics, a rotating draught selection, and a no-frills room that anchors the building's ground floor alongside The Monarch Club upstairs.",
vibes:["English Pub","Metropolitan Building","Open Daily 11am"],
addr:"33 John R St, Detroit, MI 48226",
hours:"Mon-Thu 11am-11pm | Fri-Sat 11am-12am | Sun 11am-10pm",
best:"Lunch / Game Day / Any Day",
exclusive:"Detroit's best English pub in one of its most beautifully restored buildings. The Metropolitan Building connection gives it something most bars in the city can't claim — genuine architectural history.",
badges:["locals"],
websiteUrl:"https://www.thelonegoat.com" },

{ id:82, name:"Bucharest Grill",                    hood:"Rivertown",          cat:"Lunch",
desc:"A Detroit institution serving Mediterranean and Middle Eastern gyros, shawarma, falafel, and kebabs on East Jefferson Ave overlooking the Detroit River. A fast-casual staple with a dedicated local following and one of the most satisfying cheap lunches in the city.",
vibes:["Gyros & Shawarma","Detroit River","Rivertown"],
addr:"2684 E Jefferson Ave, Detroit, MI 48207",
hours:"Daily 11am-10pm (verify before visiting)",
best:"Lunch / Casual Dinner",
exclusive:"A Detroit institution that locals return to weekly. The shawarma and gyros are the real thing — no pretension, no fanfare. Exactly what this city is made of.",
badges:["locals"],
websiteUrl:"https://bucharestgrill.com" },

{ id:83, name:"Cibo",                               hood:"Downtown",           cat:"Breakfast",
desc:"An Italian restaurant inside the Cambria Hotel at 600 W Lafayette Blvd in downtown Detroit. Saturday and Sunday brunch runs from 10am — Italian egg dishes, pastries, cocktails, and a full breakfast program in a warmly designed hotel dining room. Dinner service Wednesday through Friday.",
vibes:["Weekend Brunch","Cambria Hotel","Italian Breakfast"],
addr:"600 W Lafayette Blvd, Detroit, MI 48226 (Cambria Hotel)",
hours:"Sat-Sun brunch 10am-12am | Wed-Thu dinner 4pm-10pm | Fri dinner 4pm-12am | Mon-Tue Closed",
best:"Weekend Brunch / Saturday Morning",
exclusive:"One of the more underrated breakfast programs in downtown Detroit. The Saturday and Sunday Italian brunch is a proper sit-down experience inside a hotel room that feels a step above its category. Most people walk past it without knowing it's there.",
badges:["locals"],
reservationUrl:"https://resy.com/cities/detroit-mi/venues/cibo" },

/* ── NEW ROOFTOPS ── */
{ id:84, name:"Highlands",                          hood:"Downtown",           cat:"Dinner",
desc:"A New American restaurant on floors 71 and 72 of the Renaissance Center. The signature dining experience is a three-course prix-fixe dinner — a proper meal at the top of the city, with panoramic views of downtown Detroit, the Detroit River, and Windsor, Canada spread out below you.",
vibes:["71st Floor","RenCen","Three-Course Dinner","Panoramic River Views"],
addr:"400 Renaissance Center, Floors 71 & 72, Detroit, MI 48243",
hours:"Tue-Thu 5pm-9pm | Fri-Sat 5pm-10pm | Mon & Sun Closed",
best:"Dinner / Date Night / Special Occasion",
exclusive:"The highest restaurant in Detroit. The three-course dinner is phenomenal — and the views of the river, Windsor, and the entire downtown skyline make it one of the most memorable meals you can have in this city. There is nothing at this altitude anywhere else in the Midwest.",
badges:["firsttimer"],
reservationUrl:"https://resy.com/cities/detroit-mi/venues/highlands-and-high-bar" },

{ id:85, name:"High Bar",                           hood:"Downtown",           cat:"Cocktail Lounges",
desc:"An indoor cocktail lounge on the 71st floor of the Renaissance Center, adjacent to Highlands restaurant. The tallest bar in Michigan — craft cocktails, small plates, and unobstructed floor-to-ceiling views of the Detroit River and Windsor skyline. Walk-ins welcome at the bar when seating is available.",
vibes:["Michigan's Tallest Bar","Floor 71 RenCen","Detroit River Views"],
addr:"400 Renaissance Center, Floor 71, Detroit, MI 48243",
hours:"Tue-Thu 5pm-9pm | Fri-Sat 5pm-10pm | Mon & Sun Closed",
best:"Sunset / After Work / Date Night",
exclusive:"The tallest bar in the state of Michigan, on the 71st floor of the Renaissance Center. Walk-in seating gives you the same breathtaking river and Windsor views as the restaurant without a reservation.",
badges:["firsttimer","hidden"],
websiteUrl:"https://www.highlandsdetroit.com/highbar" },

/* ── NEW BREAKFAST ── */
{ id:86, name:"Haus of Brunch",                     hood:"Downtown",           cat:"Breakfast",
desc:"An all-day brunch restaurant inside the historic Westin Book Cadillac Hotel on Michigan Avenue. Open seven days a week. Brunch cocktails, creative egg dishes, pastries, and a lively weekend atmosphere inside one of Detroit's most storied hotel lobbies.",
vibes:["All-Day Brunch","Westin Book Cadillac","Weekend Cocktails"],
addr:"204 Michigan Ave (Westin Book Cadillac), Detroit, MI 48226",
hours:"Mon-Fri 7am-3pm | Sat-Sun 7am-4pm",
best:"Weekend Brunch / Late Morning",
exclusive:"Inside one of the most architecturally magnificent hotels in Detroit. The Westin Book Cadillac is a 1924 masterpiece, and Haus of Brunch brings a modern energy that fits without disrupting it.",
badges:["firsttimer","locals"],
reservationUrl:"https://www.opentable.com/r/haus-of-brunch-detroit" },

/* ── NEW SPORTS ── */
{ id:87, name:"The Brakeman",                       hood:"Downtown",           cat:"Sports",
desc:"A craft beer bar at 22 John R Street in downtown Detroit, open Wednesday through Sunday and steps from Little Caesars Arena, Comerica Park, and Ford Field. An extensive rotating draft list, no-frills atmosphere, and late-night hours on Fridays and Saturdays.",
vibes:["Craft Beer","Near LCA","Late Night"],
addr:"22 John R St, Detroit, MI 48226",
hours:"Wed-Thu 4pm-11pm | Fri 4pm-2am | Sat 12pm-2am | Sun 12pm-10pm | Mon-Tue Closed",
best:"Game Day / After the Game",
exclusive:"Steps from every major Detroit arena. The Brakeman does not try to be anything it is not — just a serious craft beer bar in a great location that stays open until 2am on game nights.",
badges:["locals"],
websiteUrl:"https://www.thebrakemandetroit.com" },

];

const RECENTLY = [
{ id:"r1", name:"Bar Chenin",        hood:"Downtown",      cat:"Cocktail Lounges",
desc:"A pocket-sized natural wine bar inside the Siren Hotel - 10 seats inside, 16 on the patio. Biodynamic bottles, inventive cocktails, house-made ice cream. 2026 James Beard nominee for Best New Bar.",
vibes:["Natural Wine","10 Seats","James Beard Nominated"], addr:"1509 Broadway St, Detroit, MI 48226 (Siren Hotel)",
hours:"Fri-Sat 5pm-2am | Sun-Mon 5pm-12am (verify before visiting)", best:"Date Night / Late Night",
exclusive:"10 seats, no reservations, first come first served. The most sought-after bar stool in Downtown Detroit.",
badges:["recentopen","hidden","locals"], websiteUrl:"https://www.barchenin.com" },

{ id:"r2", name:"Father Forgive Me",  hood:"East Village",  cat:"Cocktail Lounges",
desc:"Wine and cocktails in a converted 1911 church garage on the grounds of The Shepherd cultural arts center, from the team behind Standby and The Skip. TIME's World's Greatest Places 2025.",
vibes:["Church Garage","Standby Team","Garden Patio"], addr:"1265 Parkview St, Detroit, MI 48214 (The Shepherd campus)",
hours:"Mon and Wed-Thu 4pm-11pm | Fri 4pm-12am | Sat 12pm-12am | Sun 12pm-11pm | Tue Closed", best:"Date Night / Weekend",
exclusive:"A bar inside a church garage from the people who made Standby and The Skip. TIME's World's Greatest Places 2025.",
badges:["recentopen","hidden","locals"], websiteUrl:"https://www.fatherforgiveme.com" },

{ id:"r3", name:"Pocket Change",      hood:"Eastern Market",cat:"Nightlife",
desc:"A second-floor cocktail bar with deep red walls and a rooftop patio overlooking Eastern Market sheds. Look for the red neon Cocktails sign on Gratiot and head upstairs.",
vibes:["Hidden Entrance","Rooftop Patio","DJ Nights"], addr:"1454 Gratiot Ave (2nd Floor), Detroit, MI 48207",
hours:"Thu 7pm-12am | Fri-Sat 8pm-2am | Sun 2pm-10pm", best:"Weekend / Late Night",
exclusive:"No sign at street level. A red neon Cocktails sign is your only clue. Head upstairs.",
cats:["Nightlife","Cocktail Lounges"],badges:["recentopen","hidden"], websiteUrl:"https://www.instagram.com/pocketchangedetroit" },

{ id:"r4", name:"Street Beet",        hood:"Corktown",      cat:"Corktown",
desc:"Detroit's beloved vegan pop-up turned permanent restaurant in the former Bobcat Bonnie's space. Plant-based smashburgers, coney dogs, diner classics. Vintage arcade in the back.",
vibes:["Vegan","Comfort Food","Arcade"], addr:"1800 Michigan Ave, Detroit, MI 48216",
hours:"Wed-Thu 4pm-10pm | Fri 4pm-11pm | Sat 10am-3pm and 4pm-11pm | Sun 10am-3pm and 4pm-10pm | Mon-Tue Closed", best:"Weeknight / Weekend",
exclusive:"Detroit's most beloved vegan pop-up finally has a permanent home.",
cats:["Corktown","Lunch"],badges:["recentopen"], websiteUrl:"https://www.streetbeet.online" },

{ id:"r5", name:"Dirty Shake",        hood:"Midtown",       cat:"Midtown",
desc:"A high-energy neighborhood bar from the team behind Chartreuse and Freya. Nostalgic cocktails, boozy slushies, a cult-status bar burger, and a patio with garage doors.",
vibes:["Late Night","Bar Burger","Chartreuse Team"], addr:"4120 Cass Ave, Detroit, MI 48201",
hours:"Check @dirtyshakedetroit for current hours", best:"Late Night / Weeknight",
exclusive:"When the Chartreuse team opens a neighborhood bar, the neighborhood pays attention.",
cats:["Midtown","Cocktail Lounges"],badges:["recentopen"], websiteUrl:"https://www.instagram.com/dirtyshakedetroit" },
];

const UPCOMING = [
{ id:"u1", name:"Sunda New Asian",           hood:"Downtown",           cat:"Pan-Asian Restaurant",
desc:"A 6,000-square-foot pan-Asian experience in The District Detroit from Chicago restaurateur Billy Dec. Elevated sushi, dim sum, wagyu, robata. 200+ seats and a 1,400-square-foot patio.",
vibes:["Pan-Asian","Elevated Sushi","Dim Sum"], addr:"33 W Columbia St, Detroit, MI 48201",
hours:"Tue-Thu 5pm-10pm | Fri-Sat 5pm-11pm | Sun 5pm-10pm | Mon Closed", best:"Date Night / Pre-Show",
exclusive:"Billy Dec built Sunda into a national brand over 15 years. Detroit has been ready for a restaurant at this level.",
openDate:"2026-03-10", note:"Opened March 10, 2026 | Billy Dec / Rockit Ranch | 5th Sunda location",
reservationUrl:"https://www.opentable.com/r/sunda-new-asian-detroit" },
{ id:"u2", name:"Cosm Detroit",              hood:"Downtown",           cat:"Immersive Entertainment",
desc:"A 70,000 sq ft immersive sports and entertainment dome adjacent to Campus Martius. 87-ft 12K LED dome with Shared Reality technology. Capacity 1,500. Partners: NFL, NBA, UFC.",
vibes:["Immersive Dome","Live Sports","12K LED"], addr:"Cadillac Square (near Campus Martius), Detroit, MI 48226",
hours:"Targeting Fall 2026 - confirm at cosm.com/detroit", best:"Game Night / Any Night",
exclusive:"Nothing like this exists anywhere in the Midwest. When it opens Detroit will have the most immersive sports venue in the country outside LA and Dallas.",
openDate:"2026-09-01", note:"Targeting Fall 2026 | Bedrock's Development at Cadillac Square",
cats:["Immersive Entertainment","Sports"],websiteUrl:"https://cosm.com/detroit", ticketUrl:"https://cosm.com/detroit" },
{ id:"u3", name:"The Detroit EDITION Hotel", hood:"Downtown",           cat:"Luxury Hotel",
desc:"Detroit's first five-star hotel anchoring Hudson's Detroit - the city's tallest new skyscraper in 50 years. 227 rooms, four dining concepts, rooftop pool. Marriott EDITION brand's first Midwest property.",
vibes:["Five-Star","Hudson's Tower","Marriott EDITION"], addr:"1208 Woodward Ave (Hudson's Detroit Tower), Detroit, MI 48226",
hours:"Opening 2027 - confirm at hudsons-detroit.com", best:"Hotel Stay / Special Occasion",
exclusive:"Detroit's first five-star hotel inside its tallest new tower in 50 years.",
openDate:"2027-01-01", note:"Opening 2027 | Detroit's first 5-star hotel | Hudson's Detroit Tower",
websiteUrl:"https://www.hudsons-detroit.com" },
{ id:"u4", name:"Little Liberia",            hood:"East English Village", cat:"African Restaurant",
desc:"Detroit's first Liberian restaurant from chef Ameneh Marhaba. A halal menu blending Liberian dishes with broader African influences, inside The Ribbon development on the east side.",
vibes:["Liberian Cuisine","Halal","Community-Led"], addr:"16530 E Warren Ave, Detroit, MI 48224 (The Ribbon development)",
hours:"Opening date TBD - follow @littleliberiadetroit", best:"Dinner / Cultural Experience",
exclusive:"Detroit's first Liberian restaurant. The kind of opening that matters beyond food.",
openDate:null, note:"Coming Soon | Detroit's first Liberian restaurant | Chef Ameneh Marhaba", websiteUrl:"https://www.littleliberia.com" },
].map(v => ({ ...v, status: calcStatus(v.openDate) }))
.filter(v => v.status === "justopened" || v.status === "comingsoon");

const ALL = [...VENUES, ...RECENTLY];
function findItem(id) {
if (id === null || id === undefined) return null;
return [...VENUES, ...RECENTLY, ...UPCOMING].find(v => String(v.id) === String(id)) || null;
}

function Chip({ type }) {
const b = BD[type]; if (!b) return null;
return React.createElement("span", {
style:{ background:b.bg, color:b.color, border:"1.5px solid "+b.border, borderRadius:100, padding:"3px 9px", fontSize:"0.49rem", fontFamily:"'DM Mono',monospace", letterSpacing:"0.12em", textTransform:"uppercase", whiteSpace:"nowrap" }
}, b.label);
}
function Vibe({ label }) {
return React.createElement("span", {
style:{ border:"1px solid "+C.border, color:C.smoke, borderRadius:100, padding:"3px 9px", fontSize:"0.49rem", fontFamily:"'DM Mono',monospace", letterSpacing:"0.1em", textTransform:"uppercase", whiteSpace:"nowrap" }
}, label);
}
function CTA({ venue, full }) {
const cta = getCTA(venue); if (!cta) return null;
return React.createElement("a", {
href:cta.url, target:"_blank", rel:"noopener noreferrer",
onClick:e=>e.stopPropagation(),
style:{ display:"inline-block", background:C.gold, color:C.black, fontFamily:"'DM Mono',monospace", fontSize:"0.57rem", letterSpacing:"0.13em", textTransform:"uppercase", padding:"10px 18px", borderRadius:6, fontWeight:500, textDecoration:"none", cursor:"pointer", width:full?"100%":undefined, textAlign:full?"center":undefined }
}, cta.label);
}

const CAT_EMOJI={"Breakfast":"🍳","Coffee Shops & Bakeries":"☕","Lunch":"🥪","Dinner":"🍽️","Happy Hour":"🥂","Sports":"⚾️","Hidden Bars":"🚪","Speakeasies":"🥃","Cocktail Lounges":"🥃","Rooftops":"🌆","Hotel Lounges":"🥃","Alley Spots":"🌟","Nightlife":"🌙","Comedy / Live Events":"🎭","Date Night":"🖤","Outdoor Activities":"🍃","Midtown":"🏙","Downtown":"🏙","Corktown":"🌿","African Restaurant":"🌍","Pan-Asian Restaurant":"🍜","Immersive Entertainment":"🌆","Luxury Hotel":"✨"};
const EMOJI_PRIORITY=["Cocktail Lounges","Hotel Lounges","Speakeasies","Hidden Bars","Dinner","Lunch","Breakfast","Coffee Shops & Bakeries","Happy Hour","Sports","Rooftops","Comedy / Live Events","Nightlife","Date Night","Outdoor Activities","Alley Spots"];
function getEmojiForVenue(venue){const all=[venue.cat,...(venue.cats||[])];for(const c of EMOJI_PRIORITY){if(all.includes(c)&&CAT_EMOJI[c])return CAT_EMOJI[c];}return CAT_EMOJI[venue.cat]||"✨";}
function getVibeLine(venue){const emoji=getEmojiForVenue(venue);const vibes=venue.vibes||[];if(!vibes.length)return null;const parts=vibes.slice(0,2).map(v=>v.toLowerCase());return emoji+" "+parts.join(" · ");}
function getInsiderTip(venue){if(!venue.best)return null;return "💡 Best: "+venue.best;}

const VENUE_IMG_MAP = {
1:"1470337458703-46ad1756a187",2:"1514362545857-3bc16c4c7d1b",3:"1566417713940-fe7c737a9ef2",
4:"1513558161293-cdaf765ed2fd",5:"1551634979-2e9bb8c7dd5d",6:"1543007630-9359431a5a9d",
7:"1470337458703-46ad1756a187",8:"1542314831-068cd1dbfeeb",9:"1571896349842-33c89424de2d",
10:"1514362545857-3bc16c4c7d1b",11:"1477959858617-67f85cf4f1df",13:"1441974231531-c6227db76b6e",
15:"1566417713940-fe7c737a9ef2",16:"1492684223066-81342ee5ff30",17:"1579952363873-27f3bade9f55",
18:"1540747913346-19e5df342091",19:"1568522271747-01fa3a0e3a57",20:"1504701954957-2010ec3bcec1",
21:"1517457373958-b7bdd4587205",22:"1501281668745-26d60d196ba7",23:"1501281668745-26d60d196ba7",
24:"1559339352-11d035aa65de",25:"1550966871-3ed3ccd8aede",26:"1534224373688-37be267ede82",
27:"1507003211169-0a1dd7228f2d",28:"1534224373688-37be267ede82",30:"1513558161293-cdaf765ed2fd",
31:"1566417713940-fe7c737a9ef2",32:"1414235077428-338989a2e8c0",33:"1492684223066-81342ee5ff30",
34:"1414235077428-338989a2e8c0",35:"1517248135467-4c7edcad34c4",36:"1559339352-11d035aa65de",
37:"1550966871-3ed3ccd8aede",38:"1414235077428-338989a2e8c0",39:"1517248135467-4c7edcad34c4",
40:"1559339352-11d035aa65de",41:"1551634979-2e9bb8c7dd5d",42:"1533089860892-a7c6f0a88666",
43:"1525351484163-7529414f2171",44:"1533089860892-a7c6f0a88666",45:"1525351484163-7529414f2171",
46:"1509042239860-f550ce710b93",47:"1524350876685-274059332603",48:"1509042239860-f550ce710b93",
49:"1524350876685-274059332603",50:"1533089860892-a7c6f0a88666",51:"1550966871-3ed3ccd8aede",
52:"1517248135467-4c7edcad34c4",53:"1513558161293-cdaf765ed2fd",55:"1414235077428-338989a2e8c0",
56:"1517248135467-4c7edcad34c4",57:"1414235077428-338989a2e8c0",63:"1550966871-3ed3ccd8aede",
64:"1414235077428-338989a2e8c0",65:"1550966871-3ed3ccd8aede",67:"1558618666-fcd25c85cd64",
68:"1543007630-9359431a5a9d",69:"1414235077428-338989a2e8c0",70:"1517248135467-4c7edcad34c4",
71:"1514362545857-3bc16c4c7d1b",72:"1550966871-3ed3ccd8aede",73:"1414235077428-338989a2e8c0",
74:"1559339352-11d035aa65de",75:"1517248135467-4c7edcad34c4",76:"1550966871-3ed3ccd8aede",
77:"1517248135467-4c7edcad34c4",78:"1414235077428-338989a2e8c0",79:"1543007630-9359431a5a9d",
80:"1550966871-3ed3ccd8aede",81:"1470337458703-46ad1756a187",82:"1517248135467-4c7edcad34c4",
83:"1533089860892-a7c6f0a88666",84:"1559339352-11d035aa65de",85:"1477959858617-67f85cf4f1df",
86:"1525351484163-7529414f2171",87:"1579952363873-27f3bade9f55",
r1:"1543007630-9359431a5a9d",r2:"1470337458703-46ad1756a187",r3:"1477959858617-67f85cf4f1df",
r4:"1414235077428-338989a2e8c0",r5:"1543007630-9359431a5a9d",
u1:"1517248135467-4c7edcad34c4",u2:"1492684223066-81342ee5ff30",
u3:"1542314831-068cd1dbfeeb",u4:"1414235077428-338989a2e8c0",
};
const CATEGORY_IMG_POOL = {
"Hidden Bars":["1470337458703-46ad1756a187","1566417713940-fe7c737a9ef2","1551634979-2e9bb8c7dd5d"],
"Speakeasies":["1551634979-2e9bb8c7dd5d","1514362545857-3bc16c4c7d1b","1470337458703-46ad1756a187"],
"Cocktail Lounges":["1513558161293-cdaf765ed2fd","1470337458703-46ad1756a187","1543007630-9359431a5a9d"],
"Nightlife":["1492684223066-81342ee5ff30","1504701954957-2010ec3bcec1","1517457373958-b7bdd4587205"],
"Hotel Lounges":["1542314831-068cd1dbfeeb","1571896349842-33c89424de2d","1513558161293-cdaf765ed2fd"],
"Happy Hour":["1414235077428-338989a2e8c0","1517248135467-4c7edcad34c4","1470337458703-46ad1756a187"],
"Lunch":["1414235077428-338989a2e8c0","1517248135467-4c7edcad34c4","1550966871-3ed3ccd8aede"],
"Dinner":["1414235077428-338989a2e8c0","1550966871-3ed3ccd8aede","1517248135467-4c7edcad34c4"],
"Date Night":["1559339352-11d035aa65de","1550966871-3ed3ccd8aede","1414235077428-338989a2e8c0"],
"Rooftops":["1477959858617-67f85cf4f1df","1441974231531-c6227db76b6e","1558618666-fcd25c85cd64"],
"Breakfast":["1533089860892-a7c6f0a88666","1525351484163-7529414f2171","1414235077428-338989a2e8c0"],
"Coffee Shops & Bakeries":["1509042239860-f550ce710b93","1524350876685-274059332603","1525351484163-7529414f2171"],
"Outdoor Activities":["1534224373688-37be267ede82","1507003211169-0a1dd7228f2d","1477959858617-67f85cf4f1df"],
"Sports":["1579952363873-27f3bade9f55","1540747913346-19e5df342091","1568522271747-01fa3a0e3a57"],
"Alley Spots":["1470337458703-46ad1756a187","1566417713940-fe7c737a9ef2","1492684223066-81342ee5ff30"],
"Comedy / Live Events":["1501281668745-26d60d196ba7","1517457373958-b7bdd4587205","1492684223066-81342ee5ff30"],
"Immersive Entertainment":["1501281668745-26d60d196ba7","1492684223066-81342ee5ff30","1517457373958-b7bdd4587205"],
"Pan-Asian Restaurant":["1414235077428-338989a2e8c0","1517248135467-4c7edcad34c4","1550966871-3ed3ccd8aede"],
"African Restaurant":["1414235077428-338989a2e8c0","1517248135467-4c7edcad34c4","1550966871-3ed3ccd8aede"],
"Corktown":["1566417713940-fe7c737a9ef2","1492684223066-81342ee5ff30","1414235077428-338989a2e8c0"],
"Midtown":["1543007630-9359431a5a9d","1470337458703-46ad1756a187","1513558161293-cdaf765ed2fd"],
"Luxury Hotel":["1542314831-068cd1dbfeeb","1571896349842-33c89424de2d","1559339352-11d035aa65de"],
};
const DEFAULT_IMG_POOL=["1470337458703-46ad1756a187","1414235077428-338989a2e8c0","1477959858617-67f85cf4f1df","1513558161293-cdaf765ed2fd","1492684223066-81342ee5ff30"];
function getVenueFallbackImage(venue){
if(venue.image)return venue.image;
const directId=VENUE_IMG_MAP[venue.id];
if(directId)return `https://images.unsplash.com/photo-${directId}?auto=format&fit=crop&w=800&q=75`;
const pool=CATEGORY_IMG_POOL[venue.cat]||DEFAULT_IMG_POOL;
const seed=String(venue.id).split("").reduce((a,c)=>a+c.charCodeAt(0),0);
const id=pool[seed%pool.length];
return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=75`;
}

const VenueImg = React.memo(function VenueImg({ src, fallbackSrc, alt, height=190 }) {
const [activeSrc, setActiveSrc] = useState(src || fallbackSrc || null);
const [loaded, setLoaded] = useState(false);
const [failed, setFailed] = useState(false);
useEffect(() => {
if (!src || src === activeSrc) return;
if (!loaded) { setActiveSrc(src); return; }
// Already showing an image — preload silently before swapping to avoid flash
const img = new Image();
img.onload = () => setActiveSrc(src);
img.onerror = () => {};
img.src = src;
return () => { img.onload = null; img.onerror = null; };
}, [src]);
const handleError = () => {
if (activeSrc !== fallbackSrc && fallbackSrc) { setActiveSrc(fallbackSrc); setLoaded(false); }
else { setFailed(true); }
};
return React.createElement("div", { style:{ height, overflow:"hidden", background:"linear-gradient(160deg,#2a1f14 0%,#1c150e 100%)", flexShrink:0, position:"relative" } },
activeSrc && !failed && React.createElement("img", { src:activeSrc, alt:alt||"", loading:"lazy", style:{ width:"100%", height:"100%", objectFit:"cover", display:"block", opacity:loaded?1:0, transition:"opacity 0.4s ease", position:"absolute", inset:0 }, onLoad:()=>setLoaded(true), onError:handleError }),
failed && React.createElement("div", { style:{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8 } },
React.createElement("span", { style:{ fontSize:"2rem", opacity:0.35 } }, "🥃"),
React.createElement("span", { style:{ fontFamily:"'DM Mono',monospace", fontSize:"0.38rem", letterSpacing:"0.18em", color:"rgba(201,168,76,0.38)", textTransform:"uppercase" } }, "Detroit")
)
);
});

const VCard = React.memo(function VCard({ venue, isFav, onFav, onOpen, i, photoMap }) {
const [hov, setHov] = useState(false);
const fallbackSrc = React.useMemo(() => getVenueFallbackImage(venue), [venue.id]);
const dbSrc = photoMap?.[String(venue.id)] || null;
const vibeLine=getVibeLine(venue);
return React.createElement("div", {
onClick:()=>onOpen(String(venue.id)),
onMouseEnter:()=>setHov(true), onMouseLeave:()=>setHov(false),
style:{ background:C.card, border:"1px solid "+(hov?C.goldD:C.border), borderRadius:12, cursor:"pointer", display:"flex", flexDirection:"column", overflow:"hidden", transform:hov?"translateY(-4px)":"none", boxShadow:hov?"var(--c-shdw-h)":"var(--c-shdw-f)", transition:"all 0.24s", animation:"fadeSlideIn 0.28s ease both", animationDelay:Math.min(i*0.04,0.4)+"s" }
},
React.createElement(VenueImg, { src:dbSrc || fallbackSrc, fallbackSrc, alt:venue.name }),
React.createElement("div", { style:{ padding:"16px 18px 18px", display:"flex", flexDirection:"column", gap:9, flex:1 }},
React.createElement("div", { style:{ display:"flex", justifyContent:"space-between" }},
React.createElement("span", { style:{ fontFamily:"'DM Mono',monospace", fontSize:"0.49rem", letterSpacing:"0.16em", textTransform:"uppercase", color:C.gold }}, venue.cat),
React.createElement("span", { style:{ fontFamily:"'DM Mono',monospace", fontSize:"0.49rem", letterSpacing:"0.1em", textTransform:"uppercase", color:C.smoke }}, venue.hood)
),
venue.distMi!==undefined&&React.createElement("span",{style:{fontFamily:"'DM Mono',monospace",fontSize:"0.47rem",letterSpacing:"0.1em",color:C.purple}},"◉ "+venue.distMi.toFixed(1)+" mi away"),
(venue.badges||[]).length > 0 && React.createElement("div", { style:{ display:"flex", flexWrap:"wrap", gap:5 }}, (venue.badges||[]).map(b=>React.createElement(Chip,{key:b,type:b}))),
React.createElement("h3", { style:{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.3rem", fontWeight:600, color:C.white, lineHeight:1.15, margin:0 }}, venue.name),
vibeLine&&React.createElement("p",{style:{fontFamily:"'Cormorant Garamond',serif",fontSize:"0.82rem",fontStyle:"italic",color:"var(--c-vibe-txt)",margin:0,lineHeight:1.4}},vibeLine),
React.createElement("p", { style:{ fontSize:"0.78rem", color:C.ash, fontWeight:300, lineHeight:1.65, flex:1, margin:0 }}, venue.desc),
React.createElement("div", { style:{ display:"flex", flexWrap:"wrap", gap:4 }}, venue.vibes.map(v=>React.createElement(Vibe,{key:v,label:v}))),
React.createElement("div", { style:{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:10, borderTop:"1px solid "+C.borderS }},
React.createElement(CTA, { venue }),
React.createElement("button", { onClick:e=>{e.stopPropagation();onFav(String(venue.id));}, onMouseDown:e=>e.preventDefault(), style:{ background:"none", border:"none", cursor:"pointer", color:isFav?C.gold:C.bone, fontSize:"1.1rem", padding:"10px 12px", display:"inline-flex", alignItems:"center", justifyContent:"center", outline:"none", minWidth:44, minHeight:44, transition:"color 0.18s" }}, isFav?"\u2665":"\u2661")
)
)
);
});

const UCard = React.memo(function UCard({ venue, i, onOpen, isFav, onFav, photoMap }) {
const [hov, setHov] = useState(false);
const just = venue.status==="justopened";
const acc  = just ? C.gold : C.purple;
const vibeLine=getVibeLine(venue);
const fallbackSrc = React.useMemo(() => getVenueFallbackImage(venue), [venue.id]);
const dbSrc = photoMap?.[String(venue.id)] || null;
return React.createElement("div", {
onClick:()=>onOpen(venue.id),
onMouseEnter:()=>setHov(true), onMouseLeave:()=>setHov(false),
style:{ background:C.card, border:"1px solid "+(hov?(just?C.goldD:"rgba(110,75,195,0.5)"):C.border), borderRadius:12, cursor:"pointer", display:"flex", flexDirection:"column", overflow:"hidden", transform:hov?"translateY(-4px)":"none", boxShadow:hov?"0 8px 36px rgba(0,0,0,0.55)":"0 2px 14px rgba(0,0,0,0.4)", transition:"all 0.24s", animation:"fadeSlideIn 0.28s ease both", animationDelay:Math.min(i*0.04,0.4)+"s" }
},
React.createElement(VenueImg, { src:dbSrc || fallbackSrc, fallbackSrc, alt:venue.name }),
React.createElement("div", { style:{ padding:"16px 18px 18px", display:"flex", flexDirection:"column", gap:9, flex:1 }},
React.createElement("div", { style:{ display:"flex", justifyContent:"space-between" }},
React.createElement("span", { style:{ fontFamily:"'DM Mono',monospace", fontSize:"0.49rem", letterSpacing:"0.16em", textTransform:"uppercase", color:acc }}, venue.cat),
React.createElement("span", { style:{ fontFamily:"'DM Mono',monospace", fontSize:"0.49rem", letterSpacing:"0.1em", textTransform:"uppercase", color:C.smoke }}, venue.hood)
),
React.createElement("div", { style:{ display:"flex", gap:5 }}, React.createElement(Chip,{type:venue.status})),
React.createElement("h3", { style:{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.3rem", fontWeight:600, color:C.white, lineHeight:1.15, margin:0 }}, venue.name),
vibeLine&&React.createElement("p",{style:{fontFamily:"'Cormorant Garamond',serif",fontSize:"0.82rem",fontStyle:"italic",color:"var(--c-vibe-txt)",margin:0,lineHeight:1.4}},vibeLine),
React.createElement("p", { style:{ fontSize:"0.78rem", color:C.ash, fontWeight:300, lineHeight:1.65, flex:1, margin:0 }}, venue.desc),
React.createElement("div", { style:{ display:"flex", flexWrap:"wrap", gap:4 }}, venue.vibes.map(v=>React.createElement(Vibe,{key:v,label:v}))),
React.createElement("div", { style:{ background:just?"rgba(201,168,76,0.09)":"rgba(110,75,195,0.09)", border:"1px solid "+(just?"rgba(201,168,76,0.28)":"rgba(110,75,195,0.28)"), borderRadius:5, padding:"6px 10px" }},
React.createElement("span", { style:{ fontFamily:"'DM Mono',monospace", fontSize:"0.48rem", letterSpacing:"0.09em", color:acc }}, venue.note)
),
React.createElement("div", { style:{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:10, borderTop:"1px solid "+C.borderS }},
React.createElement(CTA, { venue }),
React.createElement("button", { onClick:e=>{e.stopPropagation();onFav(String(venue.id));}, onMouseDown:e=>e.preventDefault(), style:{ background:"none", border:"none", cursor:"pointer", color:isFav?C.gold:C.bone, fontSize:"1.1rem", padding:"10px 12px", marginLeft:"auto", display:"inline-flex", alignItems:"center", justifyContent:"center", outline:"none", minWidth:44, minHeight:44, transition:"color 0.18s" }}, isFav?"\u2665":"\u2661")
)
)
);
});

function Modal({ venue, isFav, onFav, onClose, photoMap }) {
if (!venue) return null;
const isV = typeof venue.id === "number";
const badges = venue.badges||[];
const fallbackSrc = React.useMemo(() => getVenueFallbackImage(venue), [venue.id]);
const dbSrc = photoMap?.[String(venue.id)] || null;
useEffect(() => {
const scrollY = window.scrollY;
const body = document.body;
const prevPos = body.style.position;
const prevTop = body.style.top;
const prevWidth = body.style.width;
const prevOverflow = body.style.overflow;
body.style.overflow = "hidden";
body.style.position = "fixed";
body.style.top = `-${scrollY}px`;
body.style.width = "100%";
return () => {
body.style.overflow = prevOverflow;
body.style.position = prevPos;
body.style.top = prevTop;
body.style.width = prevWidth;
window.scrollTo(0, scrollY);
};
}, []);
return React.createElement(React.Fragment, null,
React.createElement("div", { onClick:onClose, onTouchMove:e=>e.preventDefault(), style:{ position:"fixed", inset:0, background:"var(--c-modal-bd)", zIndex:800, backdropFilter:"blur(6px)" }}),
React.createElement("div", { style:{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:"min(620px,93vw)", maxHeight:"92dvh", overflowY:"auto", WebkitOverflowScrolling:"touch", overscrollBehavior:"contain", background:"var(--c-modal-bg)", border:"1px solid var(--c-modal-bdr)", borderRadius:16, zIndex:900 }},
React.createElement("div", { style:{ position:"relative", flexShrink:0 } },
React.createElement(VenueImg, { src:dbSrc || fallbackSrc, fallbackSrc, alt:venue.name, height:240 })
),
React.createElement("div", { style:{ padding:"20px 24px 32px", display:"flex", flexDirection:"column", gap:14 }},
React.createElement("div", { style:{ display:"flex", justifyContent:"space-between", alignItems:"center" }},
React.createElement("span", { style:{ fontFamily:"'DM Mono',monospace", fontSize:"0.49rem", letterSpacing:"0.16em", textTransform:"uppercase", color:C.gold, fontWeight:400 }}, venue.cat),
React.createElement("div", { style:{ display:"flex", alignItems:"center", gap:14 }},
React.createElement("span", { style:{ fontFamily:"'DM Mono',monospace", fontSize:"0.49rem", letterSpacing:"0.12em", textTransform:"uppercase", color:"var(--c-modal-hood)" }}, venue.hood),
React.createElement("button", { onClick:onClose, style:{ background:"none", border:"none", color:"var(--c-modal-close)", cursor:"pointer", fontSize:"1.15rem", fontWeight:300, flexShrink:0, transition:"color 0.18s", minWidth:36, minHeight:36, display:"flex", alignItems:"center", justifyContent:"center", lineHeight:1, padding:0 }}, "✕")
)),
badges.length > 0 && React.createElement("div", { style:{ display:"flex", flexWrap:"wrap", gap:6 }}, badges.map(b=>React.createElement(Chip,{key:b,type:b}))),
venue.status && (venue.status==="justopened"||venue.status==="comingsoon") && React.createElement("div", null, React.createElement(Chip,{type:venue.status})),
React.createElement("h2", { style:{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(1.5rem,4vw,2rem)", fontWeight:600, color:C.white, lineHeight:1.1, margin:0 }}, venue.name),
React.createElement("div", { style:{ display:"flex", flexWrap:"wrap", gap:5 }}, venue.vibes.map(v=>React.createElement(Vibe,{key:v,label:v}))),
React.createElement("p", { style:{ fontSize:"0.86rem", color:"var(--c-modal-body)", fontWeight:300, lineHeight:1.72, margin:0 }}, venue.desc),
venue.exclusive && React.createElement("div", { style:{ background:"var(--c-modal-excl-bg)", border:"1px solid var(--c-modal-excl-bdr)", borderRadius:6, padding:"13px 16px" }},
React.createElement("span", { style:{ fontFamily:"'DM Mono',monospace", fontSize:"0.52rem", letterSpacing:"0.15em", textTransform:"uppercase", color:C.gold, display:"block", marginBottom:6 }}, isV?"Why it feels exclusive":"Why this matters"),
React.createElement("p", { style:{ fontSize:"0.83rem", color:"var(--c-modal-body)", fontWeight:300, fontStyle:"italic", lineHeight:1.62, margin:0 }}, venue.exclusive)
),
venue.note && React.createElement("div", { style:{ background:venue.status==="justopened"?"var(--c-modal-note-bg)":"var(--c-modal-notep-bg)", border:"1px solid "+(venue.status==="justopened"?"var(--c-modal-note-bdr)":"var(--c-modal-notep-bdr)"), borderRadius:6, padding:"10px 14px" }},
React.createElement("span", { style:{ fontFamily:"'DM Mono',monospace", fontSize:"0.5rem", letterSpacing:"0.1em", color:venue.status==="justopened"?C.gold:C.purple }}, venue.note)
),
React.createElement("div", { style:{ background:"var(--c-modal-info-bg)", border:"1px solid var(--c-modal-info-bdr)", borderRadius:6, padding:"13px 16px", display:"flex", flexDirection:"column", gap:9 }},
[["Address",venue.addr],["Hours",venue.hours],["Best for",venue.best||""]].filter(p=>p[1]).map(p=>
React.createElement("div", { key:p[0], style:{ display:"flex", gap:12, alignItems:"flex-start" }},
React.createElement("span", { style:{ fontFamily:"'DM Mono',monospace", fontSize:"0.52rem", letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--c-modal-lbl)", minWidth:68, paddingTop:2 }}, p[0]),
React.createElement("span", { style:{ fontSize:"0.81rem", color:"var(--c-modal-val)", fontWeight:300, lineHeight:1.5 }}, p[1])
)
)
),
React.createElement("div", { style:{ display:"flex", gap:10, alignItems:"center" }},
React.createElement(CTA, { venue, full:true }),
React.createElement("button", { onClick:()=>onFav(String(venue.id)), title:isFav?"Saved":"Save", style:{ width:40, height:40, flexShrink:0, display:"inline-flex", alignItems:"center", justifyContent:"center", padding:0, background:isFav?"rgba(201,168,76,0.15)":"var(--c-modal-save-bg)", border:"1.5px solid "+(isFav?"rgba(201,168,76,0.7)":"var(--c-modal-save-bdr)"), color:isFav?C.gold:"var(--c-modal-save-clr)", fontSize:"1.05rem", borderRadius:6, cursor:"pointer", transition:"all 0.18s" }}, isFav?"\u2665":"\u2661")
)
)
)
);
}

function Toast({ msg, vis }) {
return React.createElement("div", {
style:{ position:"fixed", bottom:28, left:"50%", transform:`translateX(-50%) translateY(${vis?0:16}px)`, background:C.bone, color:C.black, fontFamily:"'DM Mono',monospace", fontSize:"0.59rem", letterSpacing:"0.1em", textTransform:"uppercase", padding:"9px 22px", borderRadius:100, opacity:vis?1:0, transition:"all 0.3s", zIndex:1000, pointerEvents:"none", whiteSpace:"nowrap" }
}, msg);
}

const MAP_FILTER_CATS=["all","Hidden Bars","Rooftops","Dinner","Lunch","Happy Hour","Sports","Speakeasies","Cocktail Lounges"];
const MAP_CAT_ICONS={"all":"🗺","Hidden Bars":"🍸","Rooftops":"🏙","Dinner":"🍽","Lunch":"🍔","Happy Hour":"🥂","Sports":"⚾","Speakeasies":"🥃","Cocktail Lounges":"🍹"};
function MapView({isFav,toggleFav,setModalId,modalId,navTo,photoMap}){
const [mapCat,setMapCat]=React.useState("all");
const [selected,setSelected]=React.useState(null);
const [mapReady,setMapReady]=React.useState(false);
const [userPos,setUserPos]=React.useState(null);
const containerRef=React.useRef(null);
const mapRef=React.useRef(null);
const markersRef=React.useRef([]);
React.useEffect(()=>{
const pb=document.body.style.overflow,ph=document.documentElement.style.overflow;
document.body.style.overflow="hidden";document.documentElement.style.overflow="hidden";
return()=>{document.body.style.overflow=pb;document.documentElement.style.overflow=ph;};
},[]);
React.useEffect(()=>{
if(!containerRef.current||mapRef.current)return;
const map=L.map(containerRef.current,{center:[42.3314,-83.0458],zoom:14,zoomControl:false,attributionControl:false});
const _th=document.documentElement.getAttribute("data-theme");
const _sysDark=typeof window!=="undefined"&&window.matchMedia?window.matchMedia("(prefers-color-scheme: dark)").matches:true;
const _useDark=_th==="dark"||(_th!=="light"&&_sysDark);
const _tile=_useDark?"https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png":"https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
L.tileLayer(_tile,{subdomains:"abcd",maxZoom:19}).addTo(map);
mapRef.current=map;
setTimeout(()=>{map.invalidateSize();},100);
setMapReady(true);
return()=>{map.remove();mapRef.current=null;};
},[]);
React.useEffect(()=>{
const map=mapRef.current;if(!map)return;
markersRef.current.forEach(m=>map.removeLayer(m));markersRef.current=[];
[...ALL,...UPCOMING].forEach(v=>{
if(mapCat!=="all"&&v.cat!==mapCat&&!(v.cats||[]).includes(mapCat))return;
const coord=COORDS[String(v.id)];if(!coord)return;
const isNew=!!(v.status==="comingsoon"||v.status==="justopened"||(v.badges||[]).includes("recentopen"));
const isSel=selected?.id===v.id;
const pin=isNew?"#C8AEFF":"#C9A84C";
const glow=isNew?"rgba(200,174,255,0.45)":"rgba(201,168,76,0.45)";
let mHtml;
if(isSel){
mHtml=`<div style="width:26px;height:26px;background:${pin};border-radius:50%;border:2.5px solid rgba(255,255,255,0.9);box-shadow:0 0 0 4px ${glow},0 3px 14px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;font-size:10px;color:rgba(10,8,4,0.85)">★</div>`;
}else{
mHtml=`<div style="width:13px;height:13px;background:${pin};border-radius:50%;border:2.5px solid rgba(255,255,255,0.75);box-shadow:0 0 8px ${glow};cursor:pointer"></div>`;
}
const sz=isSel?[26,26]:[13,13];const anc=isSel?[13,13]:[6,6];
const icon=L.divIcon({className:"",html:mHtml,iconSize:sz,iconAnchor:anc});
const m=L.marker(coord,{icon}).addTo(map).on("click",()=>setSelected(v));
markersRef.current.push(m);
});
},[mapCat,mapReady,selected]);
React.useEffect(()=>{
const map=mapRef.current;if(!map)return;
if(selected){const coord=COORDS[String(selected.id)];if(coord)map.panTo([coord[0]-0.002,coord[1]],{animate:true,duration:0.4});}
const t=setTimeout(()=>{map.invalidateSize();},360);
return()=>clearTimeout(t);
},[selected]);
const zoomMap=d=>{const m=mapRef.current;if(!m)return;d>0?m.zoomIn():m.zoomOut();};
const goNearMe=()=>{navigator.geolocation?.getCurrentPosition(pos=>{const{latitude:lat,longitude:lng}=pos.coords;setUserPos({lat,lng});const m=mapRef.current;if(m)m.setView([lat,lng],15,{animate:true});});};
const reCenter=()=>{const m=mapRef.current;if(!m)return;userPos?m.setView([userPos.lat,userPos.lng],15,{animate:true}):m.setView([42.3314,-83.0458],14,{animate:true});};
const selImgFallback=selected?getVenueFallbackImage(selected):null;
const selImg=selected?(photoMap?.[String(selected.id)]||selImgFallback):null;
const CTRL={display:"flex",alignItems:"center",justifyContent:"center",background:"var(--c-mzoom-bg)",border:"none",color:"var(--c-mzoom-color)",cursor:"pointer",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",transition:"background 0.18s",padding:0,fontFamily:"'DM Sans',sans-serif"};
const PILL={fontFamily:"'DM Mono',monospace",fontSize:"0.44rem",letterSpacing:"0.12em",textTransform:"uppercase",border:"1px solid var(--c-mzoom-bdr)",color:"var(--c-mzoom-color)",background:"var(--c-mzoom-bg)",padding:"8px 15px",borderRadius:100,cursor:"pointer",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",boxShadow:"0 2px 14px rgba(0,0,0,0.22)",pointerEvents:"auto"};
return React.createElement("div",{style:{position:"fixed",top:"calc(68px + env(safe-area-inset-top))",left:0,right:0,bottom:0,display:"flex",flexDirection:"column",overflow:"hidden",zIndex:400}},
// ── Filter chip row ──
React.createElement("div",{
style:{background:"var(--c-nav-bg)",backdropFilter:"blur(14px)",WebkitBackdropFilter:"blur(14px)",borderBottom:"1px solid var(--c-mzoom-sep)",padding:"10px 16px",display:"flex",gap:8,overflowX:"auto",flexShrink:0,scrollbarWidth:"none",WebkitOverflowScrolling:"touch",touchAction:"pan-x",zIndex:600},
onTouchStart:e=>e.stopPropagation(),onTouchMove:e=>e.stopPropagation()
},
MAP_FILTER_CATS.map(c=>{
const active=mapCat===c;
const ico=MAP_CAT_ICONS[c]||"·";
return React.createElement("button",{key:c,onClick:()=>setMapCat(c),style:{display:"inline-flex",alignItems:"center",gap:5,fontFamily:"'DM Mono',monospace",fontSize:"0.5rem",letterSpacing:"0.12em",textTransform:"uppercase",border:"1px solid "+(active?"transparent":"var(--c-mzoom-bdr)"),color:active?"#0A0808":"var(--c-mzoom-color)",background:active?C.gold:"var(--c-mzoom-bg)",padding:"7px 13px",borderRadius:100,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,boxShadow:active?"0 2px 8px rgba(0,0,0,0.18)":"none",transition:"all 0.2s",fontWeight:active?500:400}},
React.createElement("span",{style:{fontSize:"0.6rem",lineHeight:1}},ico),
c==="all"?"All Venues":c
);})
),
// ── Map tile area ──
React.createElement("div",{ref:containerRef,style:{flex:1,background:"var(--c-deep)",minHeight:0}}),
// ── Custom zoom + near-me controls ──
React.createElement("div",{style:{position:"absolute",top:"calc(68px + env(safe-area-inset-top) + 56px + 16px)",left:12,display:"flex",flexDirection:"column",gap:8,zIndex:700}},
React.createElement("div",{style:{display:"flex",flexDirection:"column",borderRadius:10,overflow:"hidden",boxShadow:"0 4px 22px rgba(0,0,0,0.32)",border:"1px solid var(--c-mzoom-bdr)"}},
React.createElement("button",{onClick:()=>zoomMap(1),title:"Zoom in",style:{...CTRL,width:40,height:40,borderBottom:"1px solid var(--c-mzoom-sep)",borderRadius:0,fontSize:"1.3rem",fontWeight:300}},"+"),
React.createElement("button",{onClick:()=>zoomMap(-1),title:"Zoom out",style:{...CTRL,width:40,height:40,borderRadius:0,fontSize:"1.5rem",fontWeight:300}},"−")
),
React.createElement("button",{onClick:goNearMe,title:"Near me",style:{...CTRL,width:40,height:40,borderRadius:10,boxShadow:"0 4px 22px rgba(0,0,0,0.32)",border:"1px solid var(--c-mzoom-bdr)",display:"flex",alignItems:"center",justifyContent:"center"}},
React.createElement("svg",{viewBox:"0 0 24 24",width:18,height:18,fill:"currentColor"},
React.createElement("path",{d:"M21 3L3 10.53v.98l6.84 2.65L12.48 21h.98L21 3z"})
)
)
),
// ── Floating mini venue card ──
selected&&React.createElement("div",{
style:{position:"absolute",bottom:"calc(185px + env(safe-area-inset-bottom))",left:"50%",transform:"translateX(-50%)",zIndex:900,background:"var(--c-mzoom-bg)",backdropFilter:"blur(14px)",WebkitBackdropFilter:"blur(14px)",border:"1px solid var(--c-mzoom-bdr)",borderRadius:14,boxShadow:"0 8px 32px rgba(0,0,0,0.32)",display:"flex",alignItems:"center",padding:"10px 14px 10px 10px",gap:12,minWidth:240,maxWidth:"calc(100vw - 80px)",cursor:"pointer"},
onClick:()=>{setModalId(String(selected.id));setSelected(null);}
},
React.createElement("div",{style:{width:52,height:52,borderRadius:8,flexShrink:0,overflow:"hidden",background:"var(--c-border)"}},
selImg&&React.createElement("img",{src:selImg,alt:selected.name,style:{width:"100%",height:"100%",objectFit:"cover",display:"block"}})
),
React.createElement("div",{style:{flex:1,minWidth:0}},
(selected.badges||[]).includes("locals")&&React.createElement("span",{style:{display:"block",fontFamily:"'DM Mono',monospace",fontSize:"0.4rem",letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--c-mzoom-color)",marginBottom:2}},"Locals Know"),
React.createElement("div",{style:{fontFamily:"'Cormorant Garamond',serif",fontSize:"0.95rem",fontWeight:600,color:"var(--c-modal-title)",lineHeight:1.2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}},selected.name),
React.createElement("div",{style:{fontFamily:"'DM Mono',monospace",fontSize:"0.4rem",letterSpacing:"0.1em",color:"var(--c-mzoom-color)",marginTop:2,textTransform:"uppercase"}},selected.cat)
),
React.createElement("span",{style:{color:"var(--c-mzoom-color)",fontSize:"0.9rem",flexShrink:0,opacity:0.6,lineHeight:1}},"›")
),
// ── Bottom bar: List | Legend | Re-center ──
React.createElement("div",{style:{position:"absolute",bottom:selected?"calc(192px + env(safe-area-inset-bottom))":"calc(18px + env(safe-area-inset-bottom))",left:0,right:0,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 14px",zIndex:800,transition:"bottom 0.32s cubic-bezier(0.32,0.72,0,1)",pointerEvents:"none"}},
React.createElement("button",{onClick:()=>navTo&&navTo("explore"),style:{...PILL}},"≡  List"),
React.createElement("div",{style:{display:"flex",alignItems:"center",gap:12,border:"1px solid var(--c-mzoom-bdr)",background:"var(--c-mzoom-bg)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",borderRadius:100,padding:"8px 16px",boxShadow:"0 2px 14px rgba(0,0,0,0.22)"}},
React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6}},
React.createElement("div",{style:{width:8,height:8,borderRadius:"50%",background:C.gold,boxShadow:"0 0 6px rgba(201,168,76,0.55)"}}),
React.createElement("span",{style:{fontFamily:"'DM Mono',monospace",fontSize:"0.42rem",letterSpacing:"0.1em",color:"var(--c-mzoom-color)",textTransform:"uppercase"}},"Venues")
),
React.createElement("div",{style:{width:1,height:12,background:"var(--c-mzoom-sep)"}}),
React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6}},
React.createElement("div",{style:{width:8,height:8,borderRadius:"50%",background:C.purple,boxShadow:"0 0 6px rgba(200,174,255,0.55)"}}),
React.createElement("span",{style:{fontFamily:"'DM Mono',monospace",fontSize:"0.42rem",letterSpacing:"0.1em",color:"var(--c-mzoom-color)",textTransform:"uppercase"}},"New / Soon")
)
),
React.createElement("button",{onClick:reCenter,style:{...PILL}},"⊕  Re-center")
),
// ── Bottom sheet ──
React.createElement("div",{style:{position:"absolute",bottom:0,left:0,right:0,background:"var(--c-sheet-bg)",borderTop:"1px solid var(--c-sheet-bdr)",borderRadius:"18px 18px 0 0",zIndex:1100,transform:selected?"translateY(0)":"translateY(110%)",transition:"transform 0.32s cubic-bezier(0.32,0.72,0,1)",pointerEvents:selected?"auto":"none",willChange:"transform",boxShadow:"0 -6px 40px rgba(0,0,0,0.25)"}},
React.createElement("div",{style:{display:"flex",justifyContent:"center",paddingTop:12,paddingBottom:4}},
React.createElement("div",{style:{width:36,height:4,borderRadius:2,background:"var(--c-sheet-handle)"}})
),
selected&&React.createElement("div",{style:{padding:"10px 16px calc(14px + env(safe-area-inset-bottom))"}},
React.createElement("div",{style:{display:"flex",gap:12,alignItems:"flex-start"}},
React.createElement("div",{style:{width:64,height:64,borderRadius:8,flexShrink:0,overflow:"hidden",background:"var(--c-border)"}},
selImg&&React.createElement("img",{src:selImg,alt:selected.name,style:{width:"100%",height:"100%",objectFit:"cover",display:"block"}})
),
React.createElement("div",{style:{flex:1,minWidth:0}},
React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:2}},
React.createElement("span",{style:{fontFamily:"'DM Mono',monospace",fontSize:"0.43rem",letterSpacing:"0.14em",textTransform:"uppercase",color:C.gold}},(selected.badges||[]).includes("locals")?"Locals Know":selected.cat),
React.createElement("button",{onClick:()=>setSelected(null),style:{background:"none",border:"none",color:"var(--c-sheet-close)",fontSize:"1.1rem",cursor:"pointer",width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",padding:0,marginTop:-4,marginRight:-4,lineHeight:1,flexShrink:0}},"×")
),
React.createElement("h3",{style:{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.1rem",fontWeight:600,color:"var(--c-modal-title)",lineHeight:1.15,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}},selected.name),
React.createElement("span",{style:{fontFamily:"'DM Mono',monospace",fontSize:"0.42rem",letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--c-sheet-sub)"}},selected.hood)
)
),
React.createElement("p",{style:{fontSize:"0.75rem",color:"var(--c-sheet-body)",fontWeight:300,lineHeight:1.55,marginTop:9,marginBottom:10}},selected.desc.length>90?selected.desc.slice(0,90)+"\u2026":selected.desc),
React.createElement("div",{style:{display:"flex",gap:10}},
React.createElement("button",{onClick:()=>toggleFav(String(selected.id)),title:isFav(selected.id)?"Saved":"Save",style:{flex:"0 0 auto",width:38,height:38,display:"inline-flex",alignItems:"center",justifyContent:"center",padding:0,background:isFav(selected.id)?"rgba(201,168,76,0.15)":"var(--c-sheet-save-bg)",border:"1.5px solid "+(isFav(selected.id)?"rgba(201,168,76,0.7)":"var(--c-sheet-save-bdr)"),color:isFav(selected.id)?C.gold:"var(--c-modal-save-clr)",fontSize:"1rem",borderRadius:8,cursor:"pointer",transition:"all 0.18s"}},isFav(selected.id)?"\u2665":"\u2661"),
React.createElement("button",{onClick:()=>{setModalId(String(selected.id));setSelected(null);},style:{flex:1,padding:"9px",background:C.gold,border:"none",color:"#0A0808",fontFamily:"'DM Mono',monospace",fontSize:"0.5rem",letterSpacing:"0.1em",textTransform:"uppercase",borderRadius:8,cursor:"pointer",fontWeight:500}},"View Details")
)
)
)
);}

export default function App() {
const [section, setSection]   = useState("explore");
const [doTab,   setDoTab]     = useState("games");
const [favs,    setFavs]      = useState(()=>{try{const stored=JSON.parse(localStorage.getItem("savedSpots")||"[]");if(!Array.isArray(stored))return[];const validIds=new Set([...ALL,...UPCOMING].map(v=>String(v.id)));return stored.filter(id=>validIds.has(String(id)));}catch{return[];}});
const [cat,     setCat]       = useState("all");
const [sort,    setSort]      = useState("default");
const [modalId, setModalId]   = useState(null);
const [toast,   setToast]     = useState({ msg:"", vis:false });
const [scrolled,setScrolled]  = useState(false);
const [nearMe,  setNearMe]    = useState(false);
const [userCoords,setUserCoords]=useState(null);
const [geoError,setGeoError]  = useState(null);
const [geoModal,setGeoModal]  = useState(false);
const [theme,   setTheme]     = useState(()=>localStorage.getItem("ed-theme")||"system");
const [suggestName,setSuggestName]=useState("");
const [suggestHood,setSuggestHood]=useState("");
const [suggestNote,setSuggestNote]=useState("");
const [suggestSent,setSuggestSent]=useState(false);
const [photoMap,setPhotoMap]=useState({});
useEffect(()=>{
fetch("/api/places/venue-photos")
.then(r=>r.ok?r.json():Promise.reject(r.status))
.then(data=>{ if(data.photos&&typeof data.photos==="object") setPhotoMap(data.photos); })
.catch(()=>{});
},[]);
const filtersRef = useRef(null);
const chipRowRef = useRef(null);
const favsRef = useRef(favs);
favsRef.current = favs;
const toastTimer = useRef(null);
const gridTopRef = useRef(null);

useEffect(()=>{
const s=document.createElement('style');s.id='ed-anim';
s.textContent='@keyframes fadeSlideIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}';
document.head.appendChild(s);
return()=>{const el=document.getElementById('ed-anim');if(el)el.remove();};
},[]);
useEffect(()=>{
const fn=()=>setScrolled(window.scrollY>20);
window.addEventListener("scroll",fn);
return ()=>window.removeEventListener("scroll",fn);
},[]);
useEffect(()=>{
const fn=e=>{if(e.key==="Escape")setModalId(null);};
document.addEventListener("keydown",fn);
return ()=>document.removeEventListener("keydown",fn);
},[]);
useEffect(()=>{
if(!document.getElementById("exc-fonts")){
const l=document.createElement("link");l.id="exc-fonts";l.rel="stylesheet";l.href=FONT_URL;document.head.appendChild(l);
}
if(!document.getElementById("exc-styles")){
const s=document.createElement("style");s.id="exc-styles";
s.textContent="*{box-sizing:border-box;margin:0;padding:0}a{text-decoration:none}::-webkit-scrollbar{width:5px;background:var(--c-black)}::-webkit-scrollbar-thumb{background:var(--c-border);border-radius:3px}";
document.head.appendChild(s);
}
},[]);
useEffect(()=>{localStorage.setItem("savedSpots",JSON.stringify(favs));},[favs]);
const [savedEvents,setSavedEvents]=useState(()=>{try{return JSON.parse(localStorage.getItem("savedEvents")||"[]");}catch{return [];}});
const [savedEventMeta,setSavedEventMeta]=useState(()=>{try{return JSON.parse(localStorage.getItem("savedEventMeta")||"{}");}catch{return {};}});
const [savedHotels,setSavedHotels]=useState(()=>{try{return JSON.parse(localStorage.getItem("savedHotels")||"[]");}catch{return [];}});
useEffect(()=>{localStorage.setItem("savedEvents",JSON.stringify(savedEvents));},[savedEvents]);
useEffect(()=>{localStorage.setItem("savedEventMeta",JSON.stringify(savedEventMeta));},[savedEventMeta]);
useEffect(()=>{localStorage.setItem("savedHotels",JSON.stringify(savedHotels));},[savedHotels]);
const isSavedEvent=id=>savedEvents.includes(String(id));
const toggleSavedEvent=(id,item)=>{const sid=String(id);setSavedEvents(prev=>{if(prev.includes(sid)){setSavedEventMeta(m=>{const n={...m};delete n[sid];return n;});return prev.filter(x=>x!==sid);}else{if(item)setSavedEventMeta(m=>({...m,[sid]:item}));return[...prev,sid];}});};
const isSavedHotel=id=>savedHotels.includes(String(id));
const toggleSavedHotel=id=>{setSavedHotels(prev=>prev.includes(String(id))?prev.filter(x=>x!==String(id)):[...prev,String(id)]);};

useEffect(()=>{
const html=document.documentElement;
if(theme==="dark")html.setAttribute("data-theme","dark");
else if(theme==="light")html.setAttribute("data-theme","light");
else html.removeAttribute("data-theme");
localStorage.setItem("ed-theme",theme);
},[theme]);
useEffect(()=>{if(geoError){const t=setTimeout(()=>setGeoError(null),20000);return()=>clearTimeout(t);}},[geoError]);

const isFav = id=>favs.includes(String(id));
const showToast=useCallback(msg=>{setToast({msg,vis:true});clearTimeout(toastTimer.current);toastTimer.current=setTimeout(()=>setToast(t=>({...t,vis:false})),2200);},[]);
const toggleFav=useCallback(id=>{
const sid=String(id);
const cur=favsRef.current;
const removing=cur.includes(sid);
setFavs(removing?cur.filter(f=>f!==sid):[...cur,sid]);
showToast(removing?"Removed from saves":"♥ Saved to your list");
},[showToast]);
const goCategory=useCallback(c=>{setCat(c);setSection("explore");setTimeout(()=>{filtersRef.current?.scrollIntoView({behavior:"smooth",block:"start"});},60);},[]);
const switchCat=useCallback(c=>{const savedLeft=chipRowRef.current?.scrollLeft??0;setCat(c);requestAnimationFrame(()=>{if(chipRowRef.current)chipRowRef.current.scrollLeft=savedLeft;gridTopRef.current?.scrollIntoView({behavior:"instant",block:"start"});});},[]);
const doGetLocation=()=>{navigator.geolocation.getCurrentPosition(pos=>{setUserCoords({lat:pos.coords.latitude,lng:pos.coords.longitude});setNearMe(true);setGeoError(null);setTimeout(()=>{filtersRef.current?.scrollIntoView({behavior:"smooth",block:"start"});},120);},err=>{if(err.code===1){if(navigator.permissions){navigator.permissions.query({name:"geolocation"}).then(r=>{if(r.state==="denied")setGeoError("Location is blocked in your browser settings. Go to Settings \u2192 Browser \u2192 Location and allow this site, then try again.");else setGeoError(null);}).catch(()=>setGeoError(null));}else{setGeoError(null);}}else{setGeoError("Couldn't get your location \u2014 please try again.");}});};
const activateNearMe=()=>{setGeoError(null);if(!navigator.geolocation){setGeoError("Geolocation is not supported by your browser.");return;}if(navigator.permissions){navigator.permissions.query({name:"geolocation"}).then(r=>{if(r.state==="granted")doGetLocation();else if(r.state==="denied")setGeoError("Location is blocked in your browser settings. Go to Settings \u2192 Browser \u2192 Location and allow this site, then try again.");else setGeoModal(true);}).catch(()=>setGeoModal(true));}else{setGeoModal(true);}};
const deactivateNearMe=()=>{setNearMe(false);setUserCoords(null);setGeoError(null);};

let shown=[...ALL];
if(cat!=="all")shown=shown.filter(v=>v.cat===cat||(v.cats||[]).includes(cat)||v.hood===cat);
if(nearMe&&userCoords){shown=shown.map(v=>{const coord=COORDS[String(v.id)];if(coord){const d=haversine(userCoords.lat,userCoords.lng,coord[0],coord[1]);return{...v,distMi:d};}return v;}).sort((a,b)=>(a.distMi??999)-(b.distMi??999));}
else{if(sort==="name")shown.sort((a,b)=>a.name.localeCompare(b.name));if(sort==="hood")shown.sort((a,b)=>a.hood.localeCompare(b.hood));if(sort==="cat")shown.sort((a,b)=>a.cat.localeCompare(b.cat));}

const favVenues=[...ALL,...UPCOMING].filter(v=>isFav(v.id));
const ALL_STATIC_EVENTS=[...GAMES,...DETROIT_EVENTS,...CONCERTS];
const savedEventObjects=savedEvents.map(id=>savedEventMeta[id]||ALL_STATIC_EVENTS.find(e=>String(e.id)===String(id))).filter(Boolean);
const savedHotelObjects=savedHotels.map(id=>HOTELS.find(h=>String(h.id)===String(id))).filter(Boolean);
const totalSaves=favs.length+savedEvents.length+savedHotels.length;
const modalVenue=findItem(modalId);
const navTo=s=>{setSection(s);window.scrollTo({top:0,behavior:"smooth"});};

const ss=(prop,val)=>({[prop]:val});
const row=(children,extra={})=>React.createElement("div",{style:{display:"flex",...extra}},children);
const mono=(text,color,size="0.52rem",extra={})=>React.createElement("span",{style:{fontFamily:"'DM Mono',monospace",fontSize:size,letterSpacing:"0.14em",textTransform:"uppercase",color,...extra}},text);
const serif=(tag,text,size,extra={})=>React.createElement(tag,{style:{fontFamily:"'Cormorant Garamond',serif",fontSize:size,color:C.white,...extra}},text);

const NavBar=()=>React.createElement("nav",{style:{position:"fixed",top:0,left:0,right:0,zIndex:500,paddingTop:"env(safe-area-inset-top)",background:scrolled?"var(--c-nav-bgS)":"var(--c-nav-bg)",backdropFilter:"blur(14px)",WebkitBackdropFilter:"blur(14px)",borderBottom:"1px solid "+C.border}},
React.createElement("div",{style:{height:68,display:"flex",alignItems:"center",justifyContent:"space-between",paddingLeft:24,paddingRight:24}},
React.createElement("div",{onClick:()=>navTo("explore"),style:{cursor:"pointer",flexShrink:0}},
React.createElement("div",{style:{fontFamily:"'DM Mono',monospace",fontSize:"0.58rem",letterSpacing:"0.22em",color:C.gold,textTransform:"uppercase"}},"EXCLUSIVE"),
React.createElement("div",{style:{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.35rem",fontWeight:600,color:C.white,lineHeight:1.1}},"Detroit")
),
React.createElement("div",{style:{display:"flex",gap:8,alignItems:"center",overflow:"visible"}},
React.createElement("div",{style:{display:"flex",gap:12,alignItems:"center",overflowX:"auto",scrollbarWidth:"none",WebkitOverflowScrolling:"touch",overflow:"visible"}},
[["explore","Explore"],["map","Map"],["favorites","Saves"],["neighborhoods","Areas"],["about","About"]].map(([s,l])=>
React.createElement("button",{key:s,onClick:()=>navTo(s),style:{fontFamily:"'DM Mono',monospace",fontSize:"0.59rem",letterSpacing:"0.14em",textTransform:"uppercase",background:"none",border:"none",cursor:"pointer",padding:"4px 0",color:section===s?C.gold:C.smoke,borderBottom:section===s?"1.5px solid "+C.gold:"1.5px solid transparent",display:"inline-flex",alignItems:"center",gap:5,whiteSpace:"nowrap",flexShrink:0}},
l,
s==="favorites"&&totalSaves>0&&React.createElement("span",{style:{background:C.gold,color:C.black,borderRadius:100,padding:"1px 5px",fontSize:"0.42rem",fontWeight:700,lineHeight:"14px",minWidth:14,textAlign:"center",display:"inline-block"}},totalSaves)
)
)),
React.createElement("button",{onClick:()=>navTo("settings"),title:"Settings",style:{background:"none",border:"none",cursor:"pointer",padding:6,color:section==="settings"?C.gold:C.smoke,display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1,transition:"color 0.18s,opacity 0.18s",flexShrink:0,marginLeft:6,opacity:section==="settings"?1:0.72}},
React.createElement("svg",{width:16,height:16,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.6,strokeLinecap:"round",strokeLinejoin:"round"},
React.createElement("circle",{cx:12,cy:12,r:3}),
React.createElement("path",{d:"M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"})
)
)
)
)
);

const Hero=()=>React.createElement("div",{style:{minHeight:"66vh",display:"flex",alignItems:"center",justifyContent:"center",paddingTop:0,background:"var(--c-hero-bg)",position:"relative",overflow:"hidden"}},
React.createElement("div",{style:{position:"absolute",inset:0,backgroundImage:"url(/detroit-skyline.png)",backgroundSize:"cover",backgroundPosition:"center 40%",opacity:0.13,pointerEvents:"none"}}),
React.createElement("div",{style:{position:"absolute",inset:0,background:"linear-gradient(to bottom,rgba(4,3,7,0.35) 0%,transparent 40%,transparent 70%,rgba(4,3,7,0.55) 100%)",pointerEvents:"none"}}),
React.createElement("div",{style:{position:"absolute",inset:0,opacity:0.35,pointerEvents:"none"}},
React.createElement("div",{style:{position:"absolute",width:500,height:500,top:"10%",left:"5%",borderRadius:"50%",background:"radial-gradient(circle,rgba(201,168,76,0.12) 0%,transparent 70%)"}}),
React.createElement("div",{style:{position:"absolute",width:400,height:400,bottom:"5%",right:"5%",borderRadius:"50%",background:"radial-gradient(circle,rgba(110,75,195,0.09) 0%,transparent 70%)"}})
),
React.createElement("div",{style:{position:"relative",zIndex:2,maxWidth:680,padding:"36px 22px 18px",textAlign:"center"}},
React.createElement("p",{style:{fontFamily:"'DM Mono',monospace",fontSize:"0.55rem",letterSpacing:"0.26em",textTransform:"uppercase",color:C.gold,marginBottom:16}},"If you know, you know."),
React.createElement("h1",{style:{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(2.8rem,7vw,5.5rem)",fontWeight:300,lineHeight:0.92,color:C.white,marginBottom:20}},
"Detroit",React.createElement("br"),React.createElement("em",{style:{fontStyle:"italic",color:C.goldL}},"Hidden Spots")
),
React.createElement("p",{style:{fontSize:"0.9rem",fontWeight:300,color:"var(--c-hero-sub)",maxWidth:480,margin:"0 auto 26px",lineHeight:1.82}},"The insider's guide to Detroit's most exclusive dining, cocktails, experiences, and hidden gems. Not for everyone — made for you."),
React.createElement("div",{style:{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}},
["Breakfast","Sports","Hidden Bars","Rooftops","Dinner","Happy Hour","Cocktail Lounges","Nightlife"].map(c=>
React.createElement("button",{key:c,onClick:()=>goCategory(c),style:{fontFamily:"'DM Mono',monospace",fontSize:"0.52rem",letterSpacing:"0.11em",textTransform:"uppercase",border:"1px solid "+(cat===c?C.gold:"rgba(201,168,76,0.32)"),color:cat===c?C.black:C.goldL,background:cat===c?C.gold:"transparent",padding:"7px 14px",borderRadius:100,cursor:"pointer",transition:"all 0.18s"}},c)
)
),
React.createElement("div",{style:{display:"flex",gap:10,justifyContent:"center",marginTop:20,flexWrap:"wrap"}},
React.createElement("button",{onClick:activateNearMe,style:{fontFamily:"'DM Mono',monospace",fontSize:"0.52rem",letterSpacing:"0.12em",textTransform:"uppercase",border:"1px solid "+C.purple,color:C.purple,background:"rgba(200,174,255,0.08)",padding:"9px 20px",borderRadius:100,cursor:"pointer"}},"◉ Near Me"),
React.createElement("button",{onClick:()=>navTo("map"),style:{fontFamily:"'DM Mono',monospace",fontSize:"0.52rem",letterSpacing:"0.12em",textTransform:"uppercase",border:"1px solid "+C.purple,color:C.purple,background:"rgba(200,174,255,0.08)",padding:"9px 20px",borderRadius:100,cursor:"pointer"}},"View Map →")
),
React.createElement("div",{style:{display:"flex",gap:10,justifyContent:"center",marginTop:56,flexWrap:"wrap"}},
React.createElement("button",{onClick:()=>{setDoTab("games");navTo("things-to-do");},style:{fontFamily:"'DM Mono',monospace",fontSize:"0.57rem",letterSpacing:"0.11em",textTransform:"uppercase",border:"1.5px solid rgba(232,224,212,0.65)",color:C.bone,background:"rgba(232,224,212,0.13)",padding:"10px 22px",borderRadius:100,cursor:"pointer",boxShadow:"0 2px 14px rgba(0,0,0,0.22)",transition:"all 0.2s"}},"🏟 Sports Tickets"),
React.createElement("button",{onClick:()=>{setDoTab("events");navTo("things-to-do");},style:{fontFamily:"'DM Mono',monospace",fontSize:"0.57rem",letterSpacing:"0.11em",textTransform:"uppercase",border:"1.5px solid rgba(232,224,212,0.65)",color:C.bone,background:"rgba(232,224,212,0.13)",padding:"10px 22px",borderRadius:100,cursor:"pointer",boxShadow:"0 2px 14px rgba(0,0,0,0.22)",transition:"all 0.2s"}},"🎟 Events"),
React.createElement("button",{onClick:()=>navTo("stay"),style:{fontFamily:"'DM Mono',monospace",fontSize:"0.57rem",letterSpacing:"0.11em",textTransform:"uppercase",border:"1.5px solid rgba(232,224,212,0.65)",color:C.bone,background:"rgba(232,224,212,0.13)",padding:"10px 22px",borderRadius:100,cursor:"pointer",boxShadow:"0 2px 14px rgba(0,0,0,0.22)",transition:"all 0.2s"}},"🏨 Hotel Stays")
)
)
);

const GeoModal=()=>!geoModal?null:React.createElement("div",{style:{position:"fixed",inset:0,zIndex:9999,background:"rgba(5,4,8,0.88)",backdropFilter:"blur(14px)",WebkitBackdropFilter:"blur(14px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"0 24px"},onClick:()=>{setGeoModal(false);setGeoError(null);}},
React.createElement("div",{style:{background:C.deep,border:"1px solid rgba(201,168,76,0.28)",borderRadius:22,padding:"44px 32px 36px",maxWidth:360,width:"100%",textAlign:"center",position:"relative",boxShadow:"0 32px 80px rgba(0,0,0,0.7)"},onClick:e=>e.stopPropagation()},
React.createElement("div",{style:{width:44,height:44,borderRadius:"50%",border:"1px solid rgba(201,168,76,0.35)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 22px",color:C.gold,fontSize:"1.1rem"}},"◎"),
React.createElement("h3",{style:{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.4rem",fontWeight:400,color:C.white,lineHeight:1.3,marginBottom:14}},"Allow Exclusive Detroit to use your location?"),
React.createElement("p",{style:{fontSize:"0.84rem",fontWeight:300,color:C.ash,lineHeight:1.78,marginBottom:18}},"We use your location to show the best nearby spots and sort results closest to you."),
React.createElement("p",{style:{fontFamily:"'DM Mono',monospace",fontSize:"0.43rem",letterSpacing:"0.09em",textTransform:"uppercase",color:"var(--c-geo-hint)",lineHeight:1.7,marginBottom:26}},"Next, your browser will ask to confirm access."),
React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:10}},
React.createElement("button",{onClick:()=>{setGeoModal(false);doGetLocation();},style:{fontFamily:"'DM Mono',monospace",fontSize:"0.52rem",letterSpacing:"0.15em",textTransform:"uppercase",background:C.gold,color:"#0A0808",border:"none",borderRadius:100,padding:"14px 0",cursor:"pointer",width:"100%",fontWeight:600}},"Continue"),
React.createElement("button",{onClick:()=>{setGeoModal(false);setGeoError(null);},style:{fontFamily:"'DM Mono',monospace",fontSize:"0.52rem",letterSpacing:"0.15em",textTransform:"uppercase",background:"transparent",color:C.smoke,border:"1px solid "+C.border,borderRadius:100,padding:"13px 0",cursor:"pointer",width:"100%"}},"Not Now")
)
)
);

const grid=(items,onOpen,animKey)=>React.createElement("div",{key:animKey,style:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:15}},
items.map((v,i)=>React.createElement(VCard,{key:String(v.id),venue:v,isFav:isFav(v.id),onFav:toggleFav,onOpen,i,photoMap}))
);

const Explore=()=>React.createElement("div",null,
React.createElement(Hero),
React.createElement("div",{style:{background:C.deep,borderTop:"1px solid "+C.border,borderBottom:"1px solid "+C.border,padding:"20px 24px"}},
React.createElement("div",{style:{maxWidth:800,margin:"0 auto",textAlign:"center",display:"flex",alignItems:"center",gap:16,justifyContent:"center",flexWrap:"wrap"}},
React.createElement("span",{style:{color:C.goldD}},"◈"),
React.createElement("p",{style:{fontFamily:"'Cormorant Garamond',serif",fontSize:"1rem",fontStyle:"italic",color:C.bone,lineHeight:1.65}},
"This is Detroit ",React.createElement("em",{style:{color:C.goldL,fontStyle:"normal"}},"beyond")," the obvious. Every spot here rewards curiosity — the traveler who wanders off the main drag, asks the bartender for a real recommendation, and stays past midnight."
),
React.createElement("span",{style:{color:C.goldD}},"◈")
)
),
UPCOMING.length>0&&React.createElement("div",{style:{background:"var(--c-grad-new)",borderBottom:"1px solid "+C.border,paddingBottom:48}},
React.createElement("div",{style:{maxWidth:1200,margin:"0 auto",padding:"0 22px"}},
React.createElement("div",{style:{paddingTop:44,paddingBottom:24}},
React.createElement("div",{style:{display:"flex",alignItems:"center",gap:14,marginBottom:10}},
React.createElement("span",{style:{fontFamily:"'DM Mono',monospace",fontSize:"0.53rem",letterSpacing:"0.22em",textTransform:"uppercase",color:C.purple}},"New & Noteworthy"),
React.createElement("div",{style:{flex:1,height:1,background:"rgba(110,75,195,0.25)"}})
),
React.createElement("h2",{style:{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(1.6rem,4vw,2.5rem)",fontWeight:400,color:C.white}},"Opening Soon in Detroit")
),
React.createElement("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:15}},
UPCOMING.map((v,i)=>React.createElement(UCard,{key:v.id,venue:v,i,onOpen:setModalId,isFav:isFav(v.id),onFav:toggleFav,photoMap}))
)
)
),
React.createElement("div",{ref:filtersRef,style:{position:"sticky",top:"calc(68px + env(safe-area-inset-top))",zIndex:200,background:C.black,borderBottom:"1px solid "+C.border,padding:"12px 0 0"}},
React.createElement("div",{style:{maxWidth:1200,margin:"0 auto",padding:"0 22px"}},
React.createElement("div",{ref:chipRowRef,style:{display:"flex",gap:7,overflowX:"auto",paddingBottom:12,scrollbarWidth:"none"}},
CATS.map(c=>{
const active=c===cat;
return React.createElement("button",{key:c,onClick:()=>switchCat(c),style:{fontFamily:"'DM Mono',monospace",fontSize:"0.52rem",letterSpacing:"0.11em",textTransform:"uppercase",padding:"6px 14px",border:"1.5px solid "+(active?C.gold:"var(--c-filter-bdr)"),background:active?C.gold:"transparent",color:active?C.black:C.ash,borderRadius:100,whiteSpace:"nowrap",cursor:"pointer",transition:"all 0.16s"}},c==="all"?"All Spots":c);
})),
React.createElement("div",{style:{paddingBottom:10,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}},
nearMe?React.createElement("button",{onClick:deactivateNearMe,style:{fontFamily:"'DM Mono',monospace",fontSize:"0.5rem",letterSpacing:"0.1em",textTransform:"uppercase",border:"1px solid "+C.purple,color:C.black,background:C.purple,padding:"5px 12px",borderRadius:100,cursor:"pointer"}},"◉ Near Me ×"):React.createElement("button",{onClick:activateNearMe,style:{fontFamily:"'DM Mono',monospace",fontSize:"0.5rem",letterSpacing:"0.1em",textTransform:"uppercase",border:"1px solid "+C.border,color:C.smoke,background:"transparent",padding:"5px 12px",borderRadius:100,cursor:"pointer"}},"◉ Near Me"),
nearMe&&userCoords&&React.createElement("span",{style:{fontFamily:"'DM Mono',monospace",fontSize:"0.46rem",color:C.purple,letterSpacing:"0.08em"}},"Sorted by distance"),
geoError&&!nearMe&&React.createElement("span",{style:{fontSize:"0.73rem",color:"#E8A0A0",fontWeight:300}},geoError)
)
)
),
React.createElement("div",{ref:gridTopRef,style:{borderBottom:"1px solid "+C.borderS,padding:"9px 0"}},
React.createElement("div",{style:{maxWidth:1200,margin:"0 auto",padding:"0 22px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}},
React.createElement("span",{style:{fontFamily:"'DM Mono',monospace",fontSize:"0.52rem",color:C.smoke}},shown.length+" venue"+(shown.length!==1?"s":"")+(nearMe?"":(cat!=="all"?" in "+cat:""))),
!nearMe&&React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8}},
React.createElement("span",{style:{fontFamily:"'DM Mono',monospace",fontSize:"0.5rem",textTransform:"uppercase",color:C.smoke}},"Sort"),
React.createElement("select",{value:sort,onChange:e=>setSort(e.target.value),style:{background:C.card,border:"1px solid "+C.border,color:C.bone,padding:"4px 10px",fontSize:"0.72rem",borderRadius:5,outline:"none",cursor:"pointer"}},
React.createElement("option",{value:"default"},"Featured"),
React.createElement("option",{value:"name"},"Name A-Z"),
React.createElement("option",{value:"hood"},"Neighborhood"),
React.createElement("option",{value:"cat"},"Category")
)
)
)
),
React.createElement("div",{style:{maxWidth:1200,margin:"0 auto",padding:"24px 22px 56px"}},
nearMe&&userCoords&&React.createElement("div",{style:{marginBottom:18}},
React.createElement("p",{style:{fontFamily:"'DM Mono',monospace",fontSize:"0.52rem",letterSpacing:"0.18em",textTransform:"uppercase",color:C.purple,marginBottom:4}},"◉ Closest to You"),
React.createElement("p",{style:{fontSize:"0.78rem",color:C.smoke,fontWeight:300}},shown.length+" venue"+(shown.length!==1?"s":"")+" sorted by distance from your location.")),
shown.length===0
?React.createElement("div",{style:{textAlign:"center",padding:"56px 20px",color:C.smoke,fontFamily:"'Cormorant Garamond',serif",fontSize:"1.1rem",fontStyle:"italic"}},"No venues in this category.")
:grid(shown,setModalId,cat+(nearMe?"_near":"_all"))
)
);

const Favs=({savedVenues,savedEventItems,savedHotelItems})=>{
const allEmpty=savedVenues.length===0&&savedEventItems.length===0&&savedHotelItems.length===0;
const multiSec=(savedVenues.length>0?1:0)+(savedEventItems.length>0?1:0)+(savedHotelItems.length>0?1:0)>1;
const itemGrid=(items)=>React.createElement("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:15}},items);
const secHdr=(txt)=>React.createElement("div",{style:{display:"flex",alignItems:"center",gap:12,marginBottom:18,marginTop:4}},
React.createElement("span",{style:{fontFamily:"'DM Mono',monospace",fontSize:"0.5rem",letterSpacing:"0.2em",textTransform:"uppercase",color:C.goldD}},txt),
React.createElement("div",{style:{flex:1,height:1,background:"rgba(201,168,76,0.18)"}})
);
const evtCard=(item)=>{const cta=getTicketCTA(item);
const label=item.title||(item.team+" vs. "+item.opponent);
const badge=item.sport||item.category||"Event";
return React.createElement("div",{key:item.id,style:{background:"var(--c-card)",borderRadius:10,overflow:"hidden",border:"1px solid "+C.border}},
item.image&&React.createElement("img",{src:item.image,alt:"",loading:"lazy",style:{width:"100%",height:130,objectFit:"cover",display:"block"}}),
React.createElement("div",{style:{padding:"13px 14px"}},
React.createElement("div",{style:{fontFamily:"'DM Mono',monospace",fontSize:"0.47rem",letterSpacing:"0.14em",textTransform:"uppercase",color:C.gold,marginBottom:5}},badge),
React.createElement("div",{style:{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.05rem",fontWeight:600,color:C.white,lineHeight:1.2,marginBottom:5}},label),
React.createElement("div",{style:{fontSize:"0.76rem",color:C.smoke,fontWeight:300,marginBottom:cta?10:0}},item.venue+(item.date?" · "+fmtDate(item.date):"")),
cta&&React.createElement("a",{href:cta.url,target:"_blank",rel:"noopener noreferrer",style:{display:"inline-block",background:C.gold,color:C.black,fontFamily:"'DM Mono',monospace",fontSize:"0.52rem",letterSpacing:"0.12em",textTransform:"uppercase",padding:"7px 14px",borderRadius:5,fontWeight:500,textDecoration:"none"}},cta.label)
));};
const hotelCard=(h)=>{const cta=getBookingCTA(h);
return React.createElement("div",{key:h.id,style:{background:"var(--c-card)",borderRadius:10,overflow:"hidden",border:"1px solid "+C.border}},
h.image&&React.createElement("img",{src:h.image,alt:"",loading:"lazy",style:{width:"100%",height:130,objectFit:"cover",display:"block"}}),
React.createElement("div",{style:{padding:"13px 14px"}},
React.createElement("div",{style:{fontFamily:"'DM Mono',monospace",fontSize:"0.47rem",letterSpacing:"0.14em",textTransform:"uppercase",color:C.gold,marginBottom:5}},h.hood+" · Hotel"),
React.createElement("div",{style:{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.05rem",fontWeight:600,color:C.white,lineHeight:1.2,marginBottom:4}},h.name),
React.createElement("div",{style:{fontSize:"0.76rem",color:C.smoke,fontWeight:300,marginBottom:cta?10:0}},h.price_from||""),
cta&&React.createElement("a",{href:cta.url,target:"_blank",rel:"noopener noreferrer",style:{display:"inline-block",background:C.gold,color:C.black,fontFamily:"'DM Mono',monospace",fontSize:"0.52rem",letterSpacing:"0.12em",textTransform:"uppercase",padding:"7px 14px",borderRadius:5,fontWeight:500,textDecoration:"none"}},cta.label)
));};
return React.createElement("div",null,
React.createElement("div",{style:{background:"var(--c-grad-favs)",padding:"64px 22px 40px",borderBottom:"1px solid "+C.border}},
React.createElement("p",{style:{fontFamily:"'DM Mono',monospace",fontSize:"0.53rem",letterSpacing:"0.22em",textTransform:"uppercase",color:C.gold,marginBottom:8}},"Your Collection"),
React.createElement("h2",{style:{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(1.8rem,5vw,3rem)",fontWeight:400,color:C.white,marginBottom:8}},"Saved Spots"),
React.createElement("p",{style:{fontSize:"0.84rem",color:C.smoke}},"Your personal insider list.")
),
React.createElement("div",{style:{maxWidth:1200,margin:"0 auto",padding:"24px 22px 56px"}},
allEmpty
?React.createElement("div",{style:{textAlign:"center",padding:"56px 20px"}},
React.createElement("div",{style:{fontSize:"2rem",color:C.goldD,marginBottom:16}},"◈"),
React.createElement("h3",{style:{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.6rem",fontWeight:400,color:C.white,marginBottom:9}},"Nothing saved yet"),
React.createElement("p",{style:{color:C.smoke,fontSize:"0.82rem",marginBottom:20}},"Browse spots and tap the heart to build your list."),
React.createElement("button",{onClick:()=>navTo("explore"),style:{fontFamily:"'DM Mono',monospace",fontSize:"0.58rem",letterSpacing:"0.14em",textTransform:"uppercase",color:C.gold,border:"1px solid "+C.goldD,padding:"9px 20px",borderRadius:6,background:"transparent",cursor:"pointer"}},"Back to Explore")
)
:React.createElement(React.Fragment,null,
savedVenues.length>0&&React.createElement("div",{style:{marginBottom:multiSec&&(savedEventItems.length>0||savedHotelItems.length>0)?44:0}},
multiSec&&secHdr("Saved Spots"),
grid(savedVenues,setModalId)
),
savedEventItems.length>0&&React.createElement("div",{style:{marginBottom:savedHotelItems.length>0?44:0}},
secHdr("Events & Tickets"),
itemGrid(savedEventItems.map(evtCard))
),
savedHotelItems.length>0&&React.createElement("div",null,
secHdr("Hotel Stays"),
itemGrid(savedHotelItems.map(hotelCard))
)
)
)
);
};

const HOODS=[
{k:"Downtown",       d:"The Belt, rooftop bars, speakeasies, and the city's most storied hotel lounges. Start here."},
{k:"Midtown",        d:"Art museums, craft cocktail bars, and the city's most walkable nightlife."},
{k:"Corktown",       d:"Detroit's oldest neighborhood - breweries, wine bars, and Michigan Central Station."},
{k:"Eastern Market", d:"Saturday mornings and late-night raves. A neighborhood with a double life."},
{k:"Alley Spots",    d:"The Belt - a mural-covered downtown alley turned open-air social hub."},
];
const Areas=()=>React.createElement("div",null,
React.createElement("div",{style:{background:C.deep,padding:"64px 22px 40px",borderBottom:"1px solid "+C.border}},
React.createElement("p",{style:{fontFamily:"'DM Mono',monospace",fontSize:"0.53rem",letterSpacing:"0.22em",textTransform:"uppercase",color:C.gold,marginBottom:8}},"Navigate by Area"),
React.createElement("h2",{style:{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(1.8rem,5vw,3rem)",fontWeight:400,color:C.white,marginBottom:8}},"Detroit Neighborhoods"),
React.createElement("p",{style:{fontSize:"0.84rem",color:C.smoke}},"Each pocket of the city has its own energy.")
),
React.createElement("div",{style:{maxWidth:1200,margin:"0 auto",padding:"24px 22px 56px"}},
React.createElement("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:14}},
HOODS.map(h=>{
const cnt=ALL.filter(v=>v.hood===h.k||v.cat===h.k).length;
return React.createElement("div",{key:h.k,onClick:()=>goCategory(h.k),style:{background:C.card,border:"1px solid "+C.border,borderRadius:12,padding:"20px 18px",cursor:"pointer",transition:"all 0.22s"},onMouseEnter:e=>{e.currentTarget.style.borderColor=C.goldD;e.currentTarget.style.transform="translateY(-3px)";},onMouseLeave:e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform="none";}},
React.createElement("div",{style:{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.2rem",fontWeight:600,color:C.white,marginBottom:7}},h.k),
React.createElement("div",{style:{fontSize:"0.76rem",color:C.ash,fontWeight:300,lineHeight:1.55,marginBottom:11}},h.d),
React.createElement("div",{style:{fontFamily:"'DM Mono',monospace",fontSize:"0.5rem",letterSpacing:"0.14em",textTransform:"uppercase",color:C.gold}},cnt+" venue"+(cnt!==1?"s":"")+" →")
);
})
)
)
);

const About=()=>React.createElement("div",null,
React.createElement("div",{style:{background:C.deep,padding:"64px 22px 40px",borderBottom:"1px solid "+C.border}},
React.createElement("p",{style:{fontFamily:"'DM Mono',monospace",fontSize:"0.53rem",letterSpacing:"0.22em",textTransform:"uppercase",color:C.gold,marginBottom:8}},"The City Brief"),
React.createElement("h2",{style:{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(1.8rem,5vw,3rem)",fontWeight:400,color:C.white}},"About Detroit")
),
React.createElement("div",{style:{maxWidth:700,margin:"0 auto",padding:"40px 22px 56px",display:"flex",flexDirection:"column",gap:36}},
[["Detroit Is Not What You Think","Forget the headlines. Detroit has quietly become one of the most interesting cities in America for food, nightlife, art, and architecture. The people who know, know."],
["When to Visit","Late May through October is peak season. Summer rooftops are unmatched. Winter has its own moody energy - the speakeasies hit different when it's snowing outside. Jazz Fest in September. Movement Electronic Music Festival in May."],
["Getting Around","Downtown is walkable. Midtown is a short Uber from Downtown. Corktown is 10 minutes west. The QLine connects Midtown to Downtown."],
["The Vibe","Detroit has a no-pretense, no-velvet-rope energy. But the hidden spots reward those who seek them out. Dress well. Tip well. Ask the bartender what they're drinking."]
].map(([t,b])=>React.createElement("div",{key:t},
React.createElement("h3",{style:{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.45rem",fontWeight:400,color:C.white,marginBottom:10}},t),
React.createElement("p",{style:{fontSize:"0.88rem",color:C.ash,fontWeight:300,lineHeight:1.85}},b)
)),
React.createElement("div",null,
React.createElement("h3",{style:{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.45rem",fontWeight:400,color:C.white,marginBottom:13}},"Traveler Tips"),
React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:10}},
["Most bars open late - don't show up at 9pm expecting a crowd.","Eastern Market on Saturday morning is non-negotiable.","The Belt alley is best explored at dusk or after dark.","Corktown has the best brunch. Full stop.","Always verify hours before visiting."].map(t=>
React.createElement("div",{key:t,style:{display:"flex",gap:10,alignItems:"flex-start"}},
React.createElement("span",{style:{color:C.goldD,fontSize:"0.7rem",marginTop:3,flexShrink:0}},"→"),
React.createElement("span",{style:{fontSize:"0.84rem",color:C.ash,fontWeight:300,lineHeight:1.65}},t)
)
)
)
)
)
);

const inputStyle={background:"transparent",border:"1px solid var(--c-input-bdr)",borderRadius:8,padding:"11px 14px",fontSize:"0.88rem",color:C.white,outline:"none",fontFamily:"'DM Sans',sans-serif",width:"100%",boxSizing:"border-box"};
const settingsCard=(children)=>React.createElement("div",{style:{background:C.card,border:"1px solid "+C.border,borderRadius:12,overflow:"hidden"}},children);
const settingsHeader=(label)=>React.createElement("div",{style:{padding:"16px 20px",borderBottom:"1px solid "+C.borderS}},
React.createElement("p",{style:{fontFamily:"'DM Mono',monospace",fontSize:"0.51rem",letterSpacing:"0.2em",textTransform:"uppercase",color:C.goldL,fontWeight:500,margin:0}},label)
);
const Settings=()=>React.createElement("div",null,
React.createElement("div",{style:{background:C.deep,padding:"64px 22px 40px",borderBottom:"1px solid "+C.border}},
React.createElement("p",{style:{fontFamily:"'DM Mono',monospace",fontSize:"0.53rem",letterSpacing:"0.22em",textTransform:"uppercase",color:C.gold,marginBottom:8}},"Preferences"),
React.createElement("h2",{style:{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(1.8rem,5vw,3rem)",fontWeight:400,color:C.white,margin:0}},"Settings")
),
React.createElement("div",{style:{maxWidth:560,margin:"0 auto",padding:"32px 22px 64px",display:"flex",flexDirection:"column",gap:12}},
settingsCard(React.createElement(React.Fragment,null,
settingsHeader("Appearance"),
React.createElement("div",{style:{padding:"16px 20px 20px"}},
React.createElement("p",{style:{fontSize:"0.8rem",color:C.ash,fontWeight:300,lineHeight:1.6,marginBottom:14,margin:"0 0 14px"}},"Choose how the app looks. Auto follows your device setting."),
React.createElement("div",{style:{display:"flex",gap:8,flexWrap:"wrap"}},
[["system","◑  Auto"],["light","☀  Light"],["dark","◉  Dark"]].map(function(pair){
var val=pair[0],lbl=pair[1];
return React.createElement("button",{key:val,onClick:function(){setTheme(val);},style:{fontFamily:"'DM Mono',monospace",fontSize:"0.52rem",letterSpacing:"0.12em",textTransform:"uppercase",padding:"9px 18px",borderRadius:100,border:"1px solid "+(theme===val?C.gold:C.border),background:theme===val?"rgba(201,168,76,0.12)":"transparent",color:theme===val?C.gold:C.smoke,cursor:"pointer",transition:"all 0.2s"}},lbl);
})
)
)
)),
suggestSent
?settingsCard(React.createElement("div",{style:{padding:"32px 20px",textAlign:"center"}},
React.createElement("div",{style:{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.8rem",color:C.gold,marginBottom:8}},"✓"),
React.createElement("p",{style:{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.2rem",fontWeight:400,color:C.white,marginBottom:6,margin:"0 0 6px"}},"Thanks for the tip."),
React.createElement("p",{style:{fontSize:"0.8rem",color:C.smoke,fontWeight:300,margin:"0 0 18px"}},"We'll look into it and add the best ones."),
React.createElement("button",{onClick:function(){setSuggestSent(false);setSuggestName("");setSuggestHood("");setSuggestNote("");},style:{fontFamily:"'DM Mono',monospace",fontSize:"0.5rem",letterSpacing:"0.12em",textTransform:"uppercase",padding:"8px 18px",borderRadius:100,border:"1px solid "+C.border,color:C.smoke,background:"transparent",cursor:"pointer"}},"Submit Another")
))
:settingsCard(React.createElement(React.Fragment,null,
settingsHeader("Suggest a Spot"),
React.createElement("div",{style:{padding:"16px 20px 20px",display:"flex",flexDirection:"column",gap:12}},
React.createElement("p",{style:{fontSize:"0.8rem",color:C.ash,fontWeight:300,lineHeight:1.6,margin:0}},"Know a hidden gem we're missing? Tell us about it."),
React.createElement("input",{type:"text",placeholder:"Venue name",value:suggestName,onChange:function(e){setSuggestName(e.target.value);},style:inputStyle}),
React.createElement("input",{type:"text",placeholder:"Neighborhood (optional)",value:suggestHood,onChange:function(e){setSuggestHood(e.target.value);},style:inputStyle}),
React.createElement("textarea",{placeholder:"Why should it be on the list?",value:suggestNote,onChange:function(e){setSuggestNote(e.target.value);},rows:3,style:Object.assign({},inputStyle,{resize:"vertical",lineHeight:1.6})}),
React.createElement("button",{
onClick:function(){
if(!suggestName.trim())return;
var subj="Spot Suggestion: "+suggestName.trim();
var body="Venue: "+suggestName.trim()+"\nNeighborhood: "+(suggestHood.trim()||"—")+"\nNotes: "+(suggestNote.trim()||"—");
window.open("mailto:hello@exclusivedetroitapp.com?subject="+encodeURIComponent(subj)+"&body="+encodeURIComponent(body));
setSuggestSent(true);
},
style:{fontFamily:"'DM Mono',monospace",fontSize:"0.52rem",letterSpacing:"0.12em",textTransform:"uppercase",padding:"10px 22px",borderRadius:100,border:"none",background:C.gold,color:C.black,cursor:"pointer",transition:"all 0.2s",alignSelf:"flex-start",fontWeight:500}
},"Send Suggestion →")
)
)),
settingsCard(React.createElement(React.Fragment,null,
settingsHeader("Share the App"),
React.createElement("div",{style:{padding:"16px 20px 20px"}},
React.createElement("p",{style:{fontSize:"0.8rem",color:C.ash,fontWeight:300,lineHeight:1.6,margin:"0 0 16px"}},"If you know, you know — pass the guide to someone who deserves it."),
React.createElement("button",{
onClick:function(){
var d={title:"Exclusive Detroit",text:"The insider's guide to Detroit's hidden bars, rooftops & nightlife.",url:"https://www.exclusivedetroitapp.com"};
if(navigator.share){navigator.share(d);}
else{navigator.clipboard.writeText("https://www.exclusivedetroitapp.com").then(function(){showToast("Link copied!");});}
},
style:{fontFamily:"'DM Mono',monospace",fontSize:"0.52rem",letterSpacing:"0.12em",textTransform:"uppercase",padding:"10px 22px",borderRadius:100,border:"none",background:C.gold,color:C.black,cursor:"pointer",transition:"all 0.2s",display:"inline-flex",alignItems:"center",gap:10,fontWeight:500}
},
React.createElement("span",{style:{fontSize:"1rem",lineHeight:1}},"↑"),
React.createElement("span",null,"Share Exclusive Detroit")
)
)
)),
React.createElement("p",{style:{fontFamily:"'DM Mono',monospace",fontSize:"0.44rem",letterSpacing:"0.1em",textTransform:"uppercase",color:C.smoke,textAlign:"center",paddingTop:8}},"Detroit Edition v5.0")
)
);

return React.createElement("div",{style:{background:C.black,color:C.bone,fontFamily:"'DM Sans',sans-serif",minHeight:"100dvh",fontSize:15,lineHeight:1.6}},
NavBar(),
React.createElement("div",{style:{paddingTop:"calc(68px + env(safe-area-inset-top))"}},
section==="explore"       && Explore(),
section==="map"           && React.createElement(MapView,{isFav,toggleFav,setModalId,modalId,navTo,photoMap}),
section==="favorites"     && Favs({savedVenues:favVenues,savedEventItems:savedEventObjects,savedHotelItems:savedHotelObjects}),
section==="neighborhoods" && Areas(),
section==="about"         && About(),
section==="settings"      && Settings(),
section==="things-to-do"  && React.createElement(ThingsToDo,{isSavedEvent,toggleSavedEvent,initialTab:doTab,onBack:()=>navTo("explore")}),
section==="stay"          && React.createElement(Stay,{isSavedHotel,toggleSavedHotel,onBack:()=>navTo("explore")})
),
section!=="map"&&section!=="settings"&&React.createElement("footer",{style:{background:C.deep,borderTop:"1px solid "+C.border,padding:"36px 22px 24px"}},
React.createElement("div",{style:{maxWidth:1200,margin:"0 auto"}},
React.createElement("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:28,paddingBottom:24,borderBottom:"1px solid "+C.border}},
React.createElement("div",null,
React.createElement("div",{style:{fontFamily:"'DM Mono',monospace",fontSize:"0.48rem",letterSpacing:"0.22em",color:C.gold,textTransform:"uppercase"}},"EXCLUSIVE"),
React.createElement("div",{style:{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.15rem",fontWeight:600,color:C.white,marginBottom:8}},"Detroit"),
React.createElement("p",{style:{fontSize:"0.76rem",color:C.smoke,fontWeight:300,lineHeight:1.6}},"The insider's guide to Detroit's hidden nightlife, bars, lounges, and experiences.")
),
React.createElement("div",null,
React.createElement("div",{style:{fontFamily:"'DM Mono',monospace",fontSize:"0.5rem",letterSpacing:"0.18em",textTransform:"uppercase",color:C.gold,marginBottom:9}},"Coming to Other Cities"),
["Chicago","New York","Miami","Las Vegas","Atlanta"].map(c=>React.createElement("div",{key:c,style:{fontSize:"0.78rem",color:C.smoke,padding:"4px 0",borderBottom:"1px solid "+C.borderS}},c))
),
React.createElement("p",{style:{fontSize:"0.73rem",color:C.smoke,fontWeight:300,lineHeight:1.7,fontStyle:"italic"}},"All venue info should be verified before visiting. Hours and availability change.")
),
React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:16,fontFamily:"'DM Mono',monospace",fontSize:"0.5rem",letterSpacing:"0.1em",textTransform:"uppercase",color:C.smoke}},
React.createElement("span",null,"2026 Exclusive City Guides"),
React.createElement("div",{style:{display:"flex",gap:18,alignItems:"center"}},
React.createElement("a",{href:"/privacy",style:{fontFamily:"'DM Mono',monospace",fontSize:"0.5rem",letterSpacing:"0.1em",textTransform:"uppercase",color:C.smoke,textDecoration:"none"}},"Privacy Policy"),
React.createElement("span",null,"Detroit Edition v5.0")
)
)
)
),
GeoModal(),
modalId!==null&&React.createElement(Modal,{venue:modalVenue,isFav:isFav(modalId),onFav:toggleFav,onClose:()=>setModalId(null),photoMap}),
React.createElement(Toast,{msg:toast.msg,vis:toast.vis})
);
}