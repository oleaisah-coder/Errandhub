import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Order, Address, OrderStatus, ErrandType, OrderItem } from '@/types';
import { orderApi, adminApi } from '@/services/api';
import { useAuthStore } from './authStore';
import { toast } from 'sonner';

export interface CreateOrderData {
  userId: string;
  type: ErrandType;
  items: OrderItem[];
  pickupAddress?: Address;
  deliveryAddress: Address;
  itemFee: number;
  deliveryFee: number;
  serviceFee: number;
  notes?: string;
  scheduledFor?: string;
  isEmergency: boolean;
}

interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  cart: OrderItem[];
  isLoading: boolean;
  createOrder: (data: CreateOrderData) => Promise<Order | null>;
  fetchOrders: () => Promise<void>;
  fetchOrder: (id: string) => Promise<Order | null>;
  updateOrderStatus: (orderId: string, status: OrderStatus, runnerId?: string) => Promise<void>;
  addToCart: (item: OrderItem) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  getUserOrders: (userId: string) => Order[];
  getRunnerOrders: (runnerId: string) => Order[];
  getOrderById: (orderId: string) => Order | undefined;
  rateOrder: (orderId: string, rating: number, review?: string) => Promise<void>;
  clearAllOrders: () => void;
  adminStats: any | null;
  fetchAdminStats: () => Promise<void>;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      currentOrder: null,
      cart: [],
      isLoading: false,
      adminStats: null,

      createOrder: async (data: CreateOrderData) => {
        set({ isLoading: true });
        try {
          const apiData = {
            errandType: data.type,
            items: data.items.map(item => ({
              name: item.name,
              description: item.description,
              quantity: item.quantity,
              estimatedPrice: item.estimatedPrice
            })),
            pickupAddress: data.pickupAddress?.street,
            pickupCity: data.pickupAddress?.city,
            pickupState: data.pickupAddress?.state,
            deliveryAddress: data.deliveryAddress.street,
            deliveryCity: data.deliveryAddress.city,
            deliveryState: data.deliveryAddress.state,
            itemFee: data.itemFee,
            deliveryFee: data.deliveryFee,
            serviceFee: data.serviceFee,
            totalAmount: data.itemFee + data.deliveryFee + data.serviceFee,
            notes: data.notes,
            scheduledFor: data.scheduledFor,
            isEmergency: data.isEmergency
          };

          const response = await orderApi.createOrder(apiData);
          
          if (response.data) {
            const data = response.data as any;
            const newOrder = (data.order || data) as unknown as Order;
            set((state) => ({
              orders: [newOrder, ...state.orders],
              currentOrder: newOrder,
              cart: [],
              isLoading: false,
            }));
            return newOrder;
          }
          
          if (response.error) {
            toast.error(`Order creation failed: ${response.error}`);
          }
          
          set({ isLoading: false });
          return null;
        } catch (error: any) {
          console.error('Failed to create order store error:', error);
          toast.error(error.message || 'Network error while creating order');
          set({ isLoading: false });
          return null;
        }
      },

      fetchOrders: async () => {
        set({ isLoading: true });
        try {
          let user = useAuthStore.getState().user;
          console.log('[OrderStore] Fetching orders, user role:', user?.role, 'user email:', user?.email);
          
          if (!user) {
            console.log('[OrderStore] No user in auth store, waiting...');
            await new Promise(r => setTimeout(r, 500));
            user = useAuthStore.getState().user;
            console.log('[OrderStore] After wait, user:', user?.role, user?.email);
          }
          
          let response;
          
          // Force admin check - use specific email as fallback
          const isAdmin = user?.role === 'admin' || user?.email === 'oleaisah@gmail.com';
          console.log('[OrderStore] Is admin?', isAdmin);
          
          if (isAdmin) {
            response = await adminApi.getOrders();
            console.log('[OrderStore] Admin fetch response:', response);
          } else {
            console.log('[OrderStore] Calling user order API (not admin)');
            response = await orderApi.getOrders();
          }
          
          let response;
          
          if (user?.role === 'admin') {
            response = await adminApi.getOrders();
            console.log('[OrderStore] Admin fetch response:', response);
          } else {
            response = await orderApi.getOrders();
          }
          
          if (response.data) {
            const data = response.data as any;
            console.log('[OrderStore] Orders data:', data);
            set({ 
              orders: (data.orders || data) as unknown as Order[], 
              isLoading: false 
            });
          } else {
            console.log('[OrderStore] No data, error:', response.error);
            set({ isLoading: false });
          }
        } catch (error) {
          console.error('Failed to fetch orders:', error);
          set({ isLoading: false });
        }
      },
      
      fetchAdminStats: async () => {
        try {
          const response = await adminApi.getDashboardStats();
          if (response.data) {
            set({ adminStats: (response.data as any).stats });
          }
        } catch (error) {
          console.error('Failed to fetch admin stats:', error);
        }
      },

      fetchOrder: async (id: string) => {
        set({ isLoading: true });
        try {
          const response = await orderApi.getOrder(id);
          if (response.data) {
            const data = response.data as any;
            const order = (data.order || data) as unknown as Order;
            set({ currentOrder: order, isLoading: false });
            return order;
          }
          set({ isLoading: false });
          return null;
        } catch (error) {
          console.error('Failed to fetch order:', error);
          set({ isLoading: false });
          return null;
        }
      },

      updateOrderStatus: async (orderId: string, status: OrderStatus, runnerId?: string) => {
        try {
          // Optimization: Update local state first for UX (Optimistic UI)
          set((state) => ({
            orders: state.orders.map((order) =>
              order.id === orderId
                ? { 
                    ...order, 
                    status, 
                    runnerId: runnerId || order.runnerId,
                    updatedAt: new Date().toISOString() 
                  }
                : order
            ),
          }));

          // Inform backend
          await orderApi.updateStatus(orderId, status);
        } catch (error) {
          console.error('Failed to update order status:', error);
          toast.error('Failed to update status on server');
        }
      },

  addToCart: (item: OrderItem) => {
    set((state) => ({
      cart: [...state.cart, item],
    }));
  },

  removeFromCart: (itemId: string) => {
    set((state) => ({
      cart: state.cart.filter((item) => item.id !== itemId),
    }));
  },

  clearCart: () => {
    set({ cart: [] });
  },

  getUserOrders: (userId: string) => {
    return get().orders.filter((order) => order.userId === userId);
  },

  getRunnerOrders: (runnerId: string) => {
    return get().orders.filter((order) => order.runnerId === runnerId);
  },

  getOrderById: (orderId: string) => {
    return get().orders.find((order) => order.id === orderId);
  },

    rateOrder: async (orderId: string, rating: number, review?: string) => {
      try {
        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === orderId ? { ...order, rating, review } : order
          ),
        }));
        
        await orderApi.rateOrder(orderId, rating, review);
        toast.success('Thank you for your feedback!');
      } catch (error) {
        console.error('Failed to rate order:', error);
        toast.error('Could not save your rating to the server.');
      }
    },
    
    clearAllOrders: () => {
      set({ orders: [], currentOrder: null });
    },
  }),
  {
    name: 'errandhub-order-sync-v1',
    partialize: (state) => ({ orders: state.orders }),
  }
)
);
