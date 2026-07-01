// UI helpers: provider-type badge colors + icons.
import { normalizeForKey } from './normalizeText'

const TYPE_STYLES = {
  hospital: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300',
  pharmacy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
  lab: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
  dental: 'bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300',
  optometry: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
  physician: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300',
  physio: 'bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300',
  radiology: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300',
  polyclinic: 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300',
  diagnostic: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300',
  supplier: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/60 dark:text-fuchsia-300',
}

const DEFAULT_STYLE = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'

export function typeBadgeClass(key) {
  const k = normalizeForKey(key)
  if (!k) return DEFAULT_STYLE
  if (k.includes('hospital')) return TYPE_STYLES.hospital
  if (k.includes('pharmac')) return TYPE_STYLES.pharmacy
  if (k.includes('lab')) return TYPE_STYLES.lab
  if (k.includes('dental')) return TYPE_STYLES.dental
  if (k.includes('optom') || k.includes('vision')) return TYPE_STYLES.optometry
  if (k.includes('physician')) return TYPE_STYLES.physician
  if (k.includes('physio')) return TYPE_STYLES.physio
  if (k.includes('radiology')) return TYPE_STYLES.radiology
  if (k.includes('polyclinic')) return TYPE_STYLES.polyclinic
  if (k.includes('diagnostic')) return TYPE_STYLES.diagnostic
  if (k.includes('supplier')) return TYPE_STYLES.supplier
  return DEFAULT_STYLE
}

// Map a provider-type key to a Lucide icon name for quick chips.
export function typeIconName(key) {
  const k = normalizeForKey(key)
  if (k.includes('hospital')) return 'Hospital'
  if (k.includes('pharmac')) return 'Pill'
  if (k.includes('lab')) return 'FlaskConical'
  if (k.includes('dental')) return 'Smile'
  if (k.includes('optom') || k.includes('vision')) return 'Eye'
  if (k.includes('physician')) return 'Stethoscope'
  if (k.includes('physio')) return 'Activity'
  if (k.includes('radiology')) return 'ScanLine'
  if (k.includes('polyclinic')) return 'Building2'
  if (k.includes('diagnostic')) return 'Microscope'
  if (k.includes('supplier')) return 'Truck'
  return 'Building2'
}
