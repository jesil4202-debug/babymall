'use client';

import Link from 'next/link';
import { Heart, ShoppingCart, Star, Zap, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import toast from 'react-hot-toast';
import { useState, memo, useRef } from 'react';
import { getImageUrl } from '@/lib/getImageUrl';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  images: { url: string }[];
  rating: number;
  numReviews: number;
  stock: number;
  category: string;
  isFeatured?: boolean;
  brand?: string;
}

interface ProductCardProps {
  product: Product;
  layout?: 'grid' | 'list';
}

function ProductCardComponent({ product, layout = 'grid' }: ProductCardProps) {
  const router = useRouter();
  const { user, isAuthenticated, toggleWishlist } = useAuthStore();
  const { addItem, isLoading } = useCartStore();
  const [wishlisted, setWishlisted] = useState(
    user?.wishlist?.includes(product._id) || false
  );
  const [addingToCart, setAddingToCart] = useState(false);
  const prefetchedRef = useRef(false);

  const prefetchProduct = () => {
    if (prefetchedRef.current) return;
    prefetchedRef.current = true;

    router.prefetch(`/products/${product.slug}`);
    const cacheKey = `product:detail:${product.slug}`;
    if (typeof window !== 'undefined') {
      const raw = sessionStorage.getItem(cacheKey);
      if (raw) return;
    }

    api
      .get(`/products/${product.slug}`)
      .then(({ data }) => {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(cacheKey, JSON.stringify({ product: data.product, ts: Date.now() }));
        }
      })
      .catch(() => {});
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist');
      return;
    }
    setWishlisted(!wishlisted);
    await toggleWishlist(product._id);
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please login to add to cart');
      return;
    }
    setAddingToCart(true);
    await addItem(product._id, 1);
    setAddingToCart(false);
  };

  const inStock = product.stock > 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  if (layout === 'list') {
    return (
      <Link href={`/products/${product.slug}`} className="block" onMouseEnter={prefetchProduct}>
        <div className="p-4 flex gap-4 card-glass hover:shadow-card-hover group transition-all duration-300">
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-xl overflow-hidden flex-shrink-0 bg-surface-50 group-hover:bg-surface-100 transition-colors">
            {/* Subtle overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.02] transition-colors duration-300 z-10 pointer-events-none" />
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
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                <ImageIcon className="w-8 h-8" />
              </div>
            )}
            {product.discount && product.discount > 0 ? (
              <span className="absolute top-2 left-2 badge-pink text-xs">{product.discount}% off</span>
            ) : null}
          </div>
          <div className="flex-1 min-w-0 py-1">
            <p className="text-xs font-600 text-primary-400 uppercase tracking-wide mb-1">{product.category}</p>
            <h3 className="font-700 text-gray-800 text-base mb-1 line-clamp-2 group-hover:text-primary-500 transition-colors">{product.name}</h3>
            {product.brand && <p className="text-xs text-gray-400 font-500 mb-2">{product.brand}</p>}
            <div className="flex items-center gap-1.5 mb-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(product.rating) ? 'text-warning-500 fill-warning-500' : 'text-gray-200 fill-gray-200'}`} />
                ))}
              </div>
              <span className="text-xs text-gray-400 font-500">({product.numReviews})</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl font-900 text-gray-900 tracking-tight">₹{product.price.toLocaleString()}</span>
              {product.originalPrice && (
                <span className="text-sm text-gray-400 line-through font-500">₹{product.originalPrice.toLocaleString()}</span>
              )}
              {isLowStock && <span className="badge-amber text-xs">Only {product.stock} left!</span>}
              {!inStock && <span className="badge-red text-xs">Out of Stock</span>}
            </div>
          </div>
          <div className="flex flex-col gap-2 justify-end">
            <button onClick={handleWishlist} className={`p-2 rounded-xl border transition-all ${wishlisted ? 'border-primary-200 bg-primary-50 text-primary-500' : 'border-gray-200 text-gray-400 hover:border-primary-200 hover:text-primary-500'}`}>
              <Heart className={`w-4 h-4 ${wishlisted ? 'fill-primary-500' : ''}`} />
            </button>
            <button onClick={handleAddToCart} disabled={!inStock || addingToCart} className="btn-primary py-2 px-3 text-xs disabled:opacity-50">
              <ShoppingCart className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/products/${product.slug}`} className="block group" onMouseEnter={prefetchProduct}>
      <motion.div
        whileHover={{ y: -6 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="h-full flex flex-col card-glass overflow-hidden hover:shadow-card-hover transition-all duration-300 ease-out"
      >
        {/* Image */}
        <div className="relative aspect-square bg-surface-50 overflow-hidden group">
          {/* Subtle overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.03] transition-colors duration-300 z-10 pointer-events-none" />
          {product.images?.[0]?.url ? (
            <img
              src={getImageUrl(product.images[0])}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              onError={(e) => {
                e.currentTarget.src = '/logo.png';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
              <ImageIcon className="w-12 h-12" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
            {product.discount && product.discount > 0 ? (
              <span className="badge-pink shadow-sm">{product.discount}% off</span>
            ) : null}
            {product.isFeatured && (
              <span className="badge-amber shadow-sm flex items-center gap-1">
                <Zap className="w-2.5 h-2.5 fill-warning-600" /> Featured
              </span>
            )}
          </div>

          {/* Wishlist button */}
          <button
            onClick={handleWishlist}
            className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-xl flex items-center justify-center shadow-sm transition-all duration-200
            ${wishlisted ? 'bg-primary-500 text-white' : 'bg-white text-gray-400 hover:text-primary-500'}`}
          >
            <Heart className={`w-4 h-4 ${wishlisted ? 'fill-white' : ''}`} />
          </button>

          {/* Add to cart overlay (Desktop only) */}
          <div className="absolute inset-x-0 bottom-0 p-3 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hidden lg:block bg-gradient-to-t from-black/20 to-transparent pointer-events-none">
            <motion.button
              onClick={handleAddToCart}
              disabled={!inStock || addingToCart}
              className="btn-primary w-full py-2 text-sm font-700 shadow-button pointer-events-auto"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {addingToCart ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Adding...
                </span>
              ) : !inStock ? (
                'Out of Stock'
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  Add to Cart
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 flex flex-col flex-1">
          <p className="text-xs font-600 text-primary-500 uppercase tracking-widest mb-1 truncate">{product.category}</p>
          <h3 className="font-600 text-gray-800 text-sm sm:text-base mb-1.5 line-clamp-2 flex-1 group-hover:text-primary-600 transition-colors leading-snug">
            {product.name}
          </h3>

          {/* Rating */}
          {product.numReviews > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-3 h-3 ${i < Math.round(product.rating) ? 'text-warning-500 fill-warning-500' : 'text-gray-200 fill-gray-200'}`} />
                ))}
              </div>
              <span className="text-xs text-gray-400 font-500">({product.numReviews})</span>
            </div>
          )}

          {/* Price & CTA */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 mt-auto pt-3 border-t border-gray-50/50">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-900 text-gray-900 text-lg tracking-tight">₹{product.price.toLocaleString()}</span>
              {product.originalPrice && (
                <span className="text-xs text-gray-400 line-through font-500">₹{product.originalPrice.toLocaleString()}</span>
              )}
            </div>
            
            {/* Mobile Add to Cart */}
            <motion.button
              onClick={handleAddToCart}
              disabled={!inStock || addingToCart}
              className="lg:hidden w-full h-12 px-3 rounded-xl bg-primary-50 text-primary-500 hover:bg-primary-500 hover:text-white transition-colors disabled:opacity-50"
              aria-label="Add to cart"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <ShoppingCart className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Stock status */}
          {isLowStock && <span className="badge-amber text-xs mt-1.5 w-fit">Only {product.stock} left!</span>}
          {!inStock && <span className="badge-red text-xs mt-1.5 w-fit">Out of Stock</span>}
        </div>
      </motion.div>
    </Link>
  );
}

export default memo(ProductCardComponent);
