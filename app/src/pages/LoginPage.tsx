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
  const { login, loginWithGoogle } = useAuthStore();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const response = await loginWithGoogle();
      if (response && !response.success) {
        toast.error(response.error || 'Failed to sign in with Google');
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during Google sign in');
    } finally {
      setIsLoading(false);
    }
  };

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

          {/* Social Sign In */}
          <div className="mt-5">
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink mx-4 text-gray-400 text-xs uppercase font-medium">Or continue with</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={handleGoogleLogin}
              className="w-full h-12 mt-3 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium flex items-center justify-center gap-3 rounded-xl transition-all"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>
          </div>

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
