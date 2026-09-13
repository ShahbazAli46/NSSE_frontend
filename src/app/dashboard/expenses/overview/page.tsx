'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useRealtime } from '@/lib/realtime';
import CustomMonthPicker from '@/components/CustomMonthPicker';
import { 
  PieChart, 
  TrendingUp, 
  Receipt, 
  Layers, 
  Search, 
  Banknote,
  Percent,
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  Sparkles,
  Building2,
  Calendar
} from 'lucide-react';

interface CategoryOverview {
  name: string;
  description?: string;
  total_amount: number;
  total_count: number;
  percentage: number;
  avg_per_voucher: number;
}

interface OverviewData {
  year: number;
  month?: string;
  available_years: number[];
  grand_total: number;
  total_vouchers: number;
  highest_category: { name: string; amount: number; percentage: number } | null;
  active_categories_count: number;
  avg_per_voucher: number;
  categories: CategoryOverview[];
}

const getCurrentMonthString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export default function ExpensesOverviewPage() {
  const router = useRouter();
  const [data, setData] = useState<OverviewData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [expenseType, setExpenseType] = useState<'all' | 'general' | 'director'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthString());
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { lastEventTimestamp } = useRealtime();

  const fetchOverview = async () => {
    setIsLoading(true);
    try {
      let url = '/expenses/overview?';
      if (selectedMonth) url += `month=${selectedMonth}&`;
      if (expenseType !== 'all') url += `expense_type=${expenseType}&`;
      const res = await api.get<OverviewData>(url);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [selectedMonth, expenseType, lastEventTimestamp]);

  const filteredCategories = data?.categories.filter((cat) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      cat.name.toLowerCase().includes(q) ||
      (cat.description && cat.description.toLowerCase().includes(q))
    );
  }) || [];

  return (
    <div className="space-y-6">
      
      {/* Header & Quick Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-[#0B462C]" />
            <span>Paid Expenses Category Overview</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Institutional expenditure distribution across categories for all completed & disbursed payments.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            href="/dashboard/expenses"
            className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:border-[#0B462C] text-gray-700 hover:text-[#0B462C] text-xs font-bold transition-all shadow-xs flex items-center gap-2"
          >
            <Receipt className="w-4 h-4 text-[#0B462C]" />
            <span>Open Expense Ledger</span>
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Month Selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-600 shrink-0">
              Month:
            </label>
            <div className="w-auto shrink-0">
              <CustomMonthPicker
                value={selectedMonth}
                onChange={(m) => setSelectedMonth(m)}
                placeholder="All Months"
                allowClear={true}
              />
            </div>
          </div>

          {/* Expense Type Switcher */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs font-bold shrink-0">
            <button
              type="button"
              onClick={() => setExpenseType('all')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                expenseType === 'all' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Types
            </button>
            <button
              type="button"
              onClick={() => setExpenseType('general')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                expenseType === 'general' ? 'bg-white text-[#0B462C] shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🏫 General
            </button>
            <button
              type="button"
              onClick={() => setExpenseType('director')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                expenseType === 'director' ? 'bg-white text-purple-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              💎 Director Capital
            </button>
          </div>
        </div>

        {/* Category Search */}
        <div className="relative flex-1 w-full lg:max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search categories or descriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-[#0B462C] outline-none transition-colors"
          />
        </div>
      </div>

      {/* Executive Summary KPI Cards (Strictly Paid Expenses) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        
        {/* KPI 1: Total Disbursed Spend */}
        <div className="bg-white rounded-2xl p-4 sm:p-4.5 border border-gray-100 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Total Paid Spend ({selectedMonth || 'All Months'})
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#0B462C] flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-lg font-black text-gray-900 tracking-tight">
              {isLoading ? '...' : `PKR ${data?.grand_total?.toLocaleString() || '0'}`}
            </div>
            <div className="text-[11px] text-gray-500 font-medium mt-0.5">
              Across {data?.total_vouchers || 0} completed payments
            </div>
          </div>
        </div>

        {/* KPI 2: Top Spending Category */}
        <div className="bg-white rounded-2xl p-4 sm:p-4.5 border border-gray-100 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Top Spending Category
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-sm font-extrabold text-gray-900 truncate">
              {isLoading ? '...' : data?.highest_category?.name || 'None'}
            </div>
            <div className="text-[11px] text-amber-800 font-bold mt-0.5 flex items-center gap-1">
              <span>PKR {data?.highest_category?.amount?.toLocaleString() || '0'}</span>
              <span className="text-[10px] text-gray-500 font-normal">
                ({data?.highest_category?.percentage || 0}% of total)
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: Active Categories */}
        <div className="bg-white rounded-2xl p-4 sm:p-4.5 border border-gray-100 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Active Categories
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-lg font-black text-purple-900 tracking-tight">
              {isLoading ? '...' : `${data?.active_categories_count || 0}`}
            </div>
            <div className="text-[11px] text-purple-700 font-semibold mt-0.5">
              Out of {data?.categories?.length || 0} configured
            </div>
          </div>
        </div>

      </div>

      {/* ================= CATEGORY BREAKDOWN TABLE ================= */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-gray-900">
              Paid Expenses by Category ({selectedMonth || 'All Months'})
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Ranked in descending order by total disbursed expenditure. Click any row to inspect vouchers.
            </p>
          </div>
          <span className="text-xs font-semibold text-gray-500">
            {filteredCategories.length} Categories Listed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-gray-50/80 border-b border-gray-200/80 text-gray-600 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-5 py-3.5 w-12 text-center">#</th>
                <th className="px-5 py-3.5 min-w-[200px]">Category</th>
                <th className="px-5 py-3.5 min-w-[280px]">Scope / Description</th>
                <th className="px-5 py-3.5 text-center min-w-[120px]">Paid Vouchers</th>
                <th className="px-5 py-3.5 text-right min-w-[160px]">Total Paid Amount</th>
                <th className="px-5 py-3.5 min-w-[180px]">Budget Share</th>
                <th className="px-5 py-3.5 text-right min-w-[140px]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    Loading category overview...
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    No categories found matching &quot;{searchQuery}&quot;.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat, idx) => {
                  const targetUrl = `/dashboard/expenses?category=${encodeURIComponent(cat.name)}${selectedMonth ? `&month=${selectedMonth}` : ''}${expenseType !== 'all' ? `&expense_type=${expenseType}` : ''}`;
                  return (
                    <tr
                      key={cat.name}
                      onClick={() => router.push(targetUrl)}
                      className="hover:bg-emerald-50/50 transition-colors group cursor-pointer"
                    >
                      {/* Rank Index */}
                      <td className="px-5 py-4 text-center font-bold text-gray-400 group-hover:text-[#0B462C]">
                        {idx + 1}
                      </td>

                      {/* Category Name */}
                      <td className="px-5 py-4 font-bold text-gray-900 group-hover:text-[#0B462C]">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#0B462C]/40 group-hover:bg-[#0B462C]" />
                          <span>{cat.name}</span>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="px-5 py-4 text-gray-500 font-medium text-[11px] leading-relaxed">
                        {cat.description || '—'}
                      </td>

                      {/* Paid Vouchers */}
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full font-bold text-[11px] ${
                          cat.total_count > 0 
                            ? 'bg-emerald-50 text-[#0B462C] border border-emerald-200' 
                            : 'bg-gray-100 text-gray-400'
                        }`}>
                          {cat.total_count} {cat.total_count === 1 ? 'Voucher' : 'Vouchers'}
                        </span>
                      </td>

                      {/* Total Paid Amount */}
                      <td className="px-5 py-4 text-right font-black text-gray-900 text-sm whitespace-nowrap">
                        {cat.total_amount > 0 ? (
                          <span className="text-[#0B462C]">
                            Rs. {Number(cat.total_amount).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-gray-300">Rs. 0</span>
                        )}
                      </td>

                      {/* Progress Bar & % Share */}
                      <td className="px-5 py-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className={cat.percentage > 0 ? 'text-[#0B462C]' : 'text-gray-400'}>
                              {cat.percentage}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-[#0B462C] h-2 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, Math.max(0, cat.percentage))}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Action Button */}
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(targetUrl);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 group-hover:border-[#0B462C] group-hover:bg-[#0B462C] group-hover:text-white font-bold text-gray-700 text-xs transition-all cursor-pointer shadow-2xs"
                        >
                          <span>View Spending</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Table Footer */}
            {data && data.categories.length > 0 && (
              <tfoot className="bg-[#0B462C]/5 border-t-2 border-[#0B462C]/20 font-bold">
                <tr>
                  <td colSpan={3} className="px-5 py-4 uppercase text-[#0B462C] font-extrabold tracking-wider text-xs">
                    Total Paid Institutional Expenditure
                  </td>
                  <td className="px-5 py-4 text-center font-extrabold text-gray-900 text-xs">
                    {data.total_vouchers} Vouchers
                  </td>
                  <td className="px-5 py-4 text-right font-black text-sm text-[#0B462C] whitespace-nowrap">
                    Rs. {Number(data.grand_total).toLocaleString()}
                  </td>
                  <td className="px-5 py-4 font-black text-[#0B462C] text-xs">
                    100% Allocated
                  </td>
                  <td className="px-5 py-4 text-right text-gray-500 font-semibold text-[11px]">
                    All Categories
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

    </div>
  );
}
