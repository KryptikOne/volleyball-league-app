import { NextRequest, NextResponse } from 'next/server'
import { eq, and } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { db } from '@/db'
import { teams, teamPlayers } from '@/db/schema'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { teamCode, jerseyNumber, position } = await request.json()

    const team = await db.query.teams.findFirst({
      where: eq(teams.teamCode, teamCode.toUpperCase()),
      with: {
        teamPlayers: true,
      },
    })

    if (!team) {
      return NextResponse.json({ error: 'Invalid team code' }, { status: 404 })
    }

    if (!team.isActive) {
      return NextResponse.json({ error: 'Team is not active' }, { status: 400 })
    }

    // Check if user is already on this team
    const existingPlayer = team.teamPlayers.find(
      (player) => player.userId === session.user.id && player.isActive
    )

    if (existingPlayer) {
      return NextResponse.json({ error: 'Already on this team' }, { status: 400 })
    }

    // Check roster size
    const activePlayersCount = team.teamPlayers.filter(player => player.isActive).length
    if (activePlayersCount >= team.maxRosterSize) {
      return NextResponse.json({ error: 'Team roster is full' }, { status: 400 })
    }

    // Check jersey number availability
    if (jerseyNumber) {
      const jerseyTaken = team.teamPlayers.some(
        (player) => player.jerseyNumber === jerseyNumber && player.isActive
      )
      if (jerseyTaken) {
        return NextResponse.json({ error: 'Jersey number already taken' }, { status: 400 })
      }
    }

    const [newTeamPlayer] = await db.insert(teamPlayers).values({
      teamId: team.id,
      userId: session.user.id,
      jerseyNumber,
      position,
      playerType: 'player',
    }).returning()

    return NextResponse.json(newTeamPlayer, { status: 201 })
  } catch (error) {
    console.error('Join team error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}