<script setup>
import { legendItems } from '../utils/mapIcons'
import { useI18n } from '../composables/useI18n'

const items = legendItems()
const { t, locale } = useI18n()
function labelOf(it) {
  return locale.value === 'en' ? it.label : it.labelAr
}
</script>

<template>
  <div class="glass hidden rounded-xl p-2.5 text-xs shadow-md sm:block">
    <div class="mb-1.5 font-bold text-slate-700 dark:text-slate-200">{{ t('legend') }}</div>
    <div class="grid grid-cols-2 gap-x-3 gap-y-1">
      <div v-for="it in items" :key="it.label" class="flex items-center gap-1.5">
        <span class="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px]" :style="{ background: it.color }">{{ it.emoji }}</span>
        <span class="text-slate-600 dark:text-slate-300">{{ labelOf(it) }}</span>
      </div>
    </div>
  </div>
</template>
