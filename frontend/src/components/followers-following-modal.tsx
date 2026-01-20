'use client'

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getFollowers, getFollowing, toggleFollowUser, removeFollower } from "@/lib/services/profile"
import type { ProfileType } from "@/types/profile"
import Link from "next/link"

interface FollowersFollowingModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  username: string
  type: 'followers' | 'following'
  currentUsername?: string
}

export function FollowersFollowingModal({
  isOpen,
  onOpenChange,
  username,
  type,
  currentUsername
}: FollowersFollowingModalProps) {
  const [users, setUsers] = useState<ProfileType[]>([])
  const [filteredUsers, setFilteredUsers] = useState<ProfileType[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!isOpen) return

    const fetchUsers = async () => {
      try {
        setLoading(true)
        let data: ProfileType[]
        
        if (type === 'followers') {
          data = await getFollowers(username)
        } else {
          data = await getFollowing(username)
        }
        
        setUsers(data)
        setFilteredUsers(data)
        
        // Create following map
        const map: Record<string, boolean> = {}
        data.forEach(user => {
          // For 'following' modal, everyone is following (that's why they appear in this list)
          // For 'followers' modal, use the actual is_following value from the API
          map[user.username] = type === 'following' ? true : user.is_following
        })
        setFollowingMap(map)
      } catch (error) {
        console.error(`Failed to fetch ${type}:`, error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [isOpen, username, type])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    const filtered = users.filter(user =>
      user.username.toLowerCase().includes(query.toLowerCase()) ||
      user.full_name.toLowerCase().includes(query.toLowerCase())
    )
    setFilteredUsers(filtered)
  }

  const handleToggleFollow = async (targetUsername: string) => {
    try {
      const result = await toggleFollowUser(targetUsername)
      setFollowingMap(prev => ({
        ...prev,
        [targetUsername]: result.is_following
      }))
    } catch (error) {
      console.error('Failed to toggle follow:', error)
    }
  }

  const handleRemoveFollower = async (followerUsername: string) => {
    try {
      await removeFollower(followerUsername)
      // Remove from the list
      setUsers(users.filter(u => u.username !== followerUsername))
      setFilteredUsers(filteredUsers.filter(u => u.username !== followerUsername))
    } catch (error) {
      console.error('Failed to remove follower:', error)
    }
  }

  const isCurrentUser = (userUsername: string) => userUsername === currentUsername

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">
            {type === 'followers' ? 'Followers' : 'Following'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full"
          />
          
          <ScrollArea className="h-[400px] w-full rounded-md border p-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No users found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredUsers.map((user) => (
                  <div
                    key={user.username}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Link
                      href={`/${user.username}`}
                      onClick={() => onOpenChange(false)}
                      className="flex items-center space-x-3 flex-1 min-w-0"
                    >
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarImage src={user.avatar} alt={user.username} />
                        <AvatarFallback>{user.full_name?.[0]?.toUpperCase() || user.username[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{user.username}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.full_name}</p>
                      </div>
                    </Link>
                    
                    {!isCurrentUser(user.username) && (
                      <>
                        {type === 'followers' ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleRemoveFollower(user.username)}
                            className="flex-shrink-0 ml-2"
                          >
                            Remove
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant={followingMap[user.username] ? 'secondary' : 'default'}
                            onClick={() => handleToggleFollow(user.username)}
                            className="flex-shrink-0 ml-2"
                          >
                            {followingMap[user.username] ? 'Following' : 'Follow'}
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
