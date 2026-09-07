"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import { isSessionValid, clearAuthSession, touchActivity } from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);

  const handleForceLogout = (message = "Session expired. Please log in again.") => {
    setIsAuthorized(false);
    clearAuthSession();
    toast.error(message);
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  };

  useEffect(() => {
    // 1. Initial synchronous check
    if (!isSessionValid()) {
      handleForceLogout("Session expired. Please log in again.");
      return;
    }

    setIsAuthorized(true);
    setCheckingAuth(false);

    // 2. Listen to 401 unauthorized / session expiration events
    const handleUnauthorized = (e: any) => {
      const reason = e?.detail?.reason;
      if (reason === "session_expired") {
        handleForceLogout("Session expired due to inactivity. Please log in again.");
      } else if (reason === "refresh_failed") {
        handleForceLogout("Session expired. Please log in again.");
      } else {
        handleForceLogout("Authentication required. Please log in.");
      }
    };

    window.addEventListener("onSpot:unauthorized", handleUnauthorized);

    // 3. User activity tracking (throttled)
    let lastTouched = Date.now();
    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastTouched > 60 * 1000) {
        lastTouched = now;
        touchActivity();
      }
    };

    window.addEventListener("click", handleUserActivity, { passive: true });
    window.addEventListener("keydown", handleUserActivity, { passive: true });
    window.addEventListener("touchstart", handleUserActivity, { passive: true });

    // Periodic check every 2 minutes
    const interval = setInterval(() => {
      if (!isSessionValid()) {
        handleForceLogout("Session expired. Please log in again.");
      }
    }, 2 * 60 * 1000);

    return () => {
      window.removeEventListener("onSpot:unauthorized", handleUnauthorized);
      window.removeEventListener("click", handleUserActivity);
      window.removeEventListener("keydown", handleUserActivity);
      window.removeEventListener("touchstart", handleUserActivity);
      clearInterval(interval);
    };
  }, []);

  if (checkingAuth || !isAuthorized) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#2d4a23] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F9] flex text-[#2c2c2c]">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[240px]">
        <main className="flex-1 p-5 sm:p-7 max-w-[1600px] w-full mx-auto">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          {children}
        </main>
      </div>
    </div>
  );
}

