"use client"

import { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, MapPin, BadgeCheck, ChevronLeft, ChevronRight } from "lucide-react"
import PostOptionsDialog from "@/components/post-options-dialog"
import EditPostDialog from "@/components/edit-post/EditPostDialog"
import { getMyProfile } from "@/lib/services/profile"
import { useRouter } from "next/navigation"
import { PostType, PostImageType } from "@/types/post"
import { likePost } from "@/lib/services/posts"
import { renderCaptionWithTags } from "@/components/tag"
import ShareDialog from "@/components/share-dialog"
import { sharePostWithUser } from "@/lib/services/share"
import { useToast } from "@/components/ui/use-toast"
import { isMobileClient } from "@/lib/client/isMobileClient"

interface PostProps {
  post: PostType
  priority?: boolean
}

export function Post({ post, priority = false }: PostProps) {
  const [isLiked, setIsLiked] = useState(post.is_liked)
  const [isSaved, setIsSaved] = useState(post.is_saved || false)
  const [likes, setLikes] = useState(post.likes)
  const [comments, setComments] = useState(post.comments)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isOptionsOpen, setIsOptionsOpen] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)

  // compute images array (backwards compatible) - memoized so it doesn't change every render
  const images = useMemo<PostImageType[]>(() => {
    if (post.images && post.images.length > 0) {
      return [...post.images].sort((a, b) => a.order - b.order)
    }
    return [{ id: 'main', image: post.image, order: 0 }]
  }, [post.images, post.image])

  // Local editable copies so UI updates immediately after edit
  const [localCaption, setLocalCaption] = useState(post.caption)
  const [localLocation, setLocalLocation] = useState(post.location)
  const [localImages, setLocalImages] = useState(images)

  useEffect(() => {
    // update local copies when the prop changes (e.g., new post data)
    setLocalCaption(post.caption)
    setLocalLocation(post.location)
    setLocalImages(images)
  }, [post.id, post.caption, post.location, images])

  useEffect(() => {
    const handler = (event: CustomEvent) => {
      const updated: PostType = event.detail.post
      if (String(updated.id) !== String(post.id)) return

      setLocalCaption(updated.caption || '')
      setLocalLocation(updated.location || '')
      if (updated.images && updated.images.length > 0) {
        const imgs = updated.images.sort((a, b) => a.order - b.order)
        setLocalImages(imgs)
      }

      if (typeof updated.likes === 'number') setLikes(updated.likes)
      if (typeof updated.comments === 'number') setComments(updated.comments)
      setIsLiked(Boolean(updated.is_liked))
      setIsSaved(Boolean(updated.is_saved))
    }

    window.addEventListener('postUpdated', handler as EventListener)
    return () => window.removeEventListener('postUpdated', handler as EventListener)
  }, [post.id])

  const MAX_CAPTION_LENGTH = 25
  const shouldTruncate = localCaption && localCaption.length > MAX_CAPTION_LENGTH


  useEffect(() => {
    setCurrentIndex(0)
  }, [post.id])

  // Detect if the post is owned by the current user
  useEffect(() => {
    let mounted = true
    getMyProfile()
      .then((profile) => {
        if (!mounted) return
        setIsOwner(profile.username === post.user.username)
      })
      .catch(() => {})

    return () => {
      mounted = false
    }
  }, [post.user.username])

  // Update comments count when post prop changes
  useEffect(() => {
    setComments(post.comments)
  }, [post.comments])

  // Listen for new comments from modal
  useEffect(() => {
    const handleNewComment = (event: CustomEvent) => {
      if (event.detail.postId === post.id) {
        setComments((prev) => prev + 1)
      }
    }

    window.addEventListener("newComment", handleNewComment as EventListener)
    return () => {
      window.removeEventListener("newComment", handleNewComment as EventListener)
    }
  }, [post.id])

  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
    }
    return count.toString()
  }


  const handleCommentClick = () => {
    // Mobile: open dedicated comments page. Desktop: open post page instead.
    if (isMobileClient()) {
      router.push(`/post/${post.id}/comment`)
    } else {
      router.push(`/post/${post.id}`)
    }
  }

  const handleLike = async () => {
    setIsAnimating(true)

    // Cập nhật UI trước (optimistic update)
    setIsLiked((prev) => !prev)
    setLikes((prev) => (isLiked ? prev - 1 : prev + 1))

    try {
      await likePost(post.id) // Backend tự xử lý toggle like/unlike
    } catch (error) {
      console.error("Failed to toggle like", error)

      // Nếu lỗi thì rollback lại trạng thái UI
      setIsLiked((prev) => !prev)
      setLikes((prev) => (isLiked ? prev + 1 : prev - 1))
    }

    setTimeout(() => setIsAnimating(false), 300)
  }

  const handleDoubleClick = () => {
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 600)
    
    if (!isLiked) {
      handleLike()
    }
  }

  const handleSave = async () => {
    const previous = isSaved

    // optimistic update
    setIsSaved(!previous)

    try {
      // lazy-load to avoid circular import at top-level
      const { savePost } = await import('@/lib/services/posts')
      await savePost(post.id)
    } catch (error) {
      console.error('Failed to toggle save', error)
      // rollback
      setIsSaved(previous)
    }
  }

  return (
    <Card className="max-w-lg mx-auto">
      {/* Post Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={post.user.avatar || "/placeholder.svg"} alt={post.user.username} />
            <AvatarFallback>{post.user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex items-center space-x-1">
            <Link href={`/${post.user.username}`} className="font-semibold text-sm hover:underline">
              {post.user.username}
            </Link>
            {post.user.isVerified && <BadgeCheck className="w-4 h-4 text-blue-500 fill-current" />}
          </div>
          {localLocation && (
            <>
              <span className="text-muted-foreground">•</span>
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span>{localLocation}</span>
              </div>
            </>
          )}
        </div>
          <Button variant="ghost" size="sm" onClick={() => setIsOptionsOpen(true)}>
            <MoreHorizontal className="w-4 h-4" />
          </Button>

          <PostOptionsDialog
            open={isOptionsOpen}
            onOpenChange={(v) => setIsOptionsOpen(v)}
            isOwner={isOwner}
            hideLikes={post.hide_likes}
            disableComments={post.disable_comments}
            onDelete={async () => {
              try {
                const { deletePost } = await import('@/lib/services/posts')
                await deletePost(post.id)
                // notify other parts of the app
                try { window.dispatchEvent(new CustomEvent('postDeleted', { detail: { postId: post.id } })) } catch {}
                toast({ title: 'Deleted' })
              } catch (err) {
                console.error('Failed to delete post', err)
                toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' })
              }
            }}
            onEdit={() => setIsEditOpen(true)}
            onShare={() => setIsShareOpen(true)}
            onCopyLink={async () => {
              try {
                await navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`)
                toast({ title: 'Copied', description: 'Link copied to clipboard' })
              } catch {
                toast({ title: 'Error', description: 'Failed to copy', variant: 'destructive' })
              }
            }}
            onUnfollow={async () => toast({ title: 'Unfollowed' })}
            onReport={async () => toast({ title: 'Reported' })}
            onAddToFavorites={async () => toast({ title: 'Added to favorites' })}
            onGoToPost={() => router.push(`/post/${post.id}`)}
            onAboutThisAccount={() => router.push(`/${post.user.username}`)}
            onToggleLikeCount={async () => {
              try {
                const newVal = !Boolean(post.hide_likes)
                const updated = await (await import('@/lib/services/posts')).updatePost(post.id, { hide_likes: newVal })
                try { window.dispatchEvent(new CustomEvent('postUpdated', { detail: { post: updated } })) } catch {}
                toast({ title: newVal ? 'Hidden like counts' : 'Shown like counts' })
              } catch (err) {
                console.error('Failed to toggle hide_likes', err)
                toast({ title: 'Error', description: 'Failed to update setting', variant: 'destructive' })
              }
            }}
            onTurnOffCommenting={async () => {
              try {
                const newVal = !Boolean(post.disable_comments)
                const updated = await (await import('@/lib/services/posts')).updatePost(post.id, { disable_comments: newVal })
                try { window.dispatchEvent(new CustomEvent('postUpdated', { detail: { post: updated } })) } catch {}
                toast({ title: newVal ? 'Comments turned off' : 'Comments turned on' })
              } catch (err) {
                console.error('Failed to toggle comments', err)
                toast({ title: 'Error', description: 'Failed to update setting', variant: 'destructive' })
              }
            }}
          />

          {/* Edit dialog */}
          <EditPostDialog open={isEditOpen} onOpenChange={(v) => setIsEditOpen(v)} postId={post.id} />
      </div>

      {/* Post Image */}
      <div
        className="relative aspect-square select-none"
        onDoubleClick={handleDoubleClick}
      >
        <Image src={localImages[currentIndex]?.image || images[currentIndex].image || "/placeholder.svg"} alt={localImages[currentIndex]?.alt_text || images[currentIndex].alt_text || 'Post image'} fill priority={priority} className="object-contain object-center bg-background" />

        {/* Double-tap heart animation */}
        {isAnimating && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart className="w-24 h-24 text-red-500 fill-red-500 animate-[heartPop_0.6s_ease-out]" />
          </div>
        )}

        {/* Navigation buttons */}
        {images.length > 1 && (
          <>
            {currentIndex > 0 && (
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-muted/60 hover:bg-muted/80 rounded-full flex items-center justify-center text-foreground transition-colors"
                onClick={() => setCurrentIndex(currentIndex - 1)}
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {currentIndex < images.length - 1 && (
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-muted/60 hover:bg-muted/80 rounded-full flex items-center justify-center text-foreground transition-colors"
                onClick={() => setCurrentIndex(currentIndex + 1)}
                aria-label="Next photo"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}


          </>
        )}
      </div>

      {/* Pagination dots (moved below the image) */}
      {(localImages.length > 1 || images.length > 1) && (
        <div className="flex items-center justify-center gap-1 mt-2 mb-4">
          {(localImages.length > 0 ? localImages : images).map((img, idx) => (
            <button
              key={img.id}
              aria-label={`Go to photo ${idx + 1}`}
              title={`Go to photo ${idx + 1}`}
              aria-current={currentIndex === idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-1.5 h-1.5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${currentIndex === idx ? 'bg-blue-600 shadow-md' : 'bg-gray-300 dark:bg-gray-600'}`}
            />
          ))}
        </div>
      )}

      {/* Post Actions */}
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`p-0 h-auto transition-transform duration-150 ${isAnimating ? "scale-125" : "scale-100"} hover:scale-110 flex items-center gap-2`}
            >
              <Heart
                className={`w-7 h-7 transition-all duration-200 ${isLiked ? "fill-red-500 text-red-500 scale-110" : "hover:text-gray-600 dark:hover:text-gray-300"
                  }`}
              />
              <span className="font-semibold text-sm">{formatCount(likes)}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-auto hover:scale-110 transition-transform flex items-center gap-2"
              onClick={handleCommentClick}
            >
              <MessageCircle className="w-7 h-7 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" />
              <span className="font-semibold text-sm">{formatCount(comments)}</span>
            </Button>
            <Button variant="ghost" size="sm" className="p-0 h-auto hover:scale-110 transition-transform" onClick={() => setIsShareOpen(true)}>
              <Send className="w-7 h-7 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            className="p-0 h-auto hover:scale-110 transition-transform"
          >
            <Bookmark
              className={`w-7 h-7 transition-all duration-200 ${isSaved ? "fill-current" : "hover:text-gray-600 dark:hover:text-gray-300"
                }`}
            />
          </Button>

          {/* Save handler */}
          
        </div>

        {/* Caption + Hashtags gộp */}
        <div className="text-sm mb-2">
          <Link href={`/${post.user.username}`} className="font-semibold mr-2">
            {post.user.username}
          </Link>
          <span className="whitespace-pre-wrap break-words">
            {isExpanded || !shouldTruncate
              ? renderCaptionWithTags(localCaption)
              : <>
                  {renderCaptionWithTags(localCaption.slice(0, MAX_CAPTION_LENGTH))}
                  <span>... </span>
                  <button 
                    onClick={() => setIsExpanded(true)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    more
                  </button>
                </>
            }
          </span>
        </div>

      
      </CardContent>

      {/* Share dialog */}
      <ShareDialog
        open={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        urlToShare={`${window.location.origin}/post/${post.id}`}
        onSelectUser={async (user) => {
          try {
            await sharePostWithUser({ post, user })
            toast({ title: 'Sent', description: `Sent post to ${user.username}` })
          } catch (error: unknown) {
            const errMsg = error instanceof Error ? error.message : String(error)
            console.error('Failed to send post link:', errMsg)
            toast({ title: 'Error', description: errMsg || 'Failed to send message', variant: 'destructive' })
          }
        }}
      />

      <style jsx>{`
        @keyframes heartPop {
          0%,
          100% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.8;
          }
        }
      `}</style>
    </Card >
  )
}
