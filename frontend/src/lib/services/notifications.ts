import api from '@/lib/api';
import { NotificationType } from '@/types/notification';

export const getNotifications = async (): Promise<NotificationType[]> => {
    const res = await api.get<{ results: NotificationType[] }>('/notifications/');
    return res.data.results;
}

export const markAllNotificationsAsRead = async () => {
  await api.post("/notifications/mark_all_as_read/")
}

export const markNotificationAsRead = async (id: number) => {
  console.log(`📖 Marking notification ${id} as read via API`)
  const response = await api.post(`/notifications/${id}/mark_as_read/`)
  console.log(`✅ Notification ${id} marked as read:`, response.data)
  return response.data
}

function parseJwtPayload(token: string) {
    try {
        const parts = token.split('.')
        if (parts.length !== 3) return null
        const payload = parts[1]
        const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
        return JSON.parse(decodeURIComponent(escape(decoded)))
    } catch {
        return null
    }
}

async function refreshAccessTokenIfNeeded(): Promise<string> {
    let token = ''
    try {
        token = localStorage.getItem("access_token") || ""
    } catch {
        console.error("Failed to read access token")
    }

    const payload = token ? parseJwtPayload(token) : null

    const now = Math.floor(Date.now() / 1000)
    // If token is missing or about to expire in the next 10s, try to refresh
    if (!payload || !payload.exp || payload.exp <= now + 10) {
        const refresh = localStorage.getItem("refresh_token")
        if (!refresh) {
            throw new Error('No refresh token available')
        }

        try {
            const res = await api.post<{ access: string; refresh?: string }>("/token/refresh/", { refresh })
            const newAccess = res.data.access
            const newRefresh = res.data.refresh
            if (newAccess) {
                localStorage.setItem("access_token", newAccess)
            }
            if (newRefresh) {
                localStorage.setItem("refresh_token", newRefresh)
            }
            return newAccess
        } catch (err) {
            console.error("Failed to refresh access token:", err)
            throw err
        }
    }

    return token
}

export async function connectNotificationSocket(): Promise<WebSocket> {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const host = process.env.NEXT_PUBLIC_WS_HOST || window.location.host

    let token = ''
    try {
        token = await refreshAccessTokenIfNeeded()
    } catch {
        throw new Error('No valid access token')
    }

    if (!token) {
        throw new Error('No access token')
    }

    const encodedToken = encodeURIComponent(token)
    const url = `${protocol}://${host}/ws/notifications/?token=${encodedToken}`

    const socket = new WebSocket(url)

    socket.onopen = () => console.log('🔔 Notification WebSocket connected')
    socket.onerror = (err) => console.error('Notification WebSocket error:', err)
    socket.onclose = (event) => {
        console.log('Notification WebSocket closed:', event.code, event.reason)
    }

    return socket
}
