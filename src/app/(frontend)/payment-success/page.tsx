'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import useOrderStore from '../orderStore';
import { CheckCircle2, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PaymentSuccessPage() {
  const { transferCode, orderNumber, clearOrder } = useOrderStore();

  useEffect(() => {
    return () => clearOrder();
  }, [clearOrder]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 text-neutral-900">
      <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-neutral-100 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 border border-emerald-200 mb-5">
            <CheckCircle2 className="h-9 w-9 text-emerald-600" strokeWidth={2} />
          </div>

          <h1 className="text-2xl font-semibold text-neutral-900 mb-2">Захиалга амжилттай!</h1>
          <p className="text-neutral-600 mb-8">
            Таны захиалга амжилттай хийгдлээ. Төлбөрөө баталгаажуулна уу.
          </p>

          <div className="space-y-4 mb-8">
            {orderNumber && (
              <div className="bg-white rounded-xl border border-neutral-200 p-4 text-left shadow-sm">
                <p className="text-xs font-medium text-neutral-500 mb-1 uppercase tracking-wider">
                  Захиалгын дугаар
                </p>
                <p className="text-lg font-medium text-neutral-900">{orderNumber}</p>
              </div>
            )}

            {transferCode && (
              <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 text-left shadow-sm">
                <p className="text-xs font-medium text-blue-800 mb-1 uppercase tracking-wider">
                  Гүйлгээний утга (Код)
                </p>
                <p className="text-lg font-bold text-blue-950 tracking-wide">{transferCode}</p>
                <p className="text-xs text-blue-900/90 mt-2 leading-relaxed">
                  Банкны шилжүүлэг хийхдээ гүйлгээний утга дээр{' '}
                  <span className="font-semibold">энэ кодыг ЗААВАЛ</span> бичнэ үү.
                </p>
              </div>
            )}
          </div>

          <div className="w-full">
            <Button
              asChild
              size="lg"
              className="w-full bg-neutral-900 hover:bg-neutral-800 rounded-full text-white"
            >
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Нүүр хуудас руу буцах
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
