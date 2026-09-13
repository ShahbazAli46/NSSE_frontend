'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api, PnlDirector, PnlSummary } from '@/lib/api';
import CustomMonthPicker from '@/components/CustomMonthPicker';
import CustomNumberInput from '@/components/CustomNumberInput';
import { 
  RefreshCw, 
  Sparkles, 
  Users, 
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2
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

// Vibrant stream color themes optimized for clean contrast
const STREAM_PALETTES = [
  {
    name: 'emerald',
    primary: '#059669',
    secondary: '#10B981',
    lineGlow: 'rgba(5, 150, 105, 0.4)',
    badgeBorder: '#059669',
    badgeText: '#065F46',
    badgeBg: '#ECFDF5',
    cardBorder: 'border-emerald-200 hover:border-emerald-400',
    cardBg: 'bg-white hover:bg-emerald-50/30',
    accentText: 'text-emerald-700',
    avatarBg: 'bg-emerald-600',
  },
  {
    name: 'purple',
    primary: '#7C3AED',
    secondary: '#8B5CF6',
    lineGlow: 'rgba(124, 58, 237, 0.4)',
    badgeBorder: '#7C3AED',
    badgeText: '#5B21B6',
    badgeBg: '#F5F3FF',
    cardBorder: 'border-purple-200 hover:border-purple-400',
    cardBg: 'bg-white hover:bg-purple-50/30',
    accentText: 'text-purple-700',
    avatarBg: 'bg-purple-600',
  },
  {
    name: 'amber',
    primary: '#D97706',
    secondary: '#F59E0B',
    lineGlow: 'rgba(217, 119, 6, 0.4)',
    badgeBorder: '#D97706',
    badgeText: '#92400E',
    badgeBg: '#FFFBEB',
    cardBorder: 'border-amber-200 hover:border-amber-400',
    cardBg: 'bg-white hover:bg-amber-50/30',
    accentText: 'text-amber-700',
    avatarBg: 'bg-amber-600',
  },
  {
    name: 'blue',
    primary: '#0284C7',
    secondary: '#0EA5E9',
    lineGlow: 'rgba(2, 132, 199, 0.4)',
    badgeBorder: '#0284C7',
    badgeText: '#075985',
    badgeBg: '#F0F9FF',
    cardBorder: 'border-sky-200 hover:border-sky-400',
    cardBg: 'bg-white hover:bg-sky-50/30',
    accentText: 'text-sky-700',
    avatarBg: 'bg-sky-600',
  },
  {
    name: 'rose',
    primary: '#E11D48',
    secondary: '#F43F5E',
    lineGlow: 'rgba(225, 29, 72, 0.4)',
    badgeBorder: '#E11D48',
    badgeText: '#9F1239',
    badgeBg: '#FFF1F2',
    cardBorder: 'border-rose-200 hover:border-rose-400',
    cardBg: 'bg-white hover:bg-rose-50/30',
    accentText: 'text-rose-700',
    avatarBg: 'bg-rose-600',
  }
];

export default function ProfitDisbursementVisualPage() {
  const searchParams = useSearchParams();
  const initialMonth = searchParams.get('month') || getCurrentMonthString();

  const [selectedMonth, setSelectedMonth] = useState<string>(initialMonth);
  const [summary, setSummary] = useState<PnlSummary | null>(null);
  const [directors, setDirectors] = useState<PnlDirector[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeHoverDirector, setActiveHoverDirector] = useState<number | null>(null);

  // Settlement Transfers State: fromDirectorId -> { toDirectorId, amount }
  const [transfers, setTransfers] = useState<Record<number, { toDirectorId: number | ''; amount: string }>>({});
  const [isDisbursing, setIsDisbursing] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  const handleExecuteDisbursement = async () => {
    if (!totalProfitPool || isDisbursing) return;
    setIsDisbursing(true);
    setFeedbackMessage(null);
    try {
      const activeTransfers = Object.entries(transfers)
        .filter(([_, t]) => t.toDirectorId && Number(t.amount) > 0)
        .map(([fromId, t]) => ({
          from_director_id: Number(fromId),
          to_director_id: Number(t.toDirectorId),
          amount: Number(t.amount),
        }));

      const payload = {
        period_month: selectedMonth,
        total_profit_pool: totalProfitPool,
        date: new Date().toISOString().slice(0, 10),
        notes: `Profit distribution for ${selectedMonth}`,
        settlement_transfers: activeTransfers,
      };

      const res: any = await api.post('/directors/distribute-profit', payload);
      setFeedbackMessage({ type: 'success', text: res?.message || 'Profit disbursed successfully.' });
      setTransfers({});
      await fetchPnlData();
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: err?.response?.data?.message || err?.message || 'Failed to disburse profit.'
      });
    } finally {
      setIsDisbursing(false);
    }
  };

  useEffect(() => {
    fetchPnlData();
  }, [selectedMonth]);

  const totalProfitPool = summary?.remaining_amount ? Math.max(0, Number(summary.remaining_amount)) : 0;
  const totalGovtIncome = summary?.total_govt_income ? Number(summary.total_govt_income) : 0;
  const totalGeneralExpenses = summary?.total_general_expenses ? Number(summary.total_general_expenses) : 0;

  // Responsive SVG Flow calculations
  const directorCoords = useMemo(() => {
    const count = directors.length;
    if (count === 0) return [];
    
    const margin = count === 1 ? 500 : count === 2 ? 260 : count === 3 ? 180 : 120;
    const availableWidth = 1000 - (margin * 2);
    const step = count > 1 ? availableWidth / (count - 1) : 0;

    return directors.map((dir, i) => {
      const x = count === 1 ? 500 : margin + (i * step);
      const y = 360;
      return {
        id: dir.id,
        x,
        y,
        dir,
        palette: STREAM_PALETTES[i % STREAM_PALETTES.length]
      };
    });
  }, [directors]);

  return (
    <div className="w-full space-y-4 animate-fadeIn">
      {/* Embedded CSS Animations for Flowing Stream Lines & Glows */}
      <style jsx>{`
        @keyframes flowingStream {
          0% {
            stroke-dashoffset: 80;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
        .animate-stream {
          animation: flowingStream 2s linear infinite;
        }
        .animate-stream-fast {
          animation: flowingStream 1.4s linear infinite;
        }
      `}</style>

      {/* ================= 🧭 TOP-LEFT MONTH PICKER & CONTROLS ================= */}
      <div className="flex items-center gap-2.5">
        <div className="w-56">
          <CustomMonthPicker
            value={selectedMonth}
            onChange={setSelectedMonth}
            placeholder="Select Month"
          />
        </div>
        <button
          onClick={fetchPnlData}
          className="p-2.5 rounded-xl bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 shadow-xs transition-all cursor-pointer"
          title="Refresh Stream"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#0B462C]' : ''}`} />
        </button>
      </div>

      {/* ================= 💎 MAIN FLOW CANVAS ================= */}
      <div className="relative w-full pt-1">

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 1. CENTER TOP PROFIT HUB */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="flex justify-center relative z-20">
          <div className="relative bg-[#0B462C] text-white border-2 border-emerald-400/40 rounded-2xl py-3 px-6 sm:px-8 text-center shadow-lg flex flex-col items-center">
            {/* Badge */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-emerald-200 text-[9px] font-black uppercase tracking-wider mb-0.5">
              <Sparkles className="w-2.5 h-2.5 text-[#E8D4A2]" />
              Distributable Profit Pool
            </span>

            {/* Month */}
            <span className="text-[11px] font-bold text-emerald-100/80">
              {formatMonthTitle(selectedMonth)}
            </span>

            {/* Amount */}
            <div className="mt-1 flex items-baseline justify-center">
              <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
                Rs. {totalProfitPool.toLocaleString('en-PK')}
              </span>
            </div>

            {/* Mini Gov / Expense tags */}
            <div className="mt-2 pt-1.5 border-t border-white/15 flex items-center justify-center gap-2.5 text-[10px] text-emerald-100/90 font-medium">
              <span>🏛️ Inflow: Rs. {totalGovtIncome.toLocaleString('en-PK')}</span>
              <span>•</span>
              <span>📑 Exp: Rs. {totalGeneralExpenses.toLocaleString('en-PK')}</span>
            </div>

            {/* Bottom Connector Dot */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#0B462C] border-2 border-emerald-300 flex items-center justify-center shadow-xs z-30">
              <div className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
            </div>
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 2. ANIMATED GLOWING WAVING LINES (SVG) */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="relative w-full h-[220px] sm:h-[260px] -mt-2 -mb-2 pointer-events-none">
          <svg
            className="w-full h-full overflow-visible"
            viewBox="0 0 1000 380"
            preserveAspectRatio="none"
          >
            <defs>
              {/* Glow Filter */}
              <filter id="stream-soft-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Gradients */}
              {directorCoords.map(({ id, palette, x }) => (
                <linearGradient
                  key={id}
                  id={`stream-grad-light-${id}`}
                  x1="500"
                  y1="10"
                  x2={String(x)}
                  y2="360"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor="#059669" />
                  <stop offset="50%" stopColor={palette.primary} />
                  <stop offset="100%" stopColor={palette.secondary} />
                </linearGradient>
              ))}
            </defs>

            {/* Glowing Waving Lines to Each Director */}
            {directorCoords.map(({ id, x, y, palette }, idx) => {
              const startX = 500;
              const startY = 10;
              const endX = x;
              const endY = y;
              
              const cp1X = startX;
              const cp1Y = 140;
              const cp2X = endX;
              const cp2Y = 200;
              const pathD = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;

              const isHovered = activeHoverDirector === id;
              const strokeWidth = isHovered ? 4.5 : 3;

              return (
                <g key={id} className="transition-all duration-300">
                  {/* Soft Glow Track */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={palette.primary}
                    strokeWidth={strokeWidth + 6}
                    strokeOpacity={isHovered ? "0.35" : "0.15"}
                    filter="url(#stream-soft-glow)"
                  />

                  {/* Base Line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={`url(#stream-grad-light-${id})`}
                    strokeWidth={strokeWidth}
                    strokeOpacity="0.8"
                  />

                  {/* Animated Wave Dash Stream */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={palette.secondary}
                    strokeWidth={strokeWidth + 1}
                    strokeDasharray="10 14"
                    className={idx % 2 === 0 ? "animate-stream" : "animate-stream-fast"}
                  />

                  {/* Bottom Connection Dot */}
                  <circle
                    cx={endX}
                    cy={endY}
                    r={isHovered ? "6" : "4.5"}
                    fill={palette.primary}
                  />
                </g>
              );
            })}
          </svg>

          {/* Non-Squeezed HTML Percentage Badges Positioned Along Curve */}
          {directorCoords.map(({ id, x, y, dir, palette }) => {
            const startX = 500;
            const startY = 10;
            const endX = x;
            const endY = y;
            const cp1X = startX;
            const cp1Y = 140;
            const cp2X = endX;
            const cp2Y = 200;

            const midX = (startX * 0.125) + (cp1X * 0.375) + (cp2X * 0.375) + (endX * 0.125);
            const midY = (startY * 0.125) + (cp1Y * 0.375) + (cp2Y * 0.375) + (endY * 0.125);

            const leftPercent = (midX / 1000) * 100;
            const topPercent = (midY / 380) * 100;

            return (
              <div
                key={`badge-${id}`}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto z-10"
                style={{
                  left: `${leftPercent}%`,
                  top: `${topPercent}%`,
                }}
              >
                <div
                  className="px-3.5 py-1 rounded-full bg-white border-2 shadow-xs flex items-center justify-center transition-transform duration-200 hover:scale-110"
                  style={{
                    borderColor: palette.primary,
                  }}
                >
                  <span
                    className="text-xs font-black font-mono tracking-tight select-none"
                    style={{
                      color: palette.badgeText,
                    }}
                  >
                    {Number(dir.share_percentage).toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 3. DIRECTOR NODES (TERMINAL CARDS AT END OF LINES) */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="relative z-30">
          {directors.length === 0 ? (
            <div className="p-12 text-center text-gray-400 bg-white rounded-3xl border border-gray-200">
              <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="text-xs font-bold">No active partners found.</p>
            </div>
          ) : (
            <div className={`grid gap-4 grid-cols-1 ${
              directors.length === 1 ? 'max-w-md mx-auto' :
              directors.length === 2 ? 'sm:grid-cols-2 max-w-3xl mx-auto' :
              directors.length === 3 ? 'sm:grid-cols-3 max-w-5xl mx-auto' :
              'sm:grid-cols-2 lg:grid-cols-4'
            }`}>
              {directors.map((dir, idx) => {
                const palette = STREAM_PALETTES[idx % STREAM_PALETTES.length];
                const isHovered = activeHoverDirector === dir.id;
                const isOverpaid = dir.loan_amount > 0;
                const isUnderpaid = dir.shortfall_amount > 0;

                const transferOut = Number(transfers[dir.id]?.amount || 0);
                const transferIn = Object.entries(transfers).reduce((sum, [fromId, t]) => {
                  if (Number(fromId) !== dir.id && Number(t.toDirectorId) === dir.id) {
                    return sum + Number(t.amount || 0);
                  }
                  return sum;
                }, 0);
                const netCash = Math.max(0, Number(dir.profit_share) - transferOut);
                const totalReceiving = netCash + transferIn;

                return (
                  <div
                    key={dir.id}
                    onMouseEnter={() => setActiveHoverDirector(dir.id)}
                    onMouseLeave={() => setActiveHoverDirector(null)}
                    className={`relative border rounded-3xl p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between shadow-xs hover:shadow-md ${
                      palette.cardBg
                    } ${palette.cardBorder} ${
                      isHovered ? 'scale-[1.02] ring-2 ring-purple-600/20' : ''
                    }`}
                  >
                    {/* Top Anchor Point */}
                    <div 
                      className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white border-2 flex items-center justify-center shadow-xs"
                      style={{ borderColor: palette.primary }}
                    >
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: palette.primary }}
                      />
                    </div>

                    <div>
                      {/* Header: Avatar, Name, Share % */}
                      <div className="flex items-start justify-between gap-2.5 pb-2">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-white text-base shadow-xs shrink-0"
                            style={{ backgroundColor: palette.primary }}
                          >
                            {dir.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-sm sm:text-base font-black text-gray-900 line-clamp-1">
                              {dir.name}
                            </h3>
                            <span className="text-[10px] text-gray-400 font-medium block">
                              {dir.cnic ? `CNIC: ${dir.cnic}` : `Partner #${dir.id}`}
                            </span>
                          </div>
                        </div>

                        {/* Share Pill */}
                        <span 
                          className="px-2.5 py-1 rounded-xl text-xs font-black border shadow-2xs shrink-0 font-mono"
                          style={{ 
                            backgroundColor: palette.badgeBg, 
                            borderColor: palette.badgeBorder,
                            color: palette.badgeText
                          }}
                        >
                          {Number(dir.share_percentage).toFixed(1)}%
                        </span>
                      </div>

                      {/* 💰 Highlighted Profit Amount Block */}
                      <div className="mt-3.5 p-4 rounded-2xl bg-gray-50 border border-gray-200/80">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                          Allocated Profit Amount
                        </span>
                        <div className="mt-1 flex items-baseline gap-1">
                          <span 
                            className="text-xl sm:text-2xl font-black font-mono tracking-tight"
                            style={{ color: palette.primary }}
                          >
                            + Rs. {Number(dir.profit_share).toLocaleString('en-PK')}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {Number(dir.share_percentage).toFixed(1)}% of Rs. {totalProfitPool.toLocaleString('en-PK')}
                        </p>

                        {/* Live transfer impact adjustments */}
                        {transferOut > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-200/60 text-[11px] font-medium text-amber-800 flex justify-between">
                            <span>Payout after transfer:</span>
                            <strong className="font-mono font-bold">Rs. {netCash.toLocaleString()}</strong>
                          </div>
                        )}
                        {transferIn > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-200/60 text-[11px] font-medium text-emerald-800 flex justify-between">
                            <span>Total receiving:</span>
                            <strong className="font-mono font-bold">Rs. {totalReceiving.toLocaleString()}</strong>
                          </div>
                        )}
                      </div>

                      {/* Capital Target & Contribution Status */}
                      <div className="mt-3 space-y-1.5 text-xs bg-white p-3 rounded-2xl border border-gray-100 shadow-2xs">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-400 font-medium">Capital Paid:</span>
                          <span className="font-mono font-bold text-gray-900">
                            Rs. {Number(dir.month_paid_amount || 0).toLocaleString('en-PK')}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-400 font-medium">Capital Target:</span>
                          <span className="font-mono font-bold text-gray-700">
                            Rs. {Number(dir.expected_monthly_contribution || 0).toLocaleString('en-PK')}
                          </span>
                        </div>

                        {/* Variance badge */}
                        <div className="pt-1.5 border-t border-gray-100 flex items-center justify-between">
                          <span className="text-[10px] text-gray-400 uppercase font-bold">Status</span>
                          {isOverpaid ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Surplus Capital: +Rs. {Number(dir.loan_amount).toLocaleString()}
                            </span>
                          ) : isUnderpaid ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                              Capital Shortfall: -Rs. {Number(dir.shortfall_amount).toLocaleString()}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700">
                              Target Met
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 🔄 Simple Transfer UI Below Card */}
                      <div className="mt-3 p-3 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                          <span>Transfer To</span>
                          {transfers[dir.id]?.toDirectorId && (
                            <button
                              type="button"
                              onClick={() => setTransfers(prev => ({ ...prev, [dir.id]: { toDirectorId: '', amount: '' } }))}
                              className="text-[10px] text-gray-400 hover:text-rose-600 cursor-pointer"
                            >
                              Clear
                            </button>
                          )}
                        </div>

                        <select
                          value={transfers[dir.id]?.toDirectorId ?? ''}
                          onChange={(e) => {
                            const toId = e.target.value ? Number(e.target.value) : '';
                            setTransfers(prev => ({
                              ...prev,
                              [dir.id]: {
                                toDirectorId: toId,
                                amount: prev[dir.id]?.amount || (Number(dir.profit_share) > 0 ? String(Math.min(Number(dir.profit_share), Number(dir.shortfall_amount || dir.profit_share))) : '')
                              }
                            }));
                          }}
                          disabled={summary?.is_distributed}
                          className="w-full text-xs bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-gray-800 focus:outline-none focus:border-emerald-500 font-medium disabled:opacity-60 cursor-pointer"
                        >
                          <option value="">Select Partner...</option>
                          {directors
                            .filter((d) => d.id !== dir.id)
                            .map((d) => {
                              const isOver = Number(d.loan_amount) > 0;
                              return (
                                <option key={d.id} value={d.id}>
                                  {d.name} {isOver ? `(+Rs. ${Number(d.loan_amount).toLocaleString()} loan)` : ''}
                                </option>
                              );
                            })}
                        </select>

                        {transfers[dir.id]?.toDirectorId && (
                          <div className="flex items-center gap-1.5 animate-fadeIn pt-1">
                            <div className="flex-1">
                              <CustomNumberInput
                                value={transfers[dir.id]?.amount || ''}
                                onChange={(val) => {
                                  setTransfers(prev => ({
                                    ...prev,
                                    [dir.id]: {
                                      toDirectorId: prev[dir.id]?.toDirectorId ?? '',
                                      amount: val
                                    }
                                  }));
                                }}
                                prefix="Rs."
                                min={0}
                                max={Number(dir.profit_share || 0)}
                                allowDecimal={false}
                                placeholder="Amount"
                                disabled={summary?.is_distributed}
                                className="!bg-white !py-1.5 font-mono font-bold"
                              />
                            </div>
                            {Number(dir.profit_share) > 0 && !summary?.is_distributed && (
                              <button
                                type="button"
                                onClick={() => {
                                  const maxAmt = dir.shortfall_amount > 0 
                                    ? Math.min(Number(dir.profit_share), Number(dir.shortfall_amount))
                                    : Number(dir.profit_share);
                                  setTransfers(prev => ({
                                    ...prev,
                                    [dir.id]: {
                                      toDirectorId: prev[dir.id]?.toDirectorId ?? '',
                                      amount: String(maxAmt)
                                    }
                                  }));
                                }}
                                className="px-2.5 py-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-xl cursor-pointer shrink-0"
                              >
                                Max
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Passbook Link */}
                    <div className="mt-3.5 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-gray-400">Holding Statement</span>
                      <Link
                        href={`/director/${dir.id}?month=${selectedMonth}`}
                        className="inline-flex items-center gap-1 font-bold transition-colors py-1 px-2.5 rounded-lg hover:bg-gray-100 text-xs"
                        style={{ color: palette.primary }}
                      >
                        Passbook
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Feedback Message */}
        {feedbackMessage && (
          <div className={`mt-6 p-4 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-xs ${
            feedbackMessage.type === 'success' 
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}>
            <span>{feedbackMessage.text}</span>
            <button
              onClick={() => setFeedbackMessage(null)}
              className="p-1 hover:bg-black/5 rounded-lg cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Bottom Execution Bar */}
        {summary?.is_distributed ? (
          <div className="mt-6 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Profit for {formatMonthTitle(selectedMonth)} has been disbursed.</span>
          </div>
        ) : totalProfitPool > 0 && (
          <div className="mt-6 flex items-center justify-between p-4 bg-white border border-gray-200 rounded-2xl shadow-xs">
            <div className="flex items-center gap-2 text-xs text-gray-700">
              <span className="font-bold">Distributable:</span>
              <span className="font-mono font-black text-gray-900">Rs. {totalProfitPool.toLocaleString('en-PK')}</span>
            </div>

            <button
              onClick={handleExecuteDisbursement}
              disabled={isDisbursing}
              className="px-5 py-2.5 rounded-xl bg-[#0B462C] hover:bg-[#093823] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {isDisbursing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Disburse Profit</span>
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
