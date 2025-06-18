"use client"

import { Sidebar } from "@/components/sidebar"
import { NotificationItem } from "@/components/notification-item"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/components/auth-provider"
import { redirect } from "next/navigation"
import { useState, useEffect } from "react"
import { getNotifications } from "@/lib/services/notifications"
import { NotificationType } from "@/types/notification"

export default function NotificationsPage() {
    const { isAuthenticated } = useAuth()

    if (!isAuthenticated) {
        redirect("/login")
    }

    const [notifications, setNotifications] = useState<NotificationType[]>([])
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const data = await getNotifications();
                setNotifications(data);
            } catch (error) {
                console.error("Failed to fetch notifications", error);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
    }, [])

    if (loading) return <p>Loading...</p>;

    return (
        <div className="min-h-screen bg-background">
            <div className="flex">
                <Sidebar />
                <main className="flex-1 lg:ml-64">
                    <div className="max-w-2xl mx-auto px-4 py-8">
                        <h1 className="text-2xl font-bold mb-6">Notifications</h1>

                        <Tabs defaultValue="all" className="w-full">
                            <TabsList className="grid w-full grid-cols-3 mb-6">
                                <TabsTrigger value="all">All</TabsTrigger>
                                <TabsTrigger value="follows">Follows</TabsTrigger>
                                <TabsTrigger value="mentions">Mentions</TabsTrigger>
                            </TabsList>

                            <TabsContent value="all" className="space-y-4">
                                {notifications.map((notification) => (
                                    <NotificationItem key={notification.id} notification={notification} />
                                ))}
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
