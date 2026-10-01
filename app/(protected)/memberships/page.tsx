"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Eye,
  Edit2,
  Trash2,
  MoreVertical,
  Loader2,
  AlertCircle,
  X,
  CreditCard,
  Plus,
  UserMinus,
} from "lucide-react";
import { toast } from "sonner";
import {
  getMemberships,
  getMembershipById,
  deleteMembership,
  getAdminMembershipOverview,
  AdminMembershipOverviewData,
  API_URL,
} from "@/lib/api";
import MembershipFormModal, {
  MembershipItem,
  isBooleanFeature,
  toBooleanFeature,
} from "@/components/memberships/MembershipFormModal";

export default function MembershipsPage() {
  const [memberships, setMemberships] = useState<MembershipItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Admin Membership Overview State
  const [overview, setOverview] = useState<AdminMembershipOverviewData | null>(
    null,
  );
  const [overviewLoading, setOverviewLoading] = useState(true);

  // View Details Modal State
  const [viewModal, setViewModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<MembershipItem | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  // Add / Edit Plan Modal State
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [planToEdit, setPlanToEdit] = useState<MembershipItem | null>(null);

  // Delete Confirmation State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<MembershipItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Promo Codes Toggle State
  const [showAllPromos, setShowAllPromos] = useState(false);

  // Fetch Memberships List
  const fetchMembershipsList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMemberships(1, 100);
      let list: MembershipItem[] = [];

      if (res && res.data && Array.isArray(res.data)) {
        list = res.data;
      } else if (res && res.data && Array.isArray(res.data.memberships)) {
        list = res.data.memberships;
      } else if (res && res.data && Array.isArray(res.data.plans)) {
        list = res.data.plans;
      } else if (res && Array.isArray(res.plans)) {
        list = res.plans;
      } else if (Array.isArray(res)) {
        list = res;
      } else if (res && res.memberships && Array.isArray(res.memberships)) {
        list = res.memberships;
      }

      setMemberships(list);

      // Populate overview cards if summary_cards is provided in the response
      const sc = res?.summary_cards || res?.data?.summary_cards;
      if (sc) {
        setOverview((prev) => ({
          ...prev,
          summary: sc,
          summary_cards: sc,
          tier_breakdown:
            prev?.tier_breakdown && prev.tier_breakdown.length > 0
              ? prev.tier_breakdown
              : list.map((p) => ({
                  membership_id: p.id,
                  name: p.name,
                  user_count: Number(p.subscriber_count ?? p.totalUsers ?? 0),
                  percentage: p.subscriber_percentage,
                })),
        }));
        setOverviewLoading(false);
      }
    } catch (err: any) {
      console.error("Fetch memberships error:", err);
      toast.error(err?.message || "Failed to load membership plans");
      setMemberships([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Admin Membership Overview (KPI cards & tier breakdown)
  const fetchOverviewData = useCallback(async () => {
    setOverviewLoading(true);
    try {
      const res = await getAdminMembershipOverview();
      const data = res?.data || res;
      if (data) {
        const sc = (data as any)?.summary_cards;
        setOverview((prev) => ({
          ...prev,
          ...data,
          summary: sc || prev?.summary,
          summary_cards: sc || prev?.summary_cards,
        }));
      }
    } catch (err: any) {
      console.warn("Admin membership overview API error:", err);
      // Gracefully preserve any existing overview data populated by fetchMembershipsList
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembershipsList();
    fetchOverviewData();
  }, [fetchMembershipsList, fetchOverviewData]);

  // View Plan Details
  const handleViewPlan = async (plan: MembershipItem) => {
    setSelectedPlan(plan);
    setViewModal(true);
    setViewLoading(true);

    try {
      const res = await getMembershipById(plan.id);
      const data = res.membership || res.data || res;
      setSelectedPlan({
        ...plan,
        ...data,
        totalUsers:
          plan.subscriber_count ??
          plan.totalUsers ??
          (plan as any)?.total_users ??
          0,
      });
    } catch (err: any) {
      console.warn("Error fetching membership details:", err);
    } finally {
      setViewLoading(false);
    }
  };

  // Open Create Plan Modal
  const handleOpenCreate = () => {
    setPlanToEdit(null);
    setFormModalOpen(true);
  };

  // Open Edit Plan Modal
  const handleOpenEdit = (plan: MembershipItem) => {
    setPlanToEdit(plan);
    setFormModalOpen(true);
  };

  // Delete Plan Prompt
  const handleDeletePrompt = (plan: MembershipItem) => {
    setPlanToDelete(plan);
    setDeleteConfirmOpen(true);
  };

  // Confirm Delete Plan
  const handleConfirmDelete = async () => {
    if (!planToDelete) return;
    setDeleting(true);

    try {
      await deleteMembership(planToDelete.id);
      toast.success(`Plan "${planToDelete.name}" deleted successfully`);
      setDeleteConfirmOpen(false);
      setPlanToDelete(null);
      fetchMembershipsList();
      fetchOverviewData();
    } catch (err: any) {
      console.error("Delete membership error:", err);
      toast.error(err?.message || "Failed to delete membership plan");
    } finally {
      setDeleting(false);
    }
  };

  // Parse feature list helper
  const parsePlanFeatures = (featureData: any): Record<string, any> => {
    if (!featureData) return {};
    try {
      return typeof featureData === "string"
        ? JSON.parse(featureData)
        : featureData;
    } catch {
      return {};
    }
  };

  // Helper for trend display
  const renderTrendBadge = (
    weeklyChange?: number,
    trend?: string,
    formattedText?: string,
    isCurrency = false,
  ) => {
    const isDown =
      trend === "down" || (weeklyChange !== undefined && weeklyChange < 0);
    const isUp =
      trend === "up" || (weeklyChange !== undefined && weeklyChange > 0);
    const colorClass = isDown
      ? "text-[#e03131]"
      : isUp
        ? "text-[#34A853]"
        : "text-[#7D848D]";
    const arrow = isDown ? "↓ " : isUp ? "↑ " : "→ ";

    // Clean floating-point artifacts like -$130.00000000000003 this week
    let text = formattedText;
    if (text) {
      text = text.replace(/([+-]?\$?)(\d+\.\d{3,})/g, (_, prefix, num) => {
        return `${prefix}${Number(num).toFixed(2)}`;
      });
    } else if (weeklyChange !== undefined) {
      const numStr = Math.abs(weeklyChange).toFixed(isCurrency ? 2 : 0);
      text = `${isUp ? "+" : isDown ? "-" : ""}${isCurrency ? "$" : ""}${numStr} this week`;
    } else {
      text = "No change";
    }

    return (
      <div
        className={`text-[12px] font-medium flex items-center gap-1 ${colorClass}`}
      >
        <span>{arrow}</span>
        <span>{text}</span>
      </div>
    );
  };

  const PROMO_CODES = [
    {
      id: 1,
      code: "WELCOME20",
      discount: "20% OFF (Basic & Premium)",
      validUntil: "30 June 2026",
      used: 1243,
      max: 5000,
      status: "Active",
    },
    {
      id: 2,
      code: "PREMIUM50",
      discount: "50% OFF (Premium Only)",
      validUntil: "15 July 2026",
      used: 1243,
      max: 5000,
      status: "Active",
    },
    {
      id: 3,
      code: "BASIC10",
      discount: "10% OFF (Basic Plan)",
      validUntil: "31 May 2026",
      used: 2350,
      max: 5000,
      status: "Active",
    },
    {
      id: 4,
      code: "SUMMER25",
      discount: "25% OFF (All Plans)",
      validUntil: "01 Sep 2026",
      used: 560,
      max: 3000,
      status: "Active",
    },
    {
      id: 5,
      code: "BLACKFRI",
      discount: "70% OFF (Premium Only)",
      validUntil: "30 Nov 2026",
      used: 5000,
      max: 5000,
      status: "Inactive",
    },
  ];

  const getPlanIcon = (plan: MembershipItem) => {
    if (plan.image) {
      const src = plan.image.startsWith("http")
        ? plan.image
        : `${API_URL}${plan.image.startsWith("/") ? "" : "/"}${plan.image}`;
      return (
        <img
          src={src}
          alt={plan.name}
          className="w-7 h-7 object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      );
    }
    const lname = (plan.name || plan.level || "").toLowerCase();
    if (lname.includes("premium")) {
      return (
        <img
          src="/images/premium-icon.png"
          alt="Premium"
          className="w-7 h-7 object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/images/member_leaf.png";
          }}
        />
      );
    }
    if (lname.includes("basic")) {
      return (
        <svg
          viewBox="0 0 24 24"
          fill="#d4c79a"
          stroke="#a89260"
          strokeWidth="1.5"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    }
    return (
      <img
        src="/images/member_leaf.png"
        alt="Free"
        className="w-7 h-7 object-contain"
      />
    );
  };

  return (
    <div className="space-y-6">
      {/* ===================== SUMMARY KPI METRIC CARDS ===================== */}
      {(() => {
        const summary = (overview?.summary_cards || overview?.summary) as any;
        const totalSubscribers = summary?.total_subscribers;
        const mrr = summary?.monthly_recurring_revenue || summary?.mrr;
        const arr = summary?.annual_recurring_revenue || summary?.arr;
        const premiumMembers = summary?.premium_members;
        const churnRate = summary?.churn_rate;

        return (
          <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* 1. Total Subscribers */}
            <div className="bg-white rounded-[14px] p-5 shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)] border border-[#ececec]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#7D848D] text-[12.5px] font-medium">
                  Total Subscribers
                </span>
                <span className="w-8 h-8 rounded-full bg-[#f1f5ee] flex items-center justify-center text-[#2d4a23]">
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-4 h-4"
                  >
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                  </svg>
                </span>
              </div>
              <div className="text-[24px] font-bold text-[#1f1f1f] mb-1">
                {overviewLoading && !summary
                  ? "..."
                  : (totalSubscribers?.count ?? 0).toLocaleString()}
              </div>
              {renderTrendBadge(
                totalSubscribers?.weekly_change,
                totalSubscribers?.trend,
                totalSubscribers?.formatted_text,
              )}
            </div>

            {/* 2. Monthly Recurring Revenue (MRR) */}
            <div className="bg-white rounded-[14px] p-5 shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)] border border-[#ececec]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#7D848D] text-[12.5px] font-medium">
                  Monthly Recurring Revenue
                </span>
                <span className="w-8 h-8 rounded-full bg-[#eef7ee] flex items-center justify-center text-[#1e6b34]">
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-4 h-4"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.39 2.83-3.12 3.16z" />
                  </svg>
                </span>
              </div>
              <div className="text-[24px] font-bold text-[#1f1f1f] mb-1">
                {overviewLoading && !summary
                  ? "..."
                  : `$${Number(mrr?.count ?? 0).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`}
              </div>
              {renderTrendBadge(
                mrr?.weekly_change,
                mrr?.trend,
                mrr?.formatted_text,
                true,
              )}
            </div>

            {/* 3. Annual Recurring Revenue (ARR) */}
            <div className="bg-white rounded-[14px] p-5 shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)] border border-[#ececec]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#7D848D] text-[12.5px] font-medium">
                  Annual Recurring Revenue
                </span>
                <span className="w-8 h-8 rounded-full bg-[#eef7ee] flex items-center justify-center text-[#1e6b34]">
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-4 h-4"
                  >
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </span>
              </div>
              <div className="text-[24px] font-bold text-[#1f1f1f] mb-1">
                {overviewLoading && !summary
                  ? "..."
                  : `$${Number(arr?.count ?? 0).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`}
              </div>
              {renderTrendBadge(
                arr?.weekly_change,
                arr?.trend,
                arr?.formatted_text,
                true,
              )}
            </div>

            {/* 4. Premium Members */}
            <div className="bg-white rounded-[14px] p-5 shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)] border border-[#ececec]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#7D848D] text-[12.5px] font-medium">
                  Premium Members
                </span>
                <span className="w-8 h-8 rounded-full bg-[#fdf5e6] flex items-center justify-center">
                  <img
                    src="/images/premium-member.png"
                    alt=""
                    className="w-5 h-5 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </span>
              </div>
              <div className="text-[24px] font-bold text-[#1f1f1f] mb-1">
                {overviewLoading && !summary
                  ? "..."
                  : (premiumMembers?.count ?? 0).toLocaleString()}
              </div>
              {renderTrendBadge(
                premiumMembers?.weekly_change,
                premiumMembers?.trend,
                premiumMembers?.formatted_text,
              )}
            </div>

            {/* 5. Churn Rate */}
            <div className="bg-white rounded-[14px] p-5 shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)] border border-[#ececec]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#7D848D] text-[12.5px] font-medium">
                  Churn Rate
                </span>
                <span className="w-8 h-8 rounded-full bg-[#fbebeb] flex items-center justify-center text-[#e03131]">
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-4 h-4"
                  >
                    <path d="M16 18l2.29-2.29-4.88-4.88-4 4L2 7.41 3.41 6l6 6 4-4 6.3 6.29L22 12v6h-6z" />
                  </svg>
                </span>
              </div>
              <div className="text-[24px] font-bold text-[#1f1f1f] mb-1">
                {overviewLoading && !summary
                  ? "..."
                  : (churnRate?.count ?? 0).toLocaleString()}
              </div>
              {renderTrendBadge(
                churnRate?.weekly_change,
                churnRate?.trend,
                churnRate?.formatted_text,
              )}
            </div>
          </section>
        );
      })()}

      {/* ===================== MEMBERSHIP PLANS LIST ===================== */}
      <section className="bg-white rounded-[14px] p-6 sm:p-7 shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)] border border-[#ececec]">
        {/* Card Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-[22px] font-bold text-[#1f1f1f] tracking-tight">
              Membership Plans
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Manage subscriptions, pricing tiers, feature toggles, and user
              limits
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="h-[38px] px-4 rounded-[8px] bg-[#0E3E27] hover:bg-[#092c1b] text-white text-[13px] font-medium transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Membership Plan</span>
          </button>
        </div>

        {/* Plans Table (6 columns matching HTML) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#ececec]">
                <th className="py-3.5 px-3 text-black font-medium text-[13.5px]">
                  Plan Name
                </th>
                <th className="py-3.5 px-3 text-black font-medium text-[13.5px]">
                  Price
                </th>
                <th className="py-3.5 px-3 text-black font-medium text-[13.5px]">
                  Featured Included
                </th>
                <th className="py-3.5 px-3 text-black font-medium text-[13.5px]">
                  Subscriber
                </th>
                <th className="py-3.5 px-3 text-black font-medium text-[13.5px]">
                  Revenue Generated
                </th>
                <th className="py-3.5 px-3 text-right text-black font-medium text-[13.5px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f1ed] text-[13.5px]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-[#7D848D]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-[#1f3d2a]" />
                      <span className="text-[13px] font-medium text-[#7D848D]">
                        Loading membership plans...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : memberships.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-[#7D848D]">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <AlertCircle className="w-8 h-8 text-gray-300" />
                      <p className="text-[13.5px] font-semibold text-[#1f1f1f]">
                        No membership plans found
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                memberships.map((plan) => {
                  const features = parsePlanFeatures(plan.feature);
                  const featureEntries = Object.entries(features);
                  const monthlyPriceNum = Number(
                    plan.monthly_price ?? plan.price_usd ?? 0,
                  );
                  const yearlyPriceNum = Number(plan.yearly_price ?? 0);
                  const isFree = monthlyPriceNum === 0 && yearlyPriceNum === 0;

                  const subscriberCount = Number(
                    plan.subscriber_count ?? plan.totalUsers ?? 0,
                  );
                  const subscriberPct = Number(plan.subscriber_percentage ?? 0);

                  const revenueNum = Number(plan.revenue_generated ?? 0);
                  const revenuePct = Number(plan.revenue_percentage ?? 0);

                  return (
                    <tr
                      key={plan.id}
                      className="hover:bg-[#fbfbf8] transition-colors"
                    >
                      {/* 1. Plan Name */}
                      <td className="py-5 px-3 align-top">
                        <div className="flex items-start gap-3.5">
                          {/* Plan Icon */}
                          <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                            {getPlanIcon(plan)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2.5 mb-1">
                              <span className="text-[16px] font-semibold text-[#1f1f1f] capitalize">
                                {plan.name}
                              </span>
                              <span className="inline-flex items-center gap-1.5 text-[13px] text-[#34A853] font-medium">
                                <span className="w-[7px] h-[7px] rounded-full bg-[#2f9e44]" />
                                Active
                              </span>
                            </div>
                            <div className="text-[13px] text-[#888] font-normal max-w-xs">
                              {plan.description ||
                                (plan.name?.toLowerCase() === "premium"
                                  ? "For professionals and teams"
                                  : plan.name?.toLowerCase() === "basic"
                                    ? "Ideal for growing users"
                                    : "Best for individuals getting started")}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Price */}
                      <td className="py-5 px-3 align-top">
                        <div className="text-[18px] font-normal text-[#1f1f1f] mb-1">
                          {isFree ? "$0" : `$${monthlyPriceNum.toFixed(2)}`}
                        </div>
                        <div className="text-[13px] text-[#888]">
                          {isFree
                            ? "Forever"
                            : plan.yearly_price && yearlyPriceNum > 0
                              ? `$${yearlyPriceNum.toFixed(2)}/yr`
                              : "Month"}
                        </div>
                      </td>

                      {/* 3. Features Included */}
                      <td className="py-5 px-3 align-top">
                        {featureEntries.length > 0 ? (
                          <div className="flex flex-col gap-2 max-w-sm">
                            {featureEntries
                              .slice(0, 4)
                              .map(([key, val], idx) => {
                                const isBool = isBooleanFeature(val);
                                const boolVal = toBooleanFeature(val);
                                return (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-2 text-[11px] text-[#888]"
                                  >
                                    <span
                                      className={`flex-shrink-0 ${
                                        isBool && !boolVal
                                          ? "text-gray-300"
                                          : "text-[#4a6b3f]"
                                      }`}
                                    >
                                      <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        className="w-3.5 h-3.5"
                                      >
                                        <polyline points="20 6 9 17 4 12" />
                                      </svg>
                                    </span>
                                    <span className="capitalize">
                                      {key.replace(/_/g, " ")}
                                      {!isBool && `: ${String(val)}`}
                                      {isBool && !boolVal && " (Disabled)"}
                                    </span>
                                  </div>
                                );
                              })}
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2 text-[11px] text-[#888]">
                            <div className="flex items-center gap-2">
                              <span className="text-[#4a6b3f]">
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  className="w-3.5 h-3.5"
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </span>
                              Access to basic resources
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[#4a6b3f]">
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  className="w-3.5 h-3.5"
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </span>
                              Community posts access
                            </div>
                          </div>
                        )}
                      </td>

                      {/* 4. Subscriber (Count UI + in % as per HTML) */}
                      <td className="py-5 px-3 align-top">
                        <div className="text-[18px] font-normal text-[#1f1f1f] mb-1">
                          {subscriberCount.toLocaleString()}
                        </div>
                        <div className="text-[13px] text-[#888]">
                          ({subscriberPct.toFixed(1)}%)
                        </div>
                      </td>

                      {/* 5. Revenue Generated (matching HTML rev-wrap) */}
                      <td className="py-5 px-3 align-top">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-[18px] font-normal text-[#1f1f1f] mb-1">
                              $
                              {revenueNum.toLocaleString("en-US", {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                            <div className="text-[13px] text-[#888]">
                              {revenuePct}% of total
                            </div>
                          </div>
                          {revenueNum > 0 && (
                            <div className="flex items-end gap-[3px] h-7 pt-1">
                              <span
                                className="w-[6px] bg-[#4a6b3f] rounded-[1px]"
                                style={{ height: "40%" }}
                              />
                              <span
                                className="w-[6px] bg-[#4a6b3f] rounded-[1px]"
                                style={{ height: "70%" }}
                              />
                              <span
                                className="w-[6px] bg-[#4a6b3f] rounded-[1px]"
                                style={{ height: "100%" }}
                              />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 6. Actions */}
                      <td className="py-5 px-3 text-right align-top">
                        <div className="inline-flex items-center gap-2 justify-end">
                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEdit(plan)}
                            title="Edit Plan"
                            className="w-[30px] h-[30px] border border-[#e2e2dc] rounded-[7px] bg-white text-[#7D848D] hover:bg-[#f7f7f2] hover:text-[#1f1f1f] hover:border-[#d4d4cd] inline-flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* View */}
                          <button
                            onClick={() => handleViewPlan(plan)}
                            title="View Details"
                            className="w-[30px] h-[30px] border border-[#e2e2dc] rounded-[7px] bg-white text-[#7D848D] hover:bg-[#f7f7f2] hover:text-[#1f1f1f] hover:border-[#d4d4cd] inline-flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeletePrompt(plan)}
                            title="Delete Plan"
                            className="w-[30px] h-[30px] border border-[#e2e2dc] rounded-[7px] bg-white text-[#7D848D] hover:bg-[#f7f7f2] hover:text-red-600 hover:border-red-200 inline-flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ===================== BOTTOM ROW: PROMO CODES + PLAN DISTRIBUTION ===================== */}
      <section className="grid grid-cols-1 lg:grid-cols-[1.8fr_1fr] gap-5">
        {/* Active Promo Codes */}
        {/* <div className="bg-white rounded-[14px] p-5 shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)] border border-[#ececec]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-semibold text-[#1f1f1f]">
              Active Promo Codes
            </h3>
            <button
              onClick={() => setShowAllPromos(!showAllPromos)}
              className="border border-[#e4e4df] bg-white rounded-full px-3.5 py-1.5 text-[12.5px] text-[#444] hover:bg-[#f7f7f4] transition-colors cursor-pointer"
            >
              {showAllPromos ? "Show Less" : "View all Promo Codes"}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] border-collapse">
              <thead>
                <tr className="border-b border-[#ececec]">
                  <th className="py-2.5 px-2 text-[#7D848D] font-medium text-[12.5px]">
                    Promo Code
                  </th>
                  <th className="py-2.5 px-2 text-[#7D848D] font-medium text-[12.5px]">
                    Discount
                  </th>
                  <th className="py-2.5 px-2 text-[#7D848D] font-medium text-[12.5px]">
                    Valid Until Usage
                  </th>
                  <th className="py-2.5 px-2 text-[#7D848D] font-medium text-[12.5px]">
                    Usage
                  </th>
                  <th className="py-2.5 px-2 text-[#7D848D] font-medium text-[12.5px]">
                    Status
                  </th>
                  <th className="py-2.5 px-2 text-right text-[#7D848D] font-medium text-[12.5px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f1ed]">
                {(showAllPromos ? PROMO_CODES : PROMO_CODES.slice(0, 4)).map(
                  (promo) => (
                    <tr
                      key={promo.id}
                      className="hover:bg-[#fbfbf8] transition-colors"
                    >
                      <td className="py-3 px-2 font-semibold text-[#1f1f1f] tracking-wide">
                        {promo.code}
                      </td>
                      <td className="py-3 px-2 text-[#2c2c2c]">{promo.discount}</td>
                      <td className="py-3 px-2 text-[#666]">
                        {promo.validUntil}
                      </td>
                      <td className="py-3 px-2 text-[#2c2c2c]">
                        {promo.used.toLocaleString()} /{" "}
                        {promo.max.toLocaleString()}
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[12.5px] font-medium ${
                            promo.status === "Active"
                              ? "text-[#34A853]"
                              : "text-[#7D848D]"
                          }`}
                        >
                          <span
                            className={`w-[7px] h-[7px] rounded-full ${
                              promo.status === "Active"
                                ? "bg-[#2f9e44]"
                                : "bg-[#a8a8a8]"
                            }`}
                          />
                          {promo.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            title="Edit"
                            onClick={() =>
                              toast.info(`Edit promo code ${promo.code}`)
                            }
                            className="w-[28px] h-[24px] border border-[#e4e4df] rounded-[5px] bg-white text-[#777] hover:bg-[#f7f7f4] inline-flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            title="Delete"
                            onClick={() =>
                              toast.info(`Delete promo code ${promo.code}`)
                            }
                            className="w-[28px] h-[24px] border border-[#e4e4df] rounded-[5px] bg-white text-[#777] hover:bg-[#f7f7f4] hover:text-red-600 inline-flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </div> */}

        {/* Plan Distribution (Donut Chart for user % and count UI matching HTML) */}
        <div className="bg-white rounded-[14px] p-5 shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)] border border-[#ececec] flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[15px] font-semibold text-[#1f1f1f]">
              Plan Distribution
            </h3>
          </div>
          {(() => {
            const summary = (overview?.summary_cards ||
              overview?.summary) as any;
            const totalUsers =
              summary?.total_subscribers?.count ??
              memberships.reduce(
                (acc, m) =>
                  acc + Number(m.subscriber_count ?? m.totalUsers ?? 0),
                0,
              );

            const palette: Record<string, string> = {
              free: "#3a5230",
              basic: "#d4c79a",
              premium: "#5da3f5",
            };
            const fallbackColors = [
              "#3a5230",
              "#d4c79a",
              "#5da3f5",
              "#8b5cf6",
              "#ec4899",
              "#f59e0b",
            ];

            const safeTotal = totalUsers > 0 ? totalUsers : 1;
            let cumPct = 0;

            const segs = memberships.map((p, idx) => {
              const count = Number(p.subscriber_count ?? p.totalUsers ?? 0);
              const pct =
                p.subscriber_percentage !== undefined
                  ? Number(p.subscriber_percentage)
                  : (count / safeTotal) * 100;
              const nameKey = (p.name || p.level || "").toLowerCase();
              const color =
                palette[nameKey] || fallbackColors[idx % fallbackColors.length];
              const offset = cumPct;
              const midPct = cumPct + pct / 2;
              cumPct += pct;

              const angle = (midPct / 100) * 2 * Math.PI - Math.PI / 2;
              const labelR = 70;
              const lx = 100 + labelR * Math.cos(angle);
              const ly = 100 + labelR * Math.sin(angle);

              return {
                label: p.name,
                count,
                pct,
                color,
                offset,
                lx,
                ly,
              };
            });

            return (
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-full flex items-center justify-center py-2">
                  <svg
                    width="260"
                    height="260"
                    viewBox="0 0 200 200"
                    className="max-w-full h-auto"
                  >
                    <g transform="rotate(-90 100 100)">
                      {segs.map((s, i) => (
                        <circle
                          key={i}
                          cx="100"
                          cy="100"
                          r="70"
                          fill="none"
                          stroke={s.color}
                          strokeWidth="34"
                          pathLength="100"
                          strokeDasharray={`${s.pct.toFixed(2)} ${(100 - s.pct).toFixed(2)}`}
                          strokeDashoffset={(-s.offset).toFixed(2)}
                        />
                      ))}
                    </g>
                    {/* Center count & label */}
                    <text
                      x="100"
                      y="96"
                      textAnchor="middle"
                      fontSize="22"
                      fontWeight="700"
                      fill="#1f1f1f"
                      fontFamily="Inter, Segoe UI, sans-serif"
                    >
                      {totalUsers.toLocaleString()}
                    </text>
                    <text
                      x="100"
                      y="116"
                      textAnchor="middle"
                      fontSize="10.5"
                      fill="#888"
                      fontFamily="Inter, Segoe UI, sans-serif"
                    >
                      Total Users
                    </text>
                    {/* Percent labels on donut segments */}
                    {segs.map((s, i) =>
                      s.pct >= 6 ? (
                        <text
                          key={i}
                          x={s.lx.toFixed(1)}
                          y={(s.ly + 4).toFixed(1)}
                          textAnchor="middle"
                          fontSize="11"
                          fontWeight="700"
                          fill="#ffffff"
                          fontFamily="Inter, Segoe UI, sans-serif"
                        >
                          {s.pct.toFixed(1)}%
                        </text>
                      ) : null,
                    )}
                  </svg>
                </div>

                {/* Legend Chips with User Count and Percentage */}
                <div className="w-full flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-2 pt-3 border-t border-[#f0f0ec]">
                  {segs.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 text-xs text-[#555]"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="font-medium text-[#1f1f1f] capitalize">
                        {s.label}:
                      </span>
                      <span className="font-bold text-[#1f1f1f]">
                        {s.count.toLocaleString()}
                      </span>
                      <span className="text-[#888]">({s.pct.toFixed(1)}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* ===================== VIEW DETAILS MODAL ===================== */}
      {viewModal && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0E3E27] flex items-center justify-center font-bold text-lg">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {selectedPlan.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Tier Details & Configured Features
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-5 space-y-6">
              {/* Description */}
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Description
                </span>
                <p className="text-xs text-gray-700 leading-relaxed">
                  {selectedPlan.description || "No description provided."}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-gray-50/70 border border-gray-100 text-xs">
                <div>
                  <span className="text-gray-400 block font-medium">Price</span>
                  <span className="font-bold text-sm text-[#0E3E27]">
                    {Number(
                      selectedPlan.monthly_price ?? selectedPlan.price_usd ?? 0,
                    ) === 0 && Number(selectedPlan.yearly_price ?? 0) === 0
                      ? "Free"
                      : selectedPlan.monthly_price !== undefined
                        ? `$${Number(selectedPlan.monthly_price).toFixed(2)}/mo`
                        : `$${selectedPlan.price_usd}`}
                  </span>
                  {Number(selectedPlan.yearly_price ?? 0) > 0 && (
                    <span className="block text-[11px] text-[#7D848D]">
                      ${Number(selectedPlan.yearly_price).toFixed(2)}/yr
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">
                    Duration
                  </span>
                  <span className="font-bold text-sm text-gray-800">
                    {selectedPlan.duration_days
                      ? `${selectedPlan.duration_days} Days`
                      : "Forever"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">
                    Subscribers
                  </span>
                  <span className="font-bold text-sm text-indigo-700">
                    {selectedPlan.subscriber_count !== undefined
                      ? Number(selectedPlan.subscriber_count).toLocaleString()
                      : selectedPlan.totalUsers || 0}
                  </span>
                  {selectedPlan.subscriber_percentage !== undefined && (
                    <span className="block text-[11px] text-[#7D848D]">
                      {selectedPlan.subscriber_percentage}% of total
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">
                    Revenue
                  </span>
                  <span className="font-bold text-sm text-[#0E3E27]">
                    {selectedPlan.revenue_generated !== undefined
                      ? `$${Number(selectedPlan.revenue_generated).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : "—"}
                  </span>
                  {selectedPlan.revenue_percentage !== undefined && (
                    <span className="block text-[11px] text-[#7D848D]">
                      {selectedPlan.revenue_percentage}% share
                    </span>
                  )}
                </div>
              </div>

              {/* Quotas & Privileges Grid */}
              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">
                  Quotas & Privileges
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-gray-400 block font-medium text-[11px]">
                      Licenses Limit
                    </span>
                    <span className="font-bold text-xs text-gray-800">
                      {selectedPlan.is_licenses_unlimited === true ||
                      selectedPlan.is_licenses_unlimited === "true"
                        ? "Unlimited"
                        : `${selectedPlan.licenses_limit ?? "1"} licenses`}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-gray-400 block font-medium text-[11px]">
                      Friends Limit
                    </span>
                    <span className="font-bold text-xs text-gray-800">
                      {selectedPlan.is_friends_unlimited === true ||
                      selectedPlan.is_friends_unlimited === "true"
                        ? "Unlimited"
                        : `${selectedPlan.friends_limit ?? "6"} friends`}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-gray-400 block font-medium text-[11px]">
                      Gallery Limit
                    </span>
                    <span className="font-bold text-xs text-gray-800">
                      {selectedPlan.gallery_limit ?? "20"} photos
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-gray-400 block font-medium text-[11px]">
                      License Reminders
                    </span>
                    <span className="font-bold text-xs text-gray-800">
                      {selectedPlan.license_reminders === true ||
                      selectedPlan.license_reminders === "true"
                        ? "Enabled"
                        : "Disabled"}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-gray-400 block font-medium text-[11px]">
                      Sponsorship Free
                    </span>
                    <span className="font-bold text-xs text-gray-800">
                      {selectedPlan.is_sponsorship_free === true ||
                      selectedPlan.is_sponsorship_free === "true"
                        ? "Yes"
                        : "No"}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-gray-400 block font-medium text-[11px]">
                      Map Activity
                    </span>
                    <span className="font-bold text-xs text-gray-800">
                      {selectedPlan.map_activity === true ||
                      selectedPlan.map_activity === "true"
                        ? "Enabled"
                        : "Disabled"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Features List */}
              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
                  Privileges & Included Features
                </h4>
                {(() => {
                  const feats = parsePlanFeatures(selectedPlan.feature);
                  const entries = Object.entries(feats);

                  if (entries.length === 0) {
                    return (
                      <p className="text-xs text-gray-400 italic">
                        No custom features set for this tier.
                      </p>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {entries.map(([key, val], idx) => {
                        const isBool = isBooleanFeature(val);
                        const boolVal = toBooleanFeature(val);
                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs"
                          >
                            <span className="font-medium text-gray-700 capitalize">
                              {key.replace(/_/g, " ")}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                isBool
                                  ? boolVal
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-red-100 text-red-700"
                                  : "bg-blue-50 text-blue-700"
                              }`}
                            >
                              {isBool ? (boolVal ? "YES" : "NO") : String(val)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => setViewModal(false)}
                className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700 transition-all cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setViewModal(false);
                  handleOpenEdit(selectedPlan);
                }}
                className="px-5 py-2 rounded-xl bg-[#0E3E27] hover:bg-[#092c1b] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== CREATE / EDIT MEMBERSHIP MODAL ===================== */}
      <MembershipFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setPlanToEdit(null);
        }}
        onSuccess={fetchMembershipsList}
        initialData={planToEdit}
      />

      {/* ===================== DELETE CONFIRMATION DIALOG ===================== */}
      {deleteConfirmOpen && planToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Delete Membership Plan
                </h3>
                <p className="text-xs text-gray-500">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed mb-6">
              Are you sure you want to permanently delete the{" "}
              <strong className="text-gray-900">"{planToDelete.name}"</strong>{" "}
              membership tier? Users currently assigned to this plan might lose
              associated privileges.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                disabled={deleting}
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Yes, Delete Plan</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
