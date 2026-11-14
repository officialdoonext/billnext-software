"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { Bill, BillItem } from "@/lib/auth/types";
import { fetchBills } from "@/lib/data/bills";
import {
  TrendingUp,
  Receipt,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Printer,
  Eye,
  FileText,
  Building2,
  Loader2,
  CreditCard,
  Banknote,
  QrCode,
  Layers,
  ArrowRight,
  Filter,
  DollarSign
} from "lucide-react";

export const dynamic = "force-dynamic";

type DateFilterType =
  | "today"
  | "yesterday"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "this_year"
  | "last_year"
  | "custom";

export default function SalesPage() {
  const { organization, isLoading: authLoading } = useAuth();

  // Bills Data & Pagination State
  const [bills, setBills] = useState<Bill[]>([]);
  const [totalBillsCount, setTotalBillsCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Date Filter State
  const [dateFilter, setDateFilter] = useState<DateFilterType>("today");
  const [customFromDate, setCustomFromDate] = useState("");
  const [customToDate, setCustomToDate] = useState("");

  // Search Filter
  const [searchQuery, setSearchQuery] = useState("");

  // Receipt Modal State
  const [selectedReceipt, setSelectedReceipt] = useState<Bill | null>(null);

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

  // Load Bills strictly 24 per page
  const loadBills = async (pageToLoad: number = 1) => {
    if (!organization?.id) return;
    try {
      setIsLoading(true);
      const { fromDate, toDate } = getDateRange(dateFilter);
      const res = await fetchBills(organization.id, {
        fromDate,
        toDate,
        page: pageToLoad,
        limit: 24, // strictly fetch latest 24
      });
      setBills(res.bills);
      setTotalBillsCount(res.total);
      setCurrentPage(res.page);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error("Error loading bills:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (organization?.id) {
      loadBills(1);
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [organization?.id, dateFilter, customFromDate, customToDate, authLoading]);

  // Aggregate Metrics for current view
  const totalRevenue = bills.reduce((acc, b) => acc + (b.total_amount || 0), 0);
  const totalTax = bills.reduce((acc, b) => acc + (b.tax_amount || 0), 0);
  const avgOrderValue = bills.length > 0 ? totalRevenue / bills.length : 0;

  // Filter bills by search query
  const filteredBills = bills.filter(
    (b) =>
      b.bill_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.customer_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.customer_mobile || "").includes(searchQuery)
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb & Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 mb-1">
            <Link href="/" className="hover:text-emerald-500 transition-colors">
              Bill Next
            </Link>
            <span>/</span>
            <span className="text-zinc-400">Transactions</span>
            <span>/</span>
            <span className="text-zinc-900 dark:text-zinc-100 font-medium">Sales Ledger</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <TrendingUp className="w-6 h-6 text-emerald-500" />
            Sales Ledger & Invoices
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Complete transaction history and settled invoices for{" "}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {organization?.name || "Your Organization"}
            </span>
            .
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/billing"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md bg-[#3ECF8E] hover:bg-[#34b27b] text-black shadow-sm transition-all"
          >
            <Receipt className="w-4 h-4" />
            Open Billing Terminal
          </Link>
        </div>
      </div>

      {/* Sales Summary Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>Invoiced Sales</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            ₹{totalRevenue.toFixed(2)}
          </div>
          <p className="text-[11px] text-zinc-400 mt-1 capitalize">{dateFilter.replace("_", " ")} volume</p>
        </div>

        <div className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>Orders Settled</span>
            <Receipt className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
            {totalBillsCount}
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Receipts in selected timeframe</p>
        </div>

        <div className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>Avg Ticket Size</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
            ₹{avgOrderValue.toFixed(2)}
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Average per customer receipt</p>
        </div>

        <div className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>Total GST Collected</span>
            <FileText className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
            ₹{totalTax.toFixed(2)}
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">CGST + SGST tax ledger</p>
        </div>
      </div>

      {/* Date Filter & Search Toolbar */}
      <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Date Filter Dropdown / Selection */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1.5 shrink-0">
              <Calendar className="w-3.5 h-3.5 text-emerald-500" />
              Period:
            </span>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilterType)}
              className="py-1.5 px-3 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 text-zinc-800 dark:text-zinc-200 font-medium"
            >
              <option value="today">Today (Default)</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This Week</option>
              <option value="last_week">Last Week</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="this_year">This Year</option>
              <option value="last_year">Last Year</option>
              <option value="custom">Custom Date Range</option>
            </select>

            {/* Custom Date Range Pickers (shown when custom is selected) */}
            {dateFilter === "custom" && (
              <div className="flex items-center gap-1.5 text-xs">
                <input
                  type="date"
                  value={customFromDate}
                  onChange={(e) => setCustomFromDate(e.target.value)}
                  className="py-1 px-2 text-xs font-mono bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md"
                />
                <span className="text-zinc-400 font-mono">&rarr;</span>
                <input
                  type="date"
                  value={customToDate}
                  onChange={(e) => setCustomToDate(e.target.value)}
                  className="py-1 px-2 text-xs font-mono bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md"
                />
              </div>
            )}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Bill No, Customer or Phone..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
            />
          </div>
        </div>
      </div>

      {/* Main Table of Bills */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-16 text-center flex flex-col items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mb-2" />
            <p className="text-xs text-zinc-500">Fetching sales records...</p>
          </div>
        ) : filteredBills.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
              <Receipt className="w-6 h-6 text-zinc-400" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              No sales records found
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mt-1">
              No bills were settled during this timeframe. Head over to the Billing Terminal to process a checkout.
            </p>
            <Link
              href="/billing"
              className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md bg-[#3ECF8E] hover:bg-[#34b27b] text-black shadow-sm"
            >
              <Receipt className="w-3.5 h-3.5" />
              Go to Billing Register
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-950/60 border-b border-zinc-200 dark:border-zinc-800 font-medium text-zinc-500 dark:text-zinc-400">
                <tr>
                  <th className="py-3 px-4 w-12 font-mono">#</th>
                  <th className="py-3 px-4">Bill No</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items Summary</th>
                  <th className="py-3 px-4">Tender</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                  <th className="py-3 px-4 text-right">Tax (GST)</th>
                  <th className="py-3 px-4 text-right">Total (₹)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredBills.map((bill, index) => {
                  const billDate = new Date(bill.created_at);
                  return (
                    <tr
                      key={bill.id}
                      className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-zinc-400">
                        {(currentPage - 1) * 24 + index + 1}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-zinc-900 dark:text-zinc-100">
                        {bill.bill_number}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-zinc-500">
                        <div>{billDate.toLocaleDateString()}</div>
                        <div className="text-[10px] text-zinc-400">
                          {billDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {bill.customer_name || "Walk-in Customer"}
                        </div>
                        {bill.customer_mobile && (
                          <div className="text-[10px] font-mono text-zinc-400">
                            {bill.customer_mobile}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                          {bill.items?.length || 0} items
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                            bill.payment_method === "UPI"
                              ? "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300"
                              : bill.payment_method === "CASH"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : bill.payment_method === "CARD"
                              ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                          }`}
                        >
                          {bill.payment_method}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-zinc-600 dark:text-zinc-400">
                        ₹{Number(bill.subtotal).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-zinc-500">
                        ₹{Number(bill.tax_amount).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{Number(bill.total_amount).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedReceipt(bill)}
                          title="View & Print Receipt"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
                        >
                          <Eye className="w-3 h-3 text-emerald-500" />
                          Receipt
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Strict 24-Bills Pagination Bar */}
        <div className="p-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
          <div className="text-zinc-500 font-mono text-[11px]">
            Showing up to 24 records per page &bull; Total {totalBillsCount} bills recorded
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1 || isLoading}
              onClick={() => loadBills(currentPage - 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </button>
            <span className="font-mono text-[11px] px-2 font-semibold text-zinc-700 dark:text-zinc-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages || isLoading}
              onClick={() => loadBills(currentPage + 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RECEIPT VIEW & REPRINT MODAL                                              */}
      {/* ========================================================================= */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Tax Invoice: {selectedReceipt.bill_number}
                </h3>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-zinc-400 hover:text-zinc-600 text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto font-mono text-xs text-zinc-800 dark:text-zinc-200 space-y-3 bg-zinc-50 dark:bg-zinc-950">
              {/* Store Header */}
              <div className="text-center space-y-1 pb-3 border-b border-dashed border-zinc-300 dark:border-zinc-700">
                {organization?.logo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={organization.logo_url}
                    alt="Logo"
                    className="w-12 h-12 mx-auto object-contain mb-1"
                  />
                )}
                <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 uppercase">
                  {organization?.name || "BILL NEXT RETAIL"}
                </div>
                {organization?.address && (
                  <div className="text-[10px] text-zinc-500">{organization.address}</div>
                )}
                {organization?.city && (
                  <div className="text-[10px] text-zinc-500">City: {organization.city}</div>
                )}
                {organization?.mobile_number && (
                  <div className="text-[10px] text-zinc-500">Ph: {organization.mobile_number}</div>
                )}
                {organization?.gst_enabled && organization?.gst_number && (
                  <div className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300">
                    GSTIN: {organization.gst_number}
                  </div>
                )}
              </div>

              {/* Bill Meta */}
              <div className="text-[11px] space-y-0.5 pb-2 border-b border-dashed border-zinc-300 dark:border-zinc-700">
                <div className="flex justify-between">
                  <span>Bill No: {selectedReceipt.bill_number}</span>
                  <span>{new Date(selectedReceipt.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Customer: {selectedReceipt.customer_name}</span>
                  <span>{new Date(selectedReceipt.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                {selectedReceipt.customer_mobile && (
                  <div>Mobile: {selectedReceipt.customer_mobile}</div>
                )}
              </div>

              {/* Items Table */}
              <div className="space-y-1.5 py-2 border-b border-dashed border-zinc-300 dark:border-zinc-700">
                <div className="flex justify-between text-[10px] font-bold text-zinc-500">
                  <span>ITEM / QTY</span>
                  <span>AMT</span>
                </div>
                {selectedReceipt.items?.map((it: BillItem, idx: number) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <div className="pr-2">
                      <div>{it.name}</div>
                      <div className="text-[10px] text-zinc-400">
                        {it.quantity} {it.unit} &times; ₹{Number(it.price).toFixed(2)}
                      </div>
                    </div>
                    <div className="font-bold">₹{Number(it.total).toFixed(2)}</div>
                  </div>
                ))}
              </div>

              {/* Totals & Tax */}
              <div className="space-y-1 text-[11px] pt-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{Number(selectedReceipt.subtotal).toFixed(2)}</span>
                </div>
                {Number(selectedReceipt.tax_amount) > 0 && (
                  <>
                    <div className="flex justify-between text-zinc-500">
                      <span>GST ({selectedReceipt.gst_percentage}%):</span>
                      <span>₹{Number(selectedReceipt.tax_amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-400">
                      <span>CGST / SGST:</span>
                      <span>
                        ₹{(Number(selectedReceipt.tax_amount) / 2).toFixed(2)} / ₹{(Number(selectedReceipt.tax_amount) / 2).toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-zinc-300 dark:border-zinc-700">
                  <span>NET TOTAL:</span>
                  <span>₹{Number(selectedReceipt.total_amount).toFixed(2)}</span>
                </div>
                <div className="text-[10px] text-zinc-500 pt-1">
                  Payment Tender: <strong>{selectedReceipt.payment_method}</strong>
                </div>
              </div>

              {/* Footer Note */}
              <div className="text-center text-[10px] text-zinc-400 pt-3 border-t border-dashed border-zinc-300 dark:border-zinc-700">
                Thank you for shopping with us!
              </div>
            </div>

            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2 bg-white dark:bg-zinc-900">
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="px-3.5 py-1.5 text-xs font-medium rounded border border-zinc-200 dark:border-zinc-800"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded bg-[#3ECF8E] hover:bg-[#34b27b] text-black shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                Reprint Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
