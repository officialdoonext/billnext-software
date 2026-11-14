export interface Organization {
  id: string;
  name: string;
  mobile_number: string;
  status: "active" | "inactive" | string;
  expiry_date: string; // ISO timestamp string
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

