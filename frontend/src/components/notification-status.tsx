import React from 'react'
import { useNotificationStore } from '@/stores/useNotificationStore'
import { useNotifications } from '@/components/notification-provider'
import { cn } from '@/lib/utils'
import { Bell } from 'lucide-react'

export function NotificationStatus() {
  const { unreadCount } = useNotificationStore()
  const { isConnected, isConnecting } = useNotifications()

  // Only show status when there are unread notifications or when connecting
  if (!isConnected && !isConnecting && unreadCount === 0) {
    return null
  }

  return (
    <div className="fixed top-20 right-4 z-50">
      <div className={cn(
        "bg-background border rounded-lg shadow-lg p-3 max-w-sm",
        "transition-all duration-300 ease-in-out"
      )}>
        <div className="flex items-center space-x-2">
          {/* Notification Icon */}
          <Bell className="w-4 h-4 text-muted-foreground" />
          
          {/* WebSocket Status */}
          <div className="flex items-center space-x-1">
            <div className={cn(
              "w-2 h-2 rounded-full",
              isConnected ? "bg-green-500" : 
              isConnecting ? "bg-yellow-500 animate-pulse" : "bg-red-500"
            )} />
            <span className="text-xs text-muted-foreground">
              {isConnected ? "Live" : 
               isConnecting ? "Connecting..." : "Offline"}
            </span>
          </div>
          
          {/* Unread Notifications */}
          {unreadCount > 0 && (
            <>
              <span className="text-xs text-muted-foreground">•</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-xs font-medium text-blue-600">
                  {unreadCount} new
                </span>
              </div>
            </>
          )}
        </div>
        
        {/* Real-time indicator */}
        {isConnected && (
          <div className="text-[10px] text-muted-foreground mt-1">
            Real-time notifications active
          </div>
        )}
        
        {/* Connecting indicator */}
        {isConnecting && !isConnected && (
          <div className="text-[10px] text-muted-foreground mt-1">
            Establishing notification connection...
          </div>
        )}
      </div>
    </div>
  )
}
