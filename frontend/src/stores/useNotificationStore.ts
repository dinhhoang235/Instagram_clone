import { create } from "zustand"
import { persist } from "zustand/middleware"
import { NotificationType } from "@/types/notification"

type NotificationStore = {
  notifications: NotificationType[]
  unreadCount: number
  setNotifications: (notifications: NotificationType[]) => void
  addNotification: (notification: NotificationType) => void
  markAllAsRead: () => void
  markAsRead: (id: number) => void
  clearNotifications: () => void
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      notifications: [],
      unreadCount: 0,

      setNotifications: (notifications) => {
        const unreadCount = notifications.filter(n => !n.is_read).length
        set({ notifications, unreadCount })
      },

      addNotification: (notification) =>
        set((state) => {
          console.log("Adding new notification:", notification)
          
          // Check if notification already exists
          const exists = state.notifications.some(n => n.id === notification.id)
          if (exists) {
            console.log("Notification already exists, skipping")
            return state
          }

          const newNotifications = [notification, ...state.notifications]
          const unreadCount = newNotifications.filter(n => !n.is_read).length
          
          return {
            notifications: newNotifications,
            unreadCount
          }
        }),

      markAllAsRead: () =>
        set((state) => {
          console.log("Marking all notifications as read")
          const updatedNotifications = state.notifications.map(n => ({
            ...n,
            is_read: true
          }))
          
          return {
            notifications: updatedNotifications,
            unreadCount: 0
          }
        }),

      markAsRead: (id) =>
        set((state) => {
          console.log(`Marking notification ${id} as read`)
          const updatedNotifications = state.notifications.map(n =>
            n.id === id ? { ...n, is_read: true } : n
          )
          const unreadCount = updatedNotifications.filter(n => !n.is_read).length
          
          return {
            notifications: updatedNotifications,
            unreadCount
          }
        }),

      clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
    }),
    {
      name: 'notification-storage',
      partialize: (state) => ({ 
        notifications: state.notifications,
        unreadCount: state.unreadCount 
      }),
    }
  )
)
