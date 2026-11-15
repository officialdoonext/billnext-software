import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Expense, ExpenseCategory } from "@/lib/auth/types";

function getLocalExpenseCatsKey(orgId: string): string {
  return `billnext_expense_cats_${orgId}`;
}

function getLocalExpensesKey(orgId: string): string {
  return `billnext_expenses_${orgId}`;
}

const DEFAULT_EXPENSE_CATEGORIES = [
  "Store Rent",
  "Staff Salaries",
  "Electricity & Utilities",
  "Inventory Purchases",
  "Maintenance & Repairs",
  "Packaging & Bags",
  "Tea & Refreshments",
  "Miscellaneous",
];

/**
 * Fetch all expense categories for an organization
 */
export async function fetchExpenseCategories(orgId: string): Promise<ExpenseCategory[]> {
  if (!orgId) return [];

  // Try Supabase first
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("expense_categories")
        .select("*")
        .eq("org_id", orgId)
        .order("name", { ascending: true });

      if (!error && data && data.length > 0) {
        if (typeof window !== "undefined") {
          localStorage.setItem(getLocalExpenseCatsKey(orgId), JSON.stringify(data));
        }
        return data as ExpenseCategory[];
      }
    } catch (err) {
      console.warn("Supabase fetch expense categories fallback to local:", err);
    }
  }

  // Fallback to local storage
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(getLocalExpenseCatsKey(orgId));
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {}
    }

    // Initialize with default categories if brand new
    const initialCats: ExpenseCategory[] = DEFAULT_EXPENSE_CATEGORIES.map((name, idx) => ({
      id: `exp_cat_${idx + 1}_${Date.now()}`,
      org_id: orgId,
      name,
      created_at: new Date().toISOString(),
    }));

    localStorage.setItem(getLocalExpenseCatsKey(orgId), JSON.stringify(initialCats));
    return initialCats;
  }

  return [];
}

/**
 * Add a new expense category
 */
