"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search } from "lucide-react"
import api from "@/lib/api"
import { MessageListType } from "@/types/chat"

interface User {
  id: number
  username: string
  avatar: string
}

interface CreateMessageDialogProps {
  open: boolean
  onClose: () => void
  onSelectUser: (chat: MessageListType) => void
}

export function CreateMessageDialog({ open, onClose, onSelectUser }: CreateMessageDialogProps) {
  const [search, setSearch] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)

  // Search for users when query changes
  useEffect(() => {
    if (!search || search.length < 2) {
      setUsers([])
      return
    }

    const searchUsers = async () => {
      setLoading(true)
      try {
        // const res = await api.get<User[]>(`/users/search/?q=${encodeURIComponent(search)}`)
        // setUsers(res.data)
      } catch (error) {
        console.error("Failed to search users:", error)
      } finally {
        setLoading(false)
      }
    }

    const timeoutId = setTimeout(searchUsers, 300)
    return () => clearTimeout(timeoutId)
  }, [search])

  // Start a new conversation with a user
  const startConversation = async (userId: number, username: string, avatar: string) => {
    try {
      const res = await api.post<{ thread_id: number }>("/chats/conversations/", { 
        user_id: userId 
      })
      
      // Create a temporary conversation object
      const newChat: MessageListType = {
        id: res.data.thread_id,
        username,
        avatar,
        lastMessage: "",
        time: new Date().toISOString(),
        online: false,
        unread_count: 0,
        partner_id: userId
      }
      
      // Select this conversation
      onSelectUser(newChat)
      onClose()
    } catch (error) {
      console.error("Failed to start conversation:", error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
        </DialogHeader>
        
        {/* Search input */}
        <div className="relative mt-4">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search for users..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        
        {/* User results */}
        <div className="mt-2 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">Searching...</div>
          ) : users.length > 0 ? (
            users.map((user) => (
              <div
                key={user.id}
                className="flex items-center p-3 cursor-pointer hover:bg-muted/50 rounded-md"
                onClick={() => startConversation(user.id, user.username, user.avatar)}
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={user.avatar || "/placeholder-user.jpg"} alt={user.username} />
                  <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="ml-3 font-medium">{user.username}</span>
              </div>
            ))
          ) : search.length > 1 ? (
            <div className="p-4 text-center text-muted-foreground">No users found</div>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              Search for users to message
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
