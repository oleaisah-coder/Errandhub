import { create } from 'zustand';
import { notificationApi } from '@/services/api';
import type { Notification } from '@/types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  getUserNotifications: (userId: string) => Notification[];
  getUnreadCount: (userId: string) => number;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  fetchNotifications: async () => {
    try {
      const response = await notificationApi.getNotifications();
      if (response.data) {
        set({ 
          notifications: (response.data as { notifications: Notification[]; unreadCount: number }).notifications || [],
          unreadCount: (response.data as { notifications: Notification[]; unreadCount: number }).unreadCount || 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  },

  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      notifications: [newNotification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  markAsRead: async (notificationId: string) => {
    try {
      await notificationApi.markAsRead(notificationId);
      set((state) => ({
        notifications: state.notifications.map((notif) =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationApi.markAllAsRead();
      set((state) => ({
        notifications: state.notifications.map((notif) => ({ ...notif, isRead: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  },

  getUserNotifications: (userId: string) => {
    return get().notifications.filter((notif) => notif.userId === userId);
  },

  getUnreadCount: (userId: string) => {
    return get().notifications.filter((notif) => notif.userId === userId && !notif.isRead).length;
  },
}));
