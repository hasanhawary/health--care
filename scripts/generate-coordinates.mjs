// One-time geocoding pre-population for provider coordinates.
// Strategy: geocode each unique (governorate, area) centroid via Nominatim
// (rate-limited, resumable), then assign every provider in that area the
// centroid + a tiny deterministic jitter so markers don't perfectly stack.
// Falls back to governorate centroid, then Egypt center (Cairo) — never
// leaves a provider without coordinates.
//
// Usage:  node scripts/generate-coordinates.mjs
// Output: public/data/provider-coordinates.json   { "<id>": { "lat": .., "lon": .. } }
import * as XLSX from 'xlsx'
import { readFileSync, writeFileSync, existsSync } from 'fs'

const XLSX_PATH = 'public/data/Allianz Egypt GN.xlsx'
const OUT_PATH = 'public/data/provider-coordinates.json'
const AREA_CACHE_PATH = 'scripts/.area-cache.json'
const RATE_MS = 1100 // <= 1 req/s per Nominatim usage policy
const UA = 'AllianzHealthCareDirectory/1.0 (geocode-prep)'

const EGYPT_CENTER = { lat: 30.0444, lon: 31.2357 } // Cairo

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function clean(s) {
  return String(s || '').replace(/\s+/g, ' ').trim()
}

function readProviders() {
  const buf = readFileSync(XLSX_PATH)
  const wb = XLSX.read(buf, { type: 'buffer' })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' })
  const hdr = rows[0] || []
  const findCol = (names) => {
    for (let i = 0; i < hdr.length; i++) {
      const c = clean(hdr[i])
      if (names.some((n) => c.includes(n))) return i
    }
    return -1
  }
  const govCol = findCol(['المحافظة', 'Governate', 'Governorate'])
  const areaCol = findCol(['المنطقة', 'Area'])
  const nameCol = findCol(['مقدم الخدمة', 'Provider'])
  const addrCol = findCol(['العنوان', 'Address'])
  const out = []
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r] || []
    const name = clean(row[nameCol])
    if (!name && !clean(row[govCol]) && !clean(row[areaCol])) continue
    out.push({
      id: out.length,
      name,
      address: clean(row[addrCol]),
      area: clean(row[areaCol]),
      governorate: clean(row[govCol]),
    })
  }
  return out
}

function loadAreaCache() {
  if (existsSync(AREA_CACHE_PATH)) {
    try { return JSON.parse(readFileSync(AREA_CACHE_PATH, 'utf8')) } catch (e) {}
  }
  return {}
}
function saveAreaCache(c) {
  writeFileSync(AREA_CACHE_PATH, JSON.stringify(c, null, 0))
}

async function geocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=eg&q=${encodeURIComponent(query)}`
  const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': UA } })
  if (!res.ok) throw new Error(`nominatim ${res.status}`)
  const data = await res.json()
  if (Array.isArray(data) && data.length) {
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
  }
  return null
}

async function geocodeArea(governorate, area, cache) {
  const key = `${governorate}||${area}`.toLowerCase()
  if (key in cache) return cache[key]
  let coords = null
  // 1) area + governorate
  if (area && governorate && area !== governorate) {
    try { coords = await geocode(`${area}, ${governorate}, Egypt`) } catch (e) {}
    await sleep(RATE_MS)
  }
  // 2) area alone (sometimes governorate spelling differs)
  if (!coords && area) {
    try { coords = await geocode(`${area}, Egypt`) } catch (e) {}
    await sleep(RATE_MS)
  }
  // 3) governorate alone
  if (!coords && governorate) {
    try { coords = await geocode(`${governorate}, Egypt`) } catch (e) {}
    await sleep(RATE_MS)
  }
  // 4) fallback to Egypt center
  if (!coords) coords = { ...EGYPT_CENTER }
  cache[key] = coords
  saveAreaCache(cache)
  return coords
}

// Deterministic jitter so stacked area-centroid markers spread out a little.
function jitter(id) {
  const h = (id * 2654435761) % 1000003
  const dx = ((h % 2000) - 1000) / 1000 // -1..1
  const dy = ((((h / 2000) | 0) % 2000) - 1000) / 1000
  return { dlat: dy * 0.0035, dlon: dx * 0.0035 } // ~±390m
}

async function main() {
  const providers = readProviders()
  console.log(`providers: ${providers.length}`)
  const cache = loadAreaCache()
  const areas = new Map()
  for (const p of providers) {
    const k = `${p.governorate}||${p.area}`
    if (!areas.has(k)) areas.set(k, { governorate: p.governorate, area: p.area })
  }
  console.log(`unique areas to geocode: ${areas.size}`)
  let i = 0
  for (const [k, info] of areas) {
    i++
    if (k.toLowerCase() in cache) {
      continue
    }
    const c = await geocodeArea(info.governorate, info.area, cache)
    process.stdout.write(`\r[${i}/${areas.size}] ${info.governorate} / ${info.area} -> ${c ? c.lat.toFixed(4) + ',' + c.lon.toFixed(4) : 'FAIL'}` + '   ')
  }
  console.log('\nassigning coordinates to providers...')
  const out = {}
  let fallbackCount = 0
  for (const p of providers) {
    const key = `${p.governorate}||${p.area}`.toLowerCase()
    let c = cache[key] || { ...EGYPT_CENTER }
    if (key === '||') c = { ...EGYPT_CENTER }
    if (c.lat === EGYPT_CENTER.lat && c.lon === EGYPT_CENTER.lon) fallbackCount++
    const j = jitter(p.id)
    out[p.id] = { lat: +(c.lat + j.dlat).toFixed(6), lon: +(c.lon + j.dlon).toFixed(6) }
  }
  writeFileSync(OUT_PATH, JSON.stringify(out))
  console.log(`wrote ${OUT_PATH} (${providers.length} providers, ${fallbackCount} fallback to Egypt center)`)
}

main().catch((e) => { console.error(e); process.exit(1) })
