'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, ShoppingBag, Users, Image as ImageIcon,
  ExternalLink, LogOut
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, key: 'dashboard' },
  { href: '/admin/products', label: 'Products', icon: Package, key: 'products' },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag, key: 'orders' },
  { href: '/admin/customers', label: 'Customers', icon: Users, key: 'customers' },
  { href: '/admin/banners', label: 'Banners', icon: ImageIcon, key: 'banners' },
];

interface AdminSidebarProps {
  activeItem: string;
}

export default function AdminSidebar({ activeItem }: AdminSidebarProps) {
  const { logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const isActive = (key: string, href: string) => {
    if (key === 'dashboard') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-64 card-glass min-h-screen flex-col py-6 px-4 hidden lg:flex fixed top-0 left-0 z-40 bottom-0 border-r border-white/20">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 mb-8 px-2 group">
        <div className="relative flex-shrink-0 bg-transparent">
          <Image src="/logo.png" width={120} height={120} alt="Logo" />
        </div>
        <div className="min-w-0">
          <p className="text-gray-900 font-800 text-base leading-none">Baby Mall</p>
          <p className="text-xs text-gray-600 font-500 mt-0.5">Admin Panel</p>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.key, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-700 transition-all duration-150
              ${active
                ? 'bg-primary-500 text-white shadow-button'
                : 'text-gray-600 hover:bg-white/50 hover:text-primary-500'
              }`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
              {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer actions */}
      <div className="space-y-1 pt-4 border-t border-gray-200/60">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-600 text-gray-600 hover:text-primary-500 hover:bg-white/50 transition-all"
        >
          <ExternalLink className="w-4 h-4 flex-shrink-0" />
          View Store
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-600 text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Logout
        </button>
      </div>
    </aside>
  );
}
