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
import { useEffect, useState } from "react"
import { getMyProfile } from "@/lib/services/profile"
import SearchDrawer from "@/components/search-drawer"

const getNavigation = (username: string) => [
  { name: "Home", href: "/", icon: Home },
  { name: "Search", href: "/search", icon: Search },
  { name: "Explore", href: "/explore", icon: Compass },
  { name: "Reels", href: "/reels", icon: Film },
  { name: "Messages", href: "/messages", icon: MessageCircle },
  { name: "Notifications", href: "/notifications", icon: Heart },
  { name: "Create", href: "/create", icon: PlusSquare },
  { name: "Profile", href: `/${username}`, icon: User },
]

const mobileNavigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Search", href: "/explore", icon: Search },
  { name: "Messages", href: "/messages", icon: MessageCircle },
  { name: "Reels", href: "/reels", icon: Film },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, logout } = useAuth()
  const { isConnected, isConnecting } = useWebSocket()
  const [navigation, setNavigation] = useState(getNavigation(""))
  const [isSearchOpen, setIsSearchOpen] = useState(false)


  useEffect(() => {
    if (isAuthenticated) {
      const fetchUsername = async () => {
        try {
          const profile = await getMyProfile()
          setNavigation(getNavigation(profile.username))
        } catch (error) {
          console.error("Failed to fetch profile:", error)
        }
      }
      fetchUsername()
    }
  }, [isAuthenticated])

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const { conversations } = useConversationStore()
  const { unreadCount: unreadNotificationCount } = useNotificationStore()

  const totalUnreadMessages = Array.isArray(conversations)
    ? conversations.reduce((sum, convo) => sum + (convo.unread_count || 0), 0)
    : (console.warn('conversations is not an array:', conversations), 0)

  // Collapse sidebar to icons-only on /messages or when Search drawer is open
  const isMessagesPage = pathname === "/messages"
  const isSidebarCollapsed = isMessagesPage || isSearchOpen
  const sidebarWidthClass = isSidebarCollapsed ? "lg:w-20" : "lg:w-64"

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
    <>
      {/* Mobile Header - hidden on explore pages */}
      {!pathname.startsWith("/explore") && (
        <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b">
          <div className="flex items-center justify-between h-14 px-4">
            {/* Instagram Logo */}
            <Link href="/" className="flex items-center gap-2">
              <Instagram className="w-6 h-6" />
              <span className="text-xl font-bold" style={{ fontFamily: "'Pacifico', cursive, 'Brush Script MT', cursive" }}>
                Instagram
              </span>
            </Link>
            
            {/* Right Icons */}
            <div className="flex items-center gap-4">
              {/* Create Post Button */}
              <Link href="/create" className="relative">
                <PlusSquare className="w-6 h-6" />
              </Link>
              
              {/* Notifications with Badge */}
              <Link href="/notifications" className="relative">
                <Heart className={cn(
                  "w-6 h-6",
                  pathname === "/notifications" ? "fill-current" : ""
                )} />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1 text-[10px] font-medium border-2 border-background">
                    {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className={cn("hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:border-r lg:bg-background overflow-hidden transition-all duration-200 ease-in-out", sidebarWidthClass)}>
      <div className="flex flex-col flex-1 min-h-0 pt-5 pb-4">
        <Link href="/" className={cn("flex items-center flex-shrink-0 hover:opacity-80 transition-opacity", isSidebarCollapsed ? "px-4 justify-center" : "px-6")}>
          <Instagram className="w-8 h-8" />
          <span className={cn("ml-2 text-xl font-bold overflow-hidden transition-all duration-200 ease-in-out", isSidebarCollapsed ? "max-w-0 opacity-0" : "max-w-[200px] opacity-100")}>Instagram</span>
        </Link>
        <nav className="flex-1 px-3 mt-8 space-y-1">
          {navigation.map((item) => {
            const isSearchItem = item.name === "Search"
            // While search drawer is open, don't mark other items as active
            const isActive = isSearchItem ? isSearchOpen : (!isSearchOpen && pathname === item.href)
            const showDot =
              (item.name === "Messages" && totalUnreadMessages > 0) ||
              (item.name === "Notifications" && unreadNotificationCount > 0)
            
            // Enhanced dot styling for better visibility
            const dotClass = cn(
              "absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full",
              "bg-red-500 border border-background",
              "animate-pulse" // Add subtle pulse animation for new messages
            )

            if (isSearchItem) {
              return (
                <button
                  key={item.name}
                  onClick={() => setIsSearchOpen((v) => !v)}
                  aria-pressed={isSearchOpen}
                  aria-expanded={isSearchOpen}
                  title={item.name}
                  className={cn(
                    "group flex items-center px-3 py-3 text-sm font-medium rounded-lg hover:bg-muted transition-colors w-full text-left",
                    isActive ? "bg-muted" : "",
                    isSidebarCollapsed ? "justify-center" : ""
                  )}
                >
                  <div className={cn("relative", isSidebarCollapsed ? "" : "mr-3")}>
                    <item.icon className={cn("w-6 h-6", isActive ? "fill-current" : "")} />
                  </div>
                  <span className={cn("ml-1 overflow-hidden transition-all duration-200 ease-in-out", isSidebarCollapsed ? "max-w-0 opacity-0" : "max-w-[120px] opacity-100")}>
                    {item.name}
                  </span>
                </button>
              )
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                title={item.name}
                onClick={() => { if (isSearchOpen) setIsSearchOpen(false) }}
                className={cn(
                  "group flex items-center px-3 py-3 text-sm font-medium rounded-lg hover:bg-muted transition-colors",
                  isActive ? "bg-muted" : "",
                  isSidebarCollapsed ? "justify-center" : ""
                )}
              >
                <div className={cn("relative", isSidebarCollapsed ? "" : "mr-3")}>
                <item.icon className={cn("w-6 h-6", isActive ? "fill-current" : "")} />
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
                <span className={cn("ml-1 overflow-hidden transition-all duration-200 ease-in-out", isSidebarCollapsed ? "max-w-0 opacity-0" : "max-w-[120px] opacity-100")}>
                  {item.name}
                </span>
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
              <Button variant="ghost" className={cn("w-full px-3 py-3", isSidebarCollapsed ? "justify-center" : "justify-start")}>
                <Menu className={cn("w-6 h-6", isSidebarCollapsed ? "" : "mr-3")} />
                <span className={cn("ml-2 overflow-hidden transition-all duration-200 ease-in-out", isSidebarCollapsed ? "max-w-0 opacity-0" : "max-w-[120px] opacity-100")}>More</span>
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

      {/* Search Drawer (opens beside sidebar) */}
      <SearchDrawer isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} sidebarIsCollapsed={isSidebarCollapsed} />

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
        <nav className="flex justify-around items-center h-16 px-2">
          {mobileNavigation.map((item) => {
            const isSearchItem = item.name === "Search"
            // On mobile, show Search as active when on any /explore route; other items match href
            const isActive = item.name === "Search" ? pathname.startsWith('/explore') : pathname === item.href
            const showDot =
              (item.name === "Messages" && totalUnreadMessages > 0) ||
              (item.name === "Notifications" && unreadNotificationCount > 0)
            
            if (isSearchItem) {
              return (
                <button
                  key={item.name}
                  onClick={() => router.push('/explore')}
                  title={item.name}
                  className={cn(
                    "flex flex-col items-center justify-center flex-1 py-2 transition-colors",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  <div className="relative">
                    <item.icon className={cn("w-6 h-6", isActive ? "fill-current" : "")} />
                    {showDot && (
                      <>
                        {/* Show unread count badge */}
                        {item.name === "Messages" && totalUnreadMessages > 0 && (
                          <span className="absolute -top-2 -right-2 min-w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1 text-[10px] font-medium border border-background">
                            {totalUnreadMessages > 99 ? '99+' : totalUnreadMessages}
                          </span>
                        )}
                        {item.name === "Notifications" && unreadNotificationCount > 0 && (
                          <span className="absolute -top-2 -right-2 min-w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1 text-[10px] font-medium border border-background">
                            {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </button>
              )
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => { if (isSearchOpen) setIsSearchOpen(false) }}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 py-2 transition-colors",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <div className="relative">
                  <item.icon className={cn("w-6 h-6", isActive ? "fill-current" : "")} />
                  {showDot && (
                    <>
                      {/* Show unread count badge */}
                      {item.name === "Messages" && totalUnreadMessages > 0 && (
                        <span className="absolute -top-2 -right-2 min-w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1 text-[10px] font-medium border border-background">
                          {totalUnreadMessages > 99 ? '99+' : totalUnreadMessages}
                        </span>
                      )}
                      {item.name === "Notifications" && unreadNotificationCount > 0 && (
                        <span className="absolute -top-2 -right-2 min-w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1 text-[10px] font-medium border border-background">
                          {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </Link>
            )
          })}
          
          {/* More Menu for Mobile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex flex-col items-center justify-center flex-1 py-2 text-muted-foreground">
                <Menu className="w-6 h-6" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mb-2">
              {navigation.filter(item => !mobileNavigation.find(m => m.name === item.name)).map((item) => (
                <DropdownMenuItem key={item.name} asChild>
                  <Link href={item.href} onClick={() => { if (isSearchOpen) setIsSearchOpen(false) }} className="flex items-center cursor-pointer">
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
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
        </nav>
        
        {/* WebSocket Connection Status for Mobile */}
        {isAuthenticated && (!isConnected || isConnecting) && (
          <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 px-3 py-1">
            <div className="flex items-center text-xs text-muted-foreground bg-muted/90 backdrop-blur-sm rounded-full px-3 py-1 shadow-lg">
              <div className={cn(
                "w-2 h-2 rounded-full mr-2",
                isConnecting ? "bg-yellow-500 animate-pulse" : "bg-red-500"
              )} />
              {isConnecting ? "Connecting..." : "Reconnecting..."}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
