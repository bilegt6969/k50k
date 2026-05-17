'use client'
import { useState } from 'react'
import Image from 'next/image' // Import the Image component from next/image

// Define the Invoice type
interface InvoiceUrl {
  link: string
  logo: string
  name: string
  description: string
}

interface Invoice {
  invoice_id: string
  qr_image: string
  qPay_shortUrl: string
  urls: InvoiceUrl[]
}

export default function Cart() {
  const [amount, setAmount] = useState('')
  const [invoice, setInvoice] = useState<Invoice | null>(null) // Use the Invoice type
  const [loading, setLoading] = useState(false)

  const createInvoice = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/qpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      })

      const data: Invoice = await res.json() // Type the API response
      setInvoice(data)
    } catch (error) {
      console.error('Error creating invoice:', error)
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-center p-10">
      <h1 className="text-2xl font-bold mb-4">Enter Payment Amount</h1>
      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="p-2 border rounded-md mb-4 w-64 text-center"
      />
      <button
        onClick={createInvoice}
        className="bg-blue-500 text-white px-4 py-2 rounded-md"
        disabled={loading}
      >
        {loading ? 'Generating...' : 'Generate Invoice'}
      </button>

      {invoice && (
        <div className="mt-6 p-4 border rounded-lg shadow-lg">
          <p className="font-semibold">Invoice ID: {invoice.invoice_id}</p>
          {/* Replace <img> with <Image /> for the QR code */}
          <Image
            src={`data:image/png;base64,${invoice.qr_image}`}
            alt="QR Code"
            width={200} // Set appropriate width
            height={200} // Set appropriate height
            className="mt-4"
          />
          <a
            href={invoice.qPay_shortUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline mt-4 block"
          >
            QPay-р төлбөр хийх
          </a>
          <div className="mt-4">
            <h2 className="text-lg font-semibold">Банкны аппууд:</h2>
            <div className="grid grid-cols-2 gap-4 mt-2">
              {invoice.urls.map((url, index) => (
                <a
                  key={index}
                  href={url.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center p-2 border rounded-lg hover:bg-gray-100"
                >
                  {/* Replace <img> with <Image /> for bank logos */}
                  <Image
                    src={url.logo}
                    alt={url.name}
                    width={48} // Set appropriate width
                    height={48} // Set appropriate height
                    className="w-12 h-12"
                  />
                  <p className="text-sm mt-2 text-center">{url.description}</p>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
