import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Phone, Send, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { useAuthStore, useChatStore, useOrderStore, useRunnerStore } from '@/store';
import { toast } from 'sonner';

const ChatPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { getOrderMessages, sendMessage } = useChatStore();
  const { getOrderById } = useOrderStore();
  const { runners } = useRunnerStore();

  const order = orderId ? getOrderById(orderId) : undefined;
  const runner = order?.runnerId ? runners.find(r => r.id === order.runnerId) : null;

  const messages = orderId ? getOrderMessages(orderId) : [];
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !orderId) return;

    sendMessage(orderId, newMessage);
    setNewMessage('');
  };

  const handleCall = () => {
    if (runner?.user.phone) {
      window.location.href = `tel:${runner.user.phone}`;
    } else {
      toast.info('Phone number not available');
    }
  };

  const chatPartner = user?.role === 'user' 
    ? runner 
    : null; // For runner, would need to get user info

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container-max mx-auto section-padding">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(-1)} 
                className="p-2 text-gray-600 hover:text-[#277310] hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#277310] rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-semibold text-gray-900">
                    {chatPartner?.user.firstName || 'Support'}
                  </h1>
                  <p className="text-xs text-green-600">Online</p>
                </div>
              </div>
            </div>

            <button 
              onClick={handleCall}
              className="p-2 text-[#277310] hover:bg-[#277310]/10 rounded-lg"
            >
              <Phone className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 container-max mx-auto section-padding py-4 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">No messages yet</p>
              <p className="text-sm text-gray-400">Start the conversation!</p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isMe = message.senderId === user?.id;
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                      isMe
                        ? 'bg-[#277310] text-white rounded-br-none'
                        : 'bg-white text-gray-800 rounded-bl-none shadow-sm'
                    }`}
                  >
                    <p>{message.message}</p>
                    <p className={`text-xs mt-1 ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                      {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t">
        <div className="container-max mx-auto section-padding py-4">
          <form onSubmit={handleSend} className="max-w-2xl mx-auto flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 h-12"
            />
            <Button 
              type="submit" 
              className="h-12 px-6 bg-[#277310] hover:bg-[#1e5a10]"
              disabled={!newMessage.trim()}
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
