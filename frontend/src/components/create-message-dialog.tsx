"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { searchUsers } from "@/lib/services/search"
import { MinimalUser } from "@/types/search"
import * as VisuallyHidden from "@radix-ui/react-visually-hidden"

interface CreateMessageDialogProps {
  open: boolean
  onClose: () => void
  onSelectUser: (user: MinimalUser) => void // Chỉ trả về user, chưa gửi gì cả
}

export function CreateMessageDialog({ open, onClose, onSelectUser }: CreateMessageDialogProps) {
  const [search, setSearch] = useState("")
  const [users, setUsers] = useState<MinimalUser[]>([])
  const [suggestedUsers, setSuggestedUsers] = useState<MinimalUser[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<MinimalUser | null>(null)

  // Load suggested mutual followers when dialog opens
  useEffect(() => {
    if (open) {
      setLoading(true)
      // Load all mutual followers as suggestions
      searchUsers("", true)
        .then((res) => {
          setSuggestedUsers(res)
          setUsers(res)
        })
        .catch((error) => {
          console.error("❌ Failed to load suggested users:", error)
        })
        .finally(() => setLoading(false))
    } else {
      // Reset when dialog closes
      setSearch("")
      setUsers([])
      setSuggestedUsers([])
      setSelectedUser(null)
    }
  }, [open])

  // Search within mutual followers
  useEffect(() => {
    if (!search) {
      setUsers(suggestedUsers)
      return
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true)
      try {
        // Search within mutual followers
        const res = await searchUsers(search, true)
        setUsers(res)
      } catch (error) {
        console.error("Search failed", error)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [search, suggestedUsers])

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="w-screen h-screen max-h-screen p-0 gap-0 flex flex-col rounded-none sm:rounded-lg sm:max-w-md sm:h-auto sm:max-h-[60vh] sm:mx-auto">
        {/* Visually hidden title for accessibility */}
        <VisuallyHidden.Root asChild>
          <DialogTitle>New message</DialogTitle>
        </VisuallyHidden.Root>
        
        {/* Visually hidden description for accessibility */}
        <VisuallyHidden.Root asChild>
          <DialogDescription>Create a new message conversation</DialogDescription>
        </VisuallyHidden.Root>

        {/* Custom Header */}
        <div className="flex items-center justify-center px-4 py-3 border-b">
          <h2 className="text-base font-semibold">New message</h2>
        </div>

        {/* To: Search Input */}
        <div className="px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">To:</span>
            <Input
              placeholder="Search..."
              className="border-0 shadow-none focus-visible:ring-0 px-2 h-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Suggested Section */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {!search && users.length > 0 && (
            <h3 className="text-sm font-semibold px-4 py-3">Suggested</h3>
          )}
          
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">Loading...</div>
            ) : users.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <p>No mutual followers found.</p>
                <p className="text-xs mt-1">You can only message people you both follow each other.</p>
              </div>
            ) : users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/50"
                onClick={() => {
                  setSelectedUser(selectedUser?.id === user.id ? null : user)
                }}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-11 h-11">
                    <AvatarImage src={user.avatar || "/placeholder-user.jpg"} />
                    <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    {user.full_name && (
                      <div className="font-medium text-sm">{user.full_name}</div>
                    )}
                    <div className="text-sm text-muted-foreground">{user.username}</div>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  selectedUser?.id === user.id 
                    ? 'bg-blue-500 border-blue-500' 
                    : 'border-muted-foreground'
                }`}>
                  {selectedUser?.id === user.id && (
                    <svg className="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Button */}
        <div className="px-4 py-3 border-t sticky bottom-0 bg-background z-10">
          <Button
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold"
            disabled={!selectedUser}
            onClick={() => {
              if (selectedUser) {
                onSelectUser(selectedUser)
                onClose()
              }
            }}
          >
            Chat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}