import React, { useState, useEffect, useCallback, useRef } from "react";
import L from "leaflet";

const FONT_URL = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap";

const C = {
black:"#0A0A0A", deep:"#111111", card:"#161616", border:"#242424", borderS:"#1E1E1E",
gold:"#C9A84C", goldL:"#E2C97E", goldD:"#8A6F30",
smoke:"#6A6A6A", ash:"#9A9A9A", bone:"#E8E0D4", white:"#F5F2EE", purple:"#C8AEFF",
};

const BD = {
hidden:    { bg:"rgba(201,168,76,0.18)", color:"#E2C97E", border:"rgba(201,168,76,0.4)",   label:"Hidden Gem" },
locals:    { bg:"rgba(139,58,58,0.3)",   color:"#E8A0A0", border:"rgba(139,58,58,0.5)",    label:"Locals Know" },
firsttimer:{ bg:"rgba(60,100,160,0.3)",  color:"#A0C0E8", border:"rgba(60,100,160,0.5)",   label:"First-Timer" },
recentopen:{ bg:"rgba(80,140,80,0.25)",  color:"#A8E0A8", border:"rgba(80,140,80,0.45)",   label:"Recently Opened" },
justopened:{ bg:"rgba(201,168,76,0.28)", color:"#F5E098", border:"rgba(201,168,76,0.65)",  label:"Just Opened" },
comingsoon:{ bg:"rgba(110,75,195,0.28)", color:"#C8AEFF", border:"rgba(110,75,195,0.55)",  label:"Coming Soon" },
};

const CUTOFF = new Date("2025-12-05");
const TODAY  = new Date("2026-04-05");
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

const COORDS={"1":[42.3339,-83.0497],"2":[42.3316,-83.0499],"3":[42.3322,-83.0524],"4":[42.3328,-83.0452],"5":[42.3330,-83.0489],"6":[42.3283,-83.0469],"7":[42.3675,-83.0636],"8":[42.3353,-83.0489],"9":[42.3337,-83.0466],"10":[42.3437,-83.0558],"11":[42.3291,-83.0621],"12":[42.3322,-83.0524],"13":[42.3274,-83.0714],"14":[42.3337,-83.0466],"15":[42.3330,-83.0489],"16":[42.3332,-83.0489],"17":[42.3322,-83.0524],"18":[42.3361,-83.0490],"19":[42.3340,-83.0473],"20":[42.3617,-83.0648],"21":[42.3534,-83.0886],"22":[42.3498,-83.0583],"23":[42.3609,-83.0624],"24":[42.3540,-83.0571],"25":[42.3326,-83.0490],"26":[42.3398,-82.9820],"27":[42.3473,-83.0401],"28":[42.3475,-83.0397],"29":[42.3567,-83.0654],"30":[42.3501,-83.0611],"31":[42.3289,-83.0631],"32":[42.3291,-83.0618],"33":[42.3290,-83.0593],"34":[42.3338,-83.0496],"35":[42.3315,-83.0490],"36":[42.3313,-83.0500],"37":[42.3576,-83.0912],"38":[42.3567,-83.0654],"39":[42.3322,-83.0524],"40":[42.3322,-83.0524],"41":[42.3322,-83.0524],"42":[42.3346,-83.0490],"43":[42.3316,-83.0497],"44":[42.3540,-83.0571],"45":[42.3690,-83.0636],"46":[42.3333,-83.0494],"47":[42.3333,-83.0502],"48":[42.3355,-83.0487],"49":[42.3339,-83.0497],"50":[42.3328,-83.0490],"51":[42.3280,-83.0487],"52":[42.3289,-83.0662],"53":[42.3310,-83.0490],"54":[42.3310,-83.0490],"55":[42.3562,-83.0654],"56":[42.3338,-83.0497],"57":[42.3307,-83.0471],"58":[42.3338,-83.0496],"59":[42.3315,-83.0490],"60":[42.3313,-83.0500],"61":[42.3576,-83.0912],"62":[42.3567,-83.0654],"63":[42.3330,-83.0489],"64":[42.3341,-83.0460],"65":[42.3523,-83.0501],"66":[42.3523,-83.0501],"67":[42.3314,-83.0449],"r1":[42.3340,-83.0470],"r2":[42.3660,-82.9960],"r3":[42.3470,-83.0370],"r4":[42.3291,-83.0621],"r5":[42.3606,-83.0647],"u1":[42.3307,-83.0471],"u2":[42.3319,-83.0475],"u3":[42.3348,-83.0490],"u4":[42.3819,-82.9574]};

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
badges:["firsttimer"], websiteUrl:"https://www.marriott.com/en-us/hotels/dtwac-ac-hotel-detroit-at-the-bonstelle/overview/" },

{ id:11, name:"I|O Rooftop - The Godfrey",        hood:"Corktown",           cat:"Rooftops",
desc:"Detroit's largest indoor/outdoor rooftop lounge at the Godfrey Hotel. Retractable glass walls and ceiling, panoramic skyline views, and a craft cocktail program that matches the altitude.",
vibes:["Retractable Roof","Skyline Views","Craft Cocktails"], addr:"1401 Michigan Ave (7th Floor), Detroit, MI 48216",
hours:"Mon-Tue 5pm-12am | Wed 3pm-9pm | Thu 5pm-12am | Fri-Sat 5pm-2am | Sun 5pm-10pm", best:"Weekend / Sunset",
exclusive:"Detroit's most expansive rooftop. The glass ceiling retracts. The skyline from Corktown is rawer, more honest.",
badges:["firsttimer"], websiteUrl:"https://www.godfreyhoteldetroit.com" },

{ id:12, name:"Kamper's Rooftop Lounge",           hood:"Downtown",           cat:"Rooftops",
desc:"A Spanish-inspired tapas and cocktail lounge on the 14th floor of the beautifully restored Book Tower. Basque pintxos, gin and tonics, negronis, sangria, and panoramic views of downtown Detroit.",
vibes:["14th Floor","Book Tower","Spanish Tapas"], addr:"1265 Washington Blvd (14th Floor), Detroit, MI 48226",
hours:"Tue-Thu 5pm-11pm | Fri 5pm-12am | Sat 3pm-12am | Sun 3pm-10pm | Mon Closed", best:"Date Night / Weekend",
exclusive:"Inside one of Detroit's most beautifully restored historic towers. The Basque tapas and Spanish cocktail program feel completely out of place in the best possible way.",
badges:["firsttimer","locals"], websiteUrl:"https://www.kampersrooftop.com" },

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
badges:["hidden","locals"], reservationUrl:"https://www.opentable.com/r/the-monarch-club-detroit" },

{ id:67, name:"Tin Roof Detroit",                 hood:"Downtown",           cat:"Rooftops",
desc:"A lively rooftop bar and live music venue steps from Campus Martius. Outdoor terrace with sweeping views of Woodward Ave, craft cocktails, cold beer on draft, and live performances most nights.",
vibes:["Live Music","Rooftop Terrace","Craft Cocktails"], addr:"1 Woodward Ave, Detroit, MI 48226",
hours:"Mon-Fri 4pm-2am | Sat-Sun 12pm-2am", best:"Evening / Live Music Nights",
exclusive:"Detroit's most social rooftop — the energy here on a weekend night is unlike anywhere else in the city. Combine with a walk through Campus Martius.",
badges:["firsttimer"], websiteUrl:"https://tinroofbar.com/detroit" },

{ id:15, name:"The Belt",                          hood:"Downtown",           cat:"Alley Spots",
desc:"A once-overlooked downtown alley transformed into a curated open-air gallery lined with murals from international and local artists. Multiple bars spill into the space.",
vibes:["Street Art","Open Air","Gallery Alley"], addr:"Library St between Griswold and Shelby, Detroit, MI 48226",
hours:"Always open | Individual venues vary", best:"Weekend / Any Visit",
exclusive:"At night with the murals lit and bars spilling into the alley, it is the most alive block in Detroit.",
badges:["firsttimer","hidden"], websiteUrl:"https://www.thebelt.org" },

{ id:16, name:"Deluxx Fluxx",                      hood:"Downtown",           cat:"Alley Spots",
desc:"A neon-drenched art bar and nightclub inside The Belt designed by Brooklyn artists FAILE. Custom pinball machines, blacklight room, packed dance floor, cocktails on tap.",
vibes:["Neon Art","Arcade","DJ Nights"], addr:"1274 Library St (The Belt), Detroit, MI 48226",
hours:"Thu 9pm-2am | Fri-Sat 8pm-2am | Sun-Wed Closed", best:"Weekend / Late Night",
exclusive:"Every inch of this place is a handmade art piece you can dance inside. There is nothing else like it in America.",
badges:["firsttimer","locals"], websiteUrl:"https://www.deluxxfluxx.com" },

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
vibes:["Dive Bar","Jukebox","Late Night"], addr:"4210 Cass Ave, Detroit, MI 48201",
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
badges:["locals","hidden"], websiteUrl:"https://www.spotlighters.org" },

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
badges:["firsttimer","locals"], reservationUrl:"https://www.opentable.com/r/chartreuse-kitchen-and-cocktails-detroit" },

