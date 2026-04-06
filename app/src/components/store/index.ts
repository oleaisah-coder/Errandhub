// This file re-exports from the new store location for backward compatibility.
// New code should import from '@/store' directly.
export {
  useAuthStore,
  useOrderStore,
  useAddressStore,
  useChatStore,
  useNotificationStore,
  useRunnerStore,
  useAdminStore,
} from '@/store';

export type { SignupData, CreateOrderData } from '@/store';
