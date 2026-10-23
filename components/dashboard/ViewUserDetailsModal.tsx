"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  X,
  Loader2,
  FileBadge,
  MapPin,
  ExternalLink,
} from "lucide-react";
import {
  API_URL,
  getUserById,
  getUserBookmarks,
  getUserMapPins,
} from "@/lib/api";

interface ViewUserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any | null;
}

export default function ViewUserDetailsModal({
  isOpen,
  onClose,
  user,
}: ViewUserDetailsModalProps) {
  const [userDetails, setUserDetails] = useState<any | null>(user);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [userLicenses, setUserLicenses] = useState<any[]>([]);
  const [userMapPins, setUserMapPins] = useState<any[]>([]);
  const [previewLicenseImage, setPreviewLicenseImage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !user) {
      setUserDetails(null);
      setUserLicenses([]);
      setUserMapPins([]);
      return;
    }

    // Set row data immediately so modal renders with zero delay
    setUserDetails(user);
    setDetailsLoading(true);
    setUserLicenses([]);
    setUserMapPins([]);

    let isMounted = true;

    async function loadFullDetails() {
      try {
        const [fullProfileRes, bookmarksRes, mapPinsRes] =
          await Promise.allSettled([
            getUserById(user.id),
            getUserBookmarks(user.email),
            getUserMapPins(user.email, 10),
          ]);

        if (!isMounted) return;

        if (fullProfileRes.status === "fulfilled" && fullProfileRes.value) {
          const payload = fullProfileRes.value;
          const fullUser =
            payload.data?.user || payload.user || payload.data || payload;

          if (fullUser && typeof fullUser === "object") {
            setUserDetails((prev: any) => ({
              ...prev,
              ...fullUser,
              profile: {
                ...(prev?.profile || {}),
                ...(fullUser.profile || {}),
              },
            }));

            if (Array.isArray(fullUser.licenses)) {
              setUserLicenses(fullUser.licenses);
            } else if (Array.isArray(fullUser.profile?.licenses)) {
              setUserLicenses(fullUser.profile.licenses);
            }
          }
        }

        if (mapPinsRes.status === "fulfilled" && mapPinsRes.value) {
          const mp = mapPinsRes.value.data || mapPinsRes.value || [];
          setUserMapPins(Array.isArray(mp) ? mp : []);
        }
      } catch (err) {
        console.error("Failed to load user details in modal:", err);
      } finally {
        if (isMounted) {
          setDetailsLoading(false);
        }
      }
    }

    loadFullDetails();

    return () => {
      isMounted = false;
    };
  }, [isOpen, user]);

  if (!isOpen || !userDetails) return null;

  // Helper to format clean display name
  const getUserDisplayName = (u: any) => {
    if (!u) return "User";
    const fn = u.first_name && u.first_name !== "null" ? u.first_name : "";
    const ln = u.last_name && u.last_name !== "null" ? u.last_name : "";
    const name = `${fn} ${ln}`.trim();
    return name || u.display_name || u.email?.split("@")[0] || "User";
  };

  // Helper to resolve profile image URL
  const getProfileImageUrl = (url?: string | null) => {
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

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl w-full max-w-2xl max-h-[88vh] overflow-y-auto shadow-2xl border border-gray-100 p-5 sm:p-6 space-y-5"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#2d4a23] font-bold text-lg flex items-center justify-center flex-shrink-0 border border-emerald-100 overflow-hidden relative">
                {userDetails.profile?.profile_picture ? (
                  <Image
                    src={getProfileImageUrl(userDetails.profile.profile_picture)}
                    alt="Avatar"
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  getUserDisplayName(userDetails).charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-gray-900 truncate">
                  {getUserDisplayName(userDetails)}
                </h3>
                <p className="text-xs text-gray-500 truncate">
                  {userDetails.email}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 cursor-pointer flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Profile Grid */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-gray-50/70 p-4 rounded-xl border border-gray-100">
              <div>
                <span className="text-gray-400 block font-medium">Role</span>
                <span className="font-semibold text-gray-800 capitalize">
                  {String(
                    userDetails?.role || userDetails?.user?.role || "user",
                  )}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">Status</span>
                <span className="font-semibold text-emerald-700 capitalize">
                  {String(userDetails.status || "active")}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">
                  Membership Tier
                </span>
                <span className="font-semibold text-indigo-700">
                  {String(
                    userDetails.profile?.current_tier ||
                      (typeof userDetails.profile?.membership === "object"
                        ? userDetails.profile?.membership?.name
                        : userDetails.profile?.membership) ||
                      "Free",
                  )}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">Phone</span>
                <span className="font-semibold text-gray-800">
                  {String(
                    userDetails.profile?.phone || userDetails.phone || "Not provided",
                  )}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">State</span>
                <span className="font-semibold text-gray-800">
                  {String(
                    (typeof userDetails.profile?.state === "object"
                      ? userDetails.profile?.state?.state_name
                      : userDetails.profile?.state) ||
                      (typeof userDetails.state === "object"
                        ? userDetails.state?.state_name
                        : userDetails.state) ||
                      "Not specified",
                  )}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">Joined On</span>
                <span className="font-semibold text-gray-800">
                  {userDetails.created_at
                    ? new Date(userDetails.created_at).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </span>
              </div>
            </div>

            {/* Licenses Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FileBadge className="w-4 h-4 text-[#2d4a23]" />
                  User Licenses ({userLicenses.length})
                </h4>
                {detailsLoading && (
                  <span className="text-[11px] text-gray-400 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Loading fresh details...
                  </span>
                )}
              </div>

              {userLicenses.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {userLicenses.map((lic: any, idx: number) => {
                    const frontImg = lic.card_photo_front_url;
                    const backImg = lic.card_photo_back_url;

                    return (
                      <div
                        key={lic.id || idx}
                        className="p-3 bg-gray-50 border border-gray-200/80 rounded-xl text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-800">
                            {lic.license_type || "State License"}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {lic.status || "Active"}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-gray-600">
                          <div>
                            <span className="text-gray-400 block text-[10px] uppercase">
                              Number
                            </span>
                            <span className="font-mono font-medium">
                              {lic.license_number || "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-[10px] uppercase">
                              Expires
                            </span>
                            <span>
                              {lic.expiration_date
                                ? new Date(
                                    lic.expiration_date,
                                  ).toLocaleDateString("en-GB")
                                : "—"}
                            </span>
                          </div>
                        </div>

                        {/* Card Photo Thumbnails */}
                        {(frontImg || backImg) && (
                          <div className="pt-1 border-t border-gray-100 flex items-center gap-3">
                            {frontImg && (
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewLicenseImage(
                                    getProfileImageUrl(frontImg),
                                  )
                                }
                                className="group flex items-center gap-1.5 text-[11px] text-[#2d4a23] hover:underline cursor-pointer"
                              >
                                <div className="w-8 h-6 relative rounded overflow-hidden border border-gray-200 bg-gray-100">
                                  <Image
                                    src={getProfileImageUrl(frontImg)}
                                    alt="Front"
                                    fill
                                    className="object-cover"
                                    unoptimized
                                  />
                                </div>
                                <span>Front Photo</span>
                              </button>
                            )}

                            {backImg && (
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewLicenseImage(
                                    getProfileImageUrl(backImg),
                                  )
                                }
                                className="group flex items-center gap-1.5 text-[11px] text-[#2d4a23] hover:underline cursor-pointer"
                              >
                                <div className="w-8 h-6 relative rounded overflow-hidden border border-gray-200 bg-gray-100">
                                  <Image
                                    src={getProfileImageUrl(backImg)}
                                    alt="Back"
                                    fill
                                    className="object-cover"
                                    unoptimized
                                  />
                                </div>
                                <span>Back Photo</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-center text-xs text-gray-400">
                  {detailsLoading
                    ? "Loading license information..."
                    : "No licenses recorded for this user."}
                </div>
              )}
            </div>

            {/* Map Pins Section */}
            <div>
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#2d4a23]" />
                Recent GPS Activity ({userMapPins.length})
              </h4>
              {userMapPins.length > 0 ? (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {userMapPins.slice(0, 5).map((pin: any, idx: number) => (
                    <div
                      key={pin.id || idx}
                      className="p-2.5 bg-gray-50 border border-gray-100 rounded-lg text-xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="font-medium text-gray-700 truncate">
                          {pin.title || pin.location_name || `Pin #${pin.id || idx + 1}`}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-400 whitespace-nowrap ml-2">
                        {pin.created_at
                          ? new Date(pin.created_at).toLocaleDateString("en-GB")
                          : ""}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-center text-xs text-gray-400">
                  {detailsLoading
                    ? "Checking map pins..."
                    : "No recent GPS map pins."}
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
            <Link
              href={`/users?search=${encodeURIComponent(userDetails.email || "")}`}
              className="text-xs text-[#2d4a23] hover:underline font-semibold inline-flex items-center gap-1.5"
            >
              <span>Full Management in Users Page</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* License Preview Modal */}
      {previewLicenseImage && (
        <div
          onClick={() => setPreviewLicenseImage(null)}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-4 max-w-xl w-full shadow-2xl relative space-y-3"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="text-sm font-bold text-gray-800">
                License Photo Preview
              </h4>
              <button
                type="button"
                onClick={() => setPreviewLicenseImage(null)}
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative w-full h-80 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center">
              <Image
                src={previewLicenseImage}
                alt="License preview"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
