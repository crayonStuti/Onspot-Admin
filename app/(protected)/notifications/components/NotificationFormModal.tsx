"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Loader2,
  Info,
  AlertTriangle,
  AlertCircle,
  Trophy,
  Tag,
  CheckCircle2,
  Sparkles,
  MapPin,
  Send,
  Copy,
  FileText,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import {
  NotificationItem,
  NotificationVisualType,
  NotificationTargetAudience,
  NotificationSendType,
  NotificationStatus,
  createNotification,
  updateNotification,
  StateItem,
} from "@/lib/api";

interface NotificationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: NotificationItem | null;
  mode?: "create" | "edit" | "duplicate";
  states: StateItem[];
  defaultType?: NotificationVisualType;
}

const TYPE_CONFIG: Record<
  NotificationVisualType,
  {
    label: string;
    description: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    icon: React.ReactNode;
  }
> = {
  info: {
    label: "Info",
    description: "General announcements and notifications",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-700",
    badgeBorder: "border-blue-200",
    icon: <Info className="w-4 h-4 text-blue-600" />,
  },
  warning: {
    label: "Warning",
    description: "Regulation changes, seasons, and alerts",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-800",
    badgeBorder: "border-amber-200",
    icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
  },
  offer: {
    label: "Offer",
    description: "Special promotions, discounts, and perks",
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-700",
    badgeBorder: "border-emerald-200",
    icon: <Tag className="w-4 h-4 text-emerald-600" />,
  },
  congratulation: {
    label: "Congratulation",
    description: "Trophy achievements and user milestones",
    badgeBg: "bg-teal-50",
    badgeText: "text-teal-700",
    badgeBorder: "border-teal-200",
    icon: <Trophy className="w-4 h-4 text-teal-600" />,
  },
  error: {
    label: "Alert / Error",
    description: "Urgent system notices or compliance issues",
    badgeBg: "bg-red-50",
    badgeText: "text-red-700",
    badgeBorder: "border-red-200",
    icon: <AlertCircle className="w-4 h-4 text-red-600" />,
  },
};

