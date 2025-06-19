"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Edit } from "lucide-react"
import { getConversations } from "@/lib/services/messages"
import type { MessageListType } from "@/types/chat"

interface MessageListProps {
    onSelectChat: (chat: MessageListType) => void
    activeChat: MessageListType | null
}

export function MessageList({ onSelectChat, activeChat }: MessageListProps) {
    const [conversations, setConversations] = useState<MessageListType[]>([])
    const [search, setSearch] = useState("")

    useEffect(() => {
        getConversations()
            .then(setConversations)
            .catch((err) => {
                console.error("Failed to load conversations", err)
            })
    }, [])

    const filtered = conversations.filter((c) =>
        c.username.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="w-full md:w-80 lg:w-96 border-r">
            {/* Header */}
            <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Messages</h2>
                    <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                    </Button>
                </div>
                <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search messages"
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto h-[calc(100vh-10rem)]">
                {filtered.length > 0 ? (
                    filtered.map((convo) => (
                        <div
                            key={convo.id}
                            className={`flex items-center p-4 cursor-pointer hover:bg-muted/50 ${activeChat?.id === convo.id ? "bg-muted" : ""
                                }`}
                            onClick={() => onSelectChat(convo)}
                        >
                            <div className="relative">
                                <Avatar className="w-12 h-12">
                                    <AvatarImage src={convo.avatar || "/placeholder.svg"} alt={convo.username} />
                                    <AvatarFallback>{convo.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                {convo.online && (
                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                                )}
                            </div>

                            <div className="ml-3 flex-1 overflow-hidden">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">{convo.username}</span>
                                    <span className="text-xs text-muted-foreground">{convo.time}</span>
                                </div>
                                <div className="flex items-center">
                                    <p className={`text-sm truncate ${convo.unread ? "font-semibold" : "text-muted-foreground"}`}>
                                        {convo.lastMessage}
                                    </p>
                                    {convo.unread && (
                                        <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full" />
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-4 text-center text-muted-foreground">No conversations found</div>
                )}
            </div>
        </div>
    )
}
