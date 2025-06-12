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

interface PostProps {
  post: {
    id: number
    user: {
      username: string
      avatar: string
      isVerified: boolean
    }
    image: string
    caption: string
    likes: number
    comments: number
    timeAgo: string
    location?: string
  }
}

export function Post({ post }: PostProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [comment, setComment] = useState("")
  const [showComments, setShowComments] = useState(false)
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
      <div className="relative aspect-square cursor-pointer" onClick={handleImageClick}>
        <Image src={post.image || "/placeholder.svg"} alt="Post image" fill className="object-cover" />
      </div>

      {/* Post Actions */}
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => setIsLiked(!isLiked)} className="p-0 h-auto">
              <Heart className={`w-6 h-6 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
            </Button>
            <Button variant="ghost" size="sm" className="p-0 h-auto" onClick={handleCommentClick}>
              <MessageCircle className="w-6 h-6" />
            </Button>
            <Button variant="ghost" size="sm" className="p-0 h-auto">
              <Send className="w-6 h-6" />
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsSaved(!isSaved)} className="p-0 h-auto">
            <Bookmark className={`w-6 h-6 ${isSaved ? "fill-current" : ""}`} />
          </Button>
        </div>

        {/* Likes */}
        <div className="font-semibold text-sm mb-2">{post.likes.toLocaleString()} likes</div>

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
            {showComments ? "Hide" : "View all"} {post.comments} comments
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
            className="text-blue-500 font-semibold p-0 h-auto"
            onClick={handleCommentInputFocus}
          >
            Post
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
