"use client";

import React, { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { sanitizeCsvCell, buildCsvContent } from "@/lib/csv";

export { sanitizeCsvCell, buildCsvContent, formatExportDate } from "@/lib/csv";

export interface ExportButtonProps<T> {
  fetchData: () => Promise<T[]>;
  getHeadersAndRows: (data: T[]) => {
    headers: string[];
    rows: (string | number | boolean | null | undefined)[][];
  };
  filenamePrefix?: string;
  totalRecords?: number;
  className?: string;
  label?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export function ExportButton<T>({
  fetchData,
  getHeadersAndRows,
  filenamePrefix = "export",
  totalRecords,
  className,
  label = "Export CSV",
  icon,
  disabled = false,
}: ExportButtonProps<T>): React.JSX.Element {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (disabled || isExporting) return;

    // Pre-fetch guard: abort early if totalRecords is explicitly 0
    if (totalRecords === 0) {
      toast.info("No records available to export.");
      return;
    }

    setIsExporting(true);
    const toastId = toast.loading(
      totalRecords !== undefined
        ? `Fetching ${totalRecords.toLocaleString()} records for export...`
        : "Fetching full dataset from server..."
    );

    try {
      const data = await fetchData();

      // Post-fetch check: empty or invalid dataset
      if (!Array.isArray(data) || data.length === 0) {
        toast.info("No matching records found to export.", { id: toastId });
        return;
      }

      // Generate CSV content with UTF-8 BOM
      const { headers, rows } = getHeadersAndRows(data);
      const csvContent = buildCsvContent(headers, rows);

      // Create Blob and trigger download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filenamePrefix || "export"}_${new Date().toISOString().slice(0, 10)}.csv`;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      toast.success(
        `Successfully exported ${data.length.toLocaleString()} records.`,
        { id: toastId }
      );
    } catch (err: unknown) {
      const errorMessage =
        (err as { message?: string })?.message || "Failed to export data.";
      toast.error(errorMessage, { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  const defaultClassName =
    "h-[30px] px-2.5 sm:px-3 rounded-[7px] border border-[#e4e4df] bg-white hover:bg-[#f7f7f2] text-[12px] font-medium text-[#4a4a4a] inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 whitespace-nowrap";

  const resolvedClassName = className
    ? `${className}${className.includes("disabled:") ? "" : " disabled:opacity-50 disabled:cursor-not-allowed"}`
    : `${defaultClassName} disabled:opacity-50 disabled:cursor-not-allowed`;

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={disabled || isExporting}
      className={resolvedClassName}
    >
      {isExporting ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : icon !== undefined ? (
        icon
      ) : (
        <Download className="w-3.5 h-3.5" />
      )}
      {label ? <span>{label}</span> : null}
    </button>
  );
}

export default ExportButton;
