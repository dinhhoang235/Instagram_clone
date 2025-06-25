"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, BadgeCheck, ArrowLeft } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { redirect, useRouter } from "next/navigation"
import Link from "next/link"

// Mock suggested users data matching the image
const suggestedUsers = [
  {
    id: "1",
    username: "instagram",
    name: "Instagram",
    avatar: "/placeholder-user.jpg",
    isVerified: true,
    reason: "Popular",
    isFollowing: false,
  },
  {
    id: "2",
    username: "khahn_zdyy",
    name: "Khanh Vy",
    avatar: "/placeholder-user.jpg",
    isVerified: false,
    reason: "Followed by toannek05 + 1 more",
    isFollowing: false,
  },
  {
    id: "3",
    username: "thanh_van_1309",
    name: "Thanh Vann",
    avatar: "/placeholder-user.jpg",
    isVerified: false,
    reason: "Followed by cow_sonwz + 2 more",
    isFollowing: false,
  },
  {
    id: "4",
    username: "dwgnt_",
    name: "dwgnt",
    avatar: "/placeholder-user.jpg",
    isVerified: false,
    reason: "Followed by tung_nguyn + 3 more",
    isFollowing: false,
  },
  {
    id: "5",
    username: "tdung_88",
    name: "Vu Tien Dung",
    avatar: "/placeholder-user.jpg",
    isVerified: false,
    reason: "Suggested for you",
    isFollowing: false,
  },
  {
    id: "6",
    username: "ngamini_",
    name: "Nga Mini",
    avatar: "/placeholder-user.jpg",
    isVerified: false,
    reason: "Followed by m_chau03",
    isFollowing: false,
  },
  {
    id: "7",
    username: "mt_lucas28",
    name: "Bui Manh Tien",
    avatar: "/placeholder-user.jpg",
    isVerified: false,
    reason: "Suggested for you",
    isFollowing: false,
  },
  {
    id: "8",
    username: "maeankkismel",
    name: "Mae Ankk",
    avatar: "/placeholder-user.jpg",
    isVerified: false,
    reason: "Suggested for you",
    isFollowing: false,
  },
  {
    id: "9",
    username: "_th.linnn",
    name: "Thu Linh",
    avatar: "/placeholder-user.jpg",
    isVerified: false,
    reason: "Suggested for you",
    isFollowing: false,
  },
]

export default function ExplorePeoplePage() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set())

  if (!isAuthenticated) {
    redirect("/login")
  }

  const handleFollow = (userId: string) => {
    setFollowedUsers((prev) => new Set([...prev, userId]))
  }

  const handleUnfollow = (userId: string) => {
    setFollowedUsers((prev) => {
      const newSet = new Set(prev)
      newSet.delete(userId)
      return newSet
    })
  }

  const filteredUsers = suggestedUsers.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

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
                    <p className="text-sm text-foreground">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.reason}</p>
                  </div>

                  {/* Follow Button */}
                  <Button
                    size="sm"
                    className={`ml-4 px-6 py-1.5 text-sm font-semibold rounded-lg ${
                      followedUsers.has(user.id)
                        ? "bg-muted text-foreground hover:bg-muted/80"
                        : "bg-blue-500 text-white hover:bg-blue-600"
                    }`}
                    onClick={() => (followedUsers.has(user.id) ? handleUnfollow(user.id) : handleFollow(user.id))}
                  >
                    {followedUsers.has(user.id) ? "Following" : "Follow"}
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

            {filteredUsers.length > 0 && !searchQuery && (
              <div className="text-center py-6">
                <Button variant="ghost" className="text-muted-foreground">
                  Load more suggestions
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
