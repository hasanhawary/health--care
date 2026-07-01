<script setup>
import { ref } from 'vue'
import {
  Phone,
  Mail,
  MapPin,
  Navigation,
  Copy,
  Check,
  Share2,
  Heart,
  Stethoscope,
  Activity,
  Network,
  Building2,
  ChevronLeft,
} from 'lucide-vue-next'
import { useI18n } from '../composables/useI18n'
import { useFavorites } from '../composables/useFavorites'
import { useProviderFilters } from '../composables/useProviderFilters'
import { highlightHtml } from '../utils/normalizeText'
import { typeBadgeClass } from '../utils/badges'
import {
  buildMapsUrl,
  buildTelLink,
  buildAddressText,
  buildShareText,
} from '../utils/maps'
import { formatDistance } from '../utils/distance'

const props = defineProps({
  provider: { type: Object, required: true },
  query: { type: String, default: '' },
})
const emit = defineEmits(['open'])

const { t, field } = useI18n()
const { isFavorite, toggleFavorite } = useFavorites()
const { distOf } = useProviderFilters()

const copied = ref(false)
const shared = ref(false)

const q = () => props.query || ''

function hl(value) {
  return highlightHtml(value, q())
}

const providerType = () => field(props.provider, 'providerTypeAr', 'providerType')
const specialty = () => field(props.provider, 'specialtyAr', 'specialty')
const services = () => field(props.provider, 'servicesAr', 'services')
const address = () => field(props.provider, 'addressAr', 'address')
const area = () => field(props.provider, 'areaAr', 'area')
const governorate = () => field(props.provider, 'governorateAr', 'governorate')

const fav = () => isFavorite(props.provider.id)

function onFav() {
  toggleFavorite(props.provider)
}

async function copyAddress() {
  try {
    await navigator.clipboard.writeText(buildAddressText(props.provider))
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
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
      if (e && e.name === 'AbortError') return
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
  <article
    class="card group flex flex-col p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-card-hover sm:p-5"
  >
    <!-- header -->
    <div class="flex items-start justify-between gap-3">
      <button class="min-w-0 flex-1 text-start" @click="emit('open', provider)">
        <h3
          class="line-clamp-2 text-base font-bold leading-snug text-slate-800 transition group-hover:text-brand-700 dark:text-slate-100 dark:group-hover:text-brand-300"
          v-html="hl(provider.name)"
        ></h3>
        <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span class="badge" :class="typeBadgeClass(provider.typeKey)">{{ providerType() }}</span>
          <span
            class="badge"
            :class="
              provider.live
                ? 'bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
            "
          >
            <span
              class="h-1.5 w-1.5 rounded-full"
              :class="provider.live ? 'bg-green-500' : 'bg-slate-400'"
            ></span>
            {{ provider.live ? t('live') : t('notLive') }}
          </span>
        </div>
      </button>
      <button
        class="icon-btn shrink-0"
        :class="fav() ? 'text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950' : ''"
        :title="fav() ? t('removeFromFavorites') : t('addToFavorites')"
        @click="onFav"
      >
        <Heart class="h-5 w-5" :class="fav() ? 'fill-current' : ''" />
      </button>
    </div>

    <!-- meta -->
    <div class="mt-3 space-y-1.5 text-sm">
      <div v-if="specialty()" class="flex items-start gap-2">
        <Stethoscope class="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
        <span
          class="text-slate-600 dark:text-slate-300"
          v-html="hl(specialty())"
        ></span>
      </div>
      <div v-if="services()" class="flex items-start gap-2">
        <Activity class="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
        <span class="text-slate-600 dark:text-slate-300" v-html="hl(services())"></span>
      </div>
      <div class="flex items-start gap-2">
        <MapPin class="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
        <div class="min-w-0 break-words">
          <div class="flex flex-wrap items-center gap-1.5 font-medium text-slate-700 dark:text-slate-200">
            <span v-html="hl(governorate())"></span>
            <span v-if="area()"> · <span v-html="hl(area())"></span></span>
            <span v-if="distOf(provider) != null" class="badge bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300">📍 {{ formatDistance(distOf(provider)) }}</span>
          </div>
          <div
            v-if="address()"
            class="line-clamp-2 text-slate-500 dark:text-slate-400"
            v-html="hl(address())"
          ></div>
        </div>
      </div>
    </div>

    <!-- secondary badges -->
    <div class="mt-3 flex flex-wrap items-center gap-1.5">
      <span v-if="provider.mainBranch" class="badge bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        <Building2 class="h-3 w-3" />
        {{ provider.mainBranch }}
      </span>
      <span v-if="provider.networkType" class="badge bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        <Network class="h-3 w-3" />
        {{ provider.networkType }}
      </span>
    </div>

    <!-- actions -->
    <div class="mt-auto pt-4">
      <div class="flex flex-wrap items-center gap-2">
        <a
          v-if="provider.phone"
          :href="buildTelLink(provider.phone)"
          class="btn-primary min-w-0 max-w-full !px-3 !py-2 text-xs"
          :title="t('call')"
        >
          <Phone class="h-4 w-4" />
          <span class="truncate" dir="ltr">{{ provider.phone }}</span>
        </a>
        <a
          v-if="provider.email"
          :href="`mailto:${provider.email}`"
          class="icon-btn border border-slate-200 dark:border-slate-700"
          :title="t('email')"
        >
          <Mail class="h-4 w-4" />
        </a>
        <a
          :href="buildMapsUrl(provider)"
          target="_blank"
          rel="noopener"
          class="icon-btn border border-slate-200 text-brand-600 dark:border-slate-700"
          :title="t('openMaps')"
        >
          <Navigation class="h-4 w-4" />
        </a>
        <button class="icon-btn border border-slate-200 dark:border-slate-700" :title="t('copyAddress')" @click="copyAddress">
          <Check v-if="copied" class="h-4 w-4 text-green-600" />
          <Copy v-else class="h-4 w-4" />
        </button>
        <button class="icon-btn border border-slate-200 dark:border-slate-700" :title="t('share')" @click="share">
          <Check v-if="shared" class="h-4 w-4 text-green-600" />
          <Share2 v-else class="h-4 w-4" />
        </button>
        <button
          class="ms-auto inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
          @click="emit('open', provider)"
        >
          {{ t('details') }}
          <ChevronLeft class="h-4 w-4 rtl:rotate-180" />
        </button>
      </div>
    </div>
  </article>
</template>
