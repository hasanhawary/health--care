import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

// Global ripple effect for actionable elements (respects reduced motion).
function applyRipple(e) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const el = e.target.closest('.btn, .chip, .icon-btn, [data-ripple]')
  if (!el || el.disabled) return
  const rect = el.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height)
  const cx = (e.clientX != null ? e.clientX : rect.left + rect.width / 2) - rect.left
  const cy = (e.clientY != null ? e.clientY : rect.top + rect.height / 2) - rect.top
  const span = document.createElement('span')
  span.className = 'ripple'
  span.style.width = span.style.height = size + 'px'
  span.style.left = cx - size / 2 + 'px'
  span.style.top = cy - size / 2 + 'px'
  const pos = getComputedStyle(el).position
  if (pos === 'static') el.style.position = 'relative'
  if (getComputedStyle(el).overflow === 'visible') el.style.overflow = 'hidden'
  el.appendChild(span)
  span.addEventListener('animationend', () => span.remove(), { once: true })
}
document.addEventListener('click', applyRipple, true)

createApp(App).mount('#app')
