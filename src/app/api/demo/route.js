import { NextResponse } from 'next/server'

// Pool of realistic User-Agent strings
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 10; SM-A505FN) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
]

// Function to introduce a random delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export async function GET() {
  const url =
    'https://www.laced.com/_next/data/NsprqpqNCs4txBdmnH7ri/en/products/adidas-sl-72-og-leopard-print-womens.json?slug=adidas-sl-72-og-leopard-print-womens'

  try {
    // Randomly select a User-Agent
    const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)]

    // Add a random delay between 1 and 5 seconds
    await delay(Math.floor(Math.random() * 4000) + 1000)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': userAgent,
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        Referer: 'https://www.goat.com/',
        Origin: 'https://www.goat.com',
        'Accept-Encoding': 'gzip, deflate, br',
        Connection: 'keep-alive',
        'Cache-Control': 'no-cache',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        Pragma: 'no-cache',
        TE: 'trailers',
      },
      credentials: 'include', // Include cookies
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data', details: error.message },
      { status: 500 },
    )
  }
}
