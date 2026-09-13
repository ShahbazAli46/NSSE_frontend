'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { 
  api, 
  getStoredUser, 
  downloadBlob,
  User, 
  Expense, 
  FinancialSummary, 
  getTierInfo, 
  getAttachmentUrl,
  formatDisplayDate 
} from '@/lib/api';
import CustomDropdown from '@/components/CustomDropdown';
import CustomMonthPicker from '@/components/CustomMonthPicker';
import { 
  Receipt, 
  Eye, 
  Landmark, 
  Wallet, 
  RefreshCw, 
  Search, 
  ExternalLink, 
  X, 
  PieChart,
  ArrowRight,
  Download,
  Building,
  Building2,
  Calendar,
  Sparkles,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import DirectorEquityDashboard from '@/components/DirectorEquityDashboard';

export default function DirectorPortalPage() {
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'equity' | 'director_expenses' | 'general_expenses' | 'financials'>('equity');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // General Expenses Tab Filters & Data
  const [tierFilter, setTierFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Bank & Summary Data
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [statement, setStatement] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Dedicated Director Expenses Report State
  const [dirExpenses, setDirExpenses] = useState<any[]>([]);
  const [dirExpenseSummary, setDirExpenseSummary] = useState<any | null>(null);
  const [selectedDirId, setSelectedDirId] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [dirCategoryFilter, setDirCategoryFilter] = useState<string>('');
  const [dirSearchQuery, setDirSearchQuery] = useState<string>('');
  const [directorsList, setDirectorsList] = useState<any[]>([]);
  const [categoriesList, setCategoriesList] = useState<{ id: number; name: string }[]>([]);
  const [isLoadingDirExp, setIsLoadingDirExp] = useState<boolean>(false);
  const [isExportingDirPdf, setIsExportingDirPdf] = useState<boolean>(false);

  // Document Viewer Modal
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);

  // Initial Data Fetch
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [sumRes, expRes, stmtRes, dirRes, catRes] = await Promise.allSettled([
        api.get<FinancialSummary>('/financial-summary'),
        api.get<any>(`/expenses?expense_type=general&${tierFilter ? `tier=${tierFilter}&` : ''}${searchQuery ? `search=${encodeURIComponent(searchQuery)}&` : ''}`),
        api.get<any>('/bank/statement'),
        api.get<any>('/directors'),
        api.get<any>('/categories'),
      ]);

      if (sumRes.status === 'fulfilled') setSummary(sumRes.value);
      if (expRes.status === 'fulfilled') setExpenses(expRes.value?.data || []);
      if (stmtRes.status === 'fulfilled') setStatement(stmtRes.value?.data || []);
      if (dirRes.status === 'fulfilled') setDirectorsList(dirRes.value?.data || []);
      if (catRes.status === 'fulfilled') setCategoriesList(catRes.value?.data || catRes.value || []);
    } catch (err) {
      console.error('Failed to load executive data', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Dedicated Fetch for Director Expenses Report
  const fetchDirectorExpenses = async () => {
    setIsLoadingDirExp(true);
    try {
      const params = new URLSearchParams();
      if (selectedDirId) params.append('director_id', selectedDirId);
      if (selectedMonth) params.append('month', selectedMonth);
      if (dirCategoryFilter) params.append('category', dirCategoryFilter);
      if (dirSearchQuery) params.append('search', dirSearchQuery);

      const res: any = await api.get(`/directors/expenses-report?${params.toString()}`);
      setDirExpenses(res?.data || []);
      setDirExpenseSummary(res?.summary || null);
    } catch (err) {
      console.error('Failed to load director expenses report', err);
    } finally {
      setIsLoadingDirExp(false);
    }
  };

  useEffect(() => {
    setUser(getStoredUser());
    fetchData();
  }, [tierFilter, searchQuery]);

  useEffect(() => {
    if (activeTab === 'director_expenses') {
      fetchDirectorExpenses();
    }
  }, [activeTab, selectedDirId, selectedMonth, dirCategoryFilter, dirSearchQuery]);

  // Export Director Expenses Report PDF
  const handleExportDirPdf = async () => {
    setIsExportingDirPdf(true);
    try {
      const params = new URLSearchParams();
      if (selectedDirId) params.append('director_id', selectedDirId);
      if (selectedMonth) params.append('month', selectedMonth);
      if (dirCategoryFilter) params.append('category', dirCategoryFilter);
      await downloadBlob(
        `/directors/expenses-report/export-pdf?${params.toString()}`,
        `Director_Expenses_Audit_${selectedMonth || 'all'}.pdf`
      );
    } catch (err: any) {
      alert(err.message || 'Failed to export Director Expenses PDF.');
    } finally {
      setIsExportingDirPdf(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 🧭 NAVIGATION TABS STRIP */}
      <div className="bg-white rounded-2xl border border-gray-200/90 p-1.5 shadow-xs flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('equity')}
            className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'equity'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>Partners & Equity Cockpit</span>
          </button>

          <button
            onClick={() => setActiveTab('director_expenses')}
            className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'director_expenses'
                ? 'bg-purple-800 text-white shadow-xs ring-2 ring-purple-400/30'
                : 'text-purple-800 bg-purple-50 hover:bg-purple-100 font-extrabold'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Director Expenses Report</span>
            <span className="px-1.5 py-0.2 rounded-md text-[10px] bg-white/20 text-white font-mono">CAPEX</span>
          </button>

          <button
            onClick={() => setActiveTab('general_expenses')}
            className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'general_expenses'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>General School Expenses</span>
          </button>

          <button
            onClick={() => setActiveTab('financials')}
            className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'financials'
                ? 'bg-[#0B462C] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Landmark className="w-4 h-4" />
            <span>Bank & Cash Drawer Balances</span>
          </button>
        </div>

        <button
          onClick={() => {
            fetchData();
            if (activeTab === 'director_expenses') fetchDirectorExpenses();
          }}
          className="p-2 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-all cursor-pointer mr-1"
          title="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading || isLoadingDirExp ? 'animate-spin text-[#0B462C]' : ''}`} />
        </button>
      </div>

      {/* ================= 🏢 MAIN CONTENT CONTAINER ================= */}
      <div className="space-y-6">

        {/* ───────────────────────────────────────────────────────────── */}
        {/* TAB 1: 🥧 PARTNERS & EQUITY COCKPIT */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeTab === 'equity' && (
          <div className="space-y-6">
            <DirectorEquityDashboard />
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* TAB 2: 🏛️ DEDICATED DIRECTOR EXPENSES REPORT */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeTab === 'director_expenses' && (
          <div className="space-y-4">
            {/* Header & Metric Banner */}
            <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
              <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white/20 text-purple-200 uppercase tracking-wider">
                      Equity Capital Inflow Report
                    </span>
                    <span className="text-xs text-purple-200">• Certified Partner Audit</span>
                  </div>
                  <h2 className="text-xl font-black mt-1">Director-Paid Capital Expenses & Asset Ledger</h2>
                  <p className="text-xs text-purple-200/90 font-medium max-w-xl mt-1">
                    Every asset or expense paid by a director out-of-pocket directly adds to their personal equity capital holding.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleExportDirPdf}
                    disabled={isExportingDirPdf}
                    className="px-4 py-2.5 rounded-xl bg-white text-purple-900 hover:bg-purple-50 text-xs font-black shadow-sm flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isExportingDirPdf ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    {isExportingDirPdf ? 'Generating PDF...' : 'Download Certified PDF'}
                  </button>
                </div>
              </div>

              {/* Summary Stats Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-white/10">
                <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10">
                  <span className="text-[11px] font-bold text-purple-200 uppercase block">Total Capital Expenses Paid</span>
                  <span className="text-2xl font-black font-mono mt-0.5 block">
                    Rs. {dirExpenseSummary ? Number(dirExpenseSummary.total_amount).toLocaleString('en-PK') : '0'}
                  </span>
                </div>
                <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10">
                  <span className="text-[11px] font-bold text-purple-200 uppercase block">Total Items / Invoices</span>
                  <span className="text-2xl font-black font-mono mt-0.5 block">
                    {dirExpenseSummary ? dirExpenseSummary.total_count : 0} Assets / Transactions
                  </span>
                </div>
                <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10">
                  <span className="text-[11px] font-bold text-purple-200 uppercase block">Director Contributions</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {dirExpenseSummary?.breakdown_by_director?.map((b: any, idx: number) => (
                      <span key={idx} className="px-2 py-0.5 rounded-lg bg-white/20 text-[11px] font-bold">
                        {b.director_name}: Rs. {Number(b.total_amount).toLocaleString('en-PK')}
                      </span>
                    ))}
                    {(!dirExpenseSummary?.breakdown_by_director || dirExpenseSummary.breakdown_by_director.length === 0) && (
                      <span className="text-xs text-purple-300">No data recorded yet</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Controls Bar */}
            <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search item, vendor, solar, MOU, voucher..."
                  value={dirSearchQuery}
                  onChange={(e) => setDirSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:border-purple-600"
                />
              </div>

              {/* Director Filter */}
              <div className="w-48">
                <CustomDropdown
                  options={[
                    { value: '', label: 'All Directors', icon: '👥' },
                    ...directorsList.map(d => ({ value: String(d.id), label: d.name, icon: '👤' }))
                  ]}
                  value={selectedDirId}
                  onChange={setSelectedDirId}
                />
              </div>

              {/* Category Filter */}
              <div className="w-44">
                <CustomDropdown
                  options={[
                    { value: '', label: 'All Categories', icon: '📁' },
                    ...categoriesList.map(c => ({ value: c.name, label: c.name, icon: '🏷️' }))
                  ]}
                  value={dirCategoryFilter}
                  onChange={setDirCategoryFilter}
                />
              </div>

              {/* Month Filter */}
              <div className="w-44">
                <CustomMonthPicker
                  value={selectedMonth}
                  onChange={setSelectedMonth}
                  placeholder="All Time History"
                />
              </div>
            </div>

            {/* Director Expenses Table Card */}
            <div className="bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-800">
                  <thead className="bg-purple-50 text-purple-900 font-bold uppercase tracking-wider text-[11px] border-b border-purple-100">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Paid By Director</th>
                      <th className="py-3 px-4">Asset / Item Particulars</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Payment Mode</th>
                      <th className="py-3 px-4 text-right">Amount (PKR)</th>
                      <th className="py-3 px-4 text-center">Receipt Bill</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {isLoadingDirExp ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-gray-500">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-700" />
                          Loading Director Expenses Ledger...
                        </td>
                      </tr>
                    ) : dirExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-gray-400">
                          No director-paid expenses found matching your filter.
                        </td>
                      </tr>
                    ) : (
                      dirExpenses.map((item: any) => (
                        <tr key={item.id} className="hover:bg-purple-50/40 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-[11px] text-gray-600 whitespace-nowrap">
                            {formatDisplayDate(item.disbursed_at || item.created_at)}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 font-bold flex items-center justify-center text-xs">
                                {item.director?.name?.charAt(0) || 'D'}
                              </div>
                              <div>
                                <span className="font-extrabold text-gray-900 block">{item.director?.name || 'Director'}</span>
                                <span className="text-[10px] text-purple-700 font-bold">Capital Credit (+)</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-gray-900">{item.title}</div>
                            {item.description && item.description !== item.title && (
                              <div className="text-[11px] text-gray-500 mt-0.5">{item.description}</div>
                            )}
                            {item.payment_reference && (
                              <div className="text-[10px] text-purple-700 font-mono mt-0.5">Ref: {item.payment_reference}</div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-gray-100 text-gray-700">
                              {item.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap text-gray-600">
                            {item.payment_method || 'Director Personal Funds'}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-black text-sm text-purple-900 whitespace-nowrap">
                            + Rs. {Number(item.amount).toLocaleString('en-PK')}
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            {item.receipt_url ? (
                              <button
                                onClick={() => setPreviewDocUrl(getAttachmentUrl(item.receipt_url))}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold text-[11px] transition-all cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" /> View Slip
                              </button>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* TAB 3: 💸 GENERAL SCHOOL EXPENSES REPORT (OPERATIONAL) */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeTab === 'general_expenses' && (
          <div className="space-y-4">
            {/* Search & Filter Bar */}
            <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search operational school expenses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:border-[#0B462C]"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTierFilter('')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    !tierFilter ? 'bg-[#0B462C] text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All Tiers
                </button>
                <button
                  onClick={() => setTierFilter('4')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    tierFilter === '4' ? 'bg-rose-700 text-white shadow-xs' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  🔴 High-Value Tier 4
                </button>
              </div>
            </div>

            {/* Expenses List Card */}
            <div className="bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-800">
                  <thead className="bg-gray-50 text-gray-600 font-bold uppercase tracking-wider text-[11px] border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Expense Title & Description</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Tier & Risk</th>
                      <th className="py-3 px-4 text-right">Amount (PKR)</th>
                      <th className="py-3 px-4 text-center">Receipt Bill</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {expenses.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-gray-400">
                          No operational school expenses found.
                        </td>
                      </tr>
                    ) : (
                      expenses.map((exp) => {
                        const tier = getTierInfo(Number(exp.amount));
                        return (
                          <tr key={exp.id} className="hover:bg-gray-50/80 transition-colors">
                            <td className="py-3 px-4 font-mono text-[11px] text-gray-600 whitespace-nowrap">
                              {formatDisplayDate(exp.created_at)}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-gray-900">{exp.title}</div>
                              {exp.description && (
                                <div className="text-[11px] text-gray-500 mt-0.5">{exp.description}</div>
                              )}
                              <div className="text-[10px] text-gray-400 mt-0.5">
                                Logged by: <span className="font-semibold text-gray-600">{exp.creator?.name || 'Accountant'}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-gray-700">
                                {exp.category}
                              </span>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${tier.badgeBg}`}>
                                {tier.label}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-black text-sm text-gray-900 whitespace-nowrap">
                              Rs. {Number(exp.amount).toLocaleString('en-PK')}
                            </td>
                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              {exp.receipt_url ? (
                                <button
                                  onClick={() => setPreviewDocUrl(getAttachmentUrl(exp.receipt_url))}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[11px] transition-all cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" /> View Bill
                                </button>
                              ) : (
                                <span className="text-gray-300">—</span>
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
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* TAB 4: 🏦 FINANCIAL COCKPIT (BANK & CASH DRAWER) */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeTab === 'financials' && (
          <div className="space-y-6">
            {/* Top 3 Live Financial Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Bank Balance */}
              <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                    Institutional Bank Balance
                  </span>
                  <div className="text-2xl font-black font-mono text-[#0B462C] mt-1">
                    Rs. {summary ? Number(summary.bank_balance).toLocaleString('en-PK') : '0'}
                  </div>
                  <p className="text-[11px] text-gray-400 font-medium mt-1">Govt Grants & Tranches</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[#E6F4ED] text-[#0B462C] flex items-center justify-center font-bold text-xl">
                  🏛️
                </div>
              </div>

              {/* Card 2: Physical Cash in Drawer */}
              <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                    Physical Cash in Drawer
                  </span>
                  <div className="text-2xl font-black font-mono text-emerald-700 mt-1">
                    Rs. {summary ? Number(summary.cash_in_hand).toLocaleString('en-PK') : '0'}
                  </div>
                  <p className="text-[11px] text-gray-400 font-medium mt-1">Liquid Cash for Campus Operations</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xl">
                  💵
                </div>
              </div>

              {/* Card 3: Month Operational Expenses */}
              <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                    {summary?.month_name || 'This Month'} Expenses
                  </span>
                  <div className="text-2xl font-black font-mono text-rose-700 mt-1">
                    Rs. {summary ? Number(summary.month_expenses).toLocaleString('en-PK') : '0'}
                  </div>
                  <p className="text-[11px] text-gray-400 font-medium mt-1">Monthly Disbursed Total</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold text-xl">
                  📉
                </div>
              </div>
            </div>

            {/* Bank Passbook Stream Table */}
            <div className="bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-xs">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/80">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Chronological Bank Passbook Feed</h3>
                  <p className="text-xs text-gray-500">Government Grants (Credits) & Cashed Cheques (Debits)</p>
                </div>
                <Link
                  href="/dashboard/expenses"
                  className="text-xs font-bold text-[#0B462C] hover:underline flex items-center gap-1"
                >
                  View Full Passbook <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-800">
                  <thead className="bg-gray-50 text-gray-600 font-bold uppercase tracking-wider text-[11px] border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Particulars & Reference</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4 text-right text-emerald-700">Credit (+)</th>
                      <th className="py-3 px-4 text-right text-rose-700">Debit (-)</th>
                      <th className="py-3 px-4 text-right font-mono">Bank Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {statement.slice(0, 8).map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono text-[11px] text-gray-600 whitespace-nowrap">
                          {formatDisplayDate(item.date)}
                        </td>
                        <td className="py-3 px-4 font-bold text-gray-900">
                          {item.title}
                          {item.reference && (
                            <span className="text-[10px] text-gray-400 font-mono block">Ref: {item.reference}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-gray-700">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                          {item.credit > 0 ? `+ Rs. ${Number(item.credit).toLocaleString('en-PK')}` : '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-rose-700 whitespace-nowrap">
                          {item.debit > 0 ? `- Rs. ${Number(item.debit).toLocaleString('en-PK')}` : '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-gray-900 whitespace-nowrap">
                          Rs. {Number(item.running_balance).toLocaleString('en-PK')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= 🔮 RECEIPT / DOCUMENT MODAL ================= */}
      {previewDocUrl && isMounted && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className="relative max-w-2xl max-h-[90vh] bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-2xl flex flex-col w-full">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <span className="text-xs font-bold text-gray-700">Attached Expense Bill / Voucher</span>
              <div className="flex items-center gap-2">
                <a
                  href={previewDocUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button 
                  onClick={() => setPreviewDocUrl(null)} 
                  className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-4 overflow-auto flex items-center justify-center max-h-[80vh] bg-gray-100">
              {previewDocUrl.endsWith('.pdf') ? (
                <iframe src={previewDocUrl} className="w-full h-[500px] rounded-xl" />
              ) : (
                <img
                  src={previewDocUrl}
                  alt="Bill / Slip"
                  className="max-h-[75vh] max-w-full object-contain rounded-xl shadow-md"
                />
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
