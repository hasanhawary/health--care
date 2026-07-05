// Shared time helpers for analytics (UTC-based day/ISO-week keys).
export function dayKey(d = new Date()) {
  return d.toISOString().slice(0, 10) // YYYY-MM-DD
}

export function weekKey(d = new Date()) {
  // ISO-8601 week number (UTC)
  const tmp = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const dayNum = (tmp.getUTCDay() + 6) % 7
  tmp.setUTCDate(tmp.getUTCDate() - dayNum + 3)
  const firstThu = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 4))
  const week =
    1 + Math.round(((tmp - firstThu) / 86400000 - 3 + ((firstThu.getUTCDay() + 6) % 7)) / 7)
  return `${tmp.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

export function kvConfigured() {
  return !!(process.env.KV_REST_API_URL || process.env.KV_URL)
}
