// Central filter/search/sort/pagination state + URL sync. Shared singleton.
// `filtered` is the single source of truth: search + structured filters +
// LIVE-only + location radius + map-bounds ("search this area").
import { computed, reactive, ref, nextTick, watch } from 'vue'
import { normalizeArabic, normalizeForKey } from '../utils/normalizeText'
import { haversineKm } from '../utils/distance'
import { getGeo } from '../utils/geoCache'
import { useI18n } from './useI18n'
import { useSearch } from './useSearch'
import { useGeolocation } from './useGeolocation'
import { useMapBounds } from './useMapBounds'

const PAGE_SIZE = 24

// ---- state ----
const query = ref('')
const sortBy = ref('best')
const view = ref('cards')
const groupBy = ref(true)
const statsMode = ref('current') // 'current' | 'all'
const radius = ref(0) // 0 = all distances
const nearMe = ref(false)
const visibleCount = ref(PAGE_SIZE)
const filters = reactive({
  providerType: [],
  specialty: [],
  governorate: [],
  area: [],
  services: [],
  networkType: [],
  mainBranch: [],
  pulseStatus: [],
  liveOnly: false,
})

const { mapBounds, searchAreaActive, clearSearchArea, resetMapBounds } = useMapBounds()

let applyingUrl = false
let urlTimer = null

