<script setup>
import { ref, computed, watch } from 'vue'
import {
  Search,
  X,
  SlidersHorizontal,
  Clock,
  Trash2,
  CornerDownLeft,
  Stethoscope,
  MapPin,
  KeyRound,
  TrendingUp,
} from 'lucide-vue-next'
import { useProviderFilters } from '../composables/useProviderFilters'
import { useFavorites } from '../composables/useFavorites'
import { useAnalytics } from '../composables/useAnalytics'
import { useSearch } from '../composables/useSearch'
import { useI18n } from '../composables/useI18n'
import { normalizeArabic } from '../utils/normalizeText'
import { typeBadgeClass } from '../utils/badges'

defineProps({
  showFiltersButton: { type: Boolean, default: false },
  compact: { type: Boolean, default: false },
})
const emit = defineEmits(['toggle-filters'])

const { query, setQuery } = useProviderFilters()
const { recentSearches, addRecentSearch, clearRecentSearches } = useFavorites()
const { trackSearch, topSearches } = useAnalytics()
const { suggest } = useSearch()
const { t, field } = useI18n()

const input = ref(query.value)
const focused = ref(false)
const activeIndex = ref(-1)
let timer = null

const suggestions = computed(() => {
  const q = normalizeArabic(input.value)
  if (!q || q.length < 2) return []
  return suggest(q, 8)
})

watch(input, (val) => {
  clearTimeout(timer)
  timer = setTimeout(() => setQuery(val), 220)
})
watch(query, (val) => {
  if (val !== input.value) input.value = val
})
watch(suggestions, () => {
  activeIndex.value = -1
})

function commitRecent() {
  const val = (input.value || '').trim()
  if (val) {
    addRecentSearch(val)
    trackSearch(val)
  }
  focused.value = false
}
function clear() {
  input.value = ''
  setQuery('')
}
function pickSuggestion(p) {
  input.value = p.name
  setQuery(p.name)
  addRecentSearch(p.name)
  trackSearch(p.name)
  focused.value = false
}
function onBlur() {
  setTimeout(() => (focused.value = false), 160)
}
function onKeydown(e) {
  const list = suggestions.value
  if (e.key === 'ArrowDown' && list.length) {
    e.preventDefault()
    activeIndex.value = (activeIndex.value + 1) % list.length
  } else if (e.key === 'ArrowUp' && list.length) {
    e.preventDefault()
    activeIndex.value = (activeIndex.value - 1 + list.length) % list.length
  } else if (e.key === 'Enter') {
    if (activeIndex.value >= 0 && list[activeIndex.value]) {
      e.preventDefault()
      pickSuggestion(list[activeIndex.value])
    } else {
      commitRecent()
    }
  } else if (e.key === 'Escape') {
    focused.value = false
  }
}
</script>

<template>
  <div class="relative z-30">
    <div class="flex flex-wrap items-center gap-2 sm:flex-nowrap">
      <div class="relative min-w-0 basis-full sm:basis-auto sm:flex-1">
        <Search class="pointer-events-none absolute start-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          v-model="input"
          type="search"
          :placeholder="t('searchPlaceholder')"
          class="input !rounded-2xl !py-3 ps-11 pe-10 text-base shadow-sm"
          :class="compact ? '!py-2.5 text-sm' : ''"
          role="combobox"
          :aria-expanded="focused ? 'true' : 'false'"
          aria-controls="search-listbox"
          :aria-activedescendant="activeIndex >= 0 ? 'sug-' + activeIndex : ''"
          @focus="focused = true"
          @blur="onBlur"
          @keydown="onKeydown"
        />
        <button
          v-if="input"
          type="button"
          class="absolute end-2.5 top-1/2 -translate-y-1/2 icon-btn h-8 w-8"
          :title="t('resetQuery')"
          @click="clear"
        >
          <X class="h-4 w-4" />
        </button>
      </div>
      <slot name="actions" />
      <button
        v-if="showFiltersButton"
        type="button"
        class="btn-outline relative shrink-0 !rounded-2xl !px-3 lg:hidden"
        :title="t('showFilters')"
        :aria-label="t('showFilters')"
        @click="emit('toggle-filters')"
      >
        <SlidersHorizontal class="h-5 w-5" />
      </button>
    </div>

    <!-- dropdown -->
    <Transition name="fade">
      <div
        v-if="focused"
        class="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95"
      >
        <!-- suggestions -->
        <ul v-if="suggestions.length" id="search-listbox" role="listbox" class="max-h-80 overflow-y-auto scrollbar-thin">
          <li v-for="(p, i) in suggestions" :key="p.id" role="option" :id="'sug-' + i" :aria-selected="i === activeIndex">
            <button
              class="flex w-full items-center gap-3 px-4 py-2.5 text-start transition"
              :class="i === activeIndex ? 'bg-brand-50 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'"
              @mousedown.prevent="pickSuggestion(p)"
              @mouseenter="activeIndex = i"
            >
              <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white" :class="typeBadgeClass(p.typeKey).split(' ')[0]">
                <Stethoscope class="h-4 w-4" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{{ p.name }}</span>
                <span class="flex items-center gap-1.5 truncate text-xs text-slate-500 dark:text-slate-400">
                  <span>{{ field(p, 'providerTypeAr', 'providerType') }}</span>
                  <span v-if="field(p, 'governorateAr', 'governorate')">· {{ field(p, 'governorateAr', 'governorate') }}</span>
                </span>
              </span>
              <span v-if="p.phone" class="hidden items-center gap-1 text-xs text-slate-400 sm:flex" dir="ltr">
                <KeyRound class="h-3 w-3" />{{ p.phone }}
              </span>
            </button>
          </li>
        </ul>

        <!-- recent searches -->
        <div v-else-if="!input && recentSearches.length">
          <div class="flex items-center justify-between px-4 py-2 text-xs font-semibold uppercase text-slate-400">
            <span class="flex items-center gap-1.5"><Clock class="h-3.5 w-3.5" />{{ t('recentSearches') }}</span>
            <button class="text-slate-400 hover:text-rose-500" @click="clearRecentSearches">
              <Trash2 class="h-3.5 w-3.5" />
            </button>
          </div>
          <ul class="max-h-64 overflow-y-auto scrollbar-thin">
            <li v-for="s in recentSearches" :key="s">
              <button
                class="flex w-full items-center gap-2 px-4 py-2.5 text-start text-sm text-slate-600 transition hover:bg-brand-50 dark:text-slate-300 dark:hover:bg-slate-800"
                @mousedown.prevent="input = s; setQuery(s); focused = false"
              >
                <Clock class="h-4 w-4 shrink-0 text-slate-400" />
                <span class="flex-1 truncate">{{ s }}</span>
                <CornerDownLeft class="h-3.5 w-3.5 shrink-0 text-slate-300" />
              </button>
            </li>
          </ul>
        </div>

        <!-- trending -->
        <div v-else-if="!input && topSearches.length" class="px-4 py-3">
          <div class="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-400">
            <TrendingUp class="h-3.5 w-3.5" />{{ t('recentSearches') }}
          </div>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="[term] in topSearches"
              :key="term"
              class="chip"
              @mousedown.prevent="input = term; setQuery(term); focused = false"
            >
              <MapPin class="h-3 w-3" />{{ term }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
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
