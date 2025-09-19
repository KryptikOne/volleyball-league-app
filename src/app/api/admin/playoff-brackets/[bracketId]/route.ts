import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { db } from '@/db'
import { playoffBrackets } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function PUT(request: NextRequest, { params }: { params: { bracketId: string } }) {
  try {
    await requireAdmin()

    const { name, description, bracketType, startDate, endDate } = await request.json()

    const [updatedBracket] = await db.update(playoffBrackets)
      .set({
        name,
        description,
        bracketType,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        modifiedDate: new Date(),
      })
      .where(eq(playoffBrackets.id, params.bracketId))
      .returning()

    if (!updatedBracket) {
      return NextResponse.json({ error: 'Bracket not found' }, { status: 404 })
    }

    return NextResponse.json({ bracket: updatedBracket })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update bracket' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { bracketId: string } }) {
  try {
    await requireAdmin()

    // Delete associated playoff teams and games first
    await db.delete(playoffTeams).where(eq(playoffTeams.playoffBracketId, params.bracketId))
    await db.delete(playoffGames).where(eq(playoffGames.playoffBracketId, params.bracketId))

    // Then delete the bracket
    await db.delete(playoffBrackets).where(eq(playoffBrackets.id, params.bracketId))

    return NextResponse.json({ message: 'Bracket deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete bracket' }, { status: 500 })
  }
}