<script setup>
import { ref } from 'vue'
import { GripHorizontal, ChevronUp, ChevronDown } from 'lucide-vue-next'

defineProps({
  title: { type: String, default: '' },
  count: { type: Number, default: 0 },
  forceCollapsed: { type: Boolean, default: false },
})
const emit = defineEmits(['toggle'])

const expanded = ref(false)
let startY = 0
let dragging = false

function toggle() {
  expanded.value = !expanded.value
  emit('toggle', expanded.value)
}
function onTouchStart(e) {
  startY = e.touches[0].clientY
  dragging = true
}
function onTouchEnd(e) {
  if (!dragging) return
  dragging = false
  const dy = (e.changedTouches[0].clientY - startY)
  if (dy < -40 && !expanded.value) { expanded.value = true; emit('toggle', true) }
  else if (dy > 40 && expanded.value) { expanded.value = false; emit('toggle', false) }
}
</script>

<template>
  <div
    class="safe-bottom absolute inset-x-0 bottom-0 z-[650] flex flex-col rounded-t-2xl bg-white shadow-2xl transition-[height] duration-300 dark:bg-slate-900 lg:hidden"
    :class="forceCollapsed ? 'h-auto max-h-[12vh]' : (expanded ? 'h-[78dvh] max-h-[calc(100dvh-4rem)]' : 'h-[42dvh] max-h-[calc(100dvh-5rem)]')"
    @touchstart.passive="onTouchStart"
    @touchend.passive="onTouchEnd"
  >
    <button
      class="flex shrink-0 cursor-grab items-center justify-center gap-2 py-2 active:cursor-grabbing"
      :disabled="forceCollapsed"
      @click="toggle"
    >
      <GripHorizontal class="h-5 w-5 text-slate-400" />
      <span class="text-xs font-bold text-slate-600 dark:text-slate-300">{{ title }}</span>
      <span class="badge bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300">{{ count }}</span>
      <ChevronDown v-if="expanded && !forceCollapsed" class="h-4 w-4 text-slate-400" />
      <ChevronUp v-else class="h-4 w-4 text-slate-400" />
    </button>
    <div v-show="!forceCollapsed" class="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-3 pb-2">
      <slot />
    </div>
  </div>
</template>
