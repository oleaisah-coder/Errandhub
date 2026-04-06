import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';
import type { User } from '@/types';

export interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'user' | 'runner';
}

interface AuthState {
  user: User | null;
  session: Session | null | undefined; // undefined = loading, null = no session, Session = authenticated
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  initAuth: () => Promise<void>;
  subscribeToAuthChanges: () => { unsubscribe: () => void };
  login: (email: string, password: string) => Promise<{success: boolean; error?: string}>;
  signup: (data: SignupData) => Promise<{success: boolean; error?: string}>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: undefined, // undefined signals "still loading"
      token: null,
      isAuthenticated: false,
      isLoading: true,
      isInitialized: false,

      initAuth: async () => {
        // Eagerly fetch the session so we can set isInitialized immediately
        // without waiting for onAuthStateChange to fire.
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            localStorage.setItem('token', session.access_token);
            // Partially update session so ProtectedRoute knows auth is ready
            set((state) => ({
              session,
              token: session.access_token,
              // Only override isAuthenticated/user if they haven't been set yet
              // (the onAuthStateChange listener will do a full profile sync)
              isAuthenticated: state.isAuthenticated || true,
            }));
          } else {
            set({ session: null, isAuthenticated: false, user: null, token: null, isInitialized: true, isLoading: false });
          }
        } catch (err) {
          console.warn('getSession failed in initAuth:', err);
          set({ session: null, isInitialized: true, isLoading: false });
        }
      },

      subscribeToAuthChanges: () => {
        // ── Step 1: Eagerly resolve the current session so the UI never hangs ──
        // onAuthStateChange fires INITIAL_SESSION asynchronously. Calling getSession()
        // first guarantees that isInitialized is set even if the listener is slow.
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!useAuthStore.getState().isInitialized) {
            // Only apply if the listener hasn't already run
            if (session) {
              set({
                session,
                token: session.access_token,
                isAuthenticated: true,
                isLoading: false,
                // Don't set isInitialized yet – let the full listener do the profile fetch
              });
            } else {
              set({
                session: null,
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
                isInitialized: true,
              });
            }
          }
        }).catch(() => {
          // Network error – fail safe: unblock the UI
          if (!useAuthStore.getState().isInitialized) {
            set({ session: null, isLoading: false, isInitialized: true });
          }
        });

        // ── Step 2: Full auth state listener with profile sync ──
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log(`Auth event: ${event}`);

          try {
            if (session && session.user) {
              // Always update session reference immediately
              set({ session, token: session.access_token, isAuthenticated: true });

              // Re-fetch profile to get role/display data from the DB
              const { data: profile, error: profileError } = await supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .single();

              if (profileError) {
                console.warn('Profile fetch failed during auth transition:', profileError.message);
              }

              const userState: any = profile
                ? {
                    id: profile.id,
                    firstName: profile.first_name,
                    lastName: profile.last_name,
                    email: profile.email,
                    phone: profile.phone,
                    role: profile.role || 'user',
                    address: profile.address,
                    city: profile.city,
                    state: profile.state,
                  }
                : {
                    id: session.user.id,
                    email: session.user.email as string,
                    firstName: session.user.user_metadata?.firstName || 'User',
                    lastName: session.user.user_metadata?.lastName || '',
                    role: session.user.user_metadata?.role || 'user',
                    phone: session.user.user_metadata?.phone || '',
                  };

              set({
                user: userState as User,
                token: session.access_token,
                session,
                isAuthenticated: true,
                isLoading: false,
                isInitialized: true,
              });
            } else {
              // Signed out or session expired
              set({
                user: null,
                session: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
                isInitialized: true,
              });
            }
          } catch (error) {
            console.error('Fatal error in auth store listener:', error);
            // Fail-safe: always unblock the UI
            set({ isLoading: false, isInitialized: true });
          }
        });

        return { unsubscribe: subscription.unsubscribe.bind(subscription) };
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          // Native Supabase Login
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            set({ isLoading: false });
            let errorMsg = error.message;
            if (errorMsg.toLowerCase().includes('invalid login credentials')) {
              // Check if user actually exists to fulfill the exact string matching requested
              const { data: userCheck } = await supabase.from('users').select('id').eq('email', email).single();
              if (!userCheck) {
                errorMsg = 'Account not found';
              } else {
                errorMsg = 'Incorrect password';
              }
            } else if (errorMsg.toLowerCase().includes('email not confirmed')) {
              errorMsg = 'Please confirm your email address to log in. Check your inbox for a verification link.';
            }
            return { success: false, error: errorMsg };
          }

          if (data.session && data.user) {
            try {
              // Sync/Fetch native profile from Supabase
              const { data: profile } = await supabase
                .from('users')
                .select('*')
                .eq('id', data.user.id)
                .single();

              // Wait for onAuthStateChange to fire or manually set to be safe
              // This ensures the store is in sync BEFORE the redirect.
              set({ 
                user: (profile ? {
                  id: profile.id,
                  firstName: profile.first_name,
                  lastName: profile.last_name,
                  email: profile.email,
                  role: profile.role || 'user',
                  phone: profile.phone || '',
                } : {
                  id: data.user.id,
                  email: data.user.email as string,
                  firstName: data.user.user_metadata?.firstName || 'User',
                  lastName: data.user.user_metadata?.lastName || '',
                  role: data.user.user_metadata?.role || 'user',
                  phone: data.user.user_metadata?.phone || '',
                }) as unknown as User, 
                token: data.session.access_token, 
                isAuthenticated: true, 
                isLoading: false,
                isInitialized: true
              });

              // Verify session is persistable as requested
              // Use a timeout to prevent infinite spinning if getSession is slow
              const verifiedSession = await Promise.race([
                supabase.auth.getSession().then(res => res.data.session),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Session timeout')), 2000))
              ]).catch(() => data.session); // Fallback to original session if verification times out

              if (!verifiedSession) {
                console.warn('Session verification failed, but continuing with initial session');
              }

              return { success: true };
            } catch (innerError: any) {
              console.error('Error during post-login sync:', innerError);
              // Still return success as auth was successful, listener will handle state eventually
              return { success: true };
            }
          }
          
          set({ isLoading: false });
          return { success: false, error: 'Login succeeded but session missing.' };
        } catch (error: any) {
          console.error('Login error in store:', error);
          set({ isLoading: false });
          return { success: false, error: error.message || 'Crashed during login execution' };
        }
      },

      signup: async (signUpData: SignupData) => {
        set({ isLoading: true });
        try {
          // Native Supabase Signup
          const { data, error } = await supabase.auth.signUp({
            email: signUpData.email,
            password: signUpData.password,
            options: {
              data: {
                firstName: signUpData.firstName,
                lastName: signUpData.lastName,
                phone: signUpData.phone,
                role: signUpData.role
              }
            }
          });

          if (error) {
            set({ isLoading: false });
            return { success: false, error: error.message };
          }

          if (data.user) {
            // Create user profile in 'users' table
            await supabase.from('users').upsert({
              id: data.user.id,
              email: signUpData.email,
              first_name: signUpData.firstName,
              last_name: signUpData.lastName,
              phone: signUpData.phone,
              role: signUpData.role,
              is_active: true
            }, { onConflict: 'id' });

            if (data.session) {
               localStorage.setItem('token', data.session.access_token);
               set({ 
                 user: {
                   id: data.user.id,
                   email: signUpData.email,
                   firstName: signUpData.firstName,
                   lastName: signUpData.lastName,
                   phone: signUpData.phone,
                   role: signUpData.role,
                 } as unknown as User, 
                 token: data.session.access_token, 
                 isAuthenticated: true, 
                 isLoading: false 
               });
            } else {
               // Email confirmation required scenario
               set({ isLoading: false });
               return { 
                 success: true, 
                 error: 'Signup successful! Please check your email and click the confirmation link to activate your account.' 
               };
            }
            return { success: true };
          }
          
          set({ isLoading: false });
          return { success: false, error: 'Signup succeeded but session blocked. Try logging in.' };
        } catch (error: any) {
          console.error('Signup error in store:', error);
          set({ isLoading: false });
          return { success: false, error: error.message || 'Server error' };
        }
      },

      logout: async () => {
        await supabase.auth.signOut();
        localStorage.removeItem('token');
        set({ user: null, session: null, token: null, isAuthenticated: false });
      },

      updateProfile: (data: Partial<User>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        }));
      },

      setUser: (user: User) => {
        set({ user });
      },
    }),
    {
      name: 'auth-storage',
      // session is NOT persisted – it's always re-fetched live from Supabase
      // isInitialized and isLoading are transient, not persisted
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);
