import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '@/services/api';
import type { User, Address } from '@/types';

interface AddressState {
  addresses: Address[];
  fetchAddresses: () => Promise<void>;
  addAddress: (address: Omit<Address, 'id'>) => Promise<Address>;
  updateAddress: (id: string, data: Partial<Address>) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  getUserAddresses: (userId: string) => Address[];
  getDefaultAddress: (userId: string) => Address | undefined;
}

export const useAddressStore = create<AddressState>()(
  persist(
    (set, get) => ({
      addresses: [],

      fetchAddresses: async () => {
        const response = await authApi.getProfile();
        if (response.data) {
          const userData = (response.data as { user: User }).user;
          if (userData.address) {
            const existingDefault = get().addresses.find(a => a.id === 'default');
            if (!existingDefault) {
              const address: Address = {
                id: 'default',
                userId: userData.id,
                label: 'Home',
                street: userData.address,
                city: userData.city || '',
                state: userData.state || '',
                zipCode: '',
                isDefault: true,
              };
              set((state) => ({ addresses: [address, ...state.addresses] }));
            }
          }
        }
      },

      addAddress: async (address: Omit<Address, 'id'>) => {
        const newAddress: Address = {
          ...address,
          id: Date.now().toString(),
        };
        set((state) => ({
          addresses: [newAddress, ...state.addresses],
        }));
        return newAddress;
      },

      updateAddress: async (id: string, data: Partial<Address>) => {
        set((state) => ({
          addresses: state.addresses.map((addr) =>
            addr.id === id ? { ...addr, ...data } : addr
          ),
        }));
      },

      deleteAddress: async (id: string) => {
        set((state) => ({
          addresses: state.addresses.filter((addr) => addr.id !== id),
        }));
      },

      getUserAddresses: (userId: string) => {
        return get().addresses.filter((addr) => addr.userId === userId);
      },

      getDefaultAddress: (userId: string) => {
        return get().addresses.find((addr) => addr.userId === userId && addr.isDefault);
      },
    }),
    {
      name: 'address-storage',
    }
  )
);
