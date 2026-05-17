import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/types/product';

/** Cart product - full Product or minimal (id, name + image) from Firebase */
export type CartProduct = Pick<Product, 'id' | 'name'> & {
  mainPictureUrl?: string;
  image_url?: string;
  slug?: string;
};

export interface CartItem {
  product: CartProduct;
  size: string;
  price: number;
  quantity: number;
  image_url?: string;
}

interface CartState {
  cart: CartItem[];
  addToCart: (
    product: Product | CartProduct,
    size: string,
    price: number,
    image_url: string
  ) => void;
  removeFromCart: (productId: string, size: string) => void;
  updateQuantity: (productId: string, size: string, newQuantity: number) => void;
  clearCart: () => void;
  setCart: (newCart: CartItem[]) => void;
}

const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      cart: [],

      addToCart: (product, size, price, image_url) =>
        set((state) => {
          const existingItem = state.cart.find(
            (item) => item.product.id === product.id && item.size === size
          );

          if (existingItem) {
            return {
              cart: state.cart.map((item) =>
                item.product.id === product.id && item.size === size
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              ),
            };
          }
          return {
            cart: [
              ...state.cart,
              { product, size, price, quantity: 1, image_url },
            ],
          };
        }),

      removeFromCart: (productId, size) =>
        set((state) => ({
          cart: state.cart.filter(
            (item) => !(item.product.id === productId && item.size === size)
          ),
        })),

      updateQuantity: (productId, size, newQuantity) =>
        set((state) => ({
          cart: state.cart.map((item) =>
            item.product.id === productId && item.size === size
              ? { ...item, quantity: newQuantity }
              : item
          ),
        })),

      clearCart: () => set({ cart: [] }),

      setCart: (newCart) => set({ cart: newCart }),
    }),
    {
      name: 'cart-storage',
      skipHydration: false,
    }
  )
);

export default useCartStore;
