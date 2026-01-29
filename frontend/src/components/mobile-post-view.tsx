"use client"

import React from "react"


import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, ChevronLeft, ChevronRight, BadgeCheck } from "lucide-react"
import Image from "next/image"
import { Sidebar } from "@/components/sidebar"
import { toggleFollowUser, getUserProfile } from "@/lib/services/profile"
import { useAuth } from "@/components/auth-provider"
import type { PostType } from "@/types/post"
import useIsDark from "@/lib/hooks/useIsDark"
import PostOptionsDialog from "@/components/post-options-dialog"
import EditPostDialog from "@/components/edit-post/EditPostDialog"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

type Props = {
  post?: PostType | null
  isLiked: boolean
  isSaved: boolean
  likes: number
  isAnimating: boolean
  onLike: () => void
  onSave: () => void
  onOpenComments: () => void
  onShare: () => void
  onBack: () => void
}

export default function MobilePostView(props: Props) {
  const {
    post,
    isLiked,
    isSaved,
    likes,
    isAnimating,
    onLike,
    onSave,
    onOpenComments,
    onShare,
    onBack,
  } = props

  const isDark = useIsDark()
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isOptionsOpen, setIsOptionsOpen] = React.useState(false)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const isOwner = post?.user?.username === user?.username

  // Local save state fallback (in case parent onSave isn't wired)
  const [isSavedState, setIsSavedState] = React.useState<boolean>(isSaved ?? false)
  React.useEffect(() => { setIsSavedState(isSaved ?? false) }, [isSaved])

  const handleSave = async () => {
    if (!post?.id) return
    const previous = isSavedState
    // optimistic update
    setIsSavedState(!previous)

    try {
      // lazy-import to avoid circular deps
      const { savePost } = await import('@/lib/services/posts')
      await savePost(post.id)
      // call parent handler if provided
      if (onSave) onSave()
    } catch (err) {
      console.error('Failed to toggle save', err)
      setIsSavedState(previous)
    }
  }

  // Follow state for post author (supports both API shapes: isFollowing or is_following)
  const [isFollowingState, setIsFollowingState] = React.useState<boolean>(false)
  React.useEffect(() => {
    if (!post?.user) {
      setIsFollowingState(false)
      return
    }

    // Use follow flag if already present on post.user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userAny: any = post.user
    const initial = userAny.isFollowing ?? userAny.is_following
    if (typeof initial !== "undefined") {
      setIsFollowingState(initial ?? false)
      return
    }

    // Fallback: fetch profile to determine follow status
    let mounted = true
    ;(async () => {
      try {
        const profile = await getUserProfile(post.user.username)
        if (mounted) setIsFollowingState(profile.is_following ?? false)
      } catch (err) {
        console.error("Failed to fetch profile for follow state", err)
      }
    })()

    return () => { mounted = false }
  }, [post?.id, post?.user])

  const [isFollowLoading, setIsFollowLoading] = React.useState(false)
  const [isHoveringUnfollow, setIsHoveringUnfollow] = React.useState(false)
  // Caption expand state
  const [isCaptionExpanded, setIsCaptionExpanded] = React.useState(false)

  const handleToggleFollow = async () => {
    if (!post?.user?.username) return
    setIsFollowLoading(true)
    try {
      const res = await toggleFollowUser(post.user.username)
      setIsFollowingState(res.is_following)
    } catch (err) {
      console.error("Failed to toggle follow:", err)
    } finally {
      setIsFollowLoading(false)
      setIsHoveringUnfollow(false)
    }
  }

  // Close expanded caption when viewing a different post
  React.useEffect(() => { setIsCaptionExpanded(false) }, [post?.id])

  function PostImagesCarousel({ post, isAnimating }: { post: PostType; isAnimating: boolean }) {
    const images = post.images && post.images.length > 0 ? [...post.images].sort((a, b) => a.order - b.order) : [{ id: 'main', image: post.image, order: 0, alt_text: post.caption }]
    const [currentIndex, setCurrentIndex] = React.useState(0)

    React.useEffect(() => { setCurrentIndex(0) }, [post?.id])

    return (
      <>
        <Image src={images[currentIndex].image || "/placeholder.svg"} alt={images[currentIndex].alt_text || 'Post image'} fill className="object-contain" />

        {isAnimating && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart className="w-24 h-24 text-red-500 fill-red-500 drop-shadow-lg" style={{ animation: "heartPop 0.6s ease-out" }} />
          </div>
        )}

        {images.length > 1 && (
          <>
            {currentIndex > 0 && (
              <button
                className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/50 dark:bg-white/50 backdrop-blur-sm hover:bg-black/60 dark:hover:bg-white/60 rounded-full flex items-center justify-center text-white dark:text-black transition-all z-10"
                onClick={() => setCurrentIndex(i => i - 1)}
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {currentIndex < images.length - 1 && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/50 dark:bg-white/50 backdrop-blur-sm hover:bg-black/60 dark:hover:bg-white/60 rounded-full flex items-center justify-center text-white dark:text-black transition-all z-10"
                onClick={() => setCurrentIndex(i => i + 1)}
                aria-label="Next photo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`Go to photo ${idx + 1}`}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${currentIndex === idx ? 'bg-black dark:bg-white w-2 h-2' : 'bg-black/60 dark:bg-white/60'}`}
                />
              ))}
            </div>
          </>
        )}
      </>
    )
  }

  return (
    <div className="w-full min-h-screen bg-white dark:bg-black flex flex-col overflow-auto">
      {/* Header Bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white/95 dark:bg-black/95 backdrop-blur-sm border-b border-gray-200/10 dark:border-white/10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="p-0 h-auto hover:bg-transparent z-20" onClick={onBack}>
            <ChevronLeft className="w-8 h-8 text-black dark:text-white" />
          </Button>
        </div>
        <span className="absolute left-1/2 -translate-x-1/2 text-black dark:text-white font-semibold text-lg pointer-events-none">Post</span>
      </div>

      <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 56px)' }}>
      {/* User Info Bar */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-white/95 dark:bg-black/95 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <Avatar className="w-8 h-8 ring-2 ring-gray-200/10 dark:ring-white/10">
            <AvatarImage src={post?.user?.avatar || "/placeholder.svg"} alt={post?.user?.username} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs">
              {post?.user?.username?.slice(0, 2)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-1.5">
            <span className="text-black dark:text-white text-sm font-semibold">{post?.user?.username}</span>
            {post?.user?.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-blue-400 fill-blue-400" />}
          </div>
          <span className="text-black/40 dark:text-white/40 text-xs">•</span>
          {/* Hide follow button on own post */}
          {post?.user?.username !== user?.username && (
            <button
              type="button"
              onClick={handleToggleFollow}
              disabled={isFollowLoading}
              onMouseEnter={() => isFollowingState && setIsHoveringUnfollow(true)}
              onMouseLeave={() => isFollowingState && setIsHoveringUnfollow(false)}
              className={`ml-2 text-sm font-semibold focus:outline-none transition-colors ${isFollowingState ? `px-3 py-1.5 rounded-md border-2 shadow-sm flex items-center justify-center bg-white text-black border-black dark:bg-black dark:text-white dark:border-white ${isHoveringUnfollow ? 'border-red-500 text-red-600 dark:border-red-500 dark:text-red-500' : ''}` : "text-blue-400 hover:text-blue-300"}`}
              aria-pressed={isFollowingState}
            >
              {isFollowLoading ? "..." : (isFollowingState ? (isHoveringUnfollow ? "Unfollow" : "Following") : "Follow")}
            </button>
          )}
        </div>
        <Button variant="ghost" size="icon" className="p-0 w-auto h-auto hover:bg-transparent" onClick={() => setIsOptionsOpen(true)}>
          <MoreHorizontal className="w-6 h-6 text-black dark:text-white" />
        </Button>

        <PostOptionsDialog
          open={isOptionsOpen}
          onOpenChange={(v) => setIsOptionsOpen(v)}
          isOwner={!!isOwner}
          hideLikes={post?.hide_likes}
          disableComments={post?.disable_comments}
          onDelete={async () => {
            try {
              const { deletePost } = await import('@/lib/services/posts')
              await deletePost(post?.id as string)
              try { window.dispatchEvent(new CustomEvent('postDeleted', { detail: { postId: post?.id } })) } catch {}
              toast({ title: 'Deleted' })
            } catch (err) {
              console.error('Failed to delete post', err)
              toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' })
            }
          }}
          onReport={() => toast({ title: 'Reported' })}
          onUnfollow={() => toast({ title: 'Unfollowed' })}
          onAddToFavorites={() => toast({ title: 'Added to favorites' })}
          onShare={() => onShare()}
          onEdit={() => setIsEditOpen(true)}
          onCopyLink={async () => {
            try {
              await navigator.clipboard.writeText(`${window.location.origin}/post/${post?.id}`)
              toast({ title: 'Copied', description: 'Link copied to clipboard' })
            } catch {
              toast({ title: 'Error', description: 'Failed to copy', variant: 'destructive' })
            }
          }}
          onGoToPost={() => router.push(`/post/${post?.id}`)}
          onAboutThisAccount={() => router.push(`/${post?.user?.username}`)}
          onToggleLikeCount={async () => {
            try {
              const newVal = !Boolean(post?.hide_likes)
              const updated = await (await import('@/lib/services/posts')).updatePost(post?.id as string, { hide_likes: newVal })
              try { window.dispatchEvent(new CustomEvent('postUpdated', { detail: { post: updated } })) } catch {}
              toast({ title: newVal ? 'Hidden like counts' : 'Shown like counts' })
            } catch (err) {
              console.error('Failed to toggle hide_likes', err)
              toast({ title: 'Error', description: 'Failed to update setting', variant: 'destructive' })
            }
          }}
          onTurnOffCommenting={async () => {
            try {
              const newVal = !Boolean(post?.disable_comments)
              const updated = await (await import('@/lib/services/posts')).updatePost(post?.id as string, { disable_comments: newVal })
              try { window.dispatchEvent(new CustomEvent('postUpdated', { detail: { post: updated } })) } catch {}
              toast({ title: newVal ? 'Comments turned off' : 'Comments turned on' })
            } catch (err) {
              console.error('Failed to toggle comments', err)
              toast({ title: 'Error', description: 'Failed to update setting', variant: 'destructive' })
            }
          }}
        />

        <EditPostDialog open={isEditOpen} onOpenChange={(v) => setIsEditOpen(v)} postId={post?.id ?? ''} />
      </div>

      {/* Image Container */}
      <div className="bg-white dark:bg-black relative overflow-hidden" onDoubleClick={onLike}>
        <div className="w-full relative aspect-[4/5]">
          {post && <PostImagesCarousel post={post} isAnimating={isAnimating} />}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-3 py-2 bg-white/95 dark:bg-black/95 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onLike} className="p-0 h-auto hover:bg-transparent active:scale-90 transition-transform">
                <Heart className={`w-[26px] h-[26px] ${isLiked ? "fill-red-500 text-red-500" : "text-black dark:text-white"} transition-colors`} />
              </Button>
              <span className="text-sm font-medium text-black dark:text-white">{likes?.toLocaleString()}</span>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onOpenComments} className="p-0 h-auto hover:bg-transparent active:scale-90 transition-transform">
                <MessageCircle className="w-[26px] h-[26px] text-black dark:text-white" />
              </Button>
              <span className="text-sm font-medium text-black/70 dark:text-white/70">{post?.comments ?? 0}</span>
            </div>

            <Button variant="ghost" size="sm" onClick={onShare} className="p-0 h-auto hover:bg-transparent active:scale-90 transition-transform">
              <Send className="w-[26px] h-[26px] text-black dark:text-white" />
            </Button>
          </div>

          <Button variant="ghost" size="sm" onClick={handleSave} className="relative z-40 p-0 h-auto hover:bg-transparent active:scale-90 transition-transform">
            <Bookmark className={`w-[26px] h-[26px] ${isSavedState ? (isDark ? "fill-white text-white" : "fill-black text-black") : "text-black dark:text-white"} transition-colors`} />
          </Button>
        </div>

        {/* Likes */}
        <div className="text-black dark:text-white font-semibold text-sm mb-1.5">
          {likes === 1 ? "1 like" : `${likes?.toLocaleString()} likes`}
        </div>

        {/* Caption */}
        <div className="text-black dark:text-white text-sm mb-1">
          <span className="font-semibold mr-1.5">{post?.user?.username}</span>

          <div className={`text-left ${isCaptionExpanded ? 'overflow-visible max-h-none' : 'line-clamp-2'} mr-2`}>{post?.caption}</div>

          {post?.caption && post.caption.length > 100 && !isCaptionExpanded && (
            <button
              type="button"
              onClick={() => setIsCaptionExpanded(true)}
              className="text-black/60 dark:text-white/60 ml-1"
            >
              ... more
            </button>
          )}
        </div>

        {/* Comments Link */}
        <button className="text-sm text-black/60 dark:text-white/60 mb-1.5 hover:text-black/80 dark:hover:text-white/80 transition-colors" onClick={onOpenComments}>
          View all {post?.comments ?? 0} comments
        </button>

        {/* Time */}
        <div className="text-xs text-black/50 dark:text-white/50 mb-2.5">{post?.timeAgo}</div>

        {/* Mobile bottom nav replaces comment input */}
        <div className="h-16 lg:hidden" />

      </div>
      </div>
      
      <Sidebar />
    </div>
  )
} 