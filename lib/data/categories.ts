import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Category } from "@/lib/auth/types";

function getLocalCategoriesKey(orgId: string): string {
  return `billnext_categories_${orgId}`;
}

export async function fetchCategories(orgId: string): Promise<Category[]> {
  if (!orgId) return [];

  // Try Supabase first
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        // Also sync local cache for this org
        if (typeof window !== "undefined") {
          localStorage.setItem(getLocalCategoriesKey(orgId), JSON.stringify(data));
        }
        return data as Category[];
      }
    } catch (err) {
      console.warn("Supabase fetch categories fallback to local:", err);
    }
  }

  // Fallback to org-scoped local storage
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(getLocalCategoriesKey(orgId));
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        console.error("Local categories parse error", e);
      }
    }
  }

  return [];
}

export async function addCategory(orgId: string, name: string): Promise<Category> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Category name cannot be empty");
  if (!orgId) throw new Error("Organization ID is required");

  // Try Supabase first
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("categories")
        .insert([{ org_id: orgId, name: trimmed }])
        .select()
        .single();

      if (!error && data) {
        const newCat = data as Category;
        // Update local cache
        if (typeof window !== "undefined") {
          const current = await fetchCategories(orgId);
          const updated = [newCat, ...current.filter((c) => c.id !== newCat.id)];
          localStorage.setItem(getLocalCategoriesKey(orgId), JSON.stringify(updated));
        }
        return newCat;
      }
    } catch (err) {
      console.warn("Supabase add category fallback to local:", err);
    }
  }

  // Fallback to local
  const newCat: Category = {
    id: "cat_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
    org_id: orgId,
    name: trimmed,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    const current = await fetchCategories(orgId);
    const updated = [newCat, ...current];
    localStorage.setItem(getLocalCategoriesKey(orgId), JSON.stringify(updated));
  }

  return newCat;
}

export async function deleteCategory(orgId: string, id: string): Promise<void> {
  if (!orgId || !id) return;

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      await supabase
        .from("categories")
        .delete()
        .eq("id", id)
        .eq("org_id", orgId);
    } catch (err) {
      console.warn("Supabase delete category error:", err);
    }
  }

  if (typeof window !== "undefined") {
    const current = await fetchCategories(orgId);
    const filtered = current.filter((c) => c.id !== id);
    localStorage.setItem(getLocalCategoriesKey(orgId), JSON.stringify(filtered));
  }
}

export async function getOrCreateCategory(orgId: string, name: string, existingList?: Category[]): Promise<Category> {
  const trimmed = name.trim();
  const list = existingList || (await fetchCategories(orgId));
  const found = list.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
  if (found) return found;
  return await addCategory(orgId, trimmed);
}

