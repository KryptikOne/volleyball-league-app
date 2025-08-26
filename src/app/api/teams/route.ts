import { NextRequest, NextResponse } from 'next/server'
import { eq, and } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { db } from '@/db'
import { teams, teamPlayers, insertTeamSchema } from '@/db/schema'
import { authOptions } from '@/lib/auth'

function generateTeamCode(): string {
  return Math.random().toString(36).substr(2, 8).toUpperCase()
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userTeams = await db.query.teamPlayers.findMany({
      where: and(
        eq(teamPlayers.userId, session.user.id),
        eq(teamPlayers.isActive, true)
      ),
      with: {
        team: {
          with: {
            season: {
              with: {
                league: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(userTeams.map(tp => tp.team))
  } catch (error) {
    console.error('Get teams error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    let teamCode = generateTeamCode()

    // Ensure unique team code
    let existingTeam = await db.query.teams.findFirst({
      where: eq(teams.teamCode, teamCode),
    })

    while (existingTeam) {
      teamCode = generateTeamCode()
      existingTeam = await db.query.teams.findFirst({
        where: eq(teams.teamCode, teamCode),
      })
    }

    const validatedData = insertTeamSchema.parse({
      ...body,
      teamCode,
      captainId: session.user.id,
    })

    const [newTeam] = await db.insert(teams).values(validatedData).returning()

    // Add creator as team captain
    await db.insert(teamPlayers).values({
      teamId: newTeam.id,
      userId: session.user.id,
      playerType: 'captain',
      jerseyNumber: body.jerseyNumber || 1,
      position: body.position,
    })

    return NextResponse.json(newTeam, { status: 201 })
  } catch (error) {
    console.error('Create team error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}