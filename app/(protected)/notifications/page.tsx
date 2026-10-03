"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Send,
  Search,
  RotateCcw,
  Plus,
  Info,
  AlertTriangle,
  AlertCircle,
  Trophy,
  Tag,
  Check,
  Eye,
  Copy,
  Trash2,
  Loader2,
  Smartphone,
  Mail,
  Layers,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import Pagination from "@/components/admin/Pagination";
import TableActionMenu from "@/components/admin/TableActionMenu";
import NotificationFormModal from "./components/NotificationFormModal";
import NotificationDetailsModal from "./components/NotificationDetailsModal";
import DeleteNotificationModal from "./components/DeleteNotificationModal";
import {
  getAdminNotifications,
  getStates,
  NotificationItem,
  NotificationStats,
  NotificationVisualType,
  StateItem,
} from "@/lib/api";

const TYPE_CONFIG: Record<
  NotificationVisualType,
  {
    label: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    icon: React.ReactNode;
  }
> = {
  info: {
    label: "Info",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-700",
    badgeBorder: "border-blue-200",
    icon: <Info className="w-3.5 h-3.5 text-blue-600" />,
  },
  warning: {
    label: "Warning",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-800",
    badgeBorder: "border-amber-200",
    icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />,
  },
  offer: {
    label: "Offer",
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-700",
    badgeBorder: "border-emerald-200",
    icon: <Tag className="w-3.5 h-3.5 text-emerald-600" />,
  },
  congratulation: {
    label: "Congratulation",
    badgeBg: "bg-teal-50",
    badgeText: "text-teal-700",
    badgeBorder: "border-teal-200",
    icon: <Trophy className="w-3.5 h-3.5 text-teal-600" />,
  },
  error: {
    label: "Alert / Error",
    badgeBg: "bg-red-50",
    badgeText: "text-red-700",
    badgeBorder: "border-red-200",
    icon: <AlertCircle className="w-3.5 h-3.5 text-red-600" />,
  },
};

