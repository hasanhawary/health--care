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
const panelEl = ref(null)
const term = ref({ governorate: '', area: '' })
const panelStyle = ref({})
let triggerBtn = null
let justOpenedTimer = null
let justOpened = false // suppress close during the focus/auto-scroll that follows open

// Position the floating panel relative to its trigger button, clamped to the
// viewport. Using fixed + Teleport escapes the overflow-x-auto parent that
// clipped (and off-screened) the dropdown on mobile.
function positionPanel(btn) {
  if (!btn) return
  triggerBtn = btn
  const r = btn.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight
  const w = Math.min(288, vw - 16)
  let left = r.right - w // right-align to the button's right edge (natural for RTL), then clamp
  if (left < 8) left = 8
  if (left + w > vw - 8) left = vw - w - 8
  let top = r.bottom + 4
  if (top + 360 > vh - 8) top = Math.max(8, r.top - 4 - 360) // flip above if needed
  panelStyle.value = {
    position: 'fixed',
    top: `${Math.round(top)}px`,
    left: `${Math.round(left)}px`,
    width: `${w}px`,
  }
}

function togglePanel(name, event) {
  if (openPanel.value === name) {
    closePanel()
    return
  }
  openPanel.value = name
  // suppress scroll/resize-induced closes for a brief moment after opening so
  // the browser's auto-scroll-into-view / keyboard-open doesn't unmount the input
  justOpened = true
  clearTimeout(justOpenedTimer)
  justOpenedTimer = setTimeout(() => { justOpened = false }, 450)
  if (event?.currentTarget) positionPanel(event.currentTarget)
}
function closePanel() {
  openPanel.value = null
  triggerBtn = null
}
function clearGroup(name) {
  filters[name].splice(0, filters[name].length)
}
function isSelected(name, key) {
  return filters[name].includes(key)
}

// Filter options ONLY for the open panel. Decoupling this from `panels` means
// typing in the search box recomputes a single filter pass instead of rebuilding
// both panel descriptors (which previously caused per-keystroke re-render churn).
const activeOptions = computed(() => {
  const name = openPanel.value
  if (!name) return []
  const list = name === 'governorate' ? governorateOptions.value : areaOptions.value
  const q = (term.value[name] || '').trim().toLowerCase()
  if (!q) return list
  return list.filter((o) => o.label.toLowerCase().includes(q) || o.key.toLowerCase().includes(q))
})

const panels = computed(() => [
  {
    name: 'governorate',
    icon: MapPin,
    title: t('governorate'),
    label: labelFor('governorate'),
    count: filters.governorate.length,
  },
  {
    name: 'area',
    icon: Building2,
    title: t('city'),
    label: labelFor('area'),
    count: filters.area.length,
  },
])

const activePanel = computed(() => panels.value.find((p) => p.name === openPanel.value) || null)

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
  if (!openPanel.value) return
  const t = e.target
  if (root.value && root.value.contains(t)) return
  if (panelEl.value && panelEl.value.contains(t)) return
  closePanel()
}
function onScroll() {
  if (!openPanel.value || justOpened) return
  closePanel()
}
// On mobile, focusing the input opens the soft keyboard which resizes the
// viewport. The previous version closed the panel here -> unmounted the input
// -> lost focus. Instead, reposition so the panel stays usable.
function onResize() {
  if (!openPanel.value || justOpened) return
  if (triggerBtn) positionPanel(triggerBtn)
}
onMounted(() => {
  document.addEventListener('mousedown', onDocClick)
  window.addEventListener('scroll', onScroll, true)
  window.addEventListener('resize', onResize)
})
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocClick)
  window.removeEventListener('scroll', onScroll, true)
  window.removeEventListener('resize', onResize)
  clearTimeout(justOpenedTimer)
})
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
        @click="togglePanel(panel.name, $event)"
      >
        <component :is="panel.icon" class="h-4 w-4 shrink-0" />
        <span class="max-w-[4rem] truncate sm:max-w-[7.5rem]">{{ panel.label }}</span>
        <span
          v-if="panel.count"
          class="badge bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 !px-1.5 !py-0"
        >{{ panel.count }}</span>
        <ChevronDown
          class="h-3.5 w-3.5 shrink-0 opacity-60 transition"
          :class="openPanel === panel.name ? 'rotate-180' : ''"
        />
      </button>
    </div>
  </div>

  <!-- dropdown: teleported to body so it escapes the scrollable/overflow parent on mobile -->
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="activePanel"
        ref="panelEl"
        :style="panelStyle"
        class="z-40 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
      >
        <!-- header -->
        <div class="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2 dark:border-slate-800">
          <span class="text-xs font-bold text-slate-700 dark:text-slate-200">{{ activePanel.title }}</span>
          <button
            v-if="activePanel.count"
            type="button"
            class="inline-flex items-center gap-1 text-xs text-rose-500 hover:underline"
            @mousedown.prevent
            @click="clearGroup(activePanel.name)"
          >
            <X class="h-3 w-3" />{{ t('clearFilters') }}
          </button>
        </div>

        <!-- search -->
        <div class="relative p-2">
          <Search class="pointer-events-none absolute start-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            v-model="term[activePanel.name]"
            type="search"
            :placeholder="t('search')"
            class="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 ps-7 pe-2 text-xs focus:border-brand-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          />
        </div>

        <!-- options -->
        <ul class="max-h-64 space-y-0.5 overflow-y-auto scrollbar-thin px-1 pb-1" role="listbox">
          <li v-for="opt in activeOptions" :key="opt.key">
            <button
              type="button"
              role="option"
              :aria-selected="isSelected(activePanel.name, opt.key) ? 'true' : 'false'"
              class="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-start text-sm transition"
              :class="isSelected(activePanel.name, opt.key)
                ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'"
              @mousedown.prevent
              @click="toggleFilter(activePanel.name, opt.key)"
            >
              <span
                class="flex h-4 w-4 shrink-0 items-center justify-center rounded border transition"
                :class="isSelected(activePanel.name, opt.key)
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-slate-300 dark:border-slate-600'"
              >
                <Check v-if="isSelected(activePanel.name, opt.key)" class="h-3 w-3" />
              </span>
              <span class="flex-1 truncate">{{ opt.label }}</span>
              <span class="text-xs text-slate-400">{{ opt.count }}</span>
            </button>
          </li>
          <li v-if="!activeOptions.length" class="px-2 py-2 text-xs text-slate-400">
            {{ t('noData') }}
          </li>
        </ul>

        <!-- dependency hint for city -->
        <div
          v-if="activePanel.name === 'area' && filters.governorate.length"
          class="flex items-center gap-1.5 border-t border-slate-100 px-3 py-1.5 text-[11px] text-slate-400 dark:border-slate-800"
        >
          <Link2 class="h-3 w-3 shrink-0" />
          <span>{{ t('citiesDependOnGov') }}</span>
        </div>
      </div>
    </Transition>
  </Teleport>
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
