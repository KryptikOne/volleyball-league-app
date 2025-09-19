import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { db } from '@/db'
import { games } from '@/db/schema'

export async function GET() {
  try {
    await requireAdmin()

    const allGames = await db.query.games.findMany({
      with: {
        homeTeam: {
          with: {
            season: {
              with: {
                league: true,
              },
            },
          },
        },
        awayTeam: {
          with: {
            season: {
              with: {
                league: true,
              },
            },
          },
        },
      },
      orderBy: (games, { desc }) => [desc(games.gameDate)],
    })

    return NextResponse.json({ games: allGames })
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const {
      seasonId,
      homeTeamId,
      awayTeamId,
      gameDate,
      gameTime,
      courtLocation,
      status,
      homeTeamScore,
      awayTeamScore,
      notes
    } = await request.json()

    if (!seasonId || !homeTeamId || !awayTeamId || !gameDate) {
      return NextResponse.json({
        error: 'Season ID, home team, away team, and game date are required'
      }, { status: 400 })
    }

    const [newGame] = await db.insert(games)
      .values({
        seasonId,
        homeTeamId,
        awayTeamId,
        gameDate: new Date(gameDate),
        gameTime: gameTime || null,
        courtLocation: courtLocation || null,
        status: status || 'scheduled',
        homeTeamScore: homeTeamScore || null,
        awayTeamScore: awayTeamScore || null,
        notes: notes || null,
        createdDate: new Date(),
        modifiedDate: new Date(),
      })
      .returning()

    return NextResponse.json({ game: newGame }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create game' }, { status: 500 })
  }
}