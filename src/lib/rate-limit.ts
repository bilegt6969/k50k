import type { NextRequest } from 'next/server'

export type RateLimitConfig = {
  limit: number
  windowMs: number
}

export type RateLimitResult = {
  success: boolean
  limit: number
  remaining: number
  resetAt: number
}

type Bucket = {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()
let lastCleanup = Date.now()
const CLEANUP_INTERVAL_MS = 60_000

const ROUTE_LIMITS: { pattern: RegExp; config: RateLimitConfig }[] = [
  { pattern: /^\/api\/(contact|createorder)(\/|$)/, config: { limit: 10, windowMs: 60_000 } },
  {
    pattern: /^\/api\/(search|search-suggestions|search\/)(\/|$)/,
    config: { limit: 40, windowMs: 60_000 },
  },
  { pattern: /^\/api\/auth(\/|$)/, config: { limit: 30, windowMs: 60_000 } },
  { pattern: /^\/api\/(sanity|kicksdev|admin)(\/|$)/, config: { limit: 120, windowMs: 60_000 } },
]

const DEFAULT_LIMIT: RateLimitConfig = { limit: 100, windowMs: 60_000 }

function cleanup(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}

export function getRateLimitConfigForPath(pathname: string): RateLimitConfig {
  for (const { pattern, config } of ROUTE_LIMITS) {
    if (pattern.test(pathname)) return config
  }
  return DEFAULT_LIMIT
}

export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    const ip = forwarded.split(',')[0]?.trim()
    if (ip) return ip
  }
  const realIp = req.headers.get('x-real-ip')?.trim()
  if (realIp) return realIp
  return 'unknown'
}

export function checkRateLimit(identifier: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  cleanup(now)

  const key = `${identifier}:${config.limit}:${config.windowMs}`
  const existing = buckets.get(key)

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + config.windowMs
    buckets.set(key, { count: 1, resetAt })
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      resetAt,
    }
  }

  if (existing.count >= config.limit) {
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      resetAt: existing.resetAt,
    }
  }

  existing.count += 1
  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - existing.count,
    resetAt: existing.resetAt,
  }
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(Math.max(0, result.remaining)),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  }
  if (!result.success) {
    const retryAfterSec = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000))
    headers['Retry-After'] = String(retryAfterSec)
  }
  return headers
}
