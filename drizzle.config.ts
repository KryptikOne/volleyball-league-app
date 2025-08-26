import { defineConfig } from 'drizzle-kit'
import { env } from './src/env'

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL,
    ssl: 'require',
  },
  verbose: true,
  strict: true,
  migrations: {
    prefix: 'timestamp'
  }
})