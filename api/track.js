// Visitor tracking endpoint (Vercel serverless function).
// Stores SHA-256(IP + secret) — never the raw IP. Uses HyperLogLog (PFADD) for
// unique counts and INCR for visit counts. The client gates this to once per
// browser session (sessionStorage) so a page refresh does not inflate counters.
import { kv } from '@vercel/kv'
import { dayKey, weekKey, kvConfigured } from './_time.js'

const SECRET = process.env.ANALYTICS_SECRET || 'allianz-dev-secret'

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method-not-allowed' })
  }
  if (!kvConfigured()) {
    // KV not provisioned — no-op (keeps the app working without analytics setup).
    return res.status(200).json({ ok: false, reason: 'kv-not-configured' })
  }
  try {
    const fwd = req.headers['x-forwarded-for'] || ''
    const ip = (typeof fwd === 'string' ? fwd.split(',')[0] : '').trim() || req.headers['x-real-ip'] || '0.0.0.0'
    const hash = await sha256(`${ip}:${SECRET}`)
    const day = dayKey()
    const week = weekKey()

    const pipe = kv.pipeline()
    pipe.pfadd('u:total', hash)
    pipe.pfadd(`u:day:${day}`, hash)
    pipe.pfadd(`u:week:${week}`, hash)
    pipe.incr('v:total')
    pipe.incr(`v:day:${day}`)
    pipe.incr(`v:week:${week}`)
    await pipe.exec()

    return res.status(200).json({ ok: true })
  } catch (e) {
    // Return 200 so the client never retries/block; analytics is best-effort.
    return res.status(200).json({ ok: false, error: 'track-failed' })
  }
}
