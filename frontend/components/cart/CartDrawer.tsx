'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { X, Plus, Minus, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { getImageUrl } from '@/lib/getImageUrl';

export default function CartDrawer() {
  const { items, isOpen, closeCart, updateItem, removeItem, itemCount, subtotal, deliveryCharge, total } =
    useCartStore();
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const count = mounted ? itemCount() : 0;
  const sub = mounted ? subtotal() : 0;
  const delivery = mounted ? deliveryCharge() : 0;
  const hydratedItems = mounted ? items : [];

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCheckout = () => {
    closeCart();
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/checkout');
    } else {
      router.push('/checkout');
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80] animate-fade-in"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <motion.div
        initial={false}
        animate={{ x: isOpen ? 0 : '100%' }}
        transition={{ type: 'tween', duration: 0.25, ease: 'easeInOut' }}
        className="fixed top-0 right-0 h-full w-full sm:w-[420px] card-glass z-[90] flex flex-col will-change-transform"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary-500" />
            <h2 className="font-800 text-lg text-gray-900">Shopping Cart</h2>
            {count > 0 && (
              <span className="ml-1 badge-pink">{count} items</span>
            )}
          </div>
          <button onClick={closeCart} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto py-4 px-6">
          {hydratedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-20 h-20 rounded-3xl bg-surface-100 flex items-center justify-center mb-4">
                <ShoppingBag className="w-10 h-10 text-primary-200" />
              </div>
              <p className="font-700 text-gray-700 text-lg mb-1">Your cart is empty</p>
              <p className="text-gray-400 text-sm mb-6">Add some products to get started</p>
              <button onClick={closeCart} className="btn-primary text-sm py-2.5 px-6">
                Browse Products
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {hydratedItems.map((item) => (
                <div key={item._id} className="flex gap-3 card-glass p-3">
                  {/* Image */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                    {item.product?.images?.[0]?.url ? (
                      <img
                        src={getImageUrl(item.product.images[0])}
                        alt={item.product.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/logo.png';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <ShoppingBag className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.product?.slug}`}
                      onClick={closeCart}
                      className="text-sm font-700 text-gray-800 hover:text-primary-500 transition-colors line-clamp-2"
                    >
                      {item.product?.name}
                    </Link>
                    {item.variant && (
                      <span className="badge-blue text-xs mt-1">{item.variant.label}</span>
                    )}
                    <p className="text-xs text-gray-400 font-500 mt-0.5">
                      Delivery: ₹{((item.deliveryCharge ?? item.product?.deliveryCharge ?? 0) * item.quantity).toLocaleString()}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-800 text-primary-500">
                        ₹{((item.price ?? item.variant?.price ?? item.product?.price ?? 0) * item.quantity).toLocaleString()}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateItem(item._id, item.quantity - 1)}
                          className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:border-primary-300 transition-colors"
                        >
                          <Minus className="w-3 h-3 text-gray-600" />
                        </button>
                        <span className="w-7 text-center text-sm font-700">{item.quantity}</span>
                        <button
                          onClick={() => updateItem(item._id, item.quantity + 1)}
                          disabled={item.quantity >= (item.product?.stock || 999)}
                          className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:border-primary-300 transition-colors disabled:opacity-50"
                        >
                          <Plus className="w-3 h-3 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeItem(item._id)}
                    className="p-1 self-start text-gray-300 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {hydratedItems.length > 0 && (
          <div className="border-t border-gray-100 px-6 py-5 space-y-3">
            {/* Totals */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600 font-500">
                <span>Subtotal</span>
                <span>₹{sub.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600 font-500">
                <span>Delivery Charges</span>
                <span className="font-700 text-gray-800">₹{delivery.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-800 text-gray-900 text-base pt-1.5 border-t border-gray-100">
                <span>Total</span>
                <span className="text-primary-500">₹{(sub + delivery).toLocaleString()}</span>
              </div>
            </div>

            <button onClick={handleCheckout} className="btn-primary w-full text-base shadow-button">
              Checkout <ArrowRight className="w-4 h-4" />
            </button>
            <Link href="/cart" onClick={closeCart} className="block text-center text-sm font-600 text-gray-500 hover:text-primary-500 transition-colors">
              View Full Cart
            </Link>
          </div>
        )}
      </motion.div>
    </>
  );
}
