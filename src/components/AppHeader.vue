<script setup>
import { HeartPulse, Languages, Sun, Moon, Heart, Download } from 'lucide-vue-next'
import { useI18n } from '../composables/useI18n'
import { useTheme } from '../composables/useTheme'

defineProps({
  favoritesCount: { type: Number, default: 0 },
  canInstall: { type: Boolean, default: false },
})
const emit = defineEmits(['open-favorites', 'install', 'home'])

const { t, locale, toggle: toggleLocale } = useI18n()
const { isDark, toggle: toggleTheme } = useTheme()
</script>

<template>
  <header
    class="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80"
  >
    <div class="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
      <!-- brand -->
      <button
        type="button"
        class="flex min-w-0 items-center gap-3 rounded-xl text-start transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
        :title="t('home')"
        :aria-label="t('home')"
        @click="emit('home')"
      >
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md"
        >
          <HeartPulse class="h-5 w-5" />
        </div>
        <div class="min-w-0">
          <h1 class="truncate text-sm font-extrabold leading-tight text-slate-800 dark:text-slate-100 sm:text-base">
            {{ t('appTitle') }}
          </h1>
          <p class="truncate text-xs text-slate-500 dark:text-slate-400">{{ t('appSubtitle') }}</p>
        </div>
      </button>

      <!-- actions -->
      <div class="flex items-center gap-1 sm:gap-2">
        <button
          v-if="canInstall"
          class="btn-soft !px-3 !py-2 text-xs font-bold"
          @click="emit('install')"
        >
          <Download class="h-4 w-4" /><span class="hidden sm:inline">{{ t('installApp') }}</span>
        </button>
        <button
          class="btn-ghost !px-2.5 !py-2 text-xs font-bold"
          :title="t('language')"
          @click="toggleLocale"
        >
          <Languages class="h-4 w-4" />
          <span class="hidden sm:inline">{{ t('language') }}</span>
        </button>
        <button
          class="icon-btn"
          :title="t('darkMode')"
          @click="toggleTheme"
        >
          <Sun v-if="isDark" class="h-5 w-5" />
          <Moon v-else class="h-5 w-5" />
        </button>
        <button
          class="relative btn-soft !px-2.5 !py-2"
          :title="t('favorites')"
          @click="emit('open-favorites')"
        >
          <Heart class="h-4 w-4" />
          <span class="hidden sm:inline">{{ t('favorites') }}</span>
          <span
            v-if="favoritesCount"
            class="absolute -end-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white"
          >{{ favoritesCount }}</span>
        </button>
      </div>
    </div>
  </header>
</template>
