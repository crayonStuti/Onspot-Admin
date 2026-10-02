"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import {
  Search,
  Download,
  Eye,
  Share2,
  MoreVertical,
  Loader2,
  AlertCircle,
  X,
  MapPin as MapPinIcon,
  Tag,
  Globe,
  Compass,
  Users,
  Filter,
  Calendar,
  ChevronDown,
  Check,
  ExternalLink,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import Pagination from "@/components/admin/Pagination";
import {
  getMapPins,
  getMapPinTags,
  getStates,
  getUsers,
  deleteMapPin,
  MapPinItem,
  AdminPinSummary,
  ActivityOverviewPoint,
  TopStateByPins,
  TopTagTypesData,
  API_URL,
} from "@/lib/api";
import EditPinModal from "@/components/gps/EditPinModal";

const TAG_TYPE_COLORS = [
  "#2F80ED", // Vibrant Blue (e.g. Fishing Spot)
  "#1E232A", // Dark Charcoal (e.g. Hunting)
  "#47664B", // Forest Olive Green (e.g. Scouting)
  "#CDBE92", // Warm Beige / Tan (e.g. Boat Launch)
  "#8E959E", // Neutral Grey (e.g. Other)
  "#F59E0B", // Amber
  "#8B5CF6", // Purple
  "#EC4899", // Rose
  "#14B8A6", // Teal
  "#E11D48", // Crimson
];

const TAG_TYPE_COLOR_MAP: Record<string, string> = {
  fishing: "#2F80ED",
  "fishing spot": "#2F80ED",
  hunting: "#1E232A",
  scouting: "#47664B",
  "boat launch": "#CDBE92",
  other: "#8E959E",
  others: "#8E959E",
};

