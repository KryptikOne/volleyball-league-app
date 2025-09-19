import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { db } from '@/db'

export async function GET() {
  try {
    await requireAdmin()

    const allUsers = await db.query.users.findMany({
      columns: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isAdministrator: true,
      },
      orderBy: (users, { asc }) => [asc(users.lastName), asc(users.firstName)],
    })

    return NextResponse.json({ users: allUsers })
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}