/**
 * Server-only Kicks.dev API fetcher.
 * Use this from server components (e.g. product page) instead of calling /api/hey
 * over HTTP, to avoid 401 from Vercel Deployment Protection on server-to-server requests.
 */

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
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text();
        if (!silent) console.error(`[kicks-dev] Fetch failed (${response.status})`, { url, errorBody });
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      if (!silent) console.warn(`[kicks-dev] Attempt ${i + 1} failed. Retrying in 2s...`, (error as Error).message);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
  throw new Error('Unreachable');
};

export interface KicksHeyResult {
  data: unknown;
  salesData: unknown;
  dailySalesData: unknown;
}

/**
 * Fetch product + sales from Kicks.dev (same logic as /api/hey).
 * Call this from server components; do not call /api/hey over HTTP from the server.
 */
export async function getKicksProduct(productId?: string | null, slug?: string | null): Promise<KicksHeyResult | null> {
  const apiKey = process.env.KICKS_DEV_API_KEY;
  if (!apiKey) {
    console.error('[kicks-dev] KICKS_DEV_API_KEY is not set');
    return null;
  }

  if (!productId && !slug) return null;

  const headers: HeadersInit = { Authorization: `Bearer ${apiKey}` };
  let finalProductId: string | null = null;
  let kicksDbData: unknown = null;

  try {
    if (productId) {
      finalProductId = productId;
      const detailUrl = `https://api.kicks.dev/v3/goat/products/${productId}`;
      kicksDbData = await fetchWithRetry(detailUrl, { method: 'GET', headers }, 3, 15000);
    } else if (slug) {
      const searchQuery = decodeURIComponent(slug).replace(/-/g, ' ');
      const searchUrl = `https://api.kicks.dev/v3/goat/products?query=${encodeURIComponent(searchQuery)}`;
      const searchResult = (await fetchWithRetry(searchUrl, { method: 'GET', headers }, 3, 15000)) as {
        data?: Array<{ id: string | number; name?: string }>;
      };
      const firstMatch = searchResult?.data?.[0];
      if (!firstMatch) return null;
      finalProductId = String(firstMatch.id);
      const detailUrl = `https://api.kicks.dev/v3/goat/products/${finalProductId}`;
      kicksDbData = await fetchWithRetry(detailUrl, { method: 'GET', headers }, 3, 15000);
    }

    if (!kicksDbData || !finalProductId) return null;

    let salesData: unknown = null;
    let dailySalesData: unknown = null;
    try {
      salesData = await fetchWithRetry(
        `https://api.kicks.dev/v3/goat/products/${finalProductId}/sales`,
        { method: 'GET', headers },
        2,
        10000,
        true
      );
    } catch {
      salesData = null;
    }
    try {
      dailySalesData = await fetchWithRetry(
        `https://api.kicks.dev/v3/goat/products/${finalProductId}/sales/daily`,
        { method: 'GET', headers },
        2,
        10000,
        true
      );
    } catch {
      dailySalesData = null;
    }

    return { data: kicksDbData, salesData, dailySalesData };
  } catch (err) {
    console.error('[kicks-dev] KicksDB fetch failed:', (err as Error).message);
    return null;
  }
}