{ id:25, name:"Parc Detroit",                      hood:"Downtown",           cat:"Date Night",
desc:"A French-inspired bistro overlooking Campus Martius Park. Expansive wine list, wood-fired grill flavors, and floor-to-ceiling windows that open completely in warm weather.",
vibes:["French-Inspired","Campus Martius","Wine Forward"], addr:"800 Woodward Ave, Detroit, MI 48226",
hours:"Mon-Fri Lunch 11am-2:30pm, Dinner 4pm-9:30pm | Sat Brunch 10:30am, Dinner 4:30pm-10:30pm | Sun Brunch 10:30am, Dinner 4:30pm-8:30pm", best:"Date Night / Weekend Brunch",
exclusive:"Campus Martius Park at your feet. Windows that open onto the city. The wine list takes it seriously.",
badges:["firsttimer"], reservationUrl:"https://www.opentable.com/r/parc-detroit" },

{ id:34, name:"Prime + Proper",                   hood:"Downtown",           cat:"Date Night",
desc:"A modern cathedral of American steakhouse dining inside the restored Capitol Park Loft building, built in 1912. All beef is butchered in-house, aged a minimum of 28 days, and cooked over open flame. One of the most design-forward, nationally recognized steakhouses in the Midwest.",
vibes:["USDA Prime","In-House Butcher","Capitol Park","Live Fire"],
addr:"1145 Griswold St, Detroit, MI 48226",
hours:"Sun-Thu 4pm-10pm | Fri-Sat 4pm-11pm",
best:"Date Night / Special Occasion",
exclusive:"Soaring ceilings, marble floors, glass-walled dry-age rooms, and a custom butcher counter visible from every table. One of the most exacting steak restaurants in America.",
badges:["firsttimer"],
reservationUrl:"https://www.opentable.com/r/prime-and-proper-detroit" },

{ id:35, name:"BESA",                             hood:"Downtown",           cat:"Date Night",
desc:"Modern European dining inspired by the Adriatic coast inside the historic Vinton Building on Woodward Ave. Bold flavors built around fresh seafood, handmade pasta, wood-fired lamb, and one of the strongest wine programs in Detroit. Named Detroit's Best Wine Bar two years running.",
vibes:["Adriatic Coast","Raw Bar","Wine Forward","Vinton Building"],
addr:"600 Woodward Ave, Detroit, MI 48226",
hours:"Mon-Thu 4pm-10pm | Fri-Sat 4pm-11pm | Sun Closed",
best:"Date Night / Special Occasion",
exclusive:"Detroit's Best Wine Bar two years in a row. The lamb shoulder with pomegranate reduction is one of the best plates in the city. The private loft overlooking the dining room is worth booking for a group.",
badges:["firsttimer"],
reservationUrl:"https://www.opentable.com/r/besa-detroit" },

{ id:36, name:"Ostrea",                           hood:"Downtown",           cat:"Date Night",
desc:"A seafood-forward restaurant in the Financial District from the team behind the legendary London Chop House. Daily rotating oysters from East and West Coast waters, caviar service, hamachi crudo, lobster, and a menu that changes with what's freshest. Champagne-bar energy at street level.",
vibes:["Daily Oysters","Caviar Service","Financial District","London Chop House Team"],
addr:"536 Shelby St, Detroit, MI 48226",
hours:"Mon-Sat 3pm-11pm (kitchen 4pm-10pm) | Sun Closed",
best:"Date Night / Pre-Show",
exclusive:"Fresh oysters delivered every single day. Caviar service. The team behind the most storied steakhouse in Detroit history. Old-school glamour without the formality.",
badges:["firsttimer","locals"],
reservationUrl:"https://www.opentable.com/r/ostrea-detroit" },

{ id:37, name:"Barda",                            hood:"Core City",          cat:"Date Night",
desc:"Detroit's only Argentine-inspired neo-steakhouse in Core City, from Buenos Aires-born chef Javier Bardauil. Every dish is cooked solely on a wood-burning grill and baking hearth. James Beard Award finalist for Best New Restaurant 2022. One of the most distinctive dining experiences in the city.",
vibes:["Live Fire","Argentine","Wood-Burning Grill","Core City"],
addr:"4842 Grand River Ave, Detroit, MI 48208",
hours:"Wed-Thu 5pm-9pm | Fri-Sat 5pm-10pm | Sun-Tue Closed",
best:"Date Night / Special Occasion",
exclusive:"James Beard Award finalist. A wood-burning grill is the only cooking method in the kitchen. Outdoor bonfire seating in a park setting. There is truly nothing else like Barda in Detroit.",
badges:["firsttimer","locals"],
reservationUrl:"https://www.opentable.com/r/barda-detroit" },

{ id:38, name:"Selden Standard",                  hood:"Midtown",            cat:"Date Night",
desc:"A two-time James Beard semifinalist for Outstanding Restaurant. Wood-fired small plates built around what Michigan farms are producing right now. One of the most consistently excellent dining rooms in the city – and a perennial favorite for date nights.",
vibes:["Wood-Fired","James Beard","Small Plates","Seasonal"],
addr:"3921 2nd Ave, Detroit, MI 48201",
hours:"Daily 5pm-10pm",
best:"Date Night / Weekend",
exclusive:"Two-time James Beard Outstanding Restaurant semifinalist. USA Today named it one of the best restaurants in America in 2024. The chef's counter is the best seat – reserve 30 days out.",
badges:["firsttimer","locals"],
reservationUrl:"https://www.opentable.com/r/selden-standard-detroit" },

{ id:39, name:"Hiroki-San",                        hood:"Downtown",           cat:"Date Night",
desc:"An immersive Japanese dining experience in the lower level of the historic Book Tower, from the team behind the award-winning Hiroki in Philadelphia. Robatayaki wood-fired skewers, three regional varieties of Japanese Wagyu, fresh seafood flown in twice weekly from Tokyo's Toyosu Market, and a sake program that rewards deep dives. Built inside a former bank vault with original plaster walls and shoji screens.",
vibes:["Japanese Wagyu","Robatayaki","Book Tower","Tokyo Imports"],
addr:"1265 Washington Blvd (Lower Level, Book Tower), Detroit, MI 48226",
hours:"Tue-Thu 5pm-10pm | Fri 4pm-11pm | Sat 4pm-11pm | Sun 4pm-9pm | Mon Closed",
best:"Date Night / Special Occasion",
exclusive:"Chef Hiroki Fujiyama trained under Iron Chef Masaharu Morimoto. The shoji-lined private dining room inside a former bank vault feels like a mafia sit-down in the best possible way. Reservations are essential.",
badges:["firsttimer","locals"],
reservationUrl:"https://resy.com/cities/detroit-mi/venues/hiroki-san" },

{ id:40, name:"Le Supreme",                        hood:"Downtown",           cat:"Date Night",
desc:"A Parisian-inspired brasserie occupying 6,200 square feet inside the restored Book Tower – the first restaurant to open in the $300 million renovation. Art nouveau tiles, a zinc bar top, oxblood leather booths, and a menu of French classics: seafood towers, steak au poivre, moules frites, and an in-house boulangerie.",
vibes:["French Brasserie","Book Tower","Seafood Tower","All-Day Dining"],
addr:"1265 Washington Blvd (Book Tower), Detroit, MI 48226",
hours:"Mon-Thu 4pm-10pm | Fri 4pm-11pm | Sat 10am-2:30pm and 4pm-11pm | Sun 10am-2:30pm and 4pm-9pm",
best:"Date Night / Weekend Brunch",
exclusive:"The first restaurant to open in Book Tower's $300 million restoration. 210 seats, a 24-seat private dining room with a fireplace, and enough French elegance to make you forget you're in Michigan.",
badges:["firsttimer"],
reservationUrl:"https://resy.com/cities/detroit-mi/venues/le-supreme" },

{ id:41, name:"The Aladdin Sane",                  hood:"Downtown",           cat:"Hidden Bars",
desc:"A bespoke cocktail lounge hidden in the sublevel of the historic Book Tower – 8 seats at the bar, 29 in the lounge, accessed by stepping behind a curtain at the base of the stairs. Named after the David Bowie album and built around the philosophy of Japanese bartending. The most extensive Japanese whisky list in Detroit, including rarities unavailable anywhere else in Michigan.",
vibes:["Japanese Whisky","32 Seats","Book Tower Sublevel","David Bowie"],
addr:"1265 Washington Blvd (Sublevel, Book Tower), Detroit, MI 48226",
hours:"Tue-Thu 5pm-11pm | Fri-Sat 5pm-12am | Sun-Mon Closed",
best:"Date Night / Late Night",
exclusive:"Step behind a curtain at the base of the stairs. 32 seats total. The only bottle of Glenfiddich 29 Year Grand Yozakura in any Michigan bar. Omakase cocktail experiences available. There is truly nothing else in Detroit that feels like this.",
badges:["hidden","locals"],
websiteUrl:"https://thealaddinsane.com" },

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

{ id:29, name:"Selden Standard",                  hood:"Midtown",            cat:"Midtown",
desc:"A two-time James Beard semifinalist for Outstanding Restaurant. Wood-fired small plates built around what Michigan farms are producing right now.",
vibes:["Wood-Fired","James Beard","Small Plates"], addr:"3921 2nd Ave, Detroit, MI 48201",
hours:"Daily 5pm-10pm", best:"Date Night / Weekend",
exclusive:"Two-time James Beard Outstanding Restaurant semifinalist. USA Today named it one of the best restaurants in America in 2024. The chef's counter is the best seat.",
badges:["firsttimer","locals"], reservationUrl:"https://www.opentable.com/r/selden-standard-detroit" },

