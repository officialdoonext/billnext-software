"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Copy,
  Check,
  ChevronDown,
  Loader2,
  Cpu,
  GitBranch,
  Database,
  Archive,
  Network,
  Globe2,
  GripVertical,
  Activity,
  ArrowRight,
  Receipt,
  Package,
  FolderTree,
  Users,
  Settings,
  Sparkles,
  TrendingUp
} from "lucide-react";

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

export default function DashboardView() {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState("Last 60 minutes");
  const [isTimeframeOpen, setIsTimeframeOpen] = useState(false);

  const projectUrl = "https://eknexmgwtljqacsqftlnq.billnext.dev";

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(projectUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const timeframes = ["Last 60 minutes", "Last 24 hours", "Last 7 days", "Last 30 days"];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Early Access / Coming Soon Notification Banner */}
      <div className="p-3.5 rounded-lg border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/70 dark:bg-emerald-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="font-semibold text-emerald-900 dark:text-emerald-300">
            Bill Next Platform Setup
          </span>
          <span className="text-emerald-700 dark:text-emerald-400">
            — Core engine online. Billing, Items, Categories, Users, and Settings are in preview (Coming Soon).
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/billing"
            className="text-emerald-800 dark:text-emerald-300 font-medium hover:underline flex items-center gap-1"
          >
            Explore preview pages <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Main Project Header Area */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 font-sans">
          Bill Next
        </h1>

        {/* Project URL Bar with Copy Button */}
        <div className="flex items-center gap-2 pt-0.5">
          <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400 select-all">
            {projectUrl}
          </span>
          <button
            onClick={handleCopyUrl}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-normal transition-colors cursor-pointer shadow-2xs"
            title="Copy URL"
          >
            {copiedUrl ? (
              <>
                <Check className="w-3 h-3 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Copied</span>
              </>
            ) : (
              <>
                <span>Copy</span>
                <ChevronDown className="w-3 h-3 text-zinc-400" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Two-Column Infrastructure Section: Left Grid (6 cards) + Right Dotted Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 6 Status Cards (2 columns x 3 rows) */}
        <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Card 1: STATUS */}
          <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs flex items-center gap-3.5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
            <div className="w-10 h-10 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/80 flex items-center justify-center text-zinc-600 dark:text-zinc-300 shrink-0">
              <Loader2 className="w-4 h-4 animate-spin text-zinc-700 dark:text-zinc-300" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-medium">
                STATUS
              </div>
              <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate mt-0.5">
                Coming up...
              </div>
            </div>
          </div>

          {/* Card 2: COMPUTE SIZE */}
          <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs flex items-center gap-3.5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
            <div className="w-10 h-10 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/80 flex items-center justify-center text-zinc-600 dark:text-zinc-300 shrink-0">
              <Cpu className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-medium">
                COMPUTE SIZE
              </div>
              <div className="mt-1">
                <span className="text-[10px] font-mono font-medium border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-1.5 py-0.5 rounded">
                  NANO
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: GITHUB */}
          <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs flex items-center gap-3.5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
            <div className="w-10 h-10 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/80 flex items-center justify-center text-zinc-600 dark:text-zinc-300 shrink-0">
              <GithubIcon className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-medium">
                GITHUB
              </div>
              <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate mt-0.5">
                Waiting for project...
              </div>
            </div>
          </div>

          {/* Card 4: RECENT BRANCH */}
          <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs flex items-center gap-3.5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
            <div className="w-10 h-10 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/80 flex items-center justify-center text-zinc-600 dark:text-zinc-300 shrink-0">
              <GitBranch className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-medium">
                RECENT BRANCH
              </div>
              <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate mt-0.5">
                No branches
              </div>
            </div>
          </div>

          {/* Card 5: LAST MIGRATION */}
          <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs flex items-center gap-3.5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
            <div className="w-10 h-10 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/80 flex items-center justify-center text-zinc-600 dark:text-zinc-300 shrink-0">
              <Database className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-medium">
                LAST MIGRATION
              </div>
              <div className="w-16 h-3 bg-zinc-200/80 dark:bg-zinc-800 rounded mt-1.5" />
            </div>
          </div>

          {/* Card 6: LAST BACKUP */}
          <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs flex items-center gap-3.5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
            <div className="w-10 h-10 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/80 flex items-center justify-center text-zinc-600 dark:text-zinc-300 shrink-0">
              <Archive className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-medium">
                LAST BACKUP
              </div>
              <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate mt-0.5">
                No backups
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dotted Canvas with Database Architecture Node */}
        <div className="lg:col-span-6 dot-grid border border-zinc-200 dark:border-zinc-800 rounded-xl relative overflow-hidden min-h-[290px] flex items-center justify-center p-6 shadow-2xs">
          {/* Top-Right Canvas Control Icons */}
          <div className="absolute top-3 right-3 flex items-center gap-1 border border-zinc-200 dark:border-zinc-700 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xs rounded-md p-0.5 shadow-2xs z-10">
            <button
              className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
              title="Topology view"
            >
              <Network className="w-3.5 h-3.5" />
            </button>
            <button
              className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
              title="Global network"
            >
              <Globe2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Architecture Node Card (Singapore Database as in reference image) */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-md w-full max-w-[370px] overflow-hidden transition-transform hover:scale-[1.01] duration-150">
            {/* Top Node Header */}
            <div className="p-3.5 flex items-center gap-3">
              {/* Green Database Icon */}
              <div className="w-9 h-9 rounded-lg bg-[#00C48C] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Database className="w-5 h-5 fill-white/20" />
              </div>

              {/* Title & Region */}
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                  Primary Database
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 mt-0.5">
                  <span className="truncate">Southeast Asia (Singapore)</span>
                  {/* Singapore Flag indicator */}
                  <span className="text-xs" title="Singapore">
                    🇸🇬
                  </span>
                </div>
                <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                  ap-southeast-1 · Nano
                </div>
              </div>
            </div>

            {/* Bottom Node Metrics Bar */}
            <div className="px-3.5 py-2 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 text-[10px] font-mono text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
              <span>CPU 0%</span>
              <span>·</span>
              <span>Disk 0%</span>
              <span>·</span>
              <span>RAM 0%</span>
              <span>·</span>
              <span className="text-zinc-400">Conns Unavailable</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Metrics Section (5 Total Requests, 80.0% Success Rate) */}
      <div className="space-y-3 pt-2">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <GripVertical className="w-4 h-4 text-zinc-300 dark:text-zinc-700 cursor-grab" />
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                5 Total Requests
              </span>
              <span className="text-base text-zinc-500 dark:text-zinc-400 font-normal">
                80.0% Success Rate
              </span>
            </div>
          </div>

          {/* Timeframe Dropdown */}
          <div className="relative self-start sm:self-auto">
            <button
              onClick={() => setIsTimeframeOpen(!isTimeframeOpen)}
              className="flex items-center gap-2 px-2.5 py-1 text-xs font-normal border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors shadow-2xs"
            >
              <span>{selectedTimeframe}</span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {isTimeframeOpen && (
              <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md shadow-lg py-1 z-20 text-xs">
                {timeframes.map((tf) => (
                  <button
                    key={tf}
                    onClick={() => {
                      setSelectedTimeframe(tf);
                      setIsTimeframeOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                      selectedTimeframe === tf ? "font-semibold text-emerald-600 dark:text-emerald-400" : "text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 4 Metric Panels in a Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Panel 1: STORAGE */}
          <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs flex flex-col justify-between min-h-[110px]">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-zinc-500 dark:text-zinc-400 font-semibold tracking-wider">
                STORAGE
              </span>
              <div className="flex items-center gap-2 text-zinc-400">
                <span>• WARNINGS 0</span>
                <span className="text-rose-500 dark:text-rose-400 font-medium">• ERRORS 1</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">
              3
            </div>
            {/* Visual Indicator Bar */}
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-3">
              <div className="bg-[#3ECF8E] h-full rounded-full" style={{ width: "65%" }} />
            </div>
          </div>

          {/* Panel 2: REALTIME */}
          <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs flex flex-col justify-between min-h-[110px]">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-zinc-500 dark:text-zinc-400 font-semibold tracking-wider">
                REALTIME
              </span>
              <div className="flex items-center gap-2 text-zinc-400">
                <span>• WARNINGS 0</span>
                <span>• ERRORS 0</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">
              2
            </div>
            {/* Visual Indicator Bar */}
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-3">
              <div className="bg-[#3ECF8E] h-full rounded-full" style={{ width: "40%" }} />
            </div>
          </div>

          {/* Panel 3: POSTGRES */}
          <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs flex flex-col justify-between min-h-[110px]">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-zinc-500 dark:text-zinc-400 font-semibold tracking-wider">
                POSTGRES
              </span>
              <div className="flex items-center gap-2 text-zinc-400">
                <span>• WARNINGS 0</span>
                <span>• ERRORS 0</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">
              0
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-3">
              <div className="bg-zinc-300 dark:bg-zinc-700 h-full rounded-full" style={{ width: "0%" }} />
            </div>
          </div>

          {/* Panel 4: EDGE FUNCTIONS */}
          <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs flex flex-col justify-between min-h-[110px]">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-zinc-500 dark:text-zinc-400 font-semibold tracking-wider">
                EDGE FUNCTIONS
              </span>
              <div className="flex items-center gap-2 text-zinc-400">
                <span>• WARNINGS 0</span>
                <span>• ERRORS 0</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">
              0
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-3">
              <div className="bg-zinc-300 dark:bg-zinc-700 h-full rounded-full" style={{ width: "0%" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Modules Quick Navigation / Coming Soon Showcase Grid */}
      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Bill Next Modules Overview
            </h2>
          </div>
          <span className="text-xs text-zinc-500">6 modules currently in development</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          {[
            {
              title: "Billing",
              desc: "Invoices, tax & billing engines",
              href: "/billing",
              icon: Receipt,
            },
            {
              title: "Sales",
              desc: "Orders, returns & revenue",
              href: "/sales",
              icon: TrendingUp,
            },
            {
              title: "Items",
              desc: "Inventory, SKUs & barcodes",
              href: "/items",
              icon: Package,
            },
            {
              title: "Item Categories",
              desc: "Classification & tax slabs",
              href: "/categories",
              icon: FolderTree,
            },
            {
              title: "Users",
              desc: "Cashiers & role permissions",
              href: "/users",
              icon: Users,
            },
            {
              title: "Settings",
              desc: "Printers, store info & keys",
              href: "/settings",
              icon: Settings,
            },
          ].map((m) => {
            const Icon = m.icon;
            return (
              <Link
                key={m.href}
                href={m.href}
                className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-xs transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-7 h-7 rounded-md bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-300 group-hover:text-emerald-500">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-medium">
                    SOON
                  </span>
                </div>
                <div className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {m.title}
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                  {m.desc}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
