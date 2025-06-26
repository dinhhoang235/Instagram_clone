"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { X, UserPlus, BadgeCheck } from "lucide-react"
import Link from "next/link"
import { getSuggestedUsers, toggleFollowUser } from "@/lib/services/profile"
import type { SuggestedUserType } from "@/types/profile"

interface SuggestedUsersProps {
    variant?: "sidebar" | "page"
    limit?: number
}

export function SuggestedUsers({ variant = "sidebar", limit }: SuggestedUsersProps) {
    const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUserType[]>([])
    const [followedUsers, setFollowedUsers] = useState<Record<string, boolean>>({})
    const [dismissedUsers, setDismissedUsers] = useState<Set<string>>(new Set())

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const users = await getSuggestedUsers()
                setSuggestedUsers(users)
            } catch (error) {
                console.error("Failed to fetch suggested users:", error)
            }
        }
        fetchUsers()
    }, [])

    const displayUsers = suggestedUsers
        .filter((user) => !dismissedUsers.has(user.id))
        .slice(0, limit || (variant === "sidebar" ? 5 : undefined))

    const handleToggleFollow = async (username: string) => {
        try {
            const res = await toggleFollowUser(username)
            setFollowedUsers((prev) => ({
                ...prev,
                [username]: res.is_following,
            }))
        } catch (err) {
            console.error("Failed to toggle follow:", err)
        }
    }

    const handleDismiss = (userId: string) => {
        setDismissedUsers((prev) => new Set([...prev, userId]))
    }

    if (variant === "sidebar") {
        return (
            <div className="bg-background">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-muted-foreground">Suggested for you</h3>
                    <Link href="/explore/people" className="text-xs font-semibold text-foreground hover:text-muted-foreground">
                        See All
                    </Link>
                </div>

                <div className="space-y-3">
                    {displayUsers.map((user) => (
                        <div key={user.username} className="flex items-center">
                            <Avatar className="w-8 h-8 mr-3">
                                <AvatarImage src={user.avatar} alt={user.username} />
                                <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-1 mb-0.5">
                                    <Link href={`/${user.username}`} className="font-semibold text-sm hover:underline truncate">
                                        {user.username}
                                    </Link>
                                    {user.isVerified && (
                                        <BadgeCheck className="w-3 h-3 text-blue-500 fill-current flex-shrink-0" />
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground truncate leading-tight">{user.reason}</p>
                            </div>

                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-500 hover:text-blue-600 font-semibold text-xs px-0 ml-3 h-auto"
                                onClick={() => handleToggleFollow(user.username)}
                            >
                                {followedUsers[user.username] ?? user.isFollowing ? "Following" : "Follow"}
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        )
    }
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayUsers.map((user) => (
                <Card key={user.username} className="relative">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 p-1 h-auto"
                        onClick={() => handleDismiss(user.username)}
                    >
                        <X className="w-4 h-4" />
                    </Button>

                    <CardHeader className="text-center pb-2">
                        <Avatar className="w-16 h-16 mx-auto mb-2">
                            <AvatarImage src={user.avatar} alt={user.username} />
                            <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                            <div className="flex items-center justify-center space-x-1">
                                <Link href={`/${user.username}`} className="font-semibold hover:underline">
                                    {user.username}
                                </Link>
                                {user.isVerified && <BadgeCheck className="w-4 h-4 text-blue-500 fill-current" />}
                            </div>
                            <p className="text-sm text-muted-foreground">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.reason}</p>
                        </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                        <div className="text-center space-y-3">
                            <Button
                                variant={followedUsers[user.username] ?? user.isFollowing ? "outline" : "default"}
                                size="sm"
                                className="w-full"
                                onClick={() => handleToggleFollow(user.username)}
                            >
                                {followedUsers[user.username] ?? user.isFollowing ? (
                                    <>
                                        <UserPlus className="w-4 h-4 mr-2" />
                                        Following
                                    </>
                                ) : (
                                    "Follow"
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
