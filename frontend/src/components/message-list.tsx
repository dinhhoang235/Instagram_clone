"use client"

import { useState, useEffect, useCallback } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Edit } from "lucide-react"
import { getConversations, createChatSocket } from "@/lib/services/messages"
import { useConversationStore } from "@/stores/useConversationStore"
import type { MessageListType } from "@/types/chat"
import type { MinimalUser } from "@/types/search"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { CreateMessageDialog } from "./create-message-dialog"

dayjs.extend(relativeTime)

interface MessageListProps {
  onSelectChat: (chat: MessageListType) => void
  activeChat: MessageListType | null
  onSelectUserForNewMessage?: (user: MinimalUser) => void
  currentUsername?: string
  currentUserFullName?: string
}

export function MessageList({ onSelectChat, activeChat, onSelectUserForNewMessage, currentUsername, currentUserFullName }: MessageListProps) {
  const [search, setSearch] = useState("")
  const [timeRefresh, setTimeRefresh] = useState(0) // Add state variable to force timestamp updates
  const [createMessageOpen, setCreateMessageOpen] = useState(false)
  const { conversations, setConversations } = useConversationStore()

  // Refresh conversations every 30 seconds and when component mounts
  useEffect(() => {
    let isFetching = false; // Prevent concurrent fetches
    
    // Function to fetch conversations
    const fetchConversations = async () => {
      // Prevent concurrent fetches
      if (isFetching) {
        console.log("⏳ Fetch already in progress, skipping");
        return;
      }
      
      isFetching = true;
      try {
        console.log("📋 Fetching conversations...");
        const newConversations = await getConversations();
        console.log("📋 Fetched conversations:", newConversations);
        
        // Set the conversations in the store
        // Backend now handles "You:" prefix automatically
        setConversations(newConversations);
      } catch (err) {
        console.error("Failed to load conversations:", err);
      } finally {
        isFetching = false;
      }
    };
    
    // Call it immediately
    fetchConversations();
    
    // Set up periodic refresh
    const intervalId = setInterval(fetchConversations, 30000);
    
    return () => clearInterval(intervalId);
  }, [setConversations]); // Include setConversations which is stable from store

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
        console.log("⏰ Quick refresh 15s - updating timestamps");
        setTimeRefresh(prev => prev + 1);
      }, 15000)
    ];
    
    // Update timestamps when browser tab becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("🕒 Page is visible again - updating timestamps");
        setTimeRefresh(prev => prev + 1);
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
  }, []); // Empty dependency - run only once on mount

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
    <div className="w-full md:w-80 lg:w-96 border-r flex flex-col h-full bg-white dark:bg-zinc-900">
      {/* Header with username and create message button */}
      <div className="px-4 pt-4 pb-3 border-b flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold">{currentUserFullName || currentUsername || "Messages"}</h2>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setCreateMessageOpen(true)}
            aria-label="Create new message"
            className="hover:bg-transparent h-9 w-9"
          >
            <Edit className="w-6 h-6" />
          </Button>
        </div>
        
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search"
            className="pl-10 bg-zinc-100 dark:bg-zinc-800 border-0 rounded-lg h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      {/* Messages/Requests tabs */}
      <div className="flex border-b flex-shrink-0">
        <button className="flex-1 py-3 text-sm font-semibold border-b-2 border-foreground">
          Messages
        </button>
        <button className="flex-1 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
          Requests
        </button>
      </div>

      <div className="overflow-y-auto flex-1">
        {filtered.length > 0 ? (
          filtered.map((convo) => (
            <div
              key={convo.id}
              className={`flex items-center p-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${activeChat?.id === convo.id ? "bg-zinc-100 dark:bg-zinc-800" : ""
                }`}
              onClick={() => {
                console.log("🖱️ Selecting chat:", convo.id, "unread_count:", convo.unread_count);
                
                // Update the active chat
                // The Chat component will handle marking as read
                onSelectChat(convo);
                
                // Send a mark_read signal to the server via WebSocket for real-time updates
                // (Chat component will do this too, but doing it early helps with real-time)
                if (convo.unread_count > 0) {
                  // Mark as read in store immediately for instant UI feedback
                  const { markAsRead } = useConversationStore.getState();
                  markAsRead(convo.id);
                  
                  const chatSocket = createChatSocket(convo.id);
                  chatSocket.onopen = () => {
                    console.log("📤 Sending mark_read for newly selected chat");
                    chatSocket.send(JSON.stringify({ type: "mark_read" }));
                    // Close the socket after sending
                    setTimeout(() => chatSocket.close(), 500);
                  };
                }
              }}
            >
              <div className="relative flex-shrink-0">
                <Avatar className="w-14 h-14">
                  <AvatarImage src={convo.avatar || "/placeholder-user.jpg"} alt={convo.username} />
                  <AvatarFallback>{convo.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                {convo.online && (
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background" />
                )}
              </div>

              <div className="ml-3 flex-1 overflow-hidden min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <span className={`font-medium truncate ${convo.unread_count > 0 ? "font-semibold" : ""}`}>
                    {convo.fullName || convo.username}
                  </span>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span 
                      className="text-xs text-muted-foreground whitespace-nowrap" 
                      title={dayjs(convo.time).format('YYYY-MM-DD HH:mm:ss')}
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering the parent click
                        setTimeRefresh(prev => prev + 1); // Force timestamp refresh
                      }}
                    >
                      {getFormattedTime(convo.time)}
                    </span>
                    {convo.unread_count > 0 && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p
                    className={`text-sm truncate flex-1 ${convo.unread_count > 0 ? "font-semibold text-foreground" : "text-muted-foreground"
                      }`}
                  >
                    {convo.lastMessage}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <p className="text-muted-foreground">No conversations found</p>
            </div>
          </div>
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
