// Custom Leaflet divIcons by provider type. Emoji glyphs on colored teardrop pins.
import L from 'leaflet'
import { normalizeForKey } from './normalizeText'

const TYPE_STYLE = [
  { match: 'physician', color: '#6366f1', emoji: '🩺', label: 'Doctor', labelAr: 'طبيب' },
  { match: 'hospital', color: '#ef4444', emoji: '🏥', label: 'Hospital', labelAr: 'مستشفى' },
  { match: 'pharmac', color: '#10b981', emoji: '💊', label: 'Pharmacy', labelAr: 'صيدلية' },
  { match: 'lab', color: '#3b82f6', emoji: '🧪', label: 'Lab', labelAr: 'معمل' },
  { match: 'dental', color: '#ec4899', emoji: '🦷', label: 'Dental', labelAr: 'أسنان' },
  { match: 'physio', color: '#14b8a6', emoji: '💪', label: 'Physiotherapy', labelAr: 'علاج طبيعي' },
  { match: 'radiology', color: '#a855f7', emoji: '🩻', label: 'Radiology', labelAr: 'أشعة' },
  { match: 'optom', color: '#f59e0b', emoji: '👁', label: 'Optometry', labelAr: 'بصريات' },
  { match: 'polyclinic', color: '#f97316', emoji: '🏢', label: 'Polyclinic', labelAr: 'مجمع عيادات' },
  { match: 'diagnostic', color: '#06b6d4', emoji: '🔬', label: 'Diagnostic', labelAr: 'تشخيصي' },
  { match: 'supplier', color: '#d946ef', emoji: '🚚', label: 'Supplier', labelAr: 'مورد' },
]
const DEFAULT_STYLE = { color: '#64748b', emoji: '📍', label: 'Other', labelAr: 'أخرى' }

export function styleFor(typeKey) {
  const k = normalizeForKey(typeKey)
  for (const s of TYPE_STYLE) if (k.includes(s.match)) return s
  return DEFAULT_STYLE
}

export function legendItems() {
  return TYPE_STYLE.map((s) => ({ color: s.color, emoji: s.emoji, label: s.label, labelAr: s.labelAr }))
}

function pinHtml(color, emoji) {
  return `<div style="position:relative;width:32px;height:42px;transform:translate(-50%,-100%);filter:drop-shadow(0 2px 3px rgba(0,0,0,.35));">
<svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg"><path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 26 16 26s16-14 16-26C32 7.16 24.84 0 16 0z" fill="${color}" stroke="#ffffff" stroke-width="2.5"/></svg>
<span style="position:absolute;top:3px;left:0;width:32px;text-align:center;font-size:15px;line-height:1;pointer-events:none;">${emoji}</span></div>`
}

const iconCache = new Map()
export function markerIcon(typeKey) {
  const s = styleFor(typeKey)
  if (iconCache.has(s.label)) return iconCache.get(s.label)
  const icon = L.divIcon({
    html: pinHtml(s.color, s.emoji),
    className: 'provider-marker',
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    tooltipAnchor: [0, -38],
    popupAnchor: [0, -36],
  })
  iconCache.set(s.label, icon)
  return icon
}

export function selectedIcon(typeKey) {
  const s = styleFor(typeKey)
  return L.divIcon({
    html: `<div style="position:relative;width:44px;height:56px;transform:translate(-50%,-100%);filter:drop-shadow(0 4px 6px rgba(0,0,0,.4));">
<svg width="44" height="56" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg"><path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 26 16 26s16-14 16-26C32 7.16 24.84 0 16 0z" fill="${s.color}" stroke="#ffffff" stroke-width="3"/></svg>
<span style="position:absolute;top:4px;left:0;width:44px;text-align:center;font-size:20px;line-height:1;pointer-events:none;">${s.emoji}</span>
<span style="position:absolute;top:-6px;left:50%;transform:translateX(-50%);width:10px;height:10px;border-radius:9999px;background:#fff;border:2px solid ${s.color};"></span></div>`,
    className: 'provider-marker provider-marker--active',
    iconSize: [44, 56],
    iconAnchor: [22, 56],
    popupAnchor: [0, -48],
  })
}

export function userIcon() {
  return L.divIcon({
    html: `<div style="position:relative;width:22px;height:22px;transform:translate(-50%,-50%);">
<span style="position:absolute;inset:0;border-radius:9999px;background:#2f86f5;opacity:.3;animation:userPulse 1.8s ease-out infinite;"></span>
<span style="position:absolute;top:5px;left:5px;width:12px;height:12px;border-radius:9999px;background:#2f86f5;border:2.5px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.4);"></span></div>`,
    className: 'user-marker',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  })
}

export function needsCoordIcon() {
  return L.divIcon({
    html: `<div style="position:relative;width:28px;height:36px;transform:translate(-50%,-100%);">
<svg width="28" height="36" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg"><path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 26 16 26s16-14 16-26C32 7.16 24.84 0 16 0z" fill="#94a3b8" stroke="#fff" stroke-width="2" stroke-dasharray="4 3"/></svg>
<span style="position:absolute;top:2px;left:0;width:28px;text-align:center;font-size:12px;line-height:1;">❓</span></div>`,
    className: 'provider-marker',
    iconSize: [28, 36],
    iconAnchor: [14, 36],
  })
}
