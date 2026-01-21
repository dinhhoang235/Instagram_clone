"use client"

import React, { createContext, useContext, useEffect, useRef } from 'react'
import { createConversationsSocket } from '@/lib/services/messages'
import { useConversationStore } from '@/stores/useConversationStore'
import { useAuth } from '@/components/auth-provider'

interface WebSocketContextType {
  isConnected: boolean
  isConnecting: boolean
}

const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  isConnecting: false
})

export function useWebSocket() {
  return useContext(WebSocketContext)
}

interface WebSocketProviderProps {
  children: React.ReactNode
}

export function MessageProvider({ children }: WebSocketProviderProps) {
  const { isAuthenticated } = useAuth()
  const { updateConversation } = useConversationStore()
  const socketRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isConnected, setIsConnected] = React.useState(false)
  const [isConnecting, setIsConnecting] = React.useState(false)

  // Function to play notification sound for new messages
  const playNotificationSound = React.useCallback(() => {
    const isMessagesPage = window.location.pathname === '/messages'
    const isPageVisible = document.visibilityState === 'visible'
    
    if (!isPageVisible || !isMessagesPage) {
      try {
        const AudioContextClass = window.AudioContext || 
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        const audioContext = new AudioContextClass()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        oscillator.frequency.value = 800
        oscillator.type = 'sine'
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
        
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.1)
      } catch (error) {
        console.log("Could not play notification sound:", error)
      }
    }
  }, [])

  // Function to connect to WebSocket
  const connectWebSocket = React.useCallback(() => {
    if (!isAuthenticated) {
      return
    }

    // Don't create multiple connections
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    setIsConnecting(true)

    try {
      const socket = createConversationsSocket()
      socketRef.current = socket

      socket.onopen = () => {
        setIsConnected(true)
        setIsConnecting(false)
        // Clear any existing reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = null
        }
      }

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          // Handle mark_read_update events to update conversation list immediately
          if (data.type === "mark_read_update" && typeof data.chat_id !== 'undefined') {
            console.log("📖 Received mark_read_update event for chat:", data.chat_id, "unread_count:", data.unread_count);
            // Update conversation unread count in the store to show it's been read
            const { markAsRead } = useConversationStore.getState();
            if (data.unread_count === 0) {
              // Only mark as read if unread count is 0
              markAsRead(data.chat_id);
            }
          }
          // Handle mark_read events to update conversation list immediately
          // This ensures the conversation no longer appears bold/unread when user opens the chat
          else if (data.type === "mark_read" && data.chat_id) {
            console.log("📖 Received mark_read event for chat:", data.chat_id);
            // Mark conversation as read in the store to update UI immediately
            // This is called by the useConversationStore.markAsRead method
            const { markAsRead } = useConversationStore.getState();
            markAsRead(data.chat_id);
          }
          // Handle presence updates (from server-side presence counters)
          else if (data.type === "presence_update" && typeof data.user_id !== 'undefined') {
            console.log("🔔 Presence update:", data.user_id, data.online, data.last_active);
            const { setPartnerOnline } = useConversationStore.getState();
            setPartnerOnline(data.user_id, !!data.online, data.last_active ?? null);
          }
          // Handle conversation updates
          else if (
            (data.type === "chat_update" && data.chat_id) ||
            (data.chat_id && data.message && data.timestamp && data.sender)
          ) {
            // Play notification sound for incoming messages (not sent by current user)
            if (!data.is_sender) {
              playNotificationSound()
            }
            
            updateConversation({
              chat_id: data.chat_id,
              message: data.message,
              timestamp: data.timestamp,
              sender: {
                ...data.sender,
                id: data.sender?.id || 0
              },
              is_sender: !!data.is_sender,
              unread_count: data.unread_count ?? (data.is_sender ? 0 : 1)
            })
          }
        } catch (error) {
          console.error("Error processing WebSocket message:", error)
        }
      }

      socket.onclose = (event) => {
        setIsConnected(false)
        setIsConnecting(false)
        
        // Only attempt to reconnect if the connection was closed unexpectedly
        // and we're still authenticated
        if (event.code !== 1000 && isAuthenticated) {
          setIsConnecting(true)
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket()
          }, 3000)
        }
      }

      socket.onerror = () => {
        setIsConnected(false)
        setIsConnecting(false)
        
        // Try to reconnect after error
        if (isAuthenticated) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket()
          }, 5000)
        }
      }    } catch (error) {
      console.error("Failed to create global WebSocket connection:", error)
      setIsConnected(false)
      setIsConnecting(false)
    }
  }, [isAuthenticated, updateConversation, playNotificationSound])

  // Function to disconnect WebSocket
  const disconnectWebSocket = React.useCallback(() => {
    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    // Close socket only if it's in a valid state
    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      socketRef.current.close(1000, "User logged out")
    }
    socketRef.current = null
    
    setIsConnected(false)
  }, [])

  // Effect to manage WebSocket connection based on authentication
  useEffect(() => {
    if (isAuthenticated) {
      connectWebSocket()
    } else {
      disconnectWebSocket()
    }

    // Cleanup on unmount
    return () => {
      disconnectWebSocket()
    }
  }, [isAuthenticated, connectWebSocket, disconnectWebSocket])

  // Effect to handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated) {
        // Reconnect if we're not connected when page becomes visible
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
          connectWebSocket()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isAuthenticated, connectWebSocket])

  const contextValue: WebSocketContextType = {
    isConnected,
    isConnecting
  }

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  )
}
