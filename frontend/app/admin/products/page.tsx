'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Edit2, Trash2, Eye, Search, AlertTriangle } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { getImageUrl } from '@/lib/getImageUrl';

export default function AdminProductsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '12', ...(search && { search }) });
      const { data } = await api.get(`/products?${params}`);
      setProducts(data.products || []);
      setTotal(data.total || 0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This action cannot be undone.`)) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted');
      fetchProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-900 text-gray-900">Products</h1>
              <p className="text-gray-400 font-500 text-sm">{total} total products</p>
            </div>
            <Link href="/admin/products/new" className="btn-primary text-sm py-2.5 px-5">
              <Plus className="w-4 h-4" /> Add Product
            </Link>
          </div>

          {/* Search */}
          <div className="card-flat p-4 mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="input pl-10 text-sm py-2.5"
              />
            </div>
          </div>

          {/* Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-surface-100">
                    <th className="text-left px-6 py-4 text-xs font-800 text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="text-left px-4 py-4 text-xs font-800 text-gray-500 uppercase tracking-wider hidden sm:table-cell">Category</th>
                    <th className="text-left px-4 py-4 text-xs font-800 text-gray-500 uppercase tracking-wider hidden md:table-cell">Price</th>
                    <th className="text-left px-4 py-4 text-xs font-800 text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="text-right px-6 py-4 text-xs font-800 text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    [...Array(6)].map((_, i) => (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="skeleton w-12 h-12 rounded-xl" />
                            <div className="skeleton h-4 w-32 rounded" />
                          </div>
                        </td>
                        <td className="px-4 py-4 hidden sm:table-cell"><div className="skeleton h-4 w-16 rounded" /></td>
                        <td className="px-4 py-4 hidden md:table-cell"><div className="skeleton h-4 w-16 rounded" /></td>
                        <td className="px-4 py-4"><div className="skeleton h-4 w-10 rounded" /></td>
                        <td className="px-6 py-4" />
                      </tr>
                    ))
                  ) : products.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-12 text-gray-400 font-500">No products found</td></tr>
                  ) : products.map((p) => (
                    <tr key={p._id} className="border-b border-gray-50 hover:bg-surface-100 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-surface-100 flex-shrink-0">
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
                            ) : <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No image</div>}
                          </div>
                          <div>
                            <p className="font-700 text-gray-800 text-sm max-w-[180px] truncate">{p.name}</p>
                            {p.brand && <p className="text-xs text-gray-400 font-500">{p.brand}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden sm:table-cell">
                        <span className="badge-blue capitalize text-xs">{p.category}</span>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <p className="font-700 text-gray-800">₹{p.price?.toLocaleString()}</p>
                        {p.originalPrice && <p className="text-xs text-gray-400 line-through font-500">₹{p.originalPrice?.toLocaleString()}</p>}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-sm font-700 flex items-center gap-1 ${p.stock === 0 ? 'text-red-500' : p.stock <= 10 ? 'text-warning-500' : 'text-success-500'}`}>
                          {p.stock <= 10 && p.stock > 0 && <AlertTriangle className="w-3.5 h-3.5" />}
                          {p.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 justify-end">
                          <Link href={`/products/${p.slug}`} target="_blank" className="p-2 rounded-lg hover:bg-surface-100 transition-colors text-gray-400 hover:text-gray-700">
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link href={`/admin/products/${p._id}/edit`} className="p-2 rounded-lg hover:bg-surface-100 transition-colors text-gray-400 hover:text-secondary-500">
                            <Edit2 className="w-4 h-4" />
                          </Link>
                          <button onClick={() => handleDelete(p._id, p.name)} className="p-2 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {total > 12 && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-400 font-500">Showing {Math.min(12, products.length)} of {total}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-40">← Prev</button>
                  <button onClick={() => setPage(page + 1)} disabled={page * 12 >= total} className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-40">Next →</button>
                </div>
              </div>
            )}
          </div>
    </div>
  );
}
