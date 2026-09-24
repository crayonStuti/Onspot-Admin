"use client";

import React, { useState, useEffect } from "react";
import { X, Upload, Loader2, Sparkles, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createMembership, updateMembership, API_URL } from "@/lib/api";

export interface MembershipItem {
  id: string;
  name: string;
  description?: string;
  feature?: any;
  price_usd?: string | number;
  duration_days?: number | string;
  totalUsers?: string | number;
  created_at?: string;
  updated_at?: string;
  image?: string;
  license_reminders?: boolean | string;
  gallery_limit?: number | string;
  is_friends_unlimited?: boolean | string;
  friends_limit?: number | string;
  licenses_limit?: number | string;
  is_licenses_unlimited?: boolean | string;
  is_sponsorship_free?: boolean | string;
  map_activity?: boolean | string;
}

interface MembershipFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: MembershipItem | null;
}

// Default feature dictionary with types matching backend defaults
const DEFAULT_FEATURES: Record<string, any> = {
  front_end_pages: true,
  license_wallet: "2 state",
  gps_mapping_basic: true,
  extended_mapping_friends: "1 friend",
  dnr_library_access: false,
  post_tagging: "1 state",
  social_media_channels: "1 channel",
  kids_included: "1",
  ads_displayed: true,
  license_expiry_alerts: false,
  location_setting: true,
  ai_assistant: false,
};

// Helper to determine if a value is boolean or boolean-string
export function isBooleanFeature(val: any): boolean {
  if (typeof val === "boolean") return true;
  if (typeof val === "string") {
    const trimmed = val.trim().toLowerCase();
    return trimmed === "true" || trimmed === "false";
  }
  return false;
}

// Helper to coerce boolean/boolean-string to boolean
export function toBooleanFeature(val: any): boolean {
  if (typeof val === "boolean") return val;
  if (typeof val === "string") {
    return val.trim().toLowerCase() === "true";
  }
  return Boolean(val);
}

function parseBool(val: any, fallback = false): boolean {
  if (val === undefined || val === null || val === "") return fallback;
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val === 1;
  if (typeof val === "string") {
    const s = val.trim().toLowerCase();
    if (s === "true" || s === "1") return true;
    if (s === "false" || s === "0") return false;
  }
  return fallback;
}

