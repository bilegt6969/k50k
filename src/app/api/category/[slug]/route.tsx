// File: app/api/collections/[slug]/route.ts
import { type NextRequest, NextResponse } from 'next/server.js';

// No fallbacks: credentials must come from environment only (CONSTRUCT_API_KEY, CONSTRUCT_CLIENT_ID)

// --- Interfaces ---
interface ExternalProductData {
    id: string;
    image_url: string;
    gp_lowest_price_cents_223?: number;
    gp_instant_ship_lowest_price_cents_223?: number;
    product_condition: string;
    box_condition: string;
    slug?: string;
}

interface ExternalProduct {
    data: ExternalProductData;
    value: string;
}

interface ExternalApiResponse {
    response: {
        results: ExternalProduct[];
        total_num_results: number;
    };
}

interface ResolvedParams {
    slug: string;
}

export interface ApiProduct {
    id: string;
    name: string;
    image: string;
    price: number;
    instantShipPrice: number | null;
    productCondition: string;
    boxCondition: string;
    slug: string;
}

export interface ApiResponse {
    products: ApiProduct[];
    hasMore: boolean;
    total: number;
    error?: string;
}

// --- Constants ---
const RESULTS_PER_PAGE = 24;
const S_PARAMETER = '15'; // Matches the provided URL (s=15)
const CACHE_REVALIDATE_SECONDS = 300;
const SLUG_MAX_LENGTH = 200;
const SLUG_ALLOWED = /^[a-zA-Z0-9_-]+$/;

function sanitizeSlug(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed.length > SLUG_MAX_LENGTH) return null;
  if (!SLUG_ALLOWED.test(trimmed)) return null;
  return trimmed;
}

