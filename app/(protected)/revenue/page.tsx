"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  CreditCard,
  Calendar,
  Award,
  Crown,
  Percent,
  DollarSign,
  ChevronRight,
  AlertCircle,
  Clock,
  ArrowUpRight,
  Shield,
  Layers,
  FileText,
  Sliders,
} from "lucide-react";
import { toast } from "sonner";
import Pagination from "@/components/admin/Pagination";
import {
  getRevenueOverview,
  RevenueOverviewData,
  RevenueTransactionItem,
} from "@/lib/api";

const DONUT_COLORS = [
  "#2d4a23", // Dark Forest Green
  "#4285F4", // Blue
  "#FBBC05", // Amber
  "#9334ea", // Purple
  "#06b6d4", // Cyan
  "#f97316", // Orange
];

export default function RevenuePage() {
  const [data, setData] = useState<RevenueOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from backend API
  const loadData = useCallback(
    async (isManualRefresh = false, targetPage?: number) => {
      const activePage = targetPage ?? page;
      if (isManualRefresh) {
        setRefreshing(true);
      } else if (!data) {
        setLoading(true);
      }
      setError(null);

      try {
        const response = await getRevenueOverview({ page: activePage, limit });
        if (response && response.data) {
          setData(response.data);
          if (isManualRefresh) {
            toast.success("Revenue overview updated successfully");
          }
        } else {
          setError("No data received from server");
        }
      } catch (err: any) {
        console.error("Failed to load revenue overview:", err);
        const errMsg = err?.message || "Failed to load revenue overview data";
        setError(errMsg);
        if (isManualRefresh) {
          toast.error(errMsg);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, limit, data]
  );

  useEffect(() => {
    loadData(false, page);
  }, [page]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  /* -------------------------------------------------------------------------- */
  /* Helper: Format Currencies and Numbers                                      */
  /* -------------------------------------------------------------------------- */
  const formatMoney = (val?: number | string | null, currency = "USD") => {
    if (val === undefined || val === null || val === "") return "$0.00";
    const num = Number(val);
    if (isNaN(num)) return String(val);
    return `$${num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return "—";
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  /* -------------------------------------------------------------------------- */
  /* Donut Chart SVG Calculations                                              */
  /* -------------------------------------------------------------------------- */
  const planData = useMemo(() => {
    if (!data?.revenue_by_plan) return null;
    const breakdown = data.revenue_by_plan.breakdown || [];
    const totalUsers = data.revenue_by_plan.total_active_users || 0;

    let cumOffset = 0;
    const segments = breakdown.map((item, index) => {
      const pct = Number(item.percentage) || 0;
      const offset = cumOffset;
      cumOffset += pct;
      const color = DONUT_COLORS[index % DONUT_COLORS.length];

      // Calculate label coordinates along the circle
      const mid = offset + pct / 2;
      const angle = (mid / 100) * 2 * Math.PI - Math.PI / 2;
      const r = 68;
      const cx = 100;
      const cy = 100;
      const lx = cx + r * Math.cos(angle);
      const ly = cy + r * Math.sin(angle);

      return {
        ...item,
        color,
        pct,
        offset,
        lx,
        ly,
      };
    });

    return {
      totalUsers,
      segments,
    };
  }, [data?.revenue_by_plan]);

  /* -------------------------------------------------------------------------- */
  /* Monthly Area / Line Chart SVG Calculations                                */
  /* -------------------------------------------------------------------------- */
  const monthChartData = useMemo(() => {
    const list = data?.revenue_by_month || [];
    if (!list || list.length === 0) return null;

    const W = 420;
    const H = 240;
    const pL = 52;
    const pR = 20;
    const pT = 24;
    const pB = 34;
    const cw = W - pL - pR;
    const ch = H - pT - pB;

    const revenues = list.map((item) => Number(item.revenue) || 0);
    const rawMax = Math.max(...revenues, 0);

    // Compute dynamic, beautiful headroom
    const getNiceMax = (val: number): number => {
      if (val <= 0) return 50;
      if (val <= 50) return 50;
      if (val <= 100) return 100;
      if (val <= 250) return 250;
      if (val <= 500) return 500;
      if (val <= 1000) return 1000;
      if (val <= 2500) return 2500;
      if (val <= 5000) return 5000;
      if (val <= 10000) return 10000;
      if (val <= 25000) return 25000;
      if (val <= 50000) return 50000;
      if (val <= 100000) return 100000;
      const mag = Math.pow(10, Math.floor(Math.log10(val)));
      return Math.ceil(val / mag) * mag;
    };

    const max = getNiceMax(rawMax);

    // Format tick label dynamically ($25, $500, $1.5k, $20k, $1M)
    const formatAxisLabel = (v: number): string => {
      if (v === 0) return "$0";
      if (v >= 1000000) {
        return `$${(v / 1000000).toFixed(v % 1000000 === 0 ? 0 : 1)}M`;
      }
      if (v >= 1000) {
        return `$${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k`;
      }
      return `$${Math.round(v)}`;
    };

    // Format floating point value dynamically ($29.99, $146, $389.94, $1.2k)
    const formatPointValue = (v: number): string => {
      if (v === 0) return "$0";
      if (v >= 10000) {
        return `$${(v / 1000).toFixed(1)}k`;
      }
      if (v >= 1000) {
        return `$${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k`;
      }
      return `$${v.toLocaleString("en-US", {
        minimumFractionDigits: v % 1 !== 0 ? 2 : 0,
        maximumFractionDigits: 2,
      })}`;
    };

    const yTicksCount = 5;
    const yTicks = Array.from({ length: yTicksCount }, (_, i) => {
      const v = max * (1 - i / (yTicksCount - 1));
      const y = pT + (i / (yTicksCount - 1)) * ch;
      const lbl = formatAxisLabel(v);
      return { y, lbl, val: v };
    });

    const points = list.map((item, i) => {
      const count = list.length;
      const x = pL + (count > 1 ? (i / (count - 1)) * cw : cw / 2);
      const rev = Number(item.revenue) || 0;
      const y = pT + ch - (max > 0 ? Math.min(1, Math.max(0, rev / max)) * ch : 0);
      return {
        x,
        y,
        month: item.month,
        revenue: rev,
        formattedValue: formatPointValue(rev),
      };
    });

    const linePath = points
      .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(" ");

    const areaPath =
      points.length > 0
        ? `${linePath} L${points[points.length - 1].x.toFixed(1)},${pT + ch} L${points[0].x.toFixed(1)},${pT + ch} Z`
        : "";

    return {
      W,
      H,
      pL,
      pR,
      pT,
      pB,
      cw,
      ch,
      max,
      yTicks,
      points,
      linePath,
      areaPath,
    };
  }, [data?.revenue_by_month]);

  /* -------------------------------------------------------------------------- */
  /* Transactions Pagination Details                                           */
  /* -------------------------------------------------------------------------- */
  const transactions = data?.transactions?.data || [];
  const pagination = data?.transactions?.pagination || {
    currentPage: page,
    totalPages: 1,
    totalItems: transactions.length,
    itemsPerPage: limit,
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto text-[#1f1f1f]">
      {/* Top Banner & Refresh Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1f1f1f]">
            Revenue &amp; Monetization
          </h1>
          <p className="text-xs sm:text-sm text-[#7D848D] mt-0.5">
            Monitor real-time subscription performance, transaction breakdown, and monthly revenue trends.
          </p>
        </div>

        <button
          onClick={() => loadData(true)}
          disabled={loading || refreshing}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-[#2d4a23] bg-[#eef1ea] hover:bg-[#e2e7dc] rounded-[8px] transition-colors disabled:opacity-60 cursor-pointer self-start sm:self-auto"
          title="Refresh Data"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#2d4a23]" : ""}`}
          />
          <span>{refreshing ? "Updating..." : "Refresh Data"}</span>
        </button>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="bg-[#fdecec] border border-[#f3c0c0] rounded-[10px] p-4 flex items-center justify-between gap-3 text-xs text-[#e03131]">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => loadData(true)}
            className="underline font-semibold hover:text-[#b91c1c] cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 1. STAT CARDS ROW (Matching HTML stat-card design)                  */}
      {/* ==================================================================== */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Subscription Revenue */}
        <div className="bg-white rounded-[14px] p-5 border border-[#ececec] shadow-[0_6px_20px_rgba(60,60,60,0.08),0_2px_6px_rgba(60,60,60,0.04)] flex flex-col justify-between">
          <div className="flex items-start justify-between mb-1.5">
            <span className="text-[#7D848D] text-[13px] font-medium">
              Subscription Revenue
            </span>
            <span className="w-7 h-7 flex items-center justify-center text-[#2d4a23]">
              <Crown className="w-5 h-5" />
            </span>
          </div>
          {loading && !data ? (
            <div className="space-y-2 py-2">
              <div className="h-7 w-28 bg-[#f1f1ed] rounded animate-pulse" />
              <div className="h-4 w-36 bg-[#f1f1ed] rounded animate-pulse" />
            </div>
          ) : (
            <>
              <div className="text-[24px] font-bold text-[#1f1f1f] my-1">
                {formatMoney(data?.summary_cards?.subscription_revenue?.count)}
              </div>
              <div
                className={`text-[12px] font-medium inline-flex items-center gap-1 ${
                  data?.summary_cards?.subscription_revenue?.trend === "down"
                    ? "text-[#e03131]"
                    : "text-[#34A853]"
                }`}
              >
                {data?.summary_cards?.subscription_revenue?.trend === "down" ? (
                  <span>&darr;</span>
                ) : (
                  <span>&uarr;</span>
                )}
                <span>
                  {data?.summary_cards?.subscription_revenue?.formatted_text ||
                    "No previous comparison"}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Card 2: Monthly Revenue */}
        <div className="bg-white rounded-[14px] p-5 border border-[#ececec] shadow-[0_6px_20px_rgba(60,60,60,0.08),0_2px_6px_rgba(60,60,60,0.04)] flex flex-col justify-between">
          <div className="flex items-start justify-between mb-1.5">
            <span className="text-[#7D848D] text-[13px] font-medium">
              Monthly Revenue
            </span>
            <span className="w-7 h-7 flex items-center justify-center text-[#2d4a23]">
              <CreditCard className="w-5 h-5" />
            </span>
          </div>
          {loading && !data ? (
            <div className="space-y-2 py-2">
              <div className="h-7 w-28 bg-[#f1f1ed] rounded animate-pulse" />
              <div className="h-4 w-36 bg-[#f1f1ed] rounded animate-pulse" />
            </div>
          ) : (
            <>
              <div className="text-[24px] font-bold text-[#1f1f1f] my-1">
                {formatMoney(data?.summary_cards?.monthly_revenue?.count)}
              </div>
              <div
                className={`text-[12px] font-medium inline-flex items-center gap-1 ${
                  data?.summary_cards?.monthly_revenue?.trend === "down"
                    ? "text-[#e03131]"
                    : "text-[#34A853]"
                }`}
              >
                {data?.summary_cards?.monthly_revenue?.trend === "down" ? (
                  <span>&darr;</span>
                ) : (
                  <span>&uarr;</span>
                )}
                <span>
                  {data?.summary_cards?.monthly_revenue?.formatted_text ||
                    "No previous comparison"}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Card 3: Conversion Rate */}
        <div className="bg-white rounded-[14px] p-5 border border-[#ececec] shadow-[0_6px_20px_rgba(60,60,60,0.08),0_2px_6px_rgba(60,60,60,0.04)] flex flex-col justify-between">
          <div className="flex items-start justify-between mb-1.5">
            <span className="text-[#7D848D] text-[13px] font-medium">
              Conversion Rate
            </span>
            <span className="w-8 h-8 rounded-full bg-[#1f3d2a] text-white flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </span>
          </div>
          {loading && !data ? (
            <div className="space-y-2 py-2">
              <div className="h-7 w-28 bg-[#f1f1ed] rounded animate-pulse" />
              <div className="h-4 w-36 bg-[#f1f1ed] rounded animate-pulse" />
            </div>
          ) : (
            <>
              <div className="text-[24px] font-bold text-[#1f1f1f] my-1">
                {data?.summary_cards?.conversion_rate?.rate_percentage !== undefined
                  ? `${data.summary_cards.conversion_rate.rate_percentage}%`
                  : "—"}
                {data?.summary_cards?.conversion_rate?.paid_users !== undefined &&
                  data?.summary_cards?.conversion_rate?.total_users !== undefined && (
                    <span className="text-xs font-normal text-[#7D848D] ml-2">
                      ({data.summary_cards.conversion_rate.paid_users} /{" "}
                      {data.summary_cards.conversion_rate.total_users} users)
                    </span>
                  )}
              </div>
              <div
                className={`text-[12px] font-medium inline-flex items-center gap-1 ${
                  data?.summary_cards?.conversion_rate?.trend === "down"
                    ? "text-[#e03131]"
                    : "text-[#34A853]"
                }`}
              >
                {data?.summary_cards?.conversion_rate?.trend === "down" ? (
                  <span>&darr;</span>
                ) : (
                  <span>&uarr;</span>
                )}
                <span>
                  {data?.summary_cards?.conversion_rate?.formatted_text ||
                    "No previous comparison"}
                </span>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 2. MAIN BODY GRID (LEFT: Charts & Table, RIGHT: Insights & Actions) */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* ================= LEFT SECTION (xl:col-span-8) ================= */}
        <div className="xl:col-span-8 space-y-6">
          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Chart 1: Revenue by Plan (Donut Chart) */}
            <div className="bg-white rounded-[14px] p-5 border border-[#ececec] shadow-[0_6px_20px_rgba(60,60,60,0.08),0_2px_6px_rgba(60,60,60,0.04)] flex flex-col justify-between">
              <h3 className="text-[15px] font-semibold text-[#1f1f1f] pb-3 mb-4 border-b border-[#ececec]">
                Revenue by Plan
              </h3>

              {loading && !data ? (
                <div className="h-[220px] flex items-center justify-center">
                  <div className="w-36 h-36 rounded-full border-4 border-[#f1f1ed] border-t-[#2d4a23] animate-spin" />
                </div>
              ) : !planData || planData.segments.length === 0 ? (
                <div className="h-[220px] flex items-center justify-center text-xs text-[#7D848D]">
                  No plan breakdown data available
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 min-h-[220px]">
                  {/* SVG Donut */}
                  <div className="relative shrink-0">
                    <svg
                      width="190"
                      height="190"
                      viewBox="0 0 200 200"
                      className="block transform -rotate-90"
                    >
                      {planData.segments.map((s, idx) => (
                        <circle
                          key={`seg-${idx}`}
                          cx="100"
                          cy="100"
                          r="68"
                          fill="none"
                          stroke={s.color}
                          strokeWidth="42"
                          pathLength="100"
                          strokeDasharray={`${s.pct.toFixed(2)} ${(100 - s.pct).toFixed(2)}`}
                          strokeDashoffset={(-s.offset).toFixed(2)}
                          className="transition-all duration-300"
                        />
                      ))}
                    </svg>

                    {/* Donut Center Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                      <span className="text-[19px] font-bold text-[#1f1f1f] leading-none">
                        {planData.totalUsers.toLocaleString()}
                      </span>
                      <span className="text-[11px] text-[#7D848D] mt-1 font-medium">
                        Total Users
                      </span>
                    </div>
                  </div>

                  {/* Donut Legend */}
                  <div className="flex flex-col gap-3 text-[12.5px] w-full sm:w-auto">
                    {planData.segments.map((s, idx) => (
                      <div key={`legend-${idx}`} className="flex items-start gap-2.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 mt-1"
                          style={{ backgroundColor: s.color }}
                        />
                        <div>
                          <div className="text-[#1f1f1f] font-semibold text-[13px]">
                            {s.name}
                          </div>
                          <div className="text-[#7D848D] text-[11.5px]">
                            {s.percentage}% ({s.user_count.toLocaleString()} users)
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Chart 2: Revenue by Month (Area Trend) */}
            <div className="bg-white rounded-[14px] p-5 border border-[#ececec] shadow-[0_6px_20px_rgba(60,60,60,0.08),0_2px_6px_rgba(60,60,60,0.04)] flex flex-col justify-between">
              <h3 className="text-[15px] font-semibold text-[#1f1f1f] pb-3 mb-4 border-b border-[#ececec]">
                Revenue by Month
              </h3>

              {loading && !data ? (
                <div className="h-[220px] flex items-center justify-center">
                  <div className="w-10 h-10 border-4 border-[#f1f1ed] border-t-[#3a86d6] rounded-full animate-spin" />
                </div>
              ) : !monthChartData ? (
                <div className="h-[220px] flex items-center justify-center text-xs text-[#7D848D]">
                  No monthly revenue data available
                </div>
              ) : (
                <div className="w-full relative min-h-[220px] overflow-hidden">
                  <svg
                    width="100%"
                    height="220"
                    viewBox={`0 0 ${monthChartData.W} ${monthChartData.H}`}
                    preserveAspectRatio="none"
                    className="overflow-visible"
                  >
                    <defs>
                      <linearGradient id="revenue_month_grad" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#5da3f5" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#5da3f5" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Grid lines */}
                    <g stroke="#f1f1ed" strokeDasharray="3 4">
                      {monthChartData.yTicks.map((t, idx) => (
                        <line
                          key={`grid-${idx}`}
                          x1={monthChartData.pL}
                          y1={t.y}
                          x2={monthChartData.W - monthChartData.pR}
                          y2={t.y}
                        />
                      ))}
                    </g>

                    {/* Y-axis Labels */}
                    <g fontSize="10" fill="#8f959e" fontWeight="500">
                      {monthChartData.yTicks.map((t, idx) => (
                        <text key={`ytick-${idx}`} x="4" y={t.y + 3}>
                          {t.lbl}
                        </text>
                      ))}
                    </g>

                    {/* Area Fill */}
                    {monthChartData.areaPath && (
                      <path d={monthChartData.areaPath} fill="url(#revenue_month_grad)" />
                    )}

                    {/* Line Stroke */}
                    {monthChartData.linePath && (
                      <path
                        d={monthChartData.linePath}
                        fill="none"
                        stroke="#3a86d6"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {/* Data Circles */}
                    <g fill="#fff" stroke="#3a86d6" strokeWidth="2">
                      {monthChartData.points.map((p, idx) => (
                        <circle
                          key={`pt-${idx}`}
                          cx={p.x.toFixed(1)}
                          cy={p.y.toFixed(1)}
                          r="3.5"
                        />
                      ))}
                    </g>

                    {/* Floating Value Labels */}
                    <g
                      fontSize="9.5"
                      fill="#222"
                      fontWeight="600"
                      textAnchor="middle"
                    >
                      {monthChartData.points.map((p, idx) => (
                        <text
                          key={`vlbl-${idx}`}
                          x={p.x.toFixed(1)}
                          y={(p.y - 8).toFixed(1)}
                        >
                          {p.formattedValue}
                        </text>
                      ))}
                    </g>

                    {/* Month X-axis Labels */}
                    <g
                      fontSize="10"
                      fill="#8f959e"
                      fontWeight="500"
                      textAnchor="middle"
                    >
                      {monthChartData.points.map((p, idx) => (
                        <text
                          key={`xlbl-${idx}`}
                          x={p.x.toFixed(1)}
                          y={monthChartData.H - 8}
                        >
                          {p.month.split(" ")[0]}
                        </text>
                      ))}
                    </g>
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Transactions Table Section */}
          <section className="bg-white rounded-[14px] p-5 border border-[#ececec] shadow-[0_6px_20px_rgba(60,60,60,0.08),0_2px_6px_rgba(60,60,60,0.04)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-[#ececec] gap-2">
              <h3 className="text-[15px] font-semibold text-[#1f1f1f]">
                Recent Revenue Transactions
              </h3>
              <span className="text-xs text-[#7D848D]">
                Total {pagination.totalItems.toLocaleString()} records
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px] border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-[#ececec] text-[#111111] font-semibold">
                    <th className="py-3 px-3">User</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Revenue Type</th>
                    <th className="py-3 px-3">Plan / Source</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">Payment Method</th>
                    <th className="py-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && !data ? (
                    Array.from({ length: 4 }).map((_, idx) => (
                      <tr key={`skel-${idx}`} className="border-b border-[#f1f1ed]">
                        <td className="py-3.5 px-3">
                          <div className="h-4 w-28 bg-[#f1f1ed] rounded animate-pulse" />
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="h-4 w-24 bg-[#f1f1ed] rounded animate-pulse" />
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="h-4 w-20 bg-[#f1f1ed] rounded animate-pulse" />
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="h-4 w-24 bg-[#f1f1ed] rounded animate-pulse" />
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="h-4 w-16 bg-[#f1f1ed] rounded animate-pulse" />
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="h-4 w-20 bg-[#f1f1ed] rounded animate-pulse" />
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="h-5 w-16 bg-[#f1f1ed] rounded-full animate-pulse" />
                        </td>
                      </tr>
                    ))
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-12 text-center text-xs text-[#7D848D]"
                      >
                        No revenue transactions found.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((txn) => {
                      const userDisplayName =
                        txn.user?.first_name || txn.user?.last_name
                          ? `${txn.user?.first_name || ""} ${txn.user?.last_name || ""}`.trim()
                          : txn.user?.email || "Unknown User";

                      const statusLower = (txn.status || "").toLowerCase();
                      const isCompleted =
                        statusLower === "completed" || statusLower === "paid" || statusLower === "success";
                      const isRefunded =
                        statusLower === "refunded" || statusLower === "failed";

                      return (
                        <tr
                          key={txn.id}
                          className="border-b border-[#f1f1ed] hover:bg-[#fafaf7] transition-colors"
                        >
                          {/* User */}
                          <td className="py-3.5 px-3">
                            <div className="font-medium text-[#1f1f1f]">
                              {userDisplayName}
                            </div>
                            {txn.user?.email && (
                              <div className="text-[11.5px] text-[#7D848D]">
                                {txn.user.email}
                              </div>
                            )}
                          </td>

                          {/* Date */}
                          <td className="py-3.5 px-3 text-[#7a7a7a] whitespace-nowrap text-[12.5px]">
                            {formatDate(txn.date)}
                          </td>

                          {/* Revenue Type */}
                          <td className="py-3.5 px-3 text-[#4a4a4a] font-medium">
                            {txn.revenue_type || "Subscription"}
                          </td>

                          {/* Plan */}
                          <td className="py-3.5 px-3 text-[#1f1f1f]">
                            {txn.plan_name || "—"}
                          </td>

                          {/* Amount */}
                          <td className="py-3.5 px-3 font-semibold text-[#1f1f1f] whitespace-nowrap">
                            {formatMoney(txn.amount)}
                            {txn.currency && (
                              <span className="text-[11px] text-[#7D848D] ml-1 font-normal">
                                {txn.currency}
                              </span>
                            )}
                          </td>

                          {/* Payment Method */}
                          <td className="py-3.5 px-3 text-[#555] text-[12.5px]">
                            {txn.payment_method || "Credit Card"}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-3">
                            <span
                              className={`inline-block px-3 py-1 rounded-[6px] text-[11.5px] font-medium border ${
                                isCompleted
                                  ? "text-[#34A853] bg-[#e8f5ec] border-[#b8e0c2]"
                                  : isRefunded
                                  ? "text-[#e03131] bg-[#fdecec] border-[#f3c0c0]"
                                  : "text-[#b45309] bg-[#fef3c7] border-[#fde68a]"
                              }`}
                            >
                              {txn.status || "Completed"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pagination && pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.currentPage || page}
                totalPages={pagination.totalPages || 1}
                totalItems={pagination.totalItems || transactions.length}
                pageSize={pagination.itemsPerPage || limit}
                itemLabel="transactions"
                onPageChange={handlePageChange}
                loading={loading}
              />
            )}
          </section>
        </div>

        {/* ================= RIGHT SECTION (xl:col-span-4) ================= */}
        <div className="xl:col-span-4 space-y-5">
          {/* Card 1: Top Performing Plan */}
          <div className="bg-white rounded-[14px] p-5 border border-[#ececec] shadow-[0_6px_20px_rgba(60,60,60,0.08),0_2px_6px_rgba(60,60,60,0.04)]">
            <h3 className="text-[15px] font-semibold text-[#1f1f1f] pb-3 mb-4 border-b border-[#ececec]">
              Top Performing Plan
            </h3>

            {loading && !data ? (
              <div className="space-y-2 py-1">
                <div className="h-4 w-32 bg-[#f1f1ed] rounded animate-pulse" />
                <div className="h-6 w-24 bg-[#f1f1ed] rounded animate-pulse" />
                <div className="h-3 w-40 bg-[#f1f1ed] rounded animate-pulse" />
              </div>
            ) : !data?.top_performing_plan ? (
              <div className="text-xs text-[#7D848D] py-3">
                No top performing plan data available
              </div>
            ) : (
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-[10px] bg-[#eef1ea] text-[#2d4a23] flex items-center justify-center shrink-0">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[#7D848D] text-[12.5px] font-medium">
                    {data.top_performing_plan.plan_name}
                  </div>
                  <div className="text-[20px] font-bold text-[#1f1f1f] my-0.5">
                    {formatMoney(data.top_performing_plan.total_revenue)}
                  </div>
                  <div className="text-[#7D848D] text-[12px]">
                    {data.top_performing_plan.formatted_text ||
                      `${data.top_performing_plan.percentage_of_total}% of total revenue`}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Highest Revenue Day */}
          <div className="bg-white rounded-[14px] p-5 border border-[#ececec] shadow-[0_6px_20px_rgba(60,60,60,0.08),0_2px_6px_rgba(60,60,60,0.04)]">
            <h3 className="text-[15px] font-semibold text-[#1f1f1f] pb-3 mb-4 border-b border-[#ececec]">
              Highest Revenue Day
            </h3>

            {loading && !data ? (
              <div className="space-y-2 py-1">
                <div className="h-4 w-32 bg-[#f1f1ed] rounded animate-pulse" />
                <div className="h-6 w-24 bg-[#f1f1ed] rounded animate-pulse" />
                <div className="h-3 w-40 bg-[#f1f1ed] rounded animate-pulse" />
              </div>
            ) : !data?.highest_revenue_day ? (
              <div className="text-xs text-[#7D848D] py-3">
                No highest revenue day data available
              </div>
            ) : (
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-[10px] bg-[#eef1ea] text-[#2d4a23] flex items-center justify-center shrink-0">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[#7D848D] text-[12.5px] font-medium">
                    {data.highest_revenue_day.date}
                  </div>
                  <div className="text-[20px] font-bold text-[#1f1f1f] my-0.5">
                    {formatMoney(data.highest_revenue_day.total_revenue)}
                  </div>
                  <div className="text-[#7D848D] text-[12px]">
                    {data.highest_revenue_day.formatted_text || "Total revenue"}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Card 3: Quick Actions */}
          <div className="bg-white rounded-[14px] p-5 border border-[#ececec] shadow-[0_6px_20px_rgba(60,60,60,0.08),0_2px_6px_rgba(60,60,60,0.04)]">
            <h3 className="text-[15px] font-semibold text-[#1f1f1f] pb-3 mb-2 border-b border-[#ececec]">
              Quick Actions
            </h3>
            <div className="divide-y divide-[#f1f1ed]">
              <Link
                href="/memberships"
                className="flex items-center justify-between py-3.5 text-[13.5px] font-medium text-[#1f1f1f] hover:text-[#2d4a23] transition-colors group"
              >
                <span className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-[#7D848D] group-hover:text-[#2d4a23]" />
                  Manage Pricing Plans
                </span>
                <ChevronRight className="w-4 h-4 text-[#aaa] group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/reports"
                className="flex items-center justify-between py-3.5 text-[13.5px] font-medium text-[#1f1f1f] hover:text-[#2d4a23] transition-colors group"
              >
                <span className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-[#7D848D] group-hover:text-[#2d4a23]" />
                  View Detailed Analytics
                </span>
                <ChevronRight className="w-4 h-4 text-[#aaa] group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/settings"
                className="flex items-center justify-between py-3.5 text-[13.5px] font-medium text-[#1f1f1f] hover:text-[#2d4a23] transition-colors group"
              >
                <span className="flex items-center gap-2.5">
                  <Sliders className="w-4 h-4 text-[#7D848D] group-hover:text-[#2d4a23]" />
                  Payout Settings
                </span>
                <ChevronRight className="w-4 h-4 text-[#aaa] group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
