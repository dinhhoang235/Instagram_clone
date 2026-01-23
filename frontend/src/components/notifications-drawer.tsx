"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check, X } from "lucide-react"
import { getNotifications, markAllNotificationsAsRead } from "@/lib/services/notifications"
import { useNotificationStore } from "@/stores/useNotificationStore"
import { NotificationItem } from "@/components/notification-item"

type Props = {
  isOpen: boolean
  onClose: () => void
  sidebarIsCollapsed?: boolean
  sidebarIsHidden?: boolean
}

export default function NotificationsDrawer({ isOpen, onClose, sidebarIsCollapsed = false, sidebarIsHidden = false }: Props) {
  const { notifications, unreadCount, setNotifications, markAllAsRead } = useNotificationStore()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    const fetchNotifications = async () => {
      setLoading(true)
      try {
        const data = await getNotifications()
        setNotifications(data)
      } catch (error) {
        console.error("Failed to fetch notifications", error)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [isOpen, setNotifications])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const leftClass = sidebarIsHidden ? "lg:left-0" : (sidebarIsCollapsed ? "lg:left-20" : "lg:left-64")
  const widthClass = sidebarIsHidden ? "lg:w-[480px]" : "lg:w-[360px]"
  const baseClass = `fixed top-0 bottom-0 z-50 ${leftClass} w-full ${widthClass} bg-background border-l overflow-auto transform transition-all duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead()
      markAllAsRead()
      console.log("✅ All notifications marked as read")
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error)
    }
  }

  return (
    <div>
      <div className={`fixed inset-0 z-40 bg-background/80 transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0'} ${leftClass}`} onClick={onClose} aria-hidden="true" />
      <div className={baseClass} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-4 ">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold">Notifications</h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} className="flex items-center space-x-1">
                <Check className="w-4 h-4" />
                <span>Mark all as read</span>
              </Button>
            )}
            <button onClick={onClose} aria-label="Close" className="p-1">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="px-4 py-6">
          {loading ? (
            <p className="text-center text-muted-foreground">Loading...</p>
          ) : (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="follows">Follows</TabsTrigger>
                <TabsTrigger value="mentions">Mentions</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <NotificationItem key={notification.id} notification={notification} />
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">No notifications yet</div>
                )}
              </TabsContent>

              <TabsContent value="follows" className="space-y-4">
                {notifications
                  .filter((notification) => notification.type === "follow")
                  .map((notification) => (
                    <NotificationItem key={notification.id} notification={notification} />
                  ))}
              </TabsContent>

              <TabsContent value="mentions" className="space-y-4">
                {notifications
                  .filter((notification) => notification.type === "mention")
                  .map((notification) => (
                    <NotificationItem key={notification.id} notification={notification} />
                  ))}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  )
}