{ id:30, name:"The Peterboro",                    hood:"Midtown",            cat:"Downtown",
desc:"A Cass Corridor cocktail bar and kitchen with contemporary Chinese-American cuisine. Strong cocktail program and a back bar that transforms after 10pm.",
vibes:["Chinese-American","Craft Cocktails","Late Night"], addr:"420 Peterboro St, Detroit, MI 48201",
hours:"Wed-Thu 5pm-9pm | Fri 5pm-11pm | Sat 12pm-11pm | Sun 4:30pm-9pm | Mon-Tue Closed", best:"Weekend / Date Night",
exclusive:"Most people eat dinner and leave. The people who stay for the back bar after 10pm know something most visitors don't.",
badges:["firsttimer","locals"], websiteUrl:"https://www.thepeterboro.com" },

{ id:31, name:"Batch Brewing Company",            hood:"Corktown",           cat:"Corktown",
desc:"Detroit's first nano-brewery and Corktown's communal anchor. Small-batch craft beer brewed on-site, rotating food, live music on stage.",
vibes:["Craft Beer","Live Music","Communal Taproom"], addr:"1400 Porter St, Detroit, MI 48216",
hours:"Mon-Thu 4pm-11pm | Fri-Sat 12pm-12am | Sun 12pm-8pm", best:"Weekend / Anytime",
exclusive:"Detroit's first nano-brewery, still in Corktown, still running the best communal table in the neighborhood.",
badges:["firsttimer","locals"], websiteUrl:"https://www.batchbrewingcompany.com" },

{ id:32, name:"Ottava Via",                       hood:"Corktown",           cat:"Corktown",
desc:"A lively modern Italian restaurant on Michigan Ave. Wood-fired pizzas, fresh pastas, outdoor fireplace, and bocce ball lanes on the patio.",
vibes:["Italian","Wood-Fired Pizza","Bocce Ball"], addr:"1400 Michigan Ave, Detroit, MI 48216",
hours:"Sun-Thu 11am-10pm | Fri-Sat 11am-11pm", best:"Date Night / Weekend",
exclusive:"Outdoor fireplace, bocce ball, wood-fired pizza. In summer this patio is one of the best tables in the city.",
badges:["locals"], reservationUrl:"https://ottavaviadetroit.com/reservations" },

{ id:33, name:"Lager House",                      hood:"Corktown",           cat:"Corktown",
desc:"A beloved live music dive bar in the heart of Corktown. Original rock, punk, blues, and metal most nights. The bar top is inlaid with signed guitar picks.",
vibes:["Live Music","Dive Bar","Rock and Punk"], addr:"1254 Michigan Ave, Detroit, MI 48216",
hours:"Mon-Thu 1pm-12am | Fri 1pm-2am | Sat 9am-2am | Sun 9am-12am", best:"Weekend / Late Night",
exclusive:"The bar top is inlaid with signed guitar picks from every act that has played here. No cover most nights.",
badges:["locals"], ticketUrl:"https://thelagerhouse.com/events", websiteUrl:"https://thelagerhouse.com" },

/* ── BREAKFAST ── */
{ id:42, name:"Hudson Cafe",                       hood:"Downtown",           cat:"Breakfast",
desc:"Detroit's quintessential downtown breakfast and brunch destination, born in 2011 on Woodward Ave just across from the former Hudson's department store site. Massive portions, inventive omelettes, red velvet pancakes, and Monte Cristo French toast. Seven days a week, 8am to 3pm.",
vibes:["Breakfast Staple","Generous Portions","Full Bar","Brunch Cocktails"],
addr:"1241 Woodward Ave, Detroit, MI 48226",
hours:"Mon-Sun 8am-3pm",
best:"Breakfast / Weekend Brunch",
exclusive:"The most consistently excellent breakfast in Downtown Detroit. Ask for Julius. Reservations are strongly recommended on weekends – walk-in waits can run an hour.",
badges:["firsttimer","locals"],
reservationUrl:"https://www.opentable.com/r/the-hudson-cafe-detroit" },