export default function MembershipFormModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: MembershipFormModalProps) {
  const isEdit = Boolean(initialData);

  // Main Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceUsd, setPriceUsd] = useState("");
  const [durationDays, setDurationDays] = useState("");

  // New main fields (outside feature payload)
  const [licenseReminders, setLicenseReminders] = useState(false);
  const [galleryLimit, setGalleryLimit] = useState("20");
  const [isFriendsUnlimited, setIsFriendsUnlimited] = useState(false);
  const [friendsLimit, setFriendsLimit] = useState("6");
  const [licensesLimit, setLicensesLimit] = useState("1");
  const [isLicensesUnlimited, setIsLicensesUnlimited] = useState(false);
  const [isSponsorshipFree, setIsSponsorshipFree] = useState(false);
  const [mapActivity, setMapActivity] = useState(false);

  // Image Upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Features state
  const [features, setFeatures] = useState<Record<string, any>>(DEFAULT_FEATURES);
  const [newKey, setNewKey] = useState("");
  const [newValueType, setNewValueType] = useState<"boolean" | "text">("boolean");
  const [saving, setSaving] = useState(false);

  // Initialize or reset form state
  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setName(initialData.name || "");
      setDescription(initialData.description || "");
      setPriceUsd(
        initialData.price_usd !== undefined && initialData.price_usd !== null
          ? String(initialData.price_usd)
          : ""
      );
      setDurationDays(
        initialData.duration_days !== undefined && initialData.duration_days !== null
          ? String(initialData.duration_days)
          : ""
      );

      // Main fields
      setLicenseReminders(parseBool(initialData.license_reminders, false));
      setGalleryLimit(
        initialData.gallery_limit !== undefined && initialData.gallery_limit !== null
          ? String(initialData.gallery_limit)
          : "20"
      );
      setIsFriendsUnlimited(parseBool(initialData.is_friends_unlimited, false));
      setFriendsLimit(
        initialData.friends_limit !== undefined && initialData.friends_limit !== null
          ? String(initialData.friends_limit)
          : "6"
      );
      setLicensesLimit(
        initialData.licenses_limit !== undefined && initialData.licenses_limit !== null
          ? String(initialData.licenses_limit)
          : "1"
      );
      setIsLicensesUnlimited(parseBool(initialData.is_licenses_unlimited, false));
      setIsSponsorshipFree(parseBool(initialData.is_sponsorship_free, false));
      setMapActivity(parseBool(initialData.map_activity, false));

      // Image
      setImageFile(null);
      if (initialData.image) {
        setImagePreview(
          initialData.image.startsWith("http")
            ? initialData.image
            : `${API_URL}${initialData.image.startsWith("/") ? "" : "/"}${initialData.image}`
        );
      } else {
        setImagePreview(null);
      }

      // Parse feature
      let parsedFeat: Record<string, any> = {};
      if (initialData.feature) {
        try {
          parsedFeat =
            typeof initialData.feature === "string"
              ? JSON.parse(initialData.feature)
              : initialData.feature;
        } catch (e) {
          console.warn("Failed to parse features:", e);
        }
      }

      const merged: Record<string, any> = { ...DEFAULT_FEATURES };
      Object.entries(parsedFeat).forEach(([k, val]) => {
        if (val === "true" || val === true) {
          merged[k] = true;
        } else if (val === "false" || val === false) {
          merged[k] = false;
        } else {
          merged[k] = val;
        }
      });
      setFeatures(merged);
    } else {
      // Create fresh default form
      setName("");
      setDescription("");
      setPriceUsd("");
      setDurationDays("");
      setLicenseReminders(false);
      setGalleryLimit("20");
      setIsFriendsUnlimited(false);
      setFriendsLimit("6");
      setLicensesLimit("1");
      setIsLicensesUnlimited(false);
      setIsSponsorshipFree(false);
      setMapActivity(false);
      setImageFile(null);
      setImagePreview(null);
      setFeatures({ ...DEFAULT_FEATURES });
    }
    setNewKey("");
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleFeatureToggle = (key: string, checked: boolean) => {
    setFeatures((prev) => ({
      ...prev,
      [key]: checked,
    }));
  };

  const handleFeatureTextChange = (key: string, value: string) => {
    setFeatures((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleRemoveFeature = (key: string) => {
    setFeatures((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const handleAddFeature = () => {
    const trimmed = newKey.trim().toLowerCase().replace(/\s+/g, "_");
    if (!trimmed) {
      toast.error("Please enter a feature name");
      return;
    }
    if (features[trimmed] !== undefined) {
      toast.error("This feature key already exists");
      return;
    }
    setFeatures((prev) => ({
      ...prev,
      [trimmed]: newValueType === "boolean" ? true : "",
    }));
    setNewKey("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Plan Name is required");
      return;
    }
    if (priceUsd === "" || priceUsd === null) {
      toast.error("Price (USD) is required");
      return;
    }

    setSaving(true);
    try {
      const payload = new FormData();
      payload.append("name", name.trim());
      payload.append("description", description.trim());
      payload.append("price_usd", priceUsd);
      if (durationDays) {
        payload.append("duration_days", durationDays);
      }

      // Main parameters above features
      payload.append("license_reminders", String(licenseReminders));
      payload.append("gallery_limit", String(galleryLimit || "0"));
      payload.append("is_friends_unlimited", String(isFriendsUnlimited));
      payload.append(
        "friends_limit",
        isFriendsUnlimited ? "0" : String(friendsLimit || "0")
      );
      payload.append("licenses_limit", String(licensesLimit || "0"));
      payload.append("is_licenses_unlimited", String(isLicensesUnlimited));
      payload.append("is_sponsorship_free", String(isSponsorshipFree));
      payload.append("map_activity", String(mapActivity));

      // Plan Feature Toggles & values
      Object.entries(features).forEach(([key, val]) => {
        payload.append(`feature[${key}]`, String(val));
      });

      if (imageFile) {
        payload.append("image", imageFile);
      }

      if (isEdit && initialData?.id) {
        await updateMembership(initialData.id, payload);
        toast.success("Membership plan updated successfully");
      } else {
        await createMembership(payload);
        toast.success("Membership plan created successfully");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Save membership error:", err);
      toast.error(err?.message || "Failed to save membership plan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/55 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#fbfbf9]/60 flex-shrink-0">
          <div>
            <h3 className="text-base font-bold text-gray-900 tracking-tight">
              {isEdit ? "Edit Membership Plan" : "Create New Membership Plan"}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Configure plan pricing, limits, privileges, and feature toggles
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form
          id="membership-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-gray-700"
        >
          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-3.5 bg-[#0E3E27] rounded-full" />
              General Details
            </h4>

            {/* Plan Name */}
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Plan Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Pro Plan, Basic Tier, VIP Angler"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-[#0E3E27] focus:ring-1 focus:ring-[#0E3E27] bg-white transition-all shadow-xs"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Description
              </label>
              <textarea
                rows={2}
                placeholder="Brief summary of who this plan is best suited for..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-[#0E3E27] focus:ring-1 focus:ring-[#0E3E27] bg-white transition-all shadow-xs"
              />
            </div>

            {/* Price & Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Price (USD) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00 (Enter 0 for free)"
                    value={priceUsd}
                    onChange={(e) => setPriceUsd(e.target.value)}
                    className="w-full h-10 pl-7 pr-3 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-[#0E3E27] focus:ring-1 focus:ring-[#0E3E27] bg-white transition-all shadow-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Duration (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="30 (leave blank for Forever)"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-[#0E3E27] focus:ring-1 focus:ring-[#0E3E27] bg-white transition-all shadow-xs"
                />
              </div>
            </div>

            {/* Icon / Image Upload */}
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Plan Icon / Badge Image
              </label>
              <div className="flex items-center gap-3 p-3 bg-gray-50/70 border border-dashed border-gray-300 rounded-xl">
                {imagePreview ? (
                  <div className="w-12 h-12 rounded-xl border border-gray-200 overflow-hidden p-1 flex-shrink-0 bg-white shadow-xs">
                    <img
                      src={imagePreview}
                      alt="Plan preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-xl border border-gray-200 flex items-center justify-center flex-shrink-0 bg-white text-gray-400">
                    <Upload className="w-5 h-5 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setImageFile(file);
                      if (file) setImagePreview(URL.createObjectURL(file));
                    }}
                    className="text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-white file:text-[#0E3E27] file:border-gray-200 file:border hover:file:bg-gray-50 cursor-pointer"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    PNG, SVG or JPEG recommended. Transparent background works best.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Quotas & Limits (Main fields above feature) */}
          <div className="space-y-3.5 pt-2 border-t border-gray-100">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-3.5 bg-[#0E3E27] rounded-full" />
              Quotas & Limits
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Licenses Limit */}
              <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-gray-800 text-xs">
                    Licenses Limit
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isLicensesUnlimited}
                      onChange={(e) => setIsLicensesUnlimited(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-[#0E3E27] accent-[#0E3E27] cursor-pointer"
                    />
                    <span>Unlimited</span>
                  </label>
                </div>
                <input
                  type="number"
                  min="0"
                  disabled={isLicensesUnlimited}
                  value={isLicensesUnlimited ? "" : licensesLimit}
                  onChange={(e) => setLicensesLimit(e.target.value)}
                  placeholder={isLicensesUnlimited ? "Unlimited" : "e.g. 1"}
                  className="w-full h-8 px-2.5 rounded-lg border border-gray-200 text-xs text-gray-900 bg-white disabled:bg-gray-100 disabled:text-gray-400 focus:outline-none focus:border-[#0E3E27]"
                />
              </div>

              {/* Friends Limit */}
              <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-gray-800 text-xs">
                    Friends Limit
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFriendsUnlimited}
                      onChange={(e) => setIsFriendsUnlimited(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-[#0E3E27] accent-[#0E3E27] cursor-pointer"
                    />
                    <span>Unlimited</span>
                  </label>
                </div>
                <input
                  type="number"
                  min="0"
                  disabled={isFriendsUnlimited}
                  value={isFriendsUnlimited ? "" : friendsLimit}
                  onChange={(e) => setFriendsLimit(e.target.value)}
                  placeholder={isFriendsUnlimited ? "Unlimited" : "e.g. 6"}
                  className="w-full h-8 px-2.5 rounded-lg border border-gray-200 text-xs text-gray-900 bg-white disabled:bg-gray-100 disabled:text-gray-400 focus:outline-none focus:border-[#0E3E27]"
                />
              </div>

              {/* Gallery Limit */}
              <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-200 space-y-2">
                <label className="block font-semibold text-gray-800 text-xs">
                  Gallery Limit
                </label>
                <input
                  type="number"
                  min="0"
                  value={galleryLimit}
                  onChange={(e) => setGalleryLimit(e.target.value)}
                  placeholder="e.g. 20"
                  className="w-full h-8 px-2.5 rounded-lg border border-gray-200 text-xs text-gray-900 bg-white focus:outline-none focus:border-[#0E3E27]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Core Privileges (Main fields above feature) */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-3.5 bg-[#0E3E27] rounded-full" />
              Core Privileges
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* License Reminders */}
              <label className="flex items-center justify-between p-3 bg-gray-50/80 hover:bg-gray-100/70 transition-colors rounded-xl border border-gray-200 cursor-pointer">
                <div>
                  <div className="font-semibold text-gray-800 text-xs">
                    License Reminders
                  </div>
                  <div className="text-[10.5px] text-gray-500">
                    Expiry reminder alerts
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={licenseReminders}
                  onChange={(e) => setLicenseReminders(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0E3E27] accent-[#0E3E27] cursor-pointer"
                />
              </label>

              {/* Sponsorship Free */}
              <label className="flex items-center justify-between p-3 bg-gray-50/80 hover:bg-gray-100/70 transition-colors rounded-xl border border-gray-200 cursor-pointer">
                <div>
                  <div className="font-semibold text-gray-800 text-xs">
                    Sponsorship Free
                  </div>
                  <div className="text-[10.5px] text-gray-500">
                    Sponsorship perks
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isSponsorshipFree}
                  onChange={(e) => setIsSponsorshipFree(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0E3E27] accent-[#0E3E27] cursor-pointer"
                />
              </label>

              {/* Map Activity */}
              <label className="flex items-center justify-between p-3 bg-gray-50/80 hover:bg-gray-100/70 transition-colors rounded-xl border border-gray-200 cursor-pointer">
                <div>
                  <div className="font-semibold text-gray-800 text-xs">
                    Map Activity
                  </div>
                  <div className="text-[10.5px] text-gray-500">
                    GPS map pin activities
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={mapActivity}
                  onChange={(e) => setMapActivity(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0E3E27] accent-[#0E3E27] cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Section 4: Plan Feature Toggles & Values */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-3.5 bg-[#0E3E27] rounded-full" />
                Plan Feature Toggles
              </h4>
              <span className="text-[11px] text-gray-400">
                {Object.keys(features).length} configured features
              </span>
            </div>

            {/* Features Container */}
            <div className="space-y-2 max-h-60 overflow-y-auto p-3.5 bg-gray-50/80 rounded-xl border border-gray-200">
              {Object.entries(features).map(([k, val]) => {
                const isBool = isBooleanFeature(val);
                const isChecked = toBooleanFeature(val);

                return (
                  <div
                    key={k}
                    className="flex items-center justify-between py-1.5 px-2 bg-white rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="capitalize font-medium text-gray-800 text-xs">
                        {k.replace(/_/g, " ")}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {isBool ? (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <span className="text-[11px] font-semibold text-gray-500 min-w-8 text-right">
                            {isChecked ? "Yes" : "No"}
                          </span>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) =>
                              handleFeatureToggle(k, e.target.checked)
                            }
                            className="w-4 h-4 rounded text-[#0E3E27] accent-[#0E3E27] cursor-pointer"
                          />
                        </label>
                      ) : (
                        <input
                          type="text"
                          value={String(val ?? "")}
                          onChange={(e) =>
                            handleFeatureTextChange(k, e.target.value)
                          }
                          className="h-7 w-32 px-2.5 rounded-lg border border-gray-200 text-xs text-gray-800 bg-white focus:outline-none focus:border-[#0E3E27]"
                        />
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(k)}
                        title="Remove feature"
                        className="text-gray-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add Custom Feature Row */}
            <div className="flex items-center gap-2 p-2 bg-gray-50/80 rounded-xl border border-gray-200">
              <input
                type="text"
                placeholder="Add custom feature (e.g. emergency_sos)"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddFeature();
                  }
                }}
                className="flex-1 h-8 px-2.5 rounded-lg border border-gray-200 text-xs text-gray-800 bg-white focus:outline-none focus:border-[#0E3E27]"
              />
              <select
                value={newValueType}
                onChange={(e) =>
                  setNewValueType(e.target.value as "boolean" | "text")
                }
                className="h-8 px-2 rounded-lg border border-gray-200 text-xs text-gray-700 bg-white focus:outline-none"
              >
                <option value="boolean">Toggle (Yes/No)</option>
                <option value="text">Custom Text</option>
              </select>
              <button
                type="button"
                onClick={handleAddFeature}
                className="h-8 px-3 rounded-lg bg-gray-200 hover:bg-[#0E3E27] hover:text-white text-gray-700 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-[#fbfbf9]/60 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="membership-form"
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-[#0E3E27] hover:bg-[#092c1b] text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving Plan...</span>
              </>
            ) : (
              <span>{isEdit ? "Save Changes" : "Create Plan"}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
