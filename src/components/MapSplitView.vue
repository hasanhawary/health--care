<script setup>
import { ref, computed } from 'vue'
import { MapPin, Phone, Navigation, Heart, Eye, Compass, ChevronLeft, Loader2 } from 'lucide-vue-next'
import MapView from './MapView.vue'
import MobileBottomSheet from './MobileBottomSheet.vue'
import MapProviderPopup from './MapProviderPopup.vue'
import { useProviderFilters } from '../composables/useProviderFilters'
import { useProviderMap } from '../composables/useProviderMap'
import { useFavorites } from '../composables/useFavorites'
import { useGeolocation } from '../composables/useGeolocation'
import { useI18n } from '../composables/useI18n'
import { typeBadgeClass } from '../utils/badges'
import { buildMapsUrl } from '../utils/maps'
import { formatDistance } from '../utils/distance'

const props = defineProps({
  providers: { type: Array, default: () => [] },
  query: { type: String, default: '' },
})
const emit = defineEmits(['open', 'locate', 'fullscreen'])

const { t, field, locale } = useI18n()
const { filtered, distOf, total } = useProviderFilters()
const { focusMarker, selectedId, hoveredId, hoverProvider, selectProvider } = useProviderMap()
const { isFavorite, toggleFavorite } = useFavorites()
const { detect, loading: locating } = useGeolocation()

const listLimit = ref(30)
const selectedPopup = ref(null)

const list = computed(() => filtered.value.slice(0, listLimit.value))

function onItem(p) {
  focusMarker(p.id)
  selectedPopup.value = p
}
function onMarkerSelect(p) {
  selectedPopup.value = p
}
function onDetails(p) {
  emit('open', p || selectedPopup.value)
}
function onFav(p) {
  toggleFavorite(p || selectedPopup.value)
}
function closePopup() {
  selectedPopup.value = null
}
async function onLocate() {
  try { await detect() } catch (e) {}
  emit('locate')
}
</script>

<template>
  <div class="relative h-[72dvh] min-h-[28rem] overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 lg:h-[80vh]">
    <!-- map (single instance) -->
    <MapView
      class="absolute inset-0"
      :providers="providers"
      @select="onMarkerSelect"
      @details="onDetails"
      @favorite="onFav"
      @locate="onLocate"
      @fullscreen="$emit('fullscreen')"
      @show-list="$emit('fullscreen')"
    />

    <!-- desktop side list -->
    <aside class="absolute inset-y-0 start-0 z-[600] hidden w-[400px] flex-col border-e border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 lg:flex">
      <div class="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <div class="text-sm font-bold text-slate-800 dark:text-slate-100">
          {{ total.toLocaleString() }} <span class="text-slate-400">{{ t('results') }}</span>
        </div>
        <button v-if="locating" class="icon-btn"><Loader2 class="h-4 w-4 animate-spin" /></button>
      </div>
      <div class="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-2">
        <button
          v-for="p in list"
          :key="p.id"
          class="mb-1.5 flex w-full items-start gap-2 rounded-xl border p-2.5 text-start transition"
          :class="(selectedId === p.id) ? 'border-brand-400 bg-brand-50 dark:border-brand-600 dark:bg-brand-950/40' : (hoveredId === p.id ? 'border-brand-200 bg-slate-50 dark:bg-slate-800/60' : 'border-slate-100 hover:border-brand-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40')"
          @click="onItem(p)"
          @mouseenter="hoverProvider(p.id)"
          @mouseleave="hoverProvider(null)"
        >
          <span class="mt-0.5 h-2 w-2 shrink-0 rounded-full" :class="typeBadgeClass(p.typeKey).split(' ')[0]"></span>
          <span class="min-w-0 flex-1 break-words">
            <span class="block truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{{ p.name }}</span>
            <span class="block truncate text-xs text-slate-500 dark:text-slate-400">
              {{ field(p, 'providerTypeAr', 'providerType') }} · {{ field(p, 'governorateAr', 'governorate') }}<span v-if="field(p, 'areaAr', 'area')"> · {{ field(p, 'areaAr', 'area') }}</span>
            </span>
            <span class="mt-1 flex items-center gap-1.5">
              <span v-if="distOf(p) != null" class="badge bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300"><Compass class="h-3 w-3" />{{ formatDistance(distOf(p), { km: t('km'), m: t('m') }) }}</span>
              <a :href="buildMapsUrl(p)" target="_blank" rel="noopener" class="badge bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"><Navigation class="h-3 w-3" />{{ t('mapView') }}</a>
            </span>
          </span>
          <ChevronLeft class="mt-1 h-4 w-4 shrink-0 text-slate-300 rtl:rotate-180" />
        </button>
        <button v-if="listLimit < filtered.length" class="btn-ghost mt-2 w-full text-xs" @click="listLimit += 30">{{ t('loadMore') }}</button>
      </div>
    </aside>

    <!-- mobile bottom sheet (collapses when a provider popup is open to avoid overlap) -->
    <MobileBottomSheet class="lg:hidden" :title="t('results')" :count="total" :force-collapsed="!!selectedPopup">
      <button
        v-for="p in list"
        :key="p.id"
        class="mb-1.5 flex w-full items-start gap-2 rounded-xl border p-2.5 text-start transition"
        :class="(selectedId === p.id) ? 'border-brand-400 bg-brand-50 dark:border-brand-600 dark:bg-brand-950/40' : 'border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40'"
        @click="onItem(p)"
      >
        <span class="mt-0.5 h-2 w-2 shrink-0 rounded-full" :class="typeBadgeClass(p.typeKey).split(' ')[0]"></span>
        <span class="min-w-0 flex-1">
          <span class="block truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{{ p.name }}</span>
          <span class="block truncate text-xs text-slate-500 dark:text-slate-400">{{ field(p, 'providerTypeAr', 'providerType') }} · {{ field(p, 'governorateAr', 'governorate') }}</span>
          <span v-if="distOf(p) != null" class="badge mt-1 bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300"><Compass class="h-3 w-3" />{{ formatDistance(distOf(p), { km: t('km'), m: t('m') }) }}</span>
        </span>
      </button>
      <button v-if="listLimit < filtered.length" class="btn-ghost mt-2 w-full text-xs" @click="listLimit += 30">{{ t('loadMore') }}</button>
    </MobileBottomSheet>

    <!-- selected provider mini-card -->
    <MapProviderPopup
      :provider="selectedPopup"
      :distance="selectedPopup ? distOf(selectedPopup) : null"
      :is-fav="selectedPopup ? isFavorite(selectedPopup.id) : false"
      @details="onDetails(selectedPopup)"
      @favorite="onFav(selectedPopup)"
      @close="closePopup"
    />
  </div>
</template>
