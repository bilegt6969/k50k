'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ShoppingBag, Package, PackageCheck, PackageX } from 'lucide-react'
import { Skeleton } from '@heroui/skeleton'
import { Button } from '@/components/ui/button'

interface Order {
  id: string;
  date: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  items: { name: string; quantity: number }[];
}

const fetchOrders = async (userId: string): Promise<Order[]> => {
  console.log("Fetching orders for user:", userId);
  await new Promise(resolve => setTimeout(resolve, 1500));

  return [
    { id: 'ORD-123XYZ', date: '2025-03-15', status: 'delivered', total: 125000, items: [{ name: 'Product A', quantity: 1 }, { name: 'Product B', quantity: 2 }] },
    { id: 'ORD-456ABC', date: '2025-04-01', status: 'shipped', total: 75000, items: [{ name: 'Product C', quantity: 1 }] },
    { id: 'ORD-789DEF', date: '2025-04-04', status: 'processing', total: 210000, items: [{ name: 'Product D', quantity: 3 }] },
    { id: 'ORD-101GHI', date: '2025-01-20', status: 'cancelled', total: 50000, items: [{ name: 'Product E', quantity: 1 }] },
  ];
};

const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    const init = async () => {
      const { auth } = await import('@/firebaseConfig')
      const { onAuthStateChanged } = await import('firebase/auth')
      unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
          try {
            const fetchedOrders = await fetchOrders(currentUser.uid)
            setOrders(fetchedOrders)
          } catch (error) {
            console.error("Error fetching orders:", error)
          } finally {
            setLoading(false)
          }
        } else {
          router.replace('/')
          setLoading(false)
        }
      })
    }
    init()
    return () => { unsubscribe?.() }
  }, [router])

  const getStatusInfo = (status: Order['status']) => {
    switch (status) {
      case 'delivered': return { text: 'Хүргэгдсэн', color: 'text-green-400', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/30', Icon: PackageCheck };
      case 'shipped': return { text: 'Илгээсэн', color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30', Icon: Package };
      case 'processing': return { text: 'Боловсруулж байна', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/30', Icon: Package };
      case 'pending': return { text: 'Хүлээгдэж байна', color: 'text-orange-400', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/30', Icon: Package };
      case 'cancelled': return { text: 'Цуцлагдсан', color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30', Icon: PackageX };
      default: return { text: status, color: 'text-neutral-400', bgColor: 'bg-neutral-500/10', borderColor: 'border-neutral-500/30', Icon: Package };
    }
  };

  return (
    <div className="relative inset-0 overflow-y-auto bg-black min-h-screen text-white p-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/account" className="inline-flex items-center text-neutral-400 hover:text-white transition-colors mb-6 group">
          <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Миний булан руу буцах
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-medium text-white tracking-tight">Захиалгын түүх</h1>
          <p className="text-neutral-400 text-lg mt-1">Өмнөх захиалгуудаа хянах.</p>
        </div>

        <div className="bg-neutral-900/40 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-neutral-800/50 shadow-lg">
          {loading ? (
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border border-neutral-800 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-40 mb-3" />
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-9 w-20 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : orders.length > 0 ? (
            <div className="space-y-6">
              {orders.map((order) => {
                const statusInfo = getStatusInfo(order.status);
                return (
                  <div key={order.id} className="border border-neutral-800 rounded-xl p-4 sm:p-5 hover:bg-neutral-800/30 transition-colors duration-200">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-3 gap-2">
                      <p className="font-semibold text-lg text-white">Захиалга #{order.id.replace('ORD-', '')}</p>
                    <span className={`text-xs font-medium px-3 py-1 rounded-full border ${statusInfo.color} ${statusInfo.bgColor} ${statusInfo.borderColor} inline-flex items-center`}>
                        <statusInfo.Icon className="h-3.5 w-3.5 mr-1.5" />
                        {statusInfo.text}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-400 mb-3">
                      Огноо: {new Date(order.date).toLocaleDateString('mn-MN', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                      <p className="font-medium text-white">
                        Нийт дүн: {order.total.toLocaleString('mn-MN')}₮
                      </p>
                      <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300 hover:bg-neutral-700/50 rounded-full text-sm px-4 py-1">
                        Дэлгэрэнгүй
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <ShoppingBag className="h-16 w-16 mx-auto text-neutral-600 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Захиалгын түүх хоосон байна</h3>
              <p className="text-neutral-400 mb-6">Та одоогоор ямар нэгэн захиалга хийгээгүй байна.</p>
              <Link href="/">
                <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-6 py-2 font-medium">
                  Дэлгүүр хэсэх
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default OrdersPage


