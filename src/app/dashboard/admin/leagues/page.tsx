import { requireAdmin } from '@/lib/auth-utils'
import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { LeagueAdminTabs } from '@/components/admin/leagues/league-admin-tabs'

export default async function LeagueAdminPage() {
  const user = await requireAdmin()

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav user={user} />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">League Administration</h1>
            <p className="text-muted-foreground">
              Manage leagues, seasons, teams, and game schedules
            </p>
          </div>

          <LeagueAdminTabs />
        </div>
      </main>
    </div>
  )
}