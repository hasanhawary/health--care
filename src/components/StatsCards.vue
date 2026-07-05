<script setup>
import { computed } from 'vue'
import {
  Database,
  Stethoscope,
  Hospital,
  Pill,
  FlaskConical,
  HeartPulse,
  Network,
  Filter,
} from 'lucide-vue-next'
import { useProviderFilters } from '../composables/useProviderFilters'
import { useI18n } from '../composables/useI18n'
import AnimatedCounter from './AnimatedCounter.vue'

const { stats, statsMode, setStatsMode, setCategory } = useProviderFilters()
const { t } = useI18n()

const cards = computed(() => [
  { key: 'total', label: statsMode.value === 'all' ? t('entireNetwork') : t('currentResults'), value: stats.value.total, icon: Database, color: 'from-brand-500 to-brand-700', filter: '' },
  { key: 'doctors', label: t('doctors'), value: stats.value.doctors, icon: Stethoscope, color: 'from-indigo-500 to-indigo-700', filter: 'physician clinic' },
  { key: 'hospitals', label: t('hospitals'), value: stats.value.hospitals, icon: Hospital, color: 'from-red-500 to-red-700', filter: 'hospital' },
  { key: 'pharmacies', label: t('pharmacies'), value: stats.value.pharmacies, icon: Pill, color: 'from-emerald-500 to-emerald-700', filter: 'pharmacy' },
  { key: 'labs', label: t('labs'), value: stats.value.labs, icon: FlaskConical, color: 'from-blue-500 to-blue-700', filter: 'laboratory' },
  { key: 'live', label: t('activeProviders'), value: stats.value.live, icon: HeartPulse, color: 'from-rose-500 to-rose-700', filter: '' },
])
</script>

<template>
  <div class="mb-4 flex items-center justify-between gap-2">
    <div class="inline-flex rounded-xl border border-slate-200 bg-white p-1 text-xs font-semibold dark:border-slate-700 dark:bg-slate-900">
      <button
        class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition"
        :class="statsMode === 'current' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300'"
        @click="setStatsMode('current')"
      >
        <Filter class="h-3.5 w-3.5" />{{ t('currentResults') }}
      </button>
      <button
        class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition"
        :class="statsMode === 'all' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300'"
        @click="setStatsMode('all')"
      >
        <Network class="h-3.5 w-3.5" />{{ t('entireNetwork') }}
      </button>
    </div>
  </div>
  <div class="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
    <button
      v-for="c in cards"
      :key="c.key"
      class="card group relative min-w-0 overflow-hidden p-3 text-start transition duration-200 hover:-translate-y-0.5 hover:shadow-card-hover sm:p-4"
      @click="c.filter ? setCategory(c.filter) : null"
    >
      <div class="flex items-center gap-3">
        <div
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm transition group-hover:scale-110 sm:h-10 sm:w-10"
          :class="c.color"
        >
          <component :is="c.icon" class="h-5 w-5" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="text-lg font-extrabold leading-tight text-slate-800 dark:text-slate-100 sm:text-xl">
            <AnimatedCounter :value="c.value" />
          </div>
          <div class="truncate text-xs font-medium text-slate-500 dark:text-slate-400">
            {{ c.label }}
          </div>
        </div>
      </div>
    </button>
  </div>
</template>
