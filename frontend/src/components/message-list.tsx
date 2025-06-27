"use client"

import { useState, useEffect, useCallback } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Edit } from "lucide-react"
import { getConversations, createChatSocket, markConversationAsRead } from "@/lib/services/messages"
import { useConversationStore } from "@/stores/useConversationStore"
import type { MessageListType, MarkReadResponse } from "@/types/chat"
import type { MinimalUser } from "@/types/search"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { CreateMessageDialog } from "./create-message-dialog"

dayjs.extend(relativeTime)

interface MessageListProps {
  onSelectChat: (chat: MessageListType) => void
  activeChat: MessageListType | null
  onSelectUserForNewMessage?: (user: MinimalUser) => void
}

export function MessageList({ onSelectChat, activeChat, onSelectUserForNewMessage }: MessageListProps) {
  const [search, setSearch] = useState("")
  const [timeRefresh, setTimeRefresh] = useState(0) // Add state variable to force timestamp updates
  const [createMessageOpen, setCreateMessageOpen] = useState(false)
  const { conversations, setConversations, markAsRead } = useConversationStore()

  // Function to refresh conversations periodically
  const refreshConversations = useCallback(async () => {
    try {
      console.log("🔄 Refreshing conversation list");
      const conversations = await getConversations();
      setConversations(conversations);
    } catch (err) {
      console.error("Failed to refresh conversations", err);
    }
  }, [setConversations]);

  // Function to mark a conversation as read both locally and on the server
  const markConversationAsReadBoth = useCallback(async (conversationId: number) => {
    if (!conversationId) {
      console.warn("⚠️ Attempted to mark invalid conversation ID as read:", conversationId);
      return;
    }
    
    console.log(`🔖 Marking conversation ${conversationId} as read (both locally and on server)`);
    
    // First update server state via API - do this first to ensure persistence
    try {
      const result: MarkReadResponse = await markConversationAsRead(conversationId);
      console.log(`✅ Conversation ${conversationId} marked as read on server:`, result);
      
      // Then update local state after server confirms
      markAsRead(conversationId);
      
      // If messages were marked as read, refresh conversations after a short delay
      // This ensures our UI reflects the latest state from the server
      if (result.marked_read > 0) {
        setTimeout(() => {
          console.log("🔄 Refreshing conversations after marking as read");
          refreshConversations();
        }, 500);
      }
    } catch (error) {
      console.error(`❌ Failed to mark conversation ${conversationId} as read on server:`, error);
      
      // Still update local state even if server fails
      markAsRead(conversationId);
    }
  }, [markAsRead, refreshConversations]);

  // Refresh conversations every 30 seconds and when component mounts
  useEffect(() => {
    let isFirstLoad = true;
    let isPageReload = true; // Detect if this is a page reload
    
    // Function to fetch conversations and mark active as read
    const fetchConversationsAndMarkRead = async () => {
      try {
        console.log("📋 Fetching conversations...");
        const conversations = await getConversations();
        console.log("📋 Fetched conversations:", conversations);
        
        // Set the conversations in the store
        setConversations(conversations);
        
        // If there's an active chat, make sure it's marked as read immediately
        if (activeChat) {
          console.log(`🔄 Marking active chat ${activeChat.id} as read`);
          
          // On first load or page reload, make an extra effort to mark it read
          if (isFirstLoad || isPageReload) {
            console.log(`📍 ${isPageReload ? 'Page reload' : 'First load'} - ensuring active chat ${activeChat.id} is marked as read`);
            
            try {
              // Make direct API call first
              const result = await markConversationAsRead(activeChat.id);
              console.log(`✅ ${isPageReload ? 'Page reload' : 'First load'}: marked ${result.marked_read} messages as read via API`);
              
              // Then update local state
              markAsRead(activeChat.id);
              
              // Then refresh conversations to ensure UI is updated
              // (Always refresh after page reload to ensure state is synchronized)
              if (result.marked_read > 0 || isPageReload) {
                console.log("🔄 Refreshing after marking as read");
                setTimeout(() => refreshConversations(), 500);
                
                // After a successful API call and refresh, do one more as a failsafe
                // This ensures any remaining conversations that should be marked as read are properly updated
                if (isPageReload) {
                  setTimeout(async () => {
                    markConversationAsRead(activeChat.id)
                      .then(() => console.log("🔄 Final failsafe mark-as-read after page reload"))
                      .catch(() => {/* Silently handle errors in the failsafe */});
                  }, 2000);
                }
              }
            } catch (err) {
              console.error("Error marking conversation as read on first load:", err);
            }
            
            isPageReload = false; // Reset the page reload flag
          } else {
            // Normal marking as read for subsequent refreshes
            markConversationAsReadBoth(activeChat.id);
          }
        }
        
        isFirstLoad = false;
      } catch (err) {
        console.error("Failed to load conversations:", err);
      }
    };
    
    // Call it immediately
    fetchConversationsAndMarkRead();
    
    // Set up periodic refresh
    const intervalId = setInterval(fetchConversationsAndMarkRead, 30000);
    
    return () => clearInterval(intervalId);
  }, [setConversations, refreshConversations, activeChat, markConversationAsReadBoth, markAsRead])

  // Effect to mark the active chat as read when it changes
  useEffect(() => {
    if (activeChat) {
      console.log("🔍 Marking active chat as read:", activeChat.id);
      markConversationAsReadBoth(activeChat.id);
    }
  }, [activeChat, markConversationAsReadBoth]);

  // Effect to refresh timestamps periodically
  useEffect(() => {
    console.log("⏰ Setting up timestamp refresh timers");
    
    // Refresh timestamps every minute
    const timerID = setInterval(() => {
      console.log("⏰ Minute timer - updating timestamps");
      setTimeRefresh(prev => prev + 1);
    }, 60000);
    
    // Also refresh more frequently at the beginning
    const quickRefreshTimers = [
      setTimeout(() => {
        console.log("⏰ Quick refresh 1s - updating timestamps");
        setTimeRefresh(prev => prev + 1);
      }, 1000),
      setTimeout(() => {
        console.log("⏰ Quick refresh 5s - updating timestamps");
        setTimeRefresh(prev => prev + 1);
      }, 5000),
      setTimeout(() => {
        console.log("⏰ Quick refresh 15s - updating timestamps and conversations");
        setTimeRefresh(prev => prev + 1);
        refreshConversations();
      }, 15000)
    ];
    
    // Update timestamps when browser tab becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("🕒 Page is visible again - updating timestamps and conversations");
        setTimeRefresh(prev => prev + 1);
        refreshConversations(); // Also refresh conversations data
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Refresh timestamps when the component first loads - TWICE to ensure it applies
    console.log("🕒 Initial timestamp refresh");
    setTimeRefresh(1); // Force to a known value
    
    // Fire another refresh after a very short delay
    const initialRefreshTimer = setTimeout(() => {
      console.log("🕒 Secondary immediate timestamp refresh");
      setTimeRefresh(2); // Increment to trigger another refresh
    }, 50);
    
    return () => {
      console.log("⏰ Cleaning up timestamp refresh timers");
      clearInterval(timerID);
      quickRefreshTimers.forEach(clearTimeout);
      clearTimeout(initialRefreshTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshConversations]);

  // Helper function to safely parse backend timestamps
  const parseTimestamp = useCallback((timestamp: string) => {
    if (!timestamp) return dayjs();
    
    try {
      // First check if it's an ISO string format (e.g. "2023-06-24T10:30:00Z")
      let parsed = dayjs(timestamp);
      
      // If not valid, try to handle common time formats
      if (!parsed.isValid()) {
        // Time like "8:30 PM" - assume it's today with this time
        const timePattern = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i;
        const match = timestamp.match(timePattern);
        
        if (match) {
          const hours = parseInt(match[1]);
          const minutes = parseInt(match[2]);
          const isPM = match[3].toUpperCase() === 'PM';
          
          // Convert to 24-hour format
          const hour24 = isPM ? (hours === 12 ? 12 : hours + 12) : (hours === 12 ? 0 : hours);
          
          // Create a valid time today
          const now = dayjs();
          parsed = now.hour(hour24).minute(minutes).second(0);
          // Only log in development mode
          if (process.env.NODE_ENV === 'development') {
            console.log(`Converted time format "${timestamp}" to today at ${parsed.format('HH:mm')}`);
          }
          return parsed;
        } else {
          console.error(`Unrecognized timestamp format: ${timestamp}`);
          return dayjs(); // Return current time as fallback
        }
      }
      
      return parsed;
    } catch (err) {
      console.error(`Error parsing timestamp ${timestamp}:`, err);
      return dayjs(); // Return current time as fallback
    }
  }, []);

  // Function to format time in a Facebook/Instagram-like way
  const getFormattedTime = useCallback((timestamp: string) => {
    if (!timestamp) return "";
    
    try {
      // Use timeRefresh as a dependency to force re-render
      // We need to reference timeRefresh to make the linter happy
      if (timeRefresh !== undefined) {
        // This condition will always be true, but it forces React to consider timeRefresh as used
        // The main purpose is to make the component re-render whenever timeRefresh changes
      }
      
      // If it looks like a formatted time already (like "8:30 PM"), just return it
      if (/^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(timestamp)) {
        return timestamp; // Already in the right format
      }
      
      // Ensure we're using fresh dayjs instances with current time
      // Use our custom parser to handle various timestamp formats
      const msgDate = parseTimestamp(timestamp);
      const now = dayjs();
      
      // Calculate time differences for formatting decisions
      const diffMinutes = now.diff(msgDate, 'minute');
      const diffDays = now.diff(msgDate, 'day');
      const diffYears = now.diff(msgDate, 'year');
      
      // Is the message from today?
      const isToday = now.format('YYYY-MM-DD') === msgDate.format('YYYY-MM-DD');
      // Is the message from yesterday?
      const isYesterday = now.subtract(1, 'day').format('YYYY-MM-DD') === msgDate.format('YYYY-MM-DD');
      
      // Facebook/Instagram style time formatting
      if (diffMinutes < 1) {
        // Just now
        return 'Just now';
      } else if (diffMinutes < 60) {
        // Minutes ago (only for recent messages)
        return `${diffMinutes}m`;
      } else if (isToday) {
        // Today - show the time
        return msgDate.format('h:mm A'); // e.g. "2:30 PM"
      } else if (isYesterday) {
        // Yesterday
        return 'Yesterday';
      } else if (diffDays < 7) {
        // This week
        return msgDate.format('ddd'); // e.g. "Mon"
      } else if (diffYears < 1) {
        // This year, but more than a week ago
        return msgDate.format('MMM D'); // e.g. "Jun 15"
      } else {
        // More than a year ago
        return msgDate.format('MMM D, YYYY'); // e.g. "Jun 15, 2024"
      }
    } catch (err) {
      console.error("Error formatting time:", err);
      return timestamp || "now"; // Just return the original or default
    }
  }, [timeRefresh, parseTimestamp]);

  // Note: WebSocket connection is now handled globally by WebSocketProvider
  // This ensures real-time updates work everywhere, not just on the messages page

  const filtered = conversations.filter((c) =>
    c.username?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="w-full md:w-80 lg:w-96 border-r">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Messages</h2>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setCreateMessageOpen(true)}
            aria-label="Create new message"
          >
            <Edit className="w-4 h-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search messages"
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-y-auto h-[calc(100vh-10rem)]">
        {filtered.length > 0 ? (
          filtered.map((convo) => (
            <div
              key={convo.id}
              className={`flex items-center p-4 cursor-pointer hover:bg-muted/50 ${activeChat?.id === convo.id ? "bg-muted" : ""
                }`}
              onClick={() => {
                console.log("🖱️ Selecting chat:", convo.id);
                
                // Mark as read using our helper function (updates both local and server)
                markConversationAsReadBoth(convo.id);
                
                // Update the active chat
                onSelectChat(convo);
                
                // Send a mark_read signal to the server via WebSocket for real-time updates
                const chatSocket = createChatSocket(convo.id);
                chatSocket.onopen = () => {
                  console.log("📤 Sending mark_read for newly selected chat");
                  chatSocket.send(JSON.stringify({ type: "mark_read" }));
                  // Close the socket after sending
                  setTimeout(() => chatSocket.close(), 500);
                };
              }}
            >
              <div className="relative">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={convo.avatar || "/placeholder-user.jpg"} alt={convo.username} />
                  <AvatarFallback>{convo.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                {convo.online && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                )}
              </div>

              <div className="ml-3 flex-1 overflow-hidden">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{convo.username}</span>
                  <span 
                    className="text-xs text-muted-foreground" 
                    title={dayjs(convo.time).format('YYYY-MM-DD HH:mm:ss')}
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering the parent click
                      setTimeRefresh(prev => prev + 1); // Force timestamp refresh
                    }}
                  >
                    {getFormattedTime(convo.time)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p
                    className={`text-sm truncate flex-1 ${convo.unread_count > 0 ? "font-semibold text-foreground" : "text-muted-foreground"
                      }`}
                  >
                    {convo.lastMessage}
                  </p>
                  {convo.unread_count > 0 && (
                    <span className="ml-2 min-w-[18px] h-[18px] bg-blue-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                      {convo.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-muted-foreground">No conversations found</div>
        )}
      </div>

      {/* Create Message Dialog */}
      <CreateMessageDialog 
        open={createMessageOpen} 
        onClose={() => setCreateMessageOpen(false)}
        onSelectUser={(user) => {
          // Call the parent's callback if provided
          if (onSelectUserForNewMessage) {
            onSelectUserForNewMessage(user);
          }
          setCreateMessageOpen(false);
        }}
      />
    </div>
  )
}
