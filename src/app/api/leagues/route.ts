import { NextRequest, NextResponse } from 'next/server'
import { eq, and } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { db } from '@/db'
import { leagues, leagueAdministrators, insertLeagueSchema } from '@/db/schema'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const allLeagues = await db.query.leagues.findMany({
      where: eq(leagues.isActive, true),
      with: {
        administrator: {
          columns: { firstName: true, lastName: true, email: true },
        },
      },
      orderBy: (leagues, { desc }) => [desc(leagues.createdDate)],
    })

    return NextResponse.json(allLeagues)
  } catch (error) {
    console.error('Get leagues error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdministrator) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = insertLeagueSchema.parse({
      ...body,
      administratorId: session.user.id,
    })

    const [newLeague] = await db.insert(leagues).values(validatedData).returning()

    // Add creator as league administrator
    await db.insert(leagueAdministrators).values({
      leagueId: newLeague.id,
      userId: session.user.id,
      role: 'owner',
      grantedBy: session.user.id,
    })

    return NextResponse.json(newLeague, { status: 201 })
  } catch (error) {
    console.error('Create league error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}