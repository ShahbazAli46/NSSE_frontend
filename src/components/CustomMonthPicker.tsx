'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface CustomMonthPickerProps {
  value: string; // Format: YYYY-MM or empty
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  allowClear?: boolean;
  align?: 'left' | 'right' | 'auto';
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_SHORT_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export default function CustomMonthPicker({
  value,
  onChange,
  placeholder = 'All Months',
  className = '',
  disabled = false,
  allowClear = true,
  align = 'right',
}: CustomMonthPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [openToRight, setOpenToRight] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current year from value or today
  const initialYear = value ? parseInt(value.split('-')[0], 10) : new Date().getFullYear();
  const [viewYear, setViewYear] = useState<number>(initialYear || new Date().getFullYear());

  useEffect(() => {
    if (value) {
      const parts = value.split('-');
      if (parts.length >= 1) {
        const y = parseInt(parts[0], 10);
        if (!isNaN(y)) setViewYear(y);
      }
    }
  }, [value]);

  // Handle smart upward / downward & left / right positioning
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const spaceRight = window.innerWidth - rect.left;

      if (spaceBelow < 280 && spaceAbove > spaceBelow) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }

      if (align === 'left') {
        setOpenToRight(true);
      } else if (align === 'right') {
        setOpenToRight(false);
      } else {
        // Auto
        setOpenToRight(spaceRight >= 280);
      }
    }
  }, [isOpen, align]);

  // Click outside & Escape key listeners
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handlePrevYear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewYear((y) => y - 1);
  };

  const handleNextYear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewYear((y) => y + 1);
  };

  const handleSelectMonth = (monthIndex: number) => {
    const monthStr = String(monthIndex + 1).padStart(2, '0');
    const formatted = `${viewYear}-${monthStr}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const handleSetCurrentMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date();
    const year = today.getFullYear();
    const monthStr = String(today.getMonth() + 1).padStart(2, '0');
    const formatted = `${year}-${monthStr}`;
    setViewYear(year);
    onChange(formatted);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  // Format display label: "August 2026"
  const formatDisplayValue = (val: string) => {
    if (!val) return '';
    const parts = val.split('-');
    if (parts.length === 2) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      if (!isNaN(y) && m >= 0 && m < 12) {
        return `${MONTH_NAMES[m]} ${y}`;
      }
    }
    return val;
  };

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  // Selected year and month
  let selectedYear: number | null = null;
  let selectedMonth: number | null = null;
  if (value) {
    const parts = value.split('-');
    if (parts.length === 2) {
      selectedYear = parseInt(parts[0], 10);
      selectedMonth = parseInt(parts[1], 10) - 1;
    }
  }

  const isCurrentMonthSelected = value === `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
          isOpen
            ? 'border-[#0B462C] bg-white ring-2 ring-[#0B462C]/10 text-gray-900 shadow-xs'
            : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300 text-gray-800'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center gap-2 truncate">
          <CalendarIcon className={`w-4 h-4 shrink-0 ${value ? 'text-[#0B462C]' : 'text-gray-400'}`} />
          <span className="truncate">
            {value ? formatDisplayValue(value) : <span className="text-gray-400 font-normal">{placeholder}</span>}
          </span>
        </div>

        {value && allowClear && !disabled && (
          <span
            onClick={handleClear}
            className="p-0.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-700 ml-1.5 shrink-0"
            title="Clear"
          >
            <X className="w-3 h-3" />
          </span>
        )}
      </button>

      {/* Month Selector Popover */}
      {isOpen && (
        <div
          className={`absolute z-50 ${openToRight ? 'left-0' : 'right-0'} w-64 bg-white border border-gray-200 rounded-2xl shadow-2xl p-3.5 animate-in fade-in ${
            openUpward ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
        >
          {/* Year Navigation Header */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
            <button
              type="button"
              onClick={handlePrevYear}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition cursor-pointer"
              title="Previous year"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="text-sm font-extrabold text-gray-900">
              {viewYear}
            </div>

            <button
              type="button"
              onClick={handleNextYear}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition cursor-pointer"
              title="Next year"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* 12 Months Grid */}
          <div className="grid grid-cols-3 gap-1.5 text-center">
            {MONTH_SHORT_NAMES.map((name, idx) => {
              const isSelected = selectedYear === viewYear && selectedMonth === idx;
              const isThisMonth = currentYear === viewYear && currentMonth === idx;

              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleSelectMonth(idx)}
                  className={`py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    isSelected
                      ? 'bg-[#0B462C] text-[#E8D4A2] font-bold shadow-xs'
                      : isThisMonth
                      ? 'bg-emerald-50 text-[#0B462C] font-bold border border-emerald-300'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>

          {/* Quick Actions Footer */}
          <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={handleSetCurrentMonth}
              className={`font-bold transition cursor-pointer ${
                isCurrentMonthSelected ? 'text-gray-400' : 'text-[#0B462C] hover:underline'
              }`}
            >
              This Month
            </button>

            {value && allowClear && (
              <button
                type="button"
                onClick={handleClear}
                className="text-gray-500 hover:text-red-600 transition cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
