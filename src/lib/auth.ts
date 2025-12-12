import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { users, publicUserSchema } from '@/db/schema'
import { env, getBaseUrl } from '@/env'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const user = await db.query.users.findFirst({
            where: eq(users.email, credentials.email.toLowerCase()),
          })

          if (!user || !user.isActive) {
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          )

          if (!isPasswordValid) {
            return null
          }

          const publicUser = publicUserSchema.parse(user)
          return {
            id: publicUser.id,
            email: publicUser.email,
            name: `${publicUser.firstName} ${publicUser.lastName}`,
            isAdministrator: Boolean(publicUser.isAdministrator),
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.isAdministrator = user.isAdministrator
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!
        session.user.isAdministrator = token.isAdministrator as boolean
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      const appBaseUrl = getBaseUrl()

      if (url.startsWith('/')) return `${appBaseUrl}${url}`

      if (new URL(url).origin === appBaseUrl) return url

      return appBaseUrl
    },
  },
  secret: env.NEXTAUTH_SECRET,

  debug: env.NODE_ENV === 'development',

  events: {
    async signIn(message) {
      if (env.NODE_ENV === 'production') {
        console.log('Sign in:', message.user.email)
      }
    },
  },
}