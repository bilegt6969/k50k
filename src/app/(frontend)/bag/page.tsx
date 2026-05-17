'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import useCartStore, { type CartItem } from '@/app/store/cartStore';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Trash2, ArrowLeft, ShoppingBag, Plus, Minus, ShoppingCart, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast, Toaster } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { auth, db } from '@/firebaseConfig'; // Import db from firebaseConfig
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore'; // Import Firestore functions

// Skeleton loader component for cart items
const CartItemSkeleton = () => (
  <div className="flex items-start p-4 sm:p-5 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-md animate-pulse">
    <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-neutral-800 flex-shrink-0"></div>
    <div className="flex flex-col justify-between h-full flex-1 ml-4 sm:ml-5 space-y-2">
      <div className="h-5 bg-neutral-700 rounded w-3/4"></div>
      <div className="flex items-center gap-2">
        <div className="h-4 bg-neutral-700 rounded w-1/4"></div>
        <div className="h-8 bg-neutral-700 rounded-full w-24"></div>
      </div>
      <div className="h-5 bg-neutral-700 rounded w-1/3"></div>
    </div>
    <div className="p-2 rounded-full bg-neutral-800 ml-1 sm:ml-2">
      <X className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-700" />
    </div>
  </div>
);

// Skeleton loader component for order summary
const OrderSummarySkeleton = () => (
  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-lg animate-pulse">
    <div className="h-6 bg-neutral-700 rounded w-2/3 mb-6"></div>
    <div className="space-y-3 mb-6">
      <div className="flex justify-between">
        <div className="h-4 bg-neutral-700 rounded w-1/2"></div>
        <div className="h-4 bg-neutral-700 rounded w-1/4"></div>
      </div>
      <div className="flex justify-between">
        <div className="h-4 bg-neutral-700 rounded w-1/2"></div>
        <div className="h-4 bg-neutral-700 rounded w-1/4"></div>
      </div>
      <div className="flex justify-between">
        <div className="h-4 bg-neutral-700 rounded w-1/2"></div>
        <div className="h-4 bg-neutral-700 rounded w-1/4"></div>
      </div>
    </div>
    <div className="h-px bg-neutral-700/50 mb-6"></div>
    <div className="flex justify-between text-lg font-semibold mb-8">
      <div className="h-6 bg-neutral-700 rounded w-1/2"></div>
      <div className="h-6 bg-neutral-700 rounded w-1/4"></div>
    </div>
    <div className="h-12 bg-neutral-700 rounded-full w-full"></div>
  </div>
);

