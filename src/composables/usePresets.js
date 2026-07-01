// Saved filter presets, persisted locally.
import { useStorage } from '@vueuse/core'

const presets = useStorage('allianz_presets_v1', [])

export function usePresets() {
  function savePreset(name, snapshot) {
    const id = Date.now().toString(36)
    presets.value = [{ id, name, snapshot }, ...presets.value].slice(0, 20)
    return id
  }
  function deletePreset(id) {
    presets.value = presets.value.filter((p) => p.id !== id)
  }
  return { presets, savePreset, deletePreset }
}
