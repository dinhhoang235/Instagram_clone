"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { SearchIcon, X } from "lucide-react"
import { searchAll } from "@/lib/services/search"
import type { SearchResponse } from "@/types/search"
import { clearAllRecentSearches, deleteRecentSearch, addRecentSearch } from "@/lib/services/search"
import { useAuth } from "@/components/auth-provider"

type Props = {
  isOpen: boolean
  onClose: () => void
  sidebarIsCollapsed?: boolean
} 

export default function SearchDrawer({ isOpen, onClose, sidebarIsCollapsed = false }: Props) {
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  const [searchQuery, setSearchQuery] = useState("")
  const [data, setData] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      // if not authenticated just navigate back/home
      router.push("/login")
    }
  }, [isAuthenticated, router])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const clearSearch = () => {
    setSearchQuery("")
  }

  const clearUserFromRecent = async (userId: number) => {
    try {
      await deleteRecentSearch(userId)
      setData((prev) =>
        prev
          ? {
              ...prev,
              recent_searches: prev.recent_searches.filter((u) => u.id !== userId),
            }
          : null
      )
    } catch (error) {
      console.error("Failed to delete recent search", error)
    }
  }

  const handleClearAllRecent = async () => {
    try {
      await clearAllRecentSearches()
      setData((prev) =>
        prev
          ? {
              ...prev,
              recent_searches: [],
            }
          : null
      )
    } catch (error) {
      console.error("Failed to clear all recent searches", error)
    }
  }

  useEffect(() => {
    const delay = setTimeout(() => {
      setLoading(true)
      searchAll(searchQuery)
        .then(setData)
        .catch(() => setData(null))
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(delay)
  }, [searchQuery])

  // Close on Escape and prevent body scroll while drawer open
  useEffect(() => {
    if (!isOpen) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [isOpen, onClose])

  const filteredUsers = data?.users || []
  const recentSearches = data?.recent_searches || []

  const showResults = searchQuery.length > 0

  // Styling
  const leftClass = sidebarIsCollapsed ? "lg:left-20" : "lg:left-64"

  const baseClass = `fixed top-0 bottom-0 z-50 ${leftClass} w-full lg:w-[360px] bg-background border-l overflow-auto transition-transform transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`

  if (!isOpen) return null



  return (
    <div>
      <div className={`fixed inset-0 z-40 bg-background/80 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0'} ${leftClass}`} onClick={onClose} aria-hidden="true" />
      <div className={baseClass} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-4 py-4 ">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-semibold">Search</h2>
            </div>
            <button onClick={onClose} aria-label="Close" className="p-1">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

        <div className="px-4 py-6">
          <div className="mb-6">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search"
                className="pl-10 pr-10 rounded-full bg-zinc-100 text-zinc-900 placeholder:text-zinc-400 border-0 shadow-none outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 focus-visible:ring-0 ring-offset-0 focus:ring-offset-0 focus-visible:ring-offset-0"
                value={searchQuery}
                onChange={handleSearch}
              />
              {searchQuery && (
                <button className="absolute right-3 top-1/2 transform -translate-y-1/2" onClick={clearSearch}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <p className="text-center text-muted-foreground">Searching...</p>
          ) : showResults ? (
            <div className="space-y-2">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <Link href={`/${user.username}`} key={user.id} className="flex items-center p-2 rounded-lg hover:bg-muted">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.username} />
                        <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <p className="font-medium text-sm">{user.username}</p>
                        {user.full_name ? <p className="text-xs text-muted-foreground mt-0.5">{user.full_name}</p> : null}
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">No accounts found</p>
              )}
            </div>
          ) : (

            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Recent</h3>
                  <Button variant="link" className="text-sm" onClick={handleClearAllRecent}>
                    Clear all
                  </Button>
                </div>

                <div className="space-y-2">
                  {recentSearches.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
                      <Link
                        href={`/${user.username}`}
                        onClick={() => addRecentSearch(user.id)}
                        className="flex items-center space-x-3 flex-1"
                      >
                        <Avatar>
                          <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.username} />
                          <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <p className="font-medium text-sm">{user.username}</p>
                          {user.full_name ? <p className="text-xs text-muted-foreground mt-0.5">{user.full_name}</p> : null}
                        </div>
                      </Link>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          e.preventDefault()
                          clearUserFromRecent(user.id)
                        }}                        className="ml-2"
                      >
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
