import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { db } from '@/db'
import { seasons } from '@/db/schema'

export async function GET() {
  try {
    await requireAdmin()

    const allSeasons = await db.query.seasons.findMany({
      with: {
        teams: true,
        games: true,
        league: true,
      },
      orderBy: (seasons, { desc }) => [desc(seasons.startDate)],
    })

    return NextResponse.json({ seasons: allSeasons })
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const {
      leagueId,
      name,
      description,
      startDate,
      endDate,
      registrationStartDate,
      registrationEndDate,
      maxTeams
    } = await request.json()

    if (!leagueId || !name || !startDate || !endDate) {
      return NextResponse.json({
        error: 'League ID, name, start date, and end date are required'
      }, { status: 400 })
    }

    const [newSeason] = await db.insert(seasons)
      .values({
        leagueId,
        name,
        description: description || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        registrationStartDate: registrationStartDate ? new Date(registrationStartDate) : null,
        registrationEndDate: registrationEndDate ? new Date(registrationEndDate) : null,
        maxTeams: maxTeams || null,
        createdDate: new Date(),
        updatedData: new Date(),
      })
      .returning()

    return NextResponse.json({ season: newSeason }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create season' }, { status: 500 })
  }
}