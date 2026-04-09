'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShoppingCart, Heart, Star, ChevronLeft, ChevronRight, Check,
  Truck, RotateCcw, Shield, Share2, Zap, Package, MessageCircle
} from 'lucide-react';
import api from '@/lib/api';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import ProductCard from '@/components/product/ProductCard';
import toast from 'react-hot-toast';
import { getImageUrl } from '@/lib/getImageUrl';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { addItem } = useCartStore();
  const { user, isAuthenticated, toggleWishlist } = useAuthStore();

  const [product, setProduct] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [activeTab, setActiveTab] = useState<'desc' | 'reviews'>('desc');

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      try {
        const cacheKey = `product:detail:${slug}`;
        if (typeof window !== 'undefined') {
          const raw = sessionStorage.getItem(cacheKey);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Date.now() - parsed.ts < 5 * 60 * 1000) {
              setProduct(parsed.product);
              setWishlisted(user?.wishlist?.includes(parsed.product?._id) || false);
              setIsLoading(false);
            }
          }
        }

        const { data } = await api.get(`/products/${slug}`);
        setProduct(data.product);
        setWishlisted(user?.wishlist?.includes(data.product._id) || false);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(
            `product:detail:${slug}`,
            JSON.stringify({ product: data.product, ts: Date.now() })
          );
        }
        // Fetch related
        const relRes = await api.get(`/products?category=${data.product.category}&limit=5`);
        setRelated(relRes.data.products?.filter((p: any) => p._id !== data.product._id).slice(0, 4) || []);
      } catch {
        router.push('/products');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) { toast.error('Please login to add to cart'); return; }
    setAddingToCart(true);
    await addItem(product._id, quantity, selectedVariant);
    setAddingToCart(false);
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    router.push('/checkout');
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) { toast.error('Please login'); return; }
    setWishlisted(!wishlisted);
    await toggleWishlist(product._id);
    toast.success(wishlisted ? 'Removed from wishlist' : 'Added to wishlist');
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.error('Please login to review'); return; }
    setSubmittingReview(true);
    try {
      await api.post(`/products/${product._id}/reviews`, { rating: reviewRating, comment: reviewText });
      toast.success('Review submitted!');
      setReviewText('');
      // Refresh
      const { data } = await api.get(`/products/${slug}`);
      setProduct(data.product);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const price = selectedVariant?.price || product?.price;
  const inStock = product?.stock > 0;

  if (isLoading) {
    return (
      <div className="container-main py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="skeleton aspect-square rounded-3xl" />
          <div className="space-y-4">
            <div className="skeleton h-6 rounded w-1/3" />
            <div className="skeleton h-10 rounded w-3/4" />
            <div className="skeleton h-6 rounded w-1/4" />
            <div className="skeleton h-8 rounded w-1/3" />
            <div className="skeleton h-12 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="border-b border-gray-100 bg-surface-100">
        <div className="container-main py-3 flex items-center gap-2 text-sm text-gray-400 font-500">
          <Link href="/" className="hover:text-primary-500 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-primary-500 transition-colors">Products</Link>
          <span>/</span>
          <Link href={`/products?category=${product.category}`} className="hover:text-primary-500 transition-colors capitalize">{product.category}</Link>
          <span>/</span>
          <span className="text-gray-700 font-600 truncate max-w-xs">{product.name}</span>
        </div>
      </div>

      <div className="container-main py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* ─── Images ─── */}
          <div className="space-y-4">
            {/* Main image */}
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-surface-100 group">
              {product.images?.[activeImage]?.url ? (
                  <img
                    src={getImageUrl(product.images[activeImage])}
                    alt={product.name}
                    loading="eager"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.currentTarget.src = '/logo.png';
                    }}
                  />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">No image</div>
              )}

              {/* Discount badge */}
              {product.discount > 0 && (
                <div className="absolute top-4 left-4">
                  <span className="badge-pink text-sm shadow-sm">{product.discount}% OFF</span>
                </div>
              )}

              {/* Image nav */}
              {product.images?.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImage((prev) => (prev - 1 + product.images.length) % product.images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-full shadow-card flex items-center justify-center hover:shadow-card-hover transition-all opacity-0 group-hover:opacity-100"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActiveImage((prev) => (prev + 1) % product.images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-full shadow-card flex items-center justify-center hover:shadow-card-hover transition-all opacity-0 group-hover:opacity-100"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {product.images?.length > 1 && (
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                {product.images.map((img: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all
                    ${activeImage === i ? 'border-primary-400 shadow-soft' : 'border-gray-200 hover:border-primary-200'}`}
                  >
                    <div className="relative w-full h-full">
                      <img
                        src={getImageUrl(img)}
                        alt=""
                        loading="lazy"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/logo.png';
                        }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ─── Product Info ─── */}
          <div className="flex flex-col gap-5">
            {/* Category & Brand */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="badge-pink capitalize">{product.category}</span>
              {product.brand && <span className="badge-blue">{product.brand}</span>}
              {product.ageGroup !== 'all' && <span className="badge-amber">{product.ageGroup}</span>}
            </div>

            {/* Name */}
            <h1 className="text-2xl sm:text-3xl font-900 text-gray-900 leading-snug">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-5 h-5 ${i < Math.round(product.rating) ? 'text-warning-500 fill-warning-500' : 'text-gray-200 fill-gray-200'}`} />
                ))}
              </div>
              <span className="font-700 text-gray-700">{product.rating}</span>
              <span className="text-gray-400 font-500 text-sm">({product.numReviews} reviews)</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 flex-wrap bg-surface-100/50 p-4 rounded-2xl border border-gray-50">
              <span className="text-4xl sm:text-5xl font-900 text-gray-900 tracking-tight">₹{(price || 0).toLocaleString()}</span>
              {product.originalPrice && (
                <>
                  <span className="text-xl text-gray-400 line-through font-500">₹{product.originalPrice.toLocaleString()}</span>
                  <span className="badge-green text-sm px-2 py-1">Save ₹{(product.originalPrice - price).toLocaleString()}</span>
                </>
              )}
            </div>

            {/* Delivery Charge – Flipkart style */}
            <div className="flex items-start gap-3 bg-blue-50/60 border border-blue-100 rounded-2xl px-4 py-3">
              <Truck className="w-4 h-4 text-secondary-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-700 text-gray-500 uppercase tracking-wide">Delivery Charge</p>
                <p className="font-800 text-gray-900 text-sm mt-0.5">
                  ₹{(product.deliveryCharge ?? 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-400 font-500 mt-0.5">Delivery in 3–5 business days</p>
              </div>
            </div>

            {/* Short description */}
            {product.shortDescription && (
              <p className="text-gray-500 font-500 text-sm leading-relaxed border-t border-gray-100 pt-4">
                {product.shortDescription}
              </p>
            )}

            {/* Variants */}
            {product.variants?.map((variant: any) => (
              <div key={variant.name}>
                <p className="text-sm font-700 text-gray-700 mb-2">{variant.name}</p>
                <div className="flex flex-wrap gap-2">
                  {variant.options.map((opt: any) => (
                    <button
                      key={opt.label}
                      disabled={opt.stock === 0}
                      onClick={() => setSelectedVariant({ name: variant.name, label: opt.label, price: opt.price })}
                      className={`px-4 py-2 rounded-xl text-sm font-700 border-2 transition-all disabled:opacity-40 disabled:line-through
                      ${selectedVariant?.label === opt.label
                        ? 'border-primary-500 bg-primary-50 text-primary-600'
                        : 'border-gray-200 text-gray-600 hover:border-primary-300'}`}
                    >
                      {opt.label} {opt.price && opt.price !== product.price ? `(+₹${(opt.price - product.price).toLocaleString()})` : ''}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Quantity */}
            <div>
              <p className="text-sm font-700 text-gray-700 mb-2">Quantity</p>
              <div className="flex items-center gap-2">
                <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center hover:bg-surface-100 transition-colors"
                  >
                    −
                  </button>
                  <span className="w-12 text-center font-800 text-gray-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                    className="w-10 h-10 flex items-center justify-center hover:bg-surface-100 transition-colors disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
                {/* Stock indicator */}
                {inStock ? (
                  <span className="badge-green flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    {product.stock <= 10 ? `Only ${product.stock} left` : 'In Stock'}
                  </span>
                ) : (
                  <span className="badge-red">Out of Stock</span>
                )}
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-3 flex-col sm:flex-row">
              <button
                onClick={handleAddToCart}
                disabled={!inStock || addingToCart}
                className="btn-secondary hidden sm:flex flex-1 py-4 text-base disabled:opacity-50"
              >
                {addingToCart ? (
                  <><span className="w-5 h-5 border-2 border-primary-300 border-t-primary-500 rounded-full animate-spin" /> Adding...</>
                ) : (
                  <><ShoppingCart className="w-5 h-5" /> Add to Cart</>
                )}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={!inStock}
                className="btn-primary hidden sm:flex flex-1 py-4 text-base shadow-[var(--shadow-button)] disabled:opacity-50"
              >
                <Zap className="w-5 h-5" /> Buy Now
              </button>
              <button
                onClick={handleWishlist}
                className={`p-4 flex items-center justify-center gap-2 rounded-2xl border-2 transition-all ${wishlisted ? 'border-primary-300 bg-primary-50 text-primary-500' : 'border-gray-200 text-gray-400 hover:border-primary-300 hover:text-primary-500'}`}
              >
                <Heart className={`w-5 h-5 ${wishlisted ? 'fill-primary-500' : ''}`} />
                <span className="sm:hidden font-700">{wishlisted ? 'Added to Wishlist' : 'Add to Wishlist'}</span>
              </button>
            </div>

            {/* Trust Strip */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              {[
                { icon: Package, text: 'Delivery Charge Included', color: 'text-primary-500 bg-primary-50' },
                { icon: RotateCcw, text: '15-Day Returns', color: 'text-success-500 bg-green-50' },
                { icon: Shield, text: 'Quality Assured', color: 'text-secondary-500 bg-blue-50' },
              ].map((f) => (
                <div key={f.text} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl ${f.color.split(' ')[1]}`}>
                  <f.icon className={`w-4 h-4 ${f.color.split(' ')[0]}`} />
                  <span className="text-xs font-600 text-gray-600 text-center leading-tight">{f.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Tabs: Description & Reviews ─── */}
        <div className="mt-12 lg:mt-16">
          <div className="flex gap-1 border-b border-gray-100 mb-8">
            {(['desc', 'reviews'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-700 text-sm capitalize transition-all border-b-2 -mb-px
                ${activeTab === tab ? 'border-primary-500 text-primary-500' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
              >
                {tab === 'desc' ? 'Description' : `Reviews (${product.numReviews})`}
              </button>
            ))}
          </div>

          {activeTab === 'desc' ? (
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 font-500 leading-relaxed whitespace-pre-wrap text-base">{product.description}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Review form */}
              {isAuthenticated && (
                <div className="card-flat p-6">
                  <h3 className="font-800 text-gray-900 mb-4 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-primary-500" /> Write a Review
                  </h3>
                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    <div>
                      <p className="label">Your Rating</p>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button key={s} type="button" onClick={() => setReviewRating(s)}>
                            <Star className={`w-7 h-7 transition-colors ${s <= reviewRating ? 'text-warning-500 fill-warning-500' : 'text-gray-200 fill-gray-200'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="label">Your Review</label>
                      <textarea
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        required
                        rows={3}
                        placeholder="Share your experience with this product..."
                        className="input resize-none"
                      />
                    </div>
                    <button type="submit" disabled={submittingReview} className="btn-primary py-2.5 px-6 text-sm">
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </form>
                </div>
              )}

              {/* Reviews list */}
              {product.reviews?.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <div className="h-6 mb-3" />
                  <p className="font-600">No reviews yet. Be the first to review!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {product.reviews?.map((review: any) => (
                    <div key={review._id} className="card-flat p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-700 text-gray-800">{review.name}</p>
                          <p className="text-xs text-gray-400 font-500 mt-0.5">
                            {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-warning-500 fill-warning-500' : 'text-gray-200 fill-gray-200'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-600 font-500 text-sm mt-3 leading-relaxed">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── Related Products ─── */}
        {related.length > 0 && (
          <div className="mt-16 pb-24 sm:pb-0">
            <h2 className="section-title mb-8">You Might Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {related.map((p) => <ProductCard key={p._id} product={p} />)}
            </div>
          </div>
        )}
      </div>

      {/* ─── Mobile Sticky Bottom CTA ─── */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white border-t border-gray-100 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] z-50 sm:hidden flex gap-3 pb-safe animate-slide-up">
        <button
          onClick={handleAddToCart}
          disabled={!inStock || addingToCart}
          className="btn-secondary flex-1 py-3.5 text-sm disabled:opacity-50 bg-surface-100"
        >
          {addingToCart ? 'Adding...' : 'Add to Cart'}
        </button>
        <button
          onClick={handleBuyNow}
          disabled={!inStock}
          className="btn-primary flex-1 py-3.5 text-sm shadow-[var(--shadow-button)] disabled:opacity-50"
        >
          Buy Now
        </button>
      </div>
    </div>
  );
}
