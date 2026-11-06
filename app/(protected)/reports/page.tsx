"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Download,
  Filter,
  RefreshCw,
  Search,
  Calendar,
  Users,
  CreditCard,
  FileCheck2,
  Building2,
  RotateCcw,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ShieldAlert,
  ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";
import Pagination from "@/components/admin/Pagination";
import {
  getAdminReports,
  getStates,
  ReportType,
  UserReportItem,
  MembershipReportItem,
  LicenseReportItem,
  SponsorReportItem,
  MembershipsReportSummary,
  SponsorsReportSummary,
} from "@/lib/api";

type TabKey = "users" | "memberships" | "licenses" | "sponsors";

interface StateOption {
  id: string;
  name: string;
  code?: string;
}

export default function ReportsPage() {
  // Selected Tab (default to users as requested, overview ignored)
  const [activeTab, setActiveTab] = useState<TabKey>("users");

  // Common filters
  const [period, setPeriod] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  // Tab specific filters
  // Users: role, status, plan_level, state_id
  const [userRole, setUserRole] = useState<string>("all");
  const [userStatus, setUserStatus] = useState<string>("all");
  const [userPlanLevel, setUserPlanLevel] = useState<string>("all");
  const [userStateId, setUserStateId] = useState<string>("all");

  // Memberships: status, plan_level, billing_cycle
  const [membershipStatus, setMembershipStatus] = useState<string>("all");
  const [membershipPlanLevel, setMembershipPlanLevel] = useState<string>("all");
  const [membershipBillingCycle, setMembershipBillingCycle] =
    useState<string>("all");

  // Licenses: license_type, state_id, status
  const [licenseType, setLicenseType] = useState<string>("all");
  const [licenseStateId, setLicenseStateId] = useState<string>("all");
  const [licenseStatus, setLicenseStatus] = useState<string>("all");

  // Sponsors: status, plan_level
  const [sponsorStatus, setSponsorStatus] = useState<string>("all");
  const [sponsorPlanLevel, setSponsorPlanLevel] = useState<string>("all");

  // States list for state dropdowns
  const [states, setStates] = useState<StateOption[]>([]);

  // Pagination states
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  // Data states
  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);
  const [records, setRecords] = useState<any[]>([]);
  const [summaryData, setSummaryData] = useState<any>(null);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Load States for dropdowns
  useEffect(() => {
    let isMounted = true;
    getStates(1, 100)
      .then((res: any) => {
        if (!isMounted) return;
        const stateList =
          res?.data?.states ||
          res?.data?.records ||
          (Array.isArray(res?.data) ? res.data : []) ||
          (Array.isArray(res) ? res : []);
        setStates(
          stateList.map((s: any) => ({
            id: s.id || s.state_id,
            name: s.name || s.state_name || s.state,
            code: s.code || s.state_code,
          })),
        );
      })
      .catch((err) => {
        console.warn("Could not load states:", err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Helper to extract records array and pagination from dynamic backend response structures
  const parseReportResponse = (res: any) => {
    let extractedRows: any[] = [];
    let extractedPagination: any = null;
    let extractedSummary: any = null;

    // Check root level summary and pagination fields
    if (res?.summary) extractedSummary = res.summary;
    if (res?.pagination) extractedPagination = res.pagination;

    // Check top-level pagination properties: { total, totalPages, page, limit }
    const topLevelTotal =
      res?.total ?? res?.total_records ?? res?.count ?? res?.totalCount;
    const topLevelTotalPages =
      res?.totalPages ?? res?.total_pages ?? res?.pages;
    const topLevelPage = res?.page ?? res?.currentPage;
    const topLevelLimit = res?.limit ?? res?.pageSize;

    if (topLevelTotal !== undefined || topLevelTotalPages !== undefined) {
      extractedPagination = {
        total_records: topLevelTotal,
        total_pages: topLevelTotalPages,
        page: topLevelPage,
        limit: topLevelLimit,
        ...extractedPagination,
      };
    }

    if (res?.data) {
      if (Array.isArray(res.data)) {
        extractedRows = res.data;
      } else if (typeof res.data === "object") {
        if (Array.isArray(res.data.records)) extractedRows = res.data.records;
        else if (Array.isArray(res.data.items)) extractedRows = res.data.items;
        else if (Array.isArray(res.data.data)) extractedRows = res.data.data;
        else if (Array.isArray(res.data.users)) extractedRows = res.data.users;
        else if (Array.isArray(res.data.memberships))
          extractedRows = res.data.memberships;
        else if (Array.isArray(res.data.licenses))
          extractedRows = res.data.licenses;
        else if (Array.isArray(res.data.sponsors))
          extractedRows = res.data.sponsors;

        if (res.data.pagination && !extractedPagination)
          extractedPagination = res.data.pagination;
        if (res.data.summary && !extractedSummary)
          extractedSummary = res.data.summary;

        // Nested data-level pagination fallback
        const dataTotal =
          res.data.total ??
          res.data.total_records ??
          res.data.count ??
          res.data.totalCount;
        const dataTotalPages =
          res.data.totalPages ?? res.data.total_pages ?? res.data.pages;
        if (
          !extractedPagination &&
          (dataTotal !== undefined || dataTotalPages !== undefined)
        ) {
          extractedPagination = {
            total_records: dataTotal,
            total_pages: dataTotalPages,
            page: res.data.page,
            limit: res.data.limit,
          };
        }
      }
    } else if (Array.isArray(res)) {
      extractedRows = res;
    }

    return {
      records: extractedRows,
      pagination: extractedPagination,
      summary: extractedSummary,
    };
  };

  // Build filter payload
  const buildFilterParams = useCallback(
    (
      targetPage?: number,
      targetLimit?: number,
      isExportAll: boolean = false,
    ) => {
      const p: any = {
        report_type: activeTab,
      };

      if (period && period !== "all") {
        p.period = period;
      }

      if (period === "custom") {
        if (startDate) p.start_date = startDate;
        if (endDate) p.end_date = endDate;
      }

      if (debouncedSearch.trim()) {
        p.search = debouncedSearch.trim();
      }

      if (!isExportAll) {
        p.page = targetPage ?? page;
        p.limit = targetLimit ?? limit;
      }

      if (activeTab === "users") {
        if (userRole !== "all") p.role = userRole;
        if (userStatus !== "all") p.status = userStatus;
        if (userPlanLevel !== "all") p.plan_level = userPlanLevel;
        if (userStateId !== "all") p.state_id = userStateId;
      } else if (activeTab === "memberships") {
        if (membershipStatus !== "all") p.status = membershipStatus;
        if (membershipPlanLevel !== "all") p.plan_level = membershipPlanLevel;
        if (membershipBillingCycle !== "all")
          p.billing_cycle = membershipBillingCycle;
      } else if (activeTab === "licenses") {
        if (licenseType !== "all") p.license_type = licenseType;
        if (licenseStateId !== "all") p.state_id = licenseStateId;
        if (licenseStatus !== "all") p.status = licenseStatus;
      } else if (activeTab === "sponsors") {
        if (sponsorStatus !== "all") p.status = sponsorStatus;
        if (sponsorPlanLevel !== "all") p.plan_level = sponsorPlanLevel;
      }

      return p;
    },
    [
      activeTab,
      period,
      startDate,
      endDate,
      debouncedSearch,
      page,
      limit,
      userRole,
      userStatus,
      userPlanLevel,
      userStateId,
      membershipStatus,
      membershipPlanLevel,
      membershipBillingCycle,
      licenseType,
      licenseStateId,
      licenseStatus,
      sponsorStatus,
      sponsorPlanLevel,
    ],
  );

  // Fetch report data
  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildFilterParams(page, limit, false);
      const res = await getAdminReports(params);
      const { records: list, pagination, summary } = parseReportResponse(res);

      setRecords(list);
      setSummaryData(summary);

      if (pagination) {
        setTotalPages(
          pagination.total_pages ||
            Math.ceil((pagination.total_records || list.length) / limit) ||
            1,
        );
        setTotalRecords(pagination.total_records ?? list.length);
      } else {
        setTotalRecords(list.length);
        setTotalPages(Math.ceil(list.length / limit) || 1);
      }
    } catch (err: any) {
      console.error("Fetch report error:", err);
      toast.error(err?.message || "Failed to load report data.");
      setRecords([]);
      setTotalRecords(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [buildFilterParams, page, limit]);

  // Refetch when tab or filters change
  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Handle Tab Switch
  const handleTabChange = (tab: TabKey) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setPage(1);
    setSearch("");
    setDebouncedSearch("");
  };

  // Reset Filters
  const handleResetFilters = () => {
    setPeriod("all");
    setStartDate("");
    setEndDate("");
    setSearch("");
    setDebouncedSearch("");
    setUserRole("all");
    setUserStatus("all");
    setUserPlanLevel("all");
    setUserStateId("all");
    setMembershipStatus("all");
    setMembershipPlanLevel("all");
    setMembershipBillingCycle("all");
    setLicenseType("all");
    setLicenseStateId("all");
    setLicenseStatus("all");
    setSponsorStatus("all");
    setSponsorPlanLevel("all");
    setPage(1);
    toast.success("Filters reset to default.");
  };

  // ================= CSV & EXCEL EXPORT HELPERS ================= //

  const getExportHeadersAndRows = (dataRows: any[], type: TabKey) => {
    if (type === "users") {
      const headers = [
        "User ID",
        "First Name",
        "Last Name",
        "Display Name",
        "Username",
        "Email",
        "Phone",
        "Role",
        "State",
        "City",
        "Status",
        "Membership Level",
        "Hunter",
        "Fisherman",
        "Joined Date",
        "Last Activity",
      ];
      const rows = dataRows.map((u: UserReportItem) => [
        u.user_id || "",
        u.first_name || "",
        u.last_name || "",
        u.display_name || "",
        u.username || "",
        u.email || "",
        u.phone || "",
        u.role || "",
        u.state || u.state_code || "",
        u.city || "",
        u.status || "",
        u.membership_level || (u.has_membership ? "Active" : "free"),
        u.is_hunter ? "Yes" : "No",
        u.is_fisherman ? "Yes" : "No",
        u.joined_date ? new Date(u.joined_date).toLocaleDateString() : "",
        u.last_activity_at
          ? new Date(u.last_activity_at).toLocaleString()
          : "Never",
      ]);
      return { headers, rows };
    }

    if (type === "memberships") {
      const headers = [
        "Membership ID",
        "User ID",
        "User Name",
        "Email",
        "Membership Plan",
        "Plan Level",
        "Billing Cycle",
        "Status",
        "Monthly Rate ($)",
        "Yearly Rate ($)",
        "Start Date",
        "End Date",
        "Has Saved Card",
        "Trial Active",
        "Created Date",
      ];
      const rows = dataRows.map((m: MembershipReportItem) => [
        m.user_membership_id || "",
        m.user_id || "",
        m.user_name || "",
        m.email || "",
        m.membership_name || "",
        m.membership_level || "",
        m.billing_cycle || "",
        m.status || "",
        m.monthly_price !== undefined ? Number(m.monthly_price).toFixed(2) : "",
        m.yearly_price !== undefined ? Number(m.yearly_price).toFixed(2) : "",
        m.start_date ? new Date(m.start_date).toLocaleDateString() : "",
        m.end_date
          ? new Date(m.end_date).toLocaleDateString()
          : "Active (Ongoing)",
        m.has_saved_card ? "Yes" : "No",
        m.trial_start_date && !m.is_trial_expired ? "Trial Active" : "No",
        m.created_at ? new Date(m.created_at).toLocaleDateString() : "",
      ]);
      return { headers, rows };
    }

    if (type === "licenses") {
      const headers = [
        "License ID",
        "Holder Name",
        "Holder Email",
        "License Number",
        "Type",
        "State",
        "Valid From",
        "Expiry Date",
        "Status",
        "Membership Tier",
        "Upload Date",
      ];
      const rows = dataRows.map((l: LicenseReportItem) => [
        l.license_id || "",
        l.user_name || "",
        l.email || "",
        l.license_number || "",
        l.license_type || "",
        l.state_name || l.state_code || "",
        l.valid_from ? new Date(l.valid_from).toLocaleDateString() : "-",
        l.expiry_date ? new Date(l.expiry_date).toLocaleDateString() : "",
        l.status || "",
        l.user_membership || "",
        l.upload_date ? new Date(l.upload_date).toLocaleDateString() : "",
      ]);
      return { headers, rows };
    }

    // sponsors
    const headers = [
      "Sponsor ID",
      "Sponsor Name",
      "Company Email",
      "Discount Offer",
      "Website",
      "Status",
      "Submitter Name",
      "Submitter Email",
      "Submitter Tier",
      "Free with Plan",
      "Submission Date",
    ];
    const rows = dataRows.map((s: SponsorReportItem) => [
      s.sponsor_id || "",
      s.sponsor_name || "",
      s.company_email || "",
      s.company_discount || "",
      s.website_link || "",
      s.status || "",
      s.user_name || "Admin Direct",
      s.user_email || "",
      s.user_membership_level || "Admin",
      s.is_sponsorship_free_with_plan ? "Yes" : "No",
      s.created_at ? new Date(s.created_at).toLocaleDateString() : "",
    ]);
    return { headers, rows };
  };

  // Fetch full data for export if current page doesn't have all records
  const getFullDataForExport = async (): Promise<any[]> => {
    // If the API doc states "If page & limit omitted, returns ALL records"
    try {
      const exportParams = buildFilterParams(undefined, undefined, true);
      const res = await getAdminReports(exportParams);
      const { records: exportRows } = parseReportResponse(res);
      if (exportRows && exportRows.length > 0) {
        return exportRows;
      }
    } catch (err) {
      console.warn(
        "Export full dataset request failed, using visible page rows:",
        err,
      );
    }
    return records;
  };

  const handleExportExcel = async () => {
    if (records.length === 0) {
      toast.error("No report data available to export.");
      return;
    }

    setExporting(true);
    const toastId = toast.loading("Generating Excel workbook export...");

    try {
      const dataToExport = await getFullDataForExport();
      const { headers, rows } = getExportHeadersAndRows(
        dataToExport,
        activeTab,
      );

      // Construct native Excel XML (.xls spreadsheet compatible with Excel)
      let xml = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>\r\n`;
      xml += `<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\r\n`;
      xml += ` xmlns:o="urn:schemas-microsoft-com:office:office"\r\n`;
      xml += ` xmlns:x="urn:schemas-microsoft-com:office:excel"\r\n`;
      xml += ` xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"\r\n`;
      xml += ` xmlns:html="http://www.w3.org/TR/REC-html40">\r\n`;
      xml += ` <Worksheet ss:Name="${activeTab.toUpperCase()}_REPORT">\r\n`;
      xml += `  <Table>\r\n`;

      // Header row
      xml += `   <Row>\r\n`;
      headers.forEach((h) => {
        xml += `    <Cell><Data ss:Type="String">${escapeXml(h)}</Data></Cell>\r\n`;
      });
      xml += `   </Row>\r\n`;

      // Data rows
      rows.forEach((row) => {
        xml += `   <Row>\r\n`;
        row.forEach((cell) => {
          const valStr = String(cell ?? "");
          const isNum = !isNaN(Number(valStr)) && valStr.trim() !== "";
          const dataType = isNum ? "Number" : "String";

          xml += `    <Cell><Data ss:Type="${dataType}">${escapeXml(valStr)}</Data></Cell>\r\n`;
        });
        xml += `   </Row>\r\n`;
      });

      xml += `  </Table>\r\n`;
      xml += ` </Worksheet>\r\n`;
      xml += `</Workbook>\r\n`;

      const blob = new Blob([xml], {
        type: "application/vnd.ms-excel;charset=utf-8",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `onspot_report_${activeTab}_${new Date().toISOString().slice(0, 10)}.xls`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(
        `Successfully exported ${dataToExport.length} ${activeTab} records as Excel.`,
        {
          id: toastId,
        },
      );
    } catch (err: any) {
      toast.error(err?.message || "Failed to export Excel.", {
        id: toastId,
      });
    } finally {
      setExporting(false);
    }
  };

  const escapeXml = (unsafe: string) => {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  };

  // Status Badge UI Helper
  const renderStatusBadge = (status?: string) => {
    if (!status) return <span className="text-gray-400">-</span>;
    const s = status.toLowerCase();
    if (s === "active" || s === "approved" || s === "valid") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#eef7ee] text-[#1e6b37] border border-[#d2edd2]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1e6b37]" />
          {status}
        </span>
      );
    }
    if (s === "pending" || s === "expiring_soon") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#fff8eb] text-[#b46900] border border-[#ffe0b2]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#b46900]" />
          {status}
        </span>
      );
    }
    if (
      s === "rejected" ||
      s === "expired" ||
      s === "canceled" ||
      s === "suspended"
    ) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#fdf2f2] text-[#be123c] border border-[#fecdd3]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#be123c]" />
          {status}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-700 border border-gray-200">
        {status}
      </span>
    );
  };

  // Plan Level Badge
  const renderPlanBadge = (level?: string) => {
    if (!level) return <span className="text-gray-400">-</span>;
    const l = level.toLowerCase();
    if (l === "premium") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#f5ecfc] text-[#6b21a8] border border-[#e9d5ff]">
          Premium
        </span>
      );
    }
    if (l === "basic") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#e0f2fe] text-[#0369a1] border border-[#bae6fd]">
          Basic
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
        Free
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ===================== PAGE HEADER & TAB NAVIGATION ===================== */}
      <div className="bg-white rounded-[14px] p-6 border border-[#ececec] shadow-[0_6px_20px_rgba(60,60,60,0.06),0_2px_6px_rgba(60,60,60,0.04)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#1f1f1f] tracking-tight">
              Admin Reports & Auditing
            </h1>
            <p className="text-sm text-[#7D848D] mt-1">
              Detailed domain-wise operational reports with real-time filters
              and comprehensive tabular exports.
            </p>
          </div>

          {/* Export Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleExportExcel}
              disabled={exporting || loading || records.length === 0}
              className="h-[38px] px-3.5 bg-[#1f3d2a] hover:bg-[#162d1f] disabled:opacity-50 text-white text-[13px] font-medium rounded-[8px] inline-flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              title="Export filtered records as Excel (.xls)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        {/* Tab Selection Navigation */}
        <div className="flex items-center gap-2 border-b border-[#ededed] mt-6 overflow-x-auto scrollbar-none">
          <button
            onClick={() => handleTabChange("users")}
            className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 transition-colors relative whitespace-nowrap cursor-pointer ${
              activeTab === "users"
                ? "text-[#1f3d2a] border-b-2 border-[#1f3d2a]"
                : "text-[#666] hover:text-[#222]"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Users Report</span>
          </button>

          <button
            onClick={() => handleTabChange("memberships")}
            className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 transition-colors relative whitespace-nowrap cursor-pointer ${
              activeTab === "memberships"
                ? "text-[#1f3d2a] border-b-2 border-[#1f3d2a]"
                : "text-[#666] hover:text-[#222]"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Memberships Report</span>
          </button>

          <button
            onClick={() => handleTabChange("licenses")}
            className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 transition-colors relative whitespace-nowrap cursor-pointer ${
              activeTab === "licenses"
                ? "text-[#1f3d2a] border-b-2 border-[#1f3d2a]"
                : "text-[#666] hover:text-[#222]"
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Licenses Report</span>
          </button>

          <button
            onClick={() => handleTabChange("sponsors")}
            className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 transition-colors relative whitespace-nowrap cursor-pointer ${
              activeTab === "sponsors"
                ? "text-[#1f3d2a] border-b-2 border-[#1f3d2a]"
                : "text-[#666] hover:text-[#222]"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Sponsors Report</span>
          </button>
        </div>
      </div>

      {/* ===================== SUMMARY KPI STATS (WHEN RETURNED) ===================== */}
      {activeTab === "memberships" && summaryData && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-4 rounded-[12px] border border-[#ececec] shadow-xs">
            <span className="text-[11px] font-medium text-[#7D848D] uppercase tracking-wider block">
              Active Subscribers
            </span>
            <span className="text-xl font-bold text-[#1f3d2a] mt-1 block">
              {summaryData.active_subscribers ?? 0}
            </span>
          </div>
          <div className="bg-white p-4 rounded-[12px] border border-[#ececec] shadow-xs">
            <span className="text-[11px] font-medium text-[#7D848D] uppercase tracking-wider block">
              Monthly Recurring Revenue
            </span>
            <span className="text-xl font-bold text-[#1f3d2a] mt-1 block">
              $
              {Number(
                summaryData.monthly_recurring_revenue || 0,
              ).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="bg-white p-4 rounded-[12px] border border-[#ececec] shadow-xs">
            <span className="text-[11px] font-medium text-[#7D848D] uppercase tracking-wider block">
              Annual Recurring Revenue
            </span>
            <span className="text-xl font-bold text-[#1f3d2a] mt-1 block">
              $
              {Number(summaryData.annual_recurring_revenue || 0).toLocaleString(
                undefined,
                { minimumFractionDigits: 2 },
              )}
            </span>
          </div>
          <div className="bg-white p-4 rounded-[12px] border border-[#ececec] shadow-xs">
            <span className="text-[11px] font-medium text-[#7D848D] uppercase tracking-wider block">
              Churn Rate
            </span>
            <span className="text-xl font-bold text-rose-600 mt-1 block">
              {Number(summaryData.churn_rate_percentage || 0).toFixed(1)}%
            </span>
          </div>
          <div className="bg-white p-4 rounded-[12px] border border-[#ececec] shadow-xs">
            <span className="text-[11px] font-medium text-[#7D848D] uppercase tracking-wider block">
              Active Trials
            </span>
            <span className="text-xl font-bold text-amber-600 mt-1 block">
              {summaryData.active_trials ?? 0}
            </span>
          </div>
          <div className="bg-white p-4 rounded-[12px] border border-[#ececec] shadow-xs">
            <span className="text-[11px] font-medium text-[#7D848D] uppercase tracking-wider block">
              Total
            </span>
            <span className="text-xl font-bold text-[#2c2c2c] mt-1 block">
              {summaryData.total_records ?? totalRecords}
            </span>
          </div>
        </div>
      )}

      {activeTab === "sponsors" && summaryData && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-4 rounded-[12px] border border-[#ececec] shadow-xs">
            <span className="text-[11px] font-medium text-[#7D848D] uppercase tracking-wider block">
              Total Sponsors
            </span>
            <span className="text-xl font-bold text-[#1f3d2a] mt-1 block">
              {summaryData.total_sponsors ?? totalRecords}
            </span>
          </div>
          <div className="bg-white p-4 rounded-[12px] border border-[#ececec] shadow-xs">
            <span className="text-[11px] font-medium text-[#7D848D] uppercase tracking-wider block">
              Pending Review
            </span>
            <span className="text-xl font-bold text-amber-600 mt-1 block">
              {summaryData.pending_sponsors ?? 0}
            </span>
          </div>
          <div className="bg-white p-4 rounded-[12px] border border-[#ececec] shadow-xs">
            <span className="text-[11px] font-medium text-[#7D848D] uppercase tracking-wider block">
              Approved Deals
            </span>
            <span className="text-xl font-bold text-emerald-600 mt-1 block">
              {summaryData.approved_sponsors ?? 0}
            </span>
          </div>
          <div className="bg-white p-4 rounded-[12px] border border-[#ececec] shadow-xs">
            <span className="text-[11px] font-medium text-[#7D848D] uppercase tracking-wider block">
              From Premium
            </span>
            <span className="text-xl font-bold text-[#6b21a8] mt-1 block">
              {summaryData.sponsors_from_premium ?? 0}
            </span>
          </div>
          <div className="bg-white p-4 rounded-[12px] border border-[#ececec] shadow-xs">
            <span className="text-[11px] font-medium text-[#7D848D] uppercase tracking-wider block">
              From Basic
            </span>
            <span className="text-xl font-bold text-[#0369a1] mt-1 block">
              {summaryData.sponsors_from_basic ?? 0}
            </span>
          </div>
          <div className="bg-white p-4 rounded-[12px] border border-[#ececec] shadow-xs">
            <span className="text-[11px] font-medium text-[#7D848D] uppercase tracking-wider block">
              From Free
            </span>
            <span className="text-xl font-bold text-gray-600 mt-1 block">
              {summaryData.sponsors_from_free ?? 0}
            </span>
          </div>
        </div>
      )}

      {/* ===================== TAB-WISE COMPREHENSIVE FILTER BAR ===================== */}
      <section className="bg-white rounded-[14px] p-5 border border-[#ececec] shadow-[0_6px_20px_rgba(60,60,60,0.06),0_2px_6px_rgba(60,60,60,0.04)]">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#f0f0f0]">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#1f3d2a]" />
            <h2 className="text-sm font-semibold text-[#222]">
              Filter {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}{" "}
              Report
            </h2>
          </div>
          <button
            onClick={handleResetFilters}
            className="text-[12px] font-medium text-[#666] hover:text-[#1f3d2a] flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
          {/* Search Box */}
          <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-2 md:col-span-1">
            <label className="text-[12px] font-medium text-[#444]">
              Search Query
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={
                  activeTab === "users"
                    ? "Name, email, username..."
                    : activeTab === "memberships"
                      ? "Name or email..."
                      : activeTab === "licenses"
                        ? "License #, name, email..."
                        : "Sponsor or email..."
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-[38px] pl-9 pr-3 text-[13px] bg-white border border-[#e4e4df] rounded-[8px] focus:outline-hidden focus:ring-1 focus:ring-[#1f3d2a] focus:border-[#1f3d2a] transition-colors"
              />
              <Search className="w-4 h-4 text-[#888] absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Timeframe Period */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-[#444]">
              Timeframe
            </label>
            <select
              value={period}
              onChange={(e) => {
                setPeriod(e.target.value);
                setPage(1);
              }}
              className="h-[38px] px-3 text-[13px] bg-white border border-[#e4e4df] rounded-[8px] focus:outline-hidden focus:ring-1 focus:ring-[#1f3d2a] focus:border-[#1f3d2a] transition-colors cursor-pointer"
            >
              <option value="all">All Time (Default)</option>
              <option value="7d">Last 7 Days</option>
              <option value="15d">Last 15 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="1y">Last 1 Year</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {/* Custom Date Range if selected */}
          {period === "custom" && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[#444]">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                  className="h-[38px] px-3 text-[13px] bg-white border border-[#e4e4df] rounded-[8px] focus:outline-hidden focus:ring-1 focus:ring-[#1f3d2a] focus:border-[#1f3d2a]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[#444]">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                  className="h-[38px] px-3 text-[13px] bg-white border border-[#e4e4df] rounded-[8px] focus:outline-hidden focus:ring-1 focus:ring-[#1f3d2a] focus:border-[#1f3d2a]"
                />
              </div>
            </>
          )}

          {/* TAB 1: USERS FILTERS */}
          {activeTab === "users" && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[#444]">
                  User Role
                </label>
                <select
                  value={userRole}
                  onChange={(e) => {
                    setUserRole(e.target.value);
                    setPage(1);
                  }}
                  className="h-[38px] px-3 text-[13px] bg-white border border-[#e4e4df] rounded-[8px] focus:outline-hidden focus:ring-1 focus:ring-[#1f3d2a] focus:border-[#1f3d2a] cursor-pointer"
                >
                  <option value="all">All Roles</option>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="dnr">DNR Officer</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[#444]">
                  Account Status
                </label>
                <select
                  value={userStatus}
                  onChange={(e) => {
                    setUserStatus(e.target.value);
                    setPage(1);
                  }}
                  className="h-[38px] px-3 text-[13px] bg-white border border-[#e4e4df] rounded-[8px] focus:outline-hidden focus:ring-1 focus:ring-[#1f3d2a] focus:border-[#1f3d2a] cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[#444]">
                  Plan Tier
                </label>
                <select
                  value={userPlanLevel}
                  onChange={(e) => {
                    setUserPlanLevel(e.target.value);
                    setPage(1);
                  }}
                  className="h-[38px] px-3 text-[13px] bg-white border border-[#e4e4df] rounded-[8px] focus:outline-hidden focus:ring-1 focus:ring-[#1f3d2a] focus:border-[#1f3d2a] cursor-pointer"
                >
                  <option value="all">All Tiers</option>
                  <option value="free">Free</option>
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[#444]">
                  State
                </label>
                <select
                  value={userStateId}
                  onChange={(e) => {
                    setUserStateId(e.target.value);
                    setPage(1);
                  }}
                  className="h-[38px] px-3 text-[13px] bg-white border border-[#e4e4df] rounded-[8px] focus:outline-hidden focus:ring-1 focus:ring-[#1f3d2a] focus:border-[#1f3d2a] cursor-pointer"
                >
                  <option value="all">All States</option>
                  {states.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} {st.code ? `(${st.code})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* TAB 2: MEMBERSHIPS FILTERS */}
          {activeTab === "memberships" && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[#444]">
                  Membership Status
                </label>
                <select
                  value={membershipStatus}
                  onChange={(e) => {
                    setMembershipStatus(e.target.value);
                    setPage(1);
                  }}
                  className="h-[38px] px-3 text-[13px] bg-white border border-[#e4e4df] rounded-[8px] focus:outline-hidden focus:ring-1 focus:ring-[#1f3d2a] focus:border-[#1f3d2a] cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[#444]">
                  Plan Tier
                </label>
                <select
                  value={membershipPlanLevel}
                  onChange={(e) => {
                    setMembershipPlanLevel(e.target.value);
                    setPage(1);
                  }}
                  className="h-[38px] px-3 text-[13px] bg-white border border-[#e4e4df] rounded-[8px] focus:outline-hidden focus:ring-1 focus:ring-[#1f3d2a] focus:border-[#1f3d2a] cursor-pointer"
                >
                  <option value="all">All Tiers</option>
                  <option value="free">Free</option>
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[#444]">
                  Billing Cycle
                </label>
                <select
                  value={membershipBillingCycle}
                  onChange={(e) => {
                    setMembershipBillingCycle(e.target.value);
                    setPage(1);
                  }}
                  className="h-[38px] px-3 text-[13px] bg-white border border-[#e4e4df] rounded-[8px] focus:outline-hidden focus:ring-1 focus:ring-[#1f3d2a] focus:border-[#1f3d2a] cursor-pointer"
                >
                  <option value="all">All Billing Cycles</option>
                  <option value="monthly">Monthly</option>
                  <option value="annually">Annually</option>
                </select>
              </div>
            </>
          )}

          {/* TAB 3: LICENSES FILTERS */}
          {activeTab === "licenses" && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[#444]">
                  License Type
                </label>
                <select
                  value={licenseType}
                  onChange={(e) => {
                    setLicenseType(e.target.value);
                    setPage(1);
                  }}
                  className="h-[38px] px-3 text-[13px] bg-white border border-[#e4e4df] rounded-[8px] focus:outline-hidden focus:ring-1 focus:ring-[#1f3d2a] focus:border-[#1f3d2a] cursor-pointer"
                >
                  <option value="all">All Types</option>
                  <option value="hunting">Hunting</option>
                  <option value="fishing">Fishing</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[#444]">
                  Expiry Status
                </label>
                <select
                  value={licenseStatus}
                  onChange={(e) => {
                    setLicenseStatus(e.target.value);
                    setPage(1);
                  }}
                  className="h-[38px] px-3 text-[13px] bg-white border border-[#e4e4df] rounded-[8px] focus:outline-hidden focus:ring-1 focus:ring-[#1f3d2a] focus:border-[#1f3d2a] cursor-pointer"
                >
                  <option value="all">All Expiry Statuses</option>
                  <option value="valid">Valid</option>
                  <option value="expiring_soon">Expiring Soon (30d)</option>
                  <option value="expired">Expired</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[#444]">
                  State
                </label>
                <select
                  value={licenseStateId}
                  onChange={(e) => {
                    setLicenseStateId(e.target.value);
                    setPage(1);
                  }}
                  className="h-[38px] px-3 text-[13px] bg-white border border-[#e4e4df] rounded-[8px] focus:outline-hidden focus:ring-1 focus:ring-[#1f3d2a] focus:border-[#1f3d2a] cursor-pointer"
                >
                  <option value="all">All States</option>
                  {states.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} {st.code ? `(${st.code})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* TAB 4: SPONSORS FILTERS */}
          {activeTab === "sponsors" && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[#444]">
                  Approval Status
                </label>
                <select
                  value={sponsorStatus}
                  onChange={(e) => {
                    setSponsorStatus(e.target.value);
                    setPage(1);
                  }}
                  className="h-[38px] px-3 text-[13px] bg-white border border-[#e4e4df] rounded-[8px] focus:outline-hidden focus:ring-1 focus:ring-[#1f3d2a] focus:border-[#1f3d2a] cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[#444]">
                  Submitter Tier
                </label>
                <select
                  value={sponsorPlanLevel}
                  onChange={(e) => {
                    setSponsorPlanLevel(e.target.value);
                    setPage(1);
                  }}
                  className="h-[38px] px-3 text-[13px] bg-white border border-[#e4e4df] rounded-[8px] focus:outline-hidden focus:ring-1 focus:ring-[#1f3d2a] focus:border-[#1f3d2a] cursor-pointer"
                >
                  <option value="all">All Submitter Tiers</option>
                  <option value="free">Free</option>
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
            </>
          )}

          {/* Refresh Action */}
          <div className="flex items-end">
            <button
              onClick={() => fetchReport()}
              disabled={loading}
              className="h-[38px] w-full px-4 bg-[#f8f9fa] hover:bg-[#eef1f2] border border-[#e4e4df] rounded-[8px] text-[13px] font-medium text-[#2c2c2c] inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#1f3d2a]" : ""}`}
              />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </section>

      {/* ===================== TABULAR DATA TABLE VIEW ===================== */}
      <section className="bg-white rounded-[14px] border border-[#ececec] shadow-[0_6px_20px_rgba(60,60,60,0.06),0_2px_6px_rgba(60,60,60,0.04)] overflow-hidden">
        {/* Table summary header */}
        <div className="p-4 sm:px-6 border-b border-[#f0f0f0] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#1f1f1f]">
              {activeTab === "users" && "User Directory Report"}
              {activeTab === "memberships" && "Membership Subscription Audits"}
              {activeTab === "licenses" && "Hunting & Fishing Licenses"}
              {activeTab === "sponsors" && "Sponsorship Deals Overview"}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#f1f3f1] text-[#1f3d2a] font-medium">
              {totalRecords} Total
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-[#777]">
              Page {page} of {totalPages || 1}
            </span>
          </div>
        </div>

        {/* Responsive Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            {/* 1. USERS TABLE */}
            {activeTab === "users" && (
              <>
                <thead className="bg-[#fafafa] border-b border-[#ececec]">
                  <tr className="text-[12px] font-semibold text-[#555] uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">User</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Location</th>
                    <th className="py-3.5 px-4">Plan / Tier</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 sm:px-6">Joined Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f2f2f2] text-[13px] text-[#2c2c2c]">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-12 text-center text-sm text-[#777]"
                      >
                        <RefreshCw className="w-5 h-5 animate-spin inline-block mr-2 text-[#1f3d2a]" />
                        Loading user reports...
                      </td>
                    </tr>
                  ) : records.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-12 text-center text-sm text-[#888]"
                      >
                        No user report records found matching the active
                        filters.
                      </td>
                    </tr>
                  ) : (
                    records.map((u: UserReportItem, idx: number) => {
                      const fullName =
                        `${u.first_name || ""} ${u.last_name || ""}`.trim() ||
                        u.display_name;
                      ("User");
                      return (
                        <tr
                          key={u.user_id || idx}
                          className="hover:bg-[#fbfbfb] transition-colors"
                        >
                          <td className="py-3.5 px-4 sm:px-6">
                            <div className="flex flex-col">
                              <span className="font-semibold text-[#1f1f1f]">
                                {fullName}
                              </span>
                              <span className="text-[12px] text-[#666]">
                                {u.email}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-[#444] uppercase">
                              {u.role || "user"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col">
                              <span className="font-medium text-[#333]">
                                {u.state || u.state_code || "—"}
                              </span>
                              {u.city && (
                                <span className="text-[11px] text-[#777]">
                                  {u.city}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            {renderPlanBadge(u.membership_level || "n/a")}
                          </td>
                          <td className="py-3.5 px-4">
                            {renderStatusBadge(u.status)}
                          </td>

                          <td className="py-3.5 px-4 sm:px-6">
                            <div className="flex flex-col">
                              <span>
                                {u.joined_date
                                  ? new Date(u.joined_date).toLocaleDateString()
                                  : "—"}
                              </span>
                              {u.last_activity_at && (
                                <span className="text-[11px] text-[#888]">
                                  Active:{" "}
                                  {new Date(
                                    u.last_activity_at,
                                  ).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </>
            )}

            {/* 2. MEMBERSHIPS TABLE */}
            {activeTab === "memberships" && (
              <>
                <thead className="bg-[#fafafa] border-b border-[#ececec]">
                  <tr className="text-[12px] font-semibold text-[#555] uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">Subscriber</th>
                    <th className="py-3.5 px-4">Plan Name</th>
                    <th className="py-3.5 px-4">Tier</th>
                    <th className="py-3.5 px-4">Billing Cycle</th>
                    <th className="py-3.5 px-4">Pricing</th>
                    <th className="py-3.5 px-4">Status</th>
                    {/* <th className="py-3.5 px-4">Valid Period</th> */}
                    <th className="py-3.5 px-4 sm:px-6">Trial Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f2f2f2] text-[13px] text-[#2c2c2c]">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-12 text-center text-sm text-[#777]"
                      >
                        <RefreshCw className="w-5 h-5 animate-spin inline-block mr-2 text-[#1f3d2a]" />
                        Loading membership audits...
                      </td>
                    </tr>
                  ) : records.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-12 text-center text-sm text-[#888]"
                      >
                        No membership records found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    records.map((m: MembershipReportItem, idx: number) => {
                      return (
                        <tr
                          key={m.user_membership_id || idx}
                          className="hover:bg-[#fbfbfb] transition-colors"
                        >
                          <td className="py-3.5 px-4 sm:px-6">
                            <div className="flex flex-col">
                              <span className="font-semibold text-[#1f1f1f]">
                                {m.user_name || "Subscriber"}
                              </span>
                              <span className="text-[12px] text-[#666]">
                                {m.email}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-medium text-[#222]">
                              {m.membership_name || "Standard Membership"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {renderPlanBadge(m.membership_level)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-medium bg-[#f0f4f8] text-[#1e3a5f] capitalize">
                              {m.billing_cycle || "monthly"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-[#1f3d2a]">
                              {m.billing_cycle === "annually"
                                ? `$${Number(m.yearly_price || 0).toFixed(2)}/yr`
                                : `$${Number(m.monthly_price || 0).toFixed(2)}/mo`}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {renderStatusBadge(m.status)}
                          </td>
                          {/* <td className="py-3.5 px-4">
                            <div className="flex flex-col text-[12px]">
                              <span>
                                Start:{" "}
                                {m.start_date
                                  ? new Date(m.start_date).toLocaleDateString()
                                  : "—"}
                              </span>
                              <span className="text-[#888]">
                                End:{" "}
                                {m.end_date
                                  ? new Date(m.end_date).toLocaleDateString()
                                  : "Ongoing"}
                              </span>
                            </div>
                          </td> */}
                          <td className="py-3.5 px-4 sm:px-6">
                            {m.trial_start_date ? (
                              m.is_trial_expired ? (
                                <span className="text-[11px] text-[#888]">
                                  Trial Concluded
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[11px] font-medium border border-amber-200">
                                  Trial Active (ends{" "}
                                  {new Date(
                                    m.trial_end_date!,
                                  ).toLocaleDateString()}
                                  )
                                </span>
                              )
                            ) : (
                              <span className="text-gray-400 text-xs">n/a</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </>
            )}

            {/* 3. LICENSES TABLE */}
            {activeTab === "licenses" && (
              <>
                <thead className="bg-[#fafafa] border-b border-[#ececec]">
                  <tr className="text-[12px] font-semibold text-[#555] uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">Holder</th>
                    <th className="py-3.5 px-4">License #</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">State</th>
                    <th className="py-3.5 px-4">Expiry Status</th>
                    <th className="py-3.5 px-4">Validity Range</th>
                    <th className="py-3.5 px-4 sm:px-6">Uploaded</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f2f2f2] text-[13px] text-[#2c2c2c]">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-12 text-center text-sm text-[#777]"
                      >
                        <RefreshCw className="w-5 h-5 animate-spin inline-block mr-2 text-[#1f3d2a]" />
                        Loading licenses report...
                      </td>
                    </tr>
                  ) : records.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-12 text-center text-sm text-[#888]"
                      >
                        No licenses found matching the selected filters.
                      </td>
                    </tr>
                  ) : (
                    records.map((l: LicenseReportItem, idx: number) => {
                      return (
                        <tr
                          key={l.license_id || idx}
                          className="hover:bg-[#fbfbfb] transition-colors"
                        >
                          <td className="py-3.5 px-4 sm:px-6">
                            <div className="flex flex-col">
                              <span className="font-semibold text-[#1f1f1f]">
                                {l.user_name || "Holder"}
                              </span>
                              <span className="text-[12px] text-[#666]">
                                {l.email}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-mono text-[12px] font-medium bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                              {l.license_number || "—"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium capitalize ${
                                l.license_type?.toLowerCase() === "hunting"
                                  ? "bg-amber-50 text-amber-900 border border-amber-200"
                                  : "bg-blue-50 text-blue-900 border border-blue-200"
                              }`}
                            >
                              {l.license_type || "hunting"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-medium text-[#333]">
                              {l.state_name || l.state_code || "—"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {renderStatusBadge(l.status)}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col text-[12px]">
                              <span className="font-medium text-[#222]">
                                Expires:{" "}
                                {l.expiry_date
                                  ? new Date(l.expiry_date).toLocaleDateString()
                                  : "—"}
                              </span>
                              {l.valid_from && (
                                <span className="text-[#888]">
                                  From:{" "}
                                  {new Date(l.valid_from).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 sm:px-6">
                            <span className="text-[12px] text-[#666]">
                              {l.upload_date
                                ? new Date(l.upload_date).toLocaleDateString()
                                : "—"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </>
            )}

            {/* 4. SPONSORS TABLE */}
            {activeTab === "sponsors" && (
              <>
                <thead className="bg-[#fafafa] border-b border-[#ececec]">
                  <tr className="text-[12px] font-semibold text-[#555] uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">Sponsor / Company</th>
                    <th className="py-3.5 px-4">Discount Code / Offer</th>
                    <th className="py-3.5 px-4">Website</th>
                    <th className="py-3.5 px-4">Review Status</th>
                    <th className="py-3.5 px-4">Submitted By</th>
                    <th className="py-3.5 px-4">Submitter Tier</th>
                    <th className="py-3.5 px-4 sm:px-6">Submitted At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f2f2f2] text-[13px] text-[#2c2c2c]">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-12 text-center text-sm text-[#777]"
                      >
                        <RefreshCw className="w-5 h-5 animate-spin inline-block mr-2 text-[#1f3d2a]" />
                        Loading sponsorship reports...
                      </td>
                    </tr>
                  ) : records.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-12 text-center text-sm text-[#888]"
                      >
                        No sponsor reports found matching the criteria.
                      </td>
                    </tr>
                  ) : (
                    records.map((s: SponsorReportItem, idx: number) => {
                      return (
                        <tr
                          key={s.sponsor_id || idx}
                          className="hover:bg-[#fbfbfb] transition-colors"
                        >
                          <td className="py-3.5 px-4 sm:px-6">
                            <div className="flex flex-col">
                              <span className="font-semibold text-[#1f1f1f]">
                                {s.sponsor_name}
                              </span>
                              <span className="text-[12px] text-[#666]">
                                {s.company_email}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex px-2 py-0.5 rounded font-mono text-[12px] bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {s.company_discount || "Standard Partner"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {s.website_link ? (
                              <a
                                href={
                                  s.website_link.startsWith("http")
                                    ? s.website_link
                                    : `https://${s.website_link}`
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="text-[12px] text-blue-600 hover:underline max-w-[150px] truncate block"
                              >
                                {s.website_link}
                              </a>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            {renderStatusBadge(s.status)}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col">
                              <span className="font-medium text-[#222]">
                                {s.user_name || "Admin Direct"}
                              </span>
                              {s.user_email && (
                                <span className="text-[11px] text-[#777]">
                                  {s.user_email}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              {renderPlanBadge(s.user_membership_level)}
                              {s.is_sponsorship_free_with_plan && (
                                <span className="text-[10px] bg-green-100 text-green-800 px-1 py-0.5 rounded">
                                  Free Perk
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 sm:px-6">
                            <span className="text-[12px] text-[#666]">
                              {s.created_at
                                ? new Date(s.created_at).toLocaleDateString()
                                : "—"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </>
            )}
          </table>
        </div>
      </section>
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalRecords}
        pageSize={limit}
        itemCountOnPage={records.length}
        itemLabel={activeTab}
        onPageChange={(p) => setPage(p)}
      />
    </div>
  );
}
