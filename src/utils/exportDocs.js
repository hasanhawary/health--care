// Export helpers: CSV (existing), Excel, PDF, and a clean Print view.
// All outputs are locale-aware (headers + field values follow the active language).
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import { cleanCell } from './normalizeText'

function locField(p, arKey, enKey, locale) {
  if (locale === 'en') return p[enKey] || p[arKey] || ''
  return p[arKey] || p[enKey] || ''
}

const LABELS = {
  ar: {
    name: 'الاسم', type: 'نوع المقدم', specialty: 'التخصص', governorate: 'المحافظة',
    area: 'المدينة', address: 'العنوان', phone: 'التليفون', email: 'البريد الإلكتروني',
    network: 'نوع الشبكة', mainBranch: 'رئيسي/فرع', pulse: 'الحالة', providerKey: 'كود المقدم',
    title: 'أليانز مصر — مقدمو الخدمات الطبية', count: 'مقدم', printed: 'طُبع', sheet: 'المقدمون',
  },
  en: {
    name: 'Name', type: 'Provider Type', specialty: 'Specialty', governorate: 'Governorate',
    area: 'Area / City', address: 'Address', phone: 'Phone', email: 'Email',
    network: 'Network Type', mainBranch: 'Main/Branch', pulse: 'PULSE Status', providerKey: 'Provider Key',
    title: 'Allianz Egypt — Medical Providers', count: 'providers', printed: 'printed', sheet: 'Providers',
  },
}

function row(p, l) {
  const L = LABELS[l] || LABELS.ar
  return {
    [L.name]: p.name,
    [L.type]: locField(p, 'providerTypeAr', 'providerType', l),
    [L.specialty]: locField(p, 'specialtyAr', 'specialty', l),
    [L.governorate]: locField(p, 'governorateAr', 'governorate', l),
    [L.area]: locField(p, 'areaAr', 'area', l),
    [L.address]: locField(p, 'addressAr', 'address', l),
    [L.phone]: p.phone,
    [L.email]: p.email,
    [L.network]: p.networkType,
    [L.mainBranch]: p.mainBranch,
    [L.pulse]: p.pulseStatus,
    [L.providerKey]: p.providerKey,
  }
}

export function exportExcel(providers, locale = 'ar', fileName = 'allianz-providers') {
  const L = LABELS[locale] || LABELS.ar
  const ws = XLSX.utils.json_to_sheet(providers.map((p) => row(p, locale)))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, L.sheet)
  XLSX.writeFile(wb, `${fileName}.xlsx`)
}

export function exportPdf(providers, locale = 'ar', fileName = 'allianz-providers') {
  const L = LABELS[locale] || LABELS.ar
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const H = doc.internal.pageSize.getHeight()
  doc.setFontSize(15)
  doc.text(L.title, 40, 36)
  doc.setFontSize(9)
  const cols = [40, 175, 330, 430, 510]
  const headers = [L.name, L.type, L.governorate, L.phone, L.address]
  let y = 64
  const drawHeader = () => {
    doc.setFont(undefined, 'bold')
    headers.forEach((h, i) => doc.text(h, cols[i], y))
    doc.setFont(undefined, 'normal')
    y += 16
  }
  drawHeader()
  const cap = providers.slice(0, 500)
  for (const p of cap) {
    if (y > H - 30) {
      doc.addPage()
      y = 40
      drawHeader()
    }
    const vals = [
      p.name,
      locField(p, 'providerTypeAr', 'providerType', locale) || '',
      locField(p, 'governorateAr', 'governorate', locale) || '',
      p.phone || '',
      locField(p, 'addressAr', 'address', locale) || '',
    ]
    vals.forEach((v, i) => {
      const max = i === 0 ? 38 : i === 4 ? 70 : 26
      doc.text(cleanCell(v).slice(0, max), cols[i], y)
    })
    y += 14
  }
  doc.save(`${fileName}.pdf`)
}

export function printView(providers, locale = 'ar') {
  const L = LABELS[locale] || LABELS.ar
  const w = window.open('', '_blank', 'width=900,height=700')
  if (!w) return
  const rows = providers
    .slice(0, 500)
    .map(
      (p) => `<tr>
        <td>${escape(p.name)}</td>
        <td>${escape(locField(p, 'providerTypeAr', 'providerType', locale))}</td>
        <td>${escape(locField(p, 'specialtyAr', 'specialty', locale))}</td>
        <td>${escape(locField(p, 'governorateAr', 'governorate', locale))}</td>
        <td dir="ltr">${escape(p.phone || '')}</td>
        <td>${escape(locField(p, 'addressAr', 'address', locale))}</td>
      </tr>`
    )
    .join('')
  const dir = locale === 'en' ? 'ltr' : 'rtl'
  w.document.write(`<!doctype html><html dir="${dir}" lang="${locale}"><head><meta charset="utf-8"><title>${escape(L.title)}</title>
  <style>
    body{font-family:Arial,sans-serif;padding:24px;color:#0f172a}
    h1{font-size:18px;margin:0 0 4px}p{color:#64748b;margin:0 0 16px;font-size:12px}
    table{width:100%;border-collapse:collapse;font-size:11px}
    th,td{border:1px solid #e2e8f0;padding:6px 8px;text-align:start;vertical-align:top}
    th{background:#f1f5f9;text-transform:uppercase;font-size:10px}
    tr:nth-child(even) td{background:#f8fafc}
  </style></head><body>
  <h1>${escape(L.title)}</h1>
  <p>${providers.length} ${L.count} · ${L.printed} ${new Date().toLocaleString()}</p>
  <table><thead><tr><th>${escape(L.name)}</th><th>${escape(L.type)}</th><th>${escape(L.specialty)}</th><th>${escape(L.governorate)}</th><th>${escape(L.phone)}</th><th>${escape(L.address)}</th></tr></thead>
  <tbody>${rows}</tbody></table>
  <script>window.onload=function(){setTimeout(function(){window.print()},300)}<\/script>
  </body></html>`)
  w.document.close()
}

function escape(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
