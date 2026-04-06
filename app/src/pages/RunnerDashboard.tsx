import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  MapPin, 
  MessageSquare, 
  Clock,
  Star,
  DollarSign,
  TrendingUp,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Banknote,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useAuthStore, useOrderStore, useRunnerStore } from '@/store';
import { toast } from 'sonner';
import { useEffect } from 'react';
import type { Order, OrderStatus, Runner } from '@/types';

const statusColors: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-800 ring-slate-600/20',
  PENDING_ADMIN_REVIEW: 'bg-amber-100 text-amber-800 ring-amber-600/20',
  DISPATCHED_TO_MARKET: 'bg-blue-100 text-blue-800 ring-blue-600/20',
  runner_assigned: 'bg-purple-100 text-purple-800 ring-purple-600/20',
  picked_up: 'bg-indigo-100 text-indigo-800 ring-indigo-600/20',
  in_transit: 'bg-orange-100 text-orange-800 ring-orange-600/20',
  delivered: 'bg-emerald-100 text-emerald-800 ring-emerald-600/20',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  PENDING_ADMIN_REVIEW: 'Awaiting Dispatch',
  DISPATCHED_TO_MARKET: 'Dispatched',
  runner_assigned: 'Assigned',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  delivered: 'Delivered',
};

const nextStatusMap: Record<string, OrderStatus> = {
  DISPATCHED_TO_MARKET: 'runner_assigned',
  runner_assigned: 'picked_up',
  picked_up: 'in_transit',
  in_transit: 'delivered',
};

const RunnerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { orders, updateOrderStatus, fetchOrders } = useOrderStore();
  const { runners, updateAvailability, fetchRunners } = useRunnerStore();

  useEffect(() => {
    fetchOrders();
    fetchRunners();
  }, [fetchOrders, fetchRunners]);


  const runner = (runners || []).find(r => r?.userId === user?.id);
  const [isAvailable, setIsAvailable] = useState(runner?.isAvailable ?? true);
  const [activeTab, setActiveTab] = useState('available');

  // AUTO-ONBOARDING: If user is a runner but no profile exists, create one
  const { addRunner } = useRunnerStore();
  
  useEffect(() => {
    if (user?.role === 'runner' && !runner) {
      console.log('No runner profile found, creating one for demo...');
      const newRunner: Runner = {
        id: `run_${Math.random().toString(36).substr(2, 9)}`,
        userId: user?.id || '',
        user: user as any,
        rating: 5.0,
        totalDeliveries: 0,
        isAvailable: true,
        vehicleType: 'bicycle',
        joinedAt: new Date().toISOString(),
      };
      addRunner(newRunner);
    }
  }, [user, runner, addRunner]);



  // Self-shielding loading state: Prevents crash if store is still hydrating
  // Note: Only block if they are truly null/undefined (not just empty arrays)
  if (orders === undefined || runners === undefined) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="h-[100dvh] flex items-center justify-center bg-slate-50"
      >
        <div className="flex flex-col items-center gap-4">
          <Activity className="w-10 h-10 text-[#277310] animate-spin" />
          <p className="text-slate-500 font-medium tracking-tight">Syncing Runner Portal...</p>
        </div>
      </motion.div>
    );
  }

  // THE FIREWALL: Only allow orders explicitly sent by Admin to the marketplace
  const availableOrders = (orders || []).filter(o => 
    o?.status === 'DISPATCHED_TO_MARKET' && !o?.runnerId
  );

  // My Active Tasks: Orders I have already accepted
  const myOrders = (orders || []).filter(o => 
    o?.runnerId === runner?.id && 
    ['runner_assigned', 'picked_up', 'in_transit'].includes(o?.status || '')
  );

  const completedOrders = (orders || []).filter(o => 
    o?.runnerId === runner?.id && o?.status === 'delivered'
  );

  const handleToggleAvailability = () => {
    if (runner) {
      updateAvailability(!isAvailable);
      setIsAvailable(!isAvailable);
      toast.success(isAvailable ? 'You are now offline' : 'You are now online');
    }
  };

  const handleAcceptOrder = (orderId: string) => {
    if (!isAvailable) {
      toast.error('You must be online to accept orders');
      return;
    }
    if (runner) {
      // Move from Marketplace to the Runner's personal list
      updateOrderStatus(orderId, 'runner_assigned', runner.id);
      toast.success('Order accepted! Check "My Tasks"');
      
      // OPTIONAL: Automatically switch to the active orders tab
      setTimeout(() => {
        setActiveTab('active');
      }, 500);
    } else {
      toast.error('Runner profile not found. Please contact support.');
    }
  };

  const handleUpdateStatus = (orderId: string, currentStatus: string) => {
    const nextStatus = nextStatusMap[currentStatus];
    if (nextStatus) {
      updateOrderStatus(orderId, nextStatus);
      toast.success(`Status updated to: ${statusLabels[nextStatus]}`);
    }
  };

  const stats = [
    { label: 'Total Earnings', value: '₦125,000', icon: DollarSign, color: 'from-blue-400 to-indigo-600', bgColor: 'bg-blue-50 text-blue-600' },
    { label: 'Deliveries', value: completedOrders.length.toString(), icon: Package, color: 'from-orange-400 to-amber-600', bgColor: 'bg-orange-50 text-orange-600' },
    { label: 'Rating', value: Number(runner?.rating || 0).toFixed(1), icon: Star, color: 'from-purple-400 to-fuchsia-600', bgColor: 'bg-purple-50 text-purple-600' },
    { label: 'Today\'s Earnings', value: '₦8,500', icon: TrendingUp, color: 'from-emerald-400 to-green-600', bgColor: 'bg-emerald-50 text-emerald-600' },
  ];

  return (
    <div className="h-[100dvh] flex flex-col bg-[#F8FAFC] font-['Inter',sans-serif] selection:bg-[#277310]/20 text-slate-800 overflow-hidden">
      {/* Premium Glassmorphic Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm transition-all duration-300">
        <div className="container-max mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => navigate('/')}
            >
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#277310] to-[#1e5a10] shadow-lg shadow-[#277310]/30 transition-transform duration-300 group-hover:scale-105">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 font-['Poppins'] tracking-tight">
                  ErrandHub
                </h1>
                <p className="text-xs font-medium text-[#277310] uppercase tracking-wider">Runner Portal</p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4 sm:gap-6"
            >
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                <div className="relative flex h-2 w-2">
                  {isAvailable && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isAvailable ? 'bg-green-500' : 'bg-slate-400'}`}></span>
                </div>
                <span className={`text-sm font-bold hidden sm:block ${isAvailable ? 'text-green-600' : 'text-slate-500'}`}>
                  {isAvailable ? 'Accepting Orders' : 'Offline'}
                </span>
                <Switch
                  checked={isAvailable}
                  onCheckedChange={handleToggleAvailability}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>
              <div className="hidden sm:block h-8 w-px bg-slate-200"></div>
              <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-1.5 pr-3 rounded-full transition-colors border border-transparent hover:border-slate-200">
                <div className="w-10 h-10 bg-gradient-to-tr from-[#277310] to-emerald-400 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white font-bold">{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto w-full">
        <div className="container-max mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-32">
          {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 font-['Poppins']">
              Hello, {user?.firstName}! 🏃‍♂️
            </h1>
            <p className="text-slate-500 mt-1">Here is your performance and current orders summary.</p>
          </div>
          {isAvailable && (
            <div className="flex items-center gap-2 text-[#277310] bg-green-50 px-4 py-2 rounded-xl border border-green-100">
              <AlertCircle className="w-5 h-5 animate-pulse" />
              <span className="font-semibold text-sm">Waiting for new orders...</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, type: 'spring' }}
            >
              <Card className="border-none shadow-sm hover:shadow-md transition-shadow bg-white/80 backdrop-blur-sm relative overflow-hidden group rounded-2xl">
                <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full bg-gradient-to-br ${stat.color} opacity-10 group-hover:scale-150 transition-transform duration-500`} />
                <CardContent className="p-3 sm:p-5 relative z-10">
                  <div className="flex items-center justify-between gap-1">
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-slate-500 mb-0.5 sm:mb-1 truncate">{stat.label}</p>
                      <p className="text-xl sm:text-3xl font-bold tracking-tight text-slate-900 truncate">{stat.value}</p>
                    </div>
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${stat.bgColor}`}>
                      <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Premium Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="mb-6 overflow-x-auto w-full pb-2 hide-scrollbar">
            <TabsList className="min-w-max w-full sm:w-auto p-1.5 bg-white/60 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/50 flex flex-row items-center justify-between sm:justify-start gap-2">
              {[
                { id: 'available', label: 'Available', count: availableOrders.length },
                { id: 'active', label: 'My Orders', count: myOrders.length },
                { id: 'completed', label: 'Completed', count: completedOrders.length }
              ].map((tab) => (
                <TabsTrigger 
                  key={tab.id}
                  value={tab.id} 
                  className={`rounded-xl flex-1 sm:flex-none px-3 sm:px-6 py-2.5 text-xs sm:text-sm font-medium transition-all duration-300 data-[state=active]:bg-white data-[state=active]:text-[#277310] data-[state=active]:shadow-sm flex items-center justify-center gap-1 sm:gap-2 whitespace-nowrap`}
                >
                  {tab.label}
                  <Badge className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs border-none ${activeTab === tab.id ? 'bg-[#277310] text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {tab.count}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <TabsContent value="available" className="mt-0 outline-none">
                {availableOrders.length > 0 ? (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {availableOrders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        type="available"
                        onAccept={() => handleAcceptOrder(order.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState 
                    title="No available orders" 
                    message="There are no nearby orders at the moment. Keep your status online to receive alerts." 
                    icon={MapPin} 
                  />
                )}
              </TabsContent>

              <TabsContent value="active" className="mt-0 outline-none">
                {myOrders.length > 0 ? (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {myOrders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        type="active"
                        onUpdateStatus={() => handleUpdateStatus(order.id, order.status)}
                        onChat={() => navigate(`/chat/${order.id}`)}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState 
                    title="No active orders" 
                    message="You are not currently delivering any orders." 
                    icon={Package} 
                  />
                )}
              </TabsContent>

              <TabsContent value="completed" className="mt-0 outline-none">
                {completedOrders.length > 0 ? (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {completedOrders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        type="completed"
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState 
                    title="No completed orders" 
                    message="You haven't completed any deliveries yet." 
                    icon={CheckCircle2} 
                  />
                )}
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
        </div>
      </div>
    </div>
  );
};

interface OrderCardProps {
  order: Order;
  type: 'available' | 'active' | 'completed';
  onAccept?: () => void;
  onUpdateStatus?: () => void;
  onChat?: () => void;
}

const OrderCard = ({ order, type, onAccept, onUpdateStatus, onChat }: OrderCardProps) => {
  const getActionButton = () => {
    if (type === 'available') {
      return (
        <Button onClick={onAccept} className="w-full bg-[#277310] hover:bg-[#1e5a10] rounded-xl font-semibold shadow-md hover:shadow-lg transition-all">
          Accept & Route
        </Button>
      );
    }
    if (type === 'active') {
      const actionLabels: Record<string, string> = {
        runner_assigned: 'Mark Purchased',
        picked_up: 'Start Delivery',
        in_transit: 'Mark Delivered',
      };
      return (
        <div className="flex gap-2 w-full mt-4 border-t border-slate-100 pt-4">
          <Button variant="outline" onClick={onChat} className="flex-1 rounded-xl text-[#277310] border-[#277310]/30 hover:bg-green-50">
            <MessageSquare className="w-4 h-4 mr-2" />
            Chat
          </Button>
          {order.status !== 'delivered' && (
            <Button onClick={onUpdateStatus} className="flex-1 rounded-xl bg-[#277310] hover:bg-[#1e5a10] shadow-md transition-all">
              {actionLabels[order.status] || 'Update'}
            </Button>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      className="h-full flex flex-col"
    >
      <Card className="h-full border-none shadow-md hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-md rounded-2xl overflow-hidden flex flex-col">
        <div className="h-1 bg-gradient-to-r from-[#277310] to-[#1e5a10]"></div>
        <CardContent className="p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Order #{order.id.slice(-6)}</p>
              <Badge className={`px-2 py-0.5 text-xs font-semibold ring-1 ring-inset uppercase ${statusColors[order.status]}`}>
                {statusLabels[order.status]}
              </Badge>
            </div>
            <div className="font-bold text-xl text-slate-900 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
              ₦{order.totalAmount.toLocaleString()}
            </div>
          </div>

          <div className="space-y-4 flex-1">
            <div className="relative pl-6 py-2">
              <div className="absolute left-2 top-4 bottom-4 w-px bg-slate-200"></div>
              
              <div className="relative mb-6">
                <div className="absolute left-[-26px] top-0 w-3 h-3 rounded-full bg-slate-300 ring-4 ring-white"></div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> Pickup
                </p>
                <p className="text-sm font-medium text-slate-800 mt-1 pl-1">{order.pickupAddress.street}</p>
              </div>

              <div className="relative">
                <div className="absolute left-[-26px] top-0 w-3 h-3 rounded-full bg-[#277310] ring-4 ring-white"></div>
                <p className="text-xs font-bold text-[#277310] uppercase tracking-wider flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5" /> Dropoff
                </p>
                <p className="text-sm font-medium text-slate-800 mt-1 pl-1">{order.deliveryAddress.street}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center">
                  <Package className="w-4 h-4 text-indigo-500" />
                </div>
                <span className="text-sm font-bold text-slate-700">{(order.items || []).length} items</span>
              </div>
              <div className="w-px h-8 bg-slate-200"></div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center">
                  <Clock className="w-4 h-4 text-orange-500" />
                </div>
                <span className="text-sm font-bold text-slate-700">{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
            </div>
            
            {type === 'active' && order.status !== 'delivered' && (
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 mt-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <Banknote className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-900 leading-tight">Collect from Customer</p>
                  <p className="text-xs text-amber-700 mt-0.5 font-medium">₦{order.deliveryFee.toLocaleString()} (Delivery Fee)</p>
                </div>
              </div>
            )}
            
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100/0">
            {getActionButton()}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const EmptyState = ({ title, message, icon: Icon }: { title: string, message: string, icon: any }) => (
  <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50 rounded-3xl">
    <CardContent className="p-16 text-center">
      <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
        <Icon className="w-10 h-10 text-slate-300" />
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-500 max-w-sm mx-auto">{message}</p>
    </CardContent>
  </Card>
);

export default RunnerDashboard;
