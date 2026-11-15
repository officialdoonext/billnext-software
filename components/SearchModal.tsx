"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import {
  Search,
  LayoutDashboard,
  Receipt,
  Package,
  FolderTree,
  Users,
  Settings,
  ArrowRight,
  ExternalLink,
  Zap,
  TrendingUp
} from "lucide-react";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const { canView } = useAuth();

  const pages = [
    {
      title: "Dashboard",
      subtitle: "Project overview, connection strings, infrastructure topology & status",
      href: "/",
      icon: LayoutDashboard,
      category: "Navigation",
      status: "Active",
    },
    {
      title: "Billing",
      subtitle: "POS checkout terminal, weigh scale modal, customer tagging & draft bills",
      href: "/billing",
      icon: Receipt,
      category: "Finance",
      status: "Active",
    },
    {
      title: "Sales",
      subtitle: "Date range analytics, latest 24 orders pagination & tax invoice reprinting",
      href: "/sales",
      icon: TrendingUp,
      category: "Transactions",
      status: "Active",
    },
    {
      title: "Customers",
      subtitle: "Customer contacts, phone directory & purchase ledger",
      href: "/customers",
      icon: Users,
      category: "CRM",
      status: "Active",
    },
    {
      title: "Items",
      subtitle: "Product inventory, barcode tracking, 60KB image optimization & items count limit",
      href: "/items",
      icon: Package,
      category: "Catalog",
      status: "Active",
    },
    {
      title: "Item Categories",
      subtitle: "Tax slab grouping, hierarchical categories & organization taxonomy",
      href: "/categories",
      icon: FolderTree,
      category: "Catalog",
      status: "Active",
    },
    {
      title: "Users",
      subtitle: "Team member access, cashier roles, MPIN credentials & granular page permissions",
      href: "/users",
      icon: Users,
      category: "Administration",
      status: "Active",
    },
    {
      title: "Settings",
      subtitle: "Store profile, receipt printers, tax GSTIN, webhooks & API credentials",
      href: "/settings",
      icon: Settings,
      category: "Administration",
      status: "Active",
    },
  ];

  const visiblePages = pages.filter((p) => canView(p.href));

  const filtered = visiblePages.filter(
    (p) =>
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.subtitle.toLowerCase().includes(query.toLowerCase()) ||
      p.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open handled by parent or triggers toggle
        }
      }

      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
      } else if (e.key === "Enter" && filtered[selectedIndex]) {
        e.preventDefault();
        router.push(filtered[selectedIndex].href);
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filtered, selectedIndex, router, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-start justify-center pt-20 p-4">
      <div
        className="w-full max-w-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 border-b border-zinc-100 dark:border-zinc-800">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Bill Next modules (Dashboard, Billing, Items, Categories, Users, Settings)..."
            className="w-full px-3 py-3.5 text-xs bg-transparent text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
            autoFocus
          />
          <button
            onClick={onClose}
            className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            ESC
          </button>
        </div>

        {/* Search Results List */}
        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-400">
              No pages matching &ldquo;{query}&rdquo;
            </div>
          ) : (
            filtered.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.href}
                  onClick={() => {
                    router.push(item.href);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between p-2.5 rounded-lg text-xs cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? "bg-white dark:bg-zinc-700 border-zinc-200 dark:border-zinc-600 text-emerald-600 dark:text-emerald-400"
                          : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200/60 dark:border-zinc-700/60 text-zinc-400"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">{item.title}</span>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500">{item.category}</span>
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{item.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span
                      className={`text-[9px] font-mono font-medium px-1.5 py-0.5 rounded border ${
                        item.status === "Active"
                          ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                          : "border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                      }`}
                    >
                      {item.status}
                    </span>
                    <ArrowRight
                      className={`w-3.5 h-3.5 transition-transform ${
                        isSelected ? "translate-x-0.5 text-zinc-900 dark:text-zinc-100" : "text-zinc-300 dark:text-zinc-600"
                      }`}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-3 py-2 bg-zinc-50 dark:bg-zinc-950/50 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
          <span>Navigate with ↑ ↓ and Enter</span>
          <span className="flex items-center gap-1 font-mono text-[10px]">
            <Zap className="w-3 h-3 text-emerald-500" /> Bill Next
          </span>
        </div>
      </div>
    </div>
  );
}

