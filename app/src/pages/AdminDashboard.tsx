import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  Users, 
  DollarSign, 
  TrendingUp,
  LogOut,
  Search,
  Filter,
  MoreHorizontal,
  ChevronRight,
  Activity,
  Trash2,
  Navigation,
  MapPin,
  ShoppingBag,
  ArrowRight,
  User,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useAuthStore, useOrderStore, useRunnerStore } from '@/store';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const { orders, updateOrderStatus, clearAllOrders, fetchOrders, fetchAdminStats, adminStats } = useOrderStore();
  const { runners, fetchRunners, isLoading: isRunnersLoading } = useRunnerStore();
  // Load dashboard data on mount
  useEffect(() => {
    console.log("Admin Component Mounted", { hasOrders: !!orders, hasRunners: !!runners });
    const loadData = async () => {
      try {
        await Promise.all([
          fetchOrders(),
          fetchRunners(),
          fetchAdminStats()
        ]);
      } catch (error) {
        console.error("Dashboard data fetch failed:", error);
      }
    };
    loadData();
    // Refresh interval for live dashboard feel
    const interval = setInterval(loadData, 30000); 
    return () => clearInterval(interval);
  }, [fetchOrders, fetchRunners, fetchAdminStats]);

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to remove ALL orders? This will clear all dashboards.')) {
      clearAllOrders();
      toast.success('All orders have been removed');
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Self-shielding loading state: Prevents crash if store is still hydrating
  if (!orders || !runners) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen flex items-center justify-center bg-slate-50"
      >
        <div className="flex flex-col items-center gap-4">
          <Activity className="w-10 h-10 text-[#277310] animate-spin" />
          <p className="text-slate-500 font-medium">Initializing Dashboard...</p>
        </div>
      </motion.div>
    );
  }

  const totalRevenue = (orders || [])
    .filter(o => o?.status === 'delivered')
    .reduce((sum, o) => sum + (Number(o?.totalAmount) || 0), 0);
  const pendingOrders = (orders || []).filter(o => o?.status === 'PENDING_ADMIN_REVIEW');

  const filteredOrders = (orders || []).filter(order => {
    const searchString = searchQuery?.toLowerCase() || '';
    const idMatch = order?.id ? String(order.id).toLowerCase().includes(searchString) : false;
    const userIdMatch = order?.userId ? String(order.userId).toLowerCase().includes(searchString) : false;
    return idMatch || userIdMatch;
  });

  // Extract unique users for the Users tab
  const uniqueUserIds = Array.from(new Set((orders || []).map(o => o?.userId).filter(Boolean)));
  const mockUsers = uniqueUserIds.map(id => {
    const userOrder = (orders || []).find(o => o?.userId === id);
    const user = (userOrder as any)?.user;
    const safeId = id || '';
    return {
      id: safeId,
      name: user ? `${user.firstName} ${user.lastName}` : `Customer ${safeId.toString().slice(-4).toUpperCase()}`,
      orders: (orders || []).filter(o => o?.userId === id).length,
      spent: (orders || []).filter(o => o?.userId === id).reduce((sum, o) => sum + (Number(o?.totalAmount) || 0), 0)
    };
  });

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const handleUpdateStatus = async (orderId: string, status: string) => {
    console.log(`[AdminDash] Status update triggered: ${orderId} -> ${status}`);
    await updateOrderStatus(orderId, status as any);
    if (status === 'runner_assigned') {
      toast.success('Runner assigned!', { description: 'The runner has been matched with the order.' });
    } else if (status === 'DISPATCHED_TO_MARKET') {
      toast.success('Order Dispatched!', { description: 'The order is now visible to all marketplace runners.' });
    } else {
      toast.success(`Order status updated to ${status.replace(/_/g, ' ')}`);
    }
  };

  const handleDispatch = async (orderId: string) => {
    setProcessingId(orderId);
    console.log(`[AdminDash] Dispatching order ${orderId}...`);
    await new Promise(resolve => setTimeout(resolve, 800));
    await updateOrderStatus(orderId, 'DISPATCHED_TO_MARKET');
    toast.success('Dispatched!', { 
      description: 'The order has been published to the runner marketplace.' 
    });
    setProcessingId(null);
  };

  const stats = [
    { 
      label: 'Total Revenue', 
      value: `₦${Number(adminStats?.totalRevenue || totalRevenue).toLocaleString()}`, 
      icon: DollarSign,
      change: '+12.5%',
      color: 'from-emerald-400 to-emerald-600',
      bgColor: 'bg-emerald-50 text-emerald-600'
    },
    { 
      label: 'Total Orders', 
      value: (adminStats?.totalOrders || (orders || []).length).toString(), 
      icon: Package,
      change: '+8.2%',
      color: 'from-blue-400 to-blue-600',
      bgColor: 'bg-blue-50 text-blue-600'
    },
    { 
      label: 'Active Runners', 
      value: (adminStats?.totalRunners || (runners || []).filter(r => r?.isAvailable).length).toString(), 
      icon: Users,
      change: '+5.0%',
      color: 'from-purple-400 to-purple-600',
      bgColor: 'bg-purple-50 text-purple-600'
    },
    { 
      label: 'Admin Review', 
      value: pendingOrders.length.toString(), 
      icon: TrendingUp,
      change: '-3.1%',
      trend: 'down',
      color: 'from-amber-400 to-amber-600',
      bgColor: 'bg-amber-50 text-amber-600'
    },
  ];

  const statusColors: Record<string, string> = {
    pending: 'bg-slate-100 text-slate-800 ring-slate-600/20',
    PENDING_ADMIN_REVIEW: 'bg-amber-100 text-amber-800 ring-amber-600/20',
    DISPATCHED_TO_MARKET: 'bg-blue-100 text-blue-800 ring-blue-600/20',
    runner_assigned: 'bg-purple-100 text-purple-800 ring-purple-600/20',
    picked_up: 'bg-indigo-100 text-indigo-800 ring-indigo-600/20',
    in_transit: 'bg-orange-100 text-orange-800 ring-orange-600/20',
    delivered: 'bg-emerald-100 text-emerald-800 ring-emerald-600/20',
    cancelled: 'bg-red-100 text-red-800 ring-red-600/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[#F8FAFC] font-['Inter',sans-serif]"
    >
      <div className="h-[100dvh] flex flex-col selection:bg-[#277310]/20 text-slate-800 overflow-hidden">
        {/* Premium Glassmorphic Header */}
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm transition-all duration-300">
        <div className="container-max mx-auto px-4 py-3 sm:py-0 sm:px-6 lg:px-8">
          <div className="flex flex-row items-center justify-between sm:h-20">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 sm:gap-3 cursor-pointer group shrink-0"
              onClick={() => navigate('/')}
            >
              <div className="relative flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#277310] to-[#1e5a10] shadow-lg shadow-[#277310]/30 transition-transform duration-300 group-hover:scale-105">
                <Package className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-base sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 font-['Poppins'] tracking-tight leading-tight">
                  ErrandHub
                </h1>
                <p className="text-[10px] sm:text-xs font-medium text-[#277310] uppercase tracking-wider leading-tight">Admin Portal</p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-1.5 sm:gap-4 flex-wrap justify-end shrink-0"
            >
              <div className="hidden lg:flex items-center gap-2 mr-2 px-4 py-2 bg-slate-100/80 rounded-full border border-slate-200/50">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-sm font-medium text-slate-600 uppercase tracking-tighter">System Live</span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={async () => {
                  const loadData = async () => {
                    await Promise.all([fetchOrders(), fetchRunners(), fetchAdminStats()]);
                  };
                  toast.promise(loadData(), {
                    loading: 'Refreshing dashboard...',
                    success: 'Data up to date!',
                    error: 'Failed to refresh data'
                  });
                }}
                className="hidden md:flex items-center gap-1.5 px-3 h-9 rounded-full text-xs font-bold border-green-100 text-[#277310] hover:bg-green-50"
              >
                <Activity className={`w-3.5 h-3.5 ${(isRunnersLoading) ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleClearAll}
                className="hidden sm:flex items-center gap-1.5 px-3 h-9 rounded-full text-xs font-bold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear All
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => toast.success('System Check: Notifications Active!')}
                className="flex sm:hidden border-blue-100 text-blue-600 hover:bg-blue-50 font-medium rounded-full h-8 w-8 px-0"
              >
                <Bell className="w-3.5 h-3.5" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => toast.success('System Check: Notifications Active!')}
                className="hidden sm:flex border-blue-100 text-blue-600 hover:bg-blue-50 font-medium rounded-full h-9 px-3 text-xs"
              >
                Test Pop-up
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleLogout} 
                className="flex sm:hidden text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors rounded-xl h-8 w-8 px-0"
              >
                <LogOut className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleLogout} 
                className="hidden sm:flex text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors rounded-xl px-4"
              >
                <LogOut className="w-5 h-5 mr-2" />
                Logout
              </Button>
            </motion.div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto w-full pb-safe">
        <div className="container-max mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-32">
          {/* Animated Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8">
          <AnimatePresence>
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
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner group-hover:rotate-6 transition-transform duration-300 ${stat.bgColor}`}>
                        <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Premium Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8 w-full">
          <div className="mb-6 overflow-x-auto w-full pb-2 hide-scrollbar">
            <TabsList className="min-w-max w-full sm:w-auto p-1.5 bg-white/60 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/50 flex flex-row items-center justify-between sm:justify-start gap-2">
              {['overview', 'dispatch', 'orders', 'runners', 'users'].map((tab) => (
                <TabsTrigger 
                  key={tab}
                  value={tab} 
                  className={`rounded-xl flex-1 sm:flex-none px-4 sm:px-6 py-2.5 text-xs sm:text-sm font-medium capitalize transition-all duration-300 data-[state=active]:bg-white data-[state=active]:text-[#277310] data-[state=active]:shadow-sm flex items-center justify-center gap-1.5 whitespace-nowrap`}
                >
                  {tab}
                  {tab === 'dispatch' && pendingOrders.length > 0 && (
                    <span className="relative flex h-5 w-5 bg-amber-500 rounded-full items-center justify-center shadow-sm">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative text-[10px] text-white font-bold">{pendingOrders.length}</span>
                    </span>
                  )}
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
              <TabsContent value="overview" className="mt-0 outline-none">
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Recent Orders Card */}
                  <Card className="border-none shadow-md bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden">
                    <CardHeader className="border-b border-slate-100 bg-white/50 pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                          <Activity className="w-5 h-5 text-[#277310]" />
                          Live Orders
                        </CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => setActiveTab('orders')} className="text-[#277310] hover:bg-green-50">
                          View All <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y divide-slate-100">
                        {(orders || []).slice(0, 5).map((order, i) => (
                          <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            key={order?.id || i} 
                            className="flex items-center justify-between p-5 hover:bg-slate-50/80 transition-colors group cursor-pointer"
                            onClick={() => navigate(`/track-order?orderId=${order.id}`)}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all">
                                <Package className="w-5 h-5 text-slate-400 group-hover:text-[#277310]" />
                              </div>
                              <div>
                                <p className="font-semibold text-slate-800">#{order.id ? String(order.id).slice(-6).toUpperCase() : 'N/A'}</p>
                                <p className="text-sm font-medium text-slate-500">₦{Number(order.totalAmount || 0).toLocaleString()}</p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge className={`px-2.5 py-1 text-xs font-medium ring-1 ring-inset capitalize ${statusColors[order.status] || 'bg-slate-100 text-slate-800'}`}>
                                {order.status.replace(/_/g, ' ')}
                              </Badge>
                              <span className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                          </motion.div>
                        ))}
                        {(!orders || orders.length === 0) && (
                          <div className="p-8 text-center text-slate-500">No recent orders.</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Top Runners Card */}
                  <Card className="border-none shadow-md bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden">
                    <CardHeader className="border-b border-slate-100 bg-white/50 pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                          <Users className="w-5 h-5 text-indigo-600" />
                          Top Performers
                        </CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => setActiveTab('runners')} className="text-indigo-600 hover:bg-indigo-50">
                          View All <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y divide-slate-100">
                        {(runners || []).slice(0, 5).map((runner, i) => (
                          <motion.div 
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            key={runner?.id || i} 
                            className="flex items-center justify-between p-5 hover:bg-slate-50/80 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                                  {(runner?.user?.firstName || '?')[0]}{(runner?.user?.lastName || '')[0]}
                                </div>
                                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${runner?.isAvailable ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                              </div>
                              <div>
                                <p className="font-bold text-slate-800">
                                  {runner?.user?.firstName || 'Unknown'} {runner?.user?.lastName || ''}
                                </p>
                                <p className="text-sm font-medium text-slate-500">{runner?.totalDeliveries || 0} total deliveries</p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                                <span className="text-amber-500 text-sm">★</span>
                                <span className="font-bold text-amber-700 text-sm">{Number(runner?.rating || 0).toFixed(1)}</span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                        {(!runners || runners.length === 0) && (
                          <div className="p-8 text-center text-slate-500">No active runners.</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="dispatch" className="mt-0 outline-none">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <AnimatePresence>
                    {pendingOrders.map((order, i) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <Card className="border-none shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white rounded-2xl overflow-hidden group">
                          <CardContent className="p-6 relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#277310]/10 to-transparent rounded-bl-full -z-10 transition-transform duration-500 group-hover:scale-110" />
                            
                            <div className="flex justify-between items-start mb-6">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-slate-100 shadow-sm flex items-center justify-center border border-slate-200/50">
                                  <User className="w-6 h-6 text-slate-600" />
                                </div>
                                <div>
                                  <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">Customer</p>
                                  <p className="font-bold text-slate-900">{order.userId ? String(order.userId).slice(0, 8).toUpperCase() : 'UNKNOWN'}</p>
                                </div>
                              </div>
                              <Badge className="bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 font-semibold px-2.5">
                                Pending Review
                              </Badge>
                            </div>

                            <div className="mb-5 space-y-3">
                              <div className="flex items-start gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                                <ShoppingBag className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-xs font-semibold text-slate-500 mb-1">Items Requested</p>
                                  <ul className="text-sm font-medium text-slate-800 list-disc list-inside">
                                    {(order.items || []).slice(0, 2).map((item, idx) => (
                                      <li key={idx} className="truncate max-w-[200px]">{item.name}</li>
                                    ))}
                                    {(order.items || []).length > 2 && (
                                      <li className="text-xs text-slate-500 italic mt-0.5">
                                        + {(order.items || []).length - 2} more item(s)
                                      </li>
                                    )}
                                  </ul>
                                </div>
                              </div>

                              <div className="flex items-start gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                                <MapPin className="w-5 h-5 text-[#277310] shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-xs font-semibold text-slate-500 mb-1">Destination</p>
                                  <p className="text-sm font-medium text-slate-800 leading-snug">
                                    {order.deliveryAddress.street}, {order.deliveryAddress.city}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                              <div>
                                <p className="text-xs text-slate-500 font-medium">Order Value</p>
                                <p className="font-bold text-lg text-slate-900">₦{order.totalAmount.toLocaleString()}</p>
                              </div>
                              <Button
                                disabled={processingId === order.id}
                                onClick={() => handleDispatch(order.id)}
                                className="bg-[#277310] hover:bg-[#1e5a10] text-white shadow-md shadow-[#277310]/20 rounded-xl px-5 transition-all"
                              >
                                {processingId === order.id ? 'Pushing...' : 'Dispatch'}
                                {processingId !== order.id && <ArrowRight className="w-4 h-4 ml-1.5" />}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                    {pendingOrders.length === 0 && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="col-span-full py-12 flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm"
                      >
                        <Navigation className="w-12 h-12 text-slate-200 mb-4" />
                        <h3 className="text-lg font-bold text-slate-800">Marketplace is up to date</h3>
                        <p className="text-slate-500">No orders awaiting dispatch at the moment.</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </TabsContent>

              <TabsContent value="orders" className="mt-0 outline-none">
                <Card className="border-none shadow-md bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden">
                  <div className="p-6 border-b border-slate-100 bg-white/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <CardTitle className="text-xl font-bold text-slate-800">Order Management</CardTitle>
                      <div className="flex gap-3">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input
                            placeholder="Search ID or Customer..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 w-full sm:w-72 bg-white rounded-xl border-slate-200 focus-visible:ring-[#277310]"
                          />
                        </div>
                        <Button variant="outline" className="rounded-xl border-slate-200 text-slate-600 hover:text-slate-900 bg-white">
                          <Filter className="w-4 h-4 sm:mr-2" />
                          <span className="hidden sm:inline">Filter</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50/80 border-b border-slate-100">
                          <tr>
                            <th className="text-left py-4 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider">Order Info</th>
                            <th className="text-left py-4 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider">Customer</th>
                            <th className="text-left py-4 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider">Amount</th>
                            <th className="text-left py-4 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider">Status</th>
                            <th className="text-left py-4 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider">Date</th>
                            <th className="text-right py-4 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredOrders.length > 0 ? filteredOrders.map((order) => (
                            <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                              <td className="py-4 px-6">
                                <div className="font-medium text-slate-900">#{order.id ? String(order.id).slice(-6).toUpperCase() : 'N/A'}</div>
                                <div className="text-xs text-slate-500">{order.items.length} items</div>
                              </td>
                              <td className="py-4 px-6 font-medium text-slate-700">{order.userId ? String(order.userId).slice(-6).toUpperCase() : 'UNKNOWN'}</td>
                              <td className="py-4 px-6 font-bold text-slate-800">₦{order.totalAmount.toLocaleString()}</td>
                              <td className="py-4 px-6">
                                <Badge className={`px-2.5 py-1 text-xs font-medium ring-1 ring-inset capitalize ${statusColors[order.status] || 'bg-slate-100 text-slate-800'}`}>
                                  {order.status.replace(/_/g, ' ')}
                                </Badge>
                              </td>
                              <td className="py-4 px-6">
                                <div className="text-sm text-slate-700">{new Date(order.createdAt).toLocaleDateString()}</div>
                                <div className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                              </td>
                              <td className="py-4 px-6 text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-slate-900 data-[state=open]:bg-slate-100">
                                      <span className="sr-only">Open menu</span>
                                      <MoreHorizontal className="w-5 h-5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48 rounded-xl p-1">
                                    <DropdownMenuItem className="rounded-lg cursor-pointer font-medium" onClick={() => navigate(`/track-order?orderId=${order.id}`)}>
                                      View Full Details
                                    </DropdownMenuItem>
                                    {order.status === 'PENDING_ADMIN_REVIEW' && (
                                      <DropdownMenuItem 
                                        className="rounded-lg cursor-pointer font-medium text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50" 
                                        onClick={() => handleUpdateStatus(order.id, 'DISPATCHED_TO_MARKET')}
                                      >
                                        Push to Marketplace
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem className="rounded-lg cursor-pointer font-medium text-red-600 focus:text-red-700 focus:bg-red-50" onClick={() => handleUpdateStatus(order.id, 'cancelled')}>
                                      Cancel Order
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan={6} className="py-12 text-center text-slate-500 font-medium">No orders found matching your search.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="runners" className="mt-0 outline-none">
                <Card className="border-none shadow-md bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden">
                  <div className="p-6 border-b border-slate-100 bg-white/50">
                    <CardTitle className="text-xl font-bold text-slate-800">Fleet Management</CardTitle>
                  </div>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50/80 border-b border-slate-100">
                          <tr>
                            <th className="text-left py-4 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider">Runner Profile</th>
                            <th className="text-left py-4 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider">Vehicle</th>
                            <th className="text-left py-4 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider">Performance</th>
                            <th className="text-left py-4 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider">Status</th>
                            <th className="text-right py-4 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {runners.map((runner) => (
                            <tr key={runner.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                                    {(runner?.user?.firstName || '?')[0]}{(runner?.user?.lastName || '')[0]}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900">
                                      {runner?.user?.firstName} {runner?.user?.lastName}
                                    </div>
                                    <div className="text-xs text-slate-500">{runner?.user?.phone}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-6 font-medium text-slate-700 capitalize">{runner?.vehicleType || 'Not specified'}</td>
                              <td className="py-4 px-6">
                                <div className="flex flex-col gap-1 text-sm">
                                  <div className="flex items-center gap-1 font-medium">
                                    <span className="text-amber-500">★</span> {Number(runner?.rating || 0).toFixed(1)} / 5.0
                                  </div>
                                  <span className="text-slate-500 text-xs">{runner?.totalDeliveries || 0} completed tasks</span>
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <Badge className={`px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${runner?.isAvailable ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 'bg-slate-100 text-slate-700 ring-slate-600/20'}`}>
                                  {runner?.isAvailable ? 'Available' : 'Offline'}
                                </Badge>
                              </td>
                              <td className="py-4 px-6 text-right">
                                <Button variant="outline" size="sm" className="rounded-xl font-medium">
                                  View Profile
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="users" className="mt-0 outline-none">
                <Card className="border-none shadow-md bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden">
                  <div className="p-6 border-b border-slate-100 bg-white/50">
                    <CardTitle className="text-xl font-bold text-slate-800">User Directory</CardTitle>
                  </div>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50/80 border-b border-slate-100">
                          <tr>
                            <th className="text-left py-4 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider">User Account</th>
                            <th className="text-left py-4 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider">Orders</th>
                            <th className="text-left py-4 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider">Total Spent</th>
                            <th className="text-right py-4 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {mockUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[#277310]">
                                    {user.id ? String(user.id).slice(0, 2).toUpperCase() : 'U'}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900">{user.name}</div>
                                    <div className="text-xs text-slate-500">ID: {user.id}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-6 font-medium text-slate-700">{user.orders} tasks</td>
                              <td className="py-4 px-6 font-bold text-slate-800">₦{user.spent.toLocaleString()}</td>
                              <td className="py-4 px-6 text-right">
                                <Button variant="outline" size="sm" className="rounded-xl font-medium">
                                  View History
                                </Button>
                              </td>
                            </tr>
                          ))}
                          {(!mockUsers || mockUsers.length === 0) && (
                            <tr>
                              <td colSpan={4} className="py-12 text-center text-slate-500 font-medium">No customers registered in the system yet.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminDashboard;
