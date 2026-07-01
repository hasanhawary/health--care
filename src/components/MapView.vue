<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import { MapPin, Loader2, Search, RotateCcw } from 'lucide-vue-next'
import { useI18n } from '../composables/useI18n'
import { useTheme } from '../composables/useTheme'
import { useGeocoding } from '../composables/useGeocoding'
import { useMapBounds } from '../composables/useMapBounds'
import { useProviderMap } from '../composables/useProviderMap'
import { useProviderFilters } from '../composables/useProviderFilters'
import { useGeolocation } from '../composables/useGeolocation'
import { useExcelProviders } from '../composables/useExcelProviders'
import { getGeo } from '../utils/geoCache'
import { markerIcon, selectedIcon, userIcon, needsCoordIcon, styleFor } from '../utils/mapIcons'
import { buildTelLink, buildMapsUrl } from '../utils/maps'
import { directionsUrl } from '../utils/directions'
import { formatDistance } from '../utils/distance'
import { escapeHtml } from '../utils/normalizeText'
import MapLegend from './MapLegend.vue'
import MapControls from './MapControls.vue'

const props = defineProps({
  providers: { type: Array, default: () => [] },
  maxGeocode: { type: Number, default: 200 },
  fullscreen: { type: Boolean, default: false },
})
const emit = defineEmits(['select', 'details', 'favorite', 'ready', 'locate', 'clear-area', 'fullscreen', 'show-list'])

const { t, field } = useI18n()
const { isDark } = useTheme()
const { geocodeMany } = useGeocoding()
const { setMapBounds, markMoved, activateSearchArea, clearSearchArea, searchAreaActive, mapMoved } = useMapBounds()
const { flyToId, selectedId, selectProvider, hoverProvider } = useProviderMap()
const { distOf, radius } = useProviderFilters()
const { coords: userCoords } = useGeolocation()
const { coordsReady } = useExcelProviders()

const mapEl = ref(null)
const geoProgress = ref({ done: 0, total: 0, active: false })
const shownCount = ref(0)

let map = null
let tileLayer = null
let cluster = null
let userMarker = null
let circle = null
const markers = new Map() // id -> marker
const byId = new Map() // id -> provider
let cancelGeocode = null

const TILES_LIGHT = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const TILES_DARK = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'

function popupHtml(p) {
  const d = distOf(p)
  const dist = d != null ? `<span class="mp-dist">📍 ${formatDistance(d)}</span>` : ''
  const typeLabel = field(p, 'providerTypeAr', 'providerType')
  const addr = field(p, 'governorateAr', 'governorate') + (field(p, 'areaAr', 'area') ? ' · ' + field(p, 'areaAr', 'area') : '')
  return `<div class="mp" dir="rtl">
    <div class="mp-head">
      <div class="mp-name">${escapeHtml(p.name)}</div>
      <span class="mp-live ${p.live ? 'is-live' : ''}">${p.live ? 'LIVE' : 'NOT LIVE'}</span>
    </div>
    <div class="mp-type">${escapeHtml(typeLabel)}${p.specialty ? ' · ' + escapeHtml(field(p, 'specialtyAr', 'specialty')) : ''}</div>
    <div class="mp-addr">📍 ${escapeHtml(addr)}</div>
    ${dist}
    <div class="mp-actions">
      <a class="mp-btn mp-call" href="${buildTelLink(p.phone)}">${p.phone ? '☎ ' + escapeHtml(p.phone) : '☎ اتصل'}</a>
      <a class="mp-btn" href="${directionsUrl(p, userCoords.value)}" target="_blank" rel="noopener">🧭 الاتجاهات</a>
      <a class="mp-btn" href="${buildMapsUrl(p)}" target="_blank" rel="noopener">🗺️ الخريطة</a>
      <button class="mp-btn" data-action="details" data-pid="${p.id}">التفاصيل</button>
      <button class="mp-btn ${false ? 'is-fav' : ''}" data-action="fav" data-pid="${p.id}">♥</button>
    </div>
  </div>`
}

function makeMarker(p) {
  const g = getGeo(p)
  const icon = g ? markerIcon(p.typeKey) : needsCoordIcon()
  const m = L.marker(g ? [g.lat, g.lon] : [0, 0], { icon, title: p.name })
  if (!g) return null
  m.bindPopup(popupHtml(p), { maxWidth: 280, minWidth: 220, className: 'mp-wrap' })
  m.bindTooltip(p.name, { direction: 'top' })
  m.on('click', () => {
    selectProvider(p.id)
    emit('select', p)
  })
  m.on('mouseover', () => hoverProvider(p.id))
  m.on('mouseout', () => hoverProvider(null))
  return m
}

