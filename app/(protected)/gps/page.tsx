"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Download,
  Eye,
  Share2,
  MoreVertical,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
  MapPin as MapPinIcon,
  Calendar,
  Tag,
  AlignLeft,
  Globe,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import {
  getMapPins,
  getMapPinById,
  getStates,
  MapPinItem,
} from "@/lib/api";

export default function GPSActivityPage() {
  // Map Pins state
  const [mapPins, setMapPins] = useState<MapPinItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedVisibility, setSelectedVisibility] = useState("");

  // States List
  const [statesList, setStatesList] = useState<any[]>([]);

  // View Details Modal state
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedPin, setSelectedPin] = useState<MapPinItem | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Fetch States for filter dropdown
  useEffect(() => {
    async function loadStates() {
      try {
        const res = await getStates(1, 100);
        const list = res.data || res.states || res || [];
        setStatesList(Array.isArray(list) ? list : []);
      } catch (err) {
        console.warn("Could not load states:", err);
      }
    }
    loadStates();
  }, []);

  // Fetch Map Pins List
  const fetchPinsList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMapPins(page, limit, searchQuery, selectedState, selectedVisibility);

      if (res && res.data) {
        if (Array.isArray(res.data)) {
          setMapPins(res.data);
          if (typeof res.total !== "undefined") {
            setTotalItems(res.total);
            setTotalPages(res.totalPages || Math.ceil(res.total / limit) || 1);
          } else if (res.pagination) {
            setTotalPages(res.pagination.totalPages || 1);
            setTotalItems(res.pagination.totaldata || res.data.length);
          } else {
            setTotalItems(res.data.length);
            setTotalPages(1);
          }
        } else if (Array.isArray(res.data.pins)) {
          setMapPins(res.data.pins);
          if (res.data.pagination) {
            setTotalPages(res.data.pagination.totalPages || 1);
            setTotalItems(res.data.pagination.totaldata || res.data.pins.length);
          }
        }
      } else if (Array.isArray(res)) {
        setMapPins(res);
        setTotalItems(res.length);
        setTotalPages(1);
      } else {
        setMapPins([]);
        setTotalItems(0);
        setTotalPages(1);
      }
    } catch (err: any) {
      console.error("Fetch map pins error:", err);
      toast.error(err?.message || "Failed to load GPS pins.");
      setMapPins([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchQuery, selectedState, selectedVisibility]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPinsList();
    }, 350);
    return () => clearTimeout(timer);
  }, [fetchPinsList]);

  // View Pin Details
  const handleViewPin = async (pin: MapPinItem) => {
    setSelectedPin(pin);
    setViewModalOpen(true);
    setDetailsLoading(true);

    try {
      const res = await getMapPinById(pin.id);
      const data = res.data || res.pin || res;
      setSelectedPin(data);
    } catch (err: any) {
      console.warn("Failed to load deep pin details:", err);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (mapPins.length === 0) {
      toast.info("No GPS pins to export.");
      return;
    }

    const headers = ["ID", "User", "Latitude", "Longitude", "State", "Tag Type", "Visibility", "Date"];
    const rows = mapPins.map((p) => [
      p.id,
      typeof p.user === "object" && p.user !== null ? (p.user.email || p.user.display_name || "N/A") : String(p.user || "N/A"),
      String(p.latitude || ""),
      String(p.longitude || ""),
      typeof p.state === "object" && p.state !== null ? (p.state.state_name || p.state.state_code || "N/A") : String(p.state || p.state_name || "N/A"),
      typeof p.tag_type === "object" && p.tag_type !== null ? (p.tag_type.name || "General") : String(p.tag_type || p.type || "General"),
      String(p.visibility || "Public"),
      p.created_at ? new Date(p.created_at).toLocaleDateString() : "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${val}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `onspot_gps_activity_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("GPS pins exported successfully.");
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
      {/* =========================================================================
          COMMENTED OUT STATIC STAT CARDS (Total Pins, Most Tagged State, etc.)
          ========================================================================= */}

      {/* ===================== FILTER & ACTION ROW ===================== */}
      <section className="bg-white rounded-[14px] p-4 sm:p-5 border border-[#ececec] shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* State Filter */}
          <select
            value={selectedState}
            onChange={(e) => {
              setSelectedState(e.target.value);
              setPage(1);
            }}
            className="h-[38px] w-40 px-3.5 border border-[#e4e4df] bg-white rounded-[6px] text-[#4a4a4a] text-[13px] focus:outline-none focus:border-[#2d4a23] cursor-pointer"
          >
            <option value="">All States</option>
            {statesList.map((s, idx) => {
              const sName = typeof s === "string" ? s : s?.state_name || s?.name || `State ${idx + 1}`;
              return (
                <option key={idx} value={sName}>
                  {sName}
                </option>
              );
            })}
          </select>

          {/* Visibility Filter */}
          <select
            value={selectedVisibility}
            onChange={(e) => {
              setSelectedVisibility(e.target.value);
              setPage(1);
            }}
            className="h-[38px] w-40 px-3.5 border border-[#e4e4df] bg-white rounded-[6px] text-[#4a4a4a] text-[13px] focus:outline-none focus:border-[#2d4a23] cursor-pointer"
          >
            <option value="">Shared: All</option>
            <option value="public">Shared: Public</option>
            <option value="private">Shared: Private</option>
          </select>

          {/* Search Input */}
          <div className="relative w-full sm:max-w-xs">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search location or user..."
              className="w-full h-[38px] pl-3.5 pr-9 border border-[#e4e4df] bg-white rounded-[6px] text-[#444] text-[13px] placeholder-gray-400 focus:outline-none focus:border-[#2d4a23]"
            />
            <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExportCSV}
          className="h-[38px] px-4 border border-[#e4e4df] bg-white hover:bg-[#f7f7f4] rounded-[6px] text-[#444] text-[13px] inline-flex items-center gap-2 font-normal transition-colors cursor-pointer"
        >
          <span>Export</span>
          <Download className="w-3.5 h-3.5 text-[#666]" />
        </button>
      </section>

      {/* ===================== DIVISION GRID: TABLE (LEFT) + LIVE MAP (RIGHT) ===================== */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: RECENT GPS ACTIVITY TABLE (8 cols on XL) */}
        <div className="xl:col-span-8 flex flex-col space-y-4">
          <section className="bg-white rounded-[14px] p-5 pb-3 border border-[#ececec] shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)]">
            <h3 className="text-[17px] font-bold text-[#1f1f1f] mb-3">Recent GPS/ Tagging Activity</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-[#ececec]">
                    <th className="py-3.5 px-3 font-semibold text-[#111111] text-[13px]">User Name</th>
                    <th className="py-3.5 px-3 font-semibold text-[#111111] text-[13px]">Tagged Location</th>
                    <th className="py-3.5 px-3 font-semibold text-[#111111] text-[13px]">State</th>
                    <th className="py-3.5 px-3 font-semibold text-[#111111] text-[13px]">Tag Type</th>
                    <th className="py-3.5 px-3 font-semibold text-[#111111] text-[13px]">Date</th>
                    <th className="py-3.5 px-3 font-semibold text-[#111111] text-[13px]">Shared Public?</th>
                    <th className="py-3.5 px-3 text-right font-semibold text-[#111111] text-[13px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f1ed] text-[13px]">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-[#7D848D]">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Loader2 className="w-6 h-6 animate-spin text-[#2d4a23]" />
                          <span className="text-[13px] font-medium text-[#7D848D]">Loading GPS activity...</span>
                        </div>
                      </td>
                    </tr>
                  ) : mapPins.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-[#7D848D]">
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <AlertCircle className="w-8 h-8 text-gray-300" />
                          <p className="text-[13px] font-semibold text-gray-700">No activity matches your filters.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    mapPins.map((pin, index) => {
                      const userEmail = typeof pin.user === "object" && pin.user !== null
                        ? (pin.user.email || pin.user.display_name || "Anonymous User")
                        : typeof pin.user === "string" ? pin.user : "Anonymous User";
                      const userInitial = userEmail.charAt(0).toUpperCase();
                      const isPublic = String(pin.visibility || "").toLowerCase() === "public";
                      const dateStr = pin.created_at
                        ? new Date(pin.created_at).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })
                        : "—";
                      const latStr = typeof pin.latitude === "number" ? pin.latitude.toFixed(4) : String(pin.latitude || "");
                      const lngStr = typeof pin.longitude === "number" ? pin.longitude.toFixed(4) : String(pin.longitude || "");
                      const locTitle = String(pin.location_name || pin.title || pin.loc || "Tagged Location");
                      
                      const stateDisplay = typeof pin.state === "object" && pin.state !== null
                        ? (pin.state.state_name || pin.state.state_code || "—")
                        : typeof pin.state_name === "string"
                        ? pin.state_name
                        : (typeof pin.state === "string" ? pin.state : "—");

                      const tagTypeDisplay = typeof pin.tag_type === "object" && pin.tag_type !== null
                        ? (pin.tag_type.name || "General")
                        : typeof pin.type === "object" && pin.type !== null
                        ? (pin.type.name || "General")
                        : (typeof pin.tag_type === "string" ? pin.tag_type : typeof pin.type === "string" ? pin.type : (Array.isArray(pin.tags) && pin.tags[0]?.name ? pin.tags[0].name : "General"));

                      return (
                        <tr key={pin.id || index} className="hover:bg-[#fbfbf8] transition-colors">
                          {/* User Name */}
                          <td className="py-3.5 px-3 align-middle">
                            <div className="flex items-center gap-2.5 text-[#111111] font-medium">
                              <div className="w-[30px] h-[30px] rounded-full bg-[#f1f1ed] text-[#4a4a4a] font-semibold flex items-center justify-center text-xs flex-shrink-0">
                                {userInitial}
                              </div>
                              <span className="truncate max-w-[130px]">{userEmail}</span>
                            </div>
                          </td>

                          {/* Tagged Location */}
                          <td className="py-3.5 px-3 align-middle">
                            <div className="text-[#1f1f1f] font-semibold text-[13px] truncate max-w-[150px]">
                              {locTitle}
                            </div>
                            <div className="text-[#9a9a96] text-[11.5px] mt-0.5 font-mono">
                              {latStr}, {lngStr}
                            </div>
                          </td>

                          {/* State (Plain Text matching HTML) */}
                          <td className="py-3.5 px-3 text-[#7D848D] align-middle whitespace-nowrap">
                            {stateDisplay}
                          </td>

                          {/* Tag Type */}
                          <td className="py-3.5 px-3 text-[#7D848D] align-middle whitespace-nowrap">
                            {tagTypeDisplay}
                          </td>

                          {/* Date */}
                          <td className="py-3.5 px-3 text-[#7D848D] align-middle whitespace-nowrap">
                            {dateStr}
                          </td>

                          {/* Shared Public */}
                          <td className="py-3.5 px-3 align-middle whitespace-nowrap">
                            <span
                              className={`inline-block px-3.5 py-1 rounded-[6px] text-[11.5px] font-medium border ${
                                isPublic
                                  ? "bg-[#e8f5ec] text-[#34A853] border-[#b8e0c2]"
                                  : "bg-[#fdecec] text-[#e03131] border-[#f3c0c0]"
                              }`}
                            >
                              {isPublic ? "Yes" : "No"}
                            </span>
                          </td>

                          {/* Actions (HTML row-actions) */}
                          <td className="py-3.5 px-3 text-right align-middle whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              {/* View */}
                              <button
                                onClick={() => handleViewPin(pin)}
                                title="View on map"
                                className="w-[30px] h-[30px] border border-[#e2e2dc] rounded-[7px] bg-white text-[#7D848D] hover:bg-[#f7f7f2] hover:text-[#1f1f1f] hover:border-[#d4d4cd] inline-flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Share */}
                              <button
                                onClick={() => {
                                  toast.info(`Sharing pin: ${locTitle}`);
                                }}
                                title="Share"
                                className="w-[30px] h-[30px] border border-[#e2e2dc] rounded-[7px] bg-white text-[#7D848D] hover:bg-[#f7f7f2] hover:text-[#1f1f1f] hover:border-[#d4d4cd] inline-flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </button>

                              {/* More */}
                              <button
                                onClick={() => handleViewPin(pin)}
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

          {/* Table Footer & Numbered Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-[12.5px] text-[#888]">
            <div>
              Showing 1 to {mapPins.length} of {totalItems || mapPins.length} pins
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
                    <span key={idx} className="min-w-[28px] h-7 flex items-center justify-center text-[#888]">
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
        </div>

        {/* RIGHT COLUMN: LIVE MAP PANEL (4 cols on XL) */}
        <div className="xl:col-span-4 h-[560px] rounded-[14px] overflow-hidden border border-[#ececec] shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)] bg-white">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d44196.236392315026!2d-93.81033787191589!3d46.185289524094266!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x52b157a8f77c8e1f%3A0xfbe655e10ff018bc!2sVineland%2C%20MN%2056359%2C%20USA!5e0!3m2!1sen!2sin!4v1781021191340!5m2!1sen!2sin"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="GPS Activity Map View"
          />
        </div>
      </div>

      {/* ===================== VIEW MAP PIN DETAILS MODAL ===================== */}
      {viewModalOpen && selectedPin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 p-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0E3E27] flex items-center justify-center font-bold text-lg">
                  <MapPinIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {selectedPin.location_name || selectedPin.title || selectedPin.loc || "Map Pin Details"}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Created by {selectedPin.user?.email || "User"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            {detailsLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#0E3E27]" />
                <span className="text-xs text-gray-500 font-medium">Loading pin details...</span>
              </div>
            ) : (
              <div className="py-5 space-y-5 text-xs">
                {/* Coordinates Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                      Latitude
                    </span>
                    <div className="font-mono text-xs font-semibold bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-center text-gray-800">
                      {selectedPin.latitude}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                      Longitude
                    </span>
                    <div className="font-mono text-xs font-semibold bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-center text-gray-800">
                      {selectedPin.longitude}
                    </div>
                  </div>
                </div>

                {/* Visibility & Created At */}
                <div className="grid grid-cols-2 gap-3 p-3.5 bg-gray-50/70 rounded-xl border border-gray-100">
                  <div>
                    <span className="text-[11px] font-medium text-gray-400 block mb-1 flex items-center gap-1">
                      {String(selectedPin.visibility).toLowerCase() === "public" ? (
                        <Globe className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-gray-500" />
                      )}
                      Visibility
                    </span>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                        String(selectedPin.visibility).toLowerCase() === "public"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {selectedPin.visibility || "Public"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-gray-400 block mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      Created On
                    </span>
                    <span className="font-semibold text-gray-800">
                      {selectedPin.created_at
                        ? new Date(selectedPin.created_at).toLocaleDateString()
                        : "—"}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                    <AlignLeft className="w-3.5 h-3.5" /> Description
                  </span>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-gray-700 leading-relaxed min-h-[60px]">
                    {selectedPin.description || <span className="text-gray-400 italic">No description provided for this GPS tag.</span>}
                  </div>
                </div>

                {/* Tags */}
                {selectedPin.tags && Array.isArray(selectedPin.tags) && selectedPin.tags.length > 0 && (
                  <div>
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" /> Assigned Tags
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedPin.tags.map((tag: any, tIdx: number) => {
                        const tagName = typeof tag === "object" && tag !== null ? (tag.name || tag.title || `Tag ${tIdx + 1}`) : String(tag);
                        return (
                          <span
                            key={tag.id || tIdx}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 text-[#0E3E27] font-semibold text-[11px] border border-emerald-100"
                          >
                            {tagName}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Modal Footer */}
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
    </div>
  );
}
