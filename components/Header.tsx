"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { usePrinter } from "@/lib/printer/printer-context";
import PrinterConnectModal from "@/components/printer/PrinterConnectModal";
import {
  ChevronsUpDown,
  Box,
  GitBranch,
  Search,
  HelpCircle,
  Bell,
  Sun,
  Moon,
  Zap,
  PlugZap,
  Database,
  Check,
  MessageSquare,
  LogOut,
  ShieldCheck,
  Building2,
  User,
  Printer,
  Usb,
  Bluetooth
} from "lucide-react";

interface HeaderProps {
  onOpenSearch: () => void;
}

export default function Header({ onOpenSearch }: HeaderProps) {
  const { organization, profile, user, signOut } = useAuth();
  const { isConnected, connectionType, deviceName } = usePrinter();
  const [isDark, setIsDark] = useState(false);
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    // Check initial dark mode from DOM or localStorage
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDark(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    }
  };

  const orgDisplayName = organization?.name || "Gama Next";
  const userInitials = orgDisplayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "BN";

  return (
    <>
      <header className="h-12 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3.5 flex items-center justify-between text-xs sticky top-0 z-40 select-none">
        {/* Left Side: Brand & Workspace / Project / Branch Breadcrumbs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {/* Brand Icon: Green Lightning Bolt */}
          <Link
            href="/"
            className="flex items-center justify-center w-7 h-7 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
            title="Bill Next Home"
          >
            <Zap className="w-4 h-4 fill-[#3ECF8E] text-[#3ECF8E]" />
          </Link>

          <span className="text-zinc-300 dark:text-zinc-700 font-light text-sm">/</span>

          {/* Workspace Dropdown */}
          <button
            className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-medium transition-colors cursor-pointer shrink-0"
            title={`Workspace: ${orgDisplayName}`}
          >
            <Database className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-xs font-semibold truncate max-w-[120px]">{orgDisplayName}</span>
            <span className="text-[10px] uppercase font-mono px-1 py-0.2 rounded border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-medium leading-none">
              ACTIVE
            </span>
            <ChevronsUpDown className="w-3 h-3 text-zinc-400 ml-0.5" />
          </button>

          <span className="text-zinc-300 dark:text-zinc-700 font-light text-sm">/</span>

          {/* Project Dropdown */}
          <button
            className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-medium transition-colors cursor-pointer shrink-0"
            title="Project: Bill Next"
          >
            <Box className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-xs font-semibold">Bill Next</span>
            <ChevronsUpDown className="w-3 h-3 text-zinc-400 ml-0.5" />
          </button>

          <span className="text-zinc-300 dark:text-zinc-700 font-light text-sm">/</span>

          {/* Branch Dropdown */}
          <button
            className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-medium transition-colors cursor-pointer shrink-0"
            title="Branch: main (Production)"
          >
            <GitBranch className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-xs font-medium">main</span>
            <span className="text-[10px] uppercase font-mono px-1 py-0.2 rounded border border-amber-300 dark:border-amber-800/80 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-medium leading-none">
              PRODUCTION
            </span>
            <ChevronsUpDown className="w-3 h-3 text-zinc-400 ml-0.5" />
          </button>

          {/* Thermal Printer Connect Button */}
          <button
            onClick={() => setShowPrinterModal(true)}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-medium transition-all cursor-pointer shrink-0 ml-1 shadow-xs ${
              isConnected
                ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/40"
                : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
            }`}
            title={
              isConnected
                ? `Thermal Printer Connected: ${deviceName || connectionType?.toUpperCase()}`
                : "Connect USB or Bluetooth Thermal Receipt Printer"
            }
          >
            {isConnected ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Printer className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="font-semibold truncate max-w-[110px]">
                  {deviceName || (connectionType === "usb" ? "USB Printer" : "BT Printer")}
                </span>
              </>
            ) : (
              <>
                <PlugZap className="w-3.5 h-3.5 text-zinc-500" />
                <span>Connect</span>
              </>
            )}
          </button>
        </div>

        {/* Right Side: Feedback, Search, Help, Notifications, Theme, User Avatar */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Feedback */}
          <button
            onClick={() => setShowFeedbackModal(true)}
            className="hidden md:inline-flex items-center px-2 py-1 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
          >
            Feedback
          </button>

          {/* Search Button (Ctrl + K) */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors cursor-pointer text-xs"
            title="Search pages (Ctrl + K)"
          >
            <Search className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="hidden sm:inline-flex items-center text-[10px] font-mono bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 px-1 py-0.2 rounded shadow-2xs">
              Ctrl K
            </kbd>
          </button>

          {/* Help Circle */}
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors"
            title="Help & Documentation"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </a>

          {/* Notifications Bell */}
          <button
            className="relative w-7 h-7 flex items-center justify-center rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors"
            title="Notifications"
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors"
            title={isDark ? "Switch to Light mode" : "Switch to Dark mode"}
          >
            {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-zinc-600" />}
          </button>

          {/* User Profile Avatar with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-7 h-7 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center font-semibold text-[11px] ml-1 cursor-pointer border border-zinc-300 dark:border-zinc-700 select-none hover:ring-2 hover:ring-emerald-500/30 transition-all"
              title={`Logged in as ${profile?.username || user?.email || "Admin"}`}
            >
              {userInitials}
            </button>

            {showUserMenu && (
              <div
                className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-3.5 py-2 border-b border-zinc-100 dark:border-zinc-800 space-y-1">
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {orgDisplayName}
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                    {profile?.username || user?.email || "admin@billnext.dev"}
                  </div>
                  <div className="pt-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      STATUS: ACTIVE
                    </span>
                  </div>
                </div>

                <div className="p-1">
                  <Link
                    href="/onboarding"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Organization Info</span>
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Project Settings</span>
                  </Link>

                  <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      signOut();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Quick Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-500" />
                <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Send Feedback</h3>
              </div>
              <button
                onClick={() => {
                  setShowFeedbackModal(false);
                  setFeedbackSent(false);
                }}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            {feedbackSent ? (
              <div className="py-6 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
                  <Check className="w-5 h-5" />
                </div>
                <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">Thank you for your feedback!</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Our engineering team has received your note.</p>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Have thoughts on the Bill Next layout or upcoming features? Let us know:
                </p>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="What would you like to see in Billing, Items, Categories, or Users?"
                  rows={4}
                  className="w-full text-xs p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => setShowFeedbackModal(false)}
                    className="px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (feedbackText.trim()) setFeedbackSent(true);
                    }}
                    className="px-3.5 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-xs transition-colors"
                  >
                    Submit
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hardware Printer Connect Modal */}
      <PrinterConnectModal
        isOpen={showPrinterModal}
        onClose={() => setShowPrinterModal(false)}
      />
    </>
  );
}
