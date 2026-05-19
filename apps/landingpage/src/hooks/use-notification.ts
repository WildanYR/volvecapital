'use client';

import { useState, useEffect } from 'react';

export type NotificationType = 'pending' | 'success' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  isRead: boolean;
  data?: {
    orderId?: string;
    productName?: string;
    price?: number;
    voucherCode?: string;
    paymentUrl?: string;
    isClaimed?: boolean;
    // Add any other relevant data
    [key: string]: any;
  };
}

const STORAGE_KEY = 'lp_notifications';

export function useNotification() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load from localStorage on mount and sync across tabs/components
  useEffect(() => {
    const loadNotifications = () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          setNotifications(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse notifications', e);
        }
      }
    };

    loadNotifications();

    // Listen for changes from other components/tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        loadNotifications();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Custom event for same-page synchronization
    window.addEventListener('lp_notifications_updated', loadNotifications);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('lp_notifications_updated', loadNotifications);
    };
  }, []);

  // Save to localStorage whenever notifications change
  const saveNotifications = (updated: Notification[]) => {
    setNotifications(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    // Trigger custom event for same-page components
    window.dispatchEvent(new Event('lp_notifications_updated'));
  };

  const getFreshNotifications = (): Notification[] => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse fresh notifications', e);
      }
    }
    return [];
  };

  const addNotification = (notif: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    const current = getFreshNotifications();
    const newNotif: Notification = {
      ...notif,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      isRead: false,
    };
    
    // Check for duplicates (e.g., same orderId pending)
    if (notif.data?.orderId) {
      const exists = current.find(n => n.data?.orderId === notif.data?.orderId && n.type === notif.type);
      if (exists) return; // Don't add duplicate
    }

    const updated = [newNotif, ...current];
    saveNotifications(updated);
  };

  const removeNotification = (id: string) => {
    const current = getFreshNotifications();
    const updated = current.filter(n => n.id !== id);
    saveNotifications(updated);
  };

  const removePendingByOrderId = (orderId: string) => {
    const current = getFreshNotifications();
    const updated = current.filter(n => !(n.type === 'pending' && n.data?.orderId === orderId));
    saveNotifications(updated);
  };

  const markAsRead = (id: string) => {
    const current = getFreshNotifications();
    const updated = current.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    );
    saveNotifications(updated);
  };

  const markAllAsRead = () => {
    const current = getFreshNotifications();
    const updated = current.map(n => ({ ...n, isRead: true }));
    saveNotifications(updated);
  };

  const clearNotifications = () => {
    saveNotifications([]);
  };

  const markVoucherAsClaimed = (voucherCode: string) => {
    const current = getFreshNotifications();
    const updated = current.map(n => 
      (n.type === 'success' && n.data?.voucherCode === voucherCode)
        ? { ...n, data: { ...n.data, isClaimed: true } }
        : n
    );
    saveNotifications(updated);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return {
    notifications,
    addNotification,
    removeNotification,
    removePendingByOrderId,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    markVoucherAsClaimed,
    unreadCount,
  };
}
