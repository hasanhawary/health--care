<script setup>
import { ref, computed } from 'vue'
import {
  SlidersHorizontal,
  X,
  Trash2,
  ChevronDown,
  Search,
  Check,
  Share2,
  BookmarkCheck,
  Save,
} from 'lucide-vue-next'
import { useProviderFilters } from '../composables/useProviderFilters'
import { useI18n } from '../composables/useI18n'
import { usePresets } from '../composables/usePresets'

defineProps({
  embedded: { type: Boolean, default: false },
})
const emit = defineEmits(['close'])

const {
  filters,
  toggleFilter,
  toggleLiveOnly,
  clearFilters,
  activeFilterCount,
  snapshot,
  applySnapshot,
  shareFilters,
  typeOptions,
  specialtyOptions,
  servicesOptions,
  networkOptions,
  mainBranchOptions,
  pulseOptions,
} = useProviderFilters()

const { t } = useI18n()
const { presets, savePreset, deletePreset } = usePresets()

const presetName = ref('')
const shared = ref(false)
function save() {
  const name = (presetName.value || '').trim()
  if (!name) return
  savePreset(name, snapshot())
  presetName.value = ''
}
function load(p) {
  applySnapshot(p.snapshot)
}
async function share() {
  const ok = await shareFilters()
  if (ok) {
    shared.value = true
    setTimeout(() => (shared.value = false), 1500)
  }
}

const groups = computed(() => [
  { name: 'providerType', label: t('providerType'), options: typeOptions.value },
  { name: 'specialty', label: t('specialty'), options: specialtyOptions.value },
  { name: 'services', label: t('services'), options: servicesOptions.value },
  { name: 'networkType', label: t('networkType'), options: networkOptions.value },
  { name: 'mainBranch', label: t('mainBranch'), options: mainBranchOptions.value },
  { name: 'pulseStatus', label: t('pulseStatus'), options: pulseOptions.value },
])

const collapsed = ref({})
const groupSearch = ref({})

function toggleCollapse(name) {
  collapsed.value[name] = !collapsed.value[name]
}
function filteredOptions(group) {
  const term = (groupSearch.value[group.name] || '').trim().toLowerCase()
  const opts = group.options
  if (!term) return opts
  return opts.filter((o) => o.label.toLowerCase().includes(term) || o.key.toLowerCase().includes(term))
}
function isSelected(group, key) {
  return filters[group.name].includes(key)
}
</script>

