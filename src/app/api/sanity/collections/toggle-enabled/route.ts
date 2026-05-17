import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSanityWriteClient } from '@/lib/sanity-write'
const MIN_ITEMS_FOR_HOME_COLLECTION = 6

// Retry helper function
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      
      if (attempt === maxRetries) {
        throw lastError
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, delay * attempt))
    }
  }
  
  throw lastError!
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { _id, enabled } = body

    if (!_id || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Missing _id or enabled status' },
        { status: 400 }
      )
    }

    // Get the write client with authentication
    const writeClient = getSanityWriteClient()

    if (enabled) {
      const collection = await writeClient.fetch<{
        mode?: 'manual' | 'auto' | 'json'
        products?: Array<{ _ref?: string }>
        rawProductJson?: string
      } | null>(
        `*[_type == "productCollection" && _id == $_id][0]{ mode, products, rawProductJson }`,
        { _id }
      )

      if (collection?.mode === 'manual') {
        const productCount = Array.isArray(collection.products) ? collection.products.length : 0
        if (productCount < MIN_ITEMS_FOR_HOME_COLLECTION) {
          return NextResponse.json(
            {
              success: false,
              error: `Manual collections need at least ${MIN_ITEMS_FOR_HOME_COLLECTION} products to enable on home.`,
            },
            { status: 400 }
          )
        }
      }

      if (collection?.mode === 'json') {
        let jsonCount = 0
        if (collection.rawProductJson) {
          try {
            const parsed = JSON.parse(collection.rawProductJson) as { products?: unknown[] }
            jsonCount = Array.isArray(parsed.products) ? parsed.products.length : 0
          } catch {
            jsonCount = 0
          }
        }
        if (jsonCount < MIN_ITEMS_FOR_HOME_COLLECTION) {
          return NextResponse.json(
            {
              success: false,
              error: `JSON collections need at least ${MIN_ITEMS_FOR_HOME_COLLECTION} products to enable on home.`,
            },
            { status: 400 }
          )
        }
      }
    }

    // Update the enabled status with retry logic
    await retryOperation(async () => {
      return await writeClient
        .patch(_id)
        .set({ enabled })
        .commit({ 
          // Add timeout configuration (in milliseconds)
          timeout: 30000
        })
    })

    return NextResponse.json({ 
      success: true, 
      data: { _id, enabled } 
    })
  } catch (error) {
    console.error('Error toggling collection enabled status:', error)
    
    // Provide more specific error messages
    let errorMessage = 'Failed to update status'
    
    if (error instanceof Error) {
      if (error.message.includes('Connect Timeout') || error.message.includes('UND_ERR_CONNECT_TIMEOUT')) {
        errorMessage = 'Network connection to Sanity timed out. Please check your internet connection and try again.'
      } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
        errorMessage = 'Unable to connect to Sanity. Please check your configuration.'
      } else if (error.message.includes('SANITY_WRITE_TOKEN is not set')) {
        errorMessage = 'Server configuration error: Sanity write token not configured. Please contact administrator.'
      } else {
        errorMessage = error.message
      }
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
