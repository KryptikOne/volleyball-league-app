import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    NEXTAUTH_SECRET: z.string().min(32),
    NEXTAUTH_URL: z.string().url().optional(),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    VERCEL: z.string().optional(),
    VERCEL_URL: z.string().optional(),
    VERCEL_ENV: z.enum(['development', 'preview', 'production']).optional(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    VERCEL: process.env.VERCEL,
    VERCEL_URL: process.env.VERCEL_URL,
    VERCEL_ENV: process.env.VERCEL_ENV,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
})

export function getBaseUrl() {
  if (typeof window !== 'undefined') {
    return env.NEXT_PUBLIC_APP_URL
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL
  }

  return env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}