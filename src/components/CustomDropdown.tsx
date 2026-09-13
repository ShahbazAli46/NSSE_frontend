'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, Plus, X } from 'lucide-react';

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
  searchable?: boolean;
  creatable?: boolean;
  searchPlaceholder?: string;
  onCreateOption?: (newLabel: string) => void;
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
  searchable = false,
  creatable = false,
  searchPlaceholder = 'Search...',
  onCreateOption,
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value || opt.label.toLowerCase() === value?.toLowerCase());

  // Filter options based on search query
  const filteredOptions = (searchable || creatable) && searchTerm.trim()
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        (opt.description && opt.description.toLowerCase().includes(searchTerm.toLowerCase().trim()))
      )
    : options;

  // Check if search query exact matches an existing option
  const exactMatch = options.some(
    (opt) => opt.label.toLowerCase() === searchTerm.trim().toLowerCase() || opt.value.toLowerCase() === searchTerm.trim().toLowerCase()
  );

  // Focus search input on open
  useEffect(() => {
    if (isOpen && (searchable || creatable)) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchTerm('');
    }
  }, [isOpen, searchable, creatable]);

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
        if (spaceBelow < 280 && spaceAbove > spaceBelow) {
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
    setSearchTerm('');
  };

  const handleCreateNew = () => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return;
    onChange(trimmed);
    if (onCreateOption) {
      onCreateOption(trimmed);
    }
    setIsOpen(false);
    setSearchTerm('');
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
          className={`absolute z-50 left-0 right-0 bg-white border border-gray-200 rounded-2xl shadow-2xl py-2 max-h-64 overflow-y-auto animate-fadeIn ${
            openUpward ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
        >
          {/* Search / Create Input Box */}
          {(searchable || creatable) && (
            <div className="px-3 pb-2 mb-1 border-b border-gray-100">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (filteredOptions.length > 0 && filteredOptions[0].value) {
                        handleSelect(filteredOptions[0].value);
                      } else if (creatable && searchTerm.trim() && !exactMatch) {
                        handleCreateNew();
                      }
                    }
                  }}
                  placeholder={creatable ? 'Type to search or create new...' : searchPlaceholder}
                  className="w-full pl-8 pr-7 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#0B462C] transition-all"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Creatable Quick Add Action */}
          {creatable && searchTerm.trim() && !exactMatch && (
            <div className="px-2 pb-1.5 pt-0.5">
              <button
                type="button"
                onClick={handleCreateNew}
                className="w-full px-3 py-2 text-left text-xs font-bold rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <div className="w-5 h-5 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0">
                  <Plus className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  Create <span className="underline font-black">"{searchTerm.trim()}"</span>
                </div>
              </button>
            </div>
          )}

          {/* Filtered Option Items */}
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => {
              const isSelected = option.value === value || (!option.value && !value);
              return (
                <button
                  key={option.value || 'empty'}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full px-4 py-2 text-left text-sm flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#0B462C]/5 text-[#0B462C] font-semibold'
                      : 'text-gray-700 hover:bg-gray-50 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {option.icon && <span className="text-base shrink-0">{option.icon}</span>}
                    <div className="truncate">
                      <div className={`truncate ${isSelected ? 'text-[#0B462C]' : 'text-gray-900'}`}>
                        {option.label}
                      </div>
                      {option.description && (
                        <div className="text-[11px] text-gray-400 font-normal mt-0.5 truncate">
                          {option.description}
                        </div>
                      )}
                    </div>
                  </div>

                  {isSelected && <Check className="w-4 h-4 text-[#0B462C] shrink-0" />}
                </button>
              );
            })
          ) : (
            !creatable && (
              <div className="px-4 py-3 text-center text-xs text-gray-400 font-medium">
                No matching options found
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
