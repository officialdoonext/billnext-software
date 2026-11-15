"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { Bill, Expense, ExpenseCategory } from "@/lib/auth/types";
import { fetchBills } from "@/lib/data/bills";
import { fetchExpenses, fetchExpenseCategories } from "@/lib/data/expenses";
import {
  RevenueExpenseBarChart,
  RevenueAreaChart,
  DonutPieChart,
  FinancialProgressMeters,
  BarDataPoint,
  TrendPoint,
  DonutSegment,
} from "./DashboardCharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  Wallet,
  ArrowRight,
  Calendar,
  Layers,
  Percent,
  QrCode,
  Banknote,
  CreditCard,
  Building2,
  Package,
  FolderTree,
  Users,
  Settings,
  Sparkles,
  Loader2,
  RefreshCw,
  Clock,
  CheckCircle2,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Filter
} from "lucide-react";

export type DateFilterType =
  | "today"
  | "yesterday"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "this_year"
  | "last_year"
  | "custom";

export default function DashboardView() {
  const { organization, isLoading: authLoading, canView, role } = useAuth();

  // Date Filter State (default: today)
  const [dateFilter, setDateFilter] = useState<DateFilterType>("today");
  const [customFromDate, setCustomFromDate] = useState("");
  const [customToDate, setCustomToDate] = useState("");

  // Data States
  const [bills, setBills] = useState<Bill[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Compute ISO Range for Date Filter
  const getDateRange = (filter: DateFilterType) => {
    const now = new Date();
    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
    const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

    switch (filter) {
      case "today": {
        return { fromDate: startOfDay(now).toISOString(), toDate: endOfDay(now).toISOString() };
      }
      case "yesterday": {
        const y = new Date(now);
        y.setDate(y.getDate() - 1);
        return { fromDate: startOfDay(y).toISOString(), toDate: endOfDay(y).toISOString() };
      }
      case "this_week": {
        const d = new Date(now);
        const day = d.getDay(); // 0 is Sunday
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
        const monday = new Date(d.setDate(diff));
        return { fromDate: startOfDay(monday).toISOString(), toDate: endOfDay(now).toISOString() };
      }
      case "last_week": {
        const d = new Date(now);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1) - 7;
        const lastMonday = new Date(d.setDate(diff));
        const lastSunday = new Date(lastMonday);
        lastSunday.setDate(lastMonday.getDate() + 6);
        return { fromDate: startOfDay(lastMonday).toISOString(), toDate: endOfDay(lastSunday).toISOString() };
      }
      case "this_month": {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        return { fromDate: startOfDay(firstDay).toISOString(), toDate: endOfDay(now).toISOString() };
      }
      case "last_month": {
        const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        return {
          fromDate: startOfDay(firstDayLastMonth).toISOString(),
          toDate: endOfDay(lastDayLastMonth).toISOString(),
        };
      }
      case "this_year": {
        const firstDayYear = new Date(now.getFullYear(), 0, 1);
        return { fromDate: startOfDay(firstDayYear).toISOString(), toDate: endOfDay(now).toISOString() };
      }
      case "last_year": {
        const firstDayLastYear = new Date(now.getFullYear() - 1, 0, 1);
        const lastDayLastYear = new Date(now.getFullYear() - 1, 11, 31);
        return {
          fromDate: startOfDay(firstDayLastYear).toISOString(),
          toDate: endOfDay(lastDayLastYear).toISOString(),
        };
      }
      case "custom": {
        const from = customFromDate ? startOfDay(new Date(customFromDate)).toISOString() : undefined;
        const to = customToDate ? endOfDay(new Date(customToDate)).toISOString() : undefined;
        return { fromDate: from, toDate: to };
      }
      default:
        return {};
    }
  };

  // Load Dashboard Data (Bills + Expenses + Expense Categories)
  const loadDashboardData = async () => {
    if (!organization?.id) return;
    setIsLoading(true);

    try {
      const range = getDateRange(dateFilter);
      const [billsRes, expList, catList] = await Promise.all([
        fetchBills(organization.id, {
          fromDate: range.fromDate,
          toDate: range.toDate,
          limit: 1000,
        }),
        fetchExpenses(organization.id, {
          fromDate: range.fromDate ? range.fromDate.split("T")[0] : undefined,
          toDate: range.toDate ? range.toDate.split("T")[0] : undefined,
        }),
        fetchExpenseCategories(organization.id),
      ]);

      setBills(billsRes.bills || []);
      setExpenses(expList || []);
      setCategories(catList || []);
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (organization?.id) {
      loadDashboardData();
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [organization?.id, dateFilter, customFromDate, customToDate, authLoading]);

  // =========================================================================
  // FINANCIAL CALCULATIONS (REVENUE, EXPENSES, PROFIT/LOSS, TENDERS, GST)
  // =========================================================================
  const totalRevenue = useMemo(() => {
    return bills.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);
  }, [bills]);

  const totalExpenses = useMemo(() => {
    return expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  }, [expenses]);

  const netProfitLoss = useMemo(() => {
    return totalRevenue - totalExpenses;
  }, [totalRevenue, totalExpenses]);

  const profitLossPercentage = useMemo(() => {
    if (totalRevenue > 0) {
      return (netProfitLoss / totalRevenue) * 100;
    }
    if (totalExpenses > 0) {
      return -100;
    }
    return 0;
  }, [netProfitLoss, totalRevenue, totalExpenses]);

  // Payment method breakdowns (including split bills)
  const paymentBreakdown = useMemo(() => {
    let upi = 0;
    let cash = 0;
    let card = 0;

    bills.forEach((b) => {
      if (b.payment_method === "UPI") {
        upi += b.total_amount || 0;
      } else if (b.payment_method === "CASH") {
        cash += b.total_amount || 0;
      } else if (b.payment_method === "CARD") {
        card += b.total_amount || 0;
      } else if (b.payment_method === "SPLIT" && b.split_details) {
        upi += b.split_details.upi || 0;
        cash += b.split_details.cash || 0;
        card += b.split_details.card || 0;
      }
    });

    return { upi, cash, card, total: upi + cash + card };
  }, [bills]);

  // Total GST Collected
  const totalGstCollected = useMemo(() => {
    return bills.reduce((acc, curr) => acc + (curr.tax_amount || 0), 0);
  }, [bills]);

  // =========================================================================
  // CHART DATA PREPARATIONS
  // =========================================================================

  // 1. Bar Chart Points: Group by sub-intervals (e.g. days or hours)
  const barChartData: BarDataPoint[] = useMemo(() => {
    if (dateFilter === "today" || dateFilter === "yesterday") {
      // 4 Time slots for day: Morning, Noon, Evening, Night
      const slots = [
        { label: "Morning (6-12)", revenue: 0, expenses: 0 },
        { label: "Afternoon (12-16)", revenue: 0, expenses: 0 },
        { label: "Evening (16-20)", revenue: 0, expenses: 0 },
        { label: "Night (20-24)", revenue: 0, expenses: 0 },
      ];

      bills.forEach((b) => {
        const hour = new Date(b.created_at).getHours();
        if (hour < 12) slots[0].revenue += b.total_amount;
        else if (hour < 16) slots[1].revenue += b.total_amount;
        else if (hour < 20) slots[2].revenue += b.total_amount;
        else slots[3].revenue += b.total_amount;
      });

      // Distribute expenses across slots
      expenses.forEach((e, idx) => {
        slots[idx % 4].expenses += e.amount;
      });

      return slots;
    }

    // Default 7-day interval
    const daysMap = new Map<string, { label: string; revenue: number; expenses: number }>();
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      daysMap.set(key, { label: `${dayNames[d.getDay()]} ${d.getDate()}`, revenue: 0, expenses: 0 });
    }

    bills.forEach((b) => {
      const key = b.created_at.split("T")[0];
      if (daysMap.has(key)) {
        daysMap.get(key)!.revenue += b.total_amount;
      }
    });

    expenses.forEach((e) => {
      const key = e.date;
      if (daysMap.has(key)) {
        daysMap.get(key)!.expenses += e.amount;
      }
    });

    return Array.from(daysMap.values());
  }, [bills, expenses, dateFilter]);

  // 2. Area Chart Points: Sales trend timeline
  const areaChartData: TrendPoint[] = useMemo(() => {
    if (barChartData.length > 0) {
      return barChartData.map((d) => ({ label: d.label, value: d.revenue }));
    }
    return [
      { label: "Mon", value: 0 },
      { label: "Tue", value: 0 },
      { label: "Wed", value: 0 },
      { label: "Thu", value: 0 },
      { label: "Fri", value: 0 },
      { label: "Sat", value: 0 },
      { label: "Sun", value: 0 },
    ];
  }, [barChartData]);

  // 3. Donut Chart 1: Tender Distribution
  const tenderDonutSegments: DonutSegment[] = useMemo(() => {
    return [
      { label: "UPI (Scan & Pay)", value: paymentBreakdown.upi, color: "#3ECF8E", textColor: "text-emerald-500" },
      { label: "CASH (Currency)", value: paymentBreakdown.cash, color: "#F59E0B", textColor: "text-amber-500" },
      { label: "CARD (POS Terminal)", value: paymentBreakdown.card, color: "#3B82F6", textColor: "text-blue-500" },
    ];
  }, [paymentBreakdown]);

  // 4. Donut Chart 2: Expense Categories Breakdown
  const expenseCatSegments: DonutSegment[] = useMemo(() => {
    const catMap = new Map<string, number>();
    categories.forEach((c) => catMap.set(c.name, 0));

    expenses.forEach((e) => {
      const catName = e.category_name || "General";
      catMap.set(catName, (catMap.get(catName) || 0) + e.amount);
    });

    const colors = ["#EF4444", "#F97316", "#EC4899", "#8B5CF6", "#06B6D4", "#10B981", "#64748B"];
    return Array.from(catMap.entries())
      .filter(([_, val]) => val > 0)
      .map(([name, val], idx) => ({
        label: name,
        value: val,
        color: colors[idx % colors.length],
        textColor: "text-zinc-600",
      }));
  }, [expenses, categories]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                Executive Financial Dashboard
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  {organization?.name || "Store Overview"}
                </span>
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Real-time revenue, expense metrics, profit & loss, tender splits, and interactive charts
              </p>
            </div>
          </div>
        </div>

        {/* Quick Shortcut Buttons */}
        <div className="flex items-center gap-2">
          <Link
            href="/billing"
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5" />
            New Bill (POS)
          </Link>
          <Link
            href="/expenses"
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Wallet className="w-3.5 h-3.5 text-rose-500" />
            Record Expense
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DATE RANGE FILTER BAR (Today, Yesterday, This/Last Week, Month, Year, Custom) */}
      {/* ========================================================================= */}
      <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            <Filter className="w-4 h-4 text-emerald-500" />
            <span>Select Timeframe:</span>
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "today", label: "Today" },
              { id: "yesterday", label: "Yesterday" },
              { id: "this_week", label: "This Week" },
              { id: "last_week", label: "Last Week" },
              { id: "this_month", label: "This Month" },
              { id: "last_month", label: "Last Month" },
              { id: "this_year", label: "This Year" },
              { id: "last_year", label: "Last Year" },
              { id: "custom", label: "Custom Range" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setDateFilter(f.id as DateFilterType)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  dateFilter === f.id
                    ? "bg-[#3ECF8E] text-black font-semibold shadow-xs"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Range Picker Strip */}
        {dateFilter === "custom" && (
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-wrap items-center gap-3 text-xs animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 font-mono text-[11px]">FROM:</span>
              <input
                type="date"
                value={customFromDate}
                onChange={(e) => setCustomFromDate(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-zinc-500 font-mono text-[11px]">TO:</span>
              <input
                type="date"
                value={customToDate}
                onChange={(e) => setCustomToDate(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <button
              onClick={loadDashboardData}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors cursor-pointer"
            >
              Apply Filter
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5 MAIN FINANCIAL METRIC CARDS (REVENUE, EXPENSES, PROFIT/LOSS, TENDERS, GST) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Revenue */}
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-mono uppercase tracking-wider font-medium">TOTAL REVENUE</span>
            <div className="w-6 h-6 rounded-md bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
            ₹{totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {bills.length} invoices settled
          </div>
        </div>

        {/* Card 2: Total Expenses */}
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-mono uppercase tracking-wider font-medium">TOTAL EXPENSES</span>
            <div className="w-6 h-6 rounded-md bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600">
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
            ₹{totalExpenses.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {expenses.length} expense vouchers
          </div>
        </div>

        {/* Card 3: Net Profit / Loss */}
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-mono uppercase tracking-wider font-medium">NET PROFIT / LOSS</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                netProfitLoss >= 0
                  ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                  : "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
              }`}
            >
              {profitLossPercentage >= 0 ? `+${profitLossPercentage.toFixed(1)}%` : `${profitLossPercentage.toFixed(1)}%`}
            </span>
          </div>
          <div
            className={`text-xl font-bold font-mono ${
              netProfitLoss >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {netProfitLoss >= 0 ? "+" : ""}₹{netProfitLoss.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {netProfitLoss >= 0 ? "Net Surplus / Margin" : "Operational Deficit"}
          </div>
        </div>

        {/* Card 4: Tenders Split (UPI, Cash, Card) */}
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-mono uppercase tracking-wider font-medium">TENDER SPLIT</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <div className="space-y-1 pt-0.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-500 flex items-center gap-1">
                <QrCode className="w-3 h-3 text-emerald-500" /> UPI:
              </span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">₹{paymentBreakdown.upi.toFixed(0)}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-500 flex items-center gap-1">
                <Banknote className="w-3 h-3 text-amber-500" /> CASH:
              </span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">₹{paymentBreakdown.cash.toFixed(0)}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-500 flex items-center gap-1">
                <CreditCard className="w-3 h-3 text-blue-500" /> CARD:
              </span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">₹{paymentBreakdown.card.toFixed(0)}</span>
            </div>
          </div>
        </div>

        {/* Card 5: GST Collected */}
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-mono uppercase tracking-wider font-medium">GST COLLECTED</span>
            <div className="w-6 h-6 rounded-md bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600">
              <Percent className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
            ₹{totalGstCollected.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
            CGST + SGST tax output
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* GRAPHS ROW 1: BAR CHART (REV VS EXP) & AREA GRAPH (SALES TREND)           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart Container */}
        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
          <RevenueExpenseBarChart data={barChartData} />
        </div>

        {/* Area Graph Container */}
        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
          <RevenueAreaChart data={areaChartData} />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* GRAPHS ROW 2: PIE / DONUT CHARTS & PROGRESS METERS                        */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donut Chart 1: Payment Method Breakdown */}
        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              Payment Tenders Share (Donut)
            </h3>
            <span className="text-[10px] font-mono text-zinc-400">Total ₹{paymentBreakdown.total.toFixed(0)}</span>
          </div>
          <DonutPieChart
            segments={tenderDonutSegments}
            centerTitle={`₹${paymentBreakdown.total.toFixed(0)}`}
            centerSubtitle="Collected"
          />
        </div>

        {/* Donut Chart 2: Expense Category Share */}
        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              Expense Categories (Pie/Donut)
            </h3>
            <span className="text-[10px] font-mono text-zinc-400">{expenses.length} Vouchers</span>
          </div>
          {expenseCatSegments.length > 0 ? (
            <DonutPieChart
              segments={expenseCatSegments}
              centerTitle={`₹${totalExpenses.toFixed(0)}`}
              centerSubtitle="Expenses"
            />
          ) : (
            <div className="h-44 flex flex-col items-center justify-center text-center text-zinc-400 text-xs">
              <Wallet className="w-6 h-6 mb-1 text-zinc-300" />
              <span>No expenses in selected date range</span>
            </div>
          )}
        </div>

        {/* Progress Gauges & Multi-Bar Meters */}
        <div className="space-y-4">
          <FinancialProgressMeters
            revenue={totalRevenue}
            expenses={totalExpenses}
            profit={netProfitLoss}
            profitMargin={profitLossPercentage}
            upi={paymentBreakdown.upi}
            cash={paymentBreakdown.cash}
            card={paymentBreakdown.card}
            gstAmount={totalGstCollected}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BOTTOM SECTION: RECENT SETTLED BILLS LIST & QUICK SHORTCUTS               */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bills (2/3 width) */}
        <div className="lg:col-span-2 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-500" />
              <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                Recent Invoices ({bills.slice(0, 5).length} of {bills.length})
              </h3>
            </div>
            <Link
              href="/sales"
              className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              View Sales Ledger <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {bills.length === 0 ? (
            <div className="py-10 text-center text-zinc-400 text-xs">
              No bills found for the selected timeframe.
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {bills.slice(0, 5).map((b) => (
                <div key={b.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100 font-mono">
                      {b.bill_number}
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      {b.customer_name || "Walk-in Customer"} &bull;{" "}
                      {new Date(b.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      ₹{b.total_amount.toFixed(2)}
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      {b.payment_method}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Module Navigation (1/3 width) */}
        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-3">
          <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            Quick Navigation
          </h3>

          <div className="space-y-1.5">
            {[
              { title: "Point of Sale (POS)", href: "/billing", icon: Receipt, badge: "POS" },
              { title: "Sales Invoices", href: "/sales", icon: TrendingUp, badge: "Ledger" },
              { title: "Expenses & Petty Cash", href: "/expenses", icon: Wallet, badge: "Costs" },
              { title: "Products & Stock", href: "/items", icon: Package, badge: "Catalog" },
              { title: "Item Categories", href: "/categories", icon: FolderTree, badge: "Tax Slabs" },
              { title: "Customer Ledger", href: "/customers", icon: Users, badge: "CRM" },
              { title: "Users & RBAC", href: "/users", icon: Users, badge: "Staff" },
              { title: "Settings & GST", href: "/settings", icon: Settings, badge: "Config" },
            ]
              .filter((m) => canView(m.href))
              .map((mod) => {
                const Icon = mod.icon;
                return (
                  <Link
                    key={mod.href}
                    href={mod.href}
                    className="p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/80 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-zinc-400 group-hover:text-emerald-500 transition-colors" />
                      <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                        {mod.title}
                      </span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
