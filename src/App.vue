<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import {
  LayoutGrid,
  Stethoscope,
  Hospital,
  Pill,
  FlaskConical,
  Activity,
  Smile,
  ScanLine,
  Eye,
  ChevronUp,
  Rows3,
  Map as MapIcon,
  LocateFixed,
  Loader2,
  X,
  Trash2,
  Clock,
  Heart,
  Info,
  ArrowLeft,
  Layers,
} from 'lucide-vue-next'

import AppHeader from './components/AppHeader.vue'
import SearchBar from './components/SearchBar.vue'
import LocationQuickFilter from './components/LocationQuickFilter.vue'
import FilterSidebar from './components/FilterSidebar.vue'
import FilterDrawer from './components/FilterDrawer.vue'
import ProviderCard from './components/ProviderCard.vue'
import ProviderGroupCard from './components/ProviderGroupCard.vue'
import ProviderTable from './components/ProviderTable.vue'
import ProviderModal from './components/ProviderModal.vue'
import StatsCards from './components/StatsCards.vue'
import EmptyState from './components/EmptyState.vue'
import SkeletonCard from './components/SkeletonCard.vue'
import MapSplitView from './components/MapSplitView.vue'
import ExportMenu from './components/ExportMenu.vue'

import { useExcelProviders } from './composables/useExcelProviders'
import { useProviderFilters } from './composables/useProviderFilters'
import { useGeolocation } from './composables/useGeolocation'
import { useFavorites } from './composables/useFavorites'
import { useI18n } from './composables/useI18n'
import { useSearch } from './composables/useSearch'
import { useAnalytics } from './composables/useAnalytics'
import { typeBadgeClass } from './utils/badges'

const { load, reload, loading, error, providers } = useExcelProviders()
const {
  query, sortBy, view, groupBy, filters, filtered, total, displayTotal,
  visible, hasMore, loadMore, setSortBy, setView, toggleGrouping, setCategory,
  clearFilters, activeFilterCount, activeCategory, typeOptions, QUICK_CATEGORIES,
  facets, radius, nearMe, setRadius, toggleNearMe, findNearMe, distOf, statsMode, setStatsMode,
} = useProviderFilters()
const { coords, loading: locating, error: geoError, supported: geoSupported, detect } = useGeolocation()
const { favorites, recentViews, isFavorite, toggleFavorite, addRecentView } = useFavorites()
const { t, locale } = useI18n()
const { buildIndex } = useSearch()
const { trackView } = useAnalytics()

const selected = ref(null)
const drawerOpen = ref(false)
const favoritesOpen = ref(false)
const showTop = ref(false)
const scrolled = ref(false)
const canInstall = ref(false)
const mapFullscreen = ref(false)
let deferredPrompt = null

const chipIcons = {
  LayoutGrid, Stethoscope, Hospital, Pill, FlaskConical, Activity, Smile, ScanLine, Eye,
}

const chipList = computed(() =>
  QUICK_CATEGORIES.map((cat) => {
    if (!cat.key) return { ...cat, label: t('all'), active: !activeCategory.value, count: facets.value.total }
    const opt = typeOptions.value.find((o) => o.key === cat.key)
    return { ...cat, label: opt?.label || cat.key, active: activeCategory.value === cat.key, count: facets.value.byType?.get(cat.key) || 0 }
  })
)

const radiusOptions = [0, 1, 3, 5, 10, 25, 50]

const sortOptions = computed(() => {
  const opts = [
    { value: 'best', label: t('sortBest') },
    { value: 'name', label: t('sortName') },
    { value: 'governorate', label: t('sortGovernorate') },
    { value: 'area', label: t('sortArea') },
  ]
  if (coords.value) opts.push({ value: 'distance', label: t('distance') })
  return opts
})

// Map view shows the matched (filtered) providers, capped for geocoding budget.
const mapProviders = computed(() => filtered.value.slice(0, 500))

async function onFindNearMe() {
  await findNearMe(detect)
}

function openProvider(p) {
  mapFullscreen.value = false
  selected.value = p
  addRecentView(p)
  trackView(p)
}
function closeProvider() {
  selected.value = null
}
function navigateProvider(p) {
  mapFullscreen.value = false
  selected.value = p
  addRecentView(p)
  trackView(p)
}

