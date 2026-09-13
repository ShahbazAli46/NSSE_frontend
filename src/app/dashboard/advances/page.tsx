'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  Wallet, 
  Building2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search, 
  RefreshCw, 
  Printer, 
  ArrowLeft,
  CheckCircle,
  XCircle,
  Banknote,
  FileText,
  ShieldCheck,
  User,
  Sparkles,
  Calendar,
  Send
} from 'lucide-react';
import { api, getStoredUser, User as UserType, AdvanceSalaryRequest } from '@/lib/api';
import CustomTextInput from '@/components/CustomTextInput';
import CustomMonthPicker from '@/components/CustomMonthPicker';

export default function AdvanceSalaryDeskPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [requests, setRequests] = useState<AdvanceSalaryRequest[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved_pending_disburse' | 'disbursed' | 'rejected'>('all');
  
  // Custom Month Filter (Defaults to current month)
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().substring(0, 7) // e.g. "2026-09"
  );

  // Live Bank & Cash Balances
  const [bankBalance, setBankBalance] = useState<number>(0);
  const [cashInHand, setCashInHand] = useState<number>(0);

  // Review Modal (Principal / Director)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [selectedAdvForReview, setSelectedAdvForReview] = useState<AdvanceSalaryRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewRemarks, setReviewRemarks] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Disbursement Modal (Accountant / Finance)
  const [isDisburseModalOpen, setIsDisburseModalOpen] = useState<boolean>(false);
  const [selectedAdvForDisburse, setSelectedAdvForDisburse] = useState<AdvanceSalaryRequest | null>(null);
  const [paymentSource, setPaymentSource] = useState<'bank' | 'cash'>('bank');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [disburseNotes, setDisburseNotes] = useState<string>('');
  const [isSubmittingDisburse, setIsSubmittingDisburse] = useState<boolean>(false);
  const [disburseError, setDisburseError] = useState<string | null>(null);

  // Success Feedback
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchAdvances = async (silent = false, monthToFetch = selectedMonth) => {
    if (!silent) setIsLoading(true);
    try {
      const advUrl = monthToFetch 
        ? `/advance-salary-requests?month=${encodeURIComponent(monthToFetch)}`
        : '/advance-salary-requests';
      const finUrl = monthToFetch
        ? `/financial-summary?month=${encodeURIComponent(monthToFetch)}`
        : '/financial-summary';

      const [advRes, finRes]: any = await Promise.all([
        api.get(advUrl).catch(() => ({ requests: [], stats: {} })),
        api.get(finUrl).catch(() => ({ bank_balance: 0, cash_in_hand: 0 })),
      ]);

      if (advRes?.requests) {
        setRequests(advRes.requests);
        setStats(advRes.stats);
      }
      if (finRes) {
        setBankBalance(Number(finRes.bank_balance ?? 0));
        setCashInHand(Number(finRes.cash_in_hand ?? 0));
      }
    } catch (err: any) {
      console.error('Failed to load advance salary desk data:', err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    setCurrentUser(getStoredUser());
    fetchAdvances(false, selectedMonth);
  }, []);

  const isPrincipalOrDirector = useMemo(() => {
    return ['principal', 'director', 'chairman', 'super_admin', 'admin'].includes(currentUser?.role || '');
  }, [currentUser]);

  const isAccountant = useMemo(() => {
    return ['accountant', 'hr_accountant', 'director', 'chairman', 'super_admin', 'admin'].includes(currentUser?.role || '');
  }, [currentUser]);

  const openReviewModal = (adv: AdvanceSalaryRequest, action: 'approve' | 'reject') => {
    setSelectedAdvForReview(adv);
    setReviewAction(action);
    setReviewRemarks(action === 'approve' ? 'Approved by Principal. Forwarded to Accounts for disbursement.' : '');
    setRejectionReason('');
    setReviewError(null);
    setIsReviewModalOpen(true);
  };

  const handleProcessReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdvForReview) return;

    if (reviewAction === 'reject' && !rejectionReason.trim()) {
      setReviewError('Please specify the reason for rejecting this advance request.');
      return;
    }

    setIsSubmittingReview(true);
    setReviewError(null);

    try {
      if (reviewAction === 'approve') {
        const res: any = await api.post(`/advance-salary-requests/${selectedAdvForReview.id}/approve`, {
          remarks: reviewRemarks.trim() || 'Approved by Principal. Forwarded to Accounts for disbursement.',
        });
        setSuccessMessage(res?.message || 'Advance salary request approved successfully.');
      } else {
        const res: any = await api.post(`/advance-salary-requests/${selectedAdvForReview.id}/reject`, {
          rejection_reason: rejectionReason.trim(),
          remarks: reviewRemarks.trim() || null,
        });
        setSuccessMessage(res?.message || 'Advance salary request rejected.');
      }

      setIsReviewModalOpen(false);
      fetchAdvances(true);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setReviewError(err.message || 'Failed to process executive review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const openDisburseModal = (adv: AdvanceSalaryRequest) => {
    setSelectedAdvForDisburse(adv);
    setPaymentSource('bank');
    setPaymentRef('');
    setDisburseNotes('');
    setDisburseError(null);
    setIsDisburseModalOpen(true);
    
    // Ensure fresh financial summary is loaded immediately
    const finUrl = selectedMonth
      ? `/financial-summary?month=${encodeURIComponent(selectedMonth)}`
      : '/financial-summary';

    api.get(finUrl)
      .then((finRes: any) => {
        if (finRes) {
          setBankBalance(Number(finRes.bank_balance ?? 0));
          setCashInHand(Number(finRes.cash_in_hand ?? 0));
        }
      })
      .catch(() => {});
  };

  const handleProcessDisburse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdvForDisburse) return;

    const reqAmount = Number(selectedAdvForDisburse.amount);
    if (paymentSource === 'bank' && bankBalance < reqAmount) {
      setDisburseError(`Insufficient funds in School Bank Account (Current Balance: PKR ${bankBalance.toLocaleString()}, Requested: PKR ${reqAmount.toLocaleString()}).`);
      return;
    }
    if (paymentSource === 'cash' && cashInHand < reqAmount) {
      setDisburseError(`Insufficient cash in Drawer (Current Balance: PKR ${cashInHand.toLocaleString()}, Requested: PKR ${reqAmount.toLocaleString()}).`);
      return;
    }

    setIsSubmittingDisburse(true);
    setDisburseError(null);

    try {
      const res: any = await api.post(`/advance-salary-requests/${selectedAdvForDisburse.id}/disburse`, {
        payment_source: paymentSource,
        reference_no: paymentRef.trim() || null,
        notes: disburseNotes.trim() || null,
      });

      setSuccessMessage(res?.message || 'Advance salary successfully disbursed and deducted from account.');
      setIsDisburseModalOpen(false);
      fetchAdvances(true);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setDisburseError(err.message || 'Failed to disburse advance payment.');
    } finally {
      setIsSubmittingDisburse(false);
    }
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const query = searchQuery.toLowerCase().trim();
      const matchSearch =
        !query ||
        r.staff_name.toLowerCase().includes(query) ||
        r.designation.toLowerCase().includes(query) ||
        r.reason.toLowerCase().includes(query);

      let matchTab = true;
      if (activeTab === 'pending') {
        matchTab = r.status === 'pending';
      } else if (activeTab === 'approved_pending_disburse') {
        matchTab = r.status === 'approved' && r.disbursement_status === 'pending';
      } else if (activeTab === 'disbursed') {
        matchTab = r.disbursement_status === 'disbursed';
      } else if (activeTab === 'rejected') {
        matchTab = r.status === 'rejected';
      }

      return matchSearch && matchTab;
    });
  }, [requests, searchQuery, activeTab]);

  return (
    <div className="space-y-6 pb-16">
      
      {/* ================= TOP HEADER & INSTITUTIONAL BRANDING ================= */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="p-2.5 rounded-2xl border border-gray-200 hover:bg-gray-100 text-gray-600 transition cursor-pointer"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center justify-center font-black">
            <Wallet className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-gray-900 leading-tight">
                Advance Salary & Loans Desk
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 uppercase">
                Financial Operations
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium">
              Executive reviews, principal approvals, and accounts disbursement authorization
            </p>
          </div>
        </div>

        {/* Live Liquidity Balances & Refresh */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950">
            <Building2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-emerald-800 uppercase block leading-none">School Bank Account</span>
              <span className="text-xs font-black font-mono">PKR {bankBalance.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950">
            <Banknote className="w-4 h-4 text-amber-700 shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-amber-800 uppercase block leading-none">Cash Drawer Float</span>
              <span className="text-xs font-black font-mono">PKR {cashInHand.toLocaleString()}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => fetchAdvances()}
            disabled={isLoading}
            className="p-2.5 rounded-2xl border border-gray-200 hover:bg-gray-100 text-gray-600 transition cursor-pointer"
            title="Refresh Live Advances"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Global Success Notification */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-5 py-3.5 rounded-2xl flex items-center gap-2.5 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-xs sm:text-sm font-bold">{successMessage}</span>
        </div>
      )}

      {/* ================= METRIC KPI CARDS ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
            Total Applications
          </span>
          <div className="text-xl font-black text-gray-900">{stats?.total_requests || requests.length}</div>
          <span className="text-[11px] text-gray-500 font-medium">All-time submissions</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-xs space-y-1 bg-gradient-to-br from-amber-50/50 to-transparent">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
              Pending Approvals
            </span>
            {Number(stats?.pending_count || 0) > 0 && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            )}
          </div>
          <div className="text-xl font-black text-amber-900 font-mono">
            {stats?.pending_count || requests.filter(r => r.status === 'pending').length}
          </div>
          <span className="text-[11px] text-amber-700 font-medium">
            PKR {Number(stats?.total_pending_amount || 0).toLocaleString()} awaiting Principal review
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-blue-200 shadow-xs space-y-1 bg-gradient-to-br from-blue-50/50 to-transparent">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">
              To Be Disbursed
            </span>
            {Number(stats?.pending_disbursement_count || 0) > 0 && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
            )}
          </div>
          <div className="text-xl font-black text-blue-900 font-mono">
            {stats?.pending_disbursement_count || requests.filter(r => r.status === 'approved' && r.disbursement_status === 'pending').length}
          </div>
          <span className="text-[11px] text-blue-700 font-medium">
            PKR {Number(stats?.total_pending_disbursement_amount || 0).toLocaleString()} approved by Principal
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-xs space-y-1 bg-gradient-to-br from-emerald-50/50 to-transparent">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
            Disbursed & Active
          </span>
          <div className="text-xl font-black text-emerald-900 font-mono">
            PKR {Number(stats?.total_disbursed_amount || 0).toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-700 font-medium">
            {stats?.disbursed_count || requests.filter(r => r.disbursement_status === 'disbursed').length} paid out
          </span>
        </div>
      </div>

      {/* ================= DESK TABS & SEARCH BAR ================= */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200/80 shadow-xs space-y-5">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          
          {/* Navigation Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-gray-100 rounded-2xl border border-gray-200/80 w-fit">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-[#0B462C] text-[#E8D4A2] shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
              }`}
            >
              All Requests ({requests.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('pending')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'pending'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
              }`}
            >
              {requests.filter(r => r.status === 'pending').length > 0 && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
              )}
              <span>Pending Approvals ({requests.filter(r => r.status === 'pending').length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('approved_pending_disburse')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'approved_pending_disburse'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
              }`}
            >
              {requests.filter(r => r.status === 'approved' && r.disbursement_status === 'pending').length > 0 && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
              )}
              <span>To Disburse ({requests.filter(r => r.status === 'approved' && r.disbursement_status === 'pending').length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('disbursed')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'disbursed'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
              }`}
            >
              Disbursed ({requests.filter(r => r.disbursement_status === 'disbursed').length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('rejected')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'rejected'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
              }`}
            >
              Rejected ({requests.filter(r => r.status === 'rejected').length})
            </button>
          </div>

          {/* Filter Controls: Custom Month Picker & Search Box */}
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* Custom Month Picker */}
            <div className="w-48 sm:w-52 shrink-0">
              <CustomMonthPicker
                value={selectedMonth}
                onChange={(newMonth) => {
                  setSelectedMonth(newMonth);
                  fetchAdvances(false, newMonth);
                }}
                placeholder="All Months"
                align="right"
              />
            </div>

            {/* Search Box */}
            <div className="relative min-w-[220px] sm:min-w-[260px] flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search staff, reason, designation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#0B462C] focus:outline-none transition"
              />
            </div>

          </div>

        </div>

        {/* Advance Salary Requests Table */}
        {isLoading ? (
          <div className="p-16 text-center text-gray-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-[#0B462C]" />
            <p className="text-sm font-semibold">Loading advance salary registry...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-16 text-center space-y-3 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
              <Wallet className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-gray-800">No Advance Requests Found</div>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {searchQuery ? 'No applications match your search query.' : 'No advance applications found in this category.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider border-b border-gray-200">
                  <th className="p-3.5">Submission Date</th>
                  <th className="p-3.5">Staff Member</th>
                  <th className="p-3.5 text-right">Requested Amount</th>
                  <th className="p-3.5">Purpose / Reason</th>
                  <th className="p-3.5">Repayment Plan</th>
                  <th className="p-3.5 text-center">Approval State</th>
                  <th className="p-3.5 text-center">Disbursement State</th>
                  <th className="p-3.5 text-center">Operational Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredRequests.map((adv) => {
                  const isPendingApproval = adv.status === 'pending';
                  const isApprovedPendingDisburse = adv.status === 'approved' && adv.disbursement_status === 'pending';
                  const isDisbursed = adv.disbursement_status === 'disbursed';
                  const isRejected = adv.status === 'rejected';

                  return (
                    <tr key={adv.id} className="hover:bg-gray-50/80 transition">
                      
                      {/* Date */}
                      <td className="p-3.5 text-gray-600 whitespace-nowrap">
                        <div className="font-bold text-gray-800">
                          {new Date(adv.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {new Date(adv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Staff */}
                      <td className="p-3.5">
                        <div className="font-black text-gray-900 leading-tight">{adv.staff_name}</div>
                        <div className="text-[11px] text-gray-500">{adv.designation}</div>
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-md ${
                          adv.staff_type === 'teacher' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {adv.staff_type === 'teacher' ? 'Faculty' : 'Staff'}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="p-3.5 text-right font-mono font-black text-blue-950 text-sm whitespace-nowrap">
                        PKR {Number(adv.amount).toLocaleString()}
                      </td>

                      {/* Reason */}
                      <td className="p-3.5 text-gray-700 max-w-xs">
                        <p className="font-medium text-xs line-clamp-2" title={adv.reason}>
                          "{adv.reason}"
                        </p>
                      </td>

                      {/* Repayment */}
                      <td className="p-3.5 text-[11px] text-gray-600">
                        {adv.repayment_plan || 'Monthly Payroll Deduction'}
                      </td>

                      {/* Approval Status */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        {isPendingApproval && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                            <Clock className="w-3 h-3 text-amber-700" />
                            Pending Principal Review
                          </span>
                        )}

                        {adv.status === 'approved' && (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                              <CheckCircle className="w-3 h-3 text-emerald-700" />
                              Approved ✓
                            </span>
                            {adv.reviewed_by_name && (
                              <div className="text-[10px] text-gray-500 font-semibold truncate max-w-[140px]" title={adv.reviewed_by_name}>
                                By {adv.reviewed_by_name}
                              </div>
                            )}
                          </div>
                        )}

                        {isRejected && (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-900 border border-rose-300">
                              <XCircle className="w-3 h-3 text-rose-700" />
                              Rejected ✗
                            </span>
                            {adv.rejection_reason && (
                              <div className="text-[10px] text-rose-700 italic truncate max-w-[140px]" title={adv.rejection_reason}>
                                "{adv.rejection_reason}"
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Disbursement Status */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        {isApprovedPendingDisburse && (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-100 text-blue-900 border border-blue-300 animate-pulse">
                              <Clock className="w-3 h-3 text-blue-700" />
                              Awaiting Disbursement
                            </span>
                            <div className="text-[10px] text-blue-700 font-bold">
                              Ready in Accounts
                            </div>
                          </div>
                        )}

                        {isDisbursed && (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-900 border border-emerald-300">
                              <span>Disbursed</span>
                              <span>{adv.payment_source === 'bank' ? '🏦 Bank' : '💵 Cash'}</span>
                            </span>
                            {adv.disbursed_by_name && (
                              <div className="text-[10px] text-gray-500">
                                By {adv.disbursed_by_name}
                              </div>
                            )}
                          </div>
                        )}

                        {!isApprovedPendingDisburse && !isDisbursed && (
                          <span className="text-[10px] font-bold text-gray-400 italic">
                            —
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          
                          {/* 1. Principal / Director Approval Actions */}
                          {isPendingApproval && isPrincipalOrDirector && (
                            <>
                              <button
                                type="button"
                                onClick={() => openReviewModal(adv, 'approve')}
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-2xs cursor-pointer flex items-center gap-1"
                              >
                                <span>Approve ✓</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => openReviewModal(adv, 'reject')}
                                className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition cursor-pointer"
                              >
                                <span>Reject ✗</span>
                              </button>
                            </>
                          )}

                          {/* 2. Accountant Disbursement Action */}
                          {isApprovedPendingDisburse && isAccountant && (
                            <button
                              type="button"
                              onClick={() => openDisburseModal(adv)}
                              className="px-3.5 py-1.5 rounded-xl bg-[#0B462C] hover:bg-[#062E1C] text-[#E8D4A2] font-black text-xs transition shadow-xs cursor-pointer flex items-center gap-1.5"
                            >
                              <Banknote className="w-3.5 h-3.5 text-[#C5A059]" />
                              <span>Disburse / Pay 💸</span>
                            </button>
                          )}

                          {/* 3. Completed State / Audit View */}
                          {isDisbursed && (
                            <button
                              type="button"
                              onClick={() => window.open(`/teachers/ledger?id=${adv.staff_id}&type=${adv.staff_type}`, '_blank')}
                              className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[11px] transition cursor-pointer flex items-center gap-1"
                            >
                              <FileText className="w-3 h-3 text-gray-500" />
                              <span>View Ledger</span>
                            </button>
                          )}

                          {isRejected && (
                            <span className="text-[11px] font-bold text-gray-400 italic">
                              Closed
                            </span>
                          )}

                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* ================= MODAL 1: PRINCIPAL / DIRECTOR APPROVAL REVIEW ================= */}
      {isReviewModalOpen && selectedAdvForReview && (
        <div 
          onClick={() => setIsReviewModalOpen(false)}
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-gray-100 relative space-y-5 animate-in fade-in zoom-in duration-150"
          >
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black ${
                reviewAction === 'approve' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
              }`}>
                {reviewAction === 'approve' ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-rose-600" />}
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900">
                  {reviewAction === 'approve' ? 'Approve Advance Salary Application' : 'Reject Advance Salary Application'}
                </h3>
                <p className="text-xs text-gray-500">
                  Executive governance review for {selectedAdvForReview.staff_name}
                </p>
              </div>
            </div>

            {/* Request Summary Box */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Staff Member:</span>
                <span className="font-bold text-gray-900">{selectedAdvForReview.staff_name} ({selectedAdvForReview.designation})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Requested Amount:</span>
                <span className="font-mono font-black text-blue-900 text-sm">PKR {Number(selectedAdvForReview.amount).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Repayment Plan:</span>
                <span className="font-semibold text-gray-700">{selectedAdvForReview.repayment_plan || 'Monthly Payroll Deduction'}</span>
              </div>
              <div className="pt-1.5 border-t border-gray-200">
                <span className="text-gray-500 block text-[11px]">Reason / Need:</span>
                <span className="font-medium text-gray-800 italic">"{selectedAdvForReview.reason}"</span>
              </div>
            </div>

            {reviewError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{reviewError}</span>
              </div>
            )}

            <form onSubmit={handleProcessReview} className="space-y-4">
              {reviewAction === 'approve' ? (
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Approval Remarks / Instructions for Accountant
                  </label>
                  <CustomTextInput
                    value={reviewRemarks}
                    onChange={setReviewRemarks}
                    placeholder="e.g. Approved. Disburse with priority via Bank/Cash."
                  />
                </div>
              ) : (
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Rejection Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Previous balance active / Policy limit exceeded / Re-apply next month"
                    rows={3}
                    required
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-hidden transition"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  disabled={isSubmittingReview}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-sm transition cursor-pointer disabled:opacity-50 flex items-center gap-2 ${
                    reviewAction === 'approve'
                      ? 'bg-[#0B462C] hover:bg-[#062E1C]'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {isSubmittingReview && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{reviewAction === 'approve' ? 'Confirm Approval ✓' : 'Confirm Rejection ✗'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: ACCOUNTANT DISBURSEMENT MODAL (BANK / CASH) ================= */}
      {isDisburseModalOpen && selectedAdvForDisburse && (
        <div 
          onClick={() => setIsDisburseModalOpen(false)}
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-gray-100 relative space-y-5 animate-in fade-in zoom-in duration-150"
          >
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#0B462C] flex items-center justify-center font-black">
                <Banknote className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900">
                  Disburse Approved Advance Salary
                </h3>
                <p className="text-xs text-gray-500">
                  Select payment source to disburse PKR {Number(selectedAdvForDisburse.amount).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Target Details */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Beneficiary:</span>
                <span className="font-bold text-gray-900">{selectedAdvForDisburse.staff_name} ({selectedAdvForDisburse.designation})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Amount to Disburse:</span>
                <span className="font-mono font-black text-emerald-800 text-base">PKR {Number(selectedAdvForDisburse.amount).toLocaleString()}</span>
              </div>
              {selectedAdvForDisburse.reviewed_by_name && (
                <div className="flex items-center justify-between pt-1 border-t border-gray-200">
                  <span className="text-gray-500">Approved By:</span>
                  <span className="font-semibold text-gray-800">{selectedAdvForDisburse.reviewed_by_name}</span>
                </div>
              )}
            </div>

            {disburseError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{disburseError}</span>
              </div>
            )}

            <form onSubmit={handleProcessDisburse} className="space-y-4">
              
              {/* Payment Source Selector */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-2">
                  Select Disbursement Payment Source <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Bank Option */}
                  <div 
                    onClick={() => setPaymentSource('bank')}
                    className={`p-3.5 rounded-2xl border-2 transition cursor-pointer space-y-1.5 ${
                      paymentSource === 'bank'
                        ? 'bg-blue-50/70 border-blue-500 text-blue-950 shadow-2xs'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-blue-700" />
                        <span>School Bank Account</span>
                      </span>
                      <input 
                        type="radio" 
                        name="payment_src" 
                        checked={paymentSource === 'bank'} 
                        onChange={() => setPaymentSource('bank')} 
                        className="accent-[#0B462C]"
                      />
                    </div>
                    <div className="text-[11px] text-gray-500">
                      Balance: <strong className="text-blue-900 font-mono">PKR {bankBalance.toLocaleString()}</strong>
                    </div>
                  </div>

                  {/* Cash Drawer Option */}
                  <div 
                    onClick={() => setPaymentSource('cash')}
                    className={`p-3.5 rounded-2xl border-2 transition cursor-pointer space-y-1.5 ${
                      paymentSource === 'cash'
                        ? 'bg-amber-50/70 border-amber-500 text-amber-950 shadow-2xs'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs flex items-center gap-1.5">
                        <Banknote className="w-4 h-4 text-amber-700" />
                        <span>Cash Drawer</span>
                      </span>
                      <input 
                        type="radio" 
                        name="payment_src" 
                        checked={paymentSource === 'cash'} 
                        onChange={() => setPaymentSource('cash')} 
                        className="accent-[#0B462C]"
                      />
                    </div>
                    <div className="text-[11px] text-gray-500">
                      Balance: <strong className="text-amber-900 font-mono">PKR {cashInHand.toLocaleString()}</strong>
                    </div>
                  </div>

                </div>
              </div>

              {/* Reference / Transaction / Cheque No */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Transaction / Cheque / Slip Reference (Optional)
                </label>
                <CustomTextInput
                  value={paymentRef}
                  onChange={setPaymentRef}
                  placeholder={paymentSource === 'bank' ? 'e.g. IBFT-889102 / CHQ-8821' : 'e.g. CASH-VCH-0091'}
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Accounts Disbursement Notes (Optional)
                </label>
                <CustomTextInput
                  value={disburseNotes}
                  onChange={setDisburseNotes}
                  placeholder="e.g. Cash handed over in person / Bank transfer receipt filed"
                />
              </div>

              {/* Impact Notice */}
              <div className="p-3 rounded-xl bg-gray-100 border border-gray-200 text-[11px] text-gray-600 space-y-0.5">
                <span className="font-bold text-gray-900 block">Financial Account Impact:</span>
                <span>
                  Disbursing this request will immediately record a <strong>PKR {Number(selectedAdvForDisburse.amount).toLocaleString()}</strong> expenditure and deduct from your {paymentSource === 'bank' ? 'School Bank Account' : 'Cash Drawer'}.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsDisburseModalOpen(false)}
                  disabled={isSubmittingDisburse}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDisburse}
                  className="px-5 py-2.5 rounded-xl bg-[#0B462C] hover:bg-[#062E1C] text-[#E8D4A2] font-black text-xs shadow-sm transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmittingDisburse && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm Disbursement & Deduct Balance</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
