// User Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'user' | 'runner' | 'admin';
  avatar?: string;
  address?: string;
  city?: string;
  state?: string;
  createdAt: string;
}

export interface Address {
  id: string;
  userId: string;
  label: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
}

// Order/Errand Types
export type OrderStatus = 
  | 'pending'
  | 'PENDING_ADMIN_REVIEW'
  | 'DISPATCHED_TO_MARKET'
  | 'runner_assigned'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

export type ErrandType = 
  | 'grocery'
  | 'food'
  | 'package'
  | 'document'
  | 'laundry'
  | 'pharmacy'
  | 'custom';

export interface OrderItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  estimatedPrice: number;
  actualPrice?: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  runnerId?: string;
  status: OrderStatus;
  type: ErrandType;
  items: OrderItem[];
  pickupAddress: Address;
  deliveryAddress: Address;
  itemFee: number;
  deliveryFee: number;
  serviceFee: number;
  totalAmount: number;
  notes?: string;
  scheduledFor?: string;
  isEmergency: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  rating?: number;
  review?: string;
  receiptUrl?: string;
}

// Runner Types
export interface Runner {
  id: string;
  userId: string;
  user: User;
  vehicleType?: string;
  licensePlate?: string;
  isAvailable: boolean;
  currentLocation?: {
    lat: number;
    lng: number;
  };
  rating: number;
  totalDeliveries: number;
  joinedAt: string;
}

// Chat Types
export interface ChatMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderType: 'user' | 'runner' | 'admin';
  message: string;
  createdAt: string;
  isRead: boolean;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'order' | 'chat' | 'system';
  isRead: boolean;
  createdAt: string;
  orderId?: string;
}

// Payment Types
export interface Payment {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  method: 'card' | 'cash' | 'wallet';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: string;
}

// Dashboard Stats
export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  activeRunners: number;
  totalUsers: number;
}

// Testimonial
export interface Testimonial {
  id: string;
  name: string;
  avatar?: string;
  rating: number;
  text: string;
  date: string;
}

// Service
export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
}

// Wallet Transaction Type
export interface Transaction {
  id: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  createdAt: string;
}
