'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  api, 
  getStoredUser, 
  User as UserType, 
  LeaveRequest, 
  LeaveStats,
  formatDisplayDate 
} from '@/lib/api';
import CustomMonthPicker from '@/components/CustomMonthPicker';
import CustomTextInput from '@/components/CustomTextInput';
import CustomDropdown, { DropdownOption } from '@/components/CustomDropdown';
import { 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Search, 
  RefreshCw, 
  Check, 
  X, 
  Building2, 
  Sparkles,
  ShieldCheck,
  UserCheck,
  FileText,
  Lock,
  ArrowRight,
  ArrowLeft,
  Filter
} from 'lucide-react';

export default function LeaveApplicationsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);

  const [month, setMonth] = useState<string>(
    new Date().toISOString().substring(0, 7) // e.g. "2026-09"
  );

  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [staffTypeFilter, setStaffTypeFilter] = useState<'all' | 'teacher' | 'non_teaching'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [stats, setStats] = useState<LeaveStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<string | null>(null);

  // Approve / Reject Modal State
  const [activeAction, setActiveAction] = useState<'approve' | 'reject' | null>(null);
  const [targetLeave, setTargetLeave] = useState<LeaveRequest | null>(null);
  const [actionRemarks, setActionRemarks] = useState<string>('');
  const [isProcessingAction, setIsProcessingAction] = useState<boolean>(false);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setCurrentUser(user);
  }, [router]);

  const canApprove = useMemo(() => {
    if (!currentUser) return false;
    return ['principal', 'super_admin', 'admin', 'chairman', 'director'].includes(currentUser.role);
  }, [currentUser]);

  const fetchLeaves = useCallback(async (showLoader = true, selectedMonth = month) => {
    if (showLoader) setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedMonth) params.append('month', selectedMonth);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (staffTypeFilter !== 'all') params.append('staff_type', staffTypeFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res: any = await api.get(`/leave-requests?${params.toString()}`);
      if (res?.status === 'success') {
        setLeaves(res.data || []);
        setStats(res.stats || null);
      }
    } catch (err: any) {
      console.error('Failed to load leave requests', err);
    } finally {
      if (showLoader) setIsLoading(false);
    }
  }, [month, statusFilter, staffTypeFilter, searchQuery]);

  useEffect(() => {
    fetchLeaves(true, month);
  }, [fetchLeaves, month]);

  const handleOpenActionModal = (leave: LeaveRequest, action: 'approve' | 'reject') => {
    setTargetLeave(leave);
    setActiveAction(action);
    setActionRemarks(action === 'approve' ? 'Approved by Principal' : 'Declined by Principal');
  };

  const handleExecuteAction = async () => {
    if (!targetLeave || !activeAction) return;

    setIsProcessingAction(true);
    try {
      const endpoint = `/leave-requests/${targetLeave.id}/${activeAction}`;
      const res: any = await api.post(endpoint, {
        remarks: actionRemarks,
      });

      if (res?.status === 'success') {
        setNotification(res.message || `Leave application ${activeAction}d successfully.`);
        setActiveAction(null);
        setTargetLeave(null);
        fetchLeaves(false, month);
        setTimeout(() => setNotification(null), 5000);
      }
    } catch (err: any) {
      alert(err.message || `Failed to ${activeAction} leave request.`);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const filteredLeaves = useMemo(() => {
    return leaves.filter((l) => {
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (staffTypeFilter !== 'all' && l.staff_type !== staffTypeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = l.staff_name.toLowerCase().includes(q);
        const matchDesig = (l.designation || '').toLowerCase().includes(q);
        const matchReason = (l.reason || '').toLowerCase().includes(q);
        const matchType = l.leave_type.toLowerCase().includes(q);
        return matchName || matchDesig || matchReason || matchType;
      }
      return true;
    });
  }, [leaves, statusFilter, staffTypeFilter, searchQuery]);

  const getLeaveTypeBadge = (type: string) => {
    switch (type) {
      case 'casual':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'sick':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'emergency':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'annual':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'maternity':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header & Institutional Branding */}
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

          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#0B462C] flex items-center justify-center font-black">
            <Calendar className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-gray-900 leading-tight">
                Staff Leave Applications & Approvals
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
                Faculty & Staff Affairs
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium">
              Official review desk for faculty leaves, automated roll-call off-day recording, and attendance locking.
            </p>
          </div>
        </div>

        {/* Month Filter & Refresh */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="w-48">
            <CustomMonthPicker
              value={month}
              onChange={(newMonth) => {
                setMonth(newMonth);
                fetchLeaves(true, newMonth);
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => fetchLeaves(true, month)}
            disabled={isLoading}
            className="p-2.5 rounded-2xl border border-gray-200 hover:bg-gray-100 text-gray-600 transition cursor-pointer"
            title="Refresh Leaves"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#0B462C]' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Pending Review
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900">{stats?.pending_count || 0}</div>
          <div className="text-[11px] font-bold text-amber-600">
            {(stats?.pending_count || 0) > 0 ? 'Requires Principal Decision' : 'All Clear'}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Active Leaves Today
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900">{stats?.active_leaves_today || 0} Staff</div>
          <div className="text-[11px] text-gray-500 font-medium">Roster Marked On-Leave</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Approved Leaves
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900">{stats?.approved_count || 0}</div>
          <div className="text-[11px] text-emerald-600 font-semibold">Attendance Locked</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Total Days Approved
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900">{stats?.total_approved_days || 0} Days</div>
          <div className="text-[11px] text-gray-500 font-medium">For {month}</div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>{notification}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setNotification(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Bar */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'All Applications' },
              { id: 'pending', label: 'Pending Review', count: stats?.pending_count },
              { id: 'approved', label: 'Approved', count: stats?.approved_count },
              { id: 'rejected', label: 'Rejected', count: stats?.rejected_count },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-[#0B462C] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    statusFilter === tab.id
                      ? 'bg-white/20 text-white'
                      : tab.id === 'pending'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-gray-200 text-gray-800'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search and Staff Category Filter */}
          <div className="flex items-center gap-2.5">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search staff, leave type or reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:border-[#0B462C] outline-hidden transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="w-48">
              <CustomDropdown
                options={[
                  { value: 'all', label: 'All Faculty & Staff' },
                  { value: 'teacher', label: 'Teaching Staff' },
                  { value: 'non_teaching', label: 'Non-Teaching Staff' },
                ]}
                value={staffTypeFilter}
                onChange={(val) => setStaffTypeFilter(val as any)}
                placeholder="Filter Staff"
              />
            </div>

            <button
              type="button"
              onClick={() => fetchLeaves(true, month)}
              className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 cursor-pointer"
              title="Refresh Records"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#0B462C]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Leave Requests Table */}
        <div className="bg-white rounded-3xl shadow-xs border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-800">
              <thead className="bg-gray-50 text-gray-600 font-bold uppercase tracking-wider text-[11px] border-b border-gray-200">
                <tr>
                  <th className="py-3.5 px-4">Staff Member & Role</th>
                  <th className="py-3.5 px-4">Leave Type</th>
                  <th className="py-3.5 px-4">Duration & Dates</th>
                  <th className="py-3.5 px-4">Reason & Justification</th>
                  <th className="py-3.5 px-4">Decision Status</th>
                  <th className="py-3.5 px-4">Review Details</th>
                  <th className="py-3.5 px-4 text-right">Principal Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-20 text-gray-500">
                      <RefreshCw className="w-7 h-7 animate-spin mx-auto mb-2 text-[#0B462C]" />
                      <span>Loading leave applications...</span>
                    </td>
                  </tr>
                ) : filteredLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-20 text-gray-500">
                      <Calendar className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                      <p className="font-bold text-gray-700">No leave applications found.</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {statusFilter !== 'all' || searchQuery
                          ? 'Try clearing active filters.'
                          : `No staff leave requests submitted for ${month}.`}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredLeaves.map((item) => {
                    const isPending = item.status === 'pending';
                    const isApproved = item.status === 'approved';
                    const isRejected = item.status === 'rejected';

                    return (
                      <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                        {/* Staff Details */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-bold text-gray-900 text-sm">{item.staff_name}</div>
                          <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1.5">
                            <span className="capitalize">{item.designation || (item.staff_type === 'teacher' ? 'Teaching Faculty' : 'Staff')}</span>
                            <span className="text-gray-300">•</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-gray-100 text-gray-600">
                              {item.staff_type === 'teacher' ? 'Teaching' : 'Non-Teaching'}
                            </span>
                          </div>
                        </td>

                        {/* Leave Type */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border capitalize ${getLeaveTypeBadge(item.leave_type)}`}>
                            {item.leave_type} Leave
                          </span>
                        </td>

                        {/* Dates & Duration */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-bold text-gray-900">
                            {formatDisplayDate(item.start_date)}
                            {item.start_date !== item.end_date && (
                              <span> – {formatDisplayDate(item.end_date)}</span>
                            )}
                          </div>
                          <div className="text-[11px] font-black text-emerald-800 mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-emerald-600" />
                            <span>{item.total_days} {item.total_days === 1 ? 'Day' : 'Days'}</span>
                          </div>
                        </td>

                        {/* Reason */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="text-xs text-gray-800 line-clamp-2" title={item.reason}>
                            {item.reason}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isPending && (
                            <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold flex items-center gap-1 w-max">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Pending Review</span>
                            </span>
                          )}
                          {isApproved && (
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1 w-max">
                              <Lock className="w-3 h-3 text-emerald-700" />
                              <span>Approved 🔒</span>
                            </span>
                          )}
                          {isRejected && (
                            <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold flex items-center gap-1 w-max">
                              <XCircle className="w-3 h-3 text-rose-700" />
                              <span>Declined</span>
                            </span>
                          )}
                        </td>

                        {/* Review Remarks / Timestamp */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {item.approved_by || item.approver_name ? (
                            <div>
                              <div className="text-xs font-bold text-gray-800">
                                {item.approver_name || 'Executive Principal'}
                              </div>
                              <div className="text-[10px] text-gray-500">
                                {item.approver_remarks || 'Decision recorded'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          {isPending && canApprove ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenActionModal(item, 'approve')}
                                className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1 transition shadow-xs cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenActionModal(item, 'reject')}
                                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Decline</span>
                              </button>
                            </div>
                          ) : isApproved ? (
                            <span className="text-[11px] font-bold text-emerald-800 flex items-center justify-end gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Locked on Roster</span>
                            </span>
                          ) : isRejected ? (
                            <span className="text-[11px] font-bold text-rose-700">
                              Application Declined
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">Read-Only</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      {/* Approve / Reject Decision Modal */}
      {activeAction && targetLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className={`p-6 text-white ${activeAction === 'approve' ? 'bg-[#0B462C]' : 'bg-rose-800'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {activeAction === 'approve' ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-300" />
                  ) : (
                    <XCircle className="w-6 h-6 text-rose-300" />
                  )}
                  <h3 className="text-lg font-black tracking-tight">
                    {activeAction === 'approve' ? 'Approve Leave Application' : 'Decline Leave Application'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveAction(null);
                    setTargetLeave(null);
                  }}
                  className="p-1 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-white/80 mt-1">
                {activeAction === 'approve'
                  ? 'Approving will lock the attendance roster as Official Leave for this period.'
                  : 'Specify feedback or reason for declining this leave request.'}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium">Applicant:</span>
                  <span className="font-bold text-gray-900">{targetLeave.staff_name}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium">Leave Type:</span>
                  <span className="font-bold text-gray-900 capitalize">{targetLeave.leave_type} Leave</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium">Dates:</span>
                  <span className="font-bold text-emerald-800">
                    {formatDisplayDate(targetLeave.start_date)} – {formatDisplayDate(targetLeave.end_date)} ({targetLeave.total_days} {targetLeave.total_days === 1 ? 'Day' : 'Days'})
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-200 text-xs">
                  <span className="text-gray-500 font-medium block mb-0.5">Stated Reason:</span>
                  <span className="text-gray-800 italic">{targetLeave.reason}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Principal Remarks / Administrative Note
                </label>
                <CustomTextInput
                  value={actionRemarks}
                  onChange={setActionRemarks}
                  placeholder="e.g. Approved by Executive Principal / Medical documents verified"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveAction(null);
                    setTargetLeave(null);
                  }}
                  disabled={isProcessingAction}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteAction}
                  disabled={isProcessingAction}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 ${
                    activeAction === 'approve'
                      ? 'bg-[#0B462C] hover:bg-[#062E1C]'
                      : 'bg-rose-700 hover:bg-rose-800'
                  }`}
                >
                  {isProcessingAction ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Recording...</span>
                    </>
                  ) : activeAction === 'approve' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirm Approval & Lock Attendance</span>
                    </>
                  ) : (
                    <>
                      <X className="w-3.5 h-3.5" />
                      <span>Confirm Decline</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
