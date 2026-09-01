'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode | string;
  description?: string;
}

interface CustomDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  disabled?: boolean;
  placement?: 'auto' | 'top' | 'bottom';
}

export default function CustomDropdown({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  className = '',
  buttonClassName = '',
  disabled = false,
  placement = 'auto',
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Smart upward/downward positioning
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      if (placement === 'top') {
        setOpenUpward(true);
      } else if (placement === 'bottom') {
        setOpenUpward(false);
      } else {
        const rect = dropdownRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        // If less than 260px available below and more space above, flip upward
        if (spaceBelow < 260 && spaceAbove > spaceBelow) {
          setOpenUpward(true);
        } else {
          setOpenUpward(false);
        }
      }
    }
  }, [isOpen, placement]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
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

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm font-medium flex items-center justify-between text-left transition-all cursor-pointer outline-none ${
          isOpen
            ? 'bg-white border-[#0B462C] ring-2 ring-[#0B462C]/10 shadow-sm'
            : 'border-gray-200 hover:border-gray-300 focus:border-[#0B462C]'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${buttonClassName}`}
      >
        <div className="flex items-center gap-2.5 truncate">
          {selectedOption ? (
            <>
              {selectedOption.icon && (
                <span className="text-base shrink-0">{selectedOption.icon}</span>
              )}
              <span className="text-gray-900 font-medium truncate">{selectedOption.label}</span>
            </>
          ) : value ? (
            <>
              <span className="text-base shrink-0">🏷️</span>
              <span className="text-gray-900 font-medium truncate">{value}</span>
            </>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </div>

        <ChevronDown
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#0B462C]' : ''
          }`}
        />
      </button>

      {/* Options Menu */}
      {isOpen && (
        <div
          className={`absolute z-50 left-0 right-0 bg-white border border-gray-100 rounded-2xl shadow-2xl py-2 max-h-56 overflow-y-auto animate-fadeIn ${
            openUpward ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#0B462C]/5 text-[#0B462C] font-semibold'
                    : 'text-gray-700 hover:bg-gray-50 font-medium'
                }`}
              >
                <div className="flex items-center gap-3">
                  {option.icon && <span className="text-lg shrink-0">{option.icon}</span>}
                  <div>
                    <div className={isSelected ? 'text-[#0B462C]' : 'text-gray-900'}>
                      {option.label}
                    </div>
                    {option.description && (
                      <div className="text-xs text-gray-400 font-normal mt-0.5">
                        {option.description}
                      </div>
                    )}
                  </div>
                </div>

                {isSelected && <Check className="w-4 h-4 text-[#0B462C] shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
