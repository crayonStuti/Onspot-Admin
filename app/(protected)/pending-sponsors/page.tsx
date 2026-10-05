"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Eye,
  Check,
  X,
  Loader2,
  AlertCircle,
  ExternalLink,
  Mail,
  Building2,
  Percent,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCw,
} from "lucide-react";
import { toast } from "sonner";
import Pagination from "@/components/admin/Pagination";
import {
  getSponsors,
  getSponsorById,
  updateSponsorStatus,
  SponsorItem,
  API_URL,
} from "@/lib/api";

export default function PendingSponsorsPage() {
  const [sponsors, setSponsors] = useState<SponsorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // View Details Modal State
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedSponsor, setSelectedSponsor] = useState<SponsorItem | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  // Status Action Confirmation Modal State
  const [statusConfirmModal, setStatusConfirmModal] = useState<{
    sponsor: SponsorItem;
    targetStatus: "approved" | "rejected";
  } | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Helper to extract id from sponsor
  const getSponsorId = (item?: SponsorItem | null): string => {
    if (!item) return "";
    return item.id || item.sponsor_id || item._id || "";
  };

  // Helper to resolve image URL with backend base URL
  const getImageSrc = (url?: string | null) => {
    if (!url) return "";
    if (
      url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("blob:") ||
      url.startsWith("data:")
    ) {
      return url;
    }
    return `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  // Fetch Pending Sponsors List (strictly API-based search & status=pending)
  const fetchPendingSponsors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSponsors(
        page,
        limit,
        searchQuery,
        "pending"
      );
      let list: SponsorItem[] = [];

      if (res && res.data) {
        if (Array.isArray(res.data)) {
          list = res.data;
          if (res.pagination) {
            setTotalPages(res.pagination.totalPages || 1);
            setTotalItems(
              res.pagination.totalItems ||
                res.pagination.totaldata ||
                res.data.length
            );
          } else {
            setTotalPages(
              res.totalPages ||
                Math.ceil((res.total || res.data.length) / limit) ||
                1
            );
            setTotalItems(res.total || res.data.length);
          }
        } else if (Array.isArray(res.data.sponsors)) {
          list = res.data.sponsors;
          const pag = res.data.pagination || res.pagination;
          if (pag) {
            setTotalPages(pag.totalPages || 1);
            setTotalItems(
              pag.totalItems ||
                pag.totaldata ||
                res.data.sponsors.length
            );
          } else {
            setTotalPages(
              res.totalPages ||
                Math.ceil((res.total || res.data.sponsors.length) / limit) ||
                1
            );
            setTotalItems(res.total || res.data.sponsors.length);
          }
        }
      } else if (Array.isArray(res)) {
        list = res;
        setTotalItems(res.length);
        setTotalPages(1);
      } else if (res && res.sponsors && Array.isArray(res.sponsors)) {
        list = res.sponsors;
        setTotalItems(res.sponsors.length);
        setTotalPages(1);
      }

      setSponsors(list);
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Fetch pending sponsors error:", error);
      toast.error(error?.message || "Failed to load pending sponsors");
      setSponsors([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchQuery]);

  // Debounce search query to trigger server-side API search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPendingSponsors();
    }, 350);
    return () => clearTimeout(timer);
  }, [fetchPendingSponsors]);

  // Open View Details Modal
  const handleOpenView = async (sponsor: SponsorItem) => {
    setSelectedSponsor(sponsor);
    setViewModalOpen(true);

    const id = getSponsorId(sponsor);
    if (id) {
      setViewLoading(true);
      try {
        const details = await getSponsorById(id);
        const item = details?.data || details?.sponsor || details;
        if (item && typeof item === "object") {
          setSelectedSponsor((prev) => ({ ...prev, ...item }));
        }
      } catch (err: unknown) {
        console.warn("Could not fetch detailed sponsor info:", err);
      } finally {
        setViewLoading(false);
      }
    }
  };

  // Open Status Confirmation Modal
  const handleOpenStatusConfirm = (
    sponsor: SponsorItem,
    targetStatus: "approved" | "rejected"
  ) => {
    setStatusConfirmModal({ sponsor, targetStatus });
  };

  // Execute Status Update (Approve / Reject) via PUT /sponsors/{id}/status
  const handleConfirmStatusUpdate = async () => {
    if (!statusConfirmModal) return;
    const { sponsor, targetStatus } = statusConfirmModal;
    const id = getSponsorId(sponsor);
    if (!id) {
      toast.error("Invalid sponsor ID");
      return;
    }

    setUpdatingStatus(true);
    try {
      await updateSponsorStatus(id, targetStatus);
      toast.success(
        `Sponsor successfully marked as ${targetStatus === "approved" ? "Approved" : "Rejected"}`
      );
      setStatusConfirmModal(null);
      if (viewModalOpen && selectedSponsor && getSponsorId(selectedSponsor) === id) {
        setViewModalOpen(false);
        setSelectedSponsor(null);
      }
      fetchPendingSponsors();
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Failed to update sponsor status:", error);
      toast.error(error?.message || `Failed to update status to ${targetStatus}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ===================== FILTER & ACTION ROW ===================== */}
      <section className="bg-white rounded-[14px] p-4 sm:p-5 border border-[#ececec] shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto flex-1">
          {/* API-based Search Input */}
          <div className="relative w-full sm:max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search pending sponsors by name, email..."
              className="w-full h-[38px] pl-3.5 pr-9 border border-[#e4e4df] bg-white rounded-[6px] text-[#444] text-[13px] placeholder-gray-400 focus:outline-none focus:border-[#2d4a23]"
            />
            <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Pending Badge Indicator */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Pending Review ({totalItems})</span>
          </div>
        </div>

        {/* Refresh List Button */}
        <button
          onClick={() => fetchPendingSponsors()}
          disabled={loading}
          className="h-[38px] px-3.5 rounded-[6px] border border-[#e4e4df] bg-white hover:bg-gray-50 text-gray-700 text-[13px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          title="Refresh list"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </section>

      {/* ===================== TABLE CARD ===================== */}
      <section className="bg-white rounded-[14px] p-5 pb-3 border border-[#ececec] shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="border-b border-[#ececec]">
                <th className="py-3.5 px-3 font-semibold text-[#111111] text-[13px] w-14">
                  #
                </th>
                <th className="py-3.5 px-3 font-semibold text-[#111111] text-[13px]">
                  Sponsor
                </th>
                <th className="py-3.5 px-3 font-semibold text-[#111111] text-[13px]">
                  Email
                </th>
                <th className="py-3.5 px-3 font-semibold text-[#111111] text-[13px]">
                  Discount
                </th>
                <th className="py-3.5 px-3 font-semibold text-[#111111] text-[13px]">
                  Website
                </th>
                <th className="py-3.5 px-3 font-semibold text-[#111111] text-[13px]">
                  Status
                </th>
                <th className="py-3.5 px-3 text-right font-semibold text-[#111111] text-[13px] w-48">
                  Review Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f1ed] text-[13px]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-[#7D848D]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-[#2d4a23]" />
                      <span className="text-[13px] font-medium text-[#7D848D]">
                        Loading pending sponsors...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : sponsors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-[#7D848D]">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <AlertCircle className="w-8 h-8 text-gray-300" />
                      <p className="text-[13px] font-semibold text-gray-700">
                        No pending sponsors found.
                      </p>
                      <p className="text-xs text-gray-400">
                        {searchQuery
                          ? "Try a different search query."
                          : "There are currently no sponsors awaiting approval."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                sponsors.map((sponsor, idx) => {
                  const itemIndex = (page - 1) * limit + idx + 1;
                  const sponsorId = getSponsorId(sponsor);

                  return (
                    <tr
                      key={sponsorId || idx}
                      className="hover:bg-[#fbfbf8] transition-colors"
                    >
                      {/* Index */}
                      <td className="py-3.5 px-3 text-[#7D848D] align-middle font-mono text-xs">
                        {itemIndex}
                      </td>

                      {/* Sponsor Name + Logo */}
                      <td className="py-3.5 px-3 align-middle">
                        <div className="flex items-center gap-3">
                          {sponsor.image ? (
                            <img
                              src={getImageSrc(sponsor.image)}
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-[#f5efdc] text-[#4a6b3f] flex items-center justify-center flex-shrink-0 font-bold text-xs">
                              <Building2 className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-semibold text-[#1f1f1f] text-[13.5px] block truncate max-w-[200px]">
                              {sponsor.sponsor_name}
                            </span>
                            {sponsor.description && (
                              <span className="text-xs text-gray-400 block truncate max-w-[220px]">
                                {sponsor.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-3 align-middle text-[#555] text-xs">
                        {sponsor.email_address ? (
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="truncate max-w-[170px]">
                              {sponsor.email_address}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      {/* Discount */}
                      <td className="py-3.5 px-3 align-middle">
                        {sponsor.company_discount ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-[#f5efdc] text-[#1f1f1f] border border-[#e6dfc6] font-medium text-xs">
                            <Percent className="w-3 h-3 text-[#4a6b3f]" />
                            <span>{sponsor.company_discount}</span>
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      {/* Website */}
                      <td className="py-3.5 px-3 align-middle">
                        {sponsor.link ? (
                          <a
                            href={
                              sponsor.link.startsWith("http://") ||
                              sponsor.link.startsWith("https://")
                                ? sponsor.link
                                : `https://${sponsor.link}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-[#2d4a23] hover:underline font-medium"
                          >
                            <span className="truncate max-w-[140px]">
                              {sponsor.link.replace(/^https?:\/\//, "")}
                            </span>
                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          </a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 align-middle whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          Pending
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3 align-middle text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Approve Button */}
                          <button
                            onClick={() => handleOpenStatusConfirm(sponsor, "approved")}
                            title="Approve Sponsor"
                            className="h-[30px] px-2.5 rounded-[7px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium inline-flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>

                          {/* Reject Button */}
                          <button
                            onClick={() => handleOpenStatusConfirm(sponsor, "rejected")}
                            title="Reject Sponsor"
                            className="h-[30px] px-2.5 rounded-[7px] bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium inline-flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>

                          {/* View details */}
                          <button
                            onClick={() => handleOpenView(sponsor)}
                            title="View Full Details"
                            className="w-[30px] h-[30px] border border-[#e2e2dc] rounded-[7px] bg-white text-[#7D848D] hover:bg-[#f7f7f2] hover:text-[#1f1f1f] hover:border-[#d4d4cd] inline-flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ===================== PAGINATION ===================== */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems || sponsors.length}
        pageSize={limit}
        itemCountOnPage={sponsors.length}
        itemLabel="pending sponsors"
        onPageChange={(p) => setPage(p)}
        loading={loading}
      />

      {/* ===================== VIEW DETAILS MODAL ===================== */}
      {viewModalOpen && selectedSponsor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                {selectedSponsor.image ? (
                  <img
                    src={getImageSrc(selectedSponsor.image)}
                    alt=""
                    className="w-12 h-12 rounded-xl object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-[#f5efdc] text-[#4a6b3f] flex items-center justify-center font-bold">
                    <Building2 className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {selectedSponsor.sponsor_name}
                  </h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      Pending Approval
                    </span>
                    {selectedSponsor.company_discount && (
                      <span className="text-xs text-gray-600 font-medium bg-gray-100 px-2 py-0.5 rounded-md">
                        {selectedSponsor.company_discount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setViewModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {viewLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#2d4a23]" />
                <span className="text-xs text-gray-500">Loading details...</span>
              </div>
            ) : (
              <div className="py-5 space-y-4 text-xs">
                {selectedSponsor.description && (
                  <div>
                    <span className="text-gray-400 font-medium block mb-1">
                      Description
                    </span>
                    <p className="p-3 bg-[#fbfbf8] border border-[#f0f0eb] rounded-xl text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {selectedSponsor.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex flex-col gap-1">
                    <span className="text-gray-400 font-medium">Email Address</span>
                    <span className="font-semibold text-gray-800 break-all">
                      {selectedSponsor.email_address || "—"}
                    </span>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex flex-col gap-1">
                    <span className="text-gray-400 font-medium">Website Link</span>
                    {selectedSponsor.link ? (
                      <a
                        href={
                          selectedSponsor.link.startsWith("http://") ||
                          selectedSponsor.link.startsWith("https://")
                            ? selectedSponsor.link
                            : `https://${selectedSponsor.link}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-[#2d4a23] hover:underline inline-flex items-center gap-1 break-all"
                      >
                        <span className="truncate">{selectedSponsor.link}</span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    ) : (
                      <span className="font-semibold text-gray-800">—</span>
                    )}
                  </div>

                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex flex-col gap-1">
                    <span className="text-gray-400 font-medium">Submitted On</span>
                    <span className="font-semibold text-gray-800">
                      {selectedSponsor.created_at
                        ? new Date(selectedSponsor.created_at).toLocaleString()
                        : "—"}
                    </span>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex flex-col gap-1">
                    <span className="text-gray-400 font-medium">Sponsor ID</span>
                    <span className="font-mono text-[11px] text-gray-700 break-all select-all">
                      {getSponsorId(selectedSponsor) || "—"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleOpenStatusConfirm(selectedSponsor, "approved");
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve Sponsor</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleOpenStatusConfirm(selectedSponsor, "rejected");
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setViewModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700 transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== STATUS CONFIRMATION MODAL ===================== */}
      {statusConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-gray-100 p-6 text-center">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
                statusConfirmModal.targetStatus === "approved"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-rose-50 text-rose-600"
              }`}
            >
              {statusConfirmModal.targetStatus === "approved" ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <XCircle className="w-6 h-6" />
              )}
            </div>

            <h3 className="text-base font-bold text-gray-900 mb-1">
              {statusConfirmModal.targetStatus === "approved"
                ? "Approve Sponsor?"
                : "Reject Sponsor?"}
            </h3>

            <p className="text-xs text-gray-500 mb-5 leading-relaxed">
              Are you sure you want to mark{" "}
              <span className="font-semibold text-gray-800">
                {statusConfirmModal.sponsor.sponsor_name}
              </span>{" "}
              as{" "}
              <span
                className={`font-semibold ${
                  statusConfirmModal.targetStatus === "approved"
                    ? "text-emerald-700"
                    : "text-rose-700"
                }`}
              >
                {statusConfirmModal.targetStatus.toUpperCase()}
              </span>
              ?
            </p>

            <div className="flex items-center justify-center gap-2.5">
              <button
                type="button"
                disabled={updatingStatus}
                onClick={() => setStatusConfirmModal(null)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updatingStatus}
                onClick={handleConfirmStatusUpdate}
                className={`px-5 py-2 rounded-lg text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 transition-colors cursor-pointer ${
                  statusConfirmModal.targetStatus === "approved"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {updatingStatus && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  Confirm {statusConfirmModal.targetStatus === "approved" ? "Approval" : "Rejection"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
