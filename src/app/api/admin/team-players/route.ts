import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { db } from '@/db'
import { teamPlayers } from '@/db/schema'

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const { teamId, userId, playerType, position, jerseyNumber } = await request.json()

    if (!teamId || !userId) {
      return NextResponse.json({ error: 'Team ID and user ID are required' }, { status: 400 })
    }

    const [newTeamPlayer] = await db.insert(teamPlayers)
      .values({
        teamId,
        userId,
        playerType: playerType || 'player',
        position: position || null,
        jerseyNumber: jerseyNumber || null,
        isActive: true,
        createdDate: new Date(),
        modifiedDate: new Date(),
      })
      .returning()

    return NextResponse.json({ teamPlayer: newTeamPlayer }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add player' }, { status: 500 })
  }
}