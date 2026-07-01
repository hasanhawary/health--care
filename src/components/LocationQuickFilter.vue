<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { MapPin, Building2, ChevronDown, Check, Search, X, Link2 } from 'lucide-vue-next'
import { useProviderFilters } from '../composables/useProviderFilters'
import { useI18n } from '../composables/useI18n'

const {
  filters,
  toggleFilter,
  governorateOptions,
  areaOptions,
} = useProviderFilters()

const { t } = useI18n()

const openPanel = ref(null) // 'governorate' | 'area' | null
const root = ref(null)
const term = ref({ governorate: '', area: '' })

function togglePanel(name) {
  openPanel.value = openPanel.value === name ? null : name
}
function closePanel() {
  openPanel.value = null
}
function clearGroup(name) {
  filters[name].splice(0, filters[name].length)
}
function isSelected(name, key) {
  return filters[name].includes(key)
}

function optsFor(name) {
  const list = name === 'governorate' ? governorateOptions.value : areaOptions.value
  const q = (term.value[name] || '').trim().toLowerCase()
  if (!q) return list
  return list.filter((o) => o.label.toLowerCase().includes(q) || o.key.toLowerCase().includes(q))
}

const panels = computed(() => [
  {
    name: 'governorate',
    icon: MapPin,
    title: t('governorate'),
    label: labelFor('governorate'),
    count: filters.governorate.length,
    options: optsFor('governorate'),
  },
  {
    name: 'area',
    icon: Building2,
    title: t('city'),
    label: labelFor('area'),
    count: filters.area.length,
    options: optsFor('area'),
  },
])

function labelFor(name) {
  const arr = filters[name]
  if (!arr.length) return name === 'governorate' ? t('governorate') : t('city')
  if (arr.length === 1) {
    const opts = name === 'governorate' ? governorateOptions.value : areaOptions.value
    return opts.find((o) => o.key === arr[0])?.label || (name === 'governorate' ? t('governorate') : t('city'))
  }
  return `${arr.length}`
}

function onDocClick(e) {
  if (openPanel.value && root.value && !root.value.contains(e.target)) {
    openPanel.value = null
  }
}
onMounted(() => document.addEventListener('mousedown', onDocClick))
onBeforeUnmount(() => document.removeEventListener('mousedown', onDocClick))
</script>

<template>
  <div ref="root" class="no-scrollbar flex min-w-0 items-center gap-1.5 overflow-x-auto sm:flex-none sm:overflow-visible">
    <div v-for="panel in panels" :key="panel.name" class="relative shrink-0">
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-xl border bg-white px-2 py-2 text-xs font-semibold transition dark:bg-slate-900"
        :class="panel.count
          ? 'border-brand-400 text-brand-700 dark:border-brand-600 dark:text-brand-300'
          : 'border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:text-slate-200'"
        :title="panel.title"
        :aria-label="panel.title"
        aria-haspopup="listbox"
        :aria-expanded="openPanel === panel.name ? 'true' : 'false'"
        @click="togglePanel(panel.name)"
      >
        <component :is="panel.icon" class="h-4 w-4 shrink-0" />
        <span class="hidden max-w-[7.5rem] truncate sm:inline">{{ panel.label }}</span>
        <span
          v-if="panel.count"
          class="badge bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 !px-1.5 !py-0"
        >{{ panel.count }}</span>
        <ChevronDown
          class="h-3.5 w-3.5 shrink-0 opacity-60 transition"
          :class="openPanel === panel.name ? 'rotate-180' : ''"
        />
      </button>

      <Transition name="fade">
        <div
          v-if="openPanel === panel.name"
          class="absolute end-0 top-full z-50 mt-1 w-72 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl sm:end-auto sm:start-0 dark:border-slate-700 dark:bg-slate-900"
        >
          <!-- header -->
          <div class="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2 dark:border-slate-800">
            <span class="text-xs font-bold text-slate-700 dark:text-slate-200">{{ panel.title }}</span>
            <button
              v-if="panel.count"
              type="button"
              class="inline-flex items-center gap-1 text-xs text-rose-500 hover:underline"
              @click="clearGroup(panel.name)"
            >
              <X class="h-3 w-3" />{{ t('clearFilters') }}
            </button>
          </div>

          <!-- search -->
          <div class="relative p-2">
            <Search class="pointer-events-none absolute start-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              v-model="term[panel.name]"
              type="search"
              :placeholder="t('search')"
              class="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 ps-7 pe-2 text-xs focus:border-brand-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>

          <!-- options -->
          <ul class="max-h-64 space-y-0.5 overflow-y-auto scrollbar-thin px-1 pb-1" role="listbox">
            <li v-for="opt in panel.options" :key="opt.key">
              <button
                type="button"
                role="option"
                :aria-selected="isSelected(panel.name, opt.key) ? 'true' : 'false'"
                class="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-start text-sm transition"
                :class="isSelected(panel.name, opt.key)
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'"
                @click="toggleFilter(panel.name, opt.key)"
              >
                <span
                  class="flex h-4 w-4 shrink-0 items-center justify-center rounded border transition"
                  :class="isSelected(panel.name, opt.key)
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-slate-300 dark:border-slate-600'"
                >
                  <Check v-if="isSelected(panel.name, opt.key)" class="h-3 w-3" />
                </span>
                <span class="flex-1 truncate">{{ opt.label }}</span>
                <span class="text-xs text-slate-400">{{ opt.count }}</span>
              </button>
            </li>
            <li v-if="!panel.options.length" class="px-2 py-2 text-xs text-slate-400">
              {{ t('noData') }}
            </li>
          </ul>

          <!-- dependency hint for city -->
          <div
            v-if="panel.name === 'area' && filters.governorate.length"
            class="flex items-center gap-1.5 border-t border-slate-100 px-3 py-1.5 text-[11px] text-slate-400 dark:border-slate-800"
          >
            <Link2 class="h-3 w-3 shrink-0" />
            <span>{{ t('citiesDependOnGov') }}</span>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
