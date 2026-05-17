import { NextRequest, NextResponse } from 'next/server';

const fetchWithRetry = async (
  url: string,
  options: RequestInit = {},
  retries = 3,
  timeout = 15000,
  silent = false
): Promise<unknown> => {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text();
        if (!silent) {
          console.error(`[hey] Fetch failed (${response.status})`, {
            url,
            errorBody,
          });
        }
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      if (!silent) {
        console.warn(
          `[hey] Attempt ${i + 1} failed. Retrying in 2s...`,
          (error as Error).message
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
  throw new Error('Unreachable');
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('id');
  const slug = searchParams.get('slug');

  if (!productId && !slug) {
    return NextResponse.json(
      { error: 'Either id or slug parameter is required' },
      { status: 400 }
    );
  }

  const apiKey = process.env.KICKS_DEV_API_KEY;
  if (!apiKey) {
    console.error('[hey] KICKS_DEV_API_KEY is not set!');
    return NextResponse.json(
      { error: 'API key not configured' },
      { status: 500 }
    );
  }

  const headers: HeadersInit = { Authorization: `Bearer ${apiKey}` };

  let finalProductId: string | null = null;
  let kicksDbData: unknown = null;

  try {
    if (productId) {
      finalProductId = productId;
      const detailUrl = `https://api.kicks.dev/v3/goat/products/${productId}`;
      kicksDbData = await fetchWithRetry(detailUrl, {
        method: 'GET',
        headers,
      }, 3, 15000);
    } else if (slug) {
      const searchQuery = decodeURIComponent(slug).replace(/-/g, ' ');
      const searchUrl = `https://api.kicks.dev/v3/goat/products?query=${encodeURIComponent(searchQuery)}`;

      const searchResult = (await fetchWithRetry(searchUrl, {
        method: 'GET',
        headers,
      }, 3, 15000)) as { data?: Array<{ id: string | number; name?: string }> };

      const firstMatch = searchResult?.data?.[0];
      if (!firstMatch) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }

      finalProductId = String(firstMatch.id);
      const detailUrl = `https://api.kicks.dev/v3/goat/products/${finalProductId}`;
      kicksDbData = await fetchWithRetry(detailUrl, {
        method: 'GET',
        headers,
      }, 3, 15000);
    }
  } catch (err) {
    console.error('[hey] ❌ KicksDB fetch failed:', (err as Error).message);
    return NextResponse.json(
      { error: `Failed to fetch data: ${(err as Error).message}` },
      { status: 500 }
    );
  }

  let salesData: unknown = null;
  try {
    if (finalProductId) {
      const salesUrl = `https://api.kicks.dev/v3/goat/products/${finalProductId}/sales`;
      salesData = await fetchWithRetry(salesUrl, {
        method: 'GET',
        headers,
      }, 2, 10000, true);
    }
  } catch {
    salesData = null;
  }

  let dailySalesData: unknown = null;
  try {
    if (finalProductId) {
      const dailySalesUrl = `https://api.kicks.dev/v3/goat/products/${finalProductId}/sales/daily`;
      dailySalesData = await fetchWithRetry(dailySalesUrl, {
        method: 'GET',
        headers,
      }, 2, 10000, true);
    }
  } catch {
    dailySalesData = null;
  }

  return NextResponse.json({
    data: kicksDbData,
    salesData,
    dailySalesData,
  });
}
