'use client';

import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { ShieldX, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [authState, setAuthState] = useState<'loading' | 'authorized' | 'denied'>('loading');

  useEffect(() => {
    // Give Zustand a tick to hydrate from localStorage
    const timer = setTimeout(() => {
      console.log('🔐 Admin Auth Check:', { isAuthenticated, role: user?.role, email: user?.email });
      if (!isAuthenticated) {
        console.log('❌ Not authenticated');
        router.replace('/auth/login?redirect=/admin');
        setAuthState('denied');
        return;
      }
      if (user?.role !== 'admin') {
        console.log('❌ User role is not admin:', user?.role);
        setAuthState('denied');
        return;
      }
      console.log('✅ Admin access granted for', user?.email);
      setAuthState('authorized');
    }, 100);
    return () => clearTimeout(timer);
  }, [isAuthenticated, user, router]);

  // Loading state — prevent flicker
  if (authState === 'loading') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
          <p className="text-gray-400 text-sm font-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Access denied — fully isolated, no store UI
  if (authState === 'denied') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <ShieldX className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-900 text-white mb-2">Access Denied</h1>
          <p className="text-gray-400 font-500 text-sm leading-relaxed mb-6">
            This area is restricted to authorized administrators only.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-700 hover:bg-primary-600 transition-colors"
          >
            Back to Store
          </button>
        </div>
      </div>
    );
  }

  // Fully authorized admin view — completely isolated from store UI
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex min-h-screen bg-gray-950"
    >
      <AdminSidebar activeItem="" />
      <div className="flex-1 lg:ml-64 bg-surface-100 min-h-screen">
        {children}
      </div>
    </motion.div>
  );
}
