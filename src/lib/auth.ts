import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

// NEXTAUTH_SECRET is required for JWT encryption. Without it, login may succeed but
// getServerSession will fail with JWT_SESSION_ERROR / "decryption operation failed".
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const adminEmail = process.env.ADMIN_EMAIL?.trim()
        const adminPassword = process.env.ADMIN_PASSWORD
        if (!adminEmail || !adminPassword) return null

        const email = credentials?.email?.trim()
        const password = credentials?.password
        if (!email || !password) return null

        if (email === adminEmail && password === adminPassword) {
          return { id: 'admin', name: 'Admin', email }
        }

        return null
      },
    }),
  ],
  pages: {
    signIn: '/admin/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = 'admin'
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as { role?: string }).role = (token.role as string) || undefined
      }
      return session
    },
  },
}

