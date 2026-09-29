"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

export interface ActionMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "danger";
  separator?: boolean;
  show?: boolean;
  disabled?: boolean;
}

export interface TableActionMenuProps {
  items: ActionMenuItem[];
  triggerIcon?: React.ReactNode;
  triggerClassName?: string;
  menuWidth?: number;
  align?: "right" | "left";
  title?: string;
}

export default function TableActionMenu({
  items,
  triggerIcon,
  triggerClassName = "",
  menuWidth = 215,
  align = "right",
  title = "More actions",
}: TableActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
    openUpward: boolean;
  }>({ openUpward: false });

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter visible items
  const visibleItems = items.filter((item) => item.show !== false);

  // Calculate position relative to viewport
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const estimatedHeight = visibleItems.length * 36 + 24; // approximate height + padding
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Open upward if there is not enough space below AND more space above
    const openUpward = spaceBelow < estimatedHeight + 10 && spaceAbove > spaceBelow;

    const pos: typeof menuPosition = { openUpward };

    if (openUpward) {
      pos.bottom = window.innerHeight - rect.top + 6;
    } else {
      pos.top = rect.bottom + 6;
    }

    if (align === "right") {
      const rightCoord = window.innerWidth - rect.right;
      // Clamp to ensure it does not bleed off left edge of screen
      pos.right = Math.max(8, rightCoord);
    } else {
      pos.left = Math.max(8, rect.left);
    }

    setMenuPosition(pos);
  }, [visibleItems.length, align]);

  // Toggle menu
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Close on outside click, window resize, or scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    };

    const handleScroll = (e: Event) => {
      // If scroll happens inside the menu itself, don't close
      if (menuRef.current && menuRef.current.contains(e.target as Node)) {
        return;
      }
      setIsOpen(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("click", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("click", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, updatePosition]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        className={`w-[30px] h-[30px] border border-[#e2e2dc] rounded-[7px] bg-white text-[#7D848D] hover:bg-[#f7f7f2] hover:text-[#1f1f1f] hover:border-[#d4d4cd] inline-flex items-center justify-center transition-colors cursor-pointer ${
          isOpen ? "bg-[#f7f7f2] border-[#d4d4cd] text-[#1f1f1f]" : ""
        } ${triggerClassName}`}
        title={title}
        aria-label={title}
        aria-expanded={isOpen}
      >
        {triggerIcon || (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="1.7" />
            <circle cx="12" cy="12" r="1.7" />
            <circle cx="12" cy="19" r="1.7" />
          </svg>
        )}
      </button>

      {/* Render Dropdown Menu in Portal to body so it is NEVER clipped by table overflow */}
      {mounted &&
        isOpen &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: menuPosition.top,
              bottom: menuPosition.bottom,
              left: menuPosition.left,
              right: menuPosition.right,
              width: `${menuWidth}px`,
              zIndex: 99999,
            }}
            className={`bg-white border border-[#ececec] rounded-[10px] shadow-[0_10px_28px_rgba(40,40,40,0.14),0_2px_6px_rgba(40,40,40,0.06)] p-1.5 animate-in fade-in zoom-in-95 duration-100 ${
              menuPosition.openUpward ? "origin-bottom-right" : "origin-top-right"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {visibleItems.map((item, index) => {
              const isDanger = item.variant === "danger";

              return (
                <React.Fragment key={index}>
                  {item.separator && (
                    <div className="my-1 border-t border-[#f1f1ed]" />
                  )}
                  <button
                    type="button"
                    disabled={item.disabled}
                    onClick={() => {
                      setIsOpen(false);
                      item.onClick();
                    }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-[13px] rounded-[6px] transition-colors text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      isDanger
                        ? "text-red-600 hover:bg-red-50"
                        : "text-[#2c2c2c] hover:bg-[#f7f7f2]"
                    }`}
                  >
                    {item.icon && (
                      <span
                        className={`w-4 h-4 flex items-center justify-center flex-shrink-0 ${
                          isDanger ? "text-red-500" : "text-[#7D848D]"
                        }`}
                      >
                        {item.icon}
                      </span>
                    )}
                    <span className="truncate">{item.label}</span>
                  </button>
                </React.Fragment>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}
