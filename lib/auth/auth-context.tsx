"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Organization, UserProfile, AuthContextType } from "./types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_USER = "billnext_auth_user";
const LOCAL_STORAGE_KEY_PROFILE = "billnext_auth_profile";
const LOCAL_STORAGE_KEY_ORG = "billnext_auth_org";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Helper to compute yesterday's date ISO
  const getYesterdayIso = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString();
  };

  // Helper to set/delete auth cookie for middleware URL-level blocking
  const updateAuthCookie = (isAuthed: boolean, isAllowedAccess: boolean) => {
    if (typeof document !== "undefined") {
      if (isAuthed) {
        document.cookie = `billnext_auth=1; path=/; max-age=604800; SameSite=Lax`;
        document.cookie = `billnext_allowed=${isAllowedAccess ? "1" : "0"}; path=/; max-age=604800; SameSite=Lax`;
      } else {
        document.cookie = "billnext_auth=; path=/; max-age=0; SameSite=Lax";
        document.cookie = "billnext_allowed=; path=/; max-age=0; SameSite=Lax";
      }
    }
  };

  // Check whether status is active and expiry_date has not passed
  const checkIsAllowed = (org: Organization | null): boolean => {
    if (!org) return false;
    const isStatusActive = org.status?.toLowerCase() === "active";
    const expiryTime = new Date(org.expiry_date).getTime();
    const isNotExpired = !isNaN(expiryTime) && expiryTime > Date.now();
    return isStatusActive && isNotExpired;
  };

  const isExpired = Boolean(
    organization?.expiry_date &&
    new Date(organization.expiry_date).getTime() <= Date.now()
  );

  const isActive = Boolean(
    organization?.status && organization.status.toLowerCase() === "active"
  );

  const isAllowed = checkIsAllowed(organization);
  const isAuthenticated = Boolean(user);

  // Initialize auth on boot
  useEffect(() => {
    const initAuth = async () => {
      try {
        const supabase = createClient();
        const configured = isSupabaseConfigured();

        if (configured) {
          // Attempt to get Supabase session
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setUser({ id: session.user.id, email: session.user.email });

            // Fetch profile and organization from Supabase
            const { data: profData } = await supabase
              .from("user_profiles")
              .select("*, organizations(*)")
              .eq("id", session.user.id)
              .maybeSingle();

            if (profData) {
              const userProf: UserProfile = {
                id: profData.id,
                org_id: profData.org_id,
                username: profData.username || session.user.email || "",
                email: profData.email || session.user.email || "",
                mobile_number: profData.mobile_number || "",
                role: profData.role || "owner",
              };
              setProfile(userProf);

              if (profData.organizations) {
                const orgData: Organization = {
                  id: profData.organizations.id,
                  name: profData.organizations.name,
                  mobile_number: profData.organizations.mobile_number,
                  status: profData.organizations.status,
                  expiry_date: profData.organizations.expiry_date,
                  items_count: profData.organizations.items_count ?? 50,
                };
                setOrganization(orgData);
                updateAuthCookie(true, checkIsAllowed(orgData));
                setIsLoading(false);
                return;
              }
            }
          }
        }

        // Fallback to local storage (for offline or local dev testing)
        const storedUser = localStorage.getItem(LOCAL_STORAGE_KEY_USER);
        const storedProf = localStorage.getItem(LOCAL_STORAGE_KEY_PROFILE);
        const storedOrg = localStorage.getItem(LOCAL_STORAGE_KEY_ORG);

        if (storedUser && storedOrg) {
          const parsedUser = JSON.parse(storedUser);
          const parsedOrg: Organization = JSON.parse(storedOrg);
          const parsedProf: UserProfile = storedProf ? JSON.parse(storedProf) : null;

          setUser(parsedUser);
          setOrganization(parsedOrg);
          setProfile(parsedProf);
          updateAuthCookie(true, checkIsAllowed(parsedOrg));
        } else {
          updateAuthCookie(false, false);
        }
      } catch (err) {
        console.warn("Auth initialization note:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Sync auth cookies whenever organization or user changes
  useEffect(() => {
    if (!isLoading) {
      updateAuthCookie(Boolean(user), checkIsAllowed(organization));
    }
  }, [user, organization, isLoading]);

  // Sign Up handler
  const signUp = async ({
    orgName,
    mobileNumber,
    email,
    password,
  }: {
    orgName: string;
    mobileNumber: string;
    email: string;
    password: string;
  }): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const yesterday = getYesterdayIso();
      const newOrgId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `org_${Date.now()}`;
      const newUserId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `usr_${Date.now()}`;

      let createdOrg: Organization = {
        id: newOrgId,
        name: orgName,
        mobile_number: mobileNumber,
        status: "inactive", // Requirement: status be inactive
        expiry_date: yesterday, // Requirement: expiry date be yesterday date
        created_at: new Date().toISOString(),
      };

      let createdProfile: UserProfile = {
        id: newUserId,
        org_id: newOrgId,
        username: email, // Requirement: username be email
        email: email,
        mobile_number: mobileNumber,
        role: "owner",
        created_at: new Date().toISOString(),
      };

      const configured = isSupabaseConfigured();

      if (configured) {
        const supabase = createClient();

        // 1. Sign up user with metadata
        const { data: authData, error: authErr } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              org_name: orgName,
              mobile_number: mobileNumber,
            },
          },
        });

        if (authErr) {
          if (authErr.message.toLowerCase().includes("rate limit")) {
            const localUser = { id: newUserId, email };
            setUser(localUser);
            setProfile(createdProfile);
            setOrganization(createdOrg);
            localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(localUser));
            localStorage.setItem(LOCAL_STORAGE_KEY_PROFILE, JSON.stringify(createdProfile));
            localStorage.setItem(LOCAL_STORAGE_KEY_ORG, JSON.stringify(createdOrg));
            updateAuthCookie(true, false);
          }
          setIsLoading(false);
          return { success: false, error: authErr.message };
        }

        // If email confirmation is disabled or session is available, try login to establish session
        if (!authData.session) {
          const { data: signInData } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (signInData?.session) {
            authData.session = signInData.session;
            authData.user = signInData.user;
          }
        }

        const realUserId = authData.user?.id || newUserId;
        createdProfile.id = realUserId;

        // 2. Check if Database Trigger already created organization & profile
        const { data: triggerProf } = await supabase
          .from("user_profiles")
          .select("*, organizations(*)")
          .eq("id", realUserId)
          .maybeSingle();

        if (triggerProf && triggerProf.organizations) {
          createdOrg = {
            id: triggerProf.organizations.id,
            name: triggerProf.organizations.name,
            mobile_number: triggerProf.organizations.mobile_number,
            status: triggerProf.organizations.status,
            expiry_date: triggerProf.organizations.expiry_date,
            items_count: triggerProf.organizations.items_count ?? 50,
          };
          createdProfile = {
            id: triggerProf.id,
            org_id: triggerProf.org_id,
            username: triggerProf.username || email,
            email: triggerProf.email || email,
            mobile_number: triggerProf.mobile_number || mobileNumber,
            role: triggerProf.role || "owner",
          };
        } else {
          // 3. Directly insert into organizations table
          const { data: orgInsertData, error: orgInsertErr } = await supabase
            .from("organizations")
            .insert([
              {
                id: newOrgId,
                name: orgName,
                mobile_number: mobileNumber,
                status: "inactive",
                expiry_date: yesterday,
                items_count: 50,
              },
            ])
            .select()
            .maybeSingle();

          if (orgInsertErr) {
            console.warn("Direct organization insert error:", orgInsertErr);
          } else if (orgInsertData) {
            createdOrg = orgInsertData;
          }

          // 4. Directly insert into user_profiles table
          const { error: profInsertErr } = await supabase
            .from("user_profiles")
            .upsert([
              {
                id: realUserId,
                org_id: createdOrg.id,
                username: email,
                email: email,
                mobile_number: mobileNumber,
                role: "owner",
              },
            ]);

          if (profInsertErr) {
            console.warn("Direct user_profiles insert error:", profInsertErr);
          }
        }
      }

      // Save locally
      const localUser = { id: createdProfile.id, email };
      setUser(localUser);
      setProfile(createdProfile);
      setOrganization(createdOrg);

      localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(localUser));
      localStorage.setItem(LOCAL_STORAGE_KEY_PROFILE, JSON.stringify(createdProfile));
      localStorage.setItem(LOCAL_STORAGE_KEY_ORG, JSON.stringify(createdOrg));

      updateAuthCookie(true, false); // Authenticated, but not allowed (inactive & expired yesterday)
      setIsLoading(false);

      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || "Failed to complete signup." };
    }
  };

  // Sign In handler
  const signIn = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<{ success: boolean; error?: string; isAllowed?: boolean }> => {
    setIsLoading(true);
    try {
      const configured = isSupabaseConfigured();

      if (configured) {
        const supabase = createClient();
        const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authErr) {
          setIsLoading(false);
          return { success: false, error: authErr.message };
        }

        if (authData.user) {
          const authUser = { id: authData.user.id, email: authData.user.email };
          setUser(authUser);

          const { data: profData } = await supabase
            .from("user_profiles")
            .select("*, organizations(*)")
            .eq("id", authData.user.id)
            .maybeSingle();

          if (profData && profData.organizations) {
            const orgData: Organization = {
              id: profData.organizations.id,
              name: profData.organizations.name,
              mobile_number: profData.organizations.mobile_number,
              status: profData.organizations.status,
              expiry_date: profData.organizations.expiry_date,
              items_count: profData.organizations.items_count ?? 50,
            };
            const userProf: UserProfile = {
              id: profData.id,
              org_id: profData.org_id,
              username: profData.username || email,
              email: profData.email || email,
              mobile_number: profData.mobile_number || "",
              role: profData.role || "owner",
            };

            setOrganization(orgData);
            setProfile(userProf);
            const allowed = checkIsAllowed(orgData);
            updateAuthCookie(true, allowed);

            localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(authUser));
            localStorage.setItem(LOCAL_STORAGE_KEY_PROFILE, JSON.stringify(userProf));
            localStorage.setItem(LOCAL_STORAGE_KEY_ORG, JSON.stringify(orgData));

            setIsLoading(false);
            return { success: true, isAllowed: allowed };
          }
        }
      }

      // Fallback check against stored profile/user (or demo credentials)
      const storedUser = localStorage.getItem(LOCAL_STORAGE_KEY_USER);
      const storedOrg = localStorage.getItem(LOCAL_STORAGE_KEY_ORG);
      const storedProf = localStorage.getItem(LOCAL_STORAGE_KEY_PROFILE);

      if (storedUser && storedOrg) {
        const parsedUser = JSON.parse(storedUser);
        const parsedOrg: Organization = JSON.parse(storedOrg);
        const parsedProf: UserProfile = storedProf ? JSON.parse(storedProf) : null;

        if (parsedUser.email === email || parsedProf?.username === email) {
          setUser(parsedUser);
          setOrganization(parsedOrg);
          setProfile(parsedProf);

          const allowed = checkIsAllowed(parsedOrg);
          updateAuthCookie(true, allowed);
          setIsLoading(false);
          return { success: true, isAllowed: allowed };
        }
      }

      // If no account found
      setIsLoading(false);
      return { success: false, error: "Invalid email or password. Please verify your credentials or Sign Up." };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || "Sign in failed." };
    }
  };

  // Sign Out handler
  const signOut = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn("Sign out note:", err);
    }

    setUser(null);
    setProfile(null);
    setOrganization(null);
    updateAuthCookie(false, false);

    localStorage.removeItem(LOCAL_STORAGE_KEY_USER);
    localStorage.removeItem(LOCAL_STORAGE_KEY_PROFILE);
    localStorage.removeItem(LOCAL_STORAGE_KEY_ORG);

    setIsLoading(false);
    router.push("/login");
  };

  // Refresh status from Supabase
  const refreshStatus = async () => {
    if (!user) return;
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { data: profData } = await supabase
          .from("user_profiles")
          .select("*, organizations(*)")
          .eq("id", user.id)
          .maybeSingle();

        if (profData && profData.organizations) {
          const orgData: Organization = {
            id: profData.organizations.id,
            name: profData.organizations.name,
            mobile_number: profData.organizations.mobile_number,
            status: profData.organizations.status,
            expiry_date: profData.organizations.expiry_date,
            items_count: profData.organizations.items_count ?? 50,
          };
          setOrganization(orgData);
          updateAuthCookie(true, checkIsAllowed(orgData));
        }
      } catch (e) {
        console.warn("Refresh status note:", e);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        organization,
        isLoading,
        isAuthenticated,
        isAllowed,
        isExpired,
        isActive,
        signUp,
        signIn,
        signOut,
        refreshStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
