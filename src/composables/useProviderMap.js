// Shared state linking the provider list and the map (selection / hover / focus).
import { ref } from 'vue'

const selectedId = ref(null)
const hoveredId = ref(null)
const flyToId = ref(null) // set by list clicks; the map watches & flies to it
const mapReady = ref(false)

function selectProvider(id) {
  selectedId.value = id
}
function hoverProvider(id) {
  hoveredId.value = id
}
function focusMarker(id) {
  flyToId.value = id
  selectedId.value = id
}
function clearSelection() {
  selectedId.value = null
}

export function useProviderMap() {
  return {
    selectedId,
    hoveredId,
    flyToId,
    mapReady,
    selectProvider,
    hoverProvider,
    focusMarker,
    clearSelection,
  }
}
