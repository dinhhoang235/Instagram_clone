"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Sidebar } from "@/components/sidebar"
import { MessageList } from "@/components/message-list"
import { Chat } from "@/components/chat"
import { CreateMessageDialog } from "@/components/create-message-dialog"
import { redirect } from "next/navigation"
import type { MessageListType } from "@/types/chat"
import type { MinimalUser } from "@/types/search"
import { SendFirstMessageView } from "@/components/send-first-message-view"
import { useConversationStore } from "@/stores/useConversationStore"


export default function MessagesPage() {
    const { isAuthenticated, user } = useAuth()
    const { conversations } = useConversationStore()
    const [activeChat, setActiveChat] = useState<MessageListType | null>(null)
    const [selectedUser, setSelectedUser] = useState<MinimalUser | null>(null)
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
            setSelectedUser(null); // Clear selected user when viewing existing chat
        } else {
            localStorage.removeItem('activeChat');
        }
        setActiveChat(chat);
    };

    // Don't restore active chat automatically - user should select manually
    // This provides a cleaner experience similar to Instagram web
    useEffect(() => {
        // Clear any saved active chat on mount to ensure clean state
        localStorage.removeItem('activeChat');
        console.log("🔄 Cleared active chat - user will select manually");
    }, []);

    // Removed - we don't want to validate or keep activeChat from previous sessions
    // User should manually select a conversation each time they visit the page

    // Debug: Track state changes
    useEffect(() => {
        console.log('🧪 State change - selectedUser:', selectedUser?.username, 'activeChat:', activeChat?.id);
    }, [selectedUser, activeChat])

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar - hidden on mobile when chat is active */}
            <div className={`${activeChat || selectedUser ? 'hidden lg:block' : ''}`}>
                <Sidebar />
            </div>

            {/* Main Chat Area */}
            <main className={`flex-1 flex items-center justify-center ${
                activeChat || selectedUser 
                    ? 'lg:ml-64' // Only add margin on desktop
                    : 'lg:ml-64 lg:p-4' // Add padding when no chat is active
            }`}>
                <div className={`w-full flex overflow-hidden bg-white dark:bg-zinc-900 ${
                    activeChat || selectedUser
                        ? 'h-screen' // Full screen on mobile when chat is active
                        : 'h-screen lg:h-[calc(100vh-2rem)] lg:border lg:rounded-lg lg:shadow-sm'
                }`}>
                    {/* Left: List of conversations - hide on mobile when chat is active */}
                    <div className={`w-full lg:w-auto ${activeChat || selectedUser ? 'hidden lg:flex' : 'flex'}`}>
                        <MessageList 
                            onSelectChat={saveActiveChat} 
                            activeChat={activeChat}
                            currentUsername={user?.username}
                            onSelectUserForNewMessage={(user) => {
                                // Check if conversation already exists
                                const existingConversation = conversations.find(
                                    (convo) => {
                                        if (convo.partner_id && convo.partner_id === user.id) return true
                                        if (convo.username === user.username) return true
                                        return false
                                    }
                                )
                                
                                if (existingConversation) {
                                    // Open existing conversation
                                    console.log('💬 Existing conversation found from message list, opening:', existingConversation.username)
                                    saveActiveChat(existingConversation)
                                } else {
                                    // Show send first message view
                                    console.log('📝 No existing conversation, showing send first message view for:', user.username)
                                    setSelectedUser(user)
                                    setActiveChat(null)
                                }
                            }}
                        />
                    </div>

                    {/* Right: Chat Window */}
                    <div className={`flex-1 ${activeChat || selectedUser ? 'flex' : 'hidden lg:flex'}`}>
                        {(() => {
                            console.log('🎯 Render decision - selectedUser:', !!selectedUser, 'activeChat:', !!activeChat);
                            
                            if (selectedUser) {
                                console.log('📝 Rendering SendFirstMessageView for:', selectedUser.username);
                                return (
                                    <SendFirstMessageView
                                        user={selectedUser}
                                        onSent={(newChat) => {
                                            setActiveChat(newChat)
                                            setSelectedUser(null)
                                        }}
                                        onBack={() => {
                                            setSelectedUser(null);
                                        }}
                                    />
                                );
                            } else if (activeChat) {
                                console.log('💬 Rendering Chat for:', activeChat.username);
                                return (
                                    <>
                                        {console.log('🔍 Active chat details:', {
                                            id: activeChat.id,
                                            username: activeChat.username,
                                            partner_id: activeChat.partner_id
                                        })}
                                        <Chat
                                            chatId={activeChat.id}
                                            username={activeChat.username}
                                            fullName={activeChat.fullName}
                                            avatar={activeChat.avatar || "/placeholder-user.jpg"}
                                            online={activeChat.online || false}
                                            currentUserId={currentUserId}
                                            partnerId={activeChat.partner_id || 0}
                                            onBack={() => {
                                                saveActiveChat(null);
                                            }}
                                        />
                                    </>
                                );
                            } else {
                                console.log('🏠 Rendering empty state');
                                return (
                                    <div className="flex-1 flex items-center justify-center bg-white dark:bg-zinc-900">
                                        <div className="text-center px-6">
                                            {/* Instagram-style message icon */}
                                            <div className="inline-flex items-center justify-center w-24 h-24 mb-4 border-2 border-foreground rounded-full">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    className="w-12 h-12"
                                                >
                                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                                </svg>
                                            </div>
                                            <h3 className="text-xl font-light mb-2">Your messages</h3>
                                            <p className="text-muted-foreground text-sm mb-6">Send a message to start a chat.</p>
                                            <button
                                                className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-6 py-2 rounded-lg transition-colors"
                                                onClick={() => setIsCreateDialogOpen(true)}
                                            >
                                                Send message
                                            </button>
                                        </div>
                                    </div>
                                );
                            }
                        })()}
                    </div>
                </div>
            </main>

            {/* Create Message Dialog */}
            <CreateMessageDialog
                open={isCreateDialogOpen}
                onClose={() => setIsCreateDialogOpen(false)}
                onSelectUser={(user) => {
                    // Check if there's already an existing conversation with this user
                    const existingConversation = conversations.find(
                        (convo) => {
                            // Try matching by partner_id first (more reliable)
                            if (convo.partner_id && convo.partner_id === user.id) return true
                            // Fallback to username comparison
                            if (convo.username === user.username) return true
                            return false
                        }
                    )
                    
                    if (existingConversation) {
                        // If conversation exists, open it directly
                        console.log('💬 Existing conversation found, opening:', existingConversation.username)
                        saveActiveChat(existingConversation)
                        setIsCreateDialogOpen(false)
                    } else {
                        // If no conversation exists, show send first message view
                        console.log('📝 No existing conversation, showing send first message view for:', user.username)
                        setSelectedUser(user)
                        setActiveChat(null)
                    }
                }}
            />
        </div>
    )
}
