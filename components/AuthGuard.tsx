"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { Loader2, Zap } from "lucide-react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAllowed, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicPage = pathname.startsWith("/login") || pathname.startsWith("/onboarding");

  useEffect(() => {
    if (!isLoading) {
      if (!isPublicPage) {
        if (!isAuthenticated) {
          router.replace(`/login?from=${encodeURIComponent(pathname)}`);
        } else if (!isAllowed) {
          router.replace("/onboarding");
        }
      } else if (pathname === "/onboarding" && isAuthenticated && isAllowed) {
        if (typeof document !== "undefined") {
          document.cookie = "billnext_auth=1; path=/; max-age=604800; SameSite=Lax";
          document.cookie = "billnext_allowed=1; path=/; max-age=604800; SameSite=Lax";
        }
        router.replace("/");
      }
    }
  }, [isLoading, isAuthenticated, isAllowed, isPublicPage, pathname, router]);

  // If on a public page (login or onboarding), render immediately
  if (isPublicPage) {
    return <>{children}</>;
  }

  // If loading verification status, show Supabase-style loader
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-zinc-950 p-6">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shadow-xs">
            <Zap className="w-6 h-6 fill-[#3ECF8E] text-[#3ECF8E]" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
              <span>Verifying Bill Next authorization...</span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
              Checking organization active status & expiry window
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If not authenticated or not allowed, render nothing while redirecting
  if (!isAuthenticated || !isAllowed) {
    return null;
  }

  return <>{children}</>;
}

