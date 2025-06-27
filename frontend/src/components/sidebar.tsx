"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Home,
  Search,
  Compass,
  Film,
  MessageCircle,
  Heart,
  PlusSquare,
  User,
  Menu,
  Instagram,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth-provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useConversationStore } from "@/stores/useConversationStore"
import { useNotificationStore } from "@/stores/useNotificationStore"
import { useWebSocket } from "@/components/message-provider"
import { useEffect } from "react"

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Search", href: "/search", icon: Search },
  { name: "Explore", href: "/explore", icon: Compass },
  { name: "Reels", href: "/reels", icon: Film },
  { name: "Messages", href: "/messages", icon: MessageCircle },
  { name: "Notifications", href: "/notifications", icon: Heart },
  { name: "Create", href: "/create", icon: PlusSquare },
  { name: "Profile", href: "/profile", icon: User },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, logout } = useAuth()
  const { isConnected, isConnecting } = useWebSocket()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const { conversations } = useConversationStore()
  const { unreadCount: unreadNotificationCount } = useNotificationStore()

  const totalUnreadMessages = conversations.reduce(
    (sum, convo) => sum + convo.unread_count,
    0
  )

  // Effect to update browser title with unread count
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const originalTitle = 'Instagram'
      const totalUnread = totalUnreadMessages + unreadNotificationCount
      
      if (isAuthenticated && totalUnread > 0) {
        document.title = `(${totalUnread}) ${originalTitle}`
      } else {
        document.title = originalTitle
      }
    }
  }, [totalUnreadMessages, unreadNotificationCount, isAuthenticated])

  // If not authenticated, don't show the sidebar
  if (
    !isAuthenticated &&
    !["/", "/login", "/register"].includes(pathname)
  ) {
    return null;
  }

  return (
    <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:border-r lg:bg-background">
      <div className="flex flex-col flex-1 min-h-0 pt-5 pb-4">
        <div className="flex items-center flex-shrink-0 px-6">
          <Instagram className="w-8 h-8" />
          <span className="ml-2 text-xl font-bold">Instagram</span>
        </div>
        <nav className="flex-1 px-3 mt-8 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const showDot =
              (item.name === "Messages" && totalUnreadMessages > 0) ||
              (item.name === "Notifications" && unreadNotificationCount > 0)
            
            // Enhanced dot styling for better visibility
            const dotClass = cn(
              "absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full",
              "bg-red-500 border border-background",
              "animate-pulse" // Add subtle pulse animation for new messages
            )
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center px-3 py-3 text-sm font-medium rounded-lg hover:bg-muted transition-colors",
                  isActive ? "bg-muted" : "",
                )}
              >
                <div className="relative mr-3">
                <item.icon className={cn("w-6 h-6 mr-3", isActive ? "fill-current" : "")} />
                  {showDot && (
                    <>
                      <span className={dotClass} />
                      {/* Show unread count for messages */}
                      {item.name === "Messages" && totalUnreadMessages > 0 && totalUnreadMessages < 100 && (
                        <span className="absolute -top-2 -right-2 min-w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1 text-[10px] font-medium border border-background">
                          {totalUnreadMessages > 99 ? '99+' : totalUnreadMessages}
                        </span>
                      )}
                      {/* Show unread count for notifications */}
                      {item.name === "Notifications" && unreadNotificationCount > 0 && unreadNotificationCount < 100 && (
                        <span className="absolute -top-2 -right-2 min-w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1 text-[10px] font-medium border border-background">
                          {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                        </span>
                      )}
                    </>
                  )}
                </div>
                {item.name}
              </Link>
            )
          })}
        </nav>
        
        {/* WebSocket Connection Status - show when disconnected or connecting */}
        {isAuthenticated && (!isConnected || isConnecting) && (
          <div className="px-3 py-2">
            <div className="flex items-center text-xs text-muted-foreground bg-muted/50 rounded-lg px-2 py-1">
              <div className={cn(
                "w-2 h-2 rounded-full mr-2",
                isConnecting ? "bg-yellow-500 animate-pulse" : "bg-red-500"
              )} />
              {isConnecting ? "Connecting..." : "Reconnecting..."}
            </div>
          </div>
        )}
        
        <div className="flex-shrink-0 px-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start px-3 py-3">
                <Menu className="w-6 h-6 mr-3" />
                More
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Your activity</DropdownMenuItem>
              <DropdownMenuItem>Saved</DropdownMenuItem>
              <DropdownMenuItem>Switch appearance</DropdownMenuItem>
              <DropdownMenuItem>Report a problem</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-500">
                <LogOut className="w-4 h-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
