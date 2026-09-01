'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { api, User } from '@/lib/api';
import CustomDropdown, { DropdownOption } from './CustomDropdown';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Trash2,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Server,
  Mail,
  Radio,
  ArrowUpRight,
  BookOpen,
  GraduationCap,
  Receipt,
  Building2,
  RefreshCw,
  X,
  Pencil,
  AlertTriangle
} from 'lucide-react';

const ROLE_OPTIONS: DropdownOption[] = [
  { value: 'chairman', label: 'Chairman (Executive Authority)', icon: '🏛️' },
  { value: 'director', label: 'Director (Executive Approvals)', icon: '👔' },
  { value: 'principal', label: 'Principal (School Operations)', icon: '🏫' },
  { value: 'office_admin', label: 'Office Admin (Admissions & VMS)', icon: '🏢' },
  { value: 'accountant', label: 'Accountant (Accounts Officer)', icon: '📑' },
  { value: 'hr_accountant', label: 'HR & Accountant (Financial Desk)', icon: '📑' },
  { value: 'teacher', label: 'Faculty / Teacher', icon: '📚' },
  { value: 'support_staff', label: 'Support / Non-Teaching Staff', icon: '🛠️' },
  { value: 'parent', label: 'Parent Portal Access', icon: '👨‍👩‍👧' },
  { value: 'student', label: 'Student Portal Access', icon: '🎓' },
  { value: 'admin', label: 'Super Admin (System Administrator)', icon: '🛡️' },
];

interface PaginatedUsers {
  data: User[];
  total: number;
}

interface SystemStats {
  total_users: number;
  role_counts: Record<string, number>;
  smtp_status: string;
  broadcasting_status: string;
  database_status: string;
}

