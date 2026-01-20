"use client"

import { Sidebar } from "@/components/sidebar"
import { NotificationItem } from "@/components/notification-item"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { redirect } from "next/navigation"
import { useState, useEffect } from "react"
import { getNotifications, markAllNotificationsAsRead } from "@/lib/services/notifications"
import { useNotificationStore } from "@/stores/useNotificationStore"
import { useNotifications } from "@/components/notification-provider"
import { Check } from "lucide-react"

export default function NotificationsPage() {
    const { isAuthenticated } = useAuth()
    const { 
        notifications, 
        unreadCount, 
        setNotifications, 
        markAllAsRead 
    } = useNotificationStore()
    const { isConnected } = useNotifications()
    const [loading, setLoading] = useState(true)

    if (!isAuthenticated) {
        redirect("/login")
    }

    useEffect(() => {
        const fetchNotifications = async () => {
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
    }, [setNotifications])

    const handleMarkAllAsRead = async () => {
        try {
            await markAllNotificationsAsRead()
            markAllAsRead() // Update local store
            console.log("✅ All notifications marked as read")
        } catch (error) {
            console.error("Failed to mark all notifications as read:", error)
        }
    }

    if (loading) return <p>Loading...</p>

    return (
        <div className="min-h-screen bg-background">
            <div className="flex">
                <Sidebar />
                <main className="flex-1 lg:ml-64">
                    <div className="max-w-2xl mx-auto px-4 py-8 pt-16 pb-20 lg:pt-8 lg:pb-8">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-4">
                                <h1 className="text-2xl font-bold">Notifications</h1>
                                {unreadCount > 0 && (
                                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                        {unreadCount} new
                                    </span>
                                )}
                                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                            </div>
                            
                            {unreadCount > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleMarkAllAsRead}
                                    className="flex items-center space-x-1"
                                >
                                    <Check className="w-4 h-4" />
                                    <span>Mark all as read</span>
                                </Button>
                            )}
                        </div>

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
                                    <div className="text-center text-muted-foreground py-8">
                                        No notifications yet
                                    </div>
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
                    </div>
                </main>
            </div>
        </div>
    )
}
