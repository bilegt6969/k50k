import { NextResponse, type NextRequest } from 'next/server'

/** Permissive CORS for all public API routes. */
export const WIDE_OPEN_CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Expose-Headers': '*',
  'Access-Control-Max-Age': '86400',
}

export function applyWideOpenCors(_req: NextRequest, res: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(WIDE_OPEN_CORS_HEADERS)) {
    res.headers.set(key, value)
  }
  return res
}

export function wideOpenCorsPreflightResponse(): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: WIDE_OPEN_CORS_HEADERS,
  })
}
