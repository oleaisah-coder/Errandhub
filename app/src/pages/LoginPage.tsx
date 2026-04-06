import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuthStore } from '@/store';
import { toast } from 'sonner';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'user' | 'runner' | 'admin' | null>(null);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const cleanEmail = email.trim();
      const cleanPassword = password.trim(); // Prevent trailing space on copy-paste from hashing improperly
      
      const response = await login(cleanEmail, cleanPassword);
      if (response && response.success) {
        // Redirection logic follows - ensured only after session is confirmed
        const state = useAuthStore.getState();
        if (state.isAuthenticated && state.user) {
          toast.success('Welcome back!');
          const user = state.user;
          if (user.role === 'user') navigate('/dashboard');
          else if (user.role === 'runner') navigate('/runner-dashboard');
          else if (user.role === 'admin') navigate('/admin-dashboard');
        } else {
          // If state is not updated yet, wait a tiny bit or retry
          setTimeout(() => {
            const finalState = useAuthStore.getState();
            if (finalState.user) {
               if (finalState.user.role === 'user') navigate('/dashboard');
               else if (finalState.user.role === 'runner') navigate('/runner-dashboard');
               else if (finalState.user.role === 'admin') navigate('/admin-dashboard');
            }
          }, 100);
        }
      } else {
        toast.error(response?.error || 'Invalid email or password');
      }
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Demo login handlers
  const handleDemoLogin = (role: 'user' | 'runner' | 'admin') => {
    const credentials = {
      user: { email: 'user@errandhub.com', password: 'user123' },
      runner: { email: 'runner@errandhub.com', password: 'runner123' },
      admin: { email: 'oleaisah@gmail.com', password: 'Theophilus' },
    };
    const cred = credentials[role];
    setEmail(cred.email);
    setPassword(cred.password);
    setSelectedRole(role);
    toast.info(`${role.charAt(0).toUpperCase() + role.slice(1)} credentials filled`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d2f2d4]/30 via-white to-[#d2f2d4]/20 flex items-center justify-center p-4">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-[10%] w-72 h-72 bg-[#277310]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-[10%] w-96 h-96 bg-[#0ea018]/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="text-center mb-8"
          >
            <Link to="/" className="inline-flex items-center gap-2 mb-4">
              <div className="w-12 h-12 bg-[#277310] rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-[#277310] font-['Poppins']">
                ErrandHub
              </span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 font-['Poppins']">
              Welcome Back
            </h1>
            <p className="text-gray-500 mt-2">
              Sign in to continue to your account
            </p>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">
                  Remember me
                </Label>
              </div>
              <span className="text-sm text-gray-400 cursor-not-allowed">
                Forgot password?
              </span>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-[#277310] hover:bg-[#1e5a10] text-white font-medium"
            >
              {isLoading ? (
                <span className="text-sm font-medium">Processing...</span>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </form>

          {/* Demo Logins */}
          <div className="mt-6 pt-6 border-t">
            <p className="text-center text-sm text-gray-500 mb-4">Quick Demo Login</p>
            <div className="grid grid-cols-3 gap-2">
              {(['user', 'runner', 'admin'] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleDemoLogin(role)}
                  className={`px-3 py-2 text-xs font-medium transition-all capitalize rounded-lg ${
                    selectedRole === role 
                      ? 'bg-[#277310] text-white shadow-md scale-105' 
                      : 'text-[#277310] bg-[#277310]/10 hover:bg-[#277310]/20'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-gray-600 mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-[#277310] font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>

        {/* Back to Home */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-6"
        >
          <Link to="/" className="text-sm text-gray-500 hover:text-[#277310] transition-colors">
            ← Back to home
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