<template>
  <div :class="embedded ? '' : 'card lg:sticky lg:top-36 p-4'">
    <!-- header -->
    <div class="mb-3 flex items-center justify-between gap-2">
      <h2 class="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
        <SlidersHorizontal class="h-4 w-4 text-brand-600" />
        {{ t('filtersTitle') }}
        <span
          v-if="activeFilterCount"
          class="badge bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
        >{{ activeFilterCount }}</span>
      </h2>
      <button
        v-if="embedded"
        class="icon-btn lg:hidden"
        @click="emit('close')"
      >
        <X class="h-5 w-5" />
      </button>
    </div>

    <!-- share + presets -->
    <div class="mb-3 space-y-2">
      <div class="flex gap-2">
        <button class="btn-outline !py-2 flex-1 text-xs" @click="share">
          <Check v-if="shared" class="h-4 w-4 text-green-600" /><Share2 v-else class="h-4 w-4" />
          {{ shared ? t('shareCopied') : t('shareFilters') }}
        </button>
      </div>
      <div class="flex gap-2">
        <input
          v-model="presetName"
          type="text"
          :placeholder="t('presetName')"
          class="input !py-2 text-xs"
          @keydown.enter="save"
        />
        <button class="btn-soft !py-2 !px-3 text-xs" :title="t('savePreset')" @click="save">
          <Save class="h-4 w-4" />
        </button>
      </div>
      <div v-if="presets.length" class="space-y-1">
        <div class="text-xs font-semibold uppercase text-slate-400">{{ t('presets') }}</div>
        <div
          v-for="p in presets"
          :key="p.id"
          class="flex items-center gap-1 rounded-lg border border-slate-100 p-1 dark:border-slate-800"
        >
          <button class="flex min-w-0 flex-1 items-center gap-1.5 px-2 py-1 text-start text-xs font-medium text-slate-600 hover:text-brand-700 dark:text-slate-300" @click="load(p)">
            <BookmarkCheck class="h-3.5 w-3.5 shrink-0 text-brand-500" />
            <span class="truncate">{{ p.name }}</span>
          </button>
          <button class="icon-btn h-7 w-7 shrink-0" @click="deletePreset(p.id)">
            <Trash2 class="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>

    <!-- LIVE only toggle -->
    <button
      class="mb-3 flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:border-brand-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
      :class="filters.liveOnly ? 'ring-2 ring-green-200 border-green-300 dark:ring-green-900' : ''"
      @click="toggleLiveOnly"
    >
      <span class="flex items-center gap-2">
        <span class="h-2 w-2 rounded-full" :class="filters.liveOnly ? 'bg-green-500' : 'bg-slate-300'"></span>
        {{ t('liveOnly') }}
      </span>
      <span
        class="relative h-5 w-9 rounded-full transition"
        :class="filters.liveOnly ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-700'"
      >
        <span
          class="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all"
          :class="filters.liveOnly ? 'start-[1.125rem]' : 'start-0.5'"
        ></span>
      </span>
    </button>

    <!-- groups -->
    <div class="space-y-1.5">
      <div
        v-for="group in groups"
        :key="group.name"
        class="rounded-xl border border-slate-200 dark:border-slate-700"
      >
        <button
          class="flex w-full items-center justify-between px-3 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200"
          @click="toggleCollapse(group.name)"
        >
          <span>{{ group.label }}</span>
          <span class="flex items-center gap-1.5">
            <span v-if="filters[group.name].length" class="badge bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
              {{ filters[group.name].length }}
            </span>
            <ChevronDown
              class="h-4 w-4 text-slate-400 transition"
              :class="collapsed[group.name] ? '' : 'rotate-180'"
            />
          </span>
        </button>
        <div v-show="!collapsed[group.name]" class="px-2 pb-2">
          <div v-if="group.options.length > 8" class="relative mb-2">
            <Search class="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              v-model="groupSearch[group.name]"
              type="search"
              :placeholder="t('search')"
              class="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 ps-8 pe-2 text-xs text-slate-700 focus:border-brand-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>
          <ul class="max-h-52 space-y-0.5 overflow-y-auto scrollbar-thin pe-1">
            <li v-for="opt in filteredOptions(group)" :key="opt.key">
              <button
                class="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-start text-sm transition"
                :class="isSelected(group, opt.key)
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'"
                @click="toggleFilter(group.name, opt.key)"
              >
                <span
                  class="flex h-4 w-4 shrink-0 items-center justify-center rounded border transition"
                  :class="isSelected(group, opt.key)
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-slate-300 dark:border-slate-600'"
                >
                  <Check v-if="isSelected(group, opt.key)" class="h-3 w-3" />
                </span>
                <span class="flex-1 truncate">{{ opt.label }}</span>
                <span class="text-xs text-slate-400">{{ opt.count }}</span>
              </button>
            </li>
            <li v-if="!filteredOptions(group).length" class="px-2 py-2 text-xs text-slate-400">
              {{ t('noData') }}
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- clear -->
    <button
      v-if="activeFilterCount"
      class="btn-ghost mt-3 w-full border border-slate-200 text-rose-600 hover:bg-rose-50 dark:border-slate-700 dark:hover:bg-rose-950/40"
      @click="clearFilters"
    >
      <Trash2 class="h-4 w-4" />
      {{ t('clearAll') }}
    </button>
  </div>
</template>
