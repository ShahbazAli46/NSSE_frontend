'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { api, getStoredUser, User } from '@/lib/api';
import {
  Tags,
  Plus,
  Search,
  Pencil,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Layers
} from 'lucide-react';

interface Category {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [editName, setEditName] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<Category[]>('/categories');
      setCategories(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setUser(getStoredUser());
    fetchCategories();
  }, []);

  // Escape key listener for modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isCreateOpen) setIsCreateOpen(false);
        if (isEditOpen) setIsEditOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCreateOpen, isEditOpen]);

  // Offline filtering
  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle Create
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;
    setCreateLoading(true);
    setCreateError('');
    setCreateSuccess('');

    try {
      const res = await api.post<{ message: string; category: Category }>('/categories', {
        name: createName.trim(),
      });
      setCreateSuccess(res.message);
      setCreateName('');
      fetchCategories();
      setTimeout(() => {
        setIsCreateOpen(false);
        setCreateSuccess('');
      }, 1000);
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create category.');
    } finally {
      setCreateLoading(false);
    }
  };

  // Open Edit
  const handleOpenEdit = (category: Category) => {
    setCategoryToEdit(category);
    setEditName(category.name);
    setEditError('');
    setEditSuccess('');
    setIsEditOpen(true);
  };

  // Handle Update
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryToEdit || !editName.trim()) return;
    setEditLoading(true);
    setEditError('');
    setEditSuccess('');

    try {
      const res = await api.put<{ message: string; category: Category }>(`/categories/${categoryToEdit.id}`, {
        name: editName.trim(),
      });
      setEditSuccess(res.message);
      fetchCategories();
      setTimeout(() => {
        setIsEditOpen(false);
        setEditSuccess('');
        setCategoryToEdit(null);
      }, 1000);
    } catch (err: any) {
      setEditError(err.message || 'Failed to update category.');
    } finally {
      setEditLoading(false);
    }
  };

  // Toggle Status (Activate / Deactivate)
  const handleToggleStatus = async (id: number, currentActive: boolean) => {
    // Optimistic UI update
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, is_active: !currentActive } : c))
    );

    try {
      await api.patch(`/categories/${id}/toggle-status`);
    } catch (err: any) {
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, is_active: currentActive } : c))
      );
      alert(err.message || 'Failed to update status.');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Category Management Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
        
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Tags className="w-5 h-5 text-[#0B462C]" />
              <span>Financial Expense Categories</span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Configure and manage institutional expense classification titles.
            </p>
          </div>

          <button
            onClick={() => {
              setCreateName('');
              setCreateError('');
              setCreateSuccess('');
              setIsCreateOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-[#0B462C] hover:bg-[#083622] text-[#E8D4A2] font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#C5A059]" />
            <span>Create New Category</span>
          </button>
        </div>

        {/* Search */}
        <div className="flex justify-end gap-4 pt-2 border-t border-gray-100">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search category name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:border-[#0B462C] outline-none w-56 sm:w-72 transition-colors"
            />
          </div>
        </div>

        {/* Categories Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-[#0B462C]" />
              <span className="text-xs font-semibold">Loading categories...</span>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="p-12 text-center text-gray-400 border border-dashed border-gray-200 rounded-2xl">
              <Layers className="w-8 h-8 mx-auto text-gray-300 mb-2" />
              <p className="text-sm font-semibold text-gray-600">No categories found</p>
              <p className="text-xs text-gray-400 mt-1">Click "Create New Category" above to add one.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-gray-50/75 text-gray-500 font-semibold border-b border-gray-100">
                  <th className="p-3.5 rounded-l-xl">Category Name</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right rounded-r-xl">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCategories.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-3.5 font-bold text-gray-900">
                      <div className="text-sm font-bold text-gray-900">{c.name}</div>
                    </td>
                    <td className="p-3.5">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(c.id, c.is_active)}
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer border ${
                          c.is_active
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                        }`}
                        title={`Click to ${c.is_active ? 'Deactivate' : 'Activate'} category`}
                      >
                        <span className={`w-2 h-2 rounded-full ${c.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <span>{c.is_active ? 'Active' : 'Deactivated'}</span>
                      </button>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#0B462C] hover:bg-[#0B462C]/10 transition-all cursor-pointer"
                        title="Edit Category"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {/* ================= CREATE CATEGORY MODAL ================= */}
      {isCreateOpen && (
        <div
          onClick={() => setIsCreateOpen(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative max-h-[92vh] overflow-y-auto"
          >
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* School Header */}
            <div className="flex items-center gap-3.5 mb-6 pb-5 border-b border-gray-100">
              <div className="w-12 h-12 relative shrink-0">
                <Image
                  src="/logo.png"
                  alt="NSSE Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <div className="text-sm font-black text-[#0B462C] font-cinzel tracking-widest uppercase">
                  Nawaz Sharif
                </div>
                <div className="text-[11px] font-bold text-[#C5A059] font-cinzel tracking-wider uppercase">
                  School of Eminence • Chunian
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900">Create Expense Category</h3>
              <p className="text-xs text-gray-500 mt-1">
                Enter the title for the new financial classification.
              </p>
            </div>

            {createError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold flex items-center gap-2 border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            {createSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{createSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Science Lab Supplies"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:border-[#0B462C] outline-none transition-colors"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex-1 py-2.5 rounded-xl bg-[#0B462C] hover:bg-[#083622] text-[#E8D4A2] text-sm font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50 transition-colors"
                >
                  {createLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Save Category'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ================= EDIT CATEGORY MODAL ================= */}
      {isEditOpen && categoryToEdit && (
        <div
          onClick={() => setIsEditOpen(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative max-h-[92vh] overflow-y-auto"
          >
            <button
              onClick={() => setIsEditOpen(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* School Header */}
            <div className="flex items-center gap-3.5 mb-6 pb-5 border-b border-gray-100">
              <div className="w-12 h-12 relative shrink-0">
                <Image
                  src="/logo.png"
                  alt="NSSE Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <div className="text-sm font-black text-[#0B462C] font-cinzel tracking-widest uppercase">
                  Nawaz Sharif
                </div>
                <div className="text-[11px] font-bold text-[#C5A059] font-cinzel tracking-wider uppercase">
                  School of Eminence • Chunian
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900">Edit Expense Category</h3>
              <p className="text-xs text-gray-500 mt-1">
                Update category title.
              </p>
            </div>

            {editError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold flex items-center gap-2 border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            {editSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{editSuccess}</span>
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Building Repairs"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:border-[#0B462C] outline-none transition-colors"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-1 py-2.5 rounded-xl bg-[#0B462C] hover:bg-[#083622] text-[#E8D4A2] text-sm font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50 transition-colors"
                >
                  {editLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
