<script setup>
// Dismissible active-filter chip row. Surfaces every active filter value as a
// single tap-to-remove chip so mobile users can see/clear filters without opening
// the filter drawer. Placed between the sticky search and the category chips.
import { computed } from 'vue'
import { X } from 'lucide-vue-next'
import { useProviderFilters } from '../composables/useProviderFilters'
import { useMapBounds } from '../composables/useMapBounds'
import { useI18n } from '../composables/useI18n'

const {
  filters,
  toggleFilter,
  toggleLiveOnly,
  query,
  setQuery,
  radius,
  setRadius,
  nearMe,
  toggleNearMe,
  clearFilters,
  activeFilterCount,
  typeOptions,
  specialtyOptions,
  governorateOptions,
  areaOptions,
  servicesOptions,
  networkOptions,
  mainBranchOptions,
  pulseOptions,
} = useProviderFilters()
const { searchAreaActive, clearSearchArea, resetMapBounds } = useMapBounds()
const { t } = useI18n()

const GROUPS = [
  'providerType',
  'specialty',
  'governorate',
  'area',
  'services',
  'networkType',
  'mainBranch',
  'pulseStatus',
]
const OPTS = {
  providerType: typeOptions,
  specialty: specialtyOptions,
  governorate: governorateOptions,
  area: areaOptions,
  services: servicesOptions,
  networkType: networkOptions,
  mainBranch: mainBranchOptions,
  pulseStatus: pulseOptions,
}
function labelFor(group, key) {
  const opts = OPTS[group]?.value || []
  return opts.find((o) => o.key === key)?.label || key
}

const chips = computed(() => {
  const out = []
  if (query.value) out.push({ label: `“${query.value}”`, remove: () => setQuery('') })
  for (const g of GROUPS) {
    for (const key of filters[g]) {
      out.push({ label: labelFor(g, key), remove: () => toggleFilter(g, key) })
    }
  }
  if (filters.liveOnly) out.push({ label: t('liveOnly'), remove: () => toggleLiveOnly() })
  if (radius.value) out.push({ label: `${radius.value} ${t('km')}`, remove: () => setRadius(0) })
  if (nearMe.value) out.push({ label: t('nearMe'), remove: () => toggleNearMe() })
  if (searchAreaActive.value) out.push({ label: t('searchThisArea'), remove: () => { clearSearchArea(); resetMapBounds() } })
  return out
})
</script>

<template>
  <div
    v-if="activeFilterCount"
    class="no-scrollbar -mt-1 mb-3 flex items-center gap-1.5 overflow-x-auto pb-1"
  >
    <button
      v-for="(chip, i) in chips"
      :key="i"
      type="button"
      class="inline-flex shrink-0 items-center gap-1 rounded-full border border-brand-200 bg-brand-50 py-1 ps-2.5 pe-1.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-950 dark:text-brand-300 dark:hover:bg-brand-900"
      @click="chip.remove()"
    >
      <span class="max-w-[10rem] truncate">{{ chip.label }}</span>
      <X class="h-3 w-3 shrink-0 opacity-70" />
    </button>
    <button
      type="button"
      class="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-950/40"
      @click="clearFilters"
    >
      {{ t('clearFilters') }}<X class="h-3 w-3" />
    </button>
  </div>
</template>
