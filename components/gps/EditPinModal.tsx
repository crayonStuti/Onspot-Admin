"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  MapPin,
  Loader2,
  Tag,
  Globe,
  Lock,
  FileText,
  Compass,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { updateMapPin, MapPinItem } from "@/lib/api";
import MapLocationPickerDialog from "./MapLocationPickerDialog";

export interface EditPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  pin: MapPinItem | null;
  availableTagSuggestions?: string[];
}

export default function EditPinModal({
  isOpen,
  onClose,
  onSuccess,
  pin,
  availableTagSuggestions = [],
}: EditPinModalProps) {
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [mapPickerOpen, setMapPickerOpen] = useState(false);

  useEffect(() => {
    if (isOpen && pin) {
      setLatitude(String(pin.latitude ?? ""));
      setLongitude(String(pin.longitude ?? ""));
      setDescription(pin.description || "");
      setVisibility(
        pin.visibility === "private" || pin.is_public === false
          ? "private"
          : "public",
      );

      // Extract existing tags
      const currentTags: string[] = [];
      if (Array.isArray(pin.tags)) {
        pin.tags.forEach((t: any) => {
          const tName = typeof t === "string" ? t : t?.name;
          if (tName && !currentTags.includes(tName)) currentTags.push(tName);
        });
      }
      if (pin.tag_type?.name && !currentTags.includes(pin.tag_type.name)) {
        currentTags.push(pin.tag_type.name);
      }
      setTags(currentTags);
      setNewTagInput("");
    }
  }, [isOpen, pin]);

  if (!isOpen || !pin) return null;

  const handleAddTag = (tagToAdd: string) => {
    const trimmed = tagToAdd.trim();
    if (!trimmed) return;
    if (tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      toast.info(`Tag "${trimmed}" already added.`);
      return;
    }
    setTags([...tags, trimmed]);
    setNewTagInput("");
  };

  const handleRemoveTag = (indexToRemove: number) => {
    setTags(tags.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);

    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      toast.error("Please enter a valid Latitude between -90 and 90.");
      return;
    }

    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      toast.error("Please enter a valid Longitude between -180 and 180.");
      return;
    }

    setSaving(true);
    try {
      await updateMapPin(pin.id, {
        latitude: latNum,
        longitude: lngNum,
        description: description.trim(),
        visibility,
        tags,
      });

      toast.success("GPS pin updated successfully!");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to update pin:", err);
      toast.error(err?.message || "Failed to update GPS pin.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#fbfbf9]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#e8f5ec] text-[#0E3E27] flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Edit GPS Pin
                </h3>
                <p className="text-xs text-gray-500">
                  Update coordinates, description, visibility, and tags.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={saving}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
            {/* Coordinates Section with Map Picker trigger */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-[#0E3E27]" />
                  <span>Coordinates (Latitude & Longitude)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setMapPickerOpen(true)}
                  className="text-xs font-medium text-[#0E3E27] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Choose on Map</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-gray-500 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="e.g. 25.7617"
                    className="w-full h-10 px-3 text-xs font-mono bg-white border border-gray-200 rounded-lg focus:border-[#0E3E27] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-500 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="e.g. -80.1918"
                    className="w-full h-10 px-3 text-xs font-mono bg-white border border-gray-200 rounded-lg focus:border-[#0E3E27] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#0E3E27]" />
                <span>Description</span>
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description of location, access points, notes..."
                className="w-full p-3 text-xs bg-white border border-gray-200 rounded-lg focus:border-[#0E3E27] focus:outline-none resize-none"
              />
            </div>

            {/* Visibility */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                {visibility === "public" ? (
                  <Globe className="w-3.5 h-3.5 text-[#0E3E27]" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-[#0E3E27]" />
                )}
                <span>Visibility</span>
              </label>
              <select
                value={visibility}
                onChange={(e) =>
                  setVisibility(e.target.value as "public" | "private")
                }
                className="w-full h-10 px-3 text-xs bg-white border border-gray-200 rounded-lg focus:border-[#0E3E27] focus:outline-none cursor-pointer"
              >
                <option value="public">Public (Visible to community)</option>
                <option value="private">Private (Only owner / admins)</option>
              </select>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#0E3E27]" />
                <span>Tags</span>
              </label>

              {/* Tag Chips */}
              <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-gray-50 border border-gray-200 rounded-lg">
                {tags.length === 0 ? (
                  <span className="text-xs text-gray-400 italic">
                    No tags added yet.
                  </span>
                ) : (
                  tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-white text-gray-800 border border-gray-200 shadow-xs"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(idx)}
                        className="text-gray-400 hover:text-red-500 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Tag Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag(newTagInput);
                    }
                  }}
                  placeholder="Type tag and press Enter..."
                  className="flex-1 h-9 px-3 text-xs bg-white border border-gray-200 rounded-lg focus:border-[#0E3E27] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleAddTag(newTagInput)}
                  disabled={!newTagInput.trim()}
                  className="h-9 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors disabled:opacity-40 cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>

              {/* Tag Suggestions */}
              {availableTagSuggestions.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 pt-1">
                  <span className="text-[11px] text-gray-400 mr-1">Suggestions:</span>
                  {availableTagSuggestions.slice(0, 6).map((sug) => (
                    <button
                      type="button"
                      key={sug}
                      onClick={() => handleAddTag(sug)}
                      className="text-[11px] text-gray-600 bg-gray-100 hover:bg-emerald-50 hover:text-[#0E3E27] px-2 py-0.5 rounded transition-colors cursor-pointer"
                    >
                      + {sug}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="h-9 px-4 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="h-9 px-5 bg-[#0E3E27] hover:bg-[#155435] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2 shadow-sm disabled:opacity-60"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{saving ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Map Location Picker Dialog */}
      <MapLocationPickerDialog
        isOpen={mapPickerOpen}
        onClose={() => setMapPickerOpen(false)}
        initialLat={parseFloat(latitude) || undefined}
        initialLng={parseFloat(longitude) || undefined}
        onSelectLocation={(selectedLat, selectedLng) => {
          setLatitude(String(selectedLat));
          setLongitude(String(selectedLng));
        }}
      />
    </>
  );
}
