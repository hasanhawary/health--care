<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Download, FileSpreadsheet, FileText, Printer, FileDown, ChevronDown, Loader2 } from 'lucide-vue-next'
import { useI18n } from '../composables/useI18n'
import { exportProvidersCsv } from '../utils/exportCsv'

const props = defineProps({
  providers: { type: Array, default: () => [] },
  disabled: { type: Boolean, default: false },
})

const { t } = useI18n()
const open = ref(false)
const busy = ref(false)
const el = ref(null)

function toggle() {
  open.value = !open.value
}
function close() {
  open.value = false
}
function onDoc(e) {
  if (el.value && !el.value.contains(e.target)) close()
}
onMounted(() => document.addEventListener('click', onDoc))
onBeforeUnmount(() => document.removeEventListener('click', onDoc))

async function run(kind) {
  if (busy.value) return
  close()
  busy.value = true
  try {
    if (kind === 'csv') {
      exportProvidersCsv(props.providers)
    } else {
      const mod = await import('../utils/exportDocs')
      if (kind === 'excel') mod.exportExcel(props.providers)
      else if (kind === 'pdf') mod.exportPdf(props.providers)
      else if (kind === 'print') mod.printView(props.providers)
    }
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div ref="el" class="relative">
    <button class="btn-outline !px-3 !py-2 text-xs" :disabled="disabled || busy" @click="toggle">
      <Loader2 v-if="busy" class="h-4 w-4 animate-spin" />
      <Download v-else class="h-4 w-4" /><span class="hidden sm:inline">{{ t('export') }}</span>
      <ChevronDown class="h-3.5 w-3.5 opacity-60" />
    </button>
    <Transition name="fade">
      <div
        v-if="open"
        class="absolute end-0 z-30 mt-1 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-900"
      >
        <button class="flex w-full items-center gap-2 px-3 py-2 text-start text-xs hover:bg-slate-100 dark:hover:bg-slate-800" @click="run('csv')">
          <FileDown class="h-4 w-4 text-slate-500" />CSV
        </button>
        <button class="flex w-full items-center gap-2 px-3 py-2 text-start text-xs hover:bg-slate-100 dark:hover:bg-slate-800" @click="run('excel')">
          <FileSpreadsheet class="h-4 w-4 text-green-600" />{{ t('exportExcel') }}
        </button>
        <button class="flex w-full items-center gap-2 px-3 py-2 text-start text-xs hover:bg-slate-100 dark:hover:bg-slate-800" @click="run('pdf')">
          <FileText class="h-4 w-4 text-rose-600" />{{ t('exportPdf') }}
        </button>
        <button class="flex w-full items-center gap-2 px-3 py-2 text-start text-xs hover:bg-slate-100 dark:hover:bg-slate-800" @click="run('print')">
          <Printer class="h-4 w-4 text-brand-600" />{{ t('print') }}
        </button>
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
