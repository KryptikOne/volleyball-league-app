import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { db } from '@/db'
import { playoffBrackets } from '@/db/schema'

export async function GET() {
  try {
    await requireAdmin()

    const allBrackets = await db.query.playoffBrackets.findMany({
      with: {
        season: {
          with: {
            league: true,
          },
        },
        playoffTeams: {
          with: {
            team: true,
          },
          orderBy: (playoffTeams, { asc }) => [asc(playoffTeams.seed)],
        },
        playoffGames: {
          with: {
            homeTeam: true,
            awayTeam: true,
            winner: true,
          },
          orderBy: (playoffGames, { asc }) => [asc(playoffGames.round), asc(playoffGames.position)],
        },
      },
      orderBy: (playoffBrackets, { desc }) => [desc(playoffBrackets.createdDate)],
    })

    return NextResponse.json({ brackets: allBrackets })
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const { seasonId, name, description, bracketType, startDate, endDate } = await request.json()

    if (!seasonId || !name || !bracketType) {
      return NextResponse.json({
        error: 'Season ID, name, and bracket type are required'
      }, { status: 400 })
    }

    const [newBracket] = await db.insert(playoffBrackets)
      .values({
        seasonId,
        name,
        description: description || null,
        bracketType,
        status: 'setup',
        startDate: startDate || null,
        endDate: endDate || null,
      })
      .returning()

    return NextResponse.json({ bracket: newBracket }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create bracket' }, { status: 500 })
  }
}