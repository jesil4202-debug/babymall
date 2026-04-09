'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Upload, X, Save, ArrowLeft, Trash2 } from 'lucide-react';
import Image from 'next/image';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { getImageUrl } from '@/lib/getImageUrl';

const CATEGORIES = ['clothing', 'feeding', 'toys', 'nursery', 'bath', 'health', 'travel', 'accessories'];
const AGE_GROUPS = ['0-3m', '3-6m', '6-12m', '1-2y', '2-3y', '3-5y', '5+y', 'all'];

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const { user, isAuthenticated } = useAuthStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Existing images from server
  const [existingImages, setExistingImages] = useState<{ url: string; publicId?: string; public_id?: string }[]>([]);
  // New files to upload
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

  const [form, setForm] = useState({
    name: '', description: '', shortDescription: '', price: '',
    originalPrice: '', deliveryCharge: '', category: '', ageGroup: 'all', brand: '',
    stock: '', isFeatured: false, isActive: true, tags: '',
  });

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') { router.push('/'); return; }
    fetchProduct();
  }, [isAuthenticated, user]);

  const fetchProduct = async () => {
    try {
      const { data } = await api.get(`/products/${productId}`);
      const p = data.product;
      setForm({
        name: p.name || '',
        description: p.description || '',
        shortDescription: p.shortDescription || '',
        price: String(p.price || ''),
        originalPrice: String(p.originalPrice || ''),
        deliveryCharge: String(p.deliveryCharge || '0'),
        category: p.category || '',
        ageGroup: p.ageGroup || 'all',
        brand: p.brand || '',
        stock: String(p.stock || ''),
        isFeatured: Boolean(p.isFeatured),
        isActive: p.isActive !== false,
        tags: Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags || ''),
      });
      const normalizedImages = Array.isArray(p.images) && p.images.length > 0
        ? p.images.map((img: any) => ({
            url: getImageUrl(typeof img === 'string' ? img : img?.url || img?.publicId || ''),
            publicId: typeof img === 'object' ? img?.publicId : undefined,
            public_id: typeof img === 'object' ? img?.public_id : undefined,
          }))
        : (p.image
            ? [{ url: getImageUrl(p.image), publicId: undefined, public_id: undefined }]
            : []);
      setExistingImages(normalizedImages);
    } catch {
      toast.error('Failed to load product');
      router.push('/admin/products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const totalImages = existingImages.length + newImageFiles.length;
    const files = Array.from(e.target.files || []).slice(0, 6 - totalImages);
    setNewImageFiles((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => setNewImagePreviews((prev) => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const removeExistingImage = (i: number) => {
    setExistingImages((prev) => prev.filter((_, idx) => idx !== i));
  };

  const removeNewImage = (i: number) => {
    setNewImageFiles((prev) => prev.filter((_, idx) => idx !== i));
    setNewImagePreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.category || !form.stock) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== '' && v !== undefined) formData.append(k, String(v));
      });

      // Send existing image URLs to keep
      existingImages.forEach((img, i) => {
        formData.append(`existingImages[${i}][url]`, img.url);
        const imagePublicId = img.publicId || img.public_id;
        if (imagePublicId) formData.append(`existingImages[${i}][public_id]`, imagePublicId);
      });

      // Send new files to upload
      newImageFiles.forEach((file) => formData.append('images', file));

      // Tags
      if (form.tags) {
        form.tags.split(',').map((t) => t.trim()).filter(Boolean).forEach((t) => formData.append('tags[]', t));
      }

      await api.put(`/products/${productId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Product updated successfully!');
      router.push('/admin/products');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;
    setIsDeleting(true);
    try {
      await api.delete(`/products/${productId}`);
      toast.success('Product deleted');
      router.push('/admin/products');
    } catch {
      toast.error('Failed to delete product');
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-100 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  const totalImages = existingImages.length + newImageFiles.length;

  return (
    <div className="min-h-screen bg-surface-100">
      <div className="flex">
        <AdminSidebar activeItem="products" />

        <main className="lg:ml-64 flex-1 p-6 lg:p-8">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <Link href="/admin/products" className="p-2 rounded-xl hover:bg-white transition-colors text-gray-400 hover:text-gray-700">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-900 text-gray-900">Edit Product</h1>
                <p className="text-sm text-gray-400 font-500">{form.name}</p>
              </div>
            </div>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-2 text-sm font-700 text-red-400 hover:text-red-500 hover:bg-red-50 px-4 py-2.5 rounded-xl transition-all"
            >
              {isDeleting ? (
                <span className="w-4 h-4 border-2 border-red-200 border-t-red-400 rounded-full animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Delete Product
            </button>
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
                    <input value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} className="input" placeholder="One-liner summary shown on card" />
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
                    {/* Existing images */}
                    {existingImages.map((img, i) => (
                      <div key={`existing-${i}`} className="relative w-24 h-24 rounded-2xl overflow-hidden group">
                        <img src={img.url || '/logo.png'} alt="product" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button type="button" onClick={() => removeExistingImage(i)} className="p-1 text-white hover:text-red-300">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        {i === 0 && (
                          <span className="absolute bottom-1 left-1 text-[9px] font-700 bg-primary-500 text-white px-1 rounded">Main</span>
                        )}
                      </div>
                    ))}

                    {/* New image previews */}
                    {newImagePreviews.map((src, i) => (
                      <div key={`new-${i}`} className="relative w-24 h-24 rounded-2xl overflow-hidden group border-2 border-dashed border-primary-300">
                        <img src={src} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button type="button" onClick={() => removeNewImage(i)} className="p-1 text-white hover:text-red-300">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <span className="absolute bottom-1 left-1 text-[9px] font-700 bg-secondary-500 text-white px-1 rounded">New</span>
                      </div>
                    ))}

                    {/* Upload button */}
                    {totalImages < 6 && (
                      <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200 hover:border-primary-300 flex flex-col items-center justify-center cursor-pointer transition-colors bg-surface-100">
                        <Upload className="w-5 h-5 text-gray-400 mb-1" />
                        <span className="text-xs text-gray-400 font-600">Add</span>
                        <input type="file" multiple accept="image/*" onChange={handleNewImageSelect} className="hidden" />
                      </label>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 font-500 mt-3">
                    {totalImages}/6 images • First image is the main product image
                  </p>
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
                    <label className="label">Delivery Charge (₹)</label>
                    <input name="deliveryCharge" type="number" min="0" value={form.deliveryCharge} onChange={(e) => setForm({ ...form, deliveryCharge: e.target.value })} required className="input" placeholder="49" />
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

                {/* Organization */}
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

                  <label className="flex items-center gap-3 cursor-pointer">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, isFeatured: !form.isFeatured })}
                      className={`w-10 h-6 rounded-full transition-all duration-200 relative flex-shrink-0
                      ${form.isFeatured ? 'bg-primary-500' : 'bg-gray-200'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-all duration-200
                      ${form.isFeatured ? 'left-5' : 'left-1'}`} />
                    </button>
                    <span className="text-sm font-600 text-gray-700">Featured Product</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, isActive: !form.isActive })}
                      className={`w-10 h-6 rounded-full transition-all duration-200 relative flex-shrink-0
                      ${form.isActive ? 'bg-success-500' : 'bg-gray-200'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-all duration-200
                      ${form.isActive ? 'left-5' : 'left-1'}`} />
                    </button>
                    <span className="text-sm font-600 text-gray-700">
                      {form.isActive ? 'Visible to customers' : 'Hidden from store'}
                    </span>
                  </label>
                </div>

                <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3.5 text-base shadow-button">
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Saving Changes...
                    </span>
                  ) : (
                    <><Save className="w-5 h-5" /> Save Changes</>
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
