import { drizzle } from 'drizzle-orm/neon-serverless'
import { Pool, neonConfig } from '@neondatabase/serverless'
import { env } from '@/env'
import * as schema from '@/db/schema'
import ws from 'ws'

if (env.NODE_ENV === 'production') {
  neonConfig.webSocketConstructor = ws
}

const connectionString = env.DATABASE_URL

const globalForDb = globalThis as unknown as {
  pool: Pool | undefined
}

const pool = globalForDb.pool ?? new Pool({
  connectionString,
  max: 1,
  idleTimeoutMillis: 20000,
  connectionTimeoutMillis: 10000,
})

if (env.NODE_ENV !== 'production') {
  globalForDb.pool = pool
}

export const db = drizzle(pool, {
  schema,
  logger: env.NODE_ENV === 'development'
})