import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { db } from '@/db'
import { teams } from '@/db/schema'

export async function GET() {
  try {
    await requireAdmin()

    const allTeams = await db.query.teams.findMany({
      with: {
        season: {
          with: {
            league: true,
          },
        },
        teamPlayers: {
          with: {
            user: true,
          },
          where: (teamPlayers, { eq }) => eq(teamPlayers.isActive, true),
        },
      },
      orderBy: (teams, { desc }) => [desc(teams.createdDate)],
    })

    return NextResponse.json({ teams: allTeams })
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const { seasonId, name, description } = await request.json()

    if (!seasonId || !name) {
      return NextResponse.json({ error: 'Season ID and name are required' }, { status: 400 })
    }

    // Generate a random 10-character team code
    const generateTeamCode = (length = 10) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };
    const teamCode = generateTeamCode();

    const [newTeam] = await db.insert(teams)
      .values({
        seasonId,
        name,
        teamCode,
        wins: 0,
        losses: 0,
      })
      .returning();

    return NextResponse.json({ team: newTeam }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 })
  }
}