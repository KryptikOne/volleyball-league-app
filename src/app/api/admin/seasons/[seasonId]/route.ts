import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { db } from '@/db'
import { seasons } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function PUT(request: NextRequest, { params }: { params: { seasonId: string } }) {
  try {
    await requireAdmin()

    const {
      name,
      description,
      startDate,
      endDate,
      registrationStartDate,
      registrationEndDate,
      maxTeams
    } = await request.json()

    const [updatedSeason] = await db.update(seasons)
      .set({
        name,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        registrationStartDate: registrationStartDate ? new Date(registrationStartDate) : null,
        registrationEndDate: registrationEndDate ? new Date(registrationEndDate) : null,
        maxTeams,
        modifiedDate: new Date(),
      })
      .where(eq(seasons.id, params.seasonId))
      .returning()

    if (!updatedSeason) {
      return NextResponse.json({ error: 'Season not found' }, { status: 404 })
    }

    return NextResponse.json({ season: updatedSeason })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update season' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { seasonId: string } }) {
  try {
    await requireAdmin()

    // Check if season has teams/games before deleting
    const season = await db.query.seasons.findFirst({
      where: eq(seasons.id, params.seasonId),
      with: { teams: true, games: true },
    })

    if (!season) {
      return NextResponse.json({ error: 'Season not found' }, { status: 404 })
    }

    if (season.teams.length > 0 || season.games.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete season with existing teams or games. Remove them first.'
      }, { status: 400 })
    }

    await db.delete(seasons).where(eq(seasons.id, params.seasonId))

    return NextResponse.json({ message: 'Season deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete season' }, { status: 500 })
  }
}