import { NextRequest, NextResponse } from 'next/server'
import { eq, and } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { db } from '@/db'
import { seasons, leagues, leagueAdministrators, insertSeasonSchema } from '@/db/schema'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { leagueId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const leagueSeasons = await db.query.seasons.findMany({
      where: and(
        eq(seasons.leagueId, params.leagueId),
        eq(seasons.isActive, true)
      ),
      orderBy: (seasons, { desc }) => [desc(seasons.startDate)],
    })

    return NextResponse.json(leagueSeasons)
  } catch (error) {
    console.error('Get seasons error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { leagueId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is league administrator
    const isAdmin = await db.query.leagueAdministrators.findFirst({
      where: and(
        eq(leagueAdministrators.leagueId, params.leagueId),
        eq(leagueAdministrators.userId, session.user.id),
        eq(leagueAdministrators.isActive, true)
      ),
    })

    if (!isAdmin && !session.user.isAdministrator) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = insertSeasonSchema.parse({
      ...body,
      leagueId: params.leagueId,
    })

    const [newSeason] = await db.insert(seasons).values(validatedData).returning()

    return NextResponse.json(newSeason, { status: 201 })
  } catch (error) {
    console.error('Create season error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}