// Anonymous analytics: local search/view stats (device-only) + a lightweight
// server-side unique-visitor counter backed by Vercel KV (see /api/track.js).
import { computed, ref } from 'vue'
import { useStorage } from '@vueuse/core'
import { normalizeArabic } from '../utils/normalizeText'

const store = useStorage('allianz_analytics_v1', {
  searches: {}, // normalized term -> count
  viewed: {}, // provider id (string) -> count
  specialties: {}, // specialtyKey -> count
  cities: {}, // govKey -> count
})

// Fire-and-forget visit tracking. Gated to once per browser session via
// sessionStorage so a page refresh does not inflate the counters.
const VISIT_FLAG = 'allianz_visit_tracked'
let visitPromise = null

export function trackVisit() {
  if (typeof window === 'undefined') return Promise.resolve(false)
  try {
    if (sessionStorage.getItem(VISIT_FLAG)) return Promise.resolve(false)
  } catch (e) {}
  if (!visitPromise) {
    visitPromise = fetch('/api/track', { method: 'POST' })
      .then(() => {
        try { sessionStorage.setItem(VISIT_FLAG, '1') } catch (e) {}
        return true
      })
      .catch(() => false)
  }
  return visitPromise
}

export function useVisitorStats() {
  const stats = ref({ totalVisits: 0, todayVisits: 0, weekVisits: 0, uniqueVisitors: 0, configured: false })
  async function refresh() {
    try {
      const res = await fetch('/api/stats')
      stats.value = await res.json()
    } catch (e) {}
    return stats.value
  }
  return { stats, refresh }
}

export function useAnalytics() {
  function trackSearch(term) {
    const v = normalizeArabic(term)
    if (!v) return
    store.value.searches = { ...store.value.searches, [v]: (store.value.searches[v] || 0) + 1 }
  }

  function trackView(p) {
    if (!p) return
    const id = String(p.id)
    store.value.viewed = { ...store.value.viewed, [id]: (store.value.viewed[id] || 0) + 1 }
    if (p.specialtyKey) {
      store.value.specialties = {
        ...store.value.specialties,
        [p.specialtyKey]: (store.value.specialties[p.specialtyKey] || 0) + 1,
      }
    }
    if (p.govKey) {
      store.value.cities = { ...store.value.cities, [p.govKey]: (store.value.cities[p.govKey] || 0) + 1 }
    }
  }

  function top(obj, n = 5) {
    return Object.entries(obj || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
  }

  const topSearches = computed(() => top(store.value.searches, 6))
  const topViewedIds = computed(() => top(store.value.viewed, 6))
  const topSpecialties = computed(() => top(store.value.specialties, 6))
  const topCities = computed(() => top(store.value.cities, 6))

  return { store, trackSearch, trackView, topSearches, topViewedIds, topSpecialties, topCities }
}
