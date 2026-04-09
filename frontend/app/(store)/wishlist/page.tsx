'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { getImageUrl } from '@/lib/getImageUrl';

export default function WishlistPage() {
  const { user, isAuthenticated, toggleWishlist } = useAuthStore();
  const { addItem } = useCartStore();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    fetchWishlist();
  }, [isAuthenticated, user?.wishlist?.length]);

  const fetchWishlist = async () => {
    if (!user?.wishlist?.length) { setProducts([]); setIsLoading(false); return; }
    try {
      const results = await Promise.all(
        user.wishlist.map((id: string) => api.get(`/products/${id}`).catch(() => null))
      );
      setProducts(results.filter(Boolean).map((r) => r?.data?.product).filter(Boolean));
    } catch {
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (productId: string) => {
    await toggleWishlist(productId);
    setProducts((prev) => prev.filter((p) => p._id !== productId));
  };

  if (isLoading) return (
    <div className="min-h-screen bg-surface-100 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-100 py-8">
      <div className="container-main max-w-5xl">
        <h1 className="section-title mb-6 flex items-center gap-3">
          <Heart className="w-7 h-7 text-primary-500 fill-primary-500" /> My Wishlist
          <span className="badge-pink text-base">{products.length}</span>
        </h1>

        {products.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-20 h-20 rounded-3xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-10 h-10 text-primary-200" />
            </div>
            <h2 className="font-800 text-xl text-gray-800 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-400 font-500 mb-6">Save products you love to your wishlist</p>
            <Link href="/products" className="btn-primary inline-flex">Browse Products</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <div key={product._id} className="card overflow-hidden group">
                <Link href={`/products/${product.slug}`}>
                  <div className="relative aspect-square bg-surface-100 overflow-hidden">
                    {product.images?.[0]?.url ? (
                      <img
                        src={getImageUrl(product.images[0])}
                        alt={product.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.src = '/logo.png';
                        }}
                      />
                    ) : <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">No image</div>}
                  </div>
                </Link>
                <div className="p-3">
                  <p className="text-xs font-600 text-primary-400 mb-0.5 capitalize">{product.category}</p>
                  <p className="font-700 text-gray-800 text-sm line-clamp-2 mb-2">{product.name}</p>
                  <p className="font-800 text-gray-900 mb-3">₹{product.price?.toLocaleString()}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => addItem(product._id, 1)}
                      className="flex-1 btn-primary text-xs py-2"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" /> Add to Cart
                    </button>
                    <button onClick={() => handleRemove(product._id)} className="p-2 rounded-xl border border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-400 text-gray-400 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
