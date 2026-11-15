"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check, Search, X } from "lucide-react";

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
  description?: string;
  disabled?: boolean;
}

export interface CustomDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  label?: string;
  id?: string;
  size?: "sm" | "md" | "lg";
  align?: "left" | "right";
  fullWidth?: boolean;
}

export default function CustomDropdown({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  searchable,
  disabled = false,
  className = "",
  buttonClassName = "",
  label,
  id,
  size = "md",
  align = "left",
  fullWidth = true,
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; placeAbove: boolean }>({
    top: 0,
    left: 0,
    width: 0,
    placeAbove: false,
  });
  const [isMounted, setIsMounted] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Determine if search should be enabled
  const shouldSearch = searchable ?? options.length > 5;

  // Selected option
  const selectedOption = options.find((opt) => opt.value === value);

  // Filtered options based on search
  const filteredOptions = options.filter((opt) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      opt.label.toLowerCase().includes(q) ||
      opt.value.toLowerCase().includes(q) ||
      (opt.description && opt.description.toLowerCase().includes(q))
    );
  });

  // Calculate coordinates for portal placement
  const updateCoords = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = Math.min(filteredOptions.length * 40 + (shouldSearch ? 60 : 20), 320);
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const placeAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

    const width = Math.max(rect.width, 180);
    let left = rect.left;
    if (align === "right") {
      left = rect.right - width;
    }
    // Bound within viewport horizontally
    if (left + width > window.innerWidth - 12) {
      left = window.innerWidth - width - 12;
    }
    if (left < 12) {
      left = 12;
    }

    setCoords({
      top: placeAbove ? rect.top - 6 : rect.bottom + 6,
      left,
      width,
      placeAbove,
    });
  }, [align, filteredOptions.length, shouldSearch]);

  const handleOpen = () => {
    if (disabled) return;
    updateCoords();
    setIsOpen(true);
    setSearchQuery("");
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleToggle = () => {
    if (isOpen) {
      handleClose();
    } else {
      handleOpen();
    }
  };

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && shouldSearch) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, shouldSearch]);

  // Recalculate on scroll, resize, or open
  useEffect(() => {
    if (!isOpen) return;

    const onScrollOrResize = () => {
      updateCoords();
    };

    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);

    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [isOpen, updateCoords]);

  // Handle click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        handleClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Size styling
  const sizeClasses = {
    sm: "h-7 text-xs px-2.5 gap-1.5",
    md: "h-8.5 text-xs px-3 gap-2",
    lg: "h-10 text-sm px-3.5 gap-2.5",
  }[size];

  return (
    <div className={`relative ${fullWidth ? "w-full" : "inline-block"} ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 cursor-pointer"
          onClick={() => triggerRef.current?.click()}
        >
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between rounded-lg border font-medium transition-all duration-150 select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${sizeClasses} ${
          disabled
            ? "opacity-50 cursor-not-allowed bg-zinc-100 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 text-zinc-400"
            : isOpen
            ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
            : "border-zinc-300 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 shadow-2xs"
        } ${buttonClassName}`}
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption?.icon && (
            <span className="shrink-0 text-zinc-500 dark:text-zinc-400">{selectedOption.icon}</span>
          )}
          <span className={`truncate ${!selectedOption ? "text-zinc-400 dark:text-zinc-500 font-normal" : "font-medium"}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0">
              {selectedOption.badge}
            </span>
          )}
        </span>

        <ChevronDown
          className={`w-3.5 h-3.5 text-zinc-400 shrink-0 ml-1 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-emerald-500" : ""
          }`}
        />
      </button>

      {/* Portal Dropdown Menu */}
      {isMounted &&
        isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            role="listbox"
            tabIndex={-1}
            style={{
              position: "fixed",
              top: coords.placeAbove ? undefined : `${coords.top}px`,
              bottom: coords.placeAbove ? `${window.innerHeight - coords.top}px` : undefined,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              maxHeight: "320px",
              zIndex: 99999,
            }}
            className="flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl shadow-zinc-950/20 overflow-hidden animate-in fade-in zoom-in-95 duration-100 select-none text-xs"
          >
            {/* Search Input */}
            {shouldSearch && (
              <div className="p-2 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-950/40 shrink-0">
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search options..."
                    className="w-full pl-8 pr-7 py-1 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 rounded-md text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Options List */}
            <div className="overflow-y-auto overscroll-contain py-1 max-h-[260px] divide-y divide-zinc-100/50 dark:divide-zinc-800/30">
              {filteredOptions.length === 0 ? (
                <div className="py-6 text-center text-zinc-400 dark:text-zinc-500">
                  <p className="text-xs">No matching options</p>
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = option.value === value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      disabled={option.disabled}
                      onClick={() => {
                        if (option.disabled) return;
                        onChange(option.value);
                        handleClose();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors cursor-pointer ${
                        option.disabled
                          ? "opacity-40 cursor-not-allowed"
                          : isSelected
                          ? "bg-emerald-50/70 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-semibold"
                          : "text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 font-medium"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {option.icon && (
                          <span
                            className={`shrink-0 ${
                              isSelected ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"
                            }`}
                          >
                            {option.icon}
                          </span>
                        )}
                        <div className="truncate">
                          <div className="truncate flex items-center gap-1.5">
                            <span>{option.label}</span>
                            {option.badge && (
                              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-normal">
                                {option.badge}
                              </span>
                            )}
                          </div>
                          {option.description && (
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-normal truncate mt-0.5">
                              {option.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

