'use client'

import React, { createContext, useContext, useState } from 'react'

interface PageData {
  id?: string
  name?: string
  price?: number
}

interface ProductContextType {
  pageData: PageData | null
  setPageData: (data: PageData | null) => void
}

const ProductContext = createContext<ProductContextType | null>(null)

export const useProductContext = () => {
  const context = useContext(ProductContext)
  if (!context) {
    throw new Error('useProductContext must be used within a ProductProvider')
  }
  return context
}

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pageData, setPageData] = useState<PageData | null>(null)

  return (
    <ProductContext.Provider value={{ pageData, setPageData }}>
      {children}
    </ProductContext.Provider>
  )
}
