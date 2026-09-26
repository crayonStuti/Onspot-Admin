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
import Pagination from "@/components/admin/Pagination";
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
  { label: "Seasonal", value: "seasonal" },
];

export default function ResourcesPage() {
  // Resources List State
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStateId, setSelectedStateId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedVisibility, setSelectedVisibility] = useState("");
  const [selectedTimeframe, setSelectedTimeframe] = useState("");
  const [selectedActivity, setSelectedActivity] = useState("");

  const [statesList, setStatesList] = useState<any[]>([]);
  const [activityTypes, setActivityTypes] = useState<string[]>([]);
  const filterRowRef = React.useRef<HTMLDivElement>(null);

  // Dashboard Stat Cards State (1:1 with HTML mockup & data.stats)
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState({
    total_resources: {
      count: null as number | string | null,
      weekly_change: 0,
      trend: "up" as "up" | "down" | "flat",
      formatted_text: "",
    },
    published: {
      count: null as number | string | null,
      weekly_change: 0,
      trend: "up" as "up" | "down" | "flat",
      formatted_text: "",
    },
    needs_update: {
      count: null as number | string | null,
      weekly_change: 0,
      trend: "up" as "up" | "down" | "flat",
      formatted_text: "",
    },
    archived: {
      count: null as number | string | null,
      weekly_change: 0,
      trend: "down" as "up" | "down" | "flat",
      formatted_text: "",
    },
    pdf_document: {
      count: null as number | string | null,
      weekly_change: 0,
      trend: "down" as "up" | "down" | "flat",
      formatted_text: "",
    },
  });

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

  // Helper to parse stats from API response
  const parseStat = (
    raw: any,
    fallbackCount: number | string = 0,
    fallbackTrend: "up" | "down" | "flat" = "up",
    fallbackText = "",
  ) => {
    if (raw === undefined || raw === null) {
      return {
        count: fallbackCount,
        weekly_change: 0,
        trend: fallbackTrend,
        formatted_text: fallbackText,
      };
    }
    if (typeof raw === "number" || typeof raw === "string") {
      return {
        count: raw,
        weekly_change: 0,
        trend: fallbackTrend,
        formatted_text: fallbackText,
      };
    }
    const count = raw.count ?? raw.total ?? fallbackCount;
    const weekly_change = raw.weekly_change ?? 0;
    const trend = (raw.trend || (weekly_change < 0 ? "down" : fallbackTrend)) as
      | "up"
      | "down"
      | "flat";
    let formatted_text = raw.formatted_text;
    if (
      !formatted_text &&
      raw.weekly_change !== undefined &&
      raw.weekly_change !== null
    ) {
      const arrow = trend === "down" ? "↓" : trend === "up" ? "↑" : "";
      const sign = Number(raw.weekly_change) > 0 ? "+" : "";
      formatted_text = `${arrow}${sign}${raw.weekly_change} this week`;
    }
    return {
      count,
      weekly_change,
      trend,
      formatted_text: formatted_text || fallbackText,
    };
  };

  // Fetch Resources List with new API query parameters
  const fetchResourcesList = useCallback(async () => {
    setLoading(true);
    setStatsLoading(true);
    try {
      let isPublishedParam: string | undefined = undefined;
      if (selectedVisibility === "Published") {
        isPublishedParam = "true";
      } else if (
        selectedVisibility === "Archived" ||
        selectedVisibility === "Need Updated"
      ) {
        isPublishedParam = "false";
      }

      const res = await getAdminResources({
        page,
        limit,
        search: searchQuery,
        state_id: selectedStateId,
        category: selectedCategory,
        type: selectedType,
        types: selectedType,
        is_published: isPublishedParam,
        last_updated: selectedTimeframe,
        timeframe: selectedTimeframe,
        activity: selectedActivity,
      });

      if (res && res.data) {
        setResources(res.data.resources || []);
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.totalPages || 1);
          setTotalItems(res.data.pagination.totaldata || 0);
        }

        // Update Dashboard Stat Cards (data.stats)
        const apiStats = res.data.stats || res.stats;
        if (apiStats) {
          setStats({
            total_resources: parseStat(
              apiStats.total_resources,
              res.data.pagination?.totaldata ?? 0,
              "up",
            ),
            published: parseStat(apiStats.published, 0, "up"),
            needs_update: parseStat(
              apiStats.needs_update ?? apiStats.need_update,
              0,
              "up",
            ),
            archived: parseStat(apiStats.archived, 0, "down"),
            pdf_document: parseStat(
              apiStats.pdf_document ?? apiStats.pdf_documents,
              0,
              "down",
            ),
          });
        } else if (res.data.pagination?.totaldata !== undefined) {
          setStats((prev) => ({
            ...prev,
            total_resources: {
              ...prev.total_resources,
              count: res.data.pagination.totaldata,
            },
          }));
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
      setStatsLoading(false);
    }
  }, [
    page,
    limit,
    searchQuery,
    selectedStateId,
    selectedCategory,
    selectedType,
    selectedVisibility,
    selectedTimeframe,
    selectedActivity,
  ]);

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
        activity: (resource.seasonalData?.activity || resource.activity || "").toLowerCase(),
        species: resource.seasonalData?.species || resource.species || "",
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

      if (
        formData.category === "Season Dates" ||
        formData.resource_type === "seasonal" ||
        formData.category?.toLowerCase().includes("season") ||
        Boolean(formData.activity)
      ) {
        if (formData.activity) {
          payload.append("activity", formData.activity.toLowerCase());
        }
        if (formData.species) payload.append("species", formData.species);
        if (formData.season_name) payload.append("season_name", formData.season_name);
        if (formData.season_start) payload.append("season_start", formData.season_start);
        if (formData.season_end) payload.append("season_end", formData.season_end);
        if (formData.rules) payload.append("rules", formData.rules);
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

  // Smooth scroll to filters when Filters button is clicked
  const handleFiltersClick = () => {
    if (filterRowRef.current) {
      filterRowRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      const stateSelect = document.getElementById("filter-state");
      if (stateSelect) stateSelect.focus();
    }
  };

  // Select dropdown styling with chevron icon
  const selectArrowStyle = {
    backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237D848D' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 14px center",
  };

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Resources */}
        <div className="bg-white rounded-[14px] p-[18px_20px] shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)] border border-[#f1f1ed] flex flex-col justify-between">
          <div className="flex items-start justify-between mb-2">
            <span className="text-[#7D848D] text-[13px] font-medium">
              Total Resources
            </span>
            <span className="w-7 h-7 text-[#1f3d2a] flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 7V3.5L18.5 9H13zM8 13h8v1.5H8V13zm0 3h8v1.5H8V16zm0-6h4v1.5H8V10z" />
              </svg>
            </span>
          </div>
          {statsLoading || loading ? (
            <div className="space-y-2 py-1">
              <div className="h-7 w-24 bg-[#ecece6] rounded-md animate-pulse" />
              <div className="h-3.5 w-28 bg-[#f2f2ed] rounded animate-pulse" />
            </div>
          ) : (
            <>
              <div className="text-[26px] font-bold text-[#1f1f1f] mb-2 leading-tight">
                {typeof stats.total_resources.count === "number"
                  ? stats.total_resources.count.toLocaleString()
                  : stats.total_resources.count ?? (totalItems || 0)}
              </div>
              <div
                className={`text-[12px] inline-flex items-center gap-1 font-normal ${
                  stats.total_resources.trend === "down"
                    ? "text-[#e03131]"
                    : stats.total_resources.trend === "up"
                      ? "text-[#34A853]"
                      : "text-[#7D848D]"
                }`}
              >
                {stats.total_resources.formatted_text ||
                  (stats.total_resources.weekly_change !== 0
                    ? `${stats.total_resources.weekly_change > 0 ? "↑+" : "↓"}${stats.total_resources.weekly_change} this week`
                    : "")}
              </div>
            </>
          )}
        </div>

        {/* Published */}
        <div className="bg-white rounded-[14px] p-[18px_20px] shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)] border border-[#f1f1ed] flex flex-col justify-between">
          <div className="flex items-start justify-between mb-2">
            <span className="text-[#7D848D] text-[13px] font-medium">
              Published
            </span>
            <span className="w-7 h-7 text-[#1f3d2a] flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5zM12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
              </svg>
            </span>
          </div>
          {statsLoading || loading ? (
            <div className="space-y-2 py-1">
              <div className="h-7 w-24 bg-[#ecece6] rounded-md animate-pulse" />
              <div className="h-3.5 w-28 bg-[#f2f2ed] rounded animate-pulse" />
            </div>
          ) : (
            <>
              <div className="text-[26px] font-bold text-[#1f1f1f] mb-2 leading-tight">
                {typeof stats.published.count === "number"
                  ? stats.published.count.toLocaleString()
                  : stats.published.count ?? 0}
              </div>
              <div
                className={`text-[12px] inline-flex items-center gap-1 font-normal ${
                  stats.published.trend === "down"
                    ? "text-[#e03131]"
                    : stats.published.trend === "up"
                      ? "text-[#34A853]"
                      : "text-[#7D848D]"
                }`}
              >
                {stats.published.formatted_text ||
                  (stats.published.weekly_change !== 0
                    ? `${stats.published.weekly_change > 0 ? "↑+" : "↓"}${stats.published.weekly_change} this week`
                    : "")}
              </div>
            </>
          )}
        </div>

        {/* Needs Update */}
        <div className="bg-white rounded-[14px] p-[18px_20px] shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)] border border-[#f1f1ed] flex flex-col justify-between">
          <div className="flex items-start justify-between mb-2">
            <span className="text-[#7D848D] text-[13px] font-medium">
              Needs Update
            </span>
            <span className="w-7 h-7 text-[#1f3d2a] flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
              </svg>
            </span>
          </div>
          {statsLoading || loading ? (
            <div className="space-y-2 py-1">
              <div className="h-7 w-24 bg-[#ecece6] rounded-md animate-pulse" />
              <div className="h-3.5 w-28 bg-[#f2f2ed] rounded animate-pulse" />
            </div>
          ) : (
            <>
              <div className="text-[26px] font-bold text-[#1f1f1f] mb-2 leading-tight">
                {typeof stats.needs_update.count === "number"
                  ? stats.needs_update.count.toLocaleString()
                  : stats.needs_update.count ?? 0}
              </div>
              <div
                className={`text-[12px] inline-flex items-center gap-1 font-normal ${
                  stats.needs_update.trend === "down"
                    ? "text-[#e03131]"
                    : stats.needs_update.trend === "up"
                      ? "text-[#34A853]"
                      : "text-[#7D848D]"
                }`}
              >
                {stats.needs_update.formatted_text ||
                  (stats.needs_update.weekly_change !== 0
                    ? `${stats.needs_update.weekly_change > 0 ? "↑+" : "↓"}${stats.needs_update.weekly_change} this week`
                    : "")}
              </div>
            </>
          )}
        </div>

        {/* Archived */}
        <div className="bg-white rounded-[14px] p-[18px_20px] shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)] border border-[#f1f1ed] flex flex-col justify-between">
          <div className="flex items-start justify-between mb-2">
            <span className="text-[#7D848D] text-[13px] font-medium">
              Archived
            </span>
            <span className="w-7 h-7 text-[#1f3d2a] flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                <path d="M20.54 5.23l-1.39-1.68A1.45 1.45 0 0 0 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z" />
              </svg>
            </span>
          </div>
          {statsLoading || loading ? (
            <div className="space-y-2 py-1">
              <div className="h-7 w-24 bg-[#ecece6] rounded-md animate-pulse" />
              <div className="h-3.5 w-28 bg-[#f2f2ed] rounded animate-pulse" />
            </div>
          ) : (
            <>
              <div className="text-[26px] font-bold text-[#1f1f1f] mb-2 leading-tight">
                {typeof stats.archived.count === "number"
                  ? stats.archived.count.toLocaleString()
                  : stats.archived.count ?? 0}
              </div>
              <div
                className={`text-[12px] inline-flex items-center gap-1 font-normal ${
                  stats.archived.trend === "down"
                    ? "text-[#e03131]"
                    : stats.archived.trend === "up"
                      ? "text-[#34A853]"
                      : "text-[#7D848D]"
                }`}
              >
                {stats.archived.formatted_text ||
                  (stats.archived.weekly_change !== 0
                    ? `${stats.archived.weekly_change > 0 ? "↑+" : "↓"}${stats.archived.weekly_change} this week`
                    : "")}
              </div>
            </>
          )}
        </div>

        {/* PDF Document */}
        <div className="bg-white rounded-[14px] p-[18px_20px] shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)] border border-[#f1f1ed] flex flex-col justify-between">
          <div className="flex items-start justify-between mb-2">
            <span className="text-[#7D848D] text-[13px] font-medium">
              PDF Document
            </span>
            <span className="w-7 h-7 text-[#1f3d2a] flex items-center justify-center shrink-0">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
                className="w-7 h-7"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
                <polyline points="14 2 14 8 20 8" />
                <text
                  x="7"
                  y="17"
                  fontSize="5"
                  fontWeight="700"
                  fill="currentColor"
                  stroke="none"
                  fontFamily="Inter"
                >
                  PDF
                </text>
              </svg>
            </span>
          </div>
          {statsLoading || loading ? (
            <div className="space-y-2 py-1">
              <div className="h-7 w-24 bg-[#ecece6] rounded-md animate-pulse" />
              <div className="h-3.5 w-28 bg-[#f2f2ed] rounded animate-pulse" />
            </div>
          ) : (
            <>
              <div className="text-[26px] font-bold text-[#1f1f1f] mb-2 leading-tight">
                {typeof stats.pdf_document.count === "number"
                  ? stats.pdf_document.count.toLocaleString()
                  : stats.pdf_document.count ?? 0}
              </div>
              <div
                className={`text-[12px] inline-flex items-center gap-1 font-normal ${
                  stats.pdf_document.trend === "down"
                    ? "text-[#e03131]"
                    : stats.pdf_document.trend === "up"
                      ? "text-[#34A853]"
                      : "text-[#7D848D]"
                }`}
              >
                {stats.pdf_document.formatted_text ||
                  (stats.pdf_document.weekly_change !== 0
                    ? `${stats.pdf_document.weekly_change > 0 ? "↑+" : "↓"}${stats.pdf_document.weekly_change} this week`
                    : "")}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ===================== BODY GRID (TABLE + SIDEBAR) ===================== */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_410px] lg:grid-cols-[minmax(0,1fr)_340px] gap-[22px]">
        {/* ===================== LEFT COLUMN: FILTERS + TABLE + PAGINATION ===================== */}
        <div className="min-w-0">
          <section
            ref={filterRowRef}
            className="flex gap-3 mb-4 flex-wrap items-center"
          >
            {/* Filter State */}
            <select
              id="filter-state"
              value={selectedStateId}
              onChange={(e) => {
                setSelectedStateId(e.target.value);
                setPage(1);
              }}
              className="h-[38px] px-3.5 pr-9 border border-[#e4e4df] rounded-[6px] bg-white text-[13px] text-[#4a4a4a] cursor-pointer appearance-none outline-none focus:border-[#2d4a23] transition-colors flex-1 sm:flex-none sm:w-[165px]"
              style={selectArrowStyle}
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

            {/* Filter Category (UI label is Category, options: Hunting & Fishing, filters by activity param) */}
            <select
              id="filter-category"
              value={selectedActivity}
              onChange={(e) => {
                setSelectedActivity(e.target.value);
                setSelectedCategory("");
                setPage(1);
              }}
              className="h-[38px] px-3.5 pr-9 border border-[#e4e4df] rounded-[6px] bg-white text-[13px] text-[#4a4a4a] cursor-pointer appearance-none outline-none focus:border-[#2d4a23] transition-colors flex-1 sm:flex-none sm:w-[165px]"
              style={selectArrowStyle}
            >
              <option value="">All Categories</option>
              <option value="hunting">Hunting</option>
              <option value="fishing">Fishing</option>
            </select>

            {/* Filter Type */}
            <select
              id="filter-type"
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setPage(1);
              }}
              className="h-[38px] px-3.5 pr-9 border border-[#e4e4df] rounded-[6px] bg-white text-[13px] text-[#4a4a4a] cursor-pointer appearance-none outline-none focus:border-[#2d4a23] transition-colors flex-1 sm:flex-none sm:w-[165px]"
              style={selectArrowStyle}
            >
              <option value="">All Types</option>
              <option value="pdf">PDF</option>
              <option value="url">Link</option>
            </select>

            {/* Filter Visibility */}
            <select
              id="filter-visibility"
              value={selectedVisibility}
              onChange={(e) => {
                setSelectedVisibility(e.target.value);
                setPage(1);
              }}
              className="h-[38px] px-3.5 pr-9 border border-[#e4e4df] rounded-[6px] bg-white text-[13px] text-[#4a4a4a] cursor-pointer appearance-none outline-none focus:border-[#2d4a23] transition-colors flex-1 sm:flex-none sm:w-[165px]"
              style={selectArrowStyle}
            >
              <option value="">All Visibility</option>
              <option value="Published">Published</option>
              <option value="Archived">Archived</option>
              <option value="Need Updated">Need Updated</option>
            </select>

            {/* Filter Last Updated */}
            <select
              id="filter-updated"
              value={selectedTimeframe}
              onChange={(e) => {
                setSelectedTimeframe(e.target.value);
                setPage(1);
              }}
              className="h-[38px] px-3.5 pr-9 border border-[#e4e4df] rounded-[6px] bg-white text-[13px] text-[#4a4a4a] cursor-pointer appearance-none outline-none focus:border-[#2d4a23] transition-colors flex-1 sm:flex-none sm:w-[175px]"
              style={selectArrowStyle}
            >
              <option value="">Last Updated: All Time</option>
              <option value="7_days">Last 7 Days</option>
              <option value="30_days">Last 30 Days</option>
              <option value="90_days">Last 90 Days</option>
            </select>

            {/* Activity/Category indicator */}
            {selectedActivity && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[6px] bg-[#0E3E27]/10 text-[#0E3E27] text-xs font-semibold">
                <span className="capitalize">Category: {selectedActivity}</span>
                <button
                  onClick={() => {
                    setSelectedActivity("");
                    setPage(1);
                  }}
                  className="hover:text-red-600 cursor-pointer"
                  title="Clear category filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
          </section>

          <section className="bg-white rounded-[14px] border border-[#ececec] shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)] p-[4px_20px_6px]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-[#ececec]">
                    <th className="py-4 px-2 font-semibold text-[#111111] text-[13px]">
                      Resource Title
                    </th>
                    <th className="py-4 px-2 font-semibold text-[#111111] text-[13px]">
                      State
                    </th>
                    <th className="py-4 px-2 font-semibold text-[#111111] text-[13px]">
                      Category
                    </th>
                    <th className="py-4 px-2 font-semibold text-[#111111] text-[13px]">
                      Type
                    </th>
                    <th className="py-4 px-2 font-semibold text-[#111111] text-[13px]">
                      Last Updated
                    </th>
                    <th className="py-4 px-2 font-semibold text-[#111111] text-[13px]">
                      Visibility
                    </th>
                    <th className="py-4 px-2 text-right font-semibold text-[#111111] text-[13px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f1ed] text-[13px]">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-16 text-center text-[#7D848D]"
                      >
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
                      <td
                        colSpan={7}
                        className="py-16 text-center text-[#7D848D]"
                      >
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <AlertCircle className="w-8 h-8 text-gray-300" />
                          <p className="text-[13px] font-semibold text-gray-700">
                            No resources match your filters.
                          </p>
                          <p className="text-xs text-[#7D848D]">
                            Try clearing filters or changing search keywords.
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
                        "Florida";
                      const isPublished =
                        item.is_published === true ||
                        item.is_published === "1" ||
                        item.is_published === 1;

                      let badgeClass = "published";
                      let badgeText = "Published";
                      if (item.visibility) {
                        badgeText = item.visibility;
                        if (item.visibility === "Published")
                          badgeClass = "published";
                        else if (item.visibility === "Archived")
                          badgeClass = "archived";
                        else badgeClass = "need";
                      } else if (isPublished) {
                        badgeClass = "published";
                        badgeText = "Published";
                      } else {
                        badgeClass = "need";
                        badgeText = "Need Updated";
                      }

                      const updatedDate =
                        item.updated_at || item.created_at
                          ? new Date(
                              item.updated_at || item.created_at!,
                            ).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })
                          : "03/04/2028";

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-[#fbfbf8] transition-colors"
                        >
                          {/* Resource Title (Bold title + Subtitle text) */}
                          <td className="py-3 px-2 align-middle">
                            <div className="font-medium text-[#1f1f1f] text-[13.5px] max-w-sm truncate">
                              {item.title}
                            </div>
                            <div className="text-[12px] text-[#a0a0a0] mt-0.5 max-w-sm truncate">
                              {item.description ||
                                item.resource_url ||
                                "Official deer seasons dates, bag limits and rules."}
                            </div>
                          </td>

                          {/* State (Plain Text matching HTML) */}
                          <td className="py-3 px-2 text-[#7a7a7a] align-middle whitespace-nowrap">
                            {stateDisplay}
                          </td>

                          {/* Category (Plain Text) */}
                          <td className="py-3 px-2 text-[#7a7a7a] align-middle whitespace-nowrap">
                            {item.category || "Deer Hunting"}
                          </td>

                          {/* Type (Plain Text uppercase) */}
                          <td className="py-3 px-2 text-[#7a7a7a] align-middle whitespace-nowrap">
                            {item.resource_type
                              ? item.resource_type === "url"
                                ? "Link"
                                : item.resource_type.toUpperCase()
                              : "PDF"}
                          </td>

                          {/* Last Updated (DD/MM/YYYY) */}
                          <td className="py-3 px-2 text-[#7a7a7a] align-middle whitespace-nowrap">
                            {updatedDate}
                          </td>

                          {/* Visibility (HTML Badge) */}
                          <td className="py-3 px-2 align-middle whitespace-nowrap">
                            <span
                              className={`inline-block px-3 py-1 rounded-[6px] text-[11.5px] font-medium border ${
                                badgeClass === "published"
                                  ? "bg-[#e8f5ec] text-[#34A853] border-[#b8e0c2]"
                                  : badgeClass === "archived"
                                    ? "bg-[#f1f1ed] text-[#7D848D] border-[#d8d8d2]"
                                    : "bg-[#fff1e3] text-[#C45508] border-[#f4ceaa]"
                              }`}
                            >
                              {badgeText}
                            </span>
                          </td>

                          {/* Actions (HTML square row-actions) */}
                          <td className="py-3 px-2 text-right align-middle whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              {/* View */}
                              <button
                                onClick={() => handleViewResource(item)}
                                title="View"
                                className="w-7 h-7 border border-[#e2e2dc] rounded-[6px] bg-white text-[#7D848D] hover:bg-[#f7f7f4] hover:text-[#2d4a23] hover:border-[#d4d4cd] inline-flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <svg
                                  className="w-3.5 h-3.5"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                              </button>

                              {/* Edit */}
                              <button
                                onClick={() => handleOpenEdit(item)}
                                title="Edit"
                                className="w-7 h-7 border border-[#e2e2dc] rounded-[6px] bg-white text-[#7D848D] hover:bg-[#f7f7f4] hover:text-[#2d4a23] hover:border-[#d4d4cd] inline-flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <svg
                                  className="w-3.5 h-3.5"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M11 4H4a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z" />
                                </svg>
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => handleDeletePrompt(item)}
                                title="Delete"
                                className="w-7 h-7 border border-[#e2e2dc] rounded-[6px] bg-white text-[#7D848D] hover:bg-[#f7f7f4] hover:text-red-600 hover:border-red-200 inline-flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              {/* More */}
                              <button
                                onClick={() => handleViewResource(item)}
                                title="More"
                                className="w-7 h-7 border border-[#e2e2dc] rounded-[6px] bg-white text-[#7D848D] hover:bg-[#f7f7f4] hover:text-[#2d4a23] hover:border-[#d4d4cd] inline-flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <MoreVertical className="w-3.5 h-3.5" />
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
            totalItems={totalItems}
            pageSize={limit}
            itemCountOnPage={resources.length}
            itemLabel="users"
            onPageChange={(newPage) => setPage(newPage)}
            loading={loading}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1">
              <input
                type="text"
                id="right-search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search"
                className="w-full h-[38px] pl-3.5 pr-10 border border-[#e4e4df] rounded-[6px] bg-white text-[13px] text-[#444] placeholder-gray-400 outline-none focus:border-[#2d4a23] transition-colors"
              />
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-4 h-4 text-[#999] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <button
              id="filters-btn"
              onClick={handleFiltersClick}
              className="h-[38px] px-4 border border-[#e4e4df] bg-white hover:bg-[#f7f7f2] hover:border-[#d4d4cd] rounded-[6px] text-[#3b6bbf] font-medium text-[13px] cursor-pointer inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <span>Filters</span>
              <svg
                className="w-3.5 h-3.5 text-[#3b6bbf]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
            </button>
          </div>

          {/* PANEL 1: RESOURCE ACTIONS */}
          <div className="bg-white rounded-[14px] p-[22px_24px] shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)]">
            <h3 className="text-[16px] font-bold text-[#1f1f1f] mb-5 pb-[18px] border-b border-[#ececec]">
              Resource Actions
            </h3>
            <div className="flex flex-col gap-[18px]">
              <a
                onClick={handleOpenAdd}
                className="flex items-center gap-3 text-[#1f1f1f] hover:text-[#2d4a23] text-[14px] font-medium cursor-pointer transition-colors"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5 text-[#1f3d2a] shrink-0"
                >
                  <circle cx="12" cy="12" r="9" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                <span>Add New Resource</span>
              </a>

              {/* <a
                onClick={() => {
                  toast.info(
                    "Bulk Upload: Select a CSV or Excel file to batch import resources.",
                  );
                }}
                className="flex items-center gap-3 text-[#1f1f1f] hover:text-[#2d4a23] text-[14px] font-medium cursor-pointer transition-colors"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5 text-[#1f3d2a] shrink-0"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span>Bulk Upload Resources</span>
              </a>

              <a
                onClick={() => {
                  toast.info(
                    "Import from DNR: Automated crawler will sync latest regulations.",
                  );
                }}
                className="flex items-center gap-3 text-[#1f1f1f] hover:text-[#2d4a23] text-[14px] font-medium cursor-pointer transition-colors"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5 text-[#1f3d2a] shrink-0"
                >
                  <circle cx="12" cy="12" r="9" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
                </svg>
                <span>Import from DNR Websites</span>
              </a> */}

              {/* <a
                onClick={() => {
                  const catSelect = document.getElementById("filter-category");
                  if (catSelect) {
                    catSelect.focus();
                    catSelect.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                  }
                }}
                className="flex items-center gap-3 text-[#1f1f1f] hover:text-[#2d4a23] text-[14px] font-medium cursor-pointer relative transition-colors"
              >
                <span className="relative">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5 text-[#1f3d2a] shrink-0"
                  >
                    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
                  </svg>
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-[#34A853] rounded-full"></span>
                </span>
                <span>Mange Categories</span>
              </a> */}

              {/* <a
                onClick={() => {
                  const visSelect =
                    document.getElementById("filter-visibility");
                  if (visSelect) {
                    visSelect.focus();
                    visSelect.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                  }
                }}
                className="flex items-center gap-3 text-[#1f1f1f] hover:text-[#2d4a23] text-[14px] font-medium cursor-pointer transition-colors"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5 text-[#1f3d2a] shrink-0"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span>Visibility Settings</span>
              </a> */}
            </div>
          </div>

          {/* PANEL 2: RESOURCE CATEGORIES (Filterable Activity & Category) */}
          {/* <div className="bg-white rounded-[14px] p-[22px_24px] shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)]">
            <h3 className="text-[16px] font-bold text-[#1f1f1f] mb-5 pb-[18px] border-b border-[#ececec]">
              Resource Categories
            </h3>
            <div className="flex flex-col gap-[18px]">
  
              <div
                onClick={() => {
                  const nextAct =
                    selectedActivity === "hunting" ? "" : "hunting";
                  setSelectedActivity(nextAct);
                  setPage(1);
                }}
                className={`flex items-center gap-3.5 cursor-pointer transition-all p-1.5 -mx-1.5 rounded-lg ${
                  selectedActivity === "hunting"
                    ? "bg-[#e8f5ec] text-[#2d4a23]"
                    : "hover:bg-gray-50"
                }`}
              >
                <span className="w-7 h-7 flex items-center justify-center text-[#1f3d2a] shrink-0">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-6 h-6"
                  >
                    <path d="M5 3v3l-2 1 2 2 1 2h2l1 3h6l1-3h2l1-2 2-2-2-1V3l-3 3-2-1-2 1-3-3z" />
                    <path d="M10 12h.01" />
                    <path d="M14 12h.01" />
                    <path d="M11 16c.5.5 1.5.5 2 0" />
                  </svg>
                </span>
                <span className="flex-1 text-[14px] font-medium text-[#1f1f1f]">
                  Hunting
                </span>
                <span className="text-[#7D848D] text-[13px]">18,564</span>
              </div>

              <div
                onClick={() => {
                  const nextAct =
                    selectedActivity === "fishing" ? "" : "fishing";
                  setSelectedActivity(nextAct);
                  setPage(1);
                }}
                className={`flex items-center gap-3.5 cursor-pointer transition-all p-1.5 -mx-1.5 rounded-lg ${
                  selectedActivity === "fishing"
                    ? "bg-[#e8f5ec] text-[#2d4a23]"
                    : "hover:bg-gray-50"
                }`}
              >
                <span className="w-7 h-7 flex items-center justify-center text-[#1f3d2a] shrink-0">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-6 h-6"
                  >
                    <path d="M6.5 12c0-3 2-6 6-6 4 0 7 3 8 6-1 3-4 6-8 6-4 0-6-3-6-6z" />
                    <circle cx="10" cy="11" r=".8" fill="currentColor" />
                    <path d="M6.5 12c-1 0-2.5-.5-3.5-2 1-1.5 2.5-2 3.5-2" />
                    <path d="M6.5 12c-1 0-2.5.5-3.5 2 1 1.5 2.5 2 3.5 2" />
                  </svg>
                </span>
                <span className="flex-1 text-[14px] font-medium text-[#1f1f1f]">
                  Fishing
                </span>
                <span className="text-[#7D848D] text-[13px]">18,564</span>
              </div>

              <div
                onClick={() => {
                  const nextCat =
                    selectedCategory === "General" ? "" : "General";
                  setSelectedCategory(nextCat);
                  setPage(1);
                }}
                className={`flex items-center gap-3.5 cursor-pointer transition-all p-1.5 -mx-1.5 rounded-lg ${
                  selectedCategory === "General"
                    ? "bg-[#e8f5ec] text-[#2d4a23]"
                    : "hover:bg-gray-50"
                }`}
              >
                <span className="w-7 h-7 flex items-center justify-center text-[#1f3d2a] shrink-0">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-6 h-6"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
                  </svg>
                </span>
                <span className="flex-1 text-[14px] font-medium text-[#1f1f1f]">
                  General
                </span>
                <span className="text-[#7D848D] text-[13px]">18,564</span>
              </div>

              <div
                onClick={() => {
                  const nextCat =
                    selectedCategory === "Boating" ? "" : "Boating";
                  setSelectedCategory(nextCat);
                  setPage(1);
                }}
                className={`flex items-center gap-3.5 cursor-pointer transition-all p-1.5 -mx-1.5 rounded-lg ${
                  selectedCategory === "Boating"
                    ? "bg-[#e8f5ec] text-[#2d4a23]"
                    : "hover:bg-gray-50"
                }`}
              >
                <span className="w-7 h-7 flex items-center justify-center text-[#1f3d2a] shrink-0">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-6 h-6"
                  >
                    <path d="M3 17h18l-2 4H5z" />
                    <path d="M5 15V9h14v6" />
                    <path d="M12 3v6" />
                    <path d="M9 9l3-3 3 3" />
                  </svg>
                </span>
                <span className="flex-1 text-[14px] font-medium text-[#1f1f1f]">
                  Boating
                </span>
                <span className="text-[#7D848D] text-[13px]">18,564</span>
              </div>

              <div
                onClick={() => {
                  const nextCat =
                    selectedCategory === "Conservation" ? "" : "Conservation";
                  setSelectedCategory(nextCat);
                  setPage(1);
                }}
                className={`flex items-center gap-3.5 cursor-pointer transition-all p-1.5 -mx-1.5 rounded-lg ${
                  selectedCategory === "Conservation"
                    ? "bg-[#e8f5ec] text-[#2d4a23]"
                    : "hover:bg-gray-50"
                }`}
              >
                <span className="w-7 h-7 flex items-center justify-center text-[#1f3d2a] shrink-0">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-6 h-6"
                  >
                    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19.2 2c1 1.5 1.5 4.5 1.5 6 0 5-3 11.5-9.7 12z" />
                    <path d="M2 22c1-5 5-9 10-10" />
                  </svg>
                </span>
                <span className="flex-1 text-[14px] font-medium text-[#1f1f1f]">
                  Conservation
                </span>
                <span className="text-[#7D848D] text-[13px]">18,564</span>
              </div>
            </div>
          </div> */}

          {/* PANEL 3: RECENT ACTIVITY */}
          {/* <div className="bg-white rounded-[14px] p-[22px_24px] shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)]">
            <h3 className="text-[16px] font-bold text-[#1f1f1f] mb-5 pb-[18px] border-b border-[#ececec]">
              Recent Activity
            </h3>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <div className="font-semibold text-[#1f1f1f] text-[13.5px] mb-0.5">
                    Deer Hunting Regulations (WI)
                  </div>
                  <div className="text-[#999] text-[12px]">
                    Updated by Admin User
                  </div>
                </div>
                <div className="text-[#888] text-[12px] whitespace-nowrap">
                  May 25, 2026
                </div>
              </div>

              <div className="flex justify-between items-start gap-3">
                <div>
                  <div className="font-semibold text-[#1f1f1f] text-[13.5px] mb-0.5">
                    Fishing License Requirement (OH)
                  </div>
                  <div className="text-[#999] text-[12px]">
                    Marked for update
                  </div>
                </div>
                <div className="text-[#888] text-[12px] whitespace-nowrap">
                  May 25, 2026
                </div>
              </div>
            </div>
            <a
              onClick={() => {
                toast.info("Displaying recent resource audit log.");
              }}
              className="block text-center mt-3.5 pt-3 border-t border-[#ececec] text-[#0E3E27] text-[13px] underline cursor-pointer hover:text-[#092c1b]"
            >
              View All Activity
            </a>
          </div> */}
        </div>
      </div>

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

              {/* Conditional Season Dates / Seasonal Fields */}
              {(formData.category === "Season Dates" ||
                formData.resource_type === "seasonal" ||
                formData.category?.toLowerCase().includes("season")) && (
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-3 text-xs">
                  <span className="font-bold text-amber-900 block">
                    Seasonal Configuration
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Activity
                      </label>
                      <select
                        value={formData.activity.toLowerCase()}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            activity: e.target.value.toLowerCase(),
                          })
                        }
                        className="w-full h-8 px-2.5 rounded-lg border border-gray-200 text-xs bg-white text-gray-800 focus:outline-none focus:border-[#0E3E27] cursor-pointer"
                      >
                        <option value="">Select Activity</option>
                        <option value="hunting">Hunting</option>
                        <option value="fishing">Fishing</option>
                      </select>
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
