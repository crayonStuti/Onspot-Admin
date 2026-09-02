"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider, appleProvider } from "@/lib/firebase";
import { loginWithCredentials, setAuthSession, getStoredToken, ApiError, fetchApi } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // If already logged in, navigate straight to protected area
  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      router.replace("/users");
    }
  }, [router]);

  // Standard Email/Password Login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!email || !password) {
      setServerError("Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await loginWithCredentials({ email, password });

      // Verify admin permissions
      if (response.user && response.user.role && response.user.role !== "admin") {
        throw new ApiError("Access denied. Only admin users can access this system.", 403);
      }

      const refreshToken =
        response.refreshToken ||
        (response as any).data?.refreshToken ||
        (response as any).token?.refreshToken;

      setAuthSession(response.idToken || (response as any).token, response.user, refreshToken);
      toast.success("Login successful");
      router.push("/users");
    } catch (err: any) {
      console.error("Login attempt failed:", err);
      // Ensure the EXACT server message is presented, never swallowed or masked
      const errorMessage =
        err?.message || (typeof err === "string" ? err : "An unexpected error occurred during login.");
      setServerError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth Login
  const handleGoogleLogin = async () => {
    setServerError(null);
    setGoogleLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const refreshToken = result.user.refreshToken;

      // Check user profile from backend with token
      const profile = await fetchApi<{ role?: string; [key: string]: any }>("/user-profile/me", {
        headers: { Authorization: `Bearer ${idToken}` },
      }).catch(() => {
        return {
          email: result.user.email,
          role: "admin",
        };
      });

      if (profile.role && profile.role !== "admin") {
        throw new ApiError("Access denied: Only admin accounts can access this portal.", 403);
      }

      const userData = {
        id: result.user.uid,
        email: result.user.email,
        first_name: result.user.displayName || "Admin",
        role: profile.role || "admin",
        photoURL: result.user.photoURL,
      };

      setAuthSession(idToken, userData, refreshToken);
      toast.success("Signed in with Google successfully.");
      router.push("/users");
    } catch (err: any) {
      console.error("Google Auth error:", err);
      let message = "Google Sign-in failed.";
      if (err.code === "auth/popup-closed-by-user") {
        message = "Sign-in popup was closed before completing.";
      } else if (err.code === "auth/cancelled-popup-request") {
        message = "Authentication was cancelled.";
      } else if (err?.message) {
        message = err.message;
      }
      setServerError(message);
      toast.error(message);
    } finally {
      setGoogleLoading(false);
    }
  };

  // Apple OAuth Login
  const handleAppleLogin = async () => {
    setServerError(null);
    setAppleLoading(true);

    try {
      const result = await signInWithPopup(auth, appleProvider);
      const idToken = await result.user.getIdToken();
      const refreshToken = result.user.refreshToken;

      const profile = await fetchApi<{ role?: string; [key: string]: any }>("/user-profile/me", {
        headers: { Authorization: `Bearer ${idToken}` },
      }).catch(() => ({
        email: result.user.email,
        role: "admin",
      }));

      if (profile.role && profile.role !== "admin") {
        throw new ApiError("Access denied: Only admin accounts can access this portal.", 403);
      }

      const userData = {
        id: result.user.uid,
        email: result.user.email,
        first_name: result.user.displayName || "Admin",
        role: profile.role || "admin",
      };

      setAuthSession(idToken, userData, refreshToken);
      toast.success("Signed in with Apple successfully.");
      router.push("/users");
    } catch (err: any) {
      console.error("Apple Auth error:", err);
      let message = "Apple Sign-in failed.";
      if (err.code === "auth/popup-closed-by-user") {
        message = "Sign-in popup was closed before completing.";
      } else if (err.code === "auth/cancelled-popup-request") {
        message = "Authentication was cancelled.";
      } else if (err?.message) {
        message = err.message;
      }
      setServerError(message);
      toast.error(message);
    } finally {
      setAppleLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Brand Logo - 252px x 139px container */}
      <div className="relative w-[252px] h-[130px] mb-2 flex items-center justify-center">
        <Image
          src="/images/on-spot-logo.png"
          alt="On S.P.O.T. Logo"
          fill
          sizes="252px"
          className="object-contain"
          priority
        />
      </div>

      {/* Header: Sign in now */}
      <div className="text-center mb-7">
        <h1 className="text-[34px] sm:text-[38px] font-semibold text-[#1B1E28] tracking-tight leading-[42px]">
          Sign in now
        </h1>
        <p className="text-[15px] sm:text-[16px] text-[#7D848D] mt-1 font-normal">
          Please sign in to continue our app
        </p>
      </div>

      {/* Error Feedback Banner */}
      {serverError && (
        <div className="w-full mb-5 flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-[14px] text-sm animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-xs uppercase tracking-wider text-red-800">Authentication Error</p>
            <p className="text-xs text-red-700 mt-0.5">{serverError}</p>
          </div>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleEmailLogin} className="w-full space-y-4">
        {/* Email Input */}
        <div className="w-full">
          <div className="w-full h-[56px] bg-[#F7F7F9] rounded-[14px] px-5 flex items-center transition-all focus-within:ring-2 focus-within:ring-[#0E3E27]/20 focus-within:bg-white focus-within:border focus-within:border-[#0E3E27]">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full bg-transparent text-[16px] text-[#1B1E28] placeholder:text-[#7D848D] outline-none font-normal"
            />
          </div>
        </div>

        {/* Password Input */}
        <div className="w-full">
          <div className="w-full h-[56px] bg-[#F7F7F9] rounded-[14px] px-5 flex items-center justify-between transition-all focus-within:ring-2 focus-within:ring-[#0E3E27]/20 focus-within:bg-white focus-within:border focus-within:border-[#0E3E27]">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="************"
              className="w-full bg-transparent text-[16px] text-[#1B1E28] placeholder:text-[#7D848D] outline-none font-normal tracking-wider"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-[#7D848D] hover:text-[#1B1E28] transition-colors p-1 cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Forget Password */}
        <div className="flex justify-end pt-1">
          <Link
            href="#"
            onClick={(e) => {
              e.preventDefault();
              toast.info("Password reset link will be sent to your admin email.");
            }}
            className="text-[14px] font-medium text-[#4E9FE5] hover:underline"
          >
            Forget Password?
          </Link>
        </div>

        {/* Sign In Primary Button */}
        <button
          type="submit"
          disabled={loading || googleLoading || appleLoading}
          className="w-full h-[56px] mt-2 flex items-center justify-center rounded-[16px] bg-[#0E3E27] hover:bg-[#0a301e] active:scale-[0.99] text-white font-semibold text-[16px] shadow-sm transition-all disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Signing In...</span>
            </div>
          ) : (
            <span>Sign In</span>
          )}
        </button>
      </form>

      {/* Don't have an account / Sign up */}
      <div className="mt-5 text-center text-[14px]">
        <span className="text-[#707B81]">Don’t have an account? </span>
        <Link href="#" className="font-medium text-[#4E9FE5] hover:underline">
          Sign up
        </Link>
      </div>

      {/* Or connect */}
      <div className="mt-4 text-center">
        <span className="text-[14px] text-[#707B81]">Or connect</span>
      </div>

      {/* Social Login Buttons (Google & Apple) */}
      <div className="w-full grid grid-cols-2 gap-4 mt-4">
        {/* Google Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading || googleLoading || appleLoading}
          className="w-full h-[62px] flex items-center justify-center gap-3.5 rounded-[16px] bg-black hover:bg-neutral-900 active:scale-[0.99] text-white transition-all disabled:opacity-50 cursor-pointer shadow-sm"
        >
          {googleLoading ? (
            <Loader2 className="w-6 h-6 animate-spin text-white" />
          ) : (
            <>
              <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8 0-1.3.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
                />
              </svg>
              <span className="text-[20px] font-medium text-white tracking-wide">Google</span>
            </>
          )}
        </button>

        {/* Apple Button */}
        <button
          type="button"
          onClick={handleAppleLogin}
          disabled={loading || googleLoading || appleLoading}
          className="w-full h-[62px] flex items-center justify-center gap-3 rounded-[16px] bg-black hover:bg-neutral-900 active:scale-[0.99] text-white transition-all disabled:opacity-50 cursor-pointer shadow-sm"
        >
          {appleLoading ? (
            <Loader2 className="w-6 h-6 animate-spin text-white" />
          ) : (
            <>
              <svg className="w-6 h-6 fill-white flex-shrink-0" viewBox="0 0 170 170">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.74 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.67-7.81-11.96-14.34-5.78-8.8-10.28-18.7-13.49-29.69-3.21-10.99-4.82-21.75-4.82-32.28 0-14.47 3.73-26.68 11.2-36.63 7.47-9.95 16.92-15.02 28.36-15.22 5.01 0 10.37 1.34 16.08 4.02 5.71 2.68 9.53 4.09 11.45 4.23 1.54-.14 5.56-1.57 12.06-4.29 6.5-2.72 12.16-3.89 16.98-3.52 12.72.63 22.84 5.34 30.36 14.13-11.08 6.74-16.53 15.93-16.36 27.57.17 9.17 3.65 16.92 10.44 23.25 6.79 6.33 14.88 10.02 24.28 11.08-2.02 6.09-4.49 12.22-7.42 18.39zM119.22 33.34c0-7.14 2.63-13.88 7.89-20.22 5.26-6.34 11.82-10.34 19.68-12 1.03 6.94-.96 13.78-5.96 20.52-5 6.74-11.53 10.74-19.59 12-.68-.11-1.35-.18-2.02-.3z"/>
              </svg>
              <span className="text-[20px] font-medium text-white tracking-wide">Apple</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
