"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  MoreVertical,
  Loader2,
  AlertCircle,
  X,
  Building2,
  Calendar,
  Globe,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import Pagination from "@/components/admin/Pagination";
import {
  getLicenseIssuers,
  createLicenseIssuer,
  updateLicenseIssuer,
  deleteLicenseIssuer,
  getStates,
  LicenseIssuerItem,
} from "@/lib/api";

export default function LicenseIssuersPage() {
  const [issuers, setIssuers] = useState<LicenseIssuerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStateId, setFilterStateId] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Add / Edit Modal State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIssuer, setEditingIssuer] = useState<LicenseIssuerItem | null>(
    null,
  );
  const [organisation, setOrganisation] = useState("");
  const [stateId, setStateId] = useState("");
  const [agencyWebsite, setAgencyWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // States List State
  const [statesList, setStatesList] = useState<any[]>([]);

  // Delete Confirmation Modal State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [issuerToDelete, setIssuerToDelete] =
    useState<LicenseIssuerItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load States for Dropdown
  useEffect(() => {
    async function loadStates() {
      try {
        const res = await getStates(1, 100);
        const list = res.data?.states || res.data || res.states || res || [];
        setStatesList(Array.isArray(list) ? list : []);
      } catch (err) {
        console.warn("Could not load states for license issuers:", err);
      }
    }
    loadStates();
  }, []);

  // Helper to resolve state display name
  const getStateName = (issuer: LicenseIssuerItem) => {
    if (issuer.state?.state_name) return issuer.state.state_name;
    if (issuer.state_name) return issuer.state_name;
    if (issuer.state?.name) return issuer.state.name;
    if (issuer.state_id) {
      const found = statesList.find(
        (s) => String(s.state_id || s.id) === String(issuer.state_id),
      );
      if (found) return found.state_name || found.name;
    }
    return "—";
  };

  // Fetch License Issuers
  const fetchIssuersList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getLicenseIssuers(
        page,
        limit,
        searchQuery,
        filterStateId,
      );
      console.log(res);

      if (res && res.data) {
        if (Array.isArray(res.data)) {
          setIssuers(res.data);
          if (res.pagination) {
            setTotalPages(res.pagination.totalPages || 1);
            setTotalItems(
              res.pagination.totalItems ||
                res.pagination.totaldata ||
                res.data.length,
            );
          } else {
            setTotalPages(
              res.totalPages ||
                Math.ceil((res.total || res.data.length) / limit) ||
                1,
            );
            setTotalItems(res.total || res.data.length);
          }
        } else if (Array.isArray(res.data.issuers)) {
          setIssuers(res.data.issuers);
          if (res.data.pagination) {
            setTotalPages(res.data.pagination.totalPages || 1);
            setTotalItems(
              res.data.pagination.totalItems ||
                res.data.pagination.totaldata ||
                res.data.issuers.length,
            );
          }
        }
      } else if (Array.isArray(res)) {
        setIssuers(res);
        setTotalItems(res.length);
        setTotalPages(1);
      } else {
        setIssuers([]);
        setTotalItems(0);
        setTotalPages(1);
      }
    } catch (err: any) {
      console.error("Fetch license issuers error:", err);
      toast.error(err?.message || "Failed to load license issuers");
      setIssuers([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchQuery, filterStateId]);

  // Debounced Search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchIssuersList();
    }, 350);
    return () => clearTimeout(timer);
  }, [fetchIssuersList]);

  // Open Create Dialog
  const handleOpenCreate = () => {
    setEditingIssuer(null);
    setOrganisation("");
    setStateId("");
    setAgencyWebsite("");
    setDialogOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (issuer: LicenseIssuerItem) => {
    setEditingIssuer(issuer);
    setOrganisation(issuer.organisation || "");
    setStateId(issuer.state_id ? String(issuer.state_id) : "");
    setAgencyWebsite(issuer.agency_website || "");
    setDialogOpen(true);
  };

  // Submit Add / Edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organisation.trim()) {
      toast.error("Organisation name is required");
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        organisation: organisation.trim(),
      };
      if (stateId) {
        payload.state_id = stateId;
      }
      if (agencyWebsite.trim()) {
        payload.agency_website = agencyWebsite.trim();
      }

      if (editingIssuer) {
        await updateLicenseIssuer(editingIssuer.id, payload);
        toast.success("License issuer updated successfully");
      } else {
        await createLicenseIssuer(payload);
        toast.success("License issuer created successfully");
      }
      setDialogOpen(false);
      setEditingIssuer(null);
      setOrganisation("");
      setStateId("");
      setAgencyWebsite("");
      fetchIssuersList();
    } catch (err: any) {
      console.error("Save license issuer error:", err);
      toast.error(err?.message || "Failed to save license issuer");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Delete Confirmation
  const handleOpenDelete = (issuer: LicenseIssuerItem) => {
    setIssuerToDelete(issuer);
    setDeleteConfirmOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!issuerToDelete) return;
    setDeleting(true);
    try {
      await deleteLicenseIssuer(issuerToDelete.id);
      toast.success("License issuer deleted successfully");
      setDeleteConfirmOpen(false);
      setIssuerToDelete(null);
      fetchIssuersList();
    } catch (err: any) {
      console.error("Delete license issuer error:", err);
      toast.error(err?.message || "Failed to delete license issuer");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-[14px] p-4 sm:p-5 border border-[#ececec] shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Input */}
          <div className="relative w-full sm:max-w-xs">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search license issuers..."
              className="w-full h-[38px] pl-3.5 pr-9 border border-[#e4e4df] bg-white rounded-[6px] text-[#444] text-[13px] placeholder-gray-400 focus:outline-none focus:border-[#2d4a23]"
            />
            <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* State Filter Dropdown */}
          <select
            value={filterStateId}
            onChange={(e) => {
              setFilterStateId(e.target.value);
              setPage(1);
            }}
            className="h-[38px] w-44 px-3.5 pr-9 border border-[#e4e4df] bg-white rounded-[6px] text-[#444] text-[13px] focus:outline-none focus:border-[#2d4a23] cursor-pointer"
          >
            <option value="">All States</option>
            {statesList.map((s, idx) => {
              const sName =
                typeof s === "string"
                  ? s
                  : s?.state_name || s?.name || `State ${idx + 1}`;
              const sId =
                typeof s === "string" ? s : s?.state_id || s?.id || sName;
              return (
                <option key={sId} value={sId}>
                  {sName}
                </option>
              );
            })}
          </select>
        </div>

        {/* Add New Issuer Button */}
        <button
          onClick={handleOpenCreate}
          className="h-[38px] px-4 rounded-[6px] bg-[#4a6b3f] hover:bg-[#3c5733] text-white text-[13px] font-medium transition-colors flex items-center gap-2 cursor-pointer shadow-xs whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Add License Issuer</span>
        </button>
      </section>

      <section className="bg-white rounded-[14px] p-5 pb-3 border border-[#ececec] shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)]">
        <h3 className="text-[17px] font-bold text-[#1f1f1f] mb-3">
          License Issuers
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[#ececec]">
                <th className="py-3.5 px-3 font-semibold text-[#111111] text-[13px] w-14">
                  ID
                </th>
                <th className="py-3.5 px-3 font-semibold text-[#111111] text-[13px]">
                  Organisation Name
                </th>
                <th className="py-3.5 px-3 font-semibold text-[#111111] text-[13px]">
                  State
                </th>
                <th className="py-3.5 px-3 font-semibold text-[#111111] text-[13px]">
                  Agency Website
                </th>
                <th className="py-3.5 px-3 text-right font-semibold text-[#111111] text-[13px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f1ed] text-[13px]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-[#7D848D]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-[#2d4a23]" />
                      <span className="text-[13px] font-medium text-[#7D848D]">
                        Loading license issuers...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : issuers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-[#7D848D]">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <AlertCircle className="w-8 h-8 text-gray-300" />
                      <p className="text-[13px] font-semibold text-gray-700">
                        No license issuers found.
                      </p>
                      <p className="text-xs text-gray-400">
                        Click &quot;Add License Issuer&quot; to create one.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                issuers.map((issuer, idx) => {
                  const itemIndex = (page - 1) * limit + idx + 1;
                  const createdDate = issuer.created_at
                    ? new Date(issuer.created_at).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })
                    : "—";
                  const updatedDate = issuer.updated_at
                    ? new Date(issuer.updated_at).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })
                    : "—";

                  return (
                    <tr
                      key={issuer.id || idx}
                      className="hover:bg-[#fbfbf8] transition-colors"
                    >
                      {/* Index */}
                      <td className="py-3.5 px-3 text-[#7D848D] align-middle font-mono text-xs">
                        {itemIndex}
                      </td>

                      {/* Organisation Name */}
                      <td className="py-3.5 px-3 align-middle">
                        <div className="flex items-center gap-2.5">
                          <div className="w-[30px] h-[30px] rounded-[7px] bg-[#f5efdc] text-[#4a6b3f] flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <span className="font-semibold text-[#1f1f1f] text-[13.5px]">
                            {issuer.organisation}
                          </span>
                        </div>
                      </td>

                      {/* State */}
                      <td className="py-3.5 px-3 align-middle text-[#4a4a4a] text-[13px]">
                        <div className="inline-flex items-center gap-1.5 text-xs text-[#555] bg-[#f4f4ee] px-2.5 py-1 rounded-[6px]">
                          <MapPin className="w-3.5 h-3.5 text-[#2d4a23]" />
                          <span>{getStateName(issuer)}</span>
                        </div>
                      </td>

                      {/* Agency Website Link */}
                      <td className="py-3.5 px-3 align-middle">
                        {issuer.agency_website ? (
                          <a
                            href={
                              issuer.agency_website.startsWith("http://") ||
                              issuer.agency_website.startsWith("https://")
                                ? issuer.agency_website
                                : `https://${issuer.agency_website}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-[12.5px] text-[#2d4a23] hover:text-[#1b3015] hover:underline font-medium"
                          >
                            <Globe className="w-3.5 h-3.5 text-[#2d4a23] shrink-0" />
                            <span className="max-w-[220px] truncate">
                              {issuer.agency_website.replace(
                                /^https?:\/\//i,
                                "",
                              )}
                            </span>
                            <ExternalLink className="w-3 h-3 opacity-70 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-[#999] text-xs">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3 text-right align-middle whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEdit(issuer)}
                            title="Edit"
                            className="w-[30px] h-[30px] border border-[#e2e2dc] rounded-[7px] bg-white text-[#7D848D] hover:bg-[#f7f7f2] hover:text-[#1f1f1f] hover:border-[#d4d4cd] inline-flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleOpenDelete(issuer)}
                            title="Delete"
                            className="w-[30px] h-[30px] border border-[#e2e2dc] rounded-[7px] bg-white text-red-500 hover:bg-red-50 hover:border-red-200 inline-flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {/* More */}
                          <button
                            onClick={() => handleOpenEdit(issuer)}
                            title="More"
                            className="w-[30px] h-[30px] border border-[#e2e2dc] rounded-[7px] bg-white text-[#7D848D] hover:bg-[#f7f7f2] hover:text-[#1f1f1f] hover:border-[#d4d4cd] inline-flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <MoreVertical className="w-4 h-4" />
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

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems || issuers.length}
        pageSize={limit}
        itemCountOnPage={issuers.length}
        itemLabel="issuers"
        onPageChange={(newPage) => setPage(newPage)}
        loading={loading}
      />

      {/* ===================== ADD / EDIT MODAL ===================== */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#f5efdc] text-[#4a6b3f] flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900">
                  {editingIssuer ? "Edit License Issuer" : "Add License Issuer"}
                </h3>
              </div>
              <button
                onClick={() => setDialogOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Organisation Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={organisation}
                  onChange={(e) => setOrganisation(e.target.value)}
                  placeholder="e.g. Texas Parks & Wildlife Department"
                  className="w-full h-10 px-3.5 border border-[#e4e4df] bg-white rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#2d4a23]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  State
                </label>
                <select
                  value={stateId}
                  onChange={(e) => setStateId(e.target.value)}
                  className="w-full h-10 px-3.5 pr-9 border border-[#e4e4df] bg-white rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#2d4a23] cursor-pointer"
                >
                  <option value="">Select State (Optional)</option>
                  {statesList.map((s, idx) => {
                    const sName =
                      typeof s === "string"
                        ? s
                        : s?.state_name || s?.name || `State ${idx + 1}`;
                    const sId =
                      typeof s === "string" ? s : s?.state_id || s?.id || sName;
                    return (
                      <option key={sId} value={sId}>
                        {sName}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Agency Website Link
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={agencyWebsite}
                    onChange={(e) => setAgencyWebsite(e.target.value)}
                    placeholder="https://tpwd.texas.gov/..."
                    className="w-full h-10 pl-9 pr-3.5 border border-[#e4e4df] bg-white rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#2d4a23]"
                  />
                  <Globe className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setDialogOpen(false)}
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
                  <span>
                    {editingIssuer ? "Save Changes" : "Create Issuer"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== DELETE CONFIRMATION MODAL ===================== */}
      {deleteConfirmOpen && issuerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-gray-100 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">
              Delete License Issuer
            </h3>
            <p className="text-xs text-gray-500 mb-5">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-800">
                {issuerToDelete.organisation}
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
