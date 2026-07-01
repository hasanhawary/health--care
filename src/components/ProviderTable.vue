<script setup>
import { ref } from 'vue'
import {
  Phone,
  Navigation,
  Heart,
  Eye,
  ChevronDown,
  Building2,
  MapPin,
} from 'lucide-vue-next'
import { useI18n } from '../composables/useI18n'
import { useFavorites } from '../composables/useFavorites'
import { useProviderFilters } from '../composables/useProviderFilters'
import { highlightHtml } from '../utils/normalizeText'
import { typeBadgeClass } from '../utils/badges'
import { buildMapsUrl, buildTelLink } from '../utils/maps'
import { formatDistance } from '../utils/distance'

const props = defineProps({
  items: { type: Array, default: () => [] },
  grouped: { type: Boolean, default: false },
  query: { type: String, default: '' },
})
const emit = defineEmits(['open'])

const { t, field } = useI18n()
const { isFavorite, toggleFavorite } = useFavorites()
const { distOf } = useProviderFilters()

function hl(v) {
  return highlightHtml(v, props.query || '')
}

const expanded = ref(new Set())
function toggle(key) {
  const s = new Set(expanded.value)
  if (s.has(key)) s.delete(key)
  else s.add(key)
  expanded.value = s
}
function isExpanded(key) {
  return expanded.value.has(key)
}
</script>

