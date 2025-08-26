import { requireAuth } from '@/lib/auth-utils'
import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { DashboardOverview } from '@/components/dashboard/dashboard-overview'

export default async function DashboardPage() {
  const user = await requireAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav user={user} />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <DashboardOverview user={user} />
        </div>
      </main>
    </div>
  )
}