'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Eye, Edit2, ChevronDown, Download } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

const STATUSES = ['placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'];
const STATUS_COLORS: Record<string, string> = {
  placed: 'badge-blue',
  confirmed: 'badge-blue',
  processing: 'badge-amber',
  shipped: 'badge-amber',
  out_for_delivery: 'badge-amber',
  delivered: 'badge-green',
  cancelled: 'badge-red',
  returned: 'badge-red',
};

export default function AdminOrdersPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15', ...(statusFilter && { status: statusFilter }) });
      const { data } = await api.get(`/orders?${params}`);
      setOrders(data.orders || []);
      setTotal(data.total || 0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, status: string) => {
    setUpdatingId(orderId);
    try {
      await api.put(`/orders/${orderId}/status`, { deliveryStatus: status });
      toast.success('Order status updated');
      fetchOrders();
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-900 text-gray-900">Orders</h1>
              <p className="text-gray-400 font-500 text-sm">{total} total orders</p>
            </div>
          </div>

          {/* Filters */}
          <div className="card-flat p-4 mb-6 flex flex-wrap gap-3">
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => { setStatusFilter(''); setPage(1); }} className={`px-4 py-2 rounded-xl text-sm font-700 transition-all ${!statusFilter ? 'bg-primary-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-300'}`}>All</button>
              {STATUSES.slice(0, 5).map((s) => (
                <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }} className={`px-4 py-2 rounded-xl text-sm font-700 capitalize transition-all ${statusFilter === s ? 'bg-primary-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-300'}`}>
                  {s.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-surface-100">
                    <th className="text-left px-6 py-4 text-xs font-800 text-gray-500 uppercase tracking-wider">Order</th>
                    <th className="text-left px-4 py-4 text-xs font-800 text-gray-500 uppercase tracking-wider hidden sm:table-cell">Customer</th>
                    <th className="text-left px-4 py-4 text-xs font-800 text-gray-500 uppercase tracking-wider hidden md:table-cell">Amount</th>
                    <th className="text-left px-4 py-4 text-xs font-800 text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-right px-6 py-4 text-xs font-800 text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="px-6 py-4"><div className="skeleton h-4 w-24 rounded" /></td>
                        <td className="px-4 py-4 hidden sm:table-cell"><div className="skeleton h-4 w-32 rounded" /></td>
                        <td className="px-4 py-4 hidden md:table-cell"><div className="skeleton h-4 w-16 rounded" /></td>
                        <td className="px-4 py-4"><div className="skeleton h-6 w-20 rounded-full" /></td>
                        <td className="px-6 py-4" />
                      </tr>
                    ))
                  ) : orders.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-12 text-gray-400 font-500">No orders found</td></tr>
                  ) : orders.map((order) => (
                    <tr key={order._id} className="border-b border-gray-50 hover:bg-surface-100 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-800 text-gray-900 text-sm">#{order.orderNumber}</p>
                        <p className="text-xs text-gray-400 font-500">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      </td>
                      <td className="px-4 py-4 hidden sm:table-cell">
                        <p className="font-700 text-gray-700 text-sm">{order.user?.name}</p>
                        <p className="text-xs text-gray-400 font-500">{order.user?.email}</p>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <p className="font-700 text-gray-800">₹{order.totalAmount?.toLocaleString()}</p>
                        <p className="text-xs text-gray-400 font-500">{order.paymentMethod === 'cod' ? 'COD' : 'Online'}</p>
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={order.deliveryStatus}
                          onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                          disabled={updatingId === order._id}
                          className="text-xs font-700 px-2 py-1.5 rounded-xl border-2 border-gray-200 outline-none focus:border-primary-400 capitalize cursor-pointer bg-white disabled:opacity-60"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL}/api/invoice/${order._id}`, '_blank')}
                            className="p-2 rounded-lg hover:bg-surface-100 transition-colors text-gray-400 hover:text-gray-700 inline-flex"
                            title="Download Invoice"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <Link href={`/account/orders/${order._id}`} target="_blank" className="p-2 rounded-lg hover:bg-surface-100 transition-colors text-gray-400 hover:text-gray-700 inline-flex">
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {total > 15 && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-400 font-500">Showing {Math.min(15, orders.length)} of {total}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-40">← Prev</button>
                  <button onClick={() => setPage(page + 1)} disabled={page * 15 >= total} className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-40">Next →</button>
                </div>
              </div>
            )}
          </div>
    </div>
  );
}
