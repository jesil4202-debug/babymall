'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, Plus, Pencil, Trash2, Check, ChevronRight, Home, Building2, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi'];

interface AddressForm {
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

const emptyForm: AddressForm = { name: '', phone: '', street: '', city: '', state: '', pincode: '', isDefault: false };

export default function AddressesPage() {
  const { user, addAddress, updateAddress, deleteAddress } = useAuthStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressForm>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  const addresses = user?.addresses || [];

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setIsAdding(true);
  };

  const openEdit = (addr: any) => {
    setEditingId(addr._id);
    setForm({
      name: addr.name, phone: addr.phone, street: addr.street,
      city: addr.city, state: addr.state, pincode: addr.pincode,
      isDefault: addr.isDefault || false,
    });
    setIsAdding(true);
  };

  const closeForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const validate = () => {
    if (!form.name.trim()) { toast.error('Full name is required'); return false; }
    if (!form.phone.trim() || form.phone.replace(/\D/g, '').length < 10) { toast.error('Valid phone number required'); return false; }
    if (!form.street.trim()) { toast.error('Street address is required'); return false; }
    if (!form.city.trim()) { toast.error('City is required'); return false; }
    if (!form.state) { toast.error('Please select a state'); return false; }
    if (!form.pincode.trim() || form.pincode.length !== 6) { toast.error('Valid 6-digit pincode required'); return false; }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      if (editingId) {
        await updateAddress(editingId, form);
        toast.success('Address updated!');
      } else {
        await addAddress(form);
        toast.success('Address added!');
      }
      closeForm();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save address');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this address?')) return;
    try {
      await deleteAddress(id);
      toast.success('Address deleted');
    } catch {
      toast.error('Failed to delete address');
    }
  };

  return (
    <div className="min-h-screen bg-surface-100 py-8">
      <div className="container-main max-w-3xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm text-gray-400 font-500 mb-6">
          <Link href="/account" className="hover:text-primary-500 transition-colors">My Account</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-700 font-600">Saved Addresses</span>
        </nav>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="section-title">Saved Addresses</h1>
            <p className="section-subtitle">Manage your delivery addresses</p>
          </div>
          {!isAdding && (
            <button onClick={openAdd} className="btn-primary text-sm py-2.5 px-5">
              <Plus className="w-4 h-4" /> Add New
            </button>
          )}
        </div>

        {/* Add / Edit Form */}
        {isAdding && (
          <div className="bg-white rounded-2xl shadow-sm border border-primary-100 p-6 mb-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-800 text-gray-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary-500" />
                {editingId ? 'Edit Address' : 'Add New Address'}
              </h2>
              <button onClick={closeForm} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Priya Sharma"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Phone Number</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="input"
                  type="tel"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Street Address</label>
                <input
                  value={form.street}
                  onChange={(e) => setForm({ ...form, street: e.target.value })}
                  placeholder="House No., Building, Street name, Area"
                  className="input"
                />
              </div>
              <div>
                <label className="label">City</label>
                <input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="e.g. Mumbai"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Pincode</label>
                <input
                  value={form.pincode}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  placeholder="400001"
                  className="input"
                  maxLength={6}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label">State</label>
                <select
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className="input"
                >
                  <option value="">Select your state</option>
                  {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, isDefault: !form.isDefault })}
                    className={`w-10 h-6 rounded-full transition-all duration-200 relative flex-shrink-0
                    ${form.isDefault ? 'bg-primary-500' : 'bg-gray-200'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-200
                    ${form.isDefault ? 'left-5' : 'left-1'}`} />
                  </button>
                  <span className="text-sm font-600 text-gray-700">Set as default address</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="btn-primary flex-1 py-3"
              >
                {isSaving ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  <><Check className="w-4 h-4" /> {editingId ? 'Update Address' : 'Save Address'}</>
                )}
              </button>
              <button onClick={closeForm} className="btn-secondary px-5">Cancel</button>
            </div>
          </div>
        )}

        {/* Address Cards */}
        {addresses.length === 0 && !isAdding ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <div className="w-20 h-20 bg-surface-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-10 h-10 text-gray-300" />
            </div>
            <p className="font-700 text-gray-600 mb-1">No saved addresses</p>
            <p className="text-sm text-gray-400 font-500 mb-6">Add an address for faster checkout</p>
            <button onClick={openAdd} className="btn-primary text-sm py-2.5 px-6">
              <Plus className="w-4 h-4" /> Add Address
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {addresses.map((addr: any) => (
              <div
                key={addr._id}
                className={`bg-white rounded-2xl p-5 shadow-sm border-2 transition-all duration-200
                ${addr.isDefault ? 'border-primary-200 bg-primary-50/30' : 'border-transparent'}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center
                    ${addr.isDefault ? 'bg-primary-100' : 'bg-surface-100'}`}>
                      <Home className={`w-4 h-4 ${addr.isDefault ? 'text-primary-500' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <p className="font-800 text-gray-800 text-sm">{addr.name}</p>
                      {addr.isDefault && <span className="badge-pink text-xs">Default</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(addr)}
                      className="p-2 rounded-xl text-gray-400 hover:text-primary-500 hover:bg-primary-50 transition-all"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(addr._id)}
                      className="p-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-50 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1 text-sm">
                  <p className="text-gray-500 font-500">{addr.phone}</p>
                  <p className="text-gray-600 font-500 leading-relaxed">
                    {addr.street}<br />
                    {addr.city}, {addr.state} – {addr.pincode}
                  </p>
                </div>
              </div>
            ))}

            {/* Add new card */}
            {!isAdding && (
              <button
                onClick={openAdd}
                className="bg-white rounded-2xl p-5 border-2 border-dashed border-gray-200 hover:border-primary-300 hover:bg-primary-50/20 transition-all duration-200 flex flex-col items-center justify-center gap-3 min-h-[150px]"
              >
                <div className="w-10 h-10 bg-surface-100 rounded-xl flex items-center justify-center">
                  <Plus className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-sm font-700 text-gray-500">Add New Address</p>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
