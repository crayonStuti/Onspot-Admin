"use client";

import React, { useState, useEffect } from "react";
import { X, Edit2, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getUserById, updateUserProfile, UserItem } from "@/lib/api";
import { StateItem } from "./AddUserModal";

interface PreferenceRow {
  key: string;
  value: string;
}

interface EditUserModalProps {
  isOpen: boolean;
  userToEdit: UserItem | null;
  onClose: () => void;
  onSuccess: () => void;
  states: StateItem[];
  loadingStates: boolean;
}

export function EditUserModal({
  isOpen,
  userToEdit,
  onClose,
  onSuccess,
  states,
  loadingStates,
}: EditUserModalProps) {
  const [editFetching, setEditFetching] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [preferenceRows, setPreferenceRows] = useState<PreferenceRow[]>([{ key: "", value: "" }]);

  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    display_name: "",
    phone: "",
    street_address: "",
    street_address_2: "",
    city: "",
    state: "",
    zipcode: "",
    is_hunter: false,
    is_fisherman: false,
    current_tier: "free",
    status: "active",
    social_channels: {
      instagram: "",
      facebook: "",
      twitter: "",
    },
  });

  useEffect(() => {
    if (!isOpen || !userToEdit) return;

    const loadUserData = async () => {
      setEditFetching(true);
      setProfilePicture(null);
      setPreviewUrl(null);
      setPreferenceRows([{ key: "", value: "" }]);

      try {
        const userRes = await getUserById(userToEdit.id);
        const fullUser = userRes?.user || userRes?.data?.user || userRes?.data || userRes;

        if (fullUser) {
          const profile = fullUser.profile || {};
          const social = profile.social_channels || {};
          const prefs = profile.preferences || {};

          setEditForm({
            first_name: fullUser.first_name || userToEdit.first_name || "",
            last_name: fullUser.last_name || userToEdit.last_name || "",
            display_name: fullUser.display_name || userToEdit.display_name || "",
            phone: profile.phone || userToEdit.phone || "",
            street_address: profile.street_address || "",
            street_address_2: profile.street_address_2 || "",
            city: profile.city || "",
            state: profile.state || "",
            zipcode: profile.zipcode || "",
            is_hunter: profile.is_hunter === true || profile.is_hunter === "true",
            is_fisherman: profile.is_fisherman === true || profile.is_fisherman === "true",
            current_tier: profile.current_tier || "free",
            status: fullUser.status || userToEdit.status || "active",
            social_channels: {
              instagram: social.instagram || "",
              facebook: social.facebook || "",
              twitter: social.twitter || "",
            },
          });

          const initialRows = Object.entries(prefs).map(([k, v]) => {
            const formattedKey = k
              .split("_")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ");
            return { key: formattedKey, value: String(v) };
          });
          setPreferenceRows(initialRows.length > 0 ? initialRows : [{ key: "", value: "" }]);

          if (profile.profile_picture) {
            setPreviewUrl(profile.profile_picture);
          }
        }
      } catch (err: any) {
        console.error("Failed to load user profile for editing:", err);
        toast.error(err?.message || "Failed to load user profile");
      } finally {
        setEditFetching(false);
      }
    };

    loadUserData();
  }, [isOpen, userToEdit]);

  if (!isOpen || !userToEdit) return null;

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit) return;

    setEditSaving(true);
    try {
      const submitData = new FormData();
      submitData.append("first_name", editForm.first_name);
      submitData.append("last_name", editForm.last_name);
      submitData.append(
        "display_name",
        editForm.display_name || `${editForm.first_name} ${editForm.last_name}`.trim(),
      );
      submitData.append("phone", editForm.phone);
      submitData.append("street_address", editForm.street_address);
      submitData.append("street_address_2", editForm.street_address_2);
      submitData.append("city", editForm.city);
      submitData.append("state", editForm.state);
      submitData.append("zipcode", editForm.zipcode);
      submitData.append("is_hunter", String(editForm.is_hunter));
      submitData.append("is_fisherman", String(editForm.is_fisherman));
      submitData.append("current_tier", editForm.current_tier);
      submitData.append("status", editForm.status);
      submitData.append(
        "social_channels[instagram]",
        editForm.social_channels.instagram,
      );
      submitData.append(
        "social_channels[facebook]",
        editForm.social_channels.facebook,
      );
      submitData.append(
        "social_channels[twitter]",
        editForm.social_channels.twitter,
      );

      preferenceRows.forEach((row) => {
        if (row.key.trim()) {
          const sanitizedKey = row.key
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "_")
            .replace(/[^a-z0-9_]/g, "");
          submitData.append(`preferences[${sanitizedKey}]`, row.value);
        }
      });

      if (profilePicture) {
        submitData.append("profile_picture", profilePicture);
      }

      await updateUserProfile(userToEdit.id, submitData);
      toast.success("User profile updated successfully");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Update user profile error:", err);
      toast.error(err?.message || "Failed to update user profile");
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Edit2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Edit User Profile</h3>
              <p className="text-xs text-gray-500">Update profile information for {userToEdit.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {editFetching ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-[#2d4a23] animate-spin" />
            <p className="text-xs text-gray-500">Loading user profile details...</p>
          </div>
        ) : (
          <form onSubmit={handleSaveEditUser} className="space-y-6 text-xs">
            {/* Profile Picture Section */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
              <h4 className="font-bold text-gray-800 uppercase tracking-wider text-[11px]">Profile Picture</h4>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gray-200 border border-gray-300 overflow-hidden flex items-center justify-center text-gray-500 font-bold text-lg">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Profile preview" className="w-full h-full object-cover" />
                  ) : (
                    <span>{editForm.first_name.charAt(0) || "U"}</span>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 text-xs font-semibold text-gray-700 cursor-pointer inline-block">
                    Change Photo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setProfilePicture(file);
                          setPreviewUrl(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                  <p className="text-[10px] text-gray-400">JPG, PNG or GIF. Max 2MB.</p>
                </div>
              </div>
            </div>

            {/* Contact & Address Section */}
            <div className="space-y-3">
              <h4 className="font-bold text-gray-800 uppercase tracking-wider text-[11px]">Contact & Address</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">First Name</label>
                  <input
                    type="text"
                    value={editForm.first_name}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, first_name: e.target.value }))}
                    className="w-full h-9 px-3 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-[#2d4a23]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Last Name</label>
                  <input
                    type="text"
                    value={editForm.last_name}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, last_name: e.target.value }))}
                    className="w-full h-9 px-3 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-[#2d4a23]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Display Name</label>
                  <input
                    type="text"
                    value={editForm.display_name}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, display_name: e.target.value }))}
                    className="w-full h-9 px-3 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-[#2d4a23]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Phone</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full h-9 px-3 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-[#2d4a23]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full h-9 px-3 rounded-lg border border-gray-200 text-xs bg-white focus:outline-none focus:border-[#2d4a23]"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Current Tier</label>
                  <select
                    value={editForm.current_tier}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, current_tier: e.target.value }))}
                    className="w-full h-9 px-3 rounded-lg border border-gray-200 text-xs bg-white focus:outline-none focus:border-[#2d4a23]"
                  >
                    <option value="free">Free</option>
                    <option value="basic">Basic</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Street Address</label>
                  <input
                    type="text"
                    value={editForm.street_address}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, street_address: e.target.value }))}
                    className="w-full h-9 px-3 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-[#2d4a23]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Street Address 2</label>
                  <input
                    type="text"
                    value={editForm.street_address_2}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, street_address_2: e.target.value }))}
                    className="w-full h-9 px-3 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-[#2d4a23]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">City</label>
                  <input
                    type="text"
                    value={editForm.city}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, city: e.target.value }))}
                    className="w-full h-9 px-3 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-[#2d4a23]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">State</label>
                  <select
                    value={editForm.state}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, state: e.target.value }))}
                    disabled={loadingStates}
                    className="w-full h-9 px-3 rounded-lg border border-gray-200 text-xs bg-white focus:outline-none focus:border-[#2d4a23]"
                  >
                    <option value="">{loadingStates ? "Loading states..." : "Select state"}</option>
                    {states.map((s) => (
                      <option key={s.state_id || s.id} value={s.state_name}>
                        {s.state_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Zipcode</label>
                  <input
                    type="text"
                    value={editForm.zipcode}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, zipcode: e.target.value }))}
                    className="w-full h-9 px-3 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-[#2d4a23]"
                  />
                </div>
              </div>
            </div>

            {/* Interests & Status */}
            <div className="space-y-3">
              <h4 className="font-bold text-gray-800 uppercase tracking-wider text-[11px]">Interests & Status</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer">
                  <div>
                    <span className="font-bold text-gray-800 block">Is Hunter</span>
                    <span className="text-[11px] text-gray-400">User is interested in hunting</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={editForm.is_hunter}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, is_hunter: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 accent-[#2d4a23] cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer">
                  <div>
                    <span className="font-bold text-gray-800 block">Is Fisherman</span>
                    <span className="text-[11px] text-gray-400">User is interested in fishing</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={editForm.is_fisherman}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, is_fisherman: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 accent-[#2d4a23] cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Social Channels */}
            <div className="space-y-3">
              <h4 className="font-bold text-gray-800 uppercase tracking-wider text-[11px]">Social Channels</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Instagram</label>
                  <input
                    type="text"
                    placeholder="URL or handle"
                    value={editForm.social_channels.instagram}
                    onChange={(e) => setEditForm((prev) => ({
                      ...prev,
                      social_channels: { ...prev.social_channels, instagram: e.target.value }
                    }))}
                    className="w-full h-9 px-3 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-[#2d4a23]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Facebook</label>
                  <input
                    type="text"
                    placeholder="URL or handle"
                    value={editForm.social_channels.facebook}
                    onChange={(e) => setEditForm((prev) => ({
                      ...prev,
                      social_channels: { ...prev.social_channels, facebook: e.target.value }
                    }))}
                    className="w-full h-9 px-3 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-[#2d4a23]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Twitter</label>
                  <input
                    type="text"
                    placeholder="@handle"
                    value={editForm.social_channels.twitter}
                    onChange={(e) => setEditForm((prev) => ({
                      ...prev,
                      social_channels: { ...prev.social_channels, twitter: e.target.value }
                    }))}
                    className="w-full h-9 px-3 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-[#2d4a23]"
                  />
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-gray-800 uppercase tracking-wider text-[11px]">Preferences</h4>
                <button
                  type="button"
                  onClick={() => setPreferenceRows((prev) => [...prev, { key: "", value: "" }])}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#2d4a23] text-xs font-semibold transition-colors cursor-pointer"
                >
                  + Add Row
                </button>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                    <tr>
                      <th className="p-2.5">Key</th>
                      <th className="p-2.5">Value</th>
                      <th className="p-2.5 w-10 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {preferenceRows.map((row, idx) => (
                      <tr key={idx}>
                        <td className="p-2">
                          <input
                            type="text"
                            placeholder="e.g. Dark Mode"
                            value={row.key}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPreferenceRows((prev) => prev.map((r, i) => i === idx ? { ...r, key: val } : r));
                            }}
                            className="w-full h-8 px-2.5 rounded-md border border-gray-200 focus:outline-none focus:border-[#2d4a23]"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            placeholder="Value"
                            value={row.value}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPreferenceRows((prev) => prev.map((r, i) => i === idx ? { ...r, value: val } : r));
                            }}
                            className="w-full h-8 px-2.5 rounded-md border border-gray-200 focus:outline-none focus:border-[#2d4a23]"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setPreferenceRows((prev) => {
                                const filtered = prev.filter((_, i) => i !== idx);
                                return filtered.length > 0 ? filtered : [{ key: "", value: "" }];
                              });
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 rounded cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editSaving}
                className="px-5 py-2 rounded-xl bg-[#2d4a23] hover:bg-[#233a1b] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                {editSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
