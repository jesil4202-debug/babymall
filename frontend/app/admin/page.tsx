'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard, Package, ShoppingBag, Users, Image as ImageIcon,
  TrendingUp, DollarSign, ShoppingCart, ArrowUpRight, AlertTriangle,
  BarChart2, Star, CheckCircle, Plus
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { getImageUrl } from '@/lib/getImageUrl';

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const [analytics, setAnalytics] = useState<any>(null);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState<number | null>(null);
  const [totalCustomers, setTotalCustomers] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, lowStockRes, ordersRes, statsRes] = await Promise.all([
          api.get('/orders/analytics'),
          api.get('/products/low-stock'),
          api.get('/orders?limit=5'),
          api.get('/admin/stats'),
        ]);
        setAnalytics(analyticsRes.data.analytics);
        setLowStock(lowStockRes.data.products);
        setRecentOrders(ordersRes.data.orders);
        setTotalProducts(statsRes.data.totalProducts);
        setTotalCustomers(statsRes.data.totalUsers);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [isAuthenticated, user]);

  const stats = [
    { label: 'Total Orders', value: analytics?.totalOrders ?? '—', icon: ShoppingCart, color: 'bg-blue-50 text-secondary-500', change: '' },
    { label: 'Total Revenue', value: analytics ? `₹${(analytics.totalRevenue || 0).toLocaleString()}` : '—', icon: DollarSign, color: 'bg-primary-50 text-primary-500', change: '' },
    { label: 'Products', value: totalProducts ?? '—', icon: Package, color: 'bg-amber-50 text-warning-500', change: '' },
    { label: 'Customers', value: totalCustomers ?? '—', icon: Users, color: 'bg-green-50 text-success-500', change: '' },
  ];

  if (isLoading) return (
    <div className="min-h-screen bg-surface-100 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
        <p className="text-sm font-600 text-gray-400">Loading dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="p-6 lg:p-8 bg-gray-950 min-h-screen text-gray-100">
      {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-600 text-white">Dashboard</h1>
              <p className="text-gray-400 font-500 text-sm mt-1">Welcome back, {user?.name?.split(' ')[0]}</p>
            </div>
            <div className="text-sm text-gray-400 font-500 hidden sm:block">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gray-800/50`}>
                    <stat.icon className={`w-5 h-5 ${stat.color.split(' ')[1]}`} />
                  </div>
                  {stat.change && (
                    <span className="text-xs font-600 text-success-500 flex items-center gap-0.5">
                      <ArrowUpRight className="w-3 h-3" /> {stat.change}
                    </span>
                  )}
                </div>
                <p className="text-2xl font-700 text-white">{stat.value}</p>
                <p className="text-xs text-gray-400 font-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Revenue Chart */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="font-600 text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                <TrendingUp className="w-4 h-4 text-primary-500" /> Revenue (Last 7 Days)
              </h3>
              {analytics?.dailyRevenue?.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={analytics.dailyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="_id" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', color: '#F3F4F6' }}
                      formatter={(v: any) => [`₹${Number(v).toLocaleString()}`, 'Revenue']}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#F02899" strokeWidth={2.5} dot={{ fill: '#F02899', r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center text-gray-300 gap-2">
                  <BarChart2 className="w-12 h-12" />
                  <p className="text-sm font-500">No revenue data yet</p>
                </div>
              )}
            </div>

            {/* Top Products */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="font-600 text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                <Star className="w-4 h-4 text-warning-500" /> Top Selling Products
              </h3>
              {analytics?.topProducts?.length > 0 ? (
                <div className="space-y-3">
                  {analytics.topProducts.map((p: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-xs font-600 text-gray-400 flex-shrink-0">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-500 text-gray-200 truncate">{p.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary-500 rounded-full"
                              style={{ width: `${Math.min((p.sold / ((analytics?.topProducts?.[0]?.sold || 1))) * 100, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 font-500 flex-shrink-0">{p.sold} sold</span>
                        </div>
                      </div>
                      <span className="text-sm font-600 text-primary-400 flex-shrink-0">₹{p.revenue?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-300">No sales data yet</div>
              )}
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-600 text-white text-sm uppercase tracking-wide">Recent Orders</h3>
                <Link href="/admin/orders" className="text-sm text-primary-500 font-500 hover:text-primary-400">View All →</Link>
              </div>
              {recentOrders.length === 0 ? (
                <p className="text-center text-gray-400 font-500 py-8">No orders yet</p>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <div key={order._id} className="flex items-center gap-3 py-3 border-b border-gray-800 last:border-0">
                      <div className="w-10 h-10 rounded-xl bg-gray-800/50 flex items-center justify-center flex-shrink-0">
                        <ShoppingBag className="w-4 h-4 text-primary-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-500 text-gray-200">#{order.orderNumber}</p>
                        <p className="text-xs text-gray-500 font-400 truncate">{order.user?.name}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-600 text-gray-200">₹{order.totalAmount?.toLocaleString()}</p>
                        <span className="text-[10px] uppercase tracking-wider text-blue-400 mt-1 block">{order.deliveryStatus}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Low Stock Alert */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-600 text-white flex items-center gap-2 text-sm uppercase tracking-wide">
                  <AlertTriangle className="w-4 h-4 text-warning-500" /> Low Stock Alert
                </h3>
                <Link href="/admin/products" className="text-sm text-primary-500 font-500 hover:text-primary-400">Manage →</Link>
              </div>
              {lowStock.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-8 h-8 text-success-500 mx-auto mb-2" />
                  <p className="text-gray-400 font-600 text-sm">All products well-stocked!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {lowStock.slice(0, 5).map((p) => (
                    <div key={p._id} className="flex items-center gap-3 py-3 border-b border-gray-800 last:border-0">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-800/50 flex items-center justify-center flex-shrink-0">
                        {p.images?.[0]?.url ? (
                          <img
                            src={getImageUrl(p.images[0])}
                            alt={p.name}
                            loading="lazy"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/logo.png';
                            }}
                          />
                        ) : <Package className="w-4 h-4 text-gray-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-500 text-gray-200 truncate">{p.name}</p>
                        <p className="text-xs text-gray-500 font-400 capitalize">{p.category}</p>
                      </div>
                      <span className={`${p.stock === 0 ? 'text-red-400' : 'text-warning-400'} text-xs font-500 flex-shrink-0`}>
                        {p.stock === 0 ? 'Out of Stock' : `${p.stock} left`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Admin Quick Links */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            {[
              { href: '/admin/products/new', label: 'Add Product', icon: Plus, color: 'text-primary-400 hover:text-white' },
              { href: '/admin/orders', label: 'Orders', icon: Package, color: 'text-secondary-400 hover:text-white' },
              { href: '/admin/banners', label: 'Banners', icon: ImageIcon, color: 'text-warning-400 hover:text-white' },
              { href: '/admin/customers', label: 'Customers', icon: Users, color: 'text-success-400 hover:text-white' },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="group bg-gray-900 border border-gray-800 p-5 rounded-2xl flex flex-col items-center justify-center hover:border-gray-600 transition-colors">
                <item.icon className={`w-6 h-6 mb-3 ${item.color} transition-colors`} />
                <p className="text-sm font-500 text-gray-300 group-hover:text-white transition-colors">{item.label}</p>
              </Link>
            ))}
          </div>
    </div>
  );
}
