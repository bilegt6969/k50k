import axios from 'axios'

export async function GET() {
  try {
    // Log when the request starts
    console.log('Starting currency API request from Vercel...')

    // Use a longer timeout and log steps
    const response = await axios
      .get('https://hexarate.paikama.co/api/rates/latest/USD?target=MNT', {
        timeout: 10000, // Increase timeout to 10 seconds
        headers: {
          'User-Agent': 'VercelServerlessFunction', // Sometimes helpful for debugging
        },
      })
      .catch((err) => {
        // Log detailed axios error information
        console.error('Axios error details:', {
          message: err.message,
          code: err.code,
          response: err.response
            ? {
                status: err.response.status,
                statusText: err.response.statusText,
                data: err.response.data,
              }
            : 'No response',
          request: err.request
            ? 'Request was made but no response received'
            : 'Request setup failed',
        })
        throw err // Re-throw for the outer catch
      })

    console.log('API response received with status:', response.status)

    // Log the response structure to help debug
    console.log(
      'Response structure:',
      JSON.stringify({
        hasData: !!response.data,
        dataProps: response.data ? Object.keys(response.data) : [],
        hasNestedData: response.data && !!response.data.data,
        nestedDataProps: response.data && response.data.data ? Object.keys(response.data.data) : [],
      }),
    )

    const mntRate = response.data.data.mid

    return new Response(
      JSON.stringify({
        mnt: mntRate || null,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )
  } catch (error) {
    // Enhanced error logging
    console.error('Detailed error in currency API:', {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
      isAxiosError: error.isAxiosError || false,
      config: error.config
        ? {
            url: error.config.url,
            method: error.config.method,
            timeout: error.config.timeout,
          }
        : 'No config',
    })

    return new Response(
      JSON.stringify({
        error: 'Failed to fetch exchange rates',
        details: error.message,
        timestamp: new Date().toISOString(),
      }),
      { status: 500 },
    )
  }
}
