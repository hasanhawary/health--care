<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  value: { type: Number, default: 0 },
  duration: { type: Number, default: 900 },
  format: { type: Boolean, default: true },
})

const display = ref(0)
const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

function animateTo(target) {
  if (reduce) {
    display.value = target
    return
  }
  const start = display.value
  const delta = target - start
  const t0 = performance.now()
  function step(now) {
    const p = Math.min(1, (now - t0) / props.duration)
    const eased = 1 - Math.pow(1 - p, 3)
    display.value = Math.round(start + delta * eased)
    if (p < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

onMounted(() => animateTo(props.value))
watch(
  () => props.value,
  (v) => animateTo(v)
)
</script>

<template>
  <span>{{ format ? display.toLocaleString() : display }}</span>
</template>
