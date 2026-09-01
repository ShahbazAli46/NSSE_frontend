'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface CustomDatePickerProps {
  value: string; // Format: YYYY-MM-DD or empty
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  allowClear?: boolean;
  placement?: 'auto' | 'top' | 'bottom';
  align?: 'auto' | 'left' | 'right';
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function CustomDatePicker({
  value,
  onChange,
  placeholder = 'Select Date',
  className = '',
  disabled = false,
  allowClear = true,
  placement = 'auto',
  align = 'auto',
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current selected date or fallback to today
  const initialDate = value ? new Date(value + 'T00:00:00') : new Date();
  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth());

  // Update view when value changes
  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

  // Handle smart upward / downward opening and left / right alignment
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const spaceRight = window.innerWidth - rect.left;

      // Vertical positioning
      if (placement === 'top') {
        setOpenUpward(true);
      } else if (placement === 'bottom') {
        setOpenUpward(false);
      } else {
        if (spaceBelow < 330 && spaceAbove > spaceBelow) {
          setOpenUpward(true);
        } else {
          setOpenUpward(false);
        }
      }

      // Horizontal alignment
      if (align === 'right') {
        setAlignRight(true);
      } else if (align === 'left') {
        setAlignRight(false);
      } else {
        // If not enough room to expand right (w-72 is 288px), align right
        if (spaceRight < 300) {
          setAlignRight(true);
        } else {
          setAlignRight(false);
        }
      }
    }
  }, [isOpen, placement, align]);

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

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const monthStr = String(viewMonth + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const formatted = `${viewYear}-${monthStr}-${dayStr}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const handleSetToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date();
    const year = today.getFullYear();
    const monthStr = String(today.getMonth() + 1).padStart(2, '0');
    const dayStr = String(today.getDate()).padStart(2, '0');
    const formatted = `${year}-${monthStr}-${dayStr}`;
    setViewYear(year);
    setViewMonth(today.getMonth());
    onChange(formatted);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  // Calendar generation helpers
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();

  const today = new Date();
  const isCurrentMonthView =
    today.getFullYear() === viewYear && today.getMonth() === viewMonth;
  const currentDayNumber = today.getDate();

  // Format display label
  const formatDisplayValue = (val: string) => {
    if (!val) return '';
    const d = new Date(val + 'T00:00:00');
    if (isNaN(d.getTime())) return val;
    return d.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Selected date components
  let selectedYear: number | null = null;
  let selectedMonth: number | null = null;
  let selectedDay: number | null = null;
  if (value) {
    const d = new Date(value + 'T00:00:00');
    if (!isNaN(d.getTime())) {
      selectedYear = d.getFullYear();
      selectedMonth = d.getMonth();
      selectedDay = d.getDate();
    }
  }

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`px-4 py-2.5 bg-gray-50 border rounded-xl text-sm font-medium flex items-center justify-between gap-2.5 transition-all outline-none cursor-pointer ${
          isOpen
            ? 'bg-white border-[#0B462C] ring-2 ring-[#0B462C]/10 shadow-xs'
            : 'border-gray-200 hover:border-gray-300 text-gray-800'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-[#0B462C] shrink-0" />
          <span className={value ? 'text-gray-900 font-semibold' : 'text-gray-400 font-normal'}>
            {value ? formatDisplayValue(value) : placeholder}
          </span>
        </div>

        {value && allowClear && (
          <span
            onClick={handleClear}
            className="p-0.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-200/60 cursor-pointer"
            title="Clear date"
          >
            <X className="w-3 h-3" />
          </span>
        )}
      </button>

      {/* Calendar Popover */}
      {isOpen && (
        <div
          className={`absolute z-[99999] w-72 bg-white border border-gray-200 rounded-2xl shadow-2xl p-3.5 animate-fadeIn ${
            alignRight ? 'right-0' : 'left-0'
          } ${
            openUpward ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
        >
          {/* Month & Year Navigation Header */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition cursor-pointer"
              title="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="text-xs font-extrabold text-gray-900">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition cursor-pointer"
              title="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
            {DAYS_OF_WEEK.map((d) => (
              <div key={d} className="text-[10px] font-bold text-gray-400 uppercase py-0.5">
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Empty slots for days before the 1st */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="h-7 w-7" />
            ))}

            {/* Days of current month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isSelected =
                selectedYear === viewYear &&
                selectedMonth === viewMonth &&
                selectedDay === day;
              const isToday = isCurrentMonthView && currentDayNumber === day;

              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`h-7 w-7 rounded-lg text-xs font-semibold flex items-center justify-center transition cursor-pointer ${
                    isSelected
                      ? 'bg-[#0B462C] text-[#E8D4A2] font-bold shadow-xs'
                      : isToday
                      ? 'bg-emerald-50 text-[#0B462C] font-bold border border-emerald-300'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Quick Actions Footer */}
          <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={handleSetToday}
              className="font-bold text-[#0B462C] hover:underline cursor-pointer"
            >
              Today
            </button>

            {allowClear && (
              <button
                type="button"
                onClick={handleClear}
                className="font-semibold text-gray-500 hover:text-gray-800 cursor-pointer"
              >
                All Dates
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
