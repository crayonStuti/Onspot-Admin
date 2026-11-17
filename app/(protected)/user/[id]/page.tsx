"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Award,
  FileBadge,
  Edit2,
  Trash2,
  KeyRound,
  Ban,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  X,
  Globe,
  RefreshCw,
  Copy,
  Check,
  Bookmark,
  Share2,
  User as UserIcon,
  Compass,
} from "lucide-react";
import { toast } from "sonner";
import {
  getUserById,
  deleteUser,
  getStates,
  getUserLicenses,
  getUserBookmarks,
  getUserMapPins,
  UserItem,
  API_URL,
} from "@/lib/api";
import { EditUserModal } from "@/app/(protected)/users/components/EditUserModal";
import { EditMembershipModal } from "@/app/(protected)/users/components/EditMembershipModal";
import { SuspendUserModal } from "@/app/(protected)/users/components/SuspendUserModal";
import { ResetPasswordModal } from "@/app/(protected)/users/components/ResetPasswordModal";
import {
  UserLicensesModal,
  UserLicenseItem,
} from "@/app/(protected)/users/components/UserLicensesModal";
import { StateItem } from "@/app/(protected)/users/components/AddUserModal";

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = (params?.id as string) || "";

  // Data states
  const [user, setUser] = useState<UserItem | null>(null);
  const [licenses, setLicenses] = useState<UserLicenseItem[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [mapPins, setMapPins] = useState<any[]>([]);
  const [states, setStates] = useState<StateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<
    "overview" | "licenses" | "pins" | "bookmarks"
  >("overview");

  // Modal States
  const [editUserModal, setEditUserModal] = useState(false);
  const [membershipModal, setMembershipModal] = useState(false);
  const [suspendModal, setSuspendModal] = useState(false);
  const [resetPasswordModal, setResetPasswordModal] = useState(false);
  const [licensesModal, setLicensesModal] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [previewLicenseImage, setPreviewLicenseImage] = useState<string | null>(
    null,
  );

  // Helper to resolve profile image url
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

  // Helper for Display Name
  const getUserDisplayName = (u: UserItem) => {
    const fn = u.first_name && u.first_name !== "null" ? u.first_name : "";
    const ln = u.last_name && u.last_name !== "null" ? u.last_name : "";
    const name = `${fn} ${ln}`.trim();
    return name || u.display_name || u.email?.split("@")[0] || "User";
  };

  // Fetch full user details
  const fetchUserDetails = useCallback(
    async (isBackground = false) => {
      if (!userId) return;
      if (!isBackground) setLoading(true);
      else setRefreshing(true);

      try {
        const [userRes, statesRes] = await Promise.allSettled([
          getUserById(userId),
          getStates(),
        ]);

        if (statesRes.status === "fulfilled" && statesRes.value) {
          const list =
            statesRes.value.data?.states ||
            statesRes.value.states ||
            statesRes.value.data ||
            statesRes.value;
          if (Array.isArray(list)) setStates(list);
        }

        if (userRes.status === "fulfilled" && userRes.value) {
          const payload = userRes.value;
          const fullUser =
            payload.data?.user || payload.user || payload.data || payload;

          if (!fullUser || !fullUser.id) {
            setNotFound(true);
            return;
          }

          setUser(fullUser);
          setNotFound(false);

          // Deep fetches for licenses, bookmarks, and pins
          const email = fullUser.email || "";
          const [licRes, bkmkRes, pinsRes] = await Promise.allSettled([
            Array.isArray(fullUser.licenses) && fullUser.licenses.length > 0
              ? Promise.resolve(fullUser.licenses)
              : getUserLicenses(userId),
            email ? getUserBookmarks(email) : Promise.resolve([]),
            email ? getUserMapPins(email, 50) : Promise.resolve([]),
          ]);

          // Process licenses
          if (licRes.status === "fulfilled" && licRes.value) {
            const raw = licRes.value;
            const licList = Array.isArray(raw)
              ? raw
              : raw.data?.licenses || raw.licenses || raw.data || [];
            setLicenses(Array.isArray(licList) ? licList : []);
          }

          // Process bookmarks
          if (bkmkRes.status === "fulfilled" && bkmkRes.value) {
            const raw = bkmkRes.value;
            const bmList = Array.isArray(raw)
              ? raw
              : raw.data?.bookmarks || raw.bookmarks || raw.data || [];
            setBookmarks(Array.isArray(bmList) ? bmList : []);
          }

          // Process map pins
          if (pinsRes.status === "fulfilled" && pinsRes.value) {
            const raw = pinsRes.value;
            const pinsList = Array.isArray(raw)
              ? raw
              : raw.data?.pins || raw.pins || raw.data || [];
            setMapPins(Array.isArray(pinsList) ? pinsList : []);
          }
        } else {
          setNotFound(true);
        }
      } catch (err: any) {
        console.error("Failed to load user details:", err);
        setNotFound(true);
        toast.error("Failed to load user details");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    fetchUserDetails();
  }, [fetchUserDetails]);

  const handleCopyId = () => {
    if (!user?.id) return;
    navigator.clipboard.writeText(user.id);
    setCopiedId(true);
    toast.success("User ID copied to clipboard");
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleConfirmDelete = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      await deleteUser(user.id);
      toast.success(`User ${user.email} was successfully deleted`);
      setDeleteConfirmOpen(false);
      router.push("/users");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user account");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="w-9 h-9 text-[#2d4a23] animate-spin" />
        <p className="text-sm font-medium text-gray-500">
          Loading user details...
        </p>
      </div>
    );
  }

  if (notFound || !user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 max-w-md mx-auto text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center border border-red-100">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">User Not Found</h2>
          <p className="text-xs text-gray-500 mt-1">
            The requested user could not be found or may have been deleted.
          </p>
        </div>
        <Link
          href="/users"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#2d4a23] hover:bg-[#233a1b] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Users List</span>
        </Link>
      </div>
    );
  }

  // Derived user details
  const displayName = getUserDisplayName(user);
  const avatarUrl = getProfileImageUrl(
    user.profile?.profile_picture || user.profile_picture,
  );
  const rawMembership =
    user.profile?.current_tier ||
    user.profile?.membership?.name ||
    user.profile?.membership ||
    user.membership_tier ||
    "Free";
  const membershipStr = String(
    typeof rawMembership === "object"
      ? rawMembership.name || "Free"
      : rawMembership,
  );
  const isPremium = membershipStr.toLowerCase().includes("premium");
  const isBasic = membershipStr.toLowerCase().includes("basic");
  const isActive = user.status !== "inactive" && user.status !== "suspended";
  const roleStr = String(user.role || user.user?.role || "user");
  const userProfileState = user.profile?.state as any;
  const userDirectState = user.state as any;
  const stateDisplay =
    (typeof userProfileState === "object"
      ? userProfileState?.state_name
      : userProfileState) ||
    (typeof userDirectState === "object"
      ? userDirectState?.state_name
      : userDirectState) ||
    "Not specified";
  const phoneDisplay = user.profile?.phone || user.phone || "Not provided";
  const joinDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* ===================== TOP BREADCRUMB & ACTIONS BAR ===================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-3">
          <Link
            href="/users"
            className="w-9 h-9 border border-[#e2e2dc] bg-white rounded-xl text-gray-600 hover:text-gray-900 hover:bg-[#f7f7f2] flex items-center justify-center transition-colors shadow-2xs"
            title="Back to Users"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Link href="/users" className="hover:underline text-gray-600">
                Users
              </Link>
              <span>/</span>
              <span className="text-gray-900 font-medium">User Details</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              {displayName}
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fetchUserDetails(true)}
            disabled={refreshing}
            className="px-3 py-2 border border-[#e2e2dc] bg-white rounded-xl text-gray-700 hover:bg-[#f7f7f2] text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Refresh details"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setEditUserModal(true)}
            className="px-3.5 py-2 bg-[#2d4a23] hover:bg-[#233a1b] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>

          {/* <button
            type="button"
            onClick={() => setMembershipModal(true)}
            className="px-3.5 py-2 border border-[#cfdcef] bg-[#eaf1fa] hover:bg-[#deebf8] text-[#3b6bbf] text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Award className="w-3.5 h-3.5" />
            <span>Membership</span>
          </button> */}

          <button
            type="button"
            onClick={() => setResetPasswordModal(true)}
            className="px-3.5 py-2 border border-[#e2e2dc] bg-white hover:bg-[#f7f7f2] text-gray-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-600" />
            <span>Reset Password</span>
          </button>

          <button
            type="button"
            onClick={() => setSuspendModal(true)}
            className={`px-3.5 py-2 border text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              isActive
                ? "border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800"
                : "border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800"
            }`}
          >
            {isActive ? (
              <>
                <Ban className="w-3.5 h-3.5" />
                <span>Suspend</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Reactivate</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setDeleteConfirmOpen(true)}
            className="px-3 py-2 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Delete user"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>

      {/* ===================== HERO PROFILE CARD ===================== */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-7 relative overflow-hidden">
        {/* Subtle decorative background gradient */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-radial from-[#2d4a23]/5 to-transparent pointer-events-none rounded-full blur-2xl -mr-20 -mt-20" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-emerald-50 text-[#2d4a23] font-bold text-2xl sm:text-3xl flex items-center justify-center flex-shrink-0 border-2 border-emerald-100/80 shadow-xs overflow-hidden relative">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              ) : (
                displayName.charAt(0).toUpperCase()
              )}
            </div>

            {/* Basic Info */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {displayName}
                </h2>
                {user.profile?.username && (
                  <span className="text-xs font-medium text-gray-400">
                    @{user.profile.username}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  {user.email}
                </span>
                <span className="text-gray-300">•</span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  {phoneDisplay}
                </span>
                <span className="text-gray-300">•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  {stateDisplay}
                </span>
              </div>

              {/* Status and Tier Badges */}
              <div className="flex flex-wrap items-center gap-2 pt-1.5">
                {/* Status Pill */}
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                    isActive
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200/80"
                      : "bg-red-50 text-red-700 border border-red-200/80"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isActive ? "bg-emerald-500" : "bg-red-500"
                    }`}
                  />
                  {user.status
                    ? user.status.charAt(0).toUpperCase() + user.status.slice(1)
                    : "Active"}
                </span>

                {/* Membership Badge */}
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${
                    isPremium
                      ? "bg-[#eaf1fa] text-[#3b6bbf] border-[#cfdcef]"
                      : isBasic
                        ? "bg-[#fff4d6] text-[#b58105] border-[#f1dba0]"
                        : "bg-[#f1f1ed] text-[#7D848D] border-[#e2e2dc]"
                  }`}
                >
                  <Award className="w-3 h-3" />
                  <span>{membershipStr}</span>
                </span>

                {/* Role Pill */}
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 capitalize">
                  <Shield className="w-3 h-3 text-gray-500" />
                  {roleStr}
                </span>

                {/* Hunter / Fisherman tags */}
                {user.profile?.is_hunter && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-green-50 text-green-700 border border-green-200">
                    Hunter
                  </span>
                )}
                {user.profile?.is_fisherman && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    Fisherman
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stat Highlights */}
          <div className="grid grid-cols-3 gap-3 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
            <div className="text-center p-2 rounded-xl bg-gray-50/70 border border-gray-100/60 min-w-[70px]">
              <span className="block text-xl font-bold text-gray-900">
                {licenses.length}
              </span>
              <span className="text-[11px] text-gray-500 font-medium">
                Licenses
              </span>
            </div>
            <div className="text-center p-2 rounded-xl bg-gray-50/70 border border-gray-100/60 min-w-[70px]">
              <span className="block text-xl font-bold text-gray-900">
                {mapPins.length}
              </span>
              <span className="text-[11px] text-gray-500 font-medium">
                Map Pins
              </span>
            </div>
            <div className="text-center p-2 rounded-xl bg-gray-50/70 border border-gray-100/60 min-w-[70px]">
              <span className="block text-xl font-bold text-gray-900">
                {bookmarks.length}
              </span>
              <span className="text-[11px] text-gray-500 font-medium">
                Saved
              </span>
            </div>
          </div>
        </div>

        {/* User ID quick copy footer */}
        <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between text-xs text-gray-400 gap-2">
          <div className="flex items-center gap-2">
            <span>User ID:</span>
            <code className="text-gray-700 font-mono bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
              {user.id}
            </code>
            <button
              onClick={handleCopyId}
              className="p-1 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors cursor-pointer"
              title="Copy User ID"
            >
              {copiedId ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          <div>Joined On: {joinDate}</div>
        </div>
      </div>

      {/* ===================== TAB NAVIGATION ===================== */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === "overview"
              ? "border-[#2d4a23] text-[#2d4a23]"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>Profile Overview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("licenses")}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === "licenses"
              ? "border-[#2d4a23] text-[#2d4a23]"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <FileBadge className="w-4 h-4" />
          <span>User Licenses ({licenses.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("pins")}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === "pins"
              ? "border-[#2d4a23] text-[#2d4a23]"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Map Pins ({mapPins.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("bookmarks")}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === "bookmarks"
              ? "border-[#2d4a23] text-[#2d4a23]"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>Bookmarks ({bookmarks.length})</span>
        </button>
      </div>

      {/* ===================== TAB CONTENT ===================== */}

      {/* 1. OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal & Account Information */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-[#2d4a23]" />
                  <span>Personal & Account Information</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setEditUserModal(true)}
                  className="text-xs text-[#2d4a23] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100/80">
                  <span className="text-gray-400 block font-medium mb-1">
                    First Name
                  </span>
                  <span className="font-semibold text-gray-800 text-sm">
                    {user.first_name && user.first_name !== "null"
                      ? user.first_name
                      : "—"}
                  </span>
                </div>

                <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100/80">
                  <span className="text-gray-400 block font-medium mb-1">
                    Last Name
                  </span>
                  <span className="font-semibold text-gray-800 text-sm">
                    {user.last_name && user.last_name !== "null"
                      ? user.last_name
                      : "—"}
                  </span>
                </div>

                <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100/80">
                  <span className="text-gray-400 block font-medium mb-1">
                    Display Name
                  </span>
                  <span className="font-semibold text-gray-800 text-sm">
                    {user.display_name || displayName}
                  </span>
                </div>

                <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100/80">
                  <span className="text-gray-400 block font-medium mb-1">
                    Username
                  </span>
                  <span className="font-semibold text-gray-800 text-sm">
                    {user.profile?.username || user.username || "—"}
                  </span>
                </div>

                <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100/80">
                  <span className="text-gray-400 block font-medium mb-1">
                    Email Address
                  </span>
                  <span className="font-semibold text-gray-800 text-sm break-all">
                    {user.email}
                  </span>
                </div>

                <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100/80">
                  <span className="text-gray-400 block font-medium mb-1">
                    Phone Number
                  </span>
                  <span className="font-semibold text-gray-800 text-sm">
                    {phoneDisplay}
                  </span>
                </div>

                <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100/80">
                  <span className="text-gray-400 block font-medium mb-1">
                    Account Status
                  </span>
                  <span
                    className={`font-semibold text-sm capitalize ${
                      isActive ? "text-emerald-700" : "text-red-700"
                    }`}
                  >
                    {user.status || "Active"}
                  </span>
                </div>

                <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100/80">
                  <span className="text-gray-400 block font-medium mb-1">
                    User Role
                  </span>
                  <span className="font-semibold text-gray-800 text-sm capitalize">
                    {roleStr}
                  </span>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#2d4a23]" />
                  <span>Address & Location</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="sm:col-span-2 p-3 bg-gray-50/70 rounded-xl border border-gray-100/80">
                  <span className="text-gray-400 block font-medium mb-1">
                    Street Address
                  </span>
                  <span className="font-semibold text-gray-800 text-sm">
                    {user.profile?.street_address ||
                      user.street_address ||
                      "Not specified"}
                  </span>
                  {(user.profile?.street_address_2 ||
                    user.street_address_2) && (
                    <span className="text-gray-500 block text-xs mt-0.5">
                      Apt/Suite:{" "}
                      {user.profile?.street_address_2 || user.street_address_2}
                    </span>
                  )}
                </div>

                <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100/80">
                  <span className="text-gray-400 block font-medium mb-1">
                    City
                  </span>
                  <span className="font-semibold text-gray-800 text-sm">
                    {user.profile?.city || user.city || "Not specified"}
                  </span>
                </div>

                <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100/80">
                  <span className="text-gray-400 block font-medium mb-1">
                    State
                  </span>
                  <span className="font-semibold text-gray-800 text-sm">
                    {stateDisplay}
                  </span>
                </div>

                <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100/80">
                  <span className="text-gray-400 block font-medium mb-1">
                    Zipcode / Postal Code
                  </span>
                  <span className="font-semibold text-gray-800 text-sm">
                    {user.profile?.zipcode || user.zipcode || "Not specified"}
                  </span>
                </div>

                <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100/80">
                  <span className="text-gray-400 block font-medium mb-1">
                    Firebase UID
                  </span>
                  <span className="font-mono text-gray-700 text-xs truncate block">
                    {user.firebase_uid || "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Membership Summary & Preferences */}
          <div className="space-y-6">
            {/* Membership Box */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#2d4a23]" />
                  <span>Membership Plan</span>
                </h3>
                {/* <button
                  type="button"
                  onClick={() => setMembershipModal(true)}
                  className="text-xs text-[#2d4a23] font-semibold hover:underline cursor-pointer"
                >
                  Change
                </button> */}
              </div>

              <div
                className={`p-4 rounded-xl border ${
                  isPremium
                    ? "bg-[#eaf1fa]/50 border-[#cfdcef]"
                    : isBasic
                      ? "bg-[#fff4d6]/50 border-[#f1dba0]"
                      : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Current Tier
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                      isPremium
                        ? "bg-[#3b6bbf] text-white"
                        : isBasic
                          ? "bg-[#b58105] text-white"
                          : "bg-gray-600 text-white"
                    }`}
                  >
                    {membershipStr}
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {isPremium
                    ? "Full access to high-tier features, offline GPS pins, and unlimited licenses."
                    : isBasic
                      ? "Standard user access to public land maps and basic tracking."
                      : "Free account with standard platform features."}
                </p>
              </div>

              {/* <button
                type="button"
                onClick={() => setMembershipModal(true)}
                className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold border border-gray-200 transition-colors cursor-pointer"
              >
                Upgrade or Downgrade Membership
              </button> */}
            </div>

            {/* Outdoors & Activity Preferences */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#2d4a23]" />
                  <span>Interests & Activities</span>
                </h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 border border-gray-100">
                  <span className="text-xs font-medium text-gray-700">
                    Hunting Enthusiast
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      user.profile?.is_hunter
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {user.profile?.is_hunter ? "Yes" : "No"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 border border-gray-100">
                  <span className="text-xs font-medium text-gray-700">
                    Fishing Enthusiast
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      user.profile?.is_fisherman
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {user.profile?.is_fisherman ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            </div>

            {/* Social Channels */}
            {(user.profile?.social_channels?.instagram ||
              user.profile?.social_channels?.facebook ||
              user.profile?.social_channels?.twitter) && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-[#2d4a23]" />
                    <span>Social Channels</span>
                  </h3>
                </div>

                <div className="space-y-2 text-xs">
                  {user.profile?.social_channels?.instagram && (
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50">
                      <span className="text-gray-500">Instagram</span>
                      <span className="font-semibold text-gray-800">
                        {user.profile.social_channels.instagram}
                      </span>
                    </div>
                  )}
                  {user.profile?.social_channels?.facebook && (
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50">
                      <span className="text-gray-500">Facebook</span>
                      <span className="font-semibold text-gray-800">
                        {user.profile.social_channels.facebook}
                      </span>
                    </div>
                  )}
                  {user.profile?.social_channels?.twitter && (
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50">
                      <span className="text-gray-500">Twitter / X</span>
                      <span className="font-semibold text-gray-800">
                        {user.profile.social_channels.twitter}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. LICENSES TAB */}
      {activeTab === "licenses" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <FileBadge className="w-5 h-5 text-[#2d4a23]" />
                <span>Assigned Licenses ({licenses.length})</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Government hunting, fishing, and specialty permits assigned to
                this user.
              </p>
            </div>
            {licenses.length > 0 && (
              <button
                type="button"
                onClick={() => setLicensesModal(true)}
                className="px-3.5 py-1.5 border border-[#e2e2dc] bg-[#f7f7f2] hover:bg-[#ecece5] text-xs font-semibold text-gray-800 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
              >
                Open Full Licenses Modal
              </button>
            )}
          </div>

          {licenses.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
                <FileBadge className="w-6 h-6" />
              </div>
              <p className="text-xs font-medium text-gray-500">
                No licenses have been assigned to or registered for this user
                yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {licenses.map((lic, i) => {
                const typeName =
                  lic.license_type || lic.name || lic.title || "License";
                const licNum =
                  lic.license_number ||
                  (lic.id ? `#${lic.id.slice(0, 8)}` : "");
                const stateName = lic.state?.state_name || lic.state_name;
                const issuer = lic.issued_by?.organisation || lic.organisation;
                const validTo = lic.valid_to || lic.expires_at || "Unlimited";
                const isExpired =
                  validTo !== "Unlimited" && new Date(validTo) < new Date();
                const photos = lic.photos || [];
                const rawFrontImg =
                  photos.length > 0 &&
                  photos[0] &&
                  typeof photos[0].front_image === "string"
                    ? photos[0].front_image.trim()
                    : "";
                const rawBackImg =
                  photos.length > 0 &&
                  photos[0] &&
                  typeof photos[0].back_image === "string"
                    ? photos[0].back_image.trim()
                    : "";

                return (
                  <div
                    key={lic.id || i}
                    className="p-4 bg-gray-50/70 hover:bg-gray-50 rounded-2xl border border-gray-100 hover:border-gray-200 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm capitalize">
                          {typeName}
                        </h4>
                        {licNum && (
                          <span className="text-xs text-gray-500 font-mono">
                            {licNum}
                          </span>
                        )}
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isExpired
                            ? "bg-red-100 text-red-700"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {isExpired ? "Expired" : "Active"}
                      </span>
                    </div>

                    <div className="text-xs space-y-1 text-gray-600 pt-2 border-t border-gray-200/60">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Jurisdiction:</span>
                        <span className="font-medium text-gray-800">
                          {stateName || issuer || "State Agency"}
                        </span>
                      </div>
                      {lic.valid_from && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Issued On:</span>
                          <span className="text-gray-700">
                            {new Date(lic.valid_from).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-400">Valid Until:</span>
                        <span
                          className={`font-medium ${
                            isExpired ? "text-red-600" : "text-gray-800"
                          }`}
                        >
                          {validTo !== "Unlimited"
                            ? new Date(validTo).toLocaleDateString()
                            : "Unlimited"}
                        </span>
                      </div>
                    </div>

                    {/* Card Photos */}
                    {(rawFrontImg || rawBackImg) && (
                      <div className="pt-2 border-t border-gray-200/60 flex items-center gap-3">
                        {rawFrontImg && (
                          <div
                            onClick={() => {
                              const full = rawFrontImg.startsWith("http")
                                ? rawFrontImg
                                : `${API_URL}${rawFrontImg.startsWith("/") ? "" : "/"}${rawFrontImg}`;
                              setPreviewLicenseImage(full);
                            }}
                            className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
                            title="Click to zoom front card"
                          >
                            <Image
                              src={
                                rawFrontImg.startsWith("http")
                                  ? rawFrontImg
                                  : `${API_URL}${rawFrontImg.startsWith("/") ? "" : "/"}${rawFrontImg}`
                              }
                              alt="Front License"
                              width={48}
                              height={32}
                              className="w-12 h-8 object-cover rounded border border-gray-200 shadow-2xs"
                            />
                            <span className="text-[10px] text-gray-500 font-medium">
                              Front
                            </span>
                          </div>
                        )}

                        {rawBackImg && (
                          <div
                            onClick={() => {
                              const full = rawBackImg.startsWith("http")
                                ? rawBackImg
                                : `${API_URL}${rawBackImg.startsWith("/") ? "" : "/"}${rawBackImg}`;
                              setPreviewLicenseImage(full);
                            }}
                            className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
                            title="Click to zoom back card"
                          >
                            <Image
                              src={
                                rawBackImg.startsWith("http")
                                  ? rawBackImg
                                  : `${API_URL}${rawBackImg.startsWith("/") ? "" : "/"}${rawBackImg}`
                              }
                              alt="Back License"
                              width={48}
                              height={32}
                              className="w-12 h-8 object-cover rounded border border-gray-200 shadow-2xs"
                            />
                            <span className="text-[10px] text-gray-500 font-medium">
                              Back
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. MAP PINS TAB */}
      {activeTab === "pins" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#2d4a23]" />
                <span>Recorded GPS Pins ({mapPins.length})</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Waypoints and locations saved by this user in the mobile app.
              </p>
            </div>
          </div>

          {mapPins.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
                <MapPin className="w-6 h-6" />
              </div>
              <p className="text-xs font-medium text-gray-500">
                No GPS map pins recorded for this user yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {mapPins.map((pin, i) => (
                <div
                  key={pin.id || i}
                  className="p-3.5 bg-gray-50/70 rounded-xl border border-gray-100 space-y-2 hover:border-gray-200 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-gray-900">
                      {String(pin.title || `Pin #${i + 1}`)}
                    </span>
                    {pin.created_at && (
                      <span className="text-[10px] text-gray-400">
                        {new Date(pin.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-600 font-mono flex items-center gap-2">
                    <span className="bg-white px-2 py-0.5 rounded border border-gray-200">
                      Lat:{" "}
                      {typeof pin.latitude === "number"
                        ? pin.latitude.toFixed(4)
                        : pin.latitude}
                    </span>
                    <span className="bg-white px-2 py-0.5 rounded border border-gray-200">
                      Lng:{" "}
                      {typeof pin.longitude === "number"
                        ? pin.longitude.toFixed(4)
                        : pin.longitude}
                    </span>
                  </div>
                  {pin.notes && (
                    <p className="text-[11px] text-gray-500 line-clamp-2 italic">
                      "{pin.notes}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. BOOKMARKS TAB */}
      {activeTab === "bookmarks" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-[#2d4a23]" />
                <span>Saved Bookmarks ({bookmarks.length})</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Educational resources and articles saved by the user.
              </p>
            </div>
          </div>

          {bookmarks.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
                <Bookmark className="w-6 h-6" />
              </div>
              <p className="text-xs font-medium text-gray-500">
                No bookmarked resources found for this user.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {bookmarks.map((bm, i) => (
                <div
                  key={bm.id || i}
                  className="p-3.5 bg-gray-50/70 rounded-xl border border-gray-100 space-y-1.5"
                >
                  <span className="font-semibold text-xs text-gray-900 block truncate">
                    {bm.title || bm.name || `Saved Resource #${i + 1}`}
                  </span>
                  {bm.category && (
                    <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-gray-200/70 text-gray-700 font-medium">
                      {bm.category}
                    </span>
                  )}
                  {bm.created_at && (
                    <span className="block text-[10px] text-gray-400">
                      Saved: {new Date(bm.created_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================== ACTION MODALS ===================== */}

      {/* Edit Profile Modal */}
      <EditUserModal
        isOpen={editUserModal}
        userToEdit={user}
        onClose={() => setEditUserModal(false)}
        onSuccess={() => fetchUserDetails(true)}
        states={states}
        loadingStates={false}
      />

      {/* Edit Membership Modal */}
      <EditMembershipModal
        isOpen={membershipModal}
        user={user}
        onClose={() => setMembershipModal(false)}
        onSuccess={() => fetchUserDetails(true)}
      />

      {/* Suspend / Reactivate User Modal */}
      <SuspendUserModal
        isOpen={suspendModal}
        user={user}
        onClose={() => setSuspendModal(false)}
        onSuccess={() => fetchUserDetails(true)}
      />

      {/* Reset Password Modal */}
      <ResetPasswordModal
        isOpen={resetPasswordModal}
        user={user}
        onClose={() => setResetPasswordModal(false)}
        onSuccess={() => fetchUserDetails(true)}
      />

      {/* Full Licenses Modal */}
      <UserLicensesModal
        isOpen={licensesModal}
        user={user}
        onClose={() => setLicensesModal(false)}
      />

      {/* License Image Preview Lightbox */}
      {previewLicenseImage && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setPreviewLicenseImage(null)}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] bg-white rounded-2xl overflow-hidden p-2 shadow-2xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewLicenseImage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black text-white transition-colors z-10 cursor-pointer shadow-md"
              title="Close image preview"
            >
              <X className="w-5 h-5" />
            </button>
            <Image
              src={previewLicenseImage}
              alt="License Card Preview"
              width={800}
              height={600}
              className="max-w-full max-h-[85vh] w-auto h-auto object-contain rounded-xl"
            />
          </div>
        </div>
      )}

      {/* Delete User Confirmation Dialog */}
      {deleteConfirmOpen && (
        <div
          onClick={() => {
            if (!deleting) setDeleteConfirmOpen(false);
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
              <strong className="text-gray-900">{user.email}</strong>? All
              associated licenses, map pins, and data will be removed.
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