export default function NotificationsPage() {
  // Data States
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [states, setStates] = useState<StateItem[]>([]);

  // Pagination States
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filters State
  const [audienceFilter, setAudienceFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formModalMode, setFormModalMode] = useState<
    "create" | "edit" | "duplicate"
  >("create");
  const [formInitialData, setFormInitialData] =
    useState<NotificationItem | null>(null);
  const [formDefaultType, setFormDefaultType] =
    useState<NotificationVisualType>("info");

  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<NotificationItem | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] =
    useState<NotificationItem | null>(null);

  // Fetch States list for dropdowns
  useEffect(() => {
    let isMounted = true;
    getStates(1, 100)
      .then((res) => {
        if (!isMounted) return;
        const list = res?.data || res || [];
        if (Array.isArray(list)) {
          setStates(list);
        }
      })
      .catch((err) => {
        console.warn("Failed to load states:", err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch Notifications
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminNotifications({
        page,
        limit,
        target_audience: audienceFilter || undefined,
        send_type: channelFilter || undefined,
        status: statusFilter || undefined,
        state_id:
          audienceFilter === "state_wise" && stateFilter
            ? stateFilter
            : undefined,
        date_range: dateFilter || undefined,
        search: searchQuery.trim() || undefined,
      });

      if (res) {
        setNotifications(res.data || []);
        if (res.stats) {
          setStats(res.stats);
        }
        if (res.pagination) {
          setTotalPages(res.pagination.total_pages || 1);
          setTotalItems(res.pagination.total_items || 0);
        }
      }
    } catch (err: any) {
      console.error("Failed to fetch notifications:", err);
      toast.error(
        err.message || "Failed to load notifications. Please check connection.",
      );
    } finally {
      setLoading(false);
    }
  }, [
    page,
    limit,
    audienceFilter,
    stateFilter,
    channelFilter,
    statusFilter,
    dateFilter,
    searchQuery,
  ]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Handlers
  const handleResetFilters = () => {
    setAudienceFilter("");
    setStateFilter("");
    setChannelFilter("");
    setStatusFilter("");
    setDateFilter("");
    setSearchQuery("");
    setPage(1);
  };

  const handleOpenCreateModal = (type: NotificationVisualType = "info") => {
    setFormInitialData(null);
    setFormDefaultType(type);
    setFormModalMode("create");
    setFormModalOpen(true);
  };

  const handleOpenEditModal = (item: NotificationItem) => {
    setFormInitialData(item);
    setFormDefaultType(item.type || "info");
    setFormModalMode("edit");
    setFormModalOpen(true);
  };

  const handleOpenDuplicateModal = (item: NotificationItem) => {
    setFormInitialData(item);
    setFormDefaultType(item.type || "info");
    setFormModalMode("duplicate");
    setFormModalOpen(true);
  };

  const handleOpenViewModal = (item: NotificationItem) => {
    setSelectedNotification(item);
    setDetailsModalOpen(true);
  };

  const handleOpenDeleteModal = (item: NotificationItem) => {
    setNotificationToDelete(item);
    setDeleteModalOpen(true);
  };

  // State Name lookup map for quick label
  const stateMap = useMemo(() => {
    const map = new Map<string, string>();
    states.forEach((s) => {
      map.set(String(s.state_id), s.state_name);
    });
    return map;
  }, [states]);

  // Helper to format date
  const formatSentDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Create New Notification Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => handleOpenCreateModal("info")}
          className="h-10 px-[18px] bg-[#1f3d18] hover:bg-[#172e12] text-white border-none rounded-[6px] font-semibold text-[13px] inline-flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="w-[15px] h-[15px]"
          >
            <circle cx="12" cy="12" r="9" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          <span>Create new notification</span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="w-[15px] h-[15px]"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sent */}
        <div className="bg-white rounded-[14px] p-[20px_22px] border border-[#ececec] shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)] flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[13px] font-medium text-[#8a8a8a]">
              Total Sent
            </span>
            <span className="text-[#2d4a23]">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
              </svg>
            </span>
          </div>
          <div className="text-[28px] font-bold text-[#1f1f1f] my-1 leading-none">
            {stats?.total_sent != null ? stats.total_sent : 0}
          </div>
          <div className="text-[12px] text-[#9a9a9a]">This Month</div>
        </div>

        {/* Total Reach */}
        <div className="bg-white rounded-[14px] p-[20px_22px] border border-[#ececec] shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)] flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[13px] font-medium text-[#8a8a8a]">
              Total Reach
            </span>
            <span className="text-[#2d4a23]">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                <circle cx="9" cy="8" r="3.6" />
                <path d="M2 21c0-3.87 3.13-7 7-7s7 3.13 7 7H2z" />
                <circle cx="17" cy="9" r="2.6" />
                <path d="M14.5 14.7c.79-.45 1.7-.7 2.5-.7 2.76 0 5 2.24 5 5h-5.5c0-1.6-.78-3.07-2-4.3z" />
              </svg>
            </span>
          </div>
          <div className="text-[28px] font-bold text-[#1f1f1f] my-1 leading-none">
            {stats?.total_reach != null
              ? stats.total_reach.toLocaleString()
              : 0}
          </div>
          <div className="text-[12px] text-[#9a9a9a]">Users</div>
        </div>

        {/* Avg Open Rate */}
        <div className="bg-white rounded-[14px] p-[20px_22px] border border-[#ececec] shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)] flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[13px] font-medium text-[#8a8a8a]">
              Avg Open Rate
            </span>
            <span className="text-[#2d4a23]">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                <path d="M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v.4l-10 6-10-6V6zm0 2.8l10 6 10-6V18a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.8z" />
              </svg>
            </span>
          </div>
          <div className="text-[28px] font-bold text-[#1f1f1f] my-1 leading-none">
            {stats?.avg_open_rate || "0%"}
          </div>
          <div className="text-[12px] text-[#9a9a9a]">This Month</div>
        </div>

        {/* Avg Click Rate */}
        <div className="bg-white rounded-[14px] p-[20px_22px] border border-[#ececec] shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)] flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[13px] font-medium text-[#8a8a8a]">
              Avg Click Rate
            </span>
            <span className="text-[#2d4a23]">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                <path d="M9 3v9.5l2.5-2 2 4.5 2-1-2-4.5h3z" />
                <path
                  d="M9 3a6 6 0 1 0 4 10.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            </span>
          </div>
          <div className="text-[28px] font-bold text-[#1f1f1f] my-1 leading-none">
            {stats?.avg_click_rate || "0%"}
          </div>
          <div className="text-[12px] text-[#9a9a9a]">This Month</div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-white rounded-[14px] p-4 border border-[#ececec] shadow-[0_2px_8px_rgba(60,60,60,0.04)] flex flex-wrap items-center gap-3">
        {/* Filter 1: Target Audience */}
        <select
          value={audienceFilter}
          onChange={(e) => {
            const val = e.target.value;
            setAudienceFilter(val);
            if (val !== "state_wise") {
              setStateFilter("");
            }
            setPage(1);
          }}
          className="h-10 px-3 bg-white border border-[#e2e2dc] rounded-[8px] text-[13px] text-[#2c2c2c] focus:outline-none focus:border-[#014421] min-w-[150px]"
        >
          <option value="">All Audiences</option>
          <option value="all_users">All Users</option>
          <option value="premium">Premium Users</option>
          <option value="state_wise">State-wise</option>
        </select>

        {/* Filter 2: State Filter (Shown by default on list) */}
        <select
          value={stateFilter}
          onChange={(e) => {
            const val = e.target.value;
            setStateFilter(val);
            if (val) {
              // If user selects a state first, auto-switch audience to state_wise
              setAudienceFilter("state_wise");
            }
            setPage(1);
          }}
          className={`h-10 px-3 border rounded-[8px] text-[13px] focus:outline-none focus:border-[#014421] min-w-[170px] transition-colors ${
            audienceFilter === "state_wise" || stateFilter
              ? "bg-emerald-50/60 border-emerald-300 text-emerald-950 font-medium"
              : "bg-white border-[#e2e2dc] text-[#2c2c2c]"
          }`}
        >
          <option value="">All States</option>
          {states.map((st) => (
            <option key={st.state_id} value={st.state_id}>
              {st.state_name} ({st.state_code})
            </option>
          ))}
        </select>

        {/* Filter 3: Channel */}
        <select
          value={channelFilter}
          onChange={(e) => {
            setChannelFilter(e.target.value);
            setPage(1);
          }}
          className="h-10 px-3 bg-white border border-[#e2e2dc] rounded-[8px] text-[13px] text-[#2c2c2c] focus:outline-none focus:border-[#014421] min-w-[130px]"
        >
          <option value="">All Channels</option>
          <option value="both">Both</option>
          <option value="push">Push</option>
          <option value="email">Email</option>
        </select>

        {/* Filter 4: Status */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="h-10 px-3 bg-white border border-[#e2e2dc] rounded-[8px] text-[13px] text-[#2c2c2c] focus:outline-none focus:border-[#014421] min-w-[130px]"
        >
          <option value="">All Status</option>
          <option value="sent">Sent</option>
          <option value="draft">Draft</option>
        </select>

        {/* Filter 5: Date Range */}
        <select
          value={dateFilter}
          onChange={(e) => {
            setDateFilter(e.target.value);
            setPage(1);
          }}
          className="h-10 px-3 bg-white border border-[#e2e2dc] rounded-[8px] text-[13px] text-[#2c2c2c] focus:outline-none focus:border-[#014421] min-w-[140px]"
        >
          <option value="">All Dates</option>
          <option value="last_7_days">Last 7 Days</option>
          <option value="last_30_days">Last 30 Days</option>
          <option value="last_90_days">Last 90 Days</option>
        </select>

        {/* Spacer */}
        <div className="flex-1 min-w-[12px]" />

        {/* Search Field */}
        <div className="relative min-w-[220px] max-w-[320px] w-full sm:w-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search notifications..."
            className="w-full h-10 pl-9 pr-3.5 bg-white border border-[#e2e2dc] rounded-[8px] text-[13px] text-[#1f1f1f] placeholder:text-[#a0a09a] focus:outline-none focus:border-[#014421] transition-colors"
          />
          <Search className="w-4 h-4 text-[#8e8e88] absolute left-3 top-3 pointer-events-none" />
        </div>

        {/* Reset Button */}
        <button
          type="button"
          onClick={handleResetFilters}
          className="h-10 px-3.5 border border-[#e2e2dc] rounded-[8px] text-[13px] font-medium text-[#717171] hover:text-[#1f1f1f] hover:bg-[#f7f7f2] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Main Grid: Left Table & Performance, Right Guidance Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Section (Table + Performance) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Table Card */}
          <div className="bg-white rounded-[14px] border border-[#ececec] shadow-[0_6px_20px_rgba(60,60,60,0.06),0_2px_6px_rgba(60,60,60,0.04)] overflow-hidden">
            <div className="overflow-x-auto min-h-[360px]">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-[#f0f0ed] bg-[#fcfcfb] text-[#717171] font-medium">
                    <th className="py-3.5 px-4">Notification Title</th>
                    <th className="py-3.5 px-4">Audiences</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Channel</th>
                    <th className="py-3.5 px-4">Date Sent</th>
                    <th className="py-3.5 px-4">Open Rate</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f4f4f0]">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-20 text-center text-[#717171]"
                      >
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Loader2 className="w-6 h-6 animate-spin text-[#014421]" />
                          <span>Loading notifications...</span>
                        </div>
                      </td>
                    </tr>
                  ) : notifications.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-16 text-center text-[#8e8e88]"
                      >
                        <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                          <Send className="w-8 h-8 text-[#d0d0ca]" />
                          <p className="text-[14px] font-semibold text-[#2c2c2c]">
                            No notifications found
                          </p>
                          <p className="text-[12px] text-[#717171]">
                            No notifications match your chosen filters. Try
                            adjusting your search or broadcast a new message.
                          </p>
                          <button
                            type="button"
                            onClick={() => handleOpenCreateModal("info")}
                            className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[12.5px] font-medium text-white bg-[#014421] rounded-[7px]"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Create Notification</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    notifications.map((item) => {
                      const typeConf =
                        TYPE_CONFIG[item.type] || TYPE_CONFIG.info;
                      const stateName =
                        item.targetState?.state_name ||
                        (item.state_id ? stateMap.get(item.state_id) : null) ||
                        (item.target_state_id
                          ? stateMap.get(item.target_state_id)
                          : null);

                      const rateNum =
                        item.open_rate_number != null
                          ? item.open_rate_number
                          : parseFloat(item.open_rate || "0");

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-[#fafaf7] transition-colors group"
                        >
                          {/* Title & message preview */}
                          <td className="py-3.5 px-4 max-w-[240px]">
                            <div className="font-semibold text-[#1f1f1f] truncate">
                              {item.title}
                            </div>
                            <div className="text-[12px] text-[#717171] truncate mt-0.5">
                              {item.message}
                            </div>
                          </td>

                          {/* Audience */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {item.target_audience === "all_users" && (
                              <span className="inline-block px-[11px] py-[3px] rounded-[6px] text-[11.5px] font-medium border border-[#d8d0ee] bg-[#eeebf7] text-[#6b5ca5]">
                                All Users
                              </span>
                            )}
                            {item.target_audience === "premium" && (
                              <span className="inline-block px-[11px] py-[3px] rounded-[6px] text-[11.5px] font-medium border border-[#b8e0c2] bg-[#e8f5ec] text-[#34A853]">
                                Premium Users
                              </span>
                            )}
                            {item.target_audience === "state_wise" && (
                              <span className="inline-block px-[11px] py-[3px] rounded-[6px] text-[11.5px] font-medium border border-[#cfdcef] bg-[#eaf1fa] text-[#3b6bbf]">
                                {stateName
                                  ? stateName.startsWith("State:")
                                    ? stateName
                                    : `State: ${stateName}`
                                  : "State: California"}
                              </span>
                            )}
                          </td>

                          {/* Type */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded-full ${typeConf.badgeBg} ${typeConf.badgeText} border ${typeConf.badgeBorder}`}
                            >
                              {typeConf.icon}
                              {typeConf.label}
                            </span>
                          </td>

                          {/* Channel (send_type) */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {item.send_type === "push" ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11.5px] font-medium bg-[#f0f5ff] text-[#2952cc] border border-[#d4e2ff]">
                                <Smartphone className="w-3.5 h-3.5 text-[#2952cc]" />
                                Push
                              </span>
                            ) : item.send_type === "email" ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11.5px] font-medium bg-[#fff8eb] text-[#b45309] border border-[#fed7aa]">
                                <Mail className="w-3.5 h-3.5 text-[#b45309]" />
                                Email
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11.5px] font-medium bg-[#eef5ed] text-[#014421] border border-[#d6e6d3]">
                                <Layers className="w-3.5 h-3.5 text-[#014421]" />
                                Both
                              </span>
                            )}
                          </td>

                          {/* Date Sent */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-[#717171]">
                            {formatSentDate(item.created_at)}
                          </td>

                          {/* Open Rate with visual bar */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-[#1f1f1f] text-[12.5px]">
                                {item.open_rate || `${rateNum.toFixed(1)}%`}
                              </span>
                              <div className="w-14 h-1.5 bg-[#ebebe6] rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[#014421] rounded-full"
                                  style={{
                                    width: `${Math.min(100, Math.max(0, rateNum))}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {item.status === "draft" ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11.5px] font-medium rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                Draft
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11.5px] font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Sent
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            {item.status?.toLowerCase() === "draft" ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  title="Edit Draft"
                                  onClick={() => handleOpenEditModal(item)}
                                  className="w-8 h-8 rounded-[7px] flex items-center justify-center text-[#555] hover:text-[#014421] hover:bg-[#eef5ed] transition-colors cursor-pointer"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  title="Delete Draft"
                                  onClick={() => handleOpenDeleteModal(item)}
                                  className="w-8 h-8 rounded-[7px] flex items-center justify-center text-[#555] hover:text-[#d32f2f] hover:bg-[#fdecec] transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <TableActionMenu
                                align="right"
                                items={[
                                  {
                                    label: "View Details",
                                    icon: <Eye className="w-4 h-4" />,
                                    onClick: () => handleOpenViewModal(item),
                                  },
                                  {
                                    label: "Duplicate Notification",
                                    icon: <Copy className="w-4 h-4" />,
                                    onClick: () =>
                                      handleOpenDuplicateModal(item),
                                  },
                                ]}
                              />
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer with Pagination */}
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={limit}
              itemLabel="notifications"
              onPageChange={(p) => setPage(p)}
              className="px-5 py-3.5 bg-[#fcfcfb] border-t border-[#f0f0ed]"
            />
          </div>

          {/* Performance Overview Card */}
          <div className="bg-white rounded-[14px] p-6 border border-[#ececec] shadow-[0_6px_20px_rgba(60,60,60,0.06),0_2px_6px_rgba(60,60,60,0.04)]">
            <h3 className="text-[16px] font-bold text-[#1f1f1f] mb-5">
              Notification Performance overview
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Total Opened */}
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-[46px] h-[46px] rounded-[10px] bg-[#eef1ea] text-[#2d4a23] flex items-center justify-center flex-shrink-0">
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-[22px] h-[22px]"
                  >
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="text-[12.5px] text-[#8a8a8a] mb-0.5">
                    Total Opened
                  </div>
                  <div className="text-[20px] font-bold text-[#1f1f1f] leading-tight">
                    {stats?.performance_overview?.total_opened != null
                      ? stats.performance_overview.total_opened.toLocaleString()
                      : "11,466"}
                  </div>
                  <div className="text-[11.5px] text-[#9a9a9a] mt-1 truncate">
                    {stats?.performance_overview?.total_opened_percentage ||
                      "48.6% of total reach"}
                  </div>
                </div>
              </div>

              {/* Total Clicked */}
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-[46px] h-[46px] rounded-[10px] bg-[#eef1ea] text-[#2d4a23] flex items-center justify-center flex-shrink-0">
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-[22px] h-[22px]"
                  >
                    <path d="M7 2.5l12.2 11.7-5.6.5 3.05 6.2-2.7 1.3-3.05-6.2L7 20.3z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="text-[12.5px] text-[#8a8a8a] mb-0.5">
                    Total Clicked
                  </div>
                  <div className="text-[20px] font-bold text-[#1f1f1f] leading-tight">
                    {stats?.performance_overview?.total_clicked != null
                      ? stats.performance_overview.total_clicked.toLocaleString()
                      : "11,466"}
                  </div>
                  <div className="text-[11.5px] text-[#9a9a9a] mt-1 truncate">
                    {stats?.performance_overview?.total_clicked_percentage ||
                      "48.6% of total reach"}
                  </div>
                </div>
              </div>

              {/* Total Unopened */}
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-[46px] h-[46px] rounded-[10px] bg-[#eef1ea] text-[#2d4a23] flex items-center justify-center flex-shrink-0">
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-[22px] h-[22px]"
                  >
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="text-[12.5px] text-[#8a8a8a] mb-0.5">
                    Total Unopened
                  </div>
                  <div className="text-[20px] font-bold text-[#1f1f1f] leading-tight">
                    {stats?.performance_overview?.total_unopened != null
                      ? stats.performance_overview.total_unopened.toLocaleString()
                      : "12,094"}
                  </div>
                  <div className="text-[11.5px] text-[#9a9a9a] mt-1 truncate">
                    {stats?.performance_overview?.total_unopened_percentage ||
                      "51.4% of total reach"}
                  </div>
                </div>
              </div>

              {/* Bounced */}
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-[46px] h-[46px] rounded-[10px] bg-[#eef1ea] text-[#2d4a23] flex items-center justify-center flex-shrink-0">
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-[22px] h-[22px]"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 16h-2v-2h2v2zm0-4h-2V9h2v5z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="text-[12.5px] text-[#8a8a8a] mb-0.5">
                    Bounced
                  </div>
                  <div className="text-[20px] font-bold text-[#1f1f1f] leading-tight">
                    {stats?.performance_overview?.bounced != null
                      ? stats.performance_overview.bounced.toLocaleString()
                      : "0"}
                  </div>
                  <div className="text-[11.5px] text-[#9a9a9a] mt-1 truncate">
                    Failed deliveries
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section (Guide & Fast Actions) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: Send New Notifications */}
          <div className="bg-white rounded-[14px] p-5 border border-[#ececec] shadow-[0_6px_20px_rgba(60,60,60,0.06),0_2px_6px_rgba(60,60,60,0.04)]">
            <h3 className="text-[16px] font-bold text-[#1f1f1f] mb-4">
              Send New Notifications
            </h3>
            <div className="flex flex-col gap-4">
              <div
                onClick={() => handleOpenCreateModal("info")}
                className="flex items-center gap-3.5 p-1.5 -m-1.5 rounded-[10px] hover:bg-[#faf7ec] transition-colors cursor-pointer group"
              >
                <div className="w-[54px] h-[54px] rounded-[10px] bg-[#eef1ea] text-[#2d4a23] flex items-center justify-center flex-shrink-0">
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-[26px] h-[26px]"
                  >
                    <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="text-[14px] font-semibold text-[#1f1f1f] mb-0.5">
                    Push Notification
                  </div>
                  <div className="text-[12px] text-[#999] leading-[1.4]">
                    Send instant notifications to users on their devices
                  </div>
                </div>
              </div>

              <div
                onClick={() => handleOpenCreateModal("offer")}
                className="flex items-center gap-3.5 p-1.5 -m-1.5 rounded-[10px] hover:bg-[#faf7ec] transition-colors cursor-pointer group"
              >
                <div className="w-[54px] h-[54px] rounded-[10px] bg-[#eef1ea] text-[#2d4a23] flex items-center justify-center flex-shrink-0">
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-[26px] h-[26px]"
                  >
                    <path d="M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v.4l-10 6-10-6V6zm0 2.8l10 6 10-6V18a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.8z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="text-[14px] font-semibold text-[#1f1f1f] mb-0.5">
                    Email Notification
                  </div>
                  <div className="text-[12px] text-[#999] leading-[1.4]">
                    Send email announcement to users.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Why Send Notifications */}
          <div className="bg-white rounded-[14px] p-5 border border-[#ececec] shadow-[0_6px_20px_rgba(60,60,60,0.06),0_2px_6px_rgba(60,60,60,0.04)]">
            <h3 className="text-[15px] font-bold text-[#1f1f1f] mb-3">
              Why Send Notifications
            </h3>
            <div className="space-y-3 text-[12.5px]">
              <div>
                <div className="font-semibold text-[#1f1f1f]">
                  Renewal Reminders
                </div>
                <div className="text-[#717171] text-[12px] mt-0.5 leading-relaxed">
                  Reduce membership churn by notifying active users ahead of
                  renewal dates.
                </div>
              </div>

              <div>
                <div className="font-semibold text-[#1f1f1f]">
                  State Regulations & Updates
                </div>
                <div className="text-[#717171] text-[12px] mt-0.5 leading-relaxed">
                  Deliver crucial deer season dates, bag limits, and local
                  hunting rules.
                </div>
              </div>

              <div>
                <div className="font-semibold text-[#1f1f1f]">
                  Promotions & Tier Upgrades
                </div>
                <div className="text-[#717171] text-[12px] mt-0.5 leading-relaxed">
                  Incentivize standard users to convert into paid premium
                  subscribers.
                </div>
              </div>

              <div>
                <div className="font-semibold text-[#1f1f1f]">
                  Community Engagement
                </div>
                <div className="text-[#717171] text-[12px] mt-0.5 leading-relaxed">
                  Keep hunters and anglers informed with active platform
                  highlights.
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Best Practices */}
          <div className="bg-white rounded-[14px] p-5 border border-[#ececec] shadow-[0_6px_20px_rgba(60,60,60,0.06),0_2px_6px_rgba(60,60,60,0.04)]">
            <h3 className="text-[15px] font-bold text-[#1f1f1f] mb-3">
              Best Practices
            </h3>
            <div className="space-y-2.5 text-[12.5px]">
              <div className="flex items-center gap-2 text-[#2c2c2c]">
                <div className="w-4 h-4 rounded-full bg-[#014421]/15 text-[#014421] flex items-center justify-center flex-shrink-0">
                  <Check className="w-2.5 h-2.5" />
                </div>
                <span>Keep titles concise and engaging</span>
              </div>
              <div className="flex items-center gap-2 text-[#2c2c2c]">
                <div className="w-4 h-4 rounded-full bg-[#014421]/15 text-[#014421] flex items-center justify-center flex-shrink-0">
                  <Check className="w-2.5 h-2.5" />
                </div>
                <span>Target the specific state for local rules</span>
              </div>
              <div className="flex items-center gap-2 text-[#2c2c2c]">
                <div className="w-4 h-4 rounded-full bg-[#014421]/15 text-[#014421] flex items-center justify-center flex-shrink-0">
                  <Check className="w-2.5 h-2.5" />
                </div>
                <span>Choose appropriate visual types and badges</span>
              </div>
              <div className="flex items-center gap-2 text-[#2c2c2c]">
                <div className="w-4 h-4 rounded-full bg-[#014421]/15 text-[#014421] flex items-center justify-center flex-shrink-0">
                  <Check className="w-2.5 h-2.5" />
                </div>
                <span>Track open rates and audience metrics</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Modal (Create, Edit & Duplicate) */}
      <NotificationFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSuccess={fetchNotifications}
        initialData={formInitialData}
        mode={formModalMode}
        states={states}
        defaultType={formDefaultType}
      />

      {/* Details View Modal */}
      <NotificationDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        notification={selectedNotification}
        onDuplicate={(item) => handleOpenDuplicateModal(item)}
        onEdit={(item) => handleOpenEditModal(item)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteNotificationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onSuccess={fetchNotifications}
        notification={notificationToDelete}
      />
    </div>
  );
}
