'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  Boxes,
  CircleHelp,
  ClipboardList,
  LayoutDashboard,
  PackageCheck,
  Settings,
  ShoppingBag,
} from 'lucide-react'

import { Toaster } from 'sonner'

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { href: '/admin/products', label: 'Products', icon: ShoppingBag },
  { href: '/admin/products/manage', label: 'Inventory', icon: PackageCheck },
  { href: '/admin/collections', label: 'Collections', icon: Boxes },
]

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  const toaster = (
    <Toaster position="bottom-right" richColors theme="light" closeButton />
  )

  if (pathname.startsWith('/admin/login')) {
    return (
      <>
        {children}
        {toaster}
      </>
    )
  }

  return (
    <>
    <div className="h-screen overflow-hidden bg-zinc-100 text-zinc-900">
      <div className="grid h-full grid-cols-1 lg:grid-cols-[250px_1fr]">
        <aside className="border-r border-zinc-200 bg-white p-4 shadow-sm lg:h-screen">
          <div className="mb-6 flex items-center gap-2 rounded-xl bg-zinc-100 px-3 py-2">
            <div className="rounded-md bg-zinc-900 p-1.5">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-zinc-900">Admin Panel</span>
          </div>

          <nav className="space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-zinc-200 font-medium text-zinc-900'
                      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="mt-6 space-y-1.5 border-t border-zinc-200 pt-4">
            <Link
              href="/shop-all"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            >
              <Settings className="h-4 w-4" />
              View Store
            </Link>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            >
              <CircleHelp className="h-4 w-4" />
              Help
            </button>
          </div>
        </aside>

        <main className="h-screen overflow-y-auto bg-zinc-100 px-4 py-5 md:px-6 md:py-6">{children}</main>
      </div>
    </div>
    {toaster}
    </>
  )
}
