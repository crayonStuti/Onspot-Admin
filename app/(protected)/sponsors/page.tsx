"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Loader2,
  AlertCircle,
  X,
  Check,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Mail,
  Building2,
  Image as ImageIcon,
  Upload,
  Percent,
} from "lucide-react";
import { toast } from "sonner";
import Pagination from "@/components/admin/Pagination";
import {
  getSponsors,
  getSponsorById,
  createSponsor,
  updateSponsor,
  updateSponsorStatus,
  deleteSponsor,
  SponsorItem,
  API_URL,
} from "@/lib/api";

function SponsorsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const statusFilter = searchParams.get("status") || "all";

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

  // Add / Edit Modal State
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<SponsorItem | null>(null);
  const [formData, setFormData] = useState({
    sponsor_name: "",
    email_address: "",
    company_discount: "",
    link: "",
    description: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirmation State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [sponsorToDelete, setSponsorToDelete] = useState<SponsorItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Status Action Confirmation State (Approve / Reject)
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

  // Fetch Sponsors List via Server-side API
  const fetchSponsorsList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSponsors(
        page,
        limit,
        searchQuery,
        statusFilter === "all" ? undefined : statusFilter
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
      console.error("Fetch sponsors error:", error);
      toast.error(error?.message || "Failed to load sponsors");
      setSponsors([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchQuery, statusFilter]);

  // Debounced API-based search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSponsorsList();
    }, 350);
    return () => clearTimeout(timer);
  }, [fetchSponsorsList]);

  // Handle status filter change + URL update
  const handleStatusFilterChange = (newStatus: string) => {
    setPage(1);
    const params = new URLSearchParams(searchParams.toString());
    if (newStatus && newStatus !== "all") {
      params.set("status", newStatus);
    } else {
      params.delete("status");
    }
    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
  };

  // Open Create Sponsor Modal
  const handleOpenCreate = () => {
    setEditingSponsor(null);
    setFormData({
      sponsor_name: "",
      email_address: "",
      company_discount: "",
      link: "",
      description: "",
    });
    setImageFile(null);
    setImagePreview(null);
    setFormModalOpen(true);
  };

  // Open Edit Sponsor Modal
  const handleOpenEdit = (sponsor: SponsorItem) => {
    setEditingSponsor(sponsor);
    setFormData({
      sponsor_name: sponsor.sponsor_name || "",
      email_address: sponsor.email_address || "",
      company_discount: sponsor.company_discount || "",
      link: sponsor.link || "",
      description: sponsor.description || "",
    });
    setImageFile(null);
    setImagePreview(sponsor.image ? getImageSrc(sponsor.image) : null);
    setFormModalOpen(true);
  };

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

  // Handle Status Update Confirmation Open
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
        setSelectedSponsor((prev) => (prev ? { ...prev, status: targetStatus } : null));
      }
      fetchSponsorsList();
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Failed to update sponsor status:", error);
      toast.error(error?.message || `Failed to update status to ${targetStatus}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle File Input Change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Handle Create / Edit Submit
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sponsor_name.trim()) {
      toast.error("Sponsor name is required");
      return;
    }

    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append("sponsor_name", formData.sponsor_name.trim());
      if (formData.email_address.trim()) {
        payload.append("email_address", formData.email_address.trim());
      }
      if (formData.company_discount.trim()) {
        payload.append("company_discount", formData.company_discount.trim());
      }
      if (formData.link.trim()) {
        payload.append("link", formData.link.trim());
      }
      if (formData.description.trim()) {
        payload.append("description", formData.description.trim());
      }
      if (imageFile) {
        payload.append("image", imageFile);
      }

      if (editingSponsor) {
        const id = getSponsorId(editingSponsor);
        await updateSponsor(id, payload);
        toast.success("Sponsor updated successfully");
      } else {
        await createSponsor(payload);
        toast.success("Sponsor created successfully");
      }

      setFormModalOpen(false);
      setEditingSponsor(null);
      fetchSponsorsList();
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Save sponsor error:", error);
      toast.error(error?.message || "Failed to save sponsor");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Delete Confirmation Modal
  const handleOpenDelete = (sponsor: SponsorItem) => {
    setSponsorToDelete(sponsor);
    setDeleteConfirmOpen(true);
  };

  // Confirm Delete Sponsor
  const handleConfirmDelete = async () => {
    const id = getSponsorId(sponsorToDelete);
    if (!id) return;

    setDeleting(true);
    try {
      await deleteSponsor(id);
      toast.success("Sponsor deleted successfully");
      setDeleteConfirmOpen(false);
      setSponsorToDelete(null);
      fetchSponsorsList();
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Delete sponsor error:", error);
      toast.error(error?.message || "Failed to delete sponsor");
    } finally {
      setDeleting(false);
    }
  };

  // Status Badge Helper
  const renderStatusBadge = (status?: string) => {
    const s = (status || "").toLowerCase();
    if (s === "approved" || s === "active") {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Approved
        </span>
      );
    }
    if (s === "pending") {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          Pending
        </span>
      );
    }
    if (s === "rejected") {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          Rejected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200">
        {status || "Active"}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* ===================== FILTER & ACTION ROW ===================== */}
      <section className="bg-white rounded-[14px] p-4 sm:p-5 border border-[#ececec] shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto flex-1">
          {/* API Search Input */}
          <div className="relative w-full sm:max-w-xs">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search sponsors..."
              className="w-full h-[38px] pl-3.5 pr-9 border border-[#e4e4df] bg-white rounded-[6px] text-[#444] text-[13px] placeholder-gray-400 focus:outline-none focus:border-[#2d4a23]"
            />
            <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
            className="h-[38px] px-3 border border-[#e4e4df] bg-white rounded-[6px] text-[#444] text-[13px] focus:outline-none focus:border-[#2d4a23] cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Add Sponsor Button */}
        <button
          onClick={handleOpenCreate}
          className="h-[38px] px-4 rounded-[6px] bg-[#4a6b3f] hover:bg-[#3c5733] text-white text-[13px] font-medium transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add Sponsor</span>
        </button>
      </section>

      {/* ===================== TABLE CARD ===================== */}
      <section className="bg-white rounded-[14px] p-5 pb-3 border border-[#ececec] shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[720px]">
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
                <th className="py-3.5 px-3 text-right font-semibold text-[#111111] text-[13px] w-44">
                  Actions
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
                        Loading sponsors...
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
                        No sponsors found.
                      </p>
                      <p className="text-xs text-gray-400">
                        {statusFilter === "pending"
                          ? "There are currently no sponsors awaiting approval."
                          : "Click \"Add Sponsor\" to create a new sponsor entry."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                sponsors.map((sponsor, idx) => {
                  const itemIndex = (page - 1) * limit + idx + 1;
                  const sponsorId = getSponsorId(sponsor);
                  const isPending = sponsor.status?.toLowerCase() === "pending";

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
                              className="w-9 h-9 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-[#f5efdc] text-[#4a6b3f] flex items-center justify-center flex-shrink-0 font-bold text-xs">
                              <Building2 className="w-4 h-4" />
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
                        {renderStatusBadge(sponsor.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3 align-middle text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Approve / Reject for Pending */}
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleOpenStatusConfirm(sponsor, "approved")}
                                title="Approve Sponsor"
                                className="w-[30px] h-[30px] rounded-[7px] bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-emerald-200 inline-flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenStatusConfirm(sponsor, "rejected")}
                                title="Reject Sponsor"
                                className="w-[30px] h-[30px] rounded-[7px] bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-200 inline-flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {/* View details */}
                          <button
                            onClick={() => handleOpenView(sponsor)}
                            title="View Details"
                            className="w-[30px] h-[30px] border border-[#e2e2dc] rounded-[7px] bg-white text-[#7D848D] hover:bg-[#f7f7f2] hover:text-[#1f1f1f] hover:border-[#d4d4cd] inline-flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEdit(sponsor)}
                            title="Edit"
                            className="w-[30px] h-[30px] border border-[#e2e2dc] rounded-[7px] bg-white text-[#7D848D] hover:bg-[#f7f7f2] hover:text-[#1f1f1f] hover:border-[#d4d4cd] inline-flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleOpenDelete(sponsor)}
                            title="Delete"
                            className="w-[30px] h-[30px] border border-[#e2e2dc] rounded-[7px] bg-white text-red-500 hover:bg-red-50 hover:border-red-200 inline-flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
        itemLabel="sponsors"
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
                    {renderStatusBadge(selectedSponsor.status)}
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
                    <span className="text-gray-400 font-medium">Created At</span>
                    <span className="font-semibold text-gray-800">
                      {selectedSponsor.created_at
                        ? new Date(selectedSponsor.created_at).toLocaleString()
                        : "—"}
                    </span>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex flex-col gap-1">
                    <span className="text-gray-400 font-medium">Last Updated</span>
                    <span className="font-semibold text-gray-800">
                      {selectedSponsor.updated_at
                        ? new Date(selectedSponsor.updated_at).toLocaleString()
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
              {selectedSponsor.status?.toLowerCase() === "pending" ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenStatusConfirm(selectedSponsor, "approved")}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenStatusConfirm(selectedSponsor, "rejected")}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </div>
              ) : (
                <div />
              )}
              <button
                onClick={() => setViewModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700 transition-all cursor-pointer"
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

      {/* ===================== ADD / EDIT MODAL ===================== */}
      {formModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#f5efdc] text-[#4a6b3f] flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900">
                  {editingSponsor ? "Edit Sponsor" : "Add Sponsor"}
                </h3>
              </div>
              <button
                onClick={() => setFormModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="py-5 space-y-4">
              {/* Sponsor Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Sponsor Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sponsor_name}
                    onChange={(e) =>
                      setFormData({ ...formData, sponsor_name: e.target.value })
                    }
                    placeholder="e.g. Texas Sea Salt"
                    className="w-full h-10 px-3.5 border border-[#e4e4df] bg-white rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#2d4a23]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email_address}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        email_address: e.target.value,
                      })
                    }
                    placeholder="e.g. contact@sponsor.com"
                    className="w-full h-10 px-3.5 border border-[#e4e4df] bg-white rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#2d4a23]"
                  />
                </div>
              </div>

              {/* Company Discount & Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Company Discount
                  </label>
                  <input
                    type="text"
                    value={formData.company_discount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        company_discount: e.target.value,
                      })
                    }
                    placeholder="e.g. 10% or Free Shipping"
                    className="w-full h-10 px-3.5 border border-[#e4e4df] bg-white rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#2d4a23]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Website Link
                  </label>
                  <input
                    type="url"
                    value={formData.link}
                    onChange={(e) =>
                      setFormData({ ...formData, link: e.target.value })
                    }
                    placeholder="https://example.com"
                    className="w-full h-10 px-3.5 border border-[#e4e4df] bg-white rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#2d4a23]"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Details about the sponsor and partnership..."
                  className="w-full p-3 border border-[#e4e4df] bg-white rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#2d4a23]"
                />
              </div>

              {/* Sponsor Logo / Image Upload */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Sponsor Logo / Image
                </label>
                <div className="flex items-center gap-3">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-14 h-14 rounded-lg object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}
                  <label className="h-9 px-3.5 border border-[#e4e4df] bg-white hover:bg-gray-50 rounded-lg text-xs font-medium text-gray-700 flex items-center gap-2 cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5 text-gray-500" />
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setFormModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-[#4a6b3f] hover:bg-[#3c5733] text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {submitting && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  <span>{editingSponsor ? "Save Changes" : "Create Sponsor"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== DELETE CONFIRMATION MODAL ===================== */}
      {deleteConfirmOpen && sponsorToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-gray-100 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">
              Delete Sponsor
            </h3>
            <p className="text-xs text-gray-500 mb-5">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-800">
                {sponsorToDelete.sponsor_name}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SponsorsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-[#2d4a23]" />
        </div>
      }
    >
      <SponsorsContent />
    </Suspense>
  );
}
