<script setup>
import { Phone, Navigation, Eye, Heart, X, MapPin, Compass } from 'lucide-vue-next'
import { useI18n } from '../composables/useI18n'
import { useGeolocation } from '../composables/useGeolocation'
import { typeBadgeClass } from '../utils/badges'
import { buildTelLink } from '../utils/maps'
import { directionsUrl } from '../utils/directions'
import { formatDistance } from '../utils/distance'

const props = defineProps({
  provider: { type: Object, default: null },
  distance: { type: Number, default: null },
  isFav: { type: Boolean, default: false },
})
const emit = defineEmits(['details', 'favorite', 'close'])
const { t, field } = useI18n()
const { coords: userCoords } = useGeolocation()
</script>

<template>
  <Transition name="drawer-up">
    <div v-if="provider" class="safe-bottom absolute inset-x-0 bottom-0 z-[700] mx-auto max-w-md p-2">
      <div class="card overflow-hidden p-4 shadow-2xl">
        <div class="flex items-start justify-between gap-2">
          <button class="min-w-0 flex-1 text-start" @click="emit('details')">
            <h3 class="truncate text-base font-extrabold text-slate-800 dark:text-slate-100">{{ provider.name }}</h3>
            <div class="mt-1 flex flex-wrap items-center gap-1.5">
              <span class="badge" :class="typeBadgeClass(provider.typeKey)">{{ field(provider, 'providerTypeAr', 'providerType') }}</span>
              <span class="badge" :class="provider.live ? 'bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'">
                {{ provider.live ? t('live') : t('notLive') }}
              </span>
              <span v-if="distance != null" class="badge bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                <Compass class="h-3 w-3" />{{ formatDistance(distance) }}
              </span>
            </div>
          </button>
          <button class="icon-btn -mt-1 -me-1" @click="emit('close')"><X class="h-5 w-5" /></button>
        </div>

        <div class="mt-2 flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <MapPin class="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" />
          <span class="line-clamp-2">
            {{ field(provider, 'governorateAr', 'governorate') }}<span v-if="field(provider, 'areaAr', 'area')"> · {{ field(provider, 'areaAr', 'area') }}</span>
            <span v-if="field(provider, 'addressAr', 'address')"> — {{ field(provider, 'addressAr', 'address') }}</span>
          </span>
        </div>

        <div class="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <a v-if="provider.phone" :href="buildTelLink(provider.phone)" class="btn-primary !py-2 text-xs"><Phone class="h-4 w-4" />{{ t('call') }}</a>
          <a :href="directionsUrl(provider, userCoords.value)" target="_blank" rel="noopener" class="btn-outline !py-2 text-xs"><Navigation class="h-4 w-4" />{{ t('directions') }}</a>
          <button class="btn-outline !py-2 text-xs" @click="emit('details')"><Eye class="h-4 w-4" />{{ t('details') }}</button>
          <button class="btn !py-2 text-xs" :class="isFav ? 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300' : 'btn-outline'" @click="emit('favorite')">
            <Heart class="h-4 w-4" :class="isFav ? 'fill-current' : ''" />
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.drawer-up-enter-active,
.drawer-up-leave-active {
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;
}
.drawer-up-enter-from,
.drawer-up-leave-to {
  transform: translateY(120%);
  opacity: 0;
}
</style>
