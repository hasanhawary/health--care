// Lazy, rate-limited geocoding with a persistent localStorage cache.
// Wraps utils/geocode.js so each address is geocoded at most once, ever.
import { geocode } from '../utils/geocode'
import { geoQuery, getGeo, setGeo, isGeocoded, markFailed } from '../utils/geoCache'

const RATE_MS = 1100 // <= 1 req/s to respect provider usage policies
let chain = Promise.resolve()
const delay = (ms) => new Promise((r) => setTimeout(r, ms))
function throttled(fn) {
  const run = chain.then(() => fn())
  chain = run.then(
    () => delay(RATE_MS),
    () => delay(RATE_MS)
  )
  return run
}

export function useGeocoding() {
  function geocodeOne(p) {
    const cached = getGeo(p)
    if (cached) return Promise.resolve(cached)
    if (isGeocoded(p)) return Promise.resolve(null)
    return throttled(() => geocode(geoQuery(p)))
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

  function geocodeMany(list, { onResult, onProgress, signal } = {}) {
    let cancelled = false
    if (signal) signal.addEventListener('abort', () => (cancelled = true))
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
