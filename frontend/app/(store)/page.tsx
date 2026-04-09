'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ShoppingBag, ChevronRight, Star, Truck, Shield, RotateCcw, Headphones,
  ArrowRight, Baby, ChevronLeft, Image as ImageIcon, Sparkles,
  Shirt, Gamepad2, Bed, Bath, Stethoscope, Plane, Briefcase
} from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import ProductGridSkeleton from '@/components/product/ProductGridSkeleton';
import api from '@/lib/api';

const categories = [
  { name: 'Clothing', icon: Shirt, href: '/products?category=clothing' },
  { name: 'Feeding', icon: Baby, href: '/products?category=feeding' },
  { name: 'Toys', icon: Gamepad2, href: '/products?category=toys' },
  { name: 'Nursery', icon: Bed, href: '/products?category=nursery' },
  { name: 'Bath', icon: Bath, href: '/products?category=bath' },
  { name: 'Health', icon: Stethoscope, href: '/products?category=health' },
  { name: 'Travel', icon: Plane, href: '/products?category=travel' },
  { name: 'Accessories', icon: Briefcase, href: '/products?category=accessories' },
];

const heroSlides = [
  {
    title: 'Every Journey Starts with Love',
    subtitle: 'Premium baby products handpicked for your little one.',
    cta: 'Shop Now',
    href: '/products',
    badge: 'New Arrivals',
    bgColor: 'bg-surface-50',
  },
  {
    title: 'Safe, Soft & Stylish Clothing',
    subtitle: 'Organic cotton clothing for every milestone of your baby.',
    cta: 'Shop Clothing',
    href: '/products?category=clothing',
    badge: 'Trending Collection',
    bgColor: 'bg-secondary-50',
  },
  {
    title: 'Explore & Learn with Joy',
    subtitle: 'Age-appropriate toys that spark curiosity and development.',
    cta: 'Shop Toys',
    href: '/products?category=toys',
    badge: 'Best Sellers',
    bgColor: 'bg-surface-100',
  },
];

const trustFeatures = [
  { icon: Truck, title: 'Safe and Fast Delivery', desc: 'Delivered in 3 to 4 days', color: 'text-primary-500 bg-primary-50' },
  { icon: Shield, title: 'Quality Assured', desc: 'All products tested & certified', color: 'text-secondary-500 bg-secondary-50' },
  { icon: RotateCcw, title: 'Easy Returns', desc: '15-day hassle-free returns', color: 'text-success-500 bg-green-50' },
  { icon: Headphones, title: '24/7 Support', desc: 'Always here to help you', color: 'text-warning-500 bg-amber-50' },
];

