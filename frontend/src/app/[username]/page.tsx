"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
    Grid,
    Bookmark,
    Tag,
    Settings,
    BadgeCheck,
    MoreHorizontal,
    UserPlus,
    UserMinus,
    MessageCircle,
    Heart,
    MessageSquare,
    Users,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import { redirect } from "next/navigation"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ProfileType } from "@/types/profile"
import { getUserProfile, toggleFollowUser } from "@/lib/services/profile"
import { getPostsByUsername } from "@/lib/services/posts"
import { PostType } from "@/types/post"

export default function ProfilePage() {
    const { isAuthenticated } = useAuth()
    const params = useParams()
    const router = useRouter()
    const username = params.username as string

    const [user, setUser] = useState<ProfileType | null>(null)
    const [notFound, setNotFound] = useState(false)
    const [isFollowing, setIsFollowing] = useState(false)
    const [followerCount, setFollowerCount] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const [posts, setPosts] = useState<PostType[]>([])

    // Redirect nếu chưa đăng nhập
    useEffect(() => {
        if (!isAuthenticated) redirect("/login")
    }, [isAuthenticated])

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await getUserProfile(username)
                setUser(data)
                setIsFollowing(data.is_following)
                setFollowerCount(data.followers_count)
                const posts = await getPostsByUsername(username)
                setPosts(posts)
            } catch (err) {
                console.error("Profile not found", err)
                setNotFound(true)
            }
        }

        if (username) {
            fetchProfile()
        }
    }, [username])

    const isOwnProfile = user?.is_self

    const handleFollow = async () => {
        setIsLoading(true)
        try {
            const res = await toggleFollowUser(username)
            setIsFollowing(res.is_following)
            setFollowerCount((prev) => (res.is_following ? prev + 1 : prev - 1))
        } catch (error) {
            console.error("Follow error", error)
        } finally {
            setIsLoading(false)
        }
    }

    const formatNumber = (num: number) =>
        num >= 1_000_000
            ? (num / 1_000_000).toFixed(1) + "M"
            : num >= 1000
                ? (num / 1000).toFixed(1) + "K"
                : num.toString()

    if (notFound) {
        return (
            <div className="min-h-screen bg-background">
                <div className="flex">
                    <Sidebar />
                    <main className="flex-1 lg:ml-64">
                        <div className="max-w-4xl mx-auto px-4 py-8 pt-16 pb-20 lg:pt-8 lg:pb-8 text-center">
                            <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                                <Users className="w-16 h-16 text-muted-foreground" />
                            </div>
                            <h1 className="text-2xl font-bold mb-2">User not found</h1>
                            <p className="text-muted-foreground mb-4">
                                The user youre looking for doesnt exist or may have been removed.
                            </p>
                            <Button onClick={() => router.back()}>Go back</Button>
                        </div>
                    </main>
                </div>
            </div>
        )
    }

    if (!user) return null // loading...

    return (
        <div className="min-h-screen bg-background">
            <div className="flex">
                <Sidebar />
                <main className="flex-1 lg:ml-64">
                    <div className="max-w-4xl mx-auto px-4 py-8 pt-16 pb-20 lg:pt-8 lg:pb-8">
                        {/* Profile Header */}
                        <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-8 mb-8">
                            <Avatar className="w-32 h-32 md:w-40 md:h-40">
                                <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.username} />
                                <AvatarFallback className="text-2xl">{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>

                            <div className="flex-1 space-y-4 w-full">
                                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                                    <div className="flex items-center space-x-2">
                                        <h1 className="text-xl font-light">{user.username}</h1>
                                        {user.is_verified && <BadgeCheck className="w-5 h-5 text-blue-500 fill-current" />}
                                        {user.is_private && (
                                            <Badge variant="secondary" className="text-xs">
                                                Private
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="flex space-x-2">
                                        {isOwnProfile ? (
                                            <>
                                                <Link href="/profile/edit">
                                                    <Button variant="secondary" size="sm">
                                                        Edit profile
                                                    </Button>
                                                </Link>
                                                <Button variant="secondary" size="sm">
                                                    View archive
                                                </Button>
                                                <Button variant="ghost" size="sm">
                                                    <Settings className="w-4 h-4" />
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                <Button
                                                    variant={isFollowing ? "outline" : "default"}
                                                    size="sm"
                                                    onClick={handleFollow}
                                                    disabled={isLoading}
                                                    className="min-w-[80px]"
                                                >
                                                    {isLoading ? (
                                                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                    ) : isFollowing ? (
                                                        <>
                                                            <UserMinus className="w-4 h-4 mr-1" />
                                                            Following
                                                        </>
                                                    ) : (
                                                        <>
                                                            <UserPlus className="w-4 h-4 mr-1" />
                                                            Follow
                                                        </>
                                                    )}
                                                </Button>
                                                <Button variant="secondary" size="sm">
                                                    <MessageCircle className="w-4 h-4 mr-1" />
                                                    Message
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem>Block</DropdownMenuItem>
                                                        <DropdownMenuItem>Restrict</DropdownMenuItem>
                                                        <DropdownMenuItem>Report</DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem>Copy profile URL</DropdownMenuItem>
                                                        <DropdownMenuItem>Share this profile</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="flex space-x-8 text-sm">
                                    <span>
                                        <strong>{user.posts_count.toLocaleString()}</strong> posts
                                    </span>
                                    <button className="hover:underline">
                                        <strong>{formatNumber(followerCount)}</strong> followers
                                    </button>
                                    <button className="hover:underline">
                                        <strong>{user.following_count.toLocaleString()}</strong> following
                                    </button>
                                </div>

                                <div className="space-y-1">
                                    <h2 className="font-semibold">{user.full_name}</h2>
                                    <div className="text-sm whitespace-pre-line">{user.bio}</div>
                                    {user.website && (
                                        <a
                                            href={`https://${user.website}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-600 hover:underline block"
                                        >
                                            {user.website}
                                        </a>
                                    )}
                                    {!isOwnProfile && user.mutual_followers_count > 0 && (
                                        <p className="text-sm text-muted-foreground">
                                            Followed by {user.mutual_followers_count} people you follow
                                        </p>
                                    )}
                                    <p className="text-xs text-muted-foreground">{user.join_date}</p>
                                </div>
                            </div>
                        </div>

                        {/* Highlights */}
                        {/* <div className="flex space-x-4 mb-8 overflow-x-auto pb-2">
              {user.highlights.map((highlight) => (
                <div key={highlight} className="flex flex-col items-center space-y-1 min-w-0">
                  <div className="w-16 h-16 rounded-full bg-muted border-2 border-muted-foreground/20 flex items-center justify-center">
                    <span className="text-xs text-center">{highlight.slice(0, 3)}</span>
                  </div>
                  <span className="text-xs text-center max-w-[64px] truncate">{highlight}</span>
                </div>
              ))}
            </div> */}

                        {/* Posts Tabs */}
                        <Tabs defaultValue="posts" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="posts" className="flex items-center space-x-1">
                                    <Grid className="w-4 h-4" />
                                    <span className="hidden sm:inline">POSTS</span>
                                </TabsTrigger>
                                {isOwnProfile && (
                                    <TabsTrigger value="saved" className="flex items-center space-x-1">
                                        <Bookmark className="w-4 h-4" />
                                        <span className="hidden sm:inline">SAVED</span>
                                    </TabsTrigger>
                                )}
                                <TabsTrigger value="tagged" className="flex items-center space-x-1">
                                    <Tag className="w-4 h-4" />
                                    <span className="hidden sm:inline">TAGGED</span>
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="posts" className="mt-6">
                                {posts.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-1 md:gap-4">
                                        {posts.map((post) => (
                                            <Link
                                                href={`/post/${post.id}`}
                                                key={post.id}
                                                className="relative aspect-square group cursor-pointer"
                                            >
                                                <Image
                                                    src={post.image || "/placeholder.svg"}
                                                    alt={`Post ${post.id}`}
                                                    fill
                                                    className="object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-4 text-white">
                                                    <div className="flex items-center space-x-1">
                                                        <Heart className="w-5 h-5 fill-white" />
                                                        <span className="font-semibold">{formatNumber(post.likes)}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <MessageSquare className="w-5 h-5 fill-white" />
                                                        <span className="font-semibold">{post.comments}</span>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-muted-foreground flex items-center justify-center">
                                            <Grid className="w-8 h-8 text-muted-foreground" />
                                        </div>
                                        <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                                        <p className="text-muted-foreground">
                                            {isOwnProfile ? "Share your first photo or video" : "No posts to show"}
                                        </p>
                                    </div>
                                )}
                            </TabsContent>

                            {isOwnProfile && (
                                <TabsContent value="saved" className="mt-6">
                                    <div className="text-center py-12">
                                        <Bookmark className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                                        <h3 className="text-lg font-semibold mb-2">Save posts you want to see again</h3>
                                        <p className="text-muted-foreground">Only you can see what youre saved</p>
                                    </div>
                                </TabsContent>
                            )}

                            <TabsContent value="tagged" className="mt-6">
                                <div className="text-center py-12">
                                    <Tag className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                                    <h3 className="text-lg font-semibold mb-2">Photos of {isOwnProfile ? "you" : user.username}</h3>
                                    <p className="text-muted-foreground">
                                        {isOwnProfile
                                            ? "When people tag you in photos, they'll appear here."
                                            : "Photos this person has been tagged in will appear here."}
                                    </p>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </main>
            </div>
        </div>
    )
}
