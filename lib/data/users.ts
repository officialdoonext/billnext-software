import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { OrgUser, UserPermissions, DEFAULT_STAFF_PERMISSIONS, Organization } from "@/lib/auth/types";

function getLocalUsersKey(orgId: string): string {
  return `billnext_users_${orgId}`;
}

const GLOBAL_STAFF_USERS_KEY = "billnext_global_staff_users";

function getGlobalStaffUsers(): OrgUser[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(GLOBAL_STAFF_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to parse global staff users:", e);
    return [];
  }
}

function saveGlobalStaffUser(user: OrgUser) {
  if (typeof window === "undefined") return;
  try {
    const current = getGlobalStaffUsers();
    const updated = [user, ...current.filter((u) => u.id !== user.id && u.mobile_number !== user.mobile_number)];
    localStorage.setItem(GLOBAL_STAFF_USERS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save global staff user:", e);
  }
}

function removeGlobalStaffUser(userId: string) {
  if (typeof window === "undefined") return;
  try {
    const current = getGlobalStaffUsers();
    const updated = current.filter((u) => u.id !== userId);
    localStorage.setItem(GLOBAL_STAFF_USERS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to remove global staff user:", e);
  }
}

/**
 * Fetch all users/staff belonging to an organization
 */
export async function fetchOrgUsers(orgId: string): Promise<OrgUser[]> {
  if (!orgId) return [];

  // Try Supabase first
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("org_users")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        const users: OrgUser[] = data.map((row: any) => ({
          id: row.id,
          org_id: row.org_id,
          name: row.name,
          mobile_number: row.mobile_number,
          email: row.email,
          mpin: row.mpin,
          role: row.role || "staff",
          permissions: row.permissions || DEFAULT_STAFF_PERMISSIONS,
          status: row.status || "active",
          created_at: row.created_at,
          updated_at: row.updated_at,
        }));

        if (typeof window !== "undefined") {
          localStorage.setItem(getLocalUsersKey(orgId), JSON.stringify(users));
          users.forEach(saveGlobalStaffUser);
        }
        return users;
      } else if (error) {
        console.warn("Supabase fetchOrgUsers note:", error.message);
      }
    } catch (err) {
      console.warn("Supabase fetchOrgUsers fallback to local:", err);
    }
  }

  // Fallback to local storage
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(getLocalUsersKey(orgId));
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        console.error("Local users parse error:", e);
      }
    }
  }

  return [];
}

/**
 * Create a new sub-user under an organization
 */
export async function createOrgUser(
  orgId: string,
  params: {
    name: string;
    mobile_number: string;
    mpin: string;
    permissions: UserPermissions;
  }
): Promise<{ success: boolean; user?: OrgUser; error?: string }> {
  if (!orgId) return { success: false, error: "Organization ID is required" };

  const cleanName = params.name.trim();
  const cleanMobile = params.mobile_number.trim().replace(/\D/g, "");
  const cleanMpin = params.mpin.trim();

  if (!cleanName) return { success: false, error: "Name is required" };
  if (!cleanMobile || cleanMobile.length < 10) {
    return { success: false, error: "Please enter a valid 10-digit mobile number" };
  }
  if (!cleanMpin || cleanMpin.length < 4) {
    return { success: false, error: "MPIN must be at least 4 digits" };
  }

  const email = `${cleanMobile}@bn.com`;
  const newUserId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `usr_${Date.now()}`;

  const newUser: OrgUser = {
    id: newUserId,
    org_id: orgId,
    name: cleanName,
    mobile_number: cleanMobile,
    email,
    mpin: cleanMpin,
    role: "staff",
    permissions: params.permissions,
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Try creating in Supabase Auth & org_users table via API route (avoids logging out active browser user)
  try {
    const res = await fetch("/api/auth/register-subuser", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orgId,
        userId: newUserId,
        name: cleanName,
        mobileNumber: cleanMobile,
        email,
        mpin: cleanMpin,
        permissions: params.permissions,
      }),
    });

    const data = await res.json();
    if (res.ok && data.user) {
      newUser.id = data.user.id || newUserId;
    }
  } catch (apiErr) {
    console.warn("API register-subuser note:", apiErr);
  }

  // Also try direct Supabase insert if table is accessible
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data: inserted, error } = await supabase
        .from("org_users")
        .upsert([
          {
            id: newUser.id,
            org_id: orgId,
            name: cleanName,
            mobile_number: cleanMobile,
            email,
            mpin: cleanMpin,
            role: "staff",
            permissions: params.permissions,
            status: "active",
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .maybeSingle();

      if (!error && inserted) {
        newUser.id = inserted.id;
      }
    } catch (dbErr) {
      console.warn("Direct org_users insert fallback:", dbErr);
    }
  }

  // Save to local storage
  if (typeof window !== "undefined") {
    const current = await fetchOrgUsers(orgId);
    const updated = [newUser, ...current.filter((u) => u.id !== newUser.id && u.mobile_number !== cleanMobile)];
    localStorage.setItem(getLocalUsersKey(orgId), JSON.stringify(updated));
    saveGlobalStaffUser(newUser);
  }

  return { success: true, user: newUser };
}

