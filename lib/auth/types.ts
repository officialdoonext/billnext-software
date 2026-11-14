export interface Organization {
  id: string;
  name: string;
  mobile_number: string;
  status: "active" | "inactive" | string;
  expiry_date: string; // ISO timestamp string
  items_count?: number; // max allowed items limit for this organization
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
  image_url?: string | null;
  created_at?: string;
  updated_at?: string;
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
}