function onScroll() {
  showTop.value = window.scrollY > 500
  scrolled.value = window.scrollY > 40
}
function scrollTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// logo click: reset everything to the initial state
function goHome() {
  clearFilters()
  selected.value = null
  favoritesOpen.value = false
  drawerOpen.value = false
  mapFullscreen.value = false
  setView('cards')
  setStatsMode('current')
  scrollTop()
  if (window.history && history.replaceState) {
    history.replaceState(null, '', location.pathname + location.hash)
  }
}

async function onDetect() {
  try {
    await detect()
  } catch (e) {}
}

// keyboard shortcuts: / focus search, M map, L list(table), C cards, Esc close
function onKeydown(e) {
  const tag = (e.target.tagName || '').toLowerCase()
  const typing = tag === 'input' || tag === 'textarea' || tag === 'select'
  if (e.key === 'Escape') {
    if (selected.value) { selected.value = null; return }
    if (favoritesOpen.value) { favoritesOpen.value = false; return }
    if (drawerOpen.value) { drawerOpen.value = false; return }
    if (mapFullscreen.value) { mapFullscreen.value = false; return }
    return
  }
  if (typing) return
  if (e.key === '/') {
    e.preventDefault()
    const el = document.querySelector('input[type="search"]')
    if (el) el.focus()
  } else if (e.key.toLowerCase() === 'm') {
    setView('map')
  } else if (e.key.toLowerCase() === 'l') {
    setView('table')
  } else if (e.key.toLowerCase() === 'c') {
    setView('cards')
  }
}

function onInstallClick() {
  if (!deferredPrompt) return
  deferredPrompt.prompt()
  deferredPrompt.userChoice?.finally(() => {
    deferredPrompt = null
    canInstall.value = false
  })
}

function onBeforeInstall(e) {
  e.preventDefault()
  deferredPrompt = e
  canInstall.value = true
}

onMounted(() => {
  load().catch(() => {})
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('beforeinstallprompt', onBeforeInstall)
  window.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  window.removeEventListener('keydown', onKeydown)
})

// Build the Fuse index once providers are parsed.
watch(
  () => providers.value,
  (list) => {
    if (list && list.length) buildIndex(list)
  },
  { immediate: true }
)
</script>

