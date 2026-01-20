import { useState } from "react"
import { MinimalUser } from "@/types/search"
import { sendFirstMessage } from "@/lib/services/messages"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { MessageListType } from "@/types/chat"
import { ArrowLeft } from "lucide-react"

interface Props {
  user: MinimalUser
  onSent: (chat: MessageListType) => void
  onBack?: () => void
}

export function SendFirstMessageView({ user, onSent, onBack }: Props) {
  const [text, setText] = useState("")

  console.log("📝 SendFirstMessageView rendered for user:", user.username);

  const handleSend = async () => {
    if (!text.trim()) {
      console.log("⚠️ Empty message. Not sending.");
      return
    }

    console.log("📤 Sending message to", user.username, "with user ID:", user.id)

    try {
      const res = await sendFirstMessage(user.id, text.trim())
      console.log("✅ Message sent:", res)

      const newChat: MessageListType = {
        id: res.thread_id,
        username: res.partner.username,
        avatar: res.partner.avatar ?? user.avatar,
        lastMessage: `You: ${text.trim()}`,
        time: new Date().toISOString(),
        online: false,
        unread_count: 0,
        partner_id: res.partner.id,
      }

      onSent(newChat)
    } catch (err: unknown) {
      console.error("❌ Failed to send first message:", err)
      
      if (err instanceof Error) {
        console.error("Error message:", err.message)
      }
      
      // Check if it's an Axios error
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosError = err as { response?: { data?: unknown; status?: number } }
        console.error("Error details:", {
          response: axiosError.response?.data,
          status: axiosError.response?.status
        })
      }
      
      // Show user-friendly error message
      alert("Failed to send message. Please try again.")
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-zinc-900">
      {/* Header with user info */}
      <div className="flex items-center gap-3 p-4 border-b">
        {/* Back button for mobile */}
        {onBack && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden -ml-2"
            onClick={onBack}
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
        )}
        <Avatar className="w-10 h-10">
          <AvatarImage src={user.avatar || "/placeholder-user.jpg"} />
        </Avatar>
        <div className="font-semibold">{user.username}</div>
      </div>
      
      {/* Message input area at the bottom */}
      <div className="flex-1 flex flex-col justify-end p-6">
        <div className="space-y-3">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Send your first message..."
            className="text-base"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend()
            }}
          />
          <Button 
            onClick={handleSend} 
            className="w-full" 
            disabled={!text.trim()}
          >
            Send Message
          </Button>
        </div>
      </div>
    </div>
  )
}
