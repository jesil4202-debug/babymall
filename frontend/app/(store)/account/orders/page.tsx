'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, ChevronRight, Clock, Truck, CheckCircle, XCircle, RotateCcw, Download, Eye } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { getImageUrl } from '@/lib/getImageUrl';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  placed: { label: 'Order Placed', color: 'badge-blue', icon: Package },
  confirmed: { label: 'Confirmed', color: 'badge-blue', icon: CheckCircle },
  processing: { label: 'Processing', color: 'badge-amber', icon: Clock },
  shipped: { label: 'Shipped', color: 'badge-amber', icon: Truck },
  out_for_delivery: { label: 'Out for Delivery', color: 'badge-amber', icon: Truck },
  delivered: { label: 'Delivered', color: 'badge-green', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'badge-red', icon: XCircle },
  returned: { label: 'Returned', color: 'badge-red', icon: RotateCcw },
};

export default function OrdersPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    api
      .get('/orders/my')
      .then(({ data }) => setOrders(data.orders || []))
      .catch(() => toast.error('Failed to load your orders. Please try again.'))
      .finally(() => setIsLoading(false));
  }, [isAuthenticated]);

  if (isLoading) return (
    <div className="min-h-screen bg-surface-100 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-100 py-8">
      <div className="container-main max-w-4xl">
        <h1 className="section-title mb-6 flex items-center gap-3">
          <Package className="w-7 h-7 text-primary-500" /> My Orders
        </h1>

        {orders.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="h-10 mb-4" />
            <h2 className="font-800 text-xl text-gray-800 mb-2">No orders yet</h2>
            <p className="text-gray-400 font-500 mb-6">Start shopping to see your orders here</p>
            <Link href="/products" className="btn-primary inline-flex">Shop Now</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = STATUS_CONFIG[order.deliveryStatus] || STATUS_CONFIG['placed'];
              return (
                <div key={order._id} className="card p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                      <p className="font-800 text-gray-900">#{order.orderNumber}</p>
                      <p className="text-sm text-gray-400 font-500">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`${status.color} text-sm`}>
                        <status.icon className="w-3.5 h-3.5" /> {status.label}
                      </span>
                      <button 
                        onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL}/api/invoice/${order._id}`, '_blank')}
                        className="btn-ghost text-sm py-1.5 px-3"
                        title="Download Invoice"
                      >
                        <Download className="w-4 h-4" /> Invoice
                      </button>
                      <Link href={`/account/orders/${order._id}`} className="btn-ghost text-sm py-1.5 px-3">
                        <Eye className="w-4 h-4" /> View
                      </Link>
                    </div>
                  </div>

                  {/* Items preview */}
                  <div className="flex items-center gap-3 bg-surface-100 rounded-xl p-3 mb-4 overflow-x-auto no-scrollbar">
                    {order.items?.slice(0, 3).map((item: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 flex-shrink-0">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-white flex-shrink-0">
                          {item.image ? (
                            <img
                              src={getImageUrl(item.image)}
                              alt={item.name}
                              loading="lazy"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = '/logo.png';
                              }}
                            />
                          ) : <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No image</div>}
                        </div>
                        <div>
                          <p className="text-xs font-600 text-gray-700 max-w-[100px] truncate">{item.name}</p>
                          <p className="text-xs text-gray-400 font-500">×{item.quantity}</p>
                        </div>
                      </div>
                    ))}
                    {order.items?.length > 3 && (
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-white border-2 border-dashed border-gray-200 flex items-center justify-center text-xs font-700 text-gray-400">
                        +{order.items.length - 3}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400 font-500">Total Amount</p>
                      <p className="font-800 text-gray-900 text-lg">₹{order.totalAmount?.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-600 ${order.paymentMethod === 'cod' ? 'text-warning-500' : 'text-success-500'}`}>
                        {order.paymentMethod === 'cod' ? 'COD' : 'Paid'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
