import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { db } from '@/db'
import { games } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function PUT(request: NextRequest, { params }: { params: { gameId: string } }) {
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

    const [updatedGame] = await db.update(games)
      .set({
        seasonId,
        homeTeamId,
        awayTeamId,
        gameDate: new Date(gameDate),
        gameTime,
        courtLocation,
        status,
        homeTeamScore,
        awayTeamScore,
        notes,
        modifiedDate: new Date(),
      })
      .where(eq(games.id, params.gameId))
      .returning()

    if (!updatedGame) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    return NextResponse.json({ game: updatedGame })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update game' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { gameId: string } }) {
  try {
    await requireAdmin()

    await db.delete(games).where(eq(games.id, params.gameId))

    return NextResponse.json({ message: 'Game deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete game' }, { status: 500 })
  }
}