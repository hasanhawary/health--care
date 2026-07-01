// Export helpers: CSV (existing), Excel, PDF, and a clean Print view.
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import { cleanCell } from './normalizeText'

function row(p) {
  return {
    Name: p.name,
    'Provider Type': p.providerType || p.providerTypeAr,
    Specialty: p.specialty || p.specialtyAr,
    Governorate: p.governorate || p.governorateAr,
    'Area / City': p.area || p.areaAr,
    Address: p.address || p.addressAr,
    Phone: p.phone,
    Email: p.email,
    'Network Type': p.networkType,
    'Main/Branch': p.mainBranch,
    'PULSE Status': p.pulseStatus,
    'Provider Key': p.providerKey,
  }
}

export function exportExcel(providers, fileName = 'allianz-providers') {
  const ws = XLSX.utils.json_to_sheet(providers.map(row))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Providers')
  XLSX.writeFile(wb, `${fileName}.xlsx`)
}

export function exportPdf(providers, fileName = 'allianz-providers') {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const H = doc.internal.pageSize.getHeight()
  doc.setFontSize(15)
  doc.text('Allianz Egypt — Medical Providers', 40, 36)
  doc.setFontSize(9)
  const cols = [40, 175, 330, 430, 510]
  const headers = ['Name', 'Type', 'Governorate', 'Phone', 'Address']
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
      p.providerType || p.providerTypeAr || '',
      p.governorate || p.governorateAr || '',
      p.phone || '',
      (p.address || p.addressAr || ''),
    ]
    vals.forEach((v, i) => {
      const max = i === 0 ? 38 : i === 4 ? 70 : 26
      doc.text(cleanCell(v).slice(0, max), cols[i], y)
    })
    y += 14
  }
  doc.save(`${fileName}.pdf`)
}

export function printView(providers) {
  const w = window.open('', '_blank', 'width=900,height=700')
  if (!w) return
  const rows = providers
    .slice(0, 500)
    .map(
      (p) => `<tr>
        <td>${escape(p.name)}</td>
        <td>${escape(p.providerType || p.providerTypeAr || '')}</td>
        <td>${escape(p.specialty || p.specialtyAr || '')}</td>
        <td>${escape(p.governorate || p.governorateAr || '')}</td>
        <td dir="ltr">${escape(p.phone || '')}</td>
        <td>${escape(p.address || p.addressAr || '')}</td>
      </tr>`
    )
    .join('')
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Allianz Egypt Providers</title>
  <style>
    body{font-family:Arial,sans-serif;padding:24px;color:#0f172a}
    h1{font-size:18px;margin:0 0 4px}p{color:#64748b;margin:0 0 16px;font-size:12px}
    table{width:100%;border-collapse:collapse;font-size:11px}
    th,td{border:1px solid #e2e8f0;padding:6px 8px;text-align:start;vertical-align:top}
    th{background:#f1f5f9;text-transform:uppercase;font-size:10px}
    tr:nth-child(even) td{background:#f8fafc}
  </style></head><body>
  <h1>Allianz Egypt — Medical Providers</h1>
  <p>${providers.length} providers · printed ${new Date().toLocaleString()}</p>
  <table><thead><tr><th>Name</th><th>Type</th><th>Specialty</th><th>Governorate</th><th>Phone</th><th>Address</th></tr></thead>
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
