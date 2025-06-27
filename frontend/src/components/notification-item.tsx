import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { NotificationType } from "@/types/notification"
import { useNotificationStore } from "@/stores/useNotificationStore"
import { markNotificationAsRead } from "@/lib/services/notifications"
import { toggleFollowUser } from "@/lib/services/profile"
import { cn } from "@/lib/utils"

interface NotificationItemProps {
  notification: NotificationType
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const { markAsRead } = useNotificationStore()
  const router = useRouter()
  const [isFollowing, setIsFollowing] = useState(notification.user.is_following || false)
  const [isLoading, setIsLoading] = useState(false)

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsLoading(true)
    
    try {
      const result = await toggleFollowUser(notification.user.username)
      setIsFollowing(result.is_following)
      console.log(`✅ ${result.is_following ? 'Followed' : 'Unfollowed'} ${notification.user.username}`)
    } catch (error) {
      console.error("Failed to toggle follow:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClick = async () => {
    // Mark only THIS specific notification as read
    if (!notification.is_read) {
      try {
        console.log(`📖 Marking notification ${notification.id} as read`)
        await markNotificationAsRead(notification.id)
        markAsRead(notification.id) // Update local store
        console.log(`✅ Notification ${notification.id} marked as read successfully`)
      } catch (error) {
        console.error(`❌ Failed to mark notification ${notification.id} as read:`, error)
      }
    }
    
    // Navigate using Next.js router (no page reload)
    if (notification.link) {
      console.log(`🔗 Navigating to: ${notification.link}`)
      router.push(notification.link)
    }
  }

  return (
    <div 
      className={cn(
        "flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors",
        !notification.is_read && "bg-blue-50 dark:bg-blue-950/20 border-l-4 border-l-blue-500"
      )}
      onClick={handleClick}
    >
      <div className="flex items-center space-x-3">
        <div className="relative">
          <Avatar className="w-10 h-10">
            <AvatarImage src={notification.user.avatar || "/placeholder.svg"} alt={notification.user.username} />
            <AvatarFallback>{notification.user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          {!notification.is_read && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full" />
          )}
        </div>

        <div className="flex-1">
          <p className={cn(
            "text-sm",
            !notification.is_read && "font-medium"
          )}>
            <Link 
              href={`/${notification.user.username}`} 
              className="font-semibold hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {notification.user.username}
            </Link>{" "}
            {notification.content} <span className="text-muted-foreground">{notification.time}</span>
          </p>
          {!notification.is_read && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">New</p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2 ml-4">
        {notification.type === "follow" ? (
          <Button 
            variant={isFollowing ? "outline" : "default"}
            size="sm"
            onClick={handleFollow}
            disabled={isLoading}
            className="min-w-[80px]"
          >
            {isLoading ? "..." : isFollowing ? "Following" : "Follow"}
          </Button>
        ) : notification.postImage ? (
          <div className="relative w-12 h-12">
            <Image 
              src={notification.postImage || "/placeholder.svg"} 
              alt="Post" 
              fill 
              className="object-cover rounded" 
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}
