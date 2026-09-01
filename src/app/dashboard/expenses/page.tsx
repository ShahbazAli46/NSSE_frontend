'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api, getStoredUser, User, Expense, getTierInfo, getAttachmentUrl, downloadBlob } from '@/lib/api';
import CustomDropdown, { DropdownOption } from '@/components/CustomDropdown';
import CustomDatePicker from '@/components/CustomDatePicker';
import CustomMonthPicker from '@/components/CustomMonthPicker';
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Eye, 
  X, 
  AlertCircle,
  ExternalLink,
  Receipt,
  Download,
  RefreshCw,
  PlusCircle,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

const TIER_OPTIONS: DropdownOption[] = [
  { value: '', label: 'All Amount Tiers', icon: '🎨' },
  { value: '1', label: '🟢 Tier 1: Micro (< 5k)', icon: '🟢' },
  { value: '2', label: '🔵 Tier 2: Operational (5k-25k)', icon: '🔵' },
  { value: '3', label: '🟠 Tier 3: Moderate (25k-50k)', icon: '🟠' },
  { value: '4', label: '🔴 Tier 4: High Value (> 50k)', icon: '🔴' },
];

const getCurrentMonthString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

function ExpensesContent() {
  const searchParams = useSearchParams();
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [summary, setSummary] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [amountSort, setAmountSort] = useState<'default' | 'asc' | 'desc'>('default');

  const sortedExpenses = useMemo(() => {
    if (amountSort === 'desc') {
      return [...expenses].sort((a, b) => Number(b.amount) - Number(a.amount));
    }
    if (amountSort === 'asc') {
      return [...expenses].sort((a, b) => Number(a.amount) - Number(b.amount));
    }
    return expenses;
  }, [expenses, amountSort]);

  // Filters initialized directly from URL parameters
  const [selectedMonth, setSelectedMonth] = useState<string>(() => searchParams.get('month') || getCurrentMonthString());
  const [categoryFilter, setCategoryFilter] = useState<string>(() => searchParams.get('category') || '');
  const [tierFilter, setTierFilter] = useState<string>(() => searchParams.get('tier') || '');
  const [searchQuery, setSearchQuery] = useState<string>(() => searchParams.get('search') || '');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>(() => searchParams.get('search') || '');
  const [availableCategories, setAvailableCategories] = useState<{ id: number; name: string }[]>([]);

  // Sync state if URL search parameters change during navigation
  useEffect(() => {
    const monthParam = searchParams.get('month');
    const categoryParam = searchParams.get('category');
    const tierParam = searchParams.get('tier');
    const searchParam = searchParams.get('search');

    if (monthParam !== null) setSelectedMonth(monthParam);
    if (categoryParam !== null) setCategoryFilter(categoryParam);
    if (tierParam !== null) setTierFilter(tierParam);
    if (searchParam !== null) {
      setSearchQuery(searchParam);
      setDebouncedSearchQuery(searchParam);
    }
  }, [searchParams]);

  // Debounce search query to prevent page blinking
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Modals
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get<{ id: number; name: string }[]>('/categories?active_only=true');
      if (Array.isArray(res)) setAvailableCategories(res);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      let url = '/expenses?';
      if (selectedMonth) url += `month=${selectedMonth}&`;
      if (categoryFilter) url += `category=${encodeURIComponent(categoryFilter)}&`;
      if (tierFilter) url += `tier=${tierFilter}&`;
      if (debouncedSearchQuery) url += `search=${encodeURIComponent(debouncedSearchQuery)}&`;

      const res: any = await api.get(url);
      setExpenses(res?.data || []);
      setTotalAmount(res?.total_amount || 0);
      setSummary(res?.summary || null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [selectedMonth, categoryFilter, tierFilter, debouncedSearchQuery]);

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      const params = new URLSearchParams();
      if (selectedMonth) params.append('month', selectedMonth);
      if (categoryFilter) params.append('category', categoryFilter);
      if (tierFilter) params.append('tier', tierFilter);
      if (searchQuery) params.append('search', searchQuery);

      await downloadBlob(`/expenses/export-pdf?${params.toString()}`, `Expenses_Audit_${selectedMonth || 'ledger'}.pdf`);
    } catch (err: any) {
      alert(err.message || 'Failed to download PDF.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-[#0B462C]" />
            Expense Vouchers & Ledger
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Complete institutional expenditure history with color-tier governance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="px-4 py-2 rounded-xl bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-bold shadow-xs flex items-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
          >
            {isExportingPdf ? (
              <>
                <RefreshCw className="w-4 h-4 text-rose-600 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-rose-600" />
                Download Audit PDF
              </>
            )}
          </button>
          <button
            onClick={fetchExpenses}
            className="p-2 rounded-xl bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 shadow-xs transition-all cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Bar (Solid White) */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-xs flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search title, category or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 text-sm font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:border-[#0B462C] focus:ring-2 focus:ring-[#0B462C]/10 transition-all"
          />
          {isLoading && (
            <RefreshCw className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-[#0B462C] animate-spin" />
          )}
        </div>

        {/* Month Filter */}
        <div className="w-48">
          <CustomMonthPicker
            value={selectedMonth}
            onChange={setSelectedMonth}
            placeholder="All Months"
          />
        </div>

        {/* Tier Filter */}
        <div className="w-48">
          <CustomDropdown
            options={TIER_OPTIONS}
            value={tierFilter}
            onChange={setTierFilter}
            placeholder="Filter by Tier"
          />
        </div>

        {/* Category Filter */}
        <div className="w-44">
          <CustomDropdown
            options={[
              { value: '', label: 'All Categories', icon: '📁' },
              ...availableCategories.map((c) => ({ value: c.name, label: c.name, icon: '🏷️' })),
            ]}
            value={categoryFilter}
            onChange={setCategoryFilter}
            placeholder="Category"
          />
        </div>
      </div>

      {/* Summary Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200/90 rounded-2xl p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-500 uppercase">Filtered Spend</span>
            <div className="text-lg font-black font-mono text-gray-900 mt-0.5">
              Rs. {Number(totalAmount).toLocaleString('en-PK')}
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#0B462C] flex items-center justify-center font-bold text-xs">
            {expenses.length}
          </div>
        </div>

        <div className="bg-white border border-gray-200/90 rounded-2xl p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-700 uppercase">🟢 Petty (&lt; 5k)</span>
            <div className="text-base font-black font-mono text-emerald-700 mt-0.5">
              Rs. {summary?.tier_1?.amount ? Number(summary.tier_1.amount).toLocaleString() : '0'}
            </div>
          </div>
          <span className="text-xs font-bold text-gray-500">{summary?.tier_1?.count || 0} vchs</span>
        </div>

        <div className="bg-white border border-gray-200/90 rounded-2xl p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-sky-700 uppercase">🔵 Operational (5k-25k)</span>
            <div className="text-base font-black font-mono text-sky-700 mt-0.5">
              Rs. {summary?.tier_2?.amount ? Number(summary.tier_2.amount).toLocaleString() : '0'}
            </div>
          </div>
          <span className="text-xs font-bold text-gray-500">{summary?.tier_2?.count || 0} vchs</span>
        </div>

        <div className="bg-white border border-gray-200/90 rounded-2xl p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-rose-700 uppercase">🔴 High (&gt; 50k)</span>
            <div className="text-base font-black font-mono text-rose-700 mt-0.5">
              Rs. {summary?.tier_4?.amount ? Number(summary.tier_4.amount).toLocaleString() : '0'}
            </div>
          </div>
          <span className="text-xs font-bold text-gray-500">{summary?.tier_4?.count || 0} vchs</span>
        </div>
      </div>

      {/* Table (Solid White Background) */}
      <div className="bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-800 bg-white">
            <thead className="bg-gray-50 text-gray-600 font-bold uppercase tracking-wider text-[11px] border-b border-gray-200">
              <tr>
                <th className="py-3 px-3.5 text-center w-12 text-gray-500">#</th>
                <th className="py-3 px-4">Amount Tier</th>
                <th className="py-3 px-4">Title & Category</th>
                <th 
                  onClick={() => setAmountSort(prev => prev === 'default' ? 'desc' : prev === 'desc' ? 'asc' : 'default')}
                  className="py-3 px-4 cursor-pointer hover:bg-gray-100 transition select-none group"
                  title="Click to sort by amount"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Amount</span>
                    <span className="text-gray-400 group-hover:text-gray-900 transition">
                      {amountSort === 'desc' ? (
                        <ArrowDown className="w-3.5 h-3.5 text-[#0B462C] font-black" />
                      ) : amountSort === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-[#0B462C] font-black" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-gray-400" />
                      )}
                    </span>
                  </div>
                </th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Date & Author</th>
                <th className="py-3 px-4 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className={`divide-y divide-gray-100 font-medium bg-white transition-opacity duration-150 ${isLoading && expenses.length > 0 ? 'opacity-60' : 'opacity-100'}`}>
              {isLoading && expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-gray-500 bg-white">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0B462C]" />
                    Loading expenses...
                  </td>
                </tr>
              ) : sortedExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-gray-500 bg-white">
                    <Receipt className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p className="font-bold text-gray-700">
                      {debouncedSearchQuery ? `No expenses found matching "${debouncedSearchQuery}".` : 'No expenses found.'}
                    </p>
                    {debouncedSearchQuery && (
                      <p className="text-xs text-gray-400 mt-1">Try another search keyword.</p>
                    )}
                  </td>
                </tr>
              ) : (
                sortedExpenses.map((item, index) => {
                  const tier = getTierInfo(Number(item.amount));
                  return (
                    <tr key={item.id} className="hover:bg-emerald-50/30 transition-colors bg-white">
                      <td className="py-3.5 px-3.5 text-center font-mono font-bold text-gray-400 whitespace-nowrap">
                        {index + 1}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${tier.badgeBg}`}>
                          {tier.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900 text-sm">{item.title}</div>
                        <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
                          <span className="text-[#0B462C] font-semibold">{item.category}</span>
                          {item.description && <span className="truncate max-w-xs text-gray-500">• {item.description}</span>}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className={`font-black font-mono text-base ${tier.badgeText}`}>
                          Rs. {Number(item.amount).toLocaleString()}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-gray-700">
                          <span className="w-2 h-2 rounded-full bg-emerald-600" />
                          {item.payment_method || 'Cash'}
                          {item.cheque && (
                            <span className="text-[10px] bg-sky-50 text-sky-700 border border-sky-200 px-1.5 py-0.5 rounded font-mono">
                              #{item.cheque.cheque_no}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-gray-800 font-medium">{new Date(item.created_at).toLocaleDateString('en-GB')}</div>
                        <div className="text-[10px] text-gray-500">{item.creator?.name || 'Accountant'}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {item.receipt_url ? (
                          <button
                            onClick={() => setPreviewDocUrl(getAttachmentUrl(item.receipt_url))}
                            className="inline-flex px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#0B462C] border border-[#0B462C]/20 text-[11px] font-bold items-center gap-1 transition-all cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            View Bill
                          </button>
                        ) : (
                          <span className="text-gray-400 text-[11px]">No Bill</span>
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

      {/* Full Screen Bill Preview */}
      {previewDocUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="relative max-w-4xl max-h-[90vh] bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <span className="text-xs font-bold text-gray-800">Attached Bill Preview</span>
              <button
                onClick={() => setPreviewDocUrl(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 overflow-auto flex items-center justify-center max-h-[80vh] bg-gray-100">
              <img
                src={previewDocUrl}
                alt="Bill"
                className="max-h-[75vh] max-w-full object-contain rounded-lg shadow"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExpensesPage() {
  return (
    <Suspense fallback={
      <div className="p-8 flex items-center justify-center text-gray-400">
        <RefreshCw className="w-6 h-6 animate-spin text-[#0B462C]" />
      </div>
    }>
      <ExpensesContent />
    </Suspense>
  );
}
