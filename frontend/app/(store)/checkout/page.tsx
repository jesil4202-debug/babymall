'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User, Phone, MapPin, Hash, CreditCard, Truck,
  ShieldCheck, ArrowLeft, CheckCircle2
} from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { getImageUrl } from '@/lib/getImageUrl';

interface ShippingForm {
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
}

const PHONE_REGEX = /^[6-9]\d{9}$/;
const PINCODE_REGEX = /^\d{6}$/;

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, deliveryCharge, total, clearCart } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();

  const sub = subtotal();
  const delivery = deliveryCharge();
  const tot = total();

  const [form, setForm] = useState<ShippingForm>({
    name: user?.name || '',
    phone: user?.phone || '',
    street: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'razorpay'>('cod');
  const [isPlacing, setIsPlacing] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [errors, setErrors] = useState<Partial<ShippingForm>>({});

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/checkout');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && items.length === 0 && !placed) {
      router.push('/cart');
    }
  }, [items.length, isAuthenticated, placed]);

  const validate = (): boolean => {
    const newErrors: Partial<ShippingForm> = {};
    if (!form.name.trim()) newErrors.name = 'Full name is required.';
    if (!PHONE_REGEX.test(form.phone)) newErrors.phone = 'Enter a valid 10-digit Indian mobile number.';
    if (!form.street.trim()) newErrors.street = 'Street address is required.';
    if (!form.city.trim()) newErrors.city = 'City is required.';
    if (!form.state.trim()) newErrors.state = 'State is required.';
    if (!PINCODE_REGEX.test(form.pincode)) newErrors.pincode = 'Enter a valid 6-digit pincode.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof ShippingForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the errors before placing the order.');
      return;
    }

    setIsPlacing(true);
    try {
      const orderPayload = {
        items: items.map((item) => ({
          product: item.product._id,
          name: item.product.name,
          image: item.product.images?.[0]?.url || '',
          price: item.price ?? item.variant?.price ?? item.product.price,
          deliveryCharge: item.deliveryCharge ?? item.product?.deliveryCharge ?? 0,
          quantity: item.quantity,
          variant: item.variant || undefined,
        })),
        shippingAddress: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          street: form.street.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          pincode: form.pincode.trim(),
        },
        paymentMethod,
        itemsTotal: sub,
        deliveryCharge: delivery,
        totalAmount: tot,
      };

      const { data } = await api.post('/orders', orderPayload);
      setOrderId(data.order?.orderNumber || data.order?._id || '');
      setPlaced(true);
      await clearCart();
      toast.success('Order placed successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setIsPlacing(false);
    }
  };

  // ── Order Placed Success Screen ───────────────────────────────────────────
  if (placed) {
    return (
      <div className="min-h-screen bg-surface-100 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center animate-scale-in">
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-success-500" />
          </div>
          <h1 className="text-3xl font-900 text-gray-900 mb-2">Order Placed!</h1>
          {orderId && (
            <p className="text-gray-400 font-500 mb-1">Order ID: <span className="font-800 text-gray-700">{orderId}</span></p>
          )}
          <p className="text-gray-400 font-500 mb-8">
            We&apos;ve received your order and will start processing it right away.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/account/orders" className="btn-primary py-3 px-6">
              View My Orders
            </Link>
            <Link href="/products" className="btn-secondary py-3 px-6">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Checkout Form ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-surface-100 py-8 sm:py-12">
      <div className="container-main">
        {/* Back */}
        <Link href="/cart" className="flex items-center gap-2 text-sm font-700 text-gray-400 hover:text-gray-700 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Cart
        </Link>

        <h1 className="section-title mb-8">Checkout</h1>

        <form onSubmit={handlePlaceOrder}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ── Left: Shipping Form ── */}
            <div className="lg:col-span-2 space-y-6">

              {/* Shipping Details */}
              <div className="card-glass p-6">
                <h2 className="font-800 text-gray-900 text-lg mb-5 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary-500" /> Shipping Address
                </h2>

                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="label">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={form.name}
                        onChange={handleChange('name')}
                        placeholder="Enter your full name"
                        className={`input pl-10 ${errors.name ? 'border-red-400 focus:border-red-400' : ''}`}
                      />
                    </div>
                    {errors.name && <p className="text-xs text-red-500 font-600 mt-1">{errors.name}</p>}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="label">Mobile Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={handleChange('phone')}
                        placeholder="10-digit Indian mobile number"
                        maxLength={10}
                        className={`input pl-10 ${errors.phone ? 'border-red-400 focus:border-red-400' : ''}`}
                      />
                    </div>
                    {errors.phone ? (
                      <p className="text-xs text-red-500 font-600 mt-1">{errors.phone}</p>
                    ) : (
                      <p className="text-xs text-gray-400 font-500 mt-1">Must start with 6, 7, 8, or 9</p>
                    )}
                  </div>

                  {/* Street */}
                  <div>
                    <label className="label">Street Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={form.street}
                        onChange={handleChange('street')}
                        placeholder="House no., building, street, area"
                        className={`input pl-10 ${errors.street ? 'border-red-400 focus:border-red-400' : ''}`}
                      />
                    </div>
                    {errors.street && <p className="text-xs text-red-500 font-600 mt-1">{errors.street}</p>}
                  </div>

                  {/* City + State */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">City</label>
                      <input
                        type="text"
                        value={form.city}
                        onChange={handleChange('city')}
                        placeholder="City"
                        className={`input ${errors.city ? 'border-red-400 focus:border-red-400' : ''}`}
                      />
                      {errors.city && <p className="text-xs text-red-500 font-600 mt-1">{errors.city}</p>}
                    </div>
                    <div>
                      <label className="label">State</label>
                      <input
                        type="text"
                        value={form.state}
                        onChange={handleChange('state')}
                        placeholder="State"
                        className={`input ${errors.state ? 'border-red-400 focus:border-red-400' : ''}`}
                      />
                      {errors.state && <p className="text-xs text-red-500 font-600 mt-1">{errors.state}</p>}
                    </div>
                  </div>

                  {/* Pincode */}
                  <div>
                    <label className="label">Pincode</label>
                    <div className="relative">
                      <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={form.pincode}
                        onChange={handleChange('pincode')}
                        placeholder="6-digit pincode"
                        maxLength={6}
                        className={`input pl-10 ${errors.pincode ? 'border-red-400 focus:border-red-400' : ''}`}
                      />
                    </div>
                    {errors.pincode && <p className="text-xs text-red-500 font-600 mt-1">{errors.pincode}</p>}
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="card-glass p-6">
                <h2 className="font-800 text-gray-900 text-lg mb-5 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary-500" /> Payment Method
                </h2>
                <div className="space-y-3">
                  {[
                    { value: 'cod', label: 'Cash on Delivery', icon: '', desc: 'Pay when your order arrives' },
                    { value: 'razorpay', label: 'Pay Online (Razorpay)', icon: '', desc: 'UPI, cards, net banking & more' },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        paymentMethod === opt.value
                          ? 'border-primary-400 bg-primary-50'
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={opt.value}
                        checked={paymentMethod === opt.value}
                        onChange={() => setPaymentMethod(opt.value as 'cod' | 'razorpay')}
                        className="sr-only"
                      />
                      <span className="text-2xl">{opt.icon}</span>
                      <div className="flex-1">
                        <p className="font-700 text-gray-800 text-sm">{opt.label}</p>
                        <p className="text-xs text-gray-400 font-500">{opt.desc}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        paymentMethod === opt.value ? 'border-primary-500' : 'border-gray-300'
                      }`}>
                        {paymentMethod === opt.value && (
                          <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Right: Order Summary ── */}
            <div className="lg:col-span-1">
              <div className="card-glass p-6 sticky top-24">
                <h2 className="font-800 text-gray-900 text-lg mb-5">Order Summary</h2>

                {/* Items */}
                <div className="space-y-3 mb-5 max-h-48 overflow-y-auto pr-1 no-scrollbar">
                  {items.map((item) => (
                    <div key={item._id} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-100 flex-shrink-0">
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
                          <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">No image</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-700 text-gray-800 truncate">{item.product?.name}</p>
                        <p className="text-xs text-gray-400 font-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-800 text-gray-800 flex-shrink-0">
                        ₹{((item.price ?? item.variant?.price ?? item.product?.price ?? 0) * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>

                <hr className="border-gray-100 mb-4" />

                {/* Totals */}
                <div className="space-y-2.5 mb-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-500">Subtotal</span>
                    <span className="font-700 text-gray-800">₹{sub.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-500">Delivery Charges</span>
                    <span className="font-700 text-gray-800">₹{delivery.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center py-4 border-t border-b border-gray-100 mb-5">
                  <span className="font-800 text-gray-900">Total Payable</span>
                  <span className="font-900 text-primary-500 text-2xl">₹{tot.toLocaleString()}</span>
                </div>

                <button
                  type="submit"
                  disabled={isPlacing}
                  className="btn-primary w-full py-4 text-base shadow-button"
                >
                  {isPlacing ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Placing Order…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" /> Place Order
                    </span>
                  )}
                </button>

                {/* Trust badges */}
                <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-gray-400 font-600">
                  <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Secure</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> Fast Delivery</span>
                  <span>•</span>
                  <span>Easy Returns</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
