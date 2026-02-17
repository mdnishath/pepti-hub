import { create } from 'zustand';
import { authAPI, type User } from '@/lib/api';
import Cookies from 'js-cookie';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  _hasHydrated: boolean;

  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (firstName: string, lastName: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  initialize: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  _hasHydrated: false,

  setHasHydrated: (hasHydrated: boolean) => {
    set({ _hasHydrated: hasHydrated });
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.login({ email, password });

      console.log('🔵 Store: Login successful, setting auth state');

      // Set cookie for middleware to access (server-side)
      Cookies.set('auth_token', response.accessToken, {
        path: '/',
        expires: 7, // 7 days
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      });

      // Set user data in cookie for client-side access
      Cookies.set('auth_user', JSON.stringify(response.user), {
        path: '/',
        expires: 7,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      });

      set({
        user: response.user,
        token: response.accessToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      console.error('🔵 Store: Login failed:', errorMessage);
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage,
      });
      return false;
    }
  },

  register: async (firstName: string, lastName: string, email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.register({
        firstName,
        lastName,
        email,
        password,
      });

      console.log('🔵 Store: Registration successful, setting auth state');

      // Set cookie for middleware to access (server-side)
      Cookies.set('auth_token', response.accessToken, {
        path: '/',
        expires: 7, // 7 days
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      });

      // Set user data in cookie for client-side access
      Cookies.set('auth_user', JSON.stringify(response.user), {
        path: '/',
        expires: 7,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      });

      set({
        user: response.user,
        token: response.accessToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      console.error('🔵 Store: Registration failed:', errorMessage);
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage,
      });
      return false;
    }
  },

  logout: () => {
    console.log('🔵 Store: Logging out, clearing auth state');

    // Remove cookies with path to ensure they're properly removed
    Cookies.remove('auth_token', { path: '/' });
    Cookies.remove('auth_user', { path: '/' });

    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  clearError: () => {
    set({ error: null });
  },

  initialize: async () => {
    console.log('🔵 Store: Initializing from cookies');
    console.log('🔵 Store: All cookies:', document.cookie);

    // Load auth state from cookies
    const token = Cookies.get('auth_token');
    const userStr = Cookies.get('auth_user');

    console.log('🔵 Store: Token from Cookies.get():', token);
    console.log('🔵 Store: User from Cookies.get():', userStr);

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log('🔵 Store: Found auth in cookies, restoring state');
        set({
          user,
          token,
          isAuthenticated: true,
          _hasHydrated: true,
        });
      } catch (error) {
        console.error('🔵 Store: Failed to parse user from cookie', error);
        Cookies.remove('auth_token', { path: '/' });
        Cookies.remove('auth_user', { path: '/' });
        set({ _hasHydrated: true });
      }
    } else if (token && !userStr) {
      // We have a token but no user data - fetch it from the API
      console.log('🔵 Store: Token found but no user data, fetching from API');
      try {
        const user = await authAPI.getProfile();
        console.log('🔵 Store: User fetched from API, updating cookies');

        // Store user in cookie for next time
        Cookies.set('auth_user', JSON.stringify(user), {
          path: '/',
          expires: 7,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production'
        });

        set({
          user,
          token,
          isAuthenticated: true,
          _hasHydrated: true,
        });
      } catch (error) {
        console.error('🔵 Store: Failed to fetch user from API', error);
        // Token is invalid, clear it
        Cookies.remove('auth_token', { path: '/' });
        Cookies.remove('auth_user', { path: '/' });
        set({ _hasHydrated: true });
      }
    } else {
      console.log('🔵 Store: No auth found in cookies');
      set({ _hasHydrated: true });
    }
  },
}));
