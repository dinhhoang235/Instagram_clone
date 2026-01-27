import React from "react"
import dynamic from "next/dynamic"
import type { EmojiClickData } from "emoji-picker-react"
import { Theme as EmojiTheme } from "emoji-picker-react"
const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false })

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, ChevronLeft, BadgeCheck, Smile } from "lucide-react"
import Image from "next/image"
import type { PostType } from "@/types/post"
import useIsDark from "@/lib/hooks/useIsDark"

type Props = {
  post?: PostType | null
  isLiked: boolean
  isSaved: boolean
  likes: number
  isAnimating: boolean
  comment: string
  isEmojiOpen: boolean
  emojiPickerRef: React.RefObject<HTMLDivElement | null>
  commentInputRef: React.RefObject<HTMLInputElement | null>
  onToggleEmoji: () => void
  onEmojiClick: (data: EmojiClickData) => void
  onLike: () => void
  onSave: () => void
  onOpenComments: () => void
  onShare: () => void
  onBack: () => void
  onAddComment: () => void
  onSetComment: (v: string) => void
}

export default function MobilePostView(props: Props) {
  const {
    post,
    isLiked,
    isSaved,
    likes,
    isAnimating,
    comment,
    isEmojiOpen,
    emojiPickerRef,
    commentInputRef,
    onToggleEmoji,
    onEmojiClick,
    onLike,
    onSave,
    onOpenComments,
    onShare,
    onBack,
    onAddComment,
    onSetComment,
  } = props

  const isDark = useIsDark()

  return (
    <div className="relative flex-1 flex flex-col">
      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-3 bg-gradient-to-b from-background/90 to-transparent">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" className="p-0 h-auto hover:bg-transparent" onClick={onBack}>
            <ChevronLeft className="w-6 h-6 text-foreground" />
          </Button>
          <div className="flex items-center space-x-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src={post?.user?.avatar || "/placeholder.svg"} alt={post?.user?.username} />
              <AvatarFallback>{post?.user?.username?.slice(0, 2)?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex items-center text-foreground text-sm font-semibold">
              <span>{post?.user?.username}</span>
              {post?.user?.isVerified && <BadgeCheck className="w-4 h-4 text-blue-400 ml-2" />}
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="p-0 h-auto hover:bg-transparent">
          <MoreHorizontal className="w-5 h-5 text-foreground" />
        </Button>
      </div>

      {/* Image area */}
      <div className="flex-1 bg-background flex items-center justify-center" onDoubleClick={onLike}>
        <div className="w-full h-full relative">
          <Image src={post?.image || "/placeholder.svg"} alt="Post image" fill className="object-contain" />

          {isAnimating && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Heart className="w-24 h-24 text-red-500 fill-red-500 drop-shadow-lg" style={{ animation: "heartPop 0.6s ease-out" }} />
            </div>
          )}
        </div>
      </div>

      {/* Bottom overlay */}
      <div className="absolute left-0 right-0 bottom-0 z-30 bg-gradient-to-t from-background/90 to-transparent p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={onLike} className="p-0 h-auto hover:bg-transparent">
              <Heart className={`w-6 h-6 ${isLiked ? "fill-red-500 text-red-500" : "text-foreground"}`} />
            </Button>
            <Button variant="ghost" size="sm" onClick={onOpenComments} className="p-0 h-auto hover:bg-transparent">
              <MessageCircle className="w-6 h-6 text-foreground" />
            </Button>
            <Button variant="ghost" size="sm" className="p-0 h-auto hover:scale-110 transition-transform" onClick={onShare}>
              <Send className="w-7 h-7 hover:text-muted-foreground transition-colors" />
            </Button>
          </div>

          <Button variant="ghost" size="sm" onClick={onSave} className="p-0 h-auto hover:bg-transparent">
            <Bookmark className={`w-6 h-6 ${isSaved ? "fill-current text-foreground" : "text-foreground"}`} />
          </Button>
        </div>

        <div className="text-foreground font-semibold text-sm mb-1">{likes === 1 ? "1 like" : `${likes?.toLocaleString()} likes`}</div>

        <div className="text-foreground text-sm mb-2">
          <span className="font-semibold mr-2">{post?.user?.username}</span>
          <span className="line-clamp-2">{post?.caption}</span>
        </div>

        <button className="text-sm text-muted-foreground mb-2" onClick={onOpenComments}>
          View all {post?.comments ?? 0} comments
        </button>

        <div className="text-xs text-muted-foreground mb-2">{post?.timeAgo}</div>

        {/* Comment input (compact) */}
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" className="flex-shrink-0 h-9 w-9" onClick={onToggleEmoji}>
            <Smile className="w-5 h-5 text-foreground" />
          </Button>

          <Input
            ref={commentInputRef}
            placeholder="Add a comment..."
            value={comment}
            onChange={(e) => onSetComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                onAddComment()
              }
            }}
            className="flex-1 border-0 bg-muted text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
          />

          {comment && (
            <Button variant="ghost" size="sm" className="text-blue-400 font-semibold p-0 h-auto hover:bg-transparent" onClick={onAddComment}>
              Post
            </Button>
          )}

          {isEmojiOpen && (
            <div ref={emojiPickerRef} className="absolute bottom-20 left-4 z-50">
              <EmojiPicker theme={isDark ? EmojiTheme.DARK : EmojiTheme.LIGHT} onEmojiClick={onEmojiClick} width={325} height={333} searchDisabled={true} previewConfig={{ showPreview: false }} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
