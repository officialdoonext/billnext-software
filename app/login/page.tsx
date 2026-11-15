"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import {
  Zap,
  Building2,
  Phone,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Sun,
  Moon,
  ShieldAlert
} from "lucide-react";

function LoginForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Sign In Form fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Sign Up Form fields (Requirement: Organisation name, mobile number, username/email, password)
  const [orgName, setOrgName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  // Theme toggle
  const [isDark, setIsDark] = useState(false);

  const { signIn, signUp, isAuthenticated, isAllowed, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check initial dark mode
    const isDarkMode = document.documentElement.classList.contains("dark");
    setIsDark(isDarkMode);
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    }
  };

  // If already authenticated, redirect appropriately
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if (isAllowed) {
        const from = searchParams.get("from") || "/";
        router.replace(from);
      } else {
        router.replace("/onboarding");
      }
    }
  }, [isLoading, isAuthenticated, isAllowed, router, searchParams]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setIsSubmitting(true);

    try {
      const res = await signIn({
        email: loginEmail.trim(),
        password: loginPassword,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Failed to sign in. Please check your credentials.");
        setIsSubmitting(false);
        return;
      }

      // Check if access conditions met
      if (res.isAllowed) {
        setSuccessMsg("Welcome back! Redirecting to software...");
        setTimeout(() => {
          const from = searchParams.get("from") || res.firstAllowedPath || "/";
          router.replace(from);
        }, 500);
      } else {
        setSuccessMsg("Account verified. Checking organization status...");
        setTimeout(() => {
          router.replace("/onboarding");
        }, 500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred during sign in.");
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setIsSubmitting(true);

    if (!orgName.trim()) {
      setErrorMsg("Please enter your Organisation Name.");
      setIsSubmitting(false);
      return;
    }
    if (!mobileNumber.trim()) {
      setErrorMsg("Please enter your Mobile Number.");
      setIsSubmitting(false);
      return;
    }
    if (!signupEmail.trim()) {
      setErrorMsg("Please enter your Username / Email.");
      setIsSubmitting(false);
      return;
    }
    if (signupPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await signUp({
        orgName: orgName.trim(),
        mobileNumber: mobileNumber.trim(),
        email: signupEmail.trim(),
        password: signupPassword,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Failed to create account.");
        setIsSubmitting(false);
        return;
      }

      setSuccessMsg("Account created! Default status is inactive and expired yesterday. Redirecting to onboarding...");

      // Requirement: Expiry date is yesterday and status is inactive, so redirect to onboarding
      setTimeout(() => {
        router.replace("/onboarding");
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred during registration.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen dot-grid flex flex-col justify-between p-4 sm:p-6 transition-colors duration-200">
      {/* Top Navbar Header */}
      <header className="flex items-center justify-between max-w-5xl w-full mx-auto py-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shadow-2xs">
            <Zap className="w-4 h-4 fill-[#3ECF8E] text-[#3ECF8E]" />
          </div>
          <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 tracking-tight font-sans">
            Bill Next
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
            SECURE AUTH
          </span>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors cursor-pointer"
          title={isDark ? "Switch to Light mode" : "Switch to Dark mode"}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600" />}
        </button>
      </header>

      {/* Main Authentication Card */}
      <main className="w-full max-w-md mx-auto my-auto py-8">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">
          {/* Card Header */}
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 mx-auto shadow-2xs">
              <Zap className="w-5 h-5 fill-[#3ECF8E] text-[#3ECF8E]" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 font-sans">
              {mode === "signin" ? "Sign in to Bill Next" : "Create an Organization Account"}
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {mode === "signin"
                ? "Enter your credentials to access your billing workspace"
                : "Register your organization to start with Bill Next"}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`py-1.5 text-center rounded-md transition-all cursor-pointer ${
                mode === "signin"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`py-1.5 text-center rounded-md transition-all cursor-pointer ${
                mode === "signup"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error & Success Alerts */}
          {errorMsg && (
            <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs space-y-2 animate-in fade-in duration-150">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                <span className="font-medium">{errorMsg}</span>
              </div>

              {/* Special actionable guidance for email rate limit */}
              {errorMsg.toLowerCase().includes("rate limit") && (
                <div className="pt-2 border-t border-rose-200 dark:border-rose-900/60 text-[11px] space-y-2 text-rose-700 dark:text-rose-300">
                  <p>
                    <strong>Why this happens:</strong> Supabase free projects have a limit of 3 confirmation emails per hour on their built-in email service.
                  </p>
                  <p>
                    <strong>How to fix:</strong>
                    <br />
                    1. Open{" "}
                    <a
                      href="https://supabase.com/dashboard/project/eknexmgwtjqacsqftlnq/auth/providers"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-semibold text-rose-900 dark:text-rose-200 hover:text-emerald-600 inline-flex items-center gap-0.5"
                    >
                      Supabase Auth Providers Settings ↗
                    </a>
                    <br />
                    2. Under <strong>Email</strong>, toggle <strong>&quot;Confirm email&quot;</strong> to <strong>OFF</strong>.
                    <br />
                    3. Click <strong>Save</strong>.
                  </p>
                </div>
              )}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-2 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* SIGN IN FORM */}
          {mode === "signin" ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Email or Staff Mobile Number
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="official@gmail.com or 10-digit mobile"
                    required
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Password / Staff MPIN
                  </label>
                  <span className="text-[11px] text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer">
                    Forgot?
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Account password or MPIN"
                    required
                    className="w-full text-xs pl-9 pr-9 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* SIGN UP FORM */
            <form onSubmit={handleSignUp} className="space-y-3.5">
              {/* Field 1: Organisation Name */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Organisation Name
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. Gama Next Supermarket"
                    required
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {/* Field 2: Mobile Number */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Mobile Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="+91 9876543210"
                    required
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {/* Field 3: Username (Email) */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Username (Email)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="owner@organization.com"
                    required
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {/* Field 4: Password */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Create a strong password (min. 6 chars)"
                    required
                    className="w-full text-xs pl-9 pr-9 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Notice regarding initial Inactive / Expired status */}
              <div className="p-2.5 rounded-lg border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 text-[11px] text-amber-800 dark:text-amber-400 flex items-start gap-2">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <span>
                  <strong>Account Policy:</strong> Newly registered organizations are initialized with status <strong>Inactive</strong> and an expiry date set to yesterday. You will be routed to the Onboarding terminal to view and verify your details.
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Organization Account</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Bottom Security / Supabase Notice */}
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
            <span>Supabase Auth & Database</span>
            <span className="font-mono text-[10px]">Bill Next v0.1</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-zinc-400">
        &copy; {new Date().getFullYear()} Bill Next Architecture · All rights reserved.
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen dot-grid flex items-center justify-center p-6">
          <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
            <span>Loading authentication...</span>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
