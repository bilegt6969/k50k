'use client'

import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'

export default function LoginClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = useMemo(() => searchParams.get('callbackUrl') || '/admin/dashboard', [searchParams])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
      callbackUrl,
    })
    setIsSubmitting(false)

    if (res?.error) {
      setError('Invalid email or password')
      return
    }

    router.push(callbackUrl)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-100 px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Admin login</h1>
        <p className="mt-1 text-sm text-neutral-600">Sign in to manage products and publishing.</p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm text-neutral-700">Email</label>
            <input
              className="w-full rounded-xl bg-white border border-black/15 px-4 py-3 outline-none focus:border-black/30"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-neutral-700">Password</label>
            <input
              className="w-full rounded-xl bg-white border border-black/15 px-4 py-3 outline-none focus:border-black/30"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <button
            className="w-full rounded-xl bg-zinc-900 py-3 font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}

