"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import {
  LayoutDashboard,
  Receipt,
  Package,
  FolderTree,
  Users,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Wallet
} from "lucide-react";

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({
  isCollapsed: controlledCollapsed,
  onToggleCollapse: controlledToggle,
}: SidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const pathname = usePathname();
  const { canView, role, profile } = useAuth();

  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
  const toggleCollapse = controlledToggle !== undefined ? controlledToggle : () => setInternalCollapsed(!internalCollapsed);

  const mainNavItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      name: "Billing",
      href: "/billing",
      icon: Receipt,
      badge: null,
    },
    {
      name: "Sales",
      href: "/sales",
      icon: TrendingUp,
      badge: null,
    },
    {
      name: "Expenses",
      href: "/expenses",
      icon: Wallet,
      badge: null,
    },
    {
      name: "Customers",
      href: "/customers",
      icon: Users,
      badge: null,
    },
    {
      name: "Items",
      href: "/items",
      icon: Package,
      badge: null,
    },
    {
      name: "Item Categories",
      href: "/categories",
      icon: FolderTree,
      badge: null,
    },
    {
      name: "Users",
      href: "/users",
      icon: Users,
      badge: null,
    },
  ];

  const secondaryNavItems = [
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      badge: null,
    },
  ];

  // Filter navigation items strictly based on role and allowed page permissions
  const visibleMainNav = mainNavItems.filter((item) => canView(item.href));
  const visibleSecondaryNav = secondaryNavItems.filter((item) => canView(item.href));

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`h-[calc(100vh-3rem)] border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col justify-between transition-all duration-200 select-none shrink-0 ${
        isCollapsed ? "w-14" : "w-56"
      }`}
    >
      {/* Top Navigation */}
      <div className="p-2 space-y-1 overflow-y-auto">
        {visibleMainNav.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              title={isCollapsed ? item.name : undefined}
              className={`group flex items-center gap-3 px-2.5 py-1.5 rounded-md text-xs font-normal transition-colors relative ${
                active
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-medium"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  active
                    ? "text-zinc-900 dark:text-zinc-100"
                    : "text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300"
                }`}
              />

              {!isCollapsed && (
                <div className="flex items-center justify-between flex-1 min-w-0">
                  <span className="truncate">{item.name}</span>
                  {item.badge && (
                    <span className="text-[9px] font-mono font-medium px-1.5 py-0.2 rounded border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}

        {/* Subtle Divider (only if secondary nav has items) */}
        {visibleSecondaryNav.length > 0 && (
          <div className="my-2 border-t border-zinc-100 dark:border-zinc-800/80" />
        )}

        {/* Secondary Navigation (Settings) */}
        {visibleSecondaryNav.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              title={isCollapsed ? item.name : undefined}
              className={`group flex items-center gap-3 px-2.5 py-1.5 rounded-md text-xs font-normal transition-colors relative ${
                active
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-medium"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  active
                    ? "text-zinc-900 dark:text-zinc-100"
                    : "text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300"
                }`}
              />

              {!isCollapsed && (
                <div className="flex items-center justify-between flex-1 min-w-0">
                  <span className="truncate">{item.name}</span>
                  {item.badge && (
                    <span className="text-[9px] font-mono font-medium px-1.5 py-0.2 rounded border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Bottom Footer Section: Early Access Notice & Collapse Toggle */}
      <div className="p-2 border-t border-zinc-100 dark:border-zinc-800/80 space-y-2">
        {!isCollapsed && (
          <div className="px-2.5 py-2 rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-start gap-2">
            {role === "staff" ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                <div className="leading-tight">
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">Staff Account</span>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">{profile?.username || "Sub-user"} · Role Protected</p>
                </div>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <div className="leading-tight">
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">Bill Next v0.1</span>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">Admin · Full Access</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Sidebar Collapse Toggle Button */}
        <button
          onClick={toggleCollapse}
          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-4 h-4 mx-auto" />
          ) : (
            <>
              <PanelLeftClose className="w-4 h-4" />
              <span className="text-[11px]">Collapse sidebar</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

