import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { db } from '@/db'

export async function GET(request: NextRequest, { params }: { params: { seasonId: string } }) {
  try {
    await requireAdmin()

    const seasonTeams = await db.query.teams.findMany({
      where: (teams, { eq }) => eq(teams.seasonId, params.seasonId),
      orderBy: (teams, { asc }) => [asc(teams.name)],
    })

    return NextResponse.json({ teams: seasonTeams })
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}