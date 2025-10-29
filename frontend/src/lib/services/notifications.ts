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

export function connectNotificationSocket(): WebSocket {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = process.env.NEXT_PUBLIC_WS_HOST || window.location.host;

    let token = '';
    try {
        token = localStorage.getItem("access_token") || "";
    } catch (error) {
        console.error("Failed to get token:", error);
    }

    const encodedToken = encodeURIComponent(token);
    const url = `${protocol}://${host}/ws/notifications/?token=${encodedToken}`;

    const socket = new WebSocket(url);

    socket.onopen = () => console.log("🔔 Notification WebSocket connected");
    socket.onerror = (err) => console.error("Notification WebSocket error:", err);
    socket.onclose = (event) => {
        console.log("Notification WebSocket closed:", event.code, event.reason);
        if (event.code !== 1000) {
            console.log("Reconnecting notification socket in 3s...");
            setTimeout(() => {
                connectNotificationSocket();
            }, 3000);
        }
    };

    return socket;
}
