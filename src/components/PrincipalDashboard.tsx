'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  PlusCircle, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Building2, 
  DollarSign, 
  Users, 
  ShieldAlert, 
  RefreshCw, 
  X, 
  Sparkles, 
  Briefcase, 
  AlertTriangle, 
  UserCheck, 
  Check, 
  HelpCircle, 
  MessageSquare 
} from 'lucide-react';
import { api, User } from '@/lib/api';
import CustomDatePicker from '@/components/CustomDatePicker';
import CustomDropdown, { DropdownOption } from '@/components/CustomDropdown';
import CustomNumberInput from '@/components/CustomNumberInput';

interface ExpenseComment {
  id: number;
  message?: string;
  comment?: string;
  attachment_url?: string;
  created_at: string;
  user?: {
    id: number;
    name: string;
    role?: string;
  };
}

interface ExpenseItem {
  id: number;
  voucher_no?: string;
  title: string;
  category: string;
  amount: number | string;
  description?: string;
  status: 'pending' | 'approved' | 'disbursed' | 'rejected' | 'clarification_requested';
  created_at: string;
  creator?: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  approvals?: Array<{
    id: number;
    decision: 'approved' | 'rejected' | 'query';
    remarks?: string;
    user?: { id: number; name: string };
  }>;
  comments?: ExpenseComment[];
}

interface Category {
  id: number;
  name: string;
  code?: string;
}

interface PrincipalDashboardProps {
  currentUser?: User | null;
}

