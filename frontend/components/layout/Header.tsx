'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart, Search, Heart, User, Menu, X, ChevronDown,
  Package, MapPin, LogOut, LayoutDashboard, Bell
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';

const categories = [
  { name: 'Clothing', href: '/products?category=clothing' },
  { name: 'Feeding', href: '/products?category=feeding' },
  { name: 'Toys', href: '/products?category=toys' },
  { name: 'Nursery', href: '/products?category=nursery' },
  { name: 'Bath', href: '/products?category=bath' },
  { name: 'Health', href: '/products?category=health' },
  { name: 'Travel', href: '/products?category=travel' },
  { name: 'Accessories', href: '/products?category=accessories' },
];

export default function Header() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { itemCount, openCart } = useCartStore();
  const count = itemCount();
  const [mounted, setMounted] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [catMenuOpen, setCatMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    router.push('/');
  };

  return (
    <>
      {/* Promo Bar */}
      <div className="bg-primary-500 text-white text-center py-2 px-4 text-xs sm:text-sm font-500 tracking-wide">
        Delivery charges calculated per product &nbsp;|&nbsp; New arrivals every week
      </div>

      {/* Main Header */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ease-out ${
          isScrolled 
            ? 'bg-white/80 backdrop-blur-2xl shadow-[var(--shadow-soft)] border-b border-gray-100/50' 
            : 'bg-white/70 backdrop-blur-2xl border-b border-gray-100/50'
        }`}
      >
        <div className="container-main">
          <div className="flex items-center justify-between h-16 lg:h-20 gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center flex-shrink-0 group">
              <div className="relative transition-opacity duration-300 group-hover:opacity-95 bg-transparent">
                <Image src="/logo.png" width={120} height={120} alt="Logo" />
              </div>
            </Link>

            {/* Search Bar - Desktop */}
            <form
              onSubmit={handleSearch}
              className="hidden md:flex flex-1 max-w-xl mx-4 items-center bg-gray-50 rounded-2xl border border-gray-200 focus-within:border-primary-400 focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(232,76,122,0.15)] transition-all duration-300 ease-out"
            >
              <Search className="ml-4 w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search baby products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-3 py-2.5 bg-transparent outline-none text-sm font-500 text-gray-700 placeholder:text-gray-400"
              />
              {searchQuery && (
                <button type="submit" className="mr-3 text-primary-500 text-sm font-700 hover:text-primary-600">
                  Search
                </button>
              )}
            </form>

            {/* Action Icons */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Search - Mobile */}
              <button
                onClick={() => setSearchOpen(true)}
                className="md:hidden btn-ghost p-2.5 rounded-xl"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Wishlist */}
              {isAuthenticated && (
                <Link href="/wishlist" className="btn-ghost p-2.5 rounded-xl hidden sm:flex">
                  <Heart className="w-5 h-5" />
                </Link>
              )}

              {/* Cart */}
              <button
                onClick={openCart}
                className="relative btn-ghost p-2.5 rounded-xl hover:bg-surface-50 transition-colors"
                aria-label="Cart"
              >
                <ShoppingCart className="w-5 h-5 text-gray-600 hover:text-gray-900 transition-colors" />
                {mounted && count > 0 && (
                  <span className="absolute 0 top-1.5 right-1.5 w-4 h-4 bg-primary-500 text-white text-[10px] font-800 rounded-full flex items-center justify-center animate-scale-in shadow-sm">
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </button>

              {/* User menu */}
              {isAuthenticated ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 btn-ghost px-3 py-2 rounded-xl"
                  >
                    <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary-500" />
                    </div>
                    <span className="hidden sm:block text-sm font-600 text-gray-700 max-w-[80px] truncate">
                      {user?.name?.split(' ')[0]}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-gray-400 hidden sm:block transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-card-hover border border-gray-100 py-2 animate-scale-in z-50">
                      <div className="px-4 py-2 border-b border-gray-50">
                        <p className="font-700 text-sm text-gray-800 truncate">{user?.name}</p>
                        <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                      </div>
                      {user?.role === 'admin' && user?.email === 'jesil4202@gmail.com' && (
                        <Link
                          href="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-600 text-secondary-600 hover:bg-secondary-50 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4" /> Admin Panel
                        </Link>
                      )}
                      <Link href="/account" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-600 text-gray-700 hover:bg-surface-100 transition-colors">
                        <User className="w-4 h-4" /> My Profile
                      </Link>
                      <Link href="/account/orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-600 text-gray-700 hover:bg-surface-100 transition-colors">
                        <Package className="w-4 h-4" /> My Orders
                      </Link>
                      <Link href="/wishlist" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-600 text-gray-700 hover:bg-surface-100 transition-colors">
                        <Heart className="w-4 h-4" /> Wishlist
                      </Link>
                      <Link href="/account/addresses" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-600 text-gray-700 hover:bg-surface-100 transition-colors">
                        <MapPin className="w-4 h-4" /> Addresses
                      </Link>
                      <hr className="my-1 border-gray-50" />
                      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-600 text-red-500 hover:bg-red-50 transition-colors">
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/auth/login" className="btn-primary py-2 px-4 text-sm hidden sm:inline-flex">
                  Login
                </Link>
              )}

              {/* Mobile Menu */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden btn-ghost p-2.5 rounded-xl"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Category Nav - Desktop */}
          <nav className="hidden lg:flex items-center gap-1 pb-3">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={cat.href}
                className="px-3 py-1.5 rounded-lg text-sm font-500 text-gray-600 hover:text-primary-500 hover:bg-surface-50 transition-all duration-200"
              >
                {cat.name}
              </Link>
            ))}
            <Link href="/products" className="ml-2 text-sm font-700 text-primary-500 hover:text-primary-600 transition-colors">
              All Products →
            </Link>
          </nav>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="lg:hidden card-glass animate-slide-up rounded-b-2xl">
            <div className="container-main py-4">
              {/* Auth */}
              {!isAuthenticated && (
                <div className="flex gap-3 mb-4">
                  <Link href="/auth/login" onClick={() => setMobileOpen(false)} className="btn-primary flex-1 text-center py-2.5 text-sm">
                    Sign In
                  </Link>
                </div>
              )}
              {/* Categories */}
              <p className="text-xs font-700 text-gray-400 uppercase tracking-wider mb-2">Categories</p>
              <div className="grid grid-cols-2 gap-1">
                {categories.map((cat) => (
                  <Link
                    key={cat.name}
                    href={cat.href}
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2.5 rounded-xl text-sm font-500 text-gray-700 hover:bg-surface-50 hover:text-primary-500 transition-colors"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
              {isAuthenticated && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <Link href="/account" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-600 text-gray-700 hover:bg-surface-100">
                    <User className="w-4 h-4 text-primary-500" /> My Account
                  </Link>
                  <Link href="/account/orders" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-600 text-gray-700 hover:bg-surface-100">
                    <Package className="w-4 h-4 text-primary-500" /> My Orders
                  </Link>
                  <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-600 text-red-500 hover:bg-red-50">
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Mobile Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setSearchOpen(false)}>
          <div className="bg-white p-4 pt-safe" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSearch} className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 border border-primary-200 shadow-[0_0_0_3px_rgba(232,76,122,0.15)]">
              <Search className="w-5 h-5 text-primary-500 flex-shrink-0" />
              <input
                ref={searchRef}
                autoFocus
                type="text"
                placeholder="Search baby products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none text-base font-500 text-gray-700"
              />
              <button type="button" onClick={() => setSearchOpen(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
