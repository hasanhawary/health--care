// Browser Geolocation API wrapper. Shared singleton state.
// Uses low-accuracy mode (IP/Wi-Fi) by default for reliability, retries once
// on transient failures, and exposes localized error messages.
import { ref, computed } from 'vue'
import { useI18n } from './useI18n'

const coords = ref(null) // { lat, lon, accuracy }
const loading = ref(false)
const errorCode = ref(null) // 1 denied, 2 unavailable, 3 timeout, -1 insecure, -2 unsupported
const supported = typeof navigator !== 'undefined' && !!navigator.geolocation

function getPosition(opts) {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      (err) => reject(err),
      opts
    )
  })
}

const error = computed(() => {
  const { t } = useI18n()
  switch (errorCode.value) {
    case 1:
      return t('geoDenied')
    case 2:
      return t('geoUnavailable')
    case 3:
      return t('geoTimeout')
    case -1:
      return t('geoInsecure')
    case -2:
      return t('geoUnsupported')
    default:
      return null
  }
})

export function useGeolocation() {
  async function detect() {
    if (!supported) {
      errorCode.value = -2
      return Promise.reject(new Error('unsupported'))
    }
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      errorCode.value = -1
      return Promise.reject(new Error('insecure'))
    }
    loading.value = true
    errorCode.value = null
    try {
      const pos = await getPosition({
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 300000,
      })
      coords.value = pos
      return pos
    } catch (err) {
      // Retry once with more lenient settings for transient failures.
      if (err && (err.code === 2 || err.code === 3)) {
        try {
          const pos = await getPosition({
            enableHighAccuracy: false,
            timeout: 25000,
            maximumAge: 600000,
          })
          coords.value = pos
          return pos
        } catch (err2) {
          errorCode.value = (err2 && err2.code) || 2
          throw err2
        }
      }
      errorCode.value = err && err.code != null ? err.code : 2
      throw err
    } finally {
      loading.value = false
    }
  }

  function clear() {
    coords.value = null
    errorCode.value = null
  }

  return { coords, loading, error, errorCode, supported, detect, clear }
}
