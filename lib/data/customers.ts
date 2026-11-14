import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Customer } from "@/lib/auth/types";

function getLocalCustomersKey(orgId: string): string {
  return `billnext_customers_${orgId}`;
}

export async function fetchCustomers(orgId: string): Promise<Customer[]> {
  if (!orgId) return [];

  // Try Supabase first
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        if (typeof window !== "undefined") {
          localStorage.setItem(getLocalCustomersKey(orgId), JSON.stringify(data));
        }
        return data as Customer[];
      }
    } catch (err) {
      console.warn("Supabase fetch customers fallback to local:", err);
    }
  }

  // Fallback to local storage
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(getLocalCustomersKey(orgId));
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        console.error("Local customers parse error:", e);
      }
    }
  }

  return [];
}

export async function addCustomer(
  orgId: string,
  customerData: {
    name: string;
    mobile_number: string;
    city?: string;
  }
): Promise<Customer> {
  const trimmedName = customerData.name.trim();
  const trimmedMobile = customerData.mobile_number.trim();
  const trimmedCity = (customerData.city || "").trim();

  if (!orgId) throw new Error("Organization ID is required");
  if (!trimmedName) throw new Error("Customer name is required");
  if (!trimmedMobile) throw new Error("Customer mobile number is required");

  // Try Supabase first
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("customers")
        .insert([
          {
            org_id: orgId,
            name: trimmedName,
            mobile_number: trimmedMobile,
            city: trimmedCity || null,
          },
        ])
        .select()
        .single();

      if (!error && data) {
        const newCustomer = data as Customer;
        if (typeof window !== "undefined") {
          const current = await fetchCustomers(orgId);
          const updated = [newCustomer, ...current.filter((c) => c.id !== newCustomer.id)];
          localStorage.setItem(getLocalCustomersKey(orgId), JSON.stringify(updated));
        }
        return newCustomer;
      } else if (error) {
        console.warn("Supabase add customer error, using local fallback:", error);
      }
    } catch (err) {
      console.warn("Supabase add customer exception:", err);
    }
  }

  // Local fallback
  const newCustomer: Customer = {
    id: "cust_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
    org_id: orgId,
    name: trimmedName,
    mobile_number: trimmedMobile,
    city: trimmedCity || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    const current = await fetchCustomers(orgId);
    const updated = [newCustomer, ...current];
    localStorage.setItem(getLocalCustomersKey(orgId), JSON.stringify(updated));
  }

  return newCustomer;
}

export async function deleteCustomer(orgId: string, id: string): Promise<void> {
  if (!orgId || !id) return;

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      await supabase
        .from("customers")
        .delete()
        .eq("id", id)
        .eq("org_id", orgId);
    } catch (err) {
      console.warn("Supabase delete customer error:", err);
    }
  }

  if (typeof window !== "undefined") {
    const current = await fetchCustomers(orgId);
    const filtered = current.filter((c) => c.id !== id);
    localStorage.setItem(getLocalCustomersKey(orgId), JSON.stringify(filtered));
  }
}

