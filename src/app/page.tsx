import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Users, Calendar, BarChart3 } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Volleyball League Administration
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            The complete solution for managing volleyball leagues, teams, players, and tournaments.
            Streamline your league operations with our comprehensive platform.
          </p>
          <div className="space-x-4">
            <Button asChild size="lg">
              <Link href="/auth/signin">Sign In</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/auth/signup">Get Started</Link>
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center">
            <CardHeader>
              <Trophy className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
              <CardTitle>League Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Create and manage multiple leagues with seasons, divisions, and tournaments.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="h-12 w-12 mx-auto text-blue-500 mb-4" />
              <CardTitle>Team & Player Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Register teams, manage rosters, and track player statistics across seasons.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Calendar className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <CardTitle>Game Scheduling</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Schedule games, track scores, and manage court locations efficiently.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <BarChart3 className="h-12 w-12 mx-auto text-purple-500 mb-4" />
              <CardTitle>Statistics & Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Comprehensive statistics tracking and performance analytics for players and teams.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}