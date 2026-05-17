'use client';

import Link from 'next/link';
import { HandCoins } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function InvestButton() {
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowText(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed bottom-4 shadow-4xl right-4 md:bottom-2 md:right-4 z-50">
      <div
        className={`mt-1 text-center hidden md:block transition-all duration-800 ease-out delay-500 ${
          showText ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          textShadow: showText ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none',
        }}
      >
        <span className="text-[11px] right-1 leading-tight text-neutral-400">
          Developed by{' '}
          <span className="underline">
            <Link
              href="https://bytecode-smoky.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
            >
              bytecode
            </Link>
          </span>
          🅁
        </span>
      </div>
    </div>
  );
}
