"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  MoreVertical,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
  MapPin,
  Image as ImageIcon,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import {
  getStates,
  getStateById,
  createState,
  updateState,
  deleteState,
  StateItem,
  API_URL,
} from "@/lib/api";

export default function StatesPage() {
  const [states, setStates] = useState<StateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // View Details Modal State
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedState, setSelectedState] = useState<StateItem | null>(null);

  // Add / Edit Modal State
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingState, setEditingState] = useState<StateItem | null>(null);
  const [formData, setFormData] = useState({
    state_name: "",
    state_code: "",
    state_description: "",
  });
  const [flagFile, setFlagFile] = useState<File | null>(null);
  const [flagPreview, setFlagPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirmation State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [stateToDelete, setStateToDelete] = useState<StateItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Helper to resolve flag image url with backend base url
  const getFlagUrl = (url?: string | null) => {
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

  // Fetch States List
  const fetchStatesList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getStates(page, limit);
      let list: StateItem[] = [];

      if (res && res.data) {
        if (Array.isArray(res.data)) {
          list = res.data;
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
        } else if (Array.isArray(res.data.states)) {
          list = res.data.states;
          if (res.data.pagination) {
            setTotalPages(res.data.pagination.totalPages || 1);
            setTotalItems(
              res.data.pagination.totalItems ||
                res.data.pagination.totaldata ||
                res.data.states.length,
            );
          }
        }
      } else if (Array.isArray(res)) {
        list = res;
        setTotalItems(res.length);
        setTotalPages(1);
      } else if (res && res.states && Array.isArray(res.states)) {
        list = res.states;
        setTotalItems(res.states.length);
        setTotalPages(1);
      }

      // Local search filtering if backend does not search states
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        list = list.filter(
          (s) =>
            s.state_name?.toLowerCase().includes(q) ||
            s.state_code?.toLowerCase().includes(q) ||
            s.state_description?.toLowerCase().includes(q),
        );
      }

      setStates(list);
    } catch (err: any) {
      console.error("Fetch states error:", err);
      toast.error(err?.message || "Failed to load states");
      setStates([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStatesList();
    }, 350);
    return () => clearTimeout(timer);
  }, [fetchStatesList]);

  // Open Create State
  const handleOpenCreate = () => {
    setEditingState(null);
    setFormData({
      state_name: "",
      state_code: "",
      state_description: "",
    });
    setFlagFile(null);
    setFlagPreview(null);
    setFormModalOpen(true);
  };

  // Open Edit State
  const handleOpenEdit = (state: StateItem) => {
    setEditingState(state);
    setFormData({
      state_name: state.state_name || "",
      state_code: state.state_code || "",
      state_description: state.state_description || "",
    });
    setFlagFile(null);
    setFlagPreview(state.state_flag_image ? getFlagUrl(state.state_flag_image) : null);
    setFormModalOpen(true);
  };

  // Open View Details
  const handleOpenView = (state: StateItem) => {
    setSelectedState(state);
    setViewModalOpen(true);
  };

  // Handle File Change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFlagFile(file);
      setFlagPreview(URL.createObjectURL(file));
    }
  };

  // Submit Add / Edit State
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.state_name.trim()) {
      toast.error("State name is required");
      return;
    }
    if (!formData.state_code.trim()) {
      toast.error("State code is required");
      return;
    }

    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append("state_name", formData.state_name.trim());
      payload.append("state_code", formData.state_code.trim().toUpperCase());
      if (formData.state_description) {
        payload.append("state_description", formData.state_description.trim());
      }
      if (flagFile) {
        payload.append("file", flagFile);
      }

      if (editingState) {
        await updateState(editingState.state_id, payload);
        toast.success("State updated successfully");
      } else {
        await createState(payload);
        toast.success("State created successfully");
      }

      setFormModalOpen(false);
      setEditingState(null);
      fetchStatesList();
    } catch (err: any) {
      console.error("Save state error:", err);
      toast.error(err?.message || "Failed to save state");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Delete Confirmation
  const handleOpenDelete = (state: StateItem) => {
    setStateToDelete(state);
    setDeleteConfirmOpen(true);
  };

  // Confirm Delete State
  const handleConfirmDelete = async () => {
    if (!stateToDelete) return;
    setDeleting(true);
    try {
      await deleteState(stateToDelete.state_id);
      toast.success("State deleted successfully");
      setDeleteConfirmOpen(false);
      setStateToDelete(null);
      fetchStatesList();
    } catch (err: any) {
      console.error("Delete state error:", err);
      toast.error(err?.message || "Failed to delete state");
    } finally {
      setDeleting(false);
    }
  };

  // Numbered pagination items matching HTML `< 1 2 ... 15 >`
  const paginationItems = useMemo(() => {
    const pages: (number | string)[] = [];
    const max = totalPages || 1;

    if (max <= 5) {
      for (let i = 1; i <= max; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("…");
      const start = Math.max(2, page - 1);
      const end = Math.min(max - 1, page + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (page < max - 2) pages.push("…");
      pages.push(max);
    }
    return pages;
  }, [page, totalPages]);

  return (
    <div className="space-y-6">
      {/* ===================== FILTER & ACTION ROW ===================== */}
      <section className="bg-white rounded-[14px] p-4 sm:p-5 border border-[#ececec] shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)] flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:max-w-xs">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search states..."
            className="w-full h-[38px] pl-3.5 pr-9 border border-[#e4e4df] bg-white rounded-[6px] text-[#444] text-[13px] placeholder-gray-400 focus:outline-none focus:border-[#2d4a23]"
          />
          <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Add State Button */}
        <button
          onClick={handleOpenCreate}
          className="h-[38px] px-4 rounded-[6px] bg-[#4a6b3f] hover:bg-[#3c5733] text-white text-[13px] font-medium transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add State</span>
        </button>
      </section>

      {/* ===================== TABLE CARD ===================== */}
      <section className="bg-white rounded-[14px] p-5 pb-3 border border-[#ececec] shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)]">
        <h3 className="text-[17px] font-bold text-[#1f1f1f] mb-3">
          States Management
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[#ececec]">
                <th className="py-3.5 px-3 font-semibold text-[#111111] text-[13px] w-14">
                  #
                </th>
                <th className="py-3.5 px-3 font-semibold text-[#111111] text-[13px]">
                  State Name
                </th>
                <th className="py-3.5 px-3 font-semibold text-[#111111] text-[13px]">
                  Code
                </th>
                <th className="py-3.5 px-3 font-semibold text-[#111111] text-[13px]">
                  Description
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
                        Loading states...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : states.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-[#7D848D]">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <AlertCircle className="w-8 h-8 text-gray-300" />
                      <p className="text-[13px] font-semibold text-gray-700">
                        No states found.
                      </p>
                      <p className="text-xs text-gray-400">
                        Click &quot;Add State&quot; to create a new state entry.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                states.map((state, idx) => {
                  const itemIndex = (page - 1) * limit + idx + 1;
                  return (
                    <tr
                      key={state.state_id || idx}
                      className="hover:bg-[#fbfbf8] transition-colors"
                    >
                      {/* Index */}
                      <td className="py-3.5 px-3 text-[#7D848D] align-middle font-mono text-xs">
                        {itemIndex}
                      </td>

                      {/* State Name + Flag */}
                      <td className="py-3.5 px-3 align-middle">
                        <div className="flex items-center gap-2.5">
                          {state.state_flag_image ? (
                            <img
                              src={getFlagUrl(state.state_flag_image)}
                              alt=""
                              className="w-7 h-5 rounded-[3px] object-cover border border-gray-200"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-[6px] bg-[#f5efdc] text-[#4a6b3f] flex items-center justify-center text-xs font-bold flex-shrink-0">
                              <MapPin className="w-3.5 h-3.5" />
                            </div>
                          )}
                          <span className="font-semibold text-[#1f1f1f] text-[13.5px]">
                            {state.state_name}
                          </span>
                        </div>
                      </td>

                      {/* State Code */}
                      <td className="py-3.5 px-3 align-middle whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-[6px] bg-[#f5efdc] text-[#1f1f1f] border border-[#e6dfc6] font-mono font-bold text-xs">
                          {state.state_code}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-3 text-[#7D848D] align-middle max-w-xs truncate">
                        {state.state_description || (
                          <span className="italic text-gray-300">
                            No description
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3 text-right align-middle whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          {/* View */}
                          <button
                            onClick={() => handleOpenView(state)}
                            title="View Details"
                            className="w-[30px] h-[30px] border border-[#e2e2dc] rounded-[7px] bg-white text-[#7D848D] hover:bg-[#f7f7f2] hover:text-[#1f1f1f] hover:border-[#d4d4cd] inline-flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          {/* <button
                            onClick={() => handleOpenEdit(state)}
                            title="Edit"
                            className="w-[30px] h-[30px] border border-[#e2e2dc] rounded-[7px] bg-white text-[#7D848D] hover:bg-[#f7f7f2] hover:text-[#1f1f1f] hover:border-[#d4d4cd] inline-flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button> */}

                          {/* Delete */}
                          <button
                            onClick={() => handleOpenDelete(state)}
                            title="Delete"
                            className="w-[30px] h-[30px] border border-[#e2e2dc] rounded-[7px] bg-white text-red-500 hover:bg-red-50 hover:border-red-200 inline-flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {/* More */}
                          <button
                            onClick={() => handleOpenEdit(state)}
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

      {/* ===================== TABLE FOOTER & PAGINATION ===================== */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-[12.5px] text-[#888]">
        <div>
          Showing 1 to {states.length} of {totalItems || states.length} states
        </div>

        <div className="flex items-center gap-1">
          {/* Previous */}
          <button
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="min-w-[28px] h-7 px-2 border border-[#e4e4df] bg-white rounded-[6px] text-[#4a4a4a] text-[12.5px] hover:bg-[#f7f7f4] disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {/* Numbered Page Buttons */}
          {paginationItems.map((item, idx) => {
            if (item === "…") {
              return (
                <span
                  key={idx}
                  className="min-w-[28px] h-7 flex items-center justify-center text-[#888]"
                >
                  …
                </span>
              );
            }
            const isCurr = item === page;
            return (
              <button
                key={idx}
                onClick={() => setPage(Number(item))}
                className={`min-w-[28px] h-7 px-2 border rounded-[6px] text-[12.5px] transition-all flex items-center justify-center cursor-pointer ${
                  isCurr
                    ? "bg-[#f5efdc] text-[#1f1f1f] border-[#e6dfc6] font-semibold"
                    : "bg-white text-[#4a4a4a] border-[#e4e4df] hover:bg-[#f7f7f4]"
                }`}
              >
                {item}
              </button>
            );
          })}

          {/* Next */}
          <button
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
            className="min-w-[28px] h-7 px-2 border border-[#e4e4df] bg-white rounded-[6px] text-[#4a4a4a] text-[12.5px] hover:bg-[#f7f7f4] disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ===================== VIEW DETAILS MODAL ===================== */}
      {viewModalOpen && selectedState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                {selectedState.state_flag_image ? (
                  <img
                    src={getFlagUrl(selectedState.state_flag_image)}
                    alt=""
                    className="w-10 h-7 rounded-[4px] object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-[#f5efdc] text-[#4a6b3f] flex items-center justify-center">
                    <MapPin className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {selectedState.state_name}
                  </h3>
                  <span className="text-xs font-mono font-bold text-[#4a6b3f]">
                    Code: {selectedState.state_code}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setViewModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-5 space-y-4 text-xs">
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Description
                </span>
                <p className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-gray-700 leading-relaxed">
                  {selectedState.state_description ||
                    "No description provided for this state."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50/70 rounded-xl border border-gray-100">
                <div>
                  <span className="text-[11px] text-gray-400 block">
                    Created At
                  </span>
                  <span className="font-semibold text-gray-800">
                    {selectedState.created_at
                      ? new Date(selectedState.created_at).toLocaleDateString()
                      : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-gray-400 block">
                    Updated At
                  </span>
                  <span className="font-semibold text-gray-800">
                    {selectedState.updated_at
                      ? new Date(selectedState.updated_at).toLocaleDateString()
                      : "—"}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
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

      {/* ===================== ADD / EDIT MODAL ===================== */}
      {formModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#f5efdc] text-[#4a6b3f] flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900">
                  {editingState ? "Edit State" : "Add State"}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    State Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.state_name}
                    onChange={(e) =>
                      setFormData({ ...formData, state_name: e.target.value })
                    }
                    placeholder="e.g. Texas"
                    className="w-full h-10 px-3.5 border border-[#e4e4df] bg-white rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#2d4a23]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    State Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    value={formData.state_code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        state_code: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="e.g. TX"
                    className="w-full h-10 px-3.5 border border-[#e4e4df] bg-white rounded-lg text-sm font-mono uppercase text-[#333] focus:outline-none focus:border-[#2d4a23]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  State Description
                </label>
                <textarea
                  rows={3}
                  value={formData.state_description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      state_description: e.target.value,
                    })
                  }
                  placeholder="General information and regulations summary..."
                  className="w-full p-3 border border-[#e4e4df] bg-white rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#2d4a23]"
                />
              </div>

              {/* State Flag Image Upload */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  State Flag Image
                </label>
                <div className="flex items-center gap-3">
                  {flagPreview ? (
                    <img
                      src={flagPreview}
                      alt="Flag Preview"
                      className="w-14 h-10 rounded-[6px] object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-14 h-10 rounded-[6px] bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                  )}
                  <label className="h-9 px-3.5 border border-[#e4e4df] bg-white hover:bg-gray-50 rounded-lg text-xs font-medium text-gray-700 flex items-center gap-2 cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5 text-gray-500" />
                    <span>Upload Flag</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

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
                  <span>{editingState ? "Save Changes" : "Create State"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== DELETE CONFIRMATION MODAL ===================== */}
      {deleteConfirmOpen && stateToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-gray-100 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">
              Delete State
            </h3>
            <p className="text-xs text-gray-500 mb-5">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-800">
                {stateToDelete.state_name}
              </span>{" "}
              ({stateToDelete.state_code})? This action cannot be undone.
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