export default function BagPage() {
  const { cart, removeFromCart, clearCart, updateQuantity, setCart } = useCartStore();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Loading state for initial cart sync
  const [isLoggingOut, setIsLoggingOut] = useState(false); // New state for logout loading
  // State to track loading for individual quantity updates
  const [isUpdatingQuantity, setIsUpdatingQuantity] = useState<{ [key: string]: boolean }>({});
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null); // For debouncing quantity updates

  // Function to save cart to Firestore
  const saveCartToFirestore = useCallback(async (userId: string, currentCart: CartItem[]) => {
    if (!userId) return; // Only save if user ID is available
    try {
      const userCartRef = doc(db, 'userCarts', userId);
      // Serialize product objects to plain objects for Firestore
      const serializableCart = currentCart.map(item => ({
        ...item,
        product: { ...item.product } // Ensure product is a plain object
      }));
      await setDoc(userCartRef, { cart: serializableCart }, { merge: true });
      console.log('Cart saved to Firestore successfully for user:', userId);
    } catch (error) {
      console.error('Error saving cart to Firestore:', error);
      toast.error('Сагсыг хадгалж чадсангүй.', {
        style: { background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px' },
      });
      throw error; // Re-throw to allow error handling in calling function
    }
  }, []);

  // Function to load cart from Firestore
  const loadCartFromFirestore = useCallback(async (userId: string): Promise<CartItem[]> => {
    if (!userId) return [];
    try {
      const userCartRef = doc(db, 'userCarts', userId);
      const docSnap = await getDoc(userCartRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Ensure data.cart is an array before returning
        if (Array.isArray(data.cart)) {
          return data.cart as CartItem[];
        }
        console.warn('Firestore cart data is not an array for user:', userId);
        return [];
      }
      return [];
    } catch (error) {
      console.error('Error loading cart from Firestore:', error);
      toast.error('Сагсыг татаж чадсангүй.', {
        style: { background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px' },
      });
      throw error; // Re-throw to allow error handling in calling function
    }
  }, []);

  // Effect for handling authentication state changes and cart syncing
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setIsLoading(true); // Start loading for initial sync
      const currentLocalCart = useCartStore.getState().cart; // Get current cart from Zustand

      // Case 1: User logs in (previous user was null or different)
      if (currentUser && (!user || currentUser.uid !== user.uid)) {
        console.log('User logged in:', currentUser.uid);
        setUser(currentUser);

        try {
          const firestoreCart = await loadCartFromFirestore(currentUser.uid);

          // Merge logic: Combine local (guest) cart with Firestore cart
          const mergedCart: CartItem[] = [...firestoreCart];

          currentLocalCart.forEach((localItem: CartItem) => { // Explicitly type localItem
            const existingRemoteItemIndex = mergedCart.findIndex(
              (remoteItem: CartItem) => remoteItem.product.id === localItem.product.id && remoteItem.size === localItem.size
            );

            if (existingRemoteItemIndex > -1) {
              // Item exists in both, update quantity (sum them up)
              mergedCart[existingRemoteItemIndex].quantity += localItem.quantity;
            } else {
              // Item only in local cart, add it to merged cart
              mergedCart.push(localItem);
            }
          });

          // Update Firestore with the merged cart
          await saveCartToFirestore(currentUser.uid, mergedCart);
          // Update Zustand store with the merged cart
          setCart(mergedCart);
          toast.success('Сагсны мэдээлэл шинэчлэгдлээ!', {
            style: { background: '#22c55e', color: 'white', border: 'none', borderRadius: '12px' },
            duration: 2000,
          });
        } catch (error) {
          console.error("Error during login cart sync:", error);
          toast.error("Нэвтрэх үед сагсыг синк хийхэд алдаа гарлаа.", {
            style: { background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px' },
          });
        } finally {
          setIsLoading(false); // End loading
        }

      }
      // Case 2: User logs out (previous user was not null)
      else if (!currentUser && user) {
        console.log('User logged out. Saving current cart to Firestore for:', user.uid);
        setIsLoggingOut(true); // Start logout loading
        try {
          // Save the cart of the user who just logged out
          await saveCartToFirestore(user.uid, currentLocalCart);
          toast.info('Таны сагс хадгалагдлаа.', {
            style: { background: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px' },
            duration: 2000,
          });
        } catch (error) {
          console.error("Error saving cart on logout:", error);
          toast.error("Гарах үед сагсыг хадгалахад алдаа гарлаа.", {
            style: { background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px' },
          });
        } finally {
          setUser(null); // Clear user state
          setIsLoggingOut(false); // End logout loading
          setIsLoading(false); // End loading
        }
      }
      // Case 3: Initial load or user state unchanged (e.g., page refresh while logged in)
      else if (currentUser && user && currentUser.uid === user.uid) {
        // User is already logged in and state is consistent, just load their cart
        try {
          const firestoreCart = await loadCartFromFirestore(currentUser.uid);
          setCart(firestoreCart);
        } catch (error) {
          console.error("Error loading cart for existing user:", error);
          toast.error("Одоогийн хэрэглэгчийн сагсыг татаж чадсангүй.", {
            style: { background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px' },
          });
        } finally {
          setIsLoading(false); // End loading
        }
      } else if (!currentUser && !user) {
        // User is a guest and remains a guest. Cart is already handled by Zustand's persist.
        console.log('Guest user session. No Firestore sync needed for initial load.');
        setIsLoading(false); // End loading for guest
      }
    });

    return () => {
      unsubscribe(); // Cleanup subscription on component unmount
      // Clear any pending debounce timeout on unmount
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [user, saveCartToFirestore, loadCartFromFirestore, setCart]); // Depend on user, and the memoized functions

  // Calculate subtotal (sum of all items' prices * quantities)
  const subtotal = cart.reduce((sum: number, item: CartItem) => sum + item.price * item.quantity, 0);

  // Calculate commission (15% of each item's price * quantity)
  const commission = cart.reduce((sum: number, item: CartItem) => {
    return sum + (item.price * item.quantity * 0.15);
  }, 0);

  // Fixed delivery fee
  const deliveryFee = 5000;

  // Calculate total (subtotal + commission + delivery)
  const total = subtotal + commission + deliveryFee;

  const itemCount = cart.reduce((count: number, item: CartItem) => count + item.quantity, 0);

  const handleCheckout = () => {
    if (!user) {
      toast.warning('Төлбөр хийхийн тулд эхлээд нэвтэрнэ үү.', {
        style: { background: '#f97316', color: 'white', border: 'none', borderRadius: '12px' },
        duration: 3000,
      });
      router.push('/auth/login');
      return;
    }
    if (cart.length === 0) {
      toast.warning('Таны сагс хоосон байна', {
        style: { background: '#f97316', color: 'white', border: 'none', borderRadius: '12px' },
        duration: 3000,
      });
      return;
    }
    router.push('/payment');
  };

  const handleRemoveItem = async (id: string, size: string) => {
    const originalCart = [...cart]; // Capture current cart for potential revert
    removeFromCart(id, size); // Optimistic UI update
    toast.success('Бараа сагснаас хасагдлаа', {
      style: { background: '#22c55e', color: 'white', border: 'none', borderRadius: '12px' },
      duration: 2000,
    });

    if (user) {
      try {
        const updatedCart = originalCart.filter((item: CartItem) => !(item.product.id === id && item.size === size)); // Explicitly type item
        await saveCartToFirestore(user.uid, updatedCart);
      } catch (error) {
        console.error('Error removing item from Firestore:', error);
        toast.error('Барааг хасахад алдаа гарлаа.', {
          style: { background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px' },
        });
        setCart(originalCart); // Revert UI on error
      }
    }
  };

  const handleClearCart = async () => {
    const originalCart = [...cart]; // Capture current cart for potential revert
    clearCart(); // Optimistic UI update
    toast.success('Сагс цэвэрлэгдлээ', {
      style: { background: '#22c55e', color: 'white', border: 'none', borderRadius: '12px' },
      duration: 2000,
    });

    if (user) {
      try {
        await saveCartToFirestore(user.uid, []);
      } catch (error) {
        console.error('Error clearing cart from Firestore:', error);
        toast.error('Сагсыг цэвэрлэхэд алдаа гарлаа.', {
          style: { background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px' },
        });
        setCart(originalCart); // Revert UI on error
      }
    }
  };

  const handleQuantityChange = useCallback(async (id: string, size: string, newQuantity: number) => {
    const itemKey = `${id}-${size}`;
    const originalItem = cart.find((item: CartItem) => item.product.id === id && item.size === size); // Explicitly type item
    const originalQuantity = originalItem?.quantity || 0;

    // Immediately update Zustand store for optimistic UI
    if (updateQuantity) {
      updateQuantity(id, size, newQuantity);
    } else {
      console.error('updateQuantity function is not available in cart store');
      toast.error('Тоо ширхэг шинэчилж чадсангүй', {
        style: { background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px' },
      });
      return; // Prevent further action if updateQuantity is missing
    }

    // Set loading state for this specific item
    setIsUpdatingQuantity(prev => ({ ...prev, [itemKey]: true }));

    // Clear any previous debounce timeout for this specific item
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set a new debounce timeout
    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        if (user) {
          let updatedCart = cart.map((item: CartItem) => // Explicitly type item
            item.product.id === id && item.size === size
              ? { ...item, quantity: newQuantity }
              : item
          );

          // Handle removal case correctly for Firestore if newQuantity is 0 or less
          if (newQuantity < 1) {
            updatedCart = updatedCart.filter((item: CartItem) => !(item.product.id === id && item.size === size)); // Explicitly type item
          }

          await saveCartToFirestore(user.uid, updatedCart);
          // Only show toast if it's a successful change, not for every debounce
          // toast.success('Тоо ширхэг шинэчлэгдлээ', { duration: 1000 });
        }
      } catch (error) {
        console.error('Error updating quantity in Firestore:', error);
        toast.error('Тоо ширхэг шинэчилж чадсангүй: Алдаа гарлаа.', {
          style: { background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px' },
        });
        // Revert the optimistic UI update if Firestore save fails
        if (updateQuantity) {
          updateQuantity(id, size, originalQuantity); // Revert to original quantity
        }
      } finally {
        setIsUpdatingQuantity(prev => { // Clear loading state regardless of success/failure
          const newState = { ...prev };
          delete newState[itemKey];
          return newState;
        });
      }
    }, 500); // Debounce for 500ms
  }, [cart, user, updateQuantity, saveCartToFirestore]); // Dependencies for useCallback

  return (
    <div className="min-h-screen bg-black text-neutral-100 pt-24 pb-12 px-4 sm:px-6 lg:px-8 ">
      <Toaster position="bottom-right" className="z-[100]" />

      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-wrap items-center justify-between gap-y-4 mb-8">
          <div className="flex items-center gap-2 sm:gap-3">
            <h1 className="text-3xl font-semibold">Таны Сагс</h1>
            <Badge variant="secondary" className="bg-neutral-100 text-neutral-800 rounded-full px-3 py-1 text-sm">
              {itemCount} {itemCount === 1 ? 'бараа' : 'бараа'}
            </Badge>
          </div>
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-neutral-400 hover:text-neutral-100 px-0 hover:bg-transparent text-sm"
            aria-label="Go back to previous page"
          >
            <ArrowLeft className="h-4 w-4" />
            Дэлгүүр рүү буцах
          </Button>
        </div>

        {isLoading || isLoggingOut ? (
  <>
    {/* Show skeleton if initial load or logging out */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 mt-10">
      <div className="lg:col-span-2 space-y-4">
        <CartItemSkeleton />
        <CartItemSkeleton />
      </div>
      <div className="lg:col-span-1">
        <OrderSummarySkeleton />
      </div>
    </div>
  </>
) : cart.length === 0 ? (
          // --- Empty Cart View ---
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-8 sm:p-12 text-center mt-10 flex flex-col items-center">
            <div className="mx-auto flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-neutral-800/50 mb-6 border border-neutral-700">
              <ShoppingBag className="h-8 w-8 sm:h-10 sm:w-10 text-neutral-500" />
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-neutral-100 mb-3">Таны сагс хоосон байна</h2>
            <p className="text-neutral-400 mb-8 max-w-md mx-auto text-base sm:text-lg">
              Дэлгүүрт зочлоод хүссэн бүтээгдэхүүнээ сонгоно уу
            </p>
            <Link href="/">
              <Button size="lg" className="bg-white hover:bg-neutral-100 text-black font-medium px-6 py-4 text-sm sm:px-8 sm:py-5 sm:text-base rounded-full">
                Дэлгүүр рүү буцах
              </Button>
            </Link>
          </div>
        ) : (
          // --- Cart Items and Summary View ---
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-4">
              <AnimatePresence>
                {cart.map((item: CartItem) => { // Explicitly type item
                  const itemKey = `${item.product.id}-${item.size}`;
                  const isItemUpdating = isUpdatingQuantity[itemKey];

                  return (
                    <motion.div
                      key={itemKey}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="flex justify-between items-start p-4 sm:p-4 bg-neutral-900 border border-neutral-800 rounded-4xl shadow-md hover:shadow-neutral-700/30 transition-all duration-300"
                    >
                      <div className="flex items-start gap-4 sm:gap-5 flex-1">
                        {/* Product Image */}
                        <Link href={`/product/${item.product.id}`}>
                          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden bg-white flex-shrink-0 border border-neutral-700">
                            {item.product.mainPictureUrl || item.product.image_url ? (
                              <Image
                                src={item.product.mainPictureUrl || item.product.image_url!}
                                alt={item.product.name}
                                fill
                                className="object-cover"
                                unoptimized
                                sizes="(max-width: 640px) 96px, 112px"
                                loading="lazy"
                                onError={() => console.error(`Failed to load image for ${item.product.name}`)}
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full w-full text-neutral-600">
                                <ShoppingBag className="h-8 w-8" />
                              </div>
                            )}
                          </div>
                        </Link>

                        {/* Product Details */}
                        <div className="flex flex-col justify-between h-full flex-1 mt-0 sm:mt-1 space-y-1.5 sm:space-y-2">
                          <Link href={`/product/${item.product.id}`}>
                            <h2 className={`
                              relative inline-block text-base sm:text-lg font-medium text-neutral-100 leading-tight
                              transition-all duration-600 ease-[cubic-bezier(0.23,1,0.32,1)]
                              before:absolute before:bottom-0 before:left-0 before:h-[2px] before:w-full
                              before:bg-white before:origin-left before:transform before:scale-x-0
                              before:transition-transform before:duration-600 before:ease-[cubic-bezier(0.23,1,0.32,1)]
                              hover:before:scale-x-100 hover:transform hover:translate-y-[-1px]
                              hover:text-white/90
                            `}>
                              {item.product.name}
                            </h2>
                          </Link>

                          {/* Details container */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                            <Badge variant="secondary" className="bg-neutral-800 text-neutral-300 border-neutral-700 rounded-md px-2.5 py-0.5 text-xs self-start">
                              Хэмжээ: {item.size}
                            </Badge>
                            {/* Quantity Controls */}
                            <div className="flex items-center border border-neutral-700 rounded-full overflow-hidden h-8 self-start">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleQuantityChange(item.product.id, item.size, item.quantity - 1);
                                }}
                                className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={item.quantity <= 1 || isItemUpdating} // Disable if updating or quantity is 1
                                aria-label="Decrease quantity"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="flex items-center justify-center h-8 min-w-[32px] px-2 text-sm font-medium bg-neutral-900">
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
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleQuantityChange(item.product.id, item.size, item.quantity + 1);
                                }}
                                className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100 transition-colors"
                                disabled={isItemUpdating} // Disable if updating
                                aria-label="Increase quantity"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                          {/* Price */}
                          <p className="text-base sm:text-lg font-semibold text-neutral-100 pt-1">
                            {(item.price * item.quantity).toLocaleString()}₮
                          </p>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveItem(item.product.id, item.size)}
                        className="p-1.5 sm:p-2 rounded-full text-neutral-500 hover:bg-neutral-800 hover:text-red-400 transition-all flex-shrink-0 ml-1 sm:ml-2"
                        aria-label={`Remove ${item.product.name} from cart`}
                        disabled={isItemUpdating} // Disable remove if quantity is being updated
                      >
                        <X className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Clear Cart Button */}
              {cart.length > 0 && (
                <div className="mt-6 text-right">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleClearCart}
                    className="bg-red-900/50 border border-red-700/50 text-red-300 hover:bg-red-900/80 hover:text-red-200 rounded-lg px-4 py-2"
                    disabled={Object.keys(isUpdatingQuantity).length > 0} // Disable if any item is updating
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Сагс цэвэрлэх
                  </Button>
                </div>
              )}
            </div>

            {/* Order Summary Section */}
            <div className="lg:col-span-1">
              <div className="bg-neutral-900 border border-neutral-800 rounded-4xl p-6 shadow-lg lg:sticky lg:top-24">
                <h2 className="text-xl font-semibold mb-6 text-neutral-100">Захиалгын дэлгэрэнгүй</h2>

                {/* Price Breakdown */}
                <div className="space-y-3 mb-6 text-sm">
                  <div className="flex justify-between text-neutral-300">
                    <span>Барааны нийт дүн ({itemCount}):</span>
                    <span className="font-medium text-neutral-100">{subtotal.toLocaleString()}₮</span>
                  </div>
                  <div className="flex justify-between text-neutral-300">
                    <span>Үйлчилгээний төлбөр (15%):</span>
                    <span className="font-medium text-neutral-100">{commission.toLocaleString()}₮</span>
                  </div>
                  <div className="flex justify-between text-neutral-300">
                    <span>Хүргэлтийн төлбөр:</span>
                    <span className="font-medium text-neutral-100">{deliveryFee.toLocaleString()}₮</span>
                  </div>
                </div>

                <Separator className="bg-neutral-700/50 mb-6" />

                {/* Total Amount */}
                <div className="flex justify-between text-lg font-semibold mb-8 text-neutral-100">
                  <span>Нийт төлөх дүн:</span>
                  <span>{total.toLocaleString()}₮</span>
                </div>

                {/* Checkout Button */}
                <Button
                  size="lg"
                  className="w-full bg-white text-black hover:bg-neutral-100 rounded-full py-4 text-sm sm:py-5 sm:text-base font-medium shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-70"
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || Object.keys(isUpdatingQuantity).length > 0} // Disable if cart empty or any item updating
                >
                  <ShoppingCart className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Төлбөр хийх
                </Button>
                {!user && cart.length > 0 && (
                  <p className="text-xs text-center text-neutral-400 mt-4">
                    Төлбөр хийхийн тулд эхлээд нэвтэрнэ үү.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <style >{`
        body {
          background-color: black;
        }
        .bg-grid-pattern {
          background-image:
            linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out forwards;
          animation-fill-mode: both;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          animation-fill-mode: both;
        }
        /* Improve font rendering */
        body {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        /* Spinner for loading states */
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