// --- API Route Handler ---
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<ResolvedParams> }
): Promise<NextResponse<ApiResponse>> {
    let slug: string | undefined;
    let pageNum: number = 1;

    try {
        // 1. Await and Extract Parameters
        const resolvedParams = await params;
        slug = resolvedParams.slug;

        const searchParams = request.nextUrl.searchParams;
        const pageQuery = searchParams.get('page');
        pageNum = pageQuery ? parseInt(pageQuery, 10) : 1;
        if (isNaN(pageNum) || pageNum < 1) {
            console.warn(`Invalid page parameter received: "${pageQuery}". Defaulting to page 1.`);
            pageNum = 1;
        }

        // 2. Credentials from environment only (no hardcoded fallbacks)
        const apiKey = process.env.CONSTRUCT_API_KEY;
        const clientId = process.env.CONSTRUCT_CLIENT_ID;
        if (!apiKey || !clientId) {
            console.error('API Key or Client ID missing in environment variables.');
            return NextResponse.json(
                {
                    products: [],
                    hasMore: false,
                    total: 0,
                    error: 'Server configuration error: Missing API credentials.',
                },
                { status: 500 }
            );
        }

        // 3. Validate and sanitize slug (alphanumeric, hyphen, underscore only)
        if (!slug || typeof slug !== 'string') {
            console.error('Invalid or missing slug parameter:', slug);
            return NextResponse.json(
                { products: [], hasMore: false, total: 0, error: 'Slug parameter is missing or invalid' },
                { status: 400 }
            );
        }
        const safeSlug = sanitizeSlug(slug);
        if (safeSlug === null) {
            return NextResponse.json(
                { products: [], hasMore: false, total: 0, error: 'Slug contains invalid characters or length' },
                { status: 400 }
            );
        }

        // 4. Construct External API URL - FIXED: Changed collection_id to group_id; use sanitized slug
        const apiUrl = `https://ac.cnstrc.com/browse/group_id/${encodeURIComponent(safeSlug)}?c=ciojs-client-2.54.0&key=${apiKey}&i=${clientId}&s=${S_PARAMETER}&page=${pageNum}&num_results_per_page=${RESULTS_PER_PAGE}&sort_by=relevance&sort_order=descending&fmt_options%5Bhidden_fields%5D=gp_lowest_price_cents_223&fmt_options%5Bhidden_fields%5D=gp_instant_ship_lowest_price_cents_223&fmt_options%5Bhidden_facets%5D=gp_lowest_price_cents_223&fmt_options%5Bhidden_facets%5D=gp_instant_ship_lowest_price_cents_223&variations_map=%7B%22group_by%22%3A%5B%7B%22name%22%3A%22product_condition%22%2C%22field%22%3A%22data.product_condition%22%7D%2C%7B%22name%22%3A%22box_condition%22%2C%22field%22%3A%22data.box_condition%22%7D%5D%2C%22values%22%3A%7B%22min_regional_price%22%3A%7B%22aggregation%22%3A%22min%22%2C%22field%22%3A%22data.gp_lowest_price_cents_223%22%7D%2C%22min_regional_instant_ship_price%22%3A%7B%22aggregation%22%3A%22min%22%2C%22field%22%3A%22data.gp_instant_ship_lowest_price_cents_223%22%7D%7D%2C%22dtype%22%3A%22object%22%7D&qs=%7B%22features%22%3A%7B%22display_variations%22%3Atrue%7D%2C%22feature_variants%22%3A%7B%22display_variations%22%3A%22matched%22%7D%7D&_dt=${Date.now()}`;

        // 5. Fetch from External API
        console.log(`Fetching external API for slug "${safeSlug}", page ${pageNum}...`);
        const res = await fetch(apiUrl, { next: { revalidate: CACHE_REVALIDATE_SECONDS } });

        if (!res.ok) {
            const errorText = await res.text();
            console.error(
                `External API Error for slug "${safeSlug}" (Page: ${pageNum}): Status ${res.status}, URL: ${apiUrl.substring(0, 200)}... Response: ${errorText.substring(0, 200)}...`
            );
            return NextResponse.json(
                {
                    products: [],
                    hasMore: false,
                    total: 0,
                    error: `External API failed with status: ${res.status}. Check server logs for details.`,
                },
                { status: res.status }
            );
        }

        const data: ExternalApiResponse = await res.json();

        // 6. Process Response
        if (!data.response || !Array.isArray(data.response.results)) {
            console.warn(
                `Invalid data structure received for slug "${safeSlug}" (Page: ${pageNum}). Expected response.results array. URL: ${apiUrl.substring(0, 200)}...`
            );
            return NextResponse.json(
                {
                    products: [],
                    hasMore: false,
                    total: 0,
                    error: 'Received invalid data structure from external API.',
                },
                { status: 422 }
            );
        }

        // Map to ApiProduct format
        const products: ApiProduct[] = data.response.results.map((item): ApiProduct => {
            const priceInDollars =
                typeof item.data.gp_lowest_price_cents_223 === 'number'
                    ? item.data.gp_lowest_price_cents_223 / 100
                    : 0;

            const instantShipPriceInDollars =
                typeof item.data.gp_instant_ship_lowest_price_cents_223 === 'number'
                    ? item.data.gp_instant_ship_lowest_price_cents_223 / 100
                    : null;

            return {
                id: item.data.id,
                name: item.value,
                image: item.data.image_url,
                price: priceInDollars,
                instantShipPrice: instantShipPriceInDollars,
                productCondition: item.data.product_condition,
                boxCondition: item.data.box_condition,
                slug: item.data.slug || item.data.id,
            };
        });

        // Calculate pagination
        const totalResults = data.response.total_num_results || 0;
        const hasMore = pageNum * RESULTS_PER_PAGE < totalResults;

        // 7. Return Success Response
        return NextResponse.json({
            products,
            hasMore,
            total: totalResults,
        });
    } catch (error: unknown) {
        console.error(`Error in API route handler for slug [${slug ?? 'unknown'}] (Page: ${pageNum}):`, error);
        const message = error instanceof Error ? error.message : 'An unknown server error occurred';
        return NextResponse.json(
            { products: [], hasMore: false, total: 0, error: message },
            { status: 500 }
        );
    }
}