'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  api,
  downloadBlob,
  formatDisplayDate,
  Director,
  DirectorTransactionItem
} from '@/lib/api';
import CustomMonthPicker from '@/components/CustomMonthPicker';
import CustomDatePicker from '@/components/CustomDatePicker';
import CustomNumberInput from '@/components/CustomNumberInput';
import CustomTextInput from '@/components/CustomTextInput';
import CustomDropdown from '@/components/CustomDropdown';
import {
  ArrowLeft,
  Download,
  RefreshCw,
  Building,
  ArrowDownLeft,
  ArrowUpRight,
  ExternalLink,
  Calendar,
  AlertCircle,
  X,
  FileSpreadsheet,
  Receipt,
  Layers,
  History
} from 'lucide-react';

interface StatementSummary {
  opening_balance: number;
  current_balance: number;
  total_credits: number;
  total_debits: number;
  total_usage: number;
  total_drawings: number;
  total_injections: number;
  total_profit_shares: number;
}

export default function DirectorStatementPage() {
  const params = useParams();
  const router = useRouter();
  const directorId = params?.id as string;

  // Month Filter - Defaults to Current Month (YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Active Ledger Tab
  const [activeLedgerTab, setActiveLedgerTab] = useState<'all' | 'usage' | 'drawings' | 'injections'>('all');

  // Data States
  const [director, setDirector] = useState<Director | null>(null);
  const [statementData, setStatementData] = useState<DirectorTransactionItem[]>([]);
  const [usageLedger, setUsageLedger] = useState<DirectorTransactionItem[]>([]);
  const [drawingsLedger, setDrawingsLedger] = useState<DirectorTransactionItem[]>([]);
  const [injectionsLedger, setInjectionsLedger] = useState<DirectorTransactionItem[]>([]);
  const [summary, setSummary] = useState<StatementSummary | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Categories for capital expense modal
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

  // Modals for Actions
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isCapitalExpenseOpen, setIsCapitalExpenseOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  // Form States - Deposit
  const [depAmount, setDepAmount] = useState('');
  const [depDate, setDepDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [depMethod, setDepMethod] = useState('Bank Transfer');
  const [depRef, setDepRef] = useState('');
  const [depNotes, setDepNotes] = useState('');
  const [depSlip, setDepSlip] = useState<File | null>(null);
  const [depSubmitting, setDepSubmitting] = useState(false);
  const [depError, setDepError] = useState('');

  // Form States - Capital Expense
  const [capTitle, setCapTitle] = useState('');
  const [capCategoryId, setCapCategoryId] = useState('');
  const [capAmount, setCapAmount] = useState('');
  const [capDate, setCapDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [capMethod, setCapMethod] = useState('Capital Account');
  const [capNotes, setCapNotes] = useState('');
  const [capReceipt, setCapReceipt] = useState<File | null>(null);
  const [capSubmitting, setCapSubmitting] = useState(false);
  const [capError, setCapError] = useState('');

  // Form States - Withdraw
  const [withAmount, setWithAmount] = useState('');
  const [withDate, setWithDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [withMethod, setWithMethod] = useState('Bank Transfer');
  const [withRef, setWithRef] = useState('');
  const [withNotes, setWithNotes] = useState('');
  const [withSlip, setWithSlip] = useState<File | null>(null);
  const [withSubmitting, setWithSubmitting] = useState(false);
  const [withError, setWithError] = useState('');

  // Fetch Statement Data
  const fetchStatementData = async () => {
    if (!directorId) return;
    setIsLoading(true);
    try {
      const url = selectedMonth
        ? `/directors/${directorId}/statement?month=${selectedMonth}`
        : `/directors/${directorId}/statement`;

      const [res, catRes] = await Promise.allSettled([
        api.get(url),
        api.get('/categories'),
      ]);

      if (res.status === 'fulfilled') {
        const data = res.value;
        setDirector(data.director || null);
        setStatementData(data.data || []);
        setUsageLedger(data.usage_ledger || []);
        setDrawingsLedger(data.drawings_ledger || []);
        setInjectionsLedger(data.injections_ledger || []);
        setSummary(data.summary || {
          opening_balance: data.opening_balance || 0,
          current_balance: data.current_balance || 0,
          total_credits: data.total_credits || 0,
          total_debits: data.total_debits || 0,
          total_usage: (data.usage_ledger || []).reduce((acc: number, item: any) => acc + Number(item.debit || item.amount || 0), 0),
          total_drawings: (data.drawings_ledger || []).reduce((acc: number, item: any) => acc + Number(item.debit || item.amount || 0), 0),
          total_injections: (data.injections_ledger || []).reduce((acc: number, item: any) => acc + Number(item.credit || item.amount || 0), 0),
          total_profit_shares: 0,
        });
      }

      if (catRes.status === 'fulfilled') {
        setCategories(catRes.value.data || catRes.value || []);
      }
    } catch (err: any) {
      console.error('Failed to load statement', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatementData();
  }, [directorId, selectedMonth]);

  // Export PDF Statement
  const handleExportStatementPdf = async () => {
    if (!director) return;
    setIsExportingPdf(true);
    try {
      const params = new URLSearchParams();
      if (selectedMonth) params.append('month', selectedMonth);
      await downloadBlob(
        `/directors/${director.id}/export-pdf?${params.toString()}`,
        `Director_Statement_${director.name.replace(/\s+/g, '_')}_${selectedMonth || 'all'}.pdf`
      );
    } catch (err: any) {
      alert(err.message || 'Failed to download statement PDF.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Submit Deposit
  const handleDepositCapital = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepError('');
    setDepSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('director_id', directorId);
      formData.append('type', 'capital_injection');
      formData.append('amount', depAmount);
      formData.append('date', depDate);
      formData.append('payment_method', depMethod);
      if (depRef) formData.append('reference_no', depRef);
      if (depNotes) formData.append('notes', depNotes);
      if (depSlip) formData.append('slip', depSlip);

      await api.postForm('/directors/transactions', formData);
      setIsDepositOpen(false);
      setDepAmount('');
      setDepRef('');
      setDepNotes('');
      setDepSlip(null);
      fetchStatementData();
    } catch (err: any) {
      setDepError(err.message || 'Failed to record capital injection.');
    } finally {
      setDepSubmitting(false);
    }
  };

  // Submit Capital Expense
  const handleCapitalExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setCapError('');
    setCapSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('director_id', directorId);
      formData.append('title', capTitle);
      if (capCategoryId) formData.append('category_id', capCategoryId);
      formData.append('amount', capAmount);
      formData.append('date', capDate);
      formData.append('payment_method', capMethod);
      if (capNotes) formData.append('notes', capNotes);
      if (capReceipt) formData.append('receipt', capReceipt);

      await api.postForm('/directors/capital-expenses', formData);
      setIsCapitalExpenseOpen(false);
      setCapTitle('');
      setCapCategoryId('');
      setCapAmount('');
      setCapNotes('');
      setCapReceipt(null);
      fetchStatementData();
    } catch (err: any) {
      setCapError(err.message || 'Failed to record capital expense.');
    } finally {
      setCapSubmitting(false);
    }
  };

  // Submit Withdraw
  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithError('');
    setWithSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('director_id', directorId);
      formData.append('type', 'withdrawal');
      formData.append('amount', withAmount);
      formData.append('date', withDate);
      formData.append('payment_method', withMethod);
      if (withRef) formData.append('reference_no', withRef);
      if (withNotes) formData.append('notes', withNotes);
      if (withSlip) formData.append('slip', withSlip);

      await api.postForm('/directors/transactions', formData);
      setIsWithdrawOpen(false);
      setWithAmount('');
      setWithRef('');
      setWithNotes('');
      setWithSlip(null);
      fetchStatementData();
    } catch (err: any) {
      setWithError(err.message || 'Failed to record withdrawal.');
    } finally {
      setWithSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* ================= 🧭 BREADCRUMBS & TOP BAR ================= */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/director"
              className="px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Cockpit
            </Link>
            <div className="h-5 w-px bg-gray-300 hidden sm:block" />
            <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <span>Partner Capital Statement & Itemized Ledgers</span>
            </h1>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsDepositOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ArrowDownLeft className="w-4 h-4" />
              + Deposit Capital
            </button>

            <button
              onClick={() => setIsCapitalExpenseOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Building className="w-4 h-4" />
              🏗️ Record Capital Usage
            </button>

            <button
              onClick={() => setIsWithdrawOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />
              - Withdraw Funds
            </button>

            <button
              onClick={handleExportStatementPdf}
              disabled={isExportingPdf || !director}
              className="px-4 py-2 rounded-xl bg-[#0B462C] hover:bg-[#083521] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              {isExportingPdf ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {isExportingPdf ? 'Exporting...' : 'Export PDF'}
            </button>
          </div>
        </div>

        {/* ================= 👤 PARTNER HERO PROFILE CARD ================= */}
        {director && (
          <div className="bg-white border border-gray-200/90 rounded-3xl p-6 shadow-xs relative z-30">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-purple-700 text-white flex items-center justify-center font-black text-2xl shadow-md">
                  {director.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-2xl font-black text-gray-900">{director.name}</h2>
                    {director.share_percentage !== undefined && director.share_percentage > 0 && (
                      <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-purple-100 text-purple-800 border border-purple-200">
                        {director.share_percentage}% Capital Share
                      </span>
                    )}
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700">
                      Active Partner
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 font-medium mt-1.5">
                    {director.email && <span>📧 {director.email}</span>}
                    {director.phone && <span>📞 {director.phone}</span>}
                    {director.cnic && <span>🪪 CNIC: {director.cnic}</span>}
                    {director.bank_name && <span>🏛️ {director.bank_name} - {director.bank_account_no}</span>}
                  </div>
                </div>
              </div>

              {/* Month Selector Filter */}
              <div className="flex items-center gap-2">
                <div className="w-52">
                  <CustomMonthPicker
                    value={selectedMonth}
                    onChange={setSelectedMonth}
                    placeholder="All Time History"
                  />
                </div>
                <button
                  onClick={fetchStatementData}
                  className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all cursor-pointer"
                  title="Reload Statement"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#0B462C]' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= 📊 4 SUMMARY METRIC CARDS FOR SELECTED PERIOD ================= */}
        {summary && director && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Net Capital */}
            <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Net Capital Holding
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  💎
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-black font-mono text-gray-900">
                  Rs. {Number(director.net_capital ?? ((director.total_capital_injected || 0) - (director.total_withdrawn || 0))).toLocaleString('en-PK')}
                </span>
              </div>
            </div>

            {/* Card 2: Period Usage / Total Consumed */}
            <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  {selectedMonth ? 'Period Capital Usage' : 'Total Capital Consumed'}
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
                  🏗️
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-black font-mono text-amber-700">
                  Rs. {Number(summary.total_usage || 0).toLocaleString('en-PK')}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-medium mt-1">
                {selectedMonth ? 'Asset & equipment purchases this month' : 'Total assets & construction usage'}
              </p>
            </div>

            {/* Card 3: Period Drawings / Total Withdrawn */}
            <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  {selectedMonth ? 'Period Drawings' : 'Total Drawings / Withdrawn'}
                </span>
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold text-xs">
                  💸
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-black font-mono text-rose-700">
                  Rs. {Number(summary.total_drawings || 0).toLocaleString('en-PK')}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-medium mt-1">
                {selectedMonth ? 'Partner drawings disbursed this month' : 'Total disbursed drawings'}
              </p>
            </div>

            {/* Card 4: Closing / Live Available Capital */}
            <div className="bg-[#0B462C] text-white border border-[#0B462C] rounded-2xl p-5 shadow-sm relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider">
                    {selectedMonth ? 'Closing Available Capital' : 'Live Available Capital'}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-white/10 text-white flex items-center justify-center font-bold text-xs">
                    🏦
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-black font-mono text-white">
                    Rs. {Number(summary.current_balance || 0).toLocaleString('en-PK')}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-200/90 font-medium mt-1">
                  {selectedMonth 
                    ? `Available funds at end of ${selectedMonth}` 
                    : 'Ready for withdrawal or usage'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ================= 📑 SEGREGATED LEDGER TABS & ITEMIZED DETAILS ================= */}
        <div className="bg-white border border-gray-200/90 rounded-3xl shadow-xs overflow-hidden">
          {/* Tabs Navigation Header */}
          <div className="p-4 bg-gray-50/90 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveLedgerTab('all')}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeLedgerTab === 'all'
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                }`}
              >
                <History className="w-4 h-4" />
                <span>📜 Chronological Passbook ({statementData.length})</span>
              </button>

              <button
                onClick={() => setActiveLedgerTab('usage')}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeLedgerTab === 'usage'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                }`}
              >
                <Building className="w-4 h-4" />
                <span>🏗️ Capital Usage & Expenses ({usageLedger.length})</span>
              </button>

              <button
                onClick={() => setActiveLedgerTab('drawings')}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeLedgerTab === 'drawings'
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>💸 Drawings & Withdrawals ({drawingsLedger.length})</span>
              </button>

              <button
                onClick={() => setActiveLedgerTab('injections')}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeLedgerTab === 'injections'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>💎 Capital Injections ({injectionsLedger.length})</span>
              </button>
            </div>

            {/* Quick Period Info */}
            <div className="text-xs font-bold text-gray-500">
              Period: <span className="text-purple-700 font-black font-mono">{selectedMonth || 'All Time History'}</span>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="py-16 text-center text-gray-400">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-purple-700 mb-2" />
                <p className="font-semibold text-xs text-gray-600">Loading itemized partner ledger...</p>
              </div>
            ) : activeLedgerTab === 'all' ? (
              /* ── TAB 1: ALL CHRONOLOGICAL TRANSACTIONS ── */
              <table className="w-full text-left text-xs text-gray-800">
                <thead className="bg-gray-50 text-gray-600 font-bold uppercase tracking-wider text-[11px] border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Particulars / Details of Usage</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4 text-right text-emerald-700">Credit (+)</th>
                    <th className="py-3 px-4 text-right text-rose-700">Debit (-)</th>
                    <th className="py-3 px-4 text-right font-mono">Running Balance</th>
                    <th className="py-3 px-4 text-center">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {statementData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-400">
                        No transactions recorded for this period.
                      </td>
                    </tr>
                  ) : (
                    statementData.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3.5 px-4 whitespace-nowrap text-gray-600 font-mono text-[11px]">
                          {formatDisplayDate(item.date)}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-gray-900">{item.title}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {item.category_name && (
                              <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                📁 {item.category_name}
                              </span>
                            )}
                            {item.reference_no && (
                              <span className="text-[10px] text-gray-400 font-mono">Ref: {item.reference_no}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {item.type === 'capital_injection' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              💎 Capital Deposit
                            </span>
                          )}
                          {item.type === 'capital_expense' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              🏗️ Capital Usage
                            </span>
                          )}
                          {item.type === 'profit_credit' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              📈 Profit Dividend
                            </span>
                          )}
                          {item.type === 'withdrawal' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              💸 Drawing
                            </span>
                          )}
                          {item.type === 'opening_balance' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                              Brought Forward
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                          {item.credit > 0 ? `+ Rs. ${Number(item.credit).toLocaleString('en-PK')}` : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-700 whitespace-nowrap">
                          {item.debit > 0 ? `- Rs. ${Number(item.debit).toLocaleString('en-PK')}` : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-gray-900 whitespace-nowrap">
                          Rs. {Number(item.running_balance).toLocaleString('en-PK')}
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {item.slip_url ? (
                            <a
                              href={item.slip_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-purple-700 hover:underline font-bold"
                            >
                              <ExternalLink className="w-3 h-3" /> View
                            </a>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : activeLedgerTab === 'usage' ? (
              /* ── TAB 2: DEDICATED CAPITAL USAGE & EXPENSES LEDGER ── */
              <table className="w-full text-left text-xs text-gray-800">
                <thead className="bg-amber-50/60 text-amber-900 font-bold uppercase tracking-wider text-[11px] border-b border-amber-200">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Expense Title / Assets Purchased</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4">Reference / Voucher</th>
                    <th className="py-3 px-4 text-right text-amber-800 font-mono">Amount (PKR)</th>
                    <th className="py-3 px-4 text-center">Invoice / Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {usageLedger.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-400">
                        No capital usage or asset expenses recorded for this period.
                      </td>
                    </tr>
                  ) : (
                    usageLedger.map((item, idx) => (
                      <tr key={idx} className="hover:bg-amber-50/30 transition-colors">
                        <td className="py-3.5 px-4 whitespace-nowrap text-gray-600 font-mono text-[11px]">
                          {formatDisplayDate(item.date)}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-gray-900">{item.title}</div>
                          {item.notes && item.notes !== item.title && (
                            <div className="text-[11px] text-gray-500 mt-0.5">{item.notes}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="text-[10px] text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            📁 {item.category_name || 'Capital Asset'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-gray-600">
                          {item.payment_method || 'Capital Account'}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-gray-500">
                          {item.reference_no || 'CAP-EXP'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-amber-700 text-sm whitespace-nowrap">
                          Rs. {Number(item.debit || 0).toLocaleString('en-PK')}
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {item.slip_url ? (
                            <a
                              href={item.slip_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-amber-800 hover:underline font-bold"
                            >
                              <ExternalLink className="w-3 h-3" /> View Invoice
                            </a>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : activeLedgerTab === 'drawings' ? (
              /* ── TAB 3: DEDICATED DRAWINGS & WITHDRAWALS LEDGER ── */
              <table className="w-full text-left text-xs text-gray-800">
                <thead className="bg-rose-50/60 text-rose-900 font-bold uppercase tracking-wider text-[11px] border-b border-rose-200">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Drawing Particulars</th>
                    <th className="py-3 px-4">Disbursement Method</th>
                    <th className="py-3 px-4">Reference / Cheque #</th>
                    <th className="py-3 px-4 text-right text-rose-700 font-mono">Amount (PKR)</th>
                    <th className="py-3 px-4 text-center">Receipt Slip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {drawingsLedger.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-gray-400">
                        No withdrawals or drawings recorded for this period.
                      </td>
                    </tr>
                  ) : (
                    drawingsLedger.map((item, idx) => (
                      <tr key={idx} className="hover:bg-rose-50/30 transition-colors">
                        <td className="py-3.5 px-4 whitespace-nowrap text-gray-600 font-mono text-[11px]">
                          {formatDisplayDate(item.date)}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-gray-900">{item.title}</div>
                          {item.notes && item.notes !== item.title && (
                            <div className="text-[11px] text-gray-500 mt-0.5">{item.notes}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-gray-600">
                          {item.payment_method || 'Bank Transfer'}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-gray-500">
                          {item.reference_no || 'Direct Txn'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-rose-700 text-sm whitespace-nowrap">
                          Rs. {Number(item.debit || 0).toLocaleString('en-PK')}
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {item.slip_url ? (
                            <a
                              href={item.slip_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-rose-700 hover:underline font-bold"
                            >
                              <ExternalLink className="w-3 h-3" /> View Slip
                            </a>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              /* ── TAB 4: DEDICATED CAPITAL INJECTIONS LEDGER ── */
              <table className="w-full text-left text-xs text-gray-800">
                <thead className="bg-emerald-50/60 text-emerald-900 font-bold uppercase tracking-wider text-[11px] border-b border-emerald-200">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Capital Inflow Particulars</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4">Reference / Deposit Slip #</th>
                    <th className="py-3 px-4 text-right text-emerald-700 font-mono">Amount (PKR)</th>
                    <th className="py-3 px-4 text-center">Deposit Slip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {injectionsLedger.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-gray-400">
                        No capital injections recorded for this period.
                      </td>
                    </tr>
                  ) : (
                    injectionsLedger.map((item, idx) => (
                      <tr key={idx} className="hover:bg-emerald-50/30 transition-colors">
                        <td className="py-3.5 px-4 whitespace-nowrap text-gray-600 font-mono text-[11px]">
                          {formatDisplayDate(item.date)}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-gray-900">{item.title}</div>
                          {item.notes && item.notes !== item.title && (
                            <div className="text-[11px] text-gray-500 mt-0.5">{item.notes}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-gray-600">
                          {item.payment_method || 'Bank Transfer'}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-gray-500">
                          {item.reference_no || 'Deposit Slip'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-700 text-sm whitespace-nowrap">
                          + Rs. {Number(item.credit || 0).toLocaleString('en-PK')}
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {item.slip_url ? (
                            <a
                              href={item.slip_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:underline font-bold"
                            >
                              <ExternalLink className="w-3 h-3" /> View Slip
                            </a>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ================= ➕ MODAL: DEPOSIT CAPITAL ================= */}
        {isDepositOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200 animate-in fade-in zoom-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-base font-black text-gray-900">Record Capital Injection for {director?.name}</h3>
                <button onClick={() => setIsDepositOpen(false)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {depError && (
                <div className="mt-3 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {depError}
                </div>
              )}

              <form onSubmit={handleDepositCapital} className="space-y-3.5 mt-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Capital Amount (PKR) *</label>
                  <CustomNumberInput
                    value={depAmount}
                    onChange={setDepAmount}
                    placeholder="e.g. 500,000"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Deposit Date *</label>
                    <CustomDatePicker
                      value={depDate}
                      onChange={setDepDate}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Payment Method *</label>
                    <CustomDropdown
                      options={[
                        { value: 'Bank Transfer', label: 'Bank Transfer', icon: '🏛️' },
                        { value: 'Cheque', label: 'Bank Cheque', icon: '🧾' },
                        { value: 'Cash', label: 'Cash', icon: '💵' },
                      ]}
                      value={depMethod}
                      onChange={setDepMethod}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Reference / Slip #</label>
                  <CustomTextInput
                    placeholder="e.g. Online IBFT / Cheque #0192"
                    value={depRef}
                    onChange={setDepRef}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Upload Receipt / Slip (Photo / PDF)</label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setDepSlip(e.target.files ? e.target.files[0] : null)}
                    className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDepositOpen(false)}
                    className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={depSubmitting}
                    className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {depSubmitting ? 'Recording...' : 'Credit Capital Deposit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= 🏗️ MODAL: RECORD CAPITAL USAGE / EXPENSE ================= */}
        {isCapitalExpenseOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-base font-black text-gray-900">Record Capital Expense / Usage</h3>
                  <p className="text-xs text-gray-500 font-medium">Charge expense directly to {director?.name}&apos;s capital account</p>
                </div>
                <button onClick={() => setIsCapitalExpenseOpen(false)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {capError && (
                <div className="mt-3 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {capError}
                </div>
              )}

              <form onSubmit={handleCapitalExpense} className="space-y-3.5 mt-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Expense Title / Description *</label>
                  <CustomTextInput
                    placeholder="e.g. Solar Inverter & Panels, Campus Renovation, Lab Equipment"
                    value={capTitle}
                    onChange={setCapTitle}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Category</label>
                    <CustomDropdown
                      options={[
                        { value: '', label: 'Select Category', icon: '📁' },
                        ...categories.map(c => ({ value: String(c.id), label: c.name, icon: '🏷️' }))
                      ]}
                      value={capCategoryId}
                      onChange={setCapCategoryId}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Expense Amount (PKR) *</label>
                    <CustomNumberInput
                      value={capAmount}
                      onChange={setCapAmount}
                      placeholder="e.g. 150,000"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Expense Date *</label>
                    <CustomDatePicker
                      value={capDate}
                      onChange={setCapDate}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Payment Method *</label>
                    <CustomDropdown
                      options={[
                        { value: 'Capital Account', label: 'Capital Account', icon: '🏛️' },
                        { value: 'Bank Transfer', label: 'Bank Transfer', icon: '💳' },
                        { value: 'Cash', label: 'Cash', icon: '💵' },
                        { value: 'Cheque', label: 'Cheque', icon: '🧾' },
                      ]}
                      value={capMethod}
                      onChange={setCapMethod}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Notes / Vendor / Invoices</label>
                  <CustomTextInput
                    multiline
                    rows={2}
                    placeholder="e.g. Vendor: Pak Solar Ltd, Invoice #INV-8821 for 10kW On-Grid Solar System"
                    value={capNotes}
                    onChange={setCapNotes}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Upload Invoice / Receipt Slip</label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setCapReceipt(e.target.files ? e.target.files[0] : null)}
                    className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-50 file:text-amber-800 hover:file:bg-amber-100"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCapitalExpenseOpen(false)}
                    className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={capSubmitting}
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {capSubmitting ? 'Recording Expense...' : 'Record Capital Expense'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= ➕ MODAL: WITHDRAW FUNDS ================= */}
        {isWithdrawOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200 animate-in fade-in zoom-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-base font-black text-gray-900">Record Withdrawal for {director?.name}</h3>
                <button onClick={() => setIsWithdrawOpen(false)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {withError && (
                <div className="mt-3 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {withError}
                </div>
              )}

              <form onSubmit={handleWithdraw} className="space-y-3.5 mt-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Withdrawal Amount (PKR) *</label>
                  <CustomNumberInput
                    value={withAmount}
                    onChange={setWithAmount}
                    placeholder="e.g. 100,000"
                    required
                  />
                  {director && (
                    <span className="text-[11px] text-emerald-700 font-bold mt-1 block">
                      Available Undrawn Funds: Rs. {Number(director.live_balance).toLocaleString('en-PK')}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Withdrawal Date *</label>
                    <CustomDatePicker
                      value={withDate}
                      onChange={setWithDate}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Disbursement Method *</label>
                    <CustomDropdown
                      options={[
                        { value: 'Bank Transfer', label: 'Bank Transfer', icon: '🏛️' },
                        { value: 'Cheque', label: 'Bank Cheque', icon: '🧾' },
                        { value: 'Cash', label: 'Cash', icon: '💵' },
                      ]}
                      value={withMethod}
                      onChange={setWithMethod}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Reference / Cheque #</label>
                  <CustomTextInput
                    placeholder="e.g. Cheque #0942 / Online IBFT"
                    value={withRef}
                    onChange={setWithRef}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Upload Receipt / Counterfoil</label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setWithSlip(e.target.files ? e.target.files[0] : null)}
                    className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsWithdrawOpen(false)}
                    className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={withSubmitting}
                    className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {withSubmitting ? 'Debiting...' : 'Debit Withdrawal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
