import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MapPin,
  Phone,
  MessageSquare,
  Clock,
  CheckCircle,
  Package,
  User,
  Navigation,
  ArrowLeft,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useOrderStore, useRunnerStore } from '@/store';
import { toast } from 'sonner';

const orderStages = [
  { status: 'PENDING_ADMIN_REVIEW', label: 'Processing', icon: Clock },
  { status: 'DISPATCHED_TO_MARKET', label: 'Runner Dispatched', icon: Package },
  { status: 'runner_assigned', label: 'Runner Assigned', icon: User },
  { status: 'item_purchased', label: 'Item Purchased', icon: Package },
  { status: 'on_the_way', label: 'On The Way', icon: Navigation },
  { status: 'delivered', label: 'Delivered', icon: CheckCircle },
];

const TrackOrderPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('orderId');
  const { getOrderById, rateOrder } = useOrderStore();
  const { getRunnerById } = useRunnerStore();

  const order = orderId ? getOrderById(orderId) : undefined;
  const runner = order?.runnerId ? getRunnerById(order.runnerId) : null;

  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(25);

  useEffect(() => {
    if (!order && orderId) {
      toast.error('Order not found');
      navigate('/dashboard');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  useEffect(() => {
    // Simulate countdown
    const timer = setInterval(() => {
      setEstimatedTime((prev) => Math.max(0, prev - 1));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  if (!order) return null;

  const currentStageIndex = orderStages.findIndex(s => s.status === order.status);
  const progress = ((currentStageIndex + 1) / orderStages.length) * 100;

  const handleCallRunner = () => {
    if (runner?.user.phone) {
      window.location.href = `tel:${runner.user.phone}`;
    } else {
      toast.info('Runner phone number not available');
    }
  };

  const handleChat = () => {
    navigate(`/chat/${order.id}`);
  };

  const handleRate = () => {
    setShowRating(true);
  };

  const submitRating = async () => {
    if (!order || rating === 0) return;
    try {
      await rateOrder(order.id, rating);
      toast.success('Thank you for your feedback!');
      setShowRating(false);
    } catch {
      toast.error('Failed to submit rating. Please try again.');
    }
  };

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
            <h1 className="text-lg font-semibold text-gray-900">Track Order</h1>
            <div className="w-16" />
          </div>
        </div>
      </header>

      <div className="container-max mx-auto section-padding py-8">
        <div className="max-w-4xl mx-auto">
          {/* Order Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Order #{order.id}</p>
                    <h2 className="text-2xl font-bold text-gray-900 font-['Poppins']">
                      {order.status === 'delivered' ? 'Order Delivered' : 'Order In Progress'}
                    </h2>
                  </div>
                  <div className="flex items-center gap-4">
                    {order.status === 'PENDING_ADMIN_REVIEW' ? (
                      <div className="text-right">
                        <p className="text-sm font-medium text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">Processing Request...</p>
                      </div>
                    ) : order.status !== 'delivered' && order.status !== 'cancelled' && (
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Estimated Delivery</p>
                        <p className="text-xl font-bold text-[#277310]">
                          {estimatedTime} mins
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Tracking */}
            <div className="lg:col-span-2 space-y-6">
              {/* Progress Timeline */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-6">Order Progress</h3>

                    {/* Progress Bar */}
                    <div className="relative mb-8">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 1, delay: 0.3 }}
                          className="h-full bg-[#277310] rounded-full"
                        />
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-6">
                      {orderStages.map((stage, index) => {
                        const isCompleted = index <= currentStageIndex;
                        const isCurrent = index === currentStageIndex;

                        return (
                          <motion.div
                            key={stage.status}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + index * 0.1 }}
                            className="flex items-start gap-4"
                          >
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isCompleted
                                  ? 'bg-[#277310] text-white'
                                  : 'bg-gray-100 text-gray-400'
                                } ${isCurrent ? 'ring-4 ring-[#277310]/20' : ''}`}
                            >
                              <stage.icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <p className={`font-semibold ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                                {stage.label}
                              </p>

                              {isCurrent && stage.status === 'PENDING_ADMIN_REVIEW' && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  className="mt-2 p-3 bg-amber-50/80 border border-amber-200/60 rounded-xl text-sm text-amber-800 leading-relaxed shadow-sm"
                                >
                                  <strong>Order received!</strong> Our admin is verifying your request. You will be notified as soon as a runner is dispatched.
                                </motion.div>
                              )}

                              {isCurrent && stage.status !== 'PENDING_ADMIN_REVIEW' && (
                                <p className="text-sm font-medium text-[#277310] mt-0.5">In progress...</p>
                              )}

                              {isCompleted && !isCurrent && (
                                <p className="text-sm text-gray-500 mt-0.5">
                                  {new Date(order.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Map Placeholder */}
              {order.status !== 'delivered' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card>
                    <CardContent className="p-0 overflow-hidden">
                      <div className="h-64 bg-gradient-to-br from-[#d2f2d4] to-[#e8f5e9] relative">
                        {/* Simulated Map */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <Navigation className="w-12 h-12 text-[#277310] mx-auto mb-2 animate-pulse" />
                            <p className="text-[#277310] font-medium">Live Tracking</p>
                            <p className="text-sm text-gray-600">Runner is on the way</p>
                          </div>
                        </div>

                        {/* Route Line Animation */}
                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 250">
                          <motion.path
                            d="M 50 200 Q 150 150 200 100 T 350 50"
                            fill="none"
                            stroke="#277310"
                            strokeWidth="3"
                            strokeDasharray="10 5"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 2, delay: 0.5 }}
                          />
                          {/* Start Point */}
                          <circle cx="50" cy="200" r="8" fill="#277310" />
                          {/* End Point */}
                          <motion.circle
                            cx="350"
                            cy="50"
                            r="8"
                            fill="#dc3545"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          />
                          {/* Moving Runner */}
                          <motion.circle
                            r="6"
                            fill="#277310"
                            initial={{ offsetDistance: '0%' }}
                            animate={{ offsetDistance: '100%' }}
                            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                            style={{ offsetPath: 'path("M 50 200 Q 150 150 200 100 T 350 50")' }}
                          />
                        </svg>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Runner Info */}
              {runner && order.status !== 'delivered' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Your Runner</h3>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 bg-[#277310] rounded-full flex items-center justify-center">
                          <User className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold">{runner.user.firstName} {runner.user.lastName}</p>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm">{Number(runner?.rating || 0).toFixed(1)}</span>
                            <span className="text-sm text-gray-500">({runner?.totalDeliveries || 0} deliveries)</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={handleCallRunner}
                        >
                          <Phone className="w-4 h-4 mr-2" />
                          Call
                        </Button>
                        <Button
                          className="flex-1 bg-[#277310] hover:bg-[#1e5a10]"
                          onClick={handleChat}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Chat
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Delivery Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Delivery Details</h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-[#277310] mt-0.5" />
                        <div>
                          <p className="font-medium">{typeof order.deliveryAddress === 'string' ? order.deliveryAddress : (order.deliveryAddress as { label?: string })?.label || 'Delivery Address'}</p>
                          <p className="text-sm text-gray-600">{typeof order.deliveryAddress === 'string' ? '' : (order.deliveryAddress as { street?: string })?.street || ''}</p>
                          <p className="text-sm text-gray-500">{typeof order.deliveryAddress === 'string' ? '' : `${(order.deliveryAddress as { city?: string })?.city || ''}, ${(order.deliveryAddress as { state?: string })?.state || ''}`}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-[#277310] mt-0.5" />
                        <div>
                          <p className="font-medium">Order Date</p>
                          <p className="text-sm text-gray-600">
                            {new Date(order.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Order Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">Order Summary</h3>

                    <div className="mb-5">
                      <p className="text-xs font-bold text-[#277310] uppercase tracking-widest mb-3">Order Summary</p>
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
                        <div className="flex justify-between font-semibold items-center text-gray-900 border-t border-gray-100 pt-2 mt-2">
                          <span>Total Amount</span>
                          <span>₦{(order.itemFee + order.serviceFee + order.deliveryFee).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Rate Order Button */}
              {order.status === 'delivered' && !order.rating && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Button
                    onClick={handleRate}
                    className="w-full h-12 bg-[#277310] hover:bg-[#1e5a10]"
                  >
                    <Star className="w-5 h-5 mr-2" />
                    Rate Your Experience
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rating Dialog */}
      <Dialog open={showRating} onOpenChange={setShowRating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate Your Experience</DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <p className="text-gray-600 mb-6">How was your delivery experience?</p>
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-2"
                >
                  <Star
                    className={`w-8 h-8 ${star <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                      }`}
                  />
                </button>
              ))}
            </div>
            <Button
              onClick={submitRating}
              disabled={rating === 0}
              className="w-full bg-[#277310] hover:bg-[#1e5a10]"
            >
              Submit Rating
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrackOrderPage;
