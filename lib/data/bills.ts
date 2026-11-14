import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Bill, DraftBill, BillItem } from "@/lib/auth/types";
import { deductItemStock } from "./items";

function getLocalBillsKey(orgId: string): string {
  return `billnext_bills_${orgId}`;
}

function getLocalDraftsKey(orgId: string): string {
  return `billnext_drafts_${orgId}`;
}

export interface FetchBillsParams {
  fromDate?: string; // ISO string
  toDate?: string; // ISO string
  page?: number; // 1-indexed
  limit?: number; // default 24
}

export async function fetchBills(
  orgId: string,
  params?: FetchBillsParams
): Promise<{ bills: Bill[]; total: number; page: number; totalPages: number }> {
  if (!orgId) return { bills: [], total: 0, page: 1, totalPages: 1 };

  const page = params?.page || 1;
  const limit = params?.limit || 24;
  const offset = (page - 1) * limit;

  // Try Supabase first
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      let query = supabase
        .from("bills")
        .select("*", { count: "exact" })
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });

      if (params?.fromDate) {
        query = query.gte("created_at", params.fromDate);
      }
      if (params?.toDate) {
        query = query.lte("created_at", params.toDate);
      }

      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (!error && data) {
        const total = count || 0;
        const totalPages = Math.ceil(total / limit) || 1;
        const formattedBills: Bill[] = data.map((b: any) => ({
          id: b.id,
          org_id: b.org_id,
          bill_number: b.bill_number,
          customer_id: b.customer_id,
          customer_name: b.customer_name || "Walk-in Customer",
          customer_mobile: b.customer_mobile || "",
          items: Array.isArray(b.items) ? b.items : [],
          subtotal: Number(b.subtotal) || 0,
          gst_percentage: Number(b.gst_percentage) || 0,
          tax_amount: Number(b.tax_amount) || 0,
          total_amount: Number(b.total_amount) || 0,
          payment_method: b.payment_method || "CASH",
          split_details: b.split_details || null,
          created_at: b.created_at,
        }));

        return { bills: formattedBills, total, page, totalPages };
      }
    } catch (err) {
      console.warn("Supabase fetch bills fallback to local:", err);
    }
  }

  // Fallback to local storage
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(getLocalBillsKey(orgId));
    if (raw) {
      try {
        let allBills: Bill[] = JSON.parse(raw);

        // Date filter
        if (params?.fromDate) {
          const fromTime = new Date(params.fromDate).getTime();
          allBills = allBills.filter((b) => new Date(b.created_at).getTime() >= fromTime);
        }
        if (params?.toDate) {
          const toTime = new Date(params.toDate).getTime();
          allBills = allBills.filter((b) => new Date(b.created_at).getTime() <= toTime);
        }

        // Sort descending
        allBills.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        const total = allBills.length;
        const totalPages = Math.ceil(total / limit) || 1;
        const paged = allBills.slice(offset, offset + limit);

        return { bills: paged, total, page, totalPages };
      } catch (e) {
        console.error("Local bills parse error:", e);
      }
    }
  }

  return { bills: [], total: 0, page: 1, totalPages: 1 };
}

export async function saveBill(
  orgId: string,
  billData: Omit<Bill, "id">
): Promise<Bill> {
  if (!orgId) throw new Error("Organization ID is required");

  // 1. Deduct stock from inventory
  const stockDeductions = billData.items.map((it) => ({
    id: it.item_id,
    quantity: it.quantity,
  }));
  await deductItemStock(orgId, stockDeductions);

  // 2. Try Supabase insert
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("bills")
        .insert([
          {
            org_id: orgId,
            bill_number: billData.bill_number,
            customer_id: billData.customer_id || null,
            customer_name: billData.customer_name || "Walk-in Customer",
            customer_mobile: billData.customer_mobile || "",
            items: billData.items,
            subtotal: billData.subtotal,
            gst_percentage: billData.gst_percentage || 0,
            tax_amount: billData.tax_amount || 0,
            total_amount: billData.total_amount,
            payment_method: billData.payment_method,
            split_details: billData.split_details || null,
            created_at: billData.created_at || new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (!error && data) {
        const saved = data as Bill;
        // Sync local bills
        if (typeof window !== "undefined") {
          const raw = localStorage.getItem(getLocalBillsKey(orgId));
          const current: Bill[] = raw ? JSON.parse(raw) : [];
          localStorage.setItem(getLocalBillsKey(orgId), JSON.stringify([saved, ...current]));
        }
        return saved;
      } else if (error) {
        console.warn("Supabase save bill error, using local fallback:", error);
      }
    } catch (err) {
      console.warn("Supabase save bill exception:", err);
    }
  }

  // Local fallback
  const newBill: Bill = {
    ...billData,
    id: "bill_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
  };

  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(getLocalBillsKey(orgId));
    const current: Bill[] = raw ? JSON.parse(raw) : [];
    localStorage.setItem(getLocalBillsKey(orgId), JSON.stringify([newBill, ...current]));
  }

  return newBill;
}

// =========================================================================
// DRAFTED BILLS (Stored locally per organization)
// =========================================================================

export function fetchDraftBills(orgId: string): DraftBill[] {
  if (typeof window === "undefined" || !orgId) return [];
  const raw = localStorage.getItem(getLocalDraftsKey(orgId));
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function saveDraftBill(
  orgId: string,
  draft: Omit<DraftBill, "id" | "saved_at">
): DraftBill {
  const newDraft: DraftBill = {
    ...draft,
    id: "draft_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
    org_id: orgId,
    saved_at: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    const current = fetchDraftBills(orgId);
    const updated = [newDraft, ...current];
    localStorage.setItem(getLocalDraftsKey(orgId), JSON.stringify(updated));
  }

  return newDraft;
}

export function deleteDraftBill(orgId: string, draftId: string): void {
  if (typeof window === "undefined" || !orgId) return;
  const current = fetchDraftBills(orgId);
  const updated = current.filter((d) => d.id !== draftId);
  localStorage.setItem(getLocalDraftsKey(orgId), JSON.stringify(updated));
}

