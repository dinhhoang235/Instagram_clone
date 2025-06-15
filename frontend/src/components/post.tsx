"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, MapPin, BadgeCheck } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { PostType } from "@/types/post"
import { likePost } from "@/lib/services/posts"

interface PostProps {
  post: PostType
}

export function Post({ post }: PostProps) {
  const [isLiked, setIsLiked] = useState(post.is_liked)
  const [isSaved, setIsSaved] = useState(false)
  const [comment, setComment] = useState("")
  // const [showComments, setShowComments] = useState(false)
  const [likes, setLikes] = useState(post.likes)
  const [isAnimating, setIsAnimating] = useState(false)
  const commentInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleCommentClick = () => {
    // Navigate to post detail page for better comment experience
    router.push(`/post/${post.id}`)
  }

  const handleCommentInputFocus = () => {
    // Navigate to post detail page when trying to comment
    router.push(`/post/${post.id}`)
  }

  const handleImageClick = () => {
    router.push(`/post/${post.id}`)
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
    if (!isLiked) {
      handleLike()
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
          {post.location && (
            <>
              <span className="text-muted-foreground">•</span>
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span>{post.location}</span>
              </div>
            </>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Report</DropdownMenuItem>
            <DropdownMenuItem>Unfollow</DropdownMenuItem>
            <DropdownMenuItem>Add to favorites</DropdownMenuItem>
            <DropdownMenuItem onClick={handleImageClick}>Go to post</DropdownMenuItem>
            <DropdownMenuItem>Share to...</DropdownMenuItem>
            <DropdownMenuItem>Copy link</DropdownMenuItem>
            <DropdownMenuItem>Embed</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Post Image */}
      <div
        className="relative aspect-square cursor-pointer select-none"
        onClick={handleImageClick}
        onDoubleClick={handleDoubleClick}
      >
        <Image src={post.image || "/placeholder.svg"} alt="Post image" fill className="object-cover" />

        {/* Double-tap heart animation */}
        {isAnimating && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart
              className={`w-20 h-20 text-white fill-red-500 animate-ping ${isAnimating ? "opacity-100" : "opacity-0"}`}
              style={{
                animation: "heartPop 0.3s ease-out",
              }}
            />
          </div>
        )}
      </div>

      {/* Post Actions */}
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`p-0 h-auto transition-transform duration-150 ${isAnimating ? "scale-125" : "scale-100"} hover:scale-110`}
            >
              <Heart
                className={`w-6 h-6 transition-all duration-200 ${isLiked ? "fill-red-500 text-red-500 scale-110" : "hover:text-gray-600 dark:hover:text-gray-300"
                  }`}
              />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-auto hover:scale-110 transition-transform"
              onClick={handleCommentClick}
            >
              <MessageCircle className="w-6 h-6 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" />
            </Button>
            <Button variant="ghost" size="sm" className="p-0 h-auto hover:scale-110 transition-transform">
              <Send className="w-6 h-6 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSaved(!isSaved)}
            className="p-0 h-auto hover:scale-110 transition-transform"
          >
            <Bookmark
              className={`w-6 h-6 transition-all duration-200 ${isSaved ? "fill-current" : "hover:text-gray-600 dark:hover:text-gray-300"
                }`}
            />
          </Button>
        </div>

        {/* Likes */}
        <div className="font-semibold text-sm mb-2">{likes === 1 ? "1 like" : `${likes.toLocaleString()} likes`}</div>

        {/* Caption */}
        <div className="text-sm mb-2">
          <Link href={`/${post.user.username}`} className="font-semibold mr-2">
            {post.user.username}
          </Link>
          <span>{post.caption}</span>
        </div>

        {/* Comments */}
        <div className="text-sm text-muted-foreground mb-2">
          <button onClick={handleCommentClick} className="hover:underline">
            {/* {showComments ? "Hide" : "View all"} {post.comments} comments */}
          </button>
        </div>

        {/* Time */}
        <div className="text-xs text-muted-foreground mb-3">{post.timeAgo}</div>

        {/* Add Comment */}
        <div className="flex items-center space-x-2 pt-2 border-t" onClick={handleCommentInputFocus}>
          <Input
            ref={commentInputRef}
            placeholder="Add a comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="border-0 p-0 focus-visible:ring-0 text-sm cursor-pointer"
            onFocus={handleCommentInputFocus}
            readOnly
          />
          <Button
            variant="ghost"
            size="sm"
            className="text-blue-500 font-semibold p-0 h-auto hover:text-blue-600 transition-colors"
            onClick={handleCommentInputFocus}
          >
            Post
          </Button>
        </div>
      </CardContent>

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
    </Card>
  )
}
