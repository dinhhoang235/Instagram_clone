"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, BadgeCheck, ArrowLeft } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { redirect, useRouter } from "next/navigation"
import Link from "next/link"
import { getSuggestedUsers, toggleFollowUser } from "@/lib/services/profile"
import type { SuggestedUserType } from "@/types/profile"


export default function ExplorePeoplePage() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [followedUsers, setFollowedUsers] = useState<Record<string, boolean>>({})
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUserType[]>([])
  const [loading, setLoading] = useState(true)

  if (!isAuthenticated) {
    redirect("/login")
  }

  useEffect(() => {
    const fetchSuggested = async () => {
      try {
        const data = await getSuggestedUsers()
        setSuggestedUsers(data)
      } catch (error) {
        console.error("Error fetching suggested users:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSuggested()
  }, [])

  const handleToggleFollow = async (username: string) => {
    try {
      const res = await toggleFollowUser(username)
      setFollowedUsers((prev) => ({
        ...prev,
        [username]: res.is_following,
      }))
    } catch (error) {
      console.error("Failed to toggle follow:", error)
    }
  }

  const filteredUsers = suggestedUsers.filter(
    (user) =>
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-muted-foreground">Loading suggestions...</p>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 lg:ml-64">
          <div className="max-w-2xl mx-auto px-4 py-6">
            {/* Header */}
            <div className="flex items-center mb-6">
              <Button variant="ghost" size="sm" className="mr-4 p-2" onClick={() => router.back()}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-semibold">Suggested</h1>
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search"
                className="pl-10 bg-muted/30 border-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Suggested Users List */}
            <div className="space-y-0">
              {filteredUsers.map((user) => (
                <div key={user.id} className="flex items-center py-2 px-0">
                  {/* Profile Picture */}
                  <Link href={`/${user.username}`} className="mr-3">
                    <Avatar className="w-11 h-11">
                      <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.username} />
                      <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Link>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1">
                      <Link href={`/${user.username}`} className="font-semibold text-sm hover:underline">
                        {user.username}
                      </Link>
                      {user.isVerified && <BadgeCheck className="w-4 h-4 text-blue-500 fill-current flex-shrink-0" />}
                    </div>
                    {user.full_name ? <p className="text-sm text-foreground">{user.full_name}</p> : null}
                    <p className="text-xs text-muted-foreground">{user.reason}</p>
                  </div>

                  {/* Follow Button */}
                  <Button
                    size="sm"
                    className={`ml-4 px-6 py-1.5 text-sm font-semibold rounded-lg ${(followedUsers[user.username] ?? user.isFollowing)
                      ? "bg-muted text-foreground hover:bg-muted/80"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                      }`}
                    onClick={() => handleToggleFollow(user.username)}
                  >
                    {(followedUsers[user.username] ?? user.isFollowing) ? "Following" : "Follow"}
                  </Button>
                </div>
              ))}
            </div>

            {/* Load More */}
            {filteredUsers.length === 0 && searchQuery && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No users found matching {searchQuery}</p>
              </div>
            )}


          </div>
        </main>
      </div>
    </div>
  )
}
