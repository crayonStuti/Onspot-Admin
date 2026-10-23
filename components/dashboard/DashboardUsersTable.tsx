"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Eye,
  AlertCircle,
  User as UserIcon,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import TableActionMenu from "@/components/admin/TableActionMenu";
import {
  getUsers,
  UserItem,
  API_URL,
} from "@/lib/api";
import ViewUserDetailsModal from "./ViewUserDetailsModal";

export default function DashboardUsersTable() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickView, setQuickView] = useState("all");

  // Selected User Modal for View Details
  const [viewModalUser, setViewModalUser] = useState<UserItem | null>(null);

  // Fetch max 6 users based on filter
  const fetchUsers = useCallback(async (filterType: string) => {
    setLoading(true);
    try {
      let statusParam = "";
      let planLevelParam = "";

      if (filterType === "active") {
        statusParam = "active";
      } else if (filterType === "inactive") {
        statusParam = "suspended";
      } else if (filterType === "premium") {
        planLevelParam = "premium";
      }

      const res = await getUsers({
        page: 1,
        limit: 6,
        status: statusParam,
        plan_level: planLevelParam,
      });

      if (res && res.data && Array.isArray(res.data.users)) {
        // Enforce max 6 users
        setUsers(res.data.users.slice(0, 6));
      } else {
        setUsers([]);
      }
    } catch (err: any) {
      console.error("Dashboard fetch users error:", err);
      toast.error(err?.message || "Failed to load users for dashboard");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(quickView);
  }, [quickView, fetchUsers]);

  const handleQuickViewChange = (val: string) => {
    setQuickView(val);
  };

  // Helper to format clean display name
  const getUserDisplayName = (user: UserItem) => {
    const fn =
      user.first_name && user.first_name !== "null" ? user.first_name : "";
    const ln =
      user.last_name && user.last_name !== "null" ? user.last_name : "";
    const name = `${fn} ${ln}`.trim();
    return name || user.display_name || user.email?.split("@")[0] || "User";
  };

  // Helper to resolve profile image URL
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

  return (
    <div className="bg-white rounded-[14px] p-4 sm:p-6 border border-[#ececec] shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)] overflow-hidden w-full min-w-0">
      {/* Panel Head */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 mb-2 border-b border-[#ececec]">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-[#1f1f1f] text-[15px]">
            Users
          </h3>
          <span className="text-[11px] text-[#7D848D] bg-[#f5f5f2] px-2 py-0.5 rounded-full font-medium">
            Recent {users.length}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* View all Users dropdown filter */}
          <select
            value={quickView}
            onChange={(e) => handleQuickViewChange(e.target.value)}
            className="h-[30px] text-[12px] sm:text-[12.5px] text-[#4a4a4a] border border-[#e4e4df] rounded-[7px] px-2.5 sm:px-3 pr-6 sm:pr-7 bg-white focus:outline-none cursor-pointer font-medium appearance-none shrink-0 transition-colors hover:border-[#cbcbc5]"
            style={{
              backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 8px center",
            }}
          >
            <option value="all">View all Users</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="premium">Premium</option>
          </select>

          {/* Direct link to Users management */}
          <Link
            href="/users"
            className="h-[30px] px-2.5 sm:px-3 rounded-[7px] border border-[#e4e4df] bg-white hover:bg-[#f7f7f2] text-[12px] font-medium text-[#4a4a4a] inline-flex items-center gap-1.5 transition-colors shrink-0"
            title="Open Full Users Page"
          >
            <span>Manage</span>
            <ExternalLink className="w-3 h-3 text-[#7D848D]" />
          </Link>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto w-full max-w-full">
        <table className="w-full min-w-[640px] text-left border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-[#ececec]">
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
              <th className="py-3 px-3 font-semibold text-[#111111] text-[13px] text-right sm:text-left">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1f1ed]">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200" />
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
                  <td className="py-3.5 px-3 text-right sm:text-left">
                    <div className="h-7 w-16 bg-gray-200 rounded ml-auto sm:ml-0" />
                  </td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-[#7D848D]">
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <AlertCircle className="w-7 h-7 text-gray-300" />
                    <p className="text-[13px] font-semibold text-gray-700">
                      No users found.
                    </p>
                    <p className="text-[11.5px] text-gray-400">
                      Try selecting a different filter option above.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((user) => {
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
                    className="hover:bg-[#fbfbf8] transition-colors"
                  >
                    {/* Name with Avatar */}
                    <td className="py-3.5 px-3 align-middle text-[#111111] font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-[32px] h-[32px] rounded-full bg-[#f1f1ed] text-[#4a4a4a] font-semibold flex items-center justify-center text-xs flex-shrink-0 overflow-hidden relative">
                          {user.profile?.profile_picture ? (
                            <Image
                              src={getProfileImageUrl(
                                user.profile.profile_picture,
                              )}
                              alt={fullName}
                              width={32}
                              height={32}
                              className="w-full h-full object-cover"
                              unoptimized
                            />
                          ) : (
                            fullName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <span className="truncate max-w-[150px] font-medium text-[#111111] text-[13px]">
                          {fullName}
                        </span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3.5 px-3 align-middle text-[#7D848D] truncate max-w-[180px]">
                      {user.email}
                    </td>

                    {/* Membership Pill */}
                    <td className="py-3.5 px-3 align-middle">
                      <span
                        className={`inline-block px-3 py-0.5 rounded-[6px] text-[12px] font-medium border ${
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
                    <td className="py-3.5 px-3 align-middle text-[#7D848D] whitespace-nowrap text-[12.5px]">
                      {joinDate}
                    </td>

                    {/* Status with Dot */}
                    <td className="py-3.5 px-3 align-middle whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[12.5px] font-medium ${
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

                    {/* Actions */}
                    <td className="py-3.5 px-3 align-middle whitespace-nowrap text-right sm:text-left">
                      <div className="flex items-center justify-end sm:justify-start gap-2 relative">
                        {/* View Button */}
                        <button
                          type="button"
                          onClick={() => setViewModalUser(user)}
                          className="w-[30px] h-[30px] border border-[#e2e2dc] rounded-[7px] bg-white text-[#7D848D] hover:bg-[#f7f7f2] hover:text-[#1f1f1f] hover:border-[#d4d4cd] inline-flex items-center justify-center transition-colors cursor-pointer"
                          title="View Details"
                          aria-label="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* More Actions 3-dots Menu */}
                        <TableActionMenu
                          items={[
                            {
                              label: "View Profile",
                              icon: <UserIcon className="w-4 h-4 text-[#7D848D]" />,
                              onClick: () => setViewModalUser(user),
                            },
                            {
                              label: "Manage in Users",
                              icon: (
                                <ExternalLink className="w-4 h-4 text-[#7D848D]" />
                              ),
                              onClick: () => {
                                window.location.href = `/users?search=${encodeURIComponent(
                                  user.email,
                                )};`
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

      {/* View User Details Modal */}
      <ViewUserDetailsModal
        isOpen={Boolean(viewModalUser)}
        onClose={() => setViewModalUser(null)}
        user={viewModalUser}
      />
    </div>
  );
}
