import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface CartItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    price: number;
    deliveryCharge?: number;
    images: { url: string }[];
    stock: number;
    slug: string;
  };
  quantity: number;
  price?: number;
  deliveryCharge?: number;
  variant?: { name: string; label: string; price?: number };
}

interface CartState {
  items: CartItem[];
  isLoading: boolean;
  isOpen: boolean;
  lastFetchedAt: number;

  // Computed
  itemCount: () => number;
  subtotal: () => number;
  deliveryCharge: () => number;
  total: () => number;

  // Actions
  fetchCart: (force?: boolean) => Promise<void>;
  addItem: (productId: string, quantity?: number, variant?: object) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      isOpen: false,
      lastFetchedAt: 0,

      itemCount: () => get().items.reduce((acc, item) => acc + item.quantity, 0),
      subtotal: () =>
        get().items.reduce((acc, item) => {
          const itemPrice = item.price ?? (item.variant?.price || item.product?.price || 0);
          return acc + itemPrice * item.quantity;
        }, 0),
      deliveryCharge: () =>
        get().items.reduce((acc, item) => {
          const itemDeliveryCharge = item.deliveryCharge ?? (item.product?.deliveryCharge || 0);
          return acc + itemDeliveryCharge * item.quantity;
        }, 0),
      total: () => get().subtotal() + get().deliveryCharge(),

      fetchCart: async (force = false) => {
        const lastFetchedAt = get().lastFetchedAt;
        const now = Date.now();
        if (!force && lastFetchedAt && now - lastFetchedAt < 30000) {
          return;
        }

        set({ isLoading: true });
        try {
          const { data } = await api.get('/cart');
          set({ items: data.cart?.items || [], lastFetchedAt: Date.now() });
        } catch {
          set({ items: [] });
        } finally {
          set({ isLoading: false });
        }
      },

      addItem: async (productId, quantity = 1, variant) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/cart', { productId, quantity, variant });
          set({ items: data.cart?.items || [], lastFetchedAt: Date.now() });
          toast.success('Added to cart!');
          get().openCart();
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Failed to add to cart');
        } finally {
          set({ isLoading: false });
        }
      },

      updateItem: async (itemId, quantity) => {
        try {
          const { data } = await api.put(`/cart/${itemId}`, { quantity });
          set({ items: data.cart?.items || [], lastFetchedAt: Date.now() });
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Failed to update cart');
        }
      },

      removeItem: async (itemId) => {
        try {
          const { data } = await api.delete(`/cart/${itemId}`);
          set({ items: data.cart?.items || [], lastFetchedAt: Date.now() });
          toast.success('Item removed');
        } catch {
          toast.error('Failed to remove item');
        }
      },

      clearCart: async () => {
        try {
          await api.delete('/cart');
          set({ items: [], lastFetchedAt: Date.now() });
        } catch {}
      },

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
    }),
    {
      name: 'bm_cart',
      partialize: (state) => ({ items: state.items, lastFetchedAt: state.lastFetchedAt }),
    }
  )
);
