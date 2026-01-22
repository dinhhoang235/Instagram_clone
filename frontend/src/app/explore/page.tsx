"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Grid, Users, Hash, MapPin, Heart, MessageSquare } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { redirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { PostType } from "@/types/post"
import { getPostsExplore } from "@/lib/services/posts"
import { TagType } from "@/types/tag"
import { getTrendingTags } from "@/lib/services/tags"
import { getPopularPlaces } from "@/lib/services/posts"
import { SearchIcon } from "lucide-react"
import { useRouter } from "next/navigation"


export default function ExplorePage() {
    const router = useRouter()
    const [posts, setPosts] = useState<PostType[]>([])
    const [tags, setTags] = useState<TagType[]>([])
    const [places, setPlaces] = useState<{ location: string; postCount: number }[]>([])
    const [loading, setLoading] = useState(true)
    const { isAuthenticated } = useAuth()

    if (!isAuthenticated) {
        redirect("/login")
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [postsData, tagsData, placesData] = await Promise.all([
                    getPostsExplore(),
                    getTrendingTags(),
                    getPopularPlaces(), // ← thêm gọi API địa điểm
                ])
                setPosts(postsData)
                setTags(tagsData)
                setPlaces(placesData) // ← cập nhật state cho tab Places
            } catch (error) {
                console.error("Error fetching explore data:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    return (
        <div className="min-h-screen bg-background">
            <div className="flex">
                <Sidebar />
                <main className="flex-1 lg:ml-64">
                    <div className="max-w-6xl mx-auto px-4 pt-4 pb-8 lg:pt-8 lg:pb-8">

                        {/* Mobile-only search header: click to go to /explore/search */}
                        <div className="mb-4 lg:hidden">
                          <div className="flex items-center justify-between">
                            <button
                              className="flex items-center gap-3 px-3 py-2 rounded-full bg-muted w-full text-left"
                              onClick={() => router.push('/explore/search')}
                            >
                              <SearchIcon className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">Search</span>
                            </button>
                          </div>
                        </div>


                        <Tabs defaultValue="posts" className="w-full">
                            <TabsList className="grid w-full grid-cols-4 mb-8">
                                <TabsTrigger value="posts" className="flex items-center space-x-2">
                                    <Grid className="w-4 h-4" />
                                    <span className="hidden sm:inline">Posts</span>
                                </TabsTrigger>
                                <TabsTrigger value="people" className="flex items-center space-x-2">
                                    <Users className="w-4 h-4" />
                                    <span className="hidden sm:inline">People</span>
                                </TabsTrigger>
                                <TabsTrigger value="tags" className="flex items-center space-x-2">
                                    <Hash className="w-4 h-4" />
                                    <span className="hidden sm:inline">Tags</span>
                                </TabsTrigger>
                                <TabsTrigger value="places" className="flex items-center space-x-2">
                                    <MapPin className="w-4 h-4" />
                                    <span className="hidden sm:inline">Places</span>
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="posts">
                                <div className="grid grid-cols-3 gap-1 md:gap-4">
                                    {loading ? (
                                        <p className="col-span-3 text-center py-8 text-muted-foreground">Loading...</p>
                                    ) : posts.length === 0 ? (
                                        <p className="col-span-3 text-center py-8 text-muted-foreground">No posts found.</p>
                                    ) : (
                                        posts.map((post) => (
                                            <Link
                                                key={post.id}
                                                href={`/post/${post.id}`}
                                                className="relative aspect-square group cursor-pointer"

                                            >
                                                <div key={post.id} className="aspect-square relative group cursor-pointer">
                                                    <Image
                                                        src={post.image}
                                                        alt={post.caption || "Explore post"}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-4 text-white">
                                                        <div className="flex items-center space-x-1">
                                                            <Heart className="w-5 h-5 fill-white" />
                                                            <span className="font-semibold">{post.likes}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-1">
                                                            <MessageSquare className="w-5 h-5 fill-white" />
                                                            <span className="font-semibold">{post.comments}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>

                                        ))
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="people">
                                <div className="text-center py-8">
                                    <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                                    <h3 className="text-lg font-semibold mb-2">Discover People</h3>
                                    <p className="text-muted-foreground mb-4">Find new accounts to follow</p>
                                    <Link href="/explore/people">
                                        <Button>Explore People</Button>
                                    </Link>
                                </div>
                            </TabsContent>

                            <TabsContent value="tags">
                                <div className="text-center py-8">
                                    <Hash className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                                    <h3 className="text-lg font-semibold mb-2">Trending Tags</h3>
                                    {tags.length === 0 ? (
                                        <p className="text-center text-muted-foreground">No trending tags found.</p>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                            {tags.map((tag) => (
                                                <Link
                                                    key={tag.id}
                                                    href={`/explore/tags/${tag.name}`}
                                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted transition"
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center text-xl font-bold text-primary">#</div>
                                                        <div>
                                                            <p className="font-medium text-foreground">#{tag.name}</p>
                                                            <p className="text-sm text-muted-foreground">{tag.postCount} posts</p>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="places">
                                <div className="text-center py-8">
                                    <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                                    <h3 className="text-lg font-semibold mb-2">Popular Places</h3>
                                    {places.length === 0 ? (
                                        <p className="text-center text-muted-foreground">No locations found.</p>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                            {places.map((place) => (
                                                <Link
                                                    key={place.location}
                                                    href={`/explore/places/${encodeURIComponent(place.location)}`}
                                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted transition"
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center text-xl text-primary">
                                                            <MapPin className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-foreground">{place.location}</p>
                                                            <p className="text-sm text-muted-foreground">{place.postCount} posts</p>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </main>
            </div>
        </div>
    )
}
