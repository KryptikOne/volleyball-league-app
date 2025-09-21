import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { db } from '@/db'
import { leagues } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    await requireAdmin()

    const allLeagues = await db.query.leagues.findMany({
      with: {
        seasons: {
          with: {
            teams: true,
            games: true,
          },
          orderBy: (seasons, { desc }) => [desc(seasons.startDate)],
        },
      },
      orderBy: (leagues, { desc }) => [desc(leagues.createdDate)],
    })

    return NextResponse.json({ leagues: allLeagues })
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const { name, description, administratorId, isActive } = await request.json()

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const [newLeague] = await db.insert(leagues)
      .values({
        name,
        description: description || null,
        isActive: isActive ?? true,
        administratorId: administratorId || null,
        createdDate: new Date(),
        updatedDate: new Date(),
      })
      .returning()

    return NextResponse.json({ league: newLeague }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create league' }, { status: 500 })
  }
}