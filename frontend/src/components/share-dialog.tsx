"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import * as VisuallyHidden from "@radix-ui/react-visually-hidden"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { searchUsers } from "@/lib/services/search"
import { MinimalUser } from "@/types/search"
import { X, Link, Facebook, MessageCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface ShareDialogProps {
  open: boolean
  onClose: () => void
  onSelectUser: (user: MinimalUser) => void
  urlToShare: string
}

export default function ShareDialog({ open, onClose, onSelectUser, urlToShare }: ShareDialogProps) {
  const [search, setSearch] = useState("")
  const [users, setUsers] = useState<MinimalUser[]>([])
  const [suggested, setSuggested] = useState<MinimalUser[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<MinimalUser | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setLoading(true)
      searchUsers("", true)
        .then((res) => {
          setSuggested(res)
          setUsers(res)
        })
        .catch((err) => console.error("Failed to load suggested users", err))
        .finally(() => setLoading(false))
    } else {
      setSearch("")
      setUsers([])
      setSuggested([])
      setSelectedUser(null)
    }
  }, [open])

  useEffect(() => {
    if (!search) {
      setUsers(suggested)
      return
    }

    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await searchUsers(search, true)
        setUsers(res)
      } catch (error) {
        console.error("Search failed", error)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(t)
  }, [search, suggested])

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(urlToShare)
      toast({ title: "Copied", description: "Post link copied to clipboard" })
    } catch (error) {
      console.error("Copy failed", error)
      toast({ title: "Error", description: "Could not copy link", variant: "destructive" })
    }
  }

  const shareTargets = [
    { 
      key: 'copy', 
      label: 'Copy link', 
      onClick: handleCopyLink, 
      icon: <Link className="w-5 h-5" /> 
    },
    { 
      key: 'facebook', 
      label: 'Facebook', 
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(urlToShare)}`,
      icon: <Facebook className="w-5 h-5" />
    },
    { 
      key: 'messenger', 
      label: 'Messenger', 
      href: `fb-messenger://share?link=${encodeURIComponent(urlToShare)}`,
      icon: <MessageCircle className="w-5 h-5" />
    }
  ]

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md p-0 gap-0 bg-white text-black">
        {/* Visually hidden title/description for accessibility */}
        <VisuallyHidden.Root asChild>
          <DialogTitle>Share</DialogTitle>
        </VisuallyHidden.Root>
        <VisuallyHidden.Root asChild>
          <DialogDescription>Share this post with someone or copy link</DialogDescription>
        </VisuallyHidden.Root>

        {/* Header */}
        <div className="flex items-center justify-center px-4 py-3 border-b border-gray-200 relative">
          <button 
            className="absolute left-3 top-3 p-2 rounded-full hover:bg-gray-100 transition-colors" 
            onClick={onClose} 
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>
          <h2 className="text-base font-semibold text-black">Share</h2>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2">
            <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <Input
              placeholder="Search"
              className="border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-6 bg-transparent text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Suggested horizontal */}
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center overflow-x-auto space-x-6 py-2">
            {loading ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : users.length === 0 ? (
              <div className="text-sm text-gray-500">No users found</div>
            ) : users.map((user) => (
              <div 
                key={user.id} 
                className="flex-shrink-0 text-center cursor-pointer" 
                onClick={() => setSelectedUser(selectedUser?.id === user.id ? null : user)}
              >
                <div className="relative w-16 h-16 mx-auto mb-1">
                  <Avatar className="w-16 h-16 border-2 border-gray-200">
                    <AvatarImage src={user.avatar || "/placeholder-user.jpg"} />
                    <AvatarFallback className="bg-gray-200 text-gray-700">
                      {user.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {selectedUser?.id === user.id && (
                    <div className="absolute -bottom-1 right-0 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center border-2 border-white">
                      <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="text-xs max-w-[72px] truncate text-gray-900">{user.username}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Share options */}
        <div className="px-4 py-4">
          <div className="grid grid-cols-4 gap-4 justify-items-center">
            {shareTargets.map((t) => (
              <div key={t.key} className="flex flex-col items-center text-center">
                {t.onClick ? (
                  <button 
                    onClick={t.onClick} 
                    className="w-14 h-14 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  >
                    <div className="text-gray-700">
                      {t.icon}
                    </div>
                  </button>
                ) : (
                  <a 
                    href={t.href} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="w-14 h-14 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  >
                    <div className="text-gray-700">
                      {t.icon}
                    </div>
                  </a>
                )}
                <div className="text-xs mt-2 text-gray-700">{t.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Send Button */}
        <div className="px-4 py-3 border-t border-gray-200">
          <Button 
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg py-2.5" 
            disabled={!selectedUser} 
            onClick={() => {
              if (selectedUser) {
                onSelectUser(selectedUser)
                onClose()
              }
            }}
          >
            Send
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}