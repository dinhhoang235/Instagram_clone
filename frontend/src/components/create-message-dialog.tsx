"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search } from "lucide-react"
import { searchUsers } from "@/lib/services/search"
import { MinimalUser } from "@/types/search"

interface CreateMessageDialogProps {
  open: boolean
  onClose: () => void
  onSelectUser: (user: MinimalUser) => void // Chỉ trả về user, chưa gửi gì cả
}

export function CreateMessageDialog({ open, onClose, onSelectUser }: CreateMessageDialogProps) {
  const [search, setSearch] = useState("")
  const [users, setUsers] = useState<MinimalUser[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!search || search.length < 2) {
      setUsers([])
      return
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await searchUsers(search)
        setUsers(res)
      } catch (error) {
        console.error("Search failed", error)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [search])

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
        </DialogHeader>

        <div className="relative mt-4">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search for users..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="mt-2 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">Searching...</div>
          ) : users.map((user) => (
            <div
              key={user.id}
              className="flex items-center p-3 cursor-pointer hover:bg-muted/50 rounded-md"
              onClick={() => {
                onSelectUser(user) 
                onClose()
              }}
            >
              <Avatar className="w-10 h-10">
                <AvatarImage src={user.avatar || "/placeholder-user.jpg"} />
                <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="ml-3 font-medium">{user.username}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}