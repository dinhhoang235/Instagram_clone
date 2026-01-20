"use client"

import { useState, useRef, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Comments } from "@/components/comments"
import { useAuth } from "@/components/auth-provider"
import { redirect } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, ChevronLeft, BadgeCheck } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { getPostById, likePost } from "@/lib/services/posts"
import { PostType } from "@/types/post"
import { createComment } from "@/lib/services/comments"
import { renderCaptionWithTags } from "@/components/tag"

export default function PostPage() {
  const { isAuthenticated } = useAuth()
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

  if (!isAuthenticated) {
    redirect("/login")
  }

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const data = await getPostById(postId)
        setPost(data)
        setLikes(data.likes || 0)
        setIsLiked(data.is_liked || false)
        console.log("Fetched post:", data)
      } catch (err) {
        console.error("Error fetching post", err)
      }
    }

    fetchPost()
  }, [postId])

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex">
          <Sidebar />
          <main className="flex-1 lg:ml-64">
            <div className="max-w-4xl mx-auto px-4 py-8 pt-16 pb-20 lg:pt-8 lg:pb-8">
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">Post not found</h1>
                <p className="text-muted-foreground">The post youre looking for doesnt exist.</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  const handleAddComment = async () => {
    if (!comment.trim()) return

    try {
      const newComment = await createComment(postId, comment)

      // Reset input
      setComment("")

      // Dispatch event để các component khác (ví dụ: Comments component) lắng nghe và cập nhật UI
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
      // Optionally show toast hoặc alert lỗi
    }
  }

  // like/unlike post function
  const handleLike = async () => {
    // Ghi nhớ giá trị ban đầu
    const previousLiked = isLiked

    // Optimistic UI update
    setIsAnimating(true)
    setIsLiked(!previousLiked)
    setLikes((prev) => (previousLiked ? prev - 1 : prev + 1))

    try {
      await likePost(postId)
    } catch (err) {
      console.error("Failed to toggle like", err)
      // Revert UI state on error
      setIsLiked(previousLiked)
      setLikes((prev) => (previousLiked ? prev + 1 : prev - 1))
    } finally {
      setTimeout(() => setIsAnimating(false), 300)
    }
  }

  const handleDoubleClick = () => {
    if (!isLiked) {
      handleLike()
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar />
        
        {/* Mobile View - Comments Only */}
        <div className="lg:hidden flex flex-col h-screen w-full fixed inset-0 z-50 bg-white dark:bg-black">
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
            <div className="flex items-center space-x-2">
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
            </div>
          </div>
        </div>

        {/* Desktop View - Full Layout */}
        <main className="hidden lg:flex flex-1 justify-center pt-8 pb-8 ml-64">
          <div className="flex max-w-[935px] w-full h-fit border border-gray-200 dark:border-gray-800 rounded-sm overflow-hidden">
            {/* Post Image */}
            <div
              className="flex-[1.5] flex items-center justify-center bg-black overflow-hidden"
              onDoubleClick={handleDoubleClick}
            >
              <div className="relative w-full aspect-square flex items-center justify-center">
                <Image
                  src={post.image || "/placeholder.svg"}
                  alt="Post image"
                  width={600}
                  height={600}
                  className="object-contain w-full h-full"
                  priority
                />

                {/* Double-tap heart animation */}
                {isAnimating && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Heart
                      className="w-24 h-24 text-white fill-white"
                      style={{
                        animation: "heartPop 0.6s ease-out",
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Post Details Sidebar */}
            <div className="w-[335px] bg-white dark:bg-black border-l flex flex-col overflow-hidden max-h-[600px]">
              {/* Post Header */}
              <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
                <div className="flex items-center space-x-3 flex-1">
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
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>

              {/* Comments Section */}
              <div className="flex-1 overflow-y-auto min-h-0">
                <div className="p-4">
                  {/* Post Caption */}
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

                  <Comments postId={postId} />
                </div>
              </div>

              {/* Post Actions */}
              <div className="border-t p-4 flex-shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLike}
                      className="p-0 h-auto hover:bg-transparent"
                    >
                      <Heart
                        className={`w-6 h-6 transition-all ${isLiked ? "fill-red-500 text-red-500" : ""}`}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 h-auto hover:bg-transparent"
                      onClick={() => commentInputRef.current?.focus()}
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

                <div className="font-semibold text-sm mb-2">
                  {likes === 1 ? "1 like" : `${likes.toLocaleString()} likes`}
                </div>

                {/* Add Comment Input */}
                <div className="flex items-center space-x-2 pt-2 border-t">
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
                    className="flex-1 border-0 bg-transparent p-0 focus-visible:ring-0 text-sm"
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
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <style jsx>{`
        @keyframes heartPop {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.8;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
