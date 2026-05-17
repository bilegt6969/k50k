import { NextResponse, type NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

import { applyWideOpenCors, wideOpenCorsPreflightResponse } from '@/lib/api-cors'
import {
  checkRateLimit,
  getClientIp,
  getRateLimitConfigForPath,
  rateLimitHeaders,
  type RateLimitResult,
} from '@/lib/rate-limit'

export const config = {
  matcher: ['/api/:path*', '/admin/:path*'],
}

function isProtectedAdminApiPath(pathname: string) {
  return (
    pathname.startsWith('/api/sanity/') ||
    pathname.startsWith('/api/kicksdev/') ||
    pathname.startsWith('/api/admin/')
  )
}

function hasInternalAdminKey(req: NextRequest) {
  const internalKey = req.headers.get('x-admin-key')
  const expectedKey = process.env.ADMIN_INTERNAL_API_KEY
  return Boolean(expectedKey && internalKey && internalKey === expectedKey)
}

function applyRateLimitHeaders(res: NextResponse, result: RateLimitResult) {
  for (const [key, value] of Object.entries(rateLimitHeaders(result))) {
    res.headers.set(key, value)
  }
  return res
}

function runRateLimit(req: NextRequest): { result: RateLimitResult; blocked: NextResponse | null } {
  if (hasInternalAdminKey(req)) {
    return {
      result: { success: true, limit: 0, remaining: 999, resetAt: Date.now() + 60_000 },
      blocked: null,
    }
  }

  const pathname = req.nextUrl.pathname
  const config = getRateLimitConfigForPath(pathname)
  const ip = getClientIp(req)
  const result = checkRateLimit(`${ip}:${pathname}`, config)

  if (result.success) {
    return { result, blocked: null }
  }

  const res = NextResponse.json(
    { success: false, error: 'Too many requests. Please try again later.' },
    { status: 429 }
  )
  applyRateLimitHeaders(res, result)
  return { result, blocked: applyWideOpenCors(req, res) }
}

async function handleApiRequest(req: NextRequest) {
  if (req.method === 'OPTIONS') {
    return wideOpenCorsPreflightResponse()
  }

  const { result: rateResult, blocked } = runRateLimit(req)
  if (blocked) return blocked

  const pathname = req.nextUrl.pathname

  if (isProtectedAdminApiPath(pathname)) {
    if (hasInternalAdminKey(req)) {
      return applyWideOpenCors(
        req,
        applyRateLimitHeaders(NextResponse.next(), rateResult)
      )
    }

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (token) {
      return applyWideOpenCors(
        req,
        applyRateLimitHeaders(NextResponse.next(), rateResult)
      )
    }

    const res = NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    return applyWideOpenCors(req, applyRateLimitHeaders(res, rateResult))
  }

  return applyWideOpenCors(req, applyRateLimitHeaders(NextResponse.next(), rateResult))
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/api/')) {
    return handleApiRequest(req)
  }

  // Admin UI pages (not API)
  if (hasInternalAdminKey(req)) {
    return NextResponse.next()
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (token) return NextResponse.next()

  const signInUrl = new URL('/admin/login', req.url)
  signInUrl.searchParams.set('callbackUrl', req.nextUrl.pathname + req.nextUrl.search)
  return NextResponse.redirect(signInUrl)
}
