import { useEffect, useState } from 'react'
import axios from 'axios'

interface Product {
  id: string
  name: string
  price: number
  image: string
}

export const useFetchProducts = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('/api/products')
        setProducts(response.data.docs)
      } catch (err) {
        console.error('Failed to fetch products:', err) // Log the error
        setError('Failed to fetch products')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  return { products, loading, error }
}
