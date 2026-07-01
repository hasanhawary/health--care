<script setup>
import { ref } from 'vue'
import {
  Phone,
  Navigation,
  Copy,
  Check,
  Share2,
  Heart,
  Stethoscope,
  Activity,
  MapPin,
  Network,
  Building2,
  ChevronDown,
  MapPinned,
} from 'lucide-vue-next'
import { useI18n } from '../composables/useI18n'
import { useFavorites } from '../composables/useFavorites'
import { highlightHtml } from '../utils/normalizeText'
import { typeBadgeClass } from '../utils/badges'
import {
  buildMapsUrl,
  buildTelLink,
  buildAddressText,
  buildShareText,
} from '../utils/maps'

const props = defineProps({
  group: { type: Object, required: true },
  query: { type: String, default: '' },
})
const emit = defineEmits(['open'])

const { t, field } = useI18n()
const { isFavorite, toggleFavorite } = useFavorites()

const expanded = ref(false)
const copied = ref(false)
const shared = ref(false)

function hl(v) {
  return highlightHtml(v, props.query || '')
}
const main = () => props.group.main
const fav = () => isFavorite(main().id)

async function copyAddress() {
  try {
    await navigator.clipboard.writeText(buildAddressText(main()))
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  } catch (e) {}
}
async function share() {
  const text = buildShareText(main())
  const url = buildMapsUrl(main())
  if (navigator.share) {
    try {
      await navigator.share({ title: props.group.name, text, url })
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
      <button class="min-w-0 flex-1 text-start" @click="emit('open', main())">
        <h3
          class="line-clamp-2 text-base font-bold leading-snug text-slate-800 transition group-hover:text-brand-700 dark:text-slate-100 dark:group-hover:text-brand-300"
          v-html="hl(group.name)"
        ></h3>
        <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span class="badge" :class="typeBadgeClass(group.typeKey)">{{ field(main(), 'providerTypeAr', 'providerType') }}</span>
          <span
            class="badge"
            :class="group.live
              ? 'bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'"
          >
            <span class="h-1.5 w-1.5 rounded-full" :class="group.live ? 'bg-green-500' : 'bg-slate-400'"></span>
            {{ group.live ? t('live') : t('notLive') }}
          </span>
          <span class="badge bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
            <Building2 class="h-3 w-3" />
            {{ group.count }} {{ t('locations') }}
          </span>
        </div>
      </button>
      <button
        class="icon-btn shrink-0"
        :class="fav() ? 'text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950' : ''"
        :title="fav() ? t('removeFromFavorites') : t('addToFavorites')"
        @click="toggleFavorite(main())"
      >
        <Heart class="h-5 w-5" :class="fav() ? 'fill-current' : ''" />
      </button>
    </div>

    <!-- main branch summary -->
    <div class="mt-3 space-y-1.5 text-sm">
      <div v-if="field(main(), 'specialtyAr', 'specialty')" class="flex items-start gap-2">
        <Stethoscope class="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
        <span class="text-slate-600 dark:text-slate-300" v-html="hl(field(main(), 'specialtyAr', 'specialty'))"></span>
      </div>
      <div v-if="field(main(), 'servicesAr', 'services')" class="flex items-start gap-2">
        <Activity class="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
        <span class="text-slate-600 dark:text-slate-300" v-html="hl(field(main(), 'servicesAr', 'services'))"></span>
      </div>
      <div class="flex items-start gap-2">
        <MapPin class="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
        <div class="min-w-0 break-words">
          <div class="font-medium text-slate-700 dark:text-slate-200">
            <span v-html="hl(field(main(), 'governorateAr', 'governorate'))"></span>
            <span v-if="field(main(), 'areaAr', 'area')"> · <span v-html="hl(field(main(), 'areaAr', 'area'))"></span></span>
          </div>
          <div v-if="field(main(), 'addressAr', 'address')" class="line-clamp-2 text-slate-500 dark:text-slate-400" v-html="hl(field(main(), 'addressAr', 'address'))"></div>
        </div>
      </div>
    </div>

    <!-- main actions -->
    <div class="mt-auto pt-4">
      <div class="flex flex-wrap items-center gap-2">
        <a v-if="main().phone" :href="buildTelLink(main().phone)" class="btn-primary min-w-0 max-w-full !px-3 !py-2 text-xs" :title="t('call')">
          <Phone class="h-4 w-4" /><span class="truncate" dir="ltr">{{ main().phone }}</span>
        </a>
        <a :href="buildMapsUrl(main())" target="_blank" rel="noopener" class="icon-btn border border-slate-200 text-brand-600 dark:border-slate-700" :title="t('openMaps')">
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
          v-if="group.count > 1"
          class="ms-auto inline-flex shrink-0 items-center gap-1 rounded-lg bg-brand-50 px-2.5 py-1.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-100 dark:bg-brand-950 dark:text-brand-300 dark:hover:bg-brand-900"
          @click="expanded = !expanded"
        >
          {{ expanded ? t('hideBranches') : t('showBranches') }}
          <span class="opacity-70">({{ group.count }})</span>
          <ChevronDown class="h-4 w-4 transition" :class="expanded ? 'rotate-180' : ''" />
        </button>
      </div>
    </div>

    <!-- branches list -->
    <Transition name="expand">
      <div v-if="expanded && group.count > 1" class="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
        <div class="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase text-slate-400">
          <MapPinned class="h-3.5 w-3.5" />{{ t('branches') }} ({{ group.count }})
        </div>
        <ul class="max-h-80 space-y-1.5 overflow-y-auto scrollbar-thin pe-1">
          <li v-for="b in group.items" :key="b.id">
            <button
              class="flex w-full items-start gap-2 rounded-xl border p-2.5 text-start text-xs transition hover:border-brand-300 hover:bg-brand-50/50 dark:border-slate-800 dark:hover:border-brand-700 dark:hover:bg-slate-800/40"
              :class="b === group.main ? 'border-brand-200 bg-brand-50/40 dark:border-brand-900 dark:bg-brand-950/30' : 'border-slate-100 dark:border-slate-800'"
              @click="emit('open', b)"
            >
              <span
                class="badge mt-0.5 shrink-0"
                :class="b === group.main
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'"
              >
                {{ b === group.main ? t('mainBranchLabel') : t('branch') }}
              </span>
                <span class="min-w-0 flex-1 break-words">
                <span class="block font-medium text-slate-700 dark:text-slate-200">
                  {{ field(b, 'governorateAr', 'governorate') }}<span v-if="field(b, 'areaAr', 'area')"> · {{ field(b, 'areaAr', 'area') }}</span>
                </span>
                <span v-if="field(b, 'addressAr', 'address')" class="block truncate text-slate-500 dark:text-slate-400">{{ field(b, 'addressAr', 'address') }}</span>
                <span v-if="b.phone" class="mt-0.5 inline-flex max-w-full items-center gap-1 text-brand-600 dark:text-brand-400" dir="ltr">
                  <Phone class="h-3 w-3 shrink-0" /><span class="truncate">{{ b.phone }}</span>
                </span>
              </span>
              <a
                :href="buildMapsUrl(b)"
                target="_blank"
                rel="noopener"
                class="icon-btn h-7 w-7 shrink-0"
                :title="t('openMaps')"
                @click.stop
              >
                <Navigation class="h-3.5 w-3.5" />
              </a>
            </button>
          </li>
        </ul>
      </div>
    </Transition>
  </article>
</template>

<style scoped>
.expand-enter-active,
.expand-leave-active {
  transition: opacity 0.2s ease, max-height 0.25s ease;
  overflow: hidden;
}
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}
.expand-enter-to,
.expand-leave-from {
  max-height: 500px;
}
</style>
