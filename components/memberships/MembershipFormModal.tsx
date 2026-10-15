"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Upload,
  Loader2,
  Sparkles,
  Plus,
  Trash2,
  Check,
  Shield,
  Layers,
  DollarSign,
  Users,
  Image as ImageIcon,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { createMembership, updateMembership, API_URL } from "@/lib/api";

export interface MembershipItem {
  id: string;
  name: string;
  level?: string;
  description?: string;
  feature?: any;
  price_usd?: string | number;
  monthly_price?: string | number;
  monthly_price_id?: string | null;
  yearly_price?: string | number;
  yearly_price_id?: string | null;
  stripe_product_id?: string | null;
  taxes?: string | number;
  duration_days?: number | string;
  totalUsers?: string | number;
  subscriber_count?: number;
  subscriber_percentage?: number;
  revenue_generated?: number;
  revenue_percentage?: number;
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

// Quick suggested presets for feature perks
const SUGGESTED_FEATURES = [
  "Unlimited friends",
  "Priority support",
  "Ad-free experience",
  "Custom map markers",
  "GPS mapping & navigation",
  "License wallet alerts",
  "DNR resource library access",
  "High-res gallery uploads",
];

// Helper to determine if a value is boolean or boolean-string (kept for backward compatibility)
export function isBooleanFeature(val: any): boolean {
  if (typeof val === "boolean") return true;
  if (typeof val === "string") {
    const trimmed = val.trim().toLowerCase();
    return trimmed === "true" || trimmed === "false";
  }
  return false;
}

// Helper to coerce boolean/boolean-string to boolean (kept for backward compatibility)
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

// Parses feature payload into an array of strings (supporting array, JSON string array, or legacy dictionary)
export function parseFeaturesToArray(featureData: any): string[] {
  if (!featureData) return [];
  if (Array.isArray(featureData)) {
    return featureData
      .map((item) =>
        typeof item === "string" ? item.trim() : JSON.stringify(item),
      )
      .filter(Boolean);
  }
  if (typeof featureData === "string") {
    try {
      const parsed = JSON.parse(featureData);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) =>
            typeof item === "string" ? item.trim() : JSON.stringify(item),
          )
          .filter(Boolean);
      }
      if (typeof parsed === "object" && parsed !== null) {
        return objectToFeatureStrings(parsed);
      }
    } catch {
      if (featureData.includes("\n")) {
        return featureData
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
      }
      return [featureData.trim()].filter(Boolean);
    }
  }
  if (typeof featureData === "object" && featureData !== null) {
    return objectToFeatureStrings(featureData);
  }
  return [];
}

function objectToFeatureStrings(obj: Record<string, any>): string[] {
  const result: string[] = [];
  for (const [key, val] of Object.entries(obj)) {
    const formatted = key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    if (val === true || val === "true") {
      result.push(formatted);
    } else if (val === false || val === "false") {
      // skip disabled legacy toggles
    } else if (val !== null && val !== undefined && String(val).trim()) {
      result.push(`${formatted}: ${val}`);
    }
  }
  return result;
}

