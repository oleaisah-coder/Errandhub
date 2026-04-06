import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Transaction } from '@/types';

interface WalletState {
  balance: number;
  transactions: Transaction[];
  fundAccount: (amount: number, description?: string) => void;
  deductFromBalance: (amount: number, description?: string) => void;
  getTransactionHistory: () => Transaction[];
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      balance: 0,
      transactions: [],

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

      getTransactionHistory: () => {
        return get().transactions;
      },
    }),
    {
      name: 'wallet-storage',
    }
  )
);
