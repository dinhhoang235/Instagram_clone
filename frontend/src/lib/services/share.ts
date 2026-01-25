import type { PostType } from '@/types/post'
import type { MinimalUser } from '@/types/search'

export async function sharePostWithUser({ post, user }: { post: PostType; user: MinimalUser }): Promise<{ threadId: number; message: Record<string, unknown> }> {
  // Try to create a conversation first
  let threadId: number | null = null

  try {
    const { createConversation } = await import('@/lib/services/messages')
    const conv = await createConversation(user.id)
    threadId = conv.thread_id
  } catch (err) {
    // Fallback: legacy API path
    console.warn('createConversation failed, falling back to sendFirstMessage:', err)
    const { sendFirstMessage } = await import('@/lib/services/messages')
    const res = await sendFirstMessage(user.id, `${window.location.origin}/post/${post.id}`)
    threadId = res.thread_id
  }

  if (!threadId) throw new Error('Could not determine thread id')

  const { sharePost } = await import('@/lib/services/chats')
  await sharePost(threadId, String(post.id))

  const message = {
    id: Date.now(),
    shared_post: {
      id: post.id,
      image: post.image || null,
      caption: post.caption || null,
      username: post.user.username,
    },
    time: new Date().toISOString(),
    isOwn: true,
  }

  // Dispatch local event for immediate preview in the chat UI
  window.dispatchEvent(new CustomEvent('sharedPost', { detail: { threadId, message } }))

  return { threadId, message }
}
