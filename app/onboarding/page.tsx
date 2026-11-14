"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import {
  Zap,
  Building2,
  Mail,
  Phone,
  Calendar,
  Lock,
  ArrowRight,
  LogOut,
  ShieldAlert,
  ShieldCheck,
  Sun,
  Moon,
  CheckCircle,
  HelpCircle,
  Clock,
  RefreshCw,
  CheckCircle2
} from "lucide-react";

export default function OnboardingPage() {
  const {
    user,
    profile,
    organization,
    isAllowed,
    isActive,
    isExpired,
    signOut,
    refreshStatus,
  } = useAuth();
  const router = useRouter();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  // When conditions are satisfied (Active & Not Expired), sync cookies and auto-redirect to software
  useEffect(() => {
    if (isAllowed) {
      if (typeof document !== "undefined") {
        document.cookie = "billnext_auth=1; path=/; max-age=604800; SameSite=Lax";
        document.cookie = "billnext_allowed=1; path=/; max-age=604800; SameSite=Lax";
      }

      // Auto redirect to dashboard after a short delay so user sees confirmation
      const timer = setTimeout(() => {
        window.location.href = "/";
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isAllowed]);

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

  const handleEnterSoftware = () => {
    if (typeof document !== "undefined") {
      document.cookie = "billnext_auth=1; path=/; max-age=604800; SameSite=Lax";
      document.cookie = "billnext_allowed=1; path=/; max-age=604800; SameSite=Lax";
    }
    window.location.href = "/";
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshStatus();
    setIsRefreshing(false);
  };

  // Format expiry date for human-readable display
  const formatExpiryDate = (isoString?: string) => {
    if (!isoString) return "Yesterday (Not set)";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-zinc-50/70 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Navbar */}
      <header className="h-12 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 flex items-center justify-between sticky top-0 z-30 select-none">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
            <Zap className="w-4 h-4 fill-[#3ECF8E] text-[#3ECF8E]" />
          </div>
          <span className="font-semibold text-xs tracking-tight">Bill Next Onboarding Terminal</span>

          {isAllowed ? (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              ACCESS APPROVED
            </span>
          ) : (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-semibold">
              ACCESS RESTRICTED
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Enter software button if allowed */}
          {isAllowed && (
            <button
              onClick={handleEnterSoftware}
              className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors cursor-pointer shadow-xs"
            >
              <span>Enter Software</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Refresh Status */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
            title="Refresh status from Supabase database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh Status</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors cursor-pointer"
            title={isDark ? "Light mode" : "Dark mode"}
          >
            {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-zinc-600" />}
          </button>

          {/* Sign Out */}
          <button
            onClick={() => signOut()}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border border-zinc-200 dark:border-zinc-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-medium transition-colors cursor-pointer ml-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Status Banner: Dynamic depending on isAllowed condition */}
        {isAllowed ? (
          <div className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in duration-200">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-700 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-semibold text-emerald-950 dark:text-emerald-200 text-sm">
                  Software Access Approved: Both Conditions Satisfied!
                </h2>
                <p className="text-emerald-700 dark:text-emerald-300 mt-0.5 text-xs">
                  Your organization status is <strong>Active</strong> and license expiry date is <strong>Valid</strong>. Redirecting you into Bill Next workspace...
                </p>
              </div>
            </div>

            <button
              onClick={handleEnterSoftware}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer shrink-0 self-end sm:self-auto"
            >
              <span>Go to Software Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-100 dark:bg-rose-900/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-semibold text-rose-900 dark:text-rose-200 text-sm">
                  Software Access Locked: Account Condition Unmet
                </h2>
                <p className="text-rose-700 dark:text-rose-400 mt-0.5 text-xs">
                  To access the Bill Next software (Dashboard, Billing, Items, Categories, Users, Settings), your organization status must be <strong>Active</strong> and the license expiry date must <strong>not be expired</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-rose-300 dark:border-rose-800 bg-white dark:bg-zinc-900 text-rose-700 dark:text-rose-400 font-bold">
                STATUS: {organization?.status?.toUpperCase() || "INACTIVE"}
              </span>
            </div>
          </div>
        )}

        {/* Two-Column Grid: Organization Data Card + Supabase Blueprint Dotted Canvas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Organization & Customer Data Card */}
          <div className="lg:col-span-7 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xs p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                  Registered Organization Details
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Data saved in Supabase database upon signup
                </p>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded">
                CUSTOMER PROFILE
              </span>
            </div>

            {/* Data Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Field 1: Organisation Name */}
              <div className="p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40 space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-zinc-400 font-medium">
                  <Building2 className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Organisation Name</span>
                </div>
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {organization?.name || "Testing"}
                </div>
              </div>

              {/* Field 2: Username / Email */}
              <div className="p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40 space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-zinc-400 font-medium">
                  <Mail className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Username (Email)</span>
                </div>
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {profile?.username || user?.email || "user@organization.com"}
                </div>
              </div>

              {/* Field 3: Mobile Number */}
              <div className="p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40 space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-zinc-400 font-medium">
                  <Phone className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Mobile Number</span>
                </div>
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 font-mono">
                  {organization?.mobile_number || profile?.mobile_number || "Not specified"}
                </div>
              </div>

              {/* Field 4: Status */}
              <div className="p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40 space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-zinc-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Status</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-mono font-semibold px-2 py-0.5 rounded border ${
                      isActive
                        ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                        : "border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400"
                    }`}
                  >
                    {organization?.status ? organization.status.toUpperCase() : "INACTIVE"}
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    {isActive ? "(Active)" : "(Must be Active)"}
                  </span>
                </div>
              </div>

              {/* Field 5: Expiry Date */}
              <div className="sm:col-span-2 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40 space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono uppercase text-zinc-400 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    <span>License Expiry Date</span>
                  </div>
                  <span
                    className={`font-semibold ${
                      isExpired ? "text-rose-500 dark:text-rose-400" : "text-emerald-500 dark:text-emerald-400"
                    }`}
                  >
                    {isExpired ? "EXPIRED" : "VALID"}
                  </span>
                </div>
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                  <span>{formatExpiryDate(organization?.expiry_date)}</span>
                  <span className={`text-[11px] font-normal font-mono ${isExpired ? "text-rose-500" : "text-emerald-600"}`}>
                    {isExpired ? "expiry date must be in the future" : "license valid"}
                  </span>
                </div>
              </div>
            </div>

            {/* Explanation box */}
            <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-xs space-y-1 text-zinc-600 dark:text-zinc-300">
              <div className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-zinc-500" />
                <span>Access Status</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                {isAllowed ? (
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                    Your account conditions are met (Status: Active, Expiry: Valid). You have full authorization to use all software pages (Dashboard, Billing, Items, Categories, Users, Settings). Click &quot;Enter Software&quot; above to begin.
                  </span>
                ) : (
                  <span>
                    As per policy, upon initial signup, organizations are created with <strong>Inactive</strong> status and an expired date. Once an administrator activates your account in the database, click <strong>Refresh Status</strong> to enter.
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Right Column: Dotted Blueprint Canvas & Action Box */}
          <div className="lg:col-span-5 space-y-4">
            {/* Supabase Dotted Canvas */}
            <div className="dot-grid border border-zinc-200 dark:border-zinc-800 rounded-xl relative overflow-hidden min-h-[230px] flex items-center justify-center p-6 shadow-2xs">
              <div className="absolute top-2.5 right-2.5 text-[9px] font-mono px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white/90 dark:bg-zinc-900/90 text-zinc-500">
                GATEWAY ENFORCER
              </div>

              {/* Architecture Node */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-md w-full max-w-[340px] overflow-hidden">
                <div className="p-3.5 flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-xs text-white ${
                      isAllowed ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                  >
                    {isAllowed ? <CheckCircle2 className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                      Bill Next Gateway Security
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      URL-Level Route Protection
                    </div>
                    <div
                      className={`text-[10px] font-mono mt-0.5 font-semibold ${
                        isAllowed ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
                      }`}
                    >
                      {isAllowed ? "Access: GRANTED (Active & Valid)" : "Access: DENIED (Inactive/Expired)"}
                    </div>
                  </div>
                </div>

                <div className="px-3.5 py-2 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 text-[10px] font-mono text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
                  <span>Policy: Strict RBAC</span>
                  <span className={isAllowed ? "text-emerald-600 font-bold" : "text-rose-500 font-bold"}>
                    {isAllowed ? "Passed (200 OK)" : "Blocked (403)"}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Box: Enter software if allowed, or manual verification status */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xs p-5 space-y-3.5">
              {isAllowed ? (
                <>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <h4 className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                      Authorization Complete
                    </h4>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Your workspace is unlocked. Click below to enter the Bill Next software dashboard.
                  </p>
                  <button
                    onClick={handleEnterSoftware}
                    className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                  >
                    <Zap className="w-3.5 h-3.5 fill-white" />
                    <span>Enter Bill Next Software</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <h4 className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                      Awaiting Administrator Activation
                    </h4>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Your organization is registered. Once an administrator activates your account in the Supabase database, click below to sync your status and unlock software access.
                  </p>
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="w-full py-2.5 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                    <span>{isRefreshing ? "Checking Status..." : "Check & Refresh Status"}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
