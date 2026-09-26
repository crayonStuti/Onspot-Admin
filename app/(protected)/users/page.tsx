"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import {
  Search,
  Eye,
  Edit2,
  Trash2,
  Download,
  AlertCircle,
  X,
  MapPin,
  FileBadge,
  Plus,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import Pagination from "@/components/admin/Pagination";
import {
  getUsers,
  deleteUser,
  getUserById,
  getStates,
  getUserLicenses,
  getUserBookmarks,
  getUserMapPins,
  UserItem,
  API_URL,
} from "@/lib/api";
import { AddUserModal, StateItem } from "./components/AddUserModal";
import { EditUserModal } from "./components/EditUserModal";

export default function UsersPage() {
  // State for Users List
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStateName, setFilterStateName] = useState("");
  const [filterPlanLevel, setFilterPlanLevel] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterJoinedAt, setFilterJoinedAt] = useState("");

  // Selection State
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // States List cache
  const [states, setStates] = useState<StateItem[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);

  // View User Details Modal
  const [viewUserModal, setViewUserModal] = useState(false);
  const [selectedUserDetails, setSelectedUserDetails] = useState<any | null>(
    null,
  );
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [userLicenses, setUserLicenses] = useState<any[]>([]);
  const [userBookmarks, setUserBookmarks] = useState<any[]>([]);
  const [userMapPins, setUserMapPins] = useState<any[]>([]);

  // Add & Edit Modals State
  const [addUserModal, setAddUserModal] = useState(false);
  const [editUserModal, setEditUserModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserItem | null>(null);

  // Delete Confirmation Dialog
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch Users
  const fetchUsersList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUsers({
        page,
        limit,
        search: searchQuery,
        status: filterStatus,
        plan_level: filterPlanLevel,
        state_name: filterStateName,
        joined_at: filterJoinedAt,
      });

      if (res && res.data) {
        setUsers(res.data.users || []);
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.totalPages || 1);
          setTotalUsers(res.data.pagination.totaldata || 0);
        }
      } else {
        setUsers([]);
        setTotalUsers(0);
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
    searchQuery,
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
    setFilterStateName("");
    setFilterPlanLevel("");
    setFilterStatus("");
    setFilterJoinedAt("");
    setPage(1);
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

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedUserIds(users.map((u) => u.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleToggleSelectUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // View User Details
  const handleViewUser = async (user: UserItem) => {
    setSelectedUserDetails(user);
    setViewUserModal(true);
    setDetailsLoading(true);
    setUserLicenses([]);
    setUserBookmarks([]);
    setUserMapPins([]);

    try {
      const [fullProfileRes, licensesRes, bookmarksRes, mapPinsRes] =
        await Promise.allSettled([
          getUserById(user.id),
          getUserLicenses(user.id),
          getUserBookmarks(user.email),
          getUserMapPins(user.email, 10),
        ]);

      if (fullProfileRes.status === "fulfilled" && fullProfileRes.value) {
        const payload = fullProfileRes.value;
        const fullUser =
          payload.data?.user || payload.user || payload.data || payload;
        setSelectedUserDetails(fullUser);
      }
      if (licensesRes.status === "fulfilled" && licensesRes.value) {
        const lic = licensesRes.value.data || licensesRes.value || [];
        setUserLicenses(Array.isArray(lic) ? lic : []);
      }
      if (bookmarksRes.status === "fulfilled" && bookmarksRes.value) {
        const bm = bookmarksRes.value.data || bookmarksRes.value || [];
        setUserBookmarks(Array.isArray(bm) ? bm : []);
      }
      if (mapPinsRes.status === "fulfilled" && mapPinsRes.value) {
        const mp = mapPinsRes.value.data || mapPinsRes.value || [];
        setUserMapPins(Array.isArray(mp) ? mp : []);
      }
    } catch (err: any) {
      console.warn("Error fetching deep user details:", err);
    } finally {
      setDetailsLoading(false);
    }
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

  // Export Users to CSV
  const handleExportCSV = () => {
    if (users.length === 0) {
      toast.info("No users to export.");
      return;
    }

    const headers = [
      "ID",
      "First Name",
      "Last Name",
      "Email",
      "Role",
      "Status",
      "Membership",
      "Created At",
    ];
    const rows = users.map((u) => [
      u.id,
      u.first_name && u.first_name !== "null" ? u.first_name : "",
      u.last_name && u.last_name !== "null" ? u.last_name : "",
      u.email,
      u.role || "user",
      u.status || "active",
      u.profile?.current_tier ||
        (typeof u.profile?.membership === "object"
          ? u.profile?.membership?.name
          : u.profile?.membership) ||
        "Free",
      u.created_at || "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        headers.join(","),
        ...rows.map((e) => e.map((val) => `"${val}"`).join(",")),
      ].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `onspot_users_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Users exported successfully.");
  };

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
                setFilterStateName(e.target.value);
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
              type="button"
              className="h-[42px] px-6 sm:px-7 rounded-[10px] bg-[#1f3d2a] hover:bg-[#295034] text-white font-semibold text-[13.5px] transition-colors cursor-pointer shadow-xs"
            >
              Filter
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        <section className="xl:col-span-8 bg-white rounded-[14px] p-5 border border-[#ececec] shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)] flex flex-col">
          <div className="flex items-center justify-between gap-3 pb-3 mb-2 border-b border-[#ececec]">
            <h3 className="font-semibold text-[#1f1f1f] text-[15px]">Users</h3>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="h-[32px] px-3 rounded-[6px] border border-[#e4e4df] bg-white hover:bg-[#f7f7f4] text-[12.5px] font-normal text-[#444] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#666]" />
                <span>Export</span>
              </button>

              <button
                onClick={handleOpenAddUser}
                className="h-[32px] px-3 rounded-[6px] bg-[#2d4a23] hover:bg-[#233a1b] text-[12.5px] font-medium text-white inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 text-white" />
                <span>Add User</span>
              </button>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-[#ececec]">
                  <th className="py-3 px-2 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        users.length > 0 &&
                        selectedUserIds.length === users.length
                      }
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded-[4px] border-[#7D848D] accent-[#2d4a23] cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3 font-semibold text-[#111111] text-[13px]">
                    User
                  </th>
                  <th className="py-3 px-3 font-semibold text-[#111111] text-[13px]">
                    Email Address
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
                  <th className="py-3 px-3 text-right font-semibold text-[#111111] text-[13px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ececec]">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-3.5 px-2 text-center">
                        <div className="w-4 h-4 bg-gray-200 rounded mx-auto" />
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-[30px] h-[30px] bg-gray-200 rounded-full" />
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
                      <td className="py-3.5 px-3 text-right">
                        <div className="h-7 w-20 bg-gray-200 rounded ml-auto" />
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
                  users.map((user) => {
                    const isSelected = selectedUserIds.includes(user.id);
                    const fullName = getUserDisplayName(user);
                    const rawMembership =
                      user.profile?.current_tier ||
                      user.profile?.membership?.name ||
                      user.profile?.membership ||
                      "Free";
                    const membershipStr = String(
                      typeof rawMembership === "object"
                        ? rawMembership.name || "Free"
                        : rawMembership,
                    );
                    const isPremium = membershipStr
                      .toLowerCase()
                      .includes("premium");
                    const isBasic = membershipStr
                      .toLowerCase()
                      .includes("basic");
                    const isActive =
                      user.status !== "inactive" && user.status !== "suspended";
                    const joinDate = user.created_at
                      ? new Date(user.created_at).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })
                      : "—";

                    return (
                      <tr
                        key={user.id}
                        className={`hover:bg-[#fbfbf8] transition-colors ${
                          isSelected ? "bg-[#f5efdc]/30" : ""
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3 px-2 text-center align-middle">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectUser(user.id)}
                            className="w-4 h-4 rounded-[4px] border-[#7D848D] accent-[#2d4a23] cursor-pointer"
                          />
                        </td>

                        {/* Name & Avatar */}
                        <td className="py-3 px-3 align-middle text-[#111111] font-medium">
                          <div className="flex items-center gap-2.5">
                            <div className="w-[30px] h-[30px] rounded-full bg-[#f1f1ed] text-[#4a4a4a] font-semibold flex items-center justify-center text-xs flex-shrink-0 overflow-hidden relative">
                              {user.profile?.profile_picture ? (
                                <Image
                                  src={getProfileImageUrl(
                                    user.profile.profile_picture,
                                  )}
                                  alt={fullName}
                                  width={30}
                                  height={30}
                                  className="w-full h-full object-cover"
                                  unoptimized
                                />
                              ) : (
                                fullName.charAt(0).toUpperCase()
                              )}
                            </div>
                            <span className="truncate max-w-[140px] font-medium text-[#111111] text-[13px]">
                              {fullName}
                            </span>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="py-3 px-3 align-middle text-[#7D848D] truncate max-w-[160px]">
                          {user.email}
                        </td>

                        {/* Membership Pill */}
                        <td className="py-3 px-3 align-middle">
                          <span
                            className={`inline-block px-3 py-0.5 rounded-[6px] text-[11.5px] font-normal border ${
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
                        <td className="py-3 px-3 align-middle text-[#7D848D] whitespace-nowrap">
                          {joinDate}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3 align-middle">
                          <span
                            className={`inline-flex items-center gap-1.5 text-[12px] font-normal ${
                              isActive ? "text-[#34A853]" : "text-[#e03131]"
                            }`}
                          >
                            <span
                              className={`w-[7px] h-[7px] rounded-full ${
                                isActive ? "bg-[#2f9e44]" : "bg-[#e03131]"
                              }`}
                            />
                            {user.status
                              ? user.status.charAt(0).toUpperCase() +
                                user.status.slice(1)
                              : "Active"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-right align-middle whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            {/* View */}
                            <button
                              onClick={() => handleViewUser(user)}
                              title="View"
                              className="w-[30px] h-[30px] border border-[#e2e2dc] rounded-[7px] bg-white text-[#7D848D] hover:bg-[#f7f7f2] hover:text-[#1f1f1f] hover:border-[#d4d4cd] inline-flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => handleOpenEditUser(user)}
                              title="Edit"
                              className="w-[30px] h-[30px] border border-[#e2e2dc] rounded-[7px] bg-white text-[#7D848D] hover:bg-[#f7f7f2] hover:text-[#1f1f1f] hover:border-[#d4d4cd] inline-flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {/* Delete */}
                            {user.role?.toLowerCase() !== "admin" && (
                              <button
                                onClick={() => handleDeletePrompt(user)}
                                title="Delete"
                                className="w-[30px] h-[30px] border border-[#e2e2dc] rounded-[7px] bg-white text-[#7D848D] hover:bg-[#f7f7f2] hover:text-red-600 hover:border-red-200 inline-flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalUsers}
            pageSize={limit}
            itemCountOnPage={users.length}
            itemLabel="users"
            onPageChange={(p) => setPage(p)}
            loading={loading}
            className="border-t border-[#ececec] pt-4 mt-2"
          />
        </section>

        <div className="xl:col-span-4 flex flex-col gap-5">
          <section className="bg-white rounded-[14px] p-5 border border-[#ececec] shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)] flex flex-col gap-4">
            <div className="pb-3 border-b border-[#ececec]">
              <h3 className="font-semibold text-[#1f1f1f] text-[15px]">
                Overview Summary
              </h3>
              <p className="text-xs text-[#7D848D] mt-0.5">
                Quick breakdown of accounts
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-[#fbfbf8] border border-[#ececec]">
                <span className="text-xs text-[#7D848D] block font-medium">
                  Total Users
                </span>
                <span className="text-xl font-bold text-[#111] mt-1 block">
                  {totalUsers}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#fbfbf8] border border-[#ececec]">
                <span className="text-xs text-[#7D848D] block font-medium">
                  Selected
                </span>
                <span className="text-xl font-bold text-[#2d4a23] mt-1 block">
                  {selectedUserIds.length}
                </span>
              </div>
            </div>
          </section>

          {/* Map Section matching HTML template */}
          <div className="h-[460px] rounded-[14px] overflow-hidden border border-[#ececec] shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)] bg-white">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d44196.236392315026!2d-93.81033787191589!3d46.185289524094266!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x52b157a8f77c8e1f%3A0xfbe655e10ff018bc!2sVineland%2C%20MN%2056359%2C%20USA!5e0!3m2!1sen!2sin!4v1781021191340!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Users Live Map"
            />
          </div>
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

      {/* ===================== VIEW USER DETAILS DRAWER / MODAL ===================== */}
      {viewUserModal && selectedUserDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 p-6 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#2d4a23] font-bold text-lg flex items-center justify-center flex-shrink-0 border border-emerald-100 overflow-hidden relative">
                  {selectedUserDetails.profile?.profile_picture ? (
                    <Image
                      src={getProfileImageUrl(
                        selectedUserDetails.profile.profile_picture,
                      )}
                      alt="Avatar"
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    getUserDisplayName(selectedUserDetails)
                      .charAt(0)
                      .toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {getUserDisplayName(selectedUserDetails)}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {selectedUserDetails.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewUserModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Grid */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-gray-50/70 p-4 rounded-xl border border-gray-100">
                <div>
                  <span className="text-gray-400 block font-medium">Role</span>
                  <span className="font-semibold text-gray-800 capitalize">
                    {String(
                      selectedUserDetails?.role ||
                        selectedUserDetails?.user?.role ||
                        "user",
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">
                    Status
                  </span>
                  <span className="font-semibold text-emerald-700 capitalize">
                    {String(selectedUserDetails.status || "active")}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">
                    Membership Tier
                  </span>
                  <span className="font-semibold text-indigo-700">
                    {String(
                      selectedUserDetails.profile?.current_tier ||
                        (typeof selectedUserDetails.profile?.membership ===
                        "object"
                          ? selectedUserDetails.profile?.membership?.name
                          : selectedUserDetails.profile?.membership) ||
                        "Free",
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">Phone</span>
                  <span className="font-semibold text-gray-800">
                    {String(
                      selectedUserDetails.profile?.phone ||
                        selectedUserDetails.phone ||
                        "Not provided",
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">State</span>
                  <span className="font-semibold text-gray-800">
                    {String(
                      (typeof selectedUserDetails.profile?.state === "object"
                        ? selectedUserDetails.profile?.state?.state_name
                        : selectedUserDetails.profile?.state) ||
                        (typeof selectedUserDetails.state === "object"
                          ? selectedUserDetails.state?.state_name
                          : selectedUserDetails.state) ||
                        "Not specified",
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">
                    Joined On
                  </span>
                  <span className="font-semibold text-gray-800">
                    {selectedUserDetails.created_at
                      ? new Date(
                          selectedUserDetails.created_at,
                        ).toLocaleDateString()
                      : "—"}
                  </span>
                </div>
              </div>

              {/* Auxiliary Tabs / Info */}
              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileBadge className="w-4 h-4 text-[#2d4a23]" />
                  Active Licenses ({userLicenses.length})
                </h4>
                {userLicenses.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">
                    No assigned licenses found for this user.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {userLicenses.map((lic, i) => (
                      <div
                        key={i}
                        className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs"
                      >
                        <p className="font-semibold text-gray-800">
                          {String(lic.name || lic.title || "License")}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          Expires: {String(lic.expires_at || "Unlimited")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#2d4a23]" />
                  Recent Map Pins ({userMapPins.length})
                </h4>
                {userMapPins.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">
                    No GPS pins recorded.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {userMapPins.map((pin, i) => (
                      <div
                        key={i}
                        className="p-2.5 bg-gray-50 rounded-lg text-xs flex items-center justify-between text-gray-700"
                      >
                        <span className="font-medium">
                          {String(pin.title || `Pin #${i + 1}`)}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {typeof pin.latitude === "number"
                            ? pin.latitude.toFixed(4)
                            : pin.latitude}
                          ,{" "}
                          {typeof pin.longitude === "number"
                            ? pin.longitude.toFixed(4)
                            : pin.longitude}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setViewUserModal(false)}
                className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700 transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== DELETE CONFIRMATION DIALOG ===================== */}
      {deleteConfirmOpen && userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 p-6">
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
