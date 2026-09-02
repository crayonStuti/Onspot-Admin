"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, Search, ChevronDown } from "lucide-react";

interface HeaderProps {
  onMenuClick: () => void;
  title?: string;
}

export default function Header({ onMenuClick, title = "Users Management" }: HeaderProps) {
  const [userEmail, setUserEmail] = useState<string>("Leonardo Smith");
  const [userRole, setUserRole] = useState<string>("Admin");
  const [userPhoto, setUserPhoto] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        const name = parsed.first_name || parsed.display_name || parsed.email || "Admin";
        setUserEmail(name);
        setUserRole(parsed.role || "Admin");
        setUserPhoto(parsed.photoURL || parsed.profile?.profile_picture || null);
      }
    } catch {
      // ignore
    }
  }, []);

  return (
    <header className="flex items-center justify-between gap-4 sm:gap-6 mb-8 pt-2">
      {/* Page Title & Mobile Menu Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 lg:hidden cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-[24px] font-bold text-[#1f1f1f] tracking-tight whitespace-nowrap">
          {title}
        </h1>
      </div>

      {/* Center Search Input */}
      <div className="hidden md:flex flex-1 max-w-[520px] mx-4 relative">
        <input
          type="text"
          id="top-search"
          placeholder="Search"
          className="w-full py-3 pl-5 pr-11 border-0 rounded-[15px] bg-white text-[13.5px] text-[#444] placeholder-[#999] shadow-xs outline-none focus:ring-2 focus:ring-[#0E3E27]/20 transition-all"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#999] pointer-events-none">
          <Search className="w-[18px] height-[18px]" />
        </span>
      </div>

      {/* Top Right Action Icons & Profile */}
      <div className="flex items-center gap-3.5 flex-shrink-0">
        {/* Settings round button */}
        <Link
          href="/settings"
          title="Settings"
          className="w-[42px] h-[42px] rounded-full bg-[#f5efdc] flex items-center justify-center hover:bg-[#eae2c9] transition-colors cursor-pointer"
        >
          <img src="/images/setting-icon.png" alt="Settings" className="w-6 h-6 object-contain" />
        </Link>

        {/* Notifications round button */}
        <Link
          href="/notifications"
          title="Notifications"
          className="w-[42px] h-[42px] rounded-full bg-[#f5efdc] flex items-center justify-center hover:bg-[#eae2c9] transition-colors cursor-pointer"
        >
          <img src="/images/notification-icon.png" alt="Notifications" className="w-6 h-6 object-contain" />
        </Link>

        {/* Profile Pill */}
        <div className="flex items-center gap-2.5 py-1 pl-1 pr-3.5 rounded-full bg-white border border-[#ececec] shadow-xs">
          <div className="w-[36px] h-[36px] rounded-full bg-[#0E3E27]/10 text-[#0E3E27] font-bold flex items-center justify-center text-xs overflow-hidden flex-shrink-0">
            {userPhoto ? (
              <img src={userPhoto} alt={userEmail} className="w-full h-full object-cover" />
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
          <ChevronDown className="w-3.5 h-3.5 text-[#888]" />
        </div>
      </div>
    </header>
  );
}
