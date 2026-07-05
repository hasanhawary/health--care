// Visitor stats reader (Vercel serverless function).
// Returns total/today/week visits + all-time unique visitors.
import { kv } from '@vercel/kv'
import { dayKey, weekKey, kvConfigured } from './_time.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 'no-store')
  if (!kvConfigured()) {
    return res.status(200).json({
      totalVisits: 0,
      todayVisits: 0,
      weekVisits: 0,
      uniqueVisitors: 0,
      configured: false,
    })
  }
  try {
    const day = dayKey()
    const week = weekKey()
    const pipe = kv.pipeline()
    pipe.get('v:total')
    pipe.get(`v:day:${day}`)
    pipe.get(`v:week:${week}`)
    pipe.pfcount('u:total')
    const [totalVisits, todayVisits, weekVisits, uniqueVisitors] = await pipe.exec()

    return res.status(200).json({
      totalVisits: Number(totalVisits) || 0,
      todayVisits: Number(todayVisits) || 0,
      weekVisits: Number(weekVisits) || 0,
      uniqueVisitors: Number(uniqueVisitors) || 0,
      configured: true,
    })
  } catch (e) {
    return res.status(200).json({
      totalVisits: 0,
      todayVisits: 0,
      weekVisits: 0,
      uniqueVisitors: 0,
      configured: false,
    })
  }
}
