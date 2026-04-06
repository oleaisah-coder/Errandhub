import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  MapPin, 
  Package, 
  Clock, 
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Order } from '@/types';

const OrderSummaryPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state?.order as Order | undefined;

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <p className="text-gray-600 mb-4">No order found</p>
          <Button onClick={() => navigate('/request-errand')} className="bg-[#277310]">
            Create New Order
          </Button>
        </Card>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container-max mx-auto section-padding">
          <div className="flex items-center justify-between h-16">
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-gray-600 hover:text-[#277310]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Order Summary</h1>
            <div className="w-32" />
          </div>
        </div>
      </header>

      <div className="container-max mx-auto section-padding py-8">
        <div className="max-w-2xl mx-auto">
          {/* Success Message */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center mb-8"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 font-['Poppins']">
              Order Confirmed!
            </h2>
            <p className="text-gray-600 mt-2">
              Your order has been placed successfully. Order ID: <span className="font-medium">{order.id}</span>
            </p>
          </motion.div>

          {/* Order Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Order Details</h3>
                  <Badge className={statusColors[order.status]}>
                    {order.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Package className="w-5 h-5 text-[#277310] mt-0.5" />
                    <div>
                      <p className="font-medium">Items</p>
                      <div className="space-y-1 mt-1">
                        {order.items.map((item) => (
                          <p key={item.id} className="text-sm text-gray-600">
                            {item.quantity}x {item.name} - ₦{(item.estimatedPrice * item.quantity).toLocaleString()}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-[#277310] mt-0.5" />
                    <div>
                      <p className="font-medium">Delivery Address</p>
                      <p className="text-sm text-gray-600">{order.deliveryAddress.label}</p>
                      <p className="text-sm text-gray-500">{order.deliveryAddress.street}</p>
                      <p className="text-sm text-gray-500">{order.deliveryAddress.city}, {order.deliveryAddress.state}</p>
                    </div>
                  </div>

                  {order.scheduledFor && (
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-[#277310] mt-0.5" />
                      <div>
                        <p className="font-medium">Scheduled For</p>
                        <p className="text-sm text-gray-600">
                          {new Date(order.scheduledFor).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {order.notes && (
                    <div className="flex items-start gap-3">
                      <MessageSquare className="w-5 h-5 text-[#277310] mt-0.5" />
                      <div>
                        <p className="font-medium">Notes</p>
                        <p className="text-sm text-gray-600">{order.notes}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 mt-6 pt-5">
                  <div className="mb-4">
                    <p className="text-xs font-bold text-[#277310] uppercase tracking-widest mb-3">Order Totals</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Item Fee</span>
                        <span>₦{order.itemFee.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Service Fee</span>
                        <span>₦{order.serviceFee.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Delivery Fee</span>
                        <span>₦{order.deliveryFee.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-semibold items-center text-gray-900 border-t border-gray-50 pt-2 mt-2">
                        <span>Total</span>
                        <span>₦{(order.itemFee + order.serviceFee + order.deliveryFee).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-3"
          >


            <Button
              variant="outline"
              onClick={() => navigate(`/track-order?orderId=${order.id}`)}
              className="w-full h-12"
            >
              Track Order
            </Button>

            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="w-full h-12"
            >
              Go to Dashboard
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default OrderSummaryPage;
