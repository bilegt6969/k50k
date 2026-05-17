'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import useCartStore, { type CartItem } from '@/app/store/cartStore';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { X, ShoppingBag, Plus, Minus, ShoppingCart, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { auth, db } from '@/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface CartPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartPanel({ isOpen, onClose }: CartPanelProps) {
  const { cart, removeFromCart, clearCart, updateQuantity, setCart } = useCartStore();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isUpdatingQuantity, setIsUpdatingQuantity] = useState<{ [key: string]: boolean }>({});
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Function to save cart to Firestore
  const saveCartToFirestore = useCallback(async (userId: string, currentCart: CartItem[]) => {
    if (!userId) return;
    try {
      const userCartRef = doc(db, 'userCarts', userId);
      const serializableCart = currentCart.map(item => ({
        ...item,
        product: { ...item.product }
      }));
      await setDoc(userCartRef, { cart: serializableCart }, { merge: true });
    } catch (error) {
      console.error('Error saving cart to Firestore:', error);
      toast.error('Сагсыг хадгалж чадсангүй.');
    }
  }, []);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Calculate totals
  const subtotal = cart.reduce((sum: number, item: CartItem) => sum + item.price * item.quantity, 0);
  const commission = cart.reduce((sum: number, item: CartItem) => sum + (item.price * item.quantity * 0.15), 0);
  const deliveryFee = 5000;
  const total = subtotal + commission + deliveryFee;
  const itemCount = cart.reduce((count: number, item: CartItem) => count + item.quantity, 0);

  const handleCheckout = () => {
    if (!user) {
      toast.warning('Төлбөр хийхийн тулд эхлээд нэвтэрнэ үү.');
      router.push('/auth/login');
      onClose();
      return;
    }
    if (cart.length === 0) {
      toast.warning('Таны сагс хоосон байна');
      return;
    }
    router.push('/payment');
    onClose();
  };

  const handleRemoveItem = async (id: string, size: string) => {
    const originalCart = [...cart];
    removeFromCart(id, size);
    toast.success('Бараа сагснаас хасагдлаа');

    if (user) {
      try {
        const updatedCart = originalCart.filter((item: CartItem) => !(item.product.id === id && item.size === size));
        await saveCartToFirestore(user.uid, updatedCart);
      } catch (error) {
        console.error('Error removing item from Firestore:', error);
        setCart(originalCart);
      }
    }
  };

  const handleQuantityChange = useCallback(async (id: string, size: string, newQuantity: number) => {
    const itemKey = `${id}-${size}`;
    const originalItem = cart.find((item: CartItem) => item.product.id === id && item.size === size);
    const originalQuantity = originalItem?.quantity || 0;

    if (updateQuantity) {
      updateQuantity(id, size, newQuantity);
    }

    setIsUpdatingQuantity(prev => ({ ...prev, [itemKey]: true }));

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        if (user) {
          let updatedCart = cart.map((item: CartItem) =>
            item.product.id === id && item.size === size
              ? { ...item, quantity: newQuantity }
              : item
          );

          if (newQuantity < 1) {
            updatedCart = updatedCart.filter((item: CartItem) => !(item.product.id === id && item.size === size));
          }

          await saveCartToFirestore(user.uid, updatedCart);
        }
      } catch (error) {
        console.error('Error updating quantity in Firestore:', error);
        if (updateQuantity) {
          updateQuantity(id, size, originalQuantity);
        }
      } finally {
        setIsUpdatingQuantity(prev => {
          const newState = { ...prev };
          delete newState[itemKey];
          return newState;
        });
      }
    }, 500);
  }, [cart, user, updateQuantity, saveCartToFirestore]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[480px] bg-neutral-950 shadow-2xl z-[151] flex flex-col border-l border-neutral-800"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-white">Таны Сагс</h2>
                <Badge variant="secondary" className="bg-white/10 text-white rounded-full px-3 py-1 text-sm">
                  {itemCount}
                </Badge>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
                aria-label="Close cart"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-neutral-800/50 mb-6 border border-neutral-700">
                    <ShoppingBag className="h-10 w-10 text-neutral-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-100 mb-2">Таны сагс хоосон байна</h3>
                  <p className="text-neutral-400 mb-6">
                    Дэлгүүрт зочлоод хүссэн бүтээгдэхүүнээ сонгоно уу
                  </p>
                  <Button
                    onClick={onClose}
                    className="bg-white hover:bg-neutral-100 text-black font-medium px-6 py-3 rounded-full"
                  >
                    Дэлгүүр рүү буцах
                  </Button>
                </div>
              ) : (
                <AnimatePresence>
                  {cart.map((item: CartItem) => {
                    const itemKey = `${item.product.id}-${item.size}`;
                    const isItemUpdating = isUpdatingQuantity[itemKey];

                    return (
                      <motion.div
                        key={itemKey}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 hover:border-neutral-700 transition-colors"
                      >
                        <div className="flex gap-4">
                          {/* Product Image */}
                          <Link href={`/product/${item.product.id}`} onClick={onClose}>
                            <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-white flex-shrink-0">
                              {item.product.mainPictureUrl || item.product.image_url ? (
                                <Image
                                  src={item.product.mainPictureUrl || item.product.image_url!}
                                  alt={item.product.name}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                  sizes="80px"
                                />
                              ) : (
                                <div className="flex items-center justify-center h-full w-full text-neutral-600">
                                  <ShoppingBag className="h-8 w-8" />
                                </div>
                              )}
                            </div>
                          </Link>

                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <Link href={`/product/${item.product.id}`} onClick={onClose}>
                              <h3 className="font-medium text-white text-sm mb-2 truncate hover:text-neutral-300 transition-colors">
                                {item.product.name}
                              </h3>
                            </Link>

                            <div className="flex items-center gap-2 mb-3">
                              <Badge variant="secondary" className="bg-neutral-800 text-neutral-300 border-neutral-700 rounded-md px-2 py-0.5 text-xs">
                                {item.size}
                              </Badge>
                            </div>

                            <div className="flex items-center justify-between">
                              {/* Quantity Controls */}
                              <div className="flex items-center border border-neutral-700 rounded-full overflow-hidden h-8">
                                <button
                                  onClick={() => handleQuantityChange(item.product.id, item.size, item.quantity - 1)}
                                  className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors disabled:opacity-50"
                                  disabled={item.quantity <= 1 || isItemUpdating}
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="flex items-center justify-center h-8 min-w-[32px] px-2 text-sm font-medium text-white">
                                  {isItemUpdating ? (
                                    <svg className="animate-spin h-3 w-3 text-neutral-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  ) : (
                                    item.quantity
                                  )}
                                </span>
                                <button
                                  onClick={() => handleQuantityChange(item.product.id, item.size, item.quantity + 1)}
                                  className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
                                  disabled={isItemUpdating}
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>

                              {/* Price */}
                              <p className="text-sm font-semibold text-white">
                                {(item.price * item.quantity).toLocaleString()}₮
                              </p>
                            </div>
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={() => handleRemoveItem(item.product.id, item.size)}
                            className="p-2 rounded-full text-neutral-500 hover:bg-neutral-800 hover:text-red-400 transition-colors self-start"
                            aria-label="Remove item"
                            disabled={isItemUpdating}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>

            {/* Footer - Order Summary & Checkout */}
            {cart.length > 0 && (
              <div className="border-t border-neutral-800 p-6 bg-neutral-950">
                {/* Price Breakdown */}
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between text-neutral-400">
                    <span>Барааны нийт ({itemCount}):</span>
                    <span className="text-white font-medium">{subtotal.toLocaleString()}₮</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Үйлчилгээний төлбөр (15%):</span>
                    <span className="text-white font-medium">{commission.toLocaleString()}₮</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Хүргэлт:</span>
                    <span className="text-white font-medium">{deliveryFee.toLocaleString()}₮</span>
                  </div>
                </div>

                <Separator className="bg-neutral-800 mb-4" />

                {/* Total */}
                <div className="flex justify-between text-lg font-semibold mb-6">
                  <span className="text-white">Нийт:</span>
                  <span className="text-white">{total.toLocaleString()}₮</span>
                </div>

                {/* Checkout Button */}
                <Button
                  size="lg"
                  className="w-full bg-white text-black hover:bg-neutral-100 rounded-full py-6 font-medium shadow-lg hover:shadow-xl transition-all"
                  onClick={handleCheckout}
                  disabled={Object.keys(isUpdatingQuantity).length > 0}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Төлбөр хийх
                </Button>

                {!user && (
                  <p className="text-xs text-center text-neutral-400 mt-3">
                    Төлбөр хийхийн тулд эхлээд нэвтэрнэ үү
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}