function rebuildMarkers() {
  if (!cluster) return
  cluster.clearLayers()
  markers.clear()
  byId.clear()
  const cached = []
  const needGeo = []
  for (const p of props.providers) {
    byId.set(p.id, p)
    if (getGeo(p)) {
      const m = makeMarker(p)
      if (m) { cluster.addLayer(m); markers.set(p.id, m) }
      cached.push(p)
    } else {
      needGeo.push(p)
    }
  }
  shownCount.value = markers.size
  fitToMarkers()
  // lazy geocode the rest — but only after the pre-generated coordinate file
  // has been merged into the cache (otherwise we'd re-geocode providers that
  // are about to be primed). If no file is present, coordsReady is still true
  // after the fetch attempt, so lazy geocoding proceeds as a fallback.
  if (cancelGeocode) cancelGeocode()
  if (!coordsReady.value) return
  const toGeocode = needGeo.slice(0, props.maxGeocode)
  if (!toGeocode.length) return
  geoProgress.value = { done: 0, total: toGeocode.length, active: true }
  cancelGeocode = geocodeMany(toGeocode, {
    onResult: (p, coords) => {
      const m = makeMarker(p)
      if (m) { cluster.addLayer(m); markers.set(p.id, m); shownCount.value = markers.size }
    },
    onProgress: (done, total) => {
      geoProgress.value = { done, total, active: done < total }
      if (done % 12 === 0 || done === total) fitToMarkers()
    },
  })
}

function fitToMarkers() {
  if (!map || !cluster) return
  const b = cluster.getBounds()
  if (b && b.isValid()) map.fitBounds(b.pad(0.15), { maxZoom: 15, animate: true })
}

function fitToCircle() {
  if (!map || !circle) return
  map.fitBounds(circle.getBounds(), { animate: true })
}

function recenter() {
  if (userCoords.value) {
    map.flyTo([userCoords.value.lat, userCoords.value.lon], 13, { duration: 0.8 })
  } else {
    fitToMarkers()
  }
}
function resetView() {
  fitToMarkers()
}
function invalidate() {
  setTimeout(() => map && map.invalidateSize(), 80)
}

defineExpose({ recenter, resetView, invalidate, fitToMarkers })

function onPopupClick(e) {
  const el = e.target.closest('[data-action]')
  if (!el) return
  const pid = Number(el.dataset.pid)
  const p = byId.get(pid)
  if (!p) return
  const action = el.dataset.action
  if (action === 'details') emit('details', p)
  else if (action === 'fav') emit('favorite', p)
}

onMounted(() => {
  map = L.map(mapEl.value, { zoomControl: true, attributionControl: true })
  tileLayer = L.tileLayer(isDark.value ? TILES_DARK : TILES_LIGHT, {
    attribution: isDark.value ? '© OpenStreetMap © CARTO' : '© OpenStreetMap',
    maxZoom: 19,
  }).addTo(map)
  cluster = L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 50 })
  map.addLayer(cluster)
  mapEl.value.addEventListener('click', onPopupClick)
  // bounds + search-this-area
  map.on('moveend zoomend', () => {
    const b = map.getBounds()
    setMapBounds({ north: b.getNorth(), south: b.getSouth(), east: b.getEast(), west: b.getWest() })
    markMoved()
  })
  setTimeout(() => {
    map.invalidateSize()
    rebuildMarkers()
    emit('ready')
  }, 100)
})

watch(() => props.providers, () => rebuildMarkers(), { deep: false })
// rebuild once the pre-generated coordinates finish priming the cache
watch(coordsReady, (ready) => { if (ready) rebuildMarkers() })
watch(() => isDark.value, (dark) => {
  if (!map) return
  if (tileLayer) map.removeLayer(tileLayer)
  tileLayer = L.tileLayer(dark ? TILES_DARK : TILES_LIGHT, {
    attribution: dark ? '© OpenStreetMap © CARTO' : '© OpenStreetMap',
    maxZoom: 19,
  }).addTo(map)
})

// user marker + radius circle
watch(() => userCoords.value, (uc) => {
  if (!map) return
  if (userMarker) { map.removeLayer(userMarker); userMarker = null }
  if (uc) {
    userMarker = L.marker([uc.lat, uc.lon], { icon: userIcon(), zIndexOffset: 1000 }).addTo(map)
    userMarker.bindTooltip(t('yourLocation'), { direction: 'top' })
    map.flyTo([uc.lat, uc.lon], 13, { duration: 0.8 })
  }
  updateCircle()
}, { immediate: false })

watch(() => radius.value, () => updateCircle())

function updateCircle() {
  const uc = userCoords.value
  const r = radius.value
  if (circle) { map.removeLayer(circle); circle = null }
  if (uc && r > 0) {
    circle = L.circle([uc.lat, uc.lon], { radius: r * 1000, color: '#2f86f5', weight: 2, fillColor: '#2f86f5', fillOpacity: 0.08 }).addTo(map)
    map.flyToBounds(circle.getBounds(), { duration: 0.6, maxZoom: 14 })
  }
}

