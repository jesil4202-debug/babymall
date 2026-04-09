'use client';

import { useState, useEffect } from 'react';
import {
  Image as ImageIcon, Plus, Pencil, Trash2, Eye, EyeOff, 
  Upload, ExternalLink, X, Check
} from 'lucide-react';
import Image from 'next/image';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

interface Banner {
  _id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  link?: string;
  isActive: boolean;
  order: number;
  createdAt: string;
}



const emptyForm = { title: '', subtitle: '', imageUrl: '', link: '', isActive: true, order: 0 };

export default function AdminBannersPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    fetchBanners();
  }, [isAuthenticated, user]);

  const fetchBanners = async () => {
    try {
      const { data } = await api.get('/banners');
      setBanners(data.banners || []);
    } catch { toast.error('Failed to load banners'); }
    finally { setIsLoading(false); }
  };

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setImagePreview('');
    setImageFile(null);
    setShowForm(true);
  };

  const openEdit = (b: Banner) => {
    setEditId(b._id);
    setForm({ title: b.title, subtitle: b.subtitle || '', imageUrl: b.imageUrl, link: b.link || '', isActive: b.isActive, order: b.order });
    setImagePreview(b.imageUrl);
    setImageFile(null);
    setShowForm(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Banner title is required'); return; }
    if (!imagePreview && !form.imageUrl) { toast.error('Banner image is required'); return; }

    setIsSaving(true);
    try {
      let imageUrl = form.imageUrl;

      if (imageFile) {
        const fd = new FormData();
        fd.append('image', imageFile);
        const { data: uploadData } = await api.post('/banners/upload', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        imageUrl = uploadData.url;
      }

      const payload = { ...form, imageUrl };

      if (editId) {
        await api.put(`/banners/${editId}`, payload);
        toast.success('Banner updated!');
      } else {
        await api.post('/banners', payload);
        toast.success('Banner created!');
      }
      setShowForm(false);
      fetchBanners();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save banner');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (b: Banner) => {
    try {
      await api.put(`/banners/${b._id}`, { ...b, isActive: !b.isActive });
      setBanners((prev) => prev.map((x) => x._id === b._id ? { ...x, isActive: !x.isActive } : x));
      toast.success(b.isActive ? 'Banner hidden' : 'Banner shown');
    } catch { toast.error('Failed to update banner'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this banner? This cannot be undone.')) return;
    try {
      await api.delete(`/banners/${id}`);
      setBanners((prev) => prev.filter((b) => b._id !== id));
      toast.success('Banner deleted');
    } catch { toast.error('Failed to delete banner'); }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-900 text-gray-900">Banner Management</h1>
              <p className="text-gray-400 font-500 text-sm">{banners.length} banners • {banners.filter(b => b.isActive).length} active</p>
            </div>
            <button onClick={openAdd} className="btn-primary text-sm py-2.5 px-5">
              <Plus className="w-4 h-4" /> Add Banner
            </button>
          </div>

          {/* Add / Edit Form */}
          {showForm && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-800 text-gray-900 text-lg">{editId ? 'Edit Banner' : 'Add New Banner'}</h2>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Image Upload */}
                <div>
                  <label className="label">Banner Image</label>
                  <div className="relative">
                    {imagePreview ? (
                      <div className="relative rounded-2xl overflow-hidden border-2 border-gray-200 aspect-[16/5]">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          onClick={() => { setImagePreview(''); setImageFile(null); setForm({ ...form, imageUrl: '' }); }}
                          className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-lg text-white hover:bg-black/70"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center aspect-[16/5] border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-primary-300 hover:bg-primary-50/20 transition-all">
                        <Upload className="w-8 h-8 text-gray-300 mb-2" />
                        <p className="text-sm font-600 text-gray-400">Click to upload banner image</p>
                        <p className="text-xs text-gray-300 mt-1">Recommended: 1440×400px</p>
                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                      </label>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2 font-500">Or provide a direct image URL:</p>
                  <input
                    value={form.imageUrl}
                    onChange={(e) => { setForm({ ...form, imageUrl: e.target.value }); if (e.target.value) setImagePreview(e.target.value); }}
                    placeholder="https://example.com/banner.jpg"
                    className="input mt-2 text-sm"
                  />
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="label">Title *</label>
                    <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Summer Sale" className="input" />
                  </div>
                  <div>
                    <label className="label">Subtitle</label>
                    <input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="Optional subtitle text" className="input" />
                  </div>
                  <div>
                    <label className="label">Link URL</label>
                    <input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="/products?category=clothing" className="input" />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="label">Display Order</label>
                      <input
                        type="number"
                        value={form.order}
                        onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                        min={0}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">Active</label>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, isActive: !form.isActive })}
                        className={`mt-0.5 w-12 h-7 rounded-full transition-all duration-200 relative
                        ${form.isActive ? 'bg-primary-500' : 'bg-gray-200'}`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full absolute top-1 shadow-sm transition-all duration-200
                        ${form.isActive ? 'left-6' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-5 border-t border-gray-100">
                <button onClick={handleSave} disabled={isSaving} className="btn-primary py-3 px-8">
                  {isSaving ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    <><Check className="w-4 h-4" /> {editId ? 'Update' : 'Create'} Banner</>
                  )}
                </button>
                <button onClick={() => setShowForm(false)} className="btn-secondary px-6">Cancel</button>
              </div>
            </div>
          )}

          {/* Banners Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                  <div className="w-full h-24 bg-gray-200 rounded-xl mb-3" />
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                </div>
              ))}
            </div>
          ) : banners.length === 0 ? (
            <div className="bg-white rounded-2xl p-16 text-center shadow-sm">
              <ImageIcon className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="font-700 text-gray-500">No banners yet</p>
              <p className="text-sm text-gray-400 font-500 mt-1 mb-5">Create a banner to showcase on the homepage</p>
              <button onClick={openAdd} className="btn-primary text-sm py-2.5 px-6">
                <Plus className="w-4 h-4" /> Create First Banner
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {banners.sort((a, b) => a.order - b.order).map((banner) => (
                <div
                  key={banner._id}
                  className={`bg-white rounded-2xl shadow-sm border-2 overflow-hidden transition-all
                  ${banner.isActive ? 'border-gray-100' : 'border-gray-100 opacity-60'}`}
                >
                  <div className="flex gap-4 p-4">
                    {/* Thumbnail */}
                    <div className="relative w-40 h-24 rounded-xl overflow-hidden bg-surface-100 flex-shrink-0">
                      <Image src={banner.imageUrl} alt={banner.title} fill sizes="160px" className="object-cover" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-800 text-gray-900">{banner.title}</p>
                          {banner.subtitle && <p className="text-sm text-gray-500 font-500 mt-0.5">{banner.subtitle}</p>}
                          {banner.link && (
                            <a
                              href={banner.link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-secondary-500 font-600 flex items-center gap-1 mt-1 hover:underline"
                            >
                              {banner.link} <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`badge-${banner.isActive ? 'green' : 'amber'} text-xs`}>
                            {banner.isActive ? 'Active' : 'Hidden'}
                          </span>
                          <span className="text-xs text-gray-400 font-500">Order: {banner.order}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-3">
                        <button onClick={() => handleToggle(banner)} className="btn-ghost text-xs py-1.5 px-3 gap-1.5">
                          {banner.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          {banner.isActive ? 'Hide' : 'Show'}
                        </button>
                        <button onClick={() => openEdit(banner)} className="btn-ghost text-xs py-1.5 px-3 gap-1.5">
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(banner._id)}
                          className="btn-ghost text-xs py-1.5 px-3 gap-1.5 text-red-400 hover:text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
    </div>
  );
}
