import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { runnerApi, adminApi } from '@/services/api';
import { toast } from 'sonner';
import type { Order, Runner, OrderStatus } from '@/types';

interface RunnerState {
  runners: Runner[];
  availableTasks: Order[];
  myTasks: Order[];
  isLoading: boolean;
  addRunner: (runner: Runner) => void;
  fetchRunners: () => Promise<void>;
  fetchAvailableTasks: () => Promise<void>;
  fetchMyTasks: () => Promise<void>;
  acceptTask: (orderId: string) => Promise<void>;
  updateTaskStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  updateAvailability: (isAvailable: boolean) => Promise<void>;
  getAvailableRunners: () => Runner[];
  getRunnerById: (id: string) => Runner | undefined;
}

export const useRunnerStore = create<RunnerState>()(
  persist(
    (set, get) => ({
      runners: [],
      availableTasks: [],
      myTasks: [],
      isLoading: false,

      addRunner: (runner: Runner) => {
        set((state) => ({
          runners: [...state.runners.filter(r => r.userId !== runner.userId), runner],
        }));
      },

      fetchRunners: async () => {
        set({ isLoading: true });
        try {
          const response = await adminApi.getRunners();
          if (response.data && (response.data as any).runners) {
            set({ runners: (response.data as any).runners, isLoading: false });
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          console.error('Failed to fetch runners:', error);
          set({ isLoading: false });
        }
      },

      fetchAvailableTasks: async () => {
        set({ isLoading: true });
        try {
          const response = await runnerApi.getAvailableTasks();
          if (response.data) {
            set({ availableTasks: (response.data as { tasks: Order[] }).tasks || [], isLoading: false });
          }
        } catch (error) {
          set({ isLoading: false });
        }
      },

      fetchMyTasks: async () => {
        set({ isLoading: true });
        try {
          const response = await runnerApi.getMyTasks();
          if (response.data) {
            set({ myTasks: (response.data as { tasks: Order[] }).tasks || [], isLoading: false });
          }
        } catch (error) {
          set({ isLoading: false });
        }
      },

      acceptTask: async (orderId: string) => {
        try {
          await runnerApi.acceptTask(orderId);
          await get().fetchAvailableTasks();
          await get().fetchMyTasks();
        } catch (error) {
          console.error('Failed to accept task:', error);
        }
      },

      updateTaskStatus: async (orderId: string, status: OrderStatus) => {
        try {
          await runnerApi.updateTaskStatus(orderId, status);
          await get().fetchMyTasks();
        } catch (error) {
          console.error('Failed to update task status:', error);
        }
      },

      updateAvailability: async (isAvailable: boolean) => {
        try {
          const { useAuthStore } = await import('@/store/authStore');
          const user = useAuthStore.getState().user;
          
          if (!user) {
            toast.error('You must be logged in to update availability');
            return;
          }

          // inform backend first
          await runnerApi.updateAvailability(isAvailable);
          
          // then update local state
          set((state) => ({
            runners: state.runners.map((r) =>
              r.userId === user.id ? { ...r, isAvailable } : r
            ),
          }));
          
          toast.success(isAvailable ? 'You are now online' : 'You are now offline');
        } catch (error) {
          console.error('Failed to update availability:', error);
          toast.error('Failed to update status on server');
        }
      },

      getAvailableRunners: () => {
        return get().runners.filter((runner) => runner.isAvailable);
      },

      getRunnerById: (id: string) => {
        return get().runners.find((runner) => runner.id === id);
      },
    }),
    {
      name: 'errandhub-runner-sync-v1',
      partialize: (state) => ({ runners: state.runners }),
    }
  )
);
