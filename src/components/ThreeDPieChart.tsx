'use client';

import React, { useState, useMemo } from 'react';
import { Director } from '@/lib/api';
import { 
  PieChart as PieChartIcon, 
  Sparkles, 
  Layers, 
  Eye
} from 'lucide-react';

export const THREE_D_COLORS = [
  {
    name: 'Emerald',
    top: '#059669',
    bottom: '#047857',
    side: '#064E3B',
    glow: 'rgba(16, 185, 129, 0.4)',
    text: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    gradient: 'from-emerald-500 to-teal-700',
  },
  {
    name: 'Purple',
    top: '#9333EA',
    bottom: '#7E22CE',
    side: '#581C87',
    glow: 'rgba(168, 85, 247, 0.4)',
    text: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    gradient: 'from-purple-500 to-indigo-700',
  },
  {
    name: 'Sky Blue',
    top: '#0284C7',
    bottom: '#0369A1',
    side: '#0C4A6E',
    glow: 'rgba(14, 165, 233, 0.4)',
    text: 'text-sky-700',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    gradient: 'from-sky-500 to-blue-700',
  },
  {
    name: 'Amber Gold',
    top: '#D97706',
    bottom: '#B45309',
    side: '#78350F',
    glow: 'rgba(245, 158, 11, 0.4)',
    text: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    gradient: 'from-amber-500 to-orange-700',
  },
  {
    name: 'Rose Ruby',
    top: '#E11D48',
    bottom: '#BE123C',
    side: '#881337',
    glow: 'rgba(244, 63, 94, 0.4)',
    text: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    gradient: 'from-rose-500 to-pink-700',
  },
  {
    name: 'Teal Cyan',
    top: '#0D9488',
    bottom: '#0F766E',
    side: '#134E4A',
    glow: 'rgba(20, 184, 166, 0.4)',
    text: 'text-teal-700',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    gradient: 'from-teal-500 to-emerald-700',
  },
];

interface ThreeDPieChartProps {
  directors: Director[];
  selectedDirector: Director | null;
  onSelectDirector: (director: Director) => void;
  totalCapital: number;
}

