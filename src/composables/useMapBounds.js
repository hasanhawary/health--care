// Tracks the current Leaflet map bounds + "search this area" state.
// Shared singleton; consumed by useProviderFilters for bounds filtering.
import { ref } from 'vue'

const mapBounds = ref(null) // { north, south, east, west }
const searchAreaActive = ref(false)
const mapMoved = ref(false) // true after the user pans/zooms (shows "search this area")

function setMapBounds(b) {
  mapBounds.value = b
}
function markMoved() {
  if (searchAreaActive.value) return
  mapMoved.value = true
}
function activateSearchArea() {
  searchAreaActive.value = true
  mapMoved.value = false
}
function clearSearchArea() {
  searchAreaActive.value = false
  mapMoved.value = false
}
function resetMapBounds() {
  mapBounds.value = null
  searchAreaActive.value = false
  mapMoved.value = false
}

export function useMapBounds() {
  return {
    mapBounds,
    searchAreaActive,
    mapMoved,
    setMapBounds,
    markMoved,
    activateSearchArea,
    clearSearchArea,
    resetMapBounds,
  }
}
