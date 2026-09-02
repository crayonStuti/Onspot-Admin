"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Eye,
  Edit2,
  Trash2,
  MoreVertical,
  Download,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
  MapPin,
  FileBadge,
} from "lucide-react";
import { toast } from "sonner";
import {
  getUsers,
  deleteUser,
  getUserById,
  updateUserProfile,
  getUserLicenses,
  getUserBookmarks,
  getUserMapPins,
  UserItem,
} from "@/lib/api";

export default function UsersPage() {
  // State for Users List
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Search Query
  const [searchQuery, setSearchQuery] = useState("");

  // Selection State
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // View User Details Modal
  const [viewUserModal, setViewUserModal] = useState(false);
  const [selectedUserDetails, setSelectedUserDetails] = useState<any | null>(
    null,
  );
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [userLicenses, setUserLicenses] = useState<any[]>([]);
  const [userBookmarks, setUserBookmarks] = useState<any[]>([]);
  const [userMapPins, setUserMapPins] = useState<any[]>([]);

  // Edit User Modal
  const [editUserModal, setEditUserModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserItem | null>(null);
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    role: "user",
    status: "active",
  });
  const [editSaving, setEditSaving] = useState(false);

  // Delete Confirmation Dialog
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch Users
  const fetchUsersList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUsers(page, limit, searchQuery);

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
  }, [page, limit, searchQuery]);

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
    if (fn || ln) {
      return `${fn} ${ln}`.trim();
    }
    if (user.display_name && user.display_name !== "null") {
      return user.display_name;
    }
    return user.email ? user.email.split("@")[0] : "User";
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
        setSelectedUserDetails(
          fullProfileRes.value.data || fullProfileRes.value,
        );
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

  // Open Edit User Modal
  const handleEditUser = (user: UserItem) => {
    setUserToEdit(user);
    setEditForm({
      first_name:
        user.first_name && user.first_name !== "null" ? user.first_name : "",
      last_name:
        user.last_name && user.last_name !== "null" ? user.last_name : "",
      phone: user.profile?.phone || user.phone || "",
      role: user.role || "user",
      status: user.status || "active",
    });
    setEditUserModal(true);
  };

  // Save Edited User
  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit) return;

    setEditSaving(true);
    try {
      await updateUserProfile(userToEdit.id, editForm);
      toast.success("User profile updated successfully");
      setEditUserModal(false);
      setUserToEdit(null);
      fetchUsersList();
    } catch (err: any) {
      console.error("Update user error:", err);
      toast.error(err?.message || "Failed to update user profile");
    } finally {
      setEditSaving(false);
    }
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

  // Generate pagination items matching HTML
  const paginationItems = useMemo(() => {
    const pages: (number | string)[] = [];
    const max = totalPages || 1;

    if (max <= 5) {
      for (let i = 1; i <= max; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("…");
      const start = Math.max(2, page - 1);
      const end = Math.min(max - 1, page + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (page < max - 2) pages.push("…");
      pages.push(max);
    }
    return pages;
  }, [page, totalPages]);

  return (
    <div className="space-y-6">
      {/* ===================== FILTER CARD (1:1 HTML) ===================== */}
      <section className="bg-white rounded-[14px] p-5 border border-[#ececec] shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)]">
        <div className="flex flex-col gap-1.5 max-w-sm">
          <label className="text-[12.5px] font-medium text-[#4a4a4a]">
            Search User
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Name or email"
              className="w-full h-[38px] pl-3.5 pr-9 rounded-[6px] border border-[#e4e4df] bg-white text-[13px] text-[#4a4a4a] placeholder-gray-400 focus:outline-none focus:border-[#2d4a23]"
            />
            <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        <section className="xl:col-span-8 bg-white rounded-[14px] p-5 border border-[#ececec] shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)] flex flex-col">
          <div className="flex items-center justify-between gap-3 pb-3 mb-2 border-b border-[#ececec]">
            <h3 className="font-semibold text-[#1f1f1f] text-[15px]">Users</h3>

            <button
              onClick={handleExportCSV}
              className="h-[32px] px-3 rounded-[6px] border border-[#e4e4df] bg-white hover:bg-[#f7f7f4] text-[12.5px] font-normal text-[#444] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#666]" />
              <span>Export</span>
            </button>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-[#ececec]">
                  <th className="py-3 px-2 w-10 text-center">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={
                        users.length > 0 &&
                        selectedUserIds.length === users.length
                      }
                      className="w-4 h-4 rounded-[4px] border-[#7D848D] accent-[#2d4a23] cursor-pointer"
                    />
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
                  <th className="py-3 px-3 text-right font-semibold text-[#111111] text-[13px]">
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
                          Loading users...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-16 text-center text-[#7D848D]"
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
                    const isActive = user.status !== "inactive";
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
                            <div className="w-[30px] h-[30px] rounded-full bg-[#f1f1ed] text-[#4a4a4a] font-semibold flex items-center justify-center text-xs flex-shrink-0 overflow-hidden">
                              {user.profile?.profile_picture ? (
                                <img
                                  src={user.profile.profile_picture}
                                  alt={fullName}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (
                                      e.target as HTMLImageElement
                                    ).style.display = "none";
                                  }}
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

                        {/* Membership Pill (HTML pill, pill.basic, pill.free) */}
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

                        {/* Status (HTML status.active, status.inactive) */}
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
                            {isActive ? "Active" : "Inactive"}
                          </span>
                        </td>

                        {/* Actions (HTML act-btn) */}
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
                              onClick={() => handleEditUser(user)}
                              title="Edit"
                              className="w-[30px] h-[30px] border border-[#e2e2dc] rounded-[7px] bg-white text-[#7D848D] hover:bg-[#f7f7f2] hover:text-[#1f1f1f] hover:border-[#d4d4cd] inline-flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDeletePrompt(user)}
                              title="Delete"
                              className="w-[30px] h-[30px] border border-[#e2e2dc] rounded-[7px] bg-white text-[#7D848D] hover:bg-[#f7f7f2] hover:text-red-600 hover:border-red-200 inline-flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

                            {/* More */}
                            <button
                              onClick={() => handleViewUser(user)}
                              title="More"
                              className="w-[30px] h-[30px] border border-[#e2e2dc] rounded-[7px] bg-white text-[#7D848D] hover:bg-[#f7f7f2] hover:text-[#1f1f1f] hover:border-[#d4d4cd] inline-flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <MoreVertical className="w-4 h-4" />
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

          {/* Table Footer & Numbered Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 pb-1 text-[12.5px] text-[#888] border-t border-[#f1f1ed] mt-2">
            <div>
              Showing 1 to {users.length} of {totalUsers} users
            </div>

            <div className="flex items-center gap-1">
              {/* Previous */}
              <button
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="min-w-[28px] h-7 px-2 border border-[#e4e4df] bg-white rounded-[6px] text-[#4a4a4a] text-[12.5px] hover:bg-[#f7f7f4] disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {/* Numbered Page Buttons */}
              {paginationItems.map((item, idx) => {
                if (item === "…") {
                  return (
                    <span
                      key={idx}
                      className="min-w-[28px] h-7 flex items-center justify-center text-[#888]"
                    >
                      …
                    </span>
                  );
                }
                const isCurr = item === page;
                return (
                  <button
                    key={idx}
                    onClick={() => setPage(Number(item))}
                    className={`min-w-[28px] h-7 px-2 border rounded-[6px] text-[12.5px] transition-all flex items-center justify-center cursor-pointer ${
                      isCurr
                        ? "bg-[#f5efdc] text-[#1f1f1f] border-[#e6dfc6] font-semibold"
                        : "bg-white text-[#4a4a4a] border-[#e4e4df] hover:bg-[#f7f7f4]"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}

              {/* Next */}
              <button
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
                className="min-w-[28px] h-7 px-2 border border-[#e4e4df] bg-white rounded-[6px] text-[#4a4a4a] text-[12.5px] hover:bg-[#f7f7f4] disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>

        {/* MAP SECTION (4 cols on XL, 1:1 HTML) */}
        <div className="xl:col-span-4 h-[560px] rounded-[14px] overflow-hidden border border-[#ececec] shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)] bg-white">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d44196.236392315026!2d-93.81033787191589!3d46.185289524094266!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x52b157a8f77c8e1f%3A0xfbe655e10ff018bc!2sVineland%2C%20MN%2056359%2C%20USA!5e0!3m2!1sen!2sin!4v1781021191340!5m2!1sen!2sin"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="User Map Location View"
          />
        </div>
      </section>

      {/* ===================== EDIT USER MODAL ===================== */}
      {editUserModal && userToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">Edit User</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {userToEdit.email}
                </p>
              </div>
              <button
                onClick={() => setEditUserModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="py-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={editForm.first_name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, first_name: e.target.value })
                    }
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:border-[#2d4a23]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={editForm.last_name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, last_name: e.target.value })
                    }
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:border-[#2d4a23]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm({ ...editForm, phone: e.target.value })
                  }
                  placeholder="+1 (555) 000-0000"
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:border-[#2d4a23]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) =>
                      setEditForm({ ...editForm, role: e.target.value })
                    }
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:border-[#2d4a23]"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm({ ...editForm, status: e.target.value })
                    }
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:border-[#2d4a23]"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditUserModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="px-5 py-2 rounded-xl bg-[#2d4a23] hover:bg-[#203619] text-white text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {editSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== USER DETAILS MODAL ===================== */}
      {viewUserModal && selectedUserDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#2d4a23]/10 text-[#2d4a23] font-extrabold flex items-center justify-center text-lg">
                  {selectedUserDetails.first_name &&
                  selectedUserDetails.first_name !== "null"
                    ? String(selectedUserDetails.first_name).charAt(0)
                    : selectedUserDetails.email?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {getUserDisplayName(selectedUserDetails)}
                  </h2>
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

            {/* Profile Content */}
            <div className="py-5 space-y-6">
              {/* Overview Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-gray-50/70 border border-gray-100 text-xs">
                <div>
                  <span className="text-gray-400 block font-medium">Role</span>
                  <span className="font-semibold text-gray-800 capitalize">
                    {String(selectedUserDetails.role || "user")}
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
