// Loads + parses the Allianz Egypt Excel file (from public/data) into a list of
// provider objects. Parsing runs in a Web Worker to keep the UI responsive.
// Results are cached in localStorage. Shared singleton state.
import * as XLSX from 'xlsx'
import { ref, shallowRef } from 'vue'
import { parseRows } from '../utils/parseProviders'
import { setGeo, setGeoMany } from '../utils/geoCache'

const DATA_URL = `${import.meta.env.BASE_URL}data/Allianz%20Egypt%20GN.xlsx`
const COORDS_URL = `${import.meta.env.BASE_URL}data/provider-coordinates.json`
const CACHE_KEY = 'allianz_providers_v3'

// shallowRef: providers are immutable parsed data — no deep reactivity needed.
// This keeps every filter/facet scan off the reactive-proxy path (big perf win).
const providers = shallowRef([])
const loading = ref(false)
const error = ref(null)
const loaded = ref(false)
const count = ref(0)
const progress = ref('') // human-readable status
let loadPromise = null

let worker = null
function getWorker() {
  if (worker) return worker
  try {
    worker = new Worker(new URL('../utils/parseWorker.js', import.meta.url), { type: 'module' })
  } catch (e) {
    worker = null
  }
  return worker
}

function parseWithWorker(buf) {
  return new Promise((resolve, reject) => {
    const w = getWorker()
    if (!w) {
      reject(new Error('worker unavailable'))
      return
    }
    const timeout = setTimeout(() => reject(new Error('worker timeout')), 4000)
    const onMessage = (e) => {
      clearTimeout(timeout)
      w.removeEventListener('message', onMessage)
      w.removeEventListener('error', onError)
      if (e.data?.ok) resolve(e.data.providers)
      else reject(new Error(e.data?.error || 'worker parse failed'))
    }
    const onError = () => {
      clearTimeout(timeout)
      w.removeEventListener('message', onMessage)
      w.removeEventListener('error', onError)
      reject(new Error('worker error'))
    }
    w.addEventListener('message', onMessage)
    w.addEventListener('error', onError)
    w.postMessage({ buf }, [buf])
  })
}

function parseInline(buf) {
  const wb = XLSX.read(buf, { type: 'array' })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' })
  return parseRows(rows)
}

async function fetchAndParse() {
  progress.value = 'downloading'
  const res = await fetch(DATA_URL)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const buf = await res.arrayBuffer()
  progress.value = 'parsing'
  let data
  try {
    data = await parseWithWorker(buf.slice(0))
    if (!data || !data.length) throw new Error('worker empty')
  } catch (e) {
    // Fallback: parse on the main thread.
    data = parseInline(buf)
  }
  progress.value = ''
  return data
}

// Prime the geocode cache from a pre-generated coordinates file so the map
// shows every provider instantly without live geocoding. Non-blocking; a
// missing/partial file just means the map geocodes lazily instead.
const coordsPrimed = ref(false)
let primingStarted = false
  async function primeCoordinates(list) {
    if (primingStarted || !list || !list.length) return
    primingStarted = true
    try {
      const res = await fetch(COORDS_URL)
      if (!res.ok) return
      const map = await res.json()
      if (!map || typeof map !== 'object') return
      setGeoMany(list, (p) => map[p.id])
    } catch (e) {
      /* file missing -> map will geocode lazily */
    } finally {
      // flip reactive flag only once the cache is fully populated (or fetch
      // failed) so the map rebuilds with real coordinates instead of re-geocoding.
      coordsPrimed.value = true
    }
  }
export function useExcelProviders() {
  async function load() {
    if (loaded.value) return providers.value
    if (loadPromise) return loadPromise
    loading.value = true
    error.value = null
    loadPromise = (async () => {
      try {
        const cached = localStorage.getItem(CACHE_KEY)
        if (cached) {
          const data = JSON.parse(cached)
          if (Array.isArray(data) && data.length) {
            providers.value = data
            count.value = data.length
            loaded.value = true
            primeCoordinates(data)
            return data
          }
        }
        const data = await fetchAndParse()
        providers.value = data
        count.value = data.length
        loaded.value = true
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(data))
        } catch (e) {
          /* quota exceeded -> keep in memory only */
        }
        primeCoordinates(data)
        return data
      } catch (e) {
        error.value = e?.message || 'Failed to load providers'
        throw e
      } finally {
        loading.value = false
      }
    })()
    return loadPromise
  }

  function reload() {
    loaded.value = false
    loadPromise = null
    error.value = null
    try {
      localStorage.removeItem(CACHE_KEY)
    } catch (e) {}
    return load()
  }

  return { providers, loading, error, loaded, count, progress, coordsReady: coordsPrimed, load, reload }
}
