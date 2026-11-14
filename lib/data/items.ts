import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Item, Category } from "@/lib/auth/types";
import { fetchCategories, getOrCreateCategory } from "./categories";
import { SampleProduct } from "./sample-products";

function getLocalItemsKey(orgId: string): string {
  return `billnext_items_${orgId}`;
}

export async function fetchItems(orgId: string): Promise<Item[]> {
  if (!orgId) return [];

  // Try Supabase first
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("items")
        .select("*, categories(name)")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        const formatted: Item[] = data.map((row: any) => ({
          id: row.id,
          org_id: row.org_id,
          category_id: row.category_id,
          category_name: row.categories?.name || "Uncategorized",
          name: row.name,
          short_code: row.short_code,
          unit: row.unit,
          price: Number(row.price),
          image_url: row.image_url,
          created_at: row.created_at,
          updated_at: row.updated_at,
        }));

        if (typeof window !== "undefined") {
          localStorage.setItem(getLocalItemsKey(orgId), JSON.stringify(formatted));
        }
        return formatted;
      }
    } catch (err) {
      console.warn("Supabase fetch items fallback to local:", err);
    }
  }

  // Fallback to local storage
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(getLocalItemsKey(orgId));
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        console.error("Local items parse error", e);
      }
    }
  }

  return [];
}

export async function addItem(
  orgId: string,
  itemData: {
    name: string;
    short_code: string;
    unit: string;
    price: number;
    category_id?: string | null;
    category_name?: string;
    image_url?: string | null;
  },
  maxItems: number = 100
): Promise<{ success: boolean; item?: Item; error?: string }> {
  if (!orgId) return { success: false, error: "Organization ID is required" };

  // 1. Check item limit for this organization
  const currentItems = await fetchItems(orgId);
  if (currentItems.length >= maxItems) {
    return {
      success: false,
      error: `Organization item limit reached (${currentItems.length} of ${maxItems}). You cannot add more items than the allowed items count.`,
    };
  }

  const trimmedName = itemData.name.trim();
  const trimmedCode = (itemData.short_code || "").trim();
  if (!trimmedName) {
    return { success: false, error: "Item name is required" };
  }

  // 2. Try Supabase insert
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const payload: any = {
        org_id: orgId,
        name: trimmedName,
        short_code: trimmedCode,
        unit: itemData.unit || "Piece",
        price: Number(itemData.price) || 0,
        category_id: itemData.category_id || null,
        image_url: itemData.image_url || null,
      };

      const { data, error } = await supabase
        .from("items")
        .insert([payload])
        .select()
        .single();

      if (!error && data) {
        const newItem: Item = {
          ...data,
          category_name: itemData.category_name || "Uncategorized",
        };

        if (typeof window !== "undefined") {
          const updated = [newItem, ...currentItems];
          localStorage.setItem(getLocalItemsKey(orgId), JSON.stringify(updated));
        }

        return { success: true, item: newItem };
      } else if (error) {
        console.warn("Supabase add item error, falling back to local:", error);
      }
    } catch (err: any) {
      console.warn("Supabase add item exception:", err);
    }
  }

  // Fallback to local
  const newItem: Item = {
    id: "item_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
    org_id: orgId,
    category_id: itemData.category_id || null,
    category_name: itemData.category_name || "Uncategorized",
    name: trimmedName,
    short_code: trimmedCode,
    unit: itemData.unit || "Piece",
    price: Number(itemData.price) || 0,
    image_url: itemData.image_url || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    const updated = [newItem, ...currentItems];
    localStorage.setItem(getLocalItemsKey(orgId), JSON.stringify(updated));
  }

  return { success: true, item: newItem };
}

export async function bulkAddItems(
  orgId: string,
  sampleProducts: SampleProduct[],
  maxItems: number = 100
): Promise<{ added: number; error?: string }> {
  if (!orgId) return { added: 0, error: "Organization ID is required" };

  const currentItems = await fetchItems(orgId);
  const remainingQuota = maxItems - currentItems.length;

  if (remainingQuota <= 0) {
    return {
      added: 0,
      error: `Organization item limit reached (${currentItems.length} of ${maxItems}). No more items can be uploaded.`,
    };
  }

  // Only take up to available slots
  const itemsToInsert = sampleProducts.slice(0, remainingQuota);

  // Pre-load or create missing categories
  const categories = await fetchCategories(orgId);
  const catMap = new Map<string, string>();
  for (const cat of categories) {
    catMap.set(cat.name.toLowerCase(), cat.id);
  }

  // Ensure every category used in the sample list exists
  for (const p of itemsToInsert) {
    const key = p.category_name.toLowerCase();
    if (!catMap.has(key)) {
      try {
        const createdCat = await getOrCreateCategory(orgId, p.category_name, categories);
        catMap.set(key, createdCat.id);
        categories.push(createdCat);
      } catch (e) {
        console.warn("Failed to create missing category during bulk upload:", e);
      }
    }
  }

  // Prepare database rows
  const newItemsPayload = itemsToInsert.map((p) => ({
    org_id: orgId,
    name: p.name,
    short_code: p.short_code,
    category_id: catMap.get(p.category_name.toLowerCase()) || null,
    unit: p.unit,
    price: p.price,
    image_url: null,
  }));

  let addedCount = 0;

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("items")
        .insert(newItemsPayload)
        .select();

      if (!error && data) {
        addedCount = data.length;
      } else {
        console.warn("Supabase bulk insert error:", error);
      }
    } catch (err) {
      console.warn("Supabase bulk insert exception:", err);
    }
  }

  // If Supabase didn't insert (or fallback)
  if (addedCount === 0) {
    const localItems: Item[] = newItemsPayload.map((p, idx) => ({
      id: "bulk_" + Date.now() + "_" + idx,
      org_id: orgId,
      name: p.name,
      short_code: p.short_code,
      category_id: p.category_id,
      category_name: itemsToInsert[idx].category_name,
      unit: p.unit,
      price: p.price,
      image_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    if (typeof window !== "undefined") {
      const updated = [...localItems, ...currentItems];
      localStorage.setItem(getLocalItemsKey(orgId), JSON.stringify(updated));
    }
    addedCount = localItems.length;
  } else {
    // Refresh local cache with latest
    await fetchItems(orgId);
  }

  let limitWarning = "";
  if (sampleProducts.length > remainingQuota) {
    limitWarning = ` Note: Only ${addedCount} items could be uploaded because your organization item limit is ${maxItems}.`;
  }

  return { added: addedCount, error: limitWarning ? limitWarning : undefined };
}

export async function deleteItem(orgId: string, id: string): Promise<void> {
  if (!orgId || !id) return;

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      await supabase
        .from("items")
        .delete()
        .eq("id", id)
        .eq("org_id", orgId);
    } catch (err) {
      console.warn("Supabase delete item error:", err);
    }
  }

  if (typeof window !== "undefined") {
    const current = await fetchItems(orgId);
    const filtered = current.filter((it) => it.id !== id);
    localStorage.setItem(getLocalItemsKey(orgId), JSON.stringify(filtered));
  }
}