export default function ThreeDPieChart({
  directors,
  selectedDirector,
  onSelectDirector,
  totalCapital,
}: ThreeDPieChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Compute 3D Slices strictly from net capital (Injected - Withdrawn)
  const slices = useMemo(() => {
    if (!directors || directors.length === 0) return [];

    const items = directors.map((d, index) => {
      const deposited = Number(d.total_capital_injected) || 0;
      const withdrawn = Number(d.total_withdrawn) || 0;
      const capital = Math.max(0, Number(d.net_capital ?? (deposited - withdrawn)));
      const percentage = Number(d.share_percentage) !== undefined 
        ? Number(d.share_percentage)
        : (totalCapital > 0 ? Math.round((capital / totalCapital) * 1000) / 10 : 0);

      return {
        director: d,
        percentage,
        color: THREE_D_COLORS[index % THREE_D_COLORS.length],
        capital,
        deposited,
        withdrawn,
        profit: Number(d.total_profit_earned) || 0,
        balance: Number(d.live_balance) || 0,
        index,
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
          startAngle: 0,
          endAngle: 0,
          midAngle: 0,
          hoverOffset: { x: 0, y: 0 },
        };
      }

      if (hasSingleFull && percentage >= 99.9) {
        return {
          ...item,
          pathData: '',
          isFullCircle: true,
          startAngle: 0,
          endAngle: 360,
          midAngle: 0,
          hoverOffset: { x: 0, y: 0 },
        };
      }

      const startAngle = (cumulative / totalPercentage) * 360;
      cumulative += percentage;
      const endAngle = (cumulative / totalPercentage) * 360;
      const midAngle = (startAngle + endAngle) / 2;

      // Radial pop displacement (12px along vector)
      const midRad = ((midAngle - 90) * Math.PI) / 180;
      const hoverOffset = {
        x: Math.round(Math.cos(midRad) * 12 * 10) / 10,
        y: Math.round(Math.sin(midRad) * 12 * 10) / 10,
      };

      // Arc geometry (340x340 SVG viewbox)
      const radius = 138;
      const innerRadius = 82;
      const cx = 170;
      const cy = 170;

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
        startAngle,
        endAngle,
        midAngle,
        hoverOffset,
      };
    });
  }, [directors, totalCapital]);

  return (
    <div className="bg-gradient-to-br from-white via-slate-50/70 to-purple-50/20 border border-purple-100 rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 rounded-full bg-purple-200/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-96 h-96 rounded-full bg-emerald-200/20 blur-3xl pointer-events-none" />

      {/* ================= 🧭 HEADER & CONTROLS ================= */}
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-600 shadow-md shadow-purple-600/30 flex items-center justify-center text-white font-bold text-xl">
            🥧
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-gray-900 tracking-tight">
                3D Capital Ownership & Equity Ratio
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                Capital-Weighted Model
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Each partner&apos;s ownership share is dynamically determined by their exact deposited capital
            </p>
          </div>
        </div>

        {/* Total Capital Badge */}
        <div className="flex items-center gap-2.5">
          <div className="px-4 py-2 rounded-2xl bg-purple-50 border border-purple-200 text-xs font-bold text-purple-800 flex items-center gap-2 shadow-xs">
            <span>💎 Total Deposited Capital:</span>
            <span className="font-mono font-black text-sm text-gray-900">Rs. {totalCapital.toLocaleString('en-PK')}</span>
          </div>
        </div>
      </div>

      {/* ================= 💎 MAIN 3D SHOWCASE GRID ================= */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-6">
        
        {/* ================= 💎 LEFT: LARGE 3D OPEN DONUT ================= */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center relative py-4">
          
          {/* 3D Isometric View Stage */}
          <div 
            className="relative w-80 h-80 sm:w-96 sm:h-96 transition-transform duration-500 ease-out flex items-center justify-center"
            style={{
              perspective: '1000px',
            }}
          >
            {/* Ambient 3D Depth Shadow Floor */}
            <div 
              className="absolute inset-x-8 bottom-3 h-16 rounded-full bg-slate-900/10 blur-xl transform scale-x-110 pointer-events-none" 
            />

            {/* SVG 3D Layered Cylinder */}
            <svg 
              viewBox="0 0 340 340" 
              className="w-full h-full transform transition-all duration-500"
              style={{
                filter: 'drop-shadow(0 16px 24px rgba(0,0,0,0.14))',
              }}
            >
              <defs>
                {/* 3D Drop Shadow Filter */}
                <filter id="shadow-3d" x="-20%" y="-20%" width="150%" height="150%">
                  <feDropShadow dx="0" dy="6" stdDeviation="4" floodColor="#000000" floodOpacity="0.25" />
                </filter>

                {/* Metallic Gradients for Each Slice */}
                {THREE_D_COLORS.map((col, i) => (
                  <React.Fragment key={i}>
                    {/* Top Surface Gradient */}
                    <linearGradient id={`grad-top-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={col.top} />
                      <stop offset="50%" stopColor={col.bottom} />
                      <stop offset="100%" stopColor={col.side} />
                    </linearGradient>

                    {/* Extruded Depth Gradient */}
                    <linearGradient id={`grad-side-${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={col.bottom} />
                      <stop offset="100%" stopColor={col.side} />
                    </linearGradient>
                  </React.Fragment>
                ))}
              </defs>

              {/* 1. EXTUDED BASE LAYER (Physical 3D Depth / Thickness) */}
              <g transform="translate(0, 12) scale(1, 0.90) translate(0, 10)" opacity="0.75">
                {slices.map((slice, i) => {
                  if (slice.isFullCircle) {
                    return (
                      <circle
                        key={`base-${i}`}
                        cx="170"
                        cy="170"
                        r="110"
                        stroke={slice.color.side}
                        strokeWidth="56"
                        fill="none"
                      />
                    );
                  }
                  if (!slice.pathData) return null;
                  return (
                    <path
                      key={`base-${i}`}
                      d={slice.pathData}
                      fill={slice.color.side}
                    />
                  );
                })}
              </g>

              {/* 2. TOP 3D ILLUMINATED SURFACE LAYER */}
              <g transform="scale(1, 0.90) translate(0, 10)">
                {slices.map((slice, i) => {
                  const isHovered = hoveredIndex === i;
                  const isSelected = selectedDirector?.id === slice.director.id;
                  const transformStyle = (isHovered || isSelected) && !slice.isFullCircle
                    ? `translate(${slice.hoverOffset.x}px, ${slice.hoverOffset.y}px) scale(1.04)`
                    : 'translate(0px, 0px) scale(1)';

                  if (slice.isFullCircle) {
                    return (
                      <g
                        key={`top-${i}`}
                        className="cursor-pointer transition-all duration-300"
                        onMouseEnter={() => setHoveredIndex(i)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        onClick={() => onSelectDirector(slice.director)}
                      >
                        <circle
                          cx="170"
                          cy="170"
                          r="110"
                          stroke={`url(#grad-top-${i})`}
                          strokeWidth="56"
                          fill="none"
                          className="transition-transform duration-300 hover:scale-[1.02]"
                          filter="url(#shadow-3d)"
                        />
                      </g>
                    );
                  }

                  if (!slice.pathData) return null;

                  return (
                    <path
                      key={`top-${i}`}
                      d={slice.pathData}
                      fill={`url(#grad-top-${i})`}
                      filter={isHovered || isSelected ? 'url(#shadow-3d)' : undefined}
                      className="cursor-pointer transition-all duration-300"
                      style={{
                        transform: transformStyle,
                        transformOrigin: '170px 170px',
                        stroke: isHovered || isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.4)',
                        strokeWidth: isHovered || isSelected ? '3' : '1.2',
                      }}
                      onMouseEnter={() => setHoveredIndex(i)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      onClick={() => onSelectDirector(slice.director)}
                    />
                  );
                })}

                {/* Clean Open Donut Inner Bevel Rim */}
                <circle
                  cx="170"
                  cy="170"
                  r="82"
                  stroke="rgba(255,255,255,0.7)"
                  strokeWidth="1.5"
                  fill="none"
                  className="pointer-events-none"
                />
              </g>
            </svg>
          </div>

          {/* Clean Sub-Caption */}
          <div className="mt-3 flex items-center gap-1.5 text-xs text-purple-800 font-semibold bg-purple-50/80 px-3.5 py-1.5 rounded-full border border-purple-200/60">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Hover or click any 3D slice to inspect partner stake & ledger</span>
          </div>
        </div>

        {/* ================= 📊 RIGHT: PARTNER CAPITAL STAKE CARDS ================= */}
        <div className="lg:col-span-6 space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-700" />
              <span>Capital-Weighted Ownership Split</span>
            </h3>
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-lg border border-purple-200">
              {directors.length} Registered Partners
            </span>
          </div>

          {/* Dynamic Partner Slices Cards with Hover Sync */}
          <div className="space-y-3">
            {slices.map((slice, idx) => {
              const isSelected = selectedDirector?.id === slice.director.id;
              const isHovered = hoveredIndex === idx;

              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => onSelectDirector(slice.director)}
                  className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${
                    isSelected || isHovered
                      ? `bg-white shadow-lg ${slice.color.border} scale-[1.02] ring-2 ring-purple-600/10`
                      : 'bg-white/80 hover:bg-white border-gray-200/90 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* Left: Avatar & Name */}
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-base shadow-sm"
                        style={{ backgroundColor: slice.color.top }}
                      >
                        {slice.director.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-gray-900">{slice.director.name}</h4>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">
                            Partner #{slice.director.id}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 font-mono mt-0.5">
                          Net Capital: <strong className="text-gray-900">Rs. {slice.capital.toLocaleString('en-PK')}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Right: Dynamic Proportion Share */}
                    <div className="text-right">
                      <div className="flex items-baseline justify-end gap-1.5">
                        <span className="text-xs font-bold text-gray-400">Capital Share:</span>
                        <span className="text-base font-black font-mono text-purple-700">
                          {slice.percentage}%
                        </span>
                      </div>
                      <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                        Undrawn: Rs. {slice.balance.toLocaleString('en-PK')}
                      </div>
                    </div>
                  </div>

                  {/* Visual 3D Progress Bar */}
                  <div className="mt-3 w-full bg-gray-100 rounded-full h-2.5 overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${slice.color.gradient} transition-all duration-700 ease-out shadow-xs`}
                      style={{ width: `${Math.max(slice.percentage > 0 ? 4 : 0, Math.min(100, slice.percentage))}%` }}
                    />
                  </div>

                  {/* Bottom Financial Quick Stats */}
                  <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <div>
                      Total Dividends Earned: <strong className="font-mono text-purple-700">Rs. {slice.profit.toLocaleString('en-PK')}</strong>
                    </div>
                    <div className="text-[11px] font-bold text-purple-700 flex items-center gap-1 hover:underline">
                      <Eye className="w-3 h-3" />
                      <span>Select partner</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
