import { NextResponse } from 'next/server'

// Helper function to fetch with timeout and retries
const fetchWithRetry = async (url: string, options = {}, retries = 3, timeout = 10000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(url, { ...options, signal: controller.signal })
      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      clearTimeout(timeout) // Ensure timeout is cleared

      // Narrow down the type of `error` before accessing `error.message`
      if (error instanceof Error) {
        if (i === retries - 1) {
          throw new Error(`Failed to fetch ${url} after ${retries} retries: ${error.message}`)
        }
        console.warn(`Attempt ${i + 1} failed. Retrying...`, error.message)
      } else {
        if (i === retries - 1) {
          throw new Error(`Failed to fetch ${url} after ${retries} retries: ${error}`)
        }
        console.warn(`Attempt ${i + 1} failed. Retrying...`, error)
      }
    }
  }
}

interface ApiResponse {
  sections: {
    subsections: { title: string }[]
  }[]
}

export async function GET() {
  try {
    // Fetch search suggestions from the external API
    const url = 'https://www.goat.com/web-api/v1/cms/cms_articles/search-suggestions-feed-web'
    const data: ApiResponse = await fetchWithRetry(url, {}, 3, 15000)

    // Validate response structure
    if (!data?.sections?.[0]?.subsections) {
      throw new Error('Invalid API response structure')
    }

    // Extract the search suggestions from the response
    const suggestions = data.sections[0].subsections.map(
      (subsection: { title: string }) => subsection.title,
    )

    // Return the suggestions in the response
    return NextResponse.json({ suggestions })
  } catch (err) {
    // Handle the error safely
    if (err instanceof Error) {
      console.error('Failed to fetch search suggestions:', err.message)
      return NextResponse.json(
        { error: `Failed to fetch search suggestions: ${err.message}` },
        { status: 500 },
      )
    } else {
      console.error('Failed to fetch search suggestions:', err)
      return NextResponse.json(
        { error: 'Failed to fetch search suggestions. Please try again later.' },
        { status: 500 },
      )
    }
  }
}
