import { create } from "zustand";

export interface Notification {
  id: string;
  title: string;
  description?: string;
  type: "success" | "error" | "info" | "warning";
  createdAt: Date;
  read: boolean;
}

interface NotificationStore {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, "id" | "createdAt" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  unreadCount: () => number;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [
    {
      id: "1",
      title: "Yeni güncelleme yayınlandı!",
      description: "Yüksek veri yoğunluğu tasarımı tamamlandı.",
      type: "success",
      createdAt: new Date(),
      read: false,
    },
    {
      id: "2",
      title: "Düşük Stok Uyarısı",
      description: "SU-MAX modeli için stok adedi 5'in altına düştü.",
      type: "warning",
      createdAt: new Date(Date.now() - 3600000),
      read: false,
    }
  ],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        {
          ...notification,
          id: Math.random().toString(36).substring(2, 9),
          createdAt: new Date(),
          read: false,
        },
        ...state.notifications,
      ],
    })),
  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),
  clearAll: () => set({ notifications: [] }),
  unreadCount: () => get().notifications.filter((n) => !n.read).length,
}));
