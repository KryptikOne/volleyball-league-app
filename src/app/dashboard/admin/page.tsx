import { requireAdmin } from '@/lib/auth-utils'
import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Trophy, Calendar, BarChart3, Settings, Database } from 'lucide-react'
import { db } from '@/db'
import { count } from 'drizzle-orm'
import { users, leagues, teams, games } from '@/db/schema'
import Link from 'next/link'

async function getAdminStats() {
  const [userCount] = await db.select({ count: count() }).from(users)
  const [leagueCount] = await db.select({ count: count() }).from(leagues)
  const [teamCount] = await db.select({ count: count() }).from(teams)
  const [gameCount] = await db.select({ count: count() }).from(games)

  return {
    users: userCount.count,
    leagues: leagueCount.count,
    teams: teamCount.count,
    games: gameCount.count,
  }
}

export default async function AdminPage() {
  const user = await requireAdmin()
  const stats = await getAdminStats()

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav user={user} />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              System administration and management tools
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.users}</div>
                <p className="text-xs text-muted-foreground">Registered players & admins</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Leagues</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.leagues}</div>
                <p className="text-xs text-muted-foreground">Active & inactive leagues</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.teams}</div>
                <p className="text-xs text-muted-foreground">Across all leagues</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Games</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.games}</div>
                <p className="text-xs text-muted-foreground">All time games played</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  User Management
                </CardTitle>
                <CardDescription>
                  Manage user accounts, roles, and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Manage Users</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="h-5 w-5 mr-2" />
                  League Administration
                </CardTitle>
                <CardDescription>
                  Manage leagues, seasons, teams, and schedules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/dashboard/admin/leagues">
                    Manage Leagues
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Analytics
                </CardTitle>
                <CardDescription>
                  View system analytics and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">View Analytics</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  System Settings
                </CardTitle>
                <CardDescription>
                  Configure system-wide settings and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">System Settings</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Data Management
                </CardTitle>
                <CardDescription>
                  Backup, restore, and manage database operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Data Tools</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Game Management
                </CardTitle>
                <CardDescription>
                  Manage games, schedules, and tournament brackets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/dashboard/admin/leagues?tab=games">
                    Manage Games
                  </Link>
                </Button>
              </CardContent>
            </Card> */}
          </div>
        </div>
      </main>
    </div>
  )
}