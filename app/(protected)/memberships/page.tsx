"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Eye,
  Edit2,
  Trash2,
  MoreVertical,
  Loader2,
  AlertCircle,
  X,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import {
  getMemberships,
  getMembershipById,
  updateMembership,
  deleteMembership,
  API_URL,
} from "@/lib/api";

interface MembershipItem {
  id: string;
  name: string;
  description?: string;
  feature?: any;
  price_usd?: string | number;
  duration_days?: number;
  totalUsers?: string | number;
  created_at?: string;
  updated_at?: string;
  image?: string;
}

export default function MembershipsPage() {
  const [memberships, setMemberships] = useState<MembershipItem[]>([]);
  const [loading, setLoading] = useState(true);

  // View Details Modal State
  const [viewModal, setViewModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<MembershipItem | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  // Edit Plan Modal State
  const [editModal, setEditModal] = useState(false);
  const [planToEdit, setPlanToEdit] = useState<MembershipItem | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    price_usd: "",
    duration_days: "",
  });
  const [editFeatures, setEditFeatures] = useState<Record<string, any>>({
    front_end_pages: true,
    license_wallet: "3",
    gps_mapping_basic: true,
    extended_mapping_friends: "3",
    dnr_library_access: true,
    post_tagging: "unlimited",
    social_media_channels: "unlimited",
    kids_included: 1,
    ads_displayed: "optional",
    license_expiry_alerts: true,
    location_setting: "optional",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Delete Confirmation State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<MembershipItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch Memberships List
  const fetchMembershipsList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMemberships(1, 100);
      let list: MembershipItem[] = [];

      if (res && res.data && Array.isArray(res.data)) {
        list = res.data;
      } else if (res && res.data && Array.isArray(res.data.memberships)) {
        list = res.data.memberships;
      } else if (Array.isArray(res)) {
        list = res;
      } else if (res && res.memberships && Array.isArray(res.memberships)) {
        list = res.memberships;
      }

      setMemberships(list);
    } catch (err: any) {
      console.error("Fetch memberships error:", err);
      toast.error(err?.message || "Failed to load membership plans");
      setMemberships([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembershipsList();
  }, [fetchMembershipsList]);

  // View Plan Details
  const handleViewPlan = async (plan: MembershipItem) => {
    setSelectedPlan(plan);
    setViewModal(true);
    setViewLoading(true);

    try {
      const res = await getMembershipById(plan.id);
      const data = res.membership || res.data || res;
      setSelectedPlan(data);
    } catch (err: any) {
      console.warn("Error fetching membership details:", err);
    } finally {
      setViewLoading(false);
    }
  };

  // Open Edit Plan Modal
  const handleOpenEdit = async (plan: MembershipItem) => {
    setPlanToEdit(plan);
    setEditForm({
      name: plan.name || "",
      description: plan.description || "",
      price_usd: String(plan.price_usd ?? ""),
      duration_days: String(plan.duration_days ?? ""),
    });
    setImageFile(null);
    setImagePreview(plan.image ? (plan.image.startsWith("http") ? plan.image : `${API_URL}${plan.image}`) : null);

    let parsedFeatures = {
      front_end_pages: true,
      license_wallet: "3",
      gps_mapping_basic: true,
      extended_mapping_friends: "3",
      dnr_library_access: true,
      post_tagging: "unlimited",
      social_media_channels: "unlimited",
      kids_included: 1,
      ads_displayed: "optional",
      license_expiry_alerts: true,
      location_setting: "optional",
    };

    if (plan.feature) {
      try {
        const parsed = typeof plan.feature === "string" ? JSON.parse(plan.feature) : plan.feature;
        parsedFeatures = { ...parsedFeatures, ...parsed };
      } catch (e) {
        console.warn("Failed to parse plan features:", e);
      }
    }

    setEditFeatures(parsedFeatures);
    setEditModal(true);
  };

  // Save Edit Plan
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planToEdit) return;

    if (!editForm.name.trim()) {
      toast.error("Plan Name is required");
      return;
    }
    if (editForm.price_usd === "" || editForm.price_usd === null) {
      toast.error("Price is required");
      return;
    }

    setEditSaving(true);
    try {
      const payload = new FormData();
      payload.append("name", editForm.name.trim());
      payload.append("description", editForm.description || "");
      payload.append("price_usd", editForm.price_usd);
      payload.append("duration_days", editForm.duration_days || "30");

      Object.entries(editFeatures).forEach(([key, value]) => {
        payload.append(`feature[${key}]`, String(value));
      });

      if (imageFile) {
        payload.append("image", imageFile);
      }

      await updateMembership(planToEdit.id, payload);
      toast.success("Membership plan updated successfully");
      setEditModal(false);
      setPlanToEdit(null);
      fetchMembershipsList();
    } catch (err: any) {
      console.error("Update membership error:", err);
      toast.error(err?.message || "Failed to update membership plan");
    } finally {
      setEditSaving(false);
    }
  };

  // Delete Plan Prompt
  const handleDeletePrompt = (plan: MembershipItem) => {
    setPlanToDelete(plan);
    setDeleteConfirmOpen(true);
  };

  // Confirm Delete Plan
  const handleConfirmDelete = async () => {
    if (!planToDelete) return;
    setDeleting(true);

    try {
      await deleteMembership(planToDelete.id);
      toast.success(`Plan "${planToDelete.name}" deleted successfully`);
      setDeleteConfirmOpen(false);
      setPlanToDelete(null);
      fetchMembershipsList();
    } catch (err: any) {
      console.error("Delete membership error:", err);
      toast.error(err?.message || "Failed to delete membership plan");
    } finally {
      setDeleting(false);
    }
  };

  // Parse feature list helper
  const parsePlanFeatures = (featureData: any): Record<string, any> => {
    if (!featureData) return {};
    try {
      return typeof featureData === "string" ? JSON.parse(featureData) : featureData;
    } catch {
      return {};
    }
  };

  return (
    <div className="space-y-6">
      {/* ===================== MEMBERSHIP PLANS CARD (1:1 HTML) ===================== */}
      <section className="bg-white rounded-[14px] p-6 sm:p-7 shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)] border border-[#ececec]">
        {/* Card Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <h2 className="text-[22px] font-bold text-[#1f1f1f] tracking-tight">Membership Plans</h2>
        </div>

        {/* Plans Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#ececec]">
                <th className="py-3.5 px-3 text-black font-medium text-[13.5px]">Plan Name</th>
                <th className="py-3.5 px-3 text-black font-medium text-[13.5px]">Price</th>
                <th className="py-3.5 px-3 text-black font-medium text-[13.5px]">Featured Included</th>
                <th className="py-3.5 px-3 text-black font-medium text-[13.5px]">Subscriber</th>
                <th className="py-3.5 px-3 text-right text-black font-medium text-[13.5px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f1ed] text-[13.5px]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-[#7D848D]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-[#1f3d2a]" />
                      <span className="text-[13px] font-medium text-[#7D848D]">Loading membership plans...</span>
                    </div>
                  </td>
                </tr>
              ) : memberships.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-[#7D848D]">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <AlertCircle className="w-8 h-8 text-gray-300" />
                      <p className="text-[13.5px] font-semibold text-[#1f1f1f]">No membership plans found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                memberships.map((plan) => {
                  const features = parsePlanFeatures(plan.feature);
                  const featureEntries = Object.entries(features);
                  const priceNum = Number(plan.price_usd || 0);

                  return (
                    <tr key={plan.id} className="hover:bg-[#fbfbf8] transition-colors">
                      {/* Plan Name */}
                      <td className="py-5 px-3 align-top">
                        <div className="flex items-start gap-3.5">
                          {/* Plan Icon */}
                          <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                            {plan.image ? (
                              <img
                                src={plan.image.startsWith("http") ? plan.image : `${API_URL}${plan.image}`}
                                alt={plan.name}
                                className="w-7 h-7 object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <img src="/images/member_leaf.png" alt="" className="w-7 h-7 object-contain" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2.5 mb-1">
                              <span className="text-[16px] font-semibold text-[#1f1f1f]">{plan.name}</span>
                              <span className="inline-flex items-center gap-1.5 text-[13px] text-[#34A853] font-medium">
                                <span className="w-[7px] h-[7px] rounded-full bg-[#2f9e44]" />
                                Active
                              </span>
                            </div>
                            <div className="text-[13px] text-[#888] font-normal max-w-xs">
                              {plan.description || "Best for individuals getting started"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-5 px-3 align-top">
                        <div className="text-[18px] font-normal text-[#1f1f1f] mb-1">
                          {priceNum === 0 ? "$0" : `$${priceNum.toFixed(2)}`}
                        </div>
                        <div className="text-[13px] text-[#888]">
                          {plan.duration_days ? (priceNum === 0 ? "Forever" : `${plan.duration_days} Days`) : "Forever"}
                        </div>
                      </td>

                      {/* Features Included */}
                      <td className="py-5 px-3 align-top">
                        {featureEntries.length > 0 ? (
                          <div className="flex flex-col gap-2 max-w-sm">
                            {featureEntries.slice(0, 4).map(([key, val], idx) => (
                              <div key={idx} className="flex items-center gap-2 text-[11px] text-[#888]">
                                <span className="text-[#4a6b3f] flex-shrink-0">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                </span>
                                <span className="capitalize">
                                  {key.replace(/_/g, " ")}
                                  {typeof val !== "boolean" && `: ${String(val)}`}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2 text-[11px] text-[#888]">
                            <div className="flex items-center gap-2">
                              <span className="text-[#4a6b3f]">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </span>
                              Access to basic resources
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[#4a6b3f]">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </span>
                              Community posts access
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Subscriber */}
                      <td className="py-5 px-3 align-top">
                        <div className="text-[18px] font-normal text-[#1f1f1f] mb-1">
                          {plan.totalUsers !== undefined ? Number(plan.totalUsers).toLocaleString() : "0"}
                        </div>
                        <div className="text-[13px] text-[#888]">Users Enrolled</div>
                      </td>

                      {/* Actions */}
                      <td className="py-5 px-3 text-right align-top">
                        <div className="inline-flex items-center gap-2 justify-end">
                          {/* View */}
                          <button
                            onClick={() => handleViewPlan(plan)}
                            title="View Details"
                            className="w-[30px] h-[30px] border border-[#e2e2dc] rounded-[7px] bg-white text-[#7D848D] hover:bg-[#f7f7f2] hover:text-[#1f1f1f] hover:border-[#d4d4cd] inline-flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEdit(plan)}
                            title="Edit Plan"
                            className="w-[30px] h-[30px] border border-[#e2e2dc] rounded-[7px] bg-white text-[#7D848D] hover:bg-[#f7f7f2] hover:text-[#1f1f1f] hover:border-[#d4d4cd] inline-flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeletePrompt(plan)}
                            title="Delete Plan"
                            className="w-[30px] h-[30px] border border-[#e2e2dc] rounded-[7px] bg-white text-[#7D848D] hover:bg-[#f7f7f2] hover:text-red-600 hover:border-red-200 inline-flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          {/* More */}
                          <button
                            onClick={() => handleViewPlan(plan)}
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

      {/* ===================== VIEW DETAILS MODAL ===================== */}
      {viewModal && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0E3E27] flex items-center justify-center font-bold text-lg">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedPlan.name}</h3>
                  <p className="text-xs text-gray-500">Tier Details & Configured Features</p>
                </div>
              </div>
              <button
                onClick={() => setViewModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-5 space-y-6">
              {/* Description */}
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Description
                </span>
                <p className="text-xs text-gray-700 leading-relaxed">
                  {selectedPlan.description || "No description provided."}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-gray-50/70 border border-gray-100 text-xs">
                <div>
                  <span className="text-gray-400 block font-medium">Price</span>
                  <span className="font-bold text-sm text-[#0E3E27]">
                    {Number(selectedPlan.price_usd || 0) === 0 ? "Free" : `$${selectedPlan.price_usd}`}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">Duration</span>
                  <span className="font-bold text-sm text-gray-800">
                    {selectedPlan.duration_days ? `${selectedPlan.duration_days} Days` : "Forever"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">Total Users</span>
                  <span className="font-bold text-sm text-indigo-700">
                    {selectedPlan.totalUsers || 0}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">Created On</span>
                  <span className="font-bold text-xs text-gray-700">
                    {selectedPlan.created_at ? new Date(selectedPlan.created_at).toLocaleDateString() : "—"}
                  </span>
                </div>
              </div>

              {/* Features List */}
              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
                  Privileges & Included Features
                </h4>
                {(() => {
                  const feats = parsePlanFeatures(selectedPlan.feature);
                  const entries = Object.entries(feats);

                  if (entries.length === 0) {
                    return (
                      <p className="text-xs text-gray-400 italic">No custom features set for this tier.</p>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {entries.map(([key, val], idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs"
                        >
                          <span className="font-medium text-gray-700 capitalize">
                            {key.replace(/_/g, " ")}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              val === true
                                ? "bg-emerald-100 text-emerald-800"
                                : val === false
                                ? "bg-red-100 text-red-700"
                                : "bg-blue-50 text-blue-700"
                            }`}
                          >
                            {typeof val === "boolean" ? (val ? "YES" : "NO") : String(val)}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
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
                  handleOpenEdit(selectedPlan);
                }}
                className="px-5 py-2 rounded-xl bg-[#0E3E27] hover:bg-[#092c1b] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== EDIT PLAN MODAL ===================== */}
      {editModal && planToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">Edit Membership Plan</h3>
                <p className="text-xs text-gray-500 mt-0.5">Update pricing, description, and features</p>
              </div>
              <button
                onClick={() => setEditModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="py-4 space-y-4">
              {/* Plan Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Plan Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:border-[#0E3E27]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full p-3 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:border-[#0E3E27]"
                />
              </div>

              {/* Price & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Price (USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editForm.price_usd}
                    onChange={(e) => setEditForm({ ...editForm, price_usd: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:border-[#0E3E27]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    min="1"
                    value={editForm.duration_days}
                    onChange={(e) => setEditForm({ ...editForm, duration_days: e.target.value })}
                    placeholder="30"
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:border-[#0E3E27]"
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Plan Icon / Image</label>
                <div className="flex items-center gap-3">
                  {imagePreview && (
                    <div className="w-12 h-12 rounded-xl border border-gray-200 overflow-hidden p-1 flex-shrink-0 bg-gray-50">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setImageFile(file);
                      if (file) setImagePreview(URL.createObjectURL(file));
                    }}
                    className="text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
                  />
                </div>
              </div>

              {/* Features Editor */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Plan Feature Toggles
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto p-3 bg-gray-50/70 rounded-xl border border-gray-200 text-xs">
                  {Object.entries(editFeatures).map(([k, val]) => (
                    <div key={k} className="flex items-center justify-between py-1">
                      <span className="capitalize font-medium text-gray-700">{k.replace(/_/g, " ")}</span>
                      {typeof val === "boolean" ? (
                        <input
                          type="checkbox"
                          checked={val}
                          onChange={(e) => setEditFeatures({ ...editFeatures, [k]: e.target.checked })}
                          className="w-4 h-4 rounded text-[#0E3E27] focus:ring-[#0E3E27] accent-[#0E3E27] cursor-pointer"
                        />
                      ) : (
                        <input
                          type="text"
                          value={String(val)}
                          onChange={(e) => setEditFeatures({ ...editFeatures, [k]: e.target.value })}
                          className="h-7 w-28 px-2 rounded-lg border border-gray-200 text-xs text-gray-800 bg-white"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="px-5 py-2 rounded-xl bg-[#0E3E27] hover:bg-[#092c1b] text-white text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {editSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Plan...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== DELETE CONFIRMATION DIALOG ===================== */}
      {deleteConfirmOpen && planToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Delete Membership Plan</h3>
                <p className="text-xs text-gray-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed mb-6">
              Are you sure you want to permanently delete the{" "}
              <strong className="text-gray-900">"{planToDelete.name}"</strong> membership tier? Users
              currently assigned to this plan might lose associated privileges.
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
                  <span>Yes, Delete Plan</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
