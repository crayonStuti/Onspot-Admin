"use client";

import React, { useState, useEffect } from "react";
import { X, Check, Loader2, ShieldCheck, Zap, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { UserItem, updateUserProfile, getMemberships } from "@/lib/api";

interface EditMembershipModalProps {
  isOpen: boolean;
  user: UserItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditMembershipModal({
  isOpen,
  user,
  onClose,
  onSuccess,
}: EditMembershipModalProps) {
  const [selectedTier, setSelectedTier] = useState<string>("free");
  const [saving, setSaving] = useState(false);
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);

  useEffect(() => {
    if (!isOpen || !user) return;

    const rawMembership =
      user.profile?.current_tier ||
      (typeof user.profile?.membership === "object"
        ? user.profile?.membership?.name
        : user.profile?.membership) ||
      "free";

    const currentTier = String(rawMembership).toLowerCase();
    setSelectedTier(
      currentTier.includes("premium")
        ? "premium"
        : currentTier.includes("basic")
        ? "basic"
        : "free"
    );

    // Fetch dynamic memberships from backend if available
    const loadPlans = async () => {
      setLoadingPlans(true);
      try {
        const res = await getMemberships(1, 20);
        const data = res?.data?.memberships || res?.data || res || [];
        if (Array.isArray(data) && data.length > 0) {
          setAvailablePlans(data);
        }
      } catch (err) {
        console.warn("Could not load dynamic plans, using defaults:", err);
      } finally {
        setLoadingPlans(false);
      }
    };

    loadPlans();
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const userDisplayName =
    `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
    user.display_name ||
    user.email;

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUserProfile(user.id, {
        current_tier: selectedTier,
      });
      toast.success(
        `Membership for ${userDisplayName} updated to ${selectedTier.toUpperCase()}`
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to update membership:", err);
      toast.error(err?.message || "Failed to update membership tier.");
    } finally {
      setSaving(false);
    }
  };

  const defaultTiers = [
    {
      id: "free",
      name: "Free Plan",
      tier: "free",
      price: "$0 / month",
      desc: "Standard access to map and basic community resources.",
      icon: ShieldCheck,
      color: "border-gray-200 bg-white hover:border-gray-300",
      activeColor: "border-[#4a6b3f] bg-[#f7f9f6] ring-1 ring-[#4a6b3f]",
      badge: "bg-gray-100 text-gray-700",
    },
    {
      id: "basic",
      name: "Basic Plan",
      tier: "basic",
      price: "$9.99 / month",
      desc: "Includes offline map pins and priority notifications.",
      icon: Zap,
      color: "border-amber-200 bg-white hover:border-amber-300",
      activeColor: "border-amber-500 bg-amber-50/60 ring-1 ring-amber-500",
      badge: "bg-amber-100 text-amber-800",
    },
    {
      id: "premium",
      name: "Premium Plan",
      tier: "premium",
      price: "$19.99 / month",
      desc: "Full unrestricted access to all features, GPS routing & licenses.",
      icon: Sparkles,
      color: "border-blue-200 bg-white hover:border-blue-300",
      activeColor: "border-blue-500 bg-blue-50/60 ring-1 ring-blue-500",
      badge: "bg-blue-100 text-blue-800",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#ececec]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#2d4a23]/10 text-[#2d4a23] flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
                className="w-5 h-5"
              >
                <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1f1f1f]">
                Edit Membership
              </h3>
              <p className="text-xs text-[#7D848D]">
                Change subscription tier for{" "}
                <span className="font-semibold text-gray-800">
                  {userDisplayName}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card info */}
        <div className="bg-[#f9f9f8] p-3 rounded-xl border border-[#ececec] flex items-center justify-between text-xs">
          <div>
            <span className="text-[#7D848D] block font-medium">User Email</span>
            <span className="font-semibold text-[#1f1f1f]">{user.email}</span>
          </div>
          <div className="text-right">
            <span className="text-[#7D848D] block font-medium">
              Current Plan
            </span>
            <span className="font-semibold text-[#2d4a23] uppercase">
              {String(
                user.profile?.current_tier ||
                  user.profile?.membership?.name ||
                  user.profile?.membership ||
                  "Free"
              )}
            </span>
          </div>
        </div>

        {/* Tiers Selection */}
        <div className="space-y-2.5">
          <label className="text-[13px] font-semibold text-[#2c2c2c] block">
            Select Membership Tier
          </label>
          <div className="space-y-2">
            {defaultTiers.map((tier) => {
              const isSelected = selectedTier === tier.tier;
              const Icon = tier.icon;
              return (
                <div
                  key={tier.id}
                  onClick={() => setSelectedTier(tier.tier)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected ? tier.activeColor : tier.color
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        isSelected
                          ? "bg-[#2d4a23] text-white"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">
                          {tier.name}
                        </span>
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${tier.badge}`}
                        >
                          {tier.price}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{tier.desc}</p>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                      isSelected
                        ? "bg-[#2d4a23] border-[#2d4a23] text-white"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#ececec]">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-lg border border-[#e4e4df] bg-white hover:bg-[#f7f7f2] text-xs font-semibold text-[#4a4a4a] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-[#1f3d2a] hover:bg-[#295034] text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Updating...</span>
              </>
            ) : (
              <span>Save Membership</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
