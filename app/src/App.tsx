import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { useEffect } from 'react';
import { useAuthStore } from '@/store';
import { Package } from 'lucide-react';


// Pages
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import UserDashboard from '@/pages/UserDashboard';
import RunnerDashboard from '@/pages/RunnerDashboard';
import AdminDashboard from '@/pages/AdminDashboard';

import RequestErrandPage from '@/pages/RequestErrandPage';
import TrackOrderPage from '@/pages/TrackOrderPage';
import OrderSummaryPage from '@/pages/OrderSummaryPage';
import ContactPage from '@/pages/ContactPage';
import HowItWorksPage from '@/pages/HowItWorksPage';
import ServicesPage from '@/pages/ServicesPage';
import ChatPage from '@/pages/ChatPage';
import ProfilePage from '@/pages/ProfilePage';
import OrderHistoryPage from '@/pages/OrderHistoryPage';
import WalletPage from '@/pages/WalletPage';
import MobileNav from '@/components/MobileNav';

// Error Boundary for catching fatal route crashes
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-50 text-red-900 rounded-3xl border border-red-200 m-8">
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="text-sm opacity-80">{this.state.error?.message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('user' | 'runner' | 'admin')[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading, isInitialized } = useAuthStore();
  const location = useLocation();
  
  // Developer Bypass Logic for local testing
  const urlParams = new URLSearchParams(location.search);
  const isBypass = urlParams.get('bypass') === 'true' || localStorage.getItem('DEV_BYPASS') === 'true';

  if (isBypass) {
    return <>{children}</>;
  }

  // Show nothing until Supabase session is resolved
  if (!isInitialized || isLoading) {
    return (
      <div className="fixed inset-0 bg-[#F8FAFC] flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#277310] to-[#1e5a10] shadow-lg shadow-[#277310]/30">
            <Package className="h-7 w-7 text-white" />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white border-2 border-[#277310] animate-pulse" />
          </div>
          <p className="text-sm font-semibold text-slate-500 tracking-wide">Verifying session…</p>
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    const defaultDash = user.role === 'admin' ? '/admin-dashboard' : 
                         user.role === 'runner' ? '/runner-dashboard' : '/dashboard';
    return <Navigate to={defaultDash} replace />;
  }

  return <>{children}</>;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="flex-1 flex flex-col min-h-screen"
      >
        <Routes location={location}>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/track-order" element={<TrackOrderPage />} />

          {/* User Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <UserDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/request-errand"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <RequestErrandPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/order-summary"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <OrderSummaryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['user', 'runner', 'admin']}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/order-history"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <OrderHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat/:orderId"
            element={
              <ProtectedRoute allowedRoles={['user', 'runner']}>
                <ChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wallet"
            element={
              <ProtectedRoute allowedRoles={['user', 'runner']}>
                <WalletPage />
              </ProtectedRoute>
            }
          />

          {/* Runner Protected Routes */}
          <Route
            path="/runner-dashboard"
            element={
              <ProtectedRoute allowedRoles={['runner']}>
                <ErrorBoundary>
                  <RunnerDashboard />
                </ErrorBoundary>
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin', 'user', 'runner']}>
                <ErrorBoundary>
                  <AdminDashboard />
                </ErrorBoundary>
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <MobileNav />
      </motion.div>
    </AnimatePresence>
  );
};

function App() {
  const { subscribeToAuthChanges, initAuth, isInitialized } = useAuthStore();

  useEffect(() => {
    // Initialize Auth eagerly
    const startAuth = async () => {
      await initAuth();
      subscribeToAuthChanges();
    };
    
    startAuth();

    // Resilient fail-safe: unblock the UI if session resolution hangs
    const timer = setTimeout(() => {
      if (!useAuthStore.getState().isInitialized) {
        console.warn('Auth initialization timed out, forcing render...');
        useAuthStore.setState({ isInitialized: true, isLoading: false });
      }
    }, 3000);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // session === undefined means we haven't resolved the initial session yet
  if (!isInitialized) {
    return (
      <div className="fixed inset-0 bg-[#F8FAFC] flex items-center justify-center" role="status" aria-label="Loading">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center gap-5"
        >
          {/* Brand mark */}
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#277310] to-[#1e5a10] shadow-xl shadow-[#277310]/30">
            <Package className="h-8 w-8 text-white" />
          </div>

          {/* Animated dots */}
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-2 h-2 rounded-full bg-[#277310]"
                animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }}
              />
            ))}
          </div>

          <p className="text-sm font-semibold text-slate-500 tracking-wide">Loading ErrandHub…</p>
        </motion.div>
      </div>
    );
  }

  return (
    <Router>
      <AnimatedRoutes />
      <Toaster 
        position="top-right" 
        richColors 
        closeButton
        expand={true}
      />
    </Router>
  );
}

export default App;
