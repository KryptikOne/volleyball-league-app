import { NextRequest, NextResponse } from 'next/server'
import { eq, and, or } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { db } from '@/db'
import { games, teamPlayers, insertGameSchema } from '@/db/schema'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's teams
    const userTeams = await db.query.teamPlayers.findMany({
      where: and(
        eq(teamPlayers.userId, session.user.id),
        eq(teamPlayers.isActive, true)
      ),
    })

    const teamIds = userTeams.map(tp => tp.teamId)

    // Get games for user's teams
    const userGames = teamIds.length > 0 ? await db.query.games.findMany({
      where: or(
        ...teamIds.flatMap(teamId => [
          eq(games.homeTeamId, teamId),
          eq(games.awayTeamId, teamId)
        ])
      ),
      with: {
        homeTeam: true,
        awayTeam: true,
        season: {
          with: {
            league: true,
          },
        },
      },
      orderBy: (games, { desc }) => [desc(games.gameDate)],
      limit: 20,
    }) : []

    return NextResponse.json(userGames)
  } catch (error) {
    console.error('Get games error:', error)
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
    const validatedData = insertGameSchema.parse(body)

    const [newGame] = await db.insert(games).values(validatedData).returning()

    return NextResponse.json(newGame, { status: 201 })
  } catch (error) {
    console.error('Create game error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}