// Pure Excel->provider parsing logic. Shared by the main thread (fallback) and
// the parse Web Worker. No DOM/window dependencies.
import { cleanCell, normalizeArabic, normalizeForKey } from './normalizeText'

const HEADER_ALIASES = {
  name: ['مقدم الخدمة', 'مقدم الخدمه', 'Provider Name', 'Name'],
  providerTypeAr: ['نوع مقدم الخدمة', 'نوع مقدم الخدمه'],
  servicesAr: ['الخدمات المقدمة', 'الخدمات المقدمه'],
  specialtyAr: ['التخصص'],
  addressAr: ['العنوان'],
  areaAr: ['المنطقة / المدينة', 'المنطقه / المدينة', 'المنطقة/المدينة'],
  governorateAr: ['المحافظة', 'المحافظه'],
  phone: ['Tel. no. - التليفون', 'Tel', 'Phone', 'Telephone'],
  email: ['E-MAIL - البريدالإلكتروني', 'E-MAIL - البريد الإلكتروني', 'Email', 'E-mail', 'E-MAIL'],
  governorate: ['Governate', 'Governorate'],
  area: ['Area / City', 'Area/City', 'Area'],
  address: ['Address'],
  specialty: ['Specialty'],
  services: ['Services provided', 'Services Provided'],
  providerType: ['Provider Type'],
  tatshName: ['TATSH Names'],
  providerKey: ['Provider Key'],
  externalRef: ['External Ref.', 'External Ref', 'External Reference'],
  networkType: ['Network Type'],
  mainBranch: ['Main/Branch'],
  reNew: ['RE/NEW'],
  pulseStatus: ['PULSE Status'],
  year: ['Year'],
  month: ['Month'],
}

function headerKey(s) {
  return normalizeArabic(cleanCell(s)).replace(/[^a-z\u0600-\u06FF0-9]/g, '')
}

const HEADER_MAP = (() => {
  const m = new Map()
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    for (const a of aliases) {
      const k = headerKey(a)
      if (k && !m.has(k)) m.set(k, field)
    }
  }
  return m
})()

function detectHeaderRow(rows) {
  const limit = Math.min(rows.length, 6)
  let bestIdx = 0
  let bestScore = 0
  for (let i = 0; i < limit; i++) {
    const row = rows[i] || []
    let score = 0
    for (const cell of row) if (HEADER_MAP.has(headerKey(cell))) score++
    if (score > bestScore) {
      bestScore = score
      bestIdx = i
    }
  }
  return bestIdx
}

function buildColumnMap(headerRow) {
  const colToField = {}
  for (let j = 0; j < headerRow.length; j++) {
    const key = headerKey(headerRow[j])
    if (key && HEADER_MAP.has(key) && !(j in colToField)) {
      colToField[j] = HEADER_MAP.get(key)
    }
  }
  return colToField
}

export function parseRows(rows) {
  if (!rows.length) return []
  const headerIdx = detectHeaderRow(rows)
  const colToField = buildColumnMap(rows[headerIdx] || [])
  const out = []
  for (let r = headerIdx + 1; r < rows.length; r++) {
    const row = rows[r] || []
    if (!row.length) continue
    const p = {}
    for (const [j, field] of Object.entries(colToField)) {
      p[field] = cleanCell(row[j] ?? '')
    }
    const hasData = Object.values(p).some((v) => v !== '')
    if (!hasData) continue

    p.id = out.length
    p.live = normalizeArabic(p.pulseStatus) === 'live'
    p.typeKey = normalizeForKey(p.providerType || p.providerTypeAr)
    p.specialtyKey = normalizeForKey(p.specialty || p.specialtyAr)
    p.govKey = normalizeForKey(p.governorate || p.governorateAr)
    p.areaKey = normalizeForKey(p.area || p.areaAr)
    p.servicesKey = normalizeForKey(p.services || p.servicesAr)
    p.nameKey = normalizeArabic(p.name)
    p.searchBlob = normalizeArabic(
      [
        p.name, p.providerTypeAr, p.providerType, p.specialtyAr, p.specialty,
        p.servicesAr, p.services, p.addressAr, p.address, p.areaAr, p.area,
        p.governorateAr, p.governorate, p.phone, p.email, p.tatshName,
      ].join(' ')
    )
    out.push(p)
  }
  return out
}
