'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Filter, Grid, List, Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import ProductGridSkeleton from '@/components/product/ProductGridSkeleton';
import api from '@/lib/api';

const CATEGORIES = ['clothing', 'feeding', 'toys', 'nursery', 'bath', 'health', 'travel', 'accessories'];
const AGE_GROUPS = ['0-3m', '3-6m', '6-12m', '1-2y', '2-3y', '3-5y', '5+y', 'all'];
const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest First' },
  { value: 'price', label: 'Price: Low to High' },
  { value: '-price', label: 'Price: High to Low' },
  { value: '-rating', label: 'Top Rated' },
  { value: '-numReviews', label: 'Most Reviewed' },
];

function ProductsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const fetchCacheRef = useRef<Record<string, any>>({});
  const isFetchingRef = useRef(false);

  // Filters
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    ageGroup: searchParams.get('ageGroup') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    search: searchParams.get('search') || '',
    sort: searchParams.get('sort') || '-createdAt',
    featured: searchParams.get('featured') || '',
    page: Number(searchParams.get('page')) || 1,
  });

  const { category, ageGroup, minPrice, maxPrice, search, sort, featured, page } = filters;

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => {
        if (prev.search === searchInput) return prev;
        return { ...prev, search: searchInput, page: 1 };
      });
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const fetchProducts = async () => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (category) params.set('category', category);
        if (ageGroup) params.set('ageGroup', ageGroup);
        if (minPrice) params.set('minPrice', String(minPrice));
        if (maxPrice) params.set('maxPrice', String(maxPrice));
        if (search) params.set('search', search);
        if (sort) params.set('sort', sort);
        if (featured) params.set('featured', String(featured));
        if (page) params.set('page', String(page));

        const queryString = params.toString();
        const cacheKey = `products:${queryString}`;
        const now = Date.now();
        const memoryCache = fetchCacheRef.current[cacheKey];
        if (memoryCache && now - memoryCache.ts < 120000) {
          setProducts(memoryCache.products);
          setTotal(memoryCache.total);
          setPages(memoryCache.pages);
          setIsLoading(false);
          router.replace(`/products?${queryString}`, { scroll: false });
          return;
        }

        if (typeof window !== 'undefined') {
          const raw = sessionStorage.getItem(cacheKey);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (now - parsed.ts < 120000) {
              setProducts(parsed.products || []);
              setTotal(parsed.total || 0);
              setPages(parsed.pages || 1);
              fetchCacheRef.current[cacheKey] = parsed;
              setIsLoading(false);
              router.replace(`/products?${queryString}`, { scroll: false });
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

        const { data } = await fetchWithRetry(`/products?${queryString}`);
        setProducts(data.products || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
        const payload = {
          products: data.products || [],
          total: data.total || 0,
          pages: data.pages || 1,
          ts: now,
        };
        fetchCacheRef.current[cacheKey] = payload;
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(cacheKey, JSON.stringify(payload));
        }

        // Prefetch next page in background for instant pagination UX.
        const nextPage = (Number(page) || 1) + 1;
        const totalPages = data.pages || 1;
        if (nextPage <= totalPages) {
          const nextParams = new URLSearchParams(params.toString());
          nextParams.set('page', String(nextPage));
          const nextQueryString = nextParams.toString();
          const nextCacheKey = `products:${nextQueryString}`;
          const existingPrefetch = fetchCacheRef.current[nextCacheKey];
          if (!existingPrefetch || now - existingPrefetch.ts >= 120000) {
            fetchWithRetry(`/products?${nextQueryString}`)
              .then((prefetchRes) => {
                const prefetchedPayload = {
                  products: prefetchRes.data.products || [],
                  total: prefetchRes.data.total || 0,
                  pages: prefetchRes.data.pages || 1,
                  ts: Date.now(),
                };
                fetchCacheRef.current[nextCacheKey] = prefetchedPayload;
                if (typeof window !== 'undefined') {
                  sessionStorage.setItem(nextCacheKey, JSON.stringify(prefetchedPayload));
                }
              })
              .catch(() => {});
          }
        }

        // Update URL to match current filters
        router.replace(`/products?${queryString}`, { scroll: false });
      } catch (err) {
        console.error(err);
        setProducts([]);
      } finally {
        isFetchingRef.current = false;
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [category, ageGroup, minPrice, maxPrice, search, sort, featured, page]); // Only primitive dependencies as requested

  const updateFilter = (key: string, value: string | number) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({ category: '', ageGroup: '', minPrice: '', maxPrice: '', search: '', sort: '-createdAt', featured: '', page: 1 });
  };

  const hasActiveFilters = filters.category || filters.ageGroup || filters.minPrice || filters.maxPrice || filters.search || filters.featured;

  const FilterPanel = () => (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <p className="text-sm font-700 text-gray-800 mb-2">Search</p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="input pl-9 text-sm py-2.5"
          />
        </div>
      </div>

      {/* Category */}
      <div>
        <p className="text-sm font-700 text-gray-800 mb-2">Category</p>
        <div className="space-y-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => updateFilter('category', filters.category === cat ? '' : cat)}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm font-600 capitalize transition-all duration-150
              ${filters.category === cat ? 'bg-primary-500 text-white' : 'text-gray-600 hover:bg-surface-100 hover:text-primary-500'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Age Group */}
      <div>
        <p className="text-sm font-700 text-gray-800 mb-2">Age Group</p>
        <div className="flex flex-wrap gap-2">
          {AGE_GROUPS.map((age) => (
            <button
              key={age}
              onClick={() => updateFilter('ageGroup', filters.ageGroup === age ? '' : age)}
              className={`px-3 py-1.5 rounded-lg text-xs font-700 transition-all
              ${filters.ageGroup === age ? 'bg-primary-500 text-white' : 'bg-surface-100 text-gray-600 hover:bg-primary-50 hover:text-primary-500'}`}
            >
              {age}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <p className="text-sm font-700 text-gray-800 mb-2">Price Range</p>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice}
            onChange={(e) => updateFilter('minPrice', e.target.value)}
            className="input text-sm py-2 flex-1"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice}
            onChange={(e) => updateFilter('maxPrice', e.target.value)}
            className="input text-sm py-2 flex-1"
          />
        </div>
      </div>

      {/* Clear */}
      {hasActiveFilters && (
        <button onClick={clearFilters} className="w-full btn-secondary text-sm py-2.5">
          <X className="w-4 h-4" /> Clear Filters
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Page header */}
      <div className="bg-surface-100 border-b border-gray-100 py-8">
        <div className="container-main">
          <h1 className="section-title mb-1">
            {filters.category
              ? filters.category.charAt(0).toUpperCase() + filters.category.slice(1)
              : filters.search
              ? `Search: "${filters.search}"`
              : 'All Products'}
          </h1>
          <p className="text-gray-400 font-500 text-sm">
            {isLoading ? '...' : `${total} products found`}
          </p>
        </div>
      </div>

      <div className="container-main py-8">
        <div className="flex gap-8">


          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 mb-6">
              {/* Filter Button */}
              <button
                onClick={() => setMobileFilterOpen(true)}
                className="flex items-center gap-2 btn-secondary py-2 px-4 text-sm"
              >
                <Filter className="w-4 h-4" />
                Filters
                {hasActiveFilters && <span className="badge-pink text-xs">!</span>}
              </button>

              {/* Sort */}
              <div className="flex items-center gap-2 ml-auto">
                <select
                  value={filters.sort}
                  onChange={(e) => updateFilter('sort', e.target.value)}
                  className="input text-sm py-2 pr-8 w-auto min-w-0 appearance-none cursor-pointer"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>

                {/* Layout toggle */}
                <div className="hidden sm:flex items-center gap-1 bg-surface-100 rounded-xl p-1">
                  <button
                    onClick={() => setLayout('grid')}
                    className={`p-2 rounded-lg transition-all ${layout === 'grid' ? 'bg-white shadow-sm text-primary-500' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setLayout('list')}
                    className={`p-2 rounded-lg transition-all ${layout === 'list' ? 'bg-white shadow-sm text-primary-500' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Products */}
            {isLoading ? (
              <ProductGridSkeleton count={12} list={layout === 'list'} />
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <div className="h-8 mb-4" />
                <h3 className="font-800 text-xl text-gray-800 mb-2">No products found</h3>
                <p className="text-gray-400 font-500 mb-6">Try adjusting your filters or search query</p>
                <button onClick={clearFilters} className="btn-primary">Clear Filters</button>
              </div>
            ) : layout === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} layout="list" />
                ))}
              </div>
            )}

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => updateFilter('page', Math.max(1, filters.page - 1))}
                  disabled={filters.page === 1}
                  className="btn-secondary py-2 px-4 text-sm disabled:opacity-40"
                >
                  Previous
                </button>
                {[...Array(Math.min(pages, 7))].map((_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      onClick={() => updateFilter('page', p)}
                      className={`w-10 h-10 rounded-xl text-sm font-700 transition-all
                      ${filters.page === p ? 'bg-primary-500 text-white shadow-button' : 'bg-surface-100 text-gray-600 hover:bg-primary-50 hover:text-primary-500'}`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => updateFilter('page', Math.min(pages, filters.page + 1))}
                  disabled={filters.page === pages}
                  className="btn-secondary py-2 px-4 text-sm disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Modal/Drawer */}
      {mobileFilterOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[80]" onClick={() => setMobileFilterOpen(false)} />
          <div className="fixed inset-0 sm:inset-auto sm:top-0 sm:bottom-0 sm:right-0 sm:w-80 bg-white z-[90] p-6 lg:p-8 overflow-y-auto animate-slide-in-right">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-800 text-gray-900 text-lg">Filters</h3>
              <button onClick={() => setMobileFilterOpen(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <FilterPanel />
            <button className="btn-primary w-full mt-5 py-3" onClick={() => setMobileFilterOpen(false)}>
              Apply Filters
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
      </div>
    }>
      <ProductsPageContent />
    </Suspense>
  );
}