{ id:43, name:"Dime Store",                        hood:"Downtown",           cat:"Breakfast",
desc:"A scratch-made, chef-driven brunch bar inside the historic Chrysler House in Downtown Detroit, open since 2014. Named Best Breakfast and Best Brunch in Detroit by Hour Detroit and Metro Times year after year. The New York Times called it the rare creative brunch spot that wins over skeptics. Walk-ins only.",
vibes:["Scratch-Made","Chef-Driven","Walk-Ins Only","Full Bar"],
addr:"719 Griswold St Suite 180 (inside Chrysler House), Detroit, MI 48226",
hours:"Thu-Tue 8am-3pm | Wed Closed | Walk-ins only",
best:"Breakfast / Weekday Brunch",
exclusive:"New York Times approved. Locally owned since 2014. The Duck Bop Hash is worth whatever wait you face. No reservations – just show up.",
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

{ id:47, name:"Cannelle",                          hood:"Downtown",           cat:"Coffee Shops & Bakeries",
desc:"A French patisserie in Capitol Park from master pastry chef Matt Knio, who trained in Paris under a Academies de Versailles master artisan after working on a cocoa plantation in Ivory Coast. Handcrafted croissants, chocolate eclairs, tarts, macarons, and espresso drinks. One of the most beautiful pastry cases in the city.",
vibes:["French Patisserie","Handcrafted","Croissants","Capitol Park"],
addr:"45 W Grand River Ave, Detroit, MI 48226",
hours:"Mon-Thu 6:30am-8pm | Fri 6:30am-10pm | Sat 7:30am-10pm | Sun 8am-6pm",
best:"Morning / Afternoon",
exclusive:"Chef Matt Knio trained under a master pastry chef in Paris after working on a cocoa plantation in Ivory Coast. The chocolate eclairs are exceptional. Detroit has earned a world-class patisserie.",
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
exclusive:"$5 for everything on the food and drink menu, Monday through Friday 3-6pm. James Beard nominated. The most generous happy hour in the city, at one of the best restaurants in the city. There is no better deal in Detroit.",
badges:["firsttimer","locals"],
websiteUrl:"https://www.imaizakaya.com" },

{ id:53, name:"Experience Zuzu",                   hood:"Downtown",           cat:"Happy Hour",
desc:"A two-story Asian fusion restaurant and social lounge on Woodward Ave adjacent to the Guardian Building. Happy Hour Monday through Friday from 4-6pm with discounted cocktails and small plates. Bold sushi, wok-fired dishes, omakase towers, and a rooftop-adjacent outdoor bar. One of Downtown Detroit's most visually striking dining rooms.",
vibes:["Happy Hour 4-6pm","Asian Fusion","Two-Story","Guardian Building"],
addr:"511 Woodward Ave Suite 100, Detroit, MI 48226",
hours:"Mon-Wed 4pm-11pm | Thu-Sun 4pm-1am | Happy Hour: Mon-Fri 4pm-6pm",
best:"Happy Hour / Date Night / Late Night",
exclusive:"The most visually immersive dining room in Downtown Detroit. Happy hour is 4-6pm daily with the full cocktail and small plates program. Stay for the full dinner and you will understand why this place is always full.",
badges:["firsttimer"],
reservationUrl:"https://www.opentable.com/r/experience-zuzu-detroit" },

/* ── ZUZU also as Date Night ── */
{ id:54, name:"Experience Zuzu",                   hood:"Downtown",           cat:"Date Night",
desc:"A two-story Asian fusion restaurant and social lounge on Woodward Ave. Bold sushi, omakase towers, A5 wagyu hot stone tableside, wok-fired dishes, and an outdoor bar. Moody lighting, immersive design by iCrave, late-night hours Thursday through Sunday.",
vibes:["Asian Fusion","Sushi","Tabletop Experience","Late Night"],
addr:"511 Woodward Ave Suite 100, Detroit, MI 48226",
hours:"Mon-Wed 4pm-11pm | Thu-Sun 4pm-1am | Happy Hour: Mon-Fri 4pm-6pm",
best:"Date Night / Special Occasion / Late Night",
exclusive:"One of the most immersive dining rooms in downtown Detroit. The omakase sushi tower is a showpiece. Late-night hours Thursday through Sunday make this a perfect end-of-evening destination.",
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
exclusive:"Half specialty grocery market, half restaurant with one of the best patios in Capitol Park. Wednesday bottles of wine for $25. A downtown sleeper that locals know well.",
badges:["locals"],
reservationUrl:"https://www.opentable.com/r/eatori-market-detroit" },

{ id:57, name:"Frita Batidos",                     hood:"Downtown",           cat:"Lunch",
desc:"A Cuban-inspired fast-casual restaurant steps from Little Caesars Arena. Award-winning fritas (Cuban chorizo burgers with shoestring fries), batidos (tropical milkshakes with optional rum), and creative sandwiches. Best Burger Michigan Daily consecutively since 2014.",
vibes:["Cuban Street Food","Chorizo Frita","Tropical Batidos","Near LCA"],
addr:"66 W Columbia St, Detroit, MI 48226",
hours:"Tue-Thu 11am-10pm | Fri-Sat 11am-11pm | Sun 11am-10pm | Mon Closed",
best:"Lunch / Casual Dinner",
exclusive:"Best Burger Michigan Daily 12 years running. Metro Times Best Cuban Restaurant 5 years running. The chorizo frita with a coconut cream batido is a Detroit rite of passage.",
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
websiteUrl:"https://vicentesdetroit.com" },

{ id:64, name:"Fixins Soul Kitchen",               hood:"Downtown",           cat:"Lunch",
desc:"A 8,400-square-foot soul food destination on Randolph Street in historic Harmonie Park, opened by NBA All-Star and former Sacramento mayor Kevin Johnson. Chicken and waffles, oxtails, shrimp and grits, fried deviled eggs, and signature Kool-Aid cocktails. Motown art on every wall. Open for lunch daily.",
vibes:["Soul Food","Motown Decor","Harmonie Park","Open Daily"],
addr:"1435 Randolph St, Detroit, MI 48226",
hours:"Mon-Thu 11am-9pm | Fri 11am-11pm | Sat-Sun 10am-11pm",
best:"Lunch / Dinner / Sunday Gospel Brunch",
exclusive:"Founded by an NBA All-Star, built in the heart of Detroit's historic Paradise Valley. The chicken and waffles are the standard. Sunday gospel brunch is an experience.",
badges:["firsttimer"],
reservationUrl:"https://www.opentable.com/r/fixins-soul-kitchen-detroit" },

/* ── DINNER (key existing dinner venues given a Dinner cat tag) ── */
{ id:58, name:"Prime + Proper",                    hood:"Downtown",           cat:"Dinner",
desc:"A nationally recognized modern American steakhouse inside the 1912 Capitol Park Loft building. In-house butchered USDA Prime beef aged a minimum of 28 days. Soaring ceilings, glass-walled dry-age rooms, live fire cooking.",
vibes:["USDA Prime","In-House Butcher","Capitol Park","Live Fire"],
addr:"1145 Griswold St, Detroit, MI 48226",
hours:"Sun-Thu 4pm-10pm | Fri-Sat 4pm-11pm",
best:"Dinner / Special Occasion",
exclusive:"One of the most exacting steak restaurants in America. The in-house butcher shop is visible from the dining room. Reserve well in advance.",
badges:["firsttimer"],
reservationUrl:"https://www.opentable.com/r/prime-and-proper-detroit" },

{ id:59, name:"BESA",                              hood:"Downtown",           cat:"Dinner",
desc:"Modern European Adriatic cuisine inside the historic Vinton Building on Woodward Ave. Bold flavors, fresh seafood, handmade pasta, wood-fired lamb. Named Detroit's Best Wine Bar two years running.",
vibes:["Adriatic Coast","Raw Bar","Wine Forward","Vinton Building"],
addr:"600 Woodward Ave, Detroit, MI 48226",
hours:"Mon-Thu 4pm-10pm | Fri-Sat 4pm-11pm | Sun Closed",
best:"Dinner / Date Night",
exclusive:"Detroit's Best Wine Bar two years in a row. The lamb shoulder with pomegranate is one of the best plates in the city.",
badges:["firsttimer"],
reservationUrl:"https://www.opentable.com/r/besa-detroit" },

{ id:60, name:"Ostrea",                            hood:"Downtown",           cat:"Dinner",
desc:"A seafood-forward restaurant from the London Chop House team in the Financial District. Daily rotating oysters, caviar service, lobster, hamachi crudo, and a menu that changes with the freshest catch.",
vibes:["Daily Oysters","Caviar","Financial District","Seafood"],
addr:"536 Shelby St, Detroit, MI 48226",
hours:"Mon-Sat 3pm-11pm (kitchen 4pm-10pm) | Sun Closed",
best:"Dinner / Pre-Show",
exclusive:"Fresh oysters delivered every single day. Caviar service at street level in downtown Detroit. Old-school glamour without the formality.",
badges:["firsttimer","locals"],
reservationUrl:"https://www.opentable.com/r/ostrea-detroit" },

{ id:61, name:"Barda",                             hood:"Core City",          cat:"Dinner",
desc:"Detroit's only Argentine-inspired neo-steakhouse in Core City. Every dish cooked solely on a wood-burning grill and baking hearth. James Beard Award finalist for Best New Restaurant 2022.",
vibes:["Live Fire","Argentine","Wood-Burning Grill","Core City"],
addr:"4842 Grand River Ave, Detroit, MI 48208",
hours:"Wed-Thu 5pm-9pm | Fri-Sat 5pm-10pm | Sun-Tue Closed",
best:"Dinner / Special Occasion",
exclusive:"James Beard finalist. A wood-burning grill is the only cooking method in the entire kitchen. Nothing else in Detroit feels like this.",
badges:["firsttimer","locals"],
reservationUrl:"https://www.opentable.com/r/barda-detroit" },

{ id:62, name:"Selden Standard",                   hood:"Midtown",            cat:"Dinner",
desc:"A two-time James Beard semifinalist for Outstanding Restaurant. Wood-fired small plates built around Michigan seasonal produce. One of the most consistently excellent dining rooms in the city.",
vibes:["Wood-Fired","James Beard","Small Plates","Seasonal"],
addr:"3921 2nd Ave, Detroit, MI 48201",
hours:"Daily 5pm-10pm",
best:"Dinner / Date Night",
exclusive:"Two-time James Beard semifinalist. The chef's counter is the best seat in the house – reserve it 30 days out.",
badges:["firsttimer","locals"],
reservationUrl:"https://www.opentable.com/r/selden-standard-detroit" },

{ id:65, name:"Grey Ghost",                        hood:"Midtown",            cat:"Dinner",
desc:"A Midtown 'cuts and cocktails' destination in Brush Park from two Chicago-trained chefs. Dry-aged steaks, a 50-foot bar made from reclaimed bowling alley wood, a Prohibition-era rum-runner ethos, and craft cocktails that are widely considered among the best in Detroit. Open daily from 4pm. Reservations via Resy.",
vibes:["Dry-Aged Steaks","50ft Bowling Alley Bar","Brush Park","Craft Cocktails"],
addr:"47 Watson St, Detroit, MI 48201",
hours:"Sun-Thu 4pm-11pm | Fri-Sat 4pm-12am | Sunday brunch 10am-2pm",
best:"Dinner / Date Night / Late Night",
exclusive:"The 50-foot bar top is reclaimed bowling alley wood. Named after a Prohibition-era Detroit rum runner. One of the hardest reservations to get in the city – and consistently worth every effort.",
badges:["firsttimer","locals"],
reservationUrl:"https://resy.com/cities/detroit-mi/venues/greyghost" },

{ id:66, name:"Grey Ghost",                        hood:"Midtown",            cat:"Date Night",
desc:"A Midtown 'cuts and cocktails' destination in Brush Park from two Chicago-trained chefs. Dry-aged steaks, a 50-foot bowling alley bar, and craft cocktails widely considered among the best in Detroit. Named after a Prohibition-era Detroit River rum runner. Open daily.",
vibes:["Dry-Aged Steaks","50ft Bowling Alley Bar","Prohibition Lore","Craft Cocktails"],
addr:"47 Watson St, Detroit, MI 48201",
hours:"Sun-Thu 4pm-11pm | Fri-Sat 4pm-12am | Sunday brunch 10am-2pm",
best:"Date Night / Special Occasion / Late Night",
exclusive:"One of the hardest reservations in Detroit and consistently one of the best nights out. The bar alone is worth the visit. Book via Resy and go on a Tuesday when the room is quieter.",
badges:["firsttimer","locals"],
reservationUrl:"https://resy.com/cities/detroit-mi/venues/greyghost" },
];

const RECENTLY = [
{ id:"r1", name:"Bar Chenin",        hood:"Downtown",      cat:"Cocktail Lounges",
desc:"A pocket-sized natural wine bar inside the Siren Hotel - 10 seats inside, 16 on the patio. Biodynamic bottles, inventive cocktails, house-made ice cream. 2026 James Beard nominee for Best New Bar.",
vibes:["Natural Wine","10 Seats","James Beard Nominated"], addr:"509 Broadway St Suite A-1, Detroit, MI 48226 (Siren Hotel)",
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
badges:["recentopen","hidden"], websiteUrl:"https://www.instagram.com/pocketchangedetroit" },

{ id:"r4", name:"Street Beet",        hood:"Corktown",      cat:"Corktown",
desc:"Detroit's beloved vegan pop-up turned permanent restaurant in the former Bobcat Bonnie's space. Plant-based smashburgers, coney dogs, diner classics. Vintage arcade in the back.",
vibes:["Vegan","Comfort Food","Arcade"], addr:"1800 Michigan Ave, Detroit, MI 48216",
hours:"Wed-Thu 4pm-10pm | Fri 4pm-11pm | Sat 10am-3pm and 4pm-11pm | Sun 10am-3pm and 4pm-10pm | Mon-Tue Closed", best:"Weeknight / Weekend",
exclusive:"Detroit's most beloved vegan pop-up finally has a permanent home.",
badges:["recentopen"], websiteUrl:"https://www.streetbeet.online" },

{ id:"r5", name:"Dirty Shake",        hood:"Midtown",       cat:"Midtown",
desc:"A high-energy neighborhood bar from the team behind Chartreuse and Freya. Nostalgic cocktails, boozy slushies, a cult-status bar burger, and a patio with garage doors.",
vibes:["Late Night","Bar Burger","Chartreuse Team"], addr:"4120 Cass Ave, Detroit, MI 48201",
hours:"Check @dirtyshakedetroit for current hours", best:"Late Night / Weeknight",
exclusive:"When the Chartreuse team opens a neighborhood bar, the neighborhood pays attention.",
badges:["recentopen"], websiteUrl:"https://www.instagram.com/dirtyshakedetroit" },
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
websiteUrl:"https://cosm.com/detroit", ticketUrl:"https://cosm.com/detroit" },
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
style:{ background:b.bg, color:b.color, border:"1px solid "+b.border, borderRadius:100, padding:"3px 9px", fontSize:"0.49rem", fontFamily:"'DM Mono',monospace", letterSpacing:"0.12em", textTransform:"uppercase", whiteSpace:"nowrap" }
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
style:{ display:"inline-block", background:C.gold, color:C.black, fontFamily:"'DM Mono',monospace", fontSize:"0.57rem", letterSpacing:"0.13em", textTransform:"uppercase", padding:full?"12px 18px":"8px 14px", borderRadius:6, fontWeight:500, textDecoration:"none", cursor:"pointer", width:full?"100%":undefined, textAlign:full?"center":undefined }
}, cta.label);
}