export default function NotificationFormModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  mode = "create",
  states,
  defaultType = "info",
}: NotificationFormModalProps) {
  const isEditing =
    mode === "edit" ||
    (Boolean(initialData) &&
      mode !== "duplicate" &&
      initialData?.status?.toLowerCase() === "draft");
  const isDuplicating =
    mode === "duplicate" || (Boolean(initialData) && !isEditing);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<NotificationVisualType>(defaultType);
  const [targetAudience, setTargetAudience] =
    useState<NotificationTargetAudience>("all_users");
  const [sendType, setSendType] = useState<NotificationSendType>("both");
  const [stateId, setStateId] = useState("");
  const [submittingAction, setSubmittingAction] = useState<
    "sent" | "draft" | null
  >(null);

  // Sync form state on open / initialData change
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setMessage(initialData.message || "");
      setType(initialData.type || "info");
      setTargetAudience(initialData.target_audience || "all_users");
      setSendType(initialData.send_type || "both");
      setStateId(
        initialData.state_id ||
          initialData.target_state_id ||
          initialData.targetState?.state_id ||
          "",
      );
    } else {
      setTitle("");
      setMessage("");
      setType(defaultType);
      setTargetAudience("all_users");
      setSendType("both");
      setStateId("");
    }
  }, [initialData, defaultType, isOpen]);

  if (!isOpen) return null;

  const currentTypeConfig = TYPE_CONFIG[type] || TYPE_CONFIG.info;
  const selectedStateObj = states.find(
    (s) => String(s.state_id) === String(stateId),
  );

  const handleSubmitWithStatus = async (status: NotificationStatus) => {
    if (!title.trim()) {
      toast.error("Please enter a notification title.");
      return;
    }
    if (!message.trim()) {
      toast.error("Please enter the notification message.");
      return;
    }
    if (targetAudience === "state_wise" && !stateId) {
      toast.error("Please select a target state for state-wise audience.");
      return;
    }

    setSubmittingAction(status);
    try {
      if (isEditing && initialData?.id) {
        // Update existing draft notification via PUT /notifications/:id
        const res = await updateNotification(initialData.id, {
          title: title.trim(),
          message: message.trim(),
          type,
          target_audience: targetAudience,
          send_type: sendType,
          status: status,
          state_id: targetAudience === "state_wise" ? stateId : undefined,
        });

        if (status === "draft") {
          toast.success(res?.message || "Draft notification updated!");
        } else {
          toast.success(
            res?.message || "Draft notification broadcast sent successfully!",
          );
        }
      } else {
        // Create new notification via POST /notifications
        const res = await createNotification({
          title: title.trim(),
          message: message.trim(),
          type,
          target_audience: targetAudience,
          send_type: sendType,
          status: status,
          state_id: targetAudience === "state_wise" ? stateId : undefined,
        });

        if (status === "draft") {
          toast.success(res.message || "Notification saved as draft!");
        } else {
          toast.success(
            res.message ||
              (isDuplicating
                ? "Duplicated notification broadcast sent successfully!"
                : "Notification broadcast sent successfully!"),
          );
        }
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to save notification:", err);
      toast.error(
        err.message ||
          "Failed to process notification. Please verify API configuration.",
      );
    } finally {
      setSubmittingAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-[16px] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-[#ececec] overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-[#f0f0ed]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#014421]/10 flex items-center justify-center text-[#014421]">
              {isEditing ? (
                <Pencil className="w-5 h-5" />
              ) : isDuplicating ? (
                <Copy className="w-5 h-5" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-[17px] font-semibold text-[#1f1f1f]">
                {isEditing
                  ? "Edit Draft Notification"
                  : isDuplicating
                  ? "Duplicate Notification"
                  : "Create New Notification"}
              </h2>
              <p className="text-[12px] text-[#717171]">
                {isEditing
                  ? "Update draft details. You can save changes or send the notification now."
                  : isDuplicating
                  ? "Old notification data loaded. Modify details and send as a new notification."
                  : "Broadcast in-app notices, regulations, and announcements"}
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

        {/* Form Body */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmitWithStatus("sent");
          }}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-5"
        >
          {/* Notification Title */}
          <div>
            <label className="block text-[13px] font-medium text-[#2c2c2c] mb-1.5">
              Notification Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Florida Regulation Updates or Membership Renewal"
              className="w-full h-10 px-3.5 bg-white border border-[#e2e2dc] rounded-[8px] text-[13px] text-[#1f1f1f] placeholder:text-[#a0a09a] focus:outline-none focus:border-[#014421] transition-colors"
            />
          </div>

          {/* Message Content */}
          <div>
            <label className="block text-[13px] font-medium text-[#2c2c2c] mb-1.5">
              Message Content <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter clear, concise notification details..."
              className="w-full p-3 bg-white border border-[#e2e2dc] rounded-[8px] text-[13px] text-[#1f1f1f] placeholder:text-[#a0a09a] focus:outline-none focus:border-[#014421] transition-colors resize-none"
            />
          </div>

          {/* Visual Type Selection */}
          <div>
            <label className="block text-[13px] font-medium text-[#2c2c2c] mb-1.5">
              Notification Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(
                [
                  "info",
                  "warning",
                  "offer",
                  "congratulation",
                  "error",
                ] as NotificationVisualType[]
              ).map((t) => {
                const conf = TYPE_CONFIG[t];
                const isSelected = type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex items-center gap-2 p-2.5 rounded-[9px] border text-left transition-all ${
                      isSelected
                        ? "border-[#014421] bg-[#014421]/5 shadow-xs"
                        : "border-[#e5e5df] hover:border-[#cbcbc5] bg-white"
                    }`}
                  >
                    <div className="flex-shrink-0">{conf.icon}</div>
                    <div className="min-w-0">
                      <div className="text-[12.5px] font-medium text-[#1f1f1f] leading-tight truncate">
                        {conf.label}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Audience & State Selection (Select in a Select) */}
          <div className="p-4 bg-[#fbfbf9] rounded-[11px] border border-[#ebebe6] space-y-3.5">
            <div>
              <label className="block text-[13px] font-semibold text-[#1f1f1f] mb-1">
                Target Audience <span className="text-red-500">*</span>
              </label>
              <p className="text-[11.5px] text-[#717171] mb-2">
                Choose which users will receive this broadcast notification.
              </p>
              <select
                value={targetAudience}
                onChange={(e) => {
                  const val = e.target.value as NotificationTargetAudience;
                  setTargetAudience(val);
                  if (val !== "state_wise") {
                    setStateId("");
                  }
                }}
                className="w-full h-10 px-3 bg-white border border-[#e2e2dc] rounded-[8px] text-[13px] text-[#1f1f1f] focus:outline-none focus:border-[#014421]"
              >
                <option value="all_users">
                  All Users (Broadcast to all active accounts)
                </option>
                <option value="premium">Premium Only (Paid subscribers)</option>
                <option value="state_wise">
                  State-wise (Target specific US state)
                </option>
              </select>
            </div>

            {/* Nested Select: State Selector appears ONLY when 'state_wise' is selected */}
            {targetAudience === "state_wise" && (
              <div className="pt-2 border-t border-[#ebebe6] animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[13px] font-semibold text-[#014421] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#014421]" />
                    Select Target State <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-[#717171]">
                    Required for state-wise targeting
                  </span>
                </div>
                <select
                  required
                  value={stateId}
                  onChange={(e) => setStateId(e.target.value)}
                  className="w-full h-10 px-3 bg-white border-2 border-[#014421]/30 rounded-[8px] text-[13px] text-[#1f1f1f] focus:outline-none focus:border-[#014421] transition-colors"
                >
                  <option value="">-- Choose a State --</option>
                  {states.map((st) => (
                    <option key={st.state_id} value={st.state_id}>
                      {st.state_name} ({st.state_code})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Delivery Channel (send_type) */}
          <div className="p-4 bg-[#fbfbf9] rounded-[11px] border border-[#ebebe6] space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-[13px] font-semibold text-[#1f1f1f]">
                Delivery Channel <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-[#717171]">Default: Both</span>
            </div>
            <p className="text-[11.5px] text-[#717171]">
              Select whether to broadcast through in-app push, email
              notifications, or both channels.
            </p>
            <select
              value={sendType}
              onChange={(e) =>
                setSendType(e.target.value as NotificationSendType)
              }
              className="w-full h-10 px-3 bg-white border border-[#e2e2dc] rounded-[8px] text-[13px] text-[#1f1f1f] focus:outline-none focus:border-[#014421]"
            >
              <option value="both">Both (Push & Email Notification)</option>
              <option value="push">Push Notification Only</option>
              <option value="email">Email Notification Only</option>
            </select>
          </div>
          {/* <div>
            <label className="block text-[12px] font-medium text-[#717171] uppercase tracking-wider mb-2">
              Preview
            </label>
            <div className="p-3.5 bg-[#f5f5f2] rounded-[12px] border border-[#e8e8e2] flex items-start gap-3">
              <div
                className={`w-9 h-9 rounded-full ${currentTypeConfig.badgeBg} border ${currentTypeConfig.badgeBorder} flex items-center justify-center flex-shrink-0 mt-0.5`}
              >
                {currentTypeConfig.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[13.5px] font-semibold text-[#1f1f1f] truncate">
                    {title.trim() || "Notification Title"}
                  </span>
                  <span className="text-[11px] text-[#8e8e88] flex-shrink-0">
                    Just now
                  </span>
                </div>
                <p className="text-[12px] text-[#555] line-clamp-2 leading-relaxed">
                  {message.trim() ||
                    "Notification body content preview will appear here..."}
                </p>
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 text-[10.5px] font-medium rounded-full ${currentTypeConfig.badgeBg} ${currentTypeConfig.badgeText} border ${currentTypeConfig.badgeBorder}`}
                  >
                    {currentTypeConfig.label}
                  </span>
                  {targetAudience === "all_users" && (
                    <span className="inline-block px-[10px] py-[2px] rounded-[6px] text-[11px] font-medium border border-[#d8d0ee] bg-[#eeebf7] text-[#6b5ca5]">
                      All Users
                    </span>
                  )}
                  {targetAudience === "premium" && (
                    <span className="inline-block px-[10px] py-[2px] rounded-[6px] text-[11px] font-medium border border-[#b8e0c2] bg-[#e8f5ec] text-[#34A853]">
                      Premium Users
                    </span>
                  )}
                  {targetAudience === "state_wise" && (
                    <span className="inline-block px-[10px] py-[2px] rounded-[6px] text-[11px] font-medium border border-[#cfdcef] bg-[#eaf1fa] text-[#3b6bbf]">
                      {selectedStateObj
                        ? `State: ${selectedStateObj.state_name}`
                        : "State: Specific"}
                    </span>
                  )}
                  <span className="inline-block px-[10px] py-[2px] rounded-[6px] text-[11px] font-medium border border-[#e2e2dc] bg-white text-[#555]">
                    Channel: {sendType === "both" ? "Both" : sendType === "push" ? "Push" : "Email"}
                  </span>
                </div>
              </div>
            </div>
          </div> */}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 bg-[#fcfcfb] border-t border-[#f0f0ed]">
          <button
            type="button"
            disabled={submittingAction !== null}
            onClick={onClose}
            className="px-4 py-2 text-[13px] font-medium text-[#555] hover:text-[#1f1f1f] rounded-[8px] hover:bg-[#f0f0eb] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={submittingAction !== null}
              onClick={() => handleSubmitWithStatus("draft")}
              className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-[#2c2c2c] bg-white hover:bg-[#f7f7f2] border border-[#e2e2dc] rounded-[8px] transition-colors cursor-pointer disabled:opacity-60"
            >
              {submittingAction === "draft" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#717171]" />
                  {isEditing ? "Saving Changes..." : "Saving Draft..."}
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 text-[#717171]" />
                  {isEditing ? "Save Draft Changes" : "Save as Draft"}
                </>
              )}
            </button>
            <button
              type="button"
              disabled={submittingAction !== null}
              onClick={() => handleSubmitWithStatus("sent")}
              className="inline-flex items-center gap-2 px-5 py-2 text-[13px] font-medium text-white bg-[#014421] hover:bg-[#025c2d] rounded-[8px] transition-colors shadow-xs disabled:opacity-60 cursor-pointer"
            >
              {submittingAction === "sent" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isDuplicating
                    ? "Sending Duplicate..."
                    : isEditing
                    ? "Sending Broadcast..."
                    : "Sending..."}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {isDuplicating
                    ? "Duplicate & Send"
                    : isEditing
                    ? "Send Draft Now"
                    : "Send Notification"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
