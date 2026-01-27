"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Home,
  Search,
  Compass,
  Film,
  MessageCircle,
  Heart,
  PlusSquare,
  Menu,
  Instagram,
  LogOut,
  Settings,
  Clock,
  Bookmark,
  Moon,
  HelpCircle,
  ChevronLeft,
  Users,
} from "lucide-react"
import Image from "next/image"
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
import { useTheme } from "next-themes"
import { Switch } from "@/components/ui/switch"
import React, { useEffect, useState } from "react"
import { getMyProfile } from "@/lib/services/profile"
import SearchDrawer from "@/components/search-drawer"
import NotificationsDrawer from "@/components/notifications-drawer"

type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement> & { className?: string }>
const renderIcon = (Icon?: IconComponent, props?: React.SVGProps<SVGSVGElement>) => Icon ? <Icon {...props} /> : null

const getNavigation = (username: string, avatarUrl?: string) => [
  { name: "Home", href: "/", icon: Home },
  { name: "Search", href: "/search", icon: Search },
  { name: "Explore", href: "/explore", icon: Compass },
  { name: "Reels", href: "/reels", icon: Film },
  { name: "Messages", href: "/messages", icon: MessageCircle },
  { name: "Notifications", href: "/notifications", icon: Heart },
  { name: "Create", href: "/create", icon: PlusSquare },
  { name: "Profile", href: `/${username}`, avatarUrl },
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
  const isNotificationsPage = pathname === "/notifications"
  const [navigation, setNavigation] = useState(getNavigation(""))
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)

  // Submenu state for "Switch appearance"
  const [appearanceOpen, setAppearanceOpen] = useState(false)

  // Use next-themes to keep appearance switches in sync across the app
  const { setTheme, resolvedTheme } = useTheme()
  const isDark = typeof resolvedTheme === "string" ? resolvedTheme === "dark" : (typeof window !== 'undefined' && document.documentElement.classList.contains('dark'))

  const toggleDarkMode = (val?: boolean) => {
    const next = typeof val === "boolean" ? val : !isDark
    setTheme(next ? "dark" : "light")
  }

  useEffect(() => {
    if (isAuthenticated) {
      const fetchProfile = async () => {
        try {
          const profile = await getMyProfile()
          setNavigation(getNavigation(profile.username, profile.avatar))
        } catch (error) {
          console.error("Failed to fetch profile:", error)
        }
      }
      fetchProfile()
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

  // Keep sidebar icon-only by default on desktop. Expand on hover unless the Search drawer is open.
  const isCollapsedByDefault = true
  // Allow hover expansion; only disable when search is open
  const enableHoverExpand = !isSearchOpen
  // Sidebar stays collapsed by default unless the user hovers (or search is open)
  const isSidebarCollapsed = isSearchOpen || isCollapsedByDefault
  const sidebarWidthClass = enableHoverExpand ? "lg:w-20 lg:hover:w-64" : "lg:w-20"

  // Expand sidebar when More menu is open
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const finalSidebarClass = isMoreOpen ? "lg:w-64" : sidebarWidthClass

  // Mobile profile button
  const profileMobile = navigation.find(item => item.name === "Profile")
  const isProfileMobileActive = Boolean(profileMobile && pathname === profileMobile.href)

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
      {/* Mobile Header - show only on home page */}
      {pathname === "/" && (
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
                  isNotificationsPage ? "fill-current" : ""
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
          <div className={cn("hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:border-r lg:bg-background overflow-hidden transition-all duration-200 ease-in-out group lg:z-50", finalSidebarClass, isSearchOpen && "lg:hidden")}>
      <div className="flex flex-col flex-1 min-h-0 pt-5 pb-4">
        <Link href="/" className={cn("flex items-center flex-shrink-0 hover:opacity-80 transition-all px-5")}>
          <Instagram className="w-8 h-8 flex-shrink-0" />
          <span className="ml-2 text-xl font-bold whitespace-nowrap transition-all duration-200 ease-in-out opacity-0 w-0 overflow-hidden group-hover:opacity-100 group-hover:w-auto">
            Instagram
          </span>
        </Link>
        <nav className="flex-1 px-3 mt-8 space-y-1">
          {navigation.map((item) => {
            const isSearchItem = item.name === "Search"
            const isProfileItem = item.name === "Profile"
            const isNotificationsItem = item.name === "Notifications"
            // While search/notifications drawer is open, don't mark other items as active
            const isActive = isSearchItem ? isSearchOpen : isNotificationsItem ? isNotificationsOpen : ((!isSearchOpen && !isNotificationsOpen) && pathname === item.href)
            const showDot =
              (item.name === "Messages" && totalUnreadMessages > 0) ||
              (item.name === "Notifications" && unreadNotificationCount > 0)

            // Enhanced dot styling for better visibility
            const dotClass = cn(
              "absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full",
              "bg-red-500 border border-background",
              "animate-pulse"
            )

            if (isSearchItem) {
              return (
                <button
                  key={item.name}
                  onClick={() => setIsSearchOpen((v) => !v)}
                  aria-pressed={isSearchOpen}
                  aria-expanded={isSearchOpen}
                  aria-label={item.name}
                  className={cn(
                    "flex items-center px-3 py-3 text-sm font-medium rounded-lg hover:bg-muted transition-colors w-full text-left",
                    isActive ? "bg-muted" : ""
                  )}
                >
                  <div className="relative flex-shrink-0 w-6 flex justify-center"> 
                    <Search className={cn("w-6 h-6", isActive ? "fill-current" : "")}/>
                  </div>
                  <span className={cn("ml-4 whitespace-nowrap transition-all duration-200 ease-in-out", isMoreOpen ? "lg:opacity-100 lg:w-auto lg:overflow-visible" : "lg:opacity-0 lg:w-0 lg:overflow-hidden lg:group-hover:opacity-100 lg:group-hover:w-auto")}> 
                    {item.name}
                  </span>
                </button>
              )
            }

            if (isNotificationsItem) {
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    if (isSearchOpen) setIsSearchOpen(false)
                    setIsNotificationsOpen((v) => !v)
                  }}
                  aria-pressed={isNotificationsOpen}
                  aria-expanded={isNotificationsOpen}
                  aria-label={item.name}
                  className={cn(
                    "flex items-center px-3 py-3 text-sm font-medium rounded-lg hover:bg-muted transition-colors w-full text-left",
                    isActive ? "bg-muted" : ""
                  )}
                >
                  <div className="relative flex-shrink-0 w-6 flex justify-center"> 
                    <Heart className={cn("w-6 h-6", isActive ? "fill-current" : "")}/>
                    {unreadNotificationCount > 0 && (
                      <span className="absolute -top-2 -right-2 min-w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1 text-[10px] font-medium border border-background">
                        {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                      </span>
                    )}
                  </div>
                  <span className={cn("ml-4 whitespace-nowrap transition-all duration-200 ease-in-out", isMoreOpen ? "lg:opacity-100 lg:w-auto lg:overflow-visible" : "lg:opacity-0 lg:w-0 lg:overflow-hidden lg:group-hover:opacity-100 lg:group-hover:w-auto")}> 
                    {item.name}
                  </span>
                </button>
              )
            }

            if (isProfileItem) {
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  aria-label={item.name}
                  onClick={() => { if (isSearchOpen) setIsSearchOpen(false) }}
                  className={cn(
                    "flex items-center px-3 py-3 text-sm font-medium rounded-lg hover:bg-muted transition-colors",
                    isActive ? "bg-muted" : ""
                  )}
                >
                  <div className="relative flex-shrink-0 w-7 flex justify-center"> 
                    {item.avatarUrl ? (
                      <Image
                        src={item.avatarUrl}
                        alt="Avatar"
                        width={28}
                        height={28}
                        className={cn(
                          "rounded-full object-cover border",
                          isActive ? "border-2 border-primary" : "border-muted"
                        )}
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-muted" />
                    )}
                  </div>
                  <span className={cn("ml-3 whitespace-nowrap transition-all duration-200 ease-in-out", isMoreOpen ? "lg:opacity-100 lg:w-auto lg:overflow-visible" : "lg:opacity-0 lg:w-0 lg:overflow-hidden lg:group-hover:opacity-100 lg:group-hover:w-auto")}> 
                    {item.name}
                  </span>
                </Link>
              )
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                aria-label={item.name}
                onClick={() => { if (isSearchOpen) setIsSearchOpen(false) }}
                className={cn(
                  "flex items-center px-3 py-3 text-sm font-medium rounded-lg hover:bg-muted transition-colors",
                  isActive ? "bg-muted" : ""
                )}
              >
                <div className="relative flex-shrink-0 w-6 flex justify-center"> 
                  {renderIcon(item.icon, { className: cn("w-6 h-6", isActive ? "fill-current" : "") })}
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
                <span className={cn("ml-4 whitespace-nowrap transition-all duration-200 ease-in-out", isMoreOpen ? "lg:opacity-100 lg:w-auto lg:overflow-visible" : "lg:opacity-0 lg:w-0 lg:overflow-hidden lg:group-hover:opacity-100 lg:group-hover:w-auto")}> 
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
          <DropdownMenu onOpenChange={(open: boolean) => { setIsMoreOpen(open); if (!open) setAppearanceOpen(false); }}>

            <DropdownMenuTrigger asChild>
              <button className="flex items-center w-full px-3 py-3 text-sm font-medium rounded-lg hover:bg-muted transition-colors focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0">
                <div className="relative flex-shrink-0 w-6 flex justify-center">
                  <Menu className="w-6 h-6" />
                </div>
                <span className={cn("ml-4 whitespace-nowrap transition-all duration-200 ease-in-out", isMoreOpen ? "lg:opacity-100 lg:w-auto lg:overflow-visible" : "lg:opacity-0 lg:w-0 lg:overflow-hidden lg:group-hover:opacity-100 lg:group-hover:w-auto")}>
                  More
                </span>
              </button>
            </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="w-56 translate-x-1 rounded-md bg-white dark:bg-zinc-900 text-foreground dark:text-white shadow-lg p-1">
            {!appearanceOpen ? (
              <>
                <DropdownMenuItem onSelect={() => router.push('/account/settings')} className="px-3 py-3">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => router.push('/account/activity')} className="px-3 py-3">
                  <Clock className="w-4 h-4 mr-2" />
                  Your activity
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => router.push('/saved')} className="px-3 py-3">
                  <Bookmark className="w-4 h-4 mr-2" />
                  Saved
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={(e: Event) => { e.preventDefault(); setAppearanceOpen(true); }} className="px-3 py-3">
                  <Moon className="w-4 h-4 mr-2" />
                  Switch appearance
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => router.push('/report')} className="px-3 py-3">
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Report a problem
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem onSelect={() => { /* TODO: implement account switching UI */ }} className="px-3 py-3">
                  <Users className="w-4 h-4 mr-2" />
                  Switch accounts
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={handleLogout} className="px-3 py-3 text-red-500">
                  <LogOut className="w-4 h-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </>
            ) : (
              <div className="w-56">
                <div className="flex items-center px-3 py-3 border-b border-zinc-200 dark:border-zinc-700">
                  <button onClick={() => setAppearanceOpen(false)} className="mr-3 p-1 rounded focus:outline-none" aria-label="Back">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="flex-1 font-semibold">Switch appearance</div>
                  <Moon className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="p-1">
                  <div className="flex items-center justify-between w-full px-3 py-3">
                    <div>
                      <span className="ml-2">Dark mode</span>
                    </div>
                    <Switch checked={isDark} onCheckedChange={(v) => toggleDarkMode(v as boolean)} />
                  </div>
                </div>
              </div>
            )}
          </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      </div>

      {/* Search Drawer (opens beside sidebar) */}
      <SearchDrawer isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} sidebarIsCollapsed={isSidebarCollapsed} sidebarIsHidden={isSidebarCollapsed} />

      {/* Notifications Drawer (opens beside sidebar) */}
      <NotificationsDrawer isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} sidebarIsCollapsed={isSidebarCollapsed} sidebarIsHidden={isSidebarCollapsed} />

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
                  aria-label={item.name}
                  className={cn(
                    "flex flex-col items-center justify-center flex-1 py-2 transition-colors",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  <div className="relative">
                    {renderIcon(item.icon, { className: cn("w-6 h-6", isActive ? "fill-current" : "") })}
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
                  {renderIcon(item.icon, { className: cn("w-6 h-6", isActive ? "fill-current" : "") })}
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
          
          {/* Profile button (mobile) */}
          <Link
            href={profileMobile?.href || '/'}
            onClick={() => { if (isSearchOpen) setIsSearchOpen(false) }}
            className="flex flex-col items-center justify-center flex-1 py-2"
            aria-current={isProfileMobileActive ? 'page' : undefined}
          >
            <div className="relative">
              {profileMobile?.avatarUrl ? (
                <Image
                  src={profileMobile.avatarUrl}
                  alt="Profile"
                  width={24}
                  height={24}
                  className={cn("rounded-full object-cover mx-auto", isProfileMobileActive ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "")}
                />
              ) : (
                <div className={cn("w-6 h-6 rounded-full mx-auto", isProfileMobileActive ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "bg-muted")} />
              )}
            </div>
          </Link>
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