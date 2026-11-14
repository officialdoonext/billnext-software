"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Header from "./Header";
import Sidebar from "./Sidebar";
import SearchModal from "./SearchModal";
import AuthGuard from "./AuthGuard";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  const isPublicPage = pathname.startsWith("/login") || pathname.startsWith("/onboarding");

  // Global Ctrl + K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // For /login and /onboarding, don't show the software navigation shell
  if (isPublicPage) {
    return <AuthGuard>{children}</AuthGuard>;
  }

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-emerald-100 dark:selection:bg-emerald-950 selection:text-emerald-900 dark:selection:text-emerald-200">
        {/* Top Header Navigation */}
        <Header onOpenSearch={() => setIsSearchOpen(true)} />

        {/* Main Workspace: Sidebar + Scrollable Content */}
        <div className="flex-1 flex overflow-hidden">
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />

          <main className="flex-1 overflow-y-auto bg-zinc-50/60 dark:bg-zinc-950/60 min-h-[calc(100vh-3rem)]">
            {children}
          </main>
        </div>

        {/* Quick Search Palette (Ctrl + K) */}
        <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      </div>
    </AuthGuard>
  );
}
