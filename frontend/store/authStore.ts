import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';

interface Address {
  _id?: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'user' | 'admin';
  avatar?: string;
  addresses: Address[];
  wishlist: string[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  requestOtp: (email: string) => Promise<{ success: boolean; isNewUser: boolean }>;
  verifyOtp: (email: string, otp: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  addAddress: (address: Address) => Promise<void>;
  updateAddress: (id: string, address: Address) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      requestOtp: async (email: string) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/otp/request', { email });
          return data;
        } finally {
          set({ isLoading: false });
        }
      },

      verifyOtp: async (email: string, otp: string, name?: string) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/otp/verify', { email, otp, name });
          localStorage.setItem('bm_token', data.token);
          set({ user: data.user, token: data.token, isAuthenticated: true });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch {}
        localStorage.removeItem('bm_token');
        set({ user: null, token: null, isAuthenticated: false });
      },

      fetchMe: async () => {
        try {
          const { data } = await api.get('/auth/me');
          set({ user: data.user, isAuthenticated: true });
        } catch {
          set({ user: null, token: null, isAuthenticated: false });
        }
      },

      updateProfile: async (profileData) => {
        const { data } = await api.put('/auth/profile', profileData);
        set({ user: data.user });
      },

      toggleWishlist: async (productId) => {
        const { data } = await api.post(`/auth/wishlist/${productId}`);
        set((state) => ({
          user: state.user ? { ...state.user, wishlist: data.wishlist } : null,
        }));
      },

      addAddress: async (address) => {
        const { data } = await api.post('/auth/addresses', address);
        set((state) => ({
          user: state.user ? { ...state.user, addresses: data.addresses } : null,
        }));
      },

      updateAddress: async (id, address) => {
        const { data } = await api.put(`/auth/addresses/${id}`, address);
        set((state) => ({
          user: state.user ? { ...state.user, addresses: data.addresses } : null,
        }));
      },

      deleteAddress: async (id) => {
        const { data } = await api.delete(`/auth/addresses/${id}`);
        set((state) => ({
          user: state.user ? { ...state.user, addresses: data.addresses } : null,
        }));
      },
    }),
    {
      name: 'bm_auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);
