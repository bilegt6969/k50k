'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/collections', label: 'Collections' },
];

export default function AdminNavbar() {
  const pathname = usePathname();

  if (pathname.startsWith('/admin/login')) {
    return null;
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-2 pt-4 md:px-4">
      <div className="inline-flex h-11 w-fit max-w-[calc(100vw-1rem)] items-center gap-2 rounded-full border border-white/20 bg-black/70 px-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:h-12 sm:max-w-[calc(100vw-2rem)] sm:px-3.5">
        <div className="flex items-center gap-1.5">
          <Link
            href="/admin/dashboard"
            className="rounded-full border border-neutral-700 bg-[#232323] px-3 py-1 text-sm font-semibold text-white transition-colors hover:bg-neutral-900"
          >
            Admin
          </Link>
          <span className="hidden text-xs uppercase tracking-wide text-white/45 sm:inline">
            Control Panel
          </span>
        </div>

        <nav className="flex items-center gap-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-2 py-1 text-xs font-medium transition-all sm:px-2.5 sm:text-sm ${
                  isActive
                    ? 'bg-white text-black'
                    : 'text-white/75 hover:bg-neutral-800 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/"
          className="rounded-full border border-white/15 px-2 py-1 text-xs text-white/80 transition-colors hover:bg-neutral-800 hover:text-white sm:px-2.5 sm:text-sm"
        >
          View Store
        </Link>
      </div>
    </header>
  );
}
