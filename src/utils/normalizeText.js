// Text normalization helpers (Arabic + general) and match highlighting.

const TASHKEEL = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED\u08D3-\u08E1\u08E3-\u08FF]/g
const TATWEEL = /\u0640/g

/**
 * Normalize text for Arabic-insensitive matching:
 *  - remove tashkeel + tatweel
 *  - أ إ آ -> ا
 *  - ة -> ه
 *  - ى -> ي
 *  - lowercase + collapse whitespace
 */
export function normalizeArabic(text) {
  if (!text) return ''
  return String(text)
    .replace(TASHKEEL, '')
    .replace(TATWEEL, '')
    .replace(/[\u0623\u0625\u0627]/g, '\u0627') // أ إ آ -> ا
    .replace(/\u0629/g, '\u0647') // ة -> ه
    .replace(/\u0649/g, '\u064A') // ى -> ي
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** Trim + collapse all whitespace (incl. line breaks) to single spaces. */
export function cleanCell(value) {
  if (value === null || value === undefined) return ''
  return String(value).replace(/\s+/g, ' ').trim()
}

/** Stable key for grouping/filtering (language-agnostic). */
export function normalizeForKey(value) {
  return normalizeArabic(cleanCell(value))
}

/** Collapse multi-line content into a tidy single line for display. */
export function collapseLines(value) {
  if (!value) return ''
  return String(value)
    .replace(/\r\n?|\n/g, ' · ')
    .replace(/[ \t]+/g, ' ')
    .trim()
}

export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Character classes that get deleted during normalization.
const TASHKEEL_CHAR = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED\u08D3-\u08E1\u08E3-\u08FF]/
const ALEF = /[\u0623\u0625\u0627]/
const WHITESPACE = /\s/

/**
 * Build the normalized form of `text` together with an index map: for every
 * character in the normalized output, the index of the originating character in
 * the original text. This mirrors normalizeArabic() exactly.
 */
function buildNormalizedMap(text) {
  const str = String(text == null ? '' : text)
  let norm = ''
  const map = []
  let lastWasSpace = true // trimmed start
  for (let i = 0; i < str.length; i++) {
    const ch = str[i]
    if (TASHKEEL_CHAR.test(ch) || ch === '\u0640') continue
    if (ALEF.test(ch)) {
      norm += '\u0627'
      map.push(i)
      lastWasSpace = false
      continue
    }
    if (ch === '\u0629') {
      norm += '\u0647'
      map.push(i)
      lastWasSpace = false
      continue
    }
    if (ch === '\u0649') {
      norm += '\u064A'
      map.push(i)
      lastWasSpace = false
      continue
    }
    if (WHITESPACE.test(ch)) {
      if (lastWasSpace) continue
      norm += ' '
      map.push(i)
      lastWasSpace = true
      continue
    }
    norm += ch.toLowerCase()
    map.push(i)
    lastWasSpace = false
  }
  // trim trailing space
  if (norm.endsWith(' ')) {
    norm = norm.slice(0, -1)
    map.pop()
  }
  return { norm, map }
}

/**
 * Build an HTML string with <mark> wrapping every (normalized) occurrence of
 * the query inside the original text. The original text is HTML-escaped first.
 */
export function highlightHtml(text, query) {
  const str = String(text == null ? '' : text)
  const q = normalizeArabic(query)
  if (!q) return escapeHtml(str)
  const { norm, map } = buildNormalizedMap(str)
  if (!norm.includes(q)) return escapeHtml(str)

  let out = ''
  let i = 0
  while (i < norm.length) {
    if (norm.startsWith(q, i)) {
      const startOrig = map[i]
      const endOrig = map[i + q.length - 1] + 1
      out += `<mark>${escapeHtml(str.slice(startOrig, endOrig))}</mark>`
      i += q.length
    } else {
      const origIdx = map[i]
      // Consume original chars until the next mapped normalized char.
      const nextNormIdx = i + 1 < map.length ? map[i + 1] : str.length
      out += escapeHtml(str.slice(origIdx, nextNormIdx))
      i++
    }
  }
  // Append any trailing original chars that were stripped by normalization.
  const lastMapped = map.length ? map[map.length - 1] + 1 : 0
  if (lastMapped < str.length) out += escapeHtml(str.slice(lastMapped))
  return out
}