const testimonials = [
  { name: 'Priya Sharma', location: 'Mumbai', rating: 5, text: `Beautiful quality products! My baby loves the toys and the clothing is so soft. Baby Mall has become my go-to shop for everything baby-related.` },
  { name: 'Rahul & Anita', location: 'Bangalore', rating: 5, text: 'Fast delivery and packaging was excellent. The products are exactly as described. Highly recommend for new parents!' },
  { name: 'Meera Nair', location: 'Chennai', rating: 5, text: 'Amazing selection of nursery items. Ordered the crib set and it arrived beautifully. Worth every rupee!' },
];

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [newArrivals, setNewArrivals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentSlide((prev) => (prev + 1) % heroSlides.length), 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      try {
        const cacheKey = 'home:products:v1';
        const now = Date.now();
        const ttlMs = 5 * 60 * 1000;

        if (typeof window !== 'undefined') {
          const raw = sessionStorage.getItem(cacheKey);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (now - parsed.ts < ttlMs) {
              setFeaturedProducts(parsed.featuredProducts || []);
              setNewArrivals(parsed.newArrivals || []);
              setIsLoading(false);
              isFetchingRef.current = false;
              return;
            }
          }
        }

        const fetchWithRetry = async (url: string) => {
          try {
            return await api.get(url);
          } catch {
            return await api.get(url);
          }
        };

        const [featuredRes, newRes] = await Promise.all([
          fetchWithRetry('/products/featured'),
          fetchWithRetry('/products?sort=-createdAt&limit=8'),
        ]);
        const nextFeatured = featuredRes.data.products || [];
        const nextArrivals = newRes.data.products || [];
        setFeaturedProducts(nextFeatured);
        setNewArrivals(nextArrivals);

        if (typeof window !== 'undefined') {
          sessionStorage.setItem(
            cacheKey,
            JSON.stringify({
              featuredProducts: nextFeatured,
              newArrivals: nextArrivals,
              ts: now,
            })
          );
        }
      } catch (e) {
        // Show empty state
      } finally {
        isFetchingRef.current = false;
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const slide = heroSlides[currentSlide];

  return (
    <div className="min-h-screen">
      {/* ─── Hero Slider ─── */}
      <section className="relative overflow-hidden">
        <div className={`${slide.bgColor} transition-colors duration-700`}>
          <div className="container-main py-16 sm:py-24 lg:py-32 flex flex-col items-center text-center">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-white text-gray-800 border border-gray-100 px-4 py-1.5 rounded-full text-xs sm:text-sm font-600 mb-6 shadow-sm tracking-wide uppercase animate-fade-in">
                {slide.badge}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-700 text-gray-900 leading-tight mb-6 animate-slide-up text-balance tracking-tight">
                {slide.title}
              </h1>
              <p className="text-lg sm:text-xl text-gray-500 font-400 mb-10 max-w-2xl mx-auto animate-slide-up">
                {slide.subtitle}
              </p>
              <div className="flex flex-wrap justify-center gap-4 animate-slide-up mt-4">
                <Link href={slide.href} className="btn-primary py-3.5 px-8 text-base">
                  <ShoppingBag className="w-5 h-5" />
                  {slide.cta}
                </Link>
                <Link href="/products" className="btn-secondary py-3.5 px-8 text-base">
                  View All Collection <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Slide indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === currentSlide ? 'w-8 bg-gray-800' : 'w-2 bg-gray-300 hover:bg-gray-400'}`}
            />
          ))}
        </div>

        {/* Arrows */}
        <button
          onClick={() => setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white text-gray-500 shadow-sm border border-gray-100 flex items-center justify-center hover:text-gray-900 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={() => setCurrentSlide((prev) => (prev + 1) % heroSlides.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white text-gray-500 shadow-sm border border-gray-100 flex items-center justify-center hover:text-gray-900 transition-colors"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </section>

      {/* ─── Trust Features ─── */}
      <section className="py-10 sm:py-16 border-b border-gray-100">
        <div className="container-main">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {trustFeatures.map((f) => (
              <div key={f.title} className="flex items-center gap-3 p-3 sm:p-4 rounded-2xl bg-white border border-gray-100 hover:border-primary-100 hover:shadow-soft hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-surface-50 text-gray-500">
                  <f.icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-600 text-gray-800 text-sm truncate">{f.title}</p>
                  <p className="text-sm text-gray-500 truncate">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Categories ─── */}
      <section className="py-16 sm:py-20 lg:py-24 bg-surface-100">
        <div className="container-main">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="section-title">Shop by Category</h2>
              <p className="section-subtitle">Everything your little one needs</p>
            </div>
            <Link href="/products" className="hidden sm:flex items-center gap-1 text-gray-500 font-500 text-sm hover:text-gray-900 transition-colors">
              View All Categories <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
            {categories.map((cat) => (
              <Link key={cat.name} href={cat.href} className="group">
                <div className="flex flex-col items-center p-6 rounded-[2rem] bg-white border border-gray-100 hover:shadow-soft hover:-translate-y-1 transition-all duration-300">
                  <div className="w-14 h-14 rounded-full bg-surface-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <cat.icon className="w-6 h-6 text-gray-400 group-hover:text-primary-500 transition-colors" />
                  </div>
                  <span className="text-xs font-500 text-gray-600 text-center tracking-wide uppercase">{cat.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Featured Products ─── */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="container-main">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5 text-primary-500" />
                <span className="badge-pink">Staff Picks</span>
              </div>
              <h2 className="section-title">Featured Products</h2>
              <p className="section-subtitle">Handpicked favorites for your baby</p>
            </div>
            <Link href="/products?featured=true" className="hidden sm:flex btn-secondary py-2 px-4 text-sm">
              See All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {isLoading ? (
            <ProductGridSkeleton count={8} />
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {featuredProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-400 font-400">
              <ImageIcon className="w-12 h-12 mx-auto text-gray-200 mb-4" />
              <p>Featured products coming soon</p>
            </div>
          )}
        </div>
      </section>

      {/* ─── New Arrivals ─── */}
      <section className="py-16 sm:py-20 lg:py-24 bg-white border-t border-gray-50">
        <div className="container-main">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="section-title">New Arrivals</h2>
              <p className="section-subtitle">Fresh picks added every week</p>
            </div>
            <Link href="/products?sort=-createdAt" className="hidden sm:flex btn-secondary py-2 px-4 text-sm">
              See All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {isLoading ? (
            <ProductGridSkeleton count={8} />
          ) : newArrivals.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {newArrivals.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-400 font-400">
              <ImageIcon className="w-12 h-12 mx-auto text-gray-200 mb-4" />
              <p>New arrivals coming soon</p>
            </div>
          )}

          <div className="text-center mt-8">
            <Link href="/products" className="btn-primary inline-flex py-3 px-8">
              View All Products <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="py-16 sm:py-20 lg:py-24 bg-surface-100">
        <div className="container-main">
          <div className="text-center mb-12">
            <h2 className="section-title mb-2">What Parents Say</h2>
            <p className="section-subtitle">Trusted by 10,000+ happy families across India</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="card p-8 bg-white hover:shadow-card-hover transition-all duration-300 ease-out">
                <div className="flex">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-warning-500 fill-warning-500" />
                  ))}
                </div>
                <p className="text-gray-600 font-500 text-sm leading-relaxed mt-3 mb-4">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center">
                    <Baby className="w-4 h-4 text-primary-500" />
                  </div>
                  <div>
                    <p className="font-700 text-sm text-gray-800">{t.name}</p>
                    <p className="text-xs text-gray-400 font-500">{t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
