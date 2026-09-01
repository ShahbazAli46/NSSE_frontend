'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  api, 
  getStoredUser, 
  clearSession, 
  User, 
  Expense, 
  FinancialSummary, 
  getTierInfo, 
  getAttachmentUrl,
  formatDisplayDate 
} from '@/lib/api';
import { 
  Receipt, 
  Eye, 
  LogOut, 
  Landmark, 
  Wallet, 
  RefreshCw, 
  Search, 
  Filter, 
  ExternalLink, 
  X, 
  BarChart3, 
  PieChart,
  ShieldCheck, 
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  CreditCard,
  Building2,
  Users
} from 'lucide-react';
import DirectorEquityDashboard from '@/components/DirectorEquityDashboard';
import SuperAdminDashboard from '@/components/SuperAdminDashboard';

export default function DirectorPortalPage() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'equity' | 'financials' | 'expenses' | 'staff'>('equity');
  const [tierFilter, setTierFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data States
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [statement, setStatement] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Document Viewer Modal
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [sumRes, expRes, stmtRes] = await Promise.allSettled([
        api.get<FinancialSummary>('/financial-summary'),
        api.get<any>(`/expenses?${tierFilter ? `tier=${tierFilter}&` : ''}${searchQuery ? `search=${encodeURIComponent(searchQuery)}&` : ''}`),
        api.get<any>('/bank/statement'),
      ]);

      if (sumRes.status === 'fulfilled') setSummary(sumRes.value);
      if (expRes.status === 'fulfilled') setExpenses(expRes.value?.data || []);
      if (stmtRes.status === 'fulfilled') setStatement(stmtRes.value?.data || []);
    } catch (err) {
      console.error('Failed to load executive data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setUser(getStoredUser());
    fetchData();
  }, [tierFilter, searchQuery]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 🧭 NAVIGATION TABS STRIP (Clean & Non-Sticky) */}
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

          <button
            onClick={() => setActiveTab('expenses')}
            className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'expenses'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Live Expense Audits</span>
          </button>
        </div>

        <button
          onClick={fetchData}
          className="p-2 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-all cursor-pointer mr-1"
          title="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#0B462C]' : ''}`} />
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
        {/* TAB 2: 🏦 FINANCIAL COCKPIT (BANK & CASH DRAWER) */}
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

        {/* ───────────────────────────────────────────────────────────── */}
        {/* TAB 3: 💸 LIVE EXPENSE AUDITS & ATTACHMENT VIEWER */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeTab === 'expenses' && (
          <div className="space-y-4">
            {/* Search & Filter Bar */}
            <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search expense title, category or vendor..."
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
                          No expenses found matching the filter.
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
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-[11px] transition-all cursor-pointer"
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
      </div>

      {/* ================= 🔮 RECEIPT / DOCUMENT MODAL ================= */}
      {previewDocUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
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
        </div>
      )}
    </div>
  );
}
