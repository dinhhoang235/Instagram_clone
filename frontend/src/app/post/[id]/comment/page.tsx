"use client"

import React, { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Comments } from "@/components/comments"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Smile, ChevronLeft } from "lucide-react"
import dynamic from "next/dynamic"
import type { EmojiClickData } from "emoji-picker-react"
import { Theme as EmojiTheme } from "emoji-picker-react"
const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false })
import useIsDark from "@/lib/hooks/useIsDark"
import { createComment } from "@/lib/services/comments"
import { Sidebar } from "@/components/sidebar"

export default function PostCommentsPage() {
    const params = useParams()
    const router = useRouter()
    const postId = params.id as string

    const [comment, setComment] = useState("")
    const commentInputRef = useRef<HTMLInputElement>(null)
    const [isEmojiOpen, setIsEmojiOpen] = useState(false)
    const emojiPickerRef = useRef<HTMLDivElement | null>(null)
    const isDark = useIsDark()

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
        insertEmojiAtCursor(data?.emoji ?? "")
        setIsEmojiOpen(false)
    }

    const toggleEmojiPicker = () => setIsEmojiOpen(prev => !prev)

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

    return (
        <div className="min-h-screen bg-background">
            <div className="flex">
                <Sidebar />
                <div className="flex flex-col h-screen w-full lg:ml-64 bg-white dark:bg-black">
                    {/* Mobile Header */}
                    <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
                        <Button variant="ghost" size="icon" className="p-0 h-auto hover:bg-transparent" onClick={() => router.back()}>
                            <ChevronLeft className="w-6 h-6" />
                        </Button>
                        <h1 className="text-base font-semibold">Comments</h1>
                        <div className="w-6"></div>
                    </div>

                    {/* Comments List */}
                    <div className="flex-1 p-4 overflow-y-auto">
                        <Comments postId={postId} />
                    </div>

                    {/* Add Comment Input */}
                    <div className="border-t p-4 flex-shrink-0 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0">
                        <div className="flex items-center space-x-2 relative">
                            <Button variant="ghost" size="icon" className="flex-shrink-0 h-9 w-9" onClick={() => toggleEmojiPicker()}>
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
                                className="flex-1 focus-visible:ring-0 focus-visible:ring-offset-0 border-0 bg-transparent p-0 placeholder:text-muted-foreground"
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
                                <div ref={emojiPickerRef} className="absolute bottom-12 left-0 z-50">
                                    <EmojiPicker theme={isDark ? EmojiTheme.DARK : EmojiTheme.LIGHT} onEmojiClick={onEmojiClick} width={325} height={333} searchDisabled={true} previewConfig={{ showPreview: false }} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
