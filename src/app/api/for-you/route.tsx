//  web/src/app/api/for-you/route.tsx

import { NextResponse } from 'next/server'

interface ExternalProduct {
  data: {
    id: string
    image_url: string
    gp_lowest_price_cents_223?: number
    gp_instant_ship_lowest_price_cents_223?: number
    product_condition: string
    box_condition: string
    slug?: string
  }
  value: string
}

interface ExternalApiResponse {
  response: {
    results: ExternalProduct[]
    total_num_results: number
  }
}

// Filter keys that should be formatted as filters[key] in the external API
const FILTER_KEYS = new Set([
  'brand',
  'web_groups',
  'gender',
  'color',
  'size_converted',
  'product_condition',
  'gp_instant_ship_lowest_price_cents',
  'release_date_year',
])

// Parameters that should be passed directly (not as filters)
const DIRECT_PARAMS = new Set([
  'query',
  'sort_by',
  'sort_order',
  'num_results_per_page',
])

// Function to handle price range filters
function handlePriceFilter(value: string): string {
  // Convert price ranges like "0-10000" to the format expected by the API
  if (value.includes('-')) {
    const [min, max] = value.split('-')
    if (max === '') {
      // Handle "50000-" (over $500)
      return `${min}-`
    }
    return `${min}-${max}`
  }
  return value
}

// Function to build the external API URL
function buildApiUrl(searchParams: URLSearchParams): string {
  const baseUrl = "https://ac.cnstrc.com/browse/group_id/all"
  
  // Base parameters that are always included - build step by step to handle duplicates
  const baseParams = new URLSearchParams()
  baseParams.set('c', 'ciojs-client-2.54.0')
  baseParams.set('key', 'key_XT7bjdbvjgECO5d8')
  baseParams.set('i', 'c1a92cc3-02a4-4244-8e70-bee6178e8209')
  baseParams.set('s', '86')
  baseParams.set('num_results_per_page', '24')
  baseParams.set('sort_by', 'relevance')
  baseParams.set('sort_order', 'descending')
  
  // Add multiple fmt_options[hidden_fields] parameters
  baseParams.append('fmt_options[hidden_fields]', 'gp_lowest_price_cents_223')
  baseParams.append('fmt_options[hidden_fields]', 'gp_instant_ship_lowest_price_cents_223')
  
  // Add multiple fmt_options[hidden_facets] parameters
  baseParams.append('fmt_options[hidden_facets]', 'gp_lowest_price_cents_223')
  baseParams.append('fmt_options[hidden_facets]', 'gp_instant_ship_lowest_price_cents_223')
  
  // Add complex JSON parameters
  baseParams.set('variations_map', JSON.stringify({
    "group_by": [
      {"name": "product_condition", "field": "data.product_condition"},
      {"name": "box_condition", "field": "data.box_condition"}
    ],
    "values": {
      "min_regional_price": {"aggregation": "min", "field": "data.gp_lowest_price_cents_223"},
      "min_regional_instant_ship_price": {"aggregation": "min", "field": "data.gp_instant_ship_lowest_price_cents_223"}
    },
    "dtype": "object"
  }))
  
  baseParams.set('qs', JSON.stringify({
    "features": {"display_variations": true},
    "feature_variants": {"display_variations": "matched"}
  }))

  // Add page parameter
  const page = searchParams.get('page') || '1'
  baseParams.set('page', page)

  // Process incoming search parameters
  const filterParams: string[] = []
  
  searchParams.forEach((value, key) => {
    if (key === 'page') {
      // Already handled above
      return
    }

    if (FILTER_KEYS.has(key)) {
      // Handle filter parameters
      let processedValue = value
      
      // Special handling for price filters
      if (key === 'gp_instant_ship_lowest_price_cents') {
        processedValue = handlePriceFilter(value)
      }
      
      filterParams.push(`filters[${key}]=${encodeURIComponent(processedValue)}`)
    } else if (DIRECT_PARAMS.has(key)) {
      // Handle direct parameters (override base params if provided)
      baseParams.set(key, value)
    }
    // Ignore unknown parameters
  })

  // Build final URL
  let finalUrl = `${baseUrl}?${baseParams.toString()}`
  
  // Add filter parameters
  if (filterParams.length > 0) {
    finalUrl += '&' + filterParams.join('&')
  }
  
  // Add timestamp
  finalUrl += `&_dt=${Date.now()}`
  
  return finalUrl
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const brand = searchParams.get('brand')
  console.log("Brand:", brand) // Will log: "comme des garcons play"
    
  try {
    // Build the API URL with proper parameter handling
    const apiUrl = buildApiUrl(searchParams)
    
    // For debugging - you can uncomment this to see the final URL
    console.log("Final API URL:", apiUrl)

    const res = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NextJS-API)',
        'Accept': 'application/json',
      },
    })

    if (!res.ok) {
      const errorBody = await res.text()
      console.error(`External API failed with status: ${res.status}`, errorBody)
      throw new Error(`External API failed with status: ${res.status}`)
    }

    const data: ExternalApiResponse = await res.json()

    if (!data.response?.results) {
      return NextResponse.json({ 
        error: 'Invalid data structure from external API',
        receivedData: data 
      }, { status: 500 })
    }

    const products = data.response.results.map((item) => ({
      id: item.data.id,
      name: item.value,
      image: item.data.image_url,
      price: item.data.gp_lowest_price_cents_223 ? item.data.gp_lowest_price_cents_223 / 100 : 0,
      instantShipPrice: item.data.gp_instant_ship_lowest_price_cents_223
        ? item.data.gp_instant_ship_lowest_price_cents_223 / 100
        : null,
      productCondition: item.data.product_condition,
      boxCondition: item.data.box_condition,
      slug: item.data.slug || item.data.id,
    }))

    return NextResponse.json({
      products,
      hasMore: data.response.results.length > 0,
      total: data.response.total_num_results,
      appliedFilters: Object.fromEntries(searchParams.entries()), // For debugging
    })

  } catch (error: unknown) {
    console.error('Error in products API route:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}