import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { getBaseUrl } from '@/env'

export async function getCurrentUser() {
  try {
    const session = await getServerSession(authOptions)
    return session?.user
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    const baseUrl = getBaseUrl()
    redirect(`${baseUrl}/auth/signin`)
  }
  return user
}

export async function requireAdmin() {
  const user = await requireAuth()
  if (!user.isAdministrator) {
    const baseUrl = getBaseUrl()
    redirect(`${baseUrl}/dashboard`)
  }
  return user
}

export function getAuthRedirectUrl(path?: string) {
  const baseUrl = getBaseUrl()
  return path ? `${baseUrl}${path}` : `${baseUrl}/auth/signin`
}