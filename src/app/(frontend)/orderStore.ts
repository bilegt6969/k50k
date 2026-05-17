// app/store/orderStore.ts
import { create } from 'zustand'

interface OrderState {
  transferCode: string
  orderNumber: string
  setTransferCode: (code: string) => void
  setOrderNumber: (number: string) => void
  clearOrder: () => void
}

const useOrderStore = create<OrderState>((set) => ({
  transferCode: '',
  orderNumber: '',
  setTransferCode: (code) => set({ transferCode: code }),
  setOrderNumber: (number) => set({ orderNumber: number }),
  clearOrder: () => set({ transferCode: '', orderNumber: '' }),
}))

export default useOrderStore
