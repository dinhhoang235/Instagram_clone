import React from 'react'
import { useConversationStore } from '@/stores/useConversationStore'
import { useWebSocket } from '@/components/websocket-provider'
import { cn } from '@/lib/utils'

export function RealTimeStatus() {
  const { conversations } = useConversationStore()
  const { isConnected, isConnecting } = useWebSocket()
  
  const totalUnreadMessages = conversations.reduce(
    (sum, convo) => sum + convo.unread_count,
    0
  )

  // Always show the status when user is authenticated and has conversations or when connecting
  if (!isConnected && !isConnecting && conversations.length === 0 && totalUnreadMessages === 0) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={cn(
        "bg-background border rounded-lg shadow-lg p-3 max-w-sm",
        "transition-all duration-300 ease-in-out"
      )}>
        <div className="flex items-center space-x-2">
          {/* WebSocket Status */}
          <div className="flex items-center space-x-1">
            <div className={cn(
              "w-2 h-2 rounded-full",
              isConnected ? "bg-green-500" : 
              isConnecting ? "bg-yellow-500 animate-pulse" : "bg-red-500"
            )} />
            <span className="text-xs text-muted-foreground">
              {isConnected ? "Connected" : 
               isConnecting ? "Connecting..." : "Disconnected"}
            </span>
          </div>
          
          {/* Unread Messages */}
          {totalUnreadMessages > 0 && (
            <>
              <span className="text-xs text-muted-foreground">•</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-medium text-red-600">
                  {totalUnreadMessages} unread
                </span>
              </div>
            </>
          )}
        </div>
        
        {/* Real-time indicator */}
        {isConnected && (
          <div className="text-[10px] text-muted-foreground mt-1">
            Real-time updates active
          </div>
        )}
        
        {/* Connecting indicator */}
        {isConnecting && !isConnected && (
          <div className="text-[10px] text-muted-foreground mt-1">
            Establishing connection...
          </div>
        )}
      </div>
    </div>
  )
}
