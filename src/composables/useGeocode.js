// Lazy, throttled geocoding via OpenStreetMap Nominatim. Results are cached
// (see geoCache) so each address is geocoded at most once, ever.
import { geoQuery, getGeo, isGeocoded, setGeo, markFailed } from '../utils/geoCache'

const NOMINATIM = 'https://nominatim.openstreetmap.org/search'
const RATE_MS = 1100 // respect Nominatim usage policy (<= 1 req/s)

let chain = Promise.resolve()
function delay(ms) {
  return new Promise((r) => setTimeout(r, ms))
}
function throttled(fn) {
  const run = chain.then(() => fn())
  chain = run.then(
    () => delay(RATE_MS),
    () => delay(RATE_MS)
  )
  return run
}

async function fetchCoords(p) {
  const q = geoQuery(p)
  const url = `${NOMINATIM}?format=jsonv2&limit=1&q=${encodeURIComponent(q)}`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`geocode ${res.status}`)
  const data = await res.json()
  if (Array.isArray(data) && data.length) {
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
  }
  return null
}

export function useGeocode() {
  /** Geocode a single provider (cached). Resolves to coords or null. */
  function geocodeOne(p) {
    const cached = getGeo(p)
    if (cached) return Promise.resolve(cached)
    if (isGeocoded(p)) return Promise.resolve(null) // previously failed
    return throttled(() => fetchCoords(p))
      .then((coords) => {
        if (coords) {
          setGeo(p, coords)
          return coords
        }
        markFailed(p)
        return null
      })
      .catch(() => {
        markFailed(p)
        return null
      })
  }

  /**
   * Geocode a list of providers sequentially (throttled). Calls onResult for
   * each successful geocode and onProgress(done,total). Returns a cancel fn.
   */
  function geocodeMany(list, { onResult, onProgress } = {}) {
    let cancelled = false
    const total = list.length
    let done = 0
    ;(async () => {
      for (const p of list) {
        if (cancelled) break
        const coords = await geocodeOne(p)
        done++
        if (coords && onResult) onResult(p, coords)
        if (onProgress) onProgress(done, total)
      }
    })()
    return () => {
      cancelled = true
    }
  }

  return { geocodeOne, geocodeMany }
}
