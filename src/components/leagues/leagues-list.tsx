import { Suspense } from 'react'
import { eq, and } from 'drizzle-orm'
import { db } from '@/db'
import { leagues, leagueAdministrators, seasons } from '@/db/schema'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Users, Calendar, Trophy } from 'lucide-react'

interface LeaguesListProps {
  userId: string
  isAdmin: boolean
}

async function getLeagues(userId: string, isAdmin: boolean) {
  if (isAdmin) {
    // Global admins can see all leagues
    return await db.query.leagues.findMany({
      where: eq(leagues.isActive, true),
      with: {
        administrator: {
          columns: { firstName: true, lastName: true }
        },
        seasons: {
          where: eq(seasons.isActive, true),
        },
      },
      orderBy: (leagues, { desc }) => [desc(leagues.createdDate)],
    })
  } else {
    // Regular users see leagues they administer
    const adminLeagues = await db.query.leagueAdministrators.findMany({
      where: and(
        eq(leagueAdministrators.userId, userId),
        eq(leagueAdministrators.isActive, true)
      ),
      with: {
        league: {
          with: {
            administrator: {
              columns: { firstName: true, lastName: true }
            },
            seasons: {
              where: eq(seasons.isActive, true),
            },
          },
        },
      },
    })

    return adminLeagues.map(al => al.league)
  }
}

function LeagueCard({ league }: { league: any }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{league.name}</CardTitle>
            <CardDescription className="mt-1">
              Admin: {league.administrator.firstName} {league.administrator.lastName}
            </CardDescription>
          </div>
          <Badge variant="secondary">
            {league.seasons.length} Season{league.seasons.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {league.description || 'No description available'}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {league.seasons.length} seasons
            </div>
          </div>

          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/leagues/${league.id}`}>
              View Details
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function LoadingLeagues() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </CardHeader>
          <CardContent>
            <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
            <div className="flex justify-between items-center">
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              <div className="h-6 bg-gray-200 rounded w-20"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function LeaguesList({ userId, isAdmin }: LeaguesListProps) {
  return (
    <Suspense fallback={<LoadingLeagues />}>
      <LeaguesContent userId={userId} isAdmin={isAdmin} />
    </Suspense>
  )
}

async function LeaguesContent({ userId, isAdmin }: LeaguesListProps) {
  const userLeagues = await getLeagues(userId, isAdmin)

  if (userLeagues.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No leagues found</h3>
          <p className="text-muted-foreground mb-4">
            {isAdmin
              ? "You haven't created any leagues yet."
              : "You're not part of any leagues yet."
            }
          </p>
          {isAdmin && (
            <Button asChild>
              <Link href="/dashboard/leagues?create=true">Create your first league</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {userLeagues.map((league) => (
        <LeagueCard key={league.id} league={league} />
      ))}
    </div>
  )
}