import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { db } from '@/db'
import { playoffTeams } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(request: NextRequest, { params }: { params: { bracketId: string } }) {
  try {
    await requireAdmin()

    const teams = await db.query.playoffTeams.findMany({
      where: eq(playoffTeams.playoffBracketId, params.bracketId),
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
      orderBy: (playoffTeams, { asc }) => [asc(playoffTeams.seed)],
    })

    return NextResponse.json({ teams })
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { bracketId: string } }) {
  try {
    await requireAdmin()

    const { teamIds } = await request.json()

    if (!teamIds || !Array.isArray(teamIds) || teamIds.length < 2) {
      return NextResponse.json({
        error: 'At least 2 teams are required'
      }, { status: 400 })
    }

    // Verify the bracket exists
    const bracket = await db.query.playoffBrackets.findFirst({
      where: (playoffBrackets, { eq }) => eq(playoffBrackets.id, params.bracketId),
    })

    if (!bracket) {
      return NextResponse.json({ error: 'Bracket not found' }, { status: 404 })
    }

    // Clear existing teams for this bracket
    await db.delete(playoffTeams).where(eq(playoffTeams.playoffBracketId, params.bracketId))

    // Get team details to sort by performance (wins/losses)
    const teamDetails = await Promise.all(
      teamIds.map(async (teamId) => {
        const team = await db.query.teams.findFirst({
          where: (teams, { eq }) => eq(teams.id, teamId),
        })
        return team
      })
    )

    // Sort teams by win percentage (best teams get better seeds)
    const sortedTeams = teamDetails
      .filter(team => team !== undefined)
      .sort((a, b) => {
        const aWinPercentage = a.wins + a.losses > 0 ? a.wins / (a.wins + a.losses) : 0
        const bWinPercentage = b.wins + b.losses > 0 ? b.wins / (b.wins + b.losses) : 0
        return bWinPercentage - aWinPercentage // Descending order (best first)
      })

    // Add new teams with proper seeding based on performance
    const teamsToInsert = sortedTeams.map((team, index) => ({
      playoffBracketId: params.bracketId,
      teamId: team.id,
      seed: index + 1, // Seed 1 = best team, seed 2 = second best, etc.
      isActive: true,
      createdDate: new Date(),
      updatedData: new Date(),
    }))

    const insertedTeams = await db.insert(playoffTeams).values(teamsToInsert).returning()

    return NextResponse.json({
      message: 'Teams added successfully',
      teams: insertedTeams.length
    }, { status: 201 })
  } catch (error) {
    console.error('Error adding teams to playoff bracket:', error)
    return NextResponse.json({ error: 'Failed to add teams' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { bracketId: string } }) {
  try {
    await requireAdmin()

    const { teams } = await request.json()

    if (!teams || !Array.isArray(teams)) {
      return NextResponse.json({
        error: 'Teams array is required'
      }, { status: 400 })
    }

    // Update existing teams (useful for reseeding)
    for (const team of teams) {
      if (team.id && team.seed) {
        await db.update(playoffTeams)
          .set({
            seed: team.seed,
            isActive: team.isActive ?? true,
            updatedData: new Date(),
          })
          .where(eq(playoffTeams.id, team.id))
      }
    }

    return NextResponse.json({ message: 'Teams updated successfully' })
  } catch (error) {
    console.error('Error updating playoff teams:', error)
    return NextResponse.json({ error: 'Failed to update teams' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { bracketId: string } }) {
  try {
    await requireAdmin()

    // Remove all teams from this bracket
    const deletedTeams = await db.delete(playoffTeams)
      .where(eq(playoffTeams.playoffBracketId, params.bracketId))
      .returning()

    return NextResponse.json({
      message: 'All teams removed from bracket',
      removedTeams: deletedTeams.length
    })
  } catch (error) {
    console.error('Error removing teams from playoff bracket:', error)
    return NextResponse.json({ error: 'Failed to remove teams' }, { status: 500 })
  }
}