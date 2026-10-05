"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Search,
  ExternalLink,
  AlertCircle,
  X,
  MapPin,
  FileText,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import Pagination from "@/components/admin/Pagination";
import TableActionMenu from "@/components/admin/TableActionMenu";
import {
  getAdminLicenses,
  getStates,
  AdminLicenseItem,
  AdminLicensesData,
  API_URL,
} from "@/lib/api";

export default function LicensesPage() {
  // Data States
  const [licenses, setLicenses] = useState<AdminLicenseItem[]>([]);
  const [summaryData, setSummaryData] = useState<AdminLicensesData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [states, setStates] = useState<
    { state_id: string; state_name: string; state_code: string }[]
  >([]);

  // Filter States
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [stateId, setStateId] = useState("");
  const [licenseType, setLicenseType] = useState("");
  const [uploadDate, setUploadDate] = useState("30d");
  const [searchQuery, setSearchQuery] = useState("");

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // View Modal State
  const [selectedLicense, setSelectedLicense] =
    useState<AdminLicenseItem | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  // Helper for profile image URLs
  const getProfileImageUrl = (url?: string | null) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const baseUrl = (API_URL || "").replace(/\/+$/, "");
    const cleanPath = url.startsWith("/") ? url : `/${url}`;
    return `${baseUrl}${cleanPath}`;
  };

  // Helper for user full display name
  const getUserDisplayName = (u?: AdminLicenseItem["user"]) => {
    if (!u) return "Unknown User";
    const fn = u.first_name && u.first_name !== "null" ? u.first_name : "";
    const ln = u.last_name && u.last_name !== "null" ? u.last_name : "";
    const full = `${fn} ${ln}`.trim();
    return (
      full || u.display_name || u.username || u.email?.split("@")[0] || "User"
    );
  };

  // Fetch States list for dropdown
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
        console.warn("Failed to fetch states for filter:", err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch Licenses strictly from API side
  const fetchLicenses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminLicenses({
        page,
        limit,
        state_id: stateId || undefined,
        license_type: licenseType || undefined,
        upload_date: uploadDate || undefined,
        search: searchQuery.trim() || undefined,
      });

      if (res && res.data) {
        setSummaryData(res.data);
        setLicenses(res.data.licenses || []);
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.totalPages || 1);
          setTotalItems(
            res.data.pagination.totalItems ??
              (res.data.licenses ? res.data.licenses.length : 0),
          );
        } else {
          setTotalPages(1);
          setTotalItems(res.data.licenses ? res.data.licenses.length : 0);
        }
      } else {
        setLicenses([]);
        setTotalItems(0);
        setTotalPages(1);
      }
    } catch (err: any) {
      console.error("Fetch licenses error:", err);
      toast.error(err?.message || "Failed to load licenses.");
      setLicenses([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, stateId, licenseType, uploadDate, searchQuery]);


  // Ingest URL search parameter or filter event
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const searchParam = params.get("search");
      if (searchParam) {
        setSearchQuery(searchParam);
      }
    }
    const handleFilter = (e: any) => {
      if (e.detail?.search) {
        setSearchQuery(e.detail.search);
      }
    };
    window.addEventListener("onspot:filter-licenses", handleFilter);
    return () => window.removeEventListener("onspot:filter-licenses", handleFilter);
  }, []);

  // Debounced search trigger (calls backend API)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLicenses();
    }, 350);
    return () => clearTimeout(timer);
  }, [fetchLicenses]);

  // Reset Filters
  const handleResetFilters = () => {
    setStateId("");
    setLicenseType("");
    setUploadDate("30d");
    setSearchQuery("");
    setPage(1);
  };

  // Selection handlers (uses licenses directly from API)
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(licenses.map((l) => l.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (licenses.length === 0) {
      toast.error("No licenses available to export.");
      return;
    }

    const headers = [
      "License ID",
      "License Number",
      "Type",
      "State",
      "User Name",
      "User Email",
      "Valid From",
      "Valid To",
      "Created At",
    ];

    const rows = licenses.map((item) => [
      `"${item.id}"`,
      `"${item.license_number || ""}"`,
      `"${item.license_type || ""}"`,
      `"${item.state?.state_name || item.state?.state_code || ""}"`,
      `"${getUserDisplayName(item.user)}"`,
      `"${item.user?.email || ""}"`,
      `"${item.valid_from ? new Date(item.valid_from).toLocaleDateString() : ""}"`,
      `"${item.valid_to ? new Date(item.valid_to).toLocaleDateString() : ""}"`,
      `"${item.created_at ? new Date(item.created_at).toLocaleDateString() : ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `licenses_export_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${licenses.length} licenses.`);
  };

  // Stat Card Count calculation
  const totalCount = summaryData?.total_licenses?.count ?? totalItems;
  const weeklyChange = summaryData?.total_licenses?.weekly_change ?? 0;
  const trend = summaryData?.total_licenses?.trend || "flat";
  const formattedText =
    summaryData?.total_licenses?.formatted_text ||
    `${weeklyChange >= 0 ? "+" : ""}${weeklyChange} this week`;

  return (
    <div className="space-y-6">
      {/* ===================== STAT CARDS (ONLY TOTAL LICENSE SHOWN) ===================== */}
      <section className="stats-row flex flex-wrap gap-4">
        {/* Total License Card matching exact HTML mockup */}
        <div className="stat-card bg-white rounded-[14px] p-[18px_20px] shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)] border border-[#ececec] w-full sm:w-[260px]">
          <div className="head flex items-start justify-between mb-2">
            <span className="label text-[#7D848D] text-[12px] font-medium">
              Total License
            </span>
            <span className="icon-pill w-8 h-8 text-[#1f3d2a] flex items-center justify-center">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2H2V7zm0 4h20v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6zm3 3v2h5v-2H5z" />
              </svg>
            </span>
          </div>
          <div className="value text-[26px] font-bold text-[#1f1f1f] mb-2">
            {loading ? "..." : totalCount.toLocaleString()}
          </div>
          <div
            className={`delta text-[12px] inline-flex items-center gap-1 ${
              trend === "down"
                ? "text-[#e03131]"
                : trend === "up" || weeklyChange > 0
                  ? "text-[#34A853]"
                  : "text-[#7D848D]"
            }`}
          >
            {trend === "down" ? (
              <span>&darr;{formattedText}</span>
            ) : trend === "up" || weeklyChange > 0 ? (
              <span>&uarr;{formattedText}</span>
            ) : (
              <span>&mdash; {formattedText}</span>
            )}
          </div>
        </div>
      </section>

      {/* ===================== FILTER ROW (NO VERIFICATION STATUS) ===================== */}
      <section className="filter-row flex items-center flex-wrap gap-3.5 mb-4">
        {/* State select */}
        <select
          id="filter-state"
          value={stateId}
          onChange={(e) => {
            setStateId(e.target.value);
            setPage(1);
          }}
          className="h-[38px] pl-3.5 pr-9 border border-[#e4e4df] rounded-[8px] bg-white text-[13px] text-[#4a4a4a] hover:border-[#cfcfca] focus:border-[#2D4A23] outline-none transition-colors cursor-pointer min-w-[170px]"
          style={{
            backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 12px center",
            appearance: "none",
          }}
        >
          <option value="">All States</option>
          {states.map((st) => (
            <option key={st.state_id} value={st.state_id}>
              {st.state_name} ({st.state_code})
            </option>
          ))}
        </select>

        {/* License Type select */}
        <select
          id="filter-type"
          value={licenseType}
          onChange={(e) => {
            setLicenseType(e.target.value);
            setPage(1);
          }}
          className="h-[38px] pl-3.5 pr-9 border border-[#e4e4df] rounded-[8px] bg-white text-[13px] text-[#4a4a4a] hover:border-[#cfcfca] focus:border-[#2D4A23] outline-none transition-colors cursor-pointer min-w-[160px]"
          style={{
            backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 12px center",
            appearance: "none",
          }}
        >
          <option value="">All License Types</option>
          <option value="fishing">Fishing</option>
          <option value="hunting">Hunting</option>
        </select>

        {/* Date select */}
        <select
          id="filter-date"
          value={uploadDate}
          onChange={(e) => {
            setUploadDate(e.target.value);
            setPage(1);
          }}
          className="h-[38px] pl-3.5 pr-9 border border-[#e4e4df] rounded-[8px] bg-white text-[13px] text-[#4a4a4a] hover:border-[#cfcfca] focus:border-[#2D4A23] outline-none transition-colors cursor-pointer min-w-[190px]"
          style={{
            backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 12px center",
            appearance: "none",
          }}
        >
          <option value="30d">Upload Date: Last 30 Days</option>
          <option value="7d">Upload Date: Last 7 Days</option>
          <option value="90d">Upload Date: Last 90 Days</option>
          <option value="all">All Time</option>
        </select>

        {/* Search input with HTML-style magnifying glass */}
        <div className="relative min-w-[220px] max-w-[280px]">
          <input
            type="text"
            id="filter-search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                setPage(1);
                fetchLicenses();
              }
            }}
            placeholder="Search by license #, user, email..."
            className="w-full h-[38px] pl-9 pr-8 border border-[#e4e4df] rounded-[8px] bg-white text-[13px] text-[#4a4a4a] placeholder-gray-400 hover:border-[#cfcfca] focus:border-[#2D4A23] outline-none transition-colors"
          />
          <svg
            className="w-4 h-4 text-[#7D848D] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          {loading && searchQuery ? (
            <Loader2 className="w-3.5 h-3.5 text-[#2D4A23] animate-spin absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          ) : searchQuery ? (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setPage(1);
                const topSearch = document.getElementById(
                  "top-search",
                ) as HTMLInputElement | null;
                if (topSearch) topSearch.value = "";
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>

        {/* Toolbar: Export & Reset matching HTML .lic-toolbar */}
        <div className="lic-toolbar flex items-center gap-2.5 ml-auto">
          <button
            type="button"
            id="btn-export"
            onClick={handleExportCSV}
            className="lic-tb-btn inline-flex items-center gap-2 px-4 py-[9px] bg-white border border-[#e4e4df] rounded-[8px] text-[13px] font-medium text-[#2c2c2c] hover:bg-[#f7f7f2] hover:border-[#d4d4cd] transition-colors cursor-pointer"
          >
            <span>Export</span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4 text-[#7D848D]"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>

          {(stateId ||
            licenseType ||
            uploadDate !== "30d" ||
            searchQuery) && (
            <button
              type="button"
              id="btn-filters"
              onClick={handleResetFilters}
              className="lic-tb-btn inline-flex items-center gap-2 px-4 py-[9px] bg-white border border-[#e4e4df] rounded-[8px] text-[13px] font-medium text-[#3b6bbf] hover:bg-[#f7f7f2] hover:border-[#d4d4cd] transition-colors cursor-pointer"
            >
              <span>Reset</span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 text-[#3b6bbf]"
              >
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
            </button>
          )}
        </div>
      </section>

      {/* ===================== TABLE CARD MATCHING HTML .table-card ===================== */}
      <section className="table-card bg-white rounded-[14px] p-[6px_20px_8px] shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)] border border-[#ececec]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[#ececec]">
                <th
                  style={{ width: "60px" }}
                  className="text-left py-4 px-2.5 text-[#111111] font-semibold text-[13px]"
                >
                  <input
                    type="checkbox"
                    checked={
                      licenses.length > 0 &&
                      selectedIds.length === licenses.length
                    }
                    onChange={handleSelectAll}
                    className="w-[18px] h-[18px] rounded-[4px] border-[#7D848D] accent-[#4a6b3f] cursor-pointer align-middle"
                    aria-label="Select all"
                  />
                </th>
                <th className="text-left py-4 px-2.5 text-[#111111] font-semibold text-[13px]">
                  User Name
                </th>
                <th className="text-left py-4 px-2.5 text-[#111111] font-semibold text-[13px]">
                  License #
                </th>
                <th className="text-left py-4 px-2.5 text-[#111111] font-semibold text-[13px]">
                  License Type
                </th>
                <th className="text-left py-4 px-2.5 text-[#111111] font-semibold text-[13px]">
                  State
                </th>
                <th className="text-left py-4 px-2.5 text-[#111111] font-semibold text-[13px]">
                  Upload Date
                </th>
                <th className="text-left py-4 px-2.5 text-[#111111] font-semibold text-[13px]">
                  Expiry Date
                </th>
                <th className="text-right py-4 px-2.5 text-[#111111] font-semibold text-[13px]">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody id="licenses-tbody">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr
                    key={i}
                    className="animate-pulse border-b border-[#f1f1ed]"
                  >
                    <td className="py-3.5 px-2.5 text-center">
                      <div className="w-4 h-4 bg-gray-200 rounded mx-auto" />
                    </td>
                    <td className="py-3.5 px-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full" />
                        <div className="space-y-1">
                          <div className="h-4 w-28 bg-gray-200 rounded" />
                          <div className="h-3 w-36 bg-gray-100 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-2.5">
                      <div className="h-4 w-20 bg-gray-200 rounded" />
                    </td>
                    <td className="py-3.5 px-2.5">
                      <div className="h-5 w-16 bg-gray-200 rounded-md" />
                    </td>
                    <td className="py-3.5 px-2.5">
                      <div className="h-4 w-20 bg-gray-200 rounded" />
                    </td>
                    <td className="py-3.5 px-2.5">
                      <div className="h-4 w-24 bg-gray-200 rounded" />
                    </td>
                    <td className="py-3.5 px-2.5">
                      <div className="h-4 w-24 bg-gray-200 rounded" />
                    </td>
                    <td className="py-3.5 px-2.5 text-right">
                      <div className="h-7 w-16 bg-gray-200 rounded ml-auto" />
                    </td>
                  </tr>
                ))
              ) : licenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#7D848D]">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <AlertCircle className="w-8 h-8 text-gray-300" />
                      <p className="text-[13px] font-semibold text-gray-700">
                        No licenses match your filters.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                licenses.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  const userName = getUserDisplayName(item.user);
                  const userEmail = item.user?.email || "—";
                  const avatarUrl = getProfileImageUrl(
                    item.user?.profile_picture,
                  );
                  const stateLabel =
                    item.state?.state_name || item.state?.state_code || "—";
                  const uploadFormatted = item.created_at
                    ? new Date(item.created_at).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })
                    : "—";
                  const expiryFormatted = item.valid_to
                    ? new Date(item.valid_to).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })
                    : "—";

                  const isFishing = item.license_type
                    ?.toLowerCase()
                    .includes("fish");

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-[#fbfbf8] transition-colors border-b border-[#f1f1ed] ${
                        isSelected ? "bg-[#f5efdc]/30" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-2.5 text-center align-middle">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(item.id)}
                          className="w-[18px] h-[18px] rounded-[4px] border-[#7D848D] accent-[#4a6b3f] cursor-pointer align-middle"
                        />
                      </td>

                      {/* User Cell matching HTML .user-cell */}
                      <td className="py-3.5 px-2.5 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="w-[32px] h-[32px] rounded-full bg-[#f1f1ed] text-[#4a4a4a] font-semibold flex items-center justify-center text-xs flex-shrink-0 overflow-hidden relative border border-[#e2e2dc]">
                            {avatarUrl ? (
                              <Image
                                src={avatarUrl}
                                alt={userName}
                                width={32}
                                height={32}
                                className="w-full h-full object-cover"
                                unoptimized
                              />
                            ) : (
                              userName.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-[#111111] text-[13px] truncate max-w-[150px]">
                              {userName}
                            </div>
                            <div className="text-[12px] text-[#7D848D] truncate max-w-[170px]">
                              {userEmail}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* License Number */}
                      <td className="py-3.5 px-2.5 align-middle font-mono font-medium text-[#1f1f1f]">
                        {item.license_number || "—"}
                      </td>

                      {/* License Type */}
                      <td className="py-3.5 px-2.5 align-middle">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-[5px] text-[12px] font-medium border ${
                            isFishing
                              ? "bg-[#eaf1fa] text-[#3b6bbf] border-[#cfdcef]"
                              : "bg-[#fff4d6] text-[#b58105] border-[#f1dba0]"
                          }`}
                        >
                          {item.license_type
                            ? item.license_type.charAt(0).toUpperCase() +
                              item.license_type.slice(1)
                            : "General"}
                        </span>
                      </td>

                      {/* State */}
                      <td className="py-3.5 px-2.5 align-middle text-[#111111] whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-[#7D848D]" />
                          {stateLabel}
                        </span>
                      </td>

                      {/* Upload Date */}
                      <td className="py-3.5 px-2.5 align-middle text-[#7D848D] whitespace-nowrap">
                        {uploadFormatted}
                      </td>

                      {/* Expiry Date */}
                      <td className="py-3.5 px-2.5 align-middle text-[#7D848D] whitespace-nowrap">
                        {expiryFormatted}
                      </td>

                      {/* Actions matching HTML .lic-actions */}
                      <td className="py-3.5 px-2.5 align-middle text-right whitespace-nowrap">
                        <div className="lic-actions inline-flex items-center gap-1.5 justify-end">
                          {/* HTML View icon button */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedLicense(item);
                              setViewModalOpen(true);
                            }}
                            className="lic-act-btn w-[30px] h-[30px] border border-[#e2e2dc] rounded-[7px] bg-white text-[#7D848D] hover:bg-[#f7f7f2] hover:text-[#1f1f1f] hover:border-[#d4d4cd] inline-flex items-center justify-center transition-colors cursor-pointer"
                            title="View Document"
                            aria-label="View Document"
                          >
                            <svg
                              className="w-4 h-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </button>

                          {/* Reusable Portal-based TableActionMenu with exact HTML icons */}
                          <TableActionMenu
                            menuWidth={185}
                            title="License Actions"
                            triggerClassName="!w-[30px] !h-[30px] !rounded-[7px]"
                            triggerIcon={
                              <svg
                                className="w-4 h-4"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <circle cx="12" cy="5" r="1.7" />
                                <circle cx="12" cy="12" r="1.7" />
                                <circle cx="12" cy="19" r="1.7" />
                              </svg>
                            }
                            items={[
                              {
                                label: "View Details",
                                icon: (
                                  <svg
                                    className="w-4 h-4 text-[#7D848D]"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                                    <circle cx="12" cy="12" r="3" />
                                  </svg>
                                ),
                                onClick: () => {
                                  setSelectedLicense(item);
                                  setViewModalOpen(true);
                                },
                              },
                              {
                                label: "Open Document Link",
                                icon: (
                                  <ExternalLink className="w-3.5 h-3.5 text-[#7D848D]" />
                                ),
                                show: Boolean(item.document_url),
                                onClick: () => {
                                  if (item.document_url) {
                                    window.open(item.document_url, "_blank");
                                  }
                                },
                              },
                            ]}
                          />
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

      {/* ===================== PAGINATION ===================== */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={limit}
        itemCountOnPage={licenses.length}
        itemLabel="licenses"
        onPageChange={(newPage) => setPage(newPage)}
        loading={loading}
      />

      {/* ===================== VIEW LICENSE DETAILS MODAL ===================== */}
      {viewModalOpen && selectedLicense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0E3E27] flex items-center justify-center font-bold text-lg">
                  <svg
                    className="w-5 h-5 text-[#2D4A23]"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2H2V7zm0 4h20v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6zm3 3v2h5v-2H5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    License #{selectedLicense.license_number || "N/A"}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {selectedLicense.license_type?.toUpperCase()} LICENSE •{" "}
                    {selectedLicense.state?.state_name ||
                      selectedLicense.state?.state_code ||
                      "Unknown State"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-5 space-y-6">
              {/* User Info Card */}
              <div className="bg-[#fcfcf9] border border-[#ececec] rounded-xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#f1f1ed] text-[#4a4a4a] font-semibold flex items-center justify-center text-sm flex-shrink-0 overflow-hidden relative border border-[#e2e2dc]">
                  {selectedLicense.user?.profile_picture ? (
                    <Image
                      src={getProfileImageUrl(
                        selectedLicense.user.profile_picture,
                      )}
                      alt={getUserDisplayName(selectedLicense.user)}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    getUserDisplayName(selectedLicense.user)
                      .charAt(0)
                      .toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-gray-900 text-sm">
                    {getUserDisplayName(selectedLicense.user)}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {selectedLicense.user?.email}
                  </p>
                  {selectedLicense.user?.username && (
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Username: @{selectedLicense.user.username}
                    </p>
                  )}
                </div>
              </div>

              {/* License Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-400 block mb-1">License Type</span>
                  <span className="font-semibold text-gray-800 capitalize text-[13px]">
                    {selectedLicense.license_type || "—"}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-400 block mb-1">State</span>
                  <span className="font-semibold text-gray-800 text-[13px]">
                    {selectedLicense.state?.state_name ||
                      selectedLicense.state?.state_code ||
                      "—"}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-400 block mb-1">
                    License Number
                  </span>
                  <span className="font-semibold text-gray-800 font-mono text-[13px]">
                    {selectedLicense.license_number || "—"}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-400 block mb-1">Valid From</span>
                  <span className="font-semibold text-gray-800 text-[13px]">
                    {selectedLicense.valid_from
                      ? new Date(
                          selectedLicense.valid_from,
                        ).toLocaleDateString()
                      : "—"}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-400 block mb-1">
                    Valid To (Expiry)
                  </span>
                  <span className="font-semibold text-gray-800 text-[13px]">
                    {selectedLicense.valid_to
                      ? new Date(selectedLicense.valid_to).toLocaleDateString()
                      : "—"}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-400 block mb-1">Uploaded On</span>
                  <span className="font-semibold text-gray-800 text-[13px]">
                    {selectedLicense.created_at
                      ? new Date(
                          selectedLicense.created_at,
                        ).toLocaleDateString()
                      : "—"}
                  </span>
                </div>
              </div>

              {/* Document URL Preview */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Uploaded Document
                </h4>
                {selectedLicense.document_url ? (
                  <div className="p-4 border border-[#e2e2dc] rounded-xl bg-gray-50 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 text-sm truncate">
                          License Document
                        </div>
                        <div className="text-xs text-gray-400 truncate max-w-sm">
                          {selectedLicense.document_url}
                        </div>
                      </div>
                    </div>

                    <a
                      href={selectedLicense.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-100 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Link</span>
                    </a>
                  </div>
                ) : (
                  <div className="p-6 border border-dashed border-gray-200 rounded-xl text-center text-gray-400 text-xs">
                    No document attachment was uploaded for this license.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              {selectedLicense.document_url ? (
                <a
                  href={selectedLicense.document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-[#2D4A23] hover:bg-[#22381b] text-white rounded-lg text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Document</span>
                </a>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={() => setViewModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
