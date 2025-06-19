"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Phone, Video, Info, Smile, ImageIcon, Send, Heart } from "lucide-react"
import { getMessages, createChatSocket } from "@/lib/services/messages"
import type { ChatProps, MessageType } from "@/types/chat"

const PAGE_SIZE = 20

export function Chat({ chatId, username, avatar, online }: ChatProps) {
  const [messages, setMessages] = useState<MessageType[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isConnected, setIsConnected] = useState(false)

  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const socketRef = useRef<WebSocket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // 1. Load lần đầu: lấy tổng count rồi load trang cuối cùng
  useEffect(() => {
    async function init() {
      const firstPage = await getMessages(chatId, 0)
      const totalCount = firstPage.count
      const startOffset = Math.max(0, totalCount - PAGE_SIZE)

      if (startOffset === 0) {
        setMessages(firstPage.results)
        setOffset(0)
        setHasMore(false)
      } else {
        const lastPage = await getMessages(chatId, startOffset)
        setMessages(lastPage.results)
        setOffset(startOffset)
        setHasMore(true)
      }
      // Scroll xuống cuối sau khi load tin nhắn
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" })
    }
    if (chatId) {
      init()
    }
  }, [chatId])

  // 2. Load thêm tin nhắn cũ khi kéo lên
  const loadMoreMessages = useCallback(async () => {
    if (!hasMore) return
    const container = messagesContainerRef.current
    if (!container) return
    const prevScrollHeight = container.scrollHeight

    const newOffset = Math.max(0, offset - PAGE_SIZE)
    if (newOffset === offset) return

    const data = await getMessages(chatId, newOffset)
    if (data.results.length > 0) {
      setMessages(prev => [...data.results, ...prev])
      setOffset(newOffset)
      setHasMore(newOffset > 0)

      setTimeout(() => {
        if (!container) return
        const newScrollHeight = container.scrollHeight
        container.scrollTop += newScrollHeight - prevScrollHeight
      }, 0)
    } else {
      setHasMore(false)
    }
  }, [chatId, offset, hasMore])

  // 3. Scroll event để load thêm tin nhắn cũ khi kéo lên đầu
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const handleScroll = () => {
      if (container.scrollTop < 50 && hasMore) {
        loadMoreMessages()
      }
    }

    container.addEventListener("scroll", handleScroll)
    return () => container.removeEventListener("scroll", handleScroll)
  }, [loadMoreMessages, hasMore])

  // 4. WebSocket nhận tin nhắn realtime
  useEffect(() => {
    if (!chatId) return
    const socket = createChatSocket(chatId)
    socketRef.current = socket

    socket.onopen = () => setIsConnected(true)
    socket.onclose = () => setIsConnected(false)
    socket.onerror = () => setIsConnected(false)

    socket.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        setMessages(prev => [...prev, data])
      } catch (error) {
        console.error("WebSocket message parse error:", error)
      }
    }

    return () => {
      socket.close()
    }
  }, [chatId])

  // 5. Gửi tin nhắn (không cuộn ở đây nữa)
  const handleSendMessage = () => {
    const trimmed = newMessage.trim()
    if (!trimmed || !isConnected || !socketRef.current) return
    socketRef.current.send(JSON.stringify({ text: trimmed }))
    setNewMessage("")
  }

  // 6. Tự động cuộn xuống cuối mỗi khi messages thay đổi
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center">
          <Avatar className="w-10 h-10">
            <AvatarImage src={avatar || "/placeholder.svg"} alt={username} />
            <AvatarFallback>{username.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <div className="font-medium">{username}</div>
            <div className="text-xs text-muted-foreground">
              {isConnected ? "Connected" : online ? "Active now" : "Offline"}
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="ghost" size="icon"><Phone className="w-5 h-5" /></Button>
          <Button variant="ghost" size="icon"><Video className="w-5 h-5" /></Button>
          <Button variant="ghost" size="icon"><Info className="w-5 h-5" /></Button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 flex flex-col gap-4"
        style={{ scrollbarGutter: "stable" }}
      >
        {messages.map((msg, index) => (
          <div
            key={`${msg.id}-${msg.time}-${index}`}
            className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}
          >
            {!msg.isOwn && (
              <Avatar className="w-8 h-8 mr-2 mt-1">
                <AvatarImage src={avatar || "/placeholder.svg"} alt={username} />
                <AvatarFallback>{username.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            )}
            <div>
              <div
                className={`max-w-xs px-4 py-2 rounded-2xl ${
                  msg.isOwn ? "bg-blue-500 text-white rounded-br-none" : "bg-muted rounded-bl-none"
                }`}
              >
                {msg.text}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{msg.time}</div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t flex items-center">
        <Button variant="ghost" size="icon"><Smile className="w-5 h-5" /></Button>
        <Button variant="ghost" size="icon"><ImageIcon className="w-5 h-5" /></Button>
        <Input
          className="mx-3"
          placeholder="Message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSendMessage()
            }
          }}
        />
        <Button
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || !isConnected}
          variant="ghost"
          size="icon"
        >
          {newMessage.trim() ? <Send className="w-5 h-5" /> : <Heart className="w-5 h-5" />}
        </Button>
      </div>
    </div>
  )
}
