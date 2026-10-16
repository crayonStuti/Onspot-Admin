"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  Award,
  Percent,
  ChevronRight,
  AlertCircle,
  Layers,
  FileText,
  Sliders,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import Pagination from "@/components/admin/Pagination";
import {
  getRevenueOverview,
  getPaymentMethods,
  RevenueOverviewData,
} from "@/lib/api";

const DONUT_COLORS = [
  "#3a5230", // Free
  "#5da3f5", // Premium
  "#d4c79a", // Basic
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
];

export default function RevenuePage() {
  const [data, setData] = useState<RevenueOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [period, setPeriod] = useState<string>("");
  const [plan, setPlan] = useState<string>("");
  const [paymentType, setPaymentType] = useState<string>("");
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [revenueType, setRevenueType] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Fetch payment methods on mount
  useEffect(() => {
    let isMounted = true;
    const fetchMethods = async () => {
      try {
        const response = await getPaymentMethods();
        if (isMounted && response?.data && Array.isArray(response.data)) {
          // Hide "Free / Trial" option
          const filtered = response.data.filter(
            (m) => m && m.toLowerCase().trim() !== "free / trial",
          );
          setPaymentMethods(filtered);
        }
      } catch (err) {
        console.error("Failed to load payment methods:", err);
      }
    };
    fetchMethods();
    return () => {
      isMounted = false;
    };
  }, []);

  // Debounce search query to prevent frequent API calls while typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Ingest URL search parameters on initial mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const p = params.get("period");
      const pl = params.get("plan");
      const pt = params.get("payment_type");
      const s = params.get("search");
      const rt = params.get("revenue_type");
      if (p) setPeriod(p);
      if (pl) setPlan(pl);
      if (pt) setPaymentType(pt);
      if (s) {
        setSearchQuery(s);
        setDebouncedSearch(s);
      }
      if (rt) setRevenueType(rt);
    }
  }, []);

  // Sync state if browser back/forward buttons are pressed
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        setPeriod(params.get("period") || "");
        setPlan(params.get("plan") || "");
        setPaymentType(params.get("payment_type") || "");
        const s = params.get("search") || "";
        setSearchQuery(s);
        setDebouncedSearch(s);
        setRevenueType(params.get("revenue_type") || "");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const updateUrlParams = (
    newPeriod: string,
    newPlan: string,
    newPaymentType: string,
    newSearch?: string,
    newRevenueType?: string,
  ) => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (newPeriod) {
        params.set("period", newPeriod);
      } else {
        params.delete("period");
      }
      if (newPlan) {
        params.set("plan", newPlan);
      } else {
        params.delete("plan");
      }
      if (newPaymentType) {
        params.set("payment_type", newPaymentType);
      } else {
        params.delete("payment_type");
      }
      const s = newSearch !== undefined ? newSearch : debouncedSearch;
      if (s && s.trim()) {
        params.set("search", s.trim());
      } else {
        params.delete("search");
      }
      const rt = newRevenueType !== undefined ? newRevenueType : revenueType;
      if (rt) {
        params.set("revenue_type", rt);
      } else {
        params.delete("revenue_type");
      }
      params.delete("page");
      const qs = params.toString();
      const newUrl = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
      window.history.replaceState(null, "", newUrl);
    }
  };

  const loadData = useCallback(
    async (
      isManualRefresh = false,
      targetPage?: number,
      targetPeriod?: string,
      targetPlan?: string,
      targetPaymentType?: string,
      targetSearch?: string,
      targetRevenueType?: string,
    ) => {
      const activePage = targetPage ?? page;
      const activePeriod = targetPeriod !== undefined ? targetPeriod : period;
      const activePlan = targetPlan !== undefined ? targetPlan : plan;
      const activePaymentType =
        targetPaymentType !== undefined ? targetPaymentType : paymentType;
      const activeSearch =
        targetSearch !== undefined ? targetSearch : debouncedSearch;
      const activeRevenueType =
        targetRevenueType !== undefined ? targetRevenueType : revenueType;

      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const response = await getRevenueOverview({
          page: activePage,
          limit,
          period: activePeriod || undefined,
          plan: activePlan || undefined,
          payment_type: activePaymentType || undefined,
          search:
            activeSearch && activeSearch.trim()
              ? activeSearch.trim()
              : undefined,
          revenue_type: activeRevenueType || undefined,
        });
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
    [page, limit, period, plan, paymentType, debouncedSearch, revenueType],
  );

  useEffect(() => {
    loadData(
      false,
      page,
      period,
      plan,
      paymentType,
      debouncedSearch,
      revenueType,
    );
  }, [page, period, plan, paymentType, debouncedSearch, revenueType]);

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    setPage(1);
    updateUrlParams(newPeriod, plan, paymentType, debouncedSearch, revenueType);
  };

  const handlePlanChange = (newPlan: string) => {
    setPlan(newPlan);
    setPage(1);
    updateUrlParams(period, newPlan, paymentType, debouncedSearch, revenueType);
  };

  const handlePaymentTypeChange = (newPaymentType: string) => {
    setPaymentType(newPaymentType);
    setPage(1);
    updateUrlParams(period, plan, newPaymentType, debouncedSearch, revenueType);
  };

  const handleResetFilters = () => {
    setPeriod("");
    setPlan("");
    setPaymentType("");
    setPage(1);
    updateUrlParams("", "", "", debouncedSearch, revenueType);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setPage(1);
    updateUrlParams(period, plan, paymentType, val, revenueType);
  };

  const handleRevenueTypeChange = (newType: string) => {
    setRevenueType(newType);
    setPage(1);
    updateUrlParams(period, plan, paymentType, debouncedSearch, newType);
  };

  const handleResetTransactionFilters = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setRevenueType("");
    setPage(1);
    updateUrlParams(period, plan, paymentType, "", "");
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

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

  const availablePlans = useMemo(() => {
    const list: { label: string; value: string }[] = [
      { label: "Basic", value: "basic" },
      { label: "Premium", value: "premium" },
    ];
    // if (data?.revenue_by_plan?.breakdown) {
    //   data.revenue_by_plan.breakdown.forEach((item) => {
    //     const val = (item.name || "").toLowerCase().trim();
    //     if (val && !list.some((p) => p.value === val)) {
    //       list.push({
    //         label: item.name.charAt(0).toUpperCase() + item.name.slice(1),
    //         value: val,
    //       });
    //     }
    //   });
    // }

    return list;
  }, [data?.revenue_by_plan]);

  const monthChartData = useMemo(() => {
    const list = data?.revenue_timeline || data?.revenue_by_month || [];
    if (!list || list.length === 0) return null;

    const W = 420;
    const H = 240;
    const pL = 52;
    const pR = 20;
    const pT = 24;
    const pB = 34;
    const cw = W - pL - pR;
    const ch = H - pT - pB;

    const revenues = list.map(
      (item: any) =>
        Number(item.revenue ?? item.amount ?? item.total ?? 0) || 0,
    );
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

    const points = list.map((item: any, i: number) => {
      const count = list.length;
      const x = pL + (count > 1 ? (i / (count - 1)) * cw : cw / 2);
      const rev = Number(item.revenue ?? item.amount ?? item.total ?? 0) || 0;
      const y =
        pT + ch - (max > 0 ? Math.min(1, Math.max(0, rev / max)) * ch : 0);

      const rawMonth =
        item.month || item.date || item.label || item.name || item.period || "";
      let monthDisplay = String(rawMonth || "");
      if (monthDisplay.includes("T")) {
        try {
          const d = new Date(monthDisplay);
          if (!isNaN(d.getTime())) {
            monthDisplay =
              period === "7_days" || period === "30_days"
                ? d.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                : d.toLocaleDateString("en-US", { month: "short" });
          }
        } catch {}
      } else if (monthDisplay.includes("-") && monthDisplay.length <= 10) {
        try {
          const parts = monthDisplay.split("-");
          if (parts.length >= 3) {
            const d = new Date(
              Number(parts[0]),
              Number(parts[1]) - 1,
              Number(parts[2]),
            );
            if (!isNaN(d.getTime())) {
              monthDisplay =
                period === "7_days" || period === "30_days"
                  ? d.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  : d.toLocaleDateString("en-US", { month: "short" });
            }
          } else if (parts.length === 2) {
            const d = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
            if (!isNaN(d.getTime())) {
              monthDisplay = d.toLocaleDateString("en-US", { month: "short" });
            }
          }
        } catch {}
      } else {
        monthDisplay = monthDisplay.split(" ")[0] || "";
      }

      return {
        x,
        y,
        month: monthDisplay || `P${i + 1}`,
        rawMonth,
        revenue: rev,
        formattedValue: formatPointValue(rev),
      };
    });

    const linePath = points
      .map(
        (p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`,
      )
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
  }, [data?.revenue_timeline, data?.revenue_by_month, period]);

  const timelineTitle = useMemo(() => {
    if (period === "7_days") {
      return "Revenue by Day";
    }
    if (period === "30_days") {
      return "Revenue by Week";
    }
    if (period === "90") {
      return "Revenue by Month";
    }
    // If no period is explicitly selected, check if data represents days or months
    const list = data?.revenue_timeline || data?.revenue_by_month;
    if (list && list.length > 0) {
      const first = list[0] as any;
      const raw = String(first?.date || first?.month || first?.label || "");
      if (
        /^\d{4}-\d{2}-\d{2}/.test(raw) ||
        /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/i.test(raw) ||
        list.length > 12
      ) {
        return "Revenue by Day";
      }
    }
    return "Revenue by Month";
  }, [period, data?.revenue_timeline, data?.revenue_by_month]);

  const transactions = data?.transactions?.data || [];
  const pagination = data?.transactions?.pagination || {
    currentPage: page,
    totalPages: 1,
    totalItems: transactions.length,
    itemsPerPage: limit,
  };

  return (
    <div className="space-y-6 w-full min-w-0 pb-10 text-[#1f1f1f]">
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

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-[14px] p-5 border border-[#ececec] shadow-[0_6px_20px_rgba(60,60,60,0.08),0_2px_6px_rgba(60,60,60,0.04)] flex flex-col justify-between">
          <div className="flex items-start justify-between mb-1.5">
            <span className="text-[#7D848D] text-[13px] font-medium">
              Subscription Revenue
            </span>
            <Image
              src="/images/revenue/subscription-revenue.png"
              alt="Subscription Revenue"
              width={30}
              height={30}
              className="object-contain"
            />
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

        <div className="bg-white rounded-[14px] p-5 border border-[#ececec] shadow-[0_6px_20px_rgba(60,60,60,0.08),0_2px_6px_rgba(60,60,60,0.04)] flex flex-col justify-between">
          <div className="flex items-start justify-between mb-1.5">
            <span className="text-[#7D848D] text-[13px] font-medium">
              Sponsorship Revenue
            </span>
            <Image
              src="/images/handshake.png"
              alt="Sponsorship Revenue"
              width={30}
              height={30}
              className="object-contain"
            />
          </div>
          {loading && !data ? (
            <div className="space-y-2 py-2">
              <div className="h-7 w-28 bg-[#f1f1ed] rounded animate-pulse" />
              <div className="h-4 w-36 bg-[#f1f1ed] rounded animate-pulse" />
            </div>
          ) : (
            <>
              <div className="text-[24px] font-bold text-[#1f1f1f] my-1">
                {formatMoney(data?.summary_cards?.sponsorship_revenue?.count)}
              </div>
              <div
                className={`text-[12px] font-medium inline-flex items-center gap-1 ${
                  data?.summary_cards?.sponsorship_revenue?.trend === "down"
                    ? "text-[#e03131]"
                    : "text-[#34A853]"
                }`}
              >
                {data?.summary_cards?.sponsorship_revenue?.trend === "down" ? (
                  <span>&darr;</span>
                ) : (
                  <span>&uarr;</span>
                )}
                <span>
                  {data?.summary_cards?.sponsorship_revenue?.formatted_text ||
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
            <Image
              src="/images/revenue/monthly-revenue.png"
              alt="Monthly Revenue"
              width={30}
              height={30}
              className="object-contain"
            />
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
                {data?.summary_cards?.conversion_rate?.rate_percentage !==
                undefined
                  ? `${data.summary_cards.conversion_rate.rate_percentage}%`
                  : "—"}
                {/* {data?.summary_cards?.conversion_rate?.paid_users !==
                  undefined &&
                  data?.summary_cards?.conversion_rate?.total_users !==
                    undefined && (
                    <span className="text-xs font-normal text-[#7D848D] ml-2">
                      ({data.summary_cards.conversion_rate.paid_users} /{" "}
                      {data.summary_cards.conversion_rate.total_users} users)
                    </span>
                  )} */}
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

      {/* ===================== FILTER ROW ===================== */}
      <section className="filter-row flex items-center flex-wrap gap-3.5">
        {/* Period Filter */}
        <div className="relative min-w-[170px]">
          <select
            id="filter-period"
            value={period}
            onChange={(e) => handlePeriodChange(e.target.value)}
            disabled={loading && !refreshing}
            className="w-full h-[38px] pl-3.5 pr-9 border border-[#e4e4df] rounded-[8px] bg-white text-[13px] text-[#4a4a4a] hover:border-[#cfcfca] focus:border-[#2D4A23] outline-none transition-colors cursor-pointer appearance-none shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
            style={{
              backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 12px center",
            }}
          >
            <option value="">All Periods</option>
            <option value="7_days">Last 7 Days</option>
            <option value="30_days">Last 30 Days</option>
            <option value="90_days">Last 90 Days</option>
          </select>
        </div>

        {/* Plan Filter */}
        <div className="relative min-w-[170px]">
          <select
            id="filter-plan"
            value={plan}
            onChange={(e) => handlePlanChange(e.target.value)}
            disabled={loading && !refreshing}
            className="w-full h-[38px] pl-3.5 pr-9 border border-[#e4e4df] rounded-[8px] bg-white text-[13px] text-[#4a4a4a] hover:border-[#cfcfca] focus:border-[#2D4A23] outline-none transition-colors cursor-pointer appearance-none shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
            style={{
              backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 12px center",
            }}
          >
            <option value="">All Plans</option>
            {availablePlans.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label.toLowerCase().includes("plan")
                  ? p.label
                  : `${p.label} Plan`}
              </option>
            ))}
          </select>
        </div>

        {/* Payment Method Filter */}
        <div className="relative min-w-[170px]">
          <select
            id="filter-payment-method"
            value={paymentType}
            onChange={(e) => handlePaymentTypeChange(e.target.value)}
            disabled={loading && !refreshing}
            className="w-full h-[38px] pl-3.5 pr-9 border border-[#e4e4df] rounded-[8px] bg-white text-[13px] text-[#4a4a4a] hover:border-[#cfcfca] focus:border-[#2D4A23] outline-none transition-colors cursor-pointer appearance-none shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
            style={{
              backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 12px center",
            }}
          >
            <option value="">All Payment Methods</option>
            {paymentMethods.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </div>

        {/* Reset button if filter active */}
        {(period || plan || paymentType) && (
          <button
            onClick={handleResetFilters}
            className="h-[38px] px-3.5 flex items-center gap-1.5 text-[12.5px] font-medium text-[#7D848D] hover:text-[#1f1f1f] bg-white border border-[#e4e4df] hover:border-[#cfcfca] rounded-[8px] transition-colors cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
            title="Reset filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start w-full min-w-0">
        <div className="xl:col-span-8 space-y-6 w-full min-w-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full min-w-0">
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
                      <div
                        key={`legend-${idx}`}
                        className="flex items-start gap-2.5"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 mt-1"
                          style={{ backgroundColor: s.color }}
                        />
                        <div>
                          <div className="text-[#1f1f1f] font-semibold text-[13px]">
                            {s.name}
                          </div>
                          <div className="text-[#7D848D] text-[11.5px]">
                            {s.percentage}% ({s.user_count.toLocaleString()}{" "}
                            users)
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-[14px] p-5 border border-[#ececec] shadow-[0_6px_20px_rgba(60,60,60,0.08),0_2px_6px_rgba(60,60,60,0.04)] flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#ececec] gap-2">
                <h3 className="text-[15px] font-semibold text-[#1f1f1f]">
                  {timelineTitle}
                </h3>
                {period && (
                  <span className="text-[11.5px] font-medium text-[#7D848D] bg-[#F7F8F9] border border-[#ececec] px-2 py-0.5 rounded-[6px]">
                    {period === "7_days"
                      ? "Last 7 Days"
                      : period === "30_days"
                        ? "Last 30 Days"
                        : period === "90"
                          ? "Last 90 Days"
                          : period}
                  </span>
                )}
              </div>

              {loading && !data ? (
                <div className="h-[220px] flex items-center justify-center">
                  <div className="w-10 h-10 border-4 border-[#f1f1ed] border-t-[#3a86d6] rounded-full animate-spin" />
                </div>
              ) : !monthChartData ? (
                <div className="h-[220px] flex items-center justify-center text-xs text-[#7D848D]">
                  No {timelineTitle.toLowerCase()} data available
                </div>
              ) : (
                <div className="w-full relative min-h-[220px] overflow-hidden">
                  <svg
                    width="100%"
                    height="220"
                    viewBox={`0 0 ${monthChartData.W} ${monthChartData.H}`}
                    preserveAspectRatio="none"
                    className="overflow-hidden block"
                  >
                    <defs>
                      <linearGradient
                        id="revenue_month_grad"
                        x1="0"
                        x2="0"
                        y1="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#5da3f5"
                          stopOpacity="0.45"
                        />
                        <stop
                          offset="100%"
                          stopColor="#5da3f5"
                          stopOpacity="0.0"
                        />
                      </linearGradient>
                    </defs>

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
                      <path
                        d={monthChartData.areaPath}
                        fill="url(#revenue_month_grad)"
                      />
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
                          {p.month}
                        </text>
                      ))}
                    </g>
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Transactions Table Section */}
          <section className="bg-white rounded-[14px] p-4 sm:p-5 border border-[#ececec] shadow-[0_6px_20px_rgba(60,60,60,0.08),0_2px_6px_rgba(60,60,60,0.04)] w-full min-w-0 overflow-hidden">
            <div className="flex flex-col gap-3 pb-3 mb-4 border-b border-[#ececec]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-[15px] font-semibold text-[#1f1f1f]">
                    Recent Revenue Transactions
                  </h3>
                </div>
                <span className="text-xs text-[#7D848D]">
                  Total {pagination.totalItems.toLocaleString()} records
                </span>
              </div>

              {/* Search & Revenue Type Filter controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                {/* Search Input with user email / name label */}
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 text-[#8e8e8e] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search by user email or name..."
                    className="w-full h-[38px] pl-9 pr-8 border border-[#e4e4df] rounded-[8px] bg-white text-[13px] text-[#4a4a4a] placeholder-[#8e8e8e] hover:border-[#cfcfca] focus:border-[#2D4A23] outline-none transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => handleSearchChange("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8e8e8e] hover:text-[#4a4a4a] p-0.5 cursor-pointer"
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Revenue Type select */}
                <div className="relative min-w-[170px]">
                  <select
                    id="filter-revenue-type"
                    value={revenueType}
                    onChange={(e) => handleRevenueTypeChange(e.target.value)}
                    disabled={loading && !refreshing}
                    className="w-full h-[38px] pl-3.5 pr-9 border border-[#e4e4df] rounded-[8px] bg-white text-[13px] text-[#4a4a4a] hover:border-[#cfcfca] focus:border-[#2D4A23] outline-none transition-colors cursor-pointer appearance-none shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
                    style={{
                      backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 12px center",
                    }}
                  >
                    <option value="">All Revenue Types</option>
                    <option value="subscription">Subscription</option>
                    <option value="sponsorship">Sponsorship</option>
                  </select>
                </div>

                {/* Reset Search / Type Filters */}
                {(searchQuery || revenueType) && (
                  <button
                    onClick={handleResetTransactionFilters}
                    className="h-[38px] px-3 flex items-center gap-1.5 text-[12px] font-medium text-[#7D848D] hover:text-[#1f1f1f] bg-white border border-[#e4e4df] hover:border-[#cfcfca] rounded-[8px] transition-colors cursor-pointer whitespace-nowrap shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
                    title="Clear transaction filters"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto w-full max-w-full">
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
                      <tr
                        key={`skel-${idx}`}
                        className="border-b border-[#f1f1ed]"
                      >
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
                        statusLower === "completed" ||
                        statusLower === "paid" ||
                        statusLower === "success";
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
                          <td className="py-3.5 px-3 text-[#555] text-center text-[12.5px]">
                            {txn.payment_method || "-"}
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
          </section>

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
        </div>

        {/* ================= RIGHT SECTION (xl:col-span-4) ================= */}
        <div className="xl:col-span-4 space-y-5 w-full min-w-0">
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
