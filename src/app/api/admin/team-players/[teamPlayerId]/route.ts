import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { db } from '@/db'
import { teamPlayers } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function DELETE(request: NextRequest, { params }: { params: { teamPlayerId: string } }) {
  try {
    await requireAdmin()

    await db.delete(teamPlayers).where(eq(teamPlayers.id, params.teamPlayerId))

    return NextResponse.json({ message: 'Player removed successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to remove player' }, { status: 500 })
  }
}