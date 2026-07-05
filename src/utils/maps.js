// Google Maps URL builders + share helpers.

import { cleanCell } from './normalizeText'

/**
 * Build a Google Maps search URL from a provider. Prefers English fields for
 * better geocoding, falls back to Arabic ones.
 */
export function buildMapsUrl(provider) {
  const parts = [
    provider.name,
    provider.address || provider.addressAr,
    provider.area || provider.areaAr,
    provider.governorate || provider.governorateAr,
    'Egypt',
  ]
    .filter(Boolean)
    .map(cleanCell)
  const q = parts.join(', ')
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
}

/** Build a maps directions URL from the user's location to the provider. */
export function buildDirectionsUrl(provider, origin) {
  const dest = [
    provider.name,
    provider.address || provider.addressAr,
    provider.area || provider.areaAr,
    provider.governorate || provider.governorateAr,
  ]
    .filter(Boolean)
    .map(cleanCell)
    .join(', ')
  const base = 'https://www.google.com/maps/dir/'
  const originPart = origin ? `${origin.lat},${origin.lon}` : ''
  return `${base}${encodeURIComponent(originPart)}/${encodeURIComponent(dest)}`
}

/** Pick the locale-appropriate field from a provider. */
function locField(provider, arKey, enKey, locale) {
  if (locale === 'en') return provider[enKey] || provider[arKey] || ''
  return provider[arKey] || provider[enKey] || ''
}

/** Plain-text address for copy/share. */
export function buildAddressText(provider, locale = 'ar') {
  const sep = locale === 'en' ? ', ' : '، '
  return [
    provider.name,
    locField(provider, 'addressAr', 'address', locale),
    locField(provider, 'areaAr', 'area', locale),
    locField(provider, 'governorateAr', 'governorate', locale),
  ]
    .filter(Boolean)
    .map(cleanCell)
    .join(sep)
}

/** tel: link digits only. */
export function buildTelLink(phone) {
  if (!phone) return ''
  const digits = String(phone).replace(/[^\d+]/g, '')
  return `tel:${digits}`
}

/**
 * Parse a raw phone string (possibly containing multiple numbers separated by
 * common delimiters) into a deduplicated array of cleaned number strings.
 *
 * Supported separators: / - , | newline and multiple consecutive spaces.
 * Numbers that have fewer than 4 digits after stripping non-numeric chars are
 * considered invalid and are dropped.
 *
 * @param {string|number|null|undefined} raw
 * @returns {string[]} Array of clean, unique phone number strings.
 */
export function parsePhoneNumbers(raw) {
  if (!raw) return []
  const parts = String(raw)
    .split(/[/\-,|،\n\r]+|\s{2,}/)
    .map((s) => s.trim())
    .filter(Boolean)

  const seen = new Set()
  const result = []
  for (const part of parts) {
    // Keep digits and leading + for international format
    const digits = part.replace(/[^\d+]/g, '')
    if (digits.replace(/\D/g, '').length < 4) continue // too short → skip
    if (seen.has(digits)) continue
    seen.add(digits)
    result.push(part.trim())
  }
  return result
}

/** Build a shareable text payload for a provider. */
export function buildShareText(provider, locale = 'ar') {
  const sep = locale === 'en' ? ', ' : '، '
  const lines = [provider.name]
  const type = locField(provider, 'providerTypeAr', 'providerType', locale)
  if (type) lines.push(type)
  const addr = buildAddressText(provider, locale).split(sep).slice(1).join(sep)
  if (addr) lines.push(addr)
  if (provider.phone) lines.push(`☎ ${provider.phone}`)
  return lines.join('\n')
}
