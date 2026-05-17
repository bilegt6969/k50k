import { Suspense } from 'react'
import LoginClient from './LoginClient'

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-100 px-6 py-12 text-zinc-600">Loading…</div>}>
      <LoginClient />
    </Suspense>
  )
}

