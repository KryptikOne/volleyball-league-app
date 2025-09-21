import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { db } from '@/db'
import { leagues } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(request: NextRequest, { params }: { params: { leagueId: string } }) {
  try {
    await requireAdmin()

    const league = await db.query.leagues.findFirst({
      where: eq(leagues.id, params.leagueId),
      with: {
        seasons: {
          with: {
            teams: true,
            games: true,
          },
          orderBy: (seasons, { desc }) => [desc(seasons.startDate)],
        },
      },
    })

    if (!league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 })
    }

    return NextResponse.json({ league })
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { leagueId: string } }) {
  try {
    await requireAdmin()

    const { name, description, isActive } = await request.json()

    const [updatedLeague] = await db.update(leagues)
      .set({
        name,
        description,
        isActive,
        updatedDate: new Date(),
      })
      .where(eq(leagues.id, params.leagueId))
      .returning()

    if (!updatedLeague) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 })
    }

    return NextResponse.json({ league: updatedLeague })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update league' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { leagueId: string } }) {
  try {
    await requireAdmin()

    // Check if league has seasons before deleting
    const league = await db.query.leagues.findFirst({
      where: eq(leagues.id, params.leagueId),
      with: { seasons: true },
    })

    if (!league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 })
    }

    if (league.seasons.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete league with existing seasons. Delete seasons first.'
      }, { status: 400 })
    }

    await db.delete(leagues).where(eq(leagues.id, params.leagueId))

    return NextResponse.json({ message: 'League deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete league' }, { status: 500 })
  }
}