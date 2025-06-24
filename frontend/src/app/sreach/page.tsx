"use client"

import type React from "react"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { SearchIcon, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import { redirect } from "next/navigation"

// Mock data
const recentSearches = [
  { id: "1", username: "jane_smith", name: "Jane Smith", avatar: "/placeholder-user.jpg" },
  { id: "2", username: "travel_photography", name: "Travel Photography", avatar: "/placeholder-user.jpg" },
  { id: "3", username: "food_lover", name: "Food Lover", avatar: "/placeholder-user.jpg" },
]

const users = [
  {
    id: "1",
    username: "jane_smith",
    name: "Jane Smith",
    avatar: "/placeholder-user.jpg",
    isVerified: true,
    isFollowing: true,
  },
  {
    id: "2",
    username: "john_doe",
    name: "John Doe",
    avatar: "/placeholder-user.jpg",
    isVerified: false,
    isFollowing: false,
  },
  {
    id: "3",
    username: "travel_photography",
    name: "Travel Photography",
    avatar: "/placeholder-user.jpg",
    isVerified: true,
    isFollowing: false,
  },
  {
    id: "4",
    username: "food_lover",
    name: "Food Lover",
    avatar: "/placeholder-user.jpg",
    isVerified: false,
    isFollowing: true,
  },
  {
    id: "5",
    username: "fitness_guru",
    name: "Fitness Guru",
    avatar: "/placeholder-user.jpg",
    isVerified: false,
    isFollowing: false,
  },
  {
    id: "6",
    username: "tech_news",
    name: "Tech News",
    avatar: "/placeholder-user.jpg",
    isVerified: true,
    isFollowing: false,
  },
]

const tags = [
  { id: "1", name: "photography", postCount: "2.3M" },
  { id: "2", name: "travel", postCount: "5.7M" },
  { id: "3", name: "food", postCount: "3.1M" },
  { id: "4", name: "fitness", postCount: "1.8M" },
  { id: "5", name: "technology", postCount: "4.2M" },
]

const places = [
  { id: "1", name: "New York City", postCount: "12.5M" },
  { id: "2", name: "Paris, France", postCount: "8.3M" },
  { id: "3", name: "Tokyo, Japan", postCount: "7.1M" },
  { id: "4", name: "London, UK", postCount: "9.4M" },
]

export default function SearchPage() {
  const { isAuthenticated } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [showResults, setShowResults] = useState(false)

  if (!isAuthenticated) {
    redirect("/login")
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setShowResults(e.target.value.length > 0)
  }

  const clearSearch = () => {
    setSearchQuery("")
    setShowResults(false)
  }

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredTags = tags.filter((tag) => tag.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const filteredPlaces = places.filter((place) => place.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 lg:ml-64">
          <div className="max-w-2xl mx-auto px-4 py-8">
            <div className="mb-6">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input placeholder="Search" className="pl-10 pr-10" value={searchQuery} onChange={handleSearch} />
                {searchQuery && (
                  <button className="absolute right-3 top-1/2 transform -translate-y-1/2" onClick={clearSearch}>
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>

            {showResults ? (
              <div className="space-y-6">
                <Tabs defaultValue="top" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 mb-6">
                    <TabsTrigger value="top">Top</TabsTrigger>
                    <TabsTrigger value="accounts">Accounts</TabsTrigger>
                    <TabsTrigger value="tags">Tags</TabsTrigger>
                    <TabsTrigger value="places">Places</TabsTrigger>
                  </TabsList>

                  <TabsContent value="top" className="space-y-4">
                    {filteredUsers.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">Accounts</h3>
                        <div className="space-y-2">
                          {filteredUsers.slice(0, 3).map((user) => (
                            <Link
                              href={`/${user.username}`}
                              key={user.id}
                              className="flex items-center justify-between p-2 rounded-lg hover:bg-muted"
                            >
                              <div className="flex items-center space-x-3">
                                <Avatar>
                                  <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.username} />
                                  <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{user.username}</p>
                                  <p className="text-sm text-muted-foreground">{user.name}</p>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {filteredTags.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">Tags</h3>
                        <div className="space-y-2">
                          {filteredTags.slice(0, 2).map((tag) => (
                            <Link
                              href={`/explore/tags/${tag.name}`}
                              key={tag.id}
                              className="flex items-center justify-between p-2 rounded-lg hover:bg-muted"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">#</div>
                                <div>
                                  <p className="font-medium">#{tag.name}</p>
                                  <p className="text-sm text-muted-foreground">{tag.postCount} posts</p>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {filteredPlaces.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">Places</h3>
                        <div className="space-y-2">
                          {filteredPlaces.slice(0, 2).map((place) => (
                            <Link
                              href={`/explore/locations/${place.id}`}
                              key={place.id}
                              className="flex items-center justify-between p-2 rounded-lg hover:bg-muted"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">📍</div>
                                <div>
                                  <p className="font-medium">{place.name}</p>
                                  <p className="text-sm text-muted-foreground">{place.postCount} posts</p>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="accounts" className="space-y-2">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <Link
                          href={`/${user.username}`}
                          key={user.id}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-muted"
                        >
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.username} />
                              <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.username}</p>
                              <p className="text-sm text-muted-foreground">{user.name}</p>
                            </div>
                          </div>
                          <Button variant={user.isFollowing ? "outline" : "default"} size="sm">
                            {user.isFollowing ? "Following" : "Follow"}
                          </Button>
                        </Link>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-8">No accounts found</p>
                    )}
                  </TabsContent>

                  <TabsContent value="tags" className="space-y-2">
                    {filteredTags.length > 0 ? (
                      filteredTags.map((tag) => (
                        <Link
                          href={`/explore/tags/${tag.name}`}
                          key={tag.id}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-muted"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">#</div>
                            <div>
                              <p className="font-medium">#{tag.name}</p>
                              <p className="text-sm text-muted-foreground">{tag.postCount} posts</p>
                            </div>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-8">No tags found</p>
                    )}
                  </TabsContent>

                  <TabsContent value="places" className="space-y-2">
                    {filteredPlaces.length > 0 ? (
                      filteredPlaces.map((place) => (
                        <Link
                          href={`/explore/locations/${place.id}`}
                          key={place.id}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-muted"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">📍</div>
                            <div>
                              <p className="font-medium">{place.name}</p>
                              <p className="text-sm text-muted-foreground">{place.postCount} posts</p>
                            </div>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-8">No places found</p>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Recent</h3>
                    <Button variant="link" className="text-sm">
                      Clear all
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {recentSearches.map((search) => (
                      <div key={search.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={search.avatar || "/placeholder.svg"} alt={search.username} />
                            <AvatarFallback>{search.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{search.username}</p>
                            <p className="text-sm text-muted-foreground">{search.name}</p>
                          </div>
                        </div>
                        <button>
                          <X className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-4">Explore</h3>
                  <div className="grid grid-cols-3 gap-1">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className="aspect-square relative">
                        <Image
                          src={`/placeholder.svg?height=200&width=200&text=${i + 1}`}
                          alt={`Explore ${i + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
