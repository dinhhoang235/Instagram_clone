"use client"

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react"
import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Phone, Video, Info, Smile, ImageIcon, Send, Heart, ArrowLeft, Paperclip } from "lucide-react"
import EmojiPicker, { EmojiClickData } from "emoji-picker-react"
import { getMessages, createChatSocket, markConversationAsRead } from "@/lib/services/messages"
import api from "@/lib/api"
import { useConversationStore } from "@/stores/useConversationStore"
import type { ChatProps, MessageType } from "@/types/chat"

const PAGE_SIZE = 20

export function Chat({
  chatId,
  username,
  avatar,
  online,
  currentUserId,
  partnerId,
  fullName,
  onBack,
}: ChatProps & { currentUserId: number; partnerId: number; onBack?: () => void }) {
  const [messages, setMessages] = useState<MessageType[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const socketRef = useRef<WebSocket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const hasMarkedAsReadRef = useRef<boolean>(false) // Flag to prevent marking as read multiple times
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fileUploadRef = useRef<HTMLInputElement>(null)
  const [detectedPartnerId, setDetectedPartnerId] = useState<number | null>(null)

  const sendMarkRead = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      console.log("📤 Sending mark_read to server");
      socketRef.current.send(JSON.stringify({ type: "mark_read" }))
    }
  }, [socketRef])

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage(prev => prev + emojiData.emoji)
    setShowEmojiPicker(false)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        setPreviewUrl(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleSendImageMessage = async () => {
    if (!selectedImage || !isConnected) return
    
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', selectedImage)
      formData.append('text', newMessage || '')

      const response = await api.post(
        `/chats/threads/${chatId}/send-file/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      if (response.data) {
        // Removed: const newMsg = response.data and setMessages to prevent duplication
        setShouldScrollToBottom(true)
        setNewMessage('')
        setSelectedImage(null)
        setPreviewUrl(null)
        
        // Update conversation store
        const { updateConversation } = useConversationStore.getState()
        updateConversation({
          chat_id: chatId,
          message: newMessage || '[Image]',
          timestamp: new Date().toISOString(),
          sender: {
            username: username,
            avatar: avatar,
            id: currentUserId
          },
          is_sender: true,
          unread_count: 0
        })
      }
    } catch (error) {
      console.error('Failed to send image:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleSendFileMessage = async () => {
    if (!selectedFile || !isConnected) return
    
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('text', newMessage || '')

      const response = await api.post(
        `/chats/threads/${chatId}/send-file/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      if (response.data) {
        // Removed: const newMsg = response.data and setMessages to prevent duplication
        setShouldScrollToBottom(true)
        setNewMessage('')
        setSelectedFile(null)
        
        // Update conversation store
        const { updateConversation } = useConversationStore.getState()
        updateConversation({
          chat_id: chatId,
          message: newMessage || `[File: ${selectedFile.name}]`,
          timestamp: new Date().toISOString(),
          sender: {
            username: username,
            avatar: avatar,
            id: currentUserId
          },
          is_sender: true,
          unread_count: 0
        })
      }
    } catch (error) {
      console.error('Failed to send file:', error)
    } finally {
      setIsUploading(false)
    }
  }

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

      // Scroll to bottom on initial load
      setShouldScrollToBottom(true)
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" })
      }, 0)
      
      // Mark messages as read with a small delay - ONLY ONCE per chat
      // This matches Instagram's behavior - doesn't mark messages as read
      // until the user has had a chance to see them
      if (!hasMarkedAsReadRef.current) {
        hasMarkedAsReadRef.current = true
        
        setTimeout(async () => {
          // Check if there are any unread messages in the loaded messages
          const hasUnreadMessages = firstPage.results.some(msg => !msg.isOwn);
          
          if (hasUnreadMessages) {
            console.log("📌 Found unread messages, marking as read");
            sendMarkRead()
            
            // Also mark conversation as read in the API (persistent storage)
            try {
              const result = await markConversationAsRead(chatId);
              console.log("🔖 Marked as read for chat:", chatId, result);
            } catch (error) {
              console.error("Failed to mark conversation as read:", error);
            }
          } else {
            console.log("✅ No unread messages, skipping mark as read");
          }
        }, 500);
      }
      
      // No need to access messages state here, just use the loaded messages
      const loadedMessages = startOffset === 0 ? firstPage.results : [];
      
      // Try to find partner ID from messages
      for (const msg of loadedMessages) {
        if (!msg.isOwn && msg.sender_id) {
        setDetectedPartnerId(msg.sender_id);
        console.log("⭐ Found partner ID from loaded messages:", msg.sender_id);
        break;
      }
    }
    }

    if (chatId) {
      hasMarkedAsReadRef.current = false // Reset flag when chat ID changes
      init()
    }
  }, [chatId, sendMarkRead])

  const loadMoreMessages = useCallback(async () => {
    if (!hasMore || isLoadingMore) return
    
    setIsLoadingMore(true)
    const container = messagesContainerRef.current
    if (!container) {
      setIsLoadingMore(false)
      return
    }
    
    // Store scroll height before loading
    const previousScrollHeight = container.scrollHeight
    const newOffset = Math.max(0, offset - PAGE_SIZE)
    
    if (newOffset === offset) {
      setIsLoadingMore(false)
      return
    }

    try {
      // Wait a bit before loading to show spinner
      await new Promise(resolve => setTimeout(resolve, 200))
      
      const data = await getMessages(chatId, newOffset)
      if (data.results.length > 0) {
        setShouldScrollToBottom(false)
        setMessages(prev => [...data.results, ...prev])
        setOffset(newOffset)
        setHasMore(newOffset > 0)

        // After state update, adjust scroll to maintain position
        requestAnimationFrame(() => {
          const newScrollHeight = container.scrollHeight
          const heightAdded = newScrollHeight - previousScrollHeight
          container.scrollTop = container.scrollTop + heightAdded
        })
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error("Failed to load more messages:", error)
    } finally {
      setIsLoadingMore(false)
    }
  }, [chatId, offset, hasMore, isLoadingMore])

  // Removed auto-scroll loading - now using "Load more" button instead

  // Auto-load when scrolling to top
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const handleScroll = () => {
      // Load when user scrolls near the top
      if (container.scrollTop < 50 && hasMore && !isLoadingMore) {
        loadMoreMessages()
      }
    }

    container.addEventListener("scroll", handleScroll)
    return () => container.removeEventListener("scroll", handleScroll)
  }, [loadMoreMessages, hasMore, isLoadingMore])

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false)
      }
    }

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }
  }, [showEmojiPicker])
  
  useEffect(() => {
    if (!chatId) return
    const socket = createChatSocket(chatId)
    socketRef.current = socket

    socket.onopen = () => {
      setIsConnected(true)
      // Always mark messages as read when the chat window connects
      console.log("📲 Chat socket connected, marking messages as read");
      sendMarkRead()
    }
    socket.onclose = () => setIsConnected(false)
    socket.onerror = () => setIsConnected(false)

    socket.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)

        if (data.type === "read_receipt") {
          console.log("✅ Received read receipt:", data);
          
          // Instagram-style read receipt handling:
          // Mark ALL messages as read by this reader up to this point
          // This makes it more consistent with Instagram's behavior
          setMessages(prev =>
            prev.map((m) => {
              // Only update messages older than or equal to the one being marked as read
              // AND only our own messages (read receipts are only for our messages)
              if (m.id <= data.message_id && m.isOwn) {
                const updatedReadByIds = m.readByIds ? [...new Set([...m.readByIds, data.reader_id])] : [data.reader_id];
                console.log(`✏️ Updating message ${m.id} readByIds:`, updatedReadByIds);
                return {
                  ...m,
                  readByIds: updatedReadByIds,
                };
              }
              return m;
            })
          );
          return;
        }
        
        // Handle regular message
        const newMessage = { 
          ...data, 
          id: data.id || data.message_id, // Normalize ID field
          readByIds: Array.isArray(data.readByIds) ? data.readByIds : [],
          // Ensure sender_id is present in the message
          sender_id: data.sender_id || null
        };
        console.log("📩 New message received:", newMessage);
        
        // If we receive a message with sender_id and it's not from current user,
        // this is likely our partner - store this ID
        if (newMessage.sender_id && !newMessage.isOwn && newMessage.sender_id !== currentUserId) {
          console.log("⭐ Found partner ID from message:", newMessage.sender_id);
          setDetectedPartnerId(newMessage.sender_id);
          
          // Automatically mark messages as read when we receive a message
          // This is how Instagram handles it
          setTimeout(() => {
            sendMarkRead();
          }, 500); // Small delay to seem more natural
        } else {
          // For messages from ourselves, we already consider them read by us
          if (newMessage.isOwn && !newMessage.readByIds.includes(currentUserId)) {
            newMessage.readByIds.push(currentUserId);
          }
        }

        setMessages(prev => [...prev, newMessage])
        setShouldScrollToBottom(true) // Scroll to bottom when receiving new message

        // If message is from partner, mark as read (with a small delay to match Instagram)
        if (data.sender_id && data.sender_id !== currentUserId) {
          setTimeout(() => {
            sendMarkRead();
          }, 500);
        }
      } catch (error) {
        console.error("WebSocket message parse error:", error)
      }
    }

    return () => {
      socket.close()
    }
  }, [chatId, currentUserId, sendMarkRead])

  const handleSendMessage = () => {
    const trimmed = newMessage.trim()
    if (!trimmed || !isConnected || !socketRef.current) return
    
    socketRef.current.send(JSON.stringify({ text: trimmed }))
    
    // Update conversation store immediately when message is sent
    const { updateConversation } = useConversationStore.getState()
    updateConversation({
      chat_id: chatId,
      message: trimmed,
      timestamp: new Date().toISOString(),
      sender: {
        username: username,
        avatar: avatar,
        id: currentUserId
      },
      is_sender: true,
      unread_count: 0
    })
    
    setNewMessage("")
    setShouldScrollToBottom(true) // Scroll to bottom when sending message
  }

  const handleSend = () => {
    if (selectedImage) {
      handleSendImageMessage()
    } else if (selectedFile) {
      handleSendFileMessage()
    } else if (newMessage.trim()) {
      handleSendMessage()
    } else {
      // Send heart emoji
      if (!isConnected || !socketRef.current) return
      
      socketRef.current.send(JSON.stringify({ text: "❤️" }))
      
      // Update conversation store immediately when heart is sent
      const { updateConversation } = useConversationStore.getState()
      updateConversation({
        chat_id: chatId,
        message: "❤️",
        timestamp: new Date().toISOString(),
        sender: {
          username: username,
          avatar: avatar,
          id: currentUserId
        },
        is_sender: true,
        unread_count: 0
      })
      
      setShouldScrollToBottom(true) // Scroll to bottom when sending heart
    }
  }

  useEffect(() => {
    if (shouldScrollToBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, shouldScrollToBottom])

  // Add Instagram-like behavior: mark messages as read when window gets focus
  useEffect(() => {
    // When tab/window gets focus, send mark_read signal (WebSocket only, no API)
    const handleFocus = () => {
      console.log("💡 Window focused, sending mark_read signal");
      sendMarkRead(); // WebSocket only
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [sendMarkRead]);

  // Calculate read receipt to avoid re-computing on every render
  const readReceipt = useMemo(() => {
    if (messages.length === 0) return null;

    // Use partnerId from props or detected from messages
    let effectivePartnerId = partnerId || detectedPartnerId || 0;
    
    // Try to determine partner ID from messages if it's not provided
    if (!effectivePartnerId || effectivePartnerId === 0) {
      console.log("⚠️ partnerId is missing or zero, trying to determine from messages...");
      
      // Find messages that aren't from the current user
      const partnerMessages = messages.filter(m => !m.isOwn);
      if (partnerMessages.length > 0) {
        // First try: Check if any message from partner has a sender_id
        for (const msg of partnerMessages) {
          if (msg.sender_id && msg.sender_id !== currentUserId) {
            effectivePartnerId = msg.sender_id;
            console.log("✅ Found partner ID from message sender_id:", effectivePartnerId);
            break;
          }
        }
        
        // Second try: If we still don't have a valid partnerId, try with readByIds
        if (!effectivePartnerId || effectivePartnerId === 0) {
          const senderIds = new Set<number>();
          
          // Look through all messages to find sender IDs
          messages.forEach(msg => {
            if (msg.readByIds && msg.readByIds.length) {
              msg.readByIds.forEach(id => {
                if (id !== currentUserId) {
                  senderIds.add(id);
                }
              });
            }
          });
          
          // If we found any sender IDs, use the first one
          if (senderIds.size > 0) {
            effectivePartnerId = Array.from(senderIds)[0] as number;
            console.log("✅ Determined partner ID from readByIds:", effectivePartnerId);
          }
        }
      }
    }
    
    // Make sure partnerId is valid and not 0
    if (!effectivePartnerId || effectivePartnerId === 0) {
      console.log("❌ Read receipt not shown: partnerId is missing or zero:", partnerId);
      return null;
    }
    
    // Instagram-style read receipt logic:
    // 1. Find all messages in chronological order
    // 2. Find the last message from current user
    // 3. Check if there are any messages after that from partner (if so, no read receipt needed)
    // 4. Otherwise, check if partner read the last message from current user

    // Sort messages by time sent (assuming IDs are sequential)
    const sortedMessages = [...messages].sort((a, b) => a.id - b.id);
    
    // Find the last message from current user
    let lastOwnMessageIndex = -1;
    for (let i = sortedMessages.length - 1; i >= 0; i--) {
      if (sortedMessages[i].isOwn) {
        lastOwnMessageIndex = i;
        break;
      }
    }
    
    // If no messages from current user or it's the very last message
    if (lastOwnMessageIndex === -1) {
      console.log("❌ No own messages to show read receipt for");
      return null;
    }
    
    const lastOwnMessage = sortedMessages[lastOwnMessageIndex];
    
    // Check if there are any partner messages after our last message
    // (In Instagram, if partner has replied, read receipt isn't shown)
    const hasNewerPartnerMessages = sortedMessages.some((msg, index) => 
      index > lastOwnMessageIndex && !msg.isOwn
    );
    
    if (hasNewerPartnerMessages) {
      console.log("ℹ️ Partner has sent newer messages, not showing read receipt");
      return null;
    }
    
    // Initialize readByIds as empty array if undefined
    const readByIds = lastOwnMessage.readByIds || [];
    
    // Log detailed debug information
    console.log(`📝 Last own message ${lastOwnMessage.id}:`, {
      text: lastOwnMessage.text,
      readByIds,
      partnerId: effectivePartnerId,
      isRead: readByIds.includes(effectivePartnerId),
      isLastMessage: lastOwnMessageIndex === sortedMessages.length - 1
    });
    
    // Only show "seen" if the partner has read our last message
    // and it's the last message in the conversation (Instagram style)
    if (readByIds.includes(effectivePartnerId)) {
      return (
        <div className="flex items-center justify-end gap-1 px-4 mt-1">
          <Avatar className="w-3.5 h-3.5">
            <AvatarImage src={avatar || "/placeholder-user.jpg"} alt={username} />
            <AvatarFallback className="text-[8px]">{username.slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">Seen</span>
        </div>
      );
    } else {
      console.log("❌ Last message not read by partner yet");
      return null;
    }
  }, [messages, partnerId, detectedPartnerId, currentUserId, avatar, username]);

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-zinc-900">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Back button for mobile */}
          {onBack && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden -ml-2 flex-shrink-0 h-10 w-10"
              onClick={onBack}
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
          )}
          <Avatar className="w-10 h-10 flex-shrink-0">
            <AvatarImage src={avatar || "/placeholder.svg"} alt={username} />
            <AvatarFallback>{username.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate">{fullName || username}</div>
            <div className="text-xs text-muted-foreground">
              {isConnected ? "Active now" : online ? "Active now" : "Offline"}
            </div>
          </div>
        </div>
        <div className="flex space-x-1 flex-shrink-0">
          <Button variant="ghost" size="icon" className="h-10 w-10"><Phone className="w-5 h-5" /></Button>
          <Button variant="ghost" size="icon" className="h-10 w-10"><Video className="w-5 h-5" /></Button>
          <Button variant="ghost" size="icon" className="hidden lg:flex h-10 w-10"><Info className="w-5 h-5" /></Button>
        </div>
      </div>

      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2"
        style={{ scrollbarGutter: "stable" }}
      >
        {/* Loading indicator at top */}
        {isLoadingMore && (
          <div className="flex justify-center py-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-5 h-5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        )}

        {messages.map((msg, index) => (
          <div key={`${msg.id}-${msg.time}-${index}`} className={`flex ${msg.isOwn ? "justify-end" : "justify-start"} items-end gap-2`}>
            {!msg.isOwn && (
              <Avatar className="w-7 h-7 flex-shrink-0">
                <AvatarImage src={avatar || "/placeholder-user.jpg"} alt={username} />
                <AvatarFallback>{username.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            )}
            <div className={`flex flex-col ${msg.isOwn ? "items-end" : "items-start"} max-w-[70%]`}>
              {msg.image && (
                <Image 
                  src={msg.image} 
                  alt="chat-image" 
                  className="rounded-2xl max-w-full h-auto mb-2"
                  width={400}
                  height={400}
                />
              )}
              {msg.text && (
                <div
                  className={`px-4 py-2.5 rounded-3xl break-words ${
                    msg.isOwn 
                      ? "bg-blue-500 text-white" 
                      : "bg-zinc-100 dark:bg-zinc-800 text-foreground"
                  }`}
                >
                  {msg.text}
                </div>
              )}
              {msg.file && (
                <a 
                  href={msg.file.url} 
                  download
                  className={`px-4 py-2.5 rounded-3xl flex items-center gap-2 ${
                    msg.isOwn 
                      ? "bg-blue-500 text-white" 
                      : "bg-zinc-100 dark:bg-zinc-800 text-foreground"
                  }`}
                >
                  <span>📎</span>
                  {msg.file.name}
                </a>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />

        {/* ✓ Đã xem */}
        {readReceipt}
      </div>

      <div className="px-4 py-3 border-t flex items-center gap-2 flex-shrink-0">
        <div className="relative">
          <Button 
            variant="ghost" 
            size="icon" 
            className="flex-shrink-0 h-9 w-9"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <Smile className="w-5 h-5" />
          </Button>
          
          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div 
              ref={emojiPickerRef}
              className="absolute bottom-12 left-0 z-50"
            >
              <EmojiPicker 
                onEmojiClick={handleEmojiClick}
                theme="auto"
                width={320}
                height={400}
              />
            </div>
          )}
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="flex-shrink-0 h-9 w-9"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon className="w-5 h-5" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageSelect}
        />
        <Button 
          variant="ghost" 
          size="icon" 
          className="flex-shrink-0 h-9 w-9"
          onClick={() => fileUploadRef.current?.click()}
        >
          <Paperclip className="w-5 h-5" />
        </Button>
        <input
          ref={fileUploadRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
        />
        <Input
          className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-2"
          placeholder="Message..."
          value={newMessage}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMessage(e.target.value)}
          onFocus={() => {
            console.log("💬 Input focused, marking messages as read");
            sendMarkRead();
            
            // Removed: markAsRead in conversation store - let WebSocket handle it
            // const { markAsRead } = useConversationStore.getState();
            // markAsRead(chatId);
          }}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              if (selectedImage) {
                handleSendImageMessage()
              } else if (selectedFile) {
                handleSendFileMessage()
              } else {
                handleSendMessage()
              }
            }
          }}
        />
        <Button
          onClick={handleSend}
          disabled={!isConnected || isUploading}
          variant="ghost"
          size="icon"
          className="flex-shrink-0 h-9 w-9"
        >
          {isUploading ? (
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          ) : newMessage.trim() || selectedImage || selectedFile ? (
            <Send className="w-5 h-5 text-blue-500" />
          ) : (
            <Heart className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* Image Preview */}
      {previewUrl && (
        <div className="px-4 py-3 border-t bg-white dark:bg-zinc-900 flex items-center gap-2">
          <div className="relative">
            <Image src={previewUrl} alt="preview" className="w-16 h-16 rounded object-cover" width={64} height={64} />
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 hover:bg-red-600 text-white rounded-full"
              onClick={() => {
                setSelectedImage(null)
                setPreviewUrl(null)
                if (fileInputRef.current) fileInputRef.current.value = ''
              }}
            >
              ×
            </Button>
          </div>
          <div className="flex-1 text-sm text-muted-foreground truncate">
            {selectedImage?.name}
          </div>
        </div>
      )}

      {/* File Preview */}
      {selectedFile && (
        <div className="px-4 py-3 border-t bg-white dark:bg-zinc-900 flex items-center gap-2">
          <Paperclip className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 text-sm text-muted-foreground truncate">
            {selectedFile.name}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-red-500 hover:text-red-600"
            onClick={() => {
              setSelectedFile(null)
              if (fileUploadRef.current) fileUploadRef.current.value = ''
            }}
          >
            ×
          </Button>
        </div>
      )}
    </div>
  )
}