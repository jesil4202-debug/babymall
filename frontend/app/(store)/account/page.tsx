'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Package, MapPin, Lock, Heart, ChevronRight, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AccountPage() {
  const { user, isAuthenticated, updateProfile } = useAuthStore();
  const router = useRouter();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [isSaving, setIsSaving] = useState(false);

  if (!isAuthenticated) { router.push('/auth/login'); return null; }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile(form);
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const navLinks = [
    { href: '/account', label: 'My Profile', icon: User, active: true },
    { href: '/account/orders', label: 'My Orders', icon: Package },
    { href: '/account/addresses', label: 'Addresses', icon: MapPin },
    { href: '/wishlist', label: 'Wishlist', icon: Heart },

  ];

  return (
    <div className="min-h-screen bg-surface-100 py-8">
      <div className="container-main max-w-5xl">
        <h1 className="section-title mb-6">My Account</h1>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="lg:w-60 flex-shrink-0">
            <div className="card p-4">
              {/* Avatar */}
              <div className="flex items-center gap-3 px-2 py-3 mb-2 border-b border-gray-50">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary-500" />
                </div>
                <div className="min-w-0">
                  <p className="font-600 text-gray-900 truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500 font-500 truncate">{user?.email}</p>
                </div>
              </div>
              <nav className="space-y-1">
                {navLinks.map((link) => (
                  <Link key={link.href} href={link.href} className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-600 transition-all
                  ${link.active ? 'bg-primary-50 text-primary-600' : 'text-gray-500 hover:bg-surface-50 hover:text-gray-900'}`}>
                    <div className="flex items-center gap-2.5">
                      <link.icon className="w-4 h-4" />
                      {link.label}
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                  </Link>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main */}
          <div className="flex-1">
            <div className="card p-6">
              <h2 className="font-600 text-gray-900 text-lg mb-6">Profile Information</h2>
              <form onSubmit={handleSave} className="space-y-5 max-w-md">
                <div>
                  <label className="label">Full Name</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="Your name" />
                </div>
                <div>
                  <label className="label">Email Address</label>
                  <input value={user?.email} disabled className="input opacity-60 cursor-not-allowed bg-gray-50" />
                  <p className="text-xs text-gray-400 font-500 mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <label className="label">Phone Number</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" placeholder="+91 98765 43210" />
                </div>
                <button type="submit" disabled={isSaving} className="btn-primary py-2.5 px-6">
                  {isSaving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Changes</>}
                </button>
              </form>
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
              {[
                { href: '/account/orders', label: 'View Orders', icon: Package, count: null },
                { href: '/account/addresses', label: 'Addresses', icon: MapPin, count: user?.addresses?.length },
                { href: '/wishlist', label: 'Wishlist', icon: Heart, count: user?.wishlist?.length },
              ].map((item) => (
                <Link key={item.href} href={item.href} className="card p-5 hover:shadow-soft transition-all hover:-translate-y-1">
                  <div className="w-10 h-10 rounded-full bg-surface-50 flex items-center justify-center mb-3">
                    <item.icon className="w-5 h-5 text-gray-500" />
                  </div>
                  <p className="font-600 text-sm text-gray-800">{item.label}</p>
                  {item.count !== null && item.count !== undefined && (
                    <p className="text-xs text-gray-500 font-500 mt-0.5">{item.count} items</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
