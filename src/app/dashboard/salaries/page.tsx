'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  DollarSign, 
  Printer, 
  RefreshCw, 
  Search, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  UserCheck, 
  Users, 
  UserX, 
  Sparkles, 
  Gift, 
  FileSpreadsheet, 
  Wallet, 
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit2,
  FileText,
  CreditCard,
  Banknote,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { api, getStoredUser, User as UserType, PayrollItem } from '@/lib/api';
import CustomMonthPicker from '@/components/CustomMonthPicker';
import CustomTextInput from '@/components/CustomTextInput';

export default function SalariesDeskPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  
  const isAccountant = 
    currentUser?.role === 'accountant' || 
    currentUser?.role === 'hr_accountant' || 
    currentUser?.role === 'super_admin' || 
    currentUser?.role === 'director' || 
    currentUser?.role === 'chairman';

  const isTeacher = currentUser?.role === 'teacher';
  
  const [payrollMonth, setPayrollMonth] = useState<string>(
    new Date().toISOString().substring(0, 7) // e.g. "2026-09"
  );
  
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'teaching' | 'non_teaching'>('all');
  const [payrollSearch, setPayrollSearch] = useState<string>('');
  
  const [payrolls, setPayrolls] = useState<PayrollItem[]>([]);
  const [isLoadingPayroll, setIsLoadingPayroll] = useState<boolean>(true);
  const [isMarkingAllPaid, setIsMarkingAllPaid] = useState<boolean>(false);
  const [togglingPayrollId, setTogglingPayrollId] = useState<number | null>(null);

  // Edit Single Payroll Modal
  const [editingPayroll, setEditingPayroll] = useState<PayrollItem | null>(null);
  const [editBaseSalary, setEditBaseSalary] = useState<string>('');
  const [editAllowedLeaves, setEditAllowedLeaves] = useState<string>('');
  const [editLeaveDays, setEditLeaveDays] = useState<string>('');
  const [editAbsentDays, setEditAbsentDays] = useState<string>('');
  const [editAbsentDeduction, setEditAbsentDeduction] = useState<string>('');
  const [editAdvanceDeduction, setEditAdvanceDeduction] = useState<string>('');
  const [editPaymentMethod, setEditPaymentMethod] = useState<'cash' | 'bank'>('bank');
  const [editBankName, setEditBankName] = useState<string>('');
  const [editAccountTitle, setEditAccountTitle] = useState<string>('');
  const [editAccountNumber, setEditAccountNumber] = useState<string>('');
  const [editStatus, setEditStatus] = useState<'generated' | 'paid'>('generated');
  const [editRemarks, setEditRemarks] = useState<string>('');
  const [isSavingPayroll, setIsSavingPayroll] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Feedback Notification
  const [notification, setNotification] = useState<string | null>(null);

  const fetchPayroll = async (silent = false, monthToFetch = payrollMonth) => {
    if (!silent) setIsLoadingPayroll(true);
    try {
      const res: any = await api.get(`/payroll?month=${encodeURIComponent(monthToFetch)}&type=${categoryFilter}`);
      if (res?.payrolls) {
        setPayrolls(res.payrolls);
      }
    } catch (err: any) {
      console.error('Failed to load salaries:', err);
    } finally {
      if (!silent) setIsLoadingPayroll(false);
    }
  };

  useEffect(() => {
    setCurrentUser(getStoredUser());
    fetchPayroll(false, payrollMonth);
  }, [payrollMonth, categoryFilter]);

  // Payroll Statistics
  const payrollStats = useMemo(() => {
    let gross = 0;
    let absentDed = 0;
    let advanceDed = 0;
    let net = 0;
    let paidCount = 0;
    let unpaidCount = 0;

    payrolls.forEach((p) => {
      gross += Number(p.gross_salary || 0);
      absentDed += Number(p.absent_deduction || 0);
      advanceDed += Number(p.advance_deduction || 0);
      net += Number(p.net_salary || 0);

      if (p.status === 'paid') {
        paidCount++;
      } else {
        unpaidCount++;
      }
    });

    return {
      total_gross: gross,
      total_absent_deduction: absentDed,
      total_advance_deduction: advanceDed,
      total_net: net,
      paid_count: paidCount,
      unpaid_count: unpaidCount,
      total_records: payrolls.length,
    };
  }, [payrolls]);

  const filteredPayrolls = useMemo(() => {
    return payrolls.filter((p) => {
      const query = payrollSearch.toLowerCase().trim();
      if (!query) return true;
      return (
        p.staff_name.toLowerCase().includes(query) ||
        p.designation.toLowerCase().includes(query) ||
        (p.bank_name && p.bank_name.toLowerCase().includes(query)) ||
        (p.account_number && p.account_number.toLowerCase().includes(query))
      );
    });
  }, [payrolls, payrollSearch]);

  const handleTogglePaidStatus = async (payroll: PayrollItem) => {
    setTogglingPayrollId(payroll.id);
    try {
      const res: any = await api.post(`/payroll/${payroll.id}/pay`);
      if (res?.payroll) {
        setPayrolls((prev) =>
          prev.map((item) => (item.id === payroll.id ? res.payroll : item))
        );
        setNotification(`Updated ${payroll.staff_name} remuneration status to ${res.payroll.status.toUpperCase()}.`);
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to toggle status.');
    } finally {
      setTogglingPayrollId(null);
    }
  };

  const handleMarkAllPayrollPaid = async () => {
    if (!window.confirm(`Are you sure you want to mark all ${payrollStats.unpaid_count} pending salaries for ${payrollMonth} as PAID? This will record disbursements in institutional accounts.`)) {
      return;
    }

    setIsMarkingAllPaid(true);
    try {
      await api.post('/payroll/batch-pay', { month: payrollMonth });
      setNotification(`All payroll entries for ${payrollMonth} marked as paid successfully.`);
      fetchPayroll(true, payrollMonth);
      setTimeout(() => setNotification(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to mark all paid.');
    } finally {
      setIsMarkingAllPaid(false);
    }
  };

  const openEditModal = (p: PayrollItem) => {
    setEditingPayroll(p);
    setEditBaseSalary(String(p.base_salary || ''));
    setEditAllowedLeaves(String(p.allowed_leaves ?? 2));
    setEditLeaveDays(String(p.leave_days ?? 0));
    setEditAbsentDays(String(p.absent_days ?? 0));
    setEditAbsentDeduction(String(p.absent_deduction ?? 0));
    setEditAdvanceDeduction(String(p.advance_deduction ?? 0));
    setEditPaymentMethod((p.payment_method as any) || 'bank');
    setEditBankName(p.bank_name || '');
    setEditAccountTitle(p.account_title || '');
    setEditAccountNumber(p.account_number || '');
    setEditStatus((p.status as any) || 'generated');
    setEditRemarks(p.remarks || '');
    setEditError(null);
  };

  const handleSaveEditPayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayroll) return;

    setIsSavingPayroll(true);
    setEditError(null);

    try {
      const payload: any = {
        base_salary: Number(editBaseSalary) || 0,
        allowed_leaves: Number(editAllowedLeaves) || 0,
        leave_days: Number(editLeaveDays) || 0,
        absent_days: Number(editAbsentDays) || 0,
        absent_deduction: Number(editAbsentDeduction) || 0,
        advance_deduction: Number(editAdvanceDeduction) || 0,
        payment_method: editPaymentMethod,
        bank_name: editBankName,
        account_title: editAccountTitle,
        account_number: editAccountNumber,
        status: editStatus,
        remarks: editRemarks,
      };

      const res: any = await api.put(`/payroll/${editingPayroll.id}`, payload);
      if (res?.payroll) {
        setPayrolls((prev) =>
          prev.map((item) => (item.id === editingPayroll.id ? res.payroll : item))
        );
        setEditingPayroll(null);
        setNotification(`Payroll for ${res.payroll.staff_name} updated successfully.`);
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (err: any) {
      setEditError(err.message || 'Failed to update payroll.');
    } finally {
      setIsSavingPayroll(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* ================= TOP TITLE & ACTION HEADER ================= */}
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
            <DollarSign className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-gray-900 leading-tight">
                {isTeacher ? 'My Salary & Payslip Desk' : 'Staff Salaries & Monthly Payroll Desk'}
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-[#0B462C] border border-emerald-200 uppercase">
                {isTeacher ? 'Faculty Portal' : 'Accounts Desk'}
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium">
              {isTeacher
                ? 'Official monthly remuneration breakdown, deductions, and verified salary slips'
                : 'Monthly compensation computation, advance salary deductions, bank advice, and payslips'}
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {!isTeacher && (
            <>
              <button
                type="button"
                onClick={() => window.open('/payroll/bonuses', '_blank')}
                className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                title="View Executive Bonus & Incentive Ledger"
              >
                <Gift className="w-3.5 h-3.5 text-amber-700" />
                <span>Bonus Report</span>
              </button>

              <button
                type="button"
                onClick={() => window.open(`/payroll/bank-advice?month=${payrollMonth}`, '_blank')}
                className="px-3.5 py-2 rounded-xl bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                title="Print Bank Salary Transfer Advice"
              >
                <Building2 className="w-3.5 h-3.5 text-blue-300" />
                <span>Bank Advice (A4)</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => {
              if (isTeacher && payrolls.length > 0) {
                window.open(`/payroll/payslip?id=${payrolls[0].id}`, '_blank');
              } else {
                window.open(`/payroll/payslip?month=${payrollMonth}&type=${categoryFilter}`, '_blank');
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-[#0B462C] hover:bg-[#062E1C] text-[#E8D4A2] font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            title={isTeacher ? "Print My Salary Slip" : "Print Monthly Payslips"}
          >
            <Printer className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>{isTeacher ? 'Print My Salary Slip (A4)' : 'Print All Payslips (A4)'}</span>
          </button>
        </div>
      </div>

      {/* Global Notification Banner */}
      {notification && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-5 py-3.5 rounded-2xl flex items-center gap-2.5 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-xs sm:text-sm font-bold">{notification}</span>
        </div>
      )}

      {/* ================= KPI STATS CARDS ================= */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Gross Remuneration</span>
          <div className="text-xl font-black text-gray-900 font-mono">
            PKR {payrollStats.total_gross.toLocaleString()}
          </div>
          <span className="text-[10px] text-gray-500 font-medium">Base + Allowances + Bonuses</span>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Total Deductions</span>
          <div className="text-xl font-black text-amber-900 font-mono">
            -PKR {(payrollStats.total_absent_deduction + payrollStats.total_advance_deduction).toLocaleString()}
          </div>
          <span className="text-[10px] text-amber-700 font-medium">
            Adv: PKR {payrollStats.total_advance_deduction.toLocaleString()} • Abs: PKR {payrollStats.total_absent_deduction.toLocaleString()}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Net Remuneration Payout</span>
          <div className="text-xl font-black text-emerald-900 font-mono">
            PKR {payrollStats.total_net.toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-700 font-medium">Total payable for {payrollMonth}</span>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">
            {isTeacher ? 'Disbursement State' : 'Disbursement Status'}
          </span>
          <div className="text-xl font-black text-blue-900 font-mono">
            {isTeacher ? (
              payrolls.length > 0 && payrolls[0].status === 'paid' ? (
                <span className="text-emerald-700">Disbursed ✓</span>
              ) : (
                <span className="text-amber-800">Pending</span>
              )
            ) : (
              `${payrollStats.paid_count} / ${payrollStats.total_records}`
            )}
          </div>
          <span className="text-[10px] text-blue-700 font-medium">
            {isTeacher
              ? payrolls.length > 0 && payrolls[0].paid_at ? `Paid on ${new Date(payrolls[0].paid_at).toLocaleDateString()}` : 'Scheduled for monthly payout'
              : (payrollStats.unpaid_count === 0 ? 'All Salaries Paid ✓' : `${payrollStats.unpaid_count} Pending Payment`)}
          </span>
        </div>
      </div>

      {/* ================= CONTROLS: MONTH PICKER & CATEGORY FILTER ================= */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Custom Month Picker */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-700 whitespace-nowrap">Payroll Period:</span>
            <div className="w-52">
              <CustomMonthPicker
                value={payrollMonth}
                onChange={(newMonth) => {
                  if (newMonth) setPayrollMonth(newMonth);
                }}
                placeholder="Select Month"
                allowClear={false}
                align="left"
              />
            </div>

            <button
              type="button"
              onClick={() => fetchPayroll()}
              disabled={isLoadingPayroll}
              className="p-2 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-600 transition cursor-pointer"
              title="Recalculate Payroll"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingPayroll ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Quick Batch Actions (Accountants Only) */}
          {isAccountant && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleMarkAllPayrollPaid}
                disabled={isMarkingAllPaid || payrollStats.unpaid_count === 0}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark All as Paid</span>
              </button>
            </div>
          )}

        </div>

        {/* Filter & Search Bar */}
        {!isTeacher && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-100 border border-gray-200/60 w-fit">
              <button
                type="button"
                onClick={() => setCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  categoryFilter === 'all'
                    ? 'bg-white text-gray-900 shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                All Staff ({payrolls.length})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('teaching')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  categoryFilter === 'teaching'
                    ? 'bg-white text-[#0B462C] shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Teaching Faculty
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('non_teaching')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  categoryFilter === 'non_teaching'
                    ? 'bg-white text-amber-800 shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Non-Teaching & Admin
              </button>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search staff, designation, bank..."
                value={payrollSearch}
                onChange={(e) => setPayrollSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#0B462C] focus:outline-none transition"
              />
            </div>
          </div>
        )}
      </div>

      {/* ================= SALARIES TABLE ================= */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-black text-gray-900">
            {isTeacher ? `My Salary Statement • ${payrollMonth}` : `Institutional Salary Sheet • ${payrollMonth}`}
          </h3>
          <span className="text-xs font-bold text-gray-500">
            {filteredPayrolls.length} {filteredPayrolls.length === 1 ? 'Salary Statement' : 'Salaries Computed'}
          </span>
        </div>

        {isLoadingPayroll ? (
          <div className="p-16 text-center text-gray-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-[#0B462C]" />
            <p className="text-sm font-semibold">Computing staff salaries & deductions...</p>
          </div>
        ) : filteredPayrolls.length === 0 ? (
          <div className="p-16 text-center space-y-3 bg-gray-50/50">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
              <DollarSign className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-gray-800">No Salaries Found</div>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              No staff records match your selected filters for {payrollMonth}.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50/80 text-gray-500 font-bold uppercase text-[10px] tracking-wider border-b border-gray-200">
                  <th className="p-3.5">Staff Member</th>
                  <th className="p-3.5">Attendance</th>
                  <th className="p-3.5 text-right">Base Salary</th>
                  <th className="p-3.5 text-right">Gross Pay</th>
                  <th className="p-3.5 text-right">Deductions</th>
                  <th className="p-3.5 text-right">Net Payable</th>
                  <th className="p-3.5">Payment Method</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredPayrolls.map((p) => {
                  const totalDeductions = Math.max(0, Math.round(Number(p.gross_salary || 0) - Number(p.net_salary || 0)));

                  return (
                    <tr key={p.id} className="hover:bg-gray-50/80 transition">
                      
                      {/* Staff Identity */}
                      <td className="p-3.5">
                        <div className="font-black text-gray-900 leading-tight">{p.staff_name}</div>
                        <div className="text-[11px] text-gray-500">{p.designation}</div>
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-md ${
                          p.staff_type === 'teacher' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {p.staff_type === 'teacher' ? 'Faculty' : 'Staff'}
                        </span>
                      </td>

                      {/* Attendance */}
                      <td className="p-3.5 text-[11px] text-gray-600 whitespace-nowrap">
                        <span className="font-bold text-gray-800">{p.total_working_days}d</span>
                        <span className="text-gray-400 mx-1">•</span>
                        <span className="text-emerald-700 font-semibold">{p.present_days}P</span>
                        <span className="text-gray-400 mx-1">•</span>
                        <span className="text-rose-700 font-semibold">{p.absent_days}A</span>
                        <span className="text-gray-400 mx-1">•</span>
                        <span className="text-blue-700 font-semibold">{p.leave_days || 0}Lv</span>
                      </td>

                      {/* Base Salary */}
                      <td className="p-3.5 text-right font-mono text-gray-700 whitespace-nowrap">
                        PKR {Number(p.base_salary).toLocaleString()}
                      </td>

                      {/* Gross Pay */}
                      <td className="p-3.5 text-right font-mono font-bold text-gray-900 whitespace-nowrap">
                        PKR {Number(p.gross_salary).toLocaleString()}
                      </td>

                      {/* Deductions */}
                      <td className="p-3.5 text-right font-mono text-rose-700 whitespace-nowrap">
                        {totalDeductions > 0 ? (
                          <div>
                            <span className="font-bold">-PKR {totalDeductions.toLocaleString()}</span>
                            {Number(p.advance_deduction) > 0 && (
                              <div className="text-[9px] text-amber-700 font-bold">Adv: -PKR {Number(p.advance_deduction).toLocaleString()}</div>
                            )}
                            {Number(p.absent_deduction) > 0 && (
                              <div className="text-[9px] text-gray-400">Abs: -PKR {Number(p.absent_deduction).toLocaleString()}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      {/* Net Payable */}
                      <td className="p-3.5 text-right font-mono font-black text-emerald-800 text-sm whitespace-nowrap">
                        PKR {Number(p.net_salary).toLocaleString()}
                      </td>

                      {/* Payment Method */}
                      <td className="p-3.5 text-[11px] whitespace-nowrap">
                        {p.payment_method === 'bank' ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 font-bold text-blue-900">
                              <Building2 className="w-3 h-3 text-blue-700" />
                              <span>{p.bank_name || 'Bank Transfer'}</span>
                            </span>
                            {p.account_number && (
                              <div className="text-[10px] text-gray-500 font-mono">{p.account_number}</div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-amber-900">
                            <Banknote className="w-3 h-3 text-amber-700" />
                            <span>Cash Counter</span>
                          </span>
                        )}
                      </td>

                      {/* Status & Toggle (Pay Button for Accountant Only) */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        {isAccountant ? (
                          <button
                            type="button"
                            onClick={() => handleTogglePaidStatus(p)}
                            disabled={togglingPayrollId === p.id}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black transition cursor-pointer shadow-2xs ${
                              p.status === 'paid'
                                ? 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200 border border-emerald-300'
                                : 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
                            }`}
                          >
                            {togglingPayrollId === p.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : p.status === 'paid' ? (
                              <>
                                <CheckCircle className="w-3 h-3 text-emerald-700" />
                                <span>Paid ✓</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 text-amber-700" />
                                <span>Unpaid</span>
                              </>
                            )}
                          </button>
                        ) : (
                          p.status === 'paid' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                              <CheckCircle className="w-3 h-3 text-emerald-700" />
                              <span>Paid ✓</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              <Clock className="w-3 h-3 text-amber-700" />
                              <span>Unpaid</span>
                            </span>
                          )
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {!isTeacher && (
                            <button
                              type="button"
                              onClick={() => openEditModal(p)}
                              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700 transition cursor-pointer"
                              title="Edit Remuneration / Deductions"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-gray-600" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => window.open(`/payroll/payslip?id=${p.id}`, '_blank')}
                            className="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-[#0B462C] hover:text-[#E8D4A2] text-[#0B462C] border border-emerald-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                            title="View Official Salary Slip"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Salary Slip</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => window.open(`/teachers/ledger?id=${p.staff_id}&type=${p.staff_type}`, '_blank')}
                            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700 transition cursor-pointer"
                            title="View Full Financial Ledger"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                          </button>
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

      {/* ================= EDIT PAYROLL MODAL ================= */}
      {editingPayroll && (
        <div 
          onClick={() => setEditingPayroll(null)}
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-gray-100 relative space-y-5 animate-in fade-in zoom-in duration-150"
          >
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#0B462C] flex items-center justify-center font-black">
                <Edit2 className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900">
                  Edit Staff Remuneration & Deductions
                </h3>
                <p className="text-xs text-gray-500">
                  {editingPayroll.staff_name} • {editingPayroll.month}
                </p>
              </div>
            </div>

            {editError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditPayroll} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Base Salary (PKR)</label>
                  <CustomTextInput
                    value={editBaseSalary}
                    onChange={setEditBaseSalary}
                    type="number"
                    placeholder="Base salary"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Advance Deduction (PKR)</label>
                  <CustomTextInput
                    value={editAdvanceDeduction}
                    onChange={setEditAdvanceDeduction}
                    type="number"
                    placeholder="Advance deduction"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">Allowed Leaves</label>
                  <CustomTextInput
                    value={editAllowedLeaves}
                    onChange={setEditAllowedLeaves}
                    type="number"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">Taken Leaves</label>
                  <CustomTextInput
                    value={editLeaveDays}
                    onChange={setEditLeaveDays}
                    type="number"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">Absent Days</label>
                  <CustomTextInput
                    value={editAbsentDays}
                    onChange={setEditAbsentDays}
                    type="number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Payment Method</label>
                  <select
                    value={editPaymentMethod}
                    onChange={(e: any) => setEditPaymentMethod(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:border-[#0B462C] outline-hidden transition"
                  >
                    <option value="bank">Bank Transfer</option>
                    <option value="cash">Cash Counter</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Disbursement Status</label>
                  {isAccountant ? (
                    <select
                      value={editStatus}
                      onChange={(e: any) => setEditStatus(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:border-[#0B462C] outline-hidden transition"
                    >
                      <option value="generated">Unpaid (Generated)</option>
                      <option value="paid">Paid ✓</option>
                    </select>
                  ) : (
                    <div className="px-3.5 py-2.5 rounded-2xl bg-gray-100 border border-gray-200 text-xs font-bold text-gray-700 flex items-center justify-between">
                      <span>{editStatus === 'paid' ? 'Paid ✓' : 'Unpaid (Generated)'}</span>
                      <span className="text-[10px] text-gray-400 font-normal">Accountant Only</span>
                    </div>
                  )}
                </div>
              </div>

              {editPaymentMethod === 'bank' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-gray-100">
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Bank Name</label>
                    <CustomTextInput
                      value={editBankName}
                      onChange={setEditBankName}
                      placeholder="e.g. HBL / Meezan"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Account Title</label>
                    <CustomTextInput
                      value={editAccountTitle}
                      onChange={setEditAccountTitle}
                      placeholder="Title on bank"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Account / IBAN</label>
                    <CustomTextInput
                      value={editAccountNumber}
                      onChange={setEditAccountNumber}
                      placeholder="Account number"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Remarks / Note</label>
                <CustomTextInput
                  value={editRemarks}
                  onChange={setEditRemarks}
                  placeholder="Optional remuneration adjustment note"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingPayroll(null)}
                  disabled={isSavingPayroll}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPayroll}
                  className="px-5 py-2.5 rounded-xl bg-[#0B462C] hover:bg-[#062E1C] text-[#E8D4A2] font-black text-xs shadow-sm transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isSavingPayroll && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
