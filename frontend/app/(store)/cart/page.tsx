'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag, Plus, Minus, Trash2, ArrowRight, ShoppingCart,
  Tag, Truck, Shield, ChevronRight
} from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { getImageUrl } from '@/lib/getImageUrl';

export default function CartPage() {
  const router = useRouter();
  const { items, isLoading, fetchCart, updateItem, removeItem, clearCart, itemCount, subtotal, deliveryCharge, total } =
    useCartStore();
  const { isAuthenticated } = useAuthStore();

  const count = itemCount();
  const sub = subtotal();
  const delivery = deliveryCharge();
  const tot = total();

  useEffect(() => {
    if (isAuthenticated) fetchCart();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-surface-100 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-24 h-24 bg-primary-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="w-12 h-12 text-primary-300" />
          </div>
          <h1 className="text-2xl font-800 text-gray-900 mb-2">Your Cart Awaits</h1>
          <p className="text-gray-400 font-500 mb-6">Sign in to view your saved items and continue shopping</p>
          <Link href="/auth/login?redirect=/cart" className="btn-primary">
            Sign In <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-100 py-12">
        <div className="container-main">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 flex gap-4">
                <div className="w-24 h-24 bg-gray-200 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-5 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-surface-100 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-28 h-28 bg-primary-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-14 h-14 text-primary-200" />
          </div>
          <h1 className="text-2xl font-800 text-gray-900 mb-2">Your cart is empty</h1>
          <p className="text-gray-400 font-500 mb-8">
            Looks like you haven't added anything yet. Browse our baby products!
          </p>
          <Link href="/products" className="btn-primary">
            Start Shopping <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-100 py-8 sm:py-12">
      <div className="container-main">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="section-title">My Cart</h1>
            <p className="section-subtitle">{count} {count === 1 ? 'item' : 'items'}</p>
          </div>
          <button
            onClick={() => clearCart()}
            className="text-sm text-gray-400 font-600 hover:text-red-400 transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" /> Clear Cart
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const itemPrice = item.price ?? item.variant?.price ?? item.product?.price ?? 0;
              const itemTotal = itemPrice * item.quantity;

              return (
                <div key={item._id} className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-50 hover:border-primary-100 transition-all duration-200">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <Link href={`/products/${item.product?.slug}`} className="flex-shrink-0">
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-surface-100">
                        {item.product?.images?.[0]?.url ? (
                          <img
                            src={getImageUrl(item.product.images[0])}
                            alt={item.product.name}
                            loading="lazy"
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.currentTarget.src = '/logo.png';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">No image</div>
                        )}
                      </div>
                    </Link>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link
                            href={`/products/${item.product?.slug}`}
                            className="font-700 text-gray-800 hover:text-primary-500 transition-colors line-clamp-2 text-sm sm:text-base"
                          >
                            {item.product?.name}
                          </Link>
                          {item.variant && (
                            <span className="badge-blue text-xs mt-1 inline-flex">{item.variant.label}</span>
                          )}
                          {item.product?.stock < 5 && item.product?.stock > 0 && (
                            <p className="text-xs text-warning-500 font-600 mt-1">Only {item.product.stock} left!</p>
                          )}
                        </div>
                        <button
                          onClick={() => removeItem(item._id)}
                          className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1 bg-surface-100 rounded-xl p-1">
                          <button
                            onClick={() => updateItem(item._id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-gray-600 hover:text-primary-500 hover:shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center font-800 text-gray-800 text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateItem(item._id, item.quantity + 1)}
                            disabled={item.quantity >= (item.product?.stock || 99)}
                            className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-gray-600 hover:text-primary-500 hover:shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                      {/* Price + Delivery row */}
                        <div className="text-right">
                          <p className="font-900 text-primary-500 text-lg">₹{itemTotal.toLocaleString()}</p>
                          {item.quantity > 1 && (
                            <p className="text-xs text-gray-400 font-500">₹{itemPrice.toLocaleString()} each</p>
                          )}
                          <p className="text-xs text-gray-400 font-500 mt-0.5">
                            +₹{((item.deliveryCharge ?? item.product?.deliveryCharge ?? 0) * item.quantity).toLocaleString()} delivery
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Continue Shopping */}
            <Link
              href="/products"
              className="flex items-center gap-2 text-sm font-700 text-primary-500 hover:text-primary-600 transition-colors py-2"
            >
              ← Continue Shopping
            </Link>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50 sticky top-24">
              <h2 className="font-800 text-gray-900 text-lg mb-5">Order Summary</h2>

              {/* Removed free shipping progress bar. Delivery charge is always collected. */}

              {/* Promo Code */}
              <div className="mb-5">
                <label className="label text-xs">Promo Code</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <input
                      type="text"
                      placeholder="Enter code"
                      className="input text-sm py-2.5 pl-9"
                    />
                  </div>
                  <button className="btn-secondary text-sm py-2.5 px-4 whitespace-nowrap">Apply</button>
                </div>
                <p className="text-xs text-gray-400 font-500 mt-1.5">Try: BABYMALL20 for 20% off your first order</p>
              </div>

              <hr className="border-gray-100 mb-5" />

              {/* Price Breakdown */}
              <div className="space-y-3 mb-5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-500">Subtotal ({count} items)</span>
                  <span className="font-700 text-gray-800">₹{sub.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-500">Delivery Charges</span>
                  <span className="font-700 text-gray-800">₹{delivery.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-500">Tax (incl.)</span>
                  <span className="font-700 text-gray-800">Included</span>
                </div>
              </div>

              <div className="flex justify-between items-center py-4 border-t border-b border-gray-100 mb-5">
                <span className="font-800 text-gray-900">Total</span>
                <span className="font-900 text-primary-500 text-2xl">₹{tot.toLocaleString()}</span>
              </div>

              <button
                onClick={() => router.push('/checkout')}
                className="btn-primary w-full py-4 text-base shadow-button"
              >
                Proceed to Checkout <ArrowRight className="w-5 h-5" />
              </button>

              {/* Trust Badges */}
              <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-400 font-600">
                <span className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" /> Secure Checkout
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5" /> Fast Delivery
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
