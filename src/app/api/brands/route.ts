// app/api/brands/route.ts
import { NextResponse } from 'next/server';

// --- Interfaces matching the Constructor.io API Response ---
interface ApiFacetOptionData {
    id?: string;
    image_url?: string;
    product_count?: number;
    // Add other known properties that might exist in the data object
}

interface ApiFacetOption {
    status?: string;
    count: number;
    display_name: string;
    value: string;
    data?: ApiFacetOptionData; // Now using the properly typed interface
}
interface ApiFacet {
    display_name: string;
    name: string;
    type: string;
    options: ApiFacetOption[];
}
interface ApiAllBrandsResponse {
    response?: {
        facets?: ApiFacet[];
    };
    error?: { message: string };
}

// --- Internal simplified Brand Info structure ---
interface BrandInfo {
    name: string;
    slug: string;
}

// --- Helper to generate slug ---
const valueToSlug = (value: string): string => {
    if (!value) return '';
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
};

// --- GET Handler ---
export async function GET() {
    // Construct the external API URL
    // Using num_results_per_page=0 to optimize for facets
    const externalApiUrl = `https://ac.cnstrc.com/browse/group_id/all?c=ciojs-client-2.54.0&key=key_XT7bjdbvjgECO5d8&i=c1a92cc3-02a4-4244-8e70-bee6178e8209&s=103&page=1&num_results_per_page=24&sort_by=relevance&sort_order=descending&fmt_options%5Bhidden_fields%5D=gp_lowest_price_cents_223&fmt_options%5Bhidden_fields%5D=gp_instant_ship_lowest_price_cents_223&fmt_options%5Bhidden_facets%5D=gp_lowest_price_cents_223&fmt_options%5Bhidden_facets%5D=gp_instant_ship_lowest_price_cents_223&variations_map=%7B%22group_by%22%3A%5B%7B%22name%22%3A%22product_condition%22%2C%22field%22%3A%22data.product_condition%22%7D%2C%7B%22name%22%3A%22box_condition%22%2C%22field%22%3A%22data.box_condition%22%7D%5D%2C%22values%22%3A%7B%22min_regional_price%22%3A%7B%22aggregation%22%3A%22min%22%2C%22field%22%3A%22data.gp_lowest_price_cents_223%22%7D%2C%22min_regional_instant_ship_price%22%3A%7B%22aggregation%22%3A%22min%22%2C%22field%22%3A%22data.gp_instant_ship_lowest_price_cents_223%22%7D%7D%2C%22dtype%22%3A%22object%22%7D&qs=%7B%22features%22%3A%7B%22display_variations%22%3Atrue%7D%2C%22feature_variants%22%3A%7B%22display_variations%22%3A%22matched%22%7D%7D&_dt=${Date.now()}`;

    try {
        console.log(`API Route: Fetching brands from ${externalApiUrl.substring(0, 40)}...`);
        const response = await fetch(externalApiUrl, {
             // Optional: Add caching headers if appropriate for your use case
             // next: { revalidate: 3600 } // Revalidate every hour
        });

        if (!response.ok) {
            throw new Error(`External API error! status: ${response.status}`);
        }

        const data: ApiAllBrandsResponse = await response.json();

        // Find the 'brand' facet
        const brandFacet = data.response?.facets?.find(f => f.name === 'brand');

        if (!brandFacet || !brandFacet.options) {
            console.warn("API Route: Brand facet not found or has no options.");
            return NextResponse.json({ brands: [] }); // Return empty list gracefully
        }

        // Map options to simplified BrandInfo, generate slug, filter invalid slugs
        const brands: BrandInfo[] = brandFacet.options
            .map(option => ({
                name: option.display_name.trim(), // Trim whitespace
                slug: valueToSlug(option.value)
            }))
            .filter(brand => brand.name && brand.slug); // Ensure name and slug are valid

        // Sort alphabetically by name
        brands.sort((a, b) => a.name.localeCompare(b.name));

        console.log(`API Route: Successfully processed ${brands.length} brands.`);
        return NextResponse.json({ brands });

    } catch (error) {
        console.error("API Route Error fetching/processing brands:", error);
        const message = error instanceof Error ? error.message : "Unknown server error";
        // Return an error response
        return NextResponse.json({ error: `Failed to load brands: ${message}` }, { status: 500 });
    }
}

// Optional: Add edge runtime for potentially faster responses if no Node.js APIs are needed
// export const runtime = 'edge';