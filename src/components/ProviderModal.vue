<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import {
  X, Phone, Mail, MapPin, Navigation, Copy, Check, Share2, Heart,
  Stethoscope, Activity, Network, Building2, KeyRound, Hash, Info,
  Footprints, Car, ArrowLeft, Users, Compass,
} from 'lucide-vue-next'
import { useI18n } from '../composables/useI18n'
import { useFavorites } from '../composables/useFavorites'
import { useExcelProviders } from '../composables/useExcelProviders'
import { useGeolocation } from '../composables/useGeolocation'
import { typeBadgeClass } from '../utils/badges'
import { buildMapsUrl, buildTelLink, buildAddressText, buildShareText } from '../utils/maps'
import { getGeo } from '../utils/geoCache'
import { haversineKm, formatDistance } from '../utils/distance'
import { cleanCell } from '../utils/normalizeText'

const props = defineProps({
  provider: { type: Object, default: null },
})
const emit = defineEmits(['close', 'navigate'])

const { t, field } = useI18n()
const { isFavorite, toggleFavorite } = useFavorites()
const { providers } = useExcelProviders()
const { coords: userCoords } = useGeolocation()

const copied = ref(false)
const copiedPhone = ref(false)
const shared = ref(false)
const dialogRef = ref(null)
let lastFocused = null
let wasOpen = false

function onKey(e) {
  if (e.key === 'Escape') emit('close')
}
function restoreFocus() {
  if (lastFocused && typeof lastFocused.focus === 'function') {
    lastFocused.focus()
    lastFocused = null
  }
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
  restoreFocus()
})

watch(
  () => props.provider,
  (p) => {
    document.body.style.overflow = p ? 'hidden' : ''
    copied.value = copiedPhone.value = shared.value = false
    if (p && !wasOpen) {
      // opening from closed: remember what had focus
      lastFocused = document.activeElement
    } else if (!p && wasOpen) {
      // closing: return focus to the opener (after the leave transition)
      nextTick(() => restoreFocus())
    }
    wasOpen = !!p
    if (p) {
      nextTick(() => {
        const closeBtn = dialogRef.value?.querySelector('[data-close]')
        if (closeBtn) closeBtn.focus()
      })
    }
  }
)

function siblings(p) {
  if (!p) return []
  const k = p.providerKey || p.externalRef || p.tatshName
  if (!k) return []
  return providers.value.filter((x) => x !== p && (x.providerKey === k || x.externalRef === k || x.tatshName === k))
}
const branches = computed(() => siblings(props.provider))

const similar = computed(() => {
  const p = props.provider
  if (!p) return []
  const sibKeys = new Set(branches.value.map((b) => b.id))
  return providers.value
    .filter(
      (x) =>
        x.id !== p.id &&
        !sibKeys.has(x.id) &&
        x.typeKey === p.typeKey &&
        (x.specialtyKey === p.specialtyKey || x.govKey === p.govKey)
    )
    .slice(0, 6)
})

const nearby = computed(() => {
  const p = props.provider
  if (!p) return []
  const sibKeys = new Set(branches.value.map((b) => b.id))
  return providers.value
    .filter((x) => x.id !== p.id && !sibKeys.has(x.id) && x.govKey && x.govKey === p.govKey && x.typeKey !== p.typeKey)
    .slice(0, 6)
})

const providerGeo = computed(() => (props.provider ? getGeo(props.provider) : null))
const distanceKm = computed(() => {
  const uc = userCoords.value
  const g = providerGeo.value
  if (!uc || !g) return null
  return haversineKm(uc.lat, uc.lon, g.lat, g.lon)
})
function travelMin(km, mode) {
  if (km == null) return null
  const speed = mode === 'walking' ? 5 : 40
  return Math.max(1, Math.round((km / speed) * 60))
}
function dirUrl(mode) {
  const p = props.provider
  const uc = userCoords.value
  const dest = [p.name, p.address || p.addressAr, p.area || p.areaAr, p.governorate || p.governorateAr]
    .filter(Boolean).map(cleanCell).join(', ')
  const params = new URLSearchParams({
    api: '1',
    destination: dest,
    travelmode: mode,
  })
  if (uc) params.set('origin', `${uc.lat},${uc.lon}`)
  return `https://www.google.com/maps/dir/?${params.toString()}`
}

