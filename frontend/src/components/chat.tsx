"use client"

import React, { useEffect, useRef, useState, useCallback } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Phone, Video, Info, Smile, ImageIcon, Send, Heart } from "lucide-react"
import { getMessages, createChatSocket, markConversationAsRead } from "@/lib/services/messages"
import type { ChatProps, MessageType } from "@/types/chat"

const PAGE_SIZE = 20

export function Chat({
  chatId,
  username,
  avatar,
  online,
  currentUserId,
  partnerId,
}: ChatProps & { currentUserId: number; partnerId: number }) {
  const [messages, setMessages] = useState<MessageType[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const socketRef = useRef<WebSocket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const sendMarkRead = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      console.log("📤 Sending mark_read to server");
      socketRef.current.send(JSON.stringify({ type: "mark_read" }))
    }
  }, [socketRef])
  
  // Add a function to ensure chat is marked as read (both WebSocket and API)
  const ensureMarkedAsRead = useCallback(async () => {
    if (!chatId) return;
    
    console.log(`🔖 Ensuring chat ${chatId} is marked as read`);
    
    // Mark read through WebSocket for real-time updates
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      console.log("📤 Sending mark_read to server through WebSocket");
      socketRef.current.send(JSON.stringify({ type: "mark_read" }));
    }
    
    // Mark read through API for persistence
    try {
      const result = await markConversationAsRead(chatId);
      console.log(`✅ Chat ${chatId} marked as read via API:`, result);
    } catch (error) {
      console.error(`❌ Error marking chat ${chatId} as read:`, error);
    }
  }, [chatId, socketRef])

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

      messagesEndRef.current?.scrollIntoView({ behavior: "auto" })
      
      // Mark messages as read with a small delay
      // This matches Instagram's behavior - doesn't mark messages as read
      // until the user has had a chance to see them
      setTimeout(async () => {
        sendMarkRead()
        
        // Also mark conversation as read in the API (persistent storage)
        try {
          await ensureMarkedAsRead();
          console.log("🔖 Initial mark as read for chat:", chatId);
        } catch (error) {
          console.error("Failed to mark conversation as read:", error);
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
      }, 500);
    }

    if (chatId) {
      init()
    }
  }, [chatId, sendMarkRead, ensureMarkedAsRead])

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

  // Store partnerId in component state so we can update it when detected
  const [detectedPartnerId, setDetectedPartnerId] = useState<number | undefined>(undefined);
  
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

  // Effect to mark messages as read when chat ID changes (switching between conversations)
  useEffect(() => {
    if (chatId && isConnected) {
      console.log("📱 Chat ID changed, marking messages as read:", chatId);
      sendMarkRead();
    }
  }, [chatId, isConnected, sendMarkRead])

  const handleSendMessage = () => {
    const trimmed = newMessage.trim()
    if (!trimmed || !isConnected || !socketRef.current) return
    socketRef.current.send(JSON.stringify({ text: trimmed }))
    setNewMessage("")
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Add Instagram-like behavior: mark messages as read when window gets focus
  useEffect(() => {
    // When tab/window gets focus, mark messages as read
    const handleFocus = async () => {
      console.log("💡 Window focused, marking messages as read");
      sendMarkRead();
      
      // Also persist read status to server via API
      if (chatId) {
        try {
          await markConversationAsRead(chatId);
          console.log("📃 Window focus: marked as read via API for chat:", chatId);
        } catch (error) {
          console.error("Failed to mark conversation as read on window focus:", error);
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [sendMarkRead, chatId]);

  // Effect to mark messages as read when window regains focus
  useEffect(() => {
    // Only add this if we have a valid chat
    if (!chatId) return;

    const handleFocus = () => {
      console.log("🔍 Window focused - ensuring chat is marked as read");
      ensureMarkedAsRead();
    };

    window.addEventListener("focus", handleFocus);
    
    // Clean up
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [chatId, ensureMarkedAsRead]);

  // This effect runs once on component mount and after page reload
  useEffect(() => {
    if (!chatId) return;
    
    // Wait for the component to fully mount
    const timeoutId = setTimeout(() => {
      console.log(`🔄 Chat component mounted/reloaded - ensuring chat ${chatId} is marked as read`);
      ensureMarkedAsRead();
    }, 1000); // Small delay to ensure everything is loaded
    
    return () => clearTimeout(timeoutId);
  }, [chatId, ensureMarkedAsRead]); // Run when chat ID changes or when the component mounts

  return (
    <div className="flex-1 flex flex-col">
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

      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 flex flex-col gap-4"
        style={{ scrollbarGutter: "stable" }}
      >
        {messages.map((msg, index) => (
          <div key={`${msg.id}-${msg.time}-${index}`} className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}>
            {!msg.isOwn && (
              <Avatar className="w-8 h-8 mr-2 mt-1">
                <AvatarImage src={avatar || "/placeholder-user.jpg"} alt={username} />
                <AvatarFallback>{username.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            )}
            <div>
              <div
                className={`max-w-xs px-4 py-2 rounded-2xl ${msg.isOwn ? "bg-blue-500 text-white rounded-br-none" : "bg-muted rounded-bl-none"
                  }`}
              >
                {msg.text}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{msg.time}</div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />

        {/* ✓ Đã xem */}
        {messages.length > 0 && (() => {
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
              <div className="text-xs text-blue-500 text-right pr-4 mt-1">✓ Seen</div>
            );
          } else {
            console.log("❌ Last message not read by partner yet");
            return null;
          }
        })()}
      </div>

      <div className="p-4 border-t flex items-center">
        <Button variant="ghost" size="icon"><Smile className="w-5 h-5" /></Button>
        <Button variant="ghost" size="icon"><ImageIcon className="w-5 h-5" /></Button>
        <Input
          className="mx-3"
          placeholder="Message..."
          value={newMessage}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMessage(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
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