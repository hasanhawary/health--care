// Fuzzy search powered by Fuse.js. Builds an index over normalized provider
// fields once, then offers ranked search + autocomplete suggestions.
import { ref, shallowRef } from 'vue'
import Fuse from 'fuse.js'
import { normalizeArabic } from '../utils/normalizeText'

const fuse = shallowRef(null)
const indexedCount = ref(0)

const KEYS = [
  { name: 'name', weight: 0.45 },
  { name: 'phone', weight: 0.25 },
  { name: 'providerKey', weight: 0.2 },
  { name: 'specialty', weight: 0.18 },
  { name: 'type', weight: 0.15 },
  { name: 'externalRef', weight: 0.15 },
  { name: 'tatsh', weight: 0.12 },
  { name: 'gov', weight: 0.1 },
  { name: 'area', weight: 0.1 },
  { name: 'address', weight: 0.08 },
  { name: 'services', weight: 0.06 },
]

function docFor(p) {
  return {
    name: p.nameKey,
    phone: normalizeArabic(p.phone),
    providerKey: normalizeArabic(p.providerKey),
    externalRef: normalizeArabic(p.externalRef),
    tatsh: normalizeArabic(p.tatshName),
    specialty: p.specialtyKey,
    type: p.typeKey,
    gov: p.govKey,
    area: p.areaKey,
    address: normalizeArabic(p.address || p.addressAr),
    services: p.servicesKey,
    _p: p,
  }
}

export function useSearch() {
  function buildIndex(list) {
    if (!list || !list.length) return
    fuse.value = new Fuse(
      list.map(docFor),
      {
        keys: KEYS,
        threshold: 0.4,
        ignoreLocation: true,
        minMatchCharLength: 2,
        useExtendSearch: true,
      }
    )
    indexedCount.value = list.length
  }

  function isReady() {
    return !!fuse.value
  }

  /** Ranked providers matching the (normalized) query, filtered by matchFn. */
  function searchRanked(q, matchFn, limit = 2000) {
    if (!fuse.value || !q) return null
    const res = fuse.value.search(q, { limit })
    const out = []
    for (const r of res) {
      const p = r.item._p
      if (!matchFn || matchFn(p)) out.push(p)
    }
    return out
  }

  /** Single Fuse search returning BOTH the matched-id Set and rank-ordered
   *  provider list, so queryMatchSet + best-match sort can share one traversal. */
  function searchBatch(q) {
    if (!fuse.value || !q) return null
    const res = fuse.value.search(q)
    const ids = new Set()
    const ranked = new Array(res.length)
    for (let i = 0; i < res.length; i++) {
      const p = res[i].item._p
      ids.add(p.id)
      ranked[i] = p
    }
    return { ids, ranked }
  }

  /** Autocomplete suggestions. */
  function suggest(q, limit = 8) {
    if (!fuse.value || !q) return []
    return fuse.value.search(q, { limit }).map((r) => r.item._p)
  }

  /** Set of provider ids matching the (normalized) query, for consistent counts. */
  function matchIds(q) {
    if (!fuse.value || !q) return null
    const out = new Set()
    for (const r of fuse.value.search(q)) out.add(r.item._p.id)
    return out
  }

  return { fuse, indexedCount, buildIndex, isReady, searchRanked, searchBatch, suggest, matchIds }
}