// list -> map focus
watch(() => flyToId.value, (id) => {
  if (id == null || !map) return
  const p = byId.get(id)
  if (!p) return
  const g = getGeo(p)
  if (g) {
    map.flyTo([g.lat, g.lon], Math.max(map.getZoom(), 15), { duration: 0.7 })
    const m = markers.get(id)
    if (m) m.openPopup()
  } else {
    emit('select', p)
  }
})

// selection highlight
watch(() => selectedId.value, (id) => {
  for (const [mid, m] of markers) {
    const p = byId.get(mid)
    if (mid === id) m.setIcon(selectedIcon(p ? p.typeKey : ''))
    else m.setIcon(markerIcon(p ? p.typeKey : ''))
  }
})

onBeforeUnmount(() => {
  if (cancelGeocode) cancelGeocode()
  if (mapEl.value) mapEl.value.removeEventListener('click', onPopupClick)
  if (map) { map.remove(); map = null }
})

const counts = computed(() => `${shownCount.value.toLocaleString()} / ${props.providers.length.toLocaleString()}`)
const isEmpty = computed(() => shownCount.value === 0 && !geoProgress.value.active && props.providers.length > 0)
</script>

<template>
  <div class="relative h-full w-full overflow-hidden">
    <div ref="mapEl" class="absolute inset-0 z-0"></div>

    <!-- graceful placeholder when no markers can be shown -->
    <div v-if="isEmpty" class="absolute inset-0 z-[5] flex items-center justify-center bg-slate-100/60 p-6 dark:bg-slate-900/60">
      <div class="max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <MapPin class="mx-auto mb-3 h-10 w-10 text-brand-500" />
        <p class="text-sm font-bold text-slate-700 dark:text-slate-200">{{ t('mapPlaceholderTitle') }}</p>
        <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ t('mapPlaceholderDesc') }}</p>
      </div>
    </div>

    <!-- top-end controls -->
    <MapControls
      :fullscreen="fullscreen"
      @recenter="recenter"
      @reset="resetView"
      @locate="$emit('locate')"
      @fullscreen="$emit('fullscreen')"
      @show-list="$emit('show-list')"
    />

    <!-- count badge -->
    <div class="glass absolute start-3 top-3 z-[500] flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-md dark:text-slate-200">
      <MapPin class="h-3.5 w-3.5 text-brand-600" />
      {{ counts }}
    </div>

    <!-- geocoding progress -->
    <div v-if="geoProgress.active" class="glass absolute end-3 top-24 z-[500] flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-md dark:text-slate-200">
      <Loader2 class="h-3.5 w-3.5 animate-spin" />{{ geoProgress.done }}/{{ geoProgress.total }}
    </div>

    <!-- search this area -->
    <Transition name="fade">
      <button
        v-if="mapMoved && !searchAreaActive"
        class="glass absolute left-1/2 top-20 z-[500] -translate-x-1/2 flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold text-brand-700 shadow-lg dark:text-brand-300"
        @click="activateSearchArea"
      >
        <Search class="h-4 w-4" />{{ t('searchThisArea') }}
      </button>
    </Transition>
    <button
      v-if="searchAreaActive"
      class="glass absolute left-1/2 top-20 z-[500] -translate-x-1/2 flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold text-rose-600 shadow-lg"
      @click="clearSearchArea"
    >
      <RotateCcw class="h-4 w-4" />{{ t('clearFilters') }}
    </button>

    <!-- legend -->
    <MapLegend class="absolute bottom-6 start-3 z-[500]" />
  </div>
</template>

<style>
.mp { font-family: 'Cairo', sans-serif; min-width: 220px; }
.mp-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
.mp-name { font-weight: 800; font-size: 14px; color: #0f172a; line-height: 1.3; }
.mp-live { font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 9999px; background: #e2e8f0; color: #64748b; white-space: nowrap; }
.mp-live.is-live { background: #dcfce7; color: #16a34a; }
.mp-type { font-size: 12px; color: #2f86f5; font-weight: 600; margin-top: 2px; }
.mp-addr { font-size: 11px; color: #64748b; margin-top: 4px; }
.mp-dist { display: inline-block; font-size: 11px; font-weight: 700; color: #1a66db; background: #eef7ff; padding: 2px 6px; border-radius: 6px; margin-top: 4px; }
.mp-actions { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }
.mp-btn { display: inline-flex; align-items: center; gap: 3px; font-size: 11px; font-weight: 700; padding: 5px 8px; border-radius: 8px; background: #f1f5f9; color: #1a66db; text-decoration: none; cursor: pointer; border: none; }
.mp-btn:hover { background: #e0ecff; }
.mp-call { background: #16a34a; color: #fff; }
.mp-call:hover { background: #15803d; }
.leaflet-popup-content-wrapper { border-radius: 14px; padding: 4px; }
.provider-marker { background: transparent; border: none; }
@keyframes userPulse { 0% { transform: scale(.6); opacity: .6; } 100% { transform: scale(2.4); opacity: 0; } }
</style>
