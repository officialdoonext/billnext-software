"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  PieChart as PieIcon,
  BarChart3,
  LineChart as LineIcon,
  Activity,
  Layers,
  CircleDollarSign,
  QrCode,
  Banknote,
  CreditCard,
  Percent
} from "lucide-react";

// =========================================================================
// 1. DUAL BAR CHART: REVENUE VS EXPENSES
// =========================================================================
export interface BarDataPoint {
  label: string;
  revenue: number;
  expenses: number;
}

export function RevenueExpenseBarChart({ data }: { data: BarDataPoint[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.revenue, d.expenses)),
    100
  );

  const chartHeight = 160;

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-emerald-500" />
          <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            Revenue vs Expenses Comparison
          </h3>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#3ECF8E]" />
            Revenue
          </span>
          <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
            <span className="w-2.5 h-2.5 rounded-xs bg-rose-500" />
            Expenses
          </span>
        </div>
      </div>

      <div className="relative pt-4">
        {/* SVG Grid and Bars */}
        <div className="h-44 flex items-end justify-between gap-2 px-2 border-b border-zinc-200 dark:border-zinc-800">
          {data.map((item, idx) => {
            const revHeight = (item.revenue / maxVal) * chartHeight;
            const expHeight = (item.expenses / maxVal) * chartHeight;
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
              >
                {/* Floating Tooltip */}
                {isHovered && (
                  <div className="absolute -top-12 z-20 px-2.5 py-1.5 rounded-lg bg-zinc-900 text-white text-[10px] font-mono shadow-xl border border-zinc-700 whitespace-nowrap animate-in fade-in duration-150 pointer-events-none">
                    <div className="font-semibold text-zinc-300">{item.label}</div>
                    <div className="text-emerald-400">Rev: ₹{item.revenue.toFixed(0)}</div>
                    <div className="text-rose-400">Exp: ₹{item.expenses.toFixed(0)}</div>
                  </div>
                )}

                {/* Bars Container */}
                <div className="w-full flex items-end justify-center gap-1 max-w-[42px]">
                  {/* Revenue Bar */}
                  <div
                    style={{ height: `${Math.max(revHeight, 4)}px` }}
                    className={`w-1/2 rounded-t-sm transition-all duration-300 ${
                      isHovered ? "bg-emerald-400" : "bg-[#3ECF8E]"
                    }`}
                  />
                  {/* Expense Bar */}
                  <div
                    style={{ height: `${Math.max(expHeight, 4)}px` }}
                    className={`w-1/2 rounded-t-sm transition-all duration-300 ${
                      isHovered ? "bg-rose-400" : "bg-rose-500"
                    }`}
                  />
                </div>

                {/* Label */}
                <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 mt-2 truncate max-w-[48px] text-center">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// 2. SMOOTH GRADIENT AREA & LINE CHART: REVENUE TREND
// =========================================================================
export interface TrendPoint {
  label: string;
  value: number;
}

export function RevenueAreaChart({ data }: { data: TrendPoint[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (data.length === 0) return null;

  const width = 600;
  const height = 160;
  const paddingX = 30;
  const paddingY = 20;

  const maxVal = Math.max(...data.map((d) => d.value), 100);
  const minVal = 0;

  // Compute coordinates
  const points = data.map((d, i) => {
    const x = paddingX + (i / Math.max(data.length - 1, 1)) * (width - 2 * paddingX);
    const y = height - paddingY - (d.value / maxVal) * (height - 2 * paddingY);
    return { x, y, ...d };
  });

  const linePath = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, "");

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LineIcon className="w-4 h-4 text-emerald-500" />
          <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            Revenue Velocity & Sales Trend (Area Graph)
          </h3>
        </div>
        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
          Peak: ₹{maxVal.toFixed(0)}
        </span>
      </div>

      <div className="relative border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 p-2 overflow-hidden shadow-xs">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 overflow-visible">
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3ECF8E" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3ECF8E" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = height - paddingY - pct * (height - 2 * paddingY);
            return (
              <line
                key={idx}
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="currentColor"
                className="text-zinc-100 dark:text-zinc-800/80"
                strokeDasharray="3 3"
              />
            );
          })}

          {/* Area under curve */}
          <path d={areaPath} fill="url(#areaGradient)" />

          {/* Line stroke */}
          <path
            d={linePath}
            fill="none"
            stroke="#3ECF8E"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive Dots */}
          {points.map((p, idx) => {
            const isHovered = hoveredIndex === idx;
            return (
              <g key={idx}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 6 : 4}
                  className="fill-[#3ECF8E] stroke-white dark:stroke-zinc-900 stroke-2 transition-all cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
                {isHovered && (
                  <text
                    x={p.x}
                    y={p.y - 10}
                    textAnchor="middle"
                    className="text-[11px] font-mono font-bold fill-zinc-900 dark:fill-zinc-100"
                  >
                    ₹{p.value.toFixed(0)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Bottom X-Axis Labels */}
        <div className="flex justify-between px-6 pt-1 text-[10px] font-mono text-zinc-400">
          {data.map((d, i) => (
            <span key={i} className="truncate max-w-[60px] text-center">
              {d.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// 3. DONUT / PIE CHART: PAYMENT SPLIT & SHARE
// =========================================================================
export interface DonutSegment {
  label: string;
  value: number;
  color: string;
  textColor: string;
}

export function DonutPieChart({
  segments,
  centerTitle,
  centerSubtitle,
}: {
  segments: DonutSegment[];
  centerTitle: string;
  centerSubtitle: string;
}) {
  const [activeSegment, setActiveSegment] = useState<number | null>(null);

  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const size = 160;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      {/* SVG Donut */}
      <div className="relative shrink-0 flex items-center justify-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-zinc-100 dark:text-zinc-800"
          />

          {total > 0 &&
            segments.map((seg, idx) => {
              const percent = seg.value / total;
              const strokeDasharray = `${percent * circumference} ${circumference}`;
              const strokeDashoffset = -accumulatedPercent * circumference;
              accumulatedPercent += percent;

              const isHovered = activeSegment === idx;

              return (
                <circle
                  key={idx}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  onMouseEnter={() => setActiveSegment(idx)}
                  onMouseLeave={() => setActiveSegment(null)}
                  className="transition-all duration-200 cursor-pointer"
                />
              );
            })}
        </svg>

        {/* Center Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
            {centerSubtitle}
          </span>
          <span className="text-sm font-bold font-mono text-zinc-900 dark:text-zinc-100">
            {centerTitle}
          </span>
        </div>
      </div>

      {/* Legend & Percentages */}
      <div className="flex-1 space-y-2 w-full">
        {segments.map((seg, idx) => {
          const pct = total > 0 ? (seg.value / total) * 100 : 0;
          const isHovered = activeSegment === idx;

          return (
            <div
              key={idx}
              onMouseEnter={() => setActiveSegment(idx)}
              onMouseLeave={() => setActiveSegment(null)}
              className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-between text-xs ${
                isHovered
                  ? "border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 shadow-xs"
                  : "border-zinc-100 dark:border-zinc-800/80 bg-transparent"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                <span className="font-medium text-zinc-800 dark:text-zinc-200">{seg.label}</span>
              </div>
              <div className="flex items-center gap-2 font-mono">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  ₹{seg.value.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
                </span>
                <span className="text-[10px] text-zinc-400">({pct.toFixed(1)}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =========================================================================
// 4. PROGRESS METERS & TARGET GAUGES
// =========================================================================
export function FinancialProgressMeters({
  revenue,
  expenses,
  profit,
  profitMargin,
  upi,
  cash,
  card,
  gstAmount,
}: {
  revenue: number;
  expenses: number;
  profit: number;
  profitMargin: number;
  upi: number;
  cash: number;
  card: number;
  gstAmount: number;
}) {
  const tenderTotal = upi + cash + card;
  const upiPct = tenderTotal > 0 ? (upi / tenderTotal) * 100 : 0;
  const cashPct = tenderTotal > 0 ? (cash / tenderTotal) * 100 : 0;
  const cardPct = tenderTotal > 0 ? (card / tenderTotal) * 100 : 0;

  // Normalized profit meter (-100% to +100% mapped to 0% to 100%)
  const clampedMargin = Math.max(-100, Math.min(100, profitMargin));
  const marginMeterPct = Math.max(0, Math.min(100, (clampedMargin + 100) / 2));

  return (
    <div className="space-y-4">
      {/* 1. Net Profit Margin Progress */}
      <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-emerald-500" />
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">Net Profit Margin Gauge</span>
          </div>
          <span
            className={`font-mono text-xs font-bold ${
              profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {profitMargin >= 0 ? `+${profitMargin.toFixed(1)}%` : `${profitMargin.toFixed(1)}%`}
          </span>
        </div>

        <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden relative">
          {/* Neutral center marker */}
          <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-zinc-400 z-10" />
          <div
            style={{ width: `${marginMeterPct}%` }}
            className={`h-full rounded-full transition-all duration-500 ${
              profit >= 0 ? "bg-[#3ECF8E]" : "bg-rose-500"
            }`}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
          <span>-100% (High Deficit)</span>
          <span>0% (Break Even)</span>
          <span>+100% (High Profit)</span>
        </div>
      </div>

      {/* 2. Tender Collection Share Multi-Segment Progress Bar */}
      <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">Tender Share Multi-Progress</span>
          <span className="text-[11px] font-mono text-zinc-400">
            Total Tender: ₹{tenderTotal.toLocaleString("en-IN")}
          </span>
        </div>

        <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
          <div style={{ width: `${upiPct}%` }} className="bg-[#3ECF8E] transition-all" title={`UPI: ${upiPct.toFixed(1)}%`} />
          <div style={{ width: `${cashPct}%` }} className="bg-amber-400 transition-all" title={`Cash: ${cashPct.toFixed(1)}%`} />
          <div style={{ width: `${cardPct}%` }} className="bg-blue-500 transition-all" title={`Card: ${cardPct.toFixed(1)}%`} />
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] font-mono">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-[#3ECF8E]" />
            <span>UPI: {upiPct.toFixed(0)}%</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>CASH: {cashPct.toFixed(0)}%</span>
          </div>
          <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>CARD: {cardPct.toFixed(0)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

