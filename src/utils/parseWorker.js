// Web Worker: reads an Excel arrayBuffer with SheetJS and parses it off the
// main thread, then posts the provider list back.
import * as XLSX from 'xlsx'
import { parseRows } from './parseProviders'

self.onmessage = (e) => {
  const { buf } = e.data
  try {
    const wb = XLSX.read(buf, { type: 'array' })
    const sheetName = wb.SheetNames[0]
    const sheet = wb.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' })
    const providers = parseRows(rows)
    self.postMessage({ ok: true, providers })
  } catch (err) {
    self.postMessage({ ok: false, error: err?.message || 'parse failed' })
  }
}
