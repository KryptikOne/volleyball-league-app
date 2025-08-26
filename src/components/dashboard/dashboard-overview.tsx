import { Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Users, Calendar, TrendingUp } from 'lucide-react'
import { db } from '@/db'
import { eq, and } from 'drizzle-orm'
import { teams, games, teamPlayers, leagueAdministrators } from '@/db/schema'

interface DashboardOverviewProps {
  user: {
    id: string
    name?: string | null
    email?: string | null
    isAdministrator: boolean
  }
}

async function DashboardStats({ userId, isAdmin }: { userId: string; isAdmin: boolean }) {
  try {
    // Get user's teams
    const userTeams = await db.query.teamPlayers.findMany({
      where: and(
        eq(teamPlayers.userId, userId),
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

    // Get leagues user administers
    const adminLeagues = isAdmin
      ? await db.query.leagueAdministrators.findMany({
          where: and(
            eq(leagueAdministrators.userId, userId),
            eq(leagueAdministrators.isActive, true)
          ),
          with: {
            league: true,
          },
        })
      : []

    // Get recent games for user's teams
    const teamIds = userTeams.map(tp => tp.teamId)
    const recentGames = teamIds.length > 0 ? await db.query.games.findMany({
      where: (games, { or, inArray }) => or(
        inArray(games.homeTeamId, teamIds),
        inArray(games.awayTeamId, teamIds)
      ),
      with: {
        homeTeam: true,
        awayTeam: true,
      },
      orderBy: (games, { desc }) => [desc(games.gameDate)],
      limit: 5,
    }) : []

    return {
      leagueCount: isAdmin ? adminLeagues.length : userTeams.length,
      teamCount: userTeams.length,
      gameCount: recentGames.length,
      recentGames: recentGames.slice(0, 3),
    }
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return {
      leagueCount: 0,
      teamCount: 0,
      gameCount: 0,
      recentGames: [],
    }
  }
}

function StatsCard({ title, value, description, icon: Icon }: {
  title: string
  value: number
  description: string
  icon: any
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function LoadingStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="h-6 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-3 w-32 bg-gray-200 rounded animate-pulse"></div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function DashboardOverview({ user }: DashboardOverviewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user.name || user.email}!
        </h1>
        <p className="text-muted-foreground">
          Here's an overview of your volleyball league activities.
        </p>
      </div>

      <Suspense fallback={<LoadingStats />}>
        <DashboardStatsContent userId={user.id} isAdmin={user.isAdministrator} />
      </Suspense>
    </div>
  )
}

async function DashboardStatsContent({ userId, isAdmin }: { userId: string; isAdmin: boolean }) {
  const stats = await DashboardStats({ userId, isAdmin })

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Leagues"
          value={stats.leagueCount}
          description={isAdmin ? "Leagues you manage" : "Leagues you're part of"}
          icon={Trophy}
        />
        <StatsCard
          title="Teams"
          value={stats.teamCount}
          description="Teams you're on"
          icon={Users}
        />
        <StatsCard
          title="Recent Games"
          value={stats.gameCount}
          description="Games in the last month"
          icon={Calendar}
        />
        <StatsCard
          title="Performance"
          value={0}
          description="Win rate this season"
          icon={TrendingUp}
        />
      </div>

      {stats.recentGames.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Games</CardTitle>
            <CardDescription>Your latest game results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentGames.map((game) => (
                <div key={game.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="text-sm">
                      <div className="font-medium">
                        {game.homeTeam.name} vs {game.awayTeam.name}
                      </div>
                      <div className="text-muted-foreground">
                        {new Date(game.gameDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {game.homeTeamScore} - {game.awayTeamScore}
                    </div>
                    <div className="text-sm text-muted-foreground capitalize">
                      {game.status.replace('_', ' ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}