export async function addExpenseCategory(orgId: string, name: string): Promise<ExpenseCategory> {
  const trimmed = name.trim();
  if (!orgId) throw new Error("Organization ID is required");
  if (!trimmed) throw new Error("Category name is required");

  // Try Supabase first
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("expense_categories")
        .insert([{ org_id: orgId, name: trimmed }])
        .select()
        .single();

      if (!error && data) {
        const newCat = data as ExpenseCategory;
        if (typeof window !== "undefined") {
          const current = await fetchExpenseCategories(orgId);
          const updated = [newCat, ...current.filter((c) => c.id !== newCat.id)];
          localStorage.setItem(getLocalExpenseCatsKey(orgId), JSON.stringify(updated));
        }
        return newCat;
      }
    } catch (err) {
      console.warn("Supabase add expense category error:", err);
    }
  }

  // Local fallback
  const newCat: ExpenseCategory = {
    id: `exp_cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    org_id: orgId,
    name: trimmed,
    created_at: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    const current = await fetchExpenseCategories(orgId);
    const updated = [newCat, ...current.filter((c) => c.id !== newCat.id)];
    localStorage.setItem(getLocalExpenseCatsKey(orgId), JSON.stringify(updated));
  }

  return newCat;
}

/**
 * Delete an expense category
 */
export async function deleteExpenseCategory(orgId: string, categoryId: string): Promise<boolean> {
  if (!orgId || !categoryId) return false;

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      await supabase.from("expense_categories").delete().eq("id", categoryId).eq("org_id", orgId);
    } catch (err) {
      console.warn("Supabase delete expense category note:", err);
    }
  }

  if (typeof window !== "undefined") {
    const current = await fetchExpenseCategories(orgId);
    const updated = current.filter((c) => c.id !== categoryId);
    localStorage.setItem(getLocalExpenseCatsKey(orgId), JSON.stringify(updated));
  }

  return true;
}

/**
 * Fetch all expenses for an organization
 */
export async function fetchExpenses(
  orgId: string,
  params?: { fromDate?: string; toDate?: string }
): Promise<Expense[]> {
  if (!orgId) return [];

  // Try Supabase first
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      let query = supabase
        .from("expenses")
        .select("*, expense_categories(name)")
        .eq("org_id", orgId)
        .order("date", { ascending: false });

      if (params?.fromDate) {
        query = query.gte("date", params.fromDate);
      }
      if (params?.toDate) {
        query = query.lte("date", params.toDate);
      }

      const { data, error } = await query;
      if (!error && data) {
        const formatted: Expense[] = data.map((row: any) => ({
          id: row.id,
          org_id: row.org_id,
          name: row.name,
          category_id: row.category_id,
          category_name: row.expense_categories?.name || "General",
          amount: Number(row.amount) || 0,
          date: row.date || new Date().toISOString().split("T")[0],
          notes: row.notes || "",
          created_at: row.created_at,
          updated_at: row.updated_at,
        }));

        if (typeof window !== "undefined") {
          localStorage.setItem(getLocalExpensesKey(orgId), JSON.stringify(formatted));
        }
        return formatted;
      }
    } catch (err) {
      console.warn("Supabase fetch expenses fallback to local:", err);
    }
  }

  // Fallback to local storage
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(getLocalExpensesKey(orgId));
    if (raw) {
      try {
        let items: Expense[] = JSON.parse(raw);
        if (params?.fromDate) {
          items = items.filter((x) => x.date >= params.fromDate!);
        }
        if (params?.toDate) {
          items = items.filter((x) => x.date <= params.toDate!);
        }
        return items;
      } catch (e) {}
    }
  }

  return [];
}

/**
 * Add a new expense
 */
export async function addExpense(
  orgId: string,
  expenseData: {
    name: string;
    amount: number;
    date: string;
    category_id?: string | null;
    category_name?: string;
    notes?: string;
  }
): Promise<Expense> {
  const cleanName = expenseData.name.trim();
  const cleanAmount = Math.max(0, Number(expenseData.amount) || 0);
  const cleanDate = expenseData.date || new Date().toISOString().split("T")[0];

  if (!orgId) throw new Error("Organization ID is required");
  if (!cleanName) throw new Error("Expense name is required");
  if (cleanAmount <= 0) throw new Error("Expense amount must be greater than 0");

  // Try Supabase first
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("expenses")
        .insert([
          {
            org_id: orgId,
            name: cleanName,
            amount: cleanAmount,
            date: cleanDate,
            category_id: expenseData.category_id || null,
            notes: expenseData.notes || null,
          },
        ])
        .select("*, expense_categories(name)")
        .single();

      if (!error && data) {
        const newExpense: Expense = {
          id: data.id,
          org_id: data.org_id,
          name: data.name,
          category_id: data.category_id,
          category_name: data.expense_categories?.name || expenseData.category_name || "General",
          amount: Number(data.amount),
          date: data.date,
          notes: data.notes || "",
          created_at: data.created_at,
        };

        if (typeof window !== "undefined") {
          const current = await fetchExpenses(orgId);
          const updated = [newExpense, ...current.filter((e) => e.id !== newExpense.id)];
          localStorage.setItem(getLocalExpensesKey(orgId), JSON.stringify(updated));
        }

        return newExpense;
      }
    } catch (err) {
      console.warn("Supabase add expense error:", err);
    }
  }

  // Local fallback
  const newExpense: Expense = {
    id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    org_id: orgId,
    name: cleanName,
    category_id: expenseData.category_id || null,
    category_name: expenseData.category_name || "General",
    amount: cleanAmount,
    date: cleanDate,
    notes: expenseData.notes || "",
    created_at: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    const current = await fetchExpenses(orgId);
    const updated = [newExpense, ...current.filter((e) => e.id !== newExpense.id)];
    localStorage.setItem(getLocalExpensesKey(orgId), JSON.stringify(updated));
  }

  return newExpense;
}

/**
 * Delete an expense
 */
export async function deleteExpense(orgId: string, expenseId: string): Promise<boolean> {
  if (!orgId || !expenseId) return false;

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      await supabase.from("expenses").delete().eq("id", expenseId).eq("org_id", orgId);
    } catch (err) {
      console.warn("Supabase delete expense note:", err);
    }
  }

  if (typeof window !== "undefined") {
    const current = await fetchExpenses(orgId);
    const updated = current.filter((e) => e.id !== expenseId);
    localStorage.setItem(getLocalExpensesKey(orgId), JSON.stringify(updated));
  }

  return true;
}

