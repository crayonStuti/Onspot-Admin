"use client";

import React, { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize?: number;
  itemCountOnPage?: number;
  itemLabel?: string;
  onPageChange: (page: number) => void;
  loading?: boolean;
  className?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 10,
  itemCountOnPage,
  itemLabel = "resources",
  onPageChange,
  loading = false,
  className = "",
}: PaginationProps) {
  const safeTotalPages = Math.max(1, totalPages || 1);

  // Compute start and end display indices
  const currentCount =
    itemCountOnPage !== undefined ? itemCountOnPage : pageSize;
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end =
    totalItems === 0
      ? 0
      : Math.min((currentPage - 1) * pageSize + currentCount, totalItems);

  // Generate pagination items matching HTML mockup (1 2 ... 15)
  const paginationItems = useMemo(() => {
    const pages: (number | string)[] = [];
    const max = safeTotalPages;

    if (max <= 5) {
      for (let i = 1; i <= max; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("…");
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(max - 1, currentPage + 1);
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      if (currentPage < max - 2) pages.push("…");
      pages.push(max);
    }
    return pages;
  }, [currentPage, safeTotalPages]);

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 text-[12.5px] text-[#7D848D] ${
        className || "pt-6 pb-2"
      }`}
    >
      {/* Item range and total count */}
      <div id="resources-count">
        Showing {start} to {end} of {totalItems.toLocaleString()} {itemLabel}
      </div>

      <div className="inline-flex items-center gap-1" id="pagination">
        {/* Previous Button */}
        <button
          disabled={currentPage <= 1 || loading}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          className="min-w-7 h-7 px-2 border-0 bg-transparent rounded-[6px] text-[#7D848D] text-[13px] hover:bg-[#f5efdc] hover:text-[#1f1f1f] disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center justify-center cursor-pointer"
          title="Previous Page"
          aria-label="Previous Page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Page Numbers */}
        {paginationItems.map((item, idx) => {
          if (item === "…") {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="min-w-7 h-7 flex items-center justify-center text-[#7D848D] cursor-default text-[13px]"
              >
                …
              </span>
            );
          }

          const pageNum = Number(item);
          const isCurr = pageNum === currentPage;

          return (
            <button
              key={`page-${pageNum}`}
              onClick={() => onPageChange(pageNum)}
              disabled={loading}
              className={`min-w-7 h-7 px-2 rounded-[6px] text-[13px] transition-colors flex items-center justify-center cursor-pointer ${
                isCurr
                  ? "bg-[#f5efdc] text-[#1f1f1f] font-semibold"
                  : "bg-transparent text-[#7D848D] hover:bg-[#f5efdc] hover:text-[#1f1f1f]"
              }`}
            >
              {pageNum}
            </button>
          );
        })}

        {/* Next Button */}
        <button
          disabled={currentPage >= safeTotalPages || loading}
          onClick={() =>
            onPageChange(Math.min(safeTotalPages, currentPage + 1))
          }
          className="min-w-7 h-7 px-2 border-0 bg-transparent rounded-[6px] text-[#7D848D] text-[13px] hover:bg-[#f5efdc] hover:text-[#1f1f1f] disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center justify-center cursor-pointer"
          title="Next Page"
          aria-label="Next Page"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
