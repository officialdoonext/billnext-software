"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  X,
  Check,
  RotateCcw
} from "lucide-react";

export interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD or YYYY-MM-DDTHH:mm
  onChange: (value: string) => void;
  type?: "date" | "datetime-local";
  label?: string;
  placeholder?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  size?: "sm" | "md" | "lg";
  align?: "left" | "right";
  id?: string;
  showPresets?: boolean;
}

const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function formatDisplayDate(val: string, hasTime: boolean): string {
  if (!val) return "";
  try {
    if (val.includes("T")) {
      const [dPart, tPart] = val.split("T");
      const [y, m, d] = dPart.split("-").map(Number);
      const date = new Date(y, m - 1, d);
      const formatted = date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      return hasTime ? `${formatted} ${tPart.slice(0, 5)}` : formatted;
    } else {
      const [y, m, d] = val.split("-").map(Number);
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
  } catch {
    return val;
  }
}

export default function CustomDatePicker({
  value,
  onChange,
  type = "date",
  label,
  placeholder = "Select date...",
  min,
  max,
  disabled = false,
  className = "",
  buttonClassName = "",
  size = "md",
  align = "left",
  id,
  showPresets = true,
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Parse current value
  const hasTime = type === "datetime-local";
  
  // Current view month & year
  const initialDate = value ? new Date(value.includes("T") ? value.replace("T", " ") : value) : new Date();
  const validInitialDate = isNaN(initialDate.getTime()) ? new Date() : initialDate;

  const [viewYear, setViewYear] = useState<number>(validInitialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(validInitialDate.getMonth());

  // Time state for datetime-local
  const [hours, setHours] = useState<number>(validInitialDate.getHours());
  const [minutes, setMinutes] = useState<number>(validInitialDate.getMinutes());

  const [coords, setCoords] = useState<{ top: number; left: number; placeAbove: boolean }>({
    top: 0,
    left: 0,
    placeAbove: false,
  });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update view when value changes
  useEffect(() => {
    if (value) {
      try {
        const d = new Date(value.includes("T") ? value.replace("T", " ") : value);
        if (!isNaN(d.getTime())) {
          setViewYear(d.getFullYear());
          setViewMonth(d.getMonth());
          setHours(d.getHours());
          setMinutes(d.getMinutes());
        }
      } catch {}
    }
  }, [value]);

  // Position calculation
  const updateCoords = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const pickerHeight = hasTime ? 380 : 330;
    const pickerWidth = 280;

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const placeAbove = spaceBelow < pickerHeight && spaceAbove > spaceBelow;

    let left = rect.left;
    if (align === "right") {
      left = rect.right - pickerWidth;
    }
    if (left + pickerWidth > window.innerWidth - 12) {
      left = window.innerWidth - pickerWidth - 12;
    }
    if (left < 12) {
      left = 12;
    }

    setCoords({
      top: placeAbove ? rect.top - 6 : rect.bottom + 6,
      left,
      placeAbove,
    });
  }, [align, hasTime]);

  const handleOpen = () => {
    if (disabled) return;
    updateCoords();
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleToggle = () => {
    if (isOpen) {
      handleClose();
    } else {
      handleOpen();
    }
  };

  // Recalculate on scroll, resize
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

  // Handle click outside and Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
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

  // Month navigation
  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Calendar math
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sunday
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  // Selected date components
  let selectedYear: number | null = null;
  let selectedMonth: number | null = null;
  let selectedDay: number | null = null;

  if (value) {
    const dStr = value.split("T")[0];
    const parts = dStr.split("-").map(Number);
    if (parts.length === 3) {
      selectedYear = parts[0];
      selectedMonth = parts[1] - 1;
      selectedDay = parts[2];
    }
  }

  const today = new Date();
  const isToday = (day: number) =>
    today.getDate() === day &&
    today.getMonth() === viewMonth &&
    today.getFullYear() === viewYear;

  const isSelected = (day: number) =>
    selectedDay === day &&
    selectedMonth === viewMonth &&
    selectedYear === viewYear;

  // Format YYYY-MM-DD
  const formatIsoDate = (y: number, m: number, d: number) => {
    const mm = String(m + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    return `${y}-${mm}-${dd}`;
  };

  const handleSelectDay = (day: number) => {
    const dateStr = formatIsoDate(viewYear, viewMonth, day);
    if (hasTime) {
      const hh = String(hours).padStart(2, "0");
      const mm = String(minutes).padStart(2, "0");
      onChange(`${dateStr}T${hh}:${mm}`);
    } else {
      onChange(dateStr);
      handleClose();
    }
  };

  const handleTimeChange = (newHours: number, newMinutes: number) => {
    setHours(newHours);
    setMinutes(newMinutes);
    const dateStr = value ? value.split("T")[0] : formatIsoDate(viewYear, viewMonth, today.getDate());
    const hh = String(newHours).padStart(2, "0");
    const mm = String(newMinutes).padStart(2, "0");
    onChange(`${dateStr}T${hh}:${mm}`);
  };

  const setPreset = (preset: "today" | "yesterday" | "tomorrow" | "clear") => {
    if (preset === "clear") {
      onChange("");
      handleClose();
      return;
    }
    const target = new Date();
    if (preset === "yesterday") target.setDate(target.getDate() - 1);
    if (preset === "tomorrow") target.setDate(target.getDate() + 1);

    const dateStr = formatIsoDate(target.getFullYear(), target.getMonth(), target.getDate());
    setViewYear(target.getFullYear());
    setViewMonth(target.getMonth());

    if (hasTime) {
      const hh = String(hours).padStart(2, "0");
      const mm = String(minutes).padStart(2, "0");
      onChange(`${dateStr}T${hh}:${mm}`);
    } else {
      onChange(dateStr);
      handleClose();
    }
  };

  // Size styling
  const sizeClasses = {
    sm: "h-7 text-xs px-2.5 gap-1.5",
    md: "h-8.5 text-xs px-3 gap-2",
    lg: "h-10 text-sm px-3.5 gap-2.5",
  }[size];

  const displayText = formatDisplayDate(value, hasTime);

  return (
    <div className={`relative ${className}`}>
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
        aria-haspopup="dialog"
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
          <CalendarIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className={`truncate ${!displayText ? "text-zinc-400 dark:text-zinc-500 font-normal" : "font-medium"}`}>
            {displayText || placeholder}
          </span>
        </span>

        {value && !disabled ? (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            className="p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60 transition-colors cursor-pointer ml-1 shrink-0"
            title="Clear date"
          >
            <X className="w-3 h-3" />
          </span>
        ) : (
          <span className="w-3.5 h-3.5 shrink-0" />
        )}
      </button>

      {/* Portal Datepicker Popover */}
      {isMounted &&
        isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            role="dialog"
            aria-modal="true"
            style={{
              position: "fixed",
              top: coords.placeAbove ? undefined : `${coords.top}px`,
              bottom: coords.placeAbove ? `${window.innerHeight - coords.top}px` : undefined,
              left: `${coords.left}px`,
              width: "280px",
              zIndex: 99999,
            }}
            className="flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl shadow-zinc-950/20 overflow-hidden animate-in fade-in zoom-in-95 duration-100 select-none text-xs"
          >
            {/* Header: Month & Year with Navigation */}
            <div className="p-3 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between bg-zinc-50/70 dark:bg-zinc-950/40">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1 rounded-md text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 font-semibold text-zinc-900 dark:text-zinc-100 text-xs">
                <span>{MONTH_NAMES[viewMonth]}</span>
                <span className="font-mono text-zinc-500 dark:text-zinc-400">{viewYear}</span>
              </div>

              <button
                type="button"
                onClick={nextMonth}
                className="p-1 rounded-md text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Presets Bar */}
            {showPresets && (
              <div className="px-3 py-1.5 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] bg-zinc-50/30 dark:bg-zinc-900/30">
                <button
                  type="button"
                  onClick={() => setPreset("today")}
                  className="px-2 py-0.5 rounded text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-emerald-600 transition-colors cursor-pointer"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setPreset("yesterday")}
                  className="px-2 py-0.5 rounded text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-emerald-600 transition-colors cursor-pointer"
                >
                  Yesterday
                </button>
                <button
                  type="button"
                  onClick={() => setPreset("clear")}
                  className="px-2 py-0.5 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                >
                  Clear
                </button>
              </div>
            )}

            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1 px-3 pt-2 text-center text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
              {DAYS_OF_WEEK.map((d) => (
                <div key={d} className="py-0.5">
                  {d}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 p-3 pt-1">
              {/* Previous month filler days */}
              {Array.from({ length: firstDayIndex }).map((_, i) => {
                const prevDay = daysInPrevMonth - firstDayIndex + i + 1;
                return (
                  <div
                    key={`prev-${i}`}
                    className="h-7 flex items-center justify-center text-[11px] text-zinc-300 dark:text-zinc-700 select-none"
                  >
                    {prevDay}
                  </div>
                );
              })}

              {/* Current month days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const selected = isSelected(day);
                const currentToday = isToday(day);

                return (
                  <button
                    key={`day-${day}`}
                    type="button"
                    onClick={() => handleSelectDay(day)}
                    className={`h-7 w-7 mx-auto rounded-lg flex items-center justify-center text-xs font-medium transition-all duration-100 cursor-pointer ${
                      selected
                        ? "bg-[#3ECF8E] text-zinc-950 font-bold shadow-xs scale-105"
                        : currentToday
                        ? "border border-emerald-500/80 text-emerald-600 dark:text-emerald-400 font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                        : "text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Time Picker Bar (if datetime-local) */}
            {hasTime && (
              <div className="p-3 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-950/40 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                  <Clock className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[11px] font-medium">Time:</span>
                </div>

                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={String(hours).padStart(2, "0")}
                    onChange={(e) => {
                      const val = Math.min(23, Math.max(0, parseInt(e.target.value) || 0));
                      handleTimeChange(val, minutes);
                    }}
                    className="w-10 h-7 text-center rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono text-xs focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="text-zinc-400 font-bold">:</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={String(minutes).padStart(2, "0")}
                    onChange={(e) => {
                      const val = Math.min(59, Math.max(0, parseInt(e.target.value) || 0));
                      handleTimeChange(hours, val);
                    }}
                    className="w-10 h-7 text-center rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleClose}
                  className="px-2.5 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium shadow-2xs cursor-pointer"
                >
                  Done
                </button>
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}

