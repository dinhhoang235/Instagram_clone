"use client"

import { Sidebar } from "@/components/sidebar"
import { NotificationItem } from "@/components/notification-item"

import { useAuth } from "@/components/auth-provider"
import { redirect } from "next/navigation"
import { useState, useEffect } from "react"
import { getNotifications } from "@/lib/services/notifications"
import { useNotificationStore } from "@/stores/useNotificationStore"

import { ArrowLeft, Heart } from "lucide-react"
import { useRouter } from "next/navigation"

export default function NotificationsPage() {
    const { isAuthenticated } = useAuth()
    const { 
        notifications, 
        setNotifications
    } = useNotificationStore()

    const [loading, setLoading] = useState(true)

    const router = useRouter()

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



    if (loading) return <p>Loading...</p>

    return (
        <div className="min-h-screen bg-background">
            <div className="flex">
                <Sidebar />
                <main className="flex-1 lg:ml-64">
                    <div className="max-w-2xl mx-auto px-4 py-8 pt-16 pb-20 lg:pt-8 lg:pb-8">
                        {/* Mobile-only fixed header — visible on small screens */}
                        <div className="fixed top-0 left-0 right-0 z-40 bg-background border-b lg:hidden">
                          <div className="relative max-w-2xl mx-auto px-4 py-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                {/* Back button only visible on mobile */}
                                <button
                                  className="lg:hidden -ml-2 p-2 rounded-full hover:bg-zinc-100"
                                  onClick={() => router.back()}
                                  aria-label="Back"
                                >
                                  <ArrowLeft className="w-5 h-5" />
                                </button>
                              </div>

                              {/* right placeholder to balance layout */}
                              <div className="w-6" />
                            </div>

                            <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 flex justify-center pointer-events-none">
                              <h1 className="text-xl font-bold pointer-events-auto">Notifications</h1>
                            </div>
                          </div>
                        </div>

                        {/* Spacer to account for mobile fixed header; collapse on lg where header is non-fixed */}
                        <div className="h-12 lg:h-0" />

                        <div className="w-full space-y-4">
                          {notifications.length > 0 ? (
                            notifications.map((notification) => (
                              <NotificationItem key={notification.id} notification={notification} />
                            ))
                          ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                              <div className="rounded-full border border-muted-foreground/10 p-4 mb-4 h-20 w-20 flex items-center justify-center">
                                <Heart className="w-8 h-8 text-muted-foreground" />
                              </div>
                              <h2 className="text-lg font-semibold text-foreground mb-2">Activity On Your Posts</h2>
                              <p className="max-w-[56ch] text-sm text-muted-foreground">When someone likes or comments on one of your posts, you&apos;ll see it here.</p>
                            </div>
                          )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
