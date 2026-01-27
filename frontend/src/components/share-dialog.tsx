"use client"

import { useEffect, useState, useRef } from "react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import * as VisuallyHidden from "@radix-ui/react-visually-hidden"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { searchUsers } from "@/lib/services/search"
import { MinimalUser } from "@/types/search"
import {Link, Facebook, MessageCircle } from "lucide-react"
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
  const [isSearching, setIsSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
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
      setIsSearching(false)
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
      <DialogContent className="sm:max-w-md p-0 gap-0 bg-card text-foreground">
        {/* Visually hidden title/description for accessibility */}
        <VisuallyHidden.Root asChild>
          <DialogTitle>Share</DialogTitle>
        </VisuallyHidden.Root>
        <VisuallyHidden.Root asChild>
          <DialogDescription>Share this post with someone or copy link</DialogDescription>
        </VisuallyHidden.Root>

        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-center px-4 py-3 border-b border-border relative">
            <h2 className="text-base font-semibold text-foreground">Share</h2>
          </div>

          {/* Search (moved up) */}
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center">
              <div className="flex items-center bg-muted/50 rounded-lg px-3 py-2 flex-1">
                <svg className="w-4 h-4 text-muted-foreground mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <Input
                  ref={inputRef}
                  placeholder="Search"
                  className="border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-6 bg-transparent text-sm"
                  value={search}
                  onFocus={() => setIsSearching(true)}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    if (e.target.value) setIsSearching(true)
                  }}
                />

                {search && (
                  <button
                    onClick={() => {
                      // Clear input but remain in search mode (keep list + Cancel visible)
                      setSearch("")
                      setUsers(suggested)
                      setSelectedUser(null)
                      setIsSearching(true)
                      inputRef.current?.focus()
                    }}
                    aria-label="Clear search"
                    className="ml-2 text-muted-foreground hover:text-foreground"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                      <path d="M6 6l8 8M14 6l-8 8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                )}
              </div>

              {isSearching && (
                <button
                  onClick={() => {
                    // Cancel returns to initial (non-search) view
                    setSearch("")
                    setUsers(suggested)
                    setSelectedUser(null)
                    setIsSearching(false)
                  }}
                  className="ml-4 text-sm font-medium text-foreground"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Main content - users (grid or list) */}
          <main className="px-4 py-4 overflow-y-auto md:h-[404px] flex-1">
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : users.length === 0 ? (
              <div className="text-sm text-muted-foreground">No users found</div>
            ) : isSearching ? (
              // When user is searching (or in search mode), show a vertical list similar to IG
              <div>
                <div className="mb-3 text-sm font-medium text-foreground">More Users</div>
                <div className="divide-y rounded-md border border-border bg-card">
                  {users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => setSelectedUser(selectedUser?.id === user.id ? null : user)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={user.avatar || "/placeholder-user.jpg"} />
                            <AvatarFallback className="bg-muted text-muted-foreground">
                              {user.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="truncate">
                          <div className="text-sm font-medium text-foreground truncate">{user.full_name || user.username}</div>
                          <div className="text-xs text-muted-foreground truncate">{user.username}</div>
                        </div>
                      </div>

                      <div className="ml-3">
                        {selectedUser?.id === user.id ? (
                          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white">
                            <svg className="w-3 h-3" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                              <path d="M6 10l2 2 6-6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full border border-border" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-6">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="w-1/3 sm:w-1/4 text-center cursor-pointer"
                    onClick={() => setSelectedUser(selectedUser?.id === user.id ? null : user)}
                  >
                    <div className="relative w-16 h-16 mx-auto mb-2">
                      <Avatar className="w-16 h-16 border-2 border-border">
                        <AvatarImage src={user.avatar || "/placeholder-user.jpg"} />
                        <AvatarFallback className="bg-muted text-muted-foreground">
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
                    <div className="text-xs truncate text-foreground">{user.username}</div>
                  </div>
                ))}
              </div>
            )}
          </main>

          {/* Share options - anchored above send */}
          <div className="px-4 py-3 border-t border-border bg-card">
            <div className="flex items-center justify-between gap-4">
              {shareTargets.map((t) => (
                <div key={t.key} className="flex-1 flex flex-col items-center text-center">
                  {t.onClick ? (
                    <button
                      onClick={t.onClick}
                      className="w-12 h-12 rounded-full bg-muted/50 hover:bg-muted/60 flex items-center justify-center transition-colors"
                    >
                      <div className="text-muted-foreground">{t.icon}</div>
                    </button>
                  ) : (
                    <a
                      href={t.href}
                      target="_blank"
                      rel="noreferrer"
                      className="w-12 h-12 rounded-full bg-muted/50 hover:bg-muted/60 flex items-center justify-center transition-colors mx-auto"
                    >
                      <div className="text-muted-foreground">{t.icon}</div>
                    </a>
                  )}
                  <div className="text-xs mt-2 text-muted-foreground">{t.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Send Button (sticky at bottom) */}
          <div className="px-4 py-4 border-t border-border">
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
        </div>
      </DialogContent>
    </Dialog>
  )
}