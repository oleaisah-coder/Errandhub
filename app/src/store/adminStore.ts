import { create } from 'zustand';
import { adminApi } from '@/services/api';
import type { Order, User, Runner } from '@/types';

interface DashboardStats {
  totalOrders: number;
  totalUsers: number;
  totalRunners: number;
  totalRevenue: number;
  pendingOrders: number;
  activeOrders: number;
  completedOrders: number;
  [key: string]: unknown;
}

interface AdminState {
  stats: DashboardStats | null;
  allOrders: Order[];
  allUsers: User[];
  allRunners: Runner[];
  isLoading: boolean;
  fetchDashboardStats: () => Promise<void>;
  fetchAllOrders: () => Promise<void>;
  fetchAllUsers: () => Promise<void>;
  fetchAllRunners: () => Promise<void>;
  assignRunner: (orderId: string, runnerId: string) => Promise<void>;
  updateOrderPrice: (orderId: string, data: { itemFee: number; deliveryFee: number; serviceFee: number }) => Promise<void>;
  toggleUserStatus: (userId: string) => Promise<void>;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  stats: null,
  allOrders: [],
  allUsers: [],
  allRunners: [],
  isLoading: false,

  fetchDashboardStats: async () => {
    set({ isLoading: true });
    try {
      const response = await adminApi.getDashboardStats();
      if (response.data) {
        set({ stats: response.data as DashboardStats, isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  fetchAllOrders: async () => {
    set({ isLoading: true });
    try {
      const response = await adminApi.getOrders();
      if (response.data) {
        set({ allOrders: (response.data as { orders: Order[] }).orders || [], isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  fetchAllUsers: async () => {
    set({ isLoading: true });
    try {
      const response = await adminApi.getUsers();
      if (response.data) {
        set({ allUsers: (response.data as { users: User[] }).users || [], isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  fetchAllRunners: async () => {
    set({ isLoading: true });
    try {
      const response = await adminApi.getRunners();
      if (response.data) {
        set({ allRunners: (response.data as { runners: Runner[] }).runners || [], isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  assignRunner: async (orderId: string, runnerId: string) => {
    try {
      console.log('Assign runner:', orderId, runnerId);
    } catch (error) {
      console.error('Failed to assign runner:', error);
    }
  },

  updateOrderPrice: async (orderId: string, data: { itemFee: number; deliveryFee: number; serviceFee: number }) => {
    try {
      await adminApi.updateOrderPrice(orderId, data);
      await get().fetchAllOrders();
    } catch (error) {
      console.error('Failed to update order price:', error);
    }
  },

  toggleUserStatus: async (userId: string) => {
    try {
      await adminApi.toggleUserStatus(userId);
      await get().fetchAllUsers();
    } catch (error) {
      console.error('Failed to toggle user status:', error);
    }
  },
}));
