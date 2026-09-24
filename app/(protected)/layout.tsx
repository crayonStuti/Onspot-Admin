"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import { isSessionValid, clearAuthSession, touchActivity } from "@/lib/api";
import { toast } from "sonner";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Validate session and set up inactivity/unauthorized listeners
  useEffect(() => {
    // 1. Initial validation
    if (!isSessionValid()) {
      clearAuthSession();
      toast.error("Session expired. Please log in again.");
      router.replace("/login");
      return;
    }

    // 2. Listen to 401 unauthorized / session expiration events
    const handleUnauthorized = (e: any) => {
      const reason = e?.detail?.reason;
      clearAuthSession();
      if (reason === "session_expired") {
        toast.error("Session expired due to inactivity. Please log in again.");
      } else if (reason === "refresh_failed") {
        toast.error("Session expired. Please log in again.");
      } else {
        toast.error("Authentication required. Please log in.");
      }
      router.replace("/login");
    };

    window.addEventListener("onSpot:unauthorized", handleUnauthorized);

    // 3. User activity tracking (throttled)
    let lastTouched = Date.now();
    const handleUserActivity = () => {
      const now = Date.now();
      // Throttle touches to once every 60 seconds
      if (now - lastTouched > 60 * 1000) {
        lastTouched = now;
        touchActivity();
      }
    };

    window.addEventListener("click", handleUserActivity, { passive: true });
    window.addEventListener("keydown", handleUserActivity, { passive: true });
    window.addEventListener("touchstart", handleUserActivity, { passive: true });

    // Periodic check every 5 minutes
    const interval = setInterval(() => {
      if (!isSessionValid()) {
        clearAuthSession();
        toast.error("Session expired. Please log in again.");
        router.replace("/login");
      }
    }, 5 * 60 * 1000);

    return () => {
      window.removeEventListener("onSpot:unauthorized", handleUnauthorized);
      window.removeEventListener("click", handleUserActivity);
      window.removeEventListener("keydown", handleUserActivity);
      window.removeEventListener("touchstart", handleUserActivity);
      clearInterval(interval);
    };
  }, [router]);

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

