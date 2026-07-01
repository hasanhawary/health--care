// Geocoding abstraction. Supports multiple strategies; never hardcodes keys.
// Active strategy defaults to OpenStreetMap Nominatim (no key required).
import { cleanCell } from './normalizeText'

const strategies = {
  nominatim: async (query) => {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) throw new Error(`nominatim ${res.status}`)
    const data = await res.json()
    if (Array.isArray(data) && data.length) {
      return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
    }
    return null
  },
  google: async (query) => {
    if (!googleKey) throw new Error('Google geocoding key not set')
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${googleKey}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`google ${res.status}`)
    const data = await res.json()
    if (data.status === 'OK' && data.results.length) {
      const loc = data.results[0].geometry.location
      return { lat: loc.lat, lon: loc.lng }
    }
    return null
  },
  manual: async (query) => {
    const key = cleanCell(query).toLowerCase()
    return manualCoords[key] || null
  },
}

let active = 'nominatim'
let googleKey = null
let manualCoords = {}

export function setGeocodeStrategy(name) {
  if (strategies[name]) active = name
}
export function getActiveStrategy() {
  return active
}
export function setGoogleKey(key) {
  googleKey = key || null
}
export function setManualCoords(map) {
  manualCoords = map || {}
}
export async function geocode(query) {
  return strategies[active](query)
}
