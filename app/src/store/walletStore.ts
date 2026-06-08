import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Transaction } from '@/types';
import { paymentApi } from '@/services/api';

export interface WalletState {
  balance: number;
  transactions: Transaction[];
  isLoading: boolean;
  fetchWallet: () => Promise<void>;
  fundAccount: (amount: number, description?: string) => void;
  deductFromBalance: (amount: number, description?: string) => void;
  setBalance: (balance: number) => void;
  getTransactionHistory: () => Transaction[];
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      balance: 0,
      transactions: [],
      isLoading: false,

      fetchWallet: async () => {
        set({ isLoading: true });
        try {
          const response = await paymentApi.getWallet();
          if (response.data) {
            const { balance, transactions } = response.data as any;
            set({
              balance: balance || 0,
              transactions: transactions || [],
              isLoading: false,
            });
          }
        } catch (error) {
          console.error('Failed to fetch wallet:', error);
          set({ isLoading: false });
        }
      },

      fundAccount: (amount: number, description = 'Funded account') => {
        const newTransaction: Transaction = {
          id: Date.now().toString(),
          amount,
          type: 'credit',
          description,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          balance: state.balance + amount,
          transactions: [newTransaction, ...state.transactions],
        }));
      },

      deductFromBalance: (amount: number, description = 'Deducted from balance') => {
        const currentBalance = get().balance;

        if (currentBalance < amount) {
          throw new Error('Insufficient balance');
        }

        const newTransaction: Transaction = {
          id: Date.now().toString(),
          amount,
          type: 'debit',
          description,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          balance: state.balance - amount,
          transactions: [newTransaction, ...state.transactions],
        }));
      },

      setBalance: (balance: number) => {
        set({ balance });
      },

      getTransactionHistory: () => {
        return get().transactions;
      },
    }),
    {
      name: 'wallet-storage',
      partialize: (state) => ({
        balance: state.balance,
        transactions: state.transactions,
      }),
    }
  )
);
