"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, ChevronDown } from "lucide-react";
import UnifiedSearch from "./UnifiedSearch";

interface HeaderProps {
  onMenuClick: () => void;
  title?: string;
}

const ROUTE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard Overview",
  "/users": "Users Management",
  "/resources": "Resources Management",
  "/memberships": "Membership Management",
  "/licenses": "License Wallet Management",
  "/license-issuers": "License Issuers Management",
  "/states": "States Management",
  "/gps": "GPS / Tagging Activity",
  "/ai": "AI Assistant Monitoring",
  "/revenue": "Revenue & Monetization",
  "/reports": "Reports & Moderation",
  "/leaderboard": "Leaderboard",
  "/community": "Social Media / Community Posts",
  "/sponsors": "Sponsors Management",
  "/pending-sponsors": "Pending Sponsors",
  "/notifications": "Notification / Announcements",
  "/settings": "Admin Settings",
};

function getDynamicTitle(pathname: string): string {
  if (!pathname || pathname === "/") return "Dashboard Overview";

  for (const [route, pageTitle] of Object.entries(ROUTE_TITLES)) {
    if (pathname === route || pathname.startsWith(`${route}/`)) {
      return pageTitle;
    }
  }

  const segment = pathname.split("/").filter(Boolean)[0] || "";
  if (!segment) return "Dashboard Overview";

  return (
    segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ") + " Management"
  );
}

export default function Header({
  onMenuClick,
  title: customTitle,
}: HeaderProps) {
  const pathname = usePathname();
  const title = customTitle || getDynamicTitle(pathname);

  const [userEmail, setUserEmail] = useState<string>("Leonardo Smith");
  const [userRole, setUserRole] = useState<string>("Admin");
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        const name =
          parsed.first_name || parsed.display_name || parsed.email || "Admin";
        setUserEmail(name);
        setUserRole(parsed.role || "Admin");
        setUserPhoto(
          parsed.photoURL || parsed.profile?.profile_picture || null,
        );
      }
    } catch {
      // ignore
    }
  }, []);

  return (
    <header className="mb-5 sm:mb-8 pt-2 w-full min-w-0">
      <div className="flex items-center justify-between gap-3 sm:gap-6 w-full">
        {/* Page Title & Mobile Menu Button */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
          <button
            onClick={onMenuClick}
            className="p-1.5 sm:p-2 rounded-xl text-gray-600 hover:bg-gray-100 lg:hidden cursor-pointer shrink-0"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-[17px] sm:text-[22px] md:text-[24px] font-bold text-[#1f1f1f] tracking-tight whitespace-nowrap">
            {title}
          </h1>
        </div>

        {/* Center Search Input - Exactly matches HTML: flex: 1, max-width: 520px, margin: 0 24px */}
        <div className="hidden md:flex flex-1 max-w-[520px] mx-4 lg:mx-6 relative">
          <UnifiedSearch />
        </div>

        {/* Top Right Action Icons & Profile */}
        <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
          {/* Mobile Search Toggle Button */}
          <button
            onClick={() => setIsMobileSearchOpen((prev) => !prev)}
            className="md:hidden w-[34px] h-[34px] rounded-full bg-[#f5efdc] flex items-center justify-center hover:bg-[#eae2c9] text-[#2d4a23] transition-colors cursor-pointer shrink-0"
            title="Search"
            aria-label="Toggle search"
          >
            <Search className="w-4 h-4 text-[#2d4a23]" />
          </button>

          {/* Settings round button */}
          <Link
            href="/settings"
            title="Settings"
            className="w-[34px] h-[34px] sm:w-[42px] sm:h-[42px] rounded-full bg-[#f5efdc] flex items-center justify-center hover:bg-[#eae2c9] transition-colors cursor-pointer shrink-0"
          >
            <img
              src="/images/setting-icon.png"
              alt="Settings"
              className="w-4 h-4 sm:w-6 sm:h-6 object-contain"
            />
          </Link>

          {/* Notifications round button */}
          <Link
            href="/notifications"
            title="Notifications"
            className="w-[34px] h-[34px] sm:w-[42px] sm:h-[42px] rounded-full bg-[#f5efdc] flex items-center justify-center hover:bg-[#eae2c9] transition-colors cursor-pointer shrink-0"
          >
            <img
              src="/images/notification-icon.png"
              alt="Notifications"
              className="w-4 h-4 sm:w-6 sm:h-6 object-contain"
            />
          </Link>

          {/* Profile Pill */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 py-1 pl-1 pr-2 sm:pr-3.5 rounded-full bg-white border border-[#ececec] shadow-xs shrink-0">
            <div className="w-[28px] h-[28px] sm:w-[36px] sm:h-[36px] rounded-full bg-[#0E3E27]/10 text-[#0E3E27] font-bold flex items-center justify-center text-xs overflow-hidden flex-shrink-0">
              {userPhoto ? (
                <img
                  src={userPhoto}
                  alt={userEmail}
                  className="w-full h-full object-cover"
                />
              ) : (
                userEmail.charAt(0).toUpperCase()
              )}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-[13px] font-semibold text-[#1f1f1f] leading-tight max-w-[110px] truncate">
                {userEmail}
              </div>
              <div className="text-[11px] text-[#888] font-normal leading-tight capitalize">
                {userRole}
              </div>
            </div>
            <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#888]" />
          </div>
        </div>
      </div>

      {/* Mobile search bar dropdown */}
      {isMobileSearchOpen && (
        <div className="md:hidden mt-3 w-full animate-in fade-in-50 duration-150">
          <UnifiedSearch onCloseMobile={() => setIsMobileSearchOpen(false)} />
        </div>
      )}
    </header>
  );
}
