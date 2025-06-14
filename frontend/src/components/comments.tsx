"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Heart, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { useTheme } from "next-themes"
import { commentType } from "@/types/comment"

interface Comment {
  id: string
  user: {
    username: string
    avatar: string
  }
  text: string
  likes: number
  timeAgo: string
  replies: any[]
}

interface CommentsProps {
  postId: string
}

export function Comments({ postId }: CommentsProps) {
  const { theme } = useTheme()
  const [comments, setComments] = useState<commentType>([])
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set())
  const [likedReplies, setLikedReplies] = useState<Set<string>>(new Set())
  const [showAllReplies, setShowAllReplies] = useState<Set<string>>(new Set())

  const isDark = theme === "dark"

  useEffect(() => {
    const handleNewComment = (event: CustomEvent) => {
      if (event.detail.postId === postId) {
        setComments((prev) => [...prev, event.detail.comment])
      }
    }

    window.addEventListener("newComment", handleNewComment as EventListener)
    return () => window.removeEventListener("newComment", handleNewComment as EventListener)
  }, [postId])

  const handleAddReply = (commentId: string) => {
    if (!replyText.trim()) return

    const reply = {
      id: `r${Date.now()}`,
      user: {
        username: "you",
        avatar: "/placeholder-user.jpg",
      },
      text: replyText,
      likes: 0,
      timeAgo: "now",
    }

    setComments(
      comments.map((comment) =>
        comment.id === commentId ? { ...comment, replies: [...comment.replies, reply] } : comment,
      ),
    )
    setReplyText("")
    setReplyingTo(null)
  }

  const toggleLikeComment = (commentId: string) => {
    const newLikedComments = new Set(likedComments)
    if (likedComments.has(commentId)) {
      newLikedComments.delete(commentId)
    } else {
      newLikedComments.add(commentId)
    }
    setLikedComments(newLikedComments)

    // Update the likes count in the comments
    setComments(
      comments.map((comment) =>
        comment.id === commentId
          ? { ...comment, likes: likedComments.has(commentId) ? comment.likes - 1 : comment.likes + 1 }
          : comment,
      ),
    )
  }

  const toggleLikeReply = (replyId: string, commentId: string) => {
    const newLikedReplies = new Set(likedReplies)
    if (likedReplies.has(replyId)) {
      newLikedReplies.delete(replyId)
    } else {
      newLikedReplies.add(replyId)
    }
    setLikedReplies(newLikedReplies)

    // Update the likes count in the replies
    setComments(
      comments.map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              replies: comment.replies.map((reply: any) =>
                reply.id === replyId
                  ? { ...reply, likes: likedReplies.has(replyId) ? reply.likes - 1 : reply.likes + 1 }
                  : reply,
              ),
            }
          : comment,
      ),
    )
  }

  const toggleShowReplies = (commentId: string) => {
    const newShowAllReplies = new Set(showAllReplies)
    if (showAllReplies.has(commentId)) {
      newShowAllReplies.delete(commentId)
    } else {
      newShowAllReplies.add(commentId)
    }
    setShowAllReplies(newShowAllReplies)
  }

  return (
    <div className="h-full overflow-hidden">
      {/* Comments List */}
      <div className="space-y-4 h-full overflow-hidden">
        {comments.map((comment) => (
          <div key={comment.id} className="space-y-2">
            {/* Main Comment */}
            <div className="flex items-start space-x-3">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage src={comment.user.avatar || "/placeholder.svg"} alt={comment.user.username} />
                <AvatarFallback>{comment.user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className={`text-sm ${isDark ? "text-white" : "text-black"}`}>
                      <Link href={`/${comment.user.username}`} className="font-semibold hover:underline mr-2">
                        {comment.user.username}
                      </Link>
                      {comment.text}
                    </p>
                    <div
                      className={`flex items-center space-x-4 mt-1 text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
                    >
                      <span>{comment.timeAgo}</span>
                      {comment.likes > 0 && <span>{comment.likes === 1 ? "1 like" : `${comment.likes} likes`}</span>}
                      <button
                        onClick={() => setReplyingTo(comment.id)}
                        className={`hover:${isDark ? "text-white" : "text-black"} transition-colors`}
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 h-auto hover:scale-110 transition-transform"
                      onClick={() => toggleLikeComment(comment.id)}
                    >
                      <Heart
                        className={`w-3 h-3 transition-all duration-200 ${
                          likedComments.has(comment.id)
                            ? "fill-red-500 text-red-500"
                            : isDark
                              ? "text-gray-400 hover:text-gray-300"
                              : "text-gray-500 hover:text-gray-600"
                        }`}
                      />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="p-0 h-auto">
                          <MoreHorizontal className={`w-3 h-3 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Report</DropdownMenuItem>
                        <DropdownMenuItem>Block user</DropdownMenuItem>
                        <DropdownMenuItem>Hide comment</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Replies */}
                {comment.replies.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {comment.replies.length > 2 && !showAllReplies.has(comment.id) ? (
                      <>
                        <button
                          onClick={() => toggleShowReplies(comment.id)}
                          className={`text-xs ${isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-black"} flex items-center`}
                        >
                          <div className={`w-6 h-px ${isDark ? "bg-gray-600" : "bg-gray-300"} mr-2`}></div>
                          View {comment.replies.length - 1} more replies
                        </button>
                        {/* Show only the latest reply */}
                        <div className="flex items-start space-x-3 ml-6">
                          <Avatar className="w-6 h-6 flex-shrink-0">
                            <AvatarImage
                              src={comment.replies[comment.replies.length - 1].user.avatar || "/placeholder.svg"}
                              alt={comment.replies[comment.replies.length - 1].user.username}
                            />
                            <AvatarFallback>
                              {comment.replies[comment.replies.length - 1].user.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${isDark ? "text-white" : "text-black"}`}>
                              <Link
                                href={`/${comment.replies[comment.replies.length - 1].user.username}`}
                                className="font-semibold hover:underline mr-2"
                              >
                                {comment.replies[comment.replies.length - 1].user.username}
                              </Link>
                              {comment.replies[comment.replies.length - 1].text}
                            </p>
                            <div
                              className={`flex items-center space-x-4 mt-1 text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
                            >
                              <span>{comment.replies[comment.replies.length - 1].timeAgo}</span>
                              {comment.replies[comment.replies.length - 1].likes > 0 && (
                                <span>
                                  {comment.replies[comment.replies.length - 1].likes === 1
                                    ? "1 like"
                                    : `${comment.replies[comment.replies.length - 1].likes} likes`}
                                </span>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-0 h-auto flex-shrink-0 hover:scale-110 transition-transform"
                            onClick={() => toggleLikeReply(comment.replies[comment.replies.length - 1].id, comment.id)}
                          >
                            <Heart
                              className={`w-3 h-3 transition-all duration-200 ${
                                likedReplies.has(comment.replies[comment.replies.length - 1].id)
                                  ? "fill-red-500 text-red-500"
                                  : isDark
                                    ? "text-gray-400 hover:text-gray-300"
                                    : "text-gray-500 hover:text-gray-600"
                              }`}
                            />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        {comment.replies.length > 2 && (
                          <button
                            onClick={() => toggleShowReplies(comment.id)}
                            className={`text-xs ${isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-black"} flex items-center`}
                          >
                            <div className={`w-6 h-px ${isDark ? "bg-gray-600" : "bg-gray-300"} mr-2`}></div>
                            Hide replies
                          </button>
                        )}
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="flex items-start space-x-3 ml-6">
                            <Avatar className="w-6 h-6 flex-shrink-0">
                              <AvatarImage src={reply.user.avatar || "/placeholder.svg"} alt={reply.user.username} />
                              <AvatarFallback>{reply.user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${isDark ? "text-white" : "text-black"}`}>
                                <Link href={`/${reply.user.username}`} className="font-semibold hover:underline mr-2">
                                  {reply.user.username}
                                </Link>
                                {reply.text}
                              </p>
                              <div
                                className={`flex items-center space-x-4 mt-1 text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
                              >
                                <span>{reply.timeAgo}</span>
                                {reply.likes > 0 && (
                                  <span>{reply.likes === 1 ? "1 like" : `${reply.likes} likes`}</span>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-0 h-auto flex-shrink-0 hover:scale-110 transition-transform"
                              onClick={() => toggleLikeReply(reply.id, comment.id)}
                            >
                              <Heart
                                className={`w-3 h-3 transition-all duration-200 ${
                                  likedReplies.has(reply.id)
                                    ? "fill-red-500 text-red-500"
                                    : isDark
                                      ? "text-gray-400 hover:text-gray-300"
                                      : "text-gray-500 hover:text-gray-600"
                                }`}
                              />
                            </Button>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}

                {/* Reply Input */}
                {replyingTo === comment.id && (
                  <div className="flex items-center space-x-2 mt-2 ml-6">
                    <Avatar className="w-6 h-6 flex-shrink-0">
                      <AvatarImage src="/placeholder-user.jpg" alt="You" />
                      <AvatarFallback>YU</AvatarFallback>
                    </Avatar>
                    <Input
                      placeholder={`Reply to ${comment.user.username}...`}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          handleAddReply(comment.id)
                        }
                        if (e.key === "Escape") {
                          setReplyingTo(null)
                          setReplyText("")
                        }
                      }}
                      className={`text-sm bg-transparent border-0 focus-visible:ring-0 ${
                        isDark ? "text-white placeholder:text-gray-400" : "text-black placeholder:text-gray-500"
                      }`}
                      autoFocus
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAddReply(comment.id)}
                      disabled={!replyText.trim()}
                      className="text-blue-500 font-semibold hover:bg-transparent hover:text-blue-600 flex-shrink-0 transition-colors"
                    >
                      Post
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