<template>
  <div class="min-h-screen">
    <AppHeader
      :favorites-count="favorites.length"
      :can-install="canInstall"
      class="no-print"
      @open-favorites="favoritesOpen = true"
      @install="onInstallClick"
      @home="goHome"
    />

    <!-- sticky floating glass search -->
    <div
      class="sticky top-16 z-20 glass-search border-x-0 border-t-0 transition-all"
      :class="scrolled ? 'shadow-lg' : ''"
    >
      <div class="mx-auto max-w-7xl px-4 py-3 sm:px-6" :class="scrolled ? 'py-2' : ''">
        <SearchBar :show-filters-button="true" :compact="scrolled" @toggle-filters="drawerOpen = true">
          <template #actions>
            <LocationQuickFilter />
          </template>
        </SearchBar>
      </div>
    </div>

    <!-- quick category chips -->
    <div class="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div class="mx-auto max-w-7xl px-4 py-3 sm:px-6">
        <div class="no-scrollbar flex items-center gap-2 overflow-x-auto">
          <button
            v-for="cat in chipList"
            :key="cat.key || 'all'"
            class="chip shrink-0"
            :class="cat.active ? 'chip-active' : ''"
            @click="setCategory(cat.key)"
          >
            <component :is="chipIcons[cat.icon]" class="h-4 w-4" />
            <span>{{ cat.label }}</span>
            <span v-if="cat.count" class="text-xs opacity-70">{{ cat.count }}</span>
          </button>
        </div>
      </div>
    </div>

    <main class="mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-6">
      <!-- stats -->
      <div class="mb-[25px]">
        <StatsCards />
      </div>

      <div class="grid gap-6 lg:grid-cols-[280px_1fr]">
        <!-- sidebar (desktop) -->
        <aside class="hidden lg:block">
          <FilterSidebar />
        </aside>

        <!-- results -->
        <section class="min-w-0">
          <!-- toolbar -->
          <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="text-sm text-slate-500 dark:text-slate-400">
              <template v-if="loading && !providers.length">{{ t('loading') }}</template>
              <template v-else-if="error">{{ t('errorTitle') }}</template>
              <template v-else>
                <span class="font-bold text-slate-800 dark:text-slate-100">{{ total.toLocaleString() }}</span>
                {{ t('results') }}
                <span v-if="groupBy" class="text-slate-400"> · {{ displayTotal.toLocaleString() }} {{ t('groups') }}</span>
              </template>
            </div>

            <div class="no-scrollbar -mx-3 flex items-center gap-2 overflow-x-auto px-3 sm:mx-0 sm:flex-wrap sm:justify-end sm:overflow-visible sm:px-0">
              <!-- location -->
              <button
                v-if="geoSupported"
                class="btn-outline !px-3 !py-2 text-xs"
                :class="coords ? '!border-green-400 !text-green-600' : ''"
                :disabled="locating"
                @click="onDetect"
              >
                <Loader2 v-if="locating" class="h-4 w-4 animate-spin" />
                <LocateFixed v-else class="h-4 w-4" />
                <span class="hidden sm:inline">{{ coords ? t('locationOn') : t('detectLocation') }}</span>
              </button>

              <!-- sort -->
              <div class="relative">
                <select
                  :value="sortBy"
                  class="input w-[10rem] !py-2 !pe-3 text-xs font-semibold sm:!w-auto"
                  @change="setSortBy($event.target.value)"
                >
                  <option v-for="o in sortOptions" :key="o.value" :value="o.value">{{ t('sortBy') }}: {{ o.label }}</option>
                </select>
              </div>

              <!-- view toggle -->
              <div class="flex overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  class="inline-flex h-9 items-center gap-1.5 px-3 text-xs font-semibold transition"
                  :class="view === 'cards' ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300'"
                  :title="t('viewCards')"
                  @click="setView('cards')"
                >
                  <LayoutGrid class="h-4 w-4" /><span class="hidden md:inline">{{ t('cards') }}</span>
                </button>
                <button
                  class="inline-flex h-9 items-center gap-1.5 px-3 text-xs font-semibold transition"
                  :class="view === 'table' ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300'"
                  :title="t('viewTable')"
                  @click="setView('table')"
                >
                  <Rows3 class="h-4 w-4" /><span class="hidden md:inline">{{ t('listView') }}</span>
                </button>
                <button
                  class="inline-flex h-9 items-center gap-1.5 px-3 text-xs font-semibold transition"
                  :class="view === 'map' ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300'"
                  :title="t('mapView')"
                  @click="setView('map')"
                >
                  <MapIcon class="h-4 w-4" /><span class="hidden md:inline">{{ t('mapView') }}</span>
                </button>
              </div>

              <!-- grouping toggle -->
              <button
                v-if="view !== 'map'"
                class="btn-outline !px-3 !py-2 text-xs"
                :class="groupBy ? '!border-brand-500 !bg-brand-50 !text-brand-700 dark:!border-brand-600 dark:!bg-brand-950 dark:!text-brand-300' : ''"
                :title="t('groupByProvider')"
                @click="toggleGrouping"
              >
                <Layers class="h-4 w-4" /><span class="hidden sm:inline">{{ t('groupByProvider') }}</span>
              </button>

              <!-- export -->
              <ExportMenu :providers="filtered" :disabled="!total" />

              <!-- clear -->
              <button
                v-if="activeFilterCount"
                class="btn-ghost !px-3 !py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                @click="clearFilters"
              >
                <X class="h-4 w-4" />{{ t('clearFilters') }}
              </button>
            </div>
          </div>

          <!-- location notice -->
          <div
            v-if="coords || geoError"
            class="mb-4 flex flex-wrap items-center gap-2 rounded-xl px-3 py-2 text-xs"
            :class="geoError
              ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300'
              : 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300'"
          >
            <Info class="h-4 w-4 shrink-0" />
            <span v-if="geoError">{{ geoError }}</span>
            <template v-else>
              <span class="font-semibold">{{ t('yourLocation') }}:</span>
              <span dir="ltr">{{ coords.lat.toFixed(4) }}, {{ coords.lon.toFixed(4) }}</span>
              <a
                :href="`https://www.google.com/maps?q=${coords.lat},${coords.lon}`"
                target="_blank"
                rel="noopener"
                class="underline hover:no-underline"
              >{{ t('openMyLocation') }}</a>
              <span class="opacity-70">· {{ t('locationNotice') }}</span>
            </template>
          </div>

          <!-- radius filter (after location detected) -->
          <div v-if="coords" class="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
            <span class="text-xs font-bold text-slate-600 dark:text-slate-300">{{ t('radiusFilter') }}:</span>
            <button
              v-for="r in radiusOptions"
              :key="r"
              class="rounded-full px-3 py-1 text-xs font-semibold transition"
              :class="radius === r ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'"
              @click="setRadius(r)"
            >
              {{ r === 0 ? t('allDistances') : `${r} km` }}
            </button>
            <span v-if="radius > 0" class="text-xs text-amber-600 dark:text-amber-400">{{ t('radiusNotice') }}</span>
          </div>

          <!-- content states -->
          <template v-if="loading && !providers.length">
            <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <SkeletonCard v-for="i in 9" :key="i" />
            </div>
          </template>

          <template v-else-if="error">
            <EmptyState variant="error" :title="t('errorTitle')" :desc="t('errorDesc')" show-retry @retry="reload" />
          </template>

          <template v-else-if="!total">
            <EmptyState @retry="clearFilters" />
          </template>

          <template v-else>
            <!-- map view (split + bottom sheet) -->
            <div v-if="view === 'map'" class="animate-fade-in">
              <div :class="mapFullscreen ? 'fixed inset-0 z-[1000] p-2' : ''">
                <MapSplitView
                  :providers="mapProviders"
                  :query="query"
                  @open="openProvider"
                  @fullscreen="mapFullscreen = !mapFullscreen"
                />
              </div>
              <p v-if="!mapFullscreen" class="mt-2 text-xs text-slate-400">{{ t('showingOnMap') }} ({{ mapProviders.length.toLocaleString() }} / {{ total.toLocaleString() }})</p>
            </div>
            <!-- cards -->
            <div v-else-if="view === 'cards'" class="grid animate-fade-in gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <template v-if="groupBy">
                <template v-for="item in visible" :key="item.key">
                  <ProviderGroupCard v-if="item.count > 1" :group="item" :query="query" @open="openProvider" />
                  <ProviderCard v-else :provider="item.main" :query="query" @open="openProvider" />
                </template>
              </template>
              <ProviderCard
                v-else
                v-for="p in visible"
                :key="p.id"
                :provider="p"
                :query="query"
                @open="openProvider"
              />
            </div>
            <!-- table -->
            <div v-else class="animate-fade-in">
              <ProviderTable :items="visible" :grouped="groupBy" :query="query" @open="openProvider" />
            </div>

            <!-- load more -->
            <div v-if="view !== 'map' && hasMore" class="mt-6 flex flex-col items-center gap-2">
              <button class="btn-primary !px-8" @click="loadMore">
                {{ t('loadMore') }}
              </button>
              <p class="text-xs text-slate-400">
                {{ t('showing') }} {{ visible.length.toLocaleString() }} {{ t('of') }} {{ displayTotal.toLocaleString() }}
              </p>
            </div>
          </template>
        </section>
      </div>
    </main>

    <!-- mobile filter drawer -->
    <FilterDrawer :open="drawerOpen" @close="drawerOpen = false" />

    <!-- provider modal -->
    <ProviderModal :provider="selected" @close="closeProvider" @navigate="navigateProvider" />

    <!-- favorites + recent panel -->
    <Teleport to="body">
      <Transition name="fav">
        <div v-if="favoritesOpen" class="fixed inset-0 z-50">
          <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="favoritesOpen = false"></div>
          <div class="absolute end-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl dark:bg-slate-950">
            <div class="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              <h2 class="flex items-center gap-2 text-base font-bold text-slate-800 dark:text-slate-100">
                <Heart class="h-5 w-5 text-rose-500" />{{ t('favorites') }}
              </h2>
              <button class="icon-btn" @click="favoritesOpen = false">
                <X class="h-5 w-5" />
              </button>
            </div>
            <div class="scrollbar-thin flex-1 overflow-y-auto p-4">
              <!-- favorites list -->
              <div v-if="favorites.length" class="space-y-2">
                <div
                  v-for="p in favorites"
                  :key="p.id"
                  class="card flex items-center gap-3 p-3 transition hover:shadow-card-hover"
                >
                  <button class="min-w-0 flex-1 text-start" @click="favoritesOpen = false; openProvider(p)">
                    <div class="truncate font-semibold text-slate-800 dark:text-slate-100">{{ p.name }}</div>
                    <div class="mt-1 flex flex-wrap items-center gap-1.5">
                      <span class="badge" :class="typeBadgeClass(p.typeKey)">{{ locale === 'ar' ? p.providerTypeAr : p.providerType }}</span>
                      <span v-if="p.live" class="badge bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300">{{ t('live') }}</span>
                    </div>
                    <div class="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                      {{ locale === 'ar' ? p.governorateAr : p.governorate }}<span v-if="locale === 'ar' ? p.areaAr : p.area"> · {{ locale === 'ar' ? p.areaAr : p.area }}</span>
                    </div>
                  </button>
                  <button class="icon-btn shrink-0 text-rose-500" @click="toggleFavorite(p)">
                    <Heart class="h-5 w-5 fill-current" />
                  </button>
                </div>
              </div>
              <div v-else class="py-10 text-center text-sm text-slate-400">
                <Heart class="mx-auto mb-2 h-8 w-8 text-slate-300" />
                {{ t('noData') }}
              </div>

              <!-- recent views -->
              <div v-if="recentViews.length" class="mt-6">
                <h3 class="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-slate-400">
                  <Clock class="h-3.5 w-3.5" />{{ t('recent') }}
                </h3>
                <div class="space-y-1.5">
                  <button
                    v-for="p in recentViews"
                    :key="p.id"
                    class="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-start text-sm transition hover:bg-slate-100 dark:hover:bg-slate-800"
                    @click="favoritesOpen = false; openProvider(p)"
                  >
                    <ArrowLeft class="h-4 w-4 shrink-0 text-slate-400 rtl:rotate-180" />
                    <span class="min-w-0 flex-1 truncate">
                      <span class="block truncate font-medium text-slate-700 dark:text-slate-200">{{ p.name }}</span>
                      <span class="block truncate text-xs text-slate-400">{{ locale === 'ar' ? p.governorateAr : p.governorate }}</span>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- find near me (floating) -->
    <button
      class="fixed end-4 z-40 flex h-12 items-center gap-2 rounded-full bg-brand-600 px-4 text-sm font-bold text-white shadow-lg transition hover:bg-brand-700 sm:end-5"
      :class="showTop ? 'safe-bottom-offset-lg' : 'safe-bottom-offset'"
      :title="t('findNearMe')"
      @click="onFindNearMe"
    >
      <Loader2 v-if="locating" class="h-4 w-4 animate-spin" />
      <LocateFixed v-else class="h-5 w-5" />
      <span class="hidden sm:inline">{{ t('findNearMe') }}</span>
    </button>

    <!-- back to top -->
    <Transition name="fade">
      <button
        v-if="showTop"
        class="safe-bottom-offset fixed start-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-slate-700 text-white shadow-lg transition hover:bg-slate-800 sm:start-5"
        :title="t('backToTop')"
        @click="scrollTop"
      >
        <ChevronUp class="h-5 w-5" />
      </button>
    </Transition>

    <!-- footer -->
    <footer class="border-t border-slate-200 py-6 text-center text-xs text-slate-400 dark:border-slate-800">
      {{ t('appTitle') }} · {{ t('appSubtitle') }}
      <span class="mx-1.5">·</span>
      <span>{{ t('madeBy') }} <a href="https://github.com/hasanhawary/" target="_blank" rel="noopener" class="font-semibold text-slate-500 underline-offset-2 hover:text-brand-600 hover:underline dark:text-slate-300 dark:hover:text-brand-400">Elhawary</a></span>
    </footer>
  </div>
</template>

<style scoped>
.fav-enter-active,
.fav-leave-active {
  transition: opacity 0.2s ease;
}
.fav-enter-active > div:last-child,
.fav-leave-active > div:last-child {
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}
.fav-enter-from,
.fav-leave-to {
  opacity: 0;
}
.fav-enter-from > div:last-child,
.fav-leave-to > div:last-child {
  transform: translateX(100%);
}
[dir='rtl'] .fav-enter-from > div:last-child,
[dir='rtl'] .fav-leave-to > div:last-child {
  transform: translateX(-100%);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
