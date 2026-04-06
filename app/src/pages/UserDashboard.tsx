import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  Clock, 
  ChevronRight, 
  Plus, 
  Star,
  Bell,
  User,
  LogOut,
  History,
  Home,
  Navigation,
  Wallet
} from 'lucide-react';
import WalletDashboard from '@/components/WalletDashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { useAuthStore, useOrderStore, useNotificationStore } from '@/store';
import { useWalletStore } from '@/store';
import { toast } from 'sonner';
import type { Order } from '@/types';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 ring-yellow-600/20',
  PENDING_ADMIN_REVIEW: 'bg-amber-100 text-amber-800 ring-amber-600/20',
  DISPATCHED_TO_MARKET: 'bg-blue-100 text-blue-800 ring-blue-600/20',
  confirmed: 'bg-blue-100 text-blue-800 ring-blue-600/20',
  runner_assigned: 'bg-purple-100 text-purple-800 ring-purple-600/20',
  picked_up: 'bg-indigo-100 text-indigo-800 ring-indigo-600/20',
  in_transit: 'bg-orange-100 text-orange-800 ring-orange-600/20',
  delivered: 'bg-emerald-100 text-emerald-800 ring-emerald-600/20',
  cancelled: 'bg-red-100 text-red-800 ring-red-600/20',
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

