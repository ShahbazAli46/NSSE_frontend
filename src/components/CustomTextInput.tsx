'use client';

import React from 'react';

interface CustomTextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  type?: 'text' | 'email' | 'tel' | 'password' | 'url';
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
  autoFocus?: boolean;
  multiline?: boolean;
  rows?: number;
  icon?: React.ReactNode | string;
  prefix?: string;
  maxLength?: number;
}

export default function CustomTextInput({
  value,
  onChange,
  placeholder = '',
  className = '',
  type = 'text',
  disabled = false,
  required = false,
  name,
  id,
  autoFocus = false,
  multiline = false,
  rows = 3,
  icon,
  prefix,
  maxLength,
}: CustomTextInputProps) {
  const baseClasses = `w-full text-sm font-medium bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 placeholder:font-normal focus:bg-white focus:border-[#0B462C] focus:ring-2 focus:ring-[#0B462C]/10 focus:outline-none transition-all ${
    disabled ? 'opacity-60 bg-gray-100 cursor-not-allowed' : ''
  }`;

  if (multiline) {
    return (
      <textarea
        id={id}
        name={name}
        rows={rows}
        required={required}
        disabled={disabled}
        autoFocus={autoFocus}
        placeholder={placeholder}
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className={`${baseClasses} px-3.5 py-2.5 resize-none ${className}`}
      />
    );
  }

  return (
    <div className="relative w-full flex items-center">
      {icon && (
        <span className="absolute left-3.5 text-base text-gray-400 select-none pointer-events-none flex items-center justify-center">
          {icon}
        </span>
      )}
      {prefix && (
        <span className="absolute left-3.5 text-xs font-bold text-gray-400 select-none pointer-events-none">
          {prefix}
        </span>
      )}
      <input
        type={type}
        id={id}
        name={name}
        required={required}
        disabled={disabled}
        autoFocus={autoFocus}
        placeholder={placeholder}
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className={`${baseClasses} ${
          icon ? 'pl-10 pr-3.5 py-2.5' : prefix ? 'pl-11 pr-3.5 py-2.5' : 'px-3.5 py-2.5'
        } ${className}`}
      />
    </div>
  );
}