export default function GPSActivityPage() {
  // Map Pins state
  const [mapPins, setMapPins] = useState<MapPinItem[]>([]);
  const [summary, setSummary] = useState<AdminPinSummary | null>(null);
  const [activityOverview, setActivityOverview] = useState<
    ActivityOverviewPoint[]
  >([]);
  const [topStates, setTopStates] = useState<TopStateByPins[]>([]);
  const [topTagTypes, setTopTagTypes] = useState<TopTagTypesData | null>(null);
  const [hoveredTagIndex, setHoveredTagIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedTagType, setSelectedTagType] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedVisibility, setSelectedVisibility] = useState("");
  const [selectedTimeframe, setSelectedTimeframe] = useState("all");
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Dropdown options lists
  const [statesList, setStatesList] = useState<any[]>([]);
  const [tagTypesList, setTagTypesList] = useState<
    { id: string; name: string }[]
  >([]);
  const [usersList, setUsersList] = useState<any[]>([]);

  // View Details Modal state
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedPin, setSelectedPin] = useState<MapPinItem | null>(null);

  // Edit & Delete Pin Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [pinToEdit, setPinToEdit] = useState<MapPinItem | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pinToDelete, setPinToDelete] = useState<MapPinItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Helper for user display name
  const getUserDisplayName = (u?: any) => {
    if (!u) return "Anonymous User";
    if (typeof u === "string") return u;
    const fn = u.first_name && u.first_name !== "null" ? u.first_name : "";
    const ln = u.last_name && u.last_name !== "null" ? u.last_name : "";
    const full = `${fn} ${ln}`.trim();
    return (
      full || u.display_name || u.username || u.email?.split("@")[0] || "User"
    );
  };

  // Helper for profile image
  const getProfileImage = (u?: any) => {
    if (!u || typeof u !== "object") return null;
    const pic = u.profile_picture || u.avatar;
    if (!pic) return null;
    if (pic.startsWith("http://") || pic.startsWith("https://")) return pic;
    const base = (API_URL || "").replace(/\/+$/, "");
    return `${base}${pic.startsWith("/") ? "" : "/"}${pic}`;
  };

  // 1. Fetch dropdown options (States, Tags, Users)
  useEffect(() => {
    // Load States
    getStates(1, 100)
      .then((res) => {
        const list = res?.data || res?.states || res || [];
        setStatesList(Array.isArray(list) ? list : []);
      })
      .catch((err) => console.warn("Could not load states:", err));

    // Load Tag Types
    getMapPinTags()
      .then((res) => {
        const list = res?.data || res || [];
        setTagTypesList(Array.isArray(list) ? list : []);
      })
      .catch((err) => console.warn("Could not load pin tags:", err));

    // Load Users
    getUsers(1, 100)
      .then((res) => {
        const list = res?.data?.users || [];
        setUsersList(Array.isArray(list) ? list : []);
      })
      .catch((err) => console.warn("Could not load users list:", err));
  }, []);

  // 2. Fetch Map Pins List from /admin/pins
  const fetchPinsList = useCallback(async () => {
    setLoading(true);
    try {
      let activityFilterParam: string | undefined = undefined;
      if (selectedTimeframe === "7" || selectedTimeframe === "7_days") {
        activityFilterParam = "7_days";
      } else if (
        selectedTimeframe === "30" ||
        selectedTimeframe === "30_days"
      ) {
        activityFilterParam = "30_days";
      } else if (
        selectedTimeframe === "90" ||
        selectedTimeframe === "90_days"
      ) {
        activityFilterParam = "90_days";
      } else if (
        selectedTimeframe === "365" ||
        selectedTimeframe === "last_year"
      ) {
        activityFilterParam = "last_year";
      }

      const res = await getMapPins({
        page,
        limit,
        search: searchQuery.trim(),
        state:
          selectedState && selectedState !== "all" ? selectedState : undefined,
        visibility:
          selectedVisibility && selectedVisibility !== "all"
            ? selectedVisibility
            : undefined,
        tag_type:
          selectedTagType && selectedTagType !== "all"
            ? selectedTagType
            : undefined,
        user_id:
          selectedUserId && selectedUserId !== "all"
            ? selectedUserId
            : undefined,
        activity_filter: activityFilterParam,
        start_date: dateRangeStart || undefined,
        end_date: dateRangeEnd || undefined,
      });

      if (res && res.data) {
        // Summary stats
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
        // Activity Overview points (supports both array and { filter, data: [...] })
        if (Array.isArray(res.data.activity_overview)) {
          setActivityOverview(res.data.activity_overview);
        } else if (
          res.data.activity_overview &&
          Array.isArray((res.data.activity_overview as any).data)
        ) {
          setActivityOverview((res.data.activity_overview as any).data);
        } else {
          setActivityOverview([]);
        }
        // Top States by pins
        if (Array.isArray(res.data.top_states_by_pins)) {
          setTopStates(res.data.top_states_by_pins);
        }
        // Top Tag Types
        const tagTypesData =
          res.data.top_tag_types || (res as any).top_tag_types || null;
        if (tagTypesData) {
          setTopTagTypes(tagTypesData);
        }
        // Pins list
        if (Array.isArray(res.data.pins)) {
          setMapPins(res.data.pins);
        } else {
          setMapPins([]);
        }
        // Pagination
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.totalPages || 1);
          setTotalItems(res.data.pagination.totalItems ?? res.data.pins?.length ?? 0);
        } else {
          setTotalPages(1);
          setTotalItems(res.data.pins?.length || 0);
        }
      } else {
        setMapPins([]);
        setTotalItems(0);
        setTotalPages(1);
      }
    } catch (err: any) {
      console.error("Fetch map pins error:", err);
      toast.error(err?.message || "Failed to load GPS pins.");
      setMapPins([]);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    limit,
    searchQuery,
    selectedState,
    selectedTagType,
    selectedUserId,
    selectedVisibility,
    selectedTimeframe,
    dateRangeStart,
    dateRangeEnd,
  ]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPinsList();
    }, 350);
    return () => clearTimeout(timer);
  }, [fetchPinsList]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedState("");
    setSelectedTagType("");
    setSelectedUserId("");
    setSelectedVisibility("");
    setSelectedTimeframe("all");
    setDateRangeStart("");
    setDateRangeEnd("");
    setPage(1);
  };

  // View Pin Details
  const handleViewPin = (pin: MapPinItem) => {
    setSelectedPin(pin);
    setViewModalOpen(true);
  };

  // Edit Pin handler
  const handleEditPin = (pin: MapPinItem) => {
    setPinToEdit(pin);
    setEditModalOpen(true);
  };

  // Delete Pin handler
  const handleDeletePin = (pin: MapPinItem) => {
    setPinToDelete(pin);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!pinToDelete) return;
    setDeleting(true);
    try {
      await deleteMapPin(pinToDelete.id);
      toast.success("GPS pin deleted successfully.");
      setDeleteConfirmOpen(false);
      setPinToDelete(null);
      fetchPinsList();
    } catch (err: any) {
      console.error("Delete pin error:", err);
      toast.error(err?.message || "Failed to delete GPS pin.");
    } finally {
      setDeleting(false);
    }
  };

  // Share Pin handler
  const handleSharePin = (pin: MapPinItem) => {
    const loc = pin.tagged_location || `${pin.latitude}, ${pin.longitude}`;
    const shareUrl = `https://www.google.com/maps/search/?api=1&query=${pin.latitude},${pin.longitude}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      toast.success(`Copied map link for ${loc}`);
    } else {
      toast.info(`Pin location: ${shareUrl}`);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (mapPins.length === 0) {
      toast.info("No GPS pins to export.");
      return;
    }

    const headers = [
      "ID",
      "User Name",
      "User Email",
      "Tagged Location",
      "Latitude",
      "Longitude",
      "State",
      "Tag Type",
      "Visibility",
      "Date",
    ];

    const rows = mapPins.map((p) => {
      const uName = getUserDisplayName(p.user);
      const uEmail = p.user?.email || "N/A";
      const loc = p.tagged_location || p.location_name || p.title || "N/A";
      const stName =
        p.state?.state_name || p.state?.state_code || p.state_name || "N/A";
      const tag = p.tags && p.tags[0] ? p.tags[0].name : "General";
      const vis = p.visibility || (p.is_public ? "public" : "private");
      const d = p.created_at ? new Date(p.created_at).toLocaleDateString() : "";
      return [
        `"${p.id}"`,
        `"${uName}"`,
        `"${uEmail}"`,
        `"${loc}"`,
        `"${p.latitude}"`,
        `"${p.longitude}"`,
        `"${stName}"`,
        `"${tag}"`,
        `"${vis}"`,
        `"${d}"`,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `onspot_gps_activity_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${mapPins.length} GPS pins.`);
  };

  // Activity Chart Coordinates computation
  const chartPoints = useMemo(() => {
    if (!activityOverview || activityOverview.length === 0) {
      return [
        { label: "Q1", count: 0 },
        { label: "Q2", count: 0 },
        { label: "Q3", count: 0 },
        { label: "Q4", count: 0 },
      ];
    }
    return activityOverview.map((item) => ({
      label: (item as any).label || (item as any).week || "Period",
      count: Number(item.count) || 0,
      startDate: item.start_date,
      endDate: item.end_date,
    }));
  }, [activityOverview]);

  const maxChartValue = useMemo(() => {
    const max = Math.max(...chartPoints.map((p) => p.count), 5);
    return Math.ceil(max * 1.15);
  }, [chartPoints]);

  // Max value in top states for progress bars
  const maxStateCount = useMemo(() => {
    if (!topStates || topStates.length === 0) return 1;
    return Math.max(...topStates.map((s) => s.pin_count), 1);
  }, [topStates]);

  // SVG Chart Dimensions
  const svgWidth = 340;
  const svgHeight = 200;
  const padLeft = 32;
  const padRight = 16;
  const padTop = 18;
  const padBottom = 28;
  const chartWidth = svgWidth - padLeft - padRight;
  const chartHeight = svgHeight - padTop - padBottom;

  const plottedPoints = useMemo(() => {
    const len = chartPoints.length;
    if (len === 0) return [];
    return chartPoints.map((pt, i) => {
      const x = padLeft + (i / Math.max(len - 1, 1)) * chartWidth;
      const y = padTop + chartHeight - (pt.count / maxChartValue) * chartHeight;
      return { ...pt, x, y };
    });
  }, [chartPoints, chartWidth, chartHeight, maxChartValue]);

  const linePath = useMemo(() => {
    if (plottedPoints.length === 0) return "";
    return plottedPoints
      .map(
        (p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`,
      )
      .join(" ");
  }, [plottedPoints]);

  const areaPath = useMemo(() => {
    if (plottedPoints.length === 0) return "";
    const firstX = plottedPoints[0].x.toFixed(1);
    const lastX = plottedPoints[plottedPoints.length - 1].x.toFixed(1);
    const bottomY = (padTop + chartHeight).toFixed(1);
    return `${linePath} L${lastX},${bottomY} L${firstX},${bottomY} Z`;
  }, [linePath, plottedPoints, padTop, chartHeight]);

  // Dynamic Tag Types for filter dropdown from API (none hardcoded)
  const dynamicTagOptions = useMemo(() => {
    const map = new Map<string, string>();
    // 1. From API tagTypesList
    tagTypesList.forEach((item) => {
      const it = item as any;
      const name =
        typeof item === "string"
          ? item
          : it?.name || it?.tag || it?.label || it?.tag_name || "";
      if (name && name.trim()) {
        map.set(name.trim().toLowerCase(), name.trim());
      }
    });
    // 2. From top_tag_types breakdown returned by API
    if (topTagTypes?.breakdown && Array.isArray(topTagTypes.breakdown)) {
      topTagTypes.breakdown.forEach((item) => {
        if (item.name && item.name.trim()) {
          map.set(item.name.trim().toLowerCase(), item.name.trim());
        }
      });
    }
    return Array.from(map.values());
  }, [tagTypesList, topTagTypes]);

  // Donut chart calculations for Top Tag Types
  const donutData = useMemo(() => {
    const rawTotalPins = summary?.total_pins;
    const totalPinsCount =
      typeof rawTotalPins === "object" &&
      rawTotalPins !== null &&
      typeof rawTotalPins.count === "number"
        ? rawTotalPins.count
        : typeof rawTotalPins === "number"
          ? rawTotalPins
          : typeof (topTagTypes as any)?.total_pins === "object" &&
              (topTagTypes as any)?.total_pins !== null
            ? ((topTagTypes as any).total_pins.count ?? totalItems)
            : totalItems ?? 0;

    if (
      !topTagTypes ||
      !Array.isArray(topTagTypes.breakdown) ||
      topTagTypes.breakdown.length === 0
    ) {
      return { total: totalPinsCount, slices: [] };
    }

    const breakdown = topTagTypes.breakdown;
    const totalEntries =
      topTagTypes.total_tag_entries ||
      breakdown.reduce((acc, curr) => acc + (curr.count || 0), 0);

    const radius = 62;
    const circumference = 2 * Math.PI * radius;
    let accumulatedLength = 0;

    const slices = breakdown.map((item, index) => {
      const lowerName = (item.name || "").trim().toLowerCase();
      const color =
        TAG_TYPE_COLOR_MAP[lowerName] ||
        TAG_TYPE_COLORS[index % TAG_TYPE_COLORS.length];

      const fraction =
        totalEntries > 0
          ? (item.count || 0) / totalEntries
          : (item.percentage || 0) / 100;
      const sliceLength = fraction * circumference;
      const strokeOffset = accumulatedLength;
      accumulatedLength += sliceLength;

      // Formatted percentage string
      const pctFormatted =
        typeof item.percentage === "number"
          ? `${Number(item.percentage.toFixed(1))}%`
          : totalEntries > 0
            ? `${((item.count / totalEntries) * 100).toFixed(1)}%`
            : "0%";

      // Gap between slices if more than 1 segment
      const gap = breakdown.length > 1 ? 2.5 : 0;
      const dashLength = Math.max(0, sliceLength - gap);
      const dashSpace = circumference - dashLength;

      return {
        ...item,
        color,
        pctFormatted,
        dashLength,
        dashSpace,
        strokeOffset,
      };
    });

    return { total: totalPinsCount, slices };
  }, [topTagTypes, summary, totalItems]);

  return (
    <div className="space-y-6">
      {/* ===================== EXPORT BAR & TIMEFRAME ===================== */}
      <div className="flex items-center justify-end gap-2.5">
        <button
          onClick={handleExportCSV}
          className="h-[38px] px-4 border border-[#e4e4df] bg-white hover:bg-[#f7f7f4] rounded-[6px] text-[#444] text-[13px] inline-flex items-center gap-2 font-normal transition-colors cursor-pointer shadow-xs"
        >
          <span>Export</span>
          <Download className="w-3.5 h-3.5 text-[#666]" />
        </button>
        <select
          value={selectedTimeframe}
          onChange={(e) => {
            setSelectedTimeframe(e.target.value);
            setDateRangeStart("");
            setDateRangeEnd("");
            setPage(1);
          }}
          className="h-[38px] px-3.5 pr-8 border border-[#e4e4df] bg-white rounded-[6px] text-[#444] text-[13px] hover:border-[#cfcfca] focus:border-[#2d4a23] outline-none cursor-pointer shadow-xs transition-colors"
          style={{
            backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 12px center",
            appearance: "none",
          }}
        >
          <option value="all">All Time</option>
          <option value="7_days">Last 7 Days</option>
          <option value="30_days">Last 30 Days</option>
          <option value="90_days">Last 90 Days</option>
          <option value="last_year">Last Year</option>
        </select>
      </div>

      <section
        className={`grid grid-cols-1 sm:grid-cols-2 ${
          summary?.total_tag_types !== undefined
            ? "lg:grid-cols-3 xl:grid-cols-5"
            : "lg:grid-cols-4"
        } gap-4`}
      >
        {/* 1. Total Pins Added */}
        <div className="bg-white rounded-[14px] p-[18px_20px] shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)] border border-[#ececec]">
          <div className="flex items-start justify-between mb-1.5">
            <span className="text-[#9a9a9a] text-[13px] font-medium">
              Total Pins Added
            </span>
            <span className="w-8 h-8 rounded-full bg-[#f1f5ee] flex items-center justify-center text-[#2d4a23]">
              <MapPinIcon className="w-5 h-5" />
            </span>
          </div>
          {(() => {
            const rawTotal = summary?.total_pins;
            const count =
              typeof rawTotal === "object" && rawTotal !== null
                ? (rawTotal.count ?? totalItems)
                : (rawTotal ?? totalItems);

            const delta =
              typeof rawTotal === "object" && rawTotal !== null
                ? ((rawTotal as any).change_vs_last_30_days ??
                  rawTotal.change_30d ??
                  rawTotal.delta ??
                  rawTotal.weekly_change)
                : (summary as any)?.delta;

            const trend =
              typeof rawTotal === "object" && rawTotal !== null
                ? rawTotal.trend ||
                  (delta !== undefined
                    ? delta > 0
                      ? "up"
                      : delta < 0
                        ? "down"
                        : "flat"
                    : undefined)
                : delta !== undefined
                  ? delta > 0
                    ? "up"
                    : delta < 0
                      ? "down"
                      : "flat"
                  : undefined;

            const formatted =
              typeof rawTotal === "object" && rawTotal !== null
                ? rawTotal.formatted_text
                : undefined;

            return (
              <>
                <div className="text-[24px] font-bold text-[#1f1f1f] mb-1">
                  {loading ? "..." : (count ?? 0).toLocaleString()}
                </div>
                {/* 30-Day comparison delta / trend indicator */}
                {formatted ? (
                  <div
                    className={`text-[12px] font-medium flex items-center gap-1 ${
                      trend === "down"
                        ? "text-[#e03131]"
                        : trend === "up"
                          ? "text-[#34A853]"
                          : "text-[#7D848D]"
                    }`}
                  >
                    <span>{formatted}</span>
                  </div>
                ) : delta !== undefined ? (
                  <div
                    className={`text-[12px] font-medium flex items-center gap-1 ${
                      trend === "down" || delta < 0
                        ? "text-[#e03131]"
                        : trend === "up" || delta > 0
                          ? "text-[#34A853]"
                          : "text-[#7D848D]"
                    }`}
                  >
                    <span>{delta >= 0 ? "↑ +" : "↓ "}</span>
                    <span>{Math.abs(delta)} vs previous 30 days</span>
                  </div>
                ) : null}
              </>
            );
          })()}
        </div>

        {/* 2. Most Tagged State */}
        <div className="bg-white rounded-[14px] p-[18px_20px] shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)] border border-[#ececec]">
          <div className="flex items-start justify-between mb-1.5">
            <span className="text-[#9a9a9a] text-[13px] font-medium">
              Most Tagged State
            </span>
            <span className="w-8 h-8 rounded-full bg-[#f1f5ee] flex items-center justify-center text-[#2d4a23]">
              <Compass className="w-5 h-5" />
            </span>
          </div>
          <div className="text-[24px] font-bold text-[#1f1f1f] mb-1 truncate">
            {loading ? "..." : summary?.most_tagged_state?.state_name || "None"}
          </div>
          <div className="text-[12px] text-[#34A853] font-medium flex items-center gap-1">
            {summary?.most_tagged_state?.formatted_text ||
              `${summary?.most_tagged_state?.pin_count ?? 0} Pins`}
          </div>
        </div>

        {/* 3. Most Active Users */}
        <div className="bg-white rounded-[14px] p-[18px_20px] shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)] border border-[#ececec]">
          <div className="flex items-start justify-between mb-1.5">
            <span className="text-[#9a9a9a] text-[13px] font-medium">
              Most Active Users
            </span>
            <span className="w-8 h-8 rounded-full bg-[#f1f5ee] flex items-center justify-center text-[#2d4a23]">
              <Users className="w-5 h-5" />
            </span>
          </div>
          <div
            className="text-[21px] font-bold text-[#1f1f1f] mb-1 truncate"
            title={
              summary?.most_active_user?.display_name ||
              summary?.most_active_user?.email ||
              "None"
            }
          >
            {loading
              ? "..."
              : summary?.most_active_user?.display_name ||
                summary?.most_active_user?.first_name ||
                summary?.most_active_user?.email?.split("@")[0] ||
                "None"}
          </div>
          <div className="text-[12px] text-[#34A853] font-medium flex items-center gap-1">
            {summary?.most_active_user?.formatted_text ||
              `${summary?.most_active_user?.pin_count ?? 0} Pins`}
          </div>
        </div>

        {/* 4. Shared Publicly */}
        <div className="bg-white rounded-[14px] p-[18px_20px] shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)] border border-[#ececec]">
          <div className="flex items-start justify-between mb-1.5">
            <span className="text-[#9a9a9a] text-[13px] font-medium">
              Shared Publicly
            </span>
            <span className="w-8 h-8 rounded-full bg-[#f1f5ee] flex items-center justify-center text-[#2d4a23]">
              <Globe className="w-5 h-5" />
            </span>
          </div>
          <div className="text-[24px] font-bold text-[#1f1f1f] mb-1">
            {loading
              ? "..."
              : (summary?.shared_publicly?.count ?? 0).toLocaleString()}
          </div>
          <div className="text-[12px] text-[#3b6bbf] font-medium">
            {summary?.shared_publicly?.percentage ?? 0}% of total
          </div>
        </div>

        {/* 5. Total Tag Types (Handles both raw number and { count, formatted_text }) */}
        {summary?.total_tag_types !== undefined && (
          <div className="bg-white rounded-[14px] p-[18px_20px] shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)] border border-[#ececec]">
            <div className="flex items-start justify-between mb-1.5">
              <span className="text-[#9a9a9a] text-[13px] font-medium">
                Total Tag Types
              </span>
              <span className="w-8 h-8 rounded-full bg-[#f1f5ee] flex items-center justify-center text-[#2d4a23]">
                <Tag className="w-5 h-5" />
              </span>
            </div>
            <div className="text-[24px] font-bold text-[#1f1f1f] mb-1">
              {typeof summary.total_tag_types === "object" &&
              summary.total_tag_types !== null
                ? (summary.total_tag_types.count ?? 0).toLocaleString()
                : Number(summary.total_tag_types ?? 0).toLocaleString()}
            </div>
            <div className="text-[12px] text-[#888] font-normal">
              {typeof summary.total_tag_types === "object" &&
              summary.total_tag_types !== null
                ? summary.total_tag_types.formatted_text || "Types used"
                : "Types used"}
            </div>
          </div>
        )}
      </section>

      {/* ===================== FILTER ROW (EXACT HTML LAYOUT) ===================== */}
      <section className="bg-transparent flex flex-wrap items-center gap-2.5">
        {/* 1. State Filter */}
        <select
          id="filter-state"
          value={selectedState}
          onChange={(e) => {
            setSelectedState(e.target.value);
            setPage(1);
          }}
          className="h-[38px] w-36 px-3.5 pr-8 border border-[#e4e4df] bg-white rounded-[6px] text-[#4a4a4a] text-[13px] hover:border-[#cfcfca] focus:border-[#2d4a23] outline-none cursor-pointer shadow-xs transition-colors"
          style={{
            backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 12px center",
            appearance: "none",
          }}
        >
          <option value="">All States</option>
          {statesList.map((s, idx) => {
            const sName =
              typeof s === "string"
                ? s
                : s?.state_name || s?.name || `State ${idx + 1}`;
            const sKey = s?.state_id || s?.id || `state-${idx}-${sName}`;
            return (
              <option key={sKey} value={sName}>
                {sName}
              </option>
            );
          })}
        </select>

        {/* 2. Tag Type Filter */}
        <select
          id="filter-type"
          value={selectedTagType}
          onChange={(e) => {
            setSelectedTagType(e.target.value);
            setPage(1);
          }}
          className="h-[38px] w-36 px-3.5 pr-8 border border-[#e4e4df] bg-white rounded-[6px] text-[#4a4a4a] text-[13px] hover:border-[#cfcfca] focus:border-[#2d4a23] outline-none cursor-pointer shadow-xs transition-colors"
          style={{
            backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 12px center",
            appearance: "none",
          }}
        >
          <option value="">All Tag Types</option>
          {dynamicTagOptions.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>

        {/* 3. User Filter */}
        {/* <select
          id="filter-user"
          value={selectedUserId}
          onChange={(e) => {
            setSelectedUserId(e.target.value);
            setPage(1);
          }}
          className="h-[38px] w-36 px-3.5 pr-8 border border-[#e4e4df] bg-white rounded-[6px] text-[#4a4a4a] text-[13px] hover:border-[#cfcfca] focus:border-[#2d4a23] outline-none cursor-pointer shadow-xs transition-colors"
          style={{
            backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 12px center",
            appearance: "none",
          }}
        >
          <option value="">All Users</option>
          {usersList.map((u, idx) => (
            <option key={u.id || `user-${idx}`} value={u.id}>
              {getUserDisplayName(u)}
            </option>
          ))}
        </select> */}

        {/* 4. Shared Public Filter */}
        <select
          id="filter-shared"
          value={selectedVisibility}
          onChange={(e) => {
            setSelectedVisibility(e.target.value);
            setPage(1);
          }}
          className="h-[38px] w-36 px-3.5 pr-8 border border-[#e4e4df] bg-white rounded-[6px] text-[#4a4a4a] text-[13px] hover:border-[#cfcfca] focus:border-[#2d4a23] outline-none cursor-pointer shadow-xs transition-colors"
          style={{
            backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 12px center",
            appearance: "none",
          }}
        >
          <option value="">Shared: All</option>
          <option value="public">Shared: Public</option>
          <option value="private">Shared: Private</option>
        </select>

        {/* 5. Date Range Field */}
        <div className="relative h-[38px] w-56 flex-shrink-0">
          <input
            type="text"
            id="filter-range"
            readOnly
            onClick={() => setShowDatePicker(!showDatePicker)}
            value={
              dateRangeStart && dateRangeEnd
                ? `${dateRangeStart} - ${dateRangeEnd}`
                : dateRangeStart
                  ? `From ${dateRangeStart}`
                  : "Select Date Range"
            }
            placeholder="Date range"
            className="w-full h-full pl-3.5 pr-8 border border-[#e4e4df] bg-white rounded-[6px] text-[13px] text-[#4a4a4a] hover:border-[#cfcfca] focus:border-[#2d4a23] outline-none cursor-pointer shadow-xs"
          />
          <Calendar className="w-3.5 h-3.5 text-[#888] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />

          {/* Quick Date Range Dropdown Popover */}
          {showDatePicker && (
            <div className="absolute top-11 left-0 z-30 bg-white border border-[#ececec] rounded-[10px] p-3 shadow-xl w-64 space-y-2 text-xs animate-in fade-in duration-150">
              <div className="font-semibold text-gray-700 pb-1 border-b border-gray-100 flex items-center justify-between">
                <span>Custom Date Filter</span>
                <button
                  type="button"
                  onClick={() => setShowDatePicker(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-1">
                <label className="text-gray-500 block text-[11px]">
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateRangeStart}
                  onChange={(e) => setDateRangeStart(e.target.value)}
                  className="w-full h-8 px-2 border border-gray-200 rounded text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-gray-500 block text-[11px]">
                  End Date
                </label>
                <input
                  type="date"
                  value={dateRangeEnd}
                  onChange={(e) => setDateRangeEnd(e.target.value)}
                  className="w-full h-8 px-2 border border-gray-200 rounded text-xs"
                />
              </div>
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setDateRangeStart("");
                    setDateRangeEnd("");
                    setShowDatePicker(false);
                    setPage(1);
                  }}
                  className="text-gray-500 hover:text-gray-800 text-[11px]"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDatePicker(false);
                    setPage(1);
                    fetchPinsList();
                  }}
                  className="px-3 py-1 bg-[#1f3d2a] text-white rounded text-[11px] font-medium"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 6. Right Search Field */}
        <div className="relative flex-1 min-w-[180px] max-w-xs sm:ml-auto">
          <input
            type="text"
            id="right-search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search"
            className="w-full h-[38px] pl-3.5 pr-9 border border-[#e4e4df] bg-white rounded-[6px] text-[#444] text-[13px] placeholder-gray-400 hover:border-[#cfcfca] focus:border-[#2d4a23] outline-none shadow-xs transition-colors"
          />
          <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* 7. Filters Button (Triggers Search / Resets) */}
        <button
          onClick={handleResetFilters}
          className="h-[38px] px-4 border border-[#e4e4df] bg-white hover:bg-[#f7f7f2] rounded-[6px] text-[#3b6bbf] font-medium text-[13px] inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs flex-shrink-0"
        >
          <span>Filters</span>
          <Filter className="w-3.5 h-3.5 text-[#3b6bbf]" />
        </button>
      </section>

      {/* ===================== BODY GRID (LEFT TABLE 1.6fr / RIGHT PANELS 1fr) ===================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start w-full min-w-0">
        {/* ===================== LEFT COLUMN: TABLE (7 OR 8 COLS) ===================== */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col space-y-4 w-full min-w-0">
          <section className="bg-white rounded-[14px] p-4 sm:p-5 pb-3 border border-[#ececec] shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)] w-full min-w-0 overflow-hidden">
            <h3 className="text-[17px] font-bold text-[#1f1f1f] mb-3">
              Recent GPS/ Tagging Activity
            </h3>

            <div className="overflow-x-auto w-full max-w-full">
              <table className="w-full min-w-[720px] text-left border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-[#ececec]">
                    <th className="py-3.5 px-3 font-semibold text-[#111111] text-[13px] whitespace-nowrap">
                      User Name
                    </th>
                    <th className="py-3.5 px-3 font-semibold text-[#111111] text-[13px] whitespace-nowrap">
                      Tagged Location
                    </th>
                    <th className="py-3.5 px-3 font-semibold text-[#111111] text-[13px] whitespace-nowrap">
                      State
                    </th>
                    <th className="py-3.5 px-3 font-semibold text-[#111111] text-[13px] whitespace-nowrap">
                      Tag Type
                    </th>
                    <th className="py-3.5 px-3 font-semibold text-[#111111] text-[13px] whitespace-nowrap">
                      Date
                    </th>
                    <th className="py-3.5 px-3 font-semibold text-[#111111] text-[13px] whitespace-nowrap">
                      Shared Public?
                    </th>
                    <th className="py-3.5 px-3 text-right font-semibold text-[#111111] text-[13px] whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f1ed] text-[13px]">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-16 text-center text-[#7D848D]"
                      >
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Loader2 className="w-6 h-6 animate-spin text-[#2d4a23]" />
                          <span className="text-[13px] font-medium text-[#7D848D]">
                            Loading GPS activity...
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : mapPins.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-16 text-center text-[#7D848D]"
                      >
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <AlertCircle className="w-8 h-8 text-gray-300" />
                          <p className="text-[13px] font-semibold text-gray-700">
                            No activity matches your filters.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    mapPins.map((pin, index) => {
                      const uName = getUserDisplayName(pin.user);
                      const avatarUrl = getProfileImage(pin.user);
                      const userInitial = uName.charAt(0).toUpperCase();

                      const isPublic =
                        pin.visibility === "public" ||
                        pin.is_public === true ||
                        String(pin.visibility || "").toLowerCase() === "public";

                      const dateStr = pin.created_at
                        ? new Date(pin.created_at).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })
                        : "—";

                      const latStr =
                        typeof pin.latitude === "number"
                          ? pin.latitude.toFixed(4)
                          : String(pin.latitude || "");
                      const lngStr =
                        typeof pin.longitude === "number"
                          ? pin.longitude.toFixed(4)
                          : String(pin.longitude || "");

                      const locTitle = String(
                        pin.tagged_location ||
                          pin.location_name ||
                          pin.title ||
                          pin.description ||
                          `${latStr}, ${lngStr}`,
                      );

                      const stateDisplay =
                        typeof pin.state === "object" && pin.state !== null
                          ? pin.state.state_name || pin.state.state_code || "—"
                          : typeof pin.state_name === "string"
                            ? pin.state_name
                            : "—";

                      const tagTypeDisplay =
                        pin.tags && pin.tags.length > 0
                          ? pin.tags[0].name
                          : pin.tag_type?.name || pin.type?.name || "General";

                      return (
                        <tr
                          key={pin.id || index}
                          className="hover:bg-[#fbfbf8] transition-colors"
                        >
                          {/* User Name */}
                          <td className="py-3 px-3 align-middle">
                            <div className="flex items-center gap-2.5 text-[#111111] font-medium">
                              {avatarUrl ? (
                                <img
                                  src={avatarUrl}
                                  alt={uName}
                                  className="w-[30px] h-[30px] rounded-full object-cover flex-shrink-0 border border-gray-100"
                                />
                              ) : (
                                <div className="w-[30px] h-[30px] rounded-full bg-[#f1f1ed] text-[#4a4a4a] font-semibold flex items-center justify-center text-xs flex-shrink-0">
                                  {userInitial}
                                </div>
                              )}
                              <span
                                className="truncate max-w-[120px]"
                                title={uName}
                              >
                                {uName}
                              </span>
                            </div>
                          </td>

                          {/* Tagged Location */}
                          <td className="py-3 px-3 align-middle">
                            <div className="text-[#1f1f1f] font-semibold text-[13px] truncate max-w-[150px]">
                              {locTitle}
                            </div>
                            <div className="text-[#b0b0b0] text-[11.5px] mt-0.5 font-mono">
                              {latStr}, {lngStr}
                            </div>
                          </td>

                          {/* State */}
                          <td className="py-3 px-3 text-[#7a7a7a] align-middle whitespace-nowrap">
                            {stateDisplay}
                          </td>

                          {/* Tag Type */}
                          <td className="py-3 px-3 text-[#7a7a7a] align-middle whitespace-nowrap">
                            {tagTypeDisplay}
                          </td>

                          {/* Date */}
                          <td className="py-3 px-3 text-[#7a7a7a] align-middle whitespace-nowrap">
                            {dateStr}
                          </td>

                          {/* Shared Public? */}
                          <td className="py-3 px-3 align-middle whitespace-nowrap">
                            <span
                              className={`inline-block px-3.5 py-1 rounded-[6px] text-[11.5px] font-medium border ${
                                isPublic
                                  ? "bg-[#e8f5ec] text-[#34A853] border-[#b8e0c2]"
                                  : "bg-[#fdecec] text-[#e03131] border-[#f3c0c0]"
                              }`}
                            >
                              {isPublic ? "Yes" : "No"}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3 text-right align-middle whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              {/* View */}
                              <button
                                onClick={() => handleViewPin(pin)}
                                title="View on map"
                                className="w-[28px] h-[26px] border border-[#e4e4df] rounded-[5px] bg-white text-[#777] hover:bg-[#f7f7f4] hover:text-[#2d4a23] inline-flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit */}
                              <button
                                onClick={() => handleEditPin(pin)}
                                title="Edit pin"
                                className="w-[28px] h-[26px] border border-[#e4e4df] rounded-[5px] bg-white text-[#777] hover:bg-emerald-50 hover:text-[#0E3E27] hover:border-emerald-200 inline-flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => handleDeletePin(pin)}
                                title="Delete pin"
                                className="w-[28px] h-[26px] border border-[#e4e4df] rounded-[5px] bg-white text-[#777] hover:bg-red-50 hover:text-red-600 hover:border-red-200 inline-flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Share */}
                              <button
                                onClick={() => handleSharePin(pin)}
                                title="Share"
                                className="w-[28px] h-[26px] border border-[#e4e4df] rounded-[5px] bg-white text-[#777] hover:bg-[#f7f7f4] hover:text-[#2d4a23] inline-flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <Share2 className="w-3.5 h-3.5" />
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

            {/* Table Footer Count & Pagination */}
            <div className="mt-4 pt-3 border-t border-[#f1f1ed] flex flex-wrap items-center justify-between gap-3 text-[12.5px] text-[#888]">
              <div>
                Showing 1 to {mapPins.length} of {totalItems.toLocaleString()}{" "}
                pins
              </div>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalItems || mapPins.length}
                pageSize={limit}
                itemCountOnPage={mapPins.length}
                itemLabel="pins"
                onPageChange={(newPage) => setPage(newPage)}
                loading={loading}
              />
            </div>
          </section>
        </div>

        {/* ===================== RIGHT COLUMN: PANELS & CHARTS (4 OR 5 COLS) ===================== */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4 w-full min-w-0">
          {/* 1. Activity Overview Panel (Area Line Chart) */}
          <div className="bg-white rounded-[14px] p-5 border border-[#ececec] shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)]">
            <h3 className="text-[16px] font-bold text-[#1f1f1f] pb-3 mb-3 border-b border-[#ececec]">
              Activity Overview
            </h3>

            <div className="w-full overflow-hidden">
              <svg
                width="100%"
                height="210"
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="overflow-visible"
              >
                {/* Horizontal Dashed Gridlines */}
                <g stroke="#f1f1ed" strokeDasharray="2 4">
                  {[0, 1, 2, 3, 4].map((i) => {
                    const y = padTop + (i / 4) * chartHeight;
                    return (
                      <line
                        key={i}
                        x1={padLeft}
                        y1={y}
                        x2={svgWidth - padRight}
                        y2={y}
                      />
                    );
                  })}
                </g>

                {/* Y-Axis Value Labels */}
                <g fontSize="9.5" fill="#a0a0a0" fontFamily="Inter, sans-serif">
                  {[0, 1, 2, 3, 4].map((i) => {
                    const val = Math.round(maxChartValue * (1 - i / 4));
                    const y = padTop + (i / 4) * chartHeight;
                    const formattedVal =
                      val >= 1000 ? `${(val / 1000).toFixed(1)}k` : String(val);
                    return (
                      <text key={i} x="4" y={y + 3.5}>
                        {formattedVal}
                      </text>
                    );
                  })}
                </g>

                {/* Gradient Defs */}
                <defs>
                  <linearGradient
                    id="activity_gradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#5e9d6a" stopOpacity="0.55" />
                    <stop offset="100%" stopColor="#5e9d6a" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Filled Area */}
                {areaPath && (
                  <path d={areaPath} fill="url(#activity_gradient)" />
                )}

                {/* Smooth Stroke Line */}
                {linePath && (
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#3a7a45"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Interactive Points on Line */}
                {plottedPoints.map((pt, idx) => (
                  <g key={idx} className="cursor-pointer">
                    <circle
                      cx={pt.x.toFixed(1)}
                      cy={pt.y.toFixed(1)}
                      r="10"
                      fill="transparent"
                    />
                    <circle
                      cx={pt.x.toFixed(1)}
                      cy={pt.y.toFixed(1)}
                      r="4.5"
                      fill="#34A853"
                      stroke="#ffffff"
                      strokeWidth="1.8"
                    />
                    {/* Tooltip on hover */}
                    <title>{`${pt.label}: ${pt.count} pins`}</title>
                  </g>
                ))}

                {/* X-Axis Labels (Weeks) */}
                <g
                  fontSize="10"
                  fill="#a0a0a0"
                  fontFamily="Inter, sans-serif"
                  textAnchor="middle"
                >
                  {plottedPoints.map((pt, idx) => (
                    <text key={idx} x={pt.x.toFixed(1)} y={svgHeight - 6}>
                      {pt.label}
                    </text>
                  ))}
                </g>
              </svg>
            </div>
          </div>

          {/* 2. Top States by Pins Panel */}
          <div className="bg-white rounded-[14px] p-5 border border-[#ececec] shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)]">
            <h3 className="text-[16px] font-bold text-[#1f1f1f] pb-3 mb-3 border-b border-[#ececec]">
              Top States by Pins
            </h3>

            {topStates.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400">
                No state activity data available.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {topStates.slice(0, 6).map((st, sIdx) => {
                  const pct = Math.min(
                    Math.round((st.pin_count / maxStateCount) * 100),
                    100,
                  );
                  return (
                    <div
                      key={st.state_id || sIdx}
                      className="grid grid-cols-[85px_1fr] items-center gap-3"
                    >
                      <span
                        className="text-[#7D848D] text-[13px] truncate"
                        title={st.state_name}
                      >
                        {st.state_name}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-[#2d4a23] h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(pct, 6)}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-medium text-gray-400 w-5 text-right">
                          {st.pin_count}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={() => {
                setSelectedState("");
                setPage(1);
                fetchPinsList();
              }}
              className="w-full text-center mt-3.5 pt-3 border-t border-[#ececec] text-[#0E3E27] font-medium text-[13px] hover:underline cursor-pointer transition-colors block"
            >
              View All States
            </button>
          </div>

          {/* 3. Top Tag Types Panel */}
          <div className="bg-white rounded-[14px] p-5 border border-[#ececec] shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)]">
            <h3 className="text-[16px] font-bold text-[#1f1f1f] pb-3 mb-3 border-b border-[#ececec]">
              Top Tag Types
            </h3>

            {/* Donut Chart */}
            <div className="relative w-[180px] h-[180px] mx-auto my-3 flex items-center justify-center">
              <svg
                viewBox="0 0 200 200"
                className="w-full h-full -rotate-90 transform"
              >
                {/* Background track circle */}
                <circle
                  cx="100"
                  cy="100"
                  r="62"
                  fill="none"
                  stroke={donutData.slices.length === 0 ? "#E5E7EB" : "#F3F4F6"}
                  strokeWidth="26"
                />
                {/* Slices */}
                {donutData.slices.map((slice, idx) => {
                  const isHovered = hoveredTagIndex === idx;
                  const isAnyHovered = hoveredTagIndex !== null;

                  return (
                    <circle
                      key={slice.name || idx}
                      cx="100"
                      cy="100"
                      r="62"
                      fill="none"
                      stroke={slice.color}
                      strokeWidth={isHovered ? 31 : 26}
                      strokeDasharray={`${slice.dashLength} ${slice.dashSpace}`}
                      strokeDashoffset={-slice.strokeOffset}
                      opacity={isHovered ? 1 : isAnyHovered ? 0.45 : 1}
                      className="transition-all duration-200 ease-out cursor-pointer"
                      onMouseEnter={() => setHoveredTagIndex(idx)}
                      onMouseLeave={() => setHoveredTagIndex(null)}
                    >
                      <title>{`${slice.name}: ${slice.pctFormatted} (${slice.count.toLocaleString()} pins)`}</title>
                    </circle>
                  );
                })}
              </svg>

              {/* Center hole text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2 transition-all duration-200">
                {hoveredTagIndex !== null && donutData.slices[hoveredTagIndex] ? (
                  (() => {
                    const hSlice = donutData.slices[hoveredTagIndex];
                    return (
                      <>
                        <span
                          className="text-[12px] font-semibold text-[#1f1f1f] max-w-[95px] truncate"
                          title={hSlice.name}
                        >
                          {hSlice.name}
                        </span>
                        <span
                          className="text-[20px] font-bold tracking-tight leading-tight mt-0.5"
                          style={{ color: hSlice.color }}
                        >
                          {hSlice.pctFormatted}
                        </span>
                        <span className="text-[10.5px] text-[#7D848D] font-normal mt-0.5">
                          {hSlice.count.toLocaleString()}{" "}
                          {hSlice.count === 1 ? "pin" : "pins"}
                        </span>
                      </>
                    );
                  })()
                ) : (
                  <>
                    <span className="text-[22px] font-bold text-[#1f1f1f] tracking-tight leading-none">
                      {donutData.total.toLocaleString()}
                    </span>
                    <span className="text-[12px] text-[#7D848D] font-normal mt-1">
                      Total Pins
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Breakdown List */}
            {donutData.slices.length === 0 ? (
              <div className="py-4 text-center text-xs text-gray-400">
                No tag type activity available.
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 mt-3 pt-2">
                {donutData.slices.map((item, idx) => {
                  const isHovered = hoveredTagIndex === idx;
                  const isAnyHovered = hoveredTagIndex !== null;

                  return (
                    <div
                      key={item.name || idx}
                      className={`flex items-center justify-between text-[13px] py-1 px-2 -mx-2 rounded-[8px] transition-all duration-150 cursor-pointer ${
                        isHovered
                          ? "bg-gray-100/90 font-medium scale-[1.01]"
                          : isAnyHovered
                            ? "opacity-50"
                            : "hover:bg-gray-50"
                      }`}
                      onMouseEnter={() => setHoveredTagIndex(idx)}
                      onMouseLeave={() => setHoveredTagIndex(null)}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-transform duration-150"
                          style={{
                            backgroundColor: item.color,
                            transform: isHovered ? "scale(1.35)" : "scale(1)",
                          }}
                        />
                        <span
                          className={`truncate transition-colors ${
                            isHovered
                              ? "text-[#111] font-semibold"
                              : "text-[#2B303A] font-normal"
                          }`}
                          title={item.name}
                        >
                          {item.name}
                        </span>
                      </div>
                      <span
                        className={`text-[12.5px] tabular-nums ml-2 flex-shrink-0 transition-colors ${
                          isHovered
                            ? "text-[#111] font-semibold"
                            : "text-[#7D848D] font-normal"
                        }`}
                      >
                        {item.count.toLocaleString()} ({item.pctFormatted})
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. Live Map Preview Panel */}
          <div className="h-[260px] rounded-[14px] overflow-hidden border border-[#ececec] shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)] bg-white">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d44196.236392315026!2d-93.81033787191589!3d46.185289524094266!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x52b157a8f77c8e1f%3A0xfbe655e10ff018bc!2sVineland%2C%20MN%2056359%2C%20USA!5e0!3m2!1sen!2sin!4v1781021191340!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="GPS Activity Map View"
            />
          </div>
        </div>
      </div>

      {/* ===================== VIEW PIN DETAILS MODAL ===================== */}
      {viewModalOpen && selectedPin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 p-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0E3E27] flex items-center justify-center font-bold text-lg">
                  <MapPinIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {selectedPin.tagged_location ||
                      selectedPin.location_name ||
                      selectedPin.title ||
                      "Map Pin Details"}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Created by {getUserDisplayName(selectedPin.user)} (
                    {selectedPin.user?.email || "N/A"})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-5 space-y-4 text-xs">
              {/* Coordinates Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                    Latitude
                  </span>
                  <div className="font-mono text-xs font-semibold bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-center text-gray-800">
                    {selectedPin.latitude}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                    Longitude
                  </span>
                  <div className="font-mono text-xs font-semibold bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-center text-gray-800">
                    {selectedPin.longitude}
                  </div>
                </div>
              </div>

              {/* State & Visibility */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                    State
                  </span>
                  <div className="font-medium bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-gray-700">
                    {selectedPin.state?.state_name ||
                      selectedPin.state_name ||
                      "N/A"}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                    Visibility
                  </span>
                  <div className="p-2.5 rounded-xl border border-gray-100 font-semibold uppercase text-[11px] bg-gray-50">
                    {selectedPin.visibility ||
                      (selectedPin.is_public ? "Public" : "Private")}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  Description
                </span>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-gray-700 leading-relaxed min-h-[50px]">
                  {selectedPin.description || (
                    <span className="text-gray-400 italic">
                      No description provided for this GPS tag.
                    </span>
                  )}
                </div>
              </div>

              {/* Assigned Tags */}
              {selectedPin.tags && selectedPin.tags.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" /> Assigned Tags
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPin.tags.map((tag: any, tIdx: number) => {
                      const tagName =
                        typeof tag === "object" && tag !== null
                          ? tag.name
                          : String(tag);
                      return (
                        <span
                          key={tag.id || tIdx}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 text-[#0E3E27] font-semibold text-[11px] border border-emerald-100"
                        >
                          {tagName}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Open in Google Maps */}
              <div className="pt-2">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${selectedPin.latitude},${selectedPin.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 bg-[#1f3d2a] hover:bg-[#285037] text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer text-xs"
                >
                  <span>Open in Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setViewModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700 transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== EDIT PIN MODAL ===================== */}
      <EditPinModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setPinToEdit(null);
        }}
        onSuccess={() => {
          fetchPinsList();
        }}
        pin={pinToEdit}
        availableTagSuggestions={dynamicTagOptions}
      />

      {/* ===================== DELETE CONFIRMATION MODAL ===================== */}
      {deleteConfirmOpen && pinToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Delete GPS Pin
                </h3>
                <p className="text-xs text-gray-500">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to delete the GPS pin for{" "}
              <strong className="text-gray-900">
                {pinToDelete.tagged_location ||
                  pinToDelete.location_name ||
                  pinToDelete.title ||
                  `${pinToDelete.latitude}, ${pinToDelete.longitude}`}
              </strong>
              ?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setPinToDelete(null);
                }}
                disabled={deleting}
                className="h-9 px-4 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="h-9 px-5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-60"
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{deleting ? "Deleting..." : "Delete Pin"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
