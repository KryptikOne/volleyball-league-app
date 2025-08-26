import { requireAuth } from '@/lib/auth-utils'
import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { LeaguesList } from '@/components/leagues/leagues-list'
import { CreateLeagueDialog } from '@/components/leagues/create-league-dialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default async function LeaguesPage() {
  const user = await requireAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav user={user} />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Leagues</h1>
              <p className="text-muted-foreground">
                Manage and participate in volleyball leagues
              </p>
            </div>
            {user.isAdministrator && (
              <CreateLeagueDialog>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create League
                </Button>
              </CreateLeagueDialog>
            )}
          </div>

          <LeaguesList userId={user.id} isAdmin={user.isAdministrator} />
        </div>
      </main>
    </div>
  )
}