export default function MembershipFormModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: MembershipFormModalProps) {
  const isEdit = Boolean(initialData);

  // 1. Basic & Tier Info
  const [name, setName] = useState("");
  const [level, setLevel] = useState("basic");
  const [description, setDescription] = useState("");

  // 2. Pricing & Taxes
  const [monthlyPrice, setMonthlyPrice] = useState("");
  const [yearlyPrice, setYearlyPrice] = useState("");
  const [taxes, setTaxes] = useState("");

  // 3. Quotas & Limits
  const [friendsLimit, setFriendsLimit] = useState("500");
  const [isFriendsUnlimited, setIsFriendsUnlimited] = useState(false);
  const [licensesLimit, setLicensesLimit] = useState("10");
  const [isLicensesUnlimited, setIsLicensesUnlimited] = useState(false);
  const [galleryLimit, setGalleryLimit] = useState("100");

  // 4. Core Privileges
  const [licenseReminders, setLicenseReminders] = useState(true);
  const [mapActivity, setMapActivity] = useState(true);
  const [isSponsorshipFree, setIsSponsorshipFree] = useState(false);

  // 5. Image & Preview
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // 6. Feature Perks List
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeatureText, setNewFeatureText] = useState("");

  const [saving, setSaving] = useState(false);
  const isFreeLevel = level === "free";

  const handleLevelChange = (newLevel: string) => {
    setLevel(newLevel);
    if (newLevel === "free") {
      setMonthlyPrice("0");
      setYearlyPrice("0");
      setTaxes("0");
    }
  };

  // Initialize or reset form state
  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setName(initialData.name || "");
      setDescription(initialData.description || "");

      // Level
      const rawLevel = (initialData.level || "").toLowerCase().trim();
      let detectedLevel = "basic";
      if (["free", "basic", "premium"].includes(rawLevel)) {
        detectedLevel = rawLevel;
      } else {
        // Fallback detect from name
        const lname = (initialData.name || "").toLowerCase();
        if (
          lname.includes("premium") ||
          lname.includes("gold") ||
          lname.includes("pro")
        ) {
          detectedLevel = "premium";
        } else if (lname.includes("free")) {
          detectedLevel = "free";
        } else {
          detectedLevel = "basic";
        }
      }
      setLevel(detectedLevel);

      // Pricing & Taxes
      if (detectedLevel === "free") {
        setMonthlyPrice("0");
        setYearlyPrice("0");
        setTaxes("0");
      } else {
        const mPrice =
          initialData.monthly_price !== undefined &&
          initialData.monthly_price !== null
            ? initialData.monthly_price
            : initialData.price_usd !== undefined &&
                initialData.price_usd !== null
              ? initialData.price_usd
              : "";
        setMonthlyPrice(String(mPrice));

        const yPrice =
          initialData.yearly_price !== undefined &&
          initialData.yearly_price !== null
            ? initialData.yearly_price
            : "";
        setYearlyPrice(String(yPrice));

        const taxVal =
          initialData.taxes !== undefined && initialData.taxes !== null
            ? initialData.taxes
            : "";
        setTaxes(String(taxVal));
      }

      // Quotas
      setIsFriendsUnlimited(parseBool(initialData.is_friends_unlimited, false));
      setFriendsLimit(
        initialData.friends_limit !== undefined &&
          initialData.friends_limit !== null
          ? String(initialData.friends_limit)
          : "500",
      );

      setIsLicensesUnlimited(
        parseBool(initialData.is_licenses_unlimited, false),
      );
      setLicensesLimit(
        initialData.licenses_limit !== undefined &&
          initialData.licenses_limit !== null
          ? String(initialData.licenses_limit)
          : "10",
      );

      setGalleryLimit(
        initialData.gallery_limit !== undefined &&
          initialData.gallery_limit !== null
          ? String(initialData.gallery_limit)
          : "100",
      );

      // Privileges
      setLicenseReminders(parseBool(initialData.license_reminders, true));
      setMapActivity(parseBool(initialData.map_activity, true));
      setIsSponsorshipFree(parseBool(initialData.is_sponsorship_free, false));

      // Image
      setImageFile(null);
      if (initialData.image) {
        setImageUrl(initialData.image);
        setImagePreview(
          initialData.image.startsWith("http")
            ? initialData.image
            : `${API_URL}${initialData.image.startsWith("/") ? "" : "/"}${initialData.image}`,
        );
      } else {
        setImageUrl("");
        setImagePreview(null);
      }

      // Feature perks
      const parsed = parseFeaturesToArray(initialData.feature);
      setFeatures(
        parsed.length > 0 ? parsed : ["Unlimited friends", "Priority support"],
      );
    } else {
      // Create fresh default form
      setName("");
      setLevel("basic");
      setDescription("");
      setMonthlyPrice("");
      setYearlyPrice("");
      setTaxes("");
      setFriendsLimit("500");
      setIsFriendsUnlimited(false);
      setLicensesLimit("10");
      setIsLicensesUnlimited(false);
      setGalleryLimit("100");
      setLicenseReminders(true);
      setMapActivity(true);
      setIsSponsorshipFree(false);
      setImageFile(null);
      setImageUrl("");
      setImagePreview(null);
      setFeatures([
        "Unlimited friends",
        "Priority support",
        "Ad-free experience",
        "Custom map markers",
      ]);
    }
    setNewFeatureText("");
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  // Features manipulation
  const handleAddFeature = (textToAdd?: string) => {
    const feat = (textToAdd !== undefined ? textToAdd : newFeatureText).trim();
    if (!feat) {
      toast.error("Please enter a feature perk");
      return;
    }
    if (features.some((f) => f.toLowerCase() === feat.toLowerCase())) {
      toast.error("This feature is already added");
      return;
    }
    setFeatures((prev) => [...prev, feat]);
    if (textToAdd === undefined) {
      setNewFeatureText("");
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateFeatureText = (index: number, val: string) => {
    setFeatures((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Plan Name is required");
      return;
    }

    if (!isEdit && !level.trim()) {
      toast.error("Plan Level is required");
      return;
    }

    const effectiveMonthlyPrice = isFreeLevel ? "0" : monthlyPrice;
    const effectiveYearlyPrice = isFreeLevel ? "0" : yearlyPrice;
    const effectiveTaxes = isFreeLevel ? "0" : taxes;

    if (effectiveMonthlyPrice === "" || effectiveMonthlyPrice === null) {
      toast.error("Monthly Price is required (enter 0 for Free)");
      return;
    }

    const featureList = features.map((f) => f.trim()).filter(Boolean);

    setSaving(true);
    try {
      if (imageFile) {
        // Multipart/form-data payload when image file is uploaded
        const formData = new FormData();
        formData.append("name", name.trim());
        if (!isEdit) {
          formData.append("level", level.toLowerCase().trim());
        }
        formData.append("description", description.trim());
        formData.append("monthly_price", String(Number(effectiveMonthlyPrice) || 0));
        formData.append("yearly_price", String(Number(effectiveYearlyPrice) || 0));
        formData.append("taxes", String(Number(effectiveTaxes) || 0));
        formData.append("price_usd", String(Number(effectiveMonthlyPrice) || 0));
        formData.append("feature", JSON.stringify(featureList));
        formData.append("image", imageFile);
        formData.append(
          "friends_limit",
          isFriendsUnlimited ? "0" : String(Number(friendsLimit) || 0),
        );
        formData.append("is_friends_unlimited", String(isFriendsUnlimited));
        formData.append("gallery_limit", String(Number(galleryLimit) || 0));
        formData.append("license_reminders", String(licenseReminders));
        formData.append(
          "licenses_limit",
          isLicensesUnlimited ? "0" : String(Number(licensesLimit) || 0),
        );
        formData.append("is_licenses_unlimited", String(isLicensesUnlimited));
        formData.append("map_activity", String(mapActivity));
        formData.append("is_sponsorship_free", String(isSponsorshipFree));

        if (isEdit && initialData?.id) {
          await updateMembership(initialData.id, formData);
          toast.success("Membership plan updated successfully");
        } else {
          await createMembership(formData);
          toast.success("Membership plan created successfully");
        }
      } else {
        // Standard JSON payload matching the requested API schema
        const jsonBody: Record<string, any> = {
          name: name.trim(),
          ...(!isEdit ? { level: level.toLowerCase().trim() } : {}),
          description: description.trim(),
          monthly_price: Number(effectiveMonthlyPrice) || 0,
          yearly_price: Number(effectiveYearlyPrice) || 0,
          taxes: Number(effectiveTaxes) || 0,
          feature: featureList,
          friends_limit: isFriendsUnlimited ? 0 : Number(friendsLimit) || 0,
          is_friends_unlimited: isFriendsUnlimited,
          gallery_limit: Number(galleryLimit) || 0,
          license_reminders: licenseReminders,
          licenses_limit: isLicensesUnlimited ? 0 : Number(licensesLimit) || 0,
          is_licenses_unlimited: isLicensesUnlimited,
          map_activity: mapActivity,
          is_sponsorship_free: isSponsorshipFree,
        };

        if (imageUrl) {
          jsonBody.image = imageUrl;
        }

        if (isEdit && initialData?.id) {
          await updateMembership(initialData.id, jsonBody);
          toast.success("Membership plan updated successfully");
        } else {
          await createMembership(jsonBody);
          toast.success("Membership plan created successfully");
        }
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

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#fbfbf9]/80 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0E3E27]/10 text-[#0E3E27] flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 tracking-tight">
                {isEdit ? "Edit Membership Plan" : "Create New Membership Plan"}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Configure tier level, pricing, quotas, limits, and feature perks
              </p>
            </div>
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
          {/* Section 1: General Details & Level Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-3.5 bg-[#0E3E27] rounded-full" />
                Plan Details & Tier Level
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Plan Name */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Plan Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gold Tier, Pro Angler, Free Tier"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-[#0E3E27] focus:ring-1 focus:ring-[#0E3E27] bg-white transition-all shadow-xs"
                />
              </div>

              {/* Level Selection */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1 flex items-center justify-between">
                  <span>
                    Plan Level <span className="text-red-500">*</span>
                  </span>
                  {isEdit && (
                    <span className="text-[10.5px] text-gray-400 font-normal">
                      (Tier level is locked)
                    </span>
                  )}
                </label>
                <div className="relative">
                  <select
                    disabled={isEdit}
                    value={level}
                    onChange={(e) => handleLevelChange(e.target.value)}
                    className={`w-full h-10 px-3.5 pr-8 rounded-xl border text-xs text-gray-900 capitalize shadow-xs transition-all ${
                      isEdit
                        ? "bg-gray-100/90 text-gray-500 border-gray-200 cursor-not-allowed select-none"
                        : "bg-white border-gray-200 focus:outline-none focus:border-[#0E3E27] focus:ring-1 focus:ring-[#0E3E27] cursor-pointer"
                    }`}
                  >
                    <option value="free">🌿 Free Tier (free)</option>
                    <option value="basic">⭐ Basic Tier (basic)</option>
                    <option value="premium">👑 Premium Tier (premium)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Description
              </label>
              <textarea
                rows={2}
                placeholder="Full access plan with premium perks and priority support..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-[#0E3E27] focus:ring-1 focus:ring-[#0E3E27] bg-white transition-all shadow-xs"
              />
            </div>
          </div>

          {/* Section 2: Pricing & Taxes */}
          <div className="space-y-3.5 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-3.5 bg-[#0E3E27] rounded-full" />
                Pricing & Billing
              </h4>
              {isFreeLevel && (
                <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  Free tier pricing is locked to $0
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Monthly Price */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Monthly Price (USD) <span className="text-red-500">*</span>
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
                    disabled={isFreeLevel}
                    placeholder="19.99 (0 for free)"
                    value={isFreeLevel ? "0" : monthlyPrice}
                    onChange={(e) => setMonthlyPrice(e.target.value)}
                    className={`w-full h-10 pl-7 pr-3 rounded-xl border text-xs text-gray-900 shadow-xs transition-all ${
                      isFreeLevel
                        ? "bg-gray-100/90 text-gray-500 border-gray-200 cursor-not-allowed select-none"
                        : "bg-white border-gray-200 focus:outline-none focus:border-[#0E3E27] focus:ring-1 focus:ring-[#0E3E27]"
                    }`}
                  />
                </div>
                <span className="text-[10.5px] text-gray-400 mt-0.5 block">
                  {isFreeLevel ? "Locked at $0 for Free Tier" : "Recurring monthly fee"}
                </span>
              </div>

              {/* Yearly Price */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Yearly Price (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    disabled={isFreeLevel}
                    placeholder="199.99 (0 for free)"
                    value={isFreeLevel ? "0" : yearlyPrice}
                    onChange={(e) => setYearlyPrice(e.target.value)}
                    className={`w-full h-10 pl-7 pr-3 rounded-xl border text-xs text-gray-900 shadow-xs transition-all ${
                      isFreeLevel
                        ? "bg-gray-100/90 text-gray-500 border-gray-200 cursor-not-allowed select-none"
                        : "bg-white border-gray-200 focus:outline-none focus:border-[#0E3E27] focus:ring-1 focus:ring-[#0E3E27]"
                    }`}
                  />
                </div>
                <span className="text-[10.5px] text-gray-400 mt-0.5 block">
                  {isFreeLevel ? "Locked at $0 for Free Tier" : "Annual billing amount"}
                </span>
              </div>

              {/* Taxes */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Taxes (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    disabled={isFreeLevel}
                    placeholder="1.50 (0 if none)"
                    value={isFreeLevel ? "0" : taxes}
                    onChange={(e) => setTaxes(e.target.value)}
                    className={`w-full h-10 pl-7 pr-3 rounded-xl border text-xs text-gray-900 shadow-xs transition-all ${
                      isFreeLevel
                        ? "bg-gray-100/90 text-gray-500 border-gray-200 cursor-not-allowed select-none"
                        : "bg-white border-gray-200 focus:outline-none focus:border-[#0E3E27] focus:ring-1 focus:ring-[#0E3E27]"
                    }`}
                  />
                </div>
                <span className="text-[10.5px] text-gray-400 mt-0.5 block">
                  {isFreeLevel ? "Locked at $0 for Free Tier" : "Applicable tax fee"}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Plan Badge / Image */}
          <div className="space-y-2 pt-3 border-t border-gray-100">
            <label className="block font-semibold text-gray-700 mb-1">
              Plan Badge / Icon Image
            </label>
            <div className="flex items-center gap-3.5 p-3.5 bg-gray-50/70 border border-dashed border-gray-300 rounded-xl">
              {imagePreview ? (
                <div className="w-14 h-14 rounded-xl border border-gray-200 overflow-hidden p-1 flex-shrink-0 bg-white shadow-xs relative group">
                  <img
                    src={imagePreview}
                    alt="Badge preview"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-xl border border-gray-200 flex items-center justify-center flex-shrink-0 bg-white text-gray-400">
                  <ImageIcon className="w-6 h-6 text-gray-400" />
                </div>
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setImageFile(file);
                    if (file) {
                      setImagePreview(URL.createObjectURL(file));
                    }
                  }}
                  className="text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-white file:text-[#0E3E27] file:border-gray-200 file:border hover:file:bg-gray-50 cursor-pointer"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  PNG, SVG, WebP or JPEG. Max 15MB. Transparent badge works
                  best.
                </p>
                {imageUrl && !imageFile && (
                  <p className="text-[11px] text-emerald-700 mt-0.5 truncate max-w-sm">
                    Current badge: {imageUrl}
                  </p>
                )}
              </div>
              {imagePreview && (
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImageUrl("");
                    setImagePreview(null);
                  }}
                  className="text-xs text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                  title="Remove image"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Section 4: Quotas & Limits */}
          <div className="space-y-3.5 pt-3 border-t border-gray-100">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-3.5 bg-[#0E3E27] rounded-full" />
              Quotas & Limits
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Friends Limit */}
              <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-gray-800 text-xs">
                    Friends Limit
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] text-gray-600 cursor-pointer select-none">
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
                  placeholder={isFriendsUnlimited ? "Unlimited" : "e.g. 500"}
                  className="w-full h-8 px-2.5 rounded-lg border border-gray-200 text-xs text-gray-900 bg-white disabled:bg-gray-100 disabled:text-gray-400 focus:outline-none focus:border-[#0E3E27]"
                />
              </div>

              {/* Licenses Limit */}
              <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-gray-800 text-xs">
                    Licenses Limit
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] text-gray-600 cursor-pointer select-none">
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
                  placeholder={isLicensesUnlimited ? "Unlimited" : "e.g. 10"}
                  className="w-full h-8 px-2.5 rounded-lg border border-gray-200 text-xs text-gray-900 bg-white disabled:bg-gray-100 disabled:text-gray-400 focus:outline-none focus:border-[#0E3E27]"
                />
              </div>

              {/* Gallery Limit */}
              <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-200 space-y-2">
                <label className="block font-semibold text-gray-800 text-xs">
                  Gallery Photo Limit
                </label>
                <input
                  type="number"
                  min="0"
                  value={galleryLimit}
                  onChange={(e) => setGalleryLimit(e.target.value)}
                  placeholder="e.g. 100"
                  className="w-full h-8 px-2.5 rounded-lg border border-gray-200 text-xs text-gray-900 bg-white focus:outline-none focus:border-[#0E3E27]"
                />
                <span className="text-[10px] text-gray-400 block">
                  Max photo uploads
                </span>
              </div>
            </div>
          </div>

          {/* Section 5: Core Privileges & Toggles */}
          <div className="space-y-3 pt-3 border-t border-gray-100">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-3.5 bg-[#0E3E27] rounded-full" />
              Core Privileges & Toggles
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* License Reminders */}
              <label className="flex items-center justify-between p-3 bg-gray-50/80 hover:bg-gray-100/70 transition-colors rounded-xl border border-gray-200 cursor-pointer select-none">
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

              {/* Map Activity */}
              <label className="flex items-center justify-between p-3 bg-gray-50/80 hover:bg-gray-100/70 transition-colors rounded-xl border border-gray-200 cursor-pointer select-none">
                <div>
                  <div className="font-semibold text-gray-800 text-xs">
                    Map Activity
                  </div>
                  <div className="text-[10.5px] text-gray-500">
                    GPS map pin activity
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={mapActivity}
                  onChange={(e) => setMapActivity(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0E3E27] accent-[#0E3E27] cursor-pointer"
                />
              </label>

              {/* Sponsorship Free */}
              <label className="flex items-center justify-between p-3 bg-gray-50/80 hover:bg-gray-100/70 transition-colors rounded-xl border border-gray-200 cursor-pointer select-none">
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
            </div>
          </div>

          {/* Section 6: Feature Perks List (Array of Strings) */}
          <div className="space-y-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-3.5 bg-[#0E3E27] rounded-full" />
                Feature Perks ({features.length})
              </h4>
              <span className="text-[11px] text-gray-400">
                Included benefits shown on pricing table
              </span>
            </div>

            {/* List of Features */}
            <div className="space-y-2 max-h-56 overflow-y-auto p-3 bg-gray-50/80 rounded-xl border border-gray-200">
              {features.length === 0 ? (
                <div className="text-center py-4 text-gray-400 italic text-[11.5px]">
                  No perks added yet. Type below or click the suggested presets.
                </div>
              ) : (
                features.map((feat, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 py-1.5 px-2.5 bg-white rounded-lg border border-gray-200 shadow-2xs hover:border-gray-300 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0E3E27] flex-shrink-0" />
                    <input
                      type="text"
                      value={feat}
                      onChange={(e) =>
                        handleUpdateFeatureText(idx, e.target.value)
                      }
                      className="flex-1 text-xs text-gray-800 bg-transparent focus:outline-none focus:border-b focus:border-[#0E3E27]"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(idx)}
                      title="Remove feature perk"
                      className="text-gray-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add Custom Perk Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Type a feature perk (e.g. Unlimited friends, Priority support) and press Enter"
                value={newFeatureText}
                onChange={(e) => setNewFeatureText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddFeature();
                  }
                }}
                className="flex-1 h-9 px-3 rounded-xl border border-gray-200 text-xs text-gray-800 bg-white focus:outline-none focus:border-[#0E3E27] focus:ring-1 focus:ring-[#0E3E27]"
              />
              <button
                type="button"
                onClick={() => handleAddFeature()}
                className="h-9 px-3.5 rounded-xl bg-[#0E3E27] hover:bg-[#092c1b] text-white text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Perk</span>
              </button>
            </div>

            {/* Suggested Preset Pills */}
            <div className="pt-1">
              <span className="text-[11px] font-semibold text-gray-500 block mb-1.5">
                Suggested feature presets (click to add):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_FEATURES.map((preset) => {
                  const alreadyAdded = features.some(
                    (f) => f.toLowerCase() === preset.toLowerCase(),
                  );
                  return (
                    <button
                      key={preset}
                      type="button"
                      disabled={alreadyAdded}
                      onClick={() => handleAddFeature(preset)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                        alreadyAdded
                          ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                          : "bg-white text-gray-700 border-gray-200 hover:border-[#0E3E27] hover:text-[#0E3E27] hover:bg-emerald-50/40"
                      }`}
                    >
                      {alreadyAdded ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Plus className="w-3 h-3" />
                      )}
                      <span>{preset}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-[#fbfbf9]/80 flex-shrink-0">
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
