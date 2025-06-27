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

export function WebSocketProvider({ children }: WebSocketProviderProps) {
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
      console.log("🔌 Not authenticated, skipping WebSocket connection")
      return
    }

    // Don't create multiple connections
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      console.log("🔌 WebSocket already connected")
      return
    }

    setIsConnecting(true)

    try {
      console.log("🔌 Creating global WebSocket connection for conversations")
      const socket = createConversationsSocket()
      socketRef.current = socket

      socket.onopen = () => {
        console.log("🔌 Global WebSocket connected successfully")
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
          console.log("📩 Global WebSocket message received:", data)

          // Handle conversation updates
          if (
            (data.type === "chat_update" && data.chat_id) ||
            (data.chat_id && data.message && data.timestamp && data.sender)
          ) {
            console.log("🔄 Updating conversation globally via WebSocket")
            
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
          console.error("Error processing global WebSocket message:", error)
        }
      }

      socket.onclose = (event) => {
        console.log("🔌 Global WebSocket closed:", event.code, event.reason)
        setIsConnected(false)
        setIsConnecting(false)
        
        // Only attempt to reconnect if the connection was closed unexpectedly
        // and we're still authenticated
        if (event.code !== 1000 && isAuthenticated) {
          console.log("🔌 Attempting to reconnect global WebSocket in 3 seconds...")
          setIsConnecting(true)
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket()
          }, 3000)
        }
      }

      socket.onerror = (error) => {
        console.error("🔌 Global WebSocket error:", error)
        setIsConnected(false)
        setIsConnecting(false)
      }

    } catch (error) {
      console.error("Failed to create global WebSocket connection:", error)
      setIsConnected(false)
      setIsConnecting(false)
    }
  }, [isAuthenticated, updateConversation, playNotificationSound])

  // Function to disconnect WebSocket
  const disconnectWebSocket = React.useCallback(() => {
    console.log("🔌 Disconnecting global WebSocket")
    
    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    // Close socket
    if (socketRef.current) {
      socketRef.current.close(1000, "User logged out")
      socketRef.current = null
    }
    
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
          console.log("🔌 Page visible again, ensuring WebSocket connection")
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
