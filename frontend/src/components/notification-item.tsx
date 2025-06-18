import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { NotificationType } from "@/types/notification"

interface NotificationItemProps {
  notification: NotificationType
}

export function NotificationItem({ notification }: NotificationItemProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50">
      <div className="flex items-center space-x-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={notification.user.avatar || "/placeholder.svg"} alt={notification.user.username} />
          <AvatarFallback>{notification.user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <p className="text-sm">
            <Link href={`/${notification.user.username}`} className="font-semibold hover:underline">
              {notification.user.username}
            </Link>{" "}
            {notification.content} <span className="text-muted-foreground">{notification.time}</span>
          </p>
        </div>
      </div>

      {notification.type === "follow" ? (
        <Button variant="outline" size="sm" className="ml-4">
          Follow
        </Button>
      ) : notification.postImage ? (
        <div className="relative w-12 h-12 ml-4">
          <Image src={notification.postImage || "/placeholder.svg"} alt="Post" fill className="object-cover" />
        </div>
      ) : null}
    </div>
  )
}
