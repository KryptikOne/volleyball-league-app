import { requireAuth } from '@/lib/auth-utils'
import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, Plus, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { db } from '@/db'
import { eq, and } from 'drizzle-orm'
import { teamPlayers } from '@/db/schema'

async function getUserTeams(userId: string) {
  return await db.query.teamPlayers.findMany({
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
}

export default async function TeamsPage() {
  const user = await requireAuth()
  const userTeams = await getUserTeams(user.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav user={user} />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
              <p className="text-muted-foreground">
                Your volleyball teams and roster information
              </p>
            </div>
            <div className="space-x-2">
              <Button variant="outline">
                <UserPlus className="h-4 w-4 mr-2" />
                Join Team
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Team
              </Button>
            </div>
          </div>

          {userTeams.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No teams yet</h3>
                <p className="text-muted-foreground mb-4">
                  You're not part of any teams. Create a team or join an existing one.
                </p>
                <div className="space-x-2">
                  <Button variant="outline">Join Team</Button>
                  <Button>Create Team</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {userTeams.map((teamPlayer) => (
                <Card key={teamPlayer.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{teamPlayer.team.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {teamPlayer.team.season.league.name} - {teamPlayer.team.season.name}
                        </CardDescription>
                      </div>
                      <Badge variant={teamPlayer.playerType === 'captain' ? 'default' : 'secondary'}>
                        {teamPlayer.playerType === 'captain' ? 'Captain' : 'Player'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Jersey #</span>
                        <span>{teamPlayer.jerseyNumber || 'Not assigned'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Position</span>
                        <span className="capitalize">{teamPlayer.position?.replace('_', ' ') || 'Not assigned'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Record</span>
                        <span>{teamPlayer.team.wins}W - {teamPlayer.team.losses}L</span>
                      </div>
                    </div>

                    <Button asChild variant="outline" size="sm" className="w-full">
                      <Link href={`/dashboard/teams/${teamPlayer.team.id}`}>
                        View Team
                      </Link>
                    </Button>
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