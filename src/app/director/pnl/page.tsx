'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, getStoredUser, User } from '@/lib/api';
import CustomMonthPicker from '@/components/CustomMonthPicker';
import CustomDatePicker from '@/components/CustomDatePicker';
import CustomTextInput from '@/components/CustomTextInput';
import { 
  Building2, 
  TrendingUp, 
  Receipt, 
  Wallet, 
  RefreshCw, 
  ChevronLeft, 
  Download, 
  Users, 
  ArrowRight,
  Sparkles,
  PieChart,
  Landmark,
  FileSpreadsheet,
  Coins,
  CheckCircle2,
  ShieldCheck,
  LayoutGrid,
  Table as TableIcon,
  ArrowUpRight,
  Clock,
  Lock,
  AlertCircle,
  Calendar,
  X,
  Check
} from 'lucide-react';

interface PnlDirector {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  cnic?: string;
  net_capital: number;
  share_percentage: number;
  profit_share: number;
  bank_name?: string;
  bank_account_no?: string;
}

interface PnlSummary {
  total_govt_income: number;
  total_general_expenses: number;
  remaining_amount: number;
  remaining_profit: number;
  net_margin_percentage: number;
  is_distributed?: boolean;
  distribution?: {
    id: number;
    period_month: string;
    total_profit_pool: number;
    distributed_at: string;
    distributed_by_name?: string;
    notes?: string;
  } | null;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const getCurrentMonthString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const formatMonthTitle = (monthStr: string) => {
  if (!monthStr) return 'All Time';
  const parts = monthStr.split('-');
  if (parts.length === 2) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    if (!isNaN(y) && m >= 0 && m < 12) {
      return `${MONTH_NAMES[m]} ${y}`;
    }
  }
  return monthStr;
};

