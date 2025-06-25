import { Sidebar } from "@/components/sidebar"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 lg:ml-64">
          <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Profile Header Skeleton */}
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-8 mb-8">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-muted animate-pulse" />

              <div className="flex-1 space-y-4 w-full">
                <div className="space-y-2">
                  <div className="h-6 bg-muted rounded w-32 animate-pulse" />
                  <div className="flex space-x-2">
                    <div className="h-8 bg-muted rounded w-24 animate-pulse" />
                    <div className="h-8 bg-muted rounded w-24 animate-pulse" />
                  </div>
                </div>

                <div className="flex space-x-8">
                  <div className="h-4 bg-muted rounded w-16 animate-pulse" />
                  <div className="h-4 bg-muted rounded w-20 animate-pulse" />
                  <div className="h-4 bg-muted rounded w-18 animate-pulse" />
                </div>

                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-24 animate-pulse" />
                  <div className="h-4 bg-muted rounded w-full animate-pulse" />
                  <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Highlights Skeleton */}
            <div className="flex space-x-4 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center space-y-1">
                  <div className="w-16 h-16 rounded-full bg-muted animate-pulse" />
                  <div className="h-3 bg-muted rounded w-12 animate-pulse" />
                </div>
              ))}
            </div>

            {/* Posts Grid Skeleton */}
            <div className="grid grid-cols-3 gap-1 md:gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="aspect-square bg-muted animate-pulse" />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
