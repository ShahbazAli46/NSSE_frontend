'use client';

import React from 'react';

interface CustomNumberInputProps {
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  prefix?: string;
  min?: number;
  max?: number;
  allowDecimal?: boolean;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
  autoFocus?: boolean;
}

export default function CustomNumberInput({
  value,
  onChange,
  placeholder = 'Enter amount',
  className = '',
  prefix,
  min,
  max,
  allowDecimal = false,
  disabled = false,
  required = false,
  name,
  id,
  autoFocus = false,
}: CustomNumberInputProps) {
  const stringValue = value !== undefined && value !== null ? String(value) : '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;

    // Filter characters
    if (allowDecimal) {
      // Allow only digits and at most one decimal point
      raw = raw.replace(/[^0-9.]/g, '');
      const parts = raw.split('.');
      if (parts.length > 2) {
        raw = parts[0] + '.' + parts.slice(1).join('');
      }
    } else {
      // Allow only digits
      raw = raw.replace(/[^0-9]/g, '');
    }

    // Min / Max clamp if numeric
    if (raw !== '') {
      const num = parseFloat(raw);
      if (!isNaN(num)) {
        if (max !== undefined && num > max) {
          raw = String(max);
        }
      }
    }

    onChange(raw);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow navigation, backspace, delete, tab, enter, copy/paste shortcuts
    if (
      [
        'Backspace',
        'Delete',
        'Tab',
        'Escape',
        'Enter',
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        'Home',
        'End',
      ].includes(e.key) ||
      (e.ctrlKey === true || e.metaKey === true) // allow Cmd+A, Cmd+C, Cmd+V, etc.
    ) {
      return;
    }

    // Decimal point handling
    if (allowDecimal && e.key === '.') {
      if (stringValue.includes('.')) {
        e.preventDefault();
      }
      return;
    }

    // Block non-digit keys
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <div className="relative w-full flex items-center">
      {prefix && (
        <span className="absolute left-3.5 text-xs font-bold text-gray-400 select-none pointer-events-none">
          {prefix}
        </span>
      )}
      <input
        type="text"
        inputMode={allowDecimal ? 'decimal' : 'numeric'}
        pattern={allowDecimal ? '[0-9]*[.]?[0-9]*' : '[0-9]*'}
        id={id}
        name={name}
        required={required}
        disabled={disabled}
        autoFocus={autoFocus}
        placeholder={placeholder}
        value={stringValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={`w-full text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#0B462C] focus:ring-2 focus:ring-[#0B462C]/10 focus:outline-none transition-all placeholder:text-gray-400 placeholder:font-normal ${
          prefix ? 'pl-11 pr-3.5 py-2.5' : 'px-3.5 py-2.5'
        } ${disabled ? 'opacity-60 bg-gray-100 cursor-not-allowed' : ''} ${className}`}
      />
    </div>
  );
}
