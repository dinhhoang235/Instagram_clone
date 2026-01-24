"use client"

import { useState, useRef, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Comments } from "@/components/comments"
import { Modal } from "@/components/modal"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, BadgeCheck, ChevronLeft, Smile } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import dynamic from "next/dynamic"
import type { EmojiClickData } from "emoji-picker-react"

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false })

import { getPostById, likePost } from "@/lib/services/posts"
import { PostType } from "@/types/post"
import { createComment } from "@/lib/services/comments"
import { renderCaptionWithTags } from "@/components/tag"

export default function PostModal() {
  const params = useParams()
  const router = useRouter()
  const postId = params.id as string
  const [post, setPost] = useState<PostType | null>(null)

  const [comment, setComment] = useState("")
  const [isLiked, setIsLiked] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [likes, setLikes] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const commentInputRef = useRef<HTMLInputElement>(null)

  // Emoji picker state
  const [isEmojiOpen, setIsEmojiOpen] = useState(false)
  const emojiPickerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleDocClick = (e: MouseEvent) => {
      if (isEmojiOpen && emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node) && !commentInputRef.current?.contains(e.target as Node)) {
        setIsEmojiOpen(false)
      }
    }
    document.addEventListener("click", handleDocClick)
    return () => document.removeEventListener("click", handleDocClick)
  }, [isEmojiOpen])

  const insertEmojiAtCursor = (emoji: string) => {
    const input = commentInputRef.current
    if (!input) {
      setComment(prev => prev + emoji)
      return
    }
    const start = input.selectionStart ?? input.value.length
    const end = input.selectionEnd ?? input.value.length
    const newVal = comment.slice(0, start) + emoji + comment.slice(end)
    setComment(newVal)
    setTimeout(() => {
      input.focus()
      const pos = start + emoji.length
      input.setSelectionRange(pos, pos)
    }, 0)
  }

  const onEmojiClick = (data: EmojiClickData) => {
    insertEmojiAtCursor(data?.emoji ?? data?.unified ?? "")
    setIsEmojiOpen(false)
  }

  const toggleEmojiPicker = () => {
    setIsEmojiOpen(prev => !prev)
  }

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const data = await getPostById(postId)
        setPost(data)
        setLikes(data.likes || 0)
        setIsLiked(data.is_liked || false)
      } catch (err) {
        console.error("Error fetching post", err)
      }
    }

    fetchPost()
  }, [postId])

  const handleAddComment = async () => {
    if (!comment.trim()) return

    try {
      const newComment = await createComment(postId, comment)
      setComment("")

      window.dispatchEvent(
        new CustomEvent("newComment", {
          detail: {
            postId,
            comment: newComment,
          },
        }),
      )
    } catch (error) {
      console.error("Failed to add comment:", error)
    }
  }

  const handleLike = async () => {
    const prevLiked = isLiked
    const prevLikes = likes

    setIsLiked(!prevLiked)
    setLikes(prevLiked ? prevLikes - 1 : prevLikes + 1)

    try {
      await likePost(postId)
    } catch (error) {
      console.error("Failed to toggle like", error)
      setIsLiked(prevLiked)
      setLikes(prevLikes)
    }
  }

  const handleImageDoubleClick = () => {
    if (!isLiked) {
      setIsAnimating(true)
      handleLike()
      setTimeout(() => setIsAnimating(false), 600)
    }
  }

  const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      router.back()
    }
  }

  if (!post) {
    return null
  }

  return (
    <Modal>
      {/* Mobile View - Comments Only */}
      <div className="lg:hidden flex flex-col h-screen w-full fixed inset-0 z-50 bg-white dark:bg-black" onClick={(e) => e.stopPropagation()}>
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="p-0 h-auto hover:bg-transparent"
            onClick={() => router.back()}
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-base font-semibold">Comments</h1>
          <div className="w-6"></div>
        </div>

        {/* Comments Section - Mobile */}
        <div className="flex-1 p-4 overflow-y-auto">
          <Comments postId={postId} />
        </div>

        {/* Add Comment Input - Mobile */}
        <div className="border-t p-4 flex-shrink-0">
          <div className="flex items-center space-x-2 relative">
            <Button 
              variant="ghost" 
              size="icon" 
              className="flex-shrink-0 h-9 w-9"
              onClick={() => toggleEmojiPicker()}
            >
              <Smile className="w-5 h-5" />
            </Button>

            <Input
              ref={commentInputRef}
              placeholder="Add a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleAddComment()
                }
              }}
              className="flex-1"
            />
            {comment && (
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-500 font-semibold p-0 h-auto hover:bg-transparent"
                onClick={handleAddComment}
              >
                Post
              </Button>
            )}

            {isEmojiOpen && (
              <div 
                ref={emojiPickerRef}
                className="absolute bottom-12 left-0 z-50"
              >
                <EmojiPicker onEmojiClick={onEmojiClick} width={325} height={333} searchDisabled={true} previewConfig={{ showPreview: false }} />
              </div>
            )} 
          </div>
        </div>
      </div>

      {/* Desktop View - Modal with Image and Sidebar */}
      <div className="hidden lg:flex max-w-[1400px] w-full h-[90vh] mx-auto px-8 xl:px-16" onClick={handleOutsideClick}>
        <div className="w-full h-full bg-white dark:bg-black rounded-lg shadow-2xl overflow-hidden flex" onClick={(e) => e.stopPropagation()}>
        {/* Image Section */}
        <div className="flex-1 bg-black flex items-center justify-center relative">
          <div
            className="relative w-full h-full flex items-center justify-center cursor-pointer"
            onDoubleClick={handleImageDoubleClick}
          >
            <Image
              src={post.image || "/placeholder.svg"}
              alt="Post"
              width={1200}
              height={1200}
              priority
              className="object-contain max-h-full max-w-full"
            />

            {isAnimating && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Heart className="w-24 h-24 text-white fill-white animate-[heartPop_0.6s_ease-out]" />
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-[400px] bg-white dark:bg-black flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
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
            </div>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
          {/* Comments */}
          <div className="flex-1 overflow-y-auto min-h-0 scrollbar-hide">
            <div className="p-4">
              {/* Post Caption */}
              {post.caption && (
                <div className="flex items-start space-x-3 pb-4 mb-4">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={post.user.avatar || "/placeholder.svg"} alt={post.user.username} />
                    <AvatarFallback>{post.user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="text-sm">
                      <Link href={`/${post.user.username}`} className="font-semibold mr-2">
                        {post.user.username}
                      </Link>
                      <span className="whitespace-pre-wrap break-words">{renderCaptionWithTags(post.caption)}</span>
                    </div>
                    <p className="text-xs mt-2 text-muted-foreground">{post.timeAgo}</p>
                  </div>
                </div>
              )}
              <Comments postId={postId} />
            </div>
          </div>

          {/* Actions */}
          <div className="border-t">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" onClick={handleLike} className="p-0 h-auto hover:bg-transparent">
                  <Heart className={`w-6 h-6 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => commentInputRef.current?.focus()}
                  className="p-0 h-auto hover:bg-transparent"
                >
                  <MessageCircle className="w-6 h-6" />
                </Button>
                <Button variant="ghost" size="sm" className="p-0 h-auto hover:bg-transparent">
                  <Send className="w-6 h-6" />
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSaved(!isSaved)}
                className="p-0 h-auto hover:bg-transparent"
              >
                <Bookmark className={`w-6 h-6 ${isSaved ? "fill-current" : ""}`} />
              </Button>
            </div>

            {likes > 0 && (
              <div className="px-4 pb-2">
                <p className="font-semibold text-sm">{likes.toLocaleString()} likes</p>
              </div>
            )}

            <div className="px-4 pb-2">
              <p className="text-xs text-muted-foreground">{post.timeAgo}</p>
            </div>

            {/* Input */}
            <div className="border-t p-4">
              <div className="flex items-center gap-3 relative">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="flex-shrink-0 h-9 w-9"
                  onClick={() => toggleEmojiPicker()}
                >
                  <Smile className="w-5 h-5" />
                </Button>

                <Input
                  ref={commentInputRef}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleAddComment()
                    }
                  }}
                />
                <Button onClick={handleAddComment} variant="ghost" className="text-blue-500 font-semibold">
                  Post
                </Button>

                {isEmojiOpen && (
                  <div ref={emojiPickerRef} className="absolute bottom-12 left-0 z-50">
                    <EmojiPicker onEmojiClick={onEmojiClick} width={325} height={333} searchDisabled={true} previewConfig={{ showPreview: false }} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      <style jsx global>{`
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
    </Modal>
  )
}
