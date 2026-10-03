"use client";

import React from "react";
import {
  X,
  Info,
  AlertTriangle,
  AlertCircle,
  Trophy,
  Tag,
  MapPin,
  Calendar,
  Percent,
  CheckCircle2,
  Users,
  Eye,
  Copy,
  Pencil,
} from "lucide-react";
import { NotificationItem, NotificationVisualType } from "@/lib/api";

interface NotificationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notification: NotificationItem | null;
  onDuplicate?: (item: NotificationItem) => void;
  onEdit?: (item: NotificationItem) => void;
}

const TYPE_CONFIG: Record<
  NotificationVisualType,
  {
    label: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    icon: React.ReactNode;
  }
> = {
  info: {
    label: "Info",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-700",
    badgeBorder: "border-blue-200",
    icon: <Info className="w-5 h-5 text-blue-600" />,
  },
  warning: {
    label: "Warning",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-800",
    badgeBorder: "border-amber-200",
    icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
  },
  offer: {
    label: "Offer",
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-700",
    badgeBorder: "border-emerald-200",
    icon: <Tag className="w-5 h-5 text-emerald-600" />,
  },
  congratulation: {
    label: "Congratulation",
    badgeBg: "bg-teal-50",
    badgeText: "text-teal-700",
    badgeBorder: "border-teal-200",
    icon: <Trophy className="w-5 h-5 text-teal-600" />,
  },
  error: {
    label: "Alert / Error",
    badgeBg: "bg-red-50",
    badgeText: "text-red-700",
    badgeBorder: "border-red-200",
    icon: <AlertCircle className="w-5 h-5 text-red-600" />,
  },
};

export default function NotificationDetailsModal({
  isOpen,
  onClose,
  notification,
  onDuplicate,
  onEdit,
}: NotificationDetailsModalProps) {
  if (!isOpen || !notification) return null;

  const typeConfig = TYPE_CONFIG[notification.type] || TYPE_CONFIG.info;
  const stateLabel =
    notification.targetState?.state_name ||
    (notification.target_state_id
      ? `State UUID: ${notification.target_state_id}`
      : null);

  const formattedDate = notification.created_at
    ? new Date(notification.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "N/A";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-[16px] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-[#ececec] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-[#f0f0ed]">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full ${typeConfig.badgeBg} border ${typeConfig.badgeBorder} flex items-center justify-center`}
            >
              {typeConfig.icon}
            </div>
            <div>
              <h2 className="text-[16px] font-semibold text-[#1f1f1f]">
                Notification Details
              </h2>
              <p className="text-[11.5px] text-[#717171]">
                ID: {notification.id}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#f3f3f0] flex items-center justify-center text-[#717171] hover:text-[#1f1f1f] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-5 overflow-y-auto max-h-[70vh]">
          {/* Title & Badge */}
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 text-[11px] font-semibold rounded-full ${typeConfig.badgeBg} ${typeConfig.badgeText} border ${typeConfig.badgeBorder}`}
              >
                {typeConfig.label}
              </span>
              {notification.target_audience === "all_users" && (
                <span className="inline-block px-[11px] py-[3px] rounded-[6px] text-[11.5px] font-medium border border-[#d8d0ee] bg-[#eeebf7] text-[#6b5ca5]">
                  All Users
                </span>
              )}
              {notification.target_audience === "premium" && (
                <span className="inline-block px-[11px] py-[3px] rounded-[6px] text-[11.5px] font-medium border border-[#b8e0c2] bg-[#e8f5ec] text-[#34A853]">
                  Premium Users
                </span>
              )}
              {notification.target_audience === "state_wise" && (
                <span className="inline-block px-[11px] py-[3px] rounded-[6px] text-[11.5px] font-medium border border-[#cfdcef] bg-[#eaf1fa] text-[#3b6bbf]">
                  {stateLabel
                    ? stateLabel.startsWith("State:")
                      ? stateLabel
                      : `State: ${stateLabel}`
                    : "State-wise"}
                </span>
              )}
              {notification.send_type && (
                <span className="inline-block px-[11px] py-[3px] rounded-[6px] text-[11.5px] font-medium border border-gray-200 bg-gray-100 text-gray-700 capitalize">
                  Channel: {notification.send_type}
                </span>
              )}
            </div>
            <h3 className="text-[16px] font-bold text-[#1f1f1f] leading-snug">
              {notification.title}
            </h3>
          </div>

          {/* Message Content */}
          <div className="p-4 bg-[#f9f9f7] rounded-[10px] border border-[#e8e8e2]">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#717171] mb-1.5">
              Message Body
            </label>
            <p className="text-[13.5px] text-[#2c2c2c] leading-relaxed whitespace-pre-wrap">
              {notification.message}
            </p>
          </div>

          {/* Meta Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[12.5px]">
            <div className="p-3 bg-white border border-[#ececec] rounded-[8px]">
              <span className="text-[#888] flex items-center gap-1 mb-1">
                <Calendar className="w-3.5 h-3.5" /> Date Sent
              </span>
              <span className="font-semibold text-[#1f1f1f]">
                {formattedDate}
              </span>
            </div>

            <div className="p-3 bg-white border border-[#ececec] rounded-[8px]">
              <span className="text-[#888] flex items-center gap-1 mb-1">
                <Percent className="w-3.5 h-3.5" /> Open Rate
              </span>
              <span className="font-semibold text-[#014421]">
                {notification.open_rate ||
                  (notification.open_rate_number != null
                    ? `${notification.open_rate_number}%`
                    : "0.0%")}
              </span>
            </div>

            <div className="p-3 bg-white border border-[#ececec] rounded-[8px]">
              <span className="text-[#888] flex items-center gap-1 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Status
              </span>
              {notification.status?.toLowerCase() === "draft" ? (
                <span className="font-semibold text-amber-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                  Draft
                </span>
              ) : (
                <span className="font-semibold text-emerald-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  {notification.status || "Sent"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#fcfcfb] border-t border-[#f0f0ed]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-[13px] font-medium text-[#555] hover:text-[#1f1f1f] rounded-[8px] hover:bg-[#f0f0eb] transition-colors"
          >
            Close
          </button>
          {notification?.status?.toLowerCase() === "draft" && onEdit ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(notification);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium text-white bg-[#014421] hover:bg-[#025c2d] rounded-[8px] transition-colors cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit Draft
            </button>
          ) : onDuplicate ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onDuplicate(notification!);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium text-white bg-[#014421] hover:bg-[#025c2d] rounded-[8px] transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              Duplicate Notification
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
