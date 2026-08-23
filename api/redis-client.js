import { createClient } from 'redis'

let clientPromise = null

export function redisConfigured() {
  return Boolean(process.env.REDIS_URL)
}

export function getRedis() {
  if (!redisConfigured()) return Promise.resolve(null)
  if (!clientPromise) {
    const client = createClient({ url: process.env.REDIS_URL })
    client.on('error', () => {})
    clientPromise = client.connect().then(() => client)
  }
  return clientPromise
}