function buildKeyedOptions(providers, getKey, getLabel) {
  const map = new Map()
  for (const p of providers) {
    const key = getKey(p)
    if (!key) continue
    const label = getLabel(p) || key
    let entry = map.get(key)
    if (!entry) {
      entry = { labels: new Map(), count: 0 }
      map.set(key, entry)
    }
    entry.count++
    entry.labels.set(label, (entry.labels.get(label) || 0) + 1)
  }
  return [...map.entries()]
    .map(([key, { labels, count }]) => {
      let bestLabel = key
      let bestCount = -1
      for (const [l, c] of labels) if (c > bestCount) { bestLabel = l; bestCount = c }
      return { key, label: bestLabel, count }
    })
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

function stateToQuery() {
  const p = new URLSearchParams()
  if (query.value) p.set('q', query.value)
  if (sortBy.value !== 'best') p.set('sort', sortBy.value)
  if (view.value !== 'cards') p.set('view', view.value)
  if (!groupBy.value) p.set('group', '0')
  if (statsMode.value !== 'current') p.set('stats', 'all')
  if (filters.liveOnly) p.set('live', '1')
  if (nearMe.value) p.set('near', '1')
  if (radius.value) p.set('radius', String(radius.value))
  if (visibleCount.value !== PAGE_SIZE) p.set('limit', String(visibleCount.value))
  const setArr = (k, arr) => {
    if (arr.length) p.set(k, arr.map(encodeURIComponent).join(','))
  }
  setArr('type', filters.providerType)
  setArr('spec', filters.specialty)
  setArr('gov', filters.governorate)
  setArr('area', filters.area)
  setArr('serv', filters.services)
  setArr('net', filters.networkType)
  setArr('mb', filters.mainBranch)
  setArr('pulse', filters.pulseStatus)
  return p.toString()
}

function applyUrl() {
  applyingUrl = true
  const params = new URLSearchParams(location.search)
  query.value = params.get('q') || ''
  sortBy.value = params.get('sort') || 'best'
  view.value = params.get('view') === 'table' ? 'table' : params.get('view') === 'map' ? 'map' : 'cards'
  groupBy.value = params.get('group') === '0' ? false : true
  statsMode.value = params.get('stats') === 'all' ? 'all' : 'current'
  filters.liveOnly = params.get('live') === '1'
  nearMe.value = params.get('near') === '1'
  const r = parseInt(params.get('radius'), 10)
  radius.value = Number.isFinite(r) && r > 0 ? r : 0
  const lim = parseInt(params.get('limit'), 10)
  if (Number.isFinite(lim) && lim > 0) visibleCount.value = lim
  const parseArr = (k) =>
    (params.get(k) || '').split(',').filter(Boolean).map(decodeURIComponent)
  filters.providerType = parseArr('type')
  filters.specialty = parseArr('spec')
  filters.governorate = parseArr('gov')
  filters.area = parseArr('area')
  filters.services = parseArr('serv')
  filters.networkType = parseArr('net')
  filters.mainBranch = parseArr('mb')
  filters.pulseStatus = parseArr('pulse')
  nextTick(() => {
    applyingUrl = false
  })
}

function pushUrl() {
  if (applyingUrl) return
  clearTimeout(urlTimer)
  urlTimer = setTimeout(() => {
    const qs = stateToQuery()
    const url = `${location.pathname}${qs ? '?' + qs : ''}${location.hash}`
    history.replaceState(null, '', url)
  }, 250)
}

try {
  applyUrl()
} catch (e) {
  /* ignore */
}

watch(
  [query, sortBy, view, groupBy, statsMode, radius, nearMe, visibleCount, () => ({ ...filters })],
  pushUrl,
  { deep: true }
)

// Cities depend on governorates: when the selected governorate(s) change, drop
// any selected cities that no longer belong to a remaining governorate so the
// active selection and counts stay consistent.
watch(
  () => [...filters.governorate],
  (govSel) => {
    if (applyingUrl) return
    if (!govSel.length) return
    const list = useProvidersValue()
    if (!list || !list.length) return
    const govSet = new Set(govSel)
    const validAreas = new Set(
      list.filter((p) => govSet.has(p.govKey)).map((p) => p.areaKey).filter(Boolean)
    )
    const cleaned = filters.area.filter((k) => validAreas.has(k))
    if (cleaned.length !== filters.area.length) filters.area = cleaned
  },
  { flush: 'post' }
)

// Quick category chips (keys are normalizeForKey of provider type).
const QUICK_CATEGORIES = [
  { key: '', labelKey: 'all', icon: 'LayoutGrid' },
  { key: 'physician clinic', labelKey: 'doctors', icon: 'Stethoscope' },
  { key: 'hospital', labelKey: 'hospitals', icon: 'Hospital' },
  { key: 'pharmacy', labelKey: 'pharmacies', icon: 'Pill' },
  { key: 'laboratory', labelKey: 'labs', icon: 'FlaskConical' },
  { key: 'physiotherapy', labelKey: 'specialty', icon: 'Activity' },
  { key: 'dental center', labelKey: 'specialty', icon: 'Smile' },
  { key: 'radiology center', labelKey: 'specialty', icon: 'ScanLine' },
  { key: 'optometry - vision service center', labelKey: 'specialty', icon: 'Eye' },
]

function inBounds(lat, lon, b) {
  if (!b) return true
  return lat <= b.north && lat >= b.south && lon <= b.east && lon >= b.west
}

export function useProviderFilters() {
  const { locale, field, t } = useI18n()
  const { matchIds, searchRanked, isReady: searchReady } = useSearch()
  const { coords: userCoords } = useGeolocation()

  const providers = computed(() => useProvidersValue())

  // ---- distance ----
  const distanceById = computed(() => {
    const uc = userCoords.value
    const out = new Map()
    if (!uc) return out
    for (const p of providers.value) {
      const g = getGeo(p)
      if (g) out.set(p.id, haversineKm(uc.lat, uc.lon, g.lat, g.lon))
    }
    return out
  })
  function distOf(p) {
    return distanceById.value.get(p.id) ?? null
  }

  // ---- query match set (consistent for counts + filtering) ----
  const qnorm = computed(() => normalizeArabic(query.value))
  const queryMatchSet = computed(() => {
    const q = qnorm.value
    if (!q) return null
    if (searchReady()) return matchIds(q)
    return new Set(providers.value.filter((p) => p.searchBlob.includes(q)).map((p) => p.id))
  })

  function structuredMatchesExcept(p, exceptName) {
    const f = filters
    if (exceptName !== 'providerType' && f.providerType.length && !f.providerType.includes(p.typeKey)) return false
    if (exceptName !== 'specialty' && f.specialty.length && !f.specialty.includes(p.specialtyKey)) return false
    if (exceptName !== 'governorate' && f.governorate.length && !f.governorate.includes(p.govKey)) return false
    if (exceptName !== 'area' && f.area.length && !f.area.includes(p.areaKey)) return false
    if (exceptName !== 'services' && f.services.length && !f.services.includes(p.servicesKey)) return false
    if (exceptName !== 'networkType' && f.networkType.length && !f.networkType.includes(normalizeForKey(p.networkType))) return false
    if (exceptName !== 'mainBranch' && f.mainBranch.length && !f.mainBranch.includes(normalizeForKey(p.mainBranch))) return false
    if (exceptName !== 'pulseStatus' && f.pulseStatus.length) {
      const pk = p.live ? 'live' : 'notlive'
      if (!f.pulseStatus.includes(pk)) return false
    }
    if (exceptName !== 'liveOnly' && f.liveOnly && !p.live) return false
    return true
  }

  function locationMatches(p) {
    if (radius.value > 0) {
      const d = distOf(p)
      if (d == null || d > radius.value) return false
    }
    if (searchAreaActive.value && mapBounds.value) {
      const g = getGeo(p)
      if (!g || !inBounds(g.lat, g.lon, mapBounds.value)) return false
    }
    return true
  }

  function passesAll(p) {
    const qs = queryMatchSet.value
    if (qs && !qs.has(p.id)) return false
    if (!structuredMatchesExcept(p, null)) return false
    if (!locationMatches(p)) return false
    return true
  }

  // single source of truth
  const filtered = computed(() => providers.value.filter(passesAll))

  // list filtered by everything EXCEPT one facet (for faceted counts)
  function filteredByOthers(exceptName) {
    const qs = queryMatchSet.value
    return providers.value.filter((p) => {
      if (qs && !qs.has(p.id)) return false
      if (!structuredMatchesExcept(p, exceptName)) return false
      if (!locationMatches(p)) return false
      return true
    })
  }

  // ---- sorted ----
  const sorted = computed(() => {
    const list = filtered.value
    const q = qnorm.value
    const loc = locale.value
    const byDistance = () => {
      const d = (p) => (distOf(p) == null ? Infinity : distOf(p))
      return [...list].sort((a, b) => d(a) - d(b) || a.nameKey.localeCompare(b.nameKey, loc))
    }
    if (nearMe.value) return byDistance()
    if (sortBy.value === 'distance') return byDistance()
    if (sortBy.value === 'name') return [...list].sort((a, b) => a.nameKey.localeCompare(b.nameKey, loc))
    if (sortBy.value === 'governorate') {
      return [...list].sort(
        (a, b) =>
          field(a, 'governorateAr', 'governorate').localeCompare(field(b, 'governorateAr', 'governorate'), loc) ||
          a.nameKey.localeCompare(b.nameKey, loc)
      )
    }
    if (sortBy.value === 'area') {
      return [...list].sort(
        (a, b) =>
          field(a, 'areaAr', 'area').localeCompare(field(b, 'areaAr', 'area'), loc) ||
          a.nameKey.localeCompare(b.nameKey, loc)
      )
    }
    // best match: Fuse rank when a query is present
    if (q && searchReady()) {
      const idSet = new Set(list.map((p) => p.id))
      const ranked = searchRanked(q, (p) => idSet.has(p.id))
      return ranked && ranked.length ? ranked : [...list].sort((a, b) => a.nameKey.localeCompare(b.nameKey, loc))
    }
    if (q) {
      const score = (p) => {
        let s = 0
        if (p.nameKey.startsWith(q)) s += 1000
        else if (p.nameKey.includes(q)) s += 500
        if (p.typeKey.includes(q)) s += 40
        if (p.specialtyKey.includes(q)) s += 30
        if (p.govKey.includes(q) || p.areaKey.includes(q)) s += 10
        return s
      }
      return [...list].sort((a, b) => score(b) - score(a) || a.nameKey.localeCompare(b.nameKey, loc))
    }
    return [...list].sort((a, b) => a.nameKey.localeCompare(b.nameKey, loc))
  })

  // ---- grouping ----
  function groupKey(p) {
    return p.providerKey || p.externalRef || p.tatshName || 's:' + p.id
  }
  const groups = computed(() => {
    const map = new Map()
    const order = []
    for (const p of sorted.value) {
      const k = groupKey(p)
      let g = map.get(k)
      if (!g) {
        g = { key: k, items: [], name: p.name, typeKey: p.typeKey, providerType: p.providerType, providerTypeAr: p.providerTypeAr, main: null }
        map.set(k, g)
        order.push(g)
      }
      g.items.push(p)
    }
    for (const g of order) {
      const mainCandidate = g.items.find((p) => normalizeForKey(p.mainBranch) === 'main')
      g.main = mainCandidate || g.items[0]
      const nameCount = new Map()
      for (const p of g.items) nameCount.set(p.name, (nameCount.get(p.name) || 0) + 1)
      let bestName = g.items[0].name
      let best = -1
      for (const [n, c] of nameCount) if (c > best) { best = c; bestName = n }
      g.name = bestName
      g.count = g.items.length
      g.branches = g.items.filter((p) => p !== g.main)
      g.live = g.items.some((p) => p.live)
      g.liveCount = g.items.filter((p) => p.live).length
    }
    return order
  })

  const displayItems = computed(() => (groupBy.value ? groups.value : sorted.value))
  const displayTotal = computed(() => displayItems.value.length)
  const visible = computed(() => displayItems.value.slice(0, visibleCount.value))
  const hasMore = computed(() => visibleCount.value < displayTotal.value)
  const total = computed(() => filtered.value.length)

  // ---- facet option lists (counts reflect current filtered context) ----
  const typeOptions = computed(() =>
    buildKeyedOptions(filteredByOthers('providerType'), (p) => p.typeKey, (p) => field(p, 'providerTypeAr', 'providerType'))
  )
  const specialtyOptions = computed(() =>
    buildKeyedOptions(filteredByOthers('specialty'), (p) => p.specialtyKey, (p) => field(p, 'specialtyAr', 'specialty'))
  )
  const governorateOptions = computed(() =>
    buildKeyedOptions(filteredByOthers('governorate'), (p) => p.govKey, (p) => field(p, 'governorateAr', 'governorate'))
  )
  const areaOptions = computed(() =>
    buildKeyedOptions(filteredByOthers('area'), (p) => p.areaKey, (p) => field(p, 'areaAr', 'area'))
  )
  const servicesOptions = computed(() =>
    buildKeyedOptions(filteredByOthers('services'), (p) => p.servicesKey, (p) => field(p, 'servicesAr', 'services'))
  )
  const networkOptions = computed(() =>
    buildKeyedOptions(filteredByOthers('networkType'), (p) => normalizeForKey(p.networkType), (p) => p.networkType)
  )
  const mainBranchOptions = computed(() =>
    buildKeyedOptions(filteredByOthers('mainBranch'), (p) => normalizeForKey(p.mainBranch), (p) => p.mainBranch)
  )
  const pulseOptions = computed(() => [
    { key: 'live', label: t('live'), count: filteredByOthers('pulseStatus').filter((p) => p.live).length },
    { key: 'notlive', label: t('notLive'), count: filteredByOthers('pulseStatus').filter((p) => !p.live).length },
  ])

  // ---- facets for stats / chips ----
  const facets = computed(() => {
    const list = filtered.value
    const docKey = normalizeForKey('Physician Clinic')
    const hospKey = normalizeForKey('Hospital')
    const pharmKey = normalizeForKey('Pharmacy')
    const labKey = normalizeForKey('Laboratory')
    let doctors = 0, hospitals = 0, pharmacies = 0, labs = 0, live = 0
    const byType = new Map()
    for (const p of list) {
      if (p.live) live++
      if (p.typeKey === docKey) doctors++
      else if (p.typeKey === hospKey) hospitals++
      else if (p.typeKey === pharmKey) pharmacies++
      else if (p.typeKey === labKey) labs++
      byType.set(p.typeKey, (byType.get(p.typeKey) || 0) + 1)
    }
    return { total: list.length, doctors, hospitals, pharmacies, labs, live, byType }
  })

  const allFacets = computed(() => {
    const list = providers.value
    const docKey = normalizeForKey('Physician Clinic')
    const hospKey = normalizeForKey('Hospital')
    const pharmKey = normalizeForKey('Pharmacy')
    const labKey = normalizeForKey('Laboratory')
    let doctors = 0, hospitals = 0, pharmacies = 0, labs = 0, live = 0
    for (const p of list) {
      if (p.live) live++
      if (p.typeKey === docKey) doctors++
      else if (p.typeKey === hospKey) hospitals++
      else if (p.typeKey === pharmKey) pharmacies++
      else if (p.typeKey === labKey) labs++
    }
    return { total: list.length, doctors, hospitals, pharmacies, labs, live }
  })

  const stats = computed(() => (statsMode.value === 'all' ? allFacets.value : facets.value))

  const activeFilterCount = computed(() => {
    let n = 0
    for (const k of ['providerType', 'specialty', 'governorate', 'area', 'services', 'networkType', 'mainBranch', 'pulseStatus']) {
      n += filters[k].length
    }
    if (filters.liveOnly) n++
    if (query.value) n++
    if (radius.value) n++
    if (nearMe.value) n++
    if (searchAreaActive.value) n++
    return n
  })

  const activeCategory = computed(() =>
    filters.providerType.length === 1 ? filters.providerType[0] : ''
  )

  // ---- actions ----
  function resetPage() {
    if (!applyingUrl) visibleCount.value = PAGE_SIZE
  }
  function setQuery(v) {
    query.value = (v || '').trim()
    resetPage()
  }
  function setSortBy(v) {
    sortBy.value = v
    resetPage()
  }
  function setView(v) {
    view.value = v
  }
  function toggleGrouping() {
    groupBy.value = !groupBy.value
    resetPage()
  }
  function setStatsMode(v) {
    statsMode.value = v
  }
  function toggleFilter(name, key) {
    const arr = filters[name]
    const i = arr.indexOf(key)
    if (i >= 0) arr.splice(i, 1)
    else arr.push(key)
    resetPage()
  }
  function toggleLiveOnly() {
    filters.liveOnly = !filters.liveOnly
    resetPage()
  }
  function setCategory(key) {
    if (key && filters.providerType.length === 1 && filters.providerType[0] === key) {
      filters.providerType = []
    } else {
      filters.providerType = key ? [key] : []
    }
    resetPage()
  }
  function setRadius(r) {
    radius.value = Number.isFinite(+r) ? +r : 0
    if (radius.value > 0) nearMe.value = true
    resetPage()
  }
  function toggleNearMe() {
    nearMe.value = !nearMe.value
    if (nearMe.value) {
      sortBy.value = 'distance'
    }
    resetPage()
  }
  async function findNearMe(detectFn) {
    try {
      await detectFn()
      nearMe.value = true
      sortBy.value = 'distance'
      if (!radius.value) radius.value = 10
      resetPage()
    } catch (e) {}
  }
  function clearMapFilters() {
    clearSearchArea()
    resetMapBounds()
    resetPage()
  }
  function clearFilters() {
    query.value = ''
    filters.providerType = []
    filters.specialty = []
    filters.governorate = []
    filters.area = []
    filters.services = []
    filters.networkType = []
    filters.mainBranch = []
    filters.pulseStatus = []
    filters.liveOnly = false
    sortBy.value = 'best'
    radius.value = 0
    nearMe.value = false
    clearSearchArea()
    resetMapBounds()
    resetPage()
  }
  function loadMore() {
    visibleCount.value += PAGE_SIZE
  }

  function snapshot() {
    return {
      query: query.value, sortBy: sortBy.value, view: view.value, groupBy: groupBy.value,
      providerType: [...filters.providerType], specialty: [...filters.specialty],
      governorate: [...filters.governorate], area: [...filters.area],
      services: [...filters.services], networkType: [...filters.networkType],
      mainBranch: [...filters.mainBranch], pulseStatus: [...filters.pulseStatus],
      liveOnly: filters.liveOnly, radius: radius.value, nearMe: nearMe.value,
    }
  }
  function applySnapshot(s) {
    if (!s) return
    applyingUrl = true
    query.value = s.query || ''
    sortBy.value = s.sortBy || 'best'
    view.value = s.view || 'cards'
    groupBy.value = s.groupBy != null ? s.groupBy : true
    filters.providerType = s.providerType || []
    filters.specialty = s.specialty || []
    filters.governorate = s.governorate || []
    filters.area = s.area || []
    filters.services = s.services || []
    filters.networkType = s.networkType || []
    filters.mainBranch = s.mainBranch || []
    filters.pulseStatus = s.pulseStatus || []
    filters.liveOnly = !!s.liveOnly
    radius.value = s.radius || 0
    nearMe.value = !!s.nearMe
    nextTick(() => { applyingUrl = false })
    resetPage()
  }
  async function shareFilters() {
    try {
      await navigator.clipboard.writeText(location.href)
      return true
    } catch (e) {
      return false
    }
  }

  return {
    // state
    query, sortBy, view, groupBy, statsMode, radius, nearMe, filters, visibleCount,
    PAGE_SIZE, QUICK_CATEGORIES,
    // computed
    typeOptions, specialtyOptions, governorateOptions, areaOptions, servicesOptions,
    networkOptions, mainBranchOptions, pulseOptions,
    filtered, sorted, groups, facets, stats, total, displayTotal, visible, hasMore,
    activeFilterCount, activeCategory, distanceById,
    // actions
    setQuery, setSortBy, setView, toggleGrouping, setStatsMode, toggleFilter,
    toggleLiveOnly, setCategory, setRadius, toggleNearMe, findNearMe, clearMapFilters,
    clearFilters, loadMore, snapshot, applySnapshot, shareFilters, distOf,
  }
}

// Late binding to providers (avoids circular import / timing issues).
import { useExcelProviders } from './useExcelProviders'
function useProvidersValue() {
  return useExcelProviders().providers.value
}
