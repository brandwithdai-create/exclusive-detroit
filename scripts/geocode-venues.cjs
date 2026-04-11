/**
 * ExclusiveDetroit venue geocoder — uses Google Places Text Search API
 * Cache-first: each venue geocoded ONCE, result stored in geocode-cache.json
 *
 * Usage:
 *   node scripts/geocode-venues.cjs --batch=test   (10 representative venues)
 *   node scripts/geocode-venues.cjs --batch=all    (all 88 venues, cache-first)
 */

const https = require('https');
const fs    = require('fs');
const path  = require('path');

const API_KEY    = process.env.GOOGLE_PLACES_KEY;
const CACHE_PATH = path.join(__dirname, 'geocode-cache.json');
const INPUT_PATH = path.join(__dirname, 'venue_list.json');
const COORDS_PATH= path.join(__dirname, 'current-coords.json');

if (!API_KEY) { console.error('ERROR: GOOGLE_PLACES_KEY not set'); process.exit(1); }

let cache = fs.existsSync(CACHE_PATH)
  ? JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'))
  : {};
console.log(`Cache: ${Object.keys(cache).length} existing entries`);

const allVenues  = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));
const currCoords = JSON.parse(fs.readFileSync(COORDS_PATH, 'utf8'));

const arg  = process.argv[2] || '--batch=test';
const mode = arg.includes('all') ? 'all' : 'test';

// Representative spread: Downtown, Corktown, Midtown, Core City, East, Far
const TEST_IDS = ['1','4','21','31','38','57','65','u1','r2','r4'];
const batch = mode === 'all' ? allVenues : allVenues.filter(v => TEST_IDS.includes(String(v.id)));
console.log(`\nMode: ${mode.toUpperCase()} | ${batch.length} venues\n`);

// Clean address: strip parenthetical notes, floor/suite info
function cleanQuery(venue) {
  const addr = venue.addr
    .replace(/\s*\(.*?\)/g, '')
    .replace(/,?\s*(Suite\s*\d*|Ste\s*\d*|\d+th\s+Floor|\d+nd\s+Floor|Lower Level|Sublevel|Penthouse|Floor\s*\d*|Floors?\s*[\d\s&]+)\b/gi, '')
    .replace(/\s{2,}/g, ' ').trim();
  return `${venue.name} ${addr}`;
}

// Google Places Text Search — returns lat/lng + formatted address
function placesSearch(query) {
  return new Promise((resolve, reject) => {
    const url = 'https://maps.googleapis.com/maps/api/place/textsearch/json'
      + '?query=' + encodeURIComponent(query)
      + '&key=' + API_KEY;
    https.get(url, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(d);
          if (json.status === 'OK' && json.results.length > 0) {
            const r = json.results[0];
            resolve({
              status:    'OK',
              lat:       r.geometry.location.lat,
              lng:       r.geometry.location.lng,
              formatted: r.formatted_address,
              placeName: r.name
            });
          } else {
            resolve({ status: json.status || 'NO_RESULTS', lat: null, lng: null });
          }
        } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

// Distance in feet between two lat/lng points
function distFt(lat1, lng1, lat2, lng2) {
  const R = 3958.8, d2r = Math.PI / 180;
  const dlat = (lat2-lat1)*d2r, dlng = (lng2-lng1)*d2r;
  const a = Math.sin(dlat/2)**2 + Math.cos(lat1*d2r)*Math.cos(lat2*d2r)*Math.sin(dlng/2)**2;
  return Math.round(R * 2 * Math.asin(Math.sqrt(a)) * 5280);
}

async function run() {
  const results = [];
  let apiCalls = 0, cacheHits = 0, failed = 0;

  for (const venue of batch) {
    const cacheKey = String(venue.id);
    let geo;

    if (cache[cacheKey]) {
      geo = cache[cacheKey];
      cacheHits++;
    } else {
      await new Promise(r => setTimeout(r, 150)); // ~6 req/s
      const query = cleanQuery(venue);
      geo = await placesSearch(query);
      apiCalls++;
      if (geo.status === 'OK') {
        cache[cacheKey] = geo;
        fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
      }
    }

    const ok  = geo.status === 'OK';
    if (!ok) failed++;

    const cur   = currCoords[String(venue.id)];
    const feet  = (ok && cur) ? distFt(geo.lat, geo.lng, cur[0], cur[1]) : null;

    results.push({
      id:        String(venue.id),
      name:      venue.name,
      addr:      venue.addr,
      status:    geo.status,
      geocoded:  ok ? [parseFloat(geo.lat.toFixed(6)), parseFloat(geo.lng.toFixed(6))] : null,
      current:   cur || null,
      deltaFt:   feet,
      formatted: geo.formatted || '',
      placeName: geo.placeName || ''
    });

    const src    = cache[cacheKey] && !apiCalls ? 'CACHE' : (ok ? 'API  ' : 'FAIL ');
    const delta  = (ok && cur) ? `  Δ${feet}ft` : '';
    const warn   = (ok && cur && feet > 300) ? '  ⚠️  LARGE DELTA' : '';
    console.log(
      `[${src}] id:${String(venue.id).padEnd(4)} ${venue.name.padEnd(34)} ` +
      `${ok ? '['+geo.lat.toFixed(6)+','+geo.lng.toFixed(6)+']' : '❌ '+geo.status}` +
      delta + warn
    );
  }

  const outPath = path.join(__dirname, `geocode-results-${mode}.json`);
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));

  console.log('\n── Summary ────────────────────────────────────────────────────');
  console.log(`  Total: ${batch.length} | API: ${apiCalls} | Cache: ${cacheHits} | Failed: ${failed}`);
  console.log(`  Results → ${outPath}`);

  const bigDelta = results.filter(r => r.geocoded && r.current && r.deltaFt > 300);
  if (bigDelta.length) {
    console.log(`\n⚠️  ${bigDelta.length} venue(s) with current coord >300ft off:`);
    bigDelta.forEach(r =>
      console.log(`  id:${r.id} "${r.name}"\n    current:  ${JSON.stringify(r.current)}\n    geocoded: ${JSON.stringify(r.geocoded)}\n    delta:    ${r.deltaFt}ft\n    google:   ${r.formatted}`));
  }

  if (failed === 0 && mode === 'all') {
    const updated = { ...currCoords };
    results.forEach(r => { if (r.geocoded) updated[r.id] = r.geocoded; });
    const snippetPath = path.join(__dirname, 'corrected-coords-all.json');
    fs.writeFileSync(snippetPath, JSON.stringify(updated, null, 2));
    console.log(`\n✅ Corrected COORDS saved → ${snippetPath}`);
    console.log('   Run apply-coords.cjs to patch App.jsx');
  }
}

run().catch(e => { console.error(e); process.exit(1); });
