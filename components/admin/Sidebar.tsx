"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { clearAuthSession, logoutApi } from "@/lib/api";
import { toast } from "sonner";
import { LogOut } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    iconType: "svg",
    svg: (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-[26px] h-[26px]"
      >
        <rect x="3" y="3" width="8" height="8" rx="1.5" />
        <rect x="13" y="3" width="8" height="5" rx="1.5" />
        <rect x="13" y="11" width="8" height="10" rx="1.5" />
        <rect x="3" y="14" width="8" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    label: "Users",
    href: "/users",
    iconType: "svg",
    svg: (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-[26px] h-[26px]"
      >
        <circle cx="12" cy="8" r="4.2" />
        <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8z" />
      </svg>
    ),
  },
  {
    label: "Memberships",
    href: "/memberships",
    iconType: "svg",
    svg: (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-[26px] h-[26px]"
      >
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
      </svg>
    ),
  },
  {
    label: "Licenses",
    href: "/licenses",
    iconType: "svg",
    svg: (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-[26px] h-[26px]"
      >
        <path d="M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2H2V7zm0 4h20v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6zm3 3v2h5v-2H5z" />
      </svg>
    ),
  },
  {
    label: "States",
    href: "/states",
    iconType: "svg",
    svg: (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-[26px] h-[26px]"
      >
        <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z" />
      </svg>
    ),
  },
  {
    label: "Resources",
    href: "/resources",
    iconType: "svg",
    svg: (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-[26px] h-[26px]"
      >
        <path d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6H6zm7 1.5L18.5 9H14a1 1 0 0 1-1-1V3.5z" />
      </svg>
    ),
  },
  {
    label: "GPS Activity",
    href: "/gps",
    iconType: "img",
    imgSrc: "/images/gps.png",
  },
  {
    label: "AI Assistant",
    href: "/ai",
    iconType: "img",
    imgSrc: "/images/ai-assistant.png",
  },
  {
    label: "Revenue",
    href: "/revenue",
    iconType: "img",
    imgSrc: "/images/revenue.png",
  },
  {
    label: "Reports",
    href: "/reports",
    iconType: "svg",
    svg: (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-[26px] h-[26px]"
      >
        <rect x="3" y="13" width="4.5" height="8" rx="1" />
        <rect x="9.75" y="7" width="4.5" height="14" rx="1" />
        <rect x="16.5" y="10" width="4.5" height="11" rx="1" />
      </svg>
    ),
  },
  {
    label: "Leaderboard",
    href: "/leaderboard",
    iconType: "svg",
    svg: (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-[26px] h-[26px]"
      >
        <circle cx="9" cy="8" r="3.6" />
        <path d="M2 21c0-3.87 3.13-7 7-7s7 3.13 7 7H2z" />
        <circle cx="17" cy="9" r="2.6" />
        <path d="M14.5 14.7c.79-.45 1.7-.7 2.5-.7 2.76 0 5 2.24 5 5h-5.5c0-1.6-.78-3.07-2-4.3z" />
      </svg>
    ),
  },
  {
    label: "Community Posts",
    href: "/community",
    iconType: "img",
    imgSrc: "/images/community.png",
  },
  {
    label: "License Issuers",
    href: "/license-issuers",
    iconType: "svg",
    svg: (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-[26px] h-[26px]"
      >
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
      </svg>
    ),
  },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch {
      // ignore
    } finally {
      clearAuthSession();
      toast.success("Logged out successfully");
      router.push("/login");
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-[240px] bg-white border-r border-[#ECECEC] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 overflow-hidden ${
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Brand Logo */}
        <div className="pt-5 pb-6 px-7 flex items-center justify-center flex-shrink-0">
          <Link href="/users" className="relative w-[150px] h-[52px] block">
            <Image
              src="/images/on-spot-logo.png"
              alt="S.P.O.T. Logo"
              fill
              sizes="150px"
              className="object-contain"
              priority
            />
          </Link>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto pl-3.5 pr-2 space-y-1.5 min-h-0">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-[10px] text-[15px] transition-colors ${
                  isActive
                    ? "bg-[#f5efdc] text-[#1f1f1f] font-semibold"
                    : "text-[#7D848D] hover:bg-[#faf5e6] hover:text-[#1f1f1f] font-normal"
                }`}
              >
                <span className="w-7 h-7 flex items-center justify-center text-[#2d4a23] flex-shrink-0">
                  {item.iconType === "svg" ? (
                    item.svg
                  ) : (
                    <img
                      src={item.imgSrc}
                      alt=""
                      className="w-[26px] h-[26px] object-contain"
                    />
                  )}
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Bottom */}
        <div className="border-t border-[#ECECEC] pt-3.5 pb-4 px-3.5 flex flex-col gap-1.5 flex-shrink-0 bg-white">
          <Link
            href="/notifications"
            onClick={onClose}
            className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-[10px] text-[15px] transition-colors ${
              pathname === "/notifications"
                ? "bg-[#f5efdc] text-[#1f1f1f] font-semibold"
                : "text-[#7D848D] hover:bg-[#faf5e6] hover:text-[#1f1f1f] font-normal"
            }`}
          >
            <span className="w-7 h-7 flex items-center justify-center text-[#2d4a23] flex-shrink-0">
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-[26px] h-[26px]"
              >
                <path d="M12 2a6 6 0 0 0-6 6c0 7-3 9-3 9h18s-3-2-3-9a6 6 0 0 0-6-6zm-2 19a2 2 0 0 0 4 0h-4z" />
              </svg>
            </span>
            <span>Notifications</span>
          </Link>

          <Link
            href="/settings"
            onClick={onClose}
            className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-[10px] text-[15px] transition-colors ${
              pathname === "/settings"
                ? "bg-[#f5efdc] text-[#1f1f1f] font-semibold"
                : "text-[#7D848D] hover:bg-[#faf5e6] hover:text-[#1f1f1f] font-normal"
            }`}
          >
            <span className="w-7 h-7 flex items-center justify-center text-[#2d4a23] flex-shrink-0">
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-[26px] h-[26px]"
              >
                <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65a.5.5 0 0 0 .12-.64l-2-3.46a.5.5 0 0 0-.61-.22l-2.49 1a7.03 7.03 0 0 0-1.69-.98l-.38-2.65A.488.488 0 0 0 14 2h-4a.488.488 0 0 0-.49.42l-.38 2.65c-.61.25-1.17.58-1.69.98l-2.49-1a.566.566 0 0 0-.18-.03c-.17 0-.34.09-.43.25l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65a.5.5 0 0 0-.12.64l2 3.46a.5.5 0 0 0 .61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.05.24.25.42.49.42h4c.24 0 .44-.18.49-.42l.38-2.65c.61-.25 1.17-.58 1.69-.98l2.49 1c.06.02.12.03.18.03.17 0 .34-.09.43-.25l2-3.46a.5.5 0 0 0-.12-.64l-2.11-1.65zM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z" />
              </svg>
            </span>
            <span>Settings</span>
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3.5 px-3.5 py-2 rounded-[10px] text-[14px] text-red-600 hover:bg-red-50 font-medium transition-colors cursor-pointer text-left w-full mt-1"
          >
            <span className="w-7 h-7 flex items-center justify-center text-red-600 flex-shrink-0">
              <LogOut className="w-5 h-5" />
            </span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
