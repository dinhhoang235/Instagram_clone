"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
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
import dynamic from 'next/dynamic'

// Client-only import of Post page so we can render it inline when pathname changes
const PostPageClient = dynamic(() => import('@/app/post/[id]/page'), { ssr: false })


export default function MessagesPage() {
    const { isAuthenticated, user } = useAuth()
    const { conversations } = useConversationStore()
    const [activeChat, setActiveChat] = useState<MessageListType | null>(null)
    const [selectedUser, setSelectedUser] = useState<MinimalUser | null>(null)
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

    const currentUserId = user?.id || 0

    const pathname = usePathname()
    const isMessagesPage = pathname === "/messages"
    const sidebarMarginClass = "lg:ml-20"

    // Redirect if not authenticated
    if (!isAuthenticated) {
        redirect("/login")
    }

    // Function to save active chat to sessionStorage (persists across reloads but not when browser/tab closes)
    const saveActiveChat = (chat: MessageListType | null) => {
        if (chat) {
            try {
                sessionStorage.setItem('activeChat', JSON.stringify(chat));
            } catch (e) {
                console.warn('Failed to save activeChat to sessionStorage', e);
            }
            setSelectedUser(null); // Clear selected user when viewing existing chat
        } else {
            try { sessionStorage.removeItem('activeChat') } catch { }
        }
        setActiveChat(chat);
    };

    // Restore active chat on mount so a page refresh preserves the open chat on desktop and mobile
    useEffect(() => {
        try {
            const raw = sessionStorage.getItem('activeChat')
            if (!raw) {
                console.log('🔄 No saved active chat to restore')
                return
            }

            const parsed = JSON.parse(raw)
            if (parsed && parsed.id) {
                // Try to reconcile with conversation store
                const existing = conversations.find(c => c.id === parsed.id)
                if (existing) {
                    console.log('♻️ Restoring active chat from sessionStorage (synced with store):', existing.id)
                    setActiveChat(existing)
                } else {
                    console.log('♻️ Restoring active chat from sessionStorage (not in store):', parsed.id)
                    setActiveChat(parsed)
                }
            }
        } catch (err) {
            console.error('Failed to restore active chat from sessionStorage:', err)
            try { sessionStorage.removeItem('activeChat') } catch { }
        }
    // Re-run when conversations changes so we can reconcile a restored chat with the latest store
    }, [conversations])

    // Removed - we don't want to validate or keep activeChat from previous sessions
    // User should manually select a conversation each time they visit the page

    // Debug: Track state changes
    useEffect(() => {
        console.log('🧪 State change - selectedUser:', selectedUser?.username, 'activeChat:', activeChat?.id);
    }, [selectedUser, activeChat])

    // Ensure Chat is closed when user navigates away from /messages (fixes mobile SPA navigation)
    useEffect(() => {
        // If pathname is missing or we're still on /messages, do nothing
        if (!pathname || pathname === "/messages") return

        // If navigating to a post page (modal-like route on desktop), keep the active chat so
        // the user can return to it with the back button. This prevents losing the open chat
        // when navigating to /post/[id] and back.
        if (pathname.startsWith('/post/')) {
            console.log('ℹ️ Pathname is a post route, keeping active chat so back restores it:', pathname)
            return
        }

        console.log('🔁 Pathname changed, closing active chat to allow route change:', pathname)
        // Close any open chat or selected user view so the new route can render
        saveActiveChat(null)
        setSelectedUser(null)
    }, [pathname])

    // Keep the activeChat object in sync with the conversation store
    // This ensures realtime updates (presence/unread/lastMessage) reflect in the open Chat
    useEffect(() => {
        if (!activeChat) return
        const updated = conversations.find(c => c.id === activeChat.id)
        if (!updated) return

        // Sync when important fields change
        if (
            updated.online !== activeChat.online ||
            updated.unread_count !== activeChat.unread_count ||
            updated.lastMessage !== activeChat.lastMessage ||
            updated.avatar !== activeChat.avatar ||
            updated.fullName !== activeChat.fullName ||
            updated.last_active !== activeChat.last_active
        ) {
            console.log('🔁 Syncing activeChat with store for chat', activeChat.id)
            setActiveChat(updated)
        }
    }, [conversations, activeChat])

    // If path is a post page, render PostPage inline to support SPA mobile navigation
    if (pathname && pathname.startsWith('/post/')) {
        console.log('🧭 Rendering PostPage inline from MessagesPage for SPA navigation:', pathname)
        return <PostPageClient />
    }

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar - hidden on mobile when chat is active */}
            <div className={`${activeChat || selectedUser ? 'hidden lg:block' : ''}`}>
                <Sidebar />
            </div>

            {/* Main Chat Area */}
            <main className={`flex-1 flex items-center justify-center transition-all duration-200 ease-in-out ${activeChat || selectedUser ? sidebarMarginClass : `${sidebarMarginClass} ${isMessagesPage ? '' : 'lg:p-4'}`}`}>
                <div className={`w-full flex overflow-hidden bg-white dark:bg-zinc-900 ${
                    activeChat || selectedUser
                        ? 'h-screen' // Full screen on mobile when chat is active
                        : `h-screen lg:h-[calc(100vh-2rem)] ${isMessagesPage ? '' : 'lg:border lg:rounded-lg lg:shadow-sm'}`
                }`}>
                    {/* Left: List of conversations - hide on mobile when chat is active */}
                    <div className={`w-full lg:w-auto ${activeChat || selectedUser ? 'hidden lg:flex' : 'flex'}`}>
                        <MessageList 
                            onSelectChat={saveActiveChat} 
                            activeChat={activeChat}
                            currentUsername={user?.username}
                            currentUserFullName={user?.fullName}
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
                                            lastActive={activeChat.last_active || null}
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
