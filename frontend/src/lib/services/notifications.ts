import api from '@/lib/api';
import { NotificationType } from '@/types/notification';

export const getNotifications = async (): Promise<NotificationType[]> => {
    const res = await api.get<{ results: NotificationType[] }>('/notifications/');
    return res.data.results;
}