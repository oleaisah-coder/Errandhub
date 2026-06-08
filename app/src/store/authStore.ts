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
  loginWithGoogle: (role?: 'user' | 'runner') => Promise<{success: boolean; error?: string}>;
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
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            localStorage.setItem('token', session.access_token);
            set((state) => ({
              session,
              token: session.access_token,
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
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!useAuthStore.getState().isInitialized) {
            if (session) {
              set({
                session,
                token: session.access_token,
                isAuthenticated: true,
                isLoading: false,
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
          if (!useAuthStore.getState().isInitialized) {
            set({ session: null, isLoading: false, isInitialized: true });
          }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log(`Auth event: ${event}`);

          try {
            if (session && session.user) {
              set({ session, token: session.access_token, isAuthenticated: true });

              let { data: profile, error: profileError } = await supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .single();

              if (profileError || !profile) {
                console.log('Profile not found, auto-creating from social login/signup...');
                const metadata = session.user.user_metadata;
                const fullName = metadata?.full_name || '';
                const parts = fullName.split(' ');
                const firstName = metadata?.firstName || metadata?.first_name || parts[0] || 'User';
                const lastName = metadata?.lastName || metadata?.last_name || parts.slice(1).join(' ') || '';
                
                const chosenRole = localStorage.getItem('oauth_role') || 'user';
                localStorage.removeItem('oauth_role');

                const newProfile = {
                  id: session.user.id,
                  email: session.user.email as string,
                  first_name: firstName,
                  last_name: lastName,
                  phone: metadata?.phone || '',
                  role: chosenRole,
                  is_active: true
                };

                const { data: upsertedProfile, error: upsertError } = await supabase
                  .from('users')
                  .upsert(newProfile, { onConflict: 'id' })
                  .select()
                  .single();

                if (!upsertError && upsertedProfile) {
                  profile = upsertedProfile;
                  profileError = null;
                } else {
                  console.warn('Auto-profile upsert failed:', upsertError?.message);
                }
              }

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
            set({ isLoading: false, isInitialized: true });
          }
        });

        return { unsubscribe: subscription.unsubscribe.bind(subscription) };
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            set({ isLoading: false });
            let errorMsg = error.message;
            if (errorMsg.toLowerCase().includes('invalid login credentials')) {
              errorMsg = 'Invalid email or password';
            } else if (errorMsg.toLowerCase().includes('email not confirmed')) {
              errorMsg = 'Please confirm your email. Check your inbox, or disable email confirmation in Supabase dashboard.';
            }
            return { success: false, error: errorMsg };
          }

          if (data.session && data.user) {
            const { data: profile } = await supabase
              .from('users')
              .select('*')
              .eq('id', data.user.id)
              .single();

            const metadata = data.user.user_metadata;

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
                firstName: metadata?.firstName || 'User',
                lastName: metadata?.lastName || '',
                role: metadata?.role || 'user',
                phone: metadata?.phone || '',
              }) as unknown as User, 
              token: data.session.access_token, 
              isAuthenticated: true, 
              isLoading: false,
              isInitialized: true
            });

            return { success: true };
          }
          
          set({ isLoading: false });
          return { success: false, error: 'Login succeeded but session missing.' };
        } catch (error: any) {
          console.error('Login error in store:', error);
          set({ isLoading: false });
          return { success: false, error: error.message || 'Login failed' };
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

      loginWithGoogle: async (role?: 'user' | 'runner') => {
        set({ isLoading: true });
        try {
          if (role) {
            localStorage.setItem('oauth_role', role);
          }
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: window.location.origin + '/dashboard'
            }
          });
          if (error) {
            set({ isLoading: false });
            return { success: false, error: error.message };
          }
          return { success: true };
        } catch (error: any) {
          console.error('Google login error in store:', error);
          set({ isLoading: false });
          return { success: false, error: error.message || 'Crashed during login execution' };
        }
      },

      logout: async () => {
        await supabase.auth.signOut();
        localStorage.removeItem('token');
        localStorage.removeItem('auth-storage');
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
