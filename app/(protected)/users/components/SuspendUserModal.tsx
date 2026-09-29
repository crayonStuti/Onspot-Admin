"use client";

import React, { useState } from "react";
import { X, AlertTriangle, CheckCircle2, Loader2, Ban } from "lucide-react";
import { toast } from "sonner";
import { UserItem, updateUserProfile } from "@/lib/api";

interface SuspendUserModalProps {
  isOpen: boolean;
  user: UserItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function SuspendUserModal({
  isOpen,
  user,
  onClose,
  onSuccess,
}: SuspendUserModalProps) {
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !user) return null;

  const currentStatus = String(
    user.status || user.profile?.status || "active"
  ).toLowerCase();

  const isSuspended =
    currentStatus === "suspended" || currentStatus === "inactive";
  const targetStatus = isSuspended ? "active" : "suspended";
  const actionTitle = isSuspended ? "Reactivate Account" : "Suspend Account";
  const userDisplayName =
    `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
    user.display_name ||
    user.email;

  const handleToggleStatus = async () => {
    // Guard: A suspended user cannot be suspended again
    if (!isSuspended && targetStatus !== "suspended") {
      return;
    }
    if (isSuspended && targetStatus === "suspended") {
      toast.error("This user is already suspended and cannot be suspended again.");
      return;
    }

    setSubmitting(true);
    try {
      // Use FormData with 'status' field matching the API requirement
      const formData = new FormData();
      formData.append("status", targetStatus);

      await updateUserProfile(user.id, formData);

      // Update local state immediately
      user.status = targetStatus;
      if (user.profile) {
        user.profile.status = targetStatus;
      }

      toast.success(
        isSuspended
          ? `Account for ${userDisplayName} has been reactivated.`
          : `Account for ${userDisplayName} has been suspended.`
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to update user status:", err);
      toast.error(
        err?.message ||
          `Failed to ${isSuspended ? "reactivate" : "suspend"} user account.`
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#ececec]">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isSuspended
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-600"
              }`}
            >
              {isSuspended ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <Ban className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1f1f1f]">
                {actionTitle}
              </h3>
              <p className="text-xs text-[#7D848D]">
                {isSuspended
                  ? "Reactivate suspended user account"
                  : "Confirm user account suspension"}
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

        {/* Content message */}
        <div className="text-xs text-gray-600 leading-relaxed space-y-2">
          {isSuspended ? (
            <div className="space-y-2">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600" />
                <span>
                  This account is currently <strong>Suspended</strong>. A
                  suspended user cannot be suspended again.
                </span>
              </div>
              <p>
                Click <strong>Reactivate Account</strong> below to restore full
                access for <strong className="text-gray-900">{user.email}</strong>.
              </p>
            </div>
          ) : (
            <p>
              Are you sure you want to suspend account for{" "}
              <strong className="text-gray-900">{user.email}</strong>? The user
              will be blocked from accessing mobile app services until an admin
              reactivates the account.
            </p>
          )}
        </div>

        {/* User Card Mini */}
        <div className="bg-[#f9f9f8] p-3 rounded-xl border border-[#ececec] text-xs flex items-center justify-between">
          <div>
            <span className="text-[#7D848D] block font-medium">User</span>
            <span className="font-semibold text-gray-900">
              {userDisplayName}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[#7D848D] block font-medium">
              Current Status
            </span>
            <span
              className={`font-semibold capitalize inline-flex items-center gap-1 ${
                isSuspended ? "text-red-600" : "text-[#34A853]"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isSuspended ? "bg-red-600" : "bg-[#2f9e44]"
                }`}
              />
              {user.status || "active"}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#ececec]">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-lg border border-[#e4e4df] bg-white hover:bg-[#f7f7f2] text-xs font-semibold text-[#4a4a4a] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleToggleStatus}
            disabled={submitting}
            className={`px-5 py-2 rounded-lg text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer ${
              isSuspended
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Updating...</span>
              </>
            ) : (
              <span>{actionTitle}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