<template>
  <div class="card overflow-hidden">
    <div class="overflow-x-auto scrollbar-thin">
      <table class="w-full min-w-[860px] border-collapse text-start text-sm">
        <thead>
          <tr class="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
            <th class="px-4 py-3 text-start font-semibold">{{ t('providerName') }}</th>
            <th class="px-4 py-3 text-start font-semibold">{{ t('providerType') }}</th>
            <th class="px-4 py-3 text-start font-semibold">{{ t('specialty') }}</th>
            <th class="px-4 py-3 text-start font-semibold">{{ t('governorate') }}</th>
            <th class="px-4 py-3 text-start font-semibold">{{ t('area') }}</th>
            <th class="px-4 py-3 text-start font-semibold">{{ t('phone') }}</th>
            <th v-if="grouped" class="px-4 py-3 text-start font-semibold">{{ t('branches') }}</th>
            <th class="px-4 py-3 text-start font-semibold">{{ t('pulseStatus') }}</th>
            <th class="px-4 py-3 text-end font-semibold"></th>
          </tr>
        </thead>
        <tbody>
          <!-- grouped rows -->
          <template v-if="grouped">
            <template v-for="g in items" :key="g.key">
              <tr
                class="cursor-pointer border-b border-slate-100 transition hover:bg-brand-50/50 dark:border-slate-800/70 dark:hover:bg-slate-800/40"
                @click="g.count > 1 ? toggle(g.key) : emit('open', g.main)"
              >
                <td class="px-4 py-3 align-top">
                  <div class="flex items-center gap-2">
                    <button
                      class="shrink-0"
                      :class="isFavorite(g.main.id) ? 'text-rose-500' : 'text-slate-300 hover:text-rose-400'"
                      @click.stop="toggleFavorite(g.main)"
                    >
                      <Heart class="h-4 w-4" :class="isFavorite(g.main.id) ? 'fill-current' : ''" />
                    </button>
                    <ChevronDown
                      v-if="g.count > 1"
                      class="h-4 w-4 shrink-0 text-slate-400 transition"
                      :class="isExpanded(g.key) ? 'rotate-180' : ''"
                    />
                    <span class="font-semibold text-slate-800 dark:text-slate-100" v-html="hl(g.name)"></span>
                  </div>
                </td>
                <td class="px-4 py-3 align-top">
                  <span class="badge whitespace-nowrap" :class="typeBadgeClass(g.typeKey)">{{ field(g.main, 'providerTypeAr', 'providerType') }}</span>
                </td>
                <td class="px-4 py-3 align-top text-slate-600 dark:text-slate-300" v-html="hl(field(g.main, 'specialtyAr', 'specialty'))"></td>
                <td class="px-4 py-3 align-top text-slate-600 dark:text-slate-300" v-html="hl(field(g.main, 'governorateAr', 'governorate'))"></td>
                <td class="px-4 py-3 align-top text-slate-600 dark:text-slate-300" v-html="hl(field(g.main, 'areaAr', 'area'))"></td>
                <td class="px-4 py-3 align-top">
                  <a v-if="g.main.phone" :href="buildTelLink(g.main.phone)" class="inline-flex items-center gap-1 text-brand-600 hover:underline dark:text-brand-400" @click.stop>
                    <Phone class="h-3.5 w-3.5" />{{ g.main.phone }}
                  </a>
                </td>
                <td class="px-4 py-3 align-top">
                  <span class="badge bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                    <Building2 class="h-3 w-3" />{{ g.count }}
                  </span>
                </td>
                <td class="px-4 py-3 align-top">
                  <span class="badge whitespace-nowrap" :class="g.live ? 'bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'">
                    {{ g.live ? t('live') : t('notLive') }}
                  </span>
                </td>
                <td class="px-4 py-3 align-top">
                  <div class="flex items-center justify-end gap-1">
                    <a :href="buildMapsUrl(g.main)" target="_blank" rel="noopener" class="icon-btn h-8 w-8" :title="t('openMaps')" @click.stop>
                      <Navigation class="h-4 w-4" />
                    </a>
                    <button class="icon-btn h-8 w-8" :title="t('details')" @click.stop="emit('open', g.main)">
                      <Eye class="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
              <!-- branch sub-rows -->
              <template v-if="isExpanded(g.key)">
                <tr
                  v-for="b in g.items"
                  :key="b.id"
                  class="cursor-pointer border-b border-slate-50 bg-slate-50/60 text-xs transition hover:bg-brand-50/60 dark:border-slate-800/50 dark:bg-slate-800/20 dark:hover:bg-slate-800/40"
                  @click="emit('open', b)"
                >
                  <td class="px-4 py-2 align-top">
                    <span class="badge" :class="b === g.main ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'">
                      {{ b === g.main ? t('mainBranchLabel') : t('branch') }}
                    </span>
                  </td>
                  <td class="px-4 py-2 align-top text-slate-400">—</td>
                  <td class="px-4 py-2 align-top text-slate-500 dark:text-slate-400"></td>
                  <td class="px-4 py-2 align-top text-slate-600 dark:text-slate-300" v-html="hl(field(b, 'governorateAr', 'governorate'))"></td>
                  <td class="px-4 py-2 align-top text-slate-600 dark:text-slate-300" v-html="hl(field(b, 'areaAr', 'area'))"></td>
                  <td class="px-4 py-2 align-top">
                    <a v-if="b.phone" :href="buildTelLink(b.phone)" class="inline-flex items-center gap-1 text-brand-600 hover:underline dark:text-brand-400" @click.stop>
                      <Phone class="h-3 w-3" />{{ b.phone }}
                    </a>
                  </td>
                  <td class="px-4 py-2 align-top"></td>
                  <td class="px-4 py-2 align-top">
                    <span class="inline-flex items-center gap-1 text-slate-400">
                      <MapPin class="h-3 w-3" />{{ field(b, 'addressAr', 'address') ? '' : '' }}
                    </span>
                  </td>
                  <td class="px-4 py-2 align-top">
                    <div class="flex items-center justify-end gap-1">
                      <a :href="buildMapsUrl(b)" target="_blank" rel="noopener" class="icon-btn h-7 w-7" :title="t('openMaps')" @click.stop>
                        <Navigation class="h-3.5 w-3.5" />
                      </a>
                      <button class="icon-btn h-7 w-7" :title="t('details')" @click.stop="emit('open', b)">
                        <Eye class="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              </template>
            </template>
          </template>

          <!-- flat rows -->
          <template v-else>
            <tr
              v-for="p in items"
              :key="p.id"
              class="cursor-pointer border-b border-slate-100 transition hover:bg-brand-50/50 dark:border-slate-800/70 dark:hover:bg-slate-800/40"
              @click="emit('open', p)"
            >
              <td class="px-4 py-3 align-top">
                <div class="flex items-center gap-2">
                  <button
                    class="shrink-0"
                    :class="isFavorite(p.id) ? 'text-rose-500' : 'text-slate-300 hover:text-rose-400'"
                    @click.stop="toggleFavorite(p)"
                  >
                    <Heart class="h-4 w-4" :class="isFavorite(p.id) ? 'fill-current' : ''" />
                  </button>
                  <span class="font-semibold text-slate-800 dark:text-slate-100" v-html="hl(p.name)"></span>
                </div>
              </td>
              <td class="px-4 py-3 align-top">
                <span class="badge whitespace-nowrap" :class="typeBadgeClass(p.typeKey)">{{ field(p, 'providerTypeAr', 'providerType') }}</span>
              </td>
              <td class="px-4 py-3 align-top text-slate-600 dark:text-slate-300" v-html="hl(field(p, 'specialtyAr', 'specialty'))"></td>
              <td class="px-4 py-3 align-top">
                <span class="text-slate-600 dark:text-slate-300" v-html="hl(field(p, 'governorateAr', 'governorate'))"></span>
                <span v-if="distOf(p) != null" class="badge mt-1 bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300">📍 {{ formatDistance(distOf(p)) }}</span>
              </td>
              <td class="px-4 py-3 align-top text-slate-600 dark:text-slate-300" v-html="hl(field(p, 'areaAr', 'area'))"></td>
              <td class="px-4 py-3 align-top">
                <a v-if="p.phone" :href="buildTelLink(p.phone)" class="inline-flex items-center gap-1 text-brand-600 hover:underline dark:text-brand-400" @click.stop>
                  <Phone class="h-3.5 w-3.5" />{{ p.phone }}
                </a>
              </td>
              <td class="px-4 py-3 align-top">
                <span class="badge whitespace-nowrap" :class="p.live ? 'bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'">
                  {{ p.live ? t('live') : t('notLive') }}
                </span>
              </td>
              <td class="px-4 py-3 align-top">
                <div class="flex items-center justify-end gap-1">
                  <a :href="buildMapsUrl(p)" target="_blank" rel="noopener" class="icon-btn h-8 w-8" :title="t('openMaps')" @click.stop>
                    <Navigation class="h-4 w-4" />
                  </a>
                  <button class="icon-btn h-8 w-8" :title="t('details')" @click.stop="emit('open', p)">
                    <Eye class="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>