/**
 * Delete a sub-user
 */
export async function deleteOrgUser(orgId: string, userId: string): Promise<boolean> {
  if (!orgId || !userId) return false;

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      await supabase.from("org_users").delete().eq("id", userId).eq("org_id", orgId);
    } catch (err) {
      console.warn("Supabase delete user note:", err);
    }
  }

  if (typeof window !== "undefined") {
    const current = await fetchOrgUsers(orgId);
    const updated = current.filter((u) => u.id !== userId);
    localStorage.setItem(getLocalUsersKey(orgId), JSON.stringify(updated));
    removeGlobalStaffUser(userId);
  }

  return true;
}

/**
 * Lookup staff user by mobile number or email and check MPIN
 */
export async function findStaffUserForLogin(
  identifier: string,
  mpin: string
): Promise<{ staffUser: OrgUser; org: Organization } | null> {
  const cleanId = identifier.trim().toLowerCase();
  const cleanMpin = mpin.trim();

  // If pure digits, clean to mobile
  const isPureMobile = /^\d+$/.test(cleanId);
  const targetMobile = isPureMobile ? cleanId : cleanId.endsWith("@bn.com") ? cleanId.replace("@bn.com", "") : null;
  const targetEmail = targetMobile ? `${targetMobile}@bn.com` : cleanId;

  // 1. Try Supabase org_users lookup
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      let query = supabase.from("org_users").select("*, organizations(*)");

      if (targetMobile) {
        query = query.or(`mobile_number.eq.${targetMobile},email.eq.${targetEmail}`);
      } else {
        query = query.eq("email", targetEmail);
      }

      const { data, error } = await query.maybeSingle();

      if (!error && data) {
        if (data.mpin === cleanMpin) {
          const staffUser: OrgUser = {
            id: data.id,
            org_id: data.org_id,
            name: data.name,
            mobile_number: data.mobile_number,
            email: data.email,
            mpin: data.mpin,
            role: data.role || "staff",
            permissions: data.permissions || DEFAULT_STAFF_PERMISSIONS,
            status: data.status || "active",
            created_at: data.created_at,
          };

          const rawOrg = data.organizations;
          const org: Organization = {
            id: rawOrg?.id || data.org_id,
            name: rawOrg?.name || "Organization",
            mobile_number: rawOrg?.mobile_number || data.mobile_number,
            status: rawOrg?.status || "active",
            expiry_date: rawOrg?.expiry_date || new Date(Date.now() + 86400000 * 365).toISOString(),
            items_count: rawOrg?.items_count ?? 50,
            logo_url: rawOrg?.logo_url || null,
            city: rawOrg?.city || "",
            address: rawOrg?.address || "",
            gst_enabled: Boolean(rawOrg?.gst_enabled),
            gst_number: rawOrg?.gst_number || "",
            gst_percentage: Number(rawOrg?.gst_percentage) || 0,
            cgst_percentage: Number(rawOrg?.cgst_percentage) || 0,
            sgst_percentage: Number(rawOrg?.sgst_percentage) || 0,
            gst_type: rawOrg?.gst_type || "exclusive",
            allow_out_of_stock_billing: rawOrg?.allow_out_of_stock_billing !== undefined ? Boolean(rawOrg.allow_out_of_stock_billing) : true,
          };

          return { staffUser, org };
        }
      }
    } catch (err) {
      console.warn("Supabase findStaffUser note:", err);
    }
  }

  // 2. Check local global staff users
  const localStaff = getGlobalStaffUsers();
  const matched = localStaff.find(
    (u) =>
      (u.mobile_number === targetMobile || u.email.toLowerCase() === targetEmail.toLowerCase()) &&
      u.mpin === cleanMpin
  );

  if (matched) {
    // Try to get org from localStorage
    let org: Organization = {
      id: matched.org_id,
      name: "Bill Next Store",
      mobile_number: matched.mobile_number,
      status: "active",
      expiry_date: new Date(Date.now() + 86400000 * 365).toISOString(),
      items_count: 50,
    };

    if (typeof window !== "undefined") {
      const storedOrg = localStorage.getItem("billnext_auth_org");
      if (storedOrg) {
        try {
          const parsed = JSON.parse(storedOrg);
          if (parsed.id === matched.org_id) {
            org = parsed;
          }
        } catch (e) {}
      }
    }

    return { staffUser: matched, org };
  }

  return null;
}

