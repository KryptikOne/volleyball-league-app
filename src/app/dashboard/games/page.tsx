import { requireAuth } from '@/lib/auth-utils'
import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, Clock } from 'lucide-react'
import { db } from '@/db'
import { eq, and, or } from 'drizzle-orm'
import { games, teamPlayers } from '@/db/schema'

async function getUserGames(userId: string) {
  // Get user's teams
  const userTeams = await db.query.teamPlayers.findMany({
    where: and(
      eq(teamPlayers.userId, userId),
      eq(teamPlayers.isActive, true)
    ),
  })

  const teamIds = userTeams.map(tp => tp.teamId)

  // Get games for user's teams
  if (teamIds.length === 0) return []

  return await db.query.games.findMany({
    where: or(
      ...teamIds.flatMap(teamId => [
        eq(games.homeTeamId, teamId),
        eq(games.awayTeamId, teamId)
      ])
    ),
    with: {
      homeTeam: true,
      awayTeam: true,
      season: {
        with: {
          league: true,
        },
      },
    },
    orderBy: (games, { desc }) => [desc(games.gameDate)],
    limit: 20,
  })
}

function getStatusColor(status: string) {
  switch (status) {
    case 'scheduled':
      return 'bg-blue-100 text-blue-800'
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-800'
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    case 'postponed':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default async function GamesPage() {
  const user = await requireAuth()
  const userGames = await getUserGames(user.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav user={user} />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Games</h1>
            <p className="text-muted-foreground">
              Your team's game schedule and results
            </p>
          </div>

          {userGames.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No games scheduled</h3>
                <p className="text-muted-foreground">
                  Your teams don't have any games scheduled yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {userGames.map((game) => (
                <Card key={game.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {game.homeTeam.name} vs {game.awayTeam.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {game.season.league.name} - {game.season.name}
                        </p>
                      </div>
                      <Badge className={getStatusColor(game.status ?? '')}>
                        {(game.status ?? '').replace('_', ' ')}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2" />
                        {new Date(game.gameDate).toLocaleDateString()}
                      </div>
                      {game.gameTime && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 mr-2" />
                          {game.gameTime}
                        </div>
                      )}
                      {game.courtLocation && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 mr-2" />
                          {game.courtLocation}
                        </div>
                      )}
                    </div>

                    {game.status === 'completed' && (
                      <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <div className="text-2xl font-bold">
                            {game.homeTeamScore} - {game.awayTeamScore}
                          </div>
                          <div className="text-sm text-muted-foreground">Final Score</div>
                        </div>
                      </div>
                    )}

                    {game.notes && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">{game.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}