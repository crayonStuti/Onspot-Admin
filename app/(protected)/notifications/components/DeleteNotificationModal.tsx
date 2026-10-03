"use client";

import React, { useState } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { NotificationItem, deleteNotification } from "@/lib/api";

interface DeleteNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  notification: NotificationItem | null;
}

export default function DeleteNotificationModal({
  isOpen,
  onClose,
  onSuccess,
  notification,
}: DeleteNotificationModalProps) {
  const [deleting, setDeleting] = useState(false);

  if (!isOpen || !notification) return null;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteNotification(notification.id);
      toast.success("Notification deleted successfully.");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Delete notification failed:", err);
      toast.error(
        err.message ||
          "Failed to delete notification. Check server permissions."
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-[16px] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-[#ececec] overflow-hidden p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[16px] font-semibold text-[#1f1f1f]">
              Delete Notification
            </h3>
            <p className="text-[13px] text-[#717171] mt-1 leading-relaxed">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-[#1f1f1f]">
                &ldquo;{notification.title}&rdquo;
              </span>
              ? This action cannot be undone.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full hover:bg-[#f3f3f0] flex items-center justify-center text-[#717171] hover:text-[#1f1f1f]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-[#f0f0ed]">
          <button
            type="button"
            disabled={deleting}
            onClick={onClose}
            className="px-4 py-2 text-[13px] font-medium text-[#555] hover:text-[#1f1f1f] rounded-[8px] hover:bg-[#f0f0eb] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium text-white bg-red-600 hover:bg-red-700 rounded-[8px] transition-colors shadow-xs disabled:opacity-60"
          >
            {deleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Yes, Delete"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
