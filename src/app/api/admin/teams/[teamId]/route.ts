import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { db } from '@/db'
import { teams } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function PUT(request: NextRequest, { params }: { params: { teamId: string } }) {
  try {
    await requireAdmin()

    const { seasonId, name, description } = await request.json()

    const [updatedTeam] = await db.update(teams)
      .set({
        seasonId,
        name,
        description,
        updatedData: new Date(),
      })
      .where(eq(teams.id, params.teamId))
      .returning()

    if (!updatedTeam) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    return NextResponse.json({ team: updatedTeam })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update team' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { teamId: string } }) {
  try {
    await requireAdmin()

    await db.delete(teams).where(eq(teams.id, params.teamId))

    return NextResponse.json({ message: 'Team deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete team' }, { status: 500 })
  }
}