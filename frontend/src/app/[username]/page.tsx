"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Grid,
    Bookmark,
    Settings,
    BadgeCheck,
    MoreHorizontal,
    Heart,
    MessageSquare,
    Users,
    Camera,
    UserRound,
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
import { getSavedPosts } from "@/lib/services/savedPosts"
import { PostType } from "@/types/post"
import { FollowersFollowingModal } from "@/components/followers-following-modal"

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
    const [savedPosts, setSavedPosts] = useState<PostType[]>([])
    const [isLoadingSaved, setIsLoadingSaved] = useState(false)
    const [followersModalOpen, setFollowersModalOpen] = useState(false)
    const [followingModalOpen, setFollowingModalOpen] = useState(false)

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

    useEffect(() => {
        // If this is the profile of the logged-in user, fetch saved posts
        if (!user) return
        if (!user.is_self) return

        const fetchSaved = async () => {
            setIsLoadingSaved(true)
            try {
                const saved = await getSavedPosts()
                setSavedPosts(saved)
            } catch (err) {
                console.error("Failed to fetch saved posts", err)
            } finally {
                setIsLoadingSaved(false)
            }
        }

        fetchSaved()
    }, [user])

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

    const isOwnProfile = user?.is_self

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
                                The user you&apos;re looking for doesn&apos;t exist or may have been removed.
                            </p>
                            <Button onClick={() => router.back()}>Go back</Button>
                        </div>
                    </main>
                </div>
            </div>
        )
    }

    if (!user) return null

    return (
        <div className="min-h-screen bg-background">
            <div className="flex">
                <Sidebar />
                <main className="flex-1 lg:ml-64">
                    <div className="max-w-4xl mx-auto px-4 py-6 pt-16 pb-20 lg:pt-8 lg:pb-8 text-lg">
                        {/* Top Header: Settings + Username (mobile only, fixed) */}
                        <div className="fixed top-0 left-0 right-0 z-30 bg-background border-b border-border lg:hidden">
                            <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between">
                                <button onClick={() => router.push('/account/settings')} className="w-8 h-8 bg-muted rounded-full flex items-center justify-center hover:bg-muted/80">
                                    <Settings className="w-4 h-4" />
                                </button>
                                <h2 className="text-lg font-semibold">{user.username}</h2>
                                <div className="w-8 h-8" />
                            </div>
                        </div>

                        {/* Profile Header - Side by Side Layout */}
                        <div className="flex items-start space-x-6 mb-6">
                            {/* Avatar with Note Button */}
                            <div className="relative flex-shrink-0">
                                <Avatar className="w-24 h-24">
                                    <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.username} />
                                    <AvatarFallback className="text-2xl">{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                            </div>

                            {/* User Info */}
                            <div className="flex-1 min-w-0">
                                {/* Username */}
                                <div className="flex items-center space-x-2 mb-3">
                                    <h1 className="text-2xl font-semibold">{user.username}</h1>
                                    {user.is_verified && (
                                        <BadgeCheck className="w-5 h-5 text-blue-500 fill-current flex-shrink-0" />
                                    )}
                                </div>

                                {/* Full Name */}
                                {user.full_name && (
                                    <h2 className="text-base font-semibold mb-3">{user.full_name}</h2>
                                )}

                                {/* Stats */}
                                <div className="flex items-center space-x-4 text-base mb-3">
                                    <span>
                                        <strong className="font-semibold">{user.posts_count}</strong> posts
                                    </span>
                                    <button 
                                        onClick={() => setFollowersModalOpen(true)}
                                        className="hover:opacity-80 transition-opacity"
                                    >
                                        <strong className="font-semibold">{formatNumber(followerCount)}</strong> followers
                                    </button>
                                    <button 
                                        onClick={() => setFollowingModalOpen(true)}
                                        className="hover:opacity-80 transition-opacity"
                                    >
                                        <strong className="font-semibold">{user.following_count}</strong> following
                                    </button>
                                </div>

                                {/* Bio */}
                                {user.bio && (
                                    <p className="text-sm mb-2">{user.bio}</p>
                                )}

                                {/* Social Links */}
                                <div className="flex flex-col space-y-1 text-sm">
                                    {user.website && (
                                        <a
                                            href={`https://${user.website}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center space-x-2 text-blue-500 hover:underline"
                                        >
                                            <span>🔗</span>
                                            <span>{user.full_name || user.username}</span>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-2 mb-6">
                            {isOwnProfile ? (
                                <>
                                    <Button variant="secondary" className="flex-1 py-2" asChild>
                                        <Link href="/account/edit">Edit profile</Link>
                                    </Button>
                                    <Button variant="secondary" className="flex-1 py-2">
                                        View archive
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        variant={isFollowing ? "secondary" : "default"}
                                        className="flex-1 py-2"
                                        onClick={handleFollow}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        ) : isFollowing ? (
                                            "Following"
                                        ) : (
                                            "Follow"
                                        )}
                                    </Button>
                                    <Button variant="secondary" className="flex-1 py-2">
                                        Message
                                    </Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="secondary" size="icon">
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

                        {/* Highlights */}
                        <div className="flex space-x-4 mb-6 overflow-x-auto pb-2">
                            <button className="flex flex-col items-center flex-shrink-0">
                                <div className="w-20 h-20 rounded-full border-2 border-muted-foreground/20 flex items-center justify-center hover:border-muted-foreground/40 transition-colors bg-background">
                                    <span className="text-4xl text-muted-foreground">+</span>
                                </div>
                                <span className="text-xs mt-1">New</span>
                            </button>
                        </div>

                        {/* Posts Tabs */}
                        <Tabs defaultValue="posts" className="w-full">
                            <TabsList className="grid w-full grid-cols-3 border-t border-border">
                                <TabsTrigger 
                                    value="posts" 
                                    className="flex items-center justify-center space-x-2 data-[state=active]:border-t-2 data-[state=active]:border-foreground -mt-px"
                                >
                                    <Grid className="w-6 h-6" />
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="saved" 
                                    className="flex items-center justify-center space-x-2 data-[state=active]:border-t-2 data-[state=active]:border-foreground -mt-px"
                                >
                                    <Bookmark className="w-6 h-6" />
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="tagged" 
                                    className="flex items-center justify-center space-x-2 data-[state=active]:border-t-2 data-[state=active]:border-foreground -mt-px"
                                >
                                    <UserRound className="w-6 h-6" />
                                </TabsTrigger> 
                            </TabsList>

                            <TabsContent value="posts" className="mt-8">
                                {posts.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-1">
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
                                                        <Heart className="w-6 h-6 fill-white" />
                                                        <span className="font-semibold">{formatNumber(post.likes)}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <MessageSquare className="w-6 h-6 fill-white" />
                                                        <span className="font-semibold">{post.comments}</span>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 mx-auto mb-6 rounded-full border-2 border-foreground flex items-center justify-center">
                                            <Camera className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-3xl font-bold mb-2">Share Photos</h3>
                                        <p className="text-sm text-muted-foreground">
                                            When you share photos, they will appear on your profile.
                                        </p>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="saved" className="mt-8">
                                {isOwnProfile ? (
                                    isLoadingSaved ? (
                                        <div className="text-center py-12">Loading...</div>
                                    ) : savedPosts.length > 0 ? (
                                        <div className="grid grid-cols-3 gap-1">
                                            {savedPosts.map((post) => (
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
                                                            <Heart className="w-6 h-6 fill-white" />
                                                            <span className="font-semibold">{formatNumber(post.likes)}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-1">
                                                            <MessageSquare className="w-6 h-6 fill-white" />
                                                            <span className="font-semibold">{post.comments}</span>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <div className="w-20 h-20 mx-auto mb-6 rounded-full border-2 border-foreground flex items-center justify-center">
                                                <Camera className="w-10 h-10" />
                                            </div>
                                            <h3 className="text-4xl font-bold mb-2">Share Photos</h3>
                                            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                                                Save photos and videos that you want to see again. No one is notified, and only you can see what you&apos;ve saved.
                                            </p>
                                        </div>
                                    )
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="w-20 h-20 mx-auto mb-6 rounded-full border-2 border-foreground flex items-center justify-center">
                                            <Camera className="w-10 h-10" />
                                        </div>
                                        <h3 className="text-4xl font-bold mb-2">Share Photos</h3>
                                        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                                            Save photos and videos that you want to see again. No one is notified, and only you can see what you&apos;ve saved.
                                        </p>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="tagged" className="mt-8">
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 mx-auto mb-6 rounded-full border-2 border-foreground flex items-center justify-center">
                                        <UserRound className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-3xl font-bold mb-2">Photos of you</h3>
                                    <p className="text-sm text-muted-foreground">
                                        When people tag you in photos, they&apos;ll appear here.
                                    </p>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </main>
            </div>

            {user && (
                <>
                    <FollowersFollowingModal
                        isOpen={followersModalOpen}
                        onOpenChange={setFollowersModalOpen}
                        username={username}
                        type="followers"
                        currentUsername={user.username}
                    />

                    <FollowersFollowingModal
                        isOpen={followingModalOpen}
                        onOpenChange={setFollowingModalOpen}
                        username={username}
                        type="following"
                        currentUsername={user.username}
                    />
                </>
            )}
        </div>
    )
}