'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, getStoredUser, User, PnlDirector, PnlSummary } from '@/lib/api';
import CustomMonthPicker from '@/components/CustomMonthPicker';
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
  Coins,
  CheckCircle2,
  ShieldCheck,
  LayoutGrid,
  Table as TableIcon,
  ArrowUpRight,
  Clock,
  AlertCircle,
  X,
  Check
} from 'lucide-react';

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

  // Inline Expected Contribution Editing State
  const [editingExpId, setEditingExpId] = useState<number | null>(null);
  const [tempExpAmount, setTempExpAmount] = useState<string>('');
  const [isSavingExp, setIsSavingExp] = useState<boolean>(false);

  // Disbursement Modal States
  const [isDisburseModalOpen, setIsDisburseModalOpen] = useState<boolean>(false);
  const [disburseDate, setDisburseDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [disburseNotes, setDisburseNotes] = useState<string>('');
  const [transfers, setTransfers] = useState<SettlementTransfer[]>([]);
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

  // Quick Inline Save for Expected Contribution
  const handleSaveExpected = async (directorId: number) => {
    setIsSavingExp(true);
    try {
      const amount = parseFloat(tempExpAmount) || 0;
      await api.put(`/directors/${directorId}`, {
        expected_monthly_contribution: amount,
        name: directors.find(d => d.id === directorId)?.name || 'Partner',
        share_percentage: directors.find(d => d.id === directorId)?.share_percentage || 0,
      });
      setEditingExpId(null);
      await fetchPnlData();
    } catch (err: any) {
      alert(err?.message || 'Failed to update agreed capital target.');
    } finally {
      setIsSavingExp(false);
    }
  };

  const totalNetCapital = directors.reduce((sum, d) => sum + Number(d.net_capital || 0), 0);
  const totalAllocatedProfit = directors.reduce((sum, d) => sum + Number(d.profit_share || 0), 0);
  const totalExpectedAll = directors.reduce((sum, d) => sum + Number(d.expected_monthly_contribution || 0), 0);
  const totalPaidInMonthAll = directors.reduce((sum, d) => sum + Number(d.month_paid_amount || 0), 0);
  const totalSharePercentage = directors.reduce((sum, d) => sum + Number(d.share_percentage || 0), 0);

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
            Government Revenue Inflows vs General Expenses, Partner Capital Target Audits, and Profit Settlements
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
            className="p-1 text-emerald-700 hover:text-emerald-900 rounded-lg hover:bg-emerald-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ================= 📊 TOP 4 EXECUTIVE METRIC CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Received from Govt */}
        <div className="bg-white border border-gray-200/90 rounded-3xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Total Govt Inflow
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
                🏛️
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black font-mono text-gray-900">
                Rs. {summary ? Number(summary.total_govt_income).toLocaleString('en-PK') : '0'}
              </span>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 font-medium mt-2 pt-2 border-t border-gray-100">
            {selectedMonth ? `Grants in ${formatMonthTitle(selectedMonth)}` : 'Total grants received'}
          </p>
        </div>

        {/* Card 2: Total General Expenses */}
        <div className="bg-white border border-gray-200/90 rounded-3xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                General Expenses
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-sm">
                📑
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black font-mono text-amber-700">
                Rs. {summary ? Number(summary.total_general_expenses).toLocaleString('en-PK') : '0'}
              </span>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 font-medium mt-2 pt-2 border-t border-gray-100">
            {selectedMonth ? `Expenses in ${formatMonthTitle(selectedMonth)}` : 'Operational expenditure'}
          </p>
        </div>

        {/* Card 3: Remaining Distributable Profit */}
        <div className="bg-[#0B462C] text-white border border-[#0B462C] rounded-3xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider">
                Distributable Profit Pool
              </span>
              <div className="w-8 h-8 rounded-xl bg-white/10 text-white flex items-center justify-center font-bold text-sm">
                💰
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black font-mono text-white">
                Rs. {summary ? Number(summary.remaining_amount).toLocaleString('en-PK') : '0'}
              </span>
            </div>
          </div>
          <p className="text-[10px] text-emerald-200/90 font-medium mt-2 pt-2 border-t border-white/10">
            Govt Inflows - Expenses ({summary ? summary.net_margin_percentage : '0'}% margin)
          </p>
        </div>

        {/* Card 4: Partner Capital Target (Agreed vs Contributed) */}
        <div className="bg-purple-900 text-white border border-purple-800 rounded-3xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-purple-200 uppercase tracking-wider">
                Partner Capital Targets
              </span>
              <div className="w-8 h-8 rounded-xl bg-white/10 text-purple-100 flex items-center justify-center font-bold text-sm">
                🤝
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between gap-1">
              <div>
                <span className="text-[10px] text-purple-300 block">Capital Paid</span>
                <span className="text-lg sm:text-xl font-black font-mono text-white">
                  Rs. {totalPaidInMonthAll.toLocaleString('en-PK')}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-purple-300 block">Agreed Target (One-Time)</span>
                <span className="text-sm font-bold font-mono text-purple-200">
                  Rs. {totalExpectedAll.toLocaleString('en-PK')}
                </span>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-purple-200/80 font-medium mt-2 pt-2 border-t border-white/10">
            {selectedMonth ? `Cumulative Capital Audit to ${formatMonthTitle(selectedMonth)}` : 'One-Time Capital Target Audit'}
          </p>
        </div>
      </div>

      {/* ================= 👥 PARTNER PROFIT & CONTRIBUTION AUDIT LEDGER ================= */}
      <div className="bg-white border border-gray-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-700" />
              Partner Profit Allocations & Capital Contribution Analysis
            </h2>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Profits calculated strictly by agreed percentage ({totalSharePercentage.toFixed(1)}% total). Surplus contributions are treated as loans; shortfalls can be settled before disbursement.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* View Switcher */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs font-bold">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'cards' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Cards
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'table' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                Table
              </button>
            </div>

            <div className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-purple-50 text-purple-800 border border-purple-200">
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
          /* ================= 🃏 CARDS VIEW ================= */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
            {directors.map((director) => {
              const isOverpaid = director.loan_amount > 0;
              const isUnderpaid = director.shortfall_amount > 0;
              const isEditingThis = editingExpId === director.id;

              return (
                <div 
                  key={director.id}
                  className="bg-white hover:bg-gray-50/40 border border-gray-200/90 rounded-3xl p-6 transition-all shadow-xs hover:shadow-md space-y-4 relative group"
                >
                  {/* Header: Avatar, Name, Agreed Profit % */}
                  <div className="flex items-start justify-between gap-3 pb-1">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-700 to-indigo-800 text-white flex items-center justify-center font-black text-base shadow-xs shrink-0">
                        {director.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-black text-gray-900 group-hover:text-purple-900 transition-colors">
                          {director.name}
                        </h3>
                        <div className="text-[11px] text-gray-500 font-medium flex items-center gap-2 mt-0.5">
                          {director.cnic ? <span>CNIC: {director.cnic}</span> : <span>Partner ID: #{director.id}</span>}
                          {director.bank_name && <span>• {director.bank_name}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Agreed Profit Share % Badge */}
                    <span className="px-3 py-1 rounded-xl text-xs font-black bg-purple-100 text-purple-900 border border-purple-200 shadow-2xs">
                      {Number(director.share_percentage).toFixed(1)}% Profit Share
                    </span>
                  </div>

                  {/* Capital Target vs Paid Analysis Box */}
                  <div className="bg-gray-50/90 border border-gray-200/80 rounded-2xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-gray-600">Capital Target Status</span>
                      {isOverpaid ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Surplus / Loan: +Rs. {Number(director.loan_amount).toLocaleString('en-PK')}
                        </span>
                      ) : isUnderpaid ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                          Shortfall: -Rs. {Number(director.shortfall_amount).toLocaleString('en-PK')}
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-200 text-gray-700">
                          On Track
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                      {/* Expected Monthly Contribution (Editable) */}
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          Agreed Capital Target
                        </span>
                        {isEditingThis ? (
                          <div className="flex items-center gap-1.5 mt-1">
                            <input
                              type="number"
                              value={tempExpAmount}
                              onChange={(e) => setTempExpAmount(e.target.value)}
                              className="w-24 px-2 py-1 text-xs border rounded-lg font-mono focus:ring-1 focus:ring-purple-600"
                              placeholder="Amount"
                            />
                            <button
                              onClick={() => handleSaveExpected(director.id)}
                              disabled={isSavingExp}
                              className="p-1 rounded bg-purple-700 text-white hover:bg-purple-800 transition"
                              title="Save Target"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingExpId(null)}
                              className="p-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-black font-mono text-gray-800">
                              Rs. {Number(director.expected_monthly_contribution || 0).toLocaleString('en-PK')}
                            </span>
                            <button
                              onClick={() => {
                                setEditingExpId(director.id);
                                setTempExpAmount(String(director.expected_monthly_contribution || ''));
                              }}
                              className="text-[10px] text-purple-700 hover:text-purple-900 font-semibold underline cursor-pointer"
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Capital Contributed */}
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          Capital Contributed
                        </span>
                        <span className="font-black font-mono text-gray-900 block mt-1">
                          Rs. {Number(director.month_paid_amount || 0).toLocaleString('en-PK')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 2 Metric Tiles: Net Capital Holding & Base Profit Share */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    {/* Left: Net Capital */}
                    <div className="bg-purple-50/60 border border-purple-200/70 rounded-2xl p-3.5">
                      <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
                        Capital Equity Holding
                      </span>
                      <span className="text-base font-black font-mono text-purple-950 block mt-1">
                        Rs. {Number(director.net_capital).toLocaleString('en-PK')}
                      </span>
                    </div>

                    {/* Right: Profit Share */}
                    <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-3.5">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                        Agreed Base Profit
                      </span>
                      <span className="text-base font-black font-mono text-emerald-700 block mt-1">
                        + Rs. {Number(director.profit_share).toLocaleString('en-PK')}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Action Link */}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-gray-400 font-medium">Partner Capital Statement</span>
                    <Link 
                      href={`/director/${director.id}?month=${selectedMonth}`}
                      className="inline-flex items-center gap-1 font-bold text-purple-700 hover:text-purple-900 transition-colors py-1 px-2.5 rounded-lg hover:bg-purple-50"
                    >
                      View Passbook
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ================= 📋 TABLE VIEW ================= */
          <div className="overflow-x-auto rounded-2xl border border-gray-200/90">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50/90 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Partner Name</th>
                  <th className="py-3.5 px-3 text-center">Agreed Share (%)</th>
                  <th className="py-3.5 px-3 text-right">Agreed Capital Target</th>
                  <th className="py-3.5 px-3 text-right">Capital Contributed</th>
                  <th className="py-3.5 px-3 text-center">Capital Surplus / Shortfall</th>
                  <th className="py-3.5 px-3 text-right">Capital Equity</th>
                  <th className="py-3.5 px-4 text-right">Base Profit</th>
                  <th className="py-3.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {directors.map((director) => {
                  const isOverpaid = director.loan_amount > 0;
                  const isUnderpaid = director.shortfall_amount > 0;

                  return (
                    <tr key={director.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-gray-900 flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-black text-xs">
                          {director.name.charAt(0)}
                        </div>
                        <div>
                          <span>{director.name}</span>
                          <span className="text-[10px] text-gray-400 block">{director.cnic || 'Partner'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-black bg-purple-50 text-purple-800 border border-purple-200">
                          {Number(director.share_percentage).toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-gray-700">
                        Rs. {Number(director.expected_monthly_contribution || 0).toLocaleString('en-PK')}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-gray-900">
                        Rs. {Number(director.month_paid_amount || 0).toLocaleString('en-PK')}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        {isOverpaid ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Surplus Capital: +{Number(director.loan_amount).toLocaleString()}
                          </span>
                        ) : isUnderpaid ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                            Capital Shortfall: -{Number(director.shortfall_amount).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-emerald-700 text-[10px] font-bold">Target Met</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-purple-900">
                        Rs. {Number(director.net_capital).toLocaleString('en-PK')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black font-mono text-emerald-700 text-sm">
                        + Rs. {Number(director.profit_share).toLocaleString('en-PK')}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <Link 
                          href={`/director/${director.id}?month=${selectedMonth}`}
                          className="p-1 rounded bg-gray-100 hover:bg-purple-100 text-gray-700 hover:text-purple-900 font-bold inline-flex items-center gap-1 transition-colors text-[11px]"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50/90 border-t-2 border-gray-200 font-black text-gray-900 text-xs">
                  <td className="py-3.5 px-4 uppercase tracking-wider text-[10px]">
                    Total Reconciliation
                  </td>
                  <td className="py-3.5 px-3 text-center font-mono">
                    {totalSharePercentage.toFixed(1)}%
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono">
                    Rs. {totalExpectedAll.toLocaleString('en-PK')}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono">
                    Rs. {totalPaidInMonthAll.toLocaleString('en-PK')}
                  </td>
                  <td className="py-3.5 px-3 text-center text-gray-400 text-[10px]">
                    —
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-purple-900">
                    Rs. {totalNetCapital.toLocaleString('en-PK')}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-emerald-700 text-sm">
                    + Rs. {totalAllocatedProfit.toLocaleString('en-PK')}
                  </td>
                  <td className="py-3.5 px-3 text-center text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 mx-auto" />
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* ================= ⚡ PROFIT DISBURSEMENT ACTION BUTTON & HISTORY ================= */}
      <div className="bg-white border border-gray-200/90 rounded-3xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-black text-gray-900">Month-End Profit Settlement & Disbursement</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {selectedMonth ? `Execute final profit disbursement and shortfall settlements for ${formatMonthTitle(selectedMonth)}` : 'Select a completed previous month to execute profit settlements'}
          </p>
        </div>

        <div>
          {canDisburse ? (
            <Link
              href={`/director/pnl/settle?month=${selectedMonth}`}
              className="px-6 py-3 rounded-2xl bg-[#0B462C] hover:bg-[#083622] text-white font-black text-xs sm:text-sm shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#E8D4A2]" />
              <span>Settle & Disburse {formatMonthTitle(selectedMonth)} Profit (Rs. {distributableAmount.toLocaleString('en-PK')})</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : isDistributed ? (
            <div className="flex items-center gap-2">
              <Link
                href={`/director/pnl/settle?month=${selectedMonth}`}
                className="px-4 py-2.5 rounded-2xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold transition flex items-center gap-1.5"
              >
                <span>View Stream Pipeline</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <div className="px-4 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Profit for {formatMonthTitle(selectedMonth)} Already Disbursed (Rs. {Number(summary?.distribution?.total_profit_pool || distributableAmount).toLocaleString('en-PK')})</span>
              </div>
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
                  : `No Distributable Surplus for ${formatMonthTitle(selectedMonth)}`}
              </span>
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
