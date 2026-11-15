export interface Organization {
  id: string;
  name: string;
  mobile_number: string;
  status: "active" | "inactive" | string;
  expiry_date: string; // ISO timestamp string
  items_count?: number; // max allowed items limit for this organization (default 50)
  logo_url?: string | null;
  city?: string | null;
  address?: string | null;
  gst_enabled?: boolean;
  gst_number?: string | null;
  gst_percentage?: number;
  cgst_percentage?: number;
  sgst_percentage?: number;
  gst_type?: "inclusive" | "exclusive" | string;
  allow_out_of_stock_billing?: boolean;
  created_at?: string;
  updated_at?: string;
}

export type PagePermission = "none" | "view" | "edit";

export type UserPermissions = Record<string, PagePermission>;

export interface AppRouteInfo {
  path: string;
  name: string;
  description: string;
  icon?: string;
}

export const APP_ROUTES: AppRouteInfo[] = [
  { path: "/", name: "Dashboard", description: "Business overview, revenue KPIs, and quick shortcuts" },
  { path: "/billing", name: "Billing", description: "Point of Sale terminal, catalog, cart, split payments, draft & print" },
  { path: "/sales", name: "Sales", description: "Sales ledger, bills list with 24 pagination, date range filters & reprint" },
  { path: "/customers", name: "Customers", description: "Customer directory, phone numbers, and profile ledger" },
  { path: "/items", name: "Items", description: "Product inventory, pricing, short codes, units, 60KB ImageKit & stock" },
  { path: "/categories", name: "Item Categories", description: "Department classification and item grouping" },
  { path: "/users", name: "Users", description: "Staff accounts, mobile login, MPIN credentials & RBAC matrix" },
  { path: "/settings", name: "Settings", description: "Store profile, ImageKit logo, GST tax slabs, and billing utilities" },
];

export const ALL_EDIT_PERMISSIONS: UserPermissions = {
  "/": "edit",
  "/billing": "edit",
  "/sales": "edit",
  "/customers": "edit",
  "/items": "edit",
  "/categories": "edit",
  "/users": "edit",
  "/settings": "edit",
};

export const DEFAULT_STAFF_PERMISSIONS: UserPermissions = {
  "/": "view",
  "/billing": "edit",
  "/sales": "view",
  "/customers": "edit",
  "/items": "view",
  "/categories": "none",
  "/users": "none",
  "/settings": "none",
};

export interface OrgUser {
  id: string;
  org_id: string;
  name: string;
  mobile_number: string;
  email: string; // ${mobile_number}@bn.com
  mpin: string; // login password
  role: "owner" | "staff" | string;
  permissions: UserPermissions;
  status: "active" | "inactive" | string;
  created_at?: string;
  updated_at?: string;
}

export interface UserProfile {
  id: string;
  org_id: string;
  username: string;
  email: string;
  mobile_number: string;
  role: string;
  mpin?: string;
  permissions?: UserPermissions;
  created_at?: string;
}

export interface Category {
  id: string;
  org_id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
  item_count?: number;
}

export interface Item {
  id: string;
  org_id: string;
  category_id?: string | null;
  category_name?: string;
  name: string;
  short_code: string;
  unit: "Piece" | "KG" | "Litre" | string;
  price: number;
  stock: number; // Stock count
  image_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Customer {
  id: string;
  org_id: string;
  name: string;
  mobile_number: string;
  city?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface BillItem {
  id: string; // unique row id (allows distinct line items for weighed items)
  item_id: string;
  name: string;
  short_code: string;
  unit: "Piece" | "KG" | "Litre" | string;
  price: number;
  quantity: number;
  total: number;
  selection_mode?: "weight" | "rupees" | "piece";
  weight_or_rupees_input?: number;
}

export interface SplitPayment {
  upi: number;
  cash: number;
  card: number;
}

export interface Bill {
  id: string;
  org_id: string;
  bill_number: string;
  customer_id?: string | null;
  customer_name?: string;
  customer_mobile?: string;
  items: BillItem[];
  subtotal: number;
  gst_percentage?: number;
  tax_amount: number;
  total_amount: number;
  payment_method: "CASH" | "UPI" | "CARD" | "SPLIT" | string;
  split_details?: SplitPayment | null;
  created_at: string;
}

export interface DraftBill {
  id: string;
  org_id: string;
  draft_name: string;
  customer: Customer | null;
  items: BillItem[];
  total: number;
  saved_at: string;
}

export interface AuthContextType {
  user: {
    id: string;
    email?: string;
  } | null;
  profile: UserProfile | null;
  organization: Organization | null;
  role: string; // 'owner' | 'staff'
  permissions: UserPermissions;
  allowedRoutes: AppRouteInfo[];
  firstAllowedPath: string;
  canView: (path: string) => boolean;
  canEdit: (path: string) => boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAllowed: boolean; // status === 'active' && !isExpired
  isExpired: boolean;
  isActive: boolean;
  signUp: (params: {
    orgName: string;
    mobileNumber: string;
    email: string;
    password: string;
  }) => Promise<{ success: boolean; error?: string }>;
  signIn: (params: {
    email: string;
    password: string;
  }) => Promise<{ success: boolean; error?: string; isAllowed?: boolean; firstAllowedPath?: string }>;
  signOut: () => Promise<void>;
  refreshStatus: () => Promise<void>;
  updateOrganization: (updates: Partial<Organization>) => Promise<{ success: boolean; error?: string }>;
}
