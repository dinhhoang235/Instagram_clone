"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Heart, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { useTheme } from "next-themes"
import { CommentType } from "@/types/comment"
import { createReply, getCommentsByPostId, likeComment } from "@/lib/services/comments"

interface CommentsProps {
  postId: string
}

export function Comments({ postId }: CommentsProps) {
  const { theme } = useTheme()
  const [comments, setComments] = useState<CommentType[]>([])
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [replyText, setReplyText] = useState("")
  const [showAllReplies, setShowAllReplies] = useState<Set<number>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isFetchingMore, setIsFetchingMore] = useState(false)

  const isDark = theme === "dark"

  useEffect(() => {
    const fetchComments = async () => {
      setIsLoading(true)
      try {
        const data = await getCommentsByPostId(postId, 1)
        setComments(data.results)
        setHasMore(data.next !== null)
        setPage(1)
      } catch (error) {
        console.error("Failed to fetch comments:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchComments()
  }, [postId])

  const handleLoadMore = async () => {
    if (isFetchingMore || !hasMore) return

    setIsFetchingMore(true)
    try {
      const nextPage = page + 1
      const data = await getCommentsByPostId(postId, nextPage)
      setComments((prev) => [...prev, ...data.results])
      setHasMore(data.next !== null)
      setPage(nextPage)
    } catch (error) {
      console.error("Failed to fetch more comments:", error)
    } finally {
      setIsFetchingMore(false)
    }
  }

  useEffect(() => {
    const handleNewComment = (e: CustomEvent) => {
      const { postId: newCommentPostId, comment } = e.detail
      if (newCommentPostId === postId) {
        setComments((prev) => [...prev, comment]) 
      }
    }

    window.addEventListener("newComment", handleNewComment as EventListener)

    return () => {
      window.removeEventListener("newComment", handleNewComment as EventListener)
    }
  }, [postId])

  const handleAddReply = async (commentId: number) => {
    if (!replyText.trim()) return

    try {
      // Gọi API tạo reply
      const newReply = await createReply(commentId, replyText)

      // Cập nhật state với reply mới trả về
      setComments((prevComments: CommentType[]) =>
        prevComments.map((comment) =>
          comment.id === commentId
            ? { ...comment, replies: [...comment.replies, newReply] }
            : comment,
        ),
      )

      // Reset form
      setReplyText("")
      setReplyingTo(null)
    } catch (error) {
      console.error("Failed to add reply:", error)
      // Có thể thêm thông báo lỗi nếu muốn
    }
  }

  const toggleLikeComment = async (commentId: number) => {
    try {
      const { liked, likes } = await likeComment(commentId);

      // 2. Cập nhật lại state comments theo kết quả thật từ backend
      setComments((prevComments) =>
        prevComments.map((comment) =>
          comment.id === commentId
            ? {
              ...comment,
              is_liked: liked,
              likes: likes,
            }
            : comment
        )
      );
    } catch (error) {
      console.error("Failed to toggle comment like:", error);
    }
  };

  const toggleLikeReply = async (replyId: number, commentId: number) => {
    try {
      const { liked, likes } = await likeComment(replyId); // Gọi API like cho reply

      setComments((prevComments) =>
        prevComments.map((comment) =>
          comment.id === commentId
            ? {
              ...comment,
              replies: comment.replies.map((reply) =>
                reply.id === replyId
                  ? {
                    ...reply,
                    is_liked: liked,
                    likes: likes,
                  }
                  : reply
              ),
            }
            : comment
        )
      );
    } catch (error) {
      console.error("Failed to toggle reply like:", error);
    }
  };

  const toggleShowReplies = (commentId: number) => {
    const newShowAllReplies = new Set(showAllReplies)
    if (showAllReplies.has(commentId)) {
      newShowAllReplies.delete(commentId)
    } else {
      newShowAllReplies.add(commentId)
    }
    setShowAllReplies(newShowAllReplies)
  }

  return (
    <div className="h-full">
      {/* Comments List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-20">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gray-500"></div>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          Array.isArray(comments) && comments.map((comment) => (
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
                          className={`w-3 h-3 transition-all duration-200 ${comment.is_liked
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
                                className={`w-3 h-3 transition-all duration-200 ${comment.replies[comment.replies.length - 1].is_liked
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
                                  className={`w-3 h-3 transition-all duration-200 ${reply.is_liked
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
                        className={`text-sm bg-transparent border-0 focus-visible:ring-0 ${isDark ? "text-white placeholder:text-gray-400" : "text-black placeholder:text-gray-500"
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
          ))
        )}
        
        {/* Load More Button */}
        {hasMore && !isLoading && (
          <div className="flex flex-col items-center justify-center py-4">
            <Button
              variant="ghost"
              onClick={handleLoadMore}
              disabled={isFetchingMore}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              {isFetchingMore ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gray-500"></div>
                  <span>Loading...</span>
                </div>
              ) : (
                "Load more comments"
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
