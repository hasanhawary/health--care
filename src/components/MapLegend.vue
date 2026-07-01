<script setup>
import { legendItems } from '../utils/mapIcons'
const items = legendItems()
</script>

<template>
  <div class="glass hidden rounded-xl p-2.5 text-xs shadow-md sm:block">
    <div class="mb-1.5 font-bold text-slate-700 dark:text-slate-200">المفتاح</div>
    <div class="grid grid-cols-2 gap-x-3 gap-y-1">
      <div v-for="it in items" :key="it.label" class="flex items-center gap-1.5">
        <span class="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px]" :style="{ background: it.color }">{{ it.emoji }}</span>
        <span class="text-slate-600 dark:text-slate-300">{{ it.label }}</span>
      </div>
    </div>
  </div>
</template>
