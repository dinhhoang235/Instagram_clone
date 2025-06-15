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
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, X, BadgeCheck } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useTheme } from "next-themes"
import { getPostById, likePost } from "@/lib/services/posts"
import { PostType } from "@/types/post"
import { createComment } from "@/lib/services/comments"

export default function PostPage() {
  const { isAuthenticated } = useAuth()
  const params = useParams()
  const router = useRouter()
  const { theme } = useTheme()
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
            <div className="max-w-4xl mx-auto px-4 py-8">
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

  const isDark = theme === "dark"

  return (
    <div className={`fixed inset-0 z-50 ${isDark ? "bg-black" : "bg-white"} overflow-hidden`}>
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        className={`absolute top-4 right-4 z-50 ${isDark ? "text-white hover:bg-white/10" : "text-black hover:bg-black/10"}`}
        onClick={() => router.back()}
      >
        <X className="w-6 h-6" />
      </Button>

      <div className="flex w-full h-full overflow-hidden">
        {/* Post Image */}
        <div
          className={`flex-1 flex items-center justify-center ${isDark ? "bg-black" : "bg-gray-50"} overflow-hidden relative select-none`}
          onDoubleClick={handleDoubleClick}
        >
          <div className="relative max-w-full max-h-full">
            <Image
              src={post.image || "/placeholder.svg"}
              alt="Post image"
              width={800}
              height={800}
              layout="responsive"
              className="object-contain max-h-[100vh] max-w-[calc(100vw-400px)]"
              priority
            />

            {/* Double-tap heart animation */}
            {isAnimating && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Heart
                  className="w-24 h-24 text-white fill-red-500"
                  style={{
                    animation: "heartPop 0.6s ease-out",
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Post Details Sidebar */}
        <div
          className={`w-[400px] ${isDark ? "bg-black border-gray-800" : "bg-white border-gray-200"} border-l flex flex-col h-full overflow-hidden`}
        >
          {/* Post Header */}
          <div
            className={`flex items-center justify-between p-4 ${isDark ? "border-gray-800" : "border-gray-200"} border-b flex-shrink-0`}
          >
            <div className="flex items-center space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={post.user.avatar || "/placeholder.svg"} alt={post.user.username} />
                <AvatarFallback>{post.user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex items-center space-x-1">
                <Link
                  href={`/${post.user.username}`}
                  className={`font-semibold text-sm hover:underline ${isDark ? "text-white" : "text-black"}`}
                >
                  {post.user.username}
                </Link>
                {post.user.isVerified && <BadgeCheck className="w-4 h-4 text-blue-500 fill-current" />}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className={`${isDark ? "text-white hover:bg-white/10" : "text-black hover:bg-black/10"}`}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>

          {/* Post Caption */}
          <div className={`p-4 ${isDark ? "border-gray-800" : "border-gray-200"} border-b flex-shrink-0`}>
            <div className="flex items-start space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={post.user.avatar || "/placeholder.svg"} alt={post.user.username} />
                <AvatarFallback>{post.user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="text-sm">
                  <Link
                    href={`/${post.user.username}`}
                    className={`font-semibold mr-2 ${isDark ? "text-white" : "text-black"}`}
                  >
                    {post.user.username}
                  </Link>
                  <span className={isDark ? "text-white" : "text-black"}>{post.caption}</span>
                </div>
                {post.hashtags && <div className="mt-2 text-sm text-blue-500">{post.hashtags}</div>}
                <p className={`text-xs mt-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>{post.timeAgo}</p>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="flex-1 p-4 overflow-hidden">
            <Comments postId={postId} />
          </div>

          {/* Post Actions */}
          <div className={`${isDark ? "border-gray-800" : "border-gray-200"} border-t p-4 flex-shrink-0`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  className={`p-0 h-auto hover:bg-transparent transition-transform duration-150 ${isAnimating ? "scale-125" : "scale-100"} hover:scale-110`}
                >
                  <Heart
                    className={`w-6 h-6 transition-all duration-200 ${isLiked
                        ? "fill-red-500 text-red-500 scale-110"
                        : isDark
                          ? "text-white hover:text-gray-300"
                          : "text-black hover:text-gray-600"
                      }`}
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 h-auto hover:bg-transparent hover:scale-110 transition-transform"
                  onClick={() => commentInputRef.current?.focus()}
                >
                  <MessageCircle
                    className={`w-6 h-6 transition-colors ${isDark ? "text-white hover:text-gray-300" : "text-black hover:text-gray-600"}`}
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 h-auto hover:bg-transparent hover:scale-110 transition-transform"
                >
                  <Send
                    className={`w-6 h-6 transition-colors ${isDark ? "text-white hover:text-gray-300" : "text-black hover:text-gray-600"}`}
                  />
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSaved(!isSaved)}
                className="p-0 h-auto hover:bg-transparent hover:scale-110 transition-transform"
              >
                <Bookmark
                  className={`w-6 h-6 transition-all duration-200 ${isSaved
                      ? isDark
                        ? "fill-white text-white"
                        : "fill-black text-black"
                      : isDark
                        ? "text-white hover:text-gray-300"
                        : "text-black hover:text-gray-600"
                    }`}
                />
              </Button>
            </div>

            <div className={`font-semibold text-sm mb-2 ${isDark ? "text-white" : "text-black"}`}>
              {likes === 1 ? "1 like" : `${likes.toLocaleString()} likes`}
            </div>

            {/* Add Comment Input */}
            <div
              className={`flex items-center space-x-2 pt-2 ${isDark ? "border-gray-800" : "border-gray-200"} border-t`}
            >
              <Avatar className="w-6 h-6">
                <AvatarImage src="/placeholder-user.jpg" alt="You" />
                <AvatarFallback>YU</AvatarFallback>
              </Avatar>
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
                className={`border-0 bg-transparent p-0 focus-visible:ring-0 text-sm ${isDark ? "text-white placeholder:text-gray-400" : "text-black placeholder:text-gray-500"
                  }`}
              />
              {comment && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-500 font-semibold p-0 h-auto hover:bg-transparent hover:text-blue-600 transition-colors"
                  onClick={handleAddComment}
                >
                  Post
                </Button>
              )}
            </div>
          </div>
        </div>
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
