'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Gift, 
  Printer, 
  ArrowLeft, 
  RefreshCw, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Building2, 
  Wallet, 
  ShieldCheck, 
  Users, 
  TrendingUp,
  Award,
  Layers,
  Calendar
} from 'lucide-react';
import { api, User } from '@/lib/api';

interface BonusReportItem {
  id: string;
  payroll_id: number;
  month: string;
  staff_id: number;
  staff_type: 'teacher' | 'non_teaching';
  staff_name: string;
  designation: string;
  base_salary: number;
  bonus_title: string;
  bonus_amount: number;
  total_bonuses: number;
  net_salary: number;
  payment_method: 'bank' | 'cash';
  bank_name?: string | null;
  status: string;
  approved_by?: string | null;
  approved_at?: string | null;
  paid_at?: string | null;
  remarks?: string | null;
}

interface BonusReportStats {
  total_bonus_amount: number;
  total_recipients: number;
  total_awards_count: number;
  average_bonus: number;
  by_category: Record<string, number>;
}

export default function BonusReportPage() {
  const [month, setMonth] = useState<string>('2026-08');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'teaching' | 'non_teaching'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [bonuses, setBonuses] = useState<BonusReportItem[]>([]);
  const [stats, setStats] = useState<BonusReportStats>({
    total_bonus_amount: 0,
    total_recipients: 0,
    total_awards_count: 0,
    average_bonus: 0,
    by_category: {},
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchBonusReport = async () => {
    setIsLoading(true);
    try {
      const res: any = await api.get(`/payroll/reports/bonuses?month=${month}&type=${categoryFilter}`);
      const data = res?.data || res;
      setBonuses(data?.bonuses || []);
      if (data?.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load bonus report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBonusReport();
  }, [month, categoryFilter]);

  const changeMonthBy = (offset: number) => {
    try {
      const parts = month.split('-');
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1 + offset, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      setMonth(`${y}-${m}`);
    } catch {
      setMonth('2026-08');
    }
  };

  const formattedMonthString = useMemo(() => {
    if (month === 'all') return 'All Academic Sessions';
    try {
      const d = new Date(month + '-01T00:00:00');
      return d.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return month;
    }
  }, [month]);

  const filteredBonuses = useMemo(() => {
    return bonuses.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      return (
        !q ||
        item.staff_name.toLowerCase().includes(q) ||
        item.designation.toLowerCase().includes(q) ||
        item.bonus_title.toLowerCase().includes(q) ||
        (item.remarks && item.remarks.toLowerCase().includes(q))
      );
    });
  }, [bonuses, searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-3 sm:p-6 space-y-6">
      
      {/* Top Breadcrumb & Actions Bar (Hidden on print) */}
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 shadow-xs print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 transition cursor-pointer"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-gray-900">
                Staff Bonus & Incentive Report
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-[#0B462C] border border-emerald-200 uppercase">
                Principal Authorization
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium">
              Official Executive Rewards & Allowances Ledger • Nawaz Sharif School of Eminence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl bg-[#0B462C] hover:bg-[#062E1C] text-[#E8D4A2] font-black text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#C5A059]" />
            <span>Print Bonus Report (A4)</span>
          </button>
        </div>
      </div>

      {/* Printable Institutional Header (Visible on print) */}
      <div className="hidden print:flex items-center justify-between border-b-2 border-black pb-4 max-w-6xl mx-auto">
        <div className="w-16 h-16 relative shrink-0">
          <Image
            src="/logo.png"
            alt="NSSE Logo"
            width={64}
            height={64}
            className="object-contain"
            priority
          />
        </div>

        <div className="text-center flex-1 px-4">
          <h1 className="text-xl font-black text-black font-cinzel tracking-wider uppercase">
            Nawaz Sharif School of Eminence
          </h1>
          <p className="text-xs font-bold text-gray-700 font-cinzel tracking-widest uppercase mt-0.5">
            Chunian Campus • Executive Office of the Principal
          </p>
          <div className="inline-block px-3 py-0.5 mt-1 rounded bg-gray-100 border border-gray-400 text-xs font-black uppercase tracking-wider text-black">
            Official Bonus & Incentive Disbursement Report — {formattedMonthString}
          </div>
        </div>

        <div className="text-right text-xs text-black font-bold shrink-0 space-y-0.5">
          <div className="text-[10px] text-gray-500 uppercase font-bold">Doc Ref</div>
          <div className="font-mono text-xs font-black">REP-BONUS-{month}</div>
          <div className="text-[10px] text-gray-600 font-semibold">Authorized Audit Record</div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-4">
        <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Bonuses Awarded</span>
            <Gift className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-[#0B462C] mt-1 font-mono">
            PKR {Number(stats.total_bonus_amount || 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-gray-400 font-medium">Executive incentive pool</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Beneficiary Staff</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-black text-gray-900 mt-1">
            {stats.total_recipients} <span className="text-xs font-semibold text-gray-500">Personnel</span>
          </div>
          <span className="text-[10px] text-gray-400 font-medium">Recipients count</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Average Bonus</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-black text-gray-900 mt-1 font-mono">
            PKR {Number(stats.average_bonus || 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-gray-400 font-medium">Per beneficiary</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Authority Status</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-sm font-black text-emerald-800 mt-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Principal Approved</span>
          </div>
          <span className="text-[10px] text-gray-400 font-medium">Executive Clearance</span>
        </div>
      </div>

      {/* Bonus Category Breakdown Pill Bar */}
      {Object.keys(stats.by_category || {}).length > 0 && (
        <div className="max-w-6xl mx-auto bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs space-y-2">
          <div className="text-xs font-bold text-gray-600 uppercase tracking-wider">
            Incentive Purpose Breakdown
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {Object.entries(stats.by_category).map(([catTitle, catAmount]) => (
              <div
                key={catTitle}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs flex items-center gap-2 font-bold text-emerald-950"
              >
                <span>{catTitle}</span>
                <span className="font-mono text-emerald-700 font-black">PKR {Number(catAmount).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters and Search Bar (Hidden on print) */}
      <div className="max-w-6xl mx-auto bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        
        {/* Month Selector */}
        <div className="inline-flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
          <button
            type="button"
            onClick={() => changeMonthBy(-1)}
            className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 transition cursor-pointer"
            title="Previous Month"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <span className="px-3 text-xs font-black text-gray-900">
            {formattedMonthString}
          </span>

          <button
            type="button"
            onClick={() => changeMonthBy(1)}
            className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 transition cursor-pointer"
            title="Next Month"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Staff Filter */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-100 border border-gray-200/60">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              categoryFilter === 'all'
                ? 'bg-white text-gray-900 shadow-2xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            All Staff
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
            Faculty Only
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
            Non-Teaching
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by staff name, bonus reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#0B462C] focus:outline-none transition"
          />
        </div>
      </div>

      {/* Bonus Ledger Table */}
      <div className="max-w-6xl mx-auto bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden print:border-none print:shadow-none">
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-gray-900">
              Executive Bonus Ledger • {formattedMonthString}
            </h3>
            <p className="text-xs text-gray-500 font-medium">
              Itemized records of bonuses awarded exclusively under Principal authority
            </p>
          </div>
          <span className="text-xs font-bold text-gray-500">
            {filteredBonuses.length} Line Items
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-gray-400 space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#0B462C]" />
            <p className="text-xs font-bold">Generating Bonus & Incentive audit ledger...</p>
          </div>
        ) : filteredBonuses.length === 0 ? (
          <div className="p-12 text-center text-gray-400 space-y-2">
            <Gift className="w-8 h-8 mx-auto text-gray-300" />
            <h4 className="text-sm font-bold text-gray-700">No bonuses recorded for this selection</h4>
            <p className="text-xs text-gray-400">
              Only the Principal can award bonuses in the Monthly Payroll Adjustment desk.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50/80 text-gray-500 font-bold uppercase text-[10px] tracking-wider border-b border-gray-200/70">
                  <th className="py-3 px-4 w-10 text-center">#</th>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-3">Role / Designation</th>
                  <th className="py-3 px-4">Bonus Title / Reason</th>
                  <th className="py-3 px-3 text-right">Awarded Bonus</th>
                  <th className="py-3 px-3 text-right">Base Salary</th>
                  <th className="py-3 px-3 text-center">Incentive %</th>
                  <th className="py-3 px-4">Disbursement Mode</th>
                  <th className="py-3 px-4 text-center">Approved By (Principal)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBonuses.map((b, idx) => {
                  const base = Number(b.base_salary || 0);
                  const bonusAmt = Number(b.bonus_amount || 0);
                  const percentage = base > 0 ? ((bonusAmt / base) * 100).toFixed(1) : '—';

                  return (
                    <tr key={b.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold text-gray-400">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-black text-gray-900 text-xs">{b.staff_name}</div>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded ${
                          b.staff_type === 'teacher'
                            ? 'bg-emerald-50 text-emerald-800'
                            : 'bg-amber-50 text-amber-800'
                        }`}>
                          {b.staff_type === 'teacher' ? 'Faculty' : 'Staff'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-gray-700">
                        {b.designation}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-emerald-950 block">{b.bonus_title}</span>
                        {b.remarks && (
                          <span className="text-[10px] text-gray-400 italic block">{b.remarks}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right font-black text-emerald-800 font-mono text-sm">
                        + PKR {bonusAmt.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-3 text-right font-bold text-gray-700 font-mono">
                        PKR {base.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-mono font-bold text-[10.5px]">
                          {percentage}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {b.payment_method === 'bank' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700">
                            <Building2 className="w-3 h-3" />
                            <span>{b.bank_name || 'Bank Transfer'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700">
                            <Wallet className="w-3 h-3" />
                            <span>Cash Counter</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-950 font-black text-[10.5px] border border-emerald-300">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                            <span>{b.approved_by || 'Executive Principal'}</span>
                          </span>
                          {b.approved_at && (
                            <span className="text-[9.5px] text-gray-400 mt-0.5 font-mono">
                              {new Date(b.approved_at).toLocaleDateString()}
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

      {/* Signature Clearance Blocks for Printed Report (Visible on print) */}
      <div className="hidden print:grid grid-cols-3 gap-6 pt-12 max-w-6xl mx-auto text-xs break-inside-avoid">
        <div className="space-y-10 text-center">
          <div className="border-t border-black pt-1">
            <div className="font-black text-black text-[11px] uppercase">Prepared By HR & Accounts</div>
            <div className="text-[9.5px] text-gray-500">Payroll Officer Signature</div>
          </div>
        </div>

        <div className="space-y-10 text-center">
          <div className="border-t border-black pt-1">
            <div className="font-black text-black text-[11px] uppercase">Audit & Governance Seal</div>
            <div className="text-[9.5px] text-gray-500">Accounts Committee Clearance</div>
          </div>
        </div>

        <div className="space-y-10 text-center">
          <div className="border-t border-black pt-1">
            <div className="font-black text-black text-[11px] uppercase">Executive Principal Approval</div>
            <div className="text-[9.5px] text-gray-500">Official Signature & Stamp</div>
          </div>
        </div>
      </div>

      {/* Print Styling */}
      <style jsx global>{`
        @page {
          size: A4 landscape;
          margin: 10mm;
        }
        @media print {
          html, body {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>

    </div>
  );
}
