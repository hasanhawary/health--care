// Export filtered providers to a CSV file (UTF-8 with BOM for Arabic in Excel).

import { cleanCell } from './normalizeText'

const COLUMNS = [
  ['name', 'مقدم الخدمة / Name'],
  ['providerTypeAr', 'نوع مقدم الخدمة (AR)'],
  ['providerType', 'Provider Type (EN)'],
  ['specialtyAr', 'التخصص (AR)'],
  ['specialty', 'Specialty (EN)'],
  ['servicesAr', 'الخدمات (AR)'],
  ['services', 'Services (EN)'],
  ['governorateAr', 'المحافظة (AR)'],
  ['governorate', 'Governorate (EN)'],
  ['areaAr', 'المنطقة (AR)'],
  ['area', 'Area / City (EN)'],
  ['addressAr', 'العنوان (AR)'],
  ['address', 'Address (EN)'],
  ['phone', 'Tel'],
  ['email', 'Email'],
  ['networkType', 'Network Type'],
  ['mainBranch', 'Main/Branch'],
  ['pulseStatus', 'PULSE Status'],
  ['providerKey', 'Provider Key'],
  ['externalRef', 'External Ref.'],
]

function escapeCsv(value) {
  const s = cleanCell(value)
  if (/[",\n\r]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

export function exportProvidersCsv(providers, fileName = 'allianz-providers.csv') {
  const header = COLUMNS.map((col) => escapeCsv(col[1])).join(',')
  const rows = providers.map((p) => COLUMNS.map((col) => escapeCsv(p[col[0]])).join(','))
  const csv = [header, ...rows].join('\r\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
