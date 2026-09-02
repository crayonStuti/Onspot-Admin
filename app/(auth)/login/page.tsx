"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  loginWithCredentials,
  setAuthSession,
  getStoredToken,
  ApiError,
} from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // If already logged in, navigate straight to protected area
  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      router.replace("/users");
    }
  }, [router]);

  // Standard Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!email.trim() || !password) {
      setServerError("Please enter both username/email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await loginWithCredentials({ email: email.trim(), password });

      // Verify admin permissions if role is defined
      if (
        response.user &&
        response.user.role &&
        response.user.role !== "admin"
      ) {
        throw new ApiError(
          "Access denied. Only admin users can access this system.",
          403,
        );
      }

      const refreshToken =
        response.refreshToken ||
        (response as any).data?.refreshToken ||
        (response as any).token?.refreshToken;

      setAuthSession(
        response.idToken || (response as any).token,
        response.user,
        refreshToken,
      );
      toast.success("Login successful");
      router.push("/users");
    } catch (err: any) {
      console.error("Login attempt failed:", err);
      const errorMessage =
        err?.message ||
        (typeof err === "string"
          ? err
          : "Invalid username or password. Please try again.");
      setServerError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Brand Logo (54px high matching HTML) */}
      <div className="text-center mb-5">
        <img
          src="/images/on-spot-logo.png"
          alt="On S.P.O.T."
          className="h-[54px] w-auto inline-block object-contain"
        />
      </div>

      {/* Login Card (1:1 HTML) */}
      <div className="bg-white rounded-[16px] p-[34px_30px] border border-[#ececec] shadow-[0_20px_50px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)]">
        <h1 className="text-[22px] font-extrabold text-[#0E3E27] mb-1 text-center">
          Admin Login
        </h1>
        <div className="text-center text-[13px] text-[#777] mb-6">
          Sign in to access the S.P.O.T. dashboard
        </div>

        {/* Error Feedback */}
        {serverError && (
          <div className="bg-[#fcebea] text-[#c0392b] border border-[#f3c4c0] rounded-[8px] p-[10px_12px] text-[13px] mb-4">
            {serverError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="lg-user"
              className="block text-[12.5px] font-semibold text-[#3a3a3a]"
            >
              Username / Email
            </label>
            <input
              type="text"
              id="lg-user"
              name="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your username or email"
              autoComplete="username"
              className="w-full border border-[#dcdcd5] rounded-[8px] p-[12px_13px] text-[14px] text-[#333] outline-none transition-all focus:border-[#0E3E27] focus:ring-3 focus:ring-[#0E3E27]/12 bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="lg-pass"
              className="block text-[12.5px] font-semibold text-[#3a3a3a]"
            >
              Password
            </label>
            <input
              type="password"
              id="lg-pass"
              name="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              className="w-full border border-[#dcdcd5] rounded-[8px] p-[12px_13px] text-[14px] text-[#333] outline-none transition-all focus:border-[#0E3E27] focus:ring-3 focus:ring-[#0E3E27]/12 bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[48px] mt-1 border-none rounded-[8px] bg-[#0E3E27] hover:bg-[#0a3220] active:scale-[0.99] text-white text-[15px] font-bold tracking-[0.3px] transition-all disabled:opacity-60 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>LOGGING IN...</span>
              </>
            ) : (
              <span>LOG IN</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