export default function PnlReportPage() {
  const [user, setUser] = useState<User | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthString());
  const [summary, setSummary] = useState<PnlSummary | null>(null);
  const [directors, setDirectors] = useState<PnlDirector[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Disbursement Modal States
  const [isDisburseModalOpen, setIsDisburseModalOpen] = useState<boolean>(false);
  const [disburseDate, setDisburseDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [disburseNotes, setDisburseNotes] = useState<string>('');
  const [isDisbursing, setIsDisbursing] = useState<boolean>(false);
  const [disburseError, setDisburseError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const currentMonthStr = getCurrentMonthString();
  const isCurrentMonth = selectedMonth === currentMonthStr;
  const isFutureMonth = Boolean(selectedMonth && selectedMonth > currentMonthStr);
  const isEndedPrevMonth = Boolean(selectedMonth && selectedMonth < currentMonthStr);
  const isDistributed = Boolean(summary?.is_distributed);
  const distributableAmount = summary?.remaining_amount ? Math.max(0, Number(summary.remaining_amount)) : 0;
  const canDisburse = isEndedPrevMonth && !isDistributed && distributableAmount > 0 && directors.length > 0;

  const fetchPnlData = async () => {
    setIsLoading(true);
    try {
      const url = selectedMonth 
        ? `/directors/pnl-report?month=${selectedMonth}` 
        : `/directors/pnl-report`;
      const res: any = await api.get(url);
      setSummary(res?.summary || null);
      setDirectors(res?.directors || []);
    } catch (err) {
      console.error('Failed to fetch P&L data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  useEffect(() => {
    fetchPnlData();
  }, [selectedMonth]);

  useEffect(() => {
    if (selectedMonth) {
      setDisburseNotes(`Monthly profit distribution for ${formatMonthTitle(selectedMonth)}`);
    }
  }, [selectedMonth]);

  const handleOpenDisburseModal = () => {
    setDisburseError('');
    setDisburseDate(new Date().toISOString().slice(0, 10));
    setDisburseNotes(`Monthly profit distribution for ${formatMonthTitle(selectedMonth)}`);
    setIsDisburseModalOpen(true);
  };

  const handleExecuteDisbursement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canDisburse || !selectedMonth) return;

    setIsDisbursing(true);
    setDisburseError('');

    try {
      const payload = {
        period_month: selectedMonth,
        total_profit_pool: distributableAmount,
        date: disburseDate || new Date().toISOString().slice(0, 10),
        notes: disburseNotes || `Monthly profit distribution for ${formatMonthTitle(selectedMonth)}`,
      };

      const res: any = await api.post('/directors/distribute-profit', payload);
      setSuccessMessage(res?.message || `Successfully disbursed profit for ${formatMonthTitle(selectedMonth)}.`);
      setIsDisburseModalOpen(false);
      await fetchPnlData();
      setTimeout(() => setSuccessMessage(''), 6000);
    } catch (err: any) {
      console.error('Profit disbursement failed', err);
      setDisburseError(err?.response?.data?.message || err?.message || 'Failed to execute profit disbursement.');
    } finally {
      setIsDisbursing(false);
    }
  };

  const totalNetCapital = directors.reduce((sum, d) => sum + Number(d.net_capital || 0), 0);
  const totalAllocatedProfit = directors.reduce((sum, d) => sum + Number(d.profit_share || 0), 0);

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* ================= 🧭 TOP HEADER BAR ================= */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold mb-1">
            <Link href="/director" className="hover:text-purple-800 transition flex items-center gap-1">
              <ChevronLeft className="w-3.5 h-3.5" />
              Partners Cockpit
            </Link>
            <span>•</span>
            <span className="text-gray-900 font-bold">Profit & Loss (P & L)</span>
          </div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2.5">
            <span className="text-2xl">📊</span>
            Institutional Profit & Loss (P & L) Report
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Government Revenue Inflows vs General Operational Expenditure and Partner Surplus Allocations
          </p>
        </div>

        {/* Month Selector & Controls */}
        <div className="flex items-center gap-2.5">
          <div className="w-52">
            <CustomMonthPicker
              value={selectedMonth}
              onChange={setSelectedMonth}
              placeholder="All Time History"
            />
          </div>
          <button
            onClick={fetchPnlData}
            className="p-2.5 rounded-xl bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 shadow-xs transition-all cursor-pointer"
            title="Refresh Report"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#0B462C]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Global Toast / Success Message */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-5 py-3.5 rounded-2xl flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs sm:text-sm font-bold">{successMessage}</span>
          </div>
          <button 
            onClick={() => setSuccessMessage('')}
            className="p-1 text-emerald-700 hover:text-emerald-900 rounded-lg hover:bg-emerald-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ================= 📊 TOP 3 EXECUTIVE METRIC CARDS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Total Received from Govt */}
        <div className="bg-white border border-gray-200/90 rounded-3xl p-6 sm:p-7 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Total Received From Govt
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-base">
                🏛️
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black font-mono text-gray-900">
                Rs. {summary ? Number(summary.total_govt_income).toLocaleString('en-PK') : '0'}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 font-medium mt-3 pt-2 border-t border-gray-100">
            {selectedMonth ? `Total govt grants received in ${formatMonthTitle(selectedMonth)}` : 'Total institutional revenue to date'}
          </p>
        </div>

        {/* Card 2: Total General Expenses */}
        <div className="bg-white border border-gray-200/90 rounded-3xl p-6 sm:p-7 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Total General Expenses
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-base">
                📑
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black font-mono text-amber-700">
                Rs. {summary ? Number(summary.total_general_expenses).toLocaleString('en-PK') : '0'}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 font-medium mt-3 pt-2 border-t border-gray-100">
            {selectedMonth ? `Operational expenses in ${formatMonthTitle(selectedMonth)}` : 'Total operational expenditure'}
          </p>
        </div>

        {/* Card 3: Remaining Profit / Surplus */}
        <div className="bg-[#0B462C] text-white border border-[#0B462C] rounded-3xl p-6 sm:p-7 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider">
                Remaining Amount (Profit)
              </span>
              <div className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center font-bold text-base">
                💰
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black font-mono text-white">
                Rs. {summary ? Number(summary.remaining_amount).toLocaleString('en-PK') : '0'}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-emerald-200/90 font-medium mt-3 pt-2 border-t border-white/10">
            Govt Income - General Expenses ({summary ? summary.net_margin_percentage : '0'}% margin)
          </p>
        </div>
      </div>

      {/* ================= 👥 PARTNER PROFIT ALLOCATION BREAKDOWN ================= */}
      <div className="bg-white border border-gray-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-700" />
              Directors & Partners Profit Allocation
            </h2>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Calculated proportional profit share based on each partner's active capital percentage
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* View Switcher */}
            <div className="flex items-center bg-gray-100 p-1.5 rounded-xl border border-gray-200 text-xs font-bold">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'cards' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Cards
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'table' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                Table
              </button>
            </div>

            <div className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-purple-50 text-purple-800 border border-purple-200">
              {directors.length} Active Partners
            </div>
          </div>
        </div>

        {/* Directors Content */}
        {directors.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="text-xs font-semibold">No active directors found in master records.</p>
          </div>
        ) : viewMode === 'cards' ? (
          /* ================= 🃏 PREMIUM CARDS VIEW ================= */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
            {directors.map((director) => (
              <div 
                key={director.id}
                className="bg-white hover:bg-gray-50/40 border border-gray-200/90 rounded-3xl p-6 sm:p-7 transition-all shadow-xs hover:shadow-md space-y-5 relative group"
              >
                {/* Header: Avatar, Name, Share */}
                <div className="flex items-start justify-between gap-3 pb-1">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-700 to-indigo-800 text-white flex items-center justify-center font-black text-lg shadow-sm shrink-0">
                      {director.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-base font-black text-gray-900 group-hover:text-purple-900 transition-colors">
                        {director.name}
                      </h3>
                      <div className="text-xs text-gray-500 font-medium flex items-center gap-2 mt-1">
                        {director.cnic ? <span>CNIC: {director.cnic}</span> : <span>Partner ID: #{director.id}</span>}
                        {director.phone && <span>• {director.phone}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Share % Badge */}
                  <span className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-purple-100/90 text-purple-900 border border-purple-200/80 shadow-2xs">
                    {Number(director.share_percentage).toFixed(2)}% Share
                  </span>
                </div>

                {/* Progress bar visual for ratio */}
                <div className="space-y-1.5 py-1">
                  <div className="flex justify-between text-[11px] font-bold text-gray-400">
                    <span>Equity Ownership Ratio</span>
                    <span className="text-purple-700 font-extrabold">{Number(director.share_percentage).toFixed(2)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden border border-gray-200/60 p-0.5">
                    <div 
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 h-1.5 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, Math.max(0, director.share_percentage))}%` }}
                    />
                  </div>
                </div>

                {/* 2 Distinct Metric Tiles */}
                <div className="grid grid-cols-2 gap-4 pt-1">
                  {/* Left: Net Capital */}
                  <div className="bg-gray-50/90 border border-gray-200/80 rounded-2xl p-4 sm:p-5">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                      Net Capital Holding
                    </span>
                    <span className="text-base sm:text-lg font-black font-mono text-gray-900 block mt-1.5">
                      Rs. {Number(director.net_capital).toLocaleString('en-PK')}
                    </span>
                  </div>

                  {/* Right: Profit Share */}
                  <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-4 sm:p-5">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                      Allocated Profit Share
                    </span>
                    <span className="text-base sm:text-lg font-black font-mono text-emerald-700 block mt-1.5">
                      + Rs. {Number(director.profit_share).toLocaleString('en-PK')}
                    </span>
                  </div>
                </div>

                {/* Bottom Action Link */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-medium">Partner Capital Statement</span>
                  <Link 
                    href={`/director/${director.id}?month=${selectedMonth}`}
                    className="inline-flex items-center gap-1.5 font-bold text-purple-700 hover:text-purple-900 transition-colors py-1 px-2.5 rounded-lg hover:bg-purple-50"
                  >
                    View Passbook
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ================= 📋 INSTITUTIONAL AUDIT TABLE VIEW ================= */
          <div className="overflow-x-auto rounded-2xl border border-gray-200/90">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50/90 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Partner Name</th>
                  <th className="py-3.5 px-4">CNIC / Contact</th>
                  <th className="py-3.5 px-4 text-right">Net Capital (PKR)</th>
                  <th className="py-3.5 px-4 text-right">Equity Share (%)</th>
                  <th className="py-3.5 px-4 text-right">Allocated Profit (PKR)</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {directors.map((director) => (
                  <tr key={director.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-gray-900 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-black text-xs">
                        {director.name.charAt(0)}
                      </div>
                      <span>{director.name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 font-medium">
                      {director.cnic || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black font-mono text-gray-900">
                      Rs. {Number(director.net_capital).toLocaleString('en-PK')}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-black bg-purple-50 text-purple-800 border border-purple-200">
                        {Number(director.share_percentage).toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black font-mono text-emerald-700 text-sm">
                      + Rs. {Number(director.profit_share).toLocaleString('en-PK')}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Link 
                        href={`/director/${director.id}?month=${selectedMonth}`}
                        className="p-1.5 rounded-lg bg-gray-100 hover:bg-purple-100 text-gray-700 hover:text-purple-900 font-bold inline-flex items-center gap-1 transition-colors"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        Passbook
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50/90 border-t-2 border-gray-200 font-black text-gray-900 text-xs">
                  <td colSpan={2} className="py-3.5 px-4 uppercase tracking-wider text-[11px]">
                    Total Allocated Reconciliation
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono">
                    Rs. {totalNetCapital.toLocaleString('en-PK')}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    100.00%
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-emerald-700 text-sm">
                    + Rs. {totalAllocatedProfit.toLocaleString('en-PK')}
                  </td>
                  <td className="py-3.5 px-4 text-center text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 mx-auto" />
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* ================= ⚡ PROFIT DISBURSEMENT ACTION BUTTON ================= */}
      <div className="flex items-center justify-end pt-2 pb-2">
        {canDisburse ? (
          <button
            type="button"
            onClick={handleOpenDisburseModal}
            className="px-6 py-3 rounded-2xl bg-[#0B462C] hover:bg-[#083622] text-white font-black text-xs sm:text-sm shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#E8D4A2]" />
            <span>Disburse {formatMonthTitle(selectedMonth)} Profit (Rs. {distributableAmount.toLocaleString('en-PK')})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : isDistributed ? (
          <div className="px-5 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Profit for {formatMonthTitle(selectedMonth)} Already Disbursed (Rs. {Number(summary?.distribution?.total_profit_pool || distributableAmount).toLocaleString('en-PK')})</span>
          </div>
        ) : (
          <button
            type="button"
            disabled
            className="px-6 py-3 rounded-2xl bg-gray-100 border border-gray-200 text-gray-400 font-bold text-xs sm:text-sm flex items-center gap-2 cursor-not-allowed opacity-80"
          >
            <Clock className="w-4 h-4 text-gray-400" />
            <span>
              {isCurrentMonth
                ? `Disbursement Unlocks After ${formatMonthTitle(selectedMonth)} Ends`
                : isFutureMonth
                ? 'Future Month Locked'
                : !selectedMonth
                ? 'Select an Ended Month Above'
                : `No Profit to Disburse for ${formatMonthTitle(selectedMonth)}`}
            </span>
          </button>
        )}
      </div>

      {/* ================= 🚀 CONFIRMATION DISBURSEMENT MODAL ================= */}
      {isDisburseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-200 animate-in fade-in zoom-in duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-black text-gray-900">
                  Confirm Profit Disbursement
                </h3>
                <p className="text-xs text-gray-500 font-medium">
                  {formatMonthTitle(selectedMonth)} • Net Distributable Surplus Allocation
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsDisburseModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleExecuteDisbursement} className="space-y-4 mt-4">
              {disburseError && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{disburseError}</span>
                </div>
              )}

              {/* Metric Highlights */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-3.5">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    Total Distributable Profit Pool
                  </span>
                  <span className="text-lg font-black font-mono text-[#0B462C] block mt-0.5">
                    Rs. {distributableAmount.toLocaleString('en-PK')}
                  </span>
                </div>

                <div className="bg-purple-50/70 border border-purple-200/80 rounded-2xl p-3.5">
                  <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
                    Beneficiary Partners
                  </span>
                  <span className="text-lg font-black font-mono text-purple-900 block mt-0.5">
                    {directors.length} Active Partners
                  </span>
                </div>
              </div>

              {/* Partners Profit Breakdown List */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-700">Partner Profit Allocations</span>
                  <span className="text-[11px] text-gray-400">Pro-rata by net capital</span>
                </div>

                <div className="max-h-44 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-100 bg-gray-50/40">
                  {directors.map((d) => (
                    <div key={d.id} className="p-2.5 px-3 flex items-center justify-between text-xs hover:bg-white transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-black text-xs">
                          {d.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{d.name}</p>
                          <p className="text-[10px] text-gray-500">
                            {Number(d.share_percentage).toFixed(2)}% Equity • Capital: Rs. {Number(d.net_capital).toLocaleString('en-PK')}
                          </p>
                        </div>
                      </div>

                      <div className="text-right font-black font-mono text-emerald-700 text-xs">
                        + Rs. {Number(d.profit_share).toLocaleString('en-PK')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Date and Notes Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Disbursement Date *
                  </label>
                  <CustomDatePicker
                    value={disburseDate}
                    onChange={setDisburseDate}
                    placeholder="Select settlement date"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Settlement Reference / Notes
                  </label>
                  <CustomTextInput
                    value={disburseNotes}
                    onChange={setDisburseNotes}
                    placeholder="e.g. August 2026 Profit Settlement"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-800 text-[11px] font-medium leading-snug">
                ⚠️ <strong>Audit Notice:</strong> Confirming will record <code>profit_credit</code> entries in partner passbooks and close the distribution batch for <strong>{formatMonthTitle(selectedMonth)}</strong>.
              </div>

              {/* Actions Footer */}
              <div className="pt-2 flex justify-end gap-2.5 border-t border-gray-100">
                <button
                  type="button"
                  disabled={isDisbursing}
                  onClick={() => setIsDisburseModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isDisbursing}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isDisbursing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Disbursing...</span>
                    </>
                  ) : (
                    <span>Confirm & Disburse Rs. {distributableAmount.toLocaleString('en-PK')}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
