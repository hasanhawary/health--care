<script setup>
import { Crosshair, Locate, RotateCcw, Maximize2, Minimize2, List } from 'lucide-vue-next'
import { useI18n } from '../composables/useI18n'

defineProps({
  fullscreen: { type: Boolean, default: false },
})
const emit = defineEmits(['recenter', 'locate', 'reset', 'fullscreen', 'show-list'])
const { t } = useI18n()
</script>

<template>
  <div class="absolute end-3 top-3 z-[500] flex flex-col gap-2">
    <div class="glass flex flex-col overflow-hidden rounded-xl shadow-md">
      <button class="icon-btn !rounded-none" :title="t('detectLocation')" @click="emit('locate')"><Locate class="h-4 w-4" /></button>
      <button class="icon-btn !rounded-none border-t border-slate-200 dark:border-slate-700" :title="t('recenter')" @click="emit('recenter')"><Crosshair class="h-4 w-4" /></button>
      <button class="icon-btn !rounded-none border-t border-slate-200 dark:border-slate-700" :title="t('resetMap')" @click="emit('reset')"><RotateCcw class="h-4 w-4" /></button>
      <button class="icon-btn !rounded-none border-t border-slate-200 dark:border-slate-700" :title="fullscreen ? t('exitFullscreen') : t('fullscreen')" @click="emit('fullscreen')">
        <Minimize2 v-if="fullscreen" class="h-4 w-4" /><Maximize2 v-else class="h-4 w-4" />
      </button>
    </div>
    <button class="glass icon-btn rounded-xl shadow-md lg:hidden" :title="t('showList')" @click="emit('show-list')">
      <List class="h-4 w-4" />
    </button>
  </div>
</template>
