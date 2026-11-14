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

export interface UserProfile {
  id: string;
  org_id: string;
  username: string;
  email: string;
  mobile_number: string;
  role: string;
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
  }) => Promise<{ success: boolean; error?: string; isAllowed?: boolean }>;
  signOut: () => Promise<void>;
  refreshStatus: () => Promise<void>;
  updateOrganization: (updates: Partial<Organization>) => Promise<{ success: boolean; error?: string }>;
}
