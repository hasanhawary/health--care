// Haversine distance in kilometers between two lat/lon points.

const R = 6371 // Earth radius (km)

function toRad(deg) {
  return (deg * Math.PI) / 180
}

export function haversineKm(lat1, lon1, lat2, lon2) {
  if (
    lat1 == null || lon1 == null || lat2 == null || lon2 == null ||
    Number.isNaN(+lat1) || Number.isNaN(+lon1) || Number.isNaN(+lat2) || Number.isNaN(+lon2)
  ) {
    return null
  }
  const dLat = toRad(+lat2 - +lat1)
  const dLon = toRad(+lon2 - +lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(+lat1)) * Math.cos(toRad(+lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

/** Human-friendly distance label. */
export function formatDistance(km) {
  if (km == null) return null
  if (km < 1) return `${Math.round(km * 1000)} m`
  if (km < 10) return `${km.toFixed(1)} km`
  return `${Math.round(km)} km`
}
