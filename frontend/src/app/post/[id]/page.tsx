"use client"

import { useState, useRef, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
// import { Comments } from "@/components/comments"
import { useAuth } from "@/components/auth-provider"
import { redirect } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, X, BadgeCheck } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useTheme } from "next-themes"

// Mock post data - in a real app, this would come from an API
const postData = {
  "1": {
    id: 1,
    user: {
      username: "museacg_vn",
      name: "Muse ACG Vietnam",
      avatar: "/placeholder-user.jpg",
      isVerified: true,
    },
    image: "/placeholder.svg?height=600&width=600",
    caption:
      "🎬 BUỔI FAN SCREENING DUY NHẤT của 【DAN DA DAN: TẬP NHẬN】sẽ chính thức diễn ra vào tối 16 ngày 🗓️ Ai sẽ là người may mắn được trải nghiệm sớm những cảnh phim đầu tiên? 🎭 Đây là lần đầu tiên DAN DA DAN đây! Hãy để lại bình luận nói bạn cũng đang đếm ngược từng giây nhé! 🔥",
    hashtags: "#ダンダダン #DANDADAN #TANHĂN #anime #movie",
    likes: 10,
    comments: 89,
    timeAgo: "8 hours ago",
    location: "CGV Sư Vạn Hạnh và CGV Royal City",
  },
  "2": {
    id: 2,
    user: {
      username: "jane_smith",
      name: "Jane Smith",
      avatar: "/placeholder-user.jpg",
      isVerified: true,
    },
    image: "/placeholder.svg?height=600&width=600",
    caption: "Coffee and code ☕️💻 Starting the day right! #coding #coffee #developer",
    hashtags: "#coding #coffee #developer",
    likes: 892,
    comments: 45,
    timeAgo: "4 hours ago",
    location: "San Francisco, CA",
  },
  "3": {
    id: 3,
    user: {
      username: "travel_enthusiast",
      name: "Travel Enthusiast",
      avatar: "/placeholder-user.jpg",
      isVerified: false,
    },
    image: "/placeholder.svg?height=600&width=600",
    caption:
      "Exploring the mountains today! The view is absolutely breathtaking 🏔️ #travel #mountains #adventure #hiking",
    hashtags: "#travel #mountains #adventure #hiking",
    likes: 2156,
    comments: 134,
    timeAgo: "6 hours ago",
    location: "Swiss Alps",
  },
}

export default function PostPage() {
  const { isAuthenticated } = useAuth()
  const params = useParams()
  const router = useRouter()
  const { theme } = useTheme()
  const postId = params.id as string
  const [comment, setComment] = useState("")
  const [isLiked, setIsLiked] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [likes, setLikes] = useState(0)
  const commentInputRef = useRef<HTMLInputElement>(null)

  if (!isAuthenticated) {
    redirect("/login")
  }

  const post = postData[postId as keyof typeof postData]

  useEffect(() => {
    if (post) {
      setLikes(post.likes)
    }
    // Auto-focus comment input when page loads
    const timer = setTimeout(() => {
      commentInputRef.current?.focus()
    }, 100)
    return () => clearTimeout(timer)
  }, [post])

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex">
          <Sidebar />
          <main className="flex-1 lg:ml-64">
            <div className="max-w-4xl mx-auto px-4 py-8">
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">Post not found</h1>
                <p className="text-muted-foreground">The post you're looking for doesn't exist.</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  const handleAddComment = () => {
    if (!comment.trim()) return
    // Add comment logic here
    console.log("Adding comment:", comment)
    setComment("")
    // Trigger comment refresh in Comments component
    window.dispatchEvent(
      new CustomEvent("newComment", {
        detail: {
          postId,
          comment: {
            id: `c${Date.now()}`,
            user: {
              username: "you",
              avatar: "/placeholder-user.jpg",
            },
            text: comment,
            likes: 0,
            timeAgo: "now",
            replies: [],
          },
        },
      }),
    )
  }

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikes((prev) => (isLiked ? prev - 1 : prev + 1))
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
          className={`flex-1 flex items-center justify-center ${isDark ? "bg-black" : "bg-gray-50"} overflow-hidden`}
        >
          <div className="relative max-w-full max-h-full">
            <Image
              src={post.image || "/placeholder.svg"}
              alt="Post image"
              width={800}
              height={800}
              className="object-contain max-h-[100vh] max-w-[calc(100vw-400px)]"
              priority
            />
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
            {/* <Comments postId={postId} /> */}
          </div>

          {/* Post Actions */}
          <div className={`${isDark ? "border-gray-800" : "border-gray-200"} border-t p-4 flex-shrink-0`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" onClick={handleLike} className="p-0 h-auto hover:bg-transparent">
                  <Heart
                    className={`w-6 h-6 ${isLiked ? "fill-red-500 text-red-500" : isDark ? "text-white" : "text-black"}`}
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 h-auto hover:bg-transparent"
                  onClick={() => commentInputRef.current?.focus()}
                >
                  <MessageCircle className={`w-6 h-6 ${isDark ? "text-white" : "text-black"}`} />
                </Button>
                <Button variant="ghost" size="sm" className="p-0 h-auto hover:bg-transparent">
                  <Send className={`w-6 h-6 ${isDark ? "text-white" : "text-black"}`} />
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSaved(!isSaved)}
                className="p-0 h-auto hover:bg-transparent"
              >
                <Bookmark
                  className={`w-6 h-6 ${isSaved ? (isDark ? "fill-white text-white" : "fill-black text-black") : isDark ? "text-white" : "text-black"}`}
                />
              </Button>
            </div>

            <div className={`font-semibold text-sm mb-2 ${isDark ? "text-white" : "text-black"}`}>
              {likes.toLocaleString()} likes
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
                className={`border-0 bg-transparent p-0 focus-visible:ring-0 text-sm ${
                  isDark ? "text-white placeholder:text-gray-400" : "text-black placeholder:text-gray-500"
                }`}
              />
              {comment && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-500 font-semibold p-0 h-auto hover:bg-transparent hover:text-blue-600"
                  onClick={handleAddComment}
                >
                  Post
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
