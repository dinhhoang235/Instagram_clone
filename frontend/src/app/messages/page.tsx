"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Sidebar } from "@/components/sidebar"
import { MessageList } from "@/components/message-list"
import { Chat } from "@/components/chat"
import { CreateMessageDialog } from "@/components/create-message-dialog"
import { redirect } from "next/navigation"
import type { MessageListType } from "@/types/chat"
import { markConversationAsRead } from "@/lib/services/messages"

export default function MessagesPage() {
    const { isAuthenticated, user } = useAuth()
    const [activeChat, setActiveChat] = useState<MessageListType | null>(null)
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    
    const currentUserId = user?.id || 0

    // Redirect if not authenticated
    if (!isAuthenticated) {
        redirect("/login")
    }
    
    // Function to save active chat to localStorage
    const saveActiveChat = (chat: MessageListType | null) => {
        if (chat) {
            localStorage.setItem('activeChat', JSON.stringify(chat));
        } else {
            localStorage.removeItem('activeChat');
        }
        setActiveChat(chat);
    };
    
    // Restore active chat from localStorage on initial load
    useEffect(() => {
        try {
            const savedChat = localStorage.getItem('activeChat');
            if (savedChat) {
                const parsedChat = JSON.parse(savedChat);
                console.log("🔄 Restoring active chat from localStorage:", parsedChat.id);
                setActiveChat(parsedChat);
            }
        } catch (error) {
            console.error("Failed to restore active chat:", error);
            localStorage.removeItem('activeChat'); // Clear corrupted data
        }
    }, []);

    // Mark active chat as read on load
    useEffect(() => {
        if (activeChat) {
            console.log(`🔖 Page effect: Marking chat ${activeChat.id} as read after reload/navigation`);
            markConversationAsRead(activeChat.id)
                .then(result => console.log(`✅ Page load: marked chat ${activeChat.id} as read:`, result))
                .catch(error => console.error(`Failed to mark chat ${activeChat.id} as read:`, error))
        }
    }, [activeChat])

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Chat Area */}
            <main className="flex-1 lg:ml-64 flex items-center justify-center p-4">
                <div className="w-full h-[calc(100vh-2rem)] border rounded-lg flex overflow-hidden shadow-sm bg-white dark:bg-muted">
                    {/* Left: List of conversations */}
                    <MessageList onSelectChat={saveActiveChat} activeChat={activeChat} />

                    {/* Right: Chat Window */}
                    {activeChat ? (
                        <>
                            {console.log('🔍 Active chat details:', { 
                                id: activeChat.id, 
                                username: activeChat.username, 
                                partner_id: activeChat.partner_id 
                            })}
                            <Chat
                                chatId={activeChat.id}
                                username={activeChat.username}
                                avatar={activeChat.avatar || "/placeholder-user.jpg"}
                                online={activeChat.online || false}
                                currentUserId={currentUserId}
                                partnerId={activeChat.partner_id || 0}
                            />
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center bg-muted/10">
                            <div className="text-center px-6">
                                <h3 className="text-xl font-semibold mb-2">Your messages</h3>
                                <p className="text-muted-foreground mb-4">Send private messages to a friend or group</p>
                                <button 
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                                    onClick={() => setIsCreateDialogOpen(true)}
                                >
                                    Send message
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
            
            {/* Create Message Dialog */}
            <CreateMessageDialog 
                open={isCreateDialogOpen}
                onClose={() => setIsCreateDialogOpen(false)}
                onSelectUser={setActiveChat}
            />
        </div>
    )
}