export default function SuperAdminDashboard({ currentUser }: { currentUser: User | null }) {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'teacher',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    role: 'teacher',
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      // Remove backend search parameter for offline search

      const res = await api.get<PaginatedUsers>(`/admin/users?${params.toString()}`);
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get<SystemStats>('/admin/system-stats');
      setStats(res);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  // Close modals on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isAddModalOpen) setIsAddModalOpen(false);
        if (isEditModalOpen) setIsEditModalOpen(false);
        if (isDeleteModalOpen) setIsDeleteModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAddModalOpen, isEditModalOpen, isDeleteModalOpen]);

  const handleOpenDelete = (user: User) => {
    setUserToDelete(user);
    setDeleteConfirmText('');
    setDeleteError('');
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToDelete || deleteConfirmText.trim().toUpperCase() !== 'DELETE') return;

    setDeleteLoading(true);
    setDeleteError('');

    try {
      await api.delete(`/admin/users/${userToDelete.id}`);
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      setDeleteConfirmText('');
      fetchUsers();
      fetchStats();
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete user.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name,
      email: user.email,
      role: user.role || 'teacher',
    });
    setEditError('');
    setEditSuccess('');
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditLoading(true);
    setEditError('');
    setEditSuccess('');

    try {
      const res = await api.put<{ message: string; user: User }>(`/admin/users/${editingUser.id}`, editFormData);
      setEditSuccess(res.message);
      fetchUsers();
      fetchStats();
      setTimeout(() => {
        setIsEditModalOpen(false);
        setEditSuccess('');
        setEditingUser(null);
      }, 1000);
    } catch (err: any) {
      setEditError(err.message || 'Failed to update user.');
    } finally {
      setEditLoading(false);
    }
  };

  // Offline client-side filtering
  const filteredUsers = users.filter(u => {
    const query = searchQuery.toLowerCase();
    return u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query);
  });



  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess('');

    try {
      const res = await api.post<{ message: string; user: User }>('/admin/users', formData);
      setFormSuccess(res.message);
      setFormData({ name: '', email: '', role: 'accountant' });
      fetchUsers();
      fetchStats();
      setTimeout(() => {
        setIsAddModalOpen(false);
        setFormSuccess('');
      }, 1200);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create user.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from the system?`)) return;

    try {
      await api.delete(`/admin/users/${id}`);
      fetchUsers();
      fetchStats();
    } catch (err: any) {
      alert(err.message || 'Failed to delete user.');
    }
  };

  const handleToggleStatus = async (id: number, currentActive: boolean = true, name: string) => {
    // Optimistic UI update
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, is_active: !currentActive } : u))
    );

    try {
      await api.patch(`/admin/users/${id}/toggle-status`);
    } catch (err: any) {
      // Revert if error
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, is_active: currentActive } : u))
      );
      alert(err.message || 'Failed to update user status.');
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
      case 'super_admin':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-purple-100 text-purple-800 border border-purple-200">🛡️ Super Admin</span>;
      case 'chairman':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-100 text-indigo-800 border border-indigo-200">🏛️ Chairman</span>;
      case 'director':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-100 text-blue-800 border border-blue-200">👔 Director</span>;
      case 'principal':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">🏫 Principal</span>;
      case 'office_admin':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-cyan-100 text-cyan-800 border border-cyan-200">🏢 Office Admin</span>;
      case 'accountant':
      case 'hr_accountant':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-100 text-amber-900 border border-amber-300">📑 HR & Accounts</span>;
      case 'teacher':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-teal-100 text-teal-800 border border-teal-200">📚 Faculty</span>;
      case 'staff':
      case 'support_staff':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 text-slate-800 border border-slate-200">🛠️ Support Staff</span>;
      case 'parent':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-orange-100 text-orange-800 border border-orange-200">👨‍👩‍👧 Parent</span>;
      case 'student':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-sky-100 text-sky-800 border border-sky-200">🎓 Student</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-gray-100 text-gray-800 border border-gray-200">{role}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 🧭 Executive Quick Navigation Ribbon for Chairman / Super Admin */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
            🏛️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-gray-900 leading-tight">Institutional Chairman & Governance Cockpit</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800 uppercase">
                {currentUser?.role?.toUpperCase() || 'CHAIRMAN'}
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Macro Campus Oversight, Staff Governance & Partner Equity</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/director"
            className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all"
          >
            <span>🥧 Partners & Equity Cockpit</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/dashboard/expenses"
            className="px-4 py-2 rounded-xl bg-[#0B462C] hover:bg-[#083622] text-[#E8D4A2] font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all"
          >
            <span>📑 Accounts & Expenses</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Staff & User Management Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">

        {/* Header & Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#0B462C]" />
              <span>Institutional Staff & Access Roles</span>
            </h2>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#0B462C] hover:bg-[#083622] text-[#E8D4A2] font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-[#C5A059]" />
            <span>Add User / Role</span>
          </button>
        </div>

        {/* Search */}
        <div className="flex justify-end gap-4 pt-2 border-t border-gray-100">

          <div className="flex gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:border-[#0B462C] outline-none w-48 sm:w-64 transition-colors"
              />
            </div>
          </div>

        </div>

        {/* User Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-[#0B462C]" />
              <span className="text-xs">Loading institutional users...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-gray-400 border border-dashed border-gray-200 rounded-2xl">
              <Users className="w-8 h-8 mx-auto text-gray-300 mb-2" />
              <p className="text-sm font-semibold text-gray-600">No users found</p>
              <p className="text-xs text-gray-400 mt-1">Try changing the role filter or click "Add User / Role" above.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-gray-50/75 text-gray-500 font-semibold border-b border-gray-100">
                  <th className="p-3.5 rounded-l-xl">User Name & Info</th>
                  <th className="p-3.5">Email Address (Login ID)</th>
                  <th className="p-3.5">Assigned Role</th>
                  <th className="p-3.5">Account Status</th>
                  <th className="p-3.5 text-right rounded-r-xl">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-3.5 font-bold text-gray-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#0B462C]/10 text-[#0B462C] font-black flex items-center justify-center text-xs">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div>{u.name}</div>
                          <div className="text-[10px] text-gray-400 font-normal">ID #{u.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-medium text-gray-700">
                      {u.email}
                    </td>
                    <td className="p-3.5">
                      {getRoleBadge(u.role)}
                    </td>
                    <td className="p-3.5">
                      {u.id === currentUser?.id ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Active (You)
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u.id, u.is_active ?? true, u.name)}
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer border ${
                            u.is_active !== false
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                          }`}
                          title={`Click to ${u.is_active !== false ? 'Deactivate' : 'Activate'} account`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              u.is_active !== false ? 'bg-emerald-500' : 'bg-red-500'
                            }`}
                          ></span>
                          <span>{u.is_active !== false ? 'Active' : 'Deactivated'}</span>
                        </button>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-[#0B462C] hover:bg-[#0B462C]/10 transition-all cursor-pointer"
                          title="Edit User"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {u.id !== currentUser?.id && (
                          <button
                            onClick={() => handleOpenDelete(u)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                            title="Remove User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {/* ADD USER MODAL */}
      {isAddModalOpen && (
        <div
          onClick={() => setIsAddModalOpen(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative max-h-[92vh] overflow-y-auto"
          >

            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* School Crest & Institution Header */}
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
              <h3 className="text-xl font-bold text-gray-900">Register Institutional Staff</h3>
              <p className="text-xs text-gray-500 mt-1">
                Add an official email. The user will automatically login via secure Email OTP.
              </p>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold flex items-center gap-2 border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Full Name & Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Principal Dr. Tariq Mahmood"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:border-[#0B462C] outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Official Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. principal@nsse.edu.pk"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:border-[#0B462C] outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Institutional Role</label>
                <CustomDropdown
                  options={ROLE_OPTIONS}
                  value={formData.role}
                  onChange={(val) => setFormData({ ...formData, role: val })}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 py-2.5 rounded-xl bg-[#0B462C] hover:bg-[#083622] text-[#E8D4A2] text-sm font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50 transition-colors"
                >
                  {formLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Register User'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {isEditModalOpen && editingUser && (
        <div
          onClick={() => setIsEditModalOpen(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative max-h-[92vh] overflow-y-auto"
          >
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* School Crest & Institution Header */}
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
              <h3 className="text-xl font-bold text-gray-900">Edit Institutional Staff</h3>
              <p className="text-xs text-gray-500 mt-1">
                Update user details or reassign institutional access role.
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

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Full Name & Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Principal Dr. Tariq Mahmood"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:border-[#0B462C] outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Official Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. principal@nsse.edu.pk"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:border-[#0B462C] outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Institutional Role</label>
                <CustomDropdown
                  options={ROLE_OPTIONS}
                  value={editFormData.role}
                  onChange={(val) => setEditFormData({ ...editFormData, role: val })}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
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

      {/* CUSTOM STRICT DELETE MODAL */}
      {isDeleteModalOpen && userToDelete && (
        <div
          onClick={() => setIsDeleteModalOpen(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative max-h-[92vh] overflow-y-auto"
          >
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* School Crest & Institution Header */}
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
              <h3 className="text-xl font-bold text-gray-900">Delete Institutional Staff</h3>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to permanently remove this user?
              </p>
            </div>

            {/* Target User Info Card */}
            <div className="mb-6 p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 font-medium">User to delete:</span>
                <div>{getRoleBadge(userToDelete.role)}</div>
              </div>
              <div className="font-bold text-sm text-gray-900">{userToDelete.name}</div>
              <div className="text-xs text-gray-600 font-mono">{userToDelete.email}</div>
            </div>

            {deleteError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold flex items-center gap-2 border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            {/* Strict Confirmation Form */}
            <form onSubmit={handleConfirmDelete} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  To confirm, type <span className="font-mono text-red-600 bg-red-50 px-1.5 py-0.5 rounded font-black">DELETE</span> below:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Type DELETE"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border-2 border-red-200 focus:border-red-500 rounded-xl text-sm font-mono font-bold focus:ring-2 focus:ring-red-100 outline-none transition-all placeholder:font-normal placeholder:text-gray-300"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleteLoading || deleteConfirmText.trim().toUpperCase() !== 'DELETE'}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {deleteLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Delete User'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
