"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Dialog, DialogPortal, DialogOverlay, DialogTitle } from "@/components/ui/dialog"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import * as VisuallyHidden from "@radix-ui/react-visually-hidden"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ImageIcon, ChevronDown, MapPin, Smile } from "lucide-react"
import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getPostById, updatePost } from "@/lib/services/posts"
import { toast } from "sonner"
import EmojiPicker, { EmojiClickData, Theme as EmojiTheme } from "emoji-picker-react"
import useIsDark from "@/lib/hooks/useIsDark"
import type { PostType, PostImageType } from "@/types/post"

interface EditPostDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  postId: string | number
}

export default function EditPostDialog({ open, onOpenChange, postId }: EditPostDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [caption, setCaption] = useState("")
  const [location, setLocation] = useState("")
  const [images, setImages] = useState<string[]>([])
  const [altTexts, setAltTexts] = useState<string[]>([])
  const [hideLikes, setHideLikes] = useState(false)
  const [disableComments, setDisableComments] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const emojiPickerRef = useRef<HTMLDivElement | null>(null)
  const [showAccessibility, setShowAccessibility] = useState(false)
  const isDark = useIsDark()
  const categoryNavVar = '--epr-category-navigation-button-size'

  const [postUser, setPostUser] = useState<{ username?: string; avatar?: string } | null>(null)

  useEffect(() => {
    if (!open) return
    setIsLoading(true)
    getPostById(postId)
      .then((p: PostType) => {
        setCaption(p.caption || "")
        setLocation(p.location || "")
        setHideLikes(Boolean(p.hide_likes))
        setDisableComments(Boolean(p.disable_comments))
        setPostUser(p.user || null)

        const imgs: string[] = (p.images || []).map((i) => {
          if (!i) return ''
          if (typeof i === 'string') return i
          const maybe = i as { image?: string; url?: string }
          return maybe.image || maybe.url || ''
        })
        setImages(imgs)

        const altsArr: string[] = (p.images || []).map((img) => {
          if (!img || typeof img === 'string') return ''
          return (img as PostImageType).alt_text ?? (img as { alt?: string }).alt ?? ''
        })
        setAltTexts(altsArr)
      })
      .catch((err) => {
        console.error(err)
        toast.error('Failed to load post')
        onOpenChange(false)
      })
      .finally(() => setIsLoading(false))
  }, [open, postId, onOpenChange])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (showEmojiPicker && emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showEmojiPicker])

  const handleEmojiClick = (data: EmojiClickData) => {
    setCaption((c) => c + data.emoji)
    setShowEmojiPicker(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const payload: Record<string, unknown> = {
        caption,
        location,
        hide_likes: hideLikes,
        disable_comments: disableComments,
      }

      if (altTexts.length > 0) {
        const ordered = images.map((_, idx) => altTexts[idx] || '')
        payload.alt_texts = ordered
      }

      const updated = await updatePost(postId, payload)

      window.dispatchEvent(new CustomEvent('postUpdated', { detail: { post: updated } }))

      toast.success('Post updated')
      onOpenChange(false)
    } catch (err) {
      console.error(err)
      toast.error('Failed to update post')
    } finally {
      setIsSaving(false)
    }
  }

  const imagePreview = useMemo(() => images[0] || null, [images])

  return (
    <Dialog 
      open={open} 
      onOpenChange={(next) => {
        if (isSaving) return
        onOpenChange(next)
      }}
    >
      <DialogPortal>
        <DialogOverlay className="bg-black/80 backdrop-blur-sm" />

        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-[1000px] h-[700px] max-h-[90vh] bg-background text-foreground rounded-2xl overflow-hidden shadow-2xl">
          <VisuallyHidden.Root asChild>
            <DialogTitle>Edit post</DialogTitle>
          </VisuallyHidden.Root>

          <VisuallyHidden.Root asChild>
            <DialogPrimitive.Description>Edit post dialog. Edit caption, location, and alt text for images.</DialogPrimitive.Description>
          </VisuallyHidden.Root>
          {/* Header */}
          <div className="relative bg-background text-foreground px-4 h-11 border-b border-border flex items-center justify-between">
            <button
              onClick={() => { if (!isSaving) onOpenChange(false) }}
              className="hover:opacity-70 transition-opacity font-normal"
              aria-label="Close"
            >
              Cancel
            </button>

            <h3 className="text-base font-semibold">Edit info</h3>

            <Button 
              size="sm" 
              variant="ghost" 
              onClick={handleSave} 
              disabled={isSaving || isLoading}
              className="text-blue-500 hover:text-blue-400 hover:bg-transparent font-semibold px-0"
            >
              {isSaving ? 'Saving...' : 'Done'}
            </Button>
          </div>

          {/* Main Content */}
          <div className="flex h-[calc(100%-44px)]">
            {/* Left Side - Image */}
            <div 
              className="flex-1 flex items-center justify-center bg-background relative"
            >
              {isLoading ? (
                <div className="text-sm text-muted-foreground">Loading…</div>
              ) : imagePreview ? (
                <div className="relative w-full h-full">
                  <Image src={imagePreview} alt="" fill className="object-contain" />
                </div>
              ) : (
                <div className="flex items-center justify-center flex-col text-muted-foreground">
                  <ImageIcon className="w-16 h-16 mb-4" />
                  <div>No media</div>
                </div>
              )}
            </div>

            {/* Right Side - Edit Panel */}
            <div className="w-[340px] bg-card flex flex-col">
              {/* User Info */}
              <div className="p-4 flex items-center gap-3 border-b border-border">
                <Avatar className="w-7 h-7">
                  {postUser?.avatar ? (
                    <AvatarImage src={postUser.avatar} alt={postUser.username} />
                  ) : (
                    <AvatarFallback className="bg-card text-foreground text-xs">
                      {postUser?.username?.slice(0,2)?.toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>

                <span className="text-sm font-semibold text-foreground">{postUser?.username}</span>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto">
                {/* Caption Area */}
                <div className="border-b border-border">
                  <div className="relative p-4">
                    <Textarea 
                      placeholder="" 
                      value={caption} 
                      onChange={(e) => setCaption(e.target.value)}
                      className="w-full min-h-[180px] bg-transparent border-0 text-foreground placeholder:text-muted-foreground resize-none p-0 ring-0 focus:ring-0 focus-visible:ring-0 ring-offset-0 focus:ring-offset-0 focus-visible:ring-offset-0 overflow-y-auto"
                    />
                    
                    <div className="flex items-center justify-between mt-2 border-t border-border pt-3">
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        aria-expanded={showEmojiPicker}
                        aria-label="Toggle emoji picker"
                        className="hover:opacity-70 transition-opacity"
                      >
                          <Smile className="w-5 h-5 text-muted-foreground" />
                        </button>

                        <span className="text-xs text-muted-foreground">{caption.length}/2,200</span>
                    </div>

                    {showEmojiPicker && (
                      <div 
                        ref={emojiPickerRef}
                        className="absolute top-12 left-0 z-50 overflow-y-auto max-h-64"
                      >
                        <EmojiPicker
                          theme={isDark ? EmojiTheme.DARK : EmojiTheme.LIGHT}
                          onEmojiClick={handleEmojiClick}
                          width={265}
                          height={160}
                          searchDisabled={true}
                          previewConfig={{ showPreview: false }}
                          categories={[]}
                          style={{ [categoryNavVar]: '0px' } as React.CSSProperties}
                        />

                        <style jsx global>{`
                          .EmojiPickerReact .epr-category-nav {
                            display: none !important;
                            height: 0 !important;
                            padding: 0 !important;
                            margin: 0 !important;
                          }
                        `}</style>
                      </div>
                    )}
                  </div>
                </div>

                {/* Add Location */}
                <div className="border-b border-border px-4 py-3">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      placeholder="Add location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground outline-none"
                    />
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>

                {/* Accessibility Section */}
                <div className="border-b border-border">
                  <div
                    className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-card/30 transition-colors"
                    onClick={() => setShowAccessibility(!showAccessibility)}
                    aria-expanded={showAccessibility}
                  >
                    <span className={`text-base ${showAccessibility ? 'font-semibold' : 'font-normal'} text-foreground`}>Accessibility</span>
                    <ChevronDown 
                      className={`w-5 h-5 text-muted-foreground transition-transform ${showAccessibility ? 'rotate-180' : ''}`} 
                    />
                  </div>

                  {showAccessibility && (
                    <div className="px-4 pb-4 space-y-3">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Alt text describes your photos for people with visual impairments. 
                        Alt text will be automatically created for your photos or you can choose to write your own.
                      </p>

                      {images.map((src, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-card/50 rounded-lg p-2">
                          <div className="w-11 h-11 rounded overflow-hidden relative flex-shrink-0">
                            <Image src={src} alt={`Image ${idx + 1}`} fill className="object-cover" />
                          </div>
                          <input
                            type="text"
                            placeholder="Write alt text..."
                            value={altTexts[idx] || ''}
                            onChange={(e) => setAltTexts(prev => { const next = prev.slice(); next[idx] = e.target.value; return next })}
                            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                          />
                        </div>
                      ))}

                      {images.length === 0 && (
                        <div className="text-xs text-muted-foreground">No images to add alt text for.</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  )
}