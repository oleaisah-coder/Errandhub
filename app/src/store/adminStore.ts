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
      console.log('[AdminStore] Fetching all orders...');
      const response = await adminApi.getOrders();
      console.log('[AdminStore] Orders response:', response);
      if (response.data) {
        set({ allOrders: (response.data as { orders: Order[] }).orders || [], isLoading: false });
      }
    } catch (error) {
      console.error('[AdminStore] Failed to fetch orders:', error);
      set({ isLoading: false });
    }
  },

  fetchAllRunners: async () => {
    set({ isLoading: true });
    try {
      console.log('[AdminStore] Fetching all runners...');
      const response = await adminApi.getRunners();
      console.log('[AdminStore] Runners response:', response);
      if (response.data) {
        set({ allRunners: (response.data as { runners: Runner[] }).runners || [], isLoading: false });
      }
    } catch (error) {
      console.error('[AdminStore] Failed to fetch runners:', error);
      set({ isLoading: false });
    }
  },

  fetchAllUsers: async () => {
    set({ isLoading: true });
    try {
      console.log('[AdminStore] Fetching all users...');
      const response = await adminApi.getUsers();
      console.log('[AdminStore] Users response:', response);
      if (response.data) {
        set({ allUsers: (response.data as { users: User[] }).users || [], isLoading: false });
      }
    } catch (error) {
      console.error('[AdminStore] Failed to fetch users:', error);
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
