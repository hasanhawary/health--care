// Google Maps directions URL builder.
import { cleanCell } from './normalizeText'

export function directionsUrl(provider, userCoords, mode = 'driving') {
  const dest = [
    provider.name,
    provider.address || provider.addressAr,
    provider.area || provider.areaAr,
    provider.governorate || provider.governorateAr,
  ]
    .filter(Boolean)
    .map(cleanCell)
    .join(', ')
  const params = new URLSearchParams({ api: '1', destination: dest, travelmode: mode })
  if (userCoords && userCoords.lat != null && userCoords.lon != null) {
    params.set('origin', `${userCoords.lat},${userCoords.lon}`)
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`
}
