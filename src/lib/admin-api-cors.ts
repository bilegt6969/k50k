import { NextResponse, type NextRequest } from 'next/server'

import { WIDE_OPEN_CORS_HEADERS } from '@/lib/api-cors'

/**
 * CORS for admin API route handlers (also applied globally in middleware).
 */
export function corsHeadersForAdminApi(_req: NextRequest): Record<string, string> {
  return { ...WIDE_OPEN_CORS_HEADERS }
}

function mergeAdminApiCorsHeaders(req: NextRequest, existing?: HeadersInit): Headers {
  const h = new Headers(existing)
  for (const [key, value] of Object.entries(corsHeadersForAdminApi(req))) {
    h.set(key, value)
  }
  return h
}

export function jsonWithAdminCors(
  req: NextRequest,
  body: unknown,
  init?: ResponseInit
) {
  const headers = mergeAdminApiCorsHeaders(req, init?.headers)
  return NextResponse.json(body, {...init, headers})
}

export function applyAdminApiCorsToResponse(req: NextRequest, res: NextResponse) {
  for (const [k, v] of Object.entries(corsHeadersForAdminApi(req))) {
    res.headers.set(k, v)
  }
  return res
}
