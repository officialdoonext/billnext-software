"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Clock,
  Bell,
  Check,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Layers,
  Flame,
  Globe2,
  Receipt,
  Package,
  FolderTree,
  Users,
  Settings,
  HelpCircle,
  TrendingUp
} from "lucide-react";

export interface RoadmapItem {
  title: string;
  description: string;
  status: "In Development" | "Design Complete" | "Planned";
}

export interface MetricCard {
  label: string;
  value: string;
  badge?: string;
}

export interface ComingSoonViewProps {
  pageName: string;
  category: string;
  title: string;
  description: string;
  iconType: "billing" | "items" | "categories" | "users" | "settings" | "sales";
  nodeTitle: string;
  nodeSubtitle: string;
  nodeStats: string;
  previewMetrics: MetricCard[];
  roadmap: RoadmapItem[];
}

const ICON_MAP = {
  billing: Receipt,
  items: Package,
  categories: FolderTree,
  users: Users,
  settings: Settings,
  sales: TrendingUp,
};

export default function ComingSoonView({
  pageName,
  category,
  title,
  description,
  iconType,
  nodeTitle,
  nodeSubtitle,
  nodeStats,
  previewMetrics,
  roadmap,
}: ComingSoonViewProps) {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const PageIcon = ICON_MAP[iconType] || Sparkles;

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setTimeout(() => {
        // keep subscribed state
      }, 500);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Breadcrumb & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-200">
            Bill Next
          </Link>
          <span>/</span>
          <span className="text-zinc-400 dark:text-zinc-500">{category}</span>
          <span>/</span>
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{pageName}</span>
        </div>

        {/* Coming Soon Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-amber-300 dark:border-amber-800/80 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-xs font-medium">
            <Clock className="w-3.5 h-3.5" />
            Coming Soon · In Active Development
          </span>
        </div>
      </div>

      {/* Hero Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-800 dark:text-zinc-200 shrink-0 shadow-2xs">
              <PageIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 font-sans">
                {title}
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 max-w-2xl">
                {description}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Back to Dashboard */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-medium shadow-2xs transition-colors self-start md:self-auto"
        >
          <span>Return to Dashboard</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Supabase-style Architecture Blueprint Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Module Spec & Preview Metrics */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-medium">
                MODULE SPECIFICATION
              </span>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.2 rounded font-medium">
                V1.0 BETA
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {previewMetrics.map((metric, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/50"
                >
                  <div className="text-[10px] uppercase font-mono text-zinc-400 font-medium">
                    {metric.label}
                  </div>
                  <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-1">
                    {metric.value}
                  </div>
                  {metric.badge && (
                    <span className="inline-block mt-1 text-[9px] font-mono text-zinc-500 bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 px-1 rounded">
                      {metric.badge}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Waitlist / Notify Box */}
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-500" />
              <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                Get Notified on Launch
              </h3>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Be the first to access {pageName} when deployment finishes.
            </p>

            {subscribed ? (
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>You&apos;re on the early access waitlist!</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="flex-1 px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors cursor-pointer shrink-0"
                >
                  Notify Me
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Supabase Dotted Grid Blueprint Canvas with Central Node */}
        <div className="lg:col-span-7 dot-grid border border-zinc-200 dark:border-zinc-800 rounded-xl relative overflow-hidden min-h-[320px] flex items-center justify-center p-6 shadow-2xs">
          {/* Top-Right Control Icons */}
          <div className="absolute top-3 right-3 flex items-center gap-1 border border-zinc-200 dark:border-zinc-700 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xs rounded-md p-0.5 shadow-2xs z-10">
            <span className="text-[10px] font-mono px-2 py-0.5 text-zinc-500">
              BLUEPRINT PREVIEW
            </span>
          </div>

          {/* Central Architecture Node */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-md w-full max-w-[390px] overflow-hidden transition-all hover:scale-[1.01] duration-150">
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#3ECF8E] text-zinc-950 flex items-center justify-center shrink-0 shadow-xs">
                <PageIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                  {nodeTitle}
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                  {nodeSubtitle}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                    Building engine components
                  </span>
                </div>
              </div>
            </div>

            <div className="px-4 py-2.5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 text-[10px] font-mono text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
              <span>{nodeStats}</span>
              <span className="text-zinc-400">95% Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Roadmap Checklist */}
      <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {pageName} Engineering Roadmap
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Track the upcoming capabilities currently being wired into Bill Next.
            </p>
          </div>
          <span className="text-xs text-zinc-400 font-mono hidden sm:inline">
            Phase 1 / Q1 2027
          </span>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {roadmap.map((item, index) => (
            <div key={index} className="py-3 flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <span>{item.title}</span>
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {item.description}
                </div>
              </div>

              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border shrink-0 font-medium ${
                  item.status === "In Development"
                    ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                    : item.status === "Design Complete"
                    ? "border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400"
                    : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                }`}
              >
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
