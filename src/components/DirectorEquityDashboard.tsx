'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  api, 
  downloadBlob, 
  formatDisplayDate, 
  Director, 
  DirectorTransactionItem, 
  DirectorSummary, 
  ProfitDistributionItem 
} from '@/lib/api';
import CustomNumberInput from '@/components/CustomNumberInput';
import CustomTextInput from '@/components/CustomTextInput';
import CustomDatePicker from '@/components/CustomDatePicker';
import CustomMonthPicker from '@/components/CustomMonthPicker';
import CustomDropdown from '@/components/CustomDropdown';
import {
  PieChart as PieChartIcon,
  PlusCircle,
  TrendingUp,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Eye,
  FileText,
  Download,
  X,
  AlertCircle,
  CheckCircle2,
  Building,
  UserCheck,
  Calendar,
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import ThreeDPieChart, { THREE_D_COLORS } from './ThreeDPieChart';

const PARTNER_COLORS = THREE_D_COLORS.map(c => ({
  stroke: c.top,
  bg: c.bg,
  text: c.text,
  fill: c.top
}));

export default function DirectorEquityDashboard() {
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [directors, setDirectors] = useState<Director[]>([]);
  const [summary, setSummary] = useState<DirectorSummary | null>(null);
  const [recentDistributions, setRecentDistributions] = useState<ProfitDistributionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDirector, setSelectedDirector] = useState<Director | null>(null);
  const [chartMode, setChartMode] = useState<'capital' | 'equity'>('capital');

  // Statement Drawer / Modal State
  const [isStatementOpen, setIsStatementOpen] = useState(false);
  const [statementDirector, setStatementDirector] = useState<Director | null>(null);
  const [statementMonth, setStatementMonth] = useState('');
  const [statementData, setStatementData] = useState<DirectorTransactionItem[]>([]);
  const [statementMetrics, setStatementMetrics] = useState<{ opening_balance: number; current_balance: number; total_credits: number; total_debits: number } | null>(null);
  const [isLoadingStatement, setIsLoadingStatement] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Modals
  const [isAddDirectorOpen, setIsAddDirectorOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isCapitalExpenseOpen, setIsCapitalExpenseOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  // Form States - Add Director
  const [newDirName, setNewDirName] = useState('');
  const [newDirShare, setNewDirShare] = useState('');
  const [newDirCnic, setNewDirCnic] = useState('');
  const [newDirPhone, setNewDirPhone] = useState('');
  const [newDirEmail, setNewDirEmail] = useState('');
  const [newDirBank, setNewDirBank] = useState('');
  const [newDirAcc, setNewDirAcc] = useState('');
  const [addDirSubmitting, setAddDirSubmitting] = useState(false);
  const [addDirError, setAddDirError] = useState('');

  // Form States - Deposit Capital
  const [depDirectorId, setDepDirectorId] = useState<string>('');
  const [depAmount, setDepAmount] = useState('');
  const [depDate, setDepDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [depMethod, setDepMethod] = useState('Bank Transfer');
  const [depRef, setDepRef] = useState('');
  const [depNotes, setDepNotes] = useState('');
  const [depSlip, setDepSlip] = useState<File | null>(null);
  const [depSubmitting, setDepSubmitting] = useState(false);
  const [depError, setDepError] = useState('');

  // Form States - Capital Usage / Expense
  const [capDirectorId, setCapDirectorId] = useState<string>('');
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
  const [withDirectorId, setWithDirectorId] = useState<string>('');
  const [withAmount, setWithAmount] = useState('');
  const [withDate, setWithDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [withMethod, setWithMethod] = useState('Bank Transfer');
  const [withRef, setWithRef] = useState('');
  const [withNotes, setWithNotes] = useState('');
  const [withSlip, setWithSlip] = useState<File | null>(null);
  const [withSubmitting, setWithSubmitting] = useState(false);
  const [withError, setWithError] = useState('');

  // Fetch Directors & Summary
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [res, catRes] = await Promise.allSettled([
        api.get('/directors'),
        api.get('/categories'),
      ]);
      if (res.status === 'fulfilled') {
        setDirectors(res.value.data || []);
        setSummary(res.value.summary || null);
        setRecentDistributions(res.value.recent_distributions || []);
        if (res.value.data && res.value.data.length > 0 && !selectedDirector) {
          setSelectedDirector(res.value.data[0]);
        }
      }
      if (catRes.status === 'fulfilled') {
        setCategories(catRes.value.data || catRes.value || []);
      }
    } catch (err: any) {
      console.error('Failed to load directors', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch Director Statement
  const fetchStatement = async (directorId: number, month = '') => {
    setIsLoadingStatement(true);
    try {
      const url = month ? `/directors/${directorId}/statement?month=${month}` : `/directors/${directorId}/statement`;
      const res = await api.get(url);
      setStatementData(res.data || []);
      setStatementMetrics({
        opening_balance: res.opening_balance || 0,
        current_balance: res.current_balance || 0,
        total_credits: res.total_credits || 0,
        total_debits: res.total_debits || 0,
      });
    } catch (err: any) {
      alert(err.message || 'Failed to fetch statement.');
    } finally {
      setIsLoadingStatement(false);
    }
  };

  const handleOpenStatement = (director: Director) => {
    setStatementDirector(director);
    setIsStatementOpen(true);
    fetchStatement(director.id, statementMonth);
  };

  // Export PDF Statement
  const handleExportStatementPdf = async () => {
    if (!statementDirector) return;
    setIsExportingPdf(true);
    try {
      const params = new URLSearchParams();
      if (statementMonth) params.append('month', statementMonth);
      await downloadBlob(
        `/directors/${statementDirector.id}/export-pdf?${params.toString()}`,
        `Director_Statement_${statementDirector.name}_${statementMonth || 'all'}.pdf`
      );
    } catch (err: any) {
      alert(err.message || 'Failed to download statement PDF.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Add Director Submit
  const handleAddDirector = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddDirError('');
    setAddDirSubmitting(true);
    try {
      await api.post('/directors', {
        name: newDirName,
        share_percentage: parseFloat(newDirShare),
        cnic: newDirCnic,
        phone: newDirPhone,
        email: newDirEmail,
        bank_name: newDirBank,
        bank_account_no: newDirAcc,
      });
      setIsAddDirectorOpen(false);
      setNewDirName('');
      setNewDirShare('');
      setNewDirCnic('');
      setNewDirPhone('');
      setNewDirEmail('');
      setNewDirBank('');
      setNewDirAcc('');
      fetchData();
    } catch (err: any) {
      setAddDirError(err.message || 'Failed to add director.');
    } finally {
      setAddDirSubmitting(false);
    }
  };

  // Deposit Capital Submit
  const handleDepositCapital = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepError('');
    setDepSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('director_id', depDirectorId);
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
      fetchData();
    } catch (err: any) {
      setDepError(err.message || 'Failed to record capital injection.');
    } finally {
      setDepSubmitting(false);
    }
  };

  // Capital Expense Submit
  const handleCapitalExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setCapError('');
    setCapSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('director_id', capDirectorId);
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
      fetchData();
    } catch (err: any) {
      setCapError(err.message || 'Failed to record capital expense.');
    } finally {
      setCapSubmitting(false);
    }
  };

  // Withdraw Submit
  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithError('');
    setWithSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('director_id', withDirectorId);
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
      fetchData();
    } catch (err: any) {
      setWithError(err.message || 'Failed to record withdrawal.');
    } finally {
      setWithSubmitting(false);
    }
  };

  // Donut Chart Math
  const chartSlices = useMemo(() => {
    if (!directors || directors.length === 0) return [];
    
    const totalCapital = directors.reduce((acc, d) => acc + (Number(d.total_capital_injected) || 0), 0);
    const totalAgreedShare = directors.reduce((acc, d) => acc + (Number(d.share_percentage) || 0), 0) || 100;
    
    // Determine percentage based on mode
    const items = directors.map((d, index) => {
      let percentage = 0;
      if (chartMode === 'capital') {
        if (totalCapital > 0) {
          percentage = Math.round(((Number(d.total_capital_injected) || 0) / totalCapital) * 1000) / 10;
        } else {
          percentage = Math.round(((Number(d.share_percentage) || 0) / totalAgreedShare) * 1000) / 10;
        }
      } else {
        percentage = Math.round(((Number(d.share_percentage) || 0) / totalAgreedShare) * 1000) / 10;
      }
      return {
        director: d,
        percentage,
        color: PARTNER_COLORS[index % PARTNER_COLORS.length],
        capital: Number(d.total_capital_injected) || 0,
      };
    });

    const activeItems = items.filter(item => item.percentage > 0);
    const hasSingleFull = activeItems.length === 1;

    let cumulative = 0;
    const totalPercentage = items.reduce((acc, item) => acc + item.percentage, 0) || 100;

    return items.map((item) => {
      const percentage = item.percentage;
      if (percentage === 0) {
        return {
          ...item,
          pathData: '',
          isFullCircle: false,
        };
      }

      if (hasSingleFull && percentage >= 99.9) {
        return {
          ...item,
          pathData: '',
          isFullCircle: true,
        };
      }

      const startAngle = (cumulative / totalPercentage) * 360;
      cumulative += percentage;
      const endAngle = (cumulative / totalPercentage) * 360;

      // SVG Arc calculations
      const radius = 80;
      const innerRadius = 48;
      const cx = 100;
      const cy = 100;

      const startRad = ((startAngle - 90) * Math.PI) / 180;
      const endRad = ((Math.min(359.99, endAngle) - 90) * Math.PI) / 180;

      const x1 = cx + radius * Math.cos(startRad);
      const y1 = cy + radius * Math.sin(startRad);
      const x2 = cx + radius * Math.cos(endRad);
      const y2 = cy + radius * Math.sin(endRad);

      const x3 = cx + innerRadius * Math.cos(endRad);
      const y3 = cy + innerRadius * Math.sin(endRad);
      const x4 = cx + innerRadius * Math.cos(startRad);
      const y4 = cy + innerRadius * Math.sin(startRad);

      const largeArc = endAngle - startAngle > 180 ? 1 : 0;
      const pathData = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;

      return {
        ...item,
        pathData,
        isFullCircle: false,
      };
    });
  }, [directors, chartMode]);

  // Selected Director for Capital Expense
  const activeCapDirector = directors.find(d => String(d.id) === capDirectorId);

  // Selected Director for Withdrawal
  const activeWithdrawDirector = directors.find(d => String(d.id) === withDirectorId);

  return (
    <div className="space-y-6">
      {/* ================= 🥧 TOP ACTIONS & EQUITY BANNER ================= */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200/80 flex items-center justify-center text-purple-700 shadow-xs">
            <PieChartIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-gray-900 leading-tight">Partners & Director Equity Cockpit</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 uppercase tracking-wider">
                Executive Portal
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Dedicated Capital Accounts, Asset & Infrastructure Usage, and Partner Ledger
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              if (directors.length > 0) setDepDirectorId(String(directors[0].id));
              setIsDepositOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <ArrowDownLeft className="w-4 h-4" />
            + Deposit Capital
          </button>

          <button
            onClick={() => {
              if (directors.length > 0) setCapDirectorId(String(directors[0].id));
              setIsCapitalExpenseOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Building className="w-4 h-4" />
            🏗️ Record Capital Usage / Expense
          </button>

          <button
            onClick={() => {
              if (directors.length > 0) setWithDirectorId(String(directors[0].id));
              setIsWithdrawOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" />
            - Withdraw Funds
          </button>
        </div>
      </div>

      {/* ================= 🥧 3D HERO ANIMATED PIE CHART SHOWCASE ================= */}
      <ThreeDPieChart
        directors={directors}
        selectedDirector={selectedDirector}
        onSelectDirector={setSelectedDirector}
        totalCapital={summary ? Number(summary.total_net_capital ?? (summary.total_capital_injected - summary.total_withdrawn)) : 0}
      />

      {/* ================= 📊 4 EXECUTIVE METRIC CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Capital Injected */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Capital Injected</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
              💎
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-black font-mono text-gray-900">
              Rs. {summary ? Number(summary.total_capital_injected).toLocaleString('en-PK') : '0'}
            </span>
          </div>
          <p className="text-[11px] text-gray-400 font-medium mt-1">
            Net Capital Holding: Rs. {summary ? Number(summary.total_net_capital ?? (summary.total_capital_injected - summary.total_withdrawn)).toLocaleString('en-PK') : '0'}
          </p>
        </div>

        {/* Card 2: Total Capital Consumed */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Capital Consumed</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
              🏗️
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-black font-mono text-amber-700">
              Rs. {summary ? Number(summary.total_capital_consumed).toLocaleString('en-PK') : '0'}
            </span>
          </div>
          <p className="text-[11px] text-gray-400 font-medium mt-1">Assets, Construction & Usage</p>
        </div>

        {/* Card 3: Total Withdrawn */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Withdrawals</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold text-xs">
              💸
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-black font-mono text-rose-700">
              Rs. {summary ? Number(summary.total_withdrawn).toLocaleString('en-PK') : '0'}
            </span>
          </div>
          <p className="text-[11px] text-gray-400 font-medium mt-1">Disbursed Drawings to Date</p>
        </div>

        {/* Card 4: Net Available Capital Reserve */}
        <div className="bg-[#0B462C] text-white border border-[#0B462C] rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider">Available Capital Reserve</span>
              <div className="w-8 h-8 rounded-xl bg-white/10 text-white flex items-center justify-center font-bold text-xs">
                🏦
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-black font-mono text-white">
                Rs. {summary ? Number(summary.total_undrawn_pool).toLocaleString('en-PK') : '0'}
              </span>
            </div>
            <p className="text-[11px] text-emerald-200/90 font-medium mt-1">Net Undrawn Partner Funds</p>
          </div>
        </div>
      </div>

      {/* ================= 👥 PARTNER ACCOUNTS & DETAILED BALANCES ================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-gray-900">Partner Capital Accounts & Usage Ledgers</h3>
            <p className="text-xs text-gray-500 font-medium">Individual deposited capital, expenditures consumed, and remaining balances</p>
          </div>
          <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-xl border border-purple-200">
            {directors.length} Registered Partners
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {directors.map((director, idx) => {
            const color = PARTNER_COLORS[idx % PARTNER_COLORS.length];
            const isSelected = selectedDirector?.id === director.id;
            return (
              <div
                key={director.id}
                onClick={() => setSelectedDirector(director)}
                className={`bg-white border rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all cursor-pointer ${
                  isSelected ? 'border-purple-600 ring-2 ring-purple-600/20' : 'border-gray-200/90'
                }`}
              >
                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-base shadow-xs"
                        style={{ backgroundColor: color.stroke }}
                      >
                        {director.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-black text-gray-900">{director.name}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${color.bg} ${color.text}`}>
                            {director.share_percentage}%
                          </span>
                        </div>
                        {director.email && (
                          <p className="text-[11px] text-gray-400 font-medium truncate max-w-[150px]">{director.email}</p>
                        )}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700">
                      Active
                    </span>
                  </div>

                  {/* Stats Grid (Injected, Consumed, Drawings) */}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-gray-100 text-center">
                    <div className="bg-gray-50 p-2 rounded-xl">
                      <span className="text-[10px] text-gray-500 font-bold uppercase block">Injected</span>
                      <span className="text-xs font-black font-mono text-gray-900 block mt-0.5 truncate" title={`Total Injected: Rs. ${Number(director.total_capital_injected).toLocaleString('en-PK')}`}>
                        Rs. {Number(director.total_capital_injected).toLocaleString('en-PK')}
                      </span>
                    </div>
                    <div className="bg-amber-50/60 p-2 rounded-xl">
                      <span className="text-[10px] text-amber-800 font-bold uppercase block">Consumed</span>
                      <span className="text-xs font-black font-mono text-amber-700 block mt-0.5 truncate">
                        Rs. {Number(director.total_capital_consumed).toLocaleString('en-PK')}
                      </span>
                    </div>
                    <div className="bg-rose-50/60 p-2 rounded-xl">
                      <span className="text-[10px] text-rose-700 font-bold uppercase block">Drawings</span>
                      <span className="text-xs font-black font-mono text-rose-700 block mt-0.5 truncate">
                        Rs. {Number(director.total_withdrawn).toLocaleString('en-PK')}
                      </span>
                    </div>
                  </div>

                  {/* Live Balance Row */}
                  <div className="mt-3 p-3 rounded-2xl bg-[#E6F4ED] border border-[#0B462C]/20 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#0B462C]/80 uppercase font-bold block">Remaining Capital</span>
                      <span className="text-xs font-bold text-[#0B462C]">Available Funds</span>
                    </div>
                    <span className="text-base font-black font-mono text-[#0B462C]">
                      Rs. {Number(director.live_balance).toLocaleString('en-PK')}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <Link
                    href={`/director/${director.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-purple-700" />
                    View Itemized Usage & Statement
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= 📜 STATEMENT MODAL / DRAWER ================= */}
      {isStatementOpen && statementDirector && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-gray-200 animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black">
                  {statementDirector.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-gray-900">{statementDirector.name}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-purple-100 text-purple-800">
                      {statementDirector.share_percentage}% Capital Share
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium">
                    Itemized Capital Injections, Usage Expenses & Drawings Ledger
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Export PDF Button */}
                <button
                  onClick={handleExportStatementPdf}
                  disabled={isExportingPdf}
                  className="px-3.5 py-2 rounded-xl bg-[#0B462C] hover:bg-[#083521] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  title="Download Certified Director Audit Statement PDF"
                >
                  {isExportingPdf ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {isExportingPdf ? 'Generating...' : 'Export PDF'}
                </button>

                <button
                  onClick={() => setIsStatementOpen(false)}
                  className="w-9 h-9 rounded-xl bg-white border border-gray-200 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filter Bar & Summary Ribbon */}
            <div className="p-4 bg-white border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
              <div className="w-48">
                <CustomMonthPicker
                  value={statementMonth}
                  onChange={(val) => {
                    setStatementMonth(val);
                    fetchStatement(statementDirector.id, val);
                  }}
                  placeholder="All Time History"
                />
              </div>

              {statementMetrics && (
                <div className="flex items-center gap-4 text-xs font-medium">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Credits (+)</span>
                    <span className="font-bold font-mono text-emerald-700">+ Rs. {statementMetrics.total_credits.toLocaleString('en-PK')}</span>
                  </div>
                  <div className="border-l border-gray-200 pl-4">
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Debits (-)</span>
                    <span className="font-bold font-mono text-rose-700">- Rs. {statementMetrics.total_debits.toLocaleString('en-PK')}</span>
                  </div>
                  <div className="border-l border-gray-200 pl-4">
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Remaining Capital</span>
                    <span className="font-black font-mono text-[#0B462C] text-sm">Rs. {statementMetrics.current_balance.toLocaleString('en-PK')}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Transactions Table */}
            <div className="overflow-y-auto flex-1 p-4">
              <table className="w-full text-left text-xs text-gray-800 bg-white">
                <thead className="bg-gray-50 text-gray-600 font-bold uppercase tracking-wider text-[11px] border-b border-gray-200">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Particulars / Details of Usage</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3 text-right text-emerald-700">Credit (+)</th>
                    <th className="py-2.5 px-3 text-right text-rose-700">Debit (-)</th>
                    <th className="py-2.5 px-3 text-right font-mono">Running Balance</th>
                    <th className="py-2.5 px-3 text-center">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {isLoadingStatement ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-500">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-700" />
                        Loading ledger statement...
                      </td>
                    </tr>
                  ) : statementData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-400">
                        No transactions recorded for this period.
                      </td>
                    </tr>
                  ) : (
                    statementData.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-3 whitespace-nowrap text-gray-600 font-mono text-[11px]">
                          {formatDisplayDate(item.date)}
                        </td>
                        <td className="py-3 px-3">
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
                        <td className="py-3 px-3 whitespace-nowrap">
                          {item.type === 'capital_injection' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                              💎 Capital Deposit
                            </span>
                          )}
                          {item.type === 'capital_expense' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              🏗️ Capital Usage
                            </span>
                          )}
                          {item.type === 'profit_credit' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700">
                              📈 Profit Dividend
                            </span>
                          )}
                          {item.type === 'withdrawal' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700">
                              💸 Drawing
                            </span>
                          )}
                          {item.type === 'opening_balance' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">
                              Brought Forward
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                          {item.credit > 0 ? `+ Rs. ${Number(item.credit).toLocaleString('en-PK')}` : '—'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-rose-700 whitespace-nowrap">
                          {item.debit > 0 ? `- Rs. ${Number(item.debit).toLocaleString('en-PK')}` : '—'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-black text-gray-900 whitespace-nowrap">
                          Rs. {Number(item.running_balance).toLocaleString('en-PK')}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
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
            </div>
          </div>
        </div>
      )}

      {/* ================= ➕ MODAL: DEPOSIT CAPITAL ================= */}
      {isDepositOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-black text-gray-900">Record Capital Injection</h3>
              <button onClick={() => setIsDepositOpen(false)} className="text-gray-400 hover:text-gray-700">
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
                <label className="text-xs font-bold text-gray-700 block mb-1">Select Partner / Director *</label>
                <CustomDropdown
                  options={directors.map(d => ({ value: String(d.id), label: d.name, icon: '👤' }))}
                  value={depDirectorId}
                  onChange={setDepDirectorId}
                />
              </div>

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
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={depSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs disabled:opacity-50"
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
                <p className="text-xs text-gray-500 font-medium">Charge asset or project expense directly to a partner&apos;s capital account</p>
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
                <label className="text-xs font-bold text-gray-700 block mb-1">Funded by Partner / Director *</label>
                <CustomDropdown
                  options={directors.map(d => ({ 
                    value: String(d.id), 
                    label: `${d.name} (Rs. ${Number(d.live_balance).toLocaleString('en-PK')} Available)`, 
                    icon: '👤' 
                  }))}
                  value={capDirectorId}
                  onChange={setCapDirectorId}
                />
                {activeCapDirector && (
                  <span className="text-[11px] text-amber-800 font-bold mt-1 block">
                    Available Capital: Rs. {Number(activeCapDirector.live_balance).toLocaleString('en-PK')}
                  </span>
                )}
              </div>

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
              <h3 className="text-base font-black text-gray-900">Record Director Withdrawal</h3>
              <button onClick={() => setIsWithdrawOpen(false)} className="text-gray-400 hover:text-gray-700">
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
                <label className="text-xs font-bold text-gray-700 block mb-1">Select Partner / Director *</label>
                <CustomDropdown
                  options={directors.map(d => ({ value: String(d.id), label: `${d.name} (Rs. ${Number(d.live_balance).toLocaleString('en-PK')} Available)`, icon: '👤' }))}
                  value={withDirectorId}
                  onChange={setWithDirectorId}
                />
                {activeWithdrawDirector && (
                  <span className="text-[11px] text-emerald-700 font-bold mt-1 block">
                    Available Undrawn Funds: Rs. {Number(activeWithdrawDirector.live_balance).toLocaleString('en-PK')}
                  </span>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Withdrawal Amount (PKR) *</label>
                <CustomNumberInput
                  value={withAmount}
                  onChange={setWithAmount}
                  placeholder="e.g. 100,000"
                  required
                />
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
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={withSubmitting}
                  className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shadow-xs disabled:opacity-50"
                >
                  {withSubmitting ? 'Debiting...' : 'Debit Withdrawal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
