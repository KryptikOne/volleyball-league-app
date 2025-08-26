export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="flex items-center">
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="space-y-6">
            <div>
              <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg border animate-pulse">
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-4 w-20 bg-gray-200 rounded"></div>
                    <div className="h-4 w-4 bg-gray-200 rounded"></div>
                  </div>
                  <div className="h-8 w-16 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 w-32 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}