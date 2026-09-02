"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  MoreVertical,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
  BookOpen,
  Download,
  Globe,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import {
  getAdminResources,
  getAdminResourceById,
  createResource,
  updateResource,
  deleteResource,
  getStates,
  getLicenseTypes,
  ResourceItem,
  API_URL,
} from "@/lib/api";

const CATEGORIES = [
  "DNR Website",
  "DOWNLOAD GUIDES - MAPS-PDF",
  "Hunting Regulations - PDF",
  "License Regulations - PDF",
  "Safety & Ethics - PDF",
  "Season Dates",
  "General",
];

const RESOURCE_TYPES = [
  { label: "Guide", value: "guide" },
  { label: "Regulation", value: "regulation" },
  { label: "DNR", value: "dnr" },
];

export default function ResourcesPage() {
  // Resources List State
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Search & State Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStateId, setSelectedStateId] = useState("");
  const [statesList, setStatesList] = useState<any[]>([]);
  const [activityTypes, setActivityTypes] = useState<string[]>([]);

  // View Details Modal
  const [viewModal, setViewModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState<ResourceItem | null>(
    null,
  );
  const [viewLoading, setViewLoading] = useState(false);

  // Add / Edit Modal State
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formSaving, setFormSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    resource_type: "guide",
    resource_url: "",
    category: "General",
    content: "",
    state_id: "",
    is_published: true,
    activity: "",
    species: "",
    season_name: "",
    season_start: "",
    season_end: "",
    rules: "",
  });
  const [categoryIconFile, setCategoryIconFile] = useState<File | null>(null);
  const [categoryIconPreview, setCategoryIconPreview] = useState<string | null>(
    null,
  );
  const [resourceFile, setResourceFile] = useState<File | null>(null);

  // Delete State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<ResourceItem | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  // Load States from API
  useEffect(() => {
    async function loadMeta() {
      try {
        const [statesRes, typesRes] = await Promise.allSettled([
          getStates(1, 100),
          getLicenseTypes(),
        ]);

        if (statesRes.status === "fulfilled" && statesRes.value) {
          const list = Array.isArray(statesRes.value)
            ? statesRes.value
            : statesRes.value?.data?.states ||
              statesRes.value?.data ||
              statesRes.value?.states ||
              [];
          setStatesList(Array.isArray(list) ? list : []);
        }

        if (typesRes.status === "fulfilled" && typesRes.value) {
          const list = Array.isArray(typesRes.value)
            ? typesRes.value
            : typesRes.value?.data || [];
          setActivityTypes(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        console.warn("Failed to load states for resources:", err);
      }
    }
    loadMeta();
  }, []);

  // Fetch Resources List
  const fetchResourcesList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminResources(
        page,
        limit,
        searchQuery,
        selectedStateId,
      );

      if (res && res.data) {
        setResources(res.data.resources || []);
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.totalPages || 1);
          setTotalItems(res.data.pagination.totaldata || 0);
        }
      } else {
        setResources([]);
        setTotalItems(0);
      }
    } catch (err: any) {
      console.error("Fetch resources error:", err);
      toast.error(err?.message || "Failed to load resources");
      setResources([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchQuery, selectedStateId]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchResourcesList();
    }, 350);
    return () => clearTimeout(timer);
  }, [fetchResourcesList]);

  // View Details Handler
  const handleViewResource = async (resItem: ResourceItem) => {
    setSelectedResource(resItem);
    setViewModal(true);
    setViewLoading(true);

    try {
      const res = await getAdminResourceById(resItem.id);
      const data = res.data || res;
      setSelectedResource(data);
    } catch (err: any) {
      console.warn("Error fetching resource details:", err);
    } finally {
      setViewLoading(false);
    }
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      title: "",
      resource_type: "guide",
      resource_url: "",
      category: "General",
      content: "",
      state_id:
        selectedStateId && selectedStateId !== "all" ? selectedStateId : "",
      is_published: true,
      activity: "",
      species: "",
      season_name: "",
      season_start: "",
      season_end: "",
      rules: "",
    });
    setCategoryIconFile(null);
    setCategoryIconPreview(null);
    setResourceFile(null);
    setFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = async (resItem: ResourceItem) => {
    setIsEditing(true);
    setEditingId(resItem.id);

    try {
      const res = await getAdminResourceById(resItem.id);
      const resource = res.data || res;

      let iconPrev = null;
      if (resource.category_icon) {
        iconPrev = resource.category_icon.startsWith("http")
          ? resource.category_icon
          : `${API_URL}${resource.category_icon}`;
      }

      setFormData({
        title: resource.title || "",
        resource_type: resource.resource_type || "guide",
        resource_url: resource.resource_url || "",
        category: resource.category || "General",
        content: resource.content || "",
        state_id: String(resource.state_id || resource.state?.state_id || ""),
        is_published:
          resource.is_published === "1" ||
          resource.is_published === true ||
          resource.is_published === 1,
        activity: resource.seasonalData?.activity || "",
        species: resource.seasonalData?.species || "",
        season_name: resource.seasonalData?.season_name || "",
        season_start: resource.seasonalData?.season_start || "",
        season_end: resource.seasonalData?.season_end || "",
        rules: resource.seasonalData?.rules || "",
      });

      setCategoryIconPreview(iconPrev);
      setCategoryIconFile(null);
      setResourceFile(null);
      setFormModalOpen(true);
    } catch (err: any) {
      console.error("Failed to load resource details:", err);
      toast.error("Failed to load resource details for editing");
    }
  };

  // Save Form Handler
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Resource title is required");
      return;
    }

    setFormSaving(true);
    try {
      const payload = new FormData();
      payload.append("title", formData.title.trim());
      payload.append("resource_type", formData.resource_type);
      if (formData.resource_url.trim()) {
        payload.append("resource_url", formData.resource_url.trim());
      }
      payload.append("category", formData.category);
      payload.append("content", formData.content || "");
      payload.append("is_published", String(formData.is_published));

      if (formData.state_id) {
        payload.append("state_id", formData.state_id);
      }

      if (categoryIconFile) {
        payload.append("category_icon", categoryIconFile);
      }

      if (resourceFile) {
        payload.append("resource_file", resourceFile);
      }

      if (formData.category === "Season Dates") {
        payload.append("activity", formData.activity);
        payload.append("species", formData.species);
        payload.append("season_name", formData.season_name);
        payload.append("season_start", formData.season_start);
        payload.append("season_end", formData.season_end);
        payload.append("rules", formData.rules);
      }

      if (isEditing && editingId) {
        await updateResource(editingId, payload);
        toast.success("Resource updated successfully");
      } else {
        await createResource(payload);
        toast.success("Resource created successfully");
      }

      setFormModalOpen(false);
      fetchResourcesList();
    } catch (err: any) {
      console.error("Save resource error:", err);
      toast.error(err?.message || "Failed to save resource");
    } finally {
      setFormSaving(false);
    }
  };

  // Delete Resource
  const handleDeletePrompt = (resItem: ResourceItem) => {
    setResourceToDelete(resItem);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!resourceToDelete) return;
    setDeleting(true);

    try {
      await deleteResource(resourceToDelete.id);
      toast.success(
        `Resource "${resourceToDelete.title}" deleted successfully`,
      );
      setDeleteConfirmOpen(false);
      setResourceToDelete(null);
      fetchResourcesList();
    } catch (err: any) {
      console.error("Delete resource error:", err);
      toast.error(err?.message || "Failed to delete resource");
    } finally {
      setDeleting(false);
    }
  };

  // Generate pagination items matching HTML
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
      <section className="bg-white rounded-2xl p-4 border border-[#ececec] shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Input */}
          <div className="relative w-full sm:max-w-xs">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resources..."
              className="w-full h-10 pl-3.5 pr-9 rounded-xl border border-[#e4e4df] bg-white text-[13px] text-[#2c2c2c] placeholder-gray-400 focus:outline-none focus:border-[#2d4a23]"
            />
            <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* State Filter */}
          <div className="w-full sm:w-48">
            <select
              value={selectedStateId}
              onChange={(e) => {
                setSelectedStateId(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 px-3 rounded-xl border border-[#e4e4df] bg-white text-[13px] text-[#4a4a4a] focus:outline-none focus:border-[#2d4a23] cursor-pointer"
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
        </div>

        {/* Add Resource Button */}
        {/* <button
          onClick={handleOpenAdd}
          className="h-10 px-4 rounded-xl bg-[#0E3E27] hover:bg-[#092c1b] text-white text-[13px] font-semibold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Resource</span>
        </button> */}
      </section>

      {/* ===================== RESOURCES TABLE CARD (1:1 HTML) ===================== */}
      <section className="bg-white rounded-[14px] border border-[#ececec] shadow-[0_4px_16px_rgba(60,60,60,0.06)] p-5 pb-3">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[#ececec]">
                <th className="py-3 px-3 font-semibold text-[#111111] text-[13px]">
                  Resource Title
                </th>
                <th className="py-3 px-3 font-semibold text-[#111111] text-[13px]">
                  State
                </th>
                <th className="py-3 px-3 font-semibold text-[#111111] text-[13px]">
                  Category
                </th>
                <th className="py-3 px-3 font-semibold text-[#111111] text-[13px]">
                  Type
                </th>
                <th className="py-3 px-3 font-semibold text-[#111111] text-[13px]">
                  Last Updated
                </th>
                <th className="py-3 px-3 font-semibold text-[#111111] text-[13px]">
                  Visibility
                </th>
                <th className="py-3 px-3 text-right font-semibold text-[#111111] text-[13px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f1ed] text-[13px]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-[#7D848D]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-[#0E3E27]" />
                      <span className="text-[13px] font-medium text-[#7D848D]">
                        Loading resources...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : resources.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-[#7D848D]">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <AlertCircle className="w-8 h-8 text-gray-300" />
                      <p className="text-[13px] font-semibold text-gray-700">
                        No resources found
                      </p>
                      <p className="text-xs text-[#7D848D]">
                        Try adjusting your search or state filter
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                resources.map((item) => {
                  const stateDisplay =
                    item.state_name ||
                    (typeof item.state === "object"
                      ? item.state?.state_name
                      : item.state) ||
                    "All States";
                  const isPublished =
                    item.is_published === true ||
                    item.is_published === "1" ||
                    item.is_published === 1;
                  const updatedDate =
                    item.updated_at || item.created_at
                      ? new Date(
                          item.updated_at || item.created_at!,
                        ).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })
                      : "—";

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-[#fbfbf8] transition-colors"
                    >
                      {/* Resource Title (Bold title + Subtitle text) */}
                      <td className="py-3.5 px-3 align-middle">
                        <div className="font-semibold text-[#1f1f1f] text-[13.5px] max-w-sm truncate">
                          {item.title}
                        </div>
                        <div className="text-[11.5px] text-[#9a9a96] mt-0.5 max-w-sm truncate">
                          {item.description ||
                            item.resource_url ||
                            "Official deer seasons dates, bag limits and rules."}
                        </div>
                      </td>

                      {/* State (Plain Text matching HTML) */}
                      <td className="py-3.5 px-3 text-[#7D848D] align-middle whitespace-nowrap">
                        {stateDisplay}
                      </td>

                      {/* Category (Plain Text) */}
                      <td className="py-3.5 px-3 text-[#7D848D] align-middle whitespace-nowrap">
                        {item.category || "Deer Hunting"}
                      </td>

                      {/* Type (Plain Text uppercase) */}
                      <td className="py-3.5 px-3 text-[#7D848D] align-middle whitespace-nowrap">
                        {item.resource_type
                          ? item.resource_type.toUpperCase()
                          : "PDF"}
                      </td>

                      {/* Last Updated (DD/MM/YYYY) */}
                      <td className="py-3.5 px-3 text-[#7D848D] align-middle whitespace-nowrap">
                        {updatedDate}
                      </td>

                      {/* Visibility (HTML Badge) */}
                      <td className="py-3.5 px-3 align-middle whitespace-nowrap">
                        <span
                          className={`inline-block px-3.5 py-1 rounded-[6px] text-[11.5px] font-medium border ${
                            isPublished
                              ? "bg-[#e8f5ec] text-[#34A853] border-[#b8e0c2]"
                              : "bg-[#fff1e3] text-[#C45508] border-[#f4ceaa]"
                          }`}
                        >
                          {isPublished ? "Published" : "Need Updated"}
                        </span>
                      </td>

                      {/* Actions (HTML square row-actions) */}
                      <td className="py-3.5 px-3 text-right align-middle whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          {/* View */}
                          <button
                            onClick={() => handleViewResource(item)}
                            title="View"
                            className="w-[30px] h-[30px] border border-[#e2e2dc] rounded-[7px] bg-white text-[#7D848D] hover:bg-[#f7f7f2] hover:text-[#1f1f1f] hover:border-[#d4d4cd] inline-flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          {/* <button
                            onClick={() => handleOpenEdit(item)}
                            title="Edit"
                            className="w-[30px] h-[30px] border border-[#e2e2dc] rounded-[7px] bg-white text-[#7D848D] hover:bg-[#f7f7f2] hover:text-[#1f1f1f] hover:border-[#d4d4cd] inline-flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button> */}

                          {/* Delete */}
                          <button
                            onClick={() => handleDeletePrompt(item)}
                            title="Delete"
                            className="w-[30px] h-[30px] border border-[#e2e2dc] rounded-[7px] bg-white text-[#7D848D] hover:bg-[#f7f7f2] hover:text-red-600 hover:border-red-200 inline-flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          {/* More */}
                          <button
                            onClick={() => handleViewResource(item)}
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

        {/* ===================== TABLE FOOTER & PAGINATION (1:1 HTML) ===================== */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 pb-1 text-[12.5px] text-[#888] border-t border-[#f1f1ed] mt-2">
          <div>
            Showing 1 to {resources.length} of {totalItems || resources.length}{" "}
            resources
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

            {/* Pages list */}
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
      </section>

      {/* ===================== ADD / EDIT RESOURCE MODAL ===================== */}
      {formModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {isEditing ? "Edit Resource" : "Add New Resource"}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Configure title, category, destination link, and files
                </p>
              </div>
              <button
                onClick={() => setFormModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="py-4 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Resource Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g., Minnesota Deer Hunting Regulations Guide 2026"
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:border-[#0E3E27]"
                />
              </div>

              {/* Type, State, Category in 3 cols */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Type *
                  </label>
                  <select
                    value={formData.resource_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        resource_type: e.target.value,
                      })
                    }
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:border-[#0E3E27] capitalize cursor-pointer"
                  >
                    {RESOURCE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    State
                  </label>
                  <select
                    value={formData.state_id}
                    onChange={(e) =>
                      setFormData({ ...formData, state_id: e.target.value })
                    }
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:border-[#0E3E27] cursor-pointer"
                  >
                    <option value="">National / All States</option>
                    {statesList.map((s, idx) => {
                      const sName =
                        typeof s === "string"
                          ? s
                          : s?.state_name || s?.name || `State ${idx + 1}`;
                      const sId =
                        typeof s === "string"
                          ? s
                          : s?.state_id || s?.id || sName;
                      return (
                        <option key={sId} value={sId}>
                          {sName}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:border-[#0E3E27] cursor-pointer"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Resource URL */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Resource Web Link / DNR URL (optional)
                </label>
                <input
                  type="url"
                  value={formData.resource_url}
                  onChange={(e) =>
                    setFormData({ ...formData, resource_url: e.target.value })
                  }
                  placeholder="https://www.dnr.state.gov/regulations/..."
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:border-[#0E3E27]"
                />
              </div>

              {/* Content / Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Description / Content
                </label>
                <textarea
                  rows={3}
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder="Summary of this resource or regulation guidelines..."
                  className="w-full p-3 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:border-[#0E3E27]"
                />
              </div>

              {/* Category Icon & Resource File Uploads */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Category Icon
                  </label>
                  <div className="flex items-center gap-2.5">
                    {categoryIconPreview && (
                      <div className="w-9 h-9 rounded-lg border border-gray-200 overflow-hidden p-1 flex-shrink-0 bg-gray-50">
                        <img
                          src={categoryIconPreview}
                          alt="Preview"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setCategoryIconFile(file);
                        if (file)
                          setCategoryIconPreview(URL.createObjectURL(file));
                      }}
                      className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Resource File / PDF Attachment
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setResourceFile(file);
                    }}
                    className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer w-full"
                  />
                </div>
              </div>

              {/* Conditional Season Dates Fields */}
              {formData.category === "Season Dates" && (
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-3 text-xs">
                  <span className="font-bold text-amber-900 block">
                    Season Dates Configuration
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Activity
                      </label>
                      <input
                        type="text"
                        value={formData.activity}
                        onChange={(e) =>
                          setFormData({ ...formData, activity: e.target.value })
                        }
                        placeholder="Hunting / Fishing"
                        className="w-full h-8 px-2.5 rounded-lg border border-gray-200 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Species
                      </label>
                      <input
                        type="text"
                        value={formData.species}
                        onChange={(e) =>
                          setFormData({ ...formData, species: e.target.value })
                        }
                        placeholder="White-tailed Deer"
                        className="w-full h-8 px-2.5 rounded-lg border border-gray-200 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Season Name
                      </label>
                      <input
                        type="text"
                        value={formData.season_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            season_name: e.target.value,
                          })
                        }
                        placeholder="Archery Season"
                        className="w-full h-8 px-2.5 rounded-lg border border-gray-200 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={formData.season_start}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            season_start: e.target.value,
                          })
                        }
                        className="w-full h-8 px-2.5 rounded-lg border border-gray-200 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={formData.season_end}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            season_end: e.target.value,
                          })
                        }
                        className="w-full h-8 px-2.5 rounded-lg border border-gray-200 text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Published Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pub-check"
                  checked={formData.is_published}
                  onChange={(e) =>
                    setFormData({ ...formData, is_published: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-[#0E3E27] focus:ring-[#0E3E27] accent-[#0E3E27] cursor-pointer"
                />
                <label
                  htmlFor="pub-check"
                  className="text-xs font-semibold text-gray-700 cursor-pointer"
                >
                  Publish Resource Immediately (visible to users)
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setFormModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSaving}
                  className="px-5 py-2 rounded-xl bg-[#0E3E27] hover:bg-[#092c1b] text-white text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {formSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Resource...</span>
                    </>
                  ) : (
                    <span>
                      {isEditing ? "Save Changes" : "Create Resource"}
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== VIEW DETAILS MODAL ===================== */}
      {viewModal && selectedResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0E3E27] flex items-center justify-center flex-shrink-0 p-1.5 border border-emerald-100">
                  {selectedResource.category_icon ? (
                    <img
                      src={
                        selectedResource.category_icon.startsWith("http")
                          ? selectedResource.category_icon
                          : `${API_URL}${selectedResource.category_icon}`
                      }
                      alt=""
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <BookOpen className="w-5 h-5 text-[#0E3E27]" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {selectedResource.title}
                  </h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 mt-0.5 uppercase">
                    {selectedResource.resource_type || "Guide"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setViewModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                <div>
                  <span className="text-gray-400 block font-medium">State</span>
                  <span className="font-semibold text-gray-800">
                    {selectedResource.state_name ||
                      (typeof selectedResource.state === "object"
                        ? selectedResource.state?.state_name
                        : selectedResource.state) ||
                      "National"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">
                    Category
                  </span>
                  <span className="font-semibold text-gray-800">
                    {selectedResource.category || "General"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">
                    Status
                  </span>
                  <span className="font-semibold text-emerald-700">
                    {selectedResource.is_published ? "Published" : "Draft"}
                  </span>
                </div>
              </div>

              {/* Web Link */}
              {selectedResource.resource_url && (
                <div>
                  <span className="text-gray-400 block font-medium mb-1">
                    Official Web URL
                  </span>
                  <a
                    href={selectedResource.resource_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1.5 break-all font-medium"
                  >
                    <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                    {selectedResource.resource_url}
                  </a>
                </div>
              )}

              {/* Description / Content */}
              {selectedResource.content && (
                <div>
                  <span className="text-gray-400 block font-medium mb-1">
                    Content / Description
                  </span>
                  <p className="p-3 bg-gray-50 rounded-xl text-gray-700 leading-relaxed">
                    {selectedResource.content}
                  </p>
                </div>
              )}

              {/* Seasonal Data */}
              {selectedResource.seasonalData && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-1.5">
                  <span className="font-bold text-amber-900 block">
                    Season Dates Information
                  </span>
                  <p className="text-gray-700">
                    <strong>Activity:</strong>{" "}
                    {selectedResource.seasonalData.activity || "—"} |{" "}
                    <strong>Species:</strong>{" "}
                    {selectedResource.seasonalData.species || "—"}
                  </p>
                  <p className="text-gray-700">
                    <strong>Season:</strong>{" "}
                    {selectedResource.seasonalData.season_name || "—"} (
                    {selectedResource.seasonalData.season_start} to{" "}
                    {selectedResource.seasonalData.season_end})
                  </p>
                </div>
              )}

              {/* Attached File */}
              {selectedResource.resource_file && (
                <div className="pt-2">
                  <a
                    href={
                      selectedResource.resource_file.startsWith("http")
                        ? selectedResource.resource_file
                        : `${API_URL}${selectedResource.resource_file}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold"
                  >
                    <Download className="w-4 h-4 text-[#0E3E27]" />
                    Download Attached File / PDF
                  </a>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => setViewModal(false)}
                className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700 transition-all cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setViewModal(false);
                  handleOpenEdit(selectedResource);
                }}
                className="px-5 py-2 rounded-xl bg-[#0E3E27] hover:bg-[#092c1b] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit Resource
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== DELETE CONFIRMATION DIALOG ===================== */}
      {deleteConfirmOpen && resourceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Delete Resource
                </h3>
                <p className="text-xs text-gray-500">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed mb-6">
              Are you sure you want to permanently delete the resource{" "}
              <strong className="text-gray-900">
                "{resourceToDelete.title}"
              </strong>
              ?
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                disabled={deleting}
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Yes, Delete Resource</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
