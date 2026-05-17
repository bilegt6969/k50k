'use client'

import { auth } from '@/firebaseConfig'
import { User, onAuthStateChanged } from 'firebase/auth'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar } from '@heroui/react'
import {
  Mail,
  User as UserIcon,
  Settings,
  ShoppingBag,
  LogOut,
  CreditCard,
  HelpCircle,
  Lock,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import Link from 'next/link'
import { Skeleton } from '@heroui/skeleton'

const AccountPage = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
      if (!currentUser) {
        router.replace('/')
      }
    })
    return () => unsubscribe()
  }, [router])

  const handleSignOut = async () => {
    try {
      await auth.signOut()
      toast.success('Амжилттай гарлаа')
      router.push('/')
    } catch {
      toast.error('Гарахад алдаа гарлаа')
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 overflow-y-auto bg-black min-h-screen">
        <div className="max-w-6xl mx-auto px-4 py-24">
          <div className="bg-neutral-900/40 backdrop-blur-lg rounded-2xl p-8 border border-neutral-800/50">
            <div className="flex flex-col md:flex-row gap-12">
              {/* Left side skeleton */}
              <div className="w-full md:w-1/3">
                <div className="flex flex-col items-center">
                  <Skeleton className="h-28 w-28 rounded-full mb-6" />
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-64 mb-6" />
                  <Skeleton className="h-12 w-full rounded-full mb-6" />
                </div>
              </div>

              {/* Right side skeleton */}
              <div className="w-full md:w-2/3">
                <Skeleton className="h-10 w-64 mb-8" />
                
                {/* Quick actions skeleton */}
                <div className="grid grid-cols-2 gap-4 mb-12">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                  ))}
                </div>
                
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-64 mb-6" />
                
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="fixed inset-0 overflow-y-auto bg-black min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-20">
        {/* Header section with clean typography */}
        <div className="mb-8">
          <h1 className="text-3xl font-medium text-white tracking-tight">Хувийн хэсэг</h1>
          <p className="text-neutral-400 text-lg mt-1">Дансны удирдлагын төв</p>
        </div>
        
        <div className="bg-neutral-900/40 backdrop-blur-lg rounded-2xl p-8 border border-neutral-800/50 shadow-xl">
          <div className="flex flex-col md:flex-row gap-12">
            {/* Left side - Profile info */}
            <div className="w-full md:w-1/3">
              <div className="flex flex-col items-center">
                <div className="relative group mb-6">
                  <Avatar
                    src={user.photoURL || undefined}
                    className="h-28 w-28 border-2 border-neutral-800 shadow-xl group-hover:border-purple-500 transition-all"
                    fallback={
                      <div className="flex items-center justify-center h-full w-full bg-gradient-to-br from-purple-900 to-purple-600 text-white">
                        <UserIcon className="h-12 w-12" />
                      </div>
                    }
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-black/50 backdrop-blur rounded-full p-3 text-white">
                      <UserIcon className="h-5 w-5" />
                    </div>
                  </div>
                </div>

                <h1 className="text-2xl font-medium text-white text-center">
                  {user.displayName || 'Нэргүй хэрэглэгч'}
                </h1>
                <p className="text-neutral-400 text-center mb-8">{user.email}</p>

                <Button
                  variant="outline"
                  className="w-full mb-8 border-neutral-800 hover:bg-neutral-800 hover:text-white rounded-full py-6 text-sm font-medium transition-all"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Системээс гарах
                </Button>

                <div className="w-full space-y-4 bg-neutral-800/30 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">Төлөв</span>
                    <span className={`${user.emailVerified ? 'text-green-400' : 'text-amber-400'} font-medium`}>
                      {user.emailVerified ? 'Баталгаажсан' : 'Баталгаажаагүй'}
                    </span>
                  </div>
                  <div className="h-px bg-neutral-800 w-full"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">Гишүүнчлэл эхэлсэн</span>
                    <span className="text-white font-medium">
                      {user.metadata.creationTime &&
                        new Date(user.metadata.creationTime).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Account info */}
            <div className="w-full md:w-2/3">
              <h2 className="text-2xl font-medium text-white mb-8">Хяналтын самбар</h2>

              {/* Quick actions - Apple-like cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                <Link href="/account/profile" className="block">
                  <div className="bg-gradient-to-br from-purple-900/40 to-purple-600/10 border border-purple-800/30 p-6 rounded-2xl  transition-all duration-300">
                    <div className="flex items-center justify-between mb-2">
                      <div className="bg-purple-500/20 p-3 rounded-xl">
                        <UserIcon className="h-6 w-6 text-purple-400" />
                      </div>
                      <ChevronRight className="h-5 w-5 text-neutral-500" />
                    </div>
                    <h3 className="text-lg font-medium text-white mt-4">Хувийн мэдээлэл</h3>
                    <p className="text-neutral-400 text-sm mt-1">Профайлаа засах</p>
                  </div>
                </Link>
                
                <Link href="/account/orders" className="block">
                  <div className="bg-gradient-to-br from-blue-900/40 to-blue-600/10 border border-blue-800/30 p-6 rounded-2xl  transition-all duration-300">
                    <div className="flex items-center justify-between mb-2">
                      <div className="bg-blue-500/20 p-3 rounded-xl">
                        <ShoppingBag className="h-6 w-6 text-blue-400" />
                      </div>
                      <ChevronRight className="h-5 w-5 text-neutral-500" />
                    </div>
                    <h3 className="text-lg font-medium text-white mt-4">Захиалгууд</h3>
                    <p className="text-neutral-400 text-sm mt-1">Захиалгын түүх</p>
                  </div>
                </Link>
                
                <Link href="/account/payment" className="block">
                  <div className="bg-gradient-to-br from-green-900/40 to-green-600/10 border border-green-800/30 p-6 rounded-2xl  transition-all duration-300">
                    <div className="flex items-center justify-between mb-2">
                      <div className="bg-green-500/20 p-3 rounded-xl">
                        <CreditCard className="h-6 w-6 text-green-400" />
                      </div>
                      <ChevronRight className="h-5 w-5 text-neutral-500" />
                    </div>
                    <h3 className="text-lg font-medium text-white mt-4">Төлбөр</h3>
                    <p className="text-neutral-400 text-sm mt-1">Төлбөрийн аргууд</p>
                  </div>
                </Link>
                
                <Link href="/account/settings" className="block">
                  <div className="bg-gradient-to-br from-orange-900/40 to-orange-600/10 border border-orange-800/30 p-6 rounded-2xl  transition-all duration-300">
                    <div className="flex items-center justify-between mb-2">
                      <div className="bg-orange-500/20 p-3 rounded-xl">
                        <Settings className="h-6 w-6 text-orange-400" />
                      </div>
                      <ChevronRight className="h-5 w-5 text-neutral-500" />
                    </div>
                    <h3 className="text-lg font-medium text-white mt-4">Тохиргоо</h3>
                    <p className="text-neutral-400 text-sm mt-1">Дансны тохиргоо</p>
                  </div>
                </Link>
              </div>

              {/* Account info */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-medium text-white">Дансны мэдээлэл</h3>
                  <p className="text-neutral-400">
                    Дансны хувийн мэдээллийг удирдана уу
                  </p>
                </div>

                <div className="bg-neutral-800/30 rounded-2xl overflow-hidden border border-neutral-800/50">
                  <div className="flex items-center justify-between p-5 hover:bg-neutral-800/50 transition-colors border-b border-neutral-800/50">
                    <div className="flex items-center">
                      <div className="bg-neutral-700/50 p-2 rounded-full mr-4">
                        <Mail className="h-5 w-5 text-neutral-300" />
                      </div>
                      <div>
                        <p className="font-medium text-white">Имэйл хаяг</p>
                        <p className="text-sm text-neutral-400">{user.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-purple-400 hover:text-purple-300 hover:bg-neutral-700/50 rounded-full"
                    >
                      Солих <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-5 hover:bg-neutral-800/50 transition-colors border-b border-neutral-800/50">
                    <div className="flex items-center">
                      <div className="bg-neutral-700/50 p-2 rounded-full mr-4">
                        <Lock className="h-5 w-5 text-neutral-300" />
                      </div>
                      <div>
                        <p className="font-medium text-white">Нууц үг</p>
                        <p className="text-sm text-neutral-400">Сүүлд өөрчилсөн: 2 сарын өмнө</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-purple-400 hover:text-purple-300 hover:bg-neutral-700/50 rounded-full"
                    >
                      Солих <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-5 hover:bg-neutral-800/50 transition-colors">
                    <div className="flex items-center">
                      <div className="bg-neutral-700/50 p-2 rounded-full mr-4">
                        <HelpCircle className="h-5 w-5 text-neutral-300" />
                      </div>
                      <div>
                        <p className="font-medium text-white">Тусламж</p>
                        <p className="text-sm text-neutral-400">Дансны тусламж авах</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-purple-400 hover:text-purple-300 hover:bg-neutral-700/50 rounded-full"
                    >
                      Холбоо барих <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-12 text-center">
                <p className="text-neutral-400">
                  Тусламж хэрэгтэй юу?{' '}
                  <Link href="/support" className="text-purple-400 hover:text-purple-300 transition-colors">
                    Дэмжлэгийн багтай холбогдох
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountPage