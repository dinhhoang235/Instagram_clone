"use client"

import React, { useRef, useCallback, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { useNotificationStore } from '@/stores/useNotificationStore'
import { connectNotificationSocket } from '@/lib/services/notifications'
import { NotificationType } from '@/types/notification'

interface NotificationProviderProps {
  children: React.ReactNode
}

interface NotificationContextType {
  isConnected: boolean
  isConnecting: boolean
  unreadCount: number
  playNotificationSound: () => void
}

const NotificationContext = React.createContext<NotificationContextType | null>(null)

export function useNotifications() {
  const context = React.useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { isAuthenticated } = useAuth()
  const { addNotification, unreadCount } = useNotificationStore()
  const socketRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isConnected, setIsConnected] = React.useState(false)
  const [isConnecting, setIsConnecting] = React.useState(false)

  // Function to play notification sound for new notifications
  const playNotificationSound = useCallback(() => {
    const isNotificationsPage = window.location.pathname === '/notifications'
    const isPageVisible = document.visibilityState === 'visible'
    
    // Only play sound if not on notifications page or page is not visible
    if (!isPageVisible || !isNotificationsPage) {
      try {
        const AudioContextClass = window.AudioContext || 
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        const audioContext = new AudioContextClass()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        // Different tone for notifications (higher pitch)
        oscillator.frequency.value = 1000
        oscillator.type = 'sine'
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
        
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.2)
      } catch (error) {
        console.log("Could not play notification sound:", error)
      }
    }
  }, [])

  // Function to connect to WebSocket
  const connectNotifications = React.useCallback(async () => {
    if (!isAuthenticated) {
      return
    }

    // Don't create multiple connections (already open or connecting)
    if (socketRef.current?.readyState === WebSocket.OPEN || socketRef.current?.readyState === WebSocket.CONNECTING) {
      return
    }

    setIsConnecting(true)

    try {
      const socket = await connectNotificationSocket()
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
          const data = JSON.parse(event.data) as NotificationType

          // Add notification to store
          addNotification(data)
          
          // Play notification sound
          playNotificationSound()

          // Show browser notification if permission granted
          if (Notification.permission === 'granted') {
            new Notification(`New ${data.type}`, {
              body: data.content,
              icon: data.user.avatar || '/placeholder-user.jpg',
              tag: `notification-${data.id}`,
            })
          }

        } catch (error) {
          console.error("Error processing notification:", error)
        }
      }

      socket.onclose = (event) => {
        console.warn("WebSocket closed", {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          url: ((socket as unknown) as { url?: string })?.url ?? ((socketRef.current as unknown) as { url?: string })?.url,
          readyState: socket.readyState,
        })

        setIsConnected(false)
        setIsConnecting(false)
        
        // Only attempt to reconnect if the connection was closed unexpectedly
        // and we're still authenticated
        if (event.code !== 1000 && isAuthenticated) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connectNotifications()
          }, 3000)
        }
      }

      socket.onerror = (error) => {
        console.error("WebSocket error:", error, {
          url: ((socket as unknown) as { url?: string })?.url ?? ((socketRef.current as unknown) as { url?: string })?.url,
          readyState: socket.readyState,
        })

        setIsConnected(false)
        setIsConnecting(false)
        
        // Try to reconnect after error
        if (isAuthenticated) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connectNotifications()
          }, 5000)
        }
      }

    } catch (error) {
      console.error("Failed to create WebSocket connection:", error)
      setIsConnecting(false)

      // If auth-related error, try again after a bit (allows token refresh flow to resolve)
      if (isAuthenticated) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connectNotifications()
        }, 5000)
      }
    }
  }, [isAuthenticated, addNotification, playNotificationSound])

  // Effect to connect/disconnect WebSocket based on authentication
  useEffect(() => {
    if (isAuthenticated) {
      connectNotifications()
    } else {
      // Disconnect if not authenticated
      if (socketRef.current) {
        socketRef.current.close(1000, "User logged out")
        socketRef.current = null
      }
      setIsConnected(false)
      setIsConnecting(false)
      
      // Clear any pending reconnect
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
    }

    // Cleanup on unmount
    return () => {
      if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
        socketRef.current.close(1000, "Component unmounted")
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [isAuthenticated, connectNotifications])

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission)
      })
    }
  }, [])

  const contextValue: NotificationContextType = {
    isConnected,
    isConnecting,
    unreadCount,
    playNotificationSound,
  }

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  )
}
