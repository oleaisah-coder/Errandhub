import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, Search, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore, useOrderStore } from '@/store';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  PENDING_ADMIN_REVIEW: 'bg-amber-100 text-amber-800',
  DISPATCHED_TO_MARKET: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-blue-100 text-blue-800',
  runner_assigned: 'bg-purple-100 text-purple-800',
  picked_up: 'bg-indigo-100 text-indigo-800',
  in_transit: 'bg-orange-100 text-orange-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  PENDING_ADMIN_REVIEW: 'Awaiting Review',
  DISPATCHED_TO_MARKET: 'Finding Runner',
  confirmed: 'Confirmed',
  runner_assigned: 'Runner Assigned',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const OrderHistoryPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { getUserOrders } = useOrderStore();

  const orders = user ? getUserOrders(user.id) : [];
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase());
    if (filter === 'active') {
      return matchesSearch && order.status !== 'delivered' && order.status !== 'cancelled';
    }
    if (filter === 'completed') {
      return matchesSearch && order.status === 'delivered';
    }
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container-max mx-auto section-padding">
          <div className="flex items-center justify-between h-16">
            <button 
              onClick={() => navigate('/dashboard')} 
              className="flex items-center gap-2 text-gray-600 hover:text-[#277310]"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Order History</h1>
            <div className="w-16" />
          </div>
        </div>
      </header>

      <div className="container-max mx-auto section-padding py-8">
        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'active', 'completed'] as const).map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? 'default' : 'outline'}
                  onClick={() => setFilter(f)}
                  className={filter === f ? 'bg-[#277310] hover:bg-[#1e5a10]' : ''}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/track-order?orderId=${order.id}`)}
                >
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-semibold">{order.id}</p>
                          <Badge className={statusColors[order.status]}>
                            {statusLabels[order.status]}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <span>{order.items.length} items</span>
                          <span>•</span>
                          <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span className="font-medium text-[#277310]">
                            ₦{order.totalAmount.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {order.status === 'delivered' && order.rating && (
                          <div className="flex items-center gap-1">
                            {[...Array(order.rating)].map((_, i) => (
                              <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        )}
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery ? 'Try adjusting your search' : 'You haven\'t placed any orders yet'}
                </p>
                <Button 
                  onClick={() => navigate('/request-errand')}
                  className="bg-[#277310] hover:bg-[#1e5a10]"
                >
                  Place Your First Order
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderHistoryPage;
