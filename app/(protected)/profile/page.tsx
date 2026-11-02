"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Lock,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Camera,
  Loader2,
  Eye,
  EyeOff,
  ShieldCheck,
  Building,
  KeyRound,
  RefreshCw,
  Sparkles,
  ArrowRight,
  X,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  getMyProfile,
  updateMyProfile,
  changePasswordApi,
  getStates,
  StateItem,
  API_URL,
} from "@/lib/api";

export default function AdminProfilePage() {
  const [activeTab, setActiveTab] = useState<"overview" | "edit" | "security">(
    "overview",
  );
  const [loading, setLoading] = useState(true);
  const [states, setStates] = useState<StateItem[]>([]);
  const [statesLoading, setStatesLoading] = useState(false);

  // Profile data
  const [userData, setUserData] = useState<any>(null);

  // Edit Form State
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    display_name: "",
    username: "",
    email: "",
    phone: "",
    street_address: "",
    street_address_2: "",
    city: "",
    state: "",
    zipcode: "",
    date_of_birth: "",
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Helper to format avatar URL
  const getAvatarUrl = (url?: string | null) => {
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

  // Format date of birth helper (e.g. YYYY-MM-DD for date input)
  const formatDateForInput = (dob?: string) => {
    if (!dob) return "";
    // If format is DD-MM-YYYY
    const ddmmyyyy = /^(\d{2})-(\d{2})-(\d{4})$/.exec(dob);
    if (ddmmyyyy) {
      return `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`;
    }
    // If format is ISO
    try {
      const d = new Date(dob);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split("T")[0];
      }
    } catch {
      // ignore
    }
    return dob;
  };

  // Convert input date (YYYY-MM-DD) to API expected format (MM-DD-YYYY or DD-MM-YYYY)
  const formatDateForSubmit = (dateStr?: string) => {
    if (!dateStr) return "";
    // If already has dashes
    const parts = dateStr.split("-");
    if (parts.length === 3 && parts[0].length === 4) {
      // YYYY-MM-DD -> DD-MM-YYYY (or matching curl e.g. 02-03-2003)
      const [year, month, day] = parts;
      return `${day}-${month}-${year}`;
    }
    return dateStr;
  };

  // Fetch Admin Profile
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyProfile();
      const user = res?.data?.user || res?.user || res?.data || res;
      setUserData(user);

      const profile = user?.profile || {};
      const initialForm = {
        first_name: user?.first_name || profile?.first_name || "",
        last_name: user?.last_name || profile?.last_name || "",
        display_name: user?.display_name || profile?.display_name || "",
        username: user?.username || profile?.username || "",
        email: user?.email || "",
        phone: profile?.phone || user?.phone || "",
        street_address: profile?.street_address || "",
        street_address_2: profile?.street_address_2 || "",
        city: profile?.city || "",
        state:
          profile?.state?.state_name ||
          (typeof profile?.state === "string" ? profile?.state : "") ||
          "",
        zipcode: profile?.zipcode || "",
        date_of_birth: formatDateForInput(
          profile?.date_of_birth || user?.date_of_birth || "",
        ),
      };

      setEditForm(initialForm);
      if (profile?.profile_picture || user?.photoURL) {
        setAvatarPreview(
          getAvatarUrl(profile?.profile_picture || user?.photoURL),
        );
      }
    } catch (err: any) {
      console.error("Fetch admin profile error:", err);
      toast.error(err?.message || "Failed to load admin profile");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch States list for dropdown
  useEffect(() => {
    const fetchStates = async () => {
      setStatesLoading(true);
      try {
        const res = await getStates(1, 100);
        let list: StateItem[] = [];
        if (res && res.data) {
          list = Array.isArray(res.data) ? res.data : res.data.states || [];
        } else if (Array.isArray(res)) {
          list = res;
        }
        setStates(list);
      } catch (err) {
        console.warn("Failed to load states:", err);
      } finally {
        setStatesLoading(false);
      }
    };

    fetchProfile();
    fetchStates();
  }, [fetchProfile]);

  // Handle avatar file selection and immediately update profile image
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error("Image file size should not exceed 15MB");
      return;
    }

    setAvatarFile(file);
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);

    // Immediately upload and update the profile picture on backend
    setUploadingAvatar(true);
    const uploadToastId = toast.loading("Updating profile picture...");

    try {
      const formData = new FormData();
      formData.append("profile_picture", file);
      
      // Preserve current profile fields to prevent any backend overwriting
      if (editForm.first_name) formData.append("first_name", editForm.first_name.trim());
      if (editForm.last_name) formData.append("last_name", editForm.last_name.trim());
      if (editForm.display_name) formData.append("display_name", editForm.display_name.trim());
      if (editForm.phone) formData.append("phone", editForm.phone.trim());
      if (editForm.street_address) formData.append("street_address", editForm.street_address.trim());
      if (editForm.street_address_2) formData.append("street_address_2", editForm.street_address_2.trim());
      if (editForm.city) formData.append("city", editForm.city.trim());
      if (editForm.state) formData.append("state", editForm.state.trim());
      if (editForm.zipcode) formData.append("zipcode", editForm.zipcode.trim());
      if (editForm.date_of_birth) {
        formData.append("date_of_birth", formatDateForSubmit(editForm.date_of_birth));
      }

      const res = await updateMyProfile(formData);
      const updatedUserRes = res?.data?.user || res?.user || res?.data || res;
      const newPicUrl =
        updatedUserRes?.profile?.profile_picture ||
        updatedUserRes?.photoURL ||
        objectUrl;

      // Update local storage
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          const parsed = JSON.parse(stored);
          const updatedUser = {
            ...parsed,
            photoURL: getAvatarUrl(newPicUrl),
            profile: {
              ...(parsed.profile || {}),
              profile_picture: getAvatarUrl(newPicUrl),
            },
          };
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }
      } catch {
        // ignore
      }

      // Notify Header and other components to update image
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("onSpot:userProfileUpdated"));
      }

      toast.success("Profile picture updated successfully!", { id: uploadToastId });
      await fetchProfile();
    } catch (err: any) {
      console.error("Avatar update error:", err);
      toast.error(err?.message || "Failed to update profile picture", { id: uploadToastId });
    } finally {
      setUploadingAvatar(false);
      // Reset input value so re-selecting same file triggers onChange
      e.target.value = "";
    }
  };

  // Remove / Null current profile picture
  const handleRemoveAvatar = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (!avatarPreview && !avatarFile) return;

    setUploadingAvatar(true);
    const removeToastId = toast.loading("Removing profile picture...");

    try {
      // 1. Try sending FormData with empty/null profile_picture
      // In multipart form, pass empty string or null identifier
      const formData = new FormData();
      formData.append("profile_picture", "");
      if (editForm.first_name) formData.append("first_name", editForm.first_name.trim());
      if (editForm.last_name) formData.append("last_name", editForm.last_name.trim());
      if (editForm.display_name) formData.append("display_name", editForm.display_name.trim());
      if (editForm.phone) formData.append("phone", editForm.phone.trim());
      if (editForm.street_address) formData.append("street_address", editForm.street_address.trim());
      if (editForm.street_address_2) formData.append("street_address_2", editForm.street_address_2.trim());
      if (editForm.city) formData.append("city", editForm.city.trim());
      if (editForm.state) formData.append("state", editForm.state.trim());
      if (editForm.zipcode) formData.append("zipcode", editForm.zipcode.trim());
      if (editForm.date_of_birth) {
        formData.append("date_of_birth", formatDateForSubmit(editForm.date_of_birth));
      }

      try {
        await updateMyProfile(formData);
      } catch {
        // Fallback to JSON payload if FormData empty string is ignored or errors
        await updateMyProfile({
          profile_picture: null,
          first_name: editForm.first_name.trim(),
          last_name: editForm.last_name.trim(),
          display_name: editForm.display_name.trim(),
          phone: editForm.phone.trim(),
          street_address: editForm.street_address.trim(),
          street_address_2: editForm.street_address_2.trim(),
          city: editForm.city.trim(),
          state: editForm.state.trim(),
          zipcode: editForm.zipcode.trim(),
          date_of_birth: editForm.date_of_birth ? formatDateForSubmit(editForm.date_of_birth) : undefined,
        });
      }

      setAvatarFile(null);
      setAvatarPreview(null);

      // Update local storage
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          const parsed = JSON.parse(stored);
          const updatedUser = {
            ...parsed,
            photoURL: null,
            profile: {
              ...(parsed.profile || {}),
              profile_picture: null,
            },
          };
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }
      } catch {
        // ignore
      }

      // Notify Header
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("onSpot:userProfileUpdated"));
      }

      toast.success("Profile picture removed successfully!", { id: removeToastId });
      await fetchProfile();
    } catch (err: any) {
      console.error("Remove avatar error:", err);
      toast.error(err?.message || "Failed to remove profile picture", { id: removeToastId });
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Submit profile edit
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);

    try {
      const formData = new FormData();
      formData.append("first_name", editForm.first_name.trim());
      formData.append("last_name", editForm.last_name.trim());
      formData.append("display_name", editForm.display_name.trim());
      formData.append("phone", editForm.phone.trim());
      formData.append("street_address", editForm.street_address.trim());
      formData.append("street_address_2", editForm.street_address_2.trim());
      formData.append("city", editForm.city.trim());
      formData.append("state", editForm.state.trim());
      formData.append("zipcode", editForm.zipcode.trim());

      if (editForm.date_of_birth) {
        formData.append(
          "date_of_birth",
          formatDateForSubmit(editForm.date_of_birth),
        );
      }

      if (avatarFile) {
        formData.append("profile_picture", avatarFile);
      }

      const res = await updateMyProfile(formData);
      toast.success("Profile updated successfully!");

      // Update local storage so Header immediately reflects the changes
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          const parsed = JSON.parse(stored);
          const updatedUser = {
            ...parsed,
            first_name: editForm.first_name,
            last_name: editForm.last_name,
            display_name: editForm.display_name,
            phone: editForm.phone,
            photoURL: avatarPreview || parsed.photoURL,
            profile: {
              ...(parsed.profile || {}),
              first_name: editForm.first_name,
              last_name: editForm.last_name,
              display_name: editForm.display_name,
              phone: editForm.phone,
              street_address: editForm.street_address,
              street_address_2: editForm.street_address_2,
              city: editForm.city,
              state: editForm.state,
              zipcode: editForm.zipcode,
              profile_picture: avatarPreview || parsed.profile?.profile_picture,
            },
          };
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }
      } catch {
        // ignore
      }

      // Notify Header and other components to update image & profile details
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("onSpot:userProfileUpdated"));
      }

      await fetchProfile();
      setActiveTab("overview");
    } catch (err: any) {
      console.error("Save profile error:", err);
      toast.error(err?.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  // Submit password change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordForm.currentPassword) {
      toast.error("Please enter your current password");
      return;
    }
    if (!passwordForm.newPassword) {
      toast.error("Please enter a new password");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }
    if (passwordForm.currentPassword === passwordForm.newPassword) {
      toast.error("New password must be different from your current password");
      return;
    }

    setChangingPassword(true);
    try {
      await changePasswordApi({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      toast.success("Password changed successfully!");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setActiveTab("overview");
    } catch (err: any) {
      console.error("Change password error:", err);
      toast.error(err?.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  const fullName =
    [
      userData?.first_name || editForm.first_name,
      userData?.last_name || editForm.last_name,
    ]
      .filter(Boolean)
      .join(" ") ||
    userData?.display_name ||
    "Administrator";

  const adminEmail = userData?.email || "admin@onspot.com";
  const adminUsername =
    userData?.username ||
    userData?.profile?.username ||
    editForm.username ||
    "admin";
  const adminRole = userData?.role || "Super Administrator";

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-[#2d4a23] animate-spin" />
        <p className="text-sm text-gray-500 font-medium">
          Loading profile details...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Hero Header Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#173a1e] via-[#234b28] to-[#123118] rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        {/* Subtle decorative background shapes */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 -mb-16 w-80 h-80 rounded-full bg-[#f5efdc]/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          {/* Avatar with status badge & remove button */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white/20 shadow-2xl overflow-hidden bg-emerald-950/60 flex items-center justify-center text-white text-3xl font-bold backdrop-blur-xs relative">
              {uploadingAvatar ? (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1 z-10 text-white">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-300" />
                  <span className="text-[10px] font-medium">Updating...</span>
                </div>
              ) : null}
              {avatarPreview ? (
                <Image
                  src={avatarPreview}
                  alt={fullName}
                  width={112}
                  height={112}
                  className="w-full h-full object-cover"
                />
              ) : (
                fullName.charAt(0).toUpperCase()
              )}
            </div>

            {/* Quick edit photo overlay button */}
            <label
              htmlFor="hero-avatar-upload"
              className={`absolute inset-0 rounded-full bg-black/40 text-white flex flex-col items-center justify-center transition-opacity text-xs ${
                uploadingAvatar ? "opacity-0 pointer-events-none" : "opacity-0 group-hover:opacity-100 cursor-pointer"
              }`}
              title="Change profile picture"
            >
              <Camera className="w-6 h-6 mb-1" />
              <span>Change</span>
              <input
                id="hero-avatar-upload"
                type="file"
                accept="image/*"
                disabled={uploadingAvatar}
                className="hidden"
                onChange={handleAvatarChange}
              />
            </label>

            {/* Cross icon to remove/null current avatar */}
            {avatarPreview && !uploadingAvatar && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-md cursor-pointer border-2 border-white transition-transform hover:scale-110 z-20"
                title="Remove profile image"
                aria-label="Remove profile image"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            <div
              className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-white shadow-xs"
              title="Active Admin"
            />
          </div>

          {/* User Primary Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mb-1.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight truncate">
                {fullName}
              </h1>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-[#f5efdc] text-[#1f1f1f] shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2d4a23]" />
                {adminRole}
              </span>
            </div>

            <p className="text-white/80 text-sm flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-2">
              <span className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-emerald-300" />
                {adminEmail}
              </span>
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-emerald-300" />@{adminUsername}
              </span>
              {editForm.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-emerald-300" />
                  {editForm.phone}
                </span>
              )}
            </p>
          </div>

          {/* Action Navigation Pill Buttons */}
          <div className="flex items-center gap-2 self-center sm:self-auto shrink-0">
            <button
              onClick={() => setActiveTab("edit")}
              className="px-4 py-2.5 rounded-xl bg-white text-[#1f1f1f] hover:bg-[#f5efdc] font-semibold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-[#2d4a23]" />
              Edit Profile
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-all border border-white/20 backdrop-blur-xs flex items-center gap-2 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-300" />
              Security
            </button>
          </div>
        </div>

        {/* Tab navigation bar within the card bottom */}
        <div className="flex items-center gap-2 mt-8 border-t border-white/15 pt-4 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "overview"
                ? "bg-white text-[#1f1f1f] shadow-md"
                : "text-white/80 hover:text-white hover:bg-white/10"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Profile Overview
          </button>
          <button
            onClick={() => setActiveTab("edit")}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "edit"
                ? "bg-white text-[#1f1f1f] shadow-md"
                : "text-white/80 hover:text-white hover:bg-white/10"
            }`}
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit Profile
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "security"
                ? "bg-white text-[#1f1f1f] shadow-md"
                : "text-white/80 hover:text-white hover:bg-white/10"
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            Security & Password
          </button>
        </div>
      </div>

      {/* TAB CONTENT: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          {/* Left Column: Essential Summary Cards */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Details Card */}
            <div className="bg-white rounded-2xl p-6 border border-[#ececec] shadow-xs space-y-5">
              <h2 className="text-sm font-bold text-[#1f1f1f] uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-gray-100">
                <Sparkles className="w-4 h-4 text-[#2d4a23]" />
                Identity & Access
              </h2>

              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-gray-400 font-medium block">
                    Username
                  </span>
                  <div className="font-semibold text-gray-800 text-sm mt-0.5 flex items-center gap-2">
                    @{adminUsername}
                    <span className="text-[10px] font-normal px-2 py-0.5 rounded-md bg-gray-100 text-gray-500">
                      Non-editable
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-gray-400 font-medium block">
                    Email Address
                  </span>
                  <div className="font-semibold text-gray-800 text-sm mt-0.5">
                    {adminEmail}
                  </div>
                </div>

                <div>
                  <span className="text-gray-400 font-medium block">
                    Administrative Role
                  </span>
                  <div className="font-semibold text-gray-800 text-sm mt-0.5 capitalize">
                    {adminRole}
                  </div>
                </div>

                <div>
                  <span className="text-gray-400 font-medium block">
                    Account Status
                  </span>
                  <div className="font-semibold text-emerald-700 text-sm mt-0.5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Active & Verified
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setActiveTab("security")}
                  className="w-full py-2.5 px-4 rounded-xl border border-gray-200 hover:border-[#2d4a23] hover:bg-[#faf5e6] text-[#2d4a23] font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  Change Account Password
                </button>
              </div>
            </div>

            {/* Quick Tips / Security Card */}
            <div className="bg-[#f5efdc]/60 rounded-2xl p-5 border border-[#eae2c9] space-y-3 text-xs text-[#2d4a23]">
              <div className="flex items-center gap-2 font-bold">
                <ShieldCheck className="w-4 h-4 text-[#2d4a23]" />
                Admin Security Tips
              </div>
              <p className="text-gray-600 leading-relaxed text-[11px]">
                To ensure high platform integrity, please keep your password
                updated regularly and maintain your contact details up to date.
              </p>
            </div>
          </div>

          {/* Right Column: Detailed Personal & Address Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Details Section */}
            <div className="bg-white rounded-2xl p-6 border border-[#ececec] shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-[#2d4a23]" />
                  Personal Information
                </h2>
                <button
                  onClick={() => setActiveTab("edit")}
                  className="text-xs font-semibold text-[#2d4a23] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                <div className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-100">
                  <span className="text-gray-400 block font-medium mb-1">
                    First Name
                  </span>
                  <span className="font-semibold text-gray-900 text-sm">
                    {editForm.first_name || "—"}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-100">
                  <span className="text-gray-400 block font-medium mb-1">
                    Last Name
                  </span>
                  <span className="font-semibold text-gray-900 text-sm">
                    {editForm.last_name || "—"}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-100">
                  <span className="text-gray-400 block font-medium mb-1">
                    Display Name
                  </span>
                  <span className="font-semibold text-gray-900 text-sm">
                    {editForm.display_name || "—"}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-100">
                  <span className="text-gray-400 block font-medium mb-1">
                    Date of Birth
                  </span>
                  <span className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    {editForm.date_of_birth
                      ? formatDateForSubmit(editForm.date_of_birth)
                      : "—"}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-100 sm:col-span-2">
                  <span className="text-gray-400 block font-medium mb-1">
                    Phone Number
                  </span>
                  <span className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    {editForm.phone || "Not provided"}
                  </span>
                </div>
              </div>
            </div>

            {/* Address Information Section */}
            <div className="bg-white rounded-2xl p-6 border border-[#ececec] shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#2d4a23]" />
                  Address & Location
                </h2>
                <button
                  onClick={() => setActiveTab("edit")}
                  className="text-xs font-semibold text-[#2d4a23] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                <div className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-100 sm:col-span-2">
                  <span className="text-gray-400 block font-medium mb-1">
                    Street Address
                  </span>
                  <span className="font-semibold text-gray-900 text-sm">
                    {editForm.street_address || "Not provided"}
                  </span>
                </div>

                {editForm.street_address_2 && (
                  <div className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-100 sm:col-span-2">
                    <span className="text-gray-400 block font-medium mb-1">
                      Street Address 2 (Apt, Suite, Landmark)
                    </span>
                    <span className="font-semibold text-gray-900 text-sm">
                      {editForm.street_address_2}
                    </span>
                  </div>
                )}

                <div className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-100">
                  <span className="text-gray-400 block font-medium mb-1">
                    City
                  </span>
                  <span className="font-semibold text-gray-900 text-sm">
                    {editForm.city || "—"}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-100">
                  <span className="text-gray-400 block font-medium mb-1">
                    State / Province
                  </span>
                  <span className="font-semibold text-gray-900 text-sm">
                    {editForm.state || "—"}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-100">
                  <span className="text-gray-400 block font-medium mb-1">
                    Postal / Zip Code
                  </span>
                  <span className="font-semibold text-gray-900 text-sm">
                    {editForm.zipcode || "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: EDIT PROFILE */}
      {activeTab === "edit" && (
        <div className="bg-white rounded-2xl border border-[#ececec] shadow-xs p-6 sm:p-8 animate-in fade-in duration-200">
          <div className="pb-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-[#2d4a23]" />
                Edit Profile Details
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Update your personal information, address, and profile photo.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className="text-xs font-semibold text-gray-600 hover:text-gray-900 underline self-start sm:self-auto cursor-pointer"
            >
              Cancel & Back to Overview
            </button>
          </div>

          <form onSubmit={handleSaveProfile} className="mt-8 space-y-8 text-xs">
            {/* Read-Only Account Identifiers */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                System Identifiers (Read-Only)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-600 font-medium mb-1">
                    Username (Non-editable)
                  </label>
                  <input
                    type="text"
                    value={adminUsername}
                    disabled
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed text-xs font-medium"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    The admin username is fixed for security identification.
                  </p>
                </div>

                <div>
                  <label className="block text-gray-600 font-medium mb-1">
                    Email Address (Account ID)
                  </label>
                  <input
                    type="email"
                    value={adminEmail}
                    disabled
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed text-xs font-medium"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Primary login credential linked to this account.
                  </p>
                </div>
              </div>
            </div>

            {/* Editable Profile Information */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.first_name}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        first_name: e.target.value,
                      }))
                    }
                    placeholder="Enter first name"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#2d4a23] focus:ring-1 focus:ring-[#2d4a23] text-xs transition-all"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.last_name}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        last_name: e.target.value,
                      }))
                    }
                    placeholder="Enter last name"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#2d4a23] focus:ring-1 focus:ring-[#2d4a23] text-xs transition-all"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={editForm.display_name}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        display_name: e.target.value,
                      }))
                    }
                    placeholder="e.g. Peter Parker"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#2d4a23] focus:ring-1 focus:ring-[#2d4a23] text-xs transition-all"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    placeholder="e.g. 5674932783"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#2d4a23] focus:ring-1 focus:ring-[#2d4a23] text-xs transition-all"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={editForm.date_of_birth}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        date_of_birth: e.target.value,
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#2d4a23] focus:ring-1 focus:ring-[#2d4a23] text-xs transition-all bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Address Details */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                Address Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="sm:col-span-2 md:col-span-3">
                  <label className="block text-gray-700 font-medium mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={editForm.street_address}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        street_address: e.target.value,
                      }))
                    }
                    placeholder="e.g. 123 South Virginia St"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#2d4a23] focus:ring-1 focus:ring-[#2d4a23] text-xs transition-all"
                  />
                </div>

                <div className="sm:col-span-2 md:col-span-3">
                  <label className="block text-gray-700 font-medium mb-1">
                    Street Address Line 2 (Apt, Suite, Landmark)
                  </label>
                  <input
                    type="text"
                    value={editForm.street_address_2}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        street_address_2: e.target.value,
                      }))
                    }
                    placeholder="e.g. Suite 400 / Near South Dakota"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#2d4a23] focus:ring-1 focus:ring-[#2d4a23] text-xs transition-all"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={editForm.city}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, city: e.target.value }))
                    }
                    placeholder="e.g. South Dakota"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#2d4a23] focus:ring-1 focus:ring-[#2d4a23] text-xs transition-all"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    State
                  </label>
                  {states.length > 0 ? (
                    <select
                      value={editForm.state}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          state: e.target.value,
                        }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#2d4a23] focus:ring-1 focus:ring-[#2d4a23] text-xs transition-all bg-white"
                    >
                      <option value="">Select State</option>
                      {states.map((st) => (
                        <option
                          key={st.id || st.state_code}
                          value={st.state_name}
                        >
                          {st.state_name} ({st.state_code})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={editForm.state}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          state: e.target.value,
                        }))
                      }
                      placeholder="e.g. Vermont"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#2d4a23] focus:ring-1 focus:ring-[#2d4a23] text-xs transition-all"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    Zipcode
                  </label>
                  <input
                    type="text"
                    value={editForm.zipcode}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        zipcode: e.target.value,
                      }))
                    }
                    placeholder="e.g. 493857"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#2d4a23] focus:ring-1 focus:ring-[#2d4a23] text-xs transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Form Action Buttons */}
            <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                disabled={savingProfile}
                className="px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingProfile}
                className="px-6 py-2.5 rounded-xl bg-[#2d4a23] hover:bg-[#233b1c] text-white font-semibold text-xs transition-colors shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {savingProfile ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Save Profile Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB CONTENT: SECURITY & CHANGE PASSWORD */}
      {activeTab === "security" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          {/* Left Column: Security Status Overview */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-[#ececec] shadow-xs space-y-5">
              <h2 className="text-sm font-bold text-[#1f1f1f] uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-gray-100">
                <ShieldCheck className="w-4 h-4 text-[#2d4a23]" />
                Security Status
              </h2>

              <div className="space-y-4 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      Encrypted Token Authentication
                    </h4>
                    <p className="text-gray-500 text-[11px] mt-0.5">
                      Bearer tokens with automatic session rotation.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      Protected Endpoint
                    </h4>
                    <p className="text-gray-500 text-[11px] mt-0.5">
                      Password update via authenticated auth API.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-600 space-y-2">
                <p className="font-semibold text-gray-800">
                  Password Requirements:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-gray-500">
                  <li>At least 6 characters long</li>
                  <li>Include uppercase and lowercase letters</li>
                  <li>
                    Include at least one number and special symbol (#, @, etc.)
                  </li>
                  <li>Must not match your current password</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column: Change Password Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-[#ececec] shadow-xs p-6 sm:p-8">
              <div className="pb-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-[#2d4a23]" />
                  Change Password
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Enter your current password and choose a strong new password
                  to protect your admin account.
                </p>
              </div>

              <form
                onSubmit={handleChangePassword}
                className="mt-6 space-y-5 text-xs max-w-xl"
              >
                {/* Current Password */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-1.5">
                    Current Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      required
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm((prev) => ({
                          ...prev,
                          currentPassword: e.target.value,
                        }))
                      }
                      placeholder="Enter your current password"
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#2d4a23] focus:ring-1 focus:ring-[#2d4a23] text-xs transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-1.5">
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm((prev) => ({
                          ...prev,
                          newPassword: e.target.value,
                        }))
                      }
                      placeholder="Enter new password"
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#2d4a23] focus:ring-1 focus:ring-[#2d4a23] text-xs transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-1.5">
                    Confirm New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                      placeholder="Re-enter your new password"
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#2d4a23] focus:ring-1 focus:ring-[#2d4a23] text-xs transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {passwordForm.newPassword &&
                    passwordForm.confirmPassword &&
                    passwordForm.newPassword !==
                      passwordForm.confirmPassword && (
                      <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Passwords do not match
                      </p>
                    )}
                </div>

                {/* Submit Button */}
                <div className="pt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPasswordForm({
                        currentPassword: "",
                        newPassword: "",
                        confirmPassword: "",
                      });
                      setActiveTab("overview");
                    }}
                    disabled={changingPassword}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="px-6 py-2.5 rounded-xl bg-[#2d4a23] hover:bg-[#233b1c] text-white font-semibold text-xs transition-colors shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {changingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Updating Password...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        Update Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
