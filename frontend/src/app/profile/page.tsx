'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Grid, Bookmark, Tag, Settings, BadgeCheck } from "lucide-react"
import Image from "next/image"
import { Sidebar } from "@/components/sidebar"
import Link from "next/link"
import { useEffect, useState } from "react"
import { getMyProfile } from "@/lib/services/profile"
import type { ProfileType } from "@/types/profile"
import { getPostsByUsername } from "@/lib/services/posts"
import { PostType } from "@/types/post"

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileType | null>(null)
  const [posts, setPosts] = useState<PostType[]>([])

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await getMyProfile()
        setProfile(data)

        const userPosts = await getPostsByUsername(data.username)
        setPosts(userPosts)
      } catch (error) {
        console.error("Failed to fetch profile:", error)
      }
    }

    fetchProfile()
  }, [])

  if (!profile) return <div className="p-4">Loading...</div>

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 lg:ml-64">
          <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Profile Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-8 mb-8">
              <Avatar className="w-32 h-32 md:w-40 md:h-40">
                <AvatarImage
                  src={profile?.avatar || "/placeholder-user.jpg"}
                  alt={profile?.full_name || "Profile"}
                />
                <AvatarFallback>
                  {profile?.full_name?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <div className="flex items-center space-x-2">
                    <h1 className="text-xl font-light">{profile.username}</h1>
                    <BadgeCheck className="w-5 h-5 text-blue-500 fill-current" />
                  </div>
                  <div className="flex space-x-2">
                    <Link href="/profile/edit">
                      <Button className="cursor-pointer" variant="secondary" size="sm">
                        Edit profile
                      </Button>
                    </Link>
                    <Button className="cursor-pointer" variant="secondary" size="sm">
                      View archive
                    </Button>
                    <Button className="cursor-pointer" variant="ghost" size="sm">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex space-x-8 text-sm">
                  <span>
                    <strong>{profile.posts_count}</strong> posts
                  </span>
                  <span>
                    <strong>{profile.followers_count}</strong> followers
                  </span>
                  <span>
                    <strong>{profile.following_count}</strong> following
                  </span>
                </div>

                <div className="space-y-1">
                  <h2 className="font-semibold">{profile.full_name}</h2>
                  <p className="text-sm">{profile.bio}</p>
                  {profile.email && <p className="text-sm">📧 {profile.email}</p>}
                  {profile.website && (
                    <a
                      href={profile.website}
                      className="text-sm text-blue-600 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {profile.website}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Highlights */}
            <div className="flex space-x-4 mb-8 overflow-x-auto pb-2">
              {["Travel", "Food", "Photography", "Behind the Scenes"].map((highlight) => (
                <div key={highlight} className="flex flex-col items-center space-y-1 min-w-0">
                  <div className="w-16 h-16 rounded-full bg-muted border-2 border-muted-foreground/20 flex items-center justify-center">
                    <span className="text-xs text-center">{highlight.slice(0, 3)}</span>
                  </div>
                  <span className="text-xs text-center max-w-[64px] truncate">{highlight}</span>
                </div>
              ))}
            </div>

            {/* Posts Tabs */}
            <Tabs defaultValue="posts" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="posts" className="flex items-center space-x-1">
                  <Grid className="w-4 h-4" />
                  <span className="hidden sm:inline">POSTS</span>
                </TabsTrigger>
                <TabsTrigger value="saved" className="flex items-center space-x-1">
                  <Bookmark className="w-4 h-4" />
                  <span className="hidden sm:inline">SAVED</span>
                </TabsTrigger>
                <TabsTrigger value="tagged" className="flex items-center space-x-1">
                  <Tag className="w-4 h-4" />
                  <span className="hidden sm:inline">TAGGED</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="posts" className="mt-6">
                <div className="grid grid-cols-3 gap-1 md:gap-4">
                  {posts.map((post) => (
                    <Link key={post.id} href={`/post/${post.id}`} className="relative aspect-square group cursor-pointer">
                      <Image
                        src={post.image || "/placeholder.svg"}
                        alt={`Post ${post.id}`}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-4 text-white">
                        <div className="flex items-center space-x-1">
                          <span className="font-semibold">{post.likes}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="font-semibold">{post.comments}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="saved" className="mt-6">
                <div className="text-center py-12">
                  <Bookmark className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Save posts you want to see again</h3>
                  <p className="text-muted-foreground">Only you can see what youve saved</p>
                </div>
              </TabsContent>

              <TabsContent value="tagged" className="mt-6">
                <div className="text-center py-12">
                  <Tag className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Photos of you</h3>
                  <p className="text-muted-foreground">When people tag you in photos, theyll appear here.</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}
