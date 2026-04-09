'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Package, Truck, CheckCircle, Clock, XCircle, MapPin, Download, ArrowLeft, RotateCcw } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { getImageUrl } from '@/lib/getImageUrl';

const STATUS_STEPS = ['placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];

const STATUS_ICONS: Record<string, any> = {
  placed: Package,
  confirmed: CheckCircle,
  processing: Clock,
  shipped: Truck,
  out_for_delivery: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
  returned: RotateCcw,
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get('success') === 'true';
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    api.get(`/orders/${id}`).then(({ data }) => setOrder(data.order)).catch(console.error).finally(() => setIsLoading(false));
  }, [id]);

  const handleDownloadInvoice = () => {
    window.open(`${process.env.NEXT_PUBLIC_API_URL}/orders/${id}/invoice`, '_blank');
  };

  if (isLoading) return (
    <div className="min-h-screen bg-surface-100 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
    </div>
  );
  if (!order) return null;

  const currentStep = STATUS_STEPS.indexOf(order.deliveryStatus);
  const isCancelled = order.deliveryStatus === 'cancelled' || order.deliveryStatus === 'returned';

  return (
    <div className="min-h-screen bg-surface-100 py-8">
      <div className="container-main max-w-4xl">
        {/* Success banner */}
        {isSuccess && (
          <div className="bg-gradient-to-r from-success-500 to-green-400 text-white p-5 rounded-2xl mb-6 flex items-center gap-4 animate-slide-up">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-800 text-lg">Order Placed Successfully!</p>
              <p className="text-white/85 font-500 text-sm">Thank you! You'll receive a confirmation email shortly.</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/account/orders" className="flex items-center gap-1 text-sm text-gray-400 font-600 hover:text-primary-500 mb-1">
              <ArrowLeft className="w-4 h-4" /> Back to Orders
            </Link>
            <h1 className="section-title">Order #{order.orderNumber}</h1>
          </div>
          <button onClick={handleDownloadInvoice} className="btn-secondary text-sm py-2 px-4">
            <Download className="w-4 h-4" /> Invoice
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {/* Order Tracking */}
            {!isCancelled && (
              <div className="card p-6">
                <h2 className="font-800 text-gray-900 mb-6">Order Tracking</h2>
                <div className="relative">
                  {/* Progress line */}
                  <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-100" />
                  <div
                    className="absolute left-4 top-4 w-0.5 bg-primary-500 transition-all duration-700"
                    style={{ height: `${Math.min(currentStep / (STATUS_STEPS.length - 1), 1) * 100}%` }}
                  />

                  <div className="space-y-6">
                    {STATUS_STEPS.map((step, i) => {
                      const Icon = STATUS_ICONS[step];
                      const done = i <= currentStep;
                      const active = i === currentStep;
                      return (
                        <div key={step} className="flex items-center gap-4 relative">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all
                          ${done ? 'bg-primary-500 shadow-button' : 'bg-white border-2 border-gray-200'}`}>
                            <Icon className={`w-4 h-4 ${done ? 'text-white' : 'text-gray-300'}`} />
                          </div>
                          <div>
                            <p className={`font-700 capitalize text-sm ${done ? 'text-gray-900' : 'text-gray-400'} ${active ? 'text-primary-500' : ''}`}>
                              {step.replace(/_/g, ' ')}
                            </p>
                            {active && order.updatedAt && (
                              <p className="text-xs text-gray-400 font-500">
                                {new Date(order.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            )}
                          </div>
                          {active && <span className="ml-auto badge-pink text-xs">Current</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
                {order.trackingNumber && (
                  <div className="mt-4 p-3 bg-surface-100 rounded-xl">
                    <p className="text-xs font-600 text-gray-500">Tracking Number</p>
                    <p className="font-700 text-gray-800">{order.trackingNumber}</p>
                    {order.courierName && <p className="text-xs text-gray-400">via {order.courierName}</p>}
                  </div>
                )}
              </div>
            )}

            {/* Items */}
            <div className="card p-6">
              <h2 className="font-800 text-gray-900 mb-4">Items Ordered</h2>
              <div className="space-y-4">
                {order.items?.map((item: any, i: number) => (
                  <div key={i} className="flex gap-4 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-100 flex-shrink-0">
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
                    <div className="flex-1">
                      <p className="font-700 text-gray-800">{item.name}</p>
                      {item.variant && <p className="text-xs text-gray-400 font-500">{item.variant.name}: {item.variant.label}</p>}
                      <p className="text-sm font-500 text-gray-500 mt-0.5">Qty: {item.quantity} × ₹{item.price?.toLocaleString()}</p>
                      <p className="text-xs text-gray-400 font-500">Delivery: ₹{((item.deliveryCharge ?? 0) * item.quantity).toLocaleString()}</p>
                    </div>
                    <p className="font-800 text-gray-900">₹{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-5">
            {/* Order Info */}
            <div className="card p-5">
              <h3 className="font-800 text-gray-900 mb-4">Order Info</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 font-500">Date</span>
                  <span className="font-700">{new Date(order.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-500">Payment</span>
                  <span className="font-700">{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-500">Payment Status</span>
                  <span className={`font-700 ${order.payment?.status === 'paid' ? 'text-success-500' : 'text-warning-500'}`}>
                    {order.payment?.status === 'paid' ? 'Paid' : 'Pending'}
                  </span>
                </div>
                <hr className="border-gray-50" />
                <div className="flex justify-between">
                  <span className="text-gray-500 font-500">Subtotal</span>
                  <span className="font-600">₹{order.itemsTotal?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-500">Delivery Charges</span>
                  <span className="font-600">₹{order.deliveryCharge?.toLocaleString() ?? 0}</span>
                </div>
                <div className="flex justify-between font-800 text-base text-primary-500 pt-1 border-t border-gray-50">
                  <span>Total</span>
                  <span>₹{order.totalAmount?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="card p-5">
              <h3 className="font-800 text-gray-900 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary-500" /> Delivery Address
              </h3>
              <div className="text-sm text-gray-600 font-500 space-y-1">
                <p className="font-700 text-gray-800">{order.shippingAddress?.name}</p>
                <p>{order.shippingAddress?.phone}</p>
                <p>{order.shippingAddress?.street}</p>
                <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
