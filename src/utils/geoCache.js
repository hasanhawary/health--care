// Lightweight localStorage cache for geocoded coordinates. Keyed by the
// normalized geocode query so identical addresses are never geocoded twice.
import { cleanCell, normalizeArabic } from './normalizeText'

const CACHE_KEY = 'allianz_geocache_v1'
let cache = null

function load() {
  if (cache) return cache
  try {
    cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}')
  } catch (e) {
    cache = {}
  }
  return cache
}

function save() {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch (e) {
    /* quota */
  }
}

export function geoQuery(p) {
  return [p.name, p.address || p.addressAr, p.area || p.areaAr, p.governorate || p.governorateAr, 'Egypt']
    .filter(Boolean)
    .map((s) => cleanCell(s))
    .join(', ')
}

function cacheKey(p) {
  return normalizeArabic(geoQuery(p))
}

export function getGeo(p) {
  const c = load()[cacheKey(p)]
  if (c && c.lat != null && c.lon != null) return { lat: c.lat, lon: c.lon }
  return null
}

export function isGeocoded(p) {
  return cacheKey(p) in load()
}

export function setGeo(p, coords) {
  load()[cacheKey(p)] = { lat: coords.lat, lon: coords.lon }
  save()
}

/**
 * Bulk-priming helper: set coordinates for many providers with a SINGLE
 * localStorage write. Calling `setGeo` in a loop is O(n^2) because each call
 * re-serializes the whole cache — that froze the main thread and crashed the
 * renderer when priming ~4k providers on reload.
 */
export function setGeoMany(providers, getCoords) {
  const c = load()
  let n = 0
  for (const p of providers) {
    const coords = getCoords && getCoords(p)
    if (coords && coords.lat != null && coords.lon != null) {
      c[cacheKey(p)] = { lat: coords.lat, lon: coords.lon }
      n++
    }
  }
  if (n) save()
  return n
}

export function markFailed(p) {
  load()[cacheKey(p)] = { failed: true }
  save()
}

export function geoCacheSize() {
  return Object.keys(load()).length
}
