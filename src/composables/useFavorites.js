// Favorites + recently viewed + recent searches, persisted via useStorage.
import { useStorage } from '@vueuse/core'

const favorites = useStorage('allianz_favorites', [])
const recentViews = useStorage('allianz_recent_views', [])
const recentSearches = useStorage('allianz_recent_searches', [])

const MAX_VIEWS = 12
const MAX_SEARCHES = 8

export function useFavorites() {
  function isFavorite(id) {
    return favorites.value.some((p) => p.id === id)
  }

  function toggleFavorite(provider) {
    const i = favorites.value.findIndex((p) => p.id === provider.id)
    if (i >= 0) {
      favorites.value.splice(i, 1)
      return false
    }
    favorites.value.unshift({ ...provider })
    return true
  }

  function addRecentView(provider) {
    const id = provider.id
    const filtered = recentViews.value.filter((p) => p.id !== id)
    filtered.unshift({
      id: provider.id,
      name: provider.name,
      providerType: provider.providerType,
      providerTypeAr: provider.providerTypeAr,
      governorate: provider.governorate,
      governorateAr: provider.governorateAr,
      area: provider.area,
      areaAr: provider.areaAr,
      live: provider.live,
    })
    recentViews.value = filtered.slice(0, MAX_VIEWS)
  }

  function addRecentSearch(q) {
    const val = (q || '').trim()
    if (!val) return
    const filtered = recentSearches.value.filter((s) => s !== val)
    filtered.unshift(val)
    recentSearches.value = filtered.slice(0, MAX_SEARCHES)
  }

  function clearRecentSearches() {
    recentSearches.value = []
  }

  function clearRecentViews() {
    recentViews.value = []
  }

  return {
    favorites,
    recentViews,
    recentSearches,
    isFavorite,
    toggleFavorite,
    addRecentView,
    addRecentSearch,
    clearRecentSearches,
    clearRecentViews,
  }
}
