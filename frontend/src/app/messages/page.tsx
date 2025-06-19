"use client"

import { useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Sidebar } from "@/components/sidebar"
import { MessageList } from "@/components/message-list"
import { Chat } from "@/components/chat"
import { redirect } from "next/navigation"
import type { MessageListType } from "@/types/chat"

export default function MessagesPage() {
    const { isAuthenticated } = useAuth()
    const [activeChat, setActiveChat] = useState<MessageListType | null>(null)

    // Redirect if not authenticated
    if (!isAuthenticated) {
        redirect("/login")
    }

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Chat Area */}
            <main className="flex-1 lg:ml-64 flex items-center justify-center p-4">
                <div className="w-full h-[calc(100vh-2rem)] border rounded-lg flex overflow-hidden shadow-sm bg-white dark:bg-muted">
                    {/* Left: List of conversations */}
                    <MessageList onSelectChat={setActiveChat} activeChat={activeChat} />

                    {/* Right: Chat Window */}
                    {activeChat ? (
                        <Chat
                            chatId={activeChat.id}
                            username={activeChat.username}
                            avatar={activeChat.avatar}
                            online={activeChat.online}
                        />
                    ) : (
                        <div className="flex-1 flex items-center justify-center bg-muted/10">
                            <div className="text-center px-6">
                                <h3 className="text-xl font-semibold mb-2">Your messages</h3>
                                <p className="text-muted-foreground mb-4">Send private messages to a friend or group</p>
                                <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition">
                                    Send message
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
