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

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

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
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center px-3 py-3 text-sm font-medium rounded-lg hover:bg-muted transition-colors",
                  isActive ? "bg-muted" : "",
                )}
              >
                <item.icon className={cn("w-6 h-6 mr-3", isActive ? "fill-current" : "")} />
                {item.name}
              </Link>
            )
          })}
        </nav>
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
