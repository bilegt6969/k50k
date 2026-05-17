'use client'

import { useState, useEffect } from 'react'
import { auth } from '@/firebaseConfig'
import {  onAuthStateChanged } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building2, Smartphone, Copy, CheckCircle, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button' // Assuming component exists

const PaymentPage = () => {
   const [loading, setLoading] = useState(true)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const router = useRouter()

  // Payment information
  const bankDetails = {
    bankName: 'TDB',
    bankAddress: '412065014',
    iban: '520004000'
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
         setLoading(false)
      } else {
        router.replace('/')
        setLoading(false)
      }
    })
    return () => unsubscribe()
  }, [router])

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    }
  }

  if (loading) {
    return (
      <div className="relative inset-0 overflow-y-auto bg-black min-h-screen text-white p-6">
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse">
            <div className="h-6 bg-neutral-700 rounded w-48 mb-6"></div>
            <div className="h-8 bg-neutral-700 rounded w-64 mb-2"></div>
            <div className="h-5 bg-neutral-700 rounded w-96 mb-8"></div>
            <div className="bg-neutral-900/40 rounded-2xl p-8">
              <div className="h-6 bg-neutral-700 rounded w-48 mb-6"></div>
              <div className="space-y-4">
                <div className="h-20 bg-neutral-700 rounded"></div>
                <div className="h-20 bg-neutral-700 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative inset-0 overflow-y-auto bg-black min-h-screen text-white p-6">
      <div className="max-w-3xl mx-auto">
        {/* Back Link */}
        <Link href="/account" className="inline-flex items-center text-neutral-400 hover:text-white transition-colors mb-6 group">
          <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Миний булан руу буцах
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-medium text-white tracking-tight">Төлбөрийн мэдээлэл</h1>
          <p className="text-neutral-400 text-lg mt-1">Банкны шилжүүлэг болон гар утасны гүйлгээгээр төлбөр төлөх.</p>
        </div>

        {/* Payment Methods */}
        <div className="space-y-6">
          {/* Bank Transfer Section */}
          <div className="bg-neutral-900/40 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-neutral-800/50 shadow-lg">
            <div className="flex items-center mb-6 border-b border-neutral-700 pb-4">
              <Building2 className="h-6 w-6 text-blue-400 mr-3" />
              <h2 className="text-xl font-semibold text-white">Банкны шилжүүлэг</h2>
            </div>

            <div className="space-y-4">
              {/* Bank Address */}
              <div className="bg-neutral-800/30 border border-neutral-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-400 mb-1">Банкны нэр</p>
                    <p className="text-lg font-mono text-white tracking-wider">Худалдаа Хөгжлийн Банк AKA {bankDetails.bankName}</p>
                  </div>
                   
                </div>
              </div>
              <div className="bg-neutral-800/30 border border-neutral-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-400 mb-1">Банкны хаяг</p>
                    <p className="text-lg font-mono text-white tracking-wider">{bankDetails.bankAddress}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-neutral-400 hover:text-white hover:bg-neutral-700/50 rounded-full px-3 py-1.5"
                    onClick={() => copyToClipboard(bankDetails.bankAddress, 'bankAddress')}
                  >
                    {copiedField === 'bankAddress' ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* IBAN */}
              <div className="bg-neutral-800/30 border border-neutral-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-400 mb-1">IBAN</p>
                    <p className="text-lg font-mono text-white tracking-wider">{bankDetails.iban}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-neutral-400 hover:text-white hover:bg-neutral-700/50 rounded-full px-3 py-1.5"
                    onClick={() => copyToClipboard(bankDetails.iban, 'iban')}
                  >
                    {copiedField === 'iban' ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-blue-300 text-sm">
                <strong>Анхаар:</strong> Банкны шилжүүлэг хийхдээ захиалгын дугаар эсвэл та нарын нэрийг тэмдэглэл хэсэгт оруулна уу.
              </p>
            </div>
          </div>

          {/* Mobile Transaction Section */}
          <div className="bg-neutral-900/40 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-neutral-800/50 shadow-lg">
            <div className="flex items-center mb-6 border-b border-neutral-700 pb-4">
              <Smartphone className="h-6 w-6 text-green-400 mr-3" />
              <h2 className="text-xl font-semibold text-white">Гар утасны гүйлгээ</h2>
            </div>

            <div className="space-y-4">
              <div className="bg-neutral-800/30 border border-neutral-700/50 rounded-lg p-4">
                <p className="text-white mb-2">Дараах банкуудын гар утасны апп ашиглан төлбөр төлөх боломжтой:</p>
                <ul className="text-neutral-300 space-y-1 text-sm">
                  <li>• Khan Bank мобайл банк</li>
                  <li>• TDB мобайл банк</li>
                  <li>• Golomt Bank мобайл банк</li>
                  <li>• Хаан банкны QPay</li>
                  <li>• SocialPay</li>
                  <li>• MonPay</li>
                </ul>
              </div>

              <div className="bg-neutral-800/30 border border-neutral-700/50 rounded-lg p-4">
                <p className="text-white mb-2 font-medium">Гүйлгээ хийх заавар:</p>
                <ol className="text-neutral-300 space-y-1 text-sm list-decimal list-inside">
                  <li>Банкны аппаа нээгээд &quot;Шилжүүлэг&quot; сонгоно</li>
                  <li>Дээрх банкны хаяг эсвэл IBAN-г оруулна</li>
                  <li>Захиалгын дугаар эсвэл нэрээ тэмдэглэлд бичнэ</li>
                  <li>Төлбөрийн дүн болон баталгаажуулна</li>
                </ol>
              </div>
            </div>

            <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-green-300 text-sm">
                <strong>Зөвлөмж:</strong> Гар утасны гүйлгээ нь хурдан бөгөөд 24/7 боломжтой. Гүйлгээний дараа скриншот авч хадгална уу.
              </p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-neutral-900/40 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-neutral-800/50 shadow-lg">
            <h2 className="text-xl font-semibold text-white mb-4">Тусламж хэрэгтэй юу?</h2>
            <p className="text-neutral-300 mb-4">
              Төлбөрийн талаар асуулт байвал бидэнтэй холбогдоно уу. Гүйлгээний баримтыг илгээснээр захиалга таны данс дээр шууд тэмдэглэгдэнэ.
            </p>
            <div className="flex flex-wrap gap-3">
  <Link href="/HelpPage" target="_blank">
    <Button
      variant="outline"
      // 1. Add `group` to the parent element
      className="group text-black border-neutral-600 hover:bg-gray-300 rounded-full px-5 py-4 flex items-center gap-1"
    >
      Тусламж
      {/* 2. Add transition and group-hover classes to the icon */}
      <ChevronRight className="h-4 w-4 transition-transform duration-300 ease-in-out group-hover:translate-x-1" />
    </Button>
  </Link>
</div>
          </div>
        </div>
      </div>
      <style>{`
        body {
          background-color: black;
        }
        .bg-grid-pattern {
          background-image: linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        .glass-container {
          background-color: rgba(255,255,255,0.05); /* Slightly more opaque for main container */
          backdrop-filter: blur(40px); /* Increased blur */
          border: 1px solid rgba(255,255,255,0.15); /* More visible border */
          border-radius: 2rem; /* Softer rounded corners */
          padding: 3rem; /* Increased padding */
          box-shadow: 0 10px 30px rgba(0,0,0,0.3); /* Softer, larger shadow */
        }
        /* Improved font rendering */
        body {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          font-family: 'Inter', sans-serif; /* Recommended a modern sans-serif font */
        }
        /* Animations */
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.6s ease-out forwards; animation-fill-mode: both; }
        .animate-fade-in-up { animation: fade-in-up 0.7s cubic-bezier(0.25,0.46,0.45,0.94) forwards; /* Smoother ease-out */ animation-fill-mode: both; }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }

        /* Animated Gradient Mesh Background */
        .animated-gradient-background {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: -1; /* Ensure it stays behind your content */
          overflow: hidden;
          background: radial-gradient(
              circle at 20% 30%,
              rgba(60, 40, 100, 0.4) 0%, /* Soft purple-blue */
              transparent 50%
            ),
            radial-gradient(
              circle at 70% 80%,
              rgba(40, 80, 120, 0.4) 0%, /* Muted blue */
              transparent 50%
            ),
            radial-gradient(
              circle at 90% 10%,
              rgba(80, 60, 100, 0.3) 0%, /* Desaturated violet */
              transparent 50%
            ),
            radial-gradient(
              circle at 40% 60%,
              rgba(40, 60, 80, 0.5) 0%, /* Darker subtle blue */
              transparent 60%
            );
          background-size: 200% 200%; /* Larger than viewport to allow movement */
          animation: gradientMovement 60s ease-in-out infinite alternate; /* Slow, smooth movement */
        }

        @keyframes gradientMovement {
          0% {
            background-position: 0% 0%;
          }
          100% {
            background-position: 100% 100%;
          }
        }
      `}</style>
    </div>
  )
}

export default PaymentPage