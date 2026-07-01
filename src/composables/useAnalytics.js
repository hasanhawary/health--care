// Anonymous, local-only analytics. Nothing leaves the device.
import { computed } from 'vue'
import { useStorage } from '@vueuse/core'
import { normalizeArabic } from '../utils/normalizeText'

const store = useStorage('allianz_analytics_v1', {
  searches: {}, // normalized term -> count
  viewed: {}, // provider id (string) -> count
  specialties: {}, // specialtyKey -> count
  cities: {}, // govKey -> count
})

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
