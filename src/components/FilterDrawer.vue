<script setup>
import { watch, onMounted, onBeforeUnmount } from 'vue'
import { X, Check } from 'lucide-vue-next'
import { useI18n } from '../composables/useI18n'
import { useProviderFilters } from '../composables/useProviderFilters'
import FilterSidebar from './FilterSidebar.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
})
const emit = defineEmits(['close'])

const { t } = useI18n()
const { activeFilterCount } = useProviderFilters()

function onKey(e) {
  if (e.key === 'Escape' && props.open) emit('close')
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
})

watch(
  () => props.open,
  (v) => {
    document.body.style.overflow = v ? 'hidden' : ''
  }
)
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="open" class="fixed inset-0 z-50 lg:hidden">
        <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="emit('close')"></div>
        <div class="absolute end-0 top-0 flex h-dvh w-full max-w-sm flex-col bg-slate-50 shadow-2xl dark:bg-slate-950 sm:w-[88%]">
          <div class="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
            <h2 class="text-base font-bold text-slate-800 dark:text-slate-100">{{ t('filtersTitle') }}</h2>
            <button class="icon-btn" @click="emit('close')">
              <X class="h-5 w-5" />
            </button>
          </div>
          <div class="scrollbar-thin flex-1 overflow-y-auto p-3">
            <FilterSidebar embedded @close="emit('close')" />
          </div>
          <div class="safe-bottom border-t border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
            <button class="btn-primary w-full" @click="emit('close')">
              <Check class="h-4 w-4" />
              {{ t('apply') }}
              <span v-if="activeFilterCount" class="opacity-80">({{ activeFilterCount }})</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.2s ease;
}
.drawer-enter-active > div:last-child,
.drawer-leave-active > div:last-child {
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}
.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}
.drawer-enter-from > div:last-child,
.drawer-leave-to > div:last-child {
  transform: translateX(100%);
}
[dir='rtl'] .drawer-enter-from > div:last-child,
[dir='rtl'] .drawer-leave-to > div:last-child {
  transform: translateX(-100%);
}
</style>
