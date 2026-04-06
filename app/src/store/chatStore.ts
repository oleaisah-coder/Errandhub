import { create } from 'zustand';
import { chatApi } from '@/services/api';
import type { ChatMessage } from '@/types';

interface ChatState {
  messages: ChatMessage[];
  fetchMessages: (orderId: string) => Promise<void>;
  sendMessage: (orderId: string, message: string) => Promise<void>;
  getOrderMessages: (orderId: string) => ChatMessage[];
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],

  fetchMessages: async (orderId: string) => {
    try {
      const response = await chatApi.getMessages(orderId);
      if (response.data) {
        set({ messages: (response.data as { messages: ChatMessage[] }).messages || [] });
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  },

  sendMessage: async (orderId: string, message: string) => {
    try {
      const response = await chatApi.sendMessage(orderId, message);
      if (response.data) {
        set((state) => ({
          messages: [...state.messages, (response.data as { chatMessage: ChatMessage }).chatMessage],
        }));
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  },

  getOrderMessages: (orderId: string) => {
    return get().messages.filter((msg) => msg.orderId === orderId);
  },
}));
