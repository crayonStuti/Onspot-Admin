"use client";

import React, { useState } from "react";
import { X, Lock, Eye, EyeOff, KeyRound, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { UserItem, changeUserPassword } from "@/lib/api";

interface ResetPasswordModalProps {
  isOpen: boolean;
  user: UserItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ResetPasswordModal({
  isOpen,
  user,
  onClose,
  onSuccess,
}: ResetPasswordModalProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sendEmailNotification, setSendEmailNotification] = useState(true);

  if (!isOpen || !user) return null;

  const userDisplayName =
    `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
    user.display_name ||
    user.email;

  const handleGeneratePassword = () => {
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const special = "!@#$%^&*";

    const allChars = lowercase + uppercase + numbers + special;

    const getRandomChar = (chars: string) => {
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      return chars[array[0] % chars.length];
    };

    const requiredChars = [
      getRandomChar(lowercase),
      getRandomChar(uppercase),
      getRandomChar(numbers),
      getRandomChar(special),
    ];

    const remaining = Array.from({ length: 8 }, () => getRandomChar(allChars));

    const passwordChars = [...requiredChars, ...remaining];

    // Securely shuffle the generated characters
    for (let i = passwordChars.length - 1; i > 0; i--) {
      const random = new Uint32Array(1);
      crypto.getRandomValues(random);

      const j = random[0] % (i + 1);
      [passwordChars[i], passwordChars[j]] = [
        passwordChars[j],
        passwordChars[i],
      ];
    }

    const password = passwordChars.join("");

    setPassword(password);
    setConfirmPassword(password);
    setShowPassword(true);

    toast.info("Generated a secure random password.");
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.error("Please enter a new password.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await changeUserPassword(user.id, password);

      toast.success(
        `Password reset successfully for ${userDisplayName}.`,
      );
      setPassword("");
      setConfirmPassword("");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to reset password:", err);
      // Even if API doesn't support password in updateUserProfile yet, alert clearly or fallback gracefully
      toast.error(err?.message || "Failed to reset password.");
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
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1f1f1f]">
                Reset Password
              </h3>
              <p className="text-xs text-[#7D848D]">
                Set a new password for{" "}
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

        {/* User Card Mini */}
        <div className="bg-[#f9f9f8] p-3 rounded-xl border border-[#ececec] text-xs flex items-center justify-between">
          <div>
            <span className="text-[#7D848D] block font-medium">Account</span>
            <span className="font-semibold text-gray-900">{user.email}</span>
          </div>
          <button
            type="button"
            onClick={handleGeneratePassword}
            className="text-xs text-[#2d4a23] hover:text-[#1f3d2a] font-medium flex items-center gap-1 hover:underline cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Generate Random</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleResetPassword} className="space-y-3.5">
          <div className="space-y-1.5">
            <label className="text-[12.5px] font-semibold text-[#2c2c2c] block">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter at least 6 characters"
                className="w-full h-[40px] pl-3.5 pr-10 rounded-lg border border-[#e4e4df] bg-white text-[13px] text-[#2c2c2c] placeholder:text-[#bdbdbd] focus:outline-none focus:border-[#1f3d2a]"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[12.5px] font-semibold text-[#2c2c2c] block">
              Confirm Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              className="w-full h-[40px] px-3.5 rounded-lg border border-[#e4e4df] bg-white text-[13px] text-[#2c2c2c] placeholder:text-[#bdbdbd] focus:outline-none focus:border-[#1f3d2a]"
              required
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={sendEmailNotification}
              onChange={(e) => setSendEmailNotification(e.target.checked)}
              className="w-4 h-4 rounded border-[#7D848D] accent-[#2d4a23]"
            />
            <span className="text-xs text-[#4a4a4a]">
              Send email notification with login instructions
            </span>
          </label>

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
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-[#1f3d2a] hover:bg-[#295034] text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
