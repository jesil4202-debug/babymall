'use client';

import { useState, useEffect } from 'react';
import {
  Users, Search, ChevronLeft, ChevronRight,
  Phone, MapPin, ShoppingCart, Calendar
} from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  createdAt: string;
  ordersCount?: number;
  totalSpent?: number;
  addresses?: any[];
}

export default function AdminCustomersPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [selected, setSelected] = useState<Customer | null>(null);
  const LIMIT = 12;

  useEffect(() => {
    fetchCustomers();
  }, [isAuthenticated, user, page, search]);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        ...(search && { search }),
      });
      const { data } = await api.get(`/admin/customers?${params}`);
      setCustomers(data.customers || []);
      setTotalPages(data.totalPages || 1);
      setTotalCustomers(data.total || 0);
    } catch { toast.error('Failed to load customers'); }
    finally { setIsLoading(false); }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  const getInitials = (name: string) =>
    name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  const colorFromName = (name: string) => {
    const colors = ['bg-primary-100 text-primary-600', 'bg-secondary-100 text-secondary-600', 'bg-amber-100 text-amber-600', 'bg-green-100 text-green-600', 'bg-purple-100 text-purple-600'];
    return colors[(name?.charCodeAt(0) || 0) % colors.length];
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-900 text-gray-900">Customers</h1>
              <p className="text-gray-400 font-500 text-sm">{totalCustomers.toLocaleString()} registered customers</p>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className="input pl-10 text-sm py-2.5"
                />
              </div>
              <button type="submit" className="btn-primary text-sm py-2.5 px-5">Search</button>
              {search && (
                <button
                  type="button"
                  onClick={() => { setSearch(''); setPage(1); }}
                  className="btn-secondary text-sm py-2.5 px-4"
                >
                  Clear
                </button>
              )}
            </form>
          </div>

          {/* Customer Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-2xl" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                      <div className="h-3 bg-gray-200 rounded w-3/4" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-full" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : customers.length === 0 ? (
            <div className="bg-white rounded-2xl p-16 text-center shadow-sm">
              <Users className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="font-700 text-gray-500">No customers found</p>
              {search && <p className="text-sm text-gray-400 font-500 mt-1">Try a different search term</p>}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {customers.map((customer) => (
                <div
                  key={customer._id}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50 hover:border-primary-100 hover:shadow-soft transition-all duration-200 cursor-pointer"
                  onClick={() => setSelected(selected?._id === customer._id ? null : customer)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-800 text-sm flex-shrink-0 ${colorFromName(customer.name)}`}>
                      {getInitials(customer.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <p className="font-700 text-gray-800 text-sm truncate">{customer.name}</p>
                        {customer.role === 'admin' && (
                          <span className="badge-blue text-xs flex-shrink-0">Admin</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 font-500 truncate">{customer.email}</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {customer.phone && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 font-500">
                        <Phone className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                        {customer.phone}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-500">
                      <Calendar className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                      Joined {new Date(customer.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    {customer.addresses && customer.addresses.length > 0 && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 font-500">
                        <MapPin className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                        {customer.addresses.length} saved address{customer.addresses.length > 1 ? 'es' : ''}
                      </div>
                    )}
                  </div>

                  {/* Order Stats */}
                  <div className="flex gap-3 mt-4 pt-4 border-t border-gray-50">
                    <div className="flex-1 text-center">
                      <p className="font-900 text-gray-900 text-lg">{customer.ordersCount || 0}</p>
                      <p className="text-xs text-gray-400 font-600">Orders</p>
                    </div>
                    <div className="w-px bg-gray-100" />
                    <div className="flex-1 text-center">
                      <p className="font-900 text-primary-500 text-lg">
                        ₹{(customer.totalSpent || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400 font-600">Spent</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-sm text-gray-400 font-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary text-sm py-2 px-3 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-9 h-9 rounded-xl text-sm font-700 transition-all
                      ${page === pageNum ? 'bg-primary-500 text-white' : 'text-gray-500 hover:bg-surface-100'}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn-secondary text-sm py-2 px-3 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
    </div>
  );
}
