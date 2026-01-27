"use client"

import { useEffect, useRef, useState, type Ref } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { redirect } from "next/navigation"
import { Input } from "@/components/ui/input"
import { SearchIcon, X } from "lucide-react"
import { searchAll, deleteRecentSearch, clearAllRecentSearches, addRecentSearch } from "@/lib/services/search"
import Link from "next/link"
import Image from "next/image"
import type { SearchResponse, RecentSearch, SearchUser } from "@/types/search"
import { Sidebar } from "@/components/sidebar"

export default function ExploreSearchPage() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) redirect("/login")
  }, [isAuthenticated])

  const [query, setQuery] = useState("")
  const [data, setData] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    // focus input on mount
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const id = setTimeout(() => {
      setLoading(true)
      searchAll(query)
        .then(setData)
        .catch(() => setData(null))
        .finally(() => setLoading(false))
    }, 250)
    return () => clearTimeout(id)
  }, [query])

  const recent = data?.recent_searches || []

  const clearUserFromRecent = async (userId: number) => {
    try {
      await deleteRecentSearch(userId)
      setData((prev: SearchResponse | null) => prev ? { ...prev, recent_searches: prev.recent_searches.filter((u: RecentSearch) => u.id !== userId) } : prev)
    } catch (err) {
      console.error(err)
    }
  }

  const handleClearAllRecent = async () => {
    try {
      await clearAllRecentSearches()
      setData((prev: SearchResponse | null) => prev ? { ...prev, recent_searches: [] } : prev)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 lg:ml-64">
          <div className="max-w-xl mx-auto px-4 pt-2 pb-4">
            <div className="flex items-center justify-between sticky top-0 z-20 bg-background py-2">
              <div className="flex-1 mr-3">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    ref={inputRef as unknown as Ref<HTMLInputElement>}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search"
                    className="pl-10 pr-10 rounded-full bg-muted text-foreground placeholder:text-muted-foreground border-0 shadow-none outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 focus-visible:ring-0 ring-offset-0 focus:ring-offset-0 focus-visible:ring-offset-0"
                  />

                  {query && (
                    <button
                      type="button"
                      aria-label="Clear search"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setQuery("")
                        inputRef.current?.focus()
                      }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <button className="ml-3 text-sm font-medium text-primary" onClick={() => router.back()}>
                Cancel
              </button>
            </div>

            <div className="mt-4">
              {query.trim().length === 0 ? (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Recent</h3>
                    <button className="text-sm text-primary" onClick={handleClearAllRecent}>Clear all</button>
                  </div>

                  <div className="space-y-2">
                    {recent.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No recent searches.</p>
                    ) : (
                      recent.map((user: RecentSearch) => (
                        <div key={user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
                          <Link href={`/${user.username}`} onClick={() => addRecentSearch(user.id)} className="flex items-center space-x-3 flex-1">
                            <Image src={user.avatar || "/placeholder.svg"} alt={user.username} width={32} height={32} className="rounded-full" />
                            <div>
                              <p className="font-medium">{user.username}</p>
                              {user.full_name ? <p className="text-sm text-muted-foreground">{user.full_name}</p> : null}
                            </div>
                          </Link>

                          <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); clearUserFromRecent(user.id); }} className="ml-2">
                            <X className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  {loading ? (
                    <p className="text-center text-muted-foreground py-8">Searching...</p>
                  ) : (
                    <div>
                      {(data?.users || []).length > 0 && (
                        <div className="space-y-2">
                          {(data?.users || []).map((u: SearchUser) => (
                            <Link key={u.id} href={`/${u.username}`} onClick={() => addRecentSearch(u.id)} className="flex items-center p-2 rounded hover:bg-muted">
                              <Image src={u.avatar || '/placeholder.svg'} alt={u.username} width={32} height={32} className="rounded-full mr-3" />
                              <div>
                                <p className="font-medium">{u.username}</p>
                                {u.full_name ? <p className="text-sm text-muted-foreground">{u.full_name}</p> : null}
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}

                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
