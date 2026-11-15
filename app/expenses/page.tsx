"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { Expense, ExpenseCategory } from "@/lib/auth/types";
import {
  fetchExpenses,
  addExpense,
  deleteExpense,
  fetchExpenseCategories,
  addExpenseCategory,
  deleteExpenseCategory,
} from "@/lib/data/expenses";
import {
  Wallet,
  FolderTree,
  Plus,
  Search,
  Trash2,
  Calendar,
  IndianRupee,
  Receipt,
  Layers,
  ArrowRight,
  TrendingDown,
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Tag,
  DollarSign,
  PieChart
} from "lucide-react";
import Link from "next/link";
import CustomDropdown from "@/components/ui/CustomDropdown";
import CustomDatePicker from "@/components/ui/CustomDatePicker";

export const dynamic = "force-dynamic";

export default function ExpensesPage() {
  const { organization, isLoading: authLoading, role, canEdit } = useAuth();
  const [activeTab, setActiveTab] = useState<"expenses" | "categories">("expenses");

  // Data states
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");

  // Notifications
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Add Expense Modal
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [expenseCategoryId, setExpenseCategoryId] = useState("");
  const [expenseNotes, setExpenseNotes] = useState("");

  // Add Category Modal
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");

  // Action states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const hasEditAccess = role === "owner" || canEdit("/expenses");

  // Load data
  const loadData = async () => {
    if (!organization?.id) return;
    setIsLoading(true);
    try {
      const [expList, catList] = await Promise.all([
        fetchExpenses(organization.id),
        fetchExpenseCategories(organization.id),
      ]);
      setExpenses(expList);
      setCategories(catList);
      if (catList.length > 0 && !expenseCategoryId) {
        setExpenseCategoryId(catList[0].id);
      }
    } catch (err) {
      console.error("Failed to load expenses data:", err);
      setErrorMsg("Failed to load expenses data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (organization?.id) {
      loadData();
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [organization?.id, authLoading]);

  // Totals & KPIs
  const totalExpensesSum = useMemo(() => {
    return expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  }, [expenses]);

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const todayExpensesSum = useMemo(() => {
    return expenses
      .filter((e) => e.date === todayStr)
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);
  }, [expenses, todayStr]);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return expenses.filter((e) => {
      const matchesSearch =
        !q ||
        e.name.toLowerCase().includes(q) ||
        (e.category_name && e.category_name.toLowerCase().includes(q)) ||
        (e.notes && e.notes.toLowerCase().includes(q));

      const matchesCat =
        selectedCategoryFilter === "all" ||
        e.category_id === selectedCategoryFilter ||
        e.category_name === selectedCategoryFilter;

      return matchesSearch && matchesCat;
    });
  }, [expenses, searchQuery, selectedCategoryFilter]);

  // Filtered Categories
  const filteredCategories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return categories.filter((c) => !q || c.name.toLowerCase().includes(q));
  }, [categories, searchQuery]);

  // Category expense breakdown counts
  const categoryStats = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    categories.forEach((c) => map.set(c.id, { count: 0, total: 0 }));

    expenses.forEach((e) => {
      if (e.category_id && map.has(e.category_id)) {
        const item = map.get(e.category_id)!;
        item.count += 1;
        item.total += e.amount || 0;
      }
    });

    return map;
  }, [categories, expenses]);

  // Open Add Expense modal
  const handleOpenAddExpense = () => {
    setErrorMsg(null);
    setExpenseName("");
    setExpenseAmount("");
    setExpenseDate(new Date().toISOString().split("T")[0]);
    setExpenseNotes("");
    if (categories.length > 0) {
      setExpenseCategoryId(categories[0].id);
    }
    setIsAddExpenseOpen(true);
  };

  // Open Add Category modal
  const handleOpenAddCategory = () => {
    setErrorMsg(null);
    setCategoryName("");
    setIsAddCategoryOpen(true);
  };

  // Submit Expense
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization?.id) return;

    const trimmedName = expenseName.trim();
    const numAmount = parseFloat(expenseAmount);

    if (!trimmedName) {
      setErrorMsg("Please enter expense name.");
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg("Please enter a valid amount greater than 0.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const selectedCat = categories.find((c) => c.id === expenseCategoryId);

    try {
      await addExpense(organization.id, {
        name: trimmedName,
        amount: numAmount,
        date: expenseDate || new Date().toISOString().split("T")[0],
        category_id: expenseCategoryId || null,
        category_name: selectedCat?.name || "General",
        notes: expenseNotes.trim() || undefined,
      });

      setSuccessMsg(`Expense "${trimmedName}" (₹${numAmount.toFixed(2)}) recorded successfully!`);
      setIsAddExpenseOpen(false);
      await loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save expense.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization?.id) return;

    const trimmed = categoryName.trim();
    if (!trimmed) {
      setErrorMsg("Please enter category name.");
      return;
    }

    if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg(`A category named "${trimmed}" already exists.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const newCat = await addExpenseCategory(organization.id, trimmed);
      setSuccessMsg(`Expense category "${trimmed}" added!`);
      setIsAddCategoryOpen(false);
      await loadData();
      setExpenseCategoryId(newCat.id);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save category.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Expense
  const handleDeleteExpense = async (id: string, name: string) => {
    if (!organization?.id) return;
    if (!confirm(`Are you sure you want to delete expense "${name}"?`)) return;

    setDeletingId(id);
    try {
      await deleteExpense(organization.id, id);
      setSuccessMsg(`Expense "${name}" removed.`);
      await loadData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to delete expense.");
    } finally {
      setDeletingId(null);
    }
  };

  // Delete Category
  const handleDeleteCategory = async (id: string, name: string) => {
    if (!organization?.id) return;
    if (!confirm(`Delete category "${name}"?`)) return;

    setDeletingId(id);
    try {
      await deleteExpenseCategory(organization.id, id);
      setSuccessMsg(`Category "${name}" removed.`);
      await loadData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to delete category.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                Expenses & Cost Tracker
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  {organization?.name || "Store"}
                </span>
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Record store spending, vendor payments, utility bills & track profit deductions
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          {hasEditAccess ? (
            activeTab === "expenses" ? (
              <button
                onClick={handleOpenAddExpense}
                className="px-3.5 py-2 text-xs font-medium rounded-lg bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Expense</span>
              </button>
            ) : (
              <button
                onClick={handleOpenAddCategory}
                className="px-3.5 py-2 text-xs font-medium rounded-lg bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Category</span>
              </button>
            )
          ) : (
            <div className="text-xs font-mono text-zinc-400 dark:text-zinc-500 px-3 py-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
              View Only Access
            </div>
          )}
        </div>
      </div>

      {/* Global Alerts */}
      {successMsg && (
        <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-600 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Financial KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Expenses */}
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-mono uppercase tracking-wider font-medium">TOTAL EXPENSES</span>
            <Wallet className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
            ₹{totalExpensesSum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
            <span>{expenses.length} entries recorded</span>
          </div>
        </div>

        {/* Card 2: Today's Expenses */}
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-mono uppercase tracking-wider font-medium">TODAY&apos;S EXPENSES</span>
            <Calendar className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
            ₹{todayExpensesSum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {new Date().toLocaleDateString("en-IN", { dateStyle: "medium" })}
          </div>
        </div>

        {/* Card 3: Categories Count */}
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-mono uppercase tracking-wider font-medium">EXPENSE CATEGORIES</span>
            <FolderTree className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
            {categories.length}
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Active cost classifications
          </div>
        </div>

        {/* Card 4: Average per Entry */}
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-mono uppercase tracking-wider font-medium">AVG COST / ENTRY</span>
            <TrendingDown className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
            ₹{expenses.length > 0 ? (totalExpensesSum / expenses.length).toFixed(2) : "0.00"}
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Operational spending rate
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab("expenses")}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "expenses"
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Expenses List</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
              {expenses.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("categories")}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "categories"
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>Expense Categories</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
              {categories.length}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: EXPENSES LIST                                                      */}
      {/* ========================================================================= */}
      {activeTab === "expenses" && (
        <div className="space-y-4">
          {/* Search & Category Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search expense by name, notes or category..."
                className="w-full text-xs pl-9 pr-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="w-56 shrink-0">
              <CustomDropdown
                value={selectedCategoryFilter}
                onChange={setSelectedCategoryFilter}
                options={[
                  { value: "all", label: `All Categories (${categories.length})` },
                  ...categories.map((c) => ({ value: c.id, label: c.name })),
                ]}
                size="sm"
              />
            </div>
          </div>

          {/* Expenses Table */}
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                <span className="text-xs text-zinc-500 font-mono">Loading organization expenses...</span>
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 mx-auto flex items-center justify-center text-zinc-400">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {searchQuery ? "No expenses match your search" : "No expenses recorded yet"}
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-sm mx-auto mt-1">
                    Record operating costs such as rent, salaries, electricity, and inventory purchases to calculate net profit accurately.
                  </p>
                </div>
                {hasEditAccess && !searchQuery && (
                  <button
                    onClick={handleOpenAddExpense}
                    className="mt-2 px-3 py-1.5 text-xs rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Record First Expense
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-medium">
                    <tr>
                      <th className="px-4 py-3">Expense Name</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Notes</th>
                      <th className="px-4 py-3 text-right">Amount (₹)</th>
                      {hasEditAccess && <th className="px-4 py-3 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {filteredExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="px-4 py-3.5 font-medium text-zinc-900 dark:text-zinc-100">
                          {exp.name}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-400">
                            <Tag className="w-2.5 h-2.5" />
                            {exp.category_name || "General"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
                          {exp.date}
                        </td>
                        <td className="px-4 py-3.5 text-zinc-500 dark:text-zinc-400 max-w-[200px] truncate">
                          {exp.notes || "—"}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-semibold text-rose-600 dark:text-rose-400">
                          ₹{exp.amount.toFixed(2)}
                        </td>
                        {hasEditAccess && (
                          <td className="px-4 py-3.5 text-right">
                            <button
                              onClick={() => handleDeleteExpense(exp.id, exp.name)}
                              disabled={deletingId === exp.id}
                              title="Delete expense"
                              className="p-1.5 rounded-md text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              {deletingId === exp.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: EXPENSE CATEGORIES LIST                                            */}
      {/* ========================================================================= */}
      {activeTab === "categories" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search expense category..."
                className="w-full text-xs pl-9 pr-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                <span className="text-xs text-zinc-500 font-mono">Loading categories...</span>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 mx-auto flex items-center justify-center text-zinc-400">
                  <FolderTree className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    No expense categories found
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-medium">
                    <tr>
                      <th className="px-4 py-3">Category Name</th>
                      <th className="px-4 py-3">Entries Count</th>
                      <th className="px-4 py-3">Total Amount Spent</th>
                      {hasEditAccess && <th className="px-4 py-3 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {filteredCategories.map((cat) => {
                      const stat = categoryStats.get(cat.id) || { count: 0, total: 0 };
                      return (
                        <tr key={cat.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                          <td className="px-4 py-3.5 font-medium text-zinc-900 dark:text-zinc-100">
                            <div className="flex items-center gap-2">
                              <FolderTree className="w-3.5 h-3.5 text-emerald-500" />
                              <span>{cat.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 font-mono text-zinc-600 dark:text-zinc-400">
                            <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                              {stat.count} {stat.count === 1 ? "expense" : "expenses"}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                            ₹{stat.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          {hasEditAccess && (
                            <td className="px-4 py-3.5 text-right">
                              <button
                                onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                disabled={deletingId === cat.id}
                                title="Delete category"
                                className="p-1.5 rounded-md text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                {deletingId === cat.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD EXPENSE                                                      */}
      {/* ========================================================================= */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600">
                  <Wallet className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Record New Expense
                </h3>
              </div>
              <button
                onClick={() => setIsAddExpenseOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="p-5 space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Expense Name */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Expense Name / Description <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={expenseName}
                  onChange={(e) => setExpenseName(e.target.value)}
                  placeholder="e.g. November Shop Rent, Electricity Bill, Packaging Bags"
                  required
                  className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Expense Category Dropdown */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddExpenseOpen(false);
                      setIsAddCategoryOpen(true);
                    }}
                    className="text-[11px] text-emerald-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add New Category
                  </button>
                </div>
                <CustomDropdown
                  value={expenseCategoryId}
                  onChange={setExpenseCategoryId}
                  placeholder="Select Category"
                  options={categories.map((c) => ({ value: c.id, label: c.name }))}
                  size="md"
                />
              </div>

              {/* Amount & Date in 2 columns */}
              <div className="grid grid-cols-2 gap-3">
                {/* Amount */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="text-xs font-mono text-zinc-400 absolute left-3 top-2">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      placeholder="0.00"
                      required
                      className="w-full text-xs pl-7 pr-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono font-semibold"
                    />
                  </div>
                </div>

                {/* Date (Default today) */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Expense Date <span className="text-rose-500">*</span>
                  </label>
                  <CustomDatePicker
                    value={expenseDate}
                    onChange={setExpenseDate}
                    size="md"
                  />
                </div>
              </div>

              {/* Notes (Optional) */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Notes / Payment Reference (Optional)
                </label>
                <input
                  type="text"
                  value={expenseNotes}
                  onChange={(e) => setExpenseNotes(e.target.value)}
                  placeholder="e.g. Paid via UPI to landlord / Invoice #1029"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseOpen(false)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-medium rounded-lg bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Expense</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD CATEGORY                                                     */}
      {/* ========================================================================= */}
      {isAddCategoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600">
                  <FolderTree className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Add Expense Category
                </h3>
              </div>
              <button
                onClick={() => setIsAddCategoryOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-5 space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="e.g. Marketing, Printing, Water Cans"
                  required
                  className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddCategoryOpen(false)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-medium rounded-lg bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Category</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