export default function PrincipalDashboard({ currentUser }: PrincipalDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'orders' | 'approvals' | 'overview'>('orders');
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  // New Order / Requisition Modal State
  const [isOrderModalOpen, setIsOrderModalOpen] = useState<boolean>(false);
  const [orderTitle, setOrderTitle] = useState<string>('');
  const [orderCategory, setOrderCategory] = useState<string>('Maintenance');
  const [orderAmount, setOrderAmount] = useState<string>('');
  const [orderPriority, setOrderPriority] = useState<'normal' | 'high' | 'urgent'>('normal');
  const [orderDeadline, setOrderDeadline] = useState<string>('');
  const [orderDescription, setOrderDescription] = useState<string>('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Detail Modal State & Two-Way Chat State
  const [selectedExpense, setSelectedExpense] = useState<ExpenseItem | null>(null);
  const [comments, setComments] = useState<ExpenseComment[]>([]);
  const [chatMessage, setChatMessage] = useState<string>('');
  const [isSendingMessage, setIsSendingMessage] = useState<boolean>(false);
  const [actionRemarks, setActionRemarks] = useState<string>('');
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  // Fetch Expenses & Categories
  const fetchData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [expRes, catRes]: [any, any] = await Promise.all([
        api.get('/expenses'),
        api.get('/categories').catch(() => ({ data: [] })),
      ]);

      const expData = expRes?.data || expRes;
      setExpenses(Array.isArray(expData) ? expData : (expData?.data || []));

      const catData = catRes?.data || catRes;
      if (Array.isArray(catData)) {
        setCategories(catData);
      }
    } catch (err) {
      console.error('Failed to load Principal dashboard data:', err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const categoryOptions: DropdownOption[] = useMemo(() => {
    if (categories.length > 0) {
      return categories.map((c) => ({
        value: c.name,
        label: c.name,
      }));
    }
    return [
      { value: 'Maintenance', label: 'Maintenance' },
      { value: 'Academic Supplies', label: 'Academic Supplies' },
      { value: 'Utilities & Bills', label: 'Utilities & Bills' },
      { value: 'IT & Hardware', label: 'IT & Hardware' },
      { value: 'Sports & Events', label: 'Sports & Events' },
      { value: 'Printing & Stationery', label: 'Printing & Stationery' },
      { value: 'Emergency Repairs', label: 'Emergency Repairs' },
      { value: 'Others', label: 'Others' },
    ];
  }, [categories]);

  // Handle Order Dispatch to Accountant
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!orderTitle.trim() || !orderAmount || !orderCategory) {
      setFormError('Please fill in all required order specifications.');
      return;
    }

    const amountNum = parseFloat(orderAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setFormError('Please enter a valid estimated amount in PKR.');
      return;
    }

    setIsSubmittingOrder(true);
    try {
      // Append priority and required deadline into directive description
      const fullDescription = [
        `[PRIORITY: ${orderPriority.toUpperCase()}]`,
        orderDeadline ? `[TARGET DEADLINE: ${orderDeadline}]` : null,
        orderDescription.trim() ? orderDescription.trim() : 'Directive dispatched from Principal Desk.',
      ]
        .filter(Boolean)
        .join(' • ');

      const payload = {
        title: orderTitle.trim(),
        category: orderCategory,
        amount: amountNum,
        description: fullDescription,
      };

      await api.post('/expenses', payload);

      setFormSuccess('Direct order dispatched successfully to the Finance & Accounts Desk.');
      setOrderTitle('');
      setOrderAmount('');
      setOrderDescription('');
      setOrderDeadline('');
      setOrderPriority('normal');

      // Refresh list
      await fetchData();

      setTimeout(() => {
        setIsOrderModalOpen(false);
        setFormSuccess(null);
      }, 1200);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to dispatch order. Please try again.');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Open full details with conversation thread
  const openExpenseDetails = async (item: ExpenseItem) => {
    setSelectedExpense(item);
    setComments(item.comments || []);
    setActionRemarks('');
    setChatMessage('');
    try {
      const res: any = await api.get(`/expenses/${item.id}`);
      const fullItem = res?.data || res;
      if (fullItem && fullItem.id) {
        setSelectedExpense(fullItem);
        setComments(fullItem.comments || []);
      }
    } catch (err) {
      console.error('Failed to load expense details:', err);
    }
  };

  // Send message / chat note
  const handleSendMessage = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!selectedExpense || !chatMessage.trim() || isSendingMessage) return;

    const messageToSend = chatMessage.trim();
    setIsSendingMessage(true);
    try {
      const res: any = await api.post(`/expenses/${selectedExpense.id}/comments`, {
        message: messageToSend,
      });
      const newComment = res?.comment || res?.data?.comment;
      if (newComment) {
        setComments((prev) => {
          // Avoid duplicate insertion
          if (prev.some((c) => c.id === newComment.id)) return prev;
          return [...prev, newComment];
        });
      }
      const updatedExpense = res?.expense || res?.data?.expense;
      if (updatedExpense) {
        setSelectedExpense(updatedExpense);
      }
      setChatMessage('');
      fetchData(true); // Silent background refresh
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to send message.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Handle Principal Approval / Rejection / Clarification
  const handleReviewAction = async (expenseId: number, decision: 'approved' | 'rejected' | 'query') => {
    if (decision === 'query') {
      const queryText = actionRemarks.trim() || chatMessage.trim();
      if (!queryText) {
        alert('Please write your clarification query/notes in the remarks or chat box.');
        return;
      }

      setIsActionLoading(true);
      try {
        const res: any = await api.post(`/expenses/${expenseId}/comments`, {
          message: queryText,
        });
        const newComment = res?.comment || res?.data?.comment;
        if (newComment) {
          setComments((prev) => {
            if (prev.some((c) => c.id === newComment.id)) return prev;
            return [...prev, newComment];
          });
        }
        const updatedExpense = res?.expense || res?.data?.expense;
        if (updatedExpense) {
          setSelectedExpense(updatedExpense);
        }
        setActionRemarks('');
        setChatMessage('');
        await fetchData();
      } catch (err: any) {
        alert(err.response?.data?.message || err.message || 'Failed to post clarification query.');
      } finally {
        setIsActionLoading(false);
      }
      return;
    }

    if (decision === 'rejected' && !actionRemarks.trim()) {
      alert('Please provide a reason for rejecting this requisition.');
      return;
    }

    setIsActionLoading(true);
    try {
      await api.post(`/expenses/${expenseId}/vote`, {
        decision,
        remarks: actionRemarks.trim() || undefined,
      });

      setActionRemarks('');
      setSelectedExpense(null);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to submit decision.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Metrics Calculations
  const stats = useMemo(() => {
    const totalCount = expenses.length;
    const totalAmount = expenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    
    const pendingReview = expenses.filter((e) => e.status === 'pending');
    const pendingAmount = pendingReview.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

    const disbursed = expenses.filter((e) => e.status === 'disbursed');
    const disbursedAmount = disbursed.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

    const approved = expenses.filter((e) => e.status === 'approved');
    const approvedAmount = approved.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

    // Urgent Orders count
    const urgentCount = expenses.filter((e) => e.description?.includes('[PRIORITY: URGENT]')).length;

    return {
      totalCount,
      totalAmount,
      pendingCount: pendingReview.length,
      pendingAmount,
      disbursedCount: disbursed.length,
      disbursedAmount,
      approvedCount: approved.length,
      approvedAmount,
      urgentCount,
    };
  }, [expenses]);

  // Filtered List
  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      // Search filter
      const matchesSearch = 
        !searchQuery ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;

      // Status filter
      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;

      // Priority filter
      let matchesPriority = true;
      if (selectedPriority === 'urgent') {
        matchesPriority = Boolean(item.description?.includes('[PRIORITY: URGENT]'));
      } else if (selectedPriority === 'high') {
        matchesPriority = Boolean(item.description?.includes('[PRIORITY: HIGH]'));
      } else if (selectedPriority === 'normal') {
        matchesPriority = !item.description?.includes('[PRIORITY: URGENT]') && !item.description?.includes('[PRIORITY: HIGH]');
      }

      return matchesSearch && matchesCategory && matchesStatus && matchesPriority;
    });
  }, [expenses, searchQuery, selectedCategory, selectedStatus, selectedPriority]);

  // Extract Priority from description
  const getPriorityBadge = (description?: string) => {
    if (description?.includes('[PRIORITY: URGENT]')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200 uppercase tracking-wide">
          <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" /> Urgent
        </span>
      );
    }
    if (description?.includes('[PRIORITY: HIGH]')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wide">
          <Clock className="w-3 h-3 text-amber-600 shrink-0" /> High Priority
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 text-gray-700 border border-gray-200">
        Normal
      </span>
    );
  };

  const getStatusBadge = (status: ExpenseItem['status']) => {
    switch (status) {
      case 'disbursed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Fulfilled & Paid
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <Check className="w-3.5 h-3.5 text-blue-700" /> Authorized
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5 text-rose-700" /> Rejected
          </span>
        );
      case 'clarification_requested':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <HelpCircle className="w-3.5 h-3.5 text-purple-700" /> Clarification
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-700" /> Pending Accounts
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn pb-12">
      
      {/* ================= COMPACT TOP TITLE & ACTION BAR ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black text-gray-900">Principal Desk</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-[#0B462C] border border-emerald-200 uppercase">
              Executive
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Welcome, <strong className="text-gray-700">{currentUser?.name || 'Principal'}</strong> • Dispatch procurement directives & authorize high-value requisitions
          </p>
        </div>

        {/* Quick Action Button: Dispatch Direct Order */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsOrderModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B462C] hover:bg-[#062E1C] text-white font-bold text-xs shadow-xs active:scale-98 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-[#C5A059]" />
            <span>Submit Order to Accountant</span>
          </button>

          <button
            onClick={() => fetchData()}
            disabled={isLoading}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition cursor-pointer"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ================= COMPACT 4 KPI METRIC TILES ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Tile 1: Orders Dispatched */}
        <div className="bg-white rounded-2xl p-3.5 border border-gray-200/80 shadow-xs hover:shadow-sm transition-all space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total Directives</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#0B462C] flex items-center justify-center border border-emerald-100">
              <Briefcase className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-lg font-black text-gray-900 leading-tight">{stats.totalCount}</div>
            <p className="text-[10.5px] text-gray-500 mt-0.5">
              PKR <strong className="text-[#0B462C] font-bold">{stats.totalAmount.toLocaleString()}</strong> committed
            </p>
          </div>
          <div className="pt-1.5 border-t border-gray-100 flex items-center justify-between text-[10px]">
            <span className="text-gray-400">Urgent</span>
            <span className="font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded">{stats.urgentCount}</span>
          </div>
        </div>

        {/* Tile 2: Pending at Accounts Desk */}
        <div className="bg-white rounded-2xl p-3.5 border border-gray-200/80 shadow-xs hover:shadow-sm transition-all space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Pending Execution</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-lg font-black text-amber-700 leading-tight">{stats.pendingCount}</div>
            <p className="text-[10.5px] text-gray-500 mt-0.5">
              PKR <strong className="text-amber-800 font-bold">{stats.pendingAmount.toLocaleString()}</strong> in processing
            </p>
          </div>
          <div className="pt-1.5 border-t border-gray-100 flex items-center justify-between text-[10px]">
            <span className="text-gray-400">Accountant Desk</span>
            <span className="font-bold text-amber-700">Awaiting Action</span>
          </div>
        </div>

        {/* Tile 3: Authorized & Ready */}
        <div className="bg-white rounded-2xl p-3.5 border border-gray-200/80 shadow-xs hover:shadow-sm transition-all space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Board Authorized</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
              <Check className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-lg font-black text-blue-700 leading-tight">{stats.approvedCount}</div>
            <p className="text-[10.5px] text-gray-500 mt-0.5">
              PKR <strong className="text-blue-800 font-bold">{stats.approvedAmount.toLocaleString()}</strong> authorized
            </p>
          </div>
          <div className="pt-1.5 border-t border-gray-100 flex items-center justify-between text-[10px]">
            <span className="text-gray-400">Ready for Payout</span>
            <span className="font-bold text-blue-700">Cleared</span>
          </div>
        </div>

        {/* Tile 4: Fulfilled & Paid */}
        <div className="bg-white rounded-2xl p-3.5 border border-gray-200/80 shadow-xs hover:shadow-sm transition-all space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Disbursed / Paid</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-lg font-black text-[#0B462C] leading-tight">{stats.disbursedCount}</div>
            <p className="text-[10.5px] text-gray-500 mt-0.5">
              PKR <strong className="text-[#0B462C] font-bold">{stats.disbursedAmount.toLocaleString()}</strong> settled
            </p>
          </div>
          <div className="pt-1.5 border-t border-gray-100 flex items-center justify-between text-[10px]">
            <span className="text-gray-400">Status</span>
            <span className="font-bold text-emerald-700">Procured</span>
          </div>
        </div>
      </div>

      {/* ================= TAB NAVIGATION & FILTERS ================= */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-gray-200/80 shadow-xs space-y-5">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          
          {/* Main View Tabs */}
          <div className="flex items-center gap-2 p-1 bg-gray-100/80 rounded-2xl w-fit">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'orders'
                  ? 'bg-white text-[#0B462C] shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Directives & Orders</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-50 text-[#0B462C] font-extrabold">
                {expenses.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('approvals')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'approvals'
                  ? 'bg-white text-[#0B462C] shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Pending Approvals</span>
              {stats.pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-extrabold">
                  {stats.pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'overview'
                  ? 'bg-white text-[#0B462C] shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Campus Health</span>
            </button>
          </div>

          {/* Quick Search & Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[200px] sm:min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders, title, scope..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#0B462C] focus:outline-none transition"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#0B462C] focus:outline-none transition cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#0B462C] focus:outline-none transition cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">🔴 Urgent / Same-Day</option>
              <option value="high">🟡 High Priority</option>
              <option value="normal">Normal</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#0B462C] focus:outline-none transition cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending Accounts</option>
              <option value="approved">Authorized</option>
              <option value="disbursed">Fulfilled & Paid</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* ================= TAB 1: ORDERS & DIRECTIVES LIST ================= */}
        {activeTab === 'orders' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 border-b border-gray-200/80 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3.5 w-12 text-center">#</th>
                  <th className="px-4 py-3.5">Priority</th>
                  <th className="px-4 py-3.5">Order Title & Directive Scope</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Estimated Budget</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5">Accounts Status</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0B462C]" />
                      Loading directives & orders...
                    </td>
                  </tr>
                ) : filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                      No directives found matching the selected criteria.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-3.5 text-center font-bold text-gray-400">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {getPriorityBadge(item.description)}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-gray-900 text-xs">{item.title}</div>
                        {item.description && (
                          <div className="text-[11px] text-gray-500 truncate max-w-sm mt-0.5">
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 font-semibold text-gray-700 text-[11px]">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-extrabold text-gray-900 whitespace-nowrap">
                        Rs. {Number(item.amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap text-[11px]">
                        {new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => router.push(`/dashboard/expenses/${item.id}`)}
                          className="px-3 py-1.5 rounded-lg border border-gray-200 hover:border-[#0B462C] hover:text-[#0B462C] font-bold text-gray-600 text-xs transition cursor-pointer"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ================= TAB 2: PENDING APPROVALS LIST ================= */}
        {activeTab === 'approvals' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/60 text-xs text-emerald-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#0B462C]" />
                <span>
                  Showing all expense vouchers awaiting Principal verification and authorization before fund disbursement.
                </span>
              </div>
              <span className="font-bold text-[#0B462C]">{stats.pendingCount} Items Require Review</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 border-b border-gray-200/80 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3.5 w-12 text-center">#</th>
                    <th className="px-4 py-3.5">Requisition Title</th>
                    <th className="px-4 py-3.5">Category</th>
                    <th className="px-4 py-3.5">Submitted By</th>
                    <th className="px-4 py-3.5">Amount (PKR)</th>
                    <th className="px-4 py-3.5">Date</th>
                    <th className="px-4 py-3.5 text-right">Principal Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {expenses.filter(e => e.status === 'pending').length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                        🎉 Great job! No pending approvals at your desk right now.
                      </td>
                    </tr>
                  ) : (
                    expenses.filter(e => e.status === 'pending').map((item, index) => (
                      <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-4 py-3.5 text-center font-bold text-gray-400">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-gray-900 text-xs">{item.title}</div>
                          {item.description && (
                            <div className="text-[11px] text-gray-500 truncate max-w-xs">{item.description}</div>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="px-2 py-0.5 rounded-md bg-gray-100 font-semibold text-gray-700 text-[11px]">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-gray-700 font-semibold">
                          {item.creator?.name || 'Finance Officer'}
                        </td>
                        <td className="px-4 py-3.5 font-extrabold text-[#0B462C] text-sm whitespace-nowrap">
                          Rs. {Number(item.amount).toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5 text-gray-500 text-[11px] whitespace-nowrap">
                          {new Date(item.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <button
                            onClick={() => router.push(`/dashboard/expenses/${item.id}`)}
                            className="px-3.5 py-1.5 rounded-xl bg-[#0B462C] text-white hover:bg-[#062E1C] font-bold text-xs shadow-xs transition cursor-pointer"
                          >
                            Review & Decide
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 3: CAMPUS OPERATIONAL HEALTH ================= */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-2">
            
            {/* Card 1: Attendance Pulse */}
            <div className="bg-gray-50/80 rounded-3xl p-6 border border-gray-200/80 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#0B462C] flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Student Attendance</h3>
                  <p className="text-xs text-gray-500">Live Campus Roll Call</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-gray-600">Present Today</span>
                  <span className="text-emerald-700 font-bold">94.2%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-[#0B462C] h-2 rounded-full w-[94.2%]" />
                </div>
                <p className="text-[11px] text-gray-500 pt-1">
                  1,248 students checked in across Senior, Junior & Primary wings.
                </p>
              </div>
            </div>

            {/* Card 2: Faculty & Staff Duty */}
            <div className="bg-gray-50/80 rounded-3xl p-6 border border-gray-200/80 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Staff & Faculty</h3>
                  <p className="text-xs text-gray-500">Teaching & Admin Duty</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-gray-600">On-Duty Compliance</span>
                  <span className="text-blue-700 font-bold">98.0%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full w-[98%]" />
                </div>
                <p className="text-[11px] text-gray-500 pt-1">
                  54 teaching faculty and 18 support staff verified on biometrics.
                </p>
              </div>
            </div>

            {/* Card 3: EOD Daily Working Report */}
            <div className="bg-gradient-to-br from-[#062E1C] to-[#0B462C] rounded-3xl p-6 text-white space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-emerald-200 text-[10px] font-bold border border-white/15">
                  <Sparkles className="w-3 h-3 text-[#C5A059]" /> Flagship Module 19
                </div>
                <h3 className="text-sm font-extrabold text-white">1-Click EOD Campus Report</h3>
                <p className="text-xs text-emerald-100/70 leading-relaxed">
                  Automatically compile attendance, staff logs, visitor passes, and financial summaries at school close.
                </p>
              </div>

              <button
                onClick={() => alert('Compiling comprehensive EOD Institutional Working Report for Chunian Campus...')}
                className="w-full py-2.5 rounded-xl bg-white text-[#0B462C] font-bold text-xs hover:bg-emerald-50 transition cursor-pointer shadow-md"
              >
                Compile Today's EOD Report
              </button>
            </div>

          </div>
        )}

      </div>

      {/* ================= MODAL: SUBMIT DIRECT ORDER TO ACCOUNTANT ================= */}
      {isOrderModalOpen && (
        <div
          onClick={() => setIsOrderModalOpen(false)}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 pt-4 sm:pt-4 shadow-2xl border border-gray-100 relative space-y-4 animate-scaleUp max-h-[92vh] overflow-y-auto"
          >
            <button
              onClick={() => setIsOrderModalOpen(false)}
              className="absolute top-3.5 right-4 text-gray-400 hover:text-gray-600 cursor-pointer p-1.5 rounded-lg hover:bg-gray-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* School Crest & Institution Header (Identical to Accountant Dashboard) */}
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <div className="w-11 h-11 relative shrink-0">
                <Image
                  src="/logo.png"
                  alt="NSSE Logo"
                  fill
                  sizes="44px"
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

            {/* Title & Subtitle */}
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Submit Directive to Accountant
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Dispatches an official procurement and payment order to the Finance Desk.
              </p>
            </div>

            {/* Error / Success Feedback */}
            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}
            {formSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            {/* Order Form */}
            <form onSubmit={handleCreateOrder} className="space-y-4">
              
              {/* Order Title */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Order / Requisition Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Science Lab Chemical Restock, Exam Sheets Printing"
                  value={orderTitle}
                  onChange={(e) => setOrderTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#0B462C] focus:ring-2 focus:ring-[#0B462C]/10 focus:outline-none transition font-medium placeholder:text-gray-400"
                />
              </div>

              {/* Category & Estimated Amount Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Expense Category <span className="text-rose-500">*</span>
                  </label>
                  <CustomDropdown
                    options={categoryOptions}
                    value={orderCategory}
                    onChange={setOrderCategory}
                    placeholder="Select Category"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Estimated Budget (PKR) <span className="text-rose-500">*</span>
                  </label>
                  <CustomNumberInput
                    value={orderAmount}
                    onChange={setOrderAmount}
                    placeholder="e.g. 25000"
                    prefix="Rs."
                    required
                  />
                </div>
              </div>

              {/* Priority & Target Deadline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Execution Priority
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setOrderPriority('normal')}
                      className={`py-2 px-1 text-center rounded-xl text-[10px] font-bold border transition cursor-pointer ${
                        orderPriority === 'normal'
                          ? 'bg-gray-800 text-white border-gray-800'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      Normal
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderPriority('high')}
                      className={`py-2 px-1 text-center rounded-xl text-[10px] font-bold border transition cursor-pointer ${
                        orderPriority === 'high'
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                      }`}
                    >
                      High
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderPriority('urgent')}
                      className={`py-2 px-1 text-center rounded-xl text-[10px] font-bold border transition cursor-pointer ${
                        orderPriority === 'urgent'
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                      }`}
                    >
                      🔴 Urgent
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Required By (Deadline)
                  </label>
                  <CustomDatePicker
                    value={orderDeadline}
                    onChange={setOrderDeadline}
                    placeholder="Select Target Date"
                    align="right"
                    allowClear
                  />
                </div>
              </div>

              {/* Specifications & Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Specifications / Vendor Instructions / Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide quantity, vendor preference, or specific instructions for the accountant..."
                  value={orderDescription}
                  onChange={(e) => setOrderDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#0B462C] focus:ring-2 focus:ring-[#0B462C]/10 focus:outline-none transition placeholder:text-gray-400"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsOrderModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingOrder}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0B462C] to-[#062E1C] text-white font-bold text-xs shadow-md hover:brightness-110 active:scale-98 transition cursor-pointer flex items-center gap-2"
                >
                  {isSubmittingOrder ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Dispatching Directive...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Dispatch Order to Accountant</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EXPENSE / ORDER DETAIL & TWO-WAY CHAT ================= */}
      {selectedExpense && (
        <div
          onClick={() => setSelectedExpense(null)}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-6 pt-3.5 sm:pt-4 shadow-2xl border border-gray-100 relative space-y-3.5 animate-scaleUp max-h-[92vh] overflow-y-auto"
          >
            <button
              onClick={() => setSelectedExpense(null)}
              className="absolute top-3.5 right-4 text-gray-400 hover:text-gray-600 cursor-pointer p-1.5 rounded-lg hover:bg-gray-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* School Crest & Institution Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <div className="w-11 h-11 relative shrink-0">
                <Image
                  src="/logo.png"
                  alt="NSSE Logo"
                  fill
                  sizes="44px"
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

            {/* Requisition Header Info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-emerald-50 text-[#0B462C] border border-emerald-200">
                    Record #{selectedExpense.id}
                  </span>
                  {getStatusBadge(selectedExpense.status)}
                  {getPriorityBadge(selectedExpense.description)}
                </div>
                <h3 className="text-xl font-extrabold text-gray-900 mt-2">{selectedExpense.title}</h3>
                <p className="text-xs text-gray-500">
                  Logged on {new Date(selectedExpense.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} by <strong className="text-gray-700">{selectedExpense.creator?.name || 'Accountant'}</strong>
                </p>
              </div>
            </div>

            {/* Main Content Grid: Left Side Chat Thread (Col 7) / Right Side Order Breakdown & Actions (Col 5) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
              
              {/* ================= LEFT SIDE: CHAT & CLARIFICATIONS THREAD ================= */}
              <div className="md:col-span-7 flex flex-col space-y-3 bg-gray-50/70 p-4 rounded-2xl border border-gray-200/70">
                
                <div className="flex items-center justify-between border-b border-gray-200/60 pb-2.5">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#0B462C]" />
                    <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                      Discussion & Clarifications
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                    {comments.length + (selectedExpense.description ? 1 : 0)} Messages
                  </span>
                </div>

                {/* Conversation Feed */}
                <div className="flex-1 min-h-[240px] max-h-[340px] overflow-y-auto space-y-3 pr-1">
                  
                  {/* Initial Requisition Message / Directive from Creator */}
                  {selectedExpense.description ? (
                    <div className="flex flex-col space-y-1 items-start">
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-500 px-1">
                        <span className="font-bold text-gray-800">
                          {selectedExpense.creator?.name || 'Requisitioner'}
                        </span>
                        <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                          Order Directive
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(selectedExpense.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="p-3.5 rounded-2xl text-sm leading-relaxed max-w-[95%] shadow-xs bg-white text-gray-900 border border-gray-200/80 rounded-tl-none font-medium">
                        <p className="whitespace-pre-wrap">{selectedExpense.description}</p>
                      </div>
                    </div>
                  ) : null}

                  {/* Clarifications / Discussion Messages */}
                  {comments.map((c) => {
                    const isPrincipal = c.user?.role === 'principal' || c.user?.id === currentUser?.id;
                    return (
                      <div
                        key={c.id}
                        className={`flex flex-col space-y-1 ${isPrincipal ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 px-1">
                          <span className={`font-bold ${isPrincipal ? 'text-[#0B462C]' : 'text-gray-800'}`}>
                            {c.user?.name || 'Staff'}
                          </span>
                          {c.user?.role && (
                            <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-gray-200/60 text-gray-600 font-semibold">
                              {c.user.role.replace('_', ' ')}
                            </span>
                          )}
                          <span className="text-[10px] text-gray-400">
                            {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div
                          className={`p-3.5 rounded-2xl text-sm leading-relaxed max-w-[90%] shadow-xs ${
                            isPrincipal
                              ? 'bg-[#0B462C] text-white rounded-tr-none'
                              : 'bg-white text-gray-900 border border-gray-200/80 rounded-tl-none'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{c.message || c.comment}</p>
                        </div>
                      </div>
                    );
                  })}

                  {!selectedExpense.description && comments.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400 space-y-1.5">
                      <MessageSquare className="w-8 h-8 opacity-30 text-[#0B462C]" />
                      <p className="text-xs font-medium">No clarification messages yet.</p>
                      <p className="text-[11px] text-gray-400">Type below to post a clarification question to the accountant.</p>
                    </div>
                  )}
                </div>

                {/* Clarification Input Box */}
                <div className="space-y-2 pt-2 border-t border-gray-200/60">
                  <div className="flex gap-2 items-end">
                    <textarea
                      rows={2}
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                      placeholder="Type clarification question or reply here (Press Enter to send)..."
                      className="flex-1 px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:border-[#0B462C] focus:ring-2 focus:ring-[#0B462C]/10 focus:outline-none transition resize-none placeholder:text-gray-400"
                    />
                    <button
                      type="button"
                      onClick={handleSendMessage}
                      disabled={isSendingMessage || !chatMessage.trim()}
                      className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-40 shadow-xs shrink-0"
                    >
                      <HelpCircle className="w-4 h-4" />
                      <span>{isSendingMessage ? 'Sending...' : 'Ask Clarification'}</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* ================= RIGHT SIDE: SUMMARY & EXECUTIVE ACTIONS ================= */}
              <div className="md:col-span-5 space-y-4 flex flex-col justify-between">
                
                <div className="space-y-4">
                  {/* Financial Summary Card */}
                  <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200/60 space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="font-semibold uppercase tracking-wider text-[10px]">Category</span>
                      <span className="px-2.5 py-1 rounded-md bg-white font-bold text-gray-700 border border-gray-200 text-xs">
                        {selectedExpense.category}
                      </span>
                    </div>
                    <div className="pt-1">
                      <span className="text-[11px] font-semibold text-gray-500">Total Requisition Amount</span>
                      <div className="text-3xl font-black text-[#0B462C] mt-0.5">
                        Rs. {Number(selectedExpense.amount).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-1.5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Current Institutional Status</span>
                    <div className="pt-0.5">
                      {getStatusBadge(selectedExpense.status)}
                    </div>
                  </div>
                </div>

                {/* Principal Decision Action Buttons */}
                {(selectedExpense.status === 'pending' || selectedExpense.status === 'clarification_requested') && (
                  <div className="space-y-2.5 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => handleReviewAction(selectedExpense.id, 'approved')}
                      disabled={isActionLoading}
                      className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition cursor-pointer text-center flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Authorize & Approve</span>
                    </button>

                    <button
                      onClick={() => {
                        const reason = prompt('Please enter the reason for rejecting this order:');
                        if (reason !== null) {
                          setActionRemarks(reason);
                          handleReviewAction(selectedExpense.id, 'rejected');
                        }
                      }}
                      disabled={isActionLoading}
                      className="w-full py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition cursor-pointer text-center flex items-center justify-center gap-1.5"
                    >
                      <X className="w-4 h-4" />
                      <span>Reject Order</span>
                    </button>
                  </div>
                )}

              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
