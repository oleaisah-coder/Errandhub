import { Link, useLocation } from 'react-router-dom';
import { Home, Wallet, User, Plus, Bell, BarChart2, Users, Shield, History } from 'lucide-react';
import { useAuthStore } from '@/components/store';

export default function MobileNav() {
  const location = useLocation();
  const { user } = useAuthStore();

  // Hide nav on pages where it overlaps action buttons or is unnecessary
  const hiddenPaths = ['/', '/request-errand', '/order-summary', '/track-order', '/chat'];
  if (!user || user.role === 'runner' || hiddenPaths.some(p => p === '/' ? location.pathname === '/' : location.pathname.startsWith(p))) return null;

  let leftItems = [];
  let rightItems = [];
  let centerAction = null;

  if (user.role === 'admin') {
    leftItems = [
      { id: 'stats', label: 'Stats', icon: BarChart2, path: '/admin-dashboard' },
      { id: 'users', label: 'Users', icon: Users, path: '/users' },
    ];
    rightItems = [
      { id: 'finances', label: 'Finances', icon: Wallet, path: '/finances' },
      { id: 'settings', label: 'Settings', icon: Shield, path: '/profile' },
    ];
    centerAction = { icon: Bell, path: '/admin-dashboard', bg: 'bg-[#277310]' };
  } else {
    // default to user
    leftItems = [
      { id: 'dashboard', label: 'Home', icon: Home, path: '/dashboard' },
      { id: 'history', label: 'History', icon: History, path: '/order-history' },
    ];
    rightItems = [
      { id: 'wallet', label: 'Wallet', icon: Wallet, path: '/wallet' },
      { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
    ];
    centerAction = { icon: Plus, path: '/request-errand', bg: 'bg-[#277310]' };
  }

  const renderItem = (item: any) => {
    // Strict comparison for root dash, loose for other paths
    const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.includes(item.path));
    
    return (
      <Link
        key={item.id}
        to={item.path}
        className={`flex flex-col items-center justify-center w-full h-full space-y-1 relative transition-colors pt-2 pb-1 ${
          isActive ? 'text-[#277310]' : 'text-slate-400 hover:text-slate-900'
        }`}
      >
        <item.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${isActive ? 'fill-[#277310]/10' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
        <span className={`text-[10px] tracking-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
          {item.label}
        </span>
        {/* Active Indicator Dash */}
        {isActive && (
          <div className="absolute bottom-0 w-4 h-1 rounded-t-full bg-[#277310]" />
        )}
      </Link>
    );
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] lg:hidden pointer-events-none">
      <div className="pointer-events-auto bg-white rounded-t-[32px] shadow-[0_-8px_30px_rgb(0,0,0,0.06)] px-2 pb-safe border-t border-slate-100/50">
        <div className="flex items-center justify-between h-[72px] sm:h-20 px-2 sm:px-6 relative">
          
          {/* Left Navigation Icons */}
          <div className="flex-1 flex items-center justify-around h-full">
            {leftItems.map(renderItem)}
          </div>
          
          {/* Center Space Reserved for FAB overlay */}
          <div className="w-20 shrink-0 flex justify-center items-center h-full">
          </div>

          {/* Right Navigation Icons */}
          <div className="flex-1 flex items-center justify-around h-full">
            {rightItems.map(renderItem)}
          </div>

          {/* Premium Floating Center Button (FAB) */}
          <Link
            to={centerAction.path}
            className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/3 flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full text-white shadow-[0_8px_20px_-6px_rgba(39,115,16,0.6)] hover:shadow-[0_8px_25px_-4px_rgba(39,115,16,0.8)] hover:-translate-y-1/2 transition-all duration-300 ${centerAction.bg} ring-[6px] ring-white`}
          >
            <centerAction.icon className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.5} />
          </Link>
          
        </div>
      </div>
    </div>
  );
}
