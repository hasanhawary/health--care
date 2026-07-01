<script setup>
import { SearchX, RotateCcw, Search } from 'lucide-vue-next'
import { useI18n } from '../composables/useI18n'

defineProps({
  title: { type: String, default: '' },
  desc: { type: String, default: '' },
  variant: { type: String, default: 'empty' }, // empty | error
  showRetry: { type: Boolean, default: false },
  retryLabel: { type: String, default: '' },
})

const emit = defineEmits(['retry'])
const { t } = useI18n()
</script>

<template>
  <div class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900/40">
    <!-- illustration -->
    <div class="relative mb-4">
      <svg class="h-28 w-28" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="60" cy="60" r="56" class="fill-slate-100 dark:fill-slate-800" />
        <circle cx="60" cy="60" r="40" class="stroke-slate-200 dark:stroke-slate-700" stroke-width="2" stroke-dasharray="4 6" />
        <template v-if="variant === 'error'">
          <path d="M60 36v24" class="stroke-rose-400" stroke-width="6" stroke-linecap="round" />
          <circle cx="60" cy="78" r="3.5" class="fill-rose-400" />
        </template>
        <template v-else>
          <circle cx="50" cy="52" r="16" class="stroke-brand-400" stroke-width="5" />
          <path d="M62 64l14 14" class="stroke-brand-400" stroke-width="5" stroke-linecap="round" />
          <path d="M44 52h12M50 46v12" class="stroke-brand-400" stroke-width="4" stroke-linecap="round" />
        </template>
      </svg>
    </div>
    <h3 class="text-lg font-bold text-slate-800 dark:text-slate-100">
      {{ title || (variant === 'error' ? t('errorTitle') : t('noResultsTitle')) }}
    </h3>
    <p class="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
      {{ desc || (variant === 'error' ? t('errorDesc') : t('noResultsDesc')) }}
    </p>
    <button v-if="showRetry" class="btn-primary mt-5" @click="emit('retry')">
      <RotateCcw class="h-4 w-4" />
      {{ retryLabel || t('retry') }}
    </button>
    <button v-else class="btn-outline mt-5" @click="emit('retry')">
      <Search class="h-4 w-4" />
      {{ t('clearFilters') }}
    </button>
  </div>
</template>