async function copyAddress() {
  try {
    await navigator.clipboard.writeText(buildAddressText(props.provider))
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  } catch (e) {}
}
async function copyPhone() {
  if (!props.provider.phone) return
  try {
    await navigator.clipboard.writeText(props.provider.phone)
    copiedPhone.value = true
    setTimeout(() => (copiedPhone.value = false), 1500)
  } catch (e) {}
}
async function share() {
  const text = buildShareText(props.provider)
  const url = buildMapsUrl(props.provider)
  if (navigator.share) {
    try {
      await navigator.share({ title: props.provider.name, text, url })
      return
    } catch (e) {
      if (e && e.name === 'AbortError') return // user dismissed the share sheet
    }
  }
  try {
    await navigator.clipboard.writeText(`${text}\n${url}`)
    shared.value = true
    setTimeout(() => (shared.value = false), 1500)
  } catch (e) {}
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="provider" class="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
        <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="emit('close')"></div>
        <div ref="dialogRef" role="dialog" aria-modal="true" class="relative flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900 sm:rounded-3xl">
          <!-- header -->
          <div class="relative shrink-0 overflow-hidden bg-gradient-to-br from-brand-600 to-brand-800 p-5 text-white">
            <div class="absolute -end-8 -top-8 h-32 w-32 rounded-full bg-white/10"></div>
            <div class="absolute -start-10 -bottom-12 h-32 w-32 rounded-full bg-white/10"></div>
            <button data-close class="absolute end-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25" aria-label="close" @click="emit('close')">
              <X class="h-5 w-5" />
            </button>
            <div class="relative">
              <h2 class="pe-10 text-xl font-extrabold leading-snug">{{ provider.name }}</h2>
              <div class="mt-2 flex flex-wrap items-center gap-1.5">
                <span class="badge bg-white/20 text-white">{{ field(provider, 'providerTypeAr', 'providerType') }}</span>
                <span class="badge" :class="provider.live ? 'bg-green-400/20 text-green-100' : 'bg-white/15 text-white/80'">
                  <span class="h-1.5 w-1.5 rounded-full" :class="provider.live ? 'bg-green-300' : 'bg-white/70'"></span>
                  {{ provider.live ? t('live') : t('notLive') }}
                </span>
                <span v-if="provider.mainBranch" class="badge bg-white/15 text-white/90"><Building2 class="h-3 w-3" />{{ provider.mainBranch }}</span>
                <span v-if="provider.networkType" class="badge bg-white/15 text-white/90"><Network class="h-3 w-3" />{{ provider.networkType }}</span>
                <span v-if="branches.length" class="badge bg-white/15 text-white/90"><Users class="h-3 w-3" />{{ branches.length + 1 }} {{ t('locations') }}</span>
              </div>
            </div>
          </div>

          <!-- body -->
          <div class="scrollbar-thin flex-1 overflow-y-auto p-5">
            <!-- quick actions -->
            <div class="mb-4 flex flex-wrap gap-2">
              <a v-if="provider.phone" :href="buildTelLink(provider.phone)" class="btn-primary !py-2 text-xs"><Phone class="h-4 w-4" />{{ t('call') }}</a>
              <button v-if="provider.phone" class="btn-outline !py-2 text-xs" @click="copyPhone">
                <Check v-if="copiedPhone" class="h-4 w-4 text-green-600" /><Copy v-else class="h-4 w-4" />{{ copiedPhone ? t('copied') : t('copyPhone') }}
              </button>
              <a v-if="provider.email" :href="`mailto:${provider.email}`" class="btn-outline !py-2 text-xs"><Mail class="h-4 w-4" />{{ t('email') }}</a>
              <button class="btn-outline !py-2 text-xs" @click="copyAddress">
                <Check v-if="copied" class="h-4 w-4 text-green-600" /><Copy v-else class="h-4 w-4" />{{ copied ? t('copied') : t('copyAddress') }}
              </button>
              <button class="btn-outline !py-2 text-xs" @click="share">
                <Check v-if="shared" class="h-4 w-4 text-green-600" /><Share2 v-else class="h-4 w-4" />{{ t('share') }}
              </button>
              <button class="btn ms-auto !py-2 text-xs" :class="isFavorite(provider.id) ? 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300' : 'btn-outline'" @click="toggleFavorite(provider)">
                <Heart class="h-4 w-4" :class="isFavorite(provider.id) ? 'fill-current' : ''" />
              </button>
            </div>

            <!-- info grid -->
            <div class="grid gap-4 sm:grid-cols-2">
              <div v-if="field(provider, 'specialtyAr', 'specialty')" class="flex items-start gap-2.5">
                <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300"><Stethoscope class="h-4 w-4" /></div>
                <div class="min-w-0"><div class="text-xs text-slate-400">{{ t('specialty') }}</div><div class="font-medium text-slate-700 dark:text-slate-200">{{ field(provider, 'specialtyAr', 'specialty') }}</div></div>
              </div>
              <div v-if="field(provider, 'servicesAr', 'services')" class="flex items-start gap-2.5">
                <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300"><Activity class="h-4 w-4" /></div>
                <div class="min-w-0"><div class="text-xs text-slate-400">{{ t('services') }}</div><div class="font-medium text-slate-700 dark:text-slate-200">{{ field(provider, 'servicesAr', 'services') }}</div></div>
              </div>
              <div v-if="provider.phone" class="flex items-start gap-2.5">
                <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-300"><Phone class="h-4 w-4" /></div>
                <div class="min-w-0"><div class="text-xs text-slate-400">{{ t('phone') }}</div><a :href="buildTelLink(provider.phone)" class="font-medium text-brand-600 hover:underline dark:text-brand-400" dir="ltr">{{ provider.phone }}</a></div>
              </div>
              <div v-if="provider.email" class="flex items-start gap-2.5">
                <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300"><Mail class="h-4 w-4" /></div>
                <div class="min-w-0"><div class="text-xs text-slate-400">{{ t('email') }}</div><a :href="`mailto:${provider.email}`" class="break-all font-medium text-brand-600 hover:underline dark:text-brand-400" dir="ltr">{{ provider.email }}</a></div>
              </div>
            </div>

            <!-- address + distance -->
            <div class="mt-4 flex items-start gap-2.5">
              <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-300"><MapPin class="h-4 w-4" /></div>
              <div class="min-w-0 flex-1">
                <div class="text-xs text-slate-400">{{ t('address') }}</div>
                <div class="font-medium text-slate-700 dark:text-slate-200">
                  <span>{{ field(provider, 'governorateAr', 'governorate') }}</span>
                  <span v-if="field(provider, 'areaAr', 'area')"> · {{ field(provider, 'areaAr', 'area') }}</span>
                </div>
                <div v-if="field(provider, 'addressAr', 'address')" class="text-slate-500 dark:text-slate-400">{{ field(provider, 'addressAr', 'address') }}</div>
                <!-- distance + travel -->
                <div v-if="distanceKm != null" class="mt-2 flex flex-wrap items-center gap-2">
                  <span class="badge bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300"><Compass class="h-3 w-3" />{{ formatDistance(distanceKm) }}</span>
                  <a :href="dirUrl('walking')" target="_blank" rel="noopener" class="badge bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300">
                    <Footprints class="h-3 w-3" />{{ travelMin(distanceKm, 'walking') }} {{ t('minutes') }}
                  </a>
                  <a :href="dirUrl('driving')" target="_blank" rel="noopener" class="badge bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300">
                    <Car class="h-3 w-3" />{{ travelMin(distanceKm, 'driving') }} {{ t('minutes') }}
                  </a>
                </div>
              </div>
            </div>

            <!-- codes -->
            <div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div v-if="provider.providerKey" class="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50"><div class="flex items-center gap-1 text-xs text-slate-400"><KeyRound class="h-3 w-3" />{{ t('providerKey') }}</div><div class="mt-1 truncate font-mono text-sm text-slate-700 dark:text-slate-200" dir="ltr">{{ provider.providerKey }}</div></div>
              <div v-if="provider.externalRef" class="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50"><div class="flex items-center gap-1 text-xs text-slate-400"><Hash class="h-3 w-3" />{{ t('externalRef') }}</div><div class="mt-1 truncate font-mono text-sm text-slate-700 dark:text-slate-200" dir="ltr">{{ provider.externalRef }}</div></div>
              <div v-if="provider.networkType" class="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50"><div class="flex items-center gap-1 text-xs text-slate-400"><Network class="h-3 w-3" />{{ t('networkType') }}</div><div class="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">{{ provider.networkType }}</div></div>
              <div v-if="provider.mainBranch" class="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50"><div class="flex items-center gap-1 text-xs text-slate-400"><Building2 class="h-3 w-3" />{{ t('mainBranch') }}</div><div class="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">{{ provider.mainBranch }}</div></div>
            </div>

            <!-- branches -->
            <div v-if="branches.length" class="mt-5">
              <h3 class="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase text-slate-400"><Users class="h-3.5 w-3.5" />{{ t('branchInfo') }} ({{ branches.length + 1 }})</h3>
              <div class="space-y-1.5">
                <button v-for="b in branches" :key="b.id" class="flex w-full items-center gap-2 rounded-xl border border-slate-100 p-2.5 text-start text-xs transition hover:border-brand-300 hover:bg-brand-50/50 dark:border-slate-800 dark:hover:bg-slate-800/40" @click="emit('navigate', b)">
                  <span class="badge bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">{{ t('branch') }}</span>
                  <span class="min-w-0 flex-1">
                    <span class="block font-medium text-slate-700 dark:text-slate-200">{{ field(b, 'governorateAr', 'governorate') }}<span v-if="field(b, 'areaAr', 'area')"> · {{ field(b, 'areaAr', 'area') }}</span></span>
                    <span v-if="b.phone" class="text-brand-600 dark:text-brand-400" dir="ltr">{{ b.phone }}</span>
                  </span>
                  <ArrowLeft class="h-4 w-4 text-slate-400 rtl:rotate-180" />
                </button>
              </div>
            </div>

            <!-- similar -->
            <div v-if="similar.length" class="mt-5">
              <h3 class="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase text-slate-400"><Stethoscope class="h-3.5 w-3.5" />{{ t('similarProviders') }}</h3>
              <div class="flex flex-wrap gap-1.5">
                <button v-for="s in similar" :key="s.id" class="chip text-xs" @click="emit('navigate', s)">{{ s.name }} · {{ field(s, 'governorateAr', 'governorate') }}</button>
              </div>
            </div>

            <!-- nearby -->
            <div v-if="nearby.length" class="mt-5">
              <h3 class="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase text-slate-400"><MapPin class="h-3.5 w-3.5" />{{ t('nearbyProviders') }}</h3>
              <div class="flex flex-wrap gap-1.5">
                <button v-for="n in nearby" :key="n.id" class="chip text-xs" @click="emit('navigate', n)">{{ n.name }} · {{ field(n, 'providerTypeAr', 'providerType') }}</button>
              </div>
            </div>

            <!-- location notice -->
            <div class="mt-5 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
              <Info class="mt-0.5 h-4 w-4 shrink-0" />
              <span>{{ t('locationNotice') }}</span>
            </div>
          </div>

          <!-- footer -->
          <div class="safe-bottom shrink-0 border-t border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/80">
            <div class="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
              <a :href="buildMapsUrl(provider)" target="_blank" rel="noopener" class="btn-primary flex-1 sm:flex-none"><Navigation class="h-4 w-4" />{{ t('openMaps') }}</a>
              <a v-if="provider.phone" :href="buildTelLink(provider.phone)" class="btn-outline"><Phone class="h-4 w-4" />{{ t('call') }}</a>
              <a :href="dirUrl('driving')" target="_blank" rel="noopener" class="btn-outline"><Navigation class="h-4 w-4" />{{ t('directions') }}</a>
              <button class="btn" :class="isFavorite(provider.id) ? 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300' : 'btn-outline'" @click="toggleFavorite(provider)">
                <Heart class="h-4 w-4" :class="isFavorite(provider.id) ? 'fill-current' : ''" />
                {{ isFavorite(provider.id) ? t('removeFromFavorites') : t('addToFavorites') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-active > div:last-child,
.modal-leave-active > div:last-child {
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from > div:last-child {
  transform: translateY(24px) scale(0.98);
}
.modal-leave-to > div:last-child {
  transform: translateY(12px) scale(0.98);
}
</style>
