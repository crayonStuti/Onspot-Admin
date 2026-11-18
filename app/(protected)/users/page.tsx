"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  AlertCircle,
  X,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  MapPin,
  Navigation,
} from "lucide-react";
import { toast } from "sonner";
import Pagination from "@/components/admin/Pagination";
import TableActionMenu from "@/components/admin/TableActionMenu";
import ExportButton, {
  formatExportDate,
} from "@/components/admin/ExportButton";
import { getUsers, deleteUser, getStates, UserItem, API_URL } from "@/lib/api";
import { AddUserModal, StateItem } from "./components/AddUserModal";
import { EditUserModal } from "./components/EditUserModal";
import { EditMembershipModal } from "./components/EditMembershipModal";
import { SuspendUserModal } from "./components/SuspendUserModal";
import { ResetPasswordModal } from "./components/ResetPasswordModal";
import { UserLicensesModal } from "./components/UserLicensesModal";
import UsersMap from "./components/UsersMap";

export default function UsersPage() {
  const router = useRouter();

  // Map State & Ref
  const usersMapRef = useRef<HTMLDivElement>(null);
  const [focusedMapUser, setFocusedMapUser] = useState<UserItem | null>(null);

  const handleViewUserOnMap = (user: UserItem) => {
    setFocusedMapUser(user);
    if (usersMapRef.current) {
      usersMapRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  // State for Users List
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input to avoid excessive API requests
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [filterStateName, setFilterStateName] = useState("");
  const [mapSelectedState, setMapSelectedState] = useState("");
  const [filterPlanLevel, setFilterPlanLevel] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterJoinedAt, setFilterJoinedAt] = useState("");

  // Quick View Filter (from HTML dropdown: 'all', 'active', 'inactive', 'premium')
  const [quickView, setQuickView] = useState("all");

  // Selection State
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // States List cache
  const [states, setStates] = useState<StateItem[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);

  // Add & Edit Modals State
  const [addUserModal, setAddUserModal] = useState(false);
  const [editUserModal, setEditUserModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserItem | null>(null);

  // Action Buttons Modals State
  const [membershipModalUser, setMembershipModalUser] =
    useState<UserItem | null>(null);
  const [suspendModalUser, setSuspendModalUser] = useState<UserItem | null>(
    null,
  );
  const [resetPasswordUser, setResetPasswordUser] = useState<UserItem | null>(
    null,
  );
  const [licensesModalUser, setLicensesModalUser] = useState<UserItem | null>(
    null,
  );

  // Delete Confirmation Dialog
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Open Add User Modal from URL param (?action=create) or populate ?search= filter
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("action") === "create" || params.get("action") === "new") {
        setAddUserModal(true);
      }
      const searchParam = params.get("search");
      if (searchParam) {
        setSearchQuery(searchParam);
      }
    }
    const handleOpen = () => setAddUserModal(true);
    const handleFilter = (e: any) => {
      if (e.detail?.search) {
        setSearchQuery(e.detail.search);
      }
    };
    window.addEventListener("onspot:open-create-user", handleOpen);
    window.addEventListener("onspot:filter-users", handleFilter);
    return () => {
      window.removeEventListener("onspot:open-create-user", handleOpen);
      window.removeEventListener("onspot:filter-users", handleFilter);
    };
  }, []);

  // Fetch Users
  const fetchUsersList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUsers({
        page,
        limit,
        search: debouncedSearch,
        status: filterStatus,
        plan_level: filterPlanLevel,
        state_name: filterStateName,
        joined_at: filterJoinedAt,
      });

      if (res && res.data) {
        setUsers(res.data.users || []);
        const pag: any = res.data.pagination || (res as any).pagination;
        if (pag) {
          setTotalPages(pag.totalPages || pag.total_pages || 1);
          setTotalUsers(
            pag.totaldata ??
              pag.totalItems ??
              pag.total ??
              (res.data.users ? res.data.users.length : 0),
          );
        } else {
          setTotalPages(1);
          setTotalUsers(res.data.users ? res.data.users.length : 0);
        }
      } else {
        setUsers([]);
        setTotalUsers(0);
        setTotalPages(1);
      }
    } catch (err: any) {
      console.error("Fetch users error:", err);
      const msg = err?.message || "Failed to load users list from API.";
      toast.error(msg);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    limit,
    debouncedSearch,
    filterStatus,
    filterPlanLevel,
    filterStateName,
    filterJoinedAt,
  ]);

  // Fetch States list
  const fetchStatesList = useCallback(async () => {
    if (states.length > 0) return;
    setLoadingStates(true);
    try {
      const res = await getStates(1, 999);
      const data = res?.data || res || [];
      setStates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch states:", err);
    } finally {
      setLoadingStates(false);
    }
  }, [states.length]);

  // Load states on initial mount for dropdowns
  useEffect(() => {
    fetchStatesList();
  }, [fetchStatesList]);

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setFilterStateName("");
    setFilterPlanLevel("");
    setFilterStatus("");
    setFilterJoinedAt("");
    setQuickView("all");
    setPage(1);
  };

  // Quick View Filter Handler (matching HTML select #users-view)
  const handleQuickViewChange = (val: string) => {
    setQuickView(val);
    setPage(1);
    if (val === "all") {
      setFilterStatus("");
      setFilterPlanLevel("");
    } else if (val === "active") {
      setFilterStatus("active");
      setFilterPlanLevel("");
    } else if (val === "inactive") {
      setFilterStatus("suspended");
      setFilterPlanLevel("");
    } else if (val === "premium") {
      setFilterPlanLevel("premium");
      setFilterStatus("");
    }
  };

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsersList();
    }, 350);
    return () => clearTimeout(timer);
  }, [fetchUsersList]);

  // Clean Name Helper (removes "null" strings)
  const getUserDisplayName = (user: UserItem) => {
    const fn =
      user.first_name && user.first_name !== "null" ? user.first_name : "";
    const ln =
      user.last_name && user.last_name !== "null" ? user.last_name : "";
    const name = `${fn} ${ln}`.trim();
    return name || user.display_name || user.email?.split("@")[0] || "User";
  };

  // Helper to resolve profile image url with backend base url
  const getProfileImageUrl = (url?: string | null) => {
    if (!url) return "";
    if (
      url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("blob:") ||
      url.startsWith("data:")
    ) {
      return url;
    }
    return `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  // Helper to check if a user has valid recorded coordinates
  const hasUserLocation = (u: UserItem): boolean => {
    const loc = u.location;
    if (
      loc &&
      typeof loc.latitude === "number" &&
      typeof loc.longitude === "number" &&
      !isNaN(loc.latitude) &&
      !isNaN(loc.longitude) &&
      (loc.latitude !== 0 || loc.longitude !== 0)
    ) {
      return true;
    }
    const directLat = Number((u as any).latitude ?? u.profile?.latitude);
    const directLng = Number((u as any).longitude ?? u.profile?.longitude);
    return (
      !isNaN(directLat) &&
      !isNaN(directLng) &&
      directLat !== 0 &&
      directLng !== 0
    );
  };

  const handleToggleSelectUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // View User Details - Navigate to dedicated user details page
  const handleViewUser = (user: UserItem) => {
    router.push(`/user/${user.id}`);
  };

  // Open Add User Modal
  const handleOpenAddUser = () => {
    fetchStatesList();
    setAddUserModal(true);
  };

  // Open Edit User Modal
  const handleOpenEditUser = (user: UserItem) => {
    fetchStatesList();
    setUserToEdit(user);
    setEditUserModal(true);
  };

  // Delete User Prompt
  const handleDeletePrompt = (user: UserItem) => {
    setUserToDelete(user);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      await deleteUser(userToDelete.id);
      toast.success(`User ${userToDelete.email} has been deleted.`);
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
      fetchUsersList();
    } catch (err: any) {
      console.error("Delete user error:", err);
      toast.error(err?.message || "Failed to delete user.");
    } finally {
      setDeleting(false);
    }
  };

  const fetchAllUsersForExport = useCallback(async (): Promise<UserItem[]> => {
    const res = await getUsers({
      page: undefined,
      limit: undefined,
      search: debouncedSearch,
      status: filterStatus,
      plan_level: filterPlanLevel,
      state_name: filterStateName,
      joined_at: filterJoinedAt,
      sortBy: "created_at",
      sortOrder: "DESC",
    });

    if (!res || !res.data || !Array.isArray(res.data.users)) {
      throw new Error(
        "Invalid API response: Expected an array of users under data.users",
      );
    }

    return res.data.users;
  }, [
    debouncedSearch,
    filterStatus,
    filterPlanLevel,
    filterStateName,
    filterJoinedAt,
  ]);

  const getUserExportHeadersAndRows = useCallback((data: UserItem[]) => {
    const headers = [
      //  "ID",
      "First Name",
      "Last Name",
      "Email",
      "Role",
      "Status",
      "Membership",
      "Created At",
    ];
    const rows = data.map((u) => [
      //  u.id,
      u.first_name && u.first_name !== "null" ? u.first_name : "",
      u.last_name && u.last_name !== "null" ? u.last_name : "",
      u.email,
      u.role || "user",
      u.status || "active",
      u.profile?.current_tier ||
        (typeof u.profile?.membership === "object"
          ? u.profile?.membership?.name
          : u.profile?.membership) ||
        "None",
      formatExportDate(u.created_at),
    ]);
    return { headers, rows };
  }, []);

  return (
    <div className="space-y-6">
      {/* ===================== FILTER CARD ===================== */}
      <section className="bg-white rounded-[14px] p-5 sm:p-6 border border-[#ececec] shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[1.6fr_1fr_1.1fr_1fr_1fr_auto] gap-4 items-end">
          {/* Search User */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[#2c2c2c]">
              Search User
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Name or email"
                className="w-full h-[42px] pl-3.5 pr-10 rounded-[10px] border border-[#e4e4df] bg-white text-[13px] text-[#2c2c2c] placeholder:text-[#bdbdbd] focus:outline-none focus:border-[#1f3d2a]"
              />
              <Search className="w-4 h-4 text-[#999] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* State */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[#2c2c2c]">
              State
            </label>
            <select
              value={filterStateName}
              onChange={(e) => {
                const val = e.target.value;
                setFilterStateName(val);
                if (val) {
                  setMapSelectedState("");
                }
                setPage(1);
              }}
              className="w-full h-[42px] px-3.5 pr-9 rounded-[10px] border border-[#e4e4df] bg-[#F9F9F9] text-[13px] text-[#2c2c2c] focus:outline-none focus:border-[#1f3d2a] cursor-pointer"
            >
              <option value="">All states</option>
              {states.map((s, idx) => {
                const sName =
                  typeof s === "string"
                    ? s
                    : s?.state_name || (s as any)?.name || `State ${idx + 1}`;
                return (
                  <option key={sName + idx} value={sName}>
                    {sName}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Membership Plan */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[#2c2c2c]">
              Membership Plan
            </label>
            <select
              value={filterPlanLevel}
              onChange={(e) => {
                setFilterPlanLevel(e.target.value);
                setPage(1);
              }}
              className="w-full h-[42px] px-3.5 pr-9 rounded-[10px] border border-[#e4e4df] bg-[#F9F9F9] text-[13px] text-[#2c2c2c] focus:outline-none focus:border-[#1f3d2a] cursor-pointer"
            >
              <option value="">All plans</option>
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
            </select>
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[#2c2c2c]">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
              className="w-full h-[42px] px-3.5 pr-9 rounded-[10px] border border-[#e4e4df] bg-[#F9F9F9] text-[13px] text-[#2c2c2c] focus:outline-none focus:border-[#1f3d2a] cursor-pointer"
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          {/* Join Date */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[#2c2c2c]">
              Join Date
            </label>
            <input
              type="date"
              value={filterJoinedAt}
              onChange={(e) => {
                setFilterJoinedAt(e.target.value);
                setPage(1);
              }}
              className="w-full h-[42px] px-3.5 rounded-[10px] border border-[#e4e4df] bg-[#F9F9F9] text-[13px] text-[#2c2c2c] focus:outline-none focus:border-[#1f3d2a] cursor-pointer"
            />
          </div>

          {/* Filter Actions */}
          <div className="flex items-center gap-2.5 sm:col-span-2 lg:col-span-3 xl:col-span-1 justify-end">
            <button
              onClick={handleResetFilters}
              type="button"
              className="h-[42px] px-5 sm:px-6 rounded-[10px] border border-[#e4e4df] bg-white hover:bg-[#f7f7f2] text-[#4a4a4a] font-semibold text-[13.5px] transition-colors cursor-pointer"
            >
              Reset
            </button>
            <button
              onClick={() => {
                setPage(1);
                fetchUsersList();
              }}
              disabled={loading}
              type="button"
              className="h-[42px] px-6 sm:px-7 rounded-[10px] bg-[#1f3d2a] hover:bg-[#295034] text-white font-semibold text-[13.5px] transition-colors cursor-pointer shadow-xs disabled:opacity-65 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              {loading && (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              )}
              <span>{loading ? "Filtering..." : "Filter"}</span>
            </button>
          </div>
        </div>
      </section>

      {/* ===================== LIVE ONLINE USERS INTERACTIVE MAP ===================== */}
      <div ref={usersMapRef} className="w-full">
        <UsersMap
          fallbackUsers={users}
          states={states}
          mapSelectedState={mapSelectedState}
          onMapStateChange={(val) => {
            setMapSelectedState(val);
            if (val) {
              setFilterStateName("");
              setPage(1);
            }
          }}
          onClearFilterState={() => {
            setFilterStateName("");
            setPage(1);
          }}
          isFiltering={loading}
          filterParams={{
            search: debouncedSearch,
            status: filterStatus,
            plan_level: filterPlanLevel,
            state_name: filterStateName,
            joined_at: filterJoinedAt,
          }}
          selectedUser={focusedMapUser}
          onSelectUser={setFocusedMapUser}
        />
      </div>

      {/* ===================== USERS TABLE LISTING ===================== */}
      <section className="w-full min-w-0 space-y-4">
        {/* Table Column */}
        <div className="w-full min-w-0 flex flex-col space-y-4">
          <div className="bg-white rounded-[14px] p-4 sm:p-6 border border-[#ececec] shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)] overflow-hidden">
            {/* Panel Head */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 mb-2 border-b border-[#ececec]">
              <h3 className="font-semibold text-[#1f1f1f] text-[15px]">
                Users
              </h3>

              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                {/* View all Users dropdown  */}
                <select
                  value={quickView}
                  onChange={(e) => handleQuickViewChange(e.target.value)}
                  className="h-[30px] text-[12px] sm:text-[12.5px] text-[#4a4a4a] border border-[#e4e4df] rounded-[7px] px-2.5 sm:px-3 pr-6 sm:pr-7 bg-white focus:outline-none cursor-pointer font-medium appearance-none shrink-0"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 8px center",
                  }}
                >
                  <option value="all">View all Users</option>
                  <option value="active">Active only</option>
                  <option value="inactive">Inactive only</option>
                  <option value="premium">Premium only</option>
                </select>

                {/* Export button */}
                <ExportButton<UserItem>
                  fetchData={fetchAllUsersForExport}
                  getHeadersAndRows={getUserExportHeadersAndRows}
                  filenamePrefix="onspot_users"
                  totalRecords={totalUsers}
                  label="Export"
                  className="h-[30px] px-2.5 sm:px-3 rounded-[7px] border border-[#e4e4df] bg-white hover:bg-[#f7f7f2] text-[12px] font-medium text-[#4a4a4a] inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                  icon={
                    <svg
                      className="w-3 h-3 text-[#6b6b6b]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  }
                />

                {/* Add User button */}
                <button
                  type="button"
                  onClick={handleOpenAddUser}
                  className="h-[30px] px-3 rounded-[7px] bg-[#2d4a23] hover:bg-[#233a1b] text-[12px] font-medium text-white inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0 whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5 text-white shrink-0" />
                  <span>Add User</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto min-h-[440px] pb-3 w-full max-w-full">
              <table className="w-full min-w-[720px] text-left border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-[#ececec]">
                    <th className="py-3 px-2 w-[55px] text-center font-semibold text-[#111111] text-[13px]">
                      Select
                    </th>
                    <th className="py-3 px-3 font-semibold text-[#111111] text-[13px]">
                      Name
                    </th>
                    <th className="py-3 px-3 font-semibold text-[#111111] text-[13px]">
                      Email
                    </th>
                    <th className="py-3 px-3 font-semibold text-[#111111] text-[13px]">
                      Membership
                    </th>
                    <th className="py-3 px-3 font-semibold text-[#111111] text-[13px]">
                      Joined
                    </th>
                    <th className="py-3 px-3 font-semibold text-[#111111] text-[13px]">
                      Status
                    </th>
                    <th className="py-3 px-3 font-semibold text-[#111111] text-[13px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f1ed]">
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-3.5 px-2 text-center">
                          <div className="w-4 h-4 bg-gray-200 rounded mx-auto" />
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-[32px] h-[32px] bg-gray-200 rounded-full" />
                            <div className="h-4 w-28 bg-gray-200 rounded" />
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="h-4 w-36 bg-gray-200 rounded" />
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="h-5 w-16 bg-gray-200 rounded-md" />
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="h-4 w-20 bg-gray-200 rounded" />
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="h-4 w-16 bg-gray-200 rounded" />
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="h-7 w-20 bg-gray-200 rounded" />
                        </td>
                      </tr>
                    ))
                  ) : users.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-12 text-center text-[#7D848D]"
                      >
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <AlertCircle className="w-8 h-8 text-gray-300" />
                          <p className="text-[13px] font-semibold text-gray-700">
                            No users match your filters.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    users.map((user, idx) => {
                      const isSelected = selectedUserIds.includes(user.id);
                      const fullName = getUserDisplayName(user);
                      const rawMembership =
                        user.profile?.current_tier ||
                        user.profile?.membership?.name ||
                        user.profile?.membership ||
                        "None";
                      const membershipStr = String(
                        typeof rawMembership === "object"
                          ? rawMembership.name || "n/a"
                          : rawMembership,
                      );
                      const isPremium = membershipStr
                        .toLowerCase()
                        .includes("premium");
                      const isBasic = membershipStr
                        .toLowerCase()
                        .includes("basic");
                      const isActive =
                        user.status !== "inactive" &&
                        user.status !== "suspended";
                      const joinDate = user.created_at
                        ? new Date(user.created_at).toLocaleDateString(
                            "en-GB",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            },
                          )
                        : "—";

                      return (
                        <tr
                          key={user.id}
                          className={`hover:bg-[#fbfbf8] transition-colors ${
                            isSelected ? "bg-[#f5efdc]/30" : ""
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="py-3.5 px-2 text-center align-middle">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectUser(user.id)}
                              className="w-[18px] h-[18px] rounded-[4px] border-[#7D848D] accent-[#4a6b3f] cursor-pointer align-middle"
                            />
                          </td>

                          {/* Name with Avatar */}
                          <td className="py-3.5 px-3 align-middle text-[#111111] font-medium">
                            <Link
                              href={`/user/${user.id}`}
                              className="flex items-center gap-3 group hover:opacity-85 transition-opacity"
                            >
                              <div className="w-[32px] h-[32px] rounded-full bg-[#f1f1ed] text-[#4a4a4a] font-semibold flex items-center justify-center text-xs flex-shrink-0 overflow-hidden relative group-hover:ring-2 group-hover:ring-[#2d4a23]/30 transition-all">
                                {user.profile?.profile_picture ? (
                                  <Image
                                    src={getProfileImageUrl(
                                      user.profile.profile_picture,
                                    )}
                                    alt={fullName}
                                    width={32}
                                    height={32}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  fullName.charAt(0).toUpperCase()
                                )}
                              </div>
                              <span className="truncate max-w-[150px] font-medium text-[#111111] group-hover:text-[#2d4a23] text-[13px] transition-colors">
                                {fullName}
                              </span>
                            </Link>
                          </td>

                          {/* Email */}
                          <td className="py-3.5 px-3 align-middle text-[#7D848D] truncate max-w-[160px]">
                            {user.email}
                          </td>

                          {/* Membership Pill */}
                          <td className="py-3.5 px-3 align-middle">
                            <span
                              className={`inline-block px-3.5 py-1 rounded-[6px] text-[12px] font-medium border ${
                                isPremium
                                  ? "bg-[#eaf1fa] text-[#3b6bbf] border-[#cfdcef]"
                                  : isBasic
                                    ? "bg-[#fff4d6] text-[#b58105] border-[#f1dba0]"
                                    : "bg-[#f1f1ed] text-[#7D848D] border-[#e2e2dc]"
                              }`}
                            >
                              {membershipStr}
                            </span>
                          </td>

                          {/* Joined Date */}
                          <td className="py-3.5 px-3 align-middle text-[#7D848D] whitespace-nowrap">
                            {joinDate}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-3 align-middle">
                            <span
                              className={`inline-flex items-center gap-1.5 text-[13px] ${
                                isActive ? "text-[#34A853]" : "text-[#e03131]"
                              }`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  isActive ? "bg-[#2f9e44]" : "bg-[#e03131]"
                                }`}
                              />
                              {user.status
                                ? user.status.charAt(0).toUpperCase() +
                                  user.status.slice(1)
                                : "Active"}
                            </span>
                          </td>

                          {/* Actions: Eye button + 3-dots with dropdown matching screenshot */}
                          <td className="py-3.5 px-3 align-middle whitespace-nowrap">
                            <div className="flex items-center gap-2 relative">
                              {/* View on Map & Coordinates Button - Only rendered when user has location */}
                              {hasUserLocation(user) && (
                                <button
                                  type="button"
                                  onClick={() => handleViewUserOnMap(user)}
                                  className="w-[30px] h-[30px] border border-[#e2e2dc] rounded-[7px] bg-white text-[#7D848D] hover:bg-[#eef5eb] hover:text-[#2d4a23] hover:border-[#b8d6b0] inline-flex items-center justify-center transition-colors cursor-pointer"
                                  title="View on Map & Coordinates"
                                  aria-label="View on Map & Coordinates"
                                >
                                  <MapPin className="w-4 h-4 text-[#2d4a23]" />
                                </button>
                              )}

                              {/* View Profile Button */}
                              <button
                                type="button"
                                onClick={() => handleViewUser(user)}
                                className="w-[30px] h-[30px] border border-[#e2e2dc] rounded-[7px] bg-white text-[#7D848D] hover:bg-[#f7f7f2] hover:text-[#1f1f1f] hover:border-[#d4d4cd] inline-flex items-center justify-center transition-colors cursor-pointer"
                                title="View Profile"
                                aria-label="View Profile"
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

                              {/* More Actions 3-dots Menu using Reusable Portal TableActionMenu */}
                              <TableActionMenu
                                items={[
                                  {
                                    label: "View on Map & Coordinates",
                                    icon: (
                                      <MapPin className="w-4 h-4 text-[#2d4a23]" />
                                    ),
                                    show: hasUserLocation(user),
                                    onClick: () => handleViewUserOnMap(user),
                                  },
                                  {
                                    label: "View Profile",
                                    icon: (
                                      <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        className="w-4 h-4"
                                      >
                                        <circle cx="12" cy="8" r="4" />
                                        <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
                                      </svg>
                                    ),
                                    onClick: () => handleViewUser(user),
                                  },
                                  // {
                                  //   label: "Edit Membership",
                                  //   icon: (
                                  //     <svg
                                  //       viewBox="0 0 24 24"
                                  //       fill="none"
                                  //       stroke="currentColor"
                                  //       strokeWidth="1.8"
                                  //       strokeLinejoin="round"
                                  //       className="w-4 h-4"
                                  //     >
                                  //       <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
                                  //     </svg>
                                  //   ),
                                  //   onClick: () => setMembershipModalUser(user),
                                  // },
                                  {
                                    label:
                                      user.status === "suspended" ||
                                      user.status === "inactive"
                                        ? "Activate Account"
                                        : "Suspend Account",
                                    icon: (
                                      <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        className="w-4 h-4"
                                      >
                                        <circle cx="12" cy="12" r="9" />
                                        <line x1="12" y1="8" x2="12" y2="12" />
                                        <circle
                                          cx="12"
                                          cy="16"
                                          r="0.6"
                                          fill="currentColor"
                                        />
                                      </svg>
                                    ),
                                    onClick: () => setSuspendModalUser(user),
                                  },
                                  {
                                    label: "Reset Password",
                                    icon: (
                                      <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        className="w-4 h-4"
                                      >
                                        <rect
                                          x="4"
                                          y="11"
                                          width="16"
                                          height="10"
                                          rx="2"
                                        />
                                        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                                      </svg>
                                    ),
                                    onClick: () => setResetPasswordUser(user),
                                  },
                                  {
                                    label: "View Uploaded Licenses",
                                    icon: (
                                      <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        className="w-4 h-4"
                                      >
                                        <rect
                                          x="2"
                                          y="7"
                                          width="20"
                                          height="12"
                                          rx="2"
                                        />
                                        <line x1="2" y1="11" x2="22" y2="11" />
                                      </svg>
                                    ),
                                    onClick: () => setLicensesModalUser(user),
                                  },
                                  {
                                    label: "Edit Full Profile",
                                    icon: <Edit2 className="w-3.5 h-3.5" />,
                                    separator: true,
                                    onClick: () => handleOpenEditUser(user),
                                  },
                                  {
                                    label: "Delete User",
                                    icon: <Trash2 className="w-3.5 h-3.5" />,
                                    variant: "danger",
                                    show: user.role?.toLowerCase() !== "admin",
                                    onClick: () => handleDeletePrompt(user),
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

            {/* Empty matching HTML #users-empty */}
            {!loading && users.length === 0 && (
              <div className="text-center py-10 px-3 text-[#999] text-[13px]">
                No users match your filters.
              </div>
            )}
          </div>

          {/* Table Footer: Standard Pagination matching all other admin pages */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalUsers}
            pageSize={limit}
            itemCountOnPage={users.length}
            itemLabel="users"
            onPageChange={(p) => setPage(p)}
            loading={loading}
          />
        </div>
      </section>

      {/* ===================== ADD USER MODAL ===================== */}
      <AddUserModal
        isOpen={addUserModal}
        onClose={() => setAddUserModal(false)}
        onSuccess={fetchUsersList}
        states={states}
        loadingStates={loadingStates}
      />

      {/* ===================== EDIT USER PROFILE MODAL ===================== */}
      <EditUserModal
        isOpen={editUserModal}
        userToEdit={userToEdit}
        onClose={() => {
          setEditUserModal(false);
          setUserToEdit(null);
        }}
        onSuccess={fetchUsersList}
        states={states}
        loadingStates={loadingStates}
      />

      {/* ===================== EDIT MEMBERSHIP MODAL ===================== */}
      <EditMembershipModal
        isOpen={!!membershipModalUser}
        user={membershipModalUser}
        onClose={() => setMembershipModalUser(null)}
        onSuccess={fetchUsersList}
      />

      {/* ===================== SUSPEND / REACTIVATE USER MODAL ===================== */}
      <SuspendUserModal
        isOpen={!!suspendModalUser}
        user={suspendModalUser}
        onClose={() => setSuspendModalUser(null)}
        onSuccess={fetchUsersList}
      />

      {/* ===================== RESET PASSWORD MODAL ===================== */}
      <ResetPasswordModal
        isOpen={!!resetPasswordUser}
        user={resetPasswordUser}
        onClose={() => setResetPasswordUser(null)}
        onSuccess={fetchUsersList}
      />

      {/* ===================== USER LICENSES MODAL ===================== */}
      <UserLicensesModal
        isOpen={!!licensesModalUser}
        user={licensesModalUser}
        onClose={() => setLicensesModalUser(null)}
      />

      {/* ===================== DELETE CONFIRMATION DIALOG ===================== */}
      {deleteConfirmOpen && userToDelete && (
        <div
          onClick={() => {
            if (!deleting) {
              setDeleteConfirmOpen(false);
              setUserToDelete(null);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Delete User Account
                </h3>
                <p className="text-xs text-gray-500">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed mb-6">
              Are you sure you want to permanently delete the account for{" "}
              <strong className="text-gray-900">{userToDelete.email}</strong>?
              All associated licenses, map pins, and data will be removed.
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
                  <span>Yes, Delete User</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
