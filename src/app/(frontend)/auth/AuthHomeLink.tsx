'use client';

import Link from 'next/link';
import { Home } from 'lucide-react';

export default function AuthHomeLink() {
  return (
    <Link
      href="/"
      className="fixed top-6 left-6 z-[60] inline-flex items-center gap-2 rounded-full border border-neutral-600 bg-neutral-800/90 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
    >
      <Home className="h-4 w-4" aria-hidden />
      Нүүр хуудас
    </Link>
  );
}