const OrderCard = ({ order }: { order: Order }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="cursor-pointer h-full"
      onClick={() => navigate(`/track-order?orderId=${order.id}`)}
    >
      <Card className="h-full border-none shadow-sm hover:shadow-xl transition-all duration-300 group bg-white/80 backdrop-blur-md overflow-hidden relative">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#277310] to-[#1e5a10] opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <CardContent className="p-5 flex flex-col h-full">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Order #{order.id.slice(-6)}</p>
              <p className="text-xl font-bold text-slate-900 tracking-tight">
                ₦{order.totalAmount.toLocaleString()}
              </p>
            </div>
            <Badge className={`px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusColors[order.status]}`}>
              {statusLabels[order.status]}
            </Badge>
          </div>

          <div className="space-y-3 mb-6 flex-1">
            <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50/50 p-2 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                <Package className="w-4 h-4 text-indigo-500" />
              </div>
              <span className="font-medium">{order.items.length} item(s) to purchase</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50/50 p-2 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                <Navigation className="w-4 h-4 text-emerald-500" />
              </div>
              <span className="truncate font-medium">{order.deliveryAddress.street}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
            {order.status === 'delivered' && order.rating ? (
              <div className="flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-full ring-1 ring-amber-100">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-3.5 h-3.5 ${i < order.rating! ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`} />
                ))}
              </div>
            ) : (
              <span className="text-sm font-medium text-[#277310] group-hover:underline flex items-center gap-1">
                {order.status === 'delivered' ? 'Rate this order' : 'Track delivery'}
              </span>
            )}
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-[#277310] transition-colors">
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Sidebar item type
interface SidebarItem {
  id: string;
  icon: React.ElementType;
  label: string;
  isRoute?: boolean;
  badge?: number;
}

const UserDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const { user, logout } = useAuthStore();
  const { fetchOrders, getUserOrders } = useOrderStore();
  const { getUserNotifications, getUnreadCount } = useNotificationStore();
  const { balance } = useWalletStore();

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const orders = user ? getUserOrders(user.id) : [];
  const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
  const completedOrders = orders.filter(o => o.status === 'delivered');
  const notifications = user ? getUserNotifications(user.id) : [];
  const unreadCount = user ? getUnreadCount(user.id) : 0;

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const stats = [
    { label: 'Total Orders', value: orders.length, icon: Package, color: 'from-blue-400 to-indigo-600', bgColor: 'bg-blue-50 text-blue-600' },
    { label: 'Active Orders', value: activeOrders.length, icon: Clock, color: 'from-orange-400 to-amber-600', bgColor: 'bg-orange-50 text-orange-600' },
    { label: 'Completed', value: completedOrders.length, icon: Star, color: 'from-emerald-400 to-green-600', bgColor: 'bg-emerald-50 text-emerald-600' },
    { label: 'Notifications', value: unreadCount, icon: Bell, color: 'from-purple-400 to-fuchsia-600', bgColor: 'bg-purple-50 text-purple-600' },
  ];

  const sidebarSections: { title: string; items: SidebarItem[] }[] = [
    {
      title: 'Main',
      items: [
        { id: 'overview', icon: Home, label: 'Overview' },
        { id: 'notifications', icon: Bell, label: 'Notifications', badge: unreadCount },
      ],
    },
    {
      title: 'Orders',
      items: [
        { id: 'request-errand', icon: Plus, label: 'New Errand', isRoute: true },
        { id: 'order-history', icon: History, label: 'Order History', isRoute: true },
        { id: 'track-order', icon: Navigation, label: 'Track Order', isRoute: true },
      ],
    },
    {
      title: 'Account',
      items: [
        { id: 'wallet', icon: Wallet, label: 'Virtual Wallet' },
        { id: 'profile', icon: User, label: 'Profile Settings', isRoute: true },
      ],
    },
  ];

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
        <div className="container-max mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 sm:gap-3 cursor-pointer group"
              onClick={() => navigate('/')}
            >
              <div className="relative flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#277310] to-[#1e5a10] shadow-lg shadow-[#277310]/30 transition-transform duration-300 group-hover:scale-105">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 font-['Poppins'] tracking-tight">
                  ErrandHub
                </h1>
                <p className="text-xs font-medium text-[#277310] uppercase tracking-wider">User Portal</p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 sm:gap-4 shrink-0"
            >
              <button 
                onClick={() => setActiveTab('notifications')}
                className="relative p-1.5 sm:p-2 text-slate-500 hover:text-[#277310] transition-colors rounded-full hover:bg-green-50"
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Mobile Quick Fund Chip */}
              <button 
                onClick={() => navigate('/wallet')}
                className="sm:hidden flex items-center gap-1.5 bg-[#277310] hover:bg-[#1e5a10] px-3 py-1.5 rounded-full shadow-md active:scale-95 transition-transform cursor-pointer"
              >
                <Plus className="w-3 h-3 text-white" />
                <span className="text-xs font-bold text-white">₦{balance.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</span>
              </button>
              
              {/* Desktop Wallet Balance Display */}
              <button 
                onClick={() => setActiveTab('wallet')}
                className="hidden sm:flex items-center gap-2 bg-[#277310]/10 hover:bg-[#277310]/20 transition-colors px-3 py-1.5 rounded-full border border-[#277310]/20 cursor-pointer"
              >
                <Wallet className="w-4 h-4 text-[#277310]" />
                <span className="text-sm font-bold text-[#277310]">₦{balance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </button>

              <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
              <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-1.5 pr-3 rounded-full transition-colors border border-transparent hover:border-slate-200">
                <div className="w-10 h-10 bg-gradient-to-tr from-[#277310] to-emerald-400 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white font-bold">{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-bold text-slate-800">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs font-medium text-slate-500">{user?.email}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto w-full">
        <div className="container-max mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32 lg:pb-12">
          <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 hidden lg:block">
            <Card className="sticky top-28 border-none shadow-md bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-[#277310] to-[#1e5a10]"></div>

              {/* User mini-profile */}
              <div className="px-5 py-4 flex items-center gap-3 border-b border-slate-100">
                <div className="w-10 h-10 bg-gradient-to-tr from-[#277310] to-emerald-400 rounded-full flex items-center justify-center shadow-md shrink-0">
                  <span className="text-white font-bold text-sm">{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                </div>
              </div>

              <CardContent className="p-3">
                <nav className="space-y-5">
                  {sidebarSections.map((section) => (
                    <div key={section.title}>
                      {/* Section header */}
                      <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                        {section.title}
                      </p>
                      <div className="space-y-0.5">
                        {section.items.map((link) => {
                          const isActive = !link.isRoute && activeTab === link.id;
                          return (
                            <button
                              key={link.id}
                              onClick={() => link.isRoute ? navigate(`/${link.id}`) : setActiveTab(link.id)}
                              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm ${
                                isActive
                                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-[#277310] shadow-sm ring-1 ring-[#277310]/20'
                                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                  isActive ? 'bg-[#277310]/10' : 'bg-slate-100 group-hover:bg-slate-200'
                                }`}>
                                  <link.icon className={`w-4 h-4 ${isActive ? 'text-[#277310]' : 'text-slate-500'}`} />
                                </div>
                                {link.label}
                              </div>
                              {link.badge !== undefined && link.badge > 0 && (
                                <Badge className="bg-red-500 hover:bg-red-600 px-2 py-0.5 rounded-full text-white border-none shadow-sm text-xs">
                                  {link.badge}
                                </Badge>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Logout */}
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                        <LogOut className="w-4 h-4 text-red-500" />
                      </div>
                      Secure Logout
                    </button>
                  </div>
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 flex-1 overflow-y-visible">
            <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Welcome */}
                <div className="bg-white/60 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/50 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#277310] opacity-5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                  <div className="relative z-10 text-center md:text-left">
                    <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 font-['Poppins'] tracking-tight">
                      Welcome back, {user?.firstName}! 👋
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg">
                      Ready to cross items off your to-do list?
                    </p>
                  </div>
                  <Button 
                    onClick={() => navigate('/request-errand')}
                    size="lg"
                    className="relative z-10 bg-[#277310] hover:bg-[#1e5a10] text-white shadow-lg shadow-[#277310]/30 rounded-2xl px-8 h-14 text-base font-semibold group hover:scale-[1.02] transition-transform"
                  >
                    <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                    New Errand
                  </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

                {/* Quick Action Banner */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="rounded-3xl p-1 bg-gradient-to-r from-[#277310] via-emerald-600 to-teal-500 shadow-xl"
                >
                  <div className="bg-white/10 backdrop-blur-xl p-6 sm:p-8 rounded-[22px] flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>
                    <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl pointer-events-none"></div>
                    
                    <div className="text-center sm:text-left relative z-10">
                      <h3 className="text-2xl font-bold text-white font-['Poppins']">
                        Need something fast?
                      </h3>
                      <p className="text-emerald-50 mt-1 font-medium text-lg">
                        Mark your errand as an <strong className="text-white">Emergency</strong> for priority routing.
                      </p>
                    </div>
                    <Button onClick={() => navigate('/request-errand')} className="relative z-10 bg-white text-[#277310] hover:bg-slate-50 rounded-xl px-8 h-12 font-bold shadow-lg hover:shadow-xl transition-all whitespace-nowrap">
                      Request Now
                    </Button>
                  </div>
                </motion.div>

                {/* Active Orders */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 font-['Poppins'] flex items-center gap-2">
                      <Clock className="w-6 h-6 text-amber-500" />
                      Active Orders
                    </h2>
                    <Link to="/order-history" className="text-[#277310] font-medium hover:underline flex items-center gap-1 group">
                      View All <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>

                  {activeOrders.length > 0 ? (
                    <div className="grid sm:grid-cols-2 gap-6">
                      {activeOrders.slice(0, 4).map((order) => (
                        <OrderCard key={order.id} order={order} />
                      ))}
                    </div>
                  ) : (
                    <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50 rounded-3xl">
                      <CardContent className="p-12 text-center">
                        <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-6">
                          <Package className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">
                          No active orders
                        </h3>
                        <p className="text-slate-500 mb-8 max-w-sm mx-auto">
                          Take a break, or request a new errand if you need something done!
                        </p>
                        <Button onClick={() => navigate('/request-errand')} className="bg-[#277310] hover:bg-[#1e5a10] rounded-xl font-semibold h-12 px-8">
                          <Plus className="w-5 h-5 mr-2" />
                          Request an Errand
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Recent Completed Orders */}
                {completedOrders.length > 0 && (
                  <div className="pt-4">
                    <h2 className="text-xl font-bold text-slate-900 font-['Poppins'] mb-6 flex items-center gap-2">
                      <Star className="w-5 h-5 text-emerald-500" />
                      Recently Completed
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-6">
                      {completedOrders.slice(0, 2).map((order) => (
                        <OrderCard key={order.id} order={order} />
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div 
                key="notifications"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between mb-2">
                  <h1 className="text-3xl font-bold text-slate-900 font-['Poppins']">
                    Notifications
                  </h1>
                  {unreadCount > 0 && (
                    <Button variant="outline" className="rounded-xl text-[#277310] border-[#277310]/30 bg-green-50/50 hover:bg-green-50">
                      Mark all as read
                    </Button>
                  )}
                </div>

                {notifications.length > 0 ? (
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        <Card className={`border-none shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden rounded-2xl ${notification.isRead ? 'bg-white/80' : 'bg-green-50/30'}`}>
                          <div className={`w-1.5 h-full absolute left-0 top-0 ${notification.isRead ? 'bg-transparent' : 'bg-gradient-to-b from-[#277310] to-emerald-400'}`}></div>
                          <CardContent className="p-5 pl-7">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notification.isRead ? 'bg-slate-100' : 'bg-emerald-100 text-emerald-600'}`}>
                                  {notification.isRead ? <Bell className="w-5 h-5 text-slate-400" /> : <Bell className="w-5 h-5 text-[#277310]" />}
                                </div>
                                <div>
                                  <h4 className={`font-bold ${notification.isRead ? 'text-slate-700' : 'text-slate-900'}`}>
                                    {notification.title}
                                  </h4>
                                  <p className="text-slate-600 mt-1">{notification.message}</p>
                                  <p className="text-xs font-medium text-slate-400 mt-2 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(notification.createdAt).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              {!notification.isRead && (
                                <Badge className="bg-[#277310] shrink-0 border-none shadow-sm">New</Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50 rounded-3xl">
                    <CardContent className="p-16 text-center">
                      <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <Bell className="w-10 h-10 text-slate-300" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">
                        You're all caught up!
                      </h3>
                      <p className="text-slate-500 max-w-sm mx-auto">
                        There are no new notifications at the moment. We'll alert you when there's an update on your orders.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}

            {activeTab === 'wallet' && (
              <motion.div
                key="wallet"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="mb-6 flex items-center justify-between">
                  <h1 className="text-3xl font-bold text-slate-900 font-['Poppins']">
                    Your Wallet
                  </h1>
                </div>
                <WalletDashboard />
              </motion.div>
            )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  </div>
</motion.div>
);
};

export default UserDashboard;
