'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, Plus, ChevronDown, Save } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import AdminSidebar from '@/components/admin/AdminSidebar';

const CATEGORIES = ['clothing', 'feeding', 'toys', 'nursery', 'bath', 'health', 'travel', 'accessories'];
const AGE_GROUPS = ['0-3m', '3-6m', '6-12m', '1-2y', '2-3y', '3-5y', '5+y', 'all'];

export default function NewProductPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const [form, setForm] = useState({
    name: '', description: '', shortDescription: '', price: '',
    originalPrice: '', deliveryCharge: '', category: '', ageGroup: 'all', brand: '',
    stock: '', isFeatured: false, isActive: true, tags: '',
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 6 - imageFiles.length);
    setImageFiles((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreviews((prev) => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (i: number) => {
    setImageFiles((prev) => prev.filter((_, idx) => idx !== i));
    setImagePreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.category || !form.stock || form.deliveryCharge === '' || imageFiles.length === 0) {
      toast.error('Please fill all required fields');
      return;
    }
    if (Number(form.price) < 0 || Number(form.stock) < 0 || Number(form.deliveryCharge) < 0) {
      toast.error('Price, stock, and delivery charge must be non-negative.');
      return;
    }
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== '' && v !== undefined) formData.append(k, String(v));
      });
      imageFiles.forEach((file) => formData.append('images', file));
      if (form.tags) {
        form.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
          .forEach((t) => formData.append('tags[]', t));
      }

      await api.post("/products", formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Product created successfully!');
      router.push('/admin/products');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-100">
      <div className="flex">
        <AdminSidebar activeItem="products" />

        <main className="lg:ml-64 flex-1 p-6 lg:p-8">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/admin/products" className="text-gray-400 hover:text-primary-500 font-600 text-sm">← Products</Link>
            <span className="text-gray-300">/</span>
            <h1 className="text-2xl font-900 text-gray-900">Add New Product</h1>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Main info */}
              <div className="lg:col-span-2 space-y-5">
                {/* Basic Info */}
                <div className="card p-6 space-y-4">
                  <h2 className="font-800 text-gray-900">Basic Information</h2>
                  <div>
                    <label className="label">Product Name *</label>
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="input" placeholder="e.g. Organic Cotton Baby Onesie" />
                  </div>
                  <div>
                    <label className="label">Short Description</label>
                    <input value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} className="input" placeholder="One-liner summary..." />
                  </div>
                  <div>
                    <label className="label">Full Description *</label>
                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows={5} className="input resize-none" placeholder="Detailed product description..." />
                  </div>
                  <div>
                    <label className="label">Tags (comma separated)</label>
                    <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="input" placeholder="organic, cotton, newborn, soft" />
                  </div>
                </div>

                {/* Images */}
                <div className="card p-6">
                  <h2 className="font-800 text-gray-900 mb-4">Product Images</h2>
                  <div className="flex flex-wrap gap-3">
                    {imagePreviews.map((src, i) => (
                      <div key={i} className="relative w-24 h-24 rounded-2xl overflow-hidden group">
                        <img src={src} alt="" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removeImage(i)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    ))}
                    {imageFiles.length < 6 && (
                      <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200 hover:border-primary-300 flex flex-col items-center justify-center cursor-pointer transition-colors bg-surface-100">
                        <Upload className="w-5 h-5 text-gray-400 mb-1" />
                        <span className="text-xs text-gray-400 font-600">Upload</span>
                        <input type="file" multiple accept="image/*" onChange={handleImageSelect} className="hidden" />
                      </label>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 font-500 mt-2">Upload up to 6 images (JPG, PNG, WebP, max 5MB each)</p>
                </div>
              </div>

              {/* Right: Pricing, inventory */}
              <div className="space-y-5">
                {/* Pricing */}
                <div className="card p-5 space-y-4">
                  <h2 className="font-800 text-gray-900">Pricing</h2>
                  <div>
                    <label className="label">Selling Price (₹) *</label>
                    <input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required className="input" placeholder="599" />
                  </div>
                  <div>
                    <label className="label">Delivery Charge (₹) *</label>
                    <input type="number" min="0" value={form.deliveryCharge} onChange={(e) => setForm({ ...form, deliveryCharge: e.target.value })} required className="input" placeholder="49" />
                  </div>
                  <div>
                    <label className="label">MRP / Original Price (₹)</label>
                    <input type="number" min="0" value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: e.target.value })} className="input" placeholder="799" />
                  </div>
                  {form.originalPrice && form.price && Number(form.originalPrice) > Number(form.price) && (
                    <div className="p-3 bg-green-50 rounded-xl text-sm text-green-700 font-600">
                      Discount: {Math.round(((Number(form.originalPrice) - Number(form.price)) / Number(form.originalPrice)) * 100)}% off
                    </div>
                  )}
                </div>

                {/* Category */}
                <div className="card p-5 space-y-4">
                  <h2 className="font-800 text-gray-900">Organization</h2>
                  <div>
                    <label className="label">Category *</label>
                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required className="input capitalize">
                      <option value="">Select category</option>
                      {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Age Group</label>
                    <select value={form.ageGroup} onChange={(e) => setForm({ ...form, ageGroup: e.target.value })} className="input">
                      {AGE_GROUPS.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Brand</label>
                    <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="input" placeholder="e.g. MamaLove" />
                  </div>
                </div>

                {/* Inventory */}
                <div className="card p-5 space-y-4">
                  <h2 className="font-800 text-gray-900">Inventory</h2>
                  <div>
                    <label className="label">Stock Quantity *</label>
                    <input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required className="input" placeholder="100" />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} className="sr-only peer" />
                      <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500" />
                    </label>
                    <span className="text-sm font-600 text-gray-700">Featured Product</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="sr-only peer" />
                      <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success-500" />
                    </label>
                    <span className="text-sm font-600 text-gray-700">Active (visible to customers)</span>
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3.5 text-base shadow-button">
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    <><Save className="w-5 h-5" /> Create Product</>
                  )}
                </button>
              </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