function VCard({ venue, isFav, onFav, onOpen, i }) {
const [hov, setHov] = useState(false);
return React.createElement("div", {
onClick:()=>onOpen(String(venue.id)),
onMouseEnter:()=>setHov(true), onMouseLeave:()=>setHov(false),
style:{ background:C.card, border:"1px solid "+(hov?C.goldD:C.border), borderRadius:12, cursor:"pointer", display:"flex", flexDirection:"column", transform:hov?"translateY(-4px)":"none", boxShadow:hov?"0 8px 36px rgba(0,0,0,0.55)":"0 2px 14px rgba(0,0,0,0.4)", transition:"all 0.24s", animationDelay:Math.min(i*0.04,0.5)+"s" }
},
React.createElement("div", { style:{ padding:"16px 18px 18px", display:"flex", flexDirection:"column", gap:9, flex:1 }},
React.createElement("div", { style:{ display:"flex", justifyContent:"space-between" }},
React.createElement("span", { style:{ fontFamily:"'DM Mono',monospace", fontSize:"0.49rem", letterSpacing:"0.16em", textTransform:"uppercase", color:C.gold }}, venue.cat),
React.createElement("span", { style:{ fontFamily:"'DM Mono',monospace", fontSize:"0.49rem", letterSpacing:"0.1em", textTransform:"uppercase", color:C.smoke }}, venue.hood)
),
venue.distMi!==undefined&&React.createElement("span",{style:{fontFamily:"'DM Mono',monospace",fontSize:"0.47rem",letterSpacing:"0.1em",color:C.purple}},"◉ "+venue.distMi.toFixed(1)+" mi away"),
(venue.badges||[]).length > 0 && React.createElement("div", { style:{ display:"flex", flexWrap:"wrap", gap:5 }}, (venue.badges||[]).map(b=>React.createElement(Chip,{key:b,type:b}))),
React.createElement("h3", { style:{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.3rem", fontWeight:600, color:C.white, lineHeight:1.15, margin:0 }}, venue.name),
React.createElement("p", { style:{ fontSize:"0.78rem", color:C.ash, fontWeight:300, lineHeight:1.65, flex:1, margin:0 }}, venue.desc),
React.createElement("div", { style:{ display:"flex", flexWrap:"wrap", gap:4 }}, venue.vibes.map(v=>React.createElement(Vibe,{key:v,label:v}))),
React.createElement("div", { style:{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:10, borderTop:"1px solid "+C.borderS }},
React.createElement(CTA, { venue }),
React.createElement("button", { onClick:e=>{e.stopPropagation();onFav(String(venue.id));}, style:{ background:"none", border:"none", cursor:"pointer", color:isFav?C.gold:C.smoke, fontSize:"1.1rem", padding:"4px 6px" }}, isFav?"\u2665":"\u2661")
)
)
);
}

function UCard({ venue, i, onOpen, isFav, onFav }) {
const [hov, setHov] = useState(false);
const just = venue.status==="justopened";
const acc  = just ? C.gold : C.purple;
return React.createElement("div", {
onClick:()=>onOpen(venue.id),
onMouseEnter:()=>setHov(true), onMouseLeave:()=>setHov(false),
style:{ background:C.card, border:"1px solid "+(hov?(just?C.goldD:"rgba(110,75,195,0.5)"):C.border), borderRadius:12, cursor:"pointer", display:"flex", flexDirection:"column", transform:hov?"translateY(-4px)":"none", boxShadow:hov?"0 8px 36px rgba(0,0,0,0.55)":"0 2px 14px rgba(0,0,0,0.4)", transition:"all 0.24s" }
},
React.createElement("div", { style:{ padding:"16px 18px 18px", display:"flex", flexDirection:"column", gap:9, flex:1 }},
React.createElement("div", { style:{ display:"flex", justifyContent:"space-between" }},
React.createElement("span", { style:{ fontFamily:"'DM Mono',monospace", fontSize:"0.49rem", letterSpacing:"0.16em", textTransform:"uppercase", color:acc }}, venue.cat),
React.createElement("span", { style:{ fontFamily:"'DM Mono',monospace", fontSize:"0.49rem", letterSpacing:"0.1em", textTransform:"uppercase", color:C.smoke }}, venue.hood)
),
React.createElement("div", { style:{ display:"flex", gap:5 }}, React.createElement(Chip,{type:venue.status})),
React.createElement("h3", { style:{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.3rem", fontWeight:600, color:C.white, lineHeight:1.15, margin:0 }}, venue.name),
React.createElement("p", { style:{ fontSize:"0.78rem", color:C.ash, fontWeight:300, lineHeight:1.65, flex:1, margin:0 }}, venue.desc),
React.createElement("div", { style:{ display:"flex", flexWrap:"wrap", gap:4 }}, venue.vibes.map(v=>React.createElement(Vibe,{key:v,label:v}))),
React.createElement("div", { style:{ background:just?"rgba(201,168,76,0.09)":"rgba(110,75,195,0.09)", border:"1px solid "+(just?"rgba(201,168,76,0.28)":"rgba(110,75,195,0.28)"), borderRadius:5, padding:"6px 10px" }},
React.createElement("span", { style:{ fontFamily:"'DM Mono',monospace", fontSize:"0.48rem", letterSpacing:"0.09em", color:acc }}, venue.note)
),
React.createElement("div", { style:{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:10, borderTop:"1px solid "+C.borderS }},
React.createElement(CTA, { venue }),
React.createElement("button", { onClick:e=>{e.stopPropagation();onFav(String(venue.id));}, style:{ background:"none", border:"none", cursor:"pointer", color:isFav?C.gold:C.smoke, fontSize:"1.1rem", padding:"4px 6px", marginLeft:"auto" }}, isFav?"\u2665":"\u2661")
)
)
);
}

function Modal({ venue, isFav, onFav, onClose }) {
if (!venue) return null;
const isV = typeof venue.id === "number";
const badges = venue.badges||[];
return React.createElement(React.Fragment, null,
React.createElement("div", { onClick:onClose, style:{ position:"fixed", inset:0, background:"rgba(0,0,0,0.88)", zIndex:800, backdropFilter:"blur(4px)" }}),
React.createElement("div", { style:{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:"min(660px,93vw)", maxHeight:"90vh", overflowY:"auto", background:C.deep, border:"1px solid "+C.border, borderRadius:12, zIndex:900 }},
React.createElement("div", { style:{ padding:"24px 24px 32px", display:"flex", flexDirection:"column", gap:14 }},
React.createElement("div", { style:{ display:"flex", justifyContent:"space-between", alignItems:"center" }},
React.createElement("span", { style:{ fontFamily:"'DM Mono',monospace", fontSize:"0.55rem", letterSpacing:"0.16em", textTransform:"uppercase", color:C.gold }}, venue.cat),
React.createElement("div", { style:{ display:"flex", alignItems:"center", gap:10 }},
React.createElement("span", { style:{ fontFamily:"'DM Mono',monospace", fontSize:"0.55rem", letterSpacing:"0.1em", textTransform:"uppercase", color:C.smoke }}, venue.hood),
React.createElement("button", { onClick:onClose, style:{ width:30, height:30, borderRadius:"50%", background:"rgba(10,10,10,0.85)", border:"1px solid "+C.border, color:C.ash, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.9rem", flexShrink:0 }}, "×")
)),
badges.length > 0 && React.createElement("div", { style:{ display:"flex", flexWrap:"wrap", gap:6 }}, badges.map(b=>React.createElement(Chip,{key:b,type:b}))),
venue.status && (venue.status==="justopened"||venue.status==="comingsoon") && React.createElement("div", null, React.createElement(Chip,{type:venue.status})),
React.createElement("h2", { style:{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(1.5rem,4vw,2rem)", fontWeight:600, color:C.white, lineHeight:1.1, margin:0 }}, venue.name),
React.createElement("div", { style:{ display:"flex", flexWrap:"wrap", gap:5 }}, venue.vibes.map(v=>React.createElement(Vibe,{key:v,label:v}))),
React.createElement("p", { style:{ fontSize:"0.86rem", color:C.ash, fontWeight:300, lineHeight:1.72, margin:0 }}, venue.desc),
venue.exclusive && React.createElement("div", { style:{ background:"rgba(201,168,76,0.06)", border:"1px solid rgba(201,168,76,0.2)", borderRadius:6, padding:"13px 16px" }},
React.createElement("span", { style:{ fontFamily:"'DM Mono',monospace", fontSize:"0.52rem", letterSpacing:"0.15em", textTransform:"uppercase", color:C.gold, display:"block", marginBottom:6 }}, isV?"Why it feels exclusive":"Why this matters"),
React.createElement("p", { style:{ fontSize:"0.83rem", color:C.bone, fontWeight:300, fontStyle:"italic", lineHeight:1.62, margin:0 }}, venue.exclusive)
),
venue.note && React.createElement("div", { style:{ background:venue.status==="justopened"?"rgba(201,168,76,0.06)":"rgba(110,75,195,0.06)", border:"1px solid "+(venue.status==="justopened"?"rgba(201,168,76,0.2)":"rgba(110,75,195,0.2)"), borderRadius:6, padding:"10px 14px" }},
React.createElement("span", { style:{ fontFamily:"'DM Mono',monospace", fontSize:"0.5rem", letterSpacing:"0.1em", color:venue.status==="justopened"?C.gold:C.purple }}, venue.note)
),
React.createElement("div", { style:{ background:C.card, border:"1px solid "+C.borderS, borderRadius:6, padding:"13px 16px", display:"flex", flexDirection:"column", gap:9 }},
[["Address",venue.addr],["Hours",venue.hours],["Best for",venue.best||""]].filter(p=>p[1]).map(p=>
React.createElement("div", { key:p[0], style:{ display:"flex", gap:12, alignItems:"flex-start" }},
React.createElement("span", { style:{ fontFamily:"'DM Mono',monospace", fontSize:"0.52rem", letterSpacing:"0.1em", textTransform:"uppercase", color:C.smoke, minWidth:68, paddingTop:2 }}, p[0]),
React.createElement("span", { style:{ fontSize:"0.81rem", color:C.ash, fontWeight:300, lineHeight:1.5 }}, p[1])
)
)
),
React.createElement("div", { style:{ display:"flex", gap:10, alignItems:"center" }},
React.createElement(CTA, { venue, full:true }),
React.createElement("button", { onClick:()=>onFav(String(venue.id)), style:{ padding:"12px 14px", background:isFav?"rgba(201,168,76,0.15)":"transparent", border:"1px solid "+(isFav?C.gold:C.border), color:isFav?C.gold:C.smoke, fontFamily:"'DM Mono',monospace", fontSize:"0.58rem", letterSpacing:"0.12em", textTransform:"uppercase", borderRadius:6, cursor:"pointer" }}, isFav?"\u2665 Saved":"\u2661 Save")
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

const MAP_FILTER_CATS=["all","Hidden Bars","Date Night","Rooftops","Happy Hour","Sports","Speakeasies"];
function MapView({isFav,toggleFav,setModalId}){
const [mapCat,setMapCat]=React.useState("all");
const [selected,setSelected]=React.useState(null);
const [mapReady,setMapReady]=React.useState(false);
const containerRef=React.useRef(null);
const mapRef=React.useRef(null);
const markersRef=React.useRef([]);
React.useEffect(()=>{
const prev=document.body.style.overflow;
document.body.style.overflow="hidden";
return()=>{document.body.style.overflow=prev;};
},[]);
React.useEffect(()=>{
if(!containerRef.current||mapRef.current)return;
const map=L.map(containerRef.current,{center:[42.3314,-83.0458],zoom:14,zoomControl:false});
L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",{attribution:"\u00a9 OSM \u00a9 CARTO",subdomains:"abcd",maxZoom:19}).addTo(map);
L.control.zoom({position:"topleft"}).addTo(map);
mapRef.current=map;setMapReady(true);
return()=>{map.remove();mapRef.current=null;};
},[]);
React.useEffect(()=>{
const map=mapRef.current;if(!map)return;
markersRef.current.forEach(m=>map.removeLayer(m));markersRef.current=[];
[...ALL,...UPCOMING].forEach(v=>{
if(mapCat!=="all"&&v.cat!==mapCat)return;
const coord=COORDS[String(v.id)];if(!coord)return;
const isNew=!!(v.status||(v.badges||[]).includes("recentopen"));
const pin=isNew?"#C8AEFF":"#C9A84C";
const glow=isNew?"rgba(200,174,255,0.5)":"rgba(201,168,76,0.5)";
const icon=L.divIcon({className:"",html:'<div style="width:13px;height:13px;background:'+pin+';border-radius:50%;border:2.5px solid rgba(255,255,255,0.75);box-shadow:0 0 8px '+glow+';cursor:pointer"></div>',iconSize:[13,13],iconAnchor:[6,6]});
const m=L.marker(coord,{icon}).addTo(map).on("click",()=>setSelected(v));
markersRef.current.push(m);
});
},[mapCat,mapReady]);
const navH="calc(60px + env(safe-area-inset-top))";
return React.createElement("div",{style:{height:"calc(100vh - "+navH+")",display:"flex",flexDirection:"column",position:"relative",overflow:"hidden"}},
React.createElement("div",{style:{background:C.black,borderBottom:"1px solid "+C.border,padding:"10px 16px",display:"flex",gap:7,overflowX:"auto",flexShrink:0,scrollbarWidth:"none",WebkitOverflowScrolling:"touch",touchAction:"pan-x",position:"relative",zIndex:500},onTouchStart:e=>e.stopPropagation(),onTouchMove:e=>e.stopPropagation()},
MAP_FILTER_CATS.map(c=>React.createElement("button",{key:c,onClick:()=>setMapCat(c),style:{fontFamily:"'DM Mono',monospace",fontSize:"0.5rem",letterSpacing:"0.12em",textTransform:"uppercase",border:"1px solid "+(mapCat===c?C.gold:C.border),color:mapCat===c?C.black:C.goldL,background:mapCat===c?C.gold:"transparent",padding:"6px 12px",borderRadius:100,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}},c==="all"?"All Venues":c))),
React.createElement("div",{ref:containerRef,style:{flex:1,background:C.deep,minHeight:0}}),
React.createElement("div",{style:{position:"absolute",bottom:selected?"calc(238px + env(safe-area-inset-bottom))":"calc(16px + env(safe-area-inset-bottom))",left:12,display:"flex",flexDirection:"column",gap:5,background:"rgba(10,10,10,0.88)",border:"1px solid "+C.border,borderRadius:8,padding:"8px 12px",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",transition:"bottom 0.3s",zIndex:800}},
React.createElement("div",{style:{display:"flex",alignItems:"center",gap:7}},React.createElement("div",{style:{width:10,height:10,borderRadius:"50%",background:C.gold,boxShadow:"0 0 5px rgba(201,168,76,0.6)"}}),React.createElement("span",{style:{fontFamily:"'DM Mono',monospace",fontSize:"0.45rem",letterSpacing:"0.1em",color:C.ash}},"VENUES")),
React.createElement("div",{style:{display:"flex",alignItems:"center",gap:7}},React.createElement("div",{style:{width:10,height:10,borderRadius:"50%",background:C.purple,boxShadow:"0 0 5px rgba(200,174,255,0.6)"}}),React.createElement("span",{style:{fontFamily:"'DM Mono',monospace",fontSize:"0.45rem",letterSpacing:"0.1em",color:C.ash}},"NEW / SOON"))
),
selected&&React.createElement("div",{style:{position:"absolute",bottom:0,left:0,right:0,background:C.deep,borderTop:"1px solid "+C.border,borderRadius:"14px 14px 0 0",padding:"18px 20px calc(28px + env(safe-area-inset-bottom))",zIndex:1000}},
React.createElement("button",{onClick:()=>setSelected(null),style:{position:"absolute",top:10,right:14,background:"none",border:"none",color:C.smoke,fontSize:"1.3rem",cursor:"pointer",padding:"2px 6px",lineHeight:1}},"×"),
React.createElement("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:3}},
React.createElement("span",{style:{fontFamily:"'DM Mono',monospace",fontSize:"0.47rem",letterSpacing:"0.14em",textTransform:"uppercase",color:C.gold}},selected.cat),
React.createElement("span",{style:{fontFamily:"'DM Mono',monospace",fontSize:"0.47rem",letterSpacing:"0.1em",textTransform:"uppercase",color:C.smoke}},selected.hood)),
React.createElement("h3",{style:{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.35rem",fontWeight:600,color:C.white,lineHeight:1.1,marginBottom:7}},selected.name),
React.createElement("p",{style:{fontSize:"0.77rem",color:C.ash,fontWeight:300,lineHeight:1.6,marginBottom:14}},selected.desc.length>160?selected.desc.slice(0,160)+"\u2026":selected.desc),
React.createElement("div",{style:{display:"flex",gap:10}},
React.createElement("button",{onClick:()=>toggleFav(String(selected.id)),style:{flex:"0 0 auto",padding:"10px 14px",background:isFav(selected.id)?"rgba(201,168,76,0.15)":"transparent",border:"1px solid "+(isFav(selected.id)?C.gold:C.border),color:isFav(selected.id)?C.gold:C.smoke,fontFamily:"'DM Mono',monospace",fontSize:"0.52rem",letterSpacing:"0.1em",textTransform:"uppercase",borderRadius:6,cursor:"pointer"}},isFav(selected.id)?"\u2665 Saved":"\u2661 Save"),
React.createElement("button",{onClick:()=>{setModalId(String(selected.id));setSelected(null);},style:{flex:1,padding:"10px",background:C.gold,border:"none",color:C.black,fontFamily:"'DM Mono',monospace",fontSize:"0.52rem",letterSpacing:"0.1em",textTransform:"uppercase",borderRadius:6,cursor:"pointer",fontWeight:500}},"View Details"))
)
);}

export default function App() {
const [section, setSection]   = useState("explore");
const [favs,    setFavs]      = useState([]);
const [cat,     setCat]       = useState("all");
const [sort,    setSort]      = useState("default");
const [modalId, setModalId]   = useState(null);
const [toast,   setToast]     = useState({ msg:"", vis:false });
const [scrolled,setScrolled]  = useState(false);
const [nearMe,  setNearMe]    = useState(false);
const [userCoords,setUserCoords]=useState(null);
const [geoError,setGeoError]  = useState(null);
const [geoModal,setGeoModal]  = useState(false);
const filtersRef = useRef(null);
const chipRowRef = useRef(null);

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
s.textContent="*{box-sizing:border-box;margin:0;padding:0}a{text-decoration:none}::-webkit-scrollbar{width:5px;background:#0A0A0A}::-webkit-scrollbar-thumb{background:#242424;border-radius:3px}";
document.head.appendChild(s);
}
},[]);

const isFav = id=>favs.includes(String(id));
let tTimer;
const showToast=msg=>{setToast({msg,vis:true});clearTimeout(tTimer);tTimer=setTimeout(()=>setToast(t=>({...t,vis:false})),2200);};
const toggleFav=useCallback(id=>{
const sid=String(id);const v=ALL.find(x=>String(x.id)===sid);
setFavs(prev=>{const next=prev.includes(sid)?prev.filter(f=>f!==sid):[...prev,sid];showToast(prev.includes(sid)?"Removed: "+(v?v.name:""):"Saved: "+(v?v.name:""));return next;});
},[]);
const goCategory=useCallback(c=>{setCat(c);setSection("explore");setTimeout(()=>{filtersRef.current?.scrollIntoView({behavior:"smooth",block:"start"});},60);},[]);
const switchCat=useCallback(c=>{const savedLeft=chipRowRef.current?.scrollLeft??0;setCat(c);window.scrollTo({top:0,behavior:"instant"});requestAnimationFrame(()=>{if(chipRowRef.current)chipRowRef.current.scrollLeft=savedLeft;});},[]);
const doGetLocation=()=>{navigator.geolocation.getCurrentPosition(pos=>{setUserCoords({lat:pos.coords.latitude,lng:pos.coords.longitude});setNearMe(true);setGeoError(null);setTimeout(()=>{filtersRef.current?.scrollIntoView({behavior:"smooth",block:"start"});},120);},err=>{if(err.code===1)setGeoError("Location access is blocked. To enable it, go to your device Settings → Browser → Location and allow this site.");else setGeoError("Couldn't get your location — please try again.");});};
const activateNearMe=()=>{if(!navigator.geolocation){setGeoError("Geolocation is not supported by your browser.");return;}if(navigator.permissions){navigator.permissions.query({name:"geolocation"}).then(r=>{if(r.state==="granted")doGetLocation();else if(r.state==="denied")setGeoError("Location access is blocked. To use Near Me, enable location for this browser in your device Settings.");else setGeoModal(true);}).catch(()=>setGeoModal(true));}else{setGeoModal(true);}};
const deactivateNearMe=()=>{setNearMe(false);setUserCoords(null);setGeoError(null);};

let shown=[...ALL];
if(cat!=="all")shown=shown.filter(v=>v.cat===cat||v.hood===cat);
if(nearMe&&userCoords){shown=shown.map(v=>{const coord=COORDS[String(v.id)];if(coord){const d=haversine(userCoords.lat,userCoords.lng,coord[0],coord[1]);return{...v,distMi:d};}return v;}).sort((a,b)=>(a.distMi??999)-(b.distMi??999));}
else{if(sort==="name")shown.sort((a,b)=>a.name.localeCompare(b.name));if(sort==="hood")shown.sort((a,b)=>a.hood.localeCompare(b.hood));if(sort==="cat")shown.sort((a,b)=>a.cat.localeCompare(b.cat));}

const favVenues=ALL.filter(v=>isFav(v.id));
const modalVenue=findItem(modalId);
const navTo=s=>{setSection(s);window.scrollTo({top:0,behavior:"smooth"});};

const ss=(prop,val)=>({[prop]:val});
const row=(children,extra={})=>React.createElement("div",{style:{display:"flex",...extra}},children);
const mono=(text,color,size="0.52rem",extra={})=>React.createElement("span",{style:{fontFamily:"'DM Mono',monospace",fontSize:size,letterSpacing:"0.14em",textTransform:"uppercase",color,...extra}},text);
const serif=(tag,text,size,extra={})=>React.createElement(tag,{style:{fontFamily:"'Cormorant Garamond',serif",fontSize:size,color:C.white,...extra}},text);

const NavBar=()=>React.createElement("nav",{style:{position:"fixed",top:0,left:0,right:0,zIndex:500,height:"calc(60px + env(safe-area-inset-top))",display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:"env(safe-area-inset-top)",paddingLeft:"24px",paddingRight:"24px",background:scrolled?"rgba(10,10,10,0.98)":"rgba(10,10,10,0.92)",backdropFilter:"blur(14px)",borderBottom:"1px solid "+C.border}},
React.createElement("div",{onClick:()=>navTo("explore"),style:{cursor:"pointer"}},
React.createElement("div",{style:{fontFamily:"'DM Mono',monospace",fontSize:"0.48rem",letterSpacing:"0.22em",color:C.gold,textTransform:"uppercase"}},"EXCLUSIVE"),
React.createElement("div",{style:{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.1rem",fontWeight:600,color:C.white,lineHeight:1.1}},"Detroit")
),
React.createElement("div",{style:{display:"flex",gap:22,alignItems:"center"}},
[["explore","Explore"],["map","Map"],["favorites","Saves"],["neighborhoods","Areas"],["about","About"]].map(([s,l])=>
React.createElement("button",{key:s,onClick:()=>navTo(s),style:{fontFamily:"'DM Mono',monospace",fontSize:"0.54rem",letterSpacing:"0.14em",textTransform:"uppercase",background:"none",border:"none",cursor:"pointer",padding:"4px 0",color:section===s?C.gold:C.smoke,borderBottom:section===s?"1px solid "+C.gold:"1px solid transparent",display:"flex",alignItems:"center",gap:4}},
l,
s==="favorites"&&favs.length>0&&React.createElement("span",{style:{background:C.gold,color:C.black,borderRadius:100,padding:"1px 5px",fontSize:"0.48rem",fontWeight:600}},favs.length)
)
)
)
);

const Hero=()=>React.createElement("div",{style:{minHeight:"66vh",display:"flex",alignItems:"center",justifyContent:"center",paddingTop:0,background:"linear-gradient(135deg,#0A0808 0%,#0E0D14 45%,#090E10 100%)",position:"relative",overflow:"hidden"}},
React.createElement("div",{style:{position:"absolute",inset:0,opacity:0.35,pointerEvents:"none"}},
React.createElement("div",{style:{position:"absolute",width:500,height:500,top:"10%",left:"5%",borderRadius:"50%",background:"radial-gradient(circle,rgba(201,168,76,0.12) 0%,transparent 70%)"}}),
React.createElement("div",{style:{position:"absolute",width:400,height:400,bottom:"5%",right:"5%",borderRadius:"50%",background:"radial-gradient(circle,rgba(110,75,195,0.09) 0%,transparent 70%)"}})
),
React.createElement("div",{style:{position:"relative",zIndex:2,maxWidth:680,padding:"36px 22px",textAlign:"center"}},
React.createElement("p",{style:{fontFamily:"'DM Mono',monospace",fontSize:"0.55rem",letterSpacing:"0.26em",textTransform:"uppercase",color:C.gold,marginBottom:16}},"If you know, you know."),
React.createElement("h1",{style:{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(2.8rem,7vw,5.5rem)",fontWeight:300,lineHeight:0.92,color:C.white,marginBottom:20}},
"Detroit",React.createElement("br"),React.createElement("em",{style:{fontStyle:"italic",color:C.goldL}},"Hidden Spots")
),
React.createElement("p",{style:{fontSize:"0.9rem",fontWeight:300,color:"rgba(232,224,212,0.65)",maxWidth:480,margin:"0 auto 26px",lineHeight:1.82}},"The insider's guide to Detroit's most exclusive bars, speakeasies, rooftops, and hidden nightlife. Not for everyone - made for you."),
React.createElement("div",{style:{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}},
["Breakfast","Sports","Hidden Bars","Rooftops","Dinner","Happy Hour","Cocktail Lounges","Nightlife"].map(c=>
React.createElement("button",{key:c,onClick:()=>goCategory(c),style:{fontFamily:"'DM Mono',monospace",fontSize:"0.52rem",letterSpacing:"0.11em",textTransform:"uppercase",border:"1px solid "+(cat===c?C.gold:"rgba(201,168,76,0.32)"),color:cat===c?C.black:C.goldL,background:cat===c?C.gold:"transparent",padding:"7px 14px",borderRadius:100,cursor:"pointer",transition:"all 0.18s"}},c)
)
),
React.createElement("div",{style:{display:"flex",gap:10,justifyContent:"center",marginTop:20,flexWrap:"wrap"}},
React.createElement("button",{onClick:activateNearMe,style:{fontFamily:"'DM Mono',monospace",fontSize:"0.52rem",letterSpacing:"0.12em",textTransform:"uppercase",border:"1px solid "+C.purple,color:C.purple,background:"rgba(200,174,255,0.08)",padding:"9px 20px",borderRadius:100,cursor:"pointer"}},"◉ Near Me"),
React.createElement("button",{onClick:()=>navTo("map"),style:{fontFamily:"'DM Mono',monospace",fontSize:"0.52rem",letterSpacing:"0.12em",textTransform:"uppercase",border:"1px solid rgba(201,168,76,0.4)",color:C.goldL,background:"transparent",padding:"9px 20px",borderRadius:100,cursor:"pointer"}},"View Map →")
)
)
);

const GeoModal=()=>!geoModal?null:React.createElement("div",{style:{position:"fixed",inset:0,zIndex:9999,background:"rgba(5,4,8,0.88)",backdropFilter:"blur(14px)",WebkitBackdropFilter:"blur(14px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"0 24px"},onClick:()=>setGeoModal(false)},
React.createElement("div",{style:{background:"#0E0D14",border:"1px solid rgba(201,168,76,0.28)",borderRadius:22,padding:"44px 32px 36px",maxWidth:360,width:"100%",textAlign:"center",position:"relative",boxShadow:"0 32px 80px rgba(0,0,0,0.7)"},onClick:e=>e.stopPropagation()},
React.createElement("div",{style:{width:44,height:44,borderRadius:"50%",border:"1px solid rgba(201,168,76,0.35)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 22px",color:C.gold,fontSize:"1.1rem"}},"◎"),
React.createElement("h3",{style:{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.4rem",fontWeight:400,color:C.white,lineHeight:1.3,marginBottom:14}},"Allow Exclusive Detroit to use your location?"),
React.createElement("p",{style:{fontSize:"0.84rem",fontWeight:300,color:"rgba(232,224,212,0.58)",lineHeight:1.78,marginBottom:34}},"We use your location to show the best nearby spots and sort results closest to you."),
React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:10}},
React.createElement("button",{onClick:()=>{setGeoModal(false);doGetLocation();},style:{fontFamily:"'DM Mono',monospace",fontSize:"0.52rem",letterSpacing:"0.15em",textTransform:"uppercase",background:C.gold,color:"#0A0808",border:"none",borderRadius:100,padding:"14px 0",cursor:"pointer",width:"100%",fontWeight:600}},"Continue"),
React.createElement("button",{onClick:()=>setGeoModal(false),style:{fontFamily:"'DM Mono',monospace",fontSize:"0.52rem",letterSpacing:"0.15em",textTransform:"uppercase",background:"transparent",color:"rgba(232,224,212,0.38)",border:"1px solid rgba(232,224,212,0.12)",borderRadius:100,padding:"13px 0",cursor:"pointer",width:"100%"}},"Not Now")
)
)
);

const grid=(items,onOpen)=>React.createElement("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:15}},
items.map((v,i)=>React.createElement(VCard,{key:String(v.id),venue:v,isFav:isFav(v.id),onFav:toggleFav,onOpen,i}))
);

const Explore=()=>React.createElement("div",null,
React.createElement(Hero),
React.createElement("div",{style:{background:C.deep,borderTop:"1px solid "+C.border,borderBottom:"1px solid "+C.border,padding:"20px 24px"}},
React.createElement("div",{style:{maxWidth:800,margin:"0 auto",textAlign:"center",display:"flex",alignItems:"center",gap:16,justifyContent:"center",flexWrap:"wrap"}},
React.createElement("span",{style:{color:C.goldD}},"◈"),
React.createElement("p",{style:{fontFamily:"'Cormorant Garamond',serif",fontSize:"1rem",fontStyle:"italic",color:C.ash,lineHeight:1.65}},
"This is Detroit ",React.createElement("em",{style:{color:C.goldL}},"beyond")," the obvious. Every spot here rewards curiosity - the traveler who wanders off the main drag, asks the bartender for a real recommendation, and stays past midnight."
),
React.createElement("span",{style:{color:C.goldD}},"◈")
)
),
UPCOMING.length>0&&React.createElement("div",{style:{background:"linear-gradient(180deg,#0D0B10 0%,"+C.deep+" 100%)",borderBottom:"1px solid "+C.border,paddingBottom:48}},
React.createElement("div",{style:{maxWidth:1200,margin:"0 auto",padding:"0 22px"}},
React.createElement("div",{style:{paddingTop:44,paddingBottom:24}},
React.createElement("div",{style:{display:"flex",alignItems:"center",gap:14,marginBottom:10}},
React.createElement("span",{style:{fontFamily:"'DM Mono',monospace",fontSize:"0.53rem",letterSpacing:"0.22em",textTransform:"uppercase",color:C.purple}},"New & Noteworthy"),
React.createElement("div",{style:{flex:1,height:1,background:"rgba(110,75,195,0.25)"}})
),
React.createElement("h2",{style:{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(1.6rem,4vw,2.5rem)",fontWeight:400,color:C.white}},"Opening Soon in Detroit")
),
React.createElement("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:15}},
UPCOMING.map((v,i)=>React.createElement(UCard,{key:v.id,venue:v,i,onOpen:setModalId,isFav:isFav(v.id),onFav:toggleFav}))
)
)
),
React.createElement("div",{ref:filtersRef,style:{position:"sticky",top:"calc(60px + env(safe-area-inset-top))",zIndex:200,background:C.black,borderBottom:"1px solid "+C.border,padding:"12px 0 0"}},
React.createElement("div",{style:{maxWidth:1200,margin:"0 auto",padding:"0 22px"}},
React.createElement("div",{ref:chipRowRef,style:{display:"flex",gap:7,overflowX:"auto",paddingBottom:12,scrollbarWidth:"none"}},
CATS.map(c=>{
const active=c===cat;
return React.createElement("button",{key:c,onClick:()=>switchCat(c),style:{fontFamily:"'DM Mono',monospace",fontSize:"0.52rem",letterSpacing:"0.11em",textTransform:"uppercase",padding:"6px 14px",border:"1px solid "+(active?C.gold:C.border),background:active?C.gold:"transparent",color:active?C.black:C.smoke,borderRadius:100,whiteSpace:"nowrap",cursor:"pointer",transition:"all 0.16s"}},c==="all"?"All Spots":c);
})),
React.createElement("div",{style:{paddingBottom:10,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}},
nearMe?React.createElement("button",{onClick:deactivateNearMe,style:{fontFamily:"'DM Mono',monospace",fontSize:"0.5rem",letterSpacing:"0.1em",textTransform:"uppercase",border:"1px solid "+C.purple,color:C.black,background:C.purple,padding:"5px 12px",borderRadius:100,cursor:"pointer"}},"◉ Near Me ×"):React.createElement("button",{onClick:activateNearMe,style:{fontFamily:"'DM Mono',monospace",fontSize:"0.5rem",letterSpacing:"0.1em",textTransform:"uppercase",border:"1px solid "+C.border,color:C.smoke,background:"transparent",padding:"5px 12px",borderRadius:100,cursor:"pointer"}},"◉ Near Me"),
nearMe&&userCoords&&React.createElement("span",{style:{fontFamily:"'DM Mono',monospace",fontSize:"0.46rem",color:C.purple,letterSpacing:"0.08em"}},"Sorted by distance"),
geoError&&!nearMe&&React.createElement("span",{style:{fontSize:"0.73rem",color:"#E8A0A0",fontWeight:300}},geoError)
)
)
),
React.createElement("div",{style:{borderBottom:"1px solid "+C.borderS,padding:"9px 0"}},
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
:grid(shown,setModalId)
)
);

const Favs=()=>React.createElement("div",null,
React.createElement("div",{style:{background:"linear-gradient(160deg,#110D07 0%,"+C.deep+" 100%)",padding:"64px 22px 40px",borderBottom:"1px solid "+C.border}},
React.createElement("p",{style:{fontFamily:"'DM Mono',monospace",fontSize:"0.53rem",letterSpacing:"0.22em",textTransform:"uppercase",color:C.gold,marginBottom:8}},"Your Collection"),
React.createElement("h2",{style:{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(1.8rem,5vw,3rem)",fontWeight:400,color:C.white,marginBottom:8}},"Saved Spots"),
React.createElement("p",{style:{fontSize:"0.84rem",color:C.smoke}},"Your personal insider list.")
),
React.createElement("div",{style:{maxWidth:1200,margin:"0 auto",padding:"24px 22px 56px"}},
favVenues.length===0
?React.createElement("div",{style:{textAlign:"center",padding:"56px 20px"}},
React.createElement("div",{style:{fontSize:"2rem",color:C.goldD,marginBottom:16}},"◈"),
React.createElement("h3",{style:{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.6rem",fontWeight:400,color:C.white,marginBottom:9}},"Nothing saved yet"),
React.createElement("p",{style:{color:C.smoke,fontSize:"0.82rem",marginBottom:20}},"Browse spots and tap the heart to build your list."),
React.createElement("button",{onClick:()=>navTo("explore"),style:{fontFamily:"'DM Mono',monospace",fontSize:"0.58rem",letterSpacing:"0.14em",textTransform:"uppercase",color:C.gold,border:"1px solid "+C.goldD,padding:"9px 20px",borderRadius:6,background:"transparent",cursor:"pointer"}},"Back to Explore")
)
:grid(favVenues,setModalId)
)
);

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

return React.createElement("div",{style:{background:C.black,color:C.bone,fontFamily:"'DM Sans',sans-serif",minHeight:"100vh",fontSize:15,lineHeight:1.6}},
React.createElement(NavBar),
React.createElement("div",{style:{marginTop:"calc(60px + env(safe-area-inset-top))"}},
section==="explore"       && React.createElement(Explore),
section==="map"           && React.createElement(MapView,{isFav,toggleFav,setModalId}),
section==="favorites"     && React.createElement(Favs),
section==="neighborhoods" && React.createElement(Areas),
section==="about"         && React.createElement(About)
),
section!=="map"&&React.createElement("footer",{style:{background:C.deep,borderTop:"1px solid "+C.border,padding:"36px 22px 24px"}},
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
React.createElement("div",{style:{display:"flex",justifyContent:"space-between",paddingTop:16,fontFamily:"'DM Mono',monospace",fontSize:"0.5rem",letterSpacing:"0.1em",textTransform:"uppercase",color:C.smoke}},
React.createElement("span",null,"2026 Exclusive City Guides"),
React.createElement("span",null,"Detroit Edition v5.0")
)
)
),
React.createElement(GeoModal),
modalId!==null&&React.createElement(Modal,{venue:modalVenue,isFav:isFav(modalId),onFav:toggleFav,onClose:()=>setModalId(null)}),
React.createElement(Toast,{msg:toast.msg,vis:toast.vis})
);
}