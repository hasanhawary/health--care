// Dark mode toggle (class strategy), persisted + synced with <html>.
import { ref, watch } from 'vue'

const THEME_KEY = 'allianz_theme'
const isDark = ref(
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
)

function apply() {
  document.documentElement.classList.toggle('dark', isDark.value)
}

watch(isDark, (v) => {
  try {
    localStorage.setItem(THEME_KEY, v ? 'dark' : 'light')
  } catch (e) {}
  apply()
})

export function useTheme() {
  function toggle() {
    isDark.value = !isDark.value
  }
  return { isDark, toggle }
}
