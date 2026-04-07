import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://errandhub.onrender.com/api';

// Shared promise to prevent concurrent getSession calls from "stealing locks"
let sessionPromise: Promise<any> | null = null;
export const getFreshSession = async () => {
  if (!sessionPromise) {
    sessionPromise = supabase.auth.getSession().finally(() => {
      sessionPromise = null;
    });
  }
  return sessionPromise;
};

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

interface AuthResponse {
  message: string;
  token: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: 'user' | 'runner' | 'admin';
  };
}

// Generic fetch wrapper
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`[API] Calling: ${url}`, { method: options.method || 'GET' });
  
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {})
  };

  // Strictly follow the requested pattern for every protected API call
  const { data: { session } } = await getFreshSession();
  
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  } else if (!endpoint.includes('/auth/')) {
    // If no session for a protected route, check the store as fallback
    const storeToken = useAuthStore.getState().token;
    if (storeToken) {
       headers['Authorization'] = `Bearer ${storeToken}`;
    }
  }

  // Don't set Content-Type for FormData — browser sets it with boundary automatically
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    console.log(`[API] Response from ${url}:`, { status: response.status, ok: response.ok });

    // Handle 401 Unauthorized
    if (response.status === 401 && !endpoint.includes('/auth/') && retryCount === 0) {
      console.warn('API 401 Unauthorized. Attempting session refresh...');
      
      try {
        // Try to get a fresh session (this will attempt refresh if expired)
        const { data: { session: newSession } } = await supabase.auth.getSession();
        
        if (newSession) {
          // Retry once with new session
          return fetchApi(endpoint, options, retryCount + 1);
        } else {
          // Session truly gone, inform but don't hard redirect in all cases
          console.error('Session refresh failed.');
          
          // Only redirect if we ARE NOT in bypass mode
          const isBypass = localStorage.getItem('DEV_BYPASS') === 'true' || window.location.search.includes('bypass=true');
          if (!isBypass && typeof window !== 'undefined') {
            // Instead of hard-redirecting immediately, we let the app handle it 
            // via its own route protection or a toast.
            // window.location.href = '/login'; 
          }
          return { error: 'Session expired. Please log in again.' };
        }
      } catch {
        return { error: 'Session verification failed.' };
      }
    }

    const data = await response.json();

    if (!response.ok) {
      return { error: data.message || data.error || 'An error occurred' };
    }

    return { data };
  } catch (error) {
    console.error('API Error:', error);
    return { error: 'Network error. Please check your connection.' };
  }
}

// Auth API
export const authApi = {
  signup: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    role?: string;
  }) => fetchApi<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  login: (data: { email: string; password: string }) => fetchApi<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  getProfile: () => fetchApi('/auth/profile'),

  updateProfile: (data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
  }) => fetchApi('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    fetchApi('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// Order API
export const orderApi = {
  createOrder: (data: {
    errandType: string;
    items: Array<{
      name: string;
      description?: string;
      quantity: number;
      estimatedPrice: number;
    }>;
    pickupAddress?: string;
    pickupCity?: string;
    pickupState?: string;
    deliveryAddress: string;
    deliveryCity: string;
    deliveryState: string;
    itemFee: number;
    deliveryFee: number;
    serviceFee: number;
    totalAmount: number;
    notes?: string;
    scheduledFor?: string;
    isEmergency?: boolean;
  }) => fetchApi('/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  getOrders: (params?: { status?: string; limit?: number; offset?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    return fetchApi(`/orders?${queryParams.toString()}`);
  },

  getOrder: (id: string) => fetchApi(`/orders/${id}`),

  updateStatus: (id: string, status: string, actualPrices?: Array<{ id: string; actualPrice: number }>) =>
    fetchApi(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, actualPrices }),
    }),

  cancelOrder: (id: string) => fetchApi(`/orders/${id}/cancel`, {
    method: 'PUT',
  }),

  rateOrder: (id: string, rating: number, review?: string) =>
    fetchApi(`/orders/${id}/rate`, {
      method: 'PUT',
      body: JSON.stringify({ rating, review }),
    }),
};

// Admin API
export const adminApi = {
  getDashboardStats: () => fetchApi('/admin/dashboard-stats'),

  getOrders: (params?: { status?: string; search?: string; limit?: number; offset?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    return fetchApi(`/admin/orders?${queryParams.toString()}`);
  },

  getUsers: (params?: { role?: string; search?: string; limit?: number; offset?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.role) queryParams.append('role', params.role);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    return fetchApi(`/admin/users?${queryParams.toString()}`);
  },

  getRunners: (params?: { isAvailable?: boolean; limit?: number; offset?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.isAvailable !== undefined) queryParams.append('isAvailable', params.isAvailable.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    return fetchApi(`/admin/runners?${queryParams.toString()}`);
  },

  updateOrderPrice: (id: string, data: { itemFee: number; deliveryFee: number; serviceFee: number }) =>
    fetchApi(`/admin/orders/${id}/price`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  toggleUserStatus: (id: string) => fetchApi(`/admin/users/${id}/toggle-status`, {
    method: 'PUT',
  }),
};
// Runner API
export const runnerApi = {
  getProfile: () => fetchApi('/runner/profile'),

  updateAvailability: (isAvailable: boolean) => fetchApi('/runner/availability', {
    method: 'PUT',
    body: JSON.stringify({ isAvailable }),
  }),

  getAvailableTasks: () => fetchApi('/runner/available-tasks'),

  getMyTasks: () => fetchApi('/runner/my-tasks'),

  getTaskHistory: () => fetchApi('/runner/task-history'),

  acceptTask: (id: string) => fetchApi(`/runner/tasks/${id}/accept`, {
    method: 'POST',
  }),

  updateTaskStatus: (id: string, status: string, actualPrices?: Array<{ id: string; actualPrice: number }>, location?: { lat: number; lng: number }) =>
    fetchApi(`/runner/tasks/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, actualPrices, location }),
    }),

  uploadReceipt: async (id: string, file: File) => {
    const formData = new FormData();
    formData.append('receipt', file);
    
    return fetchApi(`/runner/tasks/${id}/receipt`, {
      method: 'POST',
      body: formData,
    });
  },
};

// Chat API
export const chatApi = {
  getMessages: (orderId: string) => fetchApi(`/chat/${orderId}`),

  sendMessage: (orderId: string, message: string) => fetchApi(`/chat/${orderId}`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  }),

  getUnreadCount: () => fetchApi('/chat/unread-count'),
};

// Notification API
export const notificationApi = {
  getNotifications: (params?: { unreadOnly?: boolean; limit?: number; offset?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.unreadOnly) queryParams.append('unreadOnly', 'true');
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    return fetchApi(`/notifications?${queryParams.toString()}`);
  },

  markAsRead: (id: string) => fetchApi(`/notifications/${id}/read`, {
    method: 'PUT',
  }),

  markAllAsRead: () => fetchApi('/notifications/mark-all-read', { method: 'PUT' }),

  deleteNotification: (id: string) => fetchApi(`/notifications/${id}`, {
    method: 'DELETE',
  }),
};


export default {
  auth: authApi,
  orders: orderApi,
  admin: adminApi,
  runner: runnerApi,
  chat: chatApi,
  notifications: notificationApi,
};
