import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { db } from '@/db'
import { games } from '@/db/schema'

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const { seasonId } = await request.json()

    if (!seasonId) {
      return NextResponse.json({ error: 'Season ID is required' }, { status: 400 })
    }

    // Get all teams for the season
    const seasonTeams = await db.query.teams.findMany({
      where: (teams, { eq }) => eq(teams.seasonId, seasonId),
    })

    if (seasonTeams.length < 2) {
      return NextResponse.json({
        error: 'Need at least 2 teams to generate a schedule'
      }, { status: 400 })
    }

    // Generate round-robin schedule
    const gamesToCreate = []
    for (let i = 0; i < seasonTeams.length; i++) {
      for (let j = i + 1; j < seasonTeams.length; j++) {
        // Each team plays each other team once (home and away)
        gamesToCreate.push({
          seasonId,
          homeTeamId: seasonTeams[i].id,
          awayTeamId: seasonTeams[j].id,
          gameDate: new Date(Date.now() + (gamesToCreate.length * 7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0], // Space games 1 week apart
          status: 'scheduled' as const,
        })
        gamesToCreate.push({
          seasonId,
          homeTeamId: seasonTeams[j].id,
          awayTeamId: seasonTeams[i].id,
          gameDate: new Date(Date.now() + (gamesToCreate.length * 7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0], // Space games 1 week apart
          status: 'scheduled' as const,
        })
      }
    }

    // Insert all games
    await db.insert(games).values(gamesToCreate)

    return NextResponse.json({
      message: 'Schedule generated successfully',
      gamesCreated: gamesToCreate.length
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate schedule' }, { status: 500 })
  }
}