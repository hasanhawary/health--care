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

/** Plain-text address for copy/share. */
export function buildAddressText(provider) {
  return [
    provider.name,
    provider.address || provider.addressAr,
    provider.area || provider.areaAr,
    provider.governorate || provider.governorateAr,
  ]
    .filter(Boolean)
    .map(cleanCell)
    .join('، ')
}

/** tel: link digits only. */
export function buildTelLink(phone) {
  if (!phone) return ''
  const digits = String(phone).replace(/[^\d+]/g, '')
  return `tel:${digits}`
}

/** Build a shareable text payload for a provider. */
export function buildShareText(provider) {
  const lines = [provider.name]
  const type = provider.providerType || provider.providerTypeAr
  if (type) lines.push(type)
  const addr = buildAddressText(provider).split('، ').slice(1).join('، ')
  if (addr) lines.push(addr)
  if (provider.phone) lines.push(`☎ ${provider.phone}`)
  return lines.join('\n')